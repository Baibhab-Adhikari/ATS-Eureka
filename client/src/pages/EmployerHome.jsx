import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Search, User, LogOut } from 'lucide-react';
import { analyzeEmployerBatch } from '../lib/api';

const EmployerHome = () => {
  const [jdFile, setJdFile] = useState(null);
  const [cvFiles, setCvFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const handleJdChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleCvChange = (e) => {
    if (e.target.files) {
      setCvFiles(Array.from(e.target.files));
    }
  };

  const handleAnalyze = async () => {
    if (!jdFile || cvFiles.length === 0) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const data = await analyzeEmployerBatch(null, jdFile, cvFiles, token);
      setResults(data.ranked_candidates || []);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-green-300 text-green-900';
    if (score >= 50) return 'bg-gradient-to-r from-yellow-500 to-yellow-300 text-yellow-900';
    return 'bg-gradient-to-r from-red-500 to-red-300 text-red-900';
  };

  return (
    <div className="flex min-h-screen bg-[#030412] font-montserrat text-white bg-custom-radial bg-cover">
      {/* Sidebar */}
      <aside className="w-20 bg-white/5 border-r border-white/10 flex flex-col items-center py-8 gap-12 fixed h-full z-20 backdrop-blur-md">
        <a href="/" className="mb-4 hover:scale-105 transition-transform">
          <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        </a>
        <div className="flex flex-col gap-8 w-full items-center">
          <div className="p-3 bg-white/10 rounded-xl text-white cursor-pointer hover:bg-white/20 transition-colors">
            <Home className="w-6 h-6" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-20 flex-1 flex flex-col relative min-h-screen">
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
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
              <User className="w-5 h-5" />
            </div>
            <button onClick={handleLogout} className="text-white/60 hover:text-white transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-12 max-w-6xl mx-auto w-full">
          <div className="mb-12">
            <h1 className="text-4xl font-semibold mb-4">Welcome to the Employer Dashboard</h1>
            <p className="text-lg text-white/60">Upload a job description and multiple CVs to find the best candidates for your company's needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <label className={`block p-12 border-2 border-dashed ${jdFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-3xl cursor-pointer hover:bg-white/10 transition-colors text-center`}>
              <img src="/assets/images/document-icon.svg" alt="Document" className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">{jdFile ? jdFile.name : 'Upload Job Description'}</h3>
              <p className="text-white/50">{jdFile ? 'Click to change file' : 'Drop your JD here or click to browse'}</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleJdChange} />
            </label>

            <label className={`block p-12 border-2 border-dashed ${cvFiles.length > 0 ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-3xl cursor-pointer hover:bg-white/10 transition-colors text-center`}>
              <img src="/assets/images/upload-icon.svg" alt="Upload" className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">{cvFiles.length > 0 ? `${cvFiles.length} files selected` : 'Upload Candidate CVs'}</h3>
              <p className="text-white/50">{cvFiles.length > 0 ? 'Click to change files' : 'Drop multiple CVs here or click to browse'}</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" multiple onChange={handleCvChange} />
            </label>
          </div>

          <div className="flex justify-center mb-16">
            <button 
              disabled={!jdFile || cvFiles.length === 0 || loading}
              onClick={handleAnalyze}
              className="px-12 py-4 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded-2xl text-xl font-semibold transition-all shadow-lg hover:shadow-[#4a6fff]/30 flex items-center gap-3"
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Analyzing CVs...' : 'Analyze CVs'}
            </button>
          </div>
          
          {error && <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center">{error}</div>}

          {results && (
            <div className="animate-in slide-in-from-bottom-8 duration-500">
              <h2 className="text-2xl font-semibold mb-6">Analysis Results</h2>
              <div className="flex flex-col gap-6">
                {results.map((candidate, idx) => (
                  <div key={idx} className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-md shadow-lg">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                      <h3 className="text-xl font-semibold">{candidate.cv_filename}</h3>
                      <span className={`px-4 py-2 rounded-full font-bold ${getMatchColor(candidate.analysis['JD-Match'] || 0)}`}>
                        Match: {candidate.analysis['JD-Match'] || 0}%
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white/60 mb-2 font-medium">Profile Summary</h4>
                        <p className="text-white/90 leading-relaxed">{candidate.analysis['Profile Summary'] || 'No summary available.'}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-white/60 mb-2 font-medium">Missing Skills</h4>
                        <ul className="list-disc list-inside">
                          {(candidate.analysis['Missing Skills'] || []).map((skill, i) => (
                            <li key={i} className="text-white/90">{skill}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployerHome;
