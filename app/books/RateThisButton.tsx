"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { submitReview } from '../../lib/actions/reviews'
import { AVAILABLE_TAGS } from '../../lib/constants/review-tags'

interface RateThisButtonProps {
    bookId: string;
    bookTitle: string;
    hasExistingReview: boolean;
    isAuth: boolean;
}

export default function RateThisButton({ bookId, bookTitle, hasExistingReview: initialHasReview, isAuth }: RateThisButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rating, setRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [submitted, setSubmitted] = useState(initialHasReview)

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isModalOpen]);

    const handleTagToggle = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag))
        } else if (selectedTags.length < 3) {
            setSelectedTags([...selectedTags, tag])
        }
    }

    const handleSubmit = async () => {
        if (rating === 0) {
            setMessage({ type: 'error', text: 'Please select a star rating.' })
            return
        }
        if (selectedTags.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least 1 tag.' })
            return
        }

        setIsSubmitting(true)
        setMessage(null)

        try {
            await submitReview(bookId, rating, selectedTags)
            setMessage({ type: 'success', text: 'Review submitted successfully! ✨' })
            setSubmitted(true)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to submit review.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetAndClose = () => {
        setIsModalOpen(false);
        // Only reset if they haven't submitted yet
        if (!submitted && !initialHasReview) {
            setRating(0);
            setSelectedTags([]);
            setMessage(null);
        }
    }

    // Determine the button state for the grid
    let btnText = "Rate This";
    if (submitted || initialHasReview) btnText = "Rated ✓";

    return (
        <>
            <button
                className={`btn btn-sm ${submitted || initialHasReview ? 'btn-secondary' : 'btn-primary'}`}
                onClick={() => setIsModalOpen(true)}
            >
                {btnText}
            </button>

            {isModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="rate-modal-overlay" onClick={resetAndClose} style={{ zIndex: 9999 }}>
                    <div className="rate-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="rate-modal-close" onClick={resetAndClose}>&times;</button>

                        <div className="rate-modal-header">
                            <h3>Rate <span style={{ color: 'var(--color-primary)' }}>{bookTitle}</span></h3>
                        </div>

                        {!isAuth ? (
                            <div className="rate-modal-body" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '20px' }}>
                                    You must be signed in to rate and review books.
                                </p>
                                <a href="/login" className="btn btn-primary">Sign in</a>
                            </div>
                        ) : submitted || initialHasReview ? (
                            <div className="rate-modal-body" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                <div className="submitted-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                <h4 style={{ marginBottom: '0.5rem' }}>Thank You!</h4>
                                <p style={{ color: 'var(--color-text-muted)' }}>You have already reviewed this book.</p>
                            </div>
                        ) : (
                            <div className="rate-modal-body">
                                <p className="review-form-subtitle" style={{ textAlign: 'center', marginBottom: '20px' }}>Share your thoughts with fellow readers</p>

                                {/* Star Rating */}
                                <div className="review-form-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="form-label" style={{ marginBottom: '10px' }}>Your Rating</label>
                                    <div className="star-rating-input" style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className={`star-btn ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                                                style={{ fontSize: '2.5rem', background: 'none', border: 'none', cursor: 'pointer', color: star <= (hoveredStar || rating) ? 'var(--color-gold)' : 'var(--color-sepia-dark)', transition: 'all 0.2s', padding: 0 }}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredStar(star)}
                                                onMouseLeave={() => setHoveredStar(0)}
                                            >
                                                ★
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ textAlign: 'center', marginTop: '10px', height: '24px' }}>
                                        {rating > 0 && <span className="rating-label" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{rating}/5</span>}
                                    </div>
                                </div>

                                {/* Tag Selection */}
                                <div className="review-form-section" style={{ marginTop: '20px' }}>
                                    <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: '15px' }}>
                                        Pick Tags <span className="tag-counter" style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>(Select 1 to 3) ({selectedTags.length}/3)</span>
                                    </label>
                                    <div className="selectable-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                                        {AVAILABLE_TAGS.map((tag) => {
                                            const isSelected = selectedTags.includes(tag)
                                            const isDisabled = !isSelected && selectedTags.length >= 3
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    className={`selectable-tag ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                                    style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '20px',
                                                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-sepia)'}`,
                                                        background: isSelected ? 'var(--color-primary)' : 'white',
                                                        color: isSelected ? 'white' : 'var(--color-text)',
                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                        opacity: isDisabled ? 0.5 : 1,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => !isDisabled && handleTagToggle(tag)}
                                                    disabled={isDisabled}
                                                >
                                                    {tag}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Message */}
                                {message && (
                                    <div className={`review-message ${message.type}`} style={{
                                        marginTop: '20px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        background: message.type === 'success' ? '#e6f4ea' : '#fce8e6',
                                        color: message.type === 'success' ? '#1e7e34' : '#c5221f',
                                        border: `1px solid ${message.type === 'success' ? '#b7dfbf' : '#f5c6c2'}`
                                    }}>
                                        {message.text}
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="button"
                                    className="btn btn-primary submit-review-btn"
                                    style={{ width: '100%', marginTop: '25px', padding: '12px' }}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || rating === 0 || selectedTags.length === 0}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
