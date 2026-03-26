import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';
import { searchPhysicalBooks } from '../../../lib/library-api';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get('id');
    const title = searchParams.get('title');

    if (!bookId || !title) {
        return NextResponse.json({ error: 'Missing parameters (id, title).' }, { status: 400 });
    }

    try {
        // Search the IYTE catalog API by title
        const results = await searchPhysicalBooks(title);

        if (!results || results.length === 0) {
            return NextResponse.json({
                error: 'Book not found in catalog',
                is_available: null,
                db_updated: false,
            });
        }

        // Find the best match (exact or closest title match)
        const normalizedTitle = title.trim().toLowerCase();
        const match = results.find(
            (r) => r.title.trim().toLowerCase() === normalizedTitle
        ) || results[0];

        const isAvailable = match.titleAvailabilityInfo?.totalCopiesAvailable > 0;

        // Update the database
        const supabase = await createClient();
        const { data: updatedRow, error: dbError } = await supabase
            .from('books')
            .update({ is_available: isAvailable })
            .eq('id', bookId)
            .select();

        if (dbError) {
            console.error('DB update error:', dbError);
        }

        return NextResponse.json({
            title: match.title,
            copies_available: match.titleAvailabilityInfo?.totalCopiesAvailable ?? 0,
            is_available: isAvailable,
            db_updated: updatedRow && updatedRow.length > 0,
        });
    } catch (error) {
        console.error('Check availability error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
