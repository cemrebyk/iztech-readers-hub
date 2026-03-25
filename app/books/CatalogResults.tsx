"use client"

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface CatalogBook {
    titleID: number;
    title: string;
    author: string;
    yearOfPublication: number;
    materialType: string;
    callNumber: string;
    titleAvailabilityInfo: {
        totalCopiesAvailable: number;
    };
}

const coverGradients = [
    "linear-gradient(135deg, #4a90a4 0%, #2d5a68 100%)",
    "linear-gradient(135deg, #6b4c9a 0%, #4a3570 100%)",
    "linear-gradient(135deg, #d4a373 0%, #a67c52 100%)",
    "linear-gradient(135deg, #457b9d 0%, #2d5066 100%)",
    "linear-gradient(135deg, #bc6c25 0%, #8a4f1c 100%)",
    "linear-gradient(135deg, #7f5539 0%, #5c3d29 100%)",
    "linear-gradient(135deg, #2d6a4f 0%, #1b4030 100%)",
    "linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)",
    "linear-gradient(135deg, #c9a227 0%, #8b7119 100%)",
    "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)",
];

interface CatalogResultsProps {
    dbBookTitles: string[];
}

export default function CatalogResults({ dbBookTitles }: CatalogResultsProps) {
    const searchParams = useSearchParams();
    const q = searchParams.get('q') || '';
    const [catalogBooks, setCatalogBooks] = useState<CatalogBook[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!q || q.trim().length < 2) {
            setCatalogBooks([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`/api/catalog-search?q=${encodeURIComponent(q)}`, {
                    signal: controller.signal
                });
                if (res.ok) {
                    const data = await res.json();
                    // Filter out books that already exist in the DB
                    const normalizedDbTitles = dbBookTitles.map(t => t.toLowerCase().trim());
                    const filtered = data.filter((book: CatalogBook) =>
                        !normalizedDbTitles.includes(book.title.toLowerCase().trim())
                    );
                    setCatalogBooks(filtered);
                } else {
                    setCatalogBooks([]);
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    setCatalogBooks([]);
                }
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [q, dbBookTitles]);

    if (!q || q.trim().length < 2) return null;

    return (
        <>
            {/* Catalog Results Section */}
            {loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '30px',
                    color: '#666',
                    fontSize: '0.95rem'
                }}>
                    <span style={{ display: 'inline-block', marginRight: '8px' }}>🔄</span>
                    Searching IYTE Library Catalog...
                </div>
            )}

            {!loading && catalogBooks.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        paddingBottom: '12px',
                        borderBottom: '2px solid var(--color-primary, #9a0e20)'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📚</span>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
                            More from IYTE Library Catalog
                            <span style={{
                                marginLeft: '10px',
                                fontSize: '0.85rem',
                                fontWeight: 'normal',
                                color: '#666',
                                background: '#f0f0f0',
                                padding: '2px 10px',
                                borderRadius: '12px'
                            }}>
                                {catalogBooks.length} found
                            </span>
                        </h3>
                    </div>

                    <div className="books-grid" id="catalog-books-grid">
                        {catalogBooks.map((book, index) => {
                            const isAvailable = book.titleAvailabilityInfo.totalCopiesAvailable > 0;
                            return (
                                <article key={book.titleID} className="book-card" data-category="catalog">
                                    <div className="book-cover" style={{ background: coverGradients[index % coverGradients.length] }}>
                                        <span className="book-spine"></span>
                                        <div className="book-title-cover">{book.title}</div>
                                    </div>

                                    <div className="book-info">
                                        <h3 className="book-title" title={book.title}>{book.title}</h3>
                                        <p className="book-author">{book.author || 'Unknown'}</p>

                                        <div className="book-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                                <span className={`tag ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} style={{ fontWeight: 'bold' }}>
                                                    {isAvailable ? '📍 Rafta' : '⏳ Ödünçte'}
                                                </span>
                                            </div>
                                            <span className="book-reviews" style={{ fontSize: '0.8rem' }}>📍 {book.callNumber}</span>
                                        </div>

                                        <div className="book-tags" style={{ marginTop: '12px' }}>
                                            <span className="tag" style={{
                                                background: 'linear-gradient(135deg, #2d6a4f, #1b4030)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                padding: '2px 8px'
                                            }}>
                                                📖 IYTE Catalog
                                            </span>
                                            {book.yearOfPublication && (
                                                <span className="tag">📅 {book.yearOfPublication}</span>
                                            )}
                                        </div>

                                        <div className="book-actions mt-4">
                                            <a href={`/books/catalog/${book.titleID}?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author || '')}&year=${book.yearOfPublication || 0}&callNumber=${encodeURIComponent(book.callNumber || '')}&copies=${book.titleAvailabilityInfo.totalCopiesAvailable}`} className="btn btn-primary btn-sm">Details</a>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            )}

            {!loading && q.trim().length >= 2 && catalogBooks.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#999',
                    fontSize: '0.9rem',
                    marginTop: '30px'
                }}>
                    No additional books found in the IYTE catalog.
                </div>
            )}
        </>
    );
}
