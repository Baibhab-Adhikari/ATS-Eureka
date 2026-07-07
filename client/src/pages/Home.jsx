import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeDemo } from '../lib/api';

const Home = () => {
  const [jdFile, setJdFile] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [trialsLeft, setTrialsLeft] = useState(() => {
    const saved = localStorage.getItem('trialsLeft');
    return saved !== null ? parseInt(saved) : 3;
  });

  const handleFileChange = (e, setFile) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!jdFile || !cvFile || trialsLeft <= 0) return;
    
    setLoading(true);
    setError('');
    setResults(null);
    
    try {
      const data = await analyzeDemo(cvFile, jdFile);
      setResults(data);
      if (data.rate_limit) {
        setTrialsLeft(data.rate_limit.remaining_requests);
        localStorage.setItem('trialsLeft', data.rate_limit.remaining_requests);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="pt-24 pb-0 bg-custom-radial bg-cover">
      {/* Hero Section */}
      <section className="min-h-[70vh] flex flex-col items-center justify-center mb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-pt font-normal mt-16 mb-4 flex items-center justify-center gap-4">
          <span className="w-6 h-6 inline-block -mt-4"><img src="/assets/images/sparkle.svg" alt="sparkle" className="w-full h-full" /></span>
          Land Your Dream Job Faster.
        </h1>
        <h2 className="text-4xl md:text-6xl font-paprika font-bold mb-12 flex items-center justify-center gap-2">
          We Analyse, You Apply.
          <span className="w-6 h-6 inline-block -mt-2"><img src="/assets/images/sparkle.svg" alt="sparkle" className="w-full h-full" /></span>
        </h2>
        <div className="flex gap-8 justify-center">
          <a href="#try-section" className="px-8 py-4 bg-white text-[#030412] rounded-full text-xl font-montserrat font-semibold hover:scale-105 transition-transform">
            Try Now
          </a>
          <Link to="/signup" className="px-8 py-4 bg-[#060825] text-white border border-white/20 rounded-full text-xl font-montserrat font-semibold hover:scale-105 transition-transform">
            Get Started
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="min-h-[90vh] flex items-center max-w-6xl mx-auto py-8 px-4 gap-16">
        <div className="flex-1">
          <h2 className="font-montserrat text-4xl font-semibold mb-6 leading-tight">
            The Ultimate Hiring & Job Matching Solution!<br />No More Guesswork—Just the Right Fit!
          </h2>
          <ul className="flex flex-col gap-6">
            {[
              "AI-driven analysis ensures you find candidates who truly fit the role.",
              "Get ranked for roles where your skills shine the brightest.",
              "Objective matching based on qualifications, experience, and job expectations."
            ].map((feature, idx) => (
              <li key={idx} className="flex items-start gap-4 text-lg font-montserrat leading-relaxed">
                <svg className="w-6 h-6 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1 flex justify-center">
          <img src="/assets/images/Perfect candidate's cv found.png" alt="Resume Analysis" className="w-full max-w-[500px] h-auto" />
        </div>
      </section>

      {/* Try Before Signup Section */}
      <section id="try-section" className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-montserrat font-semibold mb-4">Try It Before Signing Up!</h2>
          <p className="text-lg text-white/80 mb-12">Upload job descriptions and CVs to find the perfect match using advanced AI technology</p>

          <div className="flex flex-col md:flex-row gap-8 justify-center mb-12">
            <div className="flex-1">
              <label className={`block p-12 border-2 border-dashed ${jdFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-2xl cursor-pointer hover:bg-white/10 transition-colors`}>
                <img src="/assets/images/document-icon.svg" alt="Document" className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{jdFile ? jdFile.name : 'Upload Job Description'}</h3>
                <p className="text-white/60">{jdFile ? 'Click to change file' : 'Drop your JD here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.txt,.rtf,.docx" onChange={(e) => handleFileChange(e, setJdFile)} />
              </label>
            </div>
            <div className="flex-1">
              <label className={`block p-12 border-2 border-dashed ${cvFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-2xl cursor-pointer hover:bg-white/10 transition-colors`}>
                <img src="/assets/images/upload-icon.svg" alt="Upload" className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">{cvFile ? cvFile.name : 'Upload Your CV'}</h3>
                <p className="text-white/60">{cvFile ? 'Click to change file' : 'Drop your CV here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.txt,.rtf,.docx" onChange={(e) => handleFileChange(e, setCvFile)} />
              </label>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleAnalyze}
              disabled={!jdFile || !cvFile || loading || trialsLeft <= 0}
              className={`px-12 py-4 rounded-full text-xl font-semibold transition-all flex items-center gap-3 ${(!jdFile || !cvFile || trialsLeft <= 0 || loading) ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/25'}`}
            >
              {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
          
          {error && <div className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center max-w-lg mx-auto">{error}</div>}

          {results && (
            <div className="mt-12 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md text-left max-w-2xl mx-auto animate-in slide-in-from-bottom-8">
              <h3 className="text-2xl font-bold mb-6 flex justify-between items-center">
                Analysis Results
                <span className={`text-3xl ${getMatchColor(results['JD-Match'])}`}>
                  {results['JD-Match']}% Match
                </span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-white/60 mb-2 font-medium">Profile Summary</h4>
                  <p className="text-white/90 leading-relaxed">{results['Profile Summary']}</p>
                </div>
                
                {results['Missing Skills'] && results['Missing Skills'].length > 0 && (
                  <div>
                    <h4 className="text-white/60 mb-2 font-medium">Missing Skills</h4>
                    <ul className="list-disc list-inside text-white/90">
                      {results['Missing Skills'].map((skill, idx) => (
                        <li key={idx}>{skill}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <p className="mt-8 text-white/80">You have <span className="font-bold text-white">{trialsLeft}</span> trials left before you need to signup</p>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-[#1B3162] py-24 px-4 text-center mt-16">
        <h2 className="text-4xl font-montserrat font-light max-w-5xl mx-auto mb-16 leading-relaxed">
          ATS Eureka is a free and fast AI tool that analyses your CV against a JD in under 1.5 minutes.
        </h2>
        <div className="flex justify-center gap-24 mt-8">
          {[
            { icon: 'upload-step-icon.svg', title: 'Upload' },
            { icon: 'analyse-icon.svg', title: 'Analyse' },
            { icon: 'compare-icon.svg', title: 'Compare' }
          ].map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-6">
              <img src={`/assets/images/${step.icon}`} alt={step.title} className="w-16 h-16" />
              <h3 className="text-2xl font-montserrat font-semibold">{step.title}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 text-center">
        <div className="max-w-6xl mx-auto px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-4xl font-semibold mb-8">Ready to land your dream job?</h2>
            <div className="flex gap-8 justify-center">
              <a href="#try-section" className="px-8 py-4 bg-white text-[#030412] rounded-full text-xl font-semibold hover:scale-105 transition-transform">
                Try Now
              </a>
              <Link to="/signup" className="px-8 py-4 bg-[#060825] text-white border border-white/20 rounded-full text-xl font-semibold hover:scale-105 transition-transform">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
