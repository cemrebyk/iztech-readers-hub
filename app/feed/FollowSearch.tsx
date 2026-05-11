"use client"

import { useState } from 'react'
import { followUserByEmail } from './actions'

export default function FollowSearch() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState({ text: '', type: '' })
    const [loading, setLoading] = useState(false)

    const handleFollow = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ text: '', type: '' })

        try {
            const result = await followUserByEmail(email)
            if (result.success) {
                setMessage({ text: 'Kullanıcı başarıyla takip edildi!', type: 'success' })
                setEmail('')
            }
        } catch (err: any) {
            setMessage({ text: err.message || 'Bir hata oluştu.', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            padding: '24px',
            background: 'var(--color-white, #ffffff)',
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid var(--color-sepia, #e8dcc8)',
            boxShadow: '0 2px 8px rgba(45, 42, 38, 0.06)',
        }}>
            <h3 style={{
                marginBottom: '14px',
                color: 'var(--color-text, #2d2a26)',
                fontFamily: "'Merriweather', Georgia, serif",
                fontSize: '1.05rem',
                fontWeight: 700,
            }}>
                🔍 Arkadaşlarını Takip Et
            </h3>
            <form onSubmit={handleFollow} style={{ display: 'flex', gap: '10px' }}>
                <input
                    type="email"
                    placeholder="ogrenci@std.iyte.edu.tr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: '2px solid var(--color-sepia, #e8dcc8)',
                        background: 'var(--color-cream, #faf8f5)',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                        outline: 'none',
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary, #9a0e20)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(154, 14, 32, 0.1)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-sepia, #e8dcc8)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        minWidth: '130px',
                        padding: '12px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--color-primary, #9a0e20)',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(154, 14, 32, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.currentTarget.style.background = 'var(--color-primary-dark, #7a0b19)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(154, 14, 32, 0.4)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary, #9a0e20)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(154, 14, 32, 0.3)';
                    }}
                >
                    {loading ? 'Ekleniyor...' : 'Takip Et'}
                </button>
            </form>
            {message.text && (
                <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: message.type === 'error'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : 'rgba(45, 106, 79, 0.08)',
                    color: message.type === 'error'
                        ? '#dc2626'
                        : 'var(--color-success, #2d6a4f)',
                    border: `1px solid ${message.type === 'error'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(45, 106, 79, 0.2)'}`,
                }}>
                    {message.type === 'error' ? '⚠️' : '✅'} {message.text}
                </div>
            )}
        </div>
    )
}