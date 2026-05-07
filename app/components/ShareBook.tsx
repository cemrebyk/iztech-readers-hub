"use client";

import React, { useState } from 'react';

interface ShareBookProps {
  bookTitle: string;
  bookId: string;
}

const ShareBook: React.FC<ShareBookProps> = ({ bookTitle, bookId }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleShare = async () => {
    // window nesnesine sadece client-side'da erişilir.
    const shareUrl = `${window.location.origin}/books/${bookId}`;
    const shareText = `Check out "${bookTitle}" at Iztech Reader's Hub!\n\nLink: ${shareUrl}`;

    // 1. Plan: Modern Web Share API (Mobil Cihazlar ve Destekleyen Tarayıcılar İçin)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Iztech Reader's Hub",
          text: `Check out "${bookTitle}"!`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // Kullanıcı paylaşım menüsünü iptal ederse hata fırlatma
        if ((error as Error).name !== 'AbortError') {
          console.error('Share menu error:', error);
        }
      }
    }

    // 2. Plan: Clipboard API (Panoya Kopyalama - Masaüstü ve Desteklemeyen Sistemler İçin)
    try {
      await navigator.clipboard.writeText(shareText);
      setIsCopied(true);

      // Kullanıcıya geribildirim verdikten 2 saniye sonra butonu eski haline getir
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      alert('Failed to copy link. Please copy manually: ' + shareUrl);
    }
  };

  return (
    <button
      onClick={handleShare}
      // UX İyileştirmesi: min-w-[130px] ile layout shift (zıplama) önlendi. px-6 ve py-2.5 ile buton ferahlatıldı.
      className={`flex items-center justify-center gap-2 px-6 py-2.5 min-w-[130px] text-white rounded-md transition-all shadow-sm active:scale-95 ${isCopied ? 'bg-green-600 hover:bg-green-700' : 'bg-[#9a0e20] hover:bg-[#7a0b19]'
        }`}
      aria-label="Share this book"
    >
      {isCopied ? (
        // Copied (Check) İkonu - Boyutlar 18x18 yapıldı
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        // Share İkonu
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      )}
      <span style={{ fontSize: '0.95rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>
        {isCopied ? 'Copied!' : 'Share'}
      </span>
    </button>
  );
};

export default ShareBook;