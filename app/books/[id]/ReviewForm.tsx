"use client"

import { useState } from 'react'
import { submitReview } from '../../../lib/actions/reviews'

const AVAILABLE_TAGS = [
    "Heavy Language",
    "Overrated",
    "Funny",
    "Cult-Classic",
    "Page-Turner",
    "Thought-Provoking",
    "Easy Read",
    "Dark",
    "Emotional",
    "Underrated",
    "Boring",
    "Must-Read",
    "Academic",
    "Inspiring",
    "Confusing",
]

interface ReviewFormProps {
    bookId: string
    hasExistingReview: boolean
}

export default function ReviewForm({ bookId, hasExistingReview }: ReviewFormProps) {
    const [rating, setRating] = useState(0)
    const [hoveredStar, setHoveredStar] = useState(0)
    const [selectedTags, setSelectedTags] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [submitted, setSubmitted] = useState(hasExistingReview)

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

    if (submitted) {
        return (
            <div className="review-form-submitted">
                <div className="submitted-icon">✅</div>
                <p>You have already reviewed this book.</p>
            </div>
        )
    }

    return (
        <div className="review-form-container">
            <h3 className="review-form-title">Rate & Review</h3>
            <p className="review-form-subtitle">Share your thoughts with fellow readers</p>

            {/* Star Rating */}
            <div className="review-form-section">
                <label className="form-label">Your Rating</label>
                <div className="star-rating-input">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`star-btn ${star <= (hoveredStar || rating) ? 'active' : ''}`}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                        >
                            ★
                        </button>
                    ))}
                    {rating > 0 && (
                        <span className="rating-label">{rating}/5</span>
                    )}
                </div>
            </div>

            {/* Tag Selection */}
            <div className="review-form-section">
                <label className="form-label">
                    Pick Tags <span className="tag-counter">(Select 1 to 3) ({selectedTags.length}/3)</span>
                </label>
                <div className="selectable-tags">
                    {AVAILABLE_TAGS.map((tag) => {
                        const isSelected = selectedTags.includes(tag)
                        const isDisabled = !isSelected && selectedTags.length >= 3
                        return (
                            <button
                                key={tag}
                                type="button"
                                className={`selectable-tag ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
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
                <div className={`review-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Submit */}
            <button
                type="button"
                className="btn btn-primary submit-review-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || selectedTags.length === 0}
            >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
        </div>
    )
}
