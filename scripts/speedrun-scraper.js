const fs = require('fs');

// Kütüphane sisteminin "Index"lenmiş özel etiketleri
const SUBJECTS = ["Turkish fiction", "American fiction", "English fiction", "Science fiction"];
const PAGE_SIZE = 100; // Sunucuyu asla yormayacak minik lokmalar
const DELAY_MS = 3000; // Her sayfa arası 3 saniye dinlenme

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cleanCsv = (text) => text ? `"${text.replace(/"/g, '""').trim()}"` : '""';

async function runTagHunter() {
    console.log(`🚀 Etiket Avcısı Operasyonu Başlıyor...`);

    const fileName = `iyte_subject_tags_data.csv`;
    fs.writeFileSync(fileName, "Title,Author,CallNumber,Subject\n", "utf8"); // Subject sütunu ekledik

    let totalSaved = 0;
    const seenBooks = new Set();

    for (const tag of SUBJECTS) {
        console.log(`\n🏷️ Etiket Taranıyor: [ ${tag} ]`);

        // 1. ADIM: İLK İSTEK VE KOTA KONTROLÜ
        const initialUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${encodeURIComponent(tag)}"&hitsToDisplay=${PAGE_SIZE}&includeAvailabilityInfo=true&json=true`;

        try {
            const initRes = await fetch(initialUrl);
            if (!initRes.ok) {
                console.log(`   ⚠️ Sunucu reddetti. Atlanıyor.`);
                continue;
            }

            const initData = await initRes.json();
            if (!initData.HitlistTitleInfo) {
                console.log(`   ❌ Kayıt bulunamadı.`);
                continue;
            }

            const queryID = initData.queryID;
            const totalHits = parseInt(initData.totalHits);
            console.log(`   ✅ Toplam ${totalHits} kayıt bulundu. 100'erli paketlerle çekiliyor...`);

            // İlk 100'ü işle
            totalSaved += processAndSave(initData.HitlistTitleInfo, fileName, seenBooks, tag);

            // 2. ADIM: KÜÇÜK ADIMLARLA SAYFALAMA (PAGING)
            let currentHit = PAGE_SIZE + 1;
            while (currentHit <= totalHits) {
                let lastHit = Math.min(currentHit + PAGE_SIZE - 1, totalHits);
                console.log(`   ⏳ Çekiliyor: ${currentHit} - ${lastHit} / ${totalHits} ...`);

                const pagingUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalogPaging?clientID=DS_CLIENT&queryID=${queryID}&firstHitToDisplay=${currentHit}&lastHitToDisplay=${lastHit}&includeAvailabilityInfo=true&json=true`;

                const pageRes = await fetch(pagingUrl);
                const pageData = await pageRes.json();

                if (pageData.HitlistTitleInfo) {
                    totalSaved += processAndSave(pageData.HitlistTitleInfo, fileName, seenBooks, tag);
                }

                currentHit += PAGE_SIZE;
                await delay(DELAY_MS); // Sunucuyu dinlendiriyoruz
            }

        } catch (error) {
            console.error(`   💥 Hata oluştu: ${error.message}`);
        }
    }

    console.log(`\n===========================================`);
    console.log(`🎉 OPERASYON TAMAMLANDI 🎉`);
    console.log(`💾 Toplam Fiziksel Kitap: ${totalSaved}`);
    console.log(`===========================================\n`);
}

function processAndSave(hitlist, fileName, seenSet, subjectTag) {
    let count = 0;
    hitlist.forEach(b => {
        const isPhysical = b.materialType === "BOOK" && b.callNumber;
        if (!isPhysical || seenSet.has(b.titleID)) return;

        const loc = (b.locationOfFirstAvailableItem || "").toUpperCase();
        if (loc.includes("ONLINE") || loc.includes("THESIS") || loc.includes("WEB")) return;

        const cleanCall = b.callNumber.replace(/\s+/g, '').toUpperCase();

        // 🚨 YENİ KURAL: "XX" ile başlayan hayalet raf numaralarını doğrudan engelle
        if (cleanCall.startsWith("XX")) return;

        seenSet.add(b.titleID);
        const shelf = b.callNumber.replace(/\|[a-zA-Z]/g, '').replace(/\s+/g, ' ').trim();
        fs.appendFileSync(fileName, `${cleanCsv(b.title)},${cleanCsv(b.author)},${cleanCsv(shelf)},${cleanCsv(subjectTag)}\n`, "utf8");
        count++;
    });
    return count;
}

runTagHunter();