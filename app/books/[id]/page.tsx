import { supabase } from '../../../lib/supabase'
import { notFound } from 'next/navigation'
import Navbar from '../../components/Navbar'

// 1. params tipini Promise olarak güncelledik
export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {

    // 2. Next.js 15 kuralı: params'ı kullanmadan önce await ile bekliyoruz
    const resolvedParams = await params;
    const bookId = resolvedParams.id;

    // 3. Artık güvenle veritabanı sorgumuzu yapabiliriz
    const { data: book, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single()

    // Eğer kitap bulunamazsa 404 sayfasına yönlendir
    if (error || !book) {
        notFound()
    }

    // Kapak için standart İYTE bordosu...
    const coverGradient = "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)";

    return (
        <>
            {/* Navbar */}
            <Navbar />

            <main className="book-details-main">
                <section className="book-details-hero">
                    <div className="container">
                        <div className="book-details-layout">

                            {/* Sol Taraf: Kitap Kapağı */}
                            <div className="book-cover-large">
                                <div className="book-cover-inner" style={{ background: coverGradient }}>
                                    <span className="book-spine-large"></span>
                                    <div className="book-title-cover-large" style={{ color: 'white', padding: '20px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.5rem' }}>
                                        {book.title}
                                    </div>
                                </div>
                            </div>

                            {/* Sağ Taraf: Kitap Bilgileri */}
                            <div className="book-details-info">
                                <div className="breadcrumb" style={{ marginBottom: '15px', color: 'var(--color-text-muted)' }}>
                                    <a href="/books">Books</a> &gt; <span>{book.genre || 'General'}</span> &gt; <span>{book.title}</span>
                                </div>

                                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{book.title}</h1>
                                <p className="book-author-large" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '20px' }}>
                                    {book.author}
                                </p>

                                <div className="rating-section" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                                    <div className="stars" style={{ fontSize: '1.5rem', color: 'var(--color-gold)' }}>★★★★☆</div>
                                    <span className="rating-score"><strong>4.5</strong> / 5.0</span>
                                    <span className="review-count">(128 reviews)</span>
                                </div>

                                {/* Kütüphane Durumu ve Raf Bilgisi */}
                                <div className="shelf-info" style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-sepia)', marginBottom: '30px' }}>
                                    <h3 style={{ marginBottom: '15px' }}>Library Availability</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                                        <span className={`tag ${book.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ padding: '8px 16px', fontSize: '1rem', fontWeight: 'bold' }}>
                                            {book.is_available ? '📍 Currently on Shelf' : '⏳ Borrowed'}
                                        </span>
                                    </div>
                                    <p><strong>Shelf Location:</strong> {book.shelf_location}</p>
                                    <p><strong>ISBN:</strong> {book.isbn}</p>
                                </div>

                                {/* Etiketler (Tags) */}
                                <div className="book-meta-details">
                                    <h3 style={{ marginBottom: '15px' }}>Tags & Categories</h3>
                                    <div className="book-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        <span className="tag" style={{ background: 'var(--color-primary)', color: 'white' }}>{book.genre}</span>
                                        {book.tags?.map((tag: string) => (
                                            <span key={tag} className="tag" style={{ background: 'var(--color-sepia-light)', border: '1px solid var(--color-sepia)' }}>#{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ marginTop: '40px' }}>
                                    <button className="btn btn-primary btn-lg" style={{ marginRight: '15px' }}>Rate & Review</button>
                                    <button className="btn btn-secondary btn-lg">Add to Reading List</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}