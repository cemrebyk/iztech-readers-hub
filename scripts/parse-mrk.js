import fs from 'fs';

const possiblePaths = [
    'records.mrk.txt',
    'records.mrk',
    'scripts/records.mrk.txt',
    'scripts/records.mrk',
    'records.mrk.txt.txt'
];

const inputFile = possiblePaths.find(p => fs.existsSync(p));
const outputFile = 'iyte_parsed_books.json';

// 🧹 GELİŞMİŞ TEMİZLEYİCİ
function cleanMarcField(text) {
    if (!text) return "";

    // 1. En baştaki "10|a", " 0|a", "1 |a" gibi MARC göstergelerini (indicator) acımasızca sil
    let cleaned = text.replace(/^[\s\d]{0,4}\|[a-z0-9]/, '');

    // 2. Geriye kalan (varsa) "|b", "|c" gibi alt alan kodlarını boşlukla değiştir
    cleaned = cleaned.replace(/\|[a-z0-9]/g, ' ');

    // 3. Genel noktalama ve gereksiz "roman/öykü" ibarelerini temizle
    return cleaned.replace(/\s*:\s*roman/i, '')
        .replace(/\s*:\s*öykü/i, '')
        .replace(/\[.*?\]/g, '')
        .replace(/[,:\/]+$/, '')
        .replace(/\s+/g, ' ') // Çift boşlukları teke indir
        .trim();
}

function parseMrkFile() {
    console.log(`🚀 MARC21 (.mrk) Gelişmiş Ayrıştırıcısı Başlıyor...`);

    if (!inputFile) {
        console.error(`🔴 Hata: records.mrk dosyası hiçbir konumda bulunamadı!`);
        return;
    }

    console.log(`✅ Dosya bulundu: ${inputFile}`);

    const rawData = fs.readFileSync(inputFile, 'utf8');
    const rawBooks = rawData.split('*** DOCUMENT BOUNDARY ***').filter(b => b.trim().length > 0);
    console.log(`📦 Toplam ${rawBooks.length} kayıt tespit edildi. İşleniyor...\n`);

    const parsedBooks = [];

    rawBooks.forEach((block) => {
        const lines = block.split('\n');

        let book = {
            title: "",
            author: "Bilinmeyen Yazar",
            isbn: null,
            publisher_year: "",
            tags: [],
            call_number: "",
            material_type: "BOOK"
        };

        lines.forEach(line => {
            const l = line.trim();
            if (!l) return;

            const tagMatch = l.match(/^\.([0-9]{3})\.\s*(.*)/);
            if (!tagMatch) return;

            const tag = tagMatch[1];
            const content = tagMatch[2];

            switch (tag) {
                case '020': // ISBN
                    const isbnMatch = content.match(/\|a\s*([\d\-X]+)/i) || content.match(/([\d\-X]{10,13})/);
                    if (isbnMatch && !book.isbn) book.isbn = isbnMatch[1].replace(/-/g, '');
                    break;
                case '100':
                    let authorText = cleanMarcField(content);
                    // MARC formatı "Soyadı, Adı, Tarih" şeklindedir (Örn: "Ümit, Ahmet, 1960-")
                    let nameParts = authorText.split(',').map(p => p.trim());
                    // İçinde yıl/tarih (rakam) barındıran kısımları filtrele
                    let validParts = nameParts.filter(p => !/\d{3}/.test(p));
                    // Soyadı-Adı sırasını Ad-Soyad yapmak için ters çevir (reverse) ve birleştir
                    book.author = validParts.reverse().join(' ').trim() || "Bilinmeyen Yazar";
                    break;
                case '245': // Başlık
                    let rawTitle = cleanMarcField(content);
                    // 🚨 YENİ: "/" işaretinden sonrasını (çevirmen, yayına hazırlayan vb.) çöpe at
                    book.title = rawTitle.split('/')[0].trim();
                    break;
                case '260': // Yayın/Yıl
                    book.publisher_year = cleanMarcField(content);
                    break;
                case '650': // Etiket (Konu)
                    const cleanTag = cleanMarcField(content).replace(/\.$/, "").replace(/--Fiction/i, "").trim();
                    if (cleanTag && !book.tags.includes(cleanTag)) {
                        book.tags.push(cleanTag);
                    }
                    break;
                case '999': // Raf Numarası
                    const callNumMatch = content.match(/\|a\s*([^|]+)/);
                    if (callNumMatch && !book.call_number) {
                        book.call_number = callNumMatch[1].trim();
                    }
                    break;
            }
        });

        // Sadece fiziksel rafı olan mantıklı kayıtları al
        if (book.title && book.call_number && !book.call_number.startsWith("XX")) {
            parsedBooks.push(book);
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(parsedBooks, null, 2), 'utf8');

    console.log(`===========================================`);
    console.log(`🎉 AYRIŞTIRMA TAMAMLANDI 🎉`);
    console.log(`📚 Toplam Kaydedilen Tertemiz Kitap: ${parsedBooks.length}`);
    console.log(`💾 Oluşturulan Dosya: ${outputFile}`);
    console.log(`===========================================\n`);
}

parseMrkFile();