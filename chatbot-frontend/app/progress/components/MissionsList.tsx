import React from 'react';
import styles from '../styles/missions.module.css';

interface Mission {
  id: number;
  title: string;
  description: string;
  xp_reward: number;
  condition_type: string;
  condition_value: number;
}

interface UserMission {
  id: number;
  mission: Mission;
  progress: number;
  completed: boolean;
  completed_at: string | null;
}

interface MissionsListProps {
  missions: UserMission[];
}

const MissionsList: React.FC<MissionsListProps> = ({ missions }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        Misiones Diarias
      </h2>
      <div className={styles.list}>
        {(!missions || missions.length === 0) ? (
          <div className={styles.emptyState}>
            <p>No hay misiones activas por ahora.</p>
          </div>
        ) : (
          missions.map((um) => (
            <div key={um.id} className={styles.missionCard}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.missionTitle}>{um.mission.title}</h3>
                  <p className={styles.missionDesc}>{um.mission.description}</p>
                </div>
                <div className={`${styles.badge} ${um.completed ? styles.badgeCompleted : styles.badgeActive}`}>
                  {um.completed ? (
                    <><span>Completado</span></>
                  ) : (
                    <><span>+{um.mission.xp_reward} XP</span></>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className={styles.progressContainer}>
                <div className={styles.progressInfo}>
                  <span>Progreso</span>
                  <span className={um.completed ? styles.progressTextCompleted : styles.progressTextActive}>
                    {um.progress} / {um.mission.condition_value}
                  </span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={`${styles.progressBarFill} ${um.completed ? styles.fillCompleted : styles.fillActive}`}
                    style={{ width: `${Math.min((um.progress / um.mission.condition_value) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MissionsList;
