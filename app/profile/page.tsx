"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchProfile = async () => {
            // 1. Kimin giriş yaptığını bul
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                // Giriş yapmamışsa login'e postala
                router.push('/login')
                return
            }

            // 2. Trigger'ın (Tetikleyicinin) bizim için oluşturduğu profil verisini çek
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (profileData) {
                setProfile(profileData)
            }
            setLoading(false)
        }

        fetchProfile()
    }, [router])

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <h2>⏳ Profil yükleniyor...</h2>
            </div>
        )
    }

    return (
        <>
            <Navbar />

            <main className="profile-main" style={{ padding: '40px 0', background: '#f9f9f9', minHeight: '80vh' }}>
                <div className="container">

                    {/* Profil Başlığı */}
                    <div className="profile-header" style={{ background: 'white', padding: '30px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--color-primary)', color: 'white', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                            {profile?.email?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                            <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>Profilim</h1>
                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>🎓 {profile?.email}</p>
                        </div>
                    </div>

                    {/* İstatistik Kartları (Dashboard) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid var(--color-primary)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-text-muted)' }}>📚 Okunan Kitaplar</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{profile?.books_read || 0}</p>
                        </div>

                        <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid var(--color-gold)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-text-muted)' }}>⭐ Değerlendirmeler</h3>
                            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: 0 }}>{profile?.reviews_count || 0}</p>
                        </div>

                        <div style={{ background: 'white', padding: '25px', borderRadius: '15px', borderLeft: '5px solid var(--color-sepia)', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: 'var(--color-text-muted)' }}>🎯 Favori Tür</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--color-primary)' }}>
                                {profile?.favorite_genre || 'Henüz Belirlenmedi'}
                            </p>
                        </div>
                    </div>

                    {/* Gelecek Hafta (WP6) İçin Hazırlık Alanı */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                        <h2 style={{ marginBottom: '20px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📌 Okuma Listem &amp; Öneriler</h2>

                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-muted)' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '15px' }}>🤖</span>
                            <h3>Sana Özel Öneriler Çok Yakında!</h3>
                            <p>Okuduğun kitaplara ve verdiğin puanlara göre yapay zeka destekli öneri motorumuz (Recommendation Engine) yakında burada olacak.</p>
                            <a href="/books" className="btn btn-primary" style={{ marginTop: '15px' }}>Kitapları Keşfetmeye Başla</a>
                        </div>
                    </div>

                </div>
            </main>
        </>
    )
}
