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

export async function deleteBookList(listId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Oturum açmanız gerekiyor.");

    // First ensure the user owns this list before deleting
    const { data: list, error: fetchError } = await supabase
        .from('book_lists')
        .select('user_id')
        .eq('id', listId)
        .single();
        
    if (fetchError || !list) throw new Error("Liste bulunamadı.");
    if (list.user_id !== user.id) throw new Error("Bu listeyi silme yetkiniz yok.");

    const { error: deleteError } = await supabase
        .from('book_lists')
        .delete()
        .eq('id', listId);

    if (deleteError) throw deleteError;

    revalidatePath('/profile');
}