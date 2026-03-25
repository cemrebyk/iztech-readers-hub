import { NextResponse } from 'next/server';

interface LibraryBook {
    titleID: number;
    title: string;
    author: string;
    yearOfPublication: number;
    materialType: string;
    callNumber: string;
    titleAvailabilityInfo: {
        totalCopiesAvailable: number;
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.trim().length === 0) {
        return NextResponse.json([]);
    }

    const url = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${q}"&hitsToDisplay=50&includeAvailabilityInfo=true&json=true`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.HitlistTitleInfo) {
            return NextResponse.json([]);
        }

        // Filter: only physical books with valid call numbers (not starting with "XX")
        const physicalBooks: LibraryBook[] = data.HitlistTitleInfo.filter((book: any) => {
            const isBookType = book.materialType === "BOOK";
            const hasValidCallNumber = book.callNumber && !book.callNumber.toUpperCase().startsWith("XX");
            return isBookType && hasValidCallNumber;
        });

        return NextResponse.json(physicalBooks);
    } catch (error) {
        console.error("Catalog API error:", error);
        return NextResponse.json([], { status: 500 });
    }
}
