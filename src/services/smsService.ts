import { Chore, User } from '../types';
import { dustyPersonality } from './dustyPersonality';

interface SMSCommand {
  type: 'list' | 'complete' | 'add' | 'help' | 'status';
  content: string;
  choreId?: string;
  choreTitle?: string;
}

export class SMSService {
  private static phoneNumbers: Map<string, string> = new Map(); // userId -> phoneNumber

  /**
   * Register a phone number for SMS functionality
   */
  static registerPhoneNumber(userId: string, phoneNumber: string): void {
    this.phoneNumbers.set(userId, phoneNumber);
    console.log(`Registered phone number for user ${userId}: ${phoneNumber}`);
  }

  /**
   * Parse SMS message and return command
   */
  static parseSMSMessage(message: string): SMSCommand {
    const lowerMessage = message.toLowerCase().trim();

    // Help command
    if (lowerMessage.includes('help') || lowerMessage === '?') {
      return {
        type: 'help',
        content: message
      };
    }

    // List chores
    if (lowerMessage.includes('list') || lowerMessage.includes('show') || lowerMessage.includes('chores')) {
      return {
        type: 'list',
        content: message
      };
    }

    // Complete chore
    if (lowerMessage.includes('complete') || lowerMessage.includes('done') || lowerMessage.includes('finished')) {
      // Extract chore title or ID from message
      const choreMatch = message.match(/(?:complete|done|finished)\s+(.+)/i);
      const choreTitle = choreMatch ? choreMatch[1].trim() : '';
      
      return {
        type: 'complete',
        content: message,
        choreTitle
      };
    }

    // Add chore
    if (lowerMessage.includes('add') || lowerMessage.includes('new') || lowerMessage.includes('create')) {
      const choreMatch = message.match(/(?:add|new|create)\s+(.+)/i);
      const choreTitle = choreMatch ? choreMatch[1].trim() : '';
      
      return {
        type: 'add',
        content: message,
        choreTitle
      };
    }

    // Status command
    if (lowerMessage.includes('status') || lowerMessage.includes('how')) {
      return {
        type: 'status',
        content: message
      };
    }

    // Default to help
    return {
      type: 'help',
      content: message
    };
  }

  /**
   * Generate SMS response based on command and chores
   */
  static async generateSMSResponse(
    command: SMSCommand,
    chores: Chore[],
    currentUser: User
  ): Promise<string> {
    switch (command.type) {
      case 'help':
        return this.generateHelpResponse();
      
      case 'list':
        return this.generateListResponse(chores, currentUser);
      
      case 'complete':
        return this.generateCompleteResponse(command, chores, currentUser);
      
      case 'add':
        return this.generateAddResponse(command, currentUser);
      
      case 'status':
        return this.generateStatusResponse(chores, currentUser);
      
      default:
        return this.generateHelpResponse();
    }
  }

  private static generateHelpResponse(): string {
    return `🤖 Dusty's SMS Commands:
• "list" - Show your chores
• "complete [chore]" - Mark chore as done
• "add [chore]" - Add new chore
• "status" - Check your progress
• "help" - Show this message

Text any command to get started!`;
  }

  private static generateListResponse(chores: Chore[], currentUser: User): string {
    const userChores = chores.filter(chore => 
      chore.assigneeId === currentUser.id || !chore.assigneeId
    );

    if (userChores.length === 0) {
      return "📋 No chores found. You're either incredibly efficient or I haven't assigned anything yet.";
    }

    const pendingChores = userChores.filter(chore => !chore.completedAt);
    const completedChores = userChores.filter(chore => chore.completedAt);

    let response = `📋 Your Chores (${userChores.length} total):\n\n`;

    if (pendingChores.length > 0) {
      response += "⏳ PENDING:\n";
      pendingChores.forEach((chore, index) => {
        const priority = chore.priority === 'high' ? '🔥' : chore.priority === 'medium' ? '⚡' : '💤';
        const dueDate = chore.dueDate ? ` (due: ${chore.dueDate.toLocaleDateString()})` : '';
        response += `${index + 1}. ${priority} ${chore.title}${dueDate}\n`;
      });
    }

    if (completedChores.length > 0) {
      response += `\n✅ COMPLETED (${completedChores.length}):\n`;
      completedChores.slice(0, 3).forEach((chore, index) => {
        response += `${index + 1}. ${chore.title}\n`;
      });
      if (completedChores.length > 3) {
        response += `... and ${completedChores.length - 3} more`;
      }
    }

    return response;
  }

  private static async generateCompleteResponse(
    command: SMSCommand,
    chores: Chore[],
    currentUser: User
  ): Promise<string> {
    if (!command.choreTitle) {
      return "❌ Please specify which chore to complete. Example: 'complete wash dishes'";
    }

    const userChores = chores.filter(chore => 
      (chore.assigneeId === currentUser.id || !chore.assigneeId) && !chore.completedAt
    );

    // Find chore by title (case-insensitive)
    const chore = userChores.find(c => 
      c.title.toLowerCase().includes(command.choreTitle!.toLowerCase()) ||
      command.choreTitle!.toLowerCase().includes(c.title.toLowerCase())
    );

    if (!chore) {
      return `❌ Chore not found: "${command.choreTitle}". Try "list" to see your chores.`;
    }

    // In a real implementation, this would update the chore in the database
    // For now, we'll just return a success message
    const response = await dustyPersonality.getChoreCompleteResponse();
    return `✅ ${response}\n\nChore completed: ${chore.title}`;
  }

  private static async generateAddResponse(
    command: SMSCommand,
    currentUser: User
  ): Promise<string> {
    if (!command.choreTitle) {
      return "❌ Please specify the chore to add. Example: 'add wash dishes'";
    }

    // In a real implementation, this would add the chore to the database
    const response = await dustyPersonality.getChoreAddResponse();
    return `📝 ${response}\n\nChore added: ${command.choreTitle}`;
  }

  private static generateStatusResponse(chores: Chore[], currentUser: User): string {
    const userChores = chores.filter(chore => 
      chore.assigneeId === currentUser.id || !chore.assigneeId
    );
    const completedChores = userChores.filter(chore => chore.completedAt);
    const pendingChores = userChores.filter(chore => !chore.completedAt);
    const overdueChores = pendingChores.filter(chore => 
      chore.dueDate && new Date() > chore.dueDate
    );

    const completionRate = userChores.length > 0 
      ? Math.round((completedChores.length / userChores.length) * 100) 
      : 0;

    let response = `📊 Your Status:\n\n`;
    response += `📋 Total: ${userChores.length}\n`;
    response += `✅ Completed: ${completedChores.length}\n`;
    response += `⏳ Pending: ${pendingChores.length}\n`;
    response += `🚨 Overdue: ${overdueChores.length}\n`;
    response += `📈 Completion Rate: ${completionRate}%\n\n`;

    if (overdueChores.length > 0) {
      response += `⚠️ Overdue chores:\n`;
      overdueChores.slice(0, 3).forEach((chore, index) => {
        response += `${index + 1}. ${chore.title}\n`;
      });
    }

    if (completionRate >= 80) {
      response += `🎉 Excellent work! You're on fire!`;
    } else if (completionRate >= 60) {
      response += `👍 Good progress! Keep it up!`;
    } else if (completionRate >= 40) {
      response += `😐 Not bad, but there's room for improvement.`;
    } else {
      response += `😤 Come on, let's get moving!`;
    }

    return response;
  }

  /**
   * Simulate receiving an SMS (for testing)
   */
  static async handleIncomingSMS(
    phoneNumber: string,
    message: string,
    chores: Chore[],
    currentUser: User
  ): Promise<string> {
    // Verify phone number is registered
    const userId = Array.from(this.phoneNumbers.entries())
      .find(([_, phone]) => phone === phoneNumber)?.[0];

    if (!userId || userId !== currentUser.id) {
      return "❌ Phone number not registered. Please register your number in the app first.";
    }

    const command = this.parseSMSMessage(message);
    return await this.generateSMSResponse(command, chores, currentUser);
  }

  /**
   * Get registered phone number for user
   */
  static getPhoneNumber(userId: string): string | undefined {
    return this.phoneNumbers.get(userId);
  }

  /**
   * Remove phone number registration
   */
  static unregisterPhoneNumber(userId: string): void {
    this.phoneNumbers.delete(userId);
    console.log(`Unregistered phone number for user ${userId}`);
  }
} 