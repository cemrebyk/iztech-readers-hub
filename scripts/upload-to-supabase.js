import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// .env.local dosyasındaki Supabase şifrelerini yükle
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function processBook(book) {
    const searchTitle = book.title;
    const author = book.author;

    console.log(`\n🔍 İşleniyor: "${searchTitle}" (${author})...`);

    // 1. ADIM: KİTAP ZATEN BİZDE VAR MI?
    const { data: existingBook } = await supabase
        .from('books')
        .select('id')
        .ilike('title', `%${searchTitle}%`)
        .single();

    if (existingBook) {
        console.log(`   ⏭️ Veritabanımızda zaten var. Zaman kazanmak için atlanıyor.`);
        return 'EXISTING';
    }

    // 2. ADIM: GOOGLE BOOKS İLE ZENGİNLEŞTİRME
    let googleTags = [];
    let googleIsbn = null;

    console.log(`   🌐 Google Books'tan üst veriler aranıyor...`);
    try {
        const searchQuery = encodeURIComponent(`${searchTitle} ${author}`);
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&maxResults=1`;
        const googleRes = await fetch(googleUrl);
        const googleData = await googleRes.json();

        if (googleData.items && googleData.items.length > 0) {
            const volInfo = googleData.items[0].volumeInfo;

            // Etiketleri Al
            if (volInfo.categories) {
                googleTags = volInfo.categories;
                console.log(`   🏷️ Google'dan gelen türler: [ ${googleTags.join(', ')} ]`);
            }

            // ISBN'i Al
            if (volInfo.industryIdentifiers) {
                const isbnObj = volInfo.industryIdentifiers.find(i => i.type === 'ISBN_13') || volInfo.industryIdentifiers[0];
                googleIsbn = isbnObj.identifier;
                console.log(`   📚 Google'dan ISBN eklendi: ${googleIsbn}`);
            }
        } else {
            console.log(`   ⚠️ Google kitabı bulamadı, kütüphane verileriyle devam ediliyor.`);
        }
    } catch (err) {
        console.log(`   ⚠️ Google Books API bağlantı hatası, atlanıyor.`);
    }

    await delay(1000); // Google API'yi yormamak için bekliyoruz

    // 3. ADIM: VERİLERİ HARMANLA VE SUPABASE'E KAYDET
    const finalTags = [...new Set([...(book.tags || []), ...googleTags])];
    const mainGenre = googleTags.length > 0 ? googleTags[0] : (book.tags.length > 0 ? book.tags[0] : 'General');
    const finalIsbn = book.isbn || googleIsbn;

    // 🚨 publisher_year sütunu hata vermemesi için insert nesnesinden kaldırıldı
    const { error } = await supabase
        .from('books')
        .insert({
            title: searchTitle,
            author: author,
            isbn: finalIsbn,
            genre: mainGenre,
            tags: finalTags,
            shelf_location: book.call_number,
            is_available: true
        });

    if (error) {
        console.error(`   🔴 Kayıt Hatası:`, error.message);
        return 'ERROR';
    } else {
        console.log(`   💾 Supabase'e başarıyla EKLENDİ. (Raf: ${book.call_number})`);
        return 'ADDED';
    }
}

async function runUpload() {
    console.log("🚀 Supabase Veritabanı Yükleme ve Zenginleştirme Operasyonu Başlıyor...\n");

    const inputFile = 'iyte_parsed_books.json';
    if (!fs.existsSync(inputFile)) {
        console.error(`🔴 Hata: ${inputFile} bulunamadı! Lütfen ayrıştırıcıyı tekrar çalıştırın.`);
        return;
    }

    const rawBooks = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    console.log(`📦 JSON dosyasından ${rawBooks.length} ham kayıt okundu.`);

    const uniqueBooksMap = new Map();

    rawBooks.forEach(book => {
        const uniqueKey = (book.title + book.author).toLowerCase().replace(/\s+/g, '');
        if (!uniqueBooksMap.has(uniqueKey)) {
            uniqueBooksMap.set(uniqueKey, book);
        }
    });

    const booksToProcess = Array.from(uniqueBooksMap.values());
    console.log(`🧹 Kütüphane kopyaları elendi. Geriye işlenecek ${booksToProcess.length} TEKİL kitap kaldı!\n`);

    let stats = { processed: 0, added: 0, existing: 0, errors: 0 };

    for (const book of booksToProcess) {
        stats.processed++;
        console.log(`\n------------------------------------------------------------`);
        console.log(`[${stats.processed} / ${booksToProcess.length}] İşlem Sırası`);

        const status = await processBook(book);

        if (status === 'ADDED') stats.added++;
        else if (status === 'EXISTING') stats.existing++;
        else if (status === 'ERROR') stats.errors++;
    }

    console.log(`\n===========================================`);
    console.log(`🎉 OPERASYON BAŞARIYLA TAMAMLANDI 🎉`);
    console.log(`===========================================`);
    console.log(`📊 Toplam İncelenen : ${stats.processed}`);
    console.log(`✅ Veritabanına Giren: ${stats.added}`);
    console.log(`⏭️ Zaten Kayıtlı Olan: ${stats.existing}`);
    console.log(`💥 Hata Alanlar      : ${stats.errors}`);
    console.log(`===========================================\n`);
}

runUpload();