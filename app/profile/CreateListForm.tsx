"use client";
import { createBookList } from '../../lib/actions/lists';
import { useState } from 'react';

export default function CreateListForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // TypeScript hatasını çözen "Wrapper" fonksiyon
    const handleSubmit = async (formData: FormData) => {
        setErrorMsg(null); // Eski hatayı temizle

        const result = await createBookList(formData);

        // Eğer fonksiyondan bir hata objesi döndüyse
        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false); // Başarılıysa formu kapat
        }
    };

    return (
        <div style={{ marginBottom: '30px' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-secondary"
            >
                {isOpen ? 'Kapat' : '+ Yeni Liste Oluştur'}
            </button>

            {isOpen && (
                <form action={handleSubmit} style={{ marginTop: '20px', padding: '25px', background: 'var(--color-cream)', borderRadius: '12px', border: '1px solid var(--color-sepia)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {errorMsg && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Liste Adı</label>
                        <input
                            name="name"
                            required
                            pattern=".*\S.*" // Sadece boşluk girilmesini engeller
                            placeholder="Örn: Bitirme Projesi Kaynakları"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-sepia)', fontSize: '1rem', background: 'white' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Açıklama (Opsiyonel)</label>
                        <textarea
                            name="description"
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-sepia)', fontSize: '1rem', minHeight: '100px', background: 'white', resize: 'vertical' }}
                            placeholder="Bu listenin amacı nedir?"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                        Kaydet
                    </button>
                </form>
            )}
        </div>
    );
}