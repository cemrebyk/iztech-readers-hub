"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RemoveFromListAction({ listId, bookId }: { listId: string, bookId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRemove = async () => {
        if (!confirm("Bu kitabı listeden çıkarmak istediğinize emin misiniz?")) return;

        setLoading(true);
        const { error } = await supabase
            .from('list_items')
            .delete()
            .eq('list_id', listId)
            .eq('book_id', bookId);

        if (error) {
            alert("Hata: " + error.message);
        } else {
            // Sayfayı yenileyerek listenin güncellenmesini sağla
            router.refresh();
        }
        setLoading(false);
    };

    return (
        <button
            onClick={handleRemove}
            disabled={loading}
            style={{
                background: 'none',
                border: '1px solid #ff4d4f',
                color: '#ff4d4f',
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#fff1f0')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
        >
            {loading ? '...' : '🗑️ Kaldır'}
        </button>
    );
}