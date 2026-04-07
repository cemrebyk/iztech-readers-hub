// app/actions/enrich-tags.ts
"use server";

import { supabaseAdmin } from '@/lib/supabase-admin';

export async function enrichWithGemini(bookId: string, title: string, author: string) {
    const supabase = supabaseAdmin;
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // ÇÖZÜM: Türkiye ve Avrupa bölgelerinde v1 (Stable) kullanımı daha kararlıdır.
    // Model ismini tam yol (models/...) olarak belirtiyoruz.
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `You are a professional librarian. Analyze the book "${title}" by "${author}".
    Select the most appropriate 3-5 tags from this list: 
    [Classics, Fiction, Romance, Historical Fiction, Literature, Fantasy, Science Fiction, Mystery, Nonfiction, Psychology].
    Your response must be in English.
    Return ONLY a JSON object: {"tags": ["tag1", "tag2"]}.
    Do not include markdown blocks.`;

    try {
        console.log(`\n🔍 Processing: "${title}" (${author})`);

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();

        // Eğer hala 404 alıyorsan, Google bu model ismini bu bölgede v1 altında desteklemiyor demektir.
        if (!response.ok) {
            throw new Error(`API Error (${response.status}): ${data.error?.message || response.statusText}`);
        }

        const responseText = data.candidates[0].content.parts[0].text;
        const cleanJson = responseText.replace(/```json|```/g, "").trim();
        const { tags } = JSON.parse(cleanJson);

        console.log(`✨ Gemini Tags [${title}]: ${JSON.stringify(tags)}`);

        const { error } = await supabase
            .from('books')
            .update({ tags: tags })
            .eq('id', bookId);

        if (error) throw error;

        console.log(`✅ Database Updated: ${title}`);
        return { success: true, title, tags };
    } catch (err: any) {
        console.error(`❌ Error [${title}]:`, err.message || err);
        return { success: false, title };
    }
}

/**
 * Toplu kitap zenginleştirme işlemi.
 */
export async function bulkEnrichBooks() {
    const supabase = supabaseAdmin;

    console.log("=========================================");
    console.log("📂 Eksik etiketli kitaplar taranıyor...");

    // Etiketi olmayan veya csv dosyasındaki "General" olanları çek 
    const { data: books, error: fetchError } = await supabase
        .from('books')
        .select('id, title, author')
        .or('tags.is.null,tags.cs.{},tags.eq.{"General"}')
        .limit(10);

    if (fetchError) {
        console.error("🚨 Veri çekme hatası:", fetchError);
        return { success: false, message: fetchError.message };
    }

    if (!books || books.length === 0) {
        console.log("🙌 Zenginleştirilecek kitap bulunamadı. Veritabanı güncel.");
        return { success: true, message: "Güncel." };
    }

    console.log(`📦 ${books.length} adet kitap sıraya alındı...`);

    let successCount = 0;
    for (const book of books) {
        const res = await enrichWithGemini(book.id, book.title, book.author);
        if (res.success) successCount++;
    }

    console.log("\n=========================================");
    console.log(`📊 Özet: ${successCount}/${books.length} kitap başarıyla işlendi.`);
    console.log("=========================================");

    return { success: true, count: successCount };
}