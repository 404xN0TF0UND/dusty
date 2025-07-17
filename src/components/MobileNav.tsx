import React from 'react';
import './MobileNav.css';

interface MobileNavProps {
  currentSection: 'home' | 'add' | 'profile' | 'stats' | 'sms';
  onSectionChange: (section: 'home' | 'add' | 'profile' | 'stats' | 'sms') => void;
  onAddChore: () => void;
  onAchievementClick: () => void;
  onChatClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ 
  currentSection, 
  onSectionChange, 
  onAddChore,
  onAchievementClick,
  onChatClick
}) => {
  return (
    <nav className="mobile-nav">
      <button 
        className={`nav-item ${currentSection === 'home' ? 'active' : ''}`}
        onClick={() => onSectionChange('home')}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
        <span className="nav-label">Chores</span>
      </button>
      
      <button 
        className="nav-item add-chore-btn"
        onClick={onAddChore}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        <span className="nav-label">Add</span>
      </button>
      
      <button 
        className={`nav-item ${currentSection === 'stats' ? 'active' : ''}`}
        onClick={() => onSectionChange('stats')}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span className="nav-label">Stats</span>
      </button>

     {/* Chat with Dusty button */}
     <button 
       className="nav-item chat-btn"
       onClick={onChatClick}
     >
       <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
         <path d="M20 17.17V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v16l4-4h10a2 2 0 0 0 2-2zM6 4h12v13.17L18.17 18H6V4z"/>
       </svg>
       <span className="nav-label">Chat</span>
     </button>
      
      <button 
        className={`nav-item ${currentSection === 'profile' ? 'active' : ''}`}
        onClick={() => onSectionChange('profile')}
      >
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
}; 