const AUTH_API = '/api/auth';
const STUDY_API = '/api';

// Helper to make API requests with Authorization header if token exists
const request = async (baseUrl, endpoint, options = {}) => {
  const token = localStorage.getItem('cognis_researcher_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

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
    return request(AUTH_API, '/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 2. Researcher Registration
  register: async (researcherData) => {
    return request(AUTH_API, '/register', {
      method: 'POST',
      body: JSON.stringify(researcherData),
    });
  },

  // 3. Google OAuth Sign-In (takes Google ID credential token)
  googleLogin: async (credential) => {
    return request(AUTH_API, '/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  // 4. Get Current Researcher Profile (Protected Route)
  getMe: async () => {
    return request(AUTH_API, '/me', {
      method: 'GET',
    });
  },

  // 5. Update Profile
  updateProfile: async (updateData) => {
    return request(AUTH_API, '/profile', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },
};

export const studyApi = {
  // 1. Fetch study information by studyCode (Public)
  getStudyByCode: async (studyCode) => {
    return request(STUDY_API, `/study/${encodeURIComponent(studyCode)}`, {
      method: 'GET',
    });
  },

  // 2. Student Sign-Up with Email + Study Link -> Generates Anonymous ID (Public)
  studentSignup: async (email, studyCode) => {
    return request(STUDY_API, '/student/signup', {
      method: 'POST',
      body: JSON.stringify({ email, studyCode }),
    });
  },

  // 3. Submit Student Reading (Locked to one reading per email + study link)
  submitReading: async ({ email, studyCode, anonymousId, reading }) => {
    return request(STUDY_API, '/student/submit-reading', {
      method: 'POST',
      body: JSON.stringify({ email, studyCode, anonymousId, reading }),
    });
  },

  // 4. Get all studies for researcher dashboard
  getAllStudies: async () => {
    return request(STUDY_API, '/studies', {
      method: 'GET',
    });
  },

  // 5. Create new study link (Protected)
  createStudy: async (studyData) => {
    return request(STUDY_API, '/study/create', {
      method: 'POST',
      body: JSON.stringify(studyData),
    });
  },

  // 6. Get Anonymized Readings for a study (Protected)
  getStudyReadings: async (studyCode) => {
    return request(STUDY_API, `/study/${encodeURIComponent(studyCode)}/readings`, {
      method: 'GET',
    });
  },
};

// ─── Experiment Builder API (Researcher) ─────────────────────────
export const experimentsApi = {
  create: (data) =>
    request(STUDY_API, '/experiments', { method: 'POST', body: JSON.stringify(data) }),

  getAll: () =>
    request(STUDY_API, '/experiments', { method: 'GET' }),

  getById: (id) =>
    request(STUDY_API, `/experiments/${id}`, { method: 'GET' }),

  update: (id, data) =>
    request(STUDY_API, `/experiments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  publish: (id) =>
    request(STUDY_API, `/experiments/${id}/publish`, { method: 'POST' }),

  remove: (id) =>
    request(STUDY_API, `/experiments/${id}`, { method: 'DELETE' }),

  getResults: (id) =>
    request(STUDY_API, `/experiments/${id}/results`, { method: 'GET' }),
};

// ─── Participant / Experiment Runner API ─────────────────────────
export const participantApi = {
  getExperiment: (publicId) =>
    request(STUDY_API, `/experiment/${publicId}`, { method: 'GET' }),

  startSession: (publicId, email) =>
    request(STUDY_API, `/experiment/${publicId}/start`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  submitResponses: (sessionId, trialResponses) =>
    request(STUDY_API, `/session/${sessionId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ trialResponses }),
    }),
};
