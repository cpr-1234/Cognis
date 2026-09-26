const API_BASE = '/api/auth';

// Helper to make API requests with Authorization header if token exists
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cognis_researcher_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'An error occurred');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const authApi = {
  // 1. Email/Password Login
  login: async (email, password) => {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 2. Researcher Registration
  register: async (researcherData) => {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(researcherData),
    });
  },

  // 3. Google OAuth Sign-In (takes Google ID credential token)
  googleLogin: async (credential) => {
    return request('/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  // 4. Get Current Researcher Profile (Protected Route)
  getMe: async () => {
    return request('/me', {
      method: 'GET',
    });
  },

  // 5. Update Profile
  updateProfile: async (updateData) => {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
};
