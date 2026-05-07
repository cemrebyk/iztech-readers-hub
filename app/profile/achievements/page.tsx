import { createClient } from '../../../lib/supabase-server';
import { redirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

// All available achievements in the system — placeholder library/book-related ones
const ALL_ACHIEVEMENTS = [
    {
        id: 'first-book',
        name: 'İlk Adım',
        description: 'İlk kitabını ödünç al',
        icon: '📖',
        category: 'Ödünç Alma',
    },
    {
        id: 'bookworm-5',
        name: 'Kitap Kurdu',
        description: '5 kitap ödünç al',
        icon: '🐛',
        category: 'Ödünç Alma',
    },
    {
        id: 'bookworm-25',
        name: 'Kütüphane Aşığı',
        description: '25 kitap ödünç al',
        icon: '📚',
        category: 'Ödünç Alma',
    },
    {
        id: 'bookworm-100',
        name: 'Okuma Makinesi',
        description: '100 kitap ödünç al',
        icon: '🏭',
        category: 'Ödünç Alma',
    },
    {
        id: 'first-review',
        name: 'İlk Eleştiri',
        description: 'İlk değerlendirmeni yaz',
        icon: '✍️',
        category: 'Değerlendirme',
    },
    {
        id: 'reviewer-10',
        name: 'Kalem Ustası',
        description: '10 değerlendirme yaz',
        icon: '🖊️',
        category: 'Değerlendirme',
    },
    {
        id: 'reviewer-50',
        name: 'Eleştirmen',
        description: '50 değerlendirme yaz',
        icon: '📝',
        category: 'Değerlendirme',
    },
    {
        id: 'five-star',
        name: '5 Yıldız',
        description: 'Bir kitaba 5 yıldız ver',
        icon: '⭐',
        category: 'Değerlendirme',
    },
    {
        id: 'first-list',
        name: 'Koleksiyoncu',
        description: 'İlk okuma listeni oluştur',
        icon: '📋',
        category: 'Listeler',
    },
    {
        id: 'list-master',
        name: 'Liste Ustası',
        description: '5 okuma listesi oluştur',
        icon: '🗂️',
        category: 'Listeler',
    },
    {
        id: 'genre-explorer',
        name: 'Tür Kaşifi',
        description: '5 farklı türde kitap oku',
        icon: '🧭',
        category: 'Keşif',
    },
    {
        id: 'genre-master',
        name: 'Her Türün Ustası',
        description: '10 farklı türde kitap oku',
        icon: '🌍',
        category: 'Keşif',
    },
    {
        id: 'early-bird',
        name: 'Erken Kuş',
        description: 'Ödünç aldığın kitabı süresinden önce iade et',
        icon: '🐦',
        category: 'Kütüphane',
    },
    {
        id: 'punctual',
        name: 'Dakik Okuyucu',
        description: '10 kitabı zamanında iade et',
        icon: '⏰',
        category: 'Kütüphane',
    },
    {
        id: 'streak-7',
        name: 'Haftalık Seri',
        description: '7 gün üst üste kütüphaneye gir',
        icon: '🔥',
        category: 'Aktivite',
    },
    {
        id: 'streak-30',
        name: 'Aylık Seri',
        description: '30 gün üst üste kütüphaneye gir',
        icon: '💎',
        category: 'Aktivite',
    },
    {
        id: 'social-butterfly',
        name: 'Sosyal Kelebek',
        description: 'Bir kitap kulübüne katıl',
        icon: '🦋',
        category: 'Sosyal',
    },
    {
        id: 'club-founder',
        name: 'Kulüp Kurucusu',
        description: 'Bir kitap kulübü oluştur',
        icon: '🏛️',
        category: 'Sosyal',
    },
    {
        id: 'classic-reader',
        name: 'Klasik Okuyucu',
        description: '10 klasik eser oku',
        icon: '🏺',
        category: 'Keşif',
    },
    {
        id: 'night-owl',
        name: 'Gece Kuşu',
        description: 'Gece 12\'den sonra bir değerlendirme yaz',
        icon: '🦉',
        category: 'Aktivite',
    },
];

const CATEGORIES = [
    { key: 'all', label: 'Tümü' },
    { key: 'Ödünç Alma', label: '📖 Ödünç Alma' },
    { key: 'Değerlendirme', label: '✍️ Değerlendirme' },
    { key: 'Listeler', label: '📋 Listeler' },
    { key: 'Keşif', label: '🧭 Keşif' },
    { key: 'Kütüphane', label: '🏛️ Kütüphane' },
    { key: 'Aktivite', label: '🔥 Aktivite' },
    { key: 'Sosyal', label: '🦋 Sosyal' },
];

export default async function AchievementsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch user's unlocked achievements
    const { data: userBadges } = await supabase
        .from('user_achievements')
        .select('unlocked_at, achievements ( id, name, description, icon_url )')
        .eq('user_id', user.id);

    const unlockedIds = new Set(
        (userBadges || []).map((b: any) => b.achievements?.id).filter(Boolean)
    );
    const unlockedMap = new Map(
        (userBadges || []).map((b: any) => [b.achievements?.id, b.unlocked_at])
    );

    const selectedCategory = (params?.category as string) || 'all';

    const filteredAchievements = selectedCategory === 'all'
        ? ALL_ACHIEVEMENTS
        : ALL_ACHIEVEMENTS.filter(a => a.category === selectedCategory);

    const totalUnlocked = ALL_ACHIEVEMENTS.filter(a => unlockedIds.has(a.id)).length;
    const progressPercent = Math.round((totalUnlocked / ALL_ACHIEVEMENTS.length) * 100);

    return (
        <>
            <Navbar />
            <main className="achievements-page">
                <div className="achievements-container">
                    {/* Header */}
                    <div className="achievements-header">
                        <div className="achievements-header-top">
                            <Link href="/profile" className="achievements-back-btn">
                                ← Profile
                            </Link>
                        </div>
                        <h1 className="achievements-title">🏆 Başarımlar</h1>
                        <p className="achievements-subtitle">
                            Kütüphane maceranı takip et ve rozetleri topla!
                        </p>

                        {/* Progress bar */}
                        <div className="achievements-progress-wrapper">
                            <div className="achievements-progress-info">
                                <span className="achievements-progress-label">İlerleme</span>
                                <span className="achievements-progress-count">
                                    {totalUnlocked} / {ALL_ACHIEVEMENTS.length}
                                </span>
                            </div>
                            <div className="achievements-progress-bar">
                                <div
                                    className="achievements-progress-fill"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <span className="achievements-progress-percent">%{progressPercent}</span>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="achievements-filters">
                        {CATEGORIES.map(cat => (
                            <Link
                                key={cat.key}
                                href={`/profile/achievements${cat.key === 'all' ? '' : `?category=${encodeURIComponent(cat.key)}`}`}
                                className={`achievements-filter-chip ${selectedCategory === cat.key ? 'active' : ''}`}
                            >
                                {cat.label}
                            </Link>
                        ))}
                    </div>

                    {/* Achievements Grid */}
                    <div className="achievements-grid">
                        {filteredAchievements.map(achievement => {
                            const isUnlocked = unlockedIds.has(achievement.id);
                            const unlockedAt = unlockedMap.get(achievement.id);
                            return (
                                <div
                                    key={achievement.id}
                                    className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                                >
                                    <div className="achievement-icon-wrapper">
                                        <span className="achievement-icon">{achievement.icon}</span>
                                        {isUnlocked && (
                                            <span className="achievement-check">✓</span>
                                        )}
                                    </div>
                                    <h3 className="achievement-name">{achievement.name}</h3>
                                    <p className="achievement-desc">{achievement.description}</p>
                                    <span className="achievement-category-tag">{achievement.category}</span>
                                    {isUnlocked && unlockedAt && (
                                        <span className="achievement-date">
                                            {new Date(unlockedAt).toLocaleDateString('tr-TR', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </>
    );
}
