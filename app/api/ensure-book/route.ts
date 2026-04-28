// Dosya Yolu: app/api/ensure-book/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

// ==========================================
// YAZAR İSMİ NORMALİZASYONU (DATA NORMALIZATION LAYER)
// ==========================================
const formatAuthorName = (rawName: string | undefined): string => {
    if (!rawName || rawName === 'Unknown') return 'Unknown';

    // 1. Sondaki gereksiz noktayı temizle ("Christie, Agatha, 1890-1976." -> "Christie, Agatha, 1890-1976")
    let cleanName = rawName.replace(/\.$/, '').trim();

    // 2. Eğer virgül içeriyorsa (Kütüphane formatı: Soyad, Ad, Yıllar)
    if (cleanName.includes(',')) {
        const parts = cleanName.split(',').map(part => part.trim());

        if (parts.length >= 2) {
            // Sadece Ad ve Soyadı al, yer değiştir. Yılları çöpe at.
            cleanName = `${parts[1]} ${parts[0]}`;
        }
    }

    return cleanName;
};

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // author değişkeninin adını rawAuthor olarak alıyoruz ki temizlenmiş haliyle karışmasın
        const { titleID, title, author: rawAuthor, yearOfPublication, callNumber, isAvailable, tags } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        // 0. ADIM: YAZAR İSMİNİ TEMİZLE VE STANDARTLAŞTIR
        const cleanAuthor = formatAuthorName(rawAuthor);

        const supabase = await createClient();

        // ==========================================
        // 1. ADIM: KİTAP ZATEN SİSTEMDE VAR MI?
        // ==========================================
        let query = supabase
            .from('books')
            .select('id')
            .ilike('title', title.trim());

        if (cleanAuthor !== 'Unknown') {
            // Artık veritabanında temizlenmiş isimle arama yapıyoruz
            query = query.ilike('author', cleanAuthor);
        }

        const { data: existingBooks } = await query.limit(1);

        if (existingBooks && existingBooks.length > 0) {
            // Kitap zaten veritabanımızda varsa, doğrudan ID'sini dön (Client redirect yapacak)
            return NextResponse.json({ id: existingBooks[0].id, alreadyExisted: true });
        }


        // ==========================================
        // 2. ADIM: VERİ ZENGİNLEŞTİRME (DATA ENRICHMENT)
        // ==========================================
        let cleanLibraryIsbn: string | null = null;
        let marcTags: string[] = [];
        let googleTags: string[] = [];
        let finalIsbn: string | null = null;

        // --- 2a. İYTE Kütüphanesinden Detayları ve MARC21 etiketlerini çek ---
        if (titleID) {
            try {
                const detailsUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/lookupTitleInfo?clientID=DS_CLIENT&titleID=${titleID}&includeItemInfo=TRUE&includeCatalogingInfo=TRUE&includeAvailabilityInfo=TRUE&marcEntryFilter=ALL&json=true`;

                // Next.js cache'ini atlamak için 'no-store' kullanıyoruz
                const detailsRes = await fetch(detailsUrl, { cache: 'no-store' });
                const detailsData = await detailsRes.json();

                if (detailsData.TitleInfo && detailsData.TitleInfo.length > 0) {
                    const bookData = detailsData.TitleInfo[0];

                    // Kütüphane verisinde ISBN varsa al
                    if (bookData.ISBN && bookData.ISBN.length > 0) {
                        cleanLibraryIsbn = bookData.ISBN[0].replace(/[^0-9X]/gi, '');
                    }

                    // MARC Tags (650, 651 vb.) Çıkarma
                    if (bookData.BibliographicInfo?.MarcEntryInfo) {
                        bookData.BibliographicInfo.MarcEntryInfo.forEach((entry: any) => {
                            if (entry.entryID === "650" || entry.entryID === "651") {
                                let cleanTag = entry.text.replace(/\.$/, "").replace(/--Fiction/i, "").replace(/--Juvenile fiction/i, "").trim();
                                if (cleanTag) marcTags.push(cleanTag);
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('İYTE Library fetch error:', e);
                // İşlemi durdurmuyoruz, zenginleştirme olmadan devam edebilir.
            }
        }

        finalIsbn = cleanLibraryIsbn; // Şimdilik kütüphanenin ISBN'ini atıyoruz, yoksa aşağıda onaracağız.

        // --- 2b. GOOGLE BOOKS API SORGUSU (GELİŞTİRİLMİŞ FALLBACK SİSTEMİ) ---
        let googleUrl = "";

        if (cleanLibraryIsbn) {
            // PLAN A: Kütüphaneden gelen kesin ISBN ile arama
            googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanLibraryIsbn}`;
        } else if (title) {
            // PLAN B (FALLBACK): ISBN yoksa İsim ve Yazar NLP araması (Temizlenmiş yazar adıyla)
            const authorQuery = cleanAuthor !== 'Unknown' ? `+inauthor:${encodeURIComponent(cleanAuthor)}` : '';
            googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title.trim())}${authorQuery}&maxResults=1`;
        }

        if (googleUrl) {
            try {
                const googleRes = await fetch(googleUrl, { cache: 'no-store' });
                const googleData = await googleRes.json();

                if (googleData.items && googleData.items.length > 0) {
                    const topResult = googleData.items[0].volumeInfo;

                    // 1. Etiketleri (Genre) Kurtar
                    if (topResult.categories) {
                        googleTags = topResult.categories;
                    }

                    // 2. DATA PATCHING: Kütüphanede olmayan ISBN'i Google'dan çalıp veritabanımızı yamala
                    if (!finalIsbn && topResult.industryIdentifiers) {
                        const isbnObj = topResult.industryIdentifiers.find((id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10');
                        if (isbnObj) {
                            finalIsbn = isbnObj.identifier;
                        }
                    }
                }
            } catch (e) {
                console.error('Google Books API error:', e);
            }
        }


        // ==========================================
        // 3. ADIM: VERİLERİ HARMANLAMA
        // ==========================================
        const clientTags = tags || [];
        const combinedTags = [...new Set([...clientTags, ...marcTags, ...googleTags])];

        // Ana türü (genre) belirle. Google öncelikli, yoksa MARC, yoksa General.
        const mainGenre = googleTags.length > 0 ? googleTags[0] : (marcTags.length > 0 ? marcTags[0] : "General");


        // ==========================================
        // 4. ADIM: VERİTABANINA YAZMA
        // ==========================================
        const { data: newBook, error } = await supabase
            .from('books')
            .insert([{
                title: title.trim(),
                author: cleanAuthor,        // Temizlenmiş, standart yazar adını kaydediyoruz!
                shelf_location: callNumber || null,
                is_available: isAvailable ?? true,
                isbn: finalIsbn,            // Onarılmış (Patched) Zenginleştirilmiş Veri
                genre: mainGenre,           // Zenginleştirilmiş Veri
                tags: combinedTags,         // Zenginleştirilmiş Veri
            }])
            .select('id')
            .single();

        if (error) {
            console.error('DB insert error:', error);
            return NextResponse.json({ error: 'Failed to create book record' }, { status: 500 });
        }

        return NextResponse.json({ id: newBook.id, alreadyExisted: false });

    } catch (error) {
        console.error('Ensure book execution error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}