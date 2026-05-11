"use client"

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase' // Mevcut yolun
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Next.js optimizasyonu için ekledik

export default function Navbar() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user || null)
        })

        return () => authListener.subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <nav className="navbar" id="navbar">
            <div className="container nav-container">
                <Link href="/" className="logo">
                    <span className="logo-icon">📚</span>
                    <span className="logo-text">IZTECH <span className="highlight">Reader's Hub</span></span>
                </Link>
                <ul className="nav-links">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/books">Browse Books</Link></li>

                    {user ? (
                        <>
                            {/* YENİ EKLENEN KISIM: Kampüs Akışı */}
                            <li>
                                <Link href="/feed" className="nav-link-special">
                                    📢 Kampüs Akışı
                                </Link>
                            </li>
                            <li>
                                <Link href="/profile" style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    👤 Profilim
                                </Link>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '8px 15px' }}>
                                    Çıkış Yap
                                </button>
                            </li>
                        </>
                    ) : (
                        <li><Link href="/login" className="btn btn-primary">Sign In</Link></li>
                    )}
                </ul>
            </div>
        </nav>
    )
}