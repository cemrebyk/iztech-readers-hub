// lib/bookCover.ts

export async function getBookCover(isbn?: string, title?: string, author?: string): Promise<string | null> {
  // 1. ADIM: ISBN ile Kesin Arama (En Yüksek Öncelik)
  if (isbn) {
    const cleanIsbn = isbn.replace(/[- ]/g, "");
    const coverByIsbn = await fetchFromGoodreads(`isbn=${cleanIsbn}`);
    if (coverByIsbn) return coverByIsbn;
  }

  // 2. ADIM: ISBN ile bulunamadıysa veya ISBN yoksa Başlık + Yazar ile dene
  if (title) {
    const searchQuery = `book_title=${encodeURIComponent(title)}&author_name=${encodeURIComponent(author || '')}`;
    const coverByText = await fetchFromGoodreads(searchQuery);
    if (coverByText) return coverByText;
  }

  // İki yöntem de başarısızsa null dön (Gradyanlar çalışsın)
  return null;
}

// Ortak Fetch Fonksiyonu
async function fetchFromGoodreads(queryString: string): Promise<string | null> {
  try {
    const apiUrl = `https://bookcover.longitood.com/bookcover?${queryString}&image_size=large`;

    const res = await fetch(apiUrl, {
      next: { revalidate: 86400 }, // 24 saat önbellek
    });

    if (!res.ok) return null;

    const data = await res.json();

    // API'den gelen URL'yi kontrol et
    if (data && data.url) {
      const url = data.url.replace("http:", "https:");

      // Yine de o meşhur jenerik "Image not available" resmini kontrol edelim
      if (url.includes("blank_book") || url.includes("noimage")) {
        return null;
      }

      return url;
    }
  } catch (error) {
    console.error("Goodreads API Hatası:", error);
  }
  return null;
}