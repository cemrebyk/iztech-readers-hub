"use client"

import { useRouter, useSearchParams } from 'next/navigation'

interface CategoryFilterProps {
    categories: { name: string; count: number }[]
    totalBooks: number
}

export default function CategoryFilter({ categories, totalBooks }: CategoryFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const activeCategory = searchParams.get('category') || ''

    const handleCategoryClick = (category: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (category === activeCategory) {
            // Toggle off if clicking the active category
            params.delete('category')
        } else {
            params.set('category', category)
        }

        const queryString = params.toString()
        router.push(`/books${queryString ? `?${queryString}` : ''}`)
    }

    const handleShowAll = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('category')
        const queryString = params.toString()
        router.push(`/books${queryString ? `?${queryString}` : ''}`)
    }

    return (
        <div className="sidebar-section">
            <h3>📂 Categories</h3>
            <ul className="filter-list">
                <li>
                    <button
                        className={`filter-btn${!activeCategory ? ' active' : ''}`}
                        onClick={handleShowAll}
                    >
                        <span>All Books</span>
                        <span className="count">{totalBooks}</span>
                    </button>
                </li>
                {categories.map((cat) => (
                    <li key={cat.name}>
                        <button
                            className={`filter-btn${activeCategory === cat.name ? ' active' : ''}`}
                            onClick={() => handleCategoryClick(cat.name)}
                        >
                            <span>{cat.name}</span>
                            <span className="count">{cat.count}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
