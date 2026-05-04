require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Supabase Bağlantısı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sunucu dostu bekleme fonksiyonu
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Kitap ismini temizleyen fonksiyon
function cleanTitleForSearch(rawTitle) {
    if (!rawTitle) return "";
    let t = rawTitle.replace(/\s*:\s*roman/i, '');
    t = t.replace(/\s*:\s*öykü/i, '');
    t = t.replace(/\[.*?\]/g, '').trim();
    t = t.replace(/[,:\/]+$/, '').trim();
    return t;
}

// 🚨 YENİ: 1000 limitini aşmak için tüm kitapları parça parça çeken fonksiyon
async function fetchAllBooksFromSupabase() {
    let allBooks = [];
    let start = 0;
    const step = 1000;
    let hasMore = true;

    console.log("📥 Supabase'den kitaplar sayfalayarak çekiliyor...");

    while (hasMore) {
        const { data, error } = await supabase
            .from('books')
            .select('id, title, author, tags')
            .range(start, start + step - 1);

        if (error) {
            console.error("🔴 Supabase çekim hatası:", error.message);
            return [];
        }

        if (data && data.length > 0) {
            allBooks = allBooks.concat(data);
            console.log(`   📦 ${start} ile ${start + data.length - 1} arası kitaplar alındı...`);
            start += step;
        } else {
            hasMore = false; // Veri bitti, döngüden çık
        }
    }

    return allBooks;
}

async function runDirectLibraryEnrichment() {
    console.log("🚀 Supabase -> İYTE Kütüphanesi MARC Zenginleştirme Operasyonu Başlıyor...\n");

    // 1. ADIM: KİTAPLARI LİMİTSİZ ÇEK
    const books = await fetchAllBooksFromSupabase();

    if (books.length === 0) {
        console.log("⚠️ Veritabanından hiç kitap çekilemedi. İşlem durduruluyor.");
        return;
    }

    console.log(`\n📚 Veritabanında tam olarak ${books.length} kitap bulundu! Kütüphane taraması başlıyor...\n`);

    let stats = { processed: 0, updated: 0, noTags: 0, notFound: 0 };

    // 2. ADIM: KİTAPLARI TEK TEK İŞLE
    for (const book of books) {
        stats.processed++;
        const searchTitle = cleanTitleForSearch(book.title);

        console.log(`\n🔍 [${stats.processed}/${books.length}] Kütüphanede Aranıyor: "${searchTitle}"`);

        // 3. ADIM: KÜTÜPHANEDEN TİTLE ID BULMA
        const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(searchTitle)}"&hitsToDisplay=5&includeAvailabilityInfo=false&json=true`;

        let titleID = null;

        try {
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.HitlistTitleInfo && searchData.HitlistTitleInfo.length > 0) {
                const physicalMatch = searchData.HitlistTitleInfo.find(b => b.materialType === "BOOK");
                if (physicalMatch) {
                    titleID = physicalMatch.titleID;
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Arama API hatası: ${error.message}`);
        }

        await delay(1500);

        if (!titleID) {
            console.log(`   ❌ Title ID bulunamadı, kütüphane API'si eşleştiremedi.`);
            stats.notFound++;
            continue;
        }

        // 4. ADIM: MARC21 DETAYLARINI ÇEKME
        console.log(`   ✅ ID Bulundu (${titleID}). MARC Detayları Çekiliyor...`);
        const detailsUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/lookupTitleInfo?clientID=DS_CLIENT&titleID=${titleID}&includeItemInfo=FALSE&includeCatalogingInfo=TRUE&marcEntryFilter=ALL&json=true`;

        let libraryTags = [];

        try {
            const detailsRes = await fetch(detailsUrl);
            const detailsData = await detailsRes.json();

            if (detailsData.TitleInfo && detailsData.TitleInfo[0].BibliographicInfo?.MarcEntryInfo) {
                detailsData.TitleInfo[0].BibliographicInfo.MarcEntryInfo.forEach(entry => {
                    if (entry.entryID === "650" || entry.entryID === "651") {
                        let cleanTag = entry.text
                            .replace(/\.$/, "")
                            .replace(/--Fiction/i, "")
                            .trim();
                        if (cleanTag) libraryTags.push(cleanTag);
                    }
                });
            }
        } catch (error) {
            console.log(`   ⚠️ MARC API hatası: ${error.message}`);
        }

        // 5. ADIM: SUPABASE'İ GÜNCELLEME
        if (libraryTags.length > 0) {
            const combinedTags = [...new Set([...(book.tags || []), ...libraryTags])];

            const { error: updateError } = await supabase
                .from('books')
                .update({ tags: combinedTags })
                .eq('id', book.id);

            if (!updateError) {
                console.log(`   ✨ GÜNCELLENDİ! Eklenen MARC Etiketleri: [ ${libraryTags.join(', ')} ]`);
                stats.updated++;
            } else {
                console.log(`   🔴 Güncelleme Hatası:`, updateError.message);
            }
        } else {
            console.log(`   ⚠️ Bu kitabın detaylarında geçerli 650/651 etiketi yok.`);
            stats.noTags++;
        }

        await delay(2000);
    }

    console.log(`\n===========================================`);
    console.log(`🎉 DOĞRUDAN MARC OPERASYONU TAMAMLANDI 🎉`);
    console.log(`===========================================`);
    console.log(`Toplam İncelenen  : ${stats.processed}`);
    console.log(`Başarıyla Eklenen : ${stats.updated}`);
    console.log(`Kütüphanede Yok   : ${stats.notFound}`);
    console.log(`MARC Etiketi Boş  : ${stats.noTags}`);
    console.log(`===========================================\n`);
}

runDirectLibraryEnrichment();