export async function getBookCover(isbn?: string, title?: string, author?: string): Promise<string | null> {
    if (isbn) {
        const cleanIsbn = isbn.replace(/[- ]/g, "");
        const cover = await fetchFromGoogle(`isbn:${cleanIsbn}`);
        if (cover) return cover;
    }

    if (title) {
        const searchQuery = `${title} ${author || ''}`.trim();
        const cover = await fetchFromGoogle(encodeURIComponent(searchQuery));
        if (cover) return cover;
    }

    return null;
}

async function fetchFromGoogle(query: string): Promise<string | null> {
    try {
        const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`, {
            next: { revalidate: 86400 }
        });
        const data = await res.json();

        if (data.items && data.items[0]?.volumeInfo?.imageLinks) {
            const links = data.items[0].volumeInfo.imageLinks;

            // En yüksek kaliteli versiyonu seç
            const rawUrl = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail;

            if (!rawUrl) return null;

            /**
             * GELİŞMİŞ FİLTRELEME:
             * 1. Google'ın placeholder görselleri genelde 'printsec=frontcover' parametresini İÇERMEZ.
             * 2. URL'de 'blank_book', 'noimage' veya 'content?id=-' (negatif ID) varsa bunlar sahtedir.
             */
            const isPlaceholder =
                rawUrl.includes("blank_book") ||
                rawUrl.includes("noimage") ||
                rawUrl.includes("books/content?id=-") ||
                !rawUrl.includes("printsec=frontcover");

            if (isPlaceholder) {
                // Bu görseli reddediyoruz ki gradyan fallback'i çalışsın
                return null;
            }

            // Kaliteyi artır ve HTTPS yap
            let highResUrl = rawUrl.replace("http:", "https:");
            highResUrl = highResUrl.replace(/zoom=\d/, "zoom=3");
            highResUrl = highResUrl.replace("&edge=curl", "");

            return highResUrl;
        }
    } catch (error) {
        console.error("Google Books Fetch Error:", error);
    }
    return null;
}