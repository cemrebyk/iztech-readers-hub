"use server";

import { supabaseAdmin } from '../supabase-admin';

type Trigger = 'review' | 'list' | 'genre';

async function award(userId: string, achievementId: string) {
    const { error } = await supabaseAdmin
        .from('user_achievements')
        .upsert(
            { user_id: userId, achievement_id: achievementId },
            { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
        );
    if (error) {
        console.error(`[achievements] award failed (${achievementId}):`, error);
    } else {
        console.log(`[achievements] awarded ${achievementId} to ${userId}`);
    }
}

async function checkReviewAchievements(userId: string) {
    const { count } = await supabaseAdmin
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    const total = count ?? 0;
    if (total >= 1) await award(userId, 'first-review');
    if (total >= 10) await award(userId, 'reviewer-10');
    if (total >= 50) await award(userId, 'reviewer-50');

    const { data: fiveStar } = await supabaseAdmin
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('rating', 5)
        .limit(1);
    if (fiveStar && fiveStar.length > 0) await award(userId, 'five-star');

    // Night owl: a review whose hour (Europe/Istanbul) is 0..4.
    // The Supabase JS client can't run arbitrary SQL, so we fetch recent rows
    // and check timezone-converted hours in JS.
    const { data: recent } = await supabaseAdmin
        .from('reviews')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (recent) {
        const hitNight = recent.some(r => {
            const istanbulHour = Number(
                new Date(r.created_at).toLocaleString('en-US', {
                    timeZone: 'Europe/Istanbul',
                    hour: '2-digit',
                    hour12: false,
                })
            );
            return istanbulHour >= 0 && istanbulHour <= 4;
        });
        if (hitNight) await award(userId, 'night-owl');
    }
}

async function checkListAchievements(userId: string) {
    const { count } = await supabaseAdmin
        .from('book_lists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    const total = count ?? 0;
    if (total >= 1) await award(userId, 'first-list');
    if (total >= 5) await award(userId, 'list-master');
}

async function checkGenreAchievements(userId: string) {
    // "Okumuş" sayılmak için review yazılmış olmalı.
    const { data: items } = await supabaseAdmin
        .from('reviews')
        .select('books(id, genre)')
        .eq('user_id', userId);

    if (!items || items.length === 0) return;

    const genres = new Set<string>();
    const classicBookIds = new Set<string>();
    for (const row of items as any[]) {
        const book = row.books;
        if (!book) continue;
        const genre: string | null = book.genre ?? null;
        if (!genre || genre === 'General') continue;
        genres.add(genre);
        if (genre.toLowerCase().includes('classic')) classicBookIds.add(book.id);
    }

    if (genres.size >= 5) await award(userId, 'genre-explorer');
    if (genres.size >= 10) await award(userId, 'genre-master');
    if (classicBookIds.size >= 10) await award(userId, 'classic-reader');
}

export async function checkAndAwardAchievements(userId: string, trigger: Trigger): Promise<void> {
    console.log(`[achievements] check start userId=${userId} trigger=${trigger}`);
    try {
        if (trigger === 'review') {
            await checkReviewAchievements(userId);
            await checkGenreAchievements(userId);
        } else if (trigger === 'list') {
            await checkListAchievements(userId);
        } else if (trigger === 'genre') {
            await checkGenreAchievements(userId);
        }
        console.log(`[achievements] check done userId=${userId} trigger=${trigger}`);
    } catch (err) {
        console.error('[achievements] check failed:', err);
    }
}
