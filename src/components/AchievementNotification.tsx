import React, { useEffect, useState } from 'react';
import { Achievement } from '../services/achievementService';
import './AchievementNotification.css';

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievement,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show notification after a short delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 100);

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Wait for fade out animation
    }, 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6c757d';
      case 'rare': return '#007bff';
      case 'epic': return '#6f42c1';
      case 'legendary': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return '0 0 10px rgba(108, 117, 125, 0.5)';
      case 'rare': return '0 0 15px rgba(0, 123, 255, 0.6)';
      case 'epic': return '0 0 20px rgba(111, 66, 193, 0.7)';
      case 'legendary': return '0 0 25px rgba(253, 126, 20, 0.8)';
      default: return '0 0 10px rgba(108, 117, 125, 0.5)';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`achievement-notification ${isAnimating ? 'animate' : ''}`}>
      <div 
        className="achievement-notification-content"
        style={{
          borderColor: getRarityColor(achievement.rarity),
          boxShadow: getRarityGlow(achievement.rarity)
        }}
      >
        <div className="achievement-icon" style={{ color: getRarityColor(achievement.rarity) }}>
          {achievement.icon}
        </div>
        
        <div className="achievement-info">
          <div className="achievement-header">
            <h3 className="achievement-title">{achievement.title}</h3>
            <span 
              className="achievement-rarity"
              style={{ color: getRarityColor(achievement.rarity) }}
            >
              {achievement.rarity.toUpperCase()}
            </span>
          </div>
          
          <p className="achievement-description">{achievement.description}</p>
          
          <div className="achievement-reward">
            <span className="reward-text">+{achievement.points} points earned!</span>
            <div className="confetti">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="confetti-piece" style={{
                  '--delay': `${i * 0.1}s`,
                  '--color': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'][i]
                } as React.CSSProperties} />
              ))}
            </div>
          </div>
        </div>
        
        <button className="close-notification" onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 500);
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}; 