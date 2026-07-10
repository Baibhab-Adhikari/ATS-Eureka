const API_URL = '/api';

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

export const getDashboardData = async (token) => {
  const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch dashboard data');
  }
  return response.json();
};

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
  const data = await response.json();
  const resumesArray = Array.isArray(data) ? data : (data.resumes || []);
  return resumesArray.map(r => ({ ...r, id: r._id || r.id }));
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
  const data = await response.json();
  return { ...data, id: data._id || data.id };
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

export const downloadResumeUrl = async (id, token) => {
  const res = await fetch(`${API_URL}/resumes/${id}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!res.ok) throw new Error('Download failed');
  
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    return { isUrl: true, url: data.url };
  }
  
  const blob = await res.blob();
  return { isUrl: false, blob: blob };
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

export const getEmployeeProfile = async (token) => {
  const response = await fetch(`${API_URL}/employee/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch employee profile');
  }
  return response.json();
};

export const updateEmployeeProfile = async (data, token) => {
  const response = await fetch(`${API_URL}/employee/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update employee profile');
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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    return { isUrl: true, url: data.url };
  }
  
  const blob = await response.blob();
  return { isUrl: false, blob: blob };
};

export const generateInterviewPrep = async (resumeId, jdText, jdFile, token) => {
  const formData = new FormData();
  formData.append('resume_id', resumeId);
  if (jdText) formData.append('jd_text', jdText);
  if (jdFile) formData.append('jd_file', jdFile);

  const response = await fetch(`${API_URL}/interview/prep`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate interview prep');
  }

  return response.json();
};

// --- Employer Module APIs ---

export const getEmployerJds = async (token) => {
  const response = await fetch(`${API_URL}/employer/jds`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch job descriptions');
  const data = await response.json();
  return Array.isArray(data) ? data.map(jd => ({ ...jd, id: jd._id || jd.id })) : [];
};

export const createEmployerJd = async (data, token) => {
  const response = await fetch(`${API_URL}/employer/jds`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create job description');
  }
  return response.json();
};

export const updateEmployerJd = async (id, data, token) => {
  const response = await fetch(`${API_URL}/employer/jds/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update job description');
  }
  return response.json();
};

export const deleteEmployerJd = async (id, token) => {
  const response = await fetch(`${API_URL}/employer/jds/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete JD');
  return response.json();
};

export const parseEmployerJdFile = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/employer/jds/parse`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to parse JD file');
  }
  return response.json();
};

export const runEmployerBatchAnalysis = async (jdId, resumeIds, token) => {
  const response = await fetch(`${API_URL}/employer/analyze`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ jd_id: jdId, resume_ids: resumeIds })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Batch analysis failed');
  }
  return response.json();
};

export const analyzeEmployerBatchFiles = async (jdId, cvFiles, token) => {
  const formData = new FormData();
  formData.append('jd_id', jdId);
  cvFiles.forEach(file => {
    formData.append('cv_files', file);
  });
  
  const response = await fetch(`${API_URL}/employer/analyze-batch`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Batch analysis failed');
  }
  return response.json();
};

export const getCandidateRankings = async (jdId, token) => {
  const response = await fetch(`${API_URL}/employer/analysis/${jdId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch candidate rankings');
  return response.json();
};

export const updateEmployerCandidateStatus = async (analysisId, status, token) => {
  const response = await fetch(`${API_URL}/employer/analysis/${analysisId}/status`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update candidate status');
  return response.json();
};

export const getCandidateSummary = async (candidateId, token) => {
  const response = await fetch(`${API_URL}/employer/candidate/${candidateId}/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch candidate summary');
  return response.json();
};

export const getEmployerDashboard = async (token) => {
  const response = await fetch(`${API_URL}/employer/dashboard`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch employer dashboard data');
  return response.json();
};

export const getEmployerProfile = async (token) => {
  const response = await fetch(`${API_URL}/employer/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch employer profile');
  }
  return response.json();
};

export const updateEmployerProfile = async (data, token) => {
  const response = await fetch(`${API_URL}/employer/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update employer profile');
  }
  return response.json();
};
