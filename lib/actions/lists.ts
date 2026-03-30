"use server";
// lib/actions/lists.ts içindesin, bir üst klasördeki supabase-server.ts'e gidiyorsun
import { createClient } from '../supabase-server';
import { revalidatePath } from 'next/cache';

const ALLOWED_LIST_NAMES = [
    "📚 To Be Read",
    "✅ Read",
    "⭐ Favorites",
    "👍 Recommended",
    "🚫 DNF (Did Not Finish)",
    "🎓 Academic-Related",
    "🔄 Currently Reading",
    "🎁 Wishlist",
    "📖 Book Club Picks",
    "🌟 All-Time Greats",
];

export async function createBookList(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("You must be logged in.");

    const name = formData.get("name") as string;

    if (!name || name.trim().length === 0) {
        return { error: "Please select a list type." };
    }

    if (!ALLOWED_LIST_NAMES.includes(name.trim())) {
        return { error: "Invalid list name." };
    }

    const { error } = await supabase
        .from('book_lists')
        .insert([{ user_id: user.id, name: name.trim() }]);

    if (error) {
        if (error.code === '23505') {
            return { error: "You already have a list with this name." };
        }
        return { error: error.message };
    }

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