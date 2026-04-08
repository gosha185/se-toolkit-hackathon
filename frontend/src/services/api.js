const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const api = {
  // Auth
  async register(username, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Decisions
  async makeDecision(query, options, useHistoryAwareness = true) {
    const res = await fetch(`${API_URL}/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ query, options, useHistoryAwareness })
    });
    return res.json();
  },

  async getHistory(limit = 20, offset = 0, query = null) {
    const params = new URLSearchParams({ limit, offset });
    if (query) params.append('query', query);
    
    const res = await fetch(`${API_URL}/decisions/history?${params}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  async getDecisionStats() {
    const res = await fetch(`${API_URL}/decisions/stats/summary`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return res.json();
  },

  // Agent
  async chatWithAgent(message, conversationHistory = []) {
    const res = await fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ message, conversationHistory })
    });
    return res.json();
  },

  async quickDecide(message) {
    const res = await fetch(`${API_URL}/agent/decide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ message })
    });
    return res.json();
  }
};

export default api;
