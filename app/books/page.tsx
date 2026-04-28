import { createClient } from '../../lib/supabase-server'
import RefreshButton from './RefreshButton'
import SearchBox from './SearchBox'
import CatalogResults from './CatalogResults'
import CategoryFilter from './CategoryFilter'
import Navbar from '../components/Navbar'
import { getBookCover } from '../../lib/bookCover' // lib/googleBooks.ts içine yazdığımız fonksiyon
import RateThisButton from './RateThisButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PAGE_SIZE = 100;

// Orijinal kapak renkleri paleti (Fallback olarak kullanılacak)
const coverGradients = [
    "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)",
    "linear-gradient(135deg, #c9a227 0%, #8b7119 100%)",
    "linear-gradient(135deg, #2d6a4f 0%, #1b4030 100%)",
    "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
    "linear-gradient(135deg, #4a90a4 0%, #2d5a68 100%)",
    "linear-gradient(135deg, #6b4c9a 0%, #4a3570 100%)",
    "linear-gradient(135deg, #d4a373 0%, #a67c52 100%)",
    "linear-gradient(135deg, #457b9d 0%, #2d5066 100%)",
    "linear-gradient(135deg, #bc6c25 0%, #8a4f1c 100%)",
    "linear-gradient(135deg, #7f5539 0%, #5c3d29 100%)"
];

export default async function BooksPage(props: { searchParams: Promise<{ q?: string; category?: string; page?: string }> }) {
    const searchParams = await props.searchParams;
    const q = searchParams?.q || '';
    const category = searchParams?.category || '';
    const page = Math.max(1, parseInt(searchParams?.page || '1', 10));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = await createClient();

    // Helper: build an anon client (used for JWT-expired fallback)
    const makeAnonClient = async () => {
        const { createServerClient } = await import('@supabase/ssr');
        return createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return []; }, setAll() { } } }
        );
    };

    // ── 1a. Accurate total count via HEAD request (Content-Range header) ─────────
    //    count:'exact' + head:true sends a HEAD query to PostgREST which returns
    //    the full count WITHOUT fetching rows — immune to row-limit caps.
    const buildCountQuery = (client: any) => {
        let q2 = client.from('books').select('*', { count: 'exact', head: true });
        if (q) q2 = q2.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
        if (category) q2 = q2.eq('genre', category);
        return q2;
    };

    let { count: totalFilteredBooks, error: countError } = await buildCountQuery(supabase);

    if (countError && countError.code === 'PGRST303') {
        const anonSupabase = await makeAnonClient();
        const res = await buildCountQuery(anonSupabase);
        totalFilteredBooks = res.count;
        countError = res.error;
    }
    if (countError) console.error("Sayım hatası:", countError);
    totalFilteredBooks = totalFilteredBooks ?? 0;

    // ── 1b. Genre breakdown for sidebar — fetch all genres in batches of 1000 ────
    //    We only need id+genre (lightweight), and we loop until PostgREST gives us
    //    fewer rows than the batch size, meaning we've consumed everything.
    const fetchAllGenres = async (client: any) => {
        const BATCH = 1000;
        let offset = 0;
        const allGenres: { genre: string | null }[] = [];
        while (true) {
            let bq = client
                .from('books')
                .select('genre')
                .range(offset, offset + BATCH - 1);
            if (q) bq = bq.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
            // For genres we always fetch ALL categories (not just the selected one),
            // so the sidebar shows counts for every genre.
            const { data, error: bErr } = await bq;
            if (bErr || !data || data.length === 0) break;
            allGenres.push(...data);
            if (data.length < BATCH) break;
            offset += BATCH;
        }
        return allGenres;
    };

    let allGenreRows = await fetchAllGenres(supabase);
    // Fallback: if empty and a JWT error is possible, retry anonymously
    if (allGenreRows.length === 0) {
        const anonSupabase = await makeAnonClient();
        allGenreRows = await fetchAllGenres(anonSupabase);
    }

    // ── 2. Sayfalı kitap sorgusu (sadece bu sayfanın kitapları) ─────────────────
    let pageQuery = supabase
        .from('books')
        .select('*')
        .range(from, to);
    if (q) {
        pageQuery = pageQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
    }
    if (category) {
        pageQuery = pageQuery.eq('genre', category);
    }
    let { data: pageBooks, error: pageError } = await pageQuery;

    if (pageError && pageError.code === 'PGRST303') {
        const anonSupabase = await makeAnonClient();
        let fallbackPageQuery = anonSupabase.from('books').select('*').range(from, to);
        if (q) fallbackPageQuery = fallbackPageQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
        if (category) fallbackPageQuery = fallbackPageQuery.eq('genre', category);
        const res = await fallbackPageQuery;
        pageBooks = res.data;
        pageError = res.error;
    }
    if (pageError) console.error("Sayfa sorgu hatası:", pageError);

    // ── 3. Kullanıcı ve değerlendirilen kitaplar ─────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    let userReviewedBookIds = new Set<string>();
    if (user) {
        const { data: userReviews } = await supabase.from('reviews').select('book_id').eq('user_id', user.id);
        if (userReviews) {
            userReviewedBookIds = new Set(userReviews.map(r => String(r.book_id)));
        }
    }

    // ── 4. Kategori haritasını oluştur ───────────────────────────────────────────
    const categoryMap: Record<string, number> = {};
    allGenreRows.forEach((book) => {
        const genre = book.genre?.trim();
        if (genre) {
            categoryMap[genre] = (categoryMap[genre] || 0) + 1;
        }
    });
    const categories = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    // ── 5. Toplam kitap sayısı ve sayfalama ──────────────────────────────────────
    const totalPages = Math.ceil((totalFilteredBooks as number) / PAGE_SIZE);

    // ── 6. Google Books API üzerinden kapakları paralel çek ──────────────────────
    const books = pageBooks ? await Promise.all(pageBooks.map(async (book) => {
        const coverUrl = await getBookCover(book.isbn, book.title, book.author);
        return { ...book, coverUrl };
    })) : [];

    // ── 7. CatalogResults için tüm başlıklar (yalnızca sayfalanmış sonuçlar) ─────
    const dbBookTitles = pageBooks?.map((book) => book.title) || [];

    // ── 8. Sayfalama URL yardımcısı ───────────────────────────────────────────────
    const buildPageUrl = (p: number) => {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (category) params.set('category', category);
        params.set('page', String(p));
        return `/books?${params.toString()}`;
    };

    return (
        <>
            <Navbar />

            <header className="page-header">
                <div className="container">
                    <h1>Browse <span className="highlight">Books</span></h1>
                    <p>Discover, rate, and review books from the IZTECH library collection</p>
                </div>
            </header>

            <main className="books-main">
                <div className="container">
                    <div className="books-layout">

                        <aside className="books-sidebar">
                            <div className="sidebar-section">
                                <h3>🔍 Search</h3>
                                <SearchBox />
                            </div>
                            <div className="sidebar-section">
                                <h3>📖 Book Clubs</h3>
                                <ul className="filter-list">
                                    <li>
                                        <a href="/clubs/bkfk" className="filter-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
                                            <span>BKFK Book Club</span>
                                        </a>
                                    </li>
                                </ul>
                            </div>
                            <CategoryFilter categories={categories} totalBooks={totalFilteredBooks} />
                        </aside>

                        <section className="books-content">
                            <div className="content-header">
                                <p className="results-count">
                                    Showing <strong>{books.length} of {totalFilteredBooks} books</strong>
                                    {totalPages > 1 && (
                                        <span style={{ color: 'var(--color-muted)', fontWeight: 400, marginLeft: '8px' }}>
                                            — Page {page} of {totalPages}
                                        </span>
                                    )}
                                </p>
                                <div className="sort-options">
                                    <label htmlFor="sort-select">Sort by:</label>
                                    <select id="sort-select" className="sort-select">
                                        <option value="title">Title A-Z</option>
                                        <option value="rating">Highest Rated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="books-grid" id="books-grid">
                                {books.map((book, index) => (
                                    <article key={book.id} className="book-card" data-category={book.genre?.toLowerCase()}>

                                        {/* KAPAK ALANI: API'den resim geldiyse bas, gelmediyse gradyan ve yazı göster */}
                                        <div
                                            className="book-cover"
                                            style={{
                                                background: book.coverUrl
                                                    ? `url(${book.coverUrl}) center/cover no-repeat`
                                                    : coverGradients[(from + index) % coverGradients.length]
                                            }}
                                        >
                                            <span className="book-spine"></span>
                                            {!book.coverUrl && <div className="book-title-cover">{book.title}</div>}
                                        </div>

                                        <div className="book-info">
                                            <h3 className="book-title" title={book.title}>{book.title}</h3>
                                            <p className="book-author">{book.author}</p>

                                            <div className="book-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    {/* ISBN ve Yenileme Butonu */}
                                                    <RefreshButton
                                                        bookId={book.id}
                                                        isbn={book.isbn || undefined}
                                                        title={book.title}
                                                        initialTitle={book.title}
                                                    />
                                                </div>
                                                <span className="book-reviews" style={{ fontSize: '0.8rem' }}>📍 {book.shelf_location}</span>
                                            </div>

                                            <div className="book-tags" style={{ marginTop: '12px' }}>
                                                <span className="tag" style={{ background: 'var(--color-sepia)' }}>{book.genre}</span>
                                                {book.tags?.slice(0, 2).map((tag: string) => (
                                                    <span key={tag} className="tag">#{tag}</span>
                                                ))}
                                            </div>

                                            <div className="book-actions mt-4">
                                                <RateThisButton 
                                                    bookId={String(book.id)} 
                                                    bookTitle={book.title} 
                                                    hasExistingReview={userReviewedBookIds.has(String(book.id))} 
                                                    isAuth={!!user} 
                                                />
                                                <a href={`/books/${book.id}`} className="btn btn-secondary btn-sm">Details</a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* ── Sayfalama Kontrolü ─────────────────────────────── */}
                            {totalPages > 1 && (
                                <nav className="pagination" aria-label="Sayfa navigasyonu" style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '48px',
                                    flexWrap: 'wrap',
                                }}>
                                    {/* Önceki sayfa */}
                                    {page > 1 && (
                                        <a
                                            href={buildPageUrl(page - 1)}
                                            className="btn btn-secondary btn-sm"
                                            aria-label="Önceki sayfa"
                                        >
                                            ← Prev
                                        </a>
                                    )}

                                    {/* Sayfa numaraları (max 7 görünür) */}
                                    {(() => {
                                        const pageNums: (number | null)[] = [];
                                        const delta = 2;
                                        const left = Math.max(1, page - delta);
                                        const right = Math.min(totalPages, page + delta);

                                        if (left > 1) { pageNums.push(1); if (left > 2) pageNums.push(null); }
                                        for (let i = left; i <= right; i++) pageNums.push(i);
                                        if (right < totalPages) { if (right < totalPages - 1) pageNums.push(null); pageNums.push(totalPages); }

                                        return pageNums.map((p, i) =>
                                            p === null ? (
                                                <span key={`ellipsis-${i}`} style={{ color: 'var(--color-muted)', padding: '0 4px' }}>…</span>
                                            ) : (
                                                <a
                                                    key={p}
                                                    href={buildPageUrl(p)}
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: p === page ? 'var(--color-primary)' : 'var(--color-surface)',
                                                        color: p === page ? '#fff' : 'var(--color-text)',
                                                        border: '1px solid var(--color-border)',
                                                        minWidth: '40px',
                                                        textAlign: 'center',
                                                    }}
                                                    aria-current={p === page ? 'page' : undefined}
                                                >
                                                    {p}
                                                </a>
                                            )
                                        );
                                    })()}

                                    {/* Sonraki sayfa */}
                                    {page < totalPages && (
                                        <a
                                            href={buildPageUrl(page + 1)}
                                            className="btn btn-secondary btn-sm"
                                            aria-label="Sonraki sayfa"
                                        >
                                            Next →
                                        </a>
                                    )}
                                </nav>
                            )}

                            {/* İYTE Katalog Sonuçları (API'den çekilen ek veriler) */}
                            <CatalogResults dbBookTitles={dbBookTitles} />
                        </section>
                    </div>
                </div>
            </main>
        </>
    )
}