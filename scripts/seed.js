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
    const title = row.title ? row.title.trim() : row.Title.trim();
    const author = row.author ? row.author.trim() : row.Author.trim();
    const csvGenres = row.genres ? row.genres.split(',').map(g => g.trim()) : [];

    console.log(`\n🔍 İşleniyor: ${title} (${author})...`);

    // 0. ADIM: KİTAP ZATEN BİZDE VAR MI?
    const { data: existingBook } = await supabase
        .from('books')
        .select('id, isbn, genre, tags')
        .ilike('title', title)
        .single();

    if (existingBook) {
        console.log(`⏭️ Zaten veritabanımızda var. Eksik etiket (tag) kontrolü yapılıyor...`);

        let googleTags = [];
        const csvIsbn = (row.isbn || row.ISBN13) ? (row.isbn || row.ISBN13).replace(/[^0-9X]/gi, '') : null;
        const isbnToUse = (existingBook.isbn && existingBook.isbn.length > 9) ? existingBook.isbn : csvIsbn;

        if (isbnToUse) {
            try {
                const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnToUse}`;
                const googleRes = await fetch(googleUrl);
                const googleData = await googleRes.json();

                if (googleData.items && googleData.items[0].volumeInfo.categories) {
                    googleTags = googleData.items[0].volumeInfo.categories;
                    console.log(`   🏷️ Google'dan gelen türler: ${googleTags.join(', ')}`);
                }
            } catch (err) {
                // Sessizce geç
            }
            await delay(500);
        }

        const currentTags = existingBook.tags || [];
        const newTags = googleTags.filter(tag => !currentTags.includes(tag));

        if (newTags.length > 0) {
            const combinedTags = [...new Set([...currentTags, ...newTags])];
            const newGenre = (existingBook.genre === 'General' || !existingBook.genre) && googleTags.length > 0 ? googleTags[0] : existingBook.genre;

            const { error: updateError } = await supabase
                .from('books')
                .update({ tags: combinedTags, genre: newGenre })
                .eq('id', existingBook.id);

            if (!updateError) {
                console.log(`   ✨ GÜNCELLENDİ! Veritabanına yeni etiketler eklendi.`);
                console.log(`   📚 Kitabın Yeni Etiket Listesi: [ ${combinedTags.join(', ')} ]`);
                return 'UPDATED';
            } else {
                console.log(`   🔴 Etiket güncellenirken hata oluştu.`);
                return 'ERROR';
            }
        } else {
            console.log(`   👌 Kitabın etiketleri zaten zengin, atlanıyor.`);
            console.log(`   📚 Mevcut Etiketler: [ ${currentTags.join(', ')} ]`);
            return 'EXISTING';
        }
    }

    // ====================================================================================
    // KİTAP VERİTABANINDA YOKSA YENİDEN EKLEME BAŞLIYOR
    // ====================================================================================

    const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(title)}"&hitsToDisplay=30&includeAvailabilityInfo=true&json=true`;

    try {
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        if (!searchData.HitlistTitleInfo) {
            console.log(`❌ İYTE'de bulunamadı.`);
            return 'REJECTED';
        }

        // 🚨 PARANOYAK GÜMRÜK MEMURU
        const physicalBook = searchData.HitlistTitleInfo.find(b => {
            const isPhysical = b.materialType === "BOOK" &&
                b.callNumber &&
                !b.callNumber.toUpperCase().startsWith("XX");

            if (!isPhysical) return false;

            const libAuthor = (b.author || "").toLowerCase();
            const csvAuthor = author.toLowerCase();

            if (!libAuthor) return false;

            const authorParts = csvAuthor.split(' ');
            const lastName = authorParts[authorParts.length - 1].replace(/[^a-zğüşıöç]/gi, '');

            return libAuthor.includes(lastName);
        });

        if (!physicalBook) {
            console.log(`⚠️ Sahte eşleşme veya sadece E-Kitap. Reddedildi.`);
            return 'REJECTED';
        }

        console.log(`✅ Doğru yazar ve fiziksel kitap eşleşti! Detaylar çekiliyor...`);

        // DETAYLARI VE MARC21 TAG'LERİNİ ÇEK
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

        let cleanLibraryIsbn = null;
        if (bookData.ISBN && bookData.ISBN[0]) {
            cleanLibraryIsbn = bookData.ISBN[0].replace(/[^0-9X]/gi, '');
        }

        const csvIsbnNew = (row.isbn || row.ISBN13) ? (row.isbn || row.ISBN13).replace(/[^0-9X]/gi, '') : null;
        const isbnToUseNew = (csvIsbnNew && csvIsbnNew.length > 9) ? csvIsbnNew : cleanLibraryIsbn;

        // GOOGLE BOOKS İLE VERİ ZENGİNLEŞTİRME
        let googleTags = [];

        if (isbnToUseNew) {
            console.log(`   🌐 Google Books'tan tür aranıyor... (ISBN: ${isbnToUseNew})`);
            try {
                const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbnToUseNew}`;
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

        const combinedTags = [...new Set([...googleTags, ...csvGenres, ...marcTags])];
        const mainGenre = googleTags.length > 0 ? googleTags[0] : (csvGenres[0] || marcTags[0] || "General");

        const isAvailableNow = physicalBook.titleAvailabilityInfo?.totalCopiesAvailable > 0;

        const rawCallNumber = physicalBook.callNumber || "";
        const cleanShelfLocation = rawCallNumber.replace(/\|[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();

        // SUPABASE'E KAYDET
        const { error } = await supabase
            .from('books')
            .insert({
                title: title,
                author: author || physicalBook.author.replace(/,$/, "").trim(),
                isbn: isbnToUseNew,
                genre: mainGenre,
                tags: combinedTags,
                shelf_location: cleanShelfLocation,
                is_available: isAvailableNow
            });

        if (error) {
            console.error(`🔴 Kayıt Hatası:`, error.message);
            return 'ERROR';
        } else {
            console.log(`💾 Supabase'e başarıyla EKLENDİ. Tür: ${mainGenre}`);
            console.log(`   📚 Harmanlanan Tüm Etiketler: [ ${combinedTags.join(', ')} ]`);
            return 'ADDED';
        }

    } catch (error) {
        console.error(`💥 Hata oluştu:`, error.message);
        return 'ERROR';
    }
}

async function runSeeder() {
    console.log("🚀 Akıllı Zenginleştirmeli Tohumlama Operasyonu Başlıyor...\n");
    const booksToProcess = [];

    const stats = {
        totalProcessed: 0,
        addedSuccessfully: 0,
        updatedSuccessfully: 0,
        alreadyExists: 0,
        rejectedOrNotFound: 0,
        errors: 0
    };

    // İŞLEYECEĞİN DOSYANIN ADINI BURAYA YAZ:
    fs.createReadStream('classics-large_1.csv')
        .pipe(csv())
        .on('data', (data) => booksToProcess.push(data))
        .on('end', async () => {
            console.log(`📋 CSV dosyasından ${booksToProcess.length} kitap okundu. İstekler başlıyor...\n`);

            for (const row of booksToProcess) {
                stats.totalProcessed++;
                const status = await processBook(row);

                if (status === 'ADDED') stats.addedSuccessfully++;
                else if (status === 'UPDATED') stats.updatedSuccessfully++;
                else if (status === 'EXISTING') stats.alreadyExists++;
                else if (status === 'REJECTED') stats.rejectedOrNotFound++;
                else if (status === 'ERROR') stats.errors++;

                await delay(3000);
            }

            console.log(`\n===========================================`);
            console.log(`🎉 TOHUMLAMA VE GÜNCELLEME TAMAMLANDI 🎉`);
            console.log(`===========================================`);
            console.log(`📊 Toplam İşlenen Kitap : ${stats.totalProcessed}`);
            console.log(`✅ Sıfırdan Eklenen (Hit): ${stats.addedSuccessfully}`);
            console.log(`✨ Etiketi Güncellenen  : ${stats.updatedSuccessfully}`);
            console.log(`⏭️ Zaten Tam Olanlar    : ${stats.alreadyExists}`);
            console.log(`⚠️ Bulunamayan/Ret      : ${stats.rejectedOrNotFound}`);
            console.log(`💥 Hata Alanlar         : ${stats.errors}`);
            console.log(`===========================================\n`);
        });
}

runSeeder();