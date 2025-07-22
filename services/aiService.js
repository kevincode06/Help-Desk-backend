const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class AIService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/ai`;
  }

  // Get authentication token from localStorage or wherever you store it
  getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  // Create headers with authentication
  getHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Send chat message to AI
  async sendChatMessage(message, conversationHistory = []) {
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          message,
          conversationHistory
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send chat message');
      }

      const data = await response.json();
      return data.data; // Returns { response, timestamp, messageId }
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  // Get conversation suggestions
  async getSuggestions() {
    try {
      const response = await fetch(`${this.baseURL}/suggestions`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch suggestions');
      }

      const data = await response.json();
      return data.data.suggestions; // Returns array of suggestion strings
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  }

  // Submit feedback for AI response
  async submitFeedback(messageId, rating, feedback = null) {
    try {
      const response = await fetch(`${this.baseURL}/feedback`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          messageId,
          rating,
          feedback
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  // Get chat history
  async getChatHistory() {
    try {
      const response = await fetch(`${this.baseURL}/history`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chat history');
      }

      const data = await response.json();
      return data.data.history;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  // Check AI service status
  async getServiceStatus() {
    try {
      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check service status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error checking service status:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const aiService = new AIService();

export default aiService;

// Also export individual methods for named imports if needed
export const {
  sendChatMessage,
  getSuggestions,
  submitFeedback,
  getChatHistory,
  getServiceStatus
} = aiService;