const API_URL = 'http://localhost:8000/api';

export const login = async (username, password, user_type) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('user_type', user_type);

  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Login failed');
  }
  return response.json();
};

export const registerEmployer = async (data) => {
  const response = await fetch(`${API_URL}/register/employer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  return response.json();
};

export const registerEmployee = async (data) => {
  const response = await fetch(`${API_URL}/register/employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Registration failed');
  }
  return response.json();
};

export const analyzeDemo = async (cvFile, jdFile) => {
  const formData = new FormData();
  formData.append('file', cvFile);
  formData.append('jd_file', jdFile);

  const response = await fetch(`${API_URL}/demo`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  return response.json();
};

export const analyzeEmployeeCV = async (cvFile, jdText, jdFile, token) => {
  const formData = new FormData();
  formData.append('file', cvFile);
  if (jdText) formData.append('jd_text', jdText);
  if (jdFile) formData.append('jd_file', jdFile);

  const response = await fetch(`${API_URL}/employee`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }
  return response.json();
};

export const analyzeEmployerBatch = async (jdText, jdFile, candidates, token) => {
  const formData = new FormData();
  if (jdText) formData.append('jd_text', jdText);
  if (jdFile) formData.append('jd_file', jdFile);
  
  candidates.forEach(candidate => {
    formData.append('candidates', candidate);
  });

  const response = await fetch(`${API_URL}/employer`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Batch analysis failed');
  }
  return response.json();
};
