// lib/library-api.ts

// 1. Basic type from search results
export interface LibraryBook {
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

// 2. Detailed type with tags from MARC21 lookup
export interface DetailedLibraryBook {
    titleID: number;
    title: string;
    author: string;
    yearOfPublication: number;
    materialType: string;
    callNumber: string;
    isAvailable: boolean;
    tags: string[];
}

// 3. Search function (unchanged)
export async function searchPhysicalBooks(searchTerm: string): Promise<LibraryBook[]> {
    if (!searchTerm) return [];

    const url = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/searchCatalog?clientID=DS_CLIENT&term1="${searchTerm}"&hitsToDisplay=50&includeAvailabilityInfo=true&json=true`;

    try {
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const data = await response.json();

        if (!data.HitlistTitleInfo) return [];

        const physicalBooks = data.HitlistTitleInfo.filter(
            (book: any) => book.materialType === "BOOK"
        );

        return physicalBooks;

    } catch (error) {
        console.error("Kütüphane verisi çekilemedi:", error);
        return [];
    }
}

// 4. Detailed book info with MARC21 tags
export async function getDetailedBookInfo(titleID: number): Promise<DetailedLibraryBook | null> {
    const url = `http://catalog-db.iyte.edu.tr:8080/symws/rest/standard/lookupTitleInfo?clientID=DS_CLIENT&titleID=${titleID}&includeItemInfo=TRUE&includeAvailabilityInfo=TRUE&includeCatalogingInfo=TRUE&includeOPACInfo=TRUE&includeItemCategory=TRUE&marcEntryFilter=ALL&json=true`;

    try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error('API Hatası');

        const data = await response.json();

        if (!data.TitleInfo || data.TitleInfo.length === 0) return null;

        const bookData = data.TitleInfo[0];

        // 1. Basic info
        const isAvailable = bookData.TitleAvailabilityInfo?.totalCopiesAvailable > 0;
        const callNumber = bookData.CallInfo?.[0]?.callNumber || "Bilinmiyor";

        // 2. Extract tags from MARC21 fields 650 and 651
        const extractedTags: string[] = [];

        if (bookData.BibliographicInfo?.MarcEntryInfo) {
            bookData.BibliographicInfo.MarcEntryInfo.forEach((entry: any) => {
                if (entry.entryID === "650" || entry.entryID === "651") {
                    let cleanTag = entry.text
                        .replace(/\.$/, "")
                        .replace(/--Fiction/i, "")
                        .replace(/--Juvenile fiction/i, "")
                        .trim();

                    if (cleanTag && !extractedTags.includes(cleanTag)) {
                        extractedTags.push(cleanTag);
                    }
                }
            });
        }

        return {
            titleID: bookData.titleID,
            title: bookData.title || "Unknown",
            author: bookData.author ? bookData.author.replace(/,$/, "").trim() : "Unknown",
            yearOfPublication: bookData.yearOfPublication,
            materialType: bookData.materialType,
            callNumber: callNumber,
            isAvailable: isAvailable,
            tags: extractedTags,
        };

    } catch (error) {
        console.error("Kitap detayı çekilemedi:", error);
        return null;
    }
}