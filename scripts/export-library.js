const fs = require('fs');

const SEARCH_TERM = "PS";
const SEARCH_TYPE = "PREFERRED_CALLNUMBER"; // 🎯 Senin web sitesinden kopardığın altın şifre!
const MAX_HITS = 5000;

const cleanCsv = (text) => {
    if (!text) return '""';
    return `"${text.replace(/"/g, '""').trim()}"`;
};

async function scrapeLibrarySniper() {
    console.log(`🚀 İYTE Kütüphanesi "Keskin Nişancı" Operasyonu Başlıyor...`);
    console.log(`🎯 Hedef Index: ${SEARCH_TYPE} | Aranan: "${SEARCH_TERM}"\n`);

    const fileName = `iyte_ps_class_sniper.csv`;
    fs.writeFileSync(fileName, "Title,Author,CallNumber\n", "utf8");

    // 🚨 İŞTE SİHİRLİ URL: term1="PS" ve searchType1=PREFERRED_CALLNUMBER
    const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(SEARCH_TERM)}"&searchType1=${SEARCH_TYPE}&hitsToDisplay=${MAX_HITS}&includeAvailabilityInfo=true&json=true`;

    try {
        console.log(`📡 Sunucuya doğrudan raf komutu gönderildi. Yanıt bekleniyor...`);
        const res = await fetch(searchUrl);

        if (!res.ok) {
            console.log(`❌ Sunucu Hatası: ${res.status}`);
            return;
        }

        const data = await res.json();

        // Eğer hala policy hatası verirse ekrana yazdırsın diye kontrol ekliyoruz:
        if (data.faultResponse) {
            console.log(`⚠️ API Hatası:`, data.faultResponse.string);
            return;
        }

        if (!data.HitlistTitleInfo || data.HitlistTitleInfo.length === 0) {
            console.log(`❌ Bu rafta kitap bulunamadı.`);
            return;
        }

        console.log(`📥 API'den doğrudan raf aramasıyla ${data.HitlistTitleInfo.length} kitap geldi!`);

        const validBooks = data.HitlistTitleInfo.filter(b => {
            const isPhysical = b.materialType === "BOOK" && b.callNumber;
            if (!isPhysical) return false;

            const cleanCall = b.callNumber.replace(/\s+/g, '').toUpperCase();
            return cleanCall.startsWith("PS");
        });

        for (const book of validBooks) {
            const cleanShelfLocation = book.callNumber.replace(/\|[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();
            const csvLine = `${cleanCsv(book.title)},${cleanCsv(book.author)},${cleanCsv(cleanShelfLocation)}\n`;
            fs.appendFileSync(fileName, csvLine, "utf8");
        }

        console.log(`\n===========================================`);
        console.log(`🎉 KESKİN NİŞANCI İŞLEMİ TAMAMLANDI 🎉`);
        console.log(`💾 Toplam Kurtarılan PS Kitabı: ${validBooks.length}`);
        console.log(`📁 Dosya: ${fileName}`);
        console.log(`===========================================\n`);

    } catch (error) {
        console.error(`💥 Hata oluştu: ${error.message}`);
    }
}

scrapeLibrarySniper();