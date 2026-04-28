const SEARCH_TERM = "PS";

// Kütüphanecilik sistemlerinde (SirsiDynix) ve Türkiye'deki üniversitelerde
// raf numarası (Call Number) için en çok kullanılan 30 gizli indeks ismi:
const POSSIBLE_INDEXES = [
    "CALL", "CALLNUM", "CALLNUMBER", "CALL_NUMBER", "CALL_NUM",
    "SHELFPOS", "SHELF", "SHELF_POS", "SHELFPOS_EXACT",
    "LC", "LCCALL", "LC_CALL", "DEWEY", "CLASS", "CLASSIFICATION",
    "LOCALCALL", "LOCAL_CALL", "ITEM_CALL", "ITEM_CALLNUM",
    "YERNUMARASI", "YER_NUMARASI", "YERNUM", "YER_NUM",
    "RAF", "RAF_NO", "RAF_NUMARASI", "RAFNUM",
    "CALL_EXACT", "SYS_CALL", "SYS_CALLNUM", "CALLNUM_EXACT",
    "PREFERRED_CALLNUMBER"
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function crackLibraryIndex() {
    console.log("🕵️‍♂️ İYTE Kütüphanesi Gizli İndeks (Policy) Kırma Operasyonu Başlıyor...");
    console.log(`🎯 Toplam Denenecek Şifre Sayısı: ${POSSIBLE_INDEXES.length}\n`);

    let foundValidIndexes = [];

    for (const indexName of POSSIBLE_INDEXES) {
        process.stdout.write(`🔑 Deneniyor: [ ${indexName} ] ... `);

        const searchUrl = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${SEARCH_TERM}"&searchType1=${indexName}&hitsToDisplay=5&json=true`;

        try {
            const res = await fetch(searchUrl);
            const data = await res.json();

            // Eğer API bize faultResponse (Hata) gönderdiyse bu şifre yanlıştır.
            if (data.faultResponse) {
                console.log(`❌ Yanlış Şifre (Bulunamadı)`);
            }
            // Eğer hata yoksa ve kitap (veya boş liste) döndüyse, API bu şifreyi TANIYOR demektir!
            else {
                console.log(`✅ BİNGO! ŞİFRE KABUL EDİLDİ!`);
                foundValidIndexes.push(indexName);

                if (data.HitlistTitleInfo) {
                    console.log(`   📚 Üstelik bu şifreyle ${data.HitlistTitleInfo.length} kitap örneği de geldi!`);
                }
            }

        } catch (error) {
            console.log(`💥 Bağlantı Hatası`);
        }

        // Sunucuyu kızdırmamak için her şifre denemesinde yarım saniye bekle
        await delay(500);
    }

    console.log(`\n===========================================`);
    console.log(`🎉 ŞİFRE KIRMA İŞLEMİ TAMAMLANDI 🎉`);
    if (foundValidIndexes.length > 0) {
        console.log(`🔓 Çalışan Geçerli İndeksler (API'nin Anladığı Kelimeler):`);
        console.log(`👉 ${foundValidIndexes.join(', ')}`);
    } else {
        console.log(`🔒 Hiçbiri çalışmadı. Kütüphane çok daha garip bir isim kullanmış.`);
    }
    console.log(`===========================================\n`);
}

crackLibraryIndex();