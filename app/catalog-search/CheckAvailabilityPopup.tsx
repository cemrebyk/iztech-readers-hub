"use client";

export default function CheckAvailabilityPopup({ title, isAvailable }: { title: string, isAvailable: boolean }) {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                alert(`"${title}" availability status:\n\nStatus: ${isAvailable ? 'Available on Shelf ✅' : 'Currently Borrowed ⏳'}`);
            }}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                backgroundColor: '#ffffff',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary)',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            title="Check live availability"
        >
            🔄 Check Availability
        </button>
    );
}
