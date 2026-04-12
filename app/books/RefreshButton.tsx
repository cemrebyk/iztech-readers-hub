"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface RefreshButtonProps {
    bookId: any;
    isbn?: string;
    title?: string;
    initialTitle: string;
    initialAvailability?: boolean;
    style?: React.CSSProperties;
}

export default function RefreshButton({ bookId, isbn, title, initialTitle, initialAvailability, style }: RefreshButtonProps) {
    const [loading, setLoading] = useState(false)
    // Local state to reflect availability immediately after check
    const [availability, setAvailability] = useState<boolean | null>(
        initialAvailability !== undefined ? initialAvailability : null
    )
    const router = useRouter()

    const handleRefresh = async () => {
        try {
            setLoading(true)

            let res: Response;

            if (isbn) {
                // ISBN-based check (Puppeteer scraping)
                res = await fetch(`/api/check-availability?isbn=${isbn}&id=${bookId}`)
            } else if (title) {
                // Title-based check (catalog JSON API)
                res = await fetch(`/api/check-availability-catalog?title=${encodeURIComponent(title)}&id=${bookId}`)
            } else {
                alert('No ISBN or title available to check.')
                setLoading(false)
                return
            }

            const data = await res.json()

            if (data.db_updated) {
                // Update local state immediately so the UI reflects the change
                setAvailability(data.is_available)
                // Tell Next.js to re-fetch server component data
                router.refresh()
                alert(`"${initialTitle}" availability updated!\n\nStatus: ${data.is_available ? 'Available on Shelf ✅' : 'Currently Borrowed ⏳'}`)
            } else if (data.error) {
                alert(`Could not check: ${data.error}`)
            } else {
                alert('Status fetched but database could not be updated.')
            }
        } catch (error) {
            console.error(error)
            alert('Connection error.')
        } finally {
            setLoading(false)
        }
    }

    // Determine displayed availability: local state takes priority over server prop
    const isAvailable = availability !== null ? availability : initialAvailability;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Availability badge — only shown if we have availability data */}
            {isAvailable !== undefined && isAvailable !== null && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{
                        padding: '10px 20px',
                        borderRadius: '30px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        background: isAvailable ? '#e6f4ea' : '#fce8e6',
                        color: isAvailable ? '#1e7e34' : '#c5221f',
                        transition: 'all 0.3s ease',
                    }}>
                        {isAvailable ? '📍 Available on Shelf' : '⏳ Currently Borrowed'}
                    </span>
                </div>
            )}

            <button
                onClick={handleRefresh}
                disabled={loading}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: loading ? '#f3f4f6' : '#ffffff',
                    color: loading ? '#9ca3af' : 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '9999px',
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    alignSelf: 'flex-start',
                    ...style
                }}
                title="Check live availability"
            >
                {loading ? '⏳ Checking...' : '🔄 Check Availability'}
            </button>
        </div>
    )
}