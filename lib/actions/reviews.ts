"use server";

import { createClient } from '../supabase-server';
import { revalidatePath } from 'next/cache';

export async function submitReview(bookId: string, rating: number, tags: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("You must be logged in to submit a review.");
    if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5.");
    if (tags.length > 3) throw new Error("You can select at most 3 tags.");
    if (tags.length === 0) throw new Error("Please select at least 1 tag.");

    // Check if user already reviewed this book
    const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('book_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();

    if (existingReview) {
        throw new Error("You have already reviewed this book.");
    }

    const { error } = await supabase
        .from('reviews')
        .insert([{
            book_id: bookId,
            user_id: user.id,
            rating,
            tags,
        }]);

    if (error) throw error;

    revalidatePath(`/books/${bookId}`);
}
