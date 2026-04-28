require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

// Supabase Bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🧹 YAZAR İSMİ TEMİZLEME: "Adıvar, Halide Edib, 1885-1964," -> "Halide Edib Adıvar"
function formatAuthor(rawAuthor) {
    if (!rawAuthor) return "Bilinmeyen Yazar";

    // Yazar ismindeki tarihleri ve ekstra noktalama işaretlerini uçur
    let cleanStr = rawAuthor.replace(/[0-9\-]/g, '').replace(/\./g, '').trim();

    const parts = cleanStr.split(',').map(p => p.trim()).filter(p => p.length > 0);

    if (parts.length >= 2) {
        const lastName = parts[0];
        const firstName = parts[1];
        return `${firstName} ${lastName}`.trim();
    }

    return cleanStr.replace(/,/g, '').trim();
}

// 🧹 KİTAP İSMİ TEMİZLEME: Toleranslı arama için ": roman", "/ yazar" gibi kalıntıları sil
function cleanTitle(rawTitle) {
    if (!rawTitle) return "";
    let t = rawTitle.trim();
    t = t.replace(/\s*:\s*roman/i, '');
    t = t.replace(/\s*:\s*öykü/i, '');
    t = t.replace(/\s*:\s*hikaye/i, '');
    t = t.replace(/\[.*?\]/g, '').trim(); // Köşeli parantez içlerini sil
    t = t.replace(/[,:\/]+$/, '').trim(); // Sonda kalan garip noktalama işaretlerini sil
    return t;
}

async function processBook(row) {
    const originalTitle = row.Title ? row.Title.trim() : "";
    const searchTitle = cleanTitle(originalTitle);
    const author = formatAuthor(row.Author);
    const callNumber = row.CallNumber ? row.CallNumber.trim() : "";
    const subjectTag = row.Subject ? row.Subject.trim() : "General";

    console.log(`\n🔍 İşleniyor: "${searchTitle}" (${author})...`);

    // 0. ADIM: KİTAP ZATEN BİZDE VAR MI? (Toleranslı arama için ilike kullanıyoruz)
    const { data: existingBook } = await supabase
        .from('books')
        .select('id, genre, tags, isbn')
        .ilike('title', `%${searchTitle}%`)
        .single();

    if (existingBook) {
        console.log(`⏭️ Zaten veritabanımızda var. Etiket zenginliği kontrol ediliyor...`);
        // Eğer kitap varsa ve tags dizisi doluysa zaman kaybetmeden geç.
        if (existingBook.tags && existingBook.tags.length > 2) {
            return 'EXISTING';
        }
    }

    // ====================================================================================
    // ZENGİNLEŞTİRME VE YENİ KAYIT (GOOGLE BOOKS API)
    // ====================================================================================

    let googleTags = [];
    let googleIsbn = null;

    console.log(`   🌐 Google Books'tan üst veriler aranıyor...`);
    try {
        // ISBN olmadığı için Yazar ve Kitap adıyla arıyoruz
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:"${encodeURIComponent(searchTitle)}"+inauthor:"${encodeURIComponent(author)}"&maxResults=1`;
        const googleRes = await fetch(googleUrl);
        const googleData = await googleRes.json();

        if (googleData.items && googleData.items.length > 0) {
            const volInfo = googleData.items[0].volumeInfo;

            // Etiketleri Al
            if (volInfo.categories) {
                googleTags = volInfo.categories;
                console.log(`   🏷️ Google'dan gelen türler: ${googleTags.join(', ')}`);
            }

            // ISBN'i Al
            if (volInfo.industryIdentifiers) {
                const isbnObj = volInfo.industryIdentifiers.find(i => i.type === 'ISBN_13') || volInfo.industryIdentifiers[0];
                googleIsbn = isbnObj.identifier;
            }
        } else {
            console.log(`   ⚠️ Google kitabı bulamadı, varsayılan kütüphane etiketi kullanılacak.`);
        }
    } catch (err) {
        console.log(`   ⚠️ Google Books API bağlantı hatası, atlanıyor.`);
    }

    await delay(800); // Google'ı kızdırmamak için bekleme süresi

    // Etiketleri Harmanla (Kütüphaneden gelen "Subject" ve Google'dan gelenler)
    const combinedTags = [...new Set([subjectTag, ...googleTags])];
    const mainGenre = googleTags.length > 0 ? googleTags[0] : subjectTag;

    // EĞER KİTAP VERİTABANINDA ZATEN VARSA AMA ETİKETİ EKSİKSE GÜNCELLE
    if (existingBook) {
        const { error: updateError } = await supabase
            .from('books')
            .update({ tags: combinedTags, genre: mainGenre, isbn: existingBook.isbn || googleIsbn })
            .eq('id', existingBook.id);

        if (!updateError) {
            console.log(`   ✨ GÜNCELLENDİ! Zenginleştirilmiş etiketler eklendi.`);
            return 'UPDATED';
        }
        return 'ERROR';
    }

    // SUPABASE'E YENİ KAYIT OLARAK EKLE
    const { error } = await supabase
        .from('books')
        .insert({
            title: searchTitle,
            author: author,
            isbn: googleIsbn,
            genre: mainGenre,
            tags: combinedTags,
            shelf_location: callNumber,
            is_available: true // Bu dosyadaki tüm kitapların fiziksel olduğunu CSV hazırlarken garantilemiştik.
        });

    if (error) {
        console.error(`🔴 Kayıt Hatası:`, error.message);
        return 'ERROR';
    } else {
        console.log(`💾 Supabase'e başarıyla EKLENDİ. (Raf: ${callNumber})`);
        return 'ADDED';
    }
}

async function runSeeder() {
    console.log("🚀 Kütüphane Verisi Akıllı Zenginleştirme Operasyonu Başlıyor...\n");
    const booksToProcess = [];

    const stats = {
        totalProcessed: 0,
        addedSuccessfully: 0,
        updatedSuccessfully: 0,
        alreadyExists: 0,
        errors: 0
    };

    // TEMİZLENMİŞ YENİ KÜTÜPHANE DOSYAMIZ
    fs.createReadStream('iyte_subject_tags_clean.csv')
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
                else if (status === 'ERROR') stats.errors++;
            }

            console.log(`\n===========================================`);
            console.log(`🎉 TOHUMLAMA VE ZENGİNLEŞTİRME TAMAMLANDI 🎉`);
            console.log(`===========================================`);
            console.log(`📊 Toplam İşlenen Kitap : ${stats.totalProcessed}`);
            console.log(`✅ Sıfırdan Eklenen (Hit): ${stats.addedSuccessfully}`);
            console.log(`✨ Etiketi Güncellenen  : ${stats.updatedSuccessfully}`);
            console.log(`⏭️ Zaten Tam Olanlar    : ${stats.alreadyExists}`);
            console.log(`💥 Hata Alanlar         : ${stats.errors}`);
            console.log(`===========================================\n`);
        });
}

runSeeder();