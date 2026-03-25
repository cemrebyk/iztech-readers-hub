import Navbar from '../../../components/Navbar';
import EnsureBookActions from './EnsureBookActions';
import { notFound } from 'next/navigation';
import { getDetailedBookInfo } from '../../../../lib/library-api';

export const dynamic = 'force-dynamic';

export default async function CatalogBookDetailPage({
    params,
    searchParams
}: {
    params: Promise<{ titleID: string }>;
    searchParams: Promise<{ title?: string; author?: string; year?: string; callNumber?: string; copies?: string }>;
}) {
    const resolvedParams = await params;
    const titleID = resolvedParams.titleID;
    const resolvedSearch = await searchParams;

    // Always fetch detailed info to get tags from MARC21
    const detailedBook = await getDetailedBookInfo(parseInt(titleID));

    // Use detailed API data if available, fall back to query params
    const bookTitle = detailedBook?.title || resolvedSearch.title || '';
    const bookAuthor = detailedBook?.author || resolvedSearch.author || '';
    const bookYear = detailedBook?.yearOfPublication || parseInt(resolvedSearch.year || '0');
    const bookCallNumber = detailedBook?.callNumber || resolvedSearch.callNumber || '';
    const bookCopies = detailedBook ? (detailedBook.isAvailable ? 1 : 0) : parseInt(resolvedSearch.copies || '0');
    const isAvailable = detailedBook?.isAvailable ?? bookCopies > 0;
    const bookTags = detailedBook?.tags || [];

    if (!bookTitle) {
        notFound();
    }

    const coverGradient = "linear-gradient(135deg, #2d6a4f 0%, #1b4030 100%)";

    return (
        <>
            <Navbar />

            <main className="book-details-main">
                <section className="book-details-hero" style={{ padding: '60px 0', background: '#fdfbf7' }}>
                    <div className="container">
                        <div className="book-details-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '50px', alignItems: 'start' }}>

                            {/* Left: Book Cover */}
                            <div className="book-cover-large">
                                <div className="book-cover-inner" style={{
                                    background: coverGradient,
                                    height: '500px',
                                    borderRadius: '10px 20px 20px 10px',
                                    boxShadow: '20px 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <span className="book-spine-large" style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '0',
                                        bottom: '0',
                                        width: '5px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: '2px'
                                    }}></span>
                                    <div className="book-title-cover-large" style={{
                                        color: 'white',
                                        padding: '40px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '1.8rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {bookTitle}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Book Info */}
                            <div className="book-details-info">
                                <div className="breadcrumb" style={{ marginBottom: '15px', color: '#666' }}>
                                    <a href="/books" style={{ color: '#9a0e20', textDecoration: 'none' }}>Books</a> &gt; <span>IYTE Catalog</span> &gt; <span>{bookTitle}</span>
                                </div>

                                <div style={{
                                    display: 'inline-block',
                                    background: 'linear-gradient(135deg, #2d6a4f, #1b4030)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    marginBottom: '15px',
                                    fontWeight: 'bold'
                                }}>
                                    📖 From IYTE Library Catalog
                                </div>

                                <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: '#1a1a1a' }}>{bookTitle}</h1>
                                <p className="book-author-large" style={{ fontSize: '1.5rem', color: '#9a0e20', marginBottom: '20px' }}>
                                    {bookAuthor}
                                </p>

                                {/* Subject Tags */}
                                {bookTags.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        marginBottom: '25px'
                                    }}>
                                        {bookTags.map((tag) => (
                                            <span key={tag} className="tag" style={{
                                                background: 'var(--color-sepia-light, #f5f0e8)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                fontWeight: 500,
                                            }}>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Library Availability */}
                                <div className="shelf-info" style={{
                                    background: 'white',
                                    padding: '25px',
                                    borderRadius: '15px',
                                    border: '1px solid #e0e0e0',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    marginBottom: '30px'
                                }}>
                                    <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Library Availability</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                        <span style={{
                                            padding: '10px 20px',
                                            borderRadius: '30px',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            background: isAvailable ? '#e6f4ea' : '#fce8e6',
                                            color: isAvailable ? '#1e7e34' : '#c5221f'
                                        }}>
                                            {isAvailable ? '📍 Available on Shelf' : '⏳ Currently Borrowed'}
                                        </span>
                                    </div>
                                    <p style={{ margin: '5px 0' }}>
                                        <strong>Shelf Location:</strong>{' '}
                                        <code style={{ background: '#f4f4f4', padding: '2px 6px', borderRadius: '4px' }}>
                                            {bookCallNumber || 'N/A'}
                                        </code>
                                    </p>
                                    {bookYear > 0 && (
                                        <p style={{ margin: '5px 0' }}>
                                            <strong>Year:</strong> {bookYear}
                                        </p>
                                    )}
                                </div>

                                {/* Lazy-load Action */}
                                <EnsureBookActions catalogBook={{
                                    titleID: parseInt(titleID),
                                    title: bookTitle,
                                    author: bookAuthor,
                                    yearOfPublication: bookYear,
                                    callNumber: bookCallNumber,
                                    isAvailable: isAvailable,
                                    tags: bookTags,
                                }} />
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
