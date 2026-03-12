"use client"

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            // Supabase Giriş İsteği
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            setMessage({ type: 'success', text: 'Giriş başarılı! Yönlendiriliyorsunuz...' })

            // Giriş başarılıysa kısa bir süre bekleyip anasayfaya (veya profile) yönlendir
            setTimeout(() => {
                router.push('/')
            }, 1000)

        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: 'E-posta veya şifre hatalı.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <nav className="navbar" id="navbar">
                <div className="container nav-container">
                    <a href="/" className="logo">
                        <span className="logo-icon">📚</span>
                        <span className="logo-text">IZTECH <span className="highlight">Reader's Hub</span></span>
                    </a>
                    <ul className="nav-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/books">Browse Books</a></li>
                    </ul>
                </div>
            </nav>

            <main className="books-main" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container" style={{ maxWidth: '500px' }}>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--color-sepia)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <span style={{ fontSize: '3rem' }}>🔑</span>
                            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Welcome Back</h1>
                            <p style={{ color: 'var(--color-text-muted)' }}>Kitap dünyasına geri dön.</p>
                        </div>

                        {message.text && (
                            <div style={{
                                padding: '15px',
                                marginBottom: '20px',
                                borderRadius: '8px',
                                background: message.type === 'error' ? '#fee2e2' : '#dcfce3',
                                color: message.type === 'error' ? '#991b1b' : '#166534',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                textAlign: 'center'
                            }}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>İYTE E-posta Adresi</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="adsoyad@std.iyte.edu.tr"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Şifre</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Şifreniz"
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: '100%', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
                            >
                                {loading ? '⏳ Giriş Yapılıyor...' : 'Giriş Yap'}
                            </button>
                        </form>

                        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                            Hesabın yok mu? <a href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Hemen Kayıt Ol</a>
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}