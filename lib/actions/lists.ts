"use server";
// lib/actions/lists.ts içindesin, bir üst klasördeki supabase-server.ts'e gidiyorsun
import { createClient } from '../supabase-server';
import { revalidatePath } from 'next/cache';

export async function createBookList(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Oturum açmanız gerekiyor.");

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // KRİTİK KONTROL: İsim boşsa veya sadece boşluktan oluşuyorsa işlemi durdur
    if (!name || name.trim().length === 0) {
        throw new Error("Liste adı boş bırakılamaz.");
    }

    const { error } = await supabase
        .from('book_lists')
        .insert([{ user_id: user.id, name: name.trim(), description: description?.trim() }]);

    if (error) throw error;

    revalidatePath('/profile');
}