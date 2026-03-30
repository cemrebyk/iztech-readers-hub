// app/catalog-search/page.tsx
import Navbar from '../components/Navbar';
import { redirect } from 'next/navigation';
import CheckAvailabilityPopup from './CheckAvailabilityPopup';

export const dynamic = 'force-dynamic';

interface LibraryBook {
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

async function searchLibrary(query: string): Promise<LibraryBook[]> {
    if (!query) return [];

    const url = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${query}"&hitsToDisplay=50&includeAvailabilityInfo=true&json=true`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('API Hatası');

        const data = await response.json();
        if (!data.HitlistTitleInfo) return [];

        // YENİ VE KUSURSUZ FİLTREMİZ:
        return data.HitlistTitleInfo.filter((book: any) => {
            // 1. Kütüphane tipi "BOOK" olmalı
            const isBookType = book.materialType === "BOOK";

            // 2. Raf numarası (callNumber) var olmalı VE "XX" ile BAŞLAMAMALI
            const hasValidCallNumber = book.callNumber && !book.callNumber.toUpperCase().startsWith("XX");

            // İki şartı da sağlayan SADECE GERÇEK FİZİKSEL kitapları döndür
            return isBookType && hasValidCallNumber;
        });

    } catch (error) {
        console.error("Kütüphane API hatası:", error);
        return [];
    }
}
export default async function CatalogSearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const params = await searchParams;
    const q = params?.q || '';

    const books = await searchLibrary(q);

    async function handleSearch(formData: FormData) {
        'use server';
        const query = formData.get('query');
        if (query) {
            redirect(`/catalog-search?q=${query}`);
        }
    }

    return (
        <>
            <Navbar />

            <header className="page-header" style={{ backgroundColor: '#2d6a4f' }}>
                <div className="container">
                    <h1>Iztech Library <span className="highlight" style={{ color: 'var(--color-primary)' }}>Catalog</span></h1>
                    <p>Search directly within the IYTE library database (Physical Books Only)</p>
                </div>
            </header>

            <main className="books-main" style={{ padding: '40px 0' }}>
                <div className="container">

                    {/* ARAMA ÇUBUĞU */}
                    <div style={{ marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                        <form action={handleSearch} style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                name="query"
                                defaultValue={q}
                                placeholder="Kitap veya yazar ara (örn: algorithms)..."
                                style={{
                                    flex: 1,
                                    padding: '12px 20px',
                                    borderRadius: '8px',
                                    border: '1px solid #ccc',
                                    fontSize: '16px'
                                }}
                                required
                            />
                            <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                                Arama Yap
                            </button>
                        </form>
                    </div>

                    {/* SONUÇLAR */}
                    {q && (
                        <div>
                            <h3 style={{ marginBottom: '20px' }}>"{q}" için kütüphanede {books.length} fiziksel kitap bulundu:</h3>

                            {books.length === 0 ? (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>Aradığınız kriterlere uygun fiziksel bir kitap bulunamadı veya sonuçlar sadece dijital formatta (E-Book).</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                    {books.map((book) => {
                                        const isAvailable = book.titleAvailabilityInfo.totalCopiesAvailable > 0;
                                        return (
                                            <div key={book.titleID} style={{
                                                border: '1px solid #eee',
                                                borderRadius: '10px',
                                                padding: '20px',
                                                backgroundColor: '#fff',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
                                            }}>
                                                <h4 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>{book.title}</h4>
                                                <p style={{ margin: '0 0 5px 0', color: '#666' }}>Yazar: {book.author || 'Bilinmiyor'}</p>
                                                <p style={{ margin: '0 0 15px 0', color: '#888', fontSize: '14px' }}>Yıl: {book.yearOfPublication || 'Bilinmiyor'}</p>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: 'auto' }}>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#f5f5f5',
                                                        fontFamily: 'monospace',
                                                        alignSelf: 'flex-start'
                                                    }}>
                                                        Raf: {book.callNumber}
                                                    </span>

                                                    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                                                        <CheckAvailabilityPopup title={book.title} isAvailable={isAvailable} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}