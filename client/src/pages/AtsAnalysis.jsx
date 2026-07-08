import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, CheckCircle2 } from 'lucide-react';
import { analyzeEmployeeCV, getResumes } from '../lib/api';
import DashboardLayout from '../components/DashboardLayout';

const AtsAnalysis = () => {
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
            <p className="dark:text-white/50 text-gray-500 text-sm mt-1">Evaluate your resume against job descriptions to analyze how well your profile matches the role requirements.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <label className={`block p-8 border-2 border-dashed ${jdFile ? 'border-green-500 bg-green-500/10' : 'dark:border-white/20 border-gray-300 dark:bg-white/5 bg-gray-50'} rounded-2xl cursor-pointer dark:hover:bg-white/10 hover:bg-gray-100 transition-colors`}>
              <FileText className="w-12 h-12 mx-auto mb-4 text-[#02A4FF]" />
              <h3 className="text-lg font-semibold mb-2 text-center dark:text-white text-gray-900">{jdFile ? jdFile.name : 'Job Description'}</h3>
              <p className="dark:text-white/50 text-gray-500 text-center text-sm">{jdFile ? 'Click to change file' : 'Drop your JD here or click to browse'}</p>
              <input type="file" className="hidden" accept=".pdf,.txt,.rtf,.docx" onChange={(e) => handleFileChange(e, setJdFile)} />
            </label>

            <div className="flex flex-col gap-4">
              <label className={`block p-8 border-2 border-dashed ${cvFile ? 'border-green-500 bg-green-500/10' : 'dark:border-white/20 border-gray-300 dark:bg-white/5 bg-gray-50'} rounded-2xl cursor-pointer dark:hover:bg-white/10 hover:bg-gray-100 transition-colors`}>
                <FileText className="w-12 h-12 mx-auto mb-4 text-[#7D40FF]" />
                <h3 className="text-lg font-semibold mb-2 text-center dark:text-white text-gray-900">{cvFile ? cvFile.name : 'Your Resume'}</h3>
                <p className="dark:text-white/50 text-gray-500 text-center text-sm">{cvFile ? 'Click to change file' : 'Drop your CV here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.txt,.rtf,.docx" onChange={(e) => handleFileChange(e, setCvFile)} />
              </label>

              <div className="flex items-center gap-4 my-2">
                <div className="h-px dark:bg-white/20 bg-gray-300 flex-1"></div>
                <span className="dark:text-white/50 text-gray-500 text-sm">OR</span>
                <div className="h-px dark:bg-white/20 bg-gray-300 flex-1"></div>
              </div>

              <select 
                value={selectedResumeId}
                onChange={handleResumeSelect}
                className="w-full p-4 rounded-xl dark:bg-white bg-gray-100 dark:text-black text-gray-900 border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50"
              >
                <option value="">Select an existing resume...</option>
                {resumes.map(resume => (
                  <option key={resume._id || resume.id} value={resume._id || resume.id}>
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
              {loading && <div className="w-5 h-5 border-2 dark:border-white/30 border-white/50 dark:border-t-white border-t-white rounded-full animate-spin" />}
              {loading ? 'Analyzing your CV...' : 'Analyze CV'}
            </button>
          </div>
          
          {error && <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-center text-sm">{error}</div>}

          {results && (
            <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-8 animate-in slide-in-from-bottom-8">
              <h2 className="text-2xl font-semibold mb-8 dark:text-white text-gray-900">Analysis Results</h2>
              
              {results.is_compatible === false && (
                <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-2xl">
                  <h3 className="text-lg font-semibold text-red-500 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Compatibility Warning
                  </h3>
                  <p className="dark:text-white/80 text-gray-800 leading-relaxed">
                    {results.compatibility_warning || 'Your resume does not appear to match the core requirements for this Job Description. It is highly recommended to try a different resume or apply for a more relevant role.'}
                  </p>
                </div>
              )}

              <div className="flex flex-col md:flex-row gap-12">
                <div className="flex flex-col items-center justify-center min-w-[250px] p-8 dark:bg-white/5 bg-gray-50 rounded-2xl border dark:border-white/5 border-gray-200 shadow-sm">
                  <h3 className="text-xl font-medium mb-6 dark:text-white text-gray-900">Match Score</h3>
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
                    <div className="absolute inset-0 flex items-center justify-center flex-col font-bold">
                      {results['JD-Match'] || 0}%
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                  <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-6 border dark:border-white/5 border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> Profile Summary</h3>
                    <p className="dark:text-white/80 text-gray-700 leading-relaxed">
                      {results['Profile Summary'] || 'No summary available.'}
                    </p>
                  </div>

                  <div className="dark:bg-white/5 bg-gray-50 rounded-2xl p-6 border dark:border-white/5 border-gray-200 shadow-sm">
                    <h3 className="text-xl font-medium mb-4 text-[#ff4a4a]">Missing Skills</h3>
                    <ul className="list-disc list-inside flex flex-col gap-2">
                      {Array.isArray(results['Missing Skills']) 
                        ? results['Missing Skills'].map((skill, idx) => (
                            <li key={idx} className="flex items-center gap-2 dark:text-white/70 text-gray-600 dark:bg-white/5 bg-gray-100 px-3 py-2 rounded-lg text-sm">{skill}</li>
                          ))
                        : (typeof results['Missing Skills'] === 'string' 
                            ? <li className="flex items-center gap-2 dark:text-white/70 text-gray-600 dark:bg-white/5 bg-gray-100 px-3 py-2 rounded-lg text-sm">{results['Missing Skills']}</li> 
                            : null)
                      }
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

export default AtsAnalysis;
