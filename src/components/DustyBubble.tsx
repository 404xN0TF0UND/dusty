import React, { useEffect, useState } from 'react';
import { DustyMessage } from '../types';
import './DustyBubble.css';

interface DustyBubbleProps {
  message: DustyMessage;
  onAnimationComplete?: () => void;
}

export const DustyBubble: React.FC<DustyBubbleProps> = ({ message, onAnimationComplete }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onAnimationComplete?.();
      }, 300); // Wait for fade out animation
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [message, onAnimationComplete]);

  return (
    <div className={`dusty-bubble ${isVisible ? 'visible' : ''}`} data-type={message.type}>
      <div className="dusty-avatar">
        <div className="dusty-face">
          <div className="dusty-eyes">
            <div className="dusty-eye left"></div>
            <div className="dusty-eye right"></div>
          </div>
          <div className="dusty-mouth"></div>
        </div>
      </div>
      <div className="dusty-message">
        <div className="message-content">
          {message.text}
        </div>
        <div className="message-timestamp">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}; 