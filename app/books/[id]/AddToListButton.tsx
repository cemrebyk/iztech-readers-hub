"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Client tarafındaki supabase örneği

export default function AddToListButton({ bookId, userLists }: { bookId: string, userLists: any[] }) {
    const [loading, setLoading] = useState(false);

    const handleAdd = async (listId: string) => {
        setLoading(true);
        const { error } = await supabase
            .from('list_items')
            .insert([{ list_id: listId, book_id: bookId }]);

        if (error) {
            alert("Kitap zaten listede veya bir hata oluştu.");
        } else {
            alert("Listeye eklendi!");
        }
        setLoading(false);
    };

    return (
        <div className="mt-4">
            <h3 className="text-sm font-semibold">Listelerime Ekle</h3>
            <select
                onChange={(e) => handleAdd(e.target.value)}
                disabled={loading}
                className="mt-1 block w-full border rounded p-2 text-black"
            >
                <option value="">Liste Seçin...</option>
                {userLists.map(list => (
                    <option key={list.id} value={list.id}>{list.name}</option>
                ))}
            </select>
        </div>
    );
}