import { createClient } from "@/lib/supabase-server"
import FollowSearch from "./FollowSearch"
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { getBookCover } from '@/lib/bookCover';

export default async function FeedPage() {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) return <p>Giriş yapmalısınız.</p>

    // 1. Kimi takip ediyorum?
    const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

    const followingIds = follows?.map(f => f.following_id) || [];

    let feedReviews: any[] = [];

    if (followingIds.length > 0) {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                id,
                rating,
                comment,
                tags,
                created_at,
                user_id,
                profiles:user_id (
                    email
                ),
                books:book_id (
                    id,
                    title,
                    author,
                    isbn
                )
            `)
            .in('user_id', followingIds)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Feed API Hatası:", error.message);
        } else {
            feedReviews = reviews || [];
        }
    }

    // Fetch book covers in parallel for all reviews
    const reviewsWithCovers = await Promise.all(
        feedReviews.map(async (rev: any) => {
            const coverUrl = await getBookCover(
                rev.books?.isbn,
                rev.books?.title,
                rev.books?.author
            );
            return { ...rev, coverUrl };
        })
    );

    return (
        <>
            <Navbar />
            <main style={{ paddingTop: '100px', background: 'var(--color-cream, #faf8f5)', minHeight: '100vh' }}>
                <div className="container" style={{ maxWidth: '860px' }}>
                    {/* Page Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '40px',
                    }}>
                        <span style={{
                            display: 'inline-block',
                            padding: '6px 18px',
                            background: 'var(--color-primary, #9a0e20)',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1.5px',
                            borderRadius: '9999px',
                            marginBottom: '16px',
                        }}>
                            Kampüs Akışı
                        </span>
                        <h1 style={{
                            fontFamily: "'Merriweather', Georgia, serif",
                            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                            color: 'var(--color-text, #2d2a26)',
                            marginBottom: '10px',
                            lineHeight: 1.2,
                        }}>
                            Arkadaşlarından <span style={{ color: 'var(--color-primary, #9a0e20)' }}>Haberler</span>
                        </h1>
                        <p style={{
                            color: 'var(--color-text-muted, #8a837a)',
                            fontSize: '1.05rem',
                            maxWidth: '500px',
                            margin: '0 auto',
                        }}>
                            Takip ettiğin öğrencilerin en son kitap değerlendirmeleri
                        </p>
                    </div>

                    {/* Follow Search */}
                    <FollowSearch />

                    {/* Feed Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
                        {reviewsWithCovers.length > 0 ? (
                            reviewsWithCovers.map((rev: any) => {
                                const userId = rev.user_id;
                                const username = rev.profiles?.email ? rev.profiles.email.split('@')[0] : 'Bir Okur';
                                const initial = username.charAt(0).toUpperCase();
                                const coverGradient = "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)";

                                return (
                                    <div key={rev.id} style={{
                                        background: 'var(--color-white, #ffffff)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--color-sepia, #e8dcc8)',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(45, 42, 38, 0.06)',
                                    }}
                                        className="feed-card"
                                    >
                                        <div style={{ display: 'flex', gap: '0' }}>
                                            {/* Book Cover Thumbnail */}
                                            <Link href={`/books/${rev.books?.id}`} style={{ flexShrink: 0, display: 'block' }}>
                                                <div style={{
                                                    width: '130px',
                                                    minHeight: '200px',
                                                    height: '100%',
                                                    background: rev.coverUrl
                                                        ? `url(${rev.coverUrl}) center/cover no-repeat`
                                                        : coverGradient,
                                                    position: 'relative',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'opacity 0.2s ease',
                                                }}>
                                                    {/* Book spine effect */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: '4px',
                                                        background: 'rgba(0,0,0,0.15)',
                                                    }} />
                                                    {!rev.coverUrl && (
                                                        <span style={{
                                                            color: 'rgba(255,255,255,0.85)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 700,
                                                            textTransform: 'uppercase',
                                                            textAlign: 'center',
                                                            padding: '16px',
                                                            lineHeight: 1.3,
                                                            letterSpacing: '0.5px',
                                                        }}>
                                                            {rev.books?.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Review Content */}
                                            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                {/* User Header */}
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                    marginBottom: '10px',
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        {/* Avatar + Username — links to public profile */}
                                                        <Link href={`/profile/${userId}`} className="feed-profile-link">
                                                            <div className="feed-avatar" style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '50%',
                                                                background: 'var(--color-primary, #9a0e20)',
                                                                color: 'white',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                flexShrink: 0,
                                                            }}>
                                                                {initial}
                                                            </div>
                                                            <span className="feed-username" style={{
                                                                fontWeight: 700,
                                                                color: 'var(--color-text, #2d2a26)',
                                                                fontSize: '0.95rem',
                                                            }}>
                                                                {username}
                                                            </span>
                                                        </Link>
                                                        <div>
                                                            <p style={{
                                                                fontSize: '0.8rem',
                                                                color: 'var(--color-text-muted, #8a837a)',
                                                                margin: 0,
                                                                lineHeight: 1.4,
                                                            }}>
                                                                <Link
                                                                    href={`/books/${rev.books?.id}`}
                                                                    style={{
                                                                        color: 'var(--color-primary, #9a0e20)',
                                                                        fontWeight: 600,
                                                                        textDecoration: 'none',
                                                                        transition: 'opacity 0.2s',
                                                                    }}
                                                                >
                                                                    {rev.books?.title}
                                                                </Link>
                                                                {' '}hakkında değerlendirdi
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Date */}
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        color: 'var(--color-text-muted, #8a837a)',
                                                        background: 'var(--color-sepia-light, #f5f0e6)',
                                                        padding: '4px 10px',
                                                        borderRadius: '9999px',
                                                        whiteSpace: 'nowrap',
                                                        flexShrink: 0,
                                                        marginLeft: '12px',
                                                    }}>
                                                        {new Date(rev.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                                    </span>
                                                </div>

                                                {/* Stars */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    marginBottom: '10px',
                                                }}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} style={{
                                                            fontSize: '1.1rem',
                                                            color: i < rev.rating ? '#c9a227' : 'var(--color-sepia, #e8dcc8)',
                                                            transition: 'transform 0.15s ease',
                                                        }}>
                                                            ★
                                                        </span>
                                                    ))}
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--color-text-muted, #8a837a)',
                                                        marginLeft: '8px',
                                                        fontWeight: 600,
                                                    }}>
                                                        {rev.rating}/5
                                                    </span>
                                                </div>

                                                {/* Tags */}
                                                {rev.tags && rev.tags.length > 0 && (
                                                    <div style={{
                                                        display: 'flex',
                                                        flexWrap: 'wrap',
                                                        gap: '6px',
                                                        marginBottom: rev.comment ? '12px' : '0',
                                                    }}>
                                                        {rev.tags.map((tag: string) => (
                                                            <span key={tag} style={{
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.5px',
                                                                padding: '3px 10px',
                                                                borderRadius: '9999px',
                                                                background: 'var(--color-sepia-light, #f5f0e6)',
                                                                color: 'var(--color-text-light, #5c5650)',
                                                                border: '1px solid var(--color-sepia, #e8dcc8)',
                                                            }}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Comment */}
                                                {rev.comment && (
                                                    <blockquote style={{
                                                        borderLeft: '3px solid var(--color-primary, #9a0e20)',
                                                        paddingLeft: '14px',
                                                        margin: '4px 0 0 0',
                                                        fontStyle: 'italic',
                                                        color: 'var(--color-text-light, #5c5650)',
                                                        fontSize: '0.88rem',
                                                        lineHeight: 1.6,
                                                    }}>
                                                        &ldquo;{rev.comment}&rdquo;
                                                    </blockquote>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 30px',
                                background: 'var(--color-white, #ffffff)',
                                borderRadius: '16px',
                                border: '1px solid var(--color-sepia, #e8dcc8)',
                            }}>
                                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📖</div>
                                <h3 style={{
                                    fontFamily: "'Merriweather', Georgia, serif",
                                    fontSize: '1.2rem',
                                    color: 'var(--color-text, #2d2a26)',
                                    marginBottom: '8px',
                                }}>
                                    Henüz bir değerlendirme yok
                                </h3>
                                <p style={{
                                    color: 'var(--color-text-muted, #8a837a)',
                                    fontSize: '0.95rem',
                                    maxWidth: '360px',
                                    margin: '0 auto',
                                }}>
                                    Takip ettiğin arkadaşların henüz bir kitabı puanlamamış. Yukarıdan yeni arkadaşlar ekleyebilirsin!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}