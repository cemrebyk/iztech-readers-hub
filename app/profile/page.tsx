import { createClient } from '../../lib/supabase-server';
import { redirect } from 'next/navigation';
import Navbar from '../components/Navbar';
import CreateListForm from './CreateListForm';
import ReadBooksSection from './ReadBooksSection';
import DeleteListButton from './DeleteListButton';
import Link from 'next/link'; // Navigasyon için eklendi

export default async function ProfilePage() {
    const supabase = await createClient();

    // 1. Kimin giriş yaptığını bul (Server Side Authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // 2. Profil, Listeler ve Değerlendirmeleri paralel çek (Performance Optimization)
    const [profileRes, listsRes, reviewsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('book_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('reviews').select('*, books(id, title, author)').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    const profile = profileRes.data;
    const userLists = listsRes.data || [];
    const userReviews = reviewsRes.data || [];

    // Extract unique books from reviews (reviewed = read)
    const readBooksMap = new Map<string, { id: string; title: string; author: string }>();
    userReviews.forEach((review: any) => {
        const book = review.books;
        if (book && !readBooksMap.has(book.id)) {
            readBooksMap.set(book.id, { id: book.id, title: book.title, author: book.author });
        }
    });
    const readBooks = Array.from(readBooksMap.values());

    return (
        <>
            <Navbar />
            <main className="profile-main" style={{ padding: '40px 0', background: '#f9f9f9', minHeight: '80vh' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Profil Başlığı */}
                    <div className="profile-header" style={{ background: 'white', padding: '30px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#9a0e20', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                            {profile?.email?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>Profilim</h1>
                            <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>🎓 {user?.email}</p>
                        </div>
                    </div>

                    {/* Okuduğum Kitaplar - Expandable */}
                    <div style={{ marginBottom: '40px' }}>
                        <ReadBooksSection books={readBooks} />
                    </div>

                    {/* OKUMA LİSTELERİ */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📌 Okuma Listelerim</h2>

                        <CreateListForm existingListNames={userLists.map((l: any) => l.name)} />

                        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                            {userLists.map((list: any) => (
                                <div key={list.id} className="list-card-wrapper" style={{ position: 'relative' }}>
                                    <Link
                                        href={`/profile/list/${list.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                    >
                                        <div className="list-card" style={{
                                            padding: '20px',
                                            border: '1px solid #eee',
                                            borderRadius: '12px',
                                            background: 'white',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            // "Antigravity" etkisi için hover:
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            paddingRight: '60px' // Buton için yer ayır
                                        }}>
                                            <div>
                                                <h4 style={{ margin: 0, color: '#9a0e20', fontSize: '1.2rem' }}>{list.name}</h4>
                                            </div>
                                            <div style={{ color: '#9a0e20', fontSize: '1.2rem' }}>
                                                →
                                            </div>
                                        </div>
                                    </Link>
                                    <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}>
                                        <DeleteListButton listId={list.id} listName={list.name} />
                                    </div>
                                </div>
                            ))}
                            {userLists.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Henüz bir listen yok. Yukarıdan oluşturabilirsin!</p>
                            )}
                        </div>
                    </div>

                    {/* DEĞERLENDİRMELERİM */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📝 Değerlendirmelerim</h2>

                        <div className="profile-reviews-feed">
                            {userReviews.map((review: any) => {
                                const book = review.books;
                                return (
                                    <div key={review.id} className="profile-review-card">
                                        <div className="profile-review-book-info">
                                            <Link href={`/books/${book?.id}`} style={{ textDecoration: 'none' }}>
                                                <h4 className="profile-review-book-title">{book?.title || 'Unknown Book'}</h4>
                                            </Link>
                                            <span className="profile-review-book-author">{book?.author || 'Unknown Author'}</span>
                                        </div>
                                        <div className="review-card-header">
                                            <div className="review-card-stars">
                                                {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                            </div>
                                            <span className="review-card-date">
                                                {new Date(review.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="review-card-tags">
                                            {(review.tags || []).map((tag: string) => (
                                                <span key={tag} className="review-tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            {userReviews.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Henüz bir değerlendirmen yok.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}