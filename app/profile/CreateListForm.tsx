"use client";
import { createBookList } from '../../lib/actions/lists';
import { useState } from 'react';

const PREDEFINED_LISTS = [
    { name: "📚 To Be Read", emoji: "📚" },
    { name: "✅ Read", emoji: "✅" },
    { name: "⭐ Favorites", emoji: "⭐" },
    { name: "👍 Recommended", emoji: "👍" },
    { name: "🚫 DNF (Did Not Finish)", emoji: "🚫" },
    { name: "🎓 Academic-Related", emoji: "🎓" },
    { name: "🔄 Currently Reading", emoji: "🔄" },
    { name: "🎁 Wishlist", emoji: "🎁" },
    { name: "📖 Book Club Picks", emoji: "📖" },
    { name: "🌟 All-Time Greats", emoji: "🌟" },
];

interface CreateListFormProps {
    existingListNames: string[];
}

export default function CreateListForm({ existingListNames }: CreateListFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState('');

    // Filter out lists the user already has
    const availableLists = PREDEFINED_LISTS.filter(
        (preset) => !existingListNames.includes(preset.name)
    );

    const handleSubmit = async (formData: FormData) => {
        setErrorMsg(null);

        const result = await createBookList(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
            setSelectedName('');
        }
    };

    if (availableLists.length === 0 && !isOpen) {
        return (
            <div style={{
                marginBottom: '30px',
                padding: '15px 20px',
                background: 'var(--color-cream)',
                borderRadius: '10px',
                color: '#666',
                fontSize: '0.9rem',
                textAlign: 'center'
            }}>
                ✨ You've created all available lists!
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '30px' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="btn btn-secondary"
            >
                {isOpen ? 'Cancel' : '+ Create New List'}
            </button>

            {isOpen && (
                <form action={handleSubmit} style={{
                    marginTop: '20px',
                    padding: '25px',
                    background: 'var(--color-cream)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-sepia)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>

                    {errorMsg && (
                        <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: '#fee2e2',
                            color: '#991b1b',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Choose a List</label>
                        <select
                            name="name"
                            required
                            value={selectedName}
                            onChange={(e) => setSelectedName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-sepia)',
                                fontSize: '1rem',
                                background: 'white',
                                cursor: 'pointer',
                                appearance: 'auto'
                            }}
                        >
                            <option value="">Select a list type...</option>
                            {availableLists.map((preset) => (
                                <option key={preset.name} value={preset.name}>
                                    {preset.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={!selectedName}
                    >
                        Create List
                    </button>
                </form>
            )}
        </div>
    );
}