const fs = require('fs');

// Edebiyat rafının tüm ana alt sınıfları.
// Bu sayede hem "PS3537" gibi bitişik kayıtları hem de "P S" gibi ayrık kayıtları yakalarız.
const RAFLAR = ["P", "PA", "PB", "PC", "PD", "PE", "PF", "PG", "PH", "PJ", "PK", "PL", "PM", "PN", "PQ", "PR", "PS", "PT"];
const PAGE_SIZE = 1000;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanCsv = (text) => text ? `"${text.replace(/"/g, '""').trim()}"` : '""';

async function scrapeLibraryOptimized() {
    console.log(`🚀 Optimize Edilmiş "P" Koridoru Taraması Başlıyor...`);
    const fileName = `iyte_p_class_archive.csv`;
    fs.writeFileSync(fileName, "Title,Author,CallNumber\n", "utf8");

    const seenBooks = new Set();
    let totalSaved = 0;

    for (const raf of RAFLAR) {
        console.log(`\n📡 Raf Grubu Taranıyor: [${raf}]`);

        // 1. ADIM: İLK İSTEK
        const initialUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${raf}"&hitsToDisplay=${PAGE_SIZE}&includeAvailabilityInfo=true&json=true`;

        try {
            const initRes = await fetch(initialUrl);
            const initData = await initRes.json();

            if (!initData.HitlistTitleInfo) continue;

            const queryID = initData.queryID;
            const totalHits = parseInt(initData.totalHits);
            console.log(`   ✅ [${raf}] grubu için ${totalHits} kayıt bulundu. Süzülüyor...`);

            // İlk sayfayı işle
            totalSaved += processAndSave(initData.HitlistTitleInfo, fileName, seenBooks);

            // 2. ADIM: SAYFALAMA (PAGING)
            let currentHit = PAGE_SIZE + 1;
            while (currentHit <= totalHits) {
                let lastHit = Math.min(currentHit + PAGE_SIZE - 1, totalHits);
                const pagingUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalogPaging?clientID=DS_CLIENT&queryID=${queryID}&firstHitToDisplay=${currentHit}&lastHitToDisplay=${lastHit}&includeAvailabilityInfo=true&json=true`;

                const pageRes = await fetch(pagingUrl);
                const pageData = await pageRes.json();

                if (pageData.HitlistTitleInfo) {
                    totalSaved += processAndSave(pageData.HitlistTitleInfo, fileName, seenBooks);
                }
                currentHit += PAGE_SIZE;
                await delay(1000); // Sunucu dostu bekleme
            }
        } catch (error) {
            console.error(`   💥 [${raf}] taranırken hata: ${error.message}`);
        }
    }
    console.log(`\n🎉 İşlem Bitti! Toplam ${totalSaved} benzersiz edebiyat kitabı arşivlendi.`);
}

function processAndSave(hitlist, fileName, seenSet) {
    let count = 0;
    hitlist.forEach(b => {
        const isPhysical = b.materialType === "BOOK" && b.callNumber;
        if (!isPhysical || seenSet.has(b.titleID)) return;

        const loc = (b.locationOfFirstAvailableItem || "").toUpperCase();
        if (loc.includes("ONLINE") || loc.includes("THESIS") || loc.includes("WEB")) return;

        // Raf numarası P ile başlıyorsa (Hangi alt sınıf olursa olsun) al
        const cleanCall = b.callNumber.replace(/\s+/g, '').toUpperCase();
        if (cleanCall.startsWith("P")) {
            seenSet.add(b.titleID);
            const shelf = b.callNumber.replace(/\|[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();
            fs.appendFileSync(fileName, `${cleanCsv(b.title)},${cleanCsv(b.author)},${cleanCsv(shelf)}\n`, "utf8");
            count++;
        }
    });
    return count;
}

scrapeLibraryOptimized();