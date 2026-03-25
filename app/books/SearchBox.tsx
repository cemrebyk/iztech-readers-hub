"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function SearchBox() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                router.push(`/books?q=${searchTerm}`)
            } else {
                router.push(`/books`)
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