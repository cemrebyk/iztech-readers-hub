const fs = require('fs');

const inputFile = 'iyte_subject_tags_data.csv';
const outputFile = 'iyte_subject_tags_clean.csv';

function cleanExistingData() {
    console.log(`🧹 Veri temizliği başlıyor...`);
    
    // Dosyayı oku ve satırlara böl
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const lines = rawData.split('\n');
    
    let cleanLines = [lines[0]]; // Başlık satırını (Title,Author,CallNumber,Subject) direkt al
    let removedCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Boş satırları atla

        // CSV'yi oluştururken değerleri tırnak içine almıştık: "Title","Author","CallNumber","Subject"
        // Çağrı numarası "XX ile başlıyorsa bu satırı çöpe at
        if (line.includes(',"XX')) {
            removedCount++;
            continue;
        }
        
        cleanLines.push(line);
    }

    // Temizlenmiş veriyi yeni dosyaya yaz
    fs.writeFileSync(outputFile, cleanLines.join('\n'), 'utf8');
    
    console.log(`===========================================`);
    console.log(`✨ TEMİZLİK BİTTİ ✨`);
    console.log(`🗑️ Silinen Hayalet Kitap Sayısı: ${removedCount}`);
    console.log(`💾 Kalan Temiz Kitap Sayısı: ${cleanLines.length - 1}`);
    console.log(`📁 Yeni Dosya: ${outputFile}`);
    console.log(`===========================================`);
}

cleanExistingData();