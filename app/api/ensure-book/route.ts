import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase-server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { titleID, title, author, yearOfPublication, callNumber, isAvailable, tags } = body;

        if (!title) {
            return NextResponse.json({ error: 'Title is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Check if a book with the same title and author already exists
        let query = supabase
            .from('books')
            .select('id')
            .ilike('title', title.trim());

        if (author) {
            query = query.ilike('author', author.trim());
        }

        const { data: existingBooks } = await query.limit(1);

        if (existingBooks && existingBooks.length > 0) {
            // Book already exists in DB, return its ID
            return NextResponse.json({ id: existingBooks[0].id, alreadyExisted: true });
        }

        // HERE IS WHERE NEW BOOKS ARE APPENDED TO THE SUPABASE DATABASE
        // Insert new book into database
        const { data: newBook, error } = await supabase
            .from('books')
            .insert([{
                title: title.trim(),
                author: author?.trim() || 'Unknown',
                shelf_location: callNumber || null,
                is_available: isAvailable ?? true,
                tags: tags || [],
            }])
            .select('id')
            .single();

        if (error) {
            console.error('DB insert error:', error);
            return NextResponse.json({ error: 'Failed to create book record' }, { status: 500 });
        }

        return NextResponse.json({ id: newBook.id, alreadyExisted: false });
    } catch (error) {
        console.error('Ensure book error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
