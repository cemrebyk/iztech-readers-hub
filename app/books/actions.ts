"use server"
import { createClient } from "@/lib/supabase-server"
import { revalidatePath } from 'next/cache'

export async function ignoreBook(bookId: string) {
    const supabase = await createClient()

    // RLS sayesinde auth.uid() otomatik kontrol edilir ama biz yine de kullanıcıyı alalım
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Oturum açmanız gerekiyor.")

    const { error } = await supabase
        .from('user_ignored_books')
        .insert({ user_id: user.id, book_id: bookId })

    if (!error) {
        // Sayfayı server-side'da tazeleyerek listeden düşmesini sağlar
        revalidatePath('/')
    }
    return { error }
}