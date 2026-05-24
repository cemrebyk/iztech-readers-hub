import { createClient } from '../../../lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import ReadBooksSection from '../ReadBooksSection';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // If the visitor is viewing their own profile, redirect to the main profile page
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && currentUser.id === id) {
        redirect('/profile');
    }

    // Fetch all data in parallel for performance
    const [profileRes, badgesRes, reviewsRes, listsRes] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single(),
        supabase
            .from('user_achievements')
            .select(`
                unlocked_at,
                achievements ( id, name, description, icon )
            `)
            .eq('user_id', id)
            .order('unlocked_at', { ascending: false }),
        supabase
            .from('reviews')
            .select('id, rating, comment, tags, created_at, books(id, title, author)')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
        supabase
            .from('book_lists')
            .select('id, name, description')
            .eq('user_id', id)
            .order('created_at', { ascending: false }),
    ]);

    const profile = profileRes.data;
    if (!profile) notFound();

    const userBadges = badgesRes.data || [];
    const userReviews = reviewsRes.data || [];
    const userLists = listsRes.data || [];

    // Derive read books from reviews (same as own profile)
    const readBooksMap = new Map<string, { id: string; title: string; author: string }>();
    userReviews.forEach((review: any) => {
        const book = review.books;
        if (book && !readBooksMap.has(book.id)) {
            readBooksMap.set(book.id, { id: book.id, title: book.title, author: book.author });
        }
    });
    const readBooks = Array.from(readBooksMap.values());

    // Display name is always the email prefix (before @)
    const displayName = profile.email?.split('@')[0] || 'Kullanıcı';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <>
            <Navbar />
            <main className="public-profile-page">
                <div className="public-profile-container">

                    {/* Back to Feed */}
                    <Link href="/feed" className="public-profile-back">
                        ← Akışa Dön
                    </Link>

                    {/* ─── Profile Header ─── */}
                    <div className="public-profile-header">
                        <div className="public-profile-avatar">
                            {initial}
                        </div>
                        <div className="public-profile-info">
                            <h1 className="public-profile-name">{displayName}</h1>
                            <p className="public-profile-email">🎓 {profile.email}</p>
                            <span className="public-profile-badge">
                                👁️ Herkese Açık Profil
                            </span>
                        </div>
                    </div>

                    {/* ─── Achievements ─── */}
                    <div className="public-profile-section">
                        <h2 className="public-profile-section-title">🏆 Başarımlar</h2>
                        {userBadges.length > 0 ? (
                            <div className="public-badges-grid">
                                {userBadges.map((badgeEntry: any) => {
                                    const badge = badgeEntry.achievements;
                                    const icon = badge.icon || '🏅';
                                    return (
                                        <div key={badge.id} className="public-badge-card">
                                            <span className="public-badge-icon">{icon}</span>
                                            <span className="public-badge-name">{badge.name}</span>
                                            <span className="public-badge-desc">{badge.description}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="public-profile-empty">Henüz bir başarım kazanılmamış.</p>
                        )}
                    </div>

                    {/* ─── Read Books ─── */}
                    <div className="public-profile-section">
                        <h2 className="public-profile-section-title">📚 Okunan Kitaplar</h2>
                        {readBooks.length > 0 ? (
                            <ReadBooksSection books={readBooks} />
                        ) : (
                            <p className="public-profile-empty">Henüz değerlendirilen bir kitap yok.</p>
                        )}
                    </div>

                    {/* ─── Reading Lists ─── */}
                    <div className="public-profile-section">
                        <h2 className="public-profile-section-title">📌 Okuma Listeleri</h2>
                        {userLists.length > 0 ? (
                            <div className="public-lists-grid">
                                {userLists.map((list: any) => (
                                    <Link
                                        key={list.id}
                                        href={`/profile/list/${list.id}`}
                                        className="public-list-card"
                                    >
                                        <h4 className="public-list-name">{list.name}</h4>
                                        <span className="public-list-arrow">→</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="public-profile-empty">Henüz bir okuma listesi oluşturulmamış.</p>
                        )}
                    </div>

                    {/* ─── Reviews ─── */}
                    <div className="public-profile-section">
                        <h2 className="public-profile-section-title">📝 Değerlendirmeler</h2>
                        {userReviews.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {userReviews.map((review: any) => {
                                    const book = review.books;
                                    return (
                                        <div key={review.id} className="public-review-card">
                                            <div className="public-review-book-row">
                                                <div>
                                                    <Link href={`/books/${book?.id}`} style={{ textDecoration: 'none' }}>
                                                        <h4 className="public-review-book-title">
                                                            {book?.title || 'Bilinmeyen Kitap'}
                                                        </h4>
                                                    </Link>
                                                    <p className="public-review-book-author">
                                                        {book?.author || 'Bilinmeyen Yazar'}
                                                    </p>
                                                </div>
                                                <span className="public-review-date">
                                                    {new Date(review.created_at).toLocaleDateString('tr-TR', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            <div className="public-review-stars">
                                                {[...Array(5)].map((_, i) => (
                                                    <span
                                                        key={i}
                                                        className={`public-review-star ${i < review.rating ? 'filled' : 'empty'}`}
                                                    >
                                                        ★
                                                    </span>
                                                ))}
                                            </div>
                                            {review.tags && review.tags.length > 0 && (
                                                <div className="public-review-tags">
                                                    {review.tags.map((tag: string) => (
                                                        <span key={tag} className="public-review-tag">#{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                            {review.comment && (
                                                <blockquote className="public-review-comment">
                                                    &ldquo;{review.comment}&rdquo;
                                                </blockquote>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="public-profile-empty">Henüz bir değerlendirme yazılmamış.</p>
                        )}
                    </div>

                </div>
            </main>
        </>
    );
}