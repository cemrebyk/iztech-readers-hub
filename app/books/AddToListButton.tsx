"use client"

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'

interface AddToListButtonProps {
    bookId: string;
    isAuth: boolean;
}

interface UserList {
    id: string;
    name: string;
    alreadyAdded: boolean;
}

export default function AddToListButton({ bookId, isAuth }: AddToListButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [lists, setLists] = useState<UserList[]>([])
    const [loading, setLoading] = useState(false)
    const [addingToList, setAddingToList] = useState<string | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const btnRef = useRef<HTMLButtonElement>(null)
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null)

    // Close popover on outside click
    useEffect(() => {
        if (!isOpen) return
        const handleClick = (e: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    // Fetch user's lists + check which ones already contain this book
    const fetchLists = async () => {
        setLoading(true)
        setMessage(null)

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setLoading(false)
                return
            }

            // Fetch all user lists
            const { data: userLists, error: listsError } = await supabase
                .from('book_lists')
                .select('id, name')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (listsError || !userLists) {
                setMessage({ type: 'error', text: 'Could not load lists.' })
                setLoading(false)
                return
            }

            // Fetch which lists already have this book
            const { data: existingItems } = await supabase
                .from('list_items')
                .select('list_id')
                .eq('book_id', bookId)
                .in('list_id', userLists.map(l => l.id))

            const addedListIds = new Set(existingItems?.map(i => i.list_id) || [])

            setLists(userLists.map(l => ({
                id: l.id,
                name: l.name,
                alreadyAdded: addedListIds.has(l.id)
            })))
        } catch {
            setMessage({ type: 'error', text: 'Could not load lists.' })
        } finally {
            setLoading(false)
        }
    }

    const handleOpen = () => {
        if (!isAuth) {
            setIsOpen(true)
            // Position the popover
            if (btnRef.current) {
                const rect = btnRef.current.getBoundingClientRect()
                setPopoverPos({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX
                })
            }
            return
        }

        setIsOpen(true)
        // Position the popover
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setPopoverPos({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX
            })
        }
        fetchLists()
    }

    const handleAddToList = async (listId: string) => {
        setAddingToList(listId)
        setMessage(null)

        try {
            const { error } = await supabase
                .from('list_items')
                .insert([{ list_id: listId, book_id: bookId }])

            if (error) {
                if (error.code === '23505') {
                    setMessage({ type: 'error', text: 'Already in this list.' })
                } else {
                    setMessage({ type: 'error', text: error.message })
                }
            } else {
                // Mark as added locally
                setLists(prev => prev.map(l =>
                    l.id === listId ? { ...l, alreadyAdded: true } : l
                ))
                setMessage({ type: 'success', text: 'Added! ✨' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to add.' })
        } finally {
            setAddingToList(null)
        }
    }

    return (
        <>
            <button
                ref={btnRef}
                className="btn btn-sm btn-secondary add-to-list-trigger"
                onClick={handleOpen}
                title="Add to list"
            >
                📌 List
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Invisible overlay to catch outside clicks */}
                    <div
                        className="add-to-list-overlay"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        ref={popoverRef}
                        className="add-to-list-popover"
                        style={{
                            top: popoverPos?.top ?? 0,
                            left: popoverPos?.left ?? 0,
                        }}
                    >
                        <div className="add-to-list-header">
                            <span className="add-to-list-title">📌 Add to List</span>
                            <button className="add-to-list-close" onClick={() => setIsOpen(false)}>&times;</button>
                        </div>

                        {!isAuth ? (
                            <div className="add-to-list-body" style={{ textAlign: 'center', padding: '16px' }}>
                                <p style={{ color: '#666', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    Sign in to add books to your lists.
                                </p>
                                <a href="/login" className="btn btn-primary btn-sm">Sign in</a>
                            </div>
                        ) : loading ? (
                            <div className="add-to-list-body" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                <span className="add-to-list-spinner">⏳</span> Loading lists...
                            </div>
                        ) : lists.length === 0 ? (
                            <div className="add-to-list-body" style={{ textAlign: 'center', padding: '16px' }}>
                                <p style={{ color: '#888', marginBottom: '12px', fontSize: '0.9rem' }}>
                                    You haven't created any lists yet.
                                </p>
                                <a href="/profile" className="btn btn-secondary btn-sm">Go to Profile</a>
                            </div>
                        ) : (
                            <ul className="add-to-list-items">
                                {lists.map(list => (
                                    <li key={list.id} className="add-to-list-item">
                                        <button
                                            className={`add-to-list-item-btn ${list.alreadyAdded ? 'already-added' : ''}`}
                                            onClick={() => !list.alreadyAdded && handleAddToList(list.id)}
                                            disabled={list.alreadyAdded || addingToList === list.id}
                                        >
                                            <span className="add-to-list-item-name">{list.name}</span>
                                            <span className="add-to-list-item-status">
                                                {addingToList === list.id
                                                    ? '...'
                                                    : list.alreadyAdded
                                                        ? '✓'
                                                        : '+'}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {message && (
                            <div className={`add-to-list-message ${message.type}`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}
        </>
    )
}
