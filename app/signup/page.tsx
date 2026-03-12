"use client"

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Navbar from '../components/Navbar'

export default function SignUpPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    useEffect(() => {
        // Sayfa yüklendiğinde URL'de "email" parametresi var mı diye bakar
        const params = new URLSearchParams(window.location.search)
        const emailFromUrl = params.get('email')

        // Varsa input kutusuna otomatik yazar
        if (emailFromUrl) {
            setEmail(emailFromUrl)
        }
    }, [])

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        // 1. İYTE Kampüs Filtresi (Sihirli Dokunuş)
        if (!email.endsWith('@std.iyte.edu.tr')) {
            setMessage({ type: 'error', text: 'Sadece @std.iyte.edu.tr uzantılı İYTE öğrenci e-postası ile kayıt olabilirsiniz!' })
            setLoading(false)
            return
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Şifreniz en az 6 karakter olmalıdır.' })
            setLoading(false)
            return
        }

        try {
            // 2. Supabase'e Kayıt İsteği Atıyoruz
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) throw error

            // 3. Başarılı Kayıt Mesajı
            setMessage({ type: 'success', text: '🎉 Kayıt başarılı! İYTE Reader\'s Hub\'a hoş geldin.' })

            // Formu temizle
            setEmail('')
            setPassword('')

        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: error.message || 'Kayıt olurken bir hata oluştu.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Navbar />

            <main className="books-main" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container" style={{ maxWidth: '500px' }}>
                    <div style={{ background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid var(--color-sepia)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <span style={{ fontSize: '3rem' }}>🎓</span>
                            <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Join the Club</h1>
                            <p style={{ color: 'var(--color-text-muted)' }}>IZTECH öğrencilerine özel kitap dünyasına adım at.</p>
                        </div>

                        {/* Uyarı ve Başarı Mesajları */}
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

                        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                    placeholder="En az 6 karakter"
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
                                {loading ? '⏳ Kaydediliyor...' : 'Kayıt Ol'}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </>
    )
}