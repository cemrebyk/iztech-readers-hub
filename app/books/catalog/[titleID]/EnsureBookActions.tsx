"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface EnsureBookActionsProps {
    catalogBook: {
        titleID: number;
        title: string;
        author: string;
        yearOfPublication: number;
        callNumber: string;
        isAvailable: boolean;
        tags: string[];
    };
}

export default function EnsureBookActions({ catalogBook }: EnsureBookActionsProps) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const router = useRouter();

    const handleEnsureAndRedirect = async () => {
        setLoading(true);
        setStatus("⌛ Adding book to database...");

        try {
            const res = await fetch('/api/ensure-book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titleID: catalogBook.titleID,
                    title: catalogBook.title,
                    author: catalogBook.author,
                    yearOfPublication: catalogBook.yearOfPublication,
                    callNumber: catalogBook.callNumber,
                    isAvailable: catalogBook.isAvailable,
                    tags: catalogBook.tags,
                }),
            });

            const data = await res.json();

            if (data.id) {
                setStatus("✅ Redirecting to book page...");
                router.push(`/books/${data.id}`);
            } else {
                setStatus("❌ Failed to add book to database.");
            }
        } catch (error) {
            console.error(error);
            setStatus("❌ An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <button
                onClick={handleEnsureAndRedirect}
                disabled={loading}
                className="btn btn-primary"
                style={{
                    padding: '14px 28px',
                    fontSize: '1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: loading ? 'wait' : 'pointer',
                }}
            >
                {loading ? '⌛ Processing...' : '📝 Rate, Review & Add to Lists'}
            </button>
            <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '8px' }}>
                This will add the book to our database so you can rate, review, and add it to your lists.
            </p>

            {status && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '0.9rem',
                    color: status.includes('✅') ? '#2e7d32' : status.includes('❌') ? '#9a0e20' : '#666',
                    fontWeight: 'bold'
                }}>
                    {status}
                </p>
            )}
        </div>
    );
}
