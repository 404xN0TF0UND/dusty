import React, { useState, useEffect, useRef } from 'react';
import { dustyPersonality } from '../services/dustyPersonality';
import { User, Chore } from '../types';
import './DustyChat.css';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'dusty';
  timestamp: Date;
  type?: 'greeting' | 'chore_suggestion' | 'mood' | 'error' | 'general' | 'chore_command' | 'chore_list';
}

interface DustyChatProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  chores: Chore[];
  onAddChore?: () => void;
  onCompleteChore?: (choreId: string) => void;
  onClaimChore?: (choreId: string) => void;
  onChoreSuggestion?: (suggestion: string) => void;
}

export const DustyChat: React.FC<DustyChatProps> = ({
  currentUser,
  isOpen,
  onClose,
  chores,
  onAddChore,
  onCompleteChore,
  onClaimChore,
  onChoreSuggestion
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize chat with greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      const greeting = await dustyPersonality.getContextualGreeting(currentUser.id, currentUser.displayName);
      const mood = dustyPersonality.getDustyMood();
      
      setMessages([
        {
          id: '1',
          text: greeting,
          sender: 'dusty',
          timestamp: new Date(),
          type: 'greeting'
        },
        {
          id: '2',
          text: `My current mood: ${mood.current} - ${mood.reason}`,
          sender: 'dusty',
          timestamp: new Date(),
          type: 'mood'
        }
      ]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setMessages([
        {
          id: '1',
          text: "Oh, you're back. What do you want now?",
          sender: 'dusty',
          timestamp: new Date(),
          type: 'greeting'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Get Dusty's response based on message content
      const response = await getDustyResponse(inputText.trim());
      
      // Determine message type based on content
      let messageType: ChatMessage['type'] = 'general';
      const lowerMessage = inputText.trim().toLowerCase();
      
      if (lowerMessage.includes('complete') || lowerMessage.includes('claim') || lowerMessage.includes('add chore')) {
        messageType = 'chore_command';
      } else if (lowerMessage.includes('list chores') || lowerMessage.includes('my chores') || lowerMessage.includes('show chores')) {
        messageType = 'chore_list';
      }
      
      const dustyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'dusty',
        timestamp: new Date(),
        type: messageType
      };

      setMessages(prev => [...prev, dustyMessage]);
    } catch (error) {
      console.error('Failed to get Dusty response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a moment. Can you repeat that?",
        sender: 'dusty',
        timestamp: new Date(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getDustyResponse = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    // Handle different types of messages
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I can help you manage chores! Try these commands:\n• 'add chore' - Open the chore form\n• 'list chores' - Show your chores\n• 'complete [chore name]' - Complete a specific chore\n• 'claim [chore name]' - Claim an unassigned chore\n• 'my chores' - Show chores assigned to you\n• 'suggestions' - Get chore suggestions\n• 'mood' - Check my current mood";
    }

    if (lowerMessage.includes('mood') || lowerMessage.includes('how are you')) {
      return await dustyPersonality.getMoodResponse(dustyPersonality.getDustyMood().current);
    }

    if (lowerMessage.includes('suggestion') || lowerMessage.includes('suggest')) {
      const suggestion = await dustyPersonality.getContextualSuggestion(currentUser.id);
      return suggestion;
    }

    // Chore commands
    if (lowerMessage.includes('add chore') || lowerMessage.includes('create chore') || lowerMessage.includes('new chore')) {
      if (onAddChore) {
        onAddChore();
        return "Opening the chore form for you. Don't make it too complicated!";
      }
      return "I can't open the form right now, but you can click the 'Add Chore' button.";
    }

    if (lowerMessage.includes('list chores') || lowerMessage.includes('show chores') || lowerMessage.includes('my chores')) {
      const userChores = chores.filter(chore => 
        chore.assigneeId === currentUser.id || 
        (currentUser.role === 'admin' && !chore.assigneeId)
      );
      
      if (userChores.length === 0) {
        return "You have no chores assigned. Lucky you!";
      }

      const choreList = userChores.map(chore => {
        const status = chore.completedAt ? '✅ Completed' : '⏳ Pending';
        const priority = chore.priority ? ` [${chore.priority}]` : '';
        return `• ${chore.title}${priority} - ${status}`;
      }).join('\n');

      return `Here are your chores:\n${choreList}`;
    }

    if (lowerMessage.includes('complete')) {
      const choreName = extractChoreName(message);
      if (!choreName) {
        return "Please specify which chore to complete. Try 'complete [chore name]'";
      }

      const chore = findChoreByName(choreName, chores);
      if (!chore) {
        return `I couldn't find a chore called "${choreName}". Check the spelling or try 'list chores' to see available chores.`;
      }

      if (chore.completedAt) {
        return `"${chore.title}" is already completed. Good job!`;
      }

      if (onCompleteChore) {
        onCompleteChore(chore.id);
        return `Completing "${chore.title}" for you. Well done!`;
      }

      return `I can't complete "${chore.title}" right now, but you can click the complete button.`;
    }

    if (lowerMessage.includes('claim')) {
      const choreName = extractChoreName(message);
      if (!choreName) {
        return "Please specify which chore to claim. Try 'claim [chore name]'";
      }

      const chore = findChoreByName(choreName, chores);
      if (!chore) {
        return `I couldn't find a chore called "${choreName}". Check the spelling or try 'list chores' to see available chores.`;
      }

      if (chore.assigneeId && chore.assigneeId !== currentUser.id) {
        return `"${chore.title}" is already claimed by someone else.`;
      }

      if (chore.assigneeId === currentUser.id) {
        return `"${chore.title}" is already yours.`;
      }

      if (onClaimChore) {
        onClaimChore(chore.id);
        return `Claiming "${chore.title}" for you. Don't let me down!`;
      }

      return `I can't claim "${chore.title}" right now, but you can click the claim button.`;
    }

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return await dustyPersonality.getContextualGreeting(currentUser.id, currentUser.displayName);
    }

    // Default response for unrecognized messages
    return await dustyPersonality.getSnarkResponse();
  };

  // Helper function to extract chore name from message
  const extractChoreName = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    
    // Try to find chore name after "complete" or "claim"
    const completeMatch = lowerMessage.match(/(?:complete|claim)\s+(.+)/);
    if (completeMatch) {
      return completeMatch[1].trim();
    }

    // Try to find chore name in quotes
    const quoteMatch = message.match(/"([^"]+)"/);
    if (quoteMatch) {
      return quoteMatch[1];
    }

    return null;
  };

  // Helper function to find chore by name
  const findChoreByName = (choreName: string, chores: Chore[]): Chore | null => {
    const lowerChoreName = choreName.toLowerCase();
    
    // First try exact match
    let chore = chores.find(c => c.title.toLowerCase() === lowerChoreName);
    if (chore) return chore;

    // Then try partial match
    chore = chores.find(c => c.title.toLowerCase().includes(lowerChoreName));
    if (chore) return chore;

    // Finally try fuzzy match
    chore = chores.find(c => 
      c.title.toLowerCase().split(' ').some(word => 
        lowerChoreName.includes(word) || word.includes(lowerChoreName)
      )
    );

    return chore || null;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = async (action: string) => {
    setInputText(action);
    await handleSendMessage();
  };

  if (!isOpen) return null;

  return (
    <div className="dusty-chat-overlay">
      <div className="dusty-chat-backdrop" onClick={onClose} />
      <div className="dusty-chat-container">
        <div className="chat-header">
          <div className="chat-title">
            <span className="dusty-avatar">🤖</span>
            <div>
              <h3>Dusty</h3>
              <span className="chat-subtitle">Your grumpy butler</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {isLoading ? (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <span>Dusty is thinking...</span>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender} ${message.type || ''}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="message dusty typing">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-actions">
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction("What can you do?")}
          >
            🤔 Help
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction("How are you feeling?")}
          >
            😤 Mood
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction("Give me a suggestion")}
          >
            💡 Suggestion
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction("List chores")}
          >
            📋 My Chores
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => handleQuickAction("Add chore")}
          >
            ➕ Add Chore
          </button>
        </div>

        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Dusty anything..."
            className="chat-input"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            className="send-btn"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}; 