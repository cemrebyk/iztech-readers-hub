require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function mergeAndCleanTags(existingTags = [], csvGenres = [], libraryTags = []) {
    const combined = [...(existingTags || []), ...(csvGenres || []), ...(libraryTags || [])];
    return [...new Set(combined
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 2 && !['fiction', 'book', 'read', 'paperback', 'hardcover'].includes(t))
    )];
}

async function fetchLibrarySubjects(isbn, title) {
    try {
        const query = isbn || encodeURIComponent(title);
        const res = await fetch(`https://library.iyte.edu.tr/api/v1/items?q=${query}`);
        const data = await res.json();
        return data?.items?.[0]?.subjects || [];
    } catch (e) { return []; }
}

async function processBookUpdate(row) {
    // seed.js'den gelen kusursuz temizleme ve eşleme mantığı
    const rawTitle = row.Title || row.title;
    const author = row.Author || row.author;
    if (!rawTitle) return;

    const cleanTitle = rawTitle.replace(/\s*\(.*?\)\s*$/, '').trim();
    const cleanAuthor = author ? author.replace(/,$/, "").trim() : "";
    const isbn = row.ISBN13 || row.ISBN || row.isbn;

    try {
        // KUSURSUZ EŞLEŞME: Başlık ve Yazar beraber kontrol ediliyor (seed.js gibi)
        const { data: book, error: findError } = await supabase
            .from('books')
            .select('*')
            .ilike('title', cleanTitle)
            .ilike('author', `%${cleanAuthor}%`)
            .maybeSingle();

        if (findError) throw findError;

        if (book) {
            const csvTags = row.Genres ? row.Genres.split(',').map(g => g.trim()) : [];
            const libraryTags = await fetchLibrarySubjects(isbn, cleanTitle);
            const finalTags = mergeAndCleanTags(book.tags, csvTags, libraryTags);

            const currentGenre = (book.genre === 'General' || !book.genre) && csvTags[0] ? csvTags[0] : book.genre;

            const { error: updateError } = await supabase
                .from('books')
                .update({
                    tags: finalTags,
                    genre: currentGenre,
                    isbn: book.isbn || isbn
                })
                .eq('id', book.id);

            if (updateError) console.error(`❌ Hata: ${cleanTitle}`, updateError.message);
            else console.log(`✅ Senkronize Edildi: ${cleanTitle} (${finalTags.length} Etiket)`);
        } else {
            console.log(`⏭️ Veritabanında eşleşme bulunamadı: ${cleanTitle}`);
        }
    } catch (err) {
        console.error(`💥 Hata: ${cleanTitle}`, err.message);
    }
}

async function runFusion() {
    // Terminali kök dizinde (iztech-readers-hub) açtığın için direkt dosya adını yazmalısın
    const csvPath = './goodreads_export_with_genres.csv';

    if (!fs.existsSync(csvPath)) {
        console.error(`🔴 CSV dosyası bulunamadı! Aranan yol: ${csvPath}`);
        console.log("İpucu: Dosyanın iztech-readers-hub klasörünün tam içinde olduğundan emin ol.");
        return;
    }

    const results = [];
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`📋 ${results.length} kitap işleme alınıyor...`);
            for (const row of results) {
                await processBookUpdate(row);
                await new Promise(r => setTimeout(r, 200)); // Rate limit koruması
            }
            console.log("\n✨ Tüm veriler başarıyla birleştirildi!");
        });
}

runFusion();