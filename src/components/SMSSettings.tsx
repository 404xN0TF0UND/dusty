import React, { useState } from 'react';
import { SMSService } from '../services/smsService';
import { User, Chore } from '../types';
import './SMSSettings.css';

interface SMSSettingsProps {
  currentUser: User;
  chores: Chore[];
}

export const SMSSettings: React.FC<SMSSettingsProps> = ({ currentUser, chores }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const currentPhoneNumber = SMSService.getPhoneNumber(currentUser.id);

  const handleRegisterPhone = () => {
    if (!phoneNumber.trim()) {
      alert('Please enter a valid phone number');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      alert('Please enter a valid phone number (10+ digits)');
      return;
    }

    SMSService.registerPhoneNumber(currentUser.id, phoneNumber.trim());
    setIsRegistered(true);
    setPhoneNumber('');
    alert('Phone number registered successfully!');
  };

  const handleUnregisterPhone = () => {
    SMSService.unregisterPhoneNumber(currentUser.id);
    setIsRegistered(false);
    alert('Phone number unregistered');
  };

  const handleTestSMS = async () => {
    if (!testMessage.trim()) {
      alert('Please enter a test message');
      return;
    }

    if (!currentPhoneNumber) {
      alert('Please register a phone number first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await SMSService.handleIncomingSMS(
        currentPhoneNumber,
        testMessage,
        chores,
        currentUser
      );
      setTestResponse(response);
    } catch (error) {
      console.error('SMS test failed:', error);
      setTestResponse('Error: Failed to process SMS');
    } finally {
      setIsTesting(false);
    }
  };

  const handleQuickTest = async (message: string) => {
    setTestMessage(message);
    await handleTestSMS();
  };

  return (
    <div className="sms-settings">
      <h3>📱 SMS Settings</h3>
      <p className="sms-description">
        Register your phone number to interact with Dusty via SMS. 
        Send commands like "list", "complete wash dishes", or "status" to manage chores on the go.
      </p>

      <div className="phone-registration">
        <h4>Phone Number Registration</h4>
        
        {currentPhoneNumber ? (
          <div className="registered-phone">
            <span className="phone-label">📞 Registered:</span>
            <span className="phone-number">{currentPhoneNumber}</span>
            <button 
              className="btn btn-danger btn-sm"
              onClick={handleUnregisterPhone}
            >
              Unregister
            </button>
          </div>
        ) : (
          <div className="phone-input-section">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter your phone number (e.g., +1234567890)"
              className="phone-input"
            />
            <button 
              className="btn btn-primary"
              onClick={handleRegisterPhone}
              disabled={!phoneNumber.trim()}
            >
              Register Phone
            </button>
          </div>
        )}
      </div>

      {currentPhoneNumber && (
        <div className="sms-testing">
          <h4>🧪 SMS Testing</h4>
          <p className="test-description">
            Test SMS functionality by sending commands to Dusty:
          </p>

          <div className="quick-tests">
            <h5>Quick Tests:</h5>
            <div className="quick-test-buttons">
              <button 
                className="quick-test-btn"
                onClick={() => handleQuickTest('list')}
                disabled={isTesting}
              >
                📋 List Chores
              </button>
              <button 
                className="quick-test-btn"
                onClick={() => handleQuickTest('status')}
                disabled={isTesting}
              >
                📊 Check Status
              </button>
              <button 
                className="quick-test-btn"
                onClick={() => handleQuickTest('help')}
                disabled={isTesting}
              >
                ❓ Help
              </button>
              <button 
                className="quick-test-btn"
                onClick={() => handleQuickTest('complete wash dishes')}
                disabled={isTesting}
              >
                ✅ Complete Chore
              </button>
              <button 
                className="quick-test-btn"
                onClick={() => handleQuickTest('add vacuum living room')}
                disabled={isTesting}
              >
                ➕ Add Chore
              </button>
            </div>
          </div>

          <div className="custom-test">
            <h5>Custom Test:</h5>
            <div className="test-input-section">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter your SMS command..."
                className="test-input"
                onKeyPress={(e) => e.key === 'Enter' && handleTestSMS()}
              />
              <button 
                className="btn btn-secondary"
                onClick={handleTestSMS}
                disabled={!testMessage.trim() || isTesting}
              >
                {isTesting ? '⏳ Testing...' : 'Send Test'}
              </button>
            </div>
          </div>

          {testResponse && (
            <div className="test-response">
              <h5>Dusty's Response:</h5>
              <div className="response-content">
                <pre>{testResponse}</pre>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sms-commands">
        <h4>📝 Available Commands</h4>
        <div className="commands-list">
          <div className="command-item">
            <span className="command">list</span>
            <span className="description">Show all your chores</span>
          </div>
          <div className="command-item">
            <span className="command">status</span>
            <span className="description">Check your progress and stats</span>
          </div>
          <div className="command-item">
            <span className="command">complete [chore]</span>
            <span className="description">Mark a chore as done</span>
          </div>
          <div className="command-item">
            <span className="command">add [chore]</span>
            <span className="description">Add a new chore</span>
          </div>
          <div className="command-item">
            <span className="command">help</span>
            <span className="description">Show available commands</span>
          </div>
        </div>
      </div>

      <div className="sms-info">
        <h4>ℹ️ How It Works</h4>
        <ul>
          <li>Register your phone number in the app</li>
          <li>Send SMS commands to Dusty's number</li>
          <li>Receive responses with your chore information</li>
          <li>Perfect for quick updates when you're away from the app</li>
        </ul>
      </div>
    </div>
  );
}; 