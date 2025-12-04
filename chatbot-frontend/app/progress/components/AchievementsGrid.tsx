import React from 'react';
import styles from '../styles/achievements.module.css';

interface Achievement {
    id: number;
    title: string;
    description: string;
    icon_name: string;
}

interface UserAchievement {
    id: number;
    achievement: Achievement;
    unlocked_at: string;
}

interface AchievementsGridProps {
    achievements: UserAchievement[];
}

const AchievementsGrid: React.FC<AchievementsGridProps> = ({ achievements }) => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>
                Logros y Medallas
            </h2>

            {(!achievements || achievements.length === 0) ? (
                <div className={styles.emptyState}>
                    <p>Aún no has desbloqueado logros.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>¡Sigue practicando!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {achievements.map((ua) => (
                        <div key={ua.id} className={styles.card}>
                            <h3 className={styles.cardTitle}>{ua.achievement.title}</h3>
                            <p className={styles.cardDesc}>{ua.achievement.description}</p>
                            <span className={styles.date}>
                                {new Date(ua.unlocked_at).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AchievementsGrid;
