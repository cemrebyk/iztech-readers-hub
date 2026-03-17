import { createClient } from '../../../../lib/supabase-server';
import { notFound } from 'next/navigation';
import Navbar from '../../../components/Navbar';
import Link from 'next/link';

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // İlişkisel sorgu: list_items üzerinden books tablosuna resmi fkey ile bağlanıyoruz
    const { data: listData, error } = await supabase
        .from('book_lists')
        .select(`
            name,
            description,
            list_items (
                added_at,
                books:book_id (
                    id,
                    title,
                    author,
                    is_available,
                    shelf_location
                )
            )
        `)
        .eq('id', id)
        .single();

    // Hata yönetimi (Cüneyt Hoca için debug bilgisi ekli)
    if (error || !listData) {
        console.error("Detay sayfası hatası:", error);
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: '#9a0e20', fontFamily: 'sans-serif' }}>
                <Navbar />
                <div style={{ marginTop: '50px', background: 'white', padding: '30px', borderRadius: '15px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                    <h2>⚠️ Bir Şeyler Ters Gitti</h2>
                    <p style={{ color: '#666' }}>{error?.message || "Liste verisi çekilemedi."}</p>
                    <Link href="/profile" style={{ color: '#9a0e20', fontWeight: 'bold' }}>Profile Geri Dön</Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main style={{ padding: '40px 0', background: '#fdfbf7', minHeight: '100vh', color: '#1a1a1a' }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>

                    {/* Liste Üst Bilgisi */}
                    <div style={{ marginBottom: '40px', borderBottom: '3px solid #9a0e20', paddingBottom: '20px' }}>
                        <Link href="/profile" style={{ color: '#9a0e20', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            ← PROFİLE DÖN
                        </Link>
                        <h1 style={{ fontSize: '2.8rem', marginTop: '15px', marginBottom: '10px', color: '#1a1a1a' }}>{listData.name}</h1>
                        <p style={{ color: '#555', fontSize: '1.2rem', lineHeight: '1.6' }}>
                            {listData.description || "Bu koleksiyon için bir açıklama girilmemiş."}
                        </p>
                        <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#999' }}>
                            Toplam {listData.list_items?.length || 0} kitap
                        </div>
                    </div>

                    {/* Kitaplar Listesi */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {listData.list_items && listData.list_items.length > 0 ? (
                            listData.list_items.map((item: any) => (
                                <div key={item.books.id} style={{
                                    background: 'white',
                                    padding: '25px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    border: '1px solid #f0f0f0'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <Link href={`/books/${item.books.id}`} style={{ textDecoration: 'none' }}>
                                            <h3 style={{ margin: 0, color: '#1a1a1a', fontSize: '1.4rem' }}>{item.books.title}</h3>
                                        </Link>
                                        <p style={{ margin: '8px 0', color: '#9a0e20', fontWeight: '600' }}>{item.books.author}</p>
                                        <span style={{ fontSize: '0.8rem', color: '#bbb' }}>
                                            Eklendi: {new Date(item.added_at).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>

                                    {/* Kütüphane Durum Göstergesi */}
                                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                                        <div style={{
                                            padding: '6px 14px',
                                            borderRadius: '25px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            display: 'inline-block',
                                            background: item.books.is_available ? '#e6f4ea' : '#fce8e6',
                                            color: item.books.is_available ? '#1e7e34' : '#c5221f',
                                            marginBottom: '8px'
                                        }}>
                                            {item.books.is_available ? '● RAFTA' : '○ ÖDÜNÇTE'}
                                        </div>
                                        {item.books.is_available && (
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                                                Konum: <strong>{item.books.shelf_location}</strong>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '20px', border: '2px dashed #eee' }}>
                                <p style={{ fontSize: '1.2rem', color: '#999' }}>Bu liste henüz boş. Keşfet sayfasından kitap eklemeye başla!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}