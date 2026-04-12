"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getBookCover } from '../../lib/bookCover'
import Link from 'next/link'

export default function Recommendations({ userId }: { userId: string }) {
    const [recs, setRecs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecs = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('get_inventory_aware_recommendations', {
                target_user_id: userId
            });

            if (!error && data) {
                const processedRecs = [];

                // NetworkError'u önlemek için istekleri seri (sırayla) atıyoruz
                for (const book of data) {
                    try {
                        const coverUrl = await getBookCover(book.isbn, book.title, book.author);
                        processedRecs.push({ ...book, coverUrl });
                    } catch (err) {
                        console.error(`${book.title} kapağı alınamadı:`, err);
                        processedRecs.push({ ...book, coverUrl: null });
                    }
                    // API'yi yormamak için her istek arasına 100ms boşluk
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                setRecs(processedRecs);
            }
            setLoading(false);
        };
        if (userId) fetchRecs();
    }, [userId]);

    // Recommendations.tsx içindeki kontrol kısmını değiştir:
    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>⏳ Kütüphane asistanı zevklerini analiz ediyor...</div>;

    // reks.length === 0 ise null dönmek yerine mesaj göster
    if (recs.length === 0) return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '15px', border: '1px dashed #ccc' }}>
            <p>🔍 Şu an senin için spesifik bir eşleşme bulamadık, ama yeni kitaplar keşfetmeye devam edebilirsin!</p>
        </div>
    );
    return (
        <section style={{ marginTop: '40px', padding: '0 20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.6rem', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                ✨ Senin İçin Seçtiklerimiz
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '25px'
            }}>
                {recs.map((book) => (
                    <Link href={`/books/${book.id}`} key={book.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            background: 'white',
                            borderRadius: '15px',
                            overflow: 'hidden',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                            border: '1px solid #f0f0f0',
                            height: '100%',
                            transition: 'transform 0.3s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{
                                height: '240px',
                                background: book.coverUrl ? `url(${book.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '15px'
                            }}>
                                {!book.coverUrl && <span style={{ fontSize: '1rem', fontWeight: '600' }}>{book.title}</span>}
                            </div>
                            <div style={{ padding: '15px' }}>
                                <h4 style={{ margin: '0', fontSize: '1rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</h4>
                                <p style={{ margin: '6px 0', fontSize: '0.85rem', color: '#666' }}>{book.author}</p>
                                <div style={{
                                    fontSize: '0.75rem',
                                    background: '#fdf2f2',
                                    color: '#9a0e20',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    display: 'inline-block',
                                    fontWeight: 'bold',
                                    border: '1px solid #f9d5d5'
                                }}>
                                    🎯 Uyum: %{Math.round(book.recommendation_score)}
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}