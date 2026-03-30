require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase Bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processBook(row) {
    const title = row.title.trim();
    const author = row.author.trim();
    const csvGenres = row.genres ? row.genres.split(',').map(g => g.trim()) : [];

    console.log(`\n🔍 İşleniyor: ${title} (${author})...`);

    // 0. ADIM: KİTAP ZATEN BİZDE VAR MI?
    const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .ilike('title', title)
        .single();

    if (existingBook) {
        console.log(`⏭️ Zaten veritabanımızda var, atlanıyor.`);
        return;
    }

    // 1. ADIM: KÜTÜPHANE API'SİNDE ARA
    const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(title)}"&hitsToDisplay=5&includeAvailabilityInfo=true&json=true`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.HitlistTitleInfo) {
            console.log(`❌ İYTE'de bulunamadı.`);
            return;
        }

        // 🚨 PARANOYAK GÜMRÜK MEMURU (FİLTRE) 🚨
        const physicalBook = searchData.HitlistTitleInfo.find(b => {
            // A) Fiziksel mi?
            const isPhysical = b.materialType === "BOOK" &&
                b.callNumber &&
                !b.callNumber.toUpperCase().startsWith("XX");

            if (!isPhysical) return false;

            // B) Yazar Gerçekten Eşleşiyor Mu?
            const libAuthor = (b.author || "").toLowerCase(); // Kütüphanedeki yazar
            const csvAuthor = author.toLowerCase(); // CSV'deki yazar

            if (!libAuthor) return false; // Yazar bilgisi yoksa risk alma, reddet!

            // CSV yazarının soyadını al (Örn: "George Orwell" -> "orwell")
            // Noktalama işaretlerini temizle ki "J.K." gibi şeyler sorun yaratmasın
            const authorParts = csvAuthor.split(' ');
            const lastName = authorParts[authorParts.length - 1].replace(/[^a-zğüşıöç]/gi, '');

            // Kütüphaneden gelen yazar bilgisinin içinde bu soyadı geçiyor mu?
            const isAuthorMatch = libAuthor.includes(lastName);

            return isAuthorMatch;
        });

        if (!physicalBook) {
            console.log(`⚠️ Sahte eşleşme veya sadece E-Kitap. Reddedildi.`);
            return;
        }

        console.log(`✅ Doğru yazar ve fiziksel kitap eşleşti! Detaylar çekiliyor...`);

        // 2. ADIM: DETAYLARI VE MARC21 TAG'LERİNİ ÇEK
        const detailsUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/lookupTitleInfo?clientID=DS_CLIENT&titleID=${physicalBook.titleID}&includeItemInfo=TRUE&includeCatalogingInfo=TRUE&includeAvailabilityInfo=TRUE&marcEntryFilter=ALL&json=true`;

        await delay(1000);

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

        const combinedTags = [...new Set([...csvGenres, ...marcTags])];

        let cleanIsbn = null;
        if (bookData.ISBN && bookData.ISBN[0]) {
            cleanIsbn = bookData.ISBN[0].replace(/[^0-9X]/gi, '');
        }

        const isAvailableNow = physicalBook.titleAvailabilityInfo?.totalCopiesAvailable > 0;

        // 3. ADIM: SUPABASE'E KAYDET
        const { error } = await supabase
            .from('books')
            .insert({
                title: title,
                author: author || physicalBook.author.replace(/,$/, "").trim(),
                isbn: cleanIsbn,
                genre: csvGenres[0] || "General",
                tags: combinedTags,
                shelf_location: physicalBook.callNumber,
                is_available: isAvailableNow
            });

        if (error) {
            console.error(`🔴 Kayıt Hatası:`, error.message);
        } else {
            console.log(`💾 Supabase'e başarıyla EKLENDİ.`);
        }

    } catch (error) {
        console.error(`💥 Hata oluştu:`, error.message);
    }
}

async function runSeeder() {
    console.log("🚀 Güvenlikli Tohumlama Operasyonu Başlıyor...\n");
    const booksToProcess = [];

    fs.createReadStream('books3.csv')
        .pipe(csv())
        .on('data', (data) => booksToProcess.push(data))
        .on('end', async () => {
            console.log(`📋 CSV dosyasından ${booksToProcess.length} kitap okundu. İstekler başlıyor...\n`);

            for (const row of booksToProcess) {
                await processBook(row);
                await delay(3000); // Kütüphaneyi yormamak için 3 saniye bekle
            }

            console.log("\n🎉 Tüm tohumlama işlemi başarıyla tamamlandı!");
        });
}

runSeeder();