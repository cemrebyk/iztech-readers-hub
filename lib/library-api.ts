// lib/library-api.ts

// 1. Dönen verinin TypeScript Tip Tanımlaması
export interface LibraryBook {
    titleID: number;
    title: string;
    author: string;
    yearOfPublication: number;
    materialType: string;
    callNumber: string; // Kütüphanedeki raf numarası
    titleAvailabilityInfo: {
        totalCopiesAvailable: number;
    };
}

// 2. Arama ve Filtreleme Fonksiyonu
export async function searchPhysicalBooks(searchTerm: string): Promise<LibraryBook[]> {
    if (!searchTerm) return [];

    // API Uç Noktası (Maksimum 50 sonuç çekiyoruz, json=true ekli)
    const url = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${searchTerm}"&hitsToDisplay=50&includeAvailabilityInfo=true&json=true`;

    try {
        // Kütüphane stok durumu anlık değişebileceği için cache: 'no-store' kullanıyoruz
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const data = await response.json();

        // Eğer sonuç yoksa boş dizi dön
        if (!data.HitlistTitleInfo) return [];

        // EN KRİTİK NOKTA: Sadece fiziksel kitapları ("BOOK") filtrele
        const physicalBooks = data.HitlistTitleInfo.filter(
            (book: any) => book.materialType === "BOOK"
        );

        return physicalBooks;

    } catch (error) {
        console.error("Kütüphane verisi çekilemedi:", error);
        return [];
    }
}