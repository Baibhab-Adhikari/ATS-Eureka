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

export const analyzeEmployeeCV = async (cvFile, resumeId, jdText, jdFile, token) => {
  const formData = new FormData();
  if (cvFile) formData.append('file', cvFile);
  if (resumeId) formData.append('resume_id', resumeId);
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

// --- Resume Manager APIs ---

export const getResumes = async (token) => {
  const response = await fetch(`${API_URL}/resumes`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch resumes');
  }
  return response.json();
};

export const uploadResume = async (file, title, tags, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  if (tags) formData.append('tags', tags);

  const response = await fetch(`${API_URL}/resumes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload resume');
  }
  return response.json();
};

export const updateResume = async (id, data, token) => {
  const response = await fetch(`${API_URL}/resumes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update resume');
  }
  return response.json();
};

export const deleteResume = async (id, token) => {
  const response = await fetch(`${API_URL}/resumes/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete resume');
  }
  return response.json();
};

export const downloadResumeUrl = (id, token) => {
  // In a real app we might fetch as blob, but setting src with token isn't easy if we use query params.
  // Since we rely on Authorization header, we need a fetch blob method.
  return fetch(`${API_URL}/resumes/${id}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(res => {
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  });
};

// --- Applications API ---

export const getApplications = async (token) => {
  const response = await fetch(`${API_URL}/applications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch applications');
  return response.json();
};

export const createApplication = async (data, token) => {
  const response = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create application');
  }
  return response.json();
};

export const updateApplication = async (id, data, token) => {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update application');
  }
  return response.json();
};

export const deleteApplication = async (id, token) => {
  const response = await fetch(`${API_URL}/applications/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete application');
  return response.json();
};

export const getProfile = async (token) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch profile');
  }
  return response.json();
};

export const updateProfile = async (data, token) => {
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update profile');
  }
  return response.json();
};

export const tailorResume = async (resumeId, jdText, jdFile, token) => {
  const formData = new FormData();
  formData.append('resume_id', resumeId);
  if (jdText) formData.append('jd_text', jdText);
  if (jdFile) formData.append('jd_file', jdFile);

  const response = await fetch(`${API_URL}/resume/tailor`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to tailor resume');
  }
  return response.json();
};

export const exportResume = async (format, markdownText, token) => {
  const response = await fetch(`${API_URL}/resume/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      format,
      markdown_text: markdownText
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to export resume');
  }
  return response.blob();
};
