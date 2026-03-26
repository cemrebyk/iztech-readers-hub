"use client";

import { useState } from "react";
import { deleteBookList } from "../../lib/actions/lists";
import { useRouter } from "next/navigation";

export default function DeleteListButton({ listId, listName, redirectAfterDelete = false }: { listId: string, listName: string, redirectAfterDelete?: boolean }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async (e: React.MouseEvent) => {
        // Prevent clicking the Link if this button is inside one
        e.preventDefault();
        e.stopPropagation();

        if (confirm(`"${listName}" adlı listeyi silmek istediğinize emin misiniz?`)) {
            setLoading(true);
            try {
                await deleteBookList(listId);
                if (redirectAfterDelete) {
                    router.push("/profile");
                }
            } catch (error: any) {
                alert(error.message || "Liste silinirken bir hata oluştu.");
                setLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            style={{
                backgroundColor: 'transparent',
                color: '#c5221f',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '1.2rem',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease',
            }}
            title="Listeyi Sil"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fce8e6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
            {loading ? '⌛' : '🗑️'}
        </button>
    );
}
