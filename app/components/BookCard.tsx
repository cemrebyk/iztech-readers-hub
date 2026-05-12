// app/components/BookCard.tsx (Yeni oluşturmanı öneririm)
"use client"
import { useState } from 'react'
import { ignoreBook } from '@/app/books/actions'

export default function BookCard({ book }: { book: any }) {
    const [isIgnored, setIsIgnored] = useState(false)

    const handleIgnore = async () => {
        // Optimistic Update: Kullanıcı tıkladığı an kartı gizle, arka planda işlemi yap
        setIsIgnored(true)

        const { error } = await ignoreBook(book.id)
        if (error) {
            setIsIgnored(false) // Hata olursa kartı geri getir
            console.error("Kitap gizlenemedi:", error.message)
        }
    }

    if (isIgnored) return null // Kartı DOM'dan kaldır

    return (
        <div className="relative group border p-4 rounded-lg">
            {/* Sol üstteki çarpı butonu */}
            <button
                onClick={handleIgnore}
                className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full hover:scale-110 transition-all"
            >
                ✕
            </button>

            {/* Kitap Bilgileri (Mevcut kodun) */}
            <img src={book.image_url} alt={book.title} className="w-full h-48 object-cover" />
            <h3 className="mt-2 font-bold">{book.title}</h3>
        </div>
    )
}