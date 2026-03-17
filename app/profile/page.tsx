import { createClient } from '../../lib/supabase-server';
import { redirect } from 'next/navigation';
import Navbar from '../components/Navbar';
import CreateListForm from './CreateListForm';
import Link from 'next/link'; // Navigasyon için eklendi

export default async function ProfilePage() {
    const supabase = await createClient();

    // 1. Kimin giriş yaptığını bul (Server Side Authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login');
    }

    // 2. Profil ve Listeleri paralel çek (Performance Optimization)
    const [profileRes, listsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('book_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);

    const profile = profileRes.data;
    const userLists = listsRes.data || [];

    return (
        <>
            <Navbar />
            <main className="profile-main" style={{ padding: '40px 0', background: '#f9f9f9', minHeight: '80vh' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                    {/* Profil Başlığı */}
                    <div className="profile-header" style={{ background: 'white', padding: '30px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#9a0e20', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                            {profile?.email?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>Profilim</h1>
                            <p style={{ margin: 0, color: '#666', fontSize: '1.1rem' }}>🎓 {user?.email}</p>
                        </div>
                    </div>

                    {/* İstatistik Kartları */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid #9a0e20', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>📚 Okunan Kitaplar</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{profile?.books_read || 0}</p>
                        </div>
                    </div>

                    {/* OKUMA LİSTELERİ */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📌 Okuma Listelerim</h2>

                        <CreateListForm />

                        <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
                            {userLists.map((list: any) => (
                                <Link
                                    href={`/profile/list/${list.id}`}
                                    key={list.id}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="list-card" style={{
                                        padding: '20px',
                                        border: '1px solid #eee',
                                        borderRadius: '12px',
                                        background: 'white',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        // "Antigravity" etkisi için hover:
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: '#9a0e20', fontSize: '1.2rem' }}>{list.name}</h4>
                                            <p style={{ margin: '5px 0 0 0', fontSize: '0.95rem', color: '#666' }}>
                                                {list.description || "Açıklama yok."}
                                            </p>
                                        </div>
                                        <div style={{ color: '#9a0e20', fontSize: '1.2rem' }}>
                                            →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {userLists.length === 0 && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>Henüz bir listen yok. Yukarıdan oluşturabilirsin!</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}