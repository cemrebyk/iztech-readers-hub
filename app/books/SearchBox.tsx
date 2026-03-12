"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchBox() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Eğer URL'de önceden bir arama varsa onu kutunun içine yazıyoruz
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

    // Kullanıcı her harf girdiğinde 300 milisaniye bekleyip (Debounce) URL'yi güncelliyoruz
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                router.push(`/books?q=${searchTerm}`)
            } else {
                router.push(`/books`) // Kutu boşalırsa tüm kitapları geri getir
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, router])

    return (
        <div className="search-box">
            <input
                type="text"
                placeholder="Search by title or author..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
            />
        </div>
    )
}