'use server'

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { checkAndAwardAchievements } from '@/lib/actions/achievements';

export async function submitReview(bookId: string, rating: number, comment: string) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Yorum yapmak için @std.iyte.edu.tr mailinizle giriş yapmalısınız.');

    // Sadece yorumu ekliyoruz. Rozet mantığını veritabanı hallediyor.
    const { error } = await supabase
        .from('reviews')
        .insert([{ book_id: bookId, user_id: user.id, rating, comment }]);

    if (error) throw new Error('Yorum eklenirken bir hata oluştu.');

    await checkAndAwardAchievements(user.id, 'review');

    // Cache'i temizle ki profil sayfasında olası yeni kazanılan rozet hemen görünsün
    revalidatePath(`/books/${bookId}`);
    revalidatePath('/profile');
}