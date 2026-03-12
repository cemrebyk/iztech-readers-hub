"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomepageSignup() {
    const [email, setEmail] = useState('')
    const router = useRouter()

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault()
        if (email) {
            // Kullanıcının yazdığı maili URL'ye ekleyerek signup sayfasına fırlatıyoruz
            router.push(`/signup?email=${encodeURIComponent(email)}`)
        } else {
            router.push('/signup')
        }
    }

    return (
        <form onSubmit={handleJoin} style={{ display: 'flex', gap: '10px', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
            <input
                type="email"
                placeholder="adsoyad@std.iyte.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: '30px',
                    border: '1px solid #ccc',
                    fontSize: '1rem'
                }}
            />
            <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: '30px', padding: '12px 25px' }}
            >
                Join Club
            </button>
        </form>
    )
}