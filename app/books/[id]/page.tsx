import { createClient } from '../../../lib/supabase-server';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import AddToListAction from './AddToListAction'; // Daha önce oluşturduğumuz bileşen

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {

    // 1. Next.js 15 kuralı: params'ı kullanmadan önce await ile bekliyoruz
    const resolvedParams = await params;
    const bookId = resolvedParams.id;

    const supabase = await createClient();

    // 2. Kitap detaylarını ve kullanıcının listelerini paralel olarak çekiyoruz (Performance)
    const { data: { user } } = await supabase.auth.getUser();

    // Promise.all kullanarak hızı artırıyoruz
    const [bookRes, listsRes] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).single(),
        user ? supabase.from('book_lists').select('id, name').eq('user_id', user.id) : null
    ]);

    const book = bookRes.data;
    const userLists = listsRes?.data || [];

    // Eğer kitap bulunamazsa 404 sayfasına yönlendir
    if (bookRes.error || !book) {
        notFound();
    }

    // Kapak için standart İYTE bordosu...
    const coverGradient = "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)";

    return (
        <>
            <Navbar />

            <main className="book-details-main">
                <section className="book-details-hero" style={{ padding: '60px 0', background: '#fdfbf7' }}>
                    <div className="container">
                        <div className="book-details-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '50px', alignItems: 'start' }}>

                            {/* Sol Taraf: Kitap Kapağı */}
                            <div className="book-cover-large">
                                <div className="book-cover-inner" style={{
                                    background: coverGradient,
                                    height: '500px',
                                    borderRadius: '10px 20px 20px 10px',
                                    boxShadow: '20px 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span className="book-spine-large" style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '0',
                                        bottom: '0',
                                        width: '5px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '2px'
                                    }}></span>
                                    <div className="book-title-cover-large" style={{ color: 'white', padding: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.8rem', textTransform: 'uppercase' }}>
                                        {book.title}
                                    </div>
                                </div>
                            </div>

                            {/* Sağ Taraf: Kitap Bilgileri */}
                            <div className="book-details-info">
                                <div className="breadcrumb" style={{ marginBottom: '15px', color: '#666' }}>
                                    <a href="/books" style={{ color: '#9a0e20', textDecoration: 'none' }}>Books</a> &gt; <span>{book.genre || 'General'}</span> &gt; <span>{book.title}</span>
                                </div>

                                <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#1a1a1a' }}>{book.title}</h1>
                                <p className="book-author-large" style={{ fontSize: '1.5rem', color: '#9a0e20', marginBottom: '20px' }}>
                                    {book.author}
                                </p>

                                {/* WP6: Rating & Review Altyapısı (Gelecek hafta burayı canlandıracağız) */}
                                <div className="rating-section" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                                    <div className="stars" style={{ fontSize: '1.5rem', color: '#FFD700' }}>★★★★☆</div>
                                    <span className="rating-score"><strong>4.5</strong> / 5.0</span>
                                    <span className="review-count" style={{ color: '#666' }}>(128 reviews)</span>
                                </div>

                                {/* Kütüphane Durumu - Inventory Aware Section */}
                                <div className="shelf-info" style={{ background: 'white', padding: '25px', borderRadius: '15px', border: '1px solid #e0e0e0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                                    <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Library Availability</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                        <span style={{
                                            padding: '10px 20px',
                                            borderRadius: '30px',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            background: book.is_available ? '#e6f4ea' : '#fce8e6',
                                            color: book.is_available ? '#1e7e34' : '#c5221f'
                                        }}>
                                            {book.is_available ? '📍 Available on Shelf' : '⏳ Currently Borrowed'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '5px 0' }}><strong>Shelf Location:</strong> <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '4px' }}>{book.shelf_location}</code></p>
                                    <p style={{ margin: '5px 0' }}><strong>ISBN:</strong> {book.isbn}</p>
                                </div>

                                {/* WP7: Goodreads Tarzı Liste Sistemi - AddToListAction */}
                                <div style={{ marginTop: '30px' }}>
                                    {user ? (
                                        <div style={{ maxWidth: '400px' }}>
                                            <AddToListAction bookId={String(bookId)} userLists={userLists} />
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '10px', border: '1px solid #ffeeba' }}>
                                            <p style={{ margin: 0, color: '#856404' }}>
                                                Kitapları listelerinize eklemek için <a href="/login" style={{ fontWeight: 'bold', textDecoration: 'underline' }}>giriş yapın</a>.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', gap: '15px' }}>
                                    <button className="btn" style={{ padding: '12px 25px', borderRadius: '8px', background: '#9a0e20', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                                        Rate & Review
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}