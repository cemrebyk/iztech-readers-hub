"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        // 1. Sayfa yüklendiğinde oturum açmış biri var mı diye kontrol et
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        // 2. Kullanıcı giriş/çıkış yaptığında Navbar'ı anında güncelle (Dinleyici)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null)
        })

        return () => authListener.subscription.unsubscribe()
    }, [])

    // Çıkış Yapma Fonksiyonu
    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/') // Çıkış yapınca ana sayfaya at
    }

    return (
        <nav className="navbar" id="navbar">
            <div className="container nav-container">
                <a href="/" className="logo">
                    <span className="logo-icon">📚</span>
                    <span className="logo-text">IZTECH <span className="highlight">Reader's Hub</span></span>
                </a>
                <ul className="nav-links">
                    <li><a href="/">Home</a></li>
                    <li><a href="/books">Browse Books</a></li>

                    {/* EĞER KULLANICI GİRİŞ YAPMIŞSA: */}
                    {user ? (
                        <>
                            <li>
                                <a href="/profile" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    👤 Profilim
                                </a>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '8px 15px' }}>
                                    Çıkış Yap
                                </button>
                            </li>
                        </>
                    ) : (
                        /* EĞER KULLANICI GİRİŞ YAPMAMIŞSA: */
                        <li><a href="/login" className="btn btn-primary">Sign In</a></li>
                    )}
                </ul>
            </div>
        </nav>
    )
}