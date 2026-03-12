"use client"

import { useState } from 'react'

export default function RefreshButton({ bookId, isbn, initialTitle }: { bookId: any, isbn: string, initialTitle: string }) {
    const [loading, setLoading] = useState(false)

    const handleRefresh = async () => {
        try {
            setLoading(true)

            // Sadece API'ye istek atıyoruz, gerisini o hallediyor!
            // bookId'yi de gönderiyoruz ki API hangi kitabı güncelleyeceğini bilsin.
            const res = await fetch(`/api/check-availability?isbn=${isbn}&id=${bookId}`)
            const data = await res.json()

            if (data.db_updated) {
                alert(`"${initialTitle}" için kütüphane durumu: ${data.raw_status_text}\n\nVeritabanı güncellendi!`)
                // Next.js önbelleğini ezip sayfayı sertçe yeniliyoruz
                window.location.reload()
            } else {
                alert('Durum çekildi ama veritabanı güncellenemedi.')
            }
        } catch (error) {
            console.error(error)
            alert('Bağlantı hatası oluştu.')
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
            title="Raf durumunu güncelle"
        >
            {loading ? '⏳ Sorgulanıyor...' : '🔄 Canlı Sorgula'}
        </button>
    )
}