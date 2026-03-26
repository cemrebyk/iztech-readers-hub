"use client"

import { useState } from 'react'

export default function RefreshButton({ bookId, isbn, title, initialTitle }: { bookId: any, isbn?: string, title?: string, initialTitle: string }) {
    const [loading, setLoading] = useState(false)

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
                alert(`"${initialTitle}" availability updated!\n\nStatus: ${data.is_available ? 'Available on Shelf ✅' : 'Currently Borrowed ⏳'}`)
                window.location.reload()
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

    return (
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
                marginLeft: 'auto'
            }}
            title="Check live availability"
        >
            {loading ? '⏳ Checking...' : '🔄 Check Availability'}
        </button>
    )
}