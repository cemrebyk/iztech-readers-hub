"use client"

import { useState } from 'react'
import Link from 'next/link'

const coverGradients = [
    "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)",
    "linear-gradient(135deg, #c9a227 0%, #8b7119 100%)",
    "linear-gradient(135deg, #2d6a4f 0%, #1b4030 100%)",
    "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
    "linear-gradient(135deg, #4a90a4 0%, #2d5a68 100%)",
    "linear-gradient(135deg, #6b4c9a 0%, #4a3570 100%)",
    "linear-gradient(135deg, #d4a373 0%, #a67c52 100%)",
    "linear-gradient(135deg, #457b9d 0%, #2d5066 100%)",
    "linear-gradient(135deg, #bc6c25 0%, #8a4f1c 100%)",
    "linear-gradient(135deg, #7f5539 0%, #5c3d29 100%)"
]

interface ReadBook {
    id: string
    title: string
    author: string
}

interface ReadBooksSectionProps {
    books: ReadBook[]
}

export default function ReadBooksSection({ books }: ReadBooksSectionProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div>
            {/* Stat Card - Clickable */}
            <div
                className="read-books-stat-card"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    borderLeft: '5px solid #9a0e20',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>📚 Okuduğum Kitaplar</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{books.length}</p>
                    </div>
                    <div style={{
                        fontSize: '1.5rem',
                        color: '#9a0e20',
                        transition: 'transform 0.3s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                        ▼
                    </div>
                </div>
            </div>

            {/* Expandable Book Grid */}
            <div
                className="read-books-grid-wrapper"
                style={{
                    maxHeight: isOpen ? '2000px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease, margin 0.3s ease',
                    opacity: isOpen ? 1 : 0,
                    marginTop: isOpen ? '20px' : '0',
                }}
            >
                <div className="read-books-grid">
                    {books.map((book, index) => (
                        <Link
                            key={book.id}
                            href={`/books/${book.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                            <div className="read-book-card">
                                <div
                                    className="read-book-cover"
                                    style={{ background: coverGradients[index % coverGradients.length] }}
                                >
                                    <span className="read-book-spine"></span>
                                    <div className="read-book-cover-title">{book.title}</div>
                                </div>
                                <div className="read-book-info">
                                    <h4 className="read-book-title" title={book.title}>{book.title}</h4>
                                    <p className="read-book-author">{book.author}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
                {books.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                        Henüz bir kitap değerlendirmedin. Değerlendirdiğin kitaplar burada görünecek!
                    </p>
                )}
            </div>
        </div>
    )
}
