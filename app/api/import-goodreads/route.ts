import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';
import Papa from 'papaparse';

// Seeder dosyasından aldığımız tag birleştirme mantığı
function mergeAndCleanTags(existingTags: string[] = [], csvGenres: string[] = [], libraryTags: string[] = []) {
    const combined = [...(existingTags || []), ...(csvGenres || []), ...(libraryTags || [])];
    return [...new Set(combined
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 2 && !['fiction', 'book', 'read', 'paperback', 'hardcover'].includes(t))
    )];
}

// Kütüphane API Sorgusu
async function fetchLibrarySubjects(isbn: string, title: string) {
    try {
        const query = isbn || encodeURIComponent(title);
        const res = await fetch(`https://library.iyte.edu.tr/api/v1/items?q=${query}`);
        const data = await res.json();
        return data?.items?.[0]?.subjects || [];
    } catch (e) { return []; }
}

export async function POST(request: Request) {
    const supabase = await createClient(); // Güvenli oturum kontrolü
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Yetkisiz işlem.' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });

        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

        // Sadece okunan kitapları filtrele (Goodreads CSV formatına göre)
        const readBooks = parsed.data.filter((row: any) =>
            row['Exclusive Shelf'] === 'read' ||
            (row['Bookshelves'] && row['Bookshelves'].includes('read'))
        );

        let processedCount = 0;

        for (const row of readBooks as any[]) {
            // Seeder.js içindeki başlık ve yazar temizleme mantığı
            const rawTitle = row.Title || row.title;
            const author = row.Author || row.author;
            if (!rawTitle) continue;

            const cleanTitle = rawTitle.replace(/\s*\(.*?\)\s*$/, '').trim(); //
            const cleanAuthor = author ? author.replace(/,$/, "").trim() : ""; //
            const isbn = row.ISBN13?.replace(/=/g, '').replace(/"/g, '') || row.ISBN?.replace(/=/g, '').replace(/"/g, ''); // Goodreads CSV ISBN temizliği

            // Veritabanında kitabı ara
            let { data: book, error: findError } = await supabase
                .from('books')
                .select('*')
                .ilike('title', cleanTitle)
                .ilike('author', `%${cleanAuthor}%`) //
                .maybeSingle();

            if (!book) {
                // Kitap bizde yok, İYTE kütüphanesine sor
                const libraryTags = await fetchLibrarySubjects(isbn, cleanTitle);

                // Eğer kütüphanede tags/konu döndüyse (veya mantığınıza göre kitap kütüphanede VARSA)
                // Sistemi sadece kütüphanedeki kitaplarla sınırlı tuttuğumuz için:
                if (libraryTags && libraryTags.length > 0) {
                    const csvTags = row.Genres ? row.Genres.split(',').map((g: string) => g.trim()) : [];
                    const finalTags = mergeAndCleanTags([], csvTags, libraryTags); //

                    // Kitabı veritabanına ekle (Burada RLS kurallarına göre service_role kullanman gerekebilir)
                    const { data: newBook, error: insertError } = await supabase
                        .from('books')
                        .insert({
                            title: cleanTitle,
                            author: cleanAuthor,
                            isbn: isbn,
                            tags: finalTags,
                            // Diğer zorunlu alanlar...
                        }).select().single();

                    book = newBook;
                }
            }

            // Kitap veritabanımızda mevcutsa (veya az önce kütüphaneden zenginleştirilip eklendiyse)
            if (book) {
                // Goodreads CSV'sindeki puanı al (Eğer puan yoksa 0 veya null atama mantığına göre ayarla)
                const rating = parseInt(row['My Rating']) || 0;

                // Eğer kullanıcının tablonda boş yorumlara izin veriliyorsa direkt ekleyelim:
                const { error: upsertError } = await supabase
                    .from('reviews')
                    .upsert({
                        user_id: user.id,
                        book_id: book.id,
                        rating: rating, // Goodreads'ten gelen puan
                        // Eğer tablonda zorunluysa, Goodreads'ten yorumu da çekebiliriz:
                        // review_text: row['My Review'] || 'Goodreads üzerinden aktarıldı.'
                    }, { onConflict: 'user_id, book_id' });

                if (upsertError) {
                    console.error("Review eklenirken hata:", upsertError.message);
                }
            }

            processedCount++;
            // Rate limit koruması
            await new Promise(r => setTimeout(r, 200));
        }

        return NextResponse.json({ message: `${processedCount} kitap başarıyla senkronize edildi!` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}