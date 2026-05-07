"use client"

import { useState } from 'react';

export default function GoodreadsImport() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = async (file: File) => {
        if (!file || !file.name.endsWith('.csv')) {
            setMessage('❌ Lütfen geçerli bir CSV dosyası seçin.');
            return;
        }

        setLoading(true);
        setMessage('⏳ Verileriniz işleniyor, bu işlem kitap sayısına bağlı olarak birkaç dakika sürebilir...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/import-goodreads', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                setMessage(`✅ Başarılı: ${result.message}`);
            } else {
                setMessage(`❌ Hata: ${result.error}`);
            }
        } catch (error) {
            setMessage('❌ Yükleme sırasında beklenmeyen bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    return (
        <div
            className={`goodreads-dropzone ${isDragging ? 'dragging' : ''} ${loading ? 'uploading' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <div className="goodreads-dropzone-icon">📄</div>
            <p className="goodreads-dropzone-text">
                CSV dosyanı buraya sürükle veya
            </p>
            <label className="goodreads-browse-btn">
                Dosya Seç
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleInputChange}
                    disabled={loading}
                    style={{ display: 'none' }}
                />
            </label>
            <p className="goodreads-dropzone-hint">goodreads_library_export.csv</p>

            {message && (
                <div className={`goodreads-message ${message.startsWith('✅') ? 'success' : message.startsWith('❌') ? 'error' : 'info'}`}>
                    {message}
                </div>
            )}
        </div>
    );
}