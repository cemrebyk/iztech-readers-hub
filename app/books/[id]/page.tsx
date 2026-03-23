import { createClient } from '../../../lib/supabase-server';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import AddToListAction from './AddToListAction';
import ReviewForm from './ReviewForm';

export default async function BookDetailsPage({ params }: { params: Promise<{ id: string }> }) {

    const resolvedParams = await params;
    const bookId = resolvedParams.id;

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch book, user lists, and reviews in parallel
    const [bookRes, listsRes, reviewsRes, userReviewRes] = await Promise.all([
        supabase.from('books').select('*').eq('id', bookId).single(),
        user ? supabase.from('book_lists').select('id, name').eq('user_id', user.id) : null,
        supabase.from('reviews').select('*').eq('book_id', bookId).order('created_at', { ascending: false }),
        user ? supabase.from('reviews').select('id').eq('book_id', bookId).eq('user_id', user.id).maybeSingle() : null,
    ]);

    const book = bookRes.data;
    const userLists = listsRes?.data || [];
    const reviews = reviewsRes?.data || [];
    const hasExistingReview = !!userReviewRes?.data;

    if (bookRes.error || !book) {
        notFound();
    }

    // Compute average rating from reviews
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
        : 0;
    const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '—';

    // Generate star display
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating - fullStars >= 0.5;
    const starsDisplay = '★'.repeat(fullStars) + (hasHalfStar ? '★' : '') + '☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0));

    // Aggregate tag counts from all reviews
    const tagCounts: Record<string, number> = {};
    reviews.forEach((r: any) => {
        (r.tags || []).forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

    const coverGradient = "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)";

    return (
        <>
            <Navbar />

            <main className="book-details-main">
                <section className="book-details-hero" style={{ padding: '60px 0', background: '#fdfbf7' }}>
                    <div className="container">
                        <div className="book-details-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '50px', alignItems: 'start' }}>

                            {/* Left: Book Cover */}
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

                            {/* Right: Book Info */}
                            <div className="book-details-info">
                                <div className="breadcrumb" style={{ marginBottom: '15px', color: '#666' }}>
                                    <a href="/books" style={{ color: '#9a0e20', textDecoration: 'none' }}>Books</a> &gt; <span>{book.genre || 'General'}</span> &gt; <span>{book.title}</span>
                                </div>

                                <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#1a1a1a' }}>{book.title}</h1>
                                <p className="book-author-large" style={{ fontSize: '1.5rem', color: '#9a0e20', marginBottom: '20px' }}>
                                    {book.author}
                                </p>

                                {/* Live Rating Display */}
                                <div className="rating-section" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
                                    <div className="stars" style={{ fontSize: '1.5rem', color: '#FFD700' }}>{starsDisplay}</div>
                                    <span className="rating-score"><strong>{avgRatingDisplay}</strong> / 5.0</span>
                                    <span className="review-count" style={{ color: '#666' }}>({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
                                </div>

                                {/* Tag Summary */}
                                {sortedTags.length > 0 && (
                                    <div className="review-tags-summary" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
                                        {sortedTags.map(([tag, count]) => (
                                            <span key={tag} className="tag" style={{
                                                background: 'var(--color-sepia-light)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                            }}>
                                                {tag} <strong style={{ color: 'var(--color-primary)' }}>×{count}</strong>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Library Availability */}
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

                                {/* Add to List */}
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
                            </div>
                        </div>
                    </div>
                </section>

                {/* Review Section */}
                <section style={{ padding: '50px 0', background: 'var(--color-cream)' }}>
                    <div className="container" style={{ maxWidth: '900px' }}>

                        {/* Review Form */}
                        {user ? (
                            <ReviewForm bookId={String(bookId)} hasExistingReview={hasExistingReview} />
                        ) : (
                            <div className="review-form-container" style={{ textAlign: 'center' }}>
                                <h3 className="review-form-title">Rate & Review</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                                    <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Sign in</a> to leave a review.
                                </p>
                            </div>
                        )}

                        {/* Existing Reviews */}
                        {reviews.length > 0 && (
                            <div style={{ marginTop: '40px' }}>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.3rem' }}>📝 All Reviews ({reviews.length})</h3>
                                <div className="reviews-list">
                                    {reviews.map((review: any) => (
                                        <div key={review.id} className="review-card">
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
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    );
}