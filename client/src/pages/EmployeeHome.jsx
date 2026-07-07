import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import { analyzeEmployeeCV, getResumes } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';

const EmployeeHome = () => {
  const [jdFile, setJdFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await getResumes(token);
          setResumes(Array.isArray(data) ? data : (data.resumes || []));
        }
      } catch (err) {
        console.error('Failed to fetch resumes:', err);
      }
    };
    fetchResumes();
  }, []);

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (setFile === setCvFile) setSelectedResumeId(''); // Reset dropdown if file selected
    }
  };

  const handleResumeSelect = (e) => {
    setSelectedResumeId(e.target.value);
    if (e.target.value) setCvFile(null); // Reset file if dropdown selected
  };

  const handleAnalyze = async () => {
    if (!jdFile || (!cvFile && !selectedResumeId)) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const data = await analyzeEmployeeCV(cvFile, selectedResumeId, null, jdFile, token);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
        {/* Content Area */}
        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-4">Welcome to the Employee Dashboard</h1>
            <p className="text-lg text-white/60">Upload your CV and a job description to analyze how well your profile matches the role requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <label className={`block p-12 border-2 border-dashed ${jdFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-3xl cursor-pointer hover:bg-white/10 transition-colors text-center`}>
              <img src="/assets/images/document-icon.svg" alt="Document" className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">{jdFile ? jdFile.name : 'Upload Job Description'}</h3>
              <p className="text-white/50">{jdFile ? 'Click to change file' : 'Drop your JD here or click to browse'}</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, setJdFile)} />
            </label>

            <div className="flex flex-col gap-4">
              <label className={`block p-12 border-2 border-dashed ${cvFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-3xl cursor-pointer hover:bg-white/10 transition-colors text-center`}>
                <img src="/assets/images/upload-icon.svg" alt="Upload" className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <h3 className="text-xl font-semibold mb-2">{cvFile ? cvFile.name : 'Upload Your CV'}</h3>
                <p className="text-white/50">{cvFile ? 'Click to change file' : 'Drop your CV here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, setCvFile)} />
              </label>

              <div className="flex items-center gap-4 my-2">
                <div className="h-px bg-white/20 flex-1"></div>
                <span className="text-white/50 text-sm">OR</span>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>

              <select 
                value={selectedResumeId}
                onChange={handleResumeSelect}
                style={{ backgroundColor: 'white', color: 'black' }}
                className="w-full p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50"
              >
                <option value="">Select an existing resume...</option>
                {resumes.map(resume => (
                  <option key={resume._id} value={resume._id}>
                    {resume.title} ({resume.file_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center mb-16">
            <button 
              disabled={!jdFile || (!cvFile && !selectedResumeId) || loading}
              onClick={handleAnalyze}
              className="px-12 py-4 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl text-xl font-semibold transition-all shadow-lg hover:shadow-[#4a6fff]/30 flex items-center gap-3"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Analyzing your CV...' : 'Analyze CV'}
            </button>
          </div>
          
          {error && <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">{error}</div>}

          {results && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-16 animate-in slide-in-from-bottom-8 duration-500">
              <h2 className="text-2xl font-semibold mb-8">Analysis Results</h2>
              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex flex-col items-center justify-center min-w-[250px] p-8 bg-white/5 rounded-2xl border border-white/5">
                  <h3 className="text-xl font-medium mb-6">Match Score</h3>
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#4a6fff" 
                        strokeWidth="10" 
                        strokeDasharray={`${(results['JD-Match'] || 0) * 2.83} 283`}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold">
                      {results['JD-Match'] || 0}%
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-xl font-medium mb-4 text-[#4a6fff]">Profile Summary</h3>
                    <p className="text-white/80 leading-relaxed">
                      {results['Profile Summary'] || 'No summary available.'}
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h3 className="text-xl font-medium mb-4 text-[#ff4a4a]">Missing Skills</h3>
                    <ul className="list-disc list-inside flex flex-col gap-2">
                      {(results['Missing Skills'] || []).map((skill, idx) => (
                        <li key={idx} className="text-white/80">{skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </DashboardLayout>
  );
};

export default EmployeeHome;
