import yaml from 'js-yaml';

interface DustyResponses {
  greetings: string[];
  chore_add: string[];
  chore_complete: string[];
  chore_claim: string[];
  chore_delete: string[];
  chore_edit: string[];
  no_chores: string[];
  overdue_chores: string[];
  all_completed: string[];
  error_messages: string[];
  loading: string[];
  chore_assigned: string[];
  smart_suggestions: string[];
  mood_responses: {
    happy: string[];
    grumpy: string[];
    productive: string[];
    lazy: string[];
  };
  holiday_responses: Record<string, string>;
  snark_responses: string[];
}

interface UserContext {
  name: string;
  lastInteraction: Date;
  completedChores: number;
  totalChores: number;
  averageCompletionTime: number;
  favoriteCategories: string[];
  mood: 'happy' | 'grumpy' | 'productive' | 'lazy';
  streak: number;
  lastChoreCompleted?: string;
  lastChoreCompletedAt?: Date;
}

interface DustyMood {
  current: 'happy' | 'grumpy' | 'productive' | 'lazy';
  lastChanged: Date;
  reason: string;
}

class DustyPersonality {
  private responses: DustyResponses | null = null;
  private isLoading = false;
  private isLoaded = false;
  private userContexts: Map<string, UserContext> = new Map();
  private dustyMood: DustyMood = {
    current: 'grumpy',
    lastChanged: new Date(),
    reason: 'Default grumpy butler'
  };

  async loadPersonality(): Promise<void> {
    if (this.isLoaded || this.isLoading) {
      return;
    }

    this.isLoading = true;
    try {
      console.log('Loading Dusty personality...');
      const response = await fetch('/dusty-personality.yaml');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const yamlText = await response.text();
      console.log('YAML loaded successfully:', yamlText.substring(0, 100) + '...');
      this.responses = yaml.load(yamlText) as DustyResponses;
      this.isLoaded = true;
      console.log('Dusty personality loaded successfully:', this.responses);
    } catch (error) {
      console.error('Failed to load Dusty personality:', error);
      // Fallback responses if YAML fails to load
      this.responses = {
        greetings: ["Oh, it's you again."],
        chore_add: ["Another chore? Fine."],
        chore_complete: ["Well done, I guess."],
        chore_claim: ["Claimed. Don't mess it up."],
        chore_delete: ["Giving up already?"],
        chore_edit: ["Changing your mind?"],
        no_chores: ["No chores? That's a first."],
        overdue_chores: ["Look at all these overdue chores."],
        all_completed: ["All done? I must be dreaming."],
        error_messages: ["Something went wrong. Shocking."],
        loading: ["Loading... because patience is a virtue you lack."],
        chore_assigned: ["You've been assigned a new chore."],
        smart_suggestions: ["You might want to check the kitchen."],
        mood_responses: {
          happy: ["Someone's in a good mood."],
          grumpy: ["Someone woke up on the wrong side of the bed."],
          productive: ["Look at you go!"],
          lazy: ["Another day of avoiding responsibility?"]
        },
        holiday_responses: {},
        snark_responses: ["Wow, you're actually doing something?"]
      };
      this.isLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded && !this.isLoading) {
      await this.loadPersonality();
    }
    // Wait for loading to complete if it's in progress
    while (this.isLoading) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async getRandomResponse(category: keyof DustyResponses): Promise<string> {
    await this.ensureLoaded();
    
    console.log('Getting response for category:', category);
    console.log('Current responses:', this.responses);
    
    if (!this.responses) {
      console.log('No responses loaded, using fallback');
      return "Dusty is having a moment. Try again.";
    }
    
    const responses = this.responses[category];
    console.log('Responses for category:', responses);
    
    if (!responses) {
      console.log('No responses found for category, using fallback');
      return "Dusty is speechless. That's a first.";
    }
    
    let responseArray: string[];
    
    // Handle different response types
    if (Array.isArray(responses)) {
      responseArray = responses;
    } else if (typeof responses === 'object' && responses !== null) {
      // Handle mood_responses object
      if (category === 'mood_responses') {
        const moodResponses = responses as DustyResponses['mood_responses'];
        // Default to happy if no specific mood is set
        responseArray = moodResponses.happy || [];
      } else {
        console.log('Complex response type, using fallback');
        return "Dusty is speechless. That's a first.";
      }
    } else {
      console.log('Unknown response type, using fallback');
      return "Dusty is speechless. That's a first.";
    }
    
    if (responseArray.length === 0) {
      console.log('No responses found for category, using fallback');
      return "Dusty is speechless. That's a first.";
    }
    
    const response = responseArray[Math.floor(Math.random() * responseArray.length)];
    console.log('Selected response:', response);
    return response;
  }

  private formatResponse(response: string, context?: { name?: string }): string {
    if (!context) return response;
    
    return response.replace(/{name}/g, context.name || 'you');
  }

  // Public methods for different interactions
  async getGreeting(name?: string): Promise<string> {
    const response = await this.getRandomResponse('greetings');
    return this.formatResponse(response, { name });
  }

  async getChoreAddResponse(): Promise<string> {
    return this.getRandomResponse('chore_add');
  }

  async getChoreCompleteResponse(): Promise<string> {
    return this.getRandomResponse('chore_complete');
  }

  async getChoreClaimResponse(): Promise<string> {
    return this.getRandomResponse('chore_claim');
  }

  async getChoreDeleteResponse(): Promise<string> {
    return this.getRandomResponse('chore_delete');
  }

  async getChoreEditResponse(): Promise<string> {
    return this.getRandomResponse('chore_edit');
  }

  async getNoChoresResponse(): Promise<string> {
    return this.getRandomResponse('no_chores');
  }

  async getOverdueChoresResponse(): Promise<string> {
    return this.getRandomResponse('overdue_chores');
  }

  async getAllCompletedResponse(): Promise<string> {
    return this.getRandomResponse('all_completed');
  }

  async getErrorMessage(): Promise<string> {
    return this.getRandomResponse('error_messages');
  }

  async   getLoadingMessage(): Promise<string> {
    return this.getRandomResponse('loading');
  }

  // Enhanced AI methods
  async getChoreAssignedResponse(choreTitle: string): Promise<string> {
    const response = await this.getRandomResponse('chore_assigned');
    return response.replace(/{chore}/g, choreTitle);
  }

  async getSmartSuggestion(): Promise<string> {
    return this.getRandomResponse('smart_suggestions');
  }

  async getMoodResponse(mood: 'happy' | 'grumpy' | 'productive' | 'lazy'): Promise<string> {
    await this.ensureLoaded();
    
    if (!this.responses?.mood_responses) {
      return "Someone's in a mood today.";
    }
    
    const moodResponses = this.responses.mood_responses[mood];
    if (!moodResponses || moodResponses.length === 0) {
      return "Someone's in a mood today.";
    }
    
    const response = moodResponses[Math.floor(Math.random() * moodResponses.length)];
    return response;
  }

  async getHolidayResponse(): Promise<string> {
    await this.ensureLoaded();
    
    if (!this.responses?.holiday_responses) {
      return "";
    }
    
    const today = new Date();
    const dateKey = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    return this.responses.holiday_responses[dateKey] || "";
  }

  async getSnarkResponse(): Promise<string> {
    return this.getRandomResponse('snark_responses');
  }

  // Context management
  updateUserContext(userId: string, context: Partial<UserContext>): void {
    const existing = this.userContexts.get(userId) || {
      name: '',
      lastInteraction: new Date(),
      completedChores: 0,
      totalChores: 0,
      averageCompletionTime: 0,
      favoriteCategories: [],
      mood: 'lazy',
      streak: 0
    };
    
    this.userContexts.set(userId, { ...existing, ...context });
  }

  getUserContext(userId: string): UserContext | null {
    return this.userContexts.get(userId) || null;
  }

  // Mood management
  updateDustyMood(mood: 'happy' | 'grumpy' | 'productive' | 'lazy', reason: string): void {
    this.dustyMood = {
      current: mood,
      lastChanged: new Date(),
      reason
    };
  }

  getDustyMood(): DustyMood {
    return { ...this.dustyMood };
  }

  // Smart suggestions based on user context
  async getContextualSuggestion(userId: string): Promise<string> {
    const context = this.getUserContext(userId);
    if (!context) {
      return await this.getSmartSuggestion();
    }

    const now = new Date();
    const daysSinceLastCompletion = context.lastChoreCompletedAt 
      ? Math.floor((now.getTime() - context.lastChoreCompletedAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceLastCompletion > 3) {
      return "I notice you haven't completed any chores in a while. The dust bunnies are having a party.";
    }

    if (context.streak > 5) {
      return "Impressive streak! Don't break it now.";
    }

    if (context.favoriteCategories.length > 0) {
      const category = context.favoriteCategories[0];
      return `I see you usually handle ${category} chores. Maybe it's time for another one?`;
    }

    return await this.getSmartSuggestion();
  }

  // Enhanced greeting with context
  async getContextualGreeting(userId: string, userName: string): Promise<string> {
    const context = this.getUserContext(userId);
    const holidayResponse = await this.getHolidayResponse();
    
    let greeting = await this.getGreeting(userName);
    
    if (holidayResponse) {
      greeting += ` ${holidayResponse}`;
    }
    
    if (context) {
      if (context.streak > 3) {
        greeting += " You're on a roll!";
      } else if (context.completedChores === 0) {
        greeting += " Ready to start being productive?";
      }
    }
    
    return greeting;
  }
}

export const dustyPersonality = new DustyPersonality(); 