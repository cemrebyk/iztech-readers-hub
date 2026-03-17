"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AddToListAction({ bookId, userLists }: { bookId: string, userLists: any[] }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    const handleAdd = async (listId: string) => {
        if (!listId) return;
        setLoading(true);
        setStatus("⌛ Ekleniyor...");

        // UUID (string) yapısına geçtiğimiz için parseInt/Number işlemlerini sildik.
        // Boşluk ihtimaline karşı sadece trim() yapmamız yeterli.
        const cleanBookId = String(bookId).trim();

        // Veritabanı ekleme işlemi
        const { error } = await supabase
            .from('list_items')
            .insert([
                {
                    list_id: listId,
                    book_id: cleanBookId // Artık UUID olarak (string) gönderiliyor
                }
            ]);

        if (error) {
            console.error("Supabase Hatası:", error);
            if (error.code === '23505') {
                setStatus("⚠️ Bu kitap zaten bu listede.");
            } else {
                setStatus(`❌ Hata: ${error.message}`);
            }
        } else {
            setStatus("✅ Başarıyla eklendi!");
        }
        setLoading(false);
    };

    return (
        <div style={{ marginTop: '20px' }}>
            <select
                onChange={(e) => handleAdd(e.target.value)}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '2px solid #9a0e20', // IYTE Red
                    color: 'black',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <option value="">➕ Okuma Listesine Ekle...</option>
                {userLists.map((list: any) => (
                    <option key={list.id} value={list.id}>
                        {list.name}
                    </option>
                ))}
            </select>

            {status && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '0.9rem',
                    color: status.includes('✅') ? '#2e7d32' : '#9a0e20',
                    fontWeight: 'bold'
                }}>
                    {status}
                </p>
            )}
        </div>
    );
}