import { createClient } from '../../lib/supabase-server'
import RefreshButton from './RefreshButton' // YENİ BUTONUMUZU İÇE AKTARDIK!
import SearchBox from './SearchBox'
import CategoryFilter from './CategoryFilter'
import Navbar from '../components/Navbar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Orijinal kapak renkleri paleti
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

    // Fetch all books (we need them all to compute category counts)
    let allBooksQuery = supabase.from('books').select('*');
    if (q) {
        allBooksQuery = allBooksQuery.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
    }
    const { data: allBooks, error } = await allBooksQuery;

    if (error) console.error("Hata:", error)

    // Extract distinct categories with counts from the fetched books
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

    // Filter by selected category
    const books = category
        ? allBooks?.filter((book) => book.genre?.trim() === category)
        : allBooks;

    return (
        <>
            {/* Navigation */}
            <Navbar />

            {/* Page Header */}
            <header className="page-header">
                <div className="container">
                    <h1>Browse <span className="highlight">Books</span></h1>
                    <p>Discover, rate, and review books from the IZTECH library collection</p>
                </div>
            </header>

            {/* Main Content */}
            <main className="books-main">
                <div className="container">
                    <div className="books-layout">

                        {/* Sidebar */}
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

                        {/* Book Grid Area */}
                        <section className="books-content">
                            <div className="content-header">
                                <p className="results-count">Showing <strong>{books?.length || 0} books</strong></p>
                                <div className="sort-options">
                                    <label htmlFor="sort-select">Sort by:</label>
                                    <select id="sort-select" className="sort-select">
                                        <option value="title">Title A-Z</option>
                                        <option value="rating">Highest Rated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="books-grid" id="books-grid">
                                {books?.map((book, index) => (
                                    <article key={book.id} className="book-card" data-category={book.genre?.toLowerCase()}>

                                        <div className="book-cover" style={{ background: coverGradients[index % coverGradients.length] }}>
                                            <span className="book-spine"></span>
                                            <div className="book-title-cover">{book.title}</div>
                                        </div>

                                        <div className="book-info">
                                            <h3 className="book-title" title={book.title}>{book.title}</h3>
                                            <p className="book-author">{book.author}</p>

                                            <div className="book-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                                {/* ETİKET VE BUTONU AYNI HİZAYA KOYDUK */}
                                                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                    <span className={`tag ${book.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ fontWeight: 'bold' }}>
                                                        {book.is_available ? '📍 Rafta' : '⏳ Ödünçte'}
                                                    </span>

                                                    {/* EĞER KİTABIN ISBN'İ VARSA CANLI SORGULAMA BUTONUNU GÖSTER */}
                                                    {book.isbn && (
                                                        <RefreshButton bookId={book.id} isbn={book.isbn} initialTitle={book.title} />
                                                    )}
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
                                                <button className="btn btn-primary btn-sm">Rate This</button>
                                                <a href={`/books/${book.id}`} className="btn btn-secondary btn-sm">Details</a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </>
    )
}