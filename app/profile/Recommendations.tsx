"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getBookCover } from '../../lib/bookCover'
import Link from 'next/link'

interface Recommendation {
    p_id: string;
    p_title: string;
    p_author: string;
    p_genre: string;
    p_isbn: string;
    p_is_available: boolean;
    p_recommendation_score: number;
    p_score_details: Record<string, number>;
    coverUrl?: string | null;
}

export default function Recommendations({ userId }: { userId: string }) {
    const [recs, setRecs] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecs = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_inventory_aware_recommendations', {
                target_user_id: userId
            });

            if (error) throw error;

            // Data boş olsa bile loading'i kapatmalıyız
            if (!data || data.length === 0) {
                setRecs([]);
                setLoading(false);
                return;
            }

            const processedRecs = [];
            for (const book of data) {
                try {
                    const coverUrl = await getBookCover(book.p_isbn, book.p_title, book.p_author);
                    processedRecs.push({ ...book, coverUrl });
                } catch (err) {
                    processedRecs.push({ ...book, coverUrl: null });
                }
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            setRecs(processedRecs);
        } catch (err: any) {
            console.error("Öneri Hatası:", err.message);
            setRecs([]); // Hata durumunda boş liste göster, takılı kalma
        } finally {
            setLoading(false); // Her koşulda loading'i kapat
        }
    };

    useEffect(() => {
        fetchRecs();
    }, [userId]);

    // "İlgilenmiyorum" aksiyonu - Optimistic UI Update
    // handleHideBook fonksiyonunu bu şekilde revize et
    const handleHideBook = async (e: React.MouseEvent, bookId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // MİMARİ KARAR: insert yerine upsert kullanarak "Duplicate Key" hatasını engelliyoruz
        const { error } = await supabase
            .from('reading_list')
            .upsert(
                {
                    user_id: userId,
                    book_id: bookId,
                    status: 'hidden'
                },
                { onConflict: 'user_id, book_id' } // Bu sütunlarda çakışma olursa güncelle
            );

        if (error) {
            console.error("Kalıcılık Hatası (Persistence Error):", error.message);
            return;
        }

        // Başarılıysa state'den çıkar
        setRecs(prev => prev.filter(b => b.p_id !== bookId));
    };



    if (loading) return (
        <div className="loading-state">
            ⏳ Hub Zekası senin için kütüphaneyi tarıyor...
        </div>
    );

    if (recs.length === 0) return null;

    return (
        <section className="recs-section">
            <h2 className="recs-title">✨ Senin İçin Seçtiklerimiz</h2>

            <div className="recs-grid">
                {recs.map((book) => (
                    <div key={book.p_id} className="recs-card-wrapper">
                        <Link href={`/books/${book.p_id}`} className="recs-link">
                            <div className="recs-card">
                                {/* Gizle Butonu */}
                                <button
                                    onClick={(e) => handleHideBook(e, book.p_id)}
                                    className="recs-hide-btn"
                                    type="button" // Form submit'i engellemek için önemli
                                >
                                    ✕
                                </button>

                                <div className="recs-cover" style={{
                                    background: book.coverUrl ? `url(${book.coverUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #9a0e20 0%, #6b0a17 100%)'
                                }}>
                                    {!book.coverUrl && <span>{book.p_title}</span>}
                                </div>

                                <div className="recs-info">
                                    <h4>{book.p_title}</h4>
                                    <p>{book.p_author}</p>

                                    <div className="recs-score-box">
                                        <span className="recs-badge">🎯 %{Math.round(book.p_recommendation_score)} Uyum</span>

                                        {/* XAI Tooltip */}
                                        <div className="recs-tooltip">
                                            <div className="tooltip-header">Karar Analizi</div>
                                            {Object.entries(book.p_score_details).map(([key, val]) => (
                                                <div key={key} className="tooltip-row">
                                                    <span>{key}:</span>
                                                    <span style={{ color: val < 0 ? '#ff7675' : '#55efc4' }}>
                                                        {val > 0 ? `+${val}` : val}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .recs-section { margin-top: 50px; padding: 0 10px; }
                .recs-title { font-size: 1.6rem; font-weight: 800; color: #1a1a1a; margin-bottom: 20px; border-left: 5px solid #9a0e20; padding-left: 15px; }
                .recs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 25px; }
                .recs-card-wrapper { position: relative; }
                .recs-card { background: #fff; border-radius: 12px; border: 1px solid #eee; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(0,0,0,0.05); position: relative;
}
                .recs-card:hover { transform: translateY(-8px); box-shadow: 0 12px 25px rgba(0,0,0,0.1); }
                
                .recs-hide-btn { position: absolute; top: 10px; right: 10px; z-index: 10; background: rgba(0,0,0,0.4); color: white; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; backdrop-filter: blur(5px); transition: 0.2s; }
                .recs-hide-btn:hover { background: #9a0e20; transform: scale(1.1); }

                .recs-cover { height: 260px; display: flex; align-items: center; justify-content: center; text-align: center; color: white; font-weight: bold; padding: 10px; font-size: 0.9rem; overflow: hidden; border-top-left-radius: 12px;  border-top-right-radius: 12px;
}
                .recs-info { padding: 15px; }
                .recs-info h4 { margin: 0; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .recs-info p { font-size: 0.8rem; color: #666; margin: 5px 0 12px 0; }

                .recs-score-box { position: relative; display: inline-block; cursor: help; }
                .recs-badge { background: #fdf2f2; color: #9a0e20; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid #f9d5d5; }

                .recs-tooltip { visibility: hidden; opacity: 0; position: absolute; bottom: 110%; left: 50%; transform: translateX(-50%); background: rgba(15, 15, 15, 0.98); color: #fff; padding: 15px; border-radius: 10px; width: 210px; font-size: 0.75rem; z-index: 9999; transition: all 0.2s ease-in-out; box-shadow: 0 10px 30px rgba(0,0,0,0.4); pointer-events: none;}
                .recs-score-box:hover .recs-tooltip { visibility: visible; opacity: 1; }
                .tooltip-header { border-bottom: 1px solid #333; margin-bottom: 8px; padding-bottom: 5px; font-weight: bold; color: #9a0e20; text-transform: uppercase; }
                .tooltip-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                
                .loading-state { padding: 80px; text-align: center; color: #888; font-weight: 500; font-size: 1.1rem; }
            `}</style>
        </section>
    );
}