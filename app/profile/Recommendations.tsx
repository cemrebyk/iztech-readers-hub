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
            if (!userId) return;
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_inventory_aware_recommendations', {
                    target_user_id: userId
                });

                if (error) throw error;

                if (data) {
                    const processedRecs = [];
                    // 10 kitap için döngüye giriyoruz
                    for (const book of data) {
                        try {
                            // 1. İsteği daha kontrollü atıyoruz
                            const coverUrl = await getBookCover(book.p_isbn, book.p_title, book.p_author);
                            processedRecs.push({ ...book, coverUrl });
                        } catch (err) {
                            // API hata verirse NetworkError fırlatmasın, sadece resmi null yapsın
                            console.warn(`${book.p_title} için kapak çekilemedi, varsayılan renk kullanılacak.`);
                            processedRecs.push({ ...book, coverUrl: null });
                        }

                        // 2. BEKLEME SÜRESİNİ ARTIR (Çok Önemli)
                        // 80ms çok hızlıydı, API'yi kızdırmamak için 250ms yapıyoruz.
                        await new Promise(resolve => setTimeout(resolve, 250));
                    }
                    setRecs(processedRecs);
                }
            } catch (err) {
                console.error("Öneri hatası detayları:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecs();
    }, [userId]);

    if (loading) return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#666', fontSize: '1.1rem' }}>
            ⏳ İYTE Kütüphane asistanı akıllı analiz yapıyor...
        </div>
    );

    if (recs.length === 0) return null;

    return (
        <section style={{ marginTop: '40px', padding: '0 20px', position: 'relative' }}>
            <h2 style={{ marginBottom: '25px', fontSize: '1.8rem', fontWeight: 'bold', borderBottom: '2px solid #9a0e20', paddingBottom: '10px', display: 'inline-block' }}>
                ✨ Senin İçin Seçtiklerimiz
            </h2>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '30px'
            }}>
                {recs.map((book) => (
                    <div key={book.p_id} className="recommendation-group">
                        <Link href={`/books/${book.p_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            <div className="recommendation-card">
                                {/* Kapak Alanı */}
                                <div className="cover-container" style={{
                                    background: book.coverUrl ? `url(${book.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)'
                                }}>
                                    {!book.coverUrl && <span style={{ padding: '20px', fontWeight: 'bold' }}>{book.p_title}</span>}
                                </div>

                                {/* Bilgi Alanı */}
                                <div style={{ padding: '15px' }}>
                                    <h4 style={{ margin: '0', fontSize: '1rem', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {book.p_title}
                                    </h4>
                                    <p style={{ margin: '6px 0', fontSize: '0.85rem', color: '#666' }}>{book.p_author}</p>

                                    <div className="score-wrapper">
                                        <div className="score-badge">
                                            🎯 Uyum: %{Math.max(0, Math.round(book.p_recommendation_score))}
                                        </div>

                                        {/* Gelişmiş Tooltip (XAI - Explainable AI) */}
                                        <div className="score-tooltip">
                                            <div style={{ borderBottom: '1px solid #555', paddingBottom: '5px', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.8rem', color: '#fff' }}>
                                                Neden Önerildi?
                                            </div>
                                            {book.p_score_details && Object.entries(book.p_score_details).map(([key, val]: any) => (
                                                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{ color: '#bbb' }}>{key}:</span>
                                                    <span style={{ fontWeight: 'bold', color: val < 0 ? '#ff7675' : '#55efc4' }}>
                                                        {val > 0 ? `+${val}` : val}
                                                    </span>
                                                </div>
                                            ))}
                                            <div style={{ borderTop: '1px solid #555', marginTop: '8px', paddingTop: '8px', textAlign: 'right', fontWeight: 'bold', color: '#fff' }}>
                                                Toplam Skor: {Math.max(0, Math.round(book.p_recommendation_score))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .recommendation-group { position: relative; z-index: 1; }
                .recommendation-group:hover { z-index: 100; }
                
                .recommendation-card {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
                    border: 1px solid #eee;
                    height: 100%;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                }
                
                .recommendation-card:hover {
                    transform: translateY(-10px);
                    box-shadow: 0 15px 35px rgba(0,0,0,0.12);
                }
                
                .cover-container {
                    height: 260px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    border-top-left-radius: 15px;
                    border-top-right-radius: 15px;
                    overflow: hidden;
                }
                
                .score-wrapper { position: relative; display: inline-block; margin-top: 5px; }
                
                .score-badge {
                    font-size: 0.75rem;
                    background: #fdf2f2;
                    color: #9a0e20;
                    padding: 5px 12px;
                    border-radius: 8px;
                    font-weight: 800;
                    border: 1px solid #f9d5d5;
                    cursor: help;
                }
                
                .score-tooltip {
                    visibility: hidden;
                    opacity: 0;
                    position: absolute;
                    bottom: 150%;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(15, 15, 15, 0.95);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    width: 220px;
                    z-index: 9999;
                    transition: all 0.2s ease-in-out;
                    pointer-events: none;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
                    backdrop-filter: blur(4px);
                }
                
                .score-wrapper:hover .score-tooltip {
                    visibility: visible;
                    opacity: 1;
                }
                
                .score-tooltip::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -8px;
                    border-width: 8px;
                    border-style: solid;
                    border-color: rgba(15, 15, 15, 0.95) transparent transparent transparent;
                }
            `}</style>
        </section>
    );
}