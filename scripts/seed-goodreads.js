require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase Bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processGoodreadsBook(row) {
    if (!row.Title || !row.Author) return;

    // 1. VERİ TEMİZLİĞİ (Goodreads'in parantez içi seri isimlerini sil)
    const rawTitle = row.Title.trim();
    const cleanTitle = rawTitle.replace(/\s*\(.*?\)\s*$/, '').trim();
    const author = row.Author.trim();

    console.log(`\n🔍 İşleniyor: ${cleanTitle} (${author})...`);

    // 0. ADIM: KİTAP ZATEN BİZDE VAR MI?
    const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .ilike('title', cleanTitle)
        .single();

    if (existingBook) {
        console.log(`⏭️ Zaten veritabanımızda var, atlanıyor.`);
        return;
    }

    // 1. ADIM: KÜTÜPHANE API'SİNDE ARA
    const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(cleanTitle)}"&hitsToDisplay=30&includeAvailabilityInfo=true&json=true`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.HitlistTitleInfo) {
            console.log(`❌ İYTE'de bulunamadı.`);
            return;
        }

        // 🚨 PARANOYAK GÜMRÜK MEMURU v2 (Yazar + Başlık Doğrulaması) 🚨
        const physicalBook = searchData.HitlistTitleInfo.find(b => {
            // A) Fiziksel mi?
            const isPhysical = b.materialType === "BOOK" &&
                b.callNumber &&
                !b.callNumber.toUpperCase().startsWith("XX");

            if (!isPhysical) return false;

            // B) Yazar Gerçekten Eşleşiyor Mu?
            const libAuthor = (b.author || "").toLowerCase();
            const csvAuthor = author.toLowerCase();
            if (!libAuthor) return false;

            const authorParts = csvAuthor.split(' ');
            const lastName = authorParts[authorParts.length - 1].replace(/[^a-zğüşıöç]/gi, '');
            if (!libAuthor.includes(lastName)) return false;

            // C) 🛡️ BAŞLIK GERÇEKTEN EŞLEŞİYOR MU?
            const libTitle = (b.title || "").toLowerCase();

            // CSV'deki başlıktan gereksiz kelimeleri ve noktalama işaretlerini at
            const csvTitleWords = cleanTitle.toLowerCase()
                .replace(/[^\w\sğüşıöç]/gi, ' ')
                .split(/\s+/) // Boşluklardan böl
                .filter(w => w.length > 2 && !['the', 'and', 'of', 'for', 'with', 'bir', 've'].includes(w));

            // Eğer başlık tek kelimeyse veya kısaysa
            if (csvTitleWords.length === 0) {
                return libTitle.includes(cleanTitle.toLowerCase().replace(/[^\w\sğüşıöç]/gi, ''));
            }

            // Kütüphaneden dönen başlıkta, aradığımız anahtar kelimelerin TÜMÜ geçmek zorunda!
            const isTitleMatch = csvTitleWords.every(word => libTitle.includes(word));

            return isTitleMatch;
        });

        if (!physicalBook) {
            console.log(`⚠️ Sahte/Farklı kitap eşleşmesi veya sadece E-Kitap. Reddedildi.`);
            return;
        }

        console.log(`✅ Doğru yazar, doğru kitap ve fiziksel kopya eşleşti! Detaylar çekiliyor...`);

        // 2. ADIM: DETAYLARI VE MARC21 TAG'LERİNİ ÇEK (Informascope)
        const detailsUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/lookupTitleInfo?clientID=DS_CLIENT&titleID=${physicalBook.titleID}&includeItemInfo=TRUE&includeCatalogingInfo=TRUE&includeAvailabilityInfo=TRUE&marcEntryFilter=ALL&json=true`;

        await delay(1000); // İYTE sunucusunu dinlendir

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const bookData = detailsData.TitleInfo[0];

        let marcTags = [];
        if (bookData.BibliographicInfo?.MarcEntryInfo) {
            bookData.BibliographicInfo.MarcEntryInfo.forEach(entry => {
                if (entry.entryID === "650" || entry.entryID === "651") {
                    let cleanTag = entry.text.replace(/\.$/, "").replace(/--Fiction/i, "").replace(/--Juvenile fiction/i, "").trim();
                    if (cleanTag) marcTags.push(cleanTag);
                }
            });
        }

        // ISBN Yakalama (Gerekirse Google için kullanacağız)
        let cleanLibraryIsbn = null;
        if (bookData.ISBN && bookData.ISBN[0]) {
            cleanLibraryIsbn = bookData.ISBN[0].replace(/[^0-9X]/gi, '');
        }

        // 🌟 3. ADIM: GOOGLE BOOKS API İLE VERİ ZENGİNLEŞTİRME (DATA ENRICHMENT) 🌟
        let googleTags = [];

        // Goodreads CSV'sindeki ISBN13 hücresini temizle (İçindeki ="978..." gibi gariplikleri sil)
        const csvIsbn = row.ISBN13 ? row.ISBN13.replace(/[^0-9X]/gi, '') : null;
        const isbnForGoogle = (csvIsbn && csvIsbn.length >= 10) ? csvIsbn : cleanLibraryIsbn;

        if (isbnForGoogle) {
            console.log(`   🌐 Google Books'tan tür (genre) aranıyor... (ISBN: ${isbnForGoogle})`);
            try {
                const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnForGoogle}`;
                const googleRes = await fetch(googleUrl);
                const googleData = await googleRes.json();

                if (googleData.items && googleData.items[0].volumeInfo.categories) {
                    googleTags = googleData.items[0].volumeInfo.categories;
                    console.log(`   🏷️ Google'dan gelen türler: ${googleTags.join(', ')}`);
                } else {
                    console.log(`   ⚠️ Google kitabı buldu ama tür bilgisi yok.`);
                }
            } catch (err) {
                console.log(`   ⚠️ Google Books API bağlantı hatası, atlanıyor.`);
            }
            await delay(500);
        }

        // 4. TAG'LERİ HARMANLA VE RAF NUMARASINI TEMİZLE
        const finalTags = [...new Set([...googleTags, ...marcTags])];
        const mainGenre = googleTags.length > 0 ? googleTags[0] : (marcTags[0] || "General");

        const isAvailableNow = physicalBook.titleAvailabilityInfo?.totalCopiesAvailable > 0;

        // 🛡️ YENİ: RAF NUMARASINI TEMİZLE (MARC |B, |A hatalarını siler)
        // |B'yi veya |A'yı boşlukla değiştirip fazladan boşlukları temizler
        const rawCallNumber = physicalBook.callNumber || "";
        const cleanShelfLocation = rawCallNumber.replace(/\|[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();

        // 5. ADIM: SUPABASE'E KAYDET
        const { error } = await supabase
            .from('books')
            .insert({
                title: cleanTitle,
                author: author || physicalBook.author.replace(/,$/, "").trim(),
                isbn: isbnForGoogle,
                genre: mainGenre,
                tags: finalTags,
                shelf_location: cleanShelfLocation, // 👈 Temizlenmiş raf numarası
                is_available: isAvailableNow
            });

        if (error) {
            console.error(`🔴 Kayıt Hatası:`, error.message);
        } else {
            console.log(`💾 Supabase'e başarıyla EKLENDİ. Tür: ${mainGenre}`);
        }

    } catch (error) {
        console.error(`💥 Hata oluştu:`, error.message);
    }
}

async function runGoodreadsSeeder() {
    console.log("🚀 Güvenlikli Goodreads Tohumlama Operasyonu Başlıyor...\n");
    const booksToProcess = [];

    fs.createReadStream('goodreads_library.csv')
        .pipe(csv())
        .on('data', (data) => booksToProcess.push(data))
        .on('end', async () => {
            console.log(`📋 CSV dosyasından ${booksToProcess.length} kitap okundu. İstekler başlıyor...\n`);

            for (const row of booksToProcess) {
                await processGoodreadsBook(row);
                await delay(3000);
            }

            console.log("\n🎉 Tüm tohumlama işlemi başarıyla tamamlandı!");
        });
}

runGoodreadsSeeder();