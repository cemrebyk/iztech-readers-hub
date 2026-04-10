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

export default async function BooksPage(props: { searchParams: Promise<{ q?: string; category?: string }> }) {
    const searchParams = await props.searchParams;
    const q = searchParams?.q || '';
    const category = searchParams?.category || '';

    const supabase = await createClient();

    // 1. Veritabanından kitapları çek (Kategori sayımı için hepsi lazım)
    let allBooksQuery = supabase.from('books').select('*');
    if (q) {
        allBooksQuery = allBooksQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
    }
    let { data: allBooks, error } = await allBooksQuery;

    // JWT expired fallback: If the user's session expired, their cookie sends an invalid token.
    // We catch this and retry the fetch as an anonymous user since the books table is public.
    if (error && error.code === 'PGRST303') {
        const { createServerClient } = await import('@supabase/ssr');
        const anonSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll() { return []; }, setAll() { } } }
        );

        let fallbackQuery = anonSupabase.from('books').select('*');
        if (q) {
            fallbackQuery = fallbackQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
        }
        const fallbackRes = await fallbackQuery;
        allBooks = fallbackRes.data;
        error = fallbackRes.error;
    }

    if (error) console.error("Veritabanı Hatası:", error);

    // Fetch user and user's reviewed books
    const { data: { user } } = await supabase.auth.getUser();
    let userReviewedBookIds = new Set<string>();
    if (user) {
        const { data: userReviews } = await supabase.from('reviews').select('book_id').eq('user_id', user.id);
        if (userReviews) {
            userReviewedBookIds = new Set(userReviews.map(r => String(r.book_id)));
        }
    }

    // 2. Kategori haritasını oluştur
    const categoryMap: Record<string, number> = {};
    allBooks?.forEach((book) => {
        const genre = book.genre?.trim();
        if (genre) {
            categoryMap[genre] = (categoryMap[genre] || 0) + 1;
        }
    });
    const categories = Object.entries(categoryMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

    // 3. Seçili kategoriye göre filtrele
    const filteredBooks = category
        ? allBooks?.filter((book) => book.genre?.trim() === category)
        : allBooks;

    // 4. MÜHENDİSLİK DOKUNUŞU: Google API üzerinden kapakları paralel olarak çek
    // ISBN varsa ISBN, yoksa Title+Author araması yapar
    const books = filteredBooks ? await Promise.all(filteredBooks.map(async (book) => {
        const coverUrl = await getBookCover(book.isbn, book.title, book.author);
        return { ...book, coverUrl };
    })) : [];

    const dbBookTitles = allBooks?.map((book) => book.title) || [];

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
                            <CategoryFilter categories={categories} totalBooks={allBooks?.length || 0} />
                        </aside>

                        <section className="books-content">
                            <div className="content-header">
                                <p className="results-count">Showing <strong>{books.length} books</strong></p>
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
                                                    : coverGradients[index % coverGradients.length]
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

                            {/* İYTE Katalog Sonuçları (API'den çekilen ek veriler) */}
                            <CatalogResults dbBookTitles={dbBookTitles} />
                        </section>
                    </div>
                </div>
            </main>
        </>
    )
}