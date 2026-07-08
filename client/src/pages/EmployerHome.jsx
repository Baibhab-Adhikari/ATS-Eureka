import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Home, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { analyzeEmployerBatchFiles, getEmployerJds } from '../lib/api';
import EmployerLayout from '../components/EmployerLayout';

const EmployerHome = () => {
  const [jds, setJds] = useState([]);
  const [selectedJdId, setSelectedJdId] = useState('');
  const [cvFiles, setCvFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchJds();
  }, []);

  const fetchJds = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEmployerJds(token);
      setJds(data);
      // Pre-select JD from query param if present
      const jdFromUrl = searchParams.get('jd');
      if (jdFromUrl) {
        setSelectedJdId(jdFromUrl);
      }
    } catch (err) {
      setError('Failed to fetch job descriptions');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const handleJdChange = (e) => {
    setSelectedJdId(e.target.value);
  };

  const handleCvChange = (e) => {
    if (e.target.files) {
      setCvFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedJdId || cvFiles.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      await analyzeEmployerBatchFiles(selectedJdId, cvFiles, token);
      navigate(`/employer/history?jd=${selectedJdId}`);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployerLayout>
        {/* Header */}
        <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center bg-white/5 rounded-full px-6 py-3 border border-white/10 w-96">
            <input 
              type="text" 
              placeholder="Search candidates" 
              className="bg-transparent border-none outline-none text-white w-full placeholder-white/50"
            />
            <Search className="w-5 h-5 text-white/50" />
          </div>
        </header>

        {/* Content Area */}
        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-4">Welcome to the Employer Dashboard</h1>
            <p className="text-lg text-white/60">Upload a job description and multiple CVs to find the best candidates for your company's needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="flex flex-col gap-4">
              <label className="text-white/80 font-medium ml-2">1. Select Job Description</label>
              <div className="relative">
                <select 
                  value={selectedJdId}
                  onChange={handleJdChange}
                  className="w-full bg-white/5 border border-white/20 rounded-3xl p-6 text-xl text-white outline-none focus:border-[#4a6fff] appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-black">Choose a Job Description...</option>
                  {jds.map(jd => (
                    <option key={jd.id} value={jd.id} className="text-black">{jd.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/50 pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-white/80 font-medium ml-2">2. Upload Candidate CVs</label>
              <label className={`block p-6 border-2 border-dashed ${cvFiles.length > 0 ? 'border-[#4a6fff] bg-[#4a6fff]/10' : 'border-white/20 bg-white/5'} rounded-3xl cursor-pointer hover:bg-white/10 transition-colors text-center h-full flex flex-col justify-center`}>
                <img src="/assets/images/upload-icon.svg" alt="Upload" className="w-12 h-12 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-semibold mb-1">{cvFiles.length > 0 ? `${cvFiles.length} files selected` : 'Upload CVs'}</h3>
                <p className="text-white/50 text-sm">{cvFiles.length > 0 ? 'Click to change files' : 'Drop multiple CVs here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleCvChange} />
              </label>
            </div>
          </div>

          <div className="flex justify-center mb-16">
            <button 
              disabled={!selectedJdId || cvFiles.length === 0 || loading}
              onClick={handleAnalyze}
              className="px-12 py-4 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl text-xl font-semibold transition-all shadow-lg hover:shadow-[#4a6fff]/30 flex items-center gap-3"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Analyzing and Saving...' : 'Analyze CVs'}
            </button>
          </div>
          
          {error && <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">{error}</div>}
        </div>
    </EmployerLayout>
  );
};

export default EmployerHome;
