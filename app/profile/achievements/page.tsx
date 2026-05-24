import { createClient } from '../../../lib/supabase-server';
import { redirect } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

type Achievement = {
    id: string;
    name: string;
    description: string;
    icon: string | null;
    category: string;
};

const CATEGORIES = [
    { key: 'all', label: 'Tümü' },
    { key: 'Değerlendirme', label: '✍️ Değerlendirme' },
    { key: 'Listeler', label: '📋 Listeler' },
    { key: 'Keşif', label: '🧭 Keşif' },
    { key: 'Aktivite', label: '🔥 Aktivite' },
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

    // Fetch all achievement definitions + user's unlocked rows in parallel
    const [{ data: allAchievementsData }, { data: userBadges }] = await Promise.all([
        supabase
            .from('achievements')
            .select('id, name, description, icon, category'),
        supabase
            .from('user_achievements')
            .select('achievement_id, unlocked_at')
            .eq('user_id', user.id),
    ]);

    const allAchievements: Achievement[] = (allAchievementsData || []) as Achievement[];

    const unlockedMap = new Map(
        (userBadges || []).map((b: any) => [b.achievement_id, b.unlocked_at])
    );
    const unlockedIds = new Set(unlockedMap.keys());

    const selectedCategory = (params?.category as string) || 'all';

    const filteredAchievements = selectedCategory === 'all'
        ? allAchievements
        : allAchievements.filter(a => a.category === selectedCategory);

    const totalUnlocked = allAchievements.filter(a => unlockedIds.has(a.id)).length;
    const progressPercent = allAchievements.length === 0
        ? 0
        : Math.round((totalUnlocked / allAchievements.length) * 100);

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
                                    {totalUnlocked} / {allAchievements.length}
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
