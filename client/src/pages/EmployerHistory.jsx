import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, LayoutDashboard, Search, User, LogOut, CheckCircle, FileText, Download, MessageSquare } from 'lucide-react';
import { getEmployerJds, getCandidateRankings, getCandidateSummary, exportResume } from '../lib/api';
import { toast } from 'sonner';
import InterviewKitModal from '../components/InterviewKitModal';
import EmployerLayout from '../components/EmployerLayout';

const CandidateRanking = () => {
  const [searchParams] = useSearchParams();
  const jdId = searchParams.get('jd');
  
  const [jds, setJds] = useState([]);
  const [selectedJd, setSelectedJd] = useState(jdId || '');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [summarizingId, setSummarizingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedCandidateForInterview, setSelectedCandidateForInterview] = useState(null);
  const [jdDataForInterview, setJdDataForInterview] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedJd) {
      fetchRankings(selectedJd);
      
      // Find JD data for interview kit
      const jd = jds.find(j => j.id === selectedJd);
      if (jd) setJdDataForInterview(jd);
    } else {
      setCandidates([]);
    }
  }, [selectedJd, jds]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const jdsData = await getEmployerJds(token);
      setJds(jdsData);
    } catch (error) {
      toast.error('Failed to load data');
    }
  };

  const fetchRankings = async (jd_id) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const data = await getCandidateRankings(jd_id, token);
      setCandidates(data.candidates || []);
    } catch (error) {
      toast.error('Failed to fetch rankings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const handleExportCandidate = async (candidate) => {
    setExportingId(candidate.id);
    try {
      const analysis = candidate.analysis_result || {};
      const mdContent = `
# Candidate Analysis Report
**Candidate:** ${candidate.candidate_name || 'Unknown'}
**ATS Score:** ${candidate.ats_score}%
**Compatibility:** ${analysis.is_compatible !== false ? 'Compatible' : 'Incompatible'}

## Profile Summary
${analysis['Profile Summary'] || 'N/A'}

## Evaluation
${(analysis.Evaluation || []).map(ev => `- **${ev.requirement}** (Critical: ${ev.critical ? 'Yes' : 'No'}) - Score: ${ev.score}/5`).join('\n')}

## Missing Skills
${(analysis['Missing Skills'] || []).map(skill => `- ${skill}`).join('\n')}
      `;

      const token = localStorage.getItem('token');
      const blob = await exportResume('pdf', mdContent, token);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Analysis_${candidate.candidate_name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExportingId(null);
    }
  };

  const handleGenerateSummary = async (candidateId) => {
    setSummarizingId(candidateId);
    try {
      const token = localStorage.getItem('token');
      const response = await getCandidateSummary(candidateId, token);
      setSummaries(prev => ({ ...prev, [candidateId]: response.summary }));
      toast.success('Summary generated');
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setSummarizingId(null);
    }
  };

  const openInterviewKit = (candidate) => {
    setSelectedCandidateForInterview(candidate);
    setIsInterviewModalOpen(true);
  };

  const getMatchColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <EmployerLayout>
        <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold">Analysis History</h2>
            
            <select 
              value={selectedJd}
              onChange={(e) => setSelectedJd(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white outline-none w-64 focus:border-[#4a6fff]"
            >
              <option value="" disabled className="text-black">Select Job Description...</option>
              {jds.map(jd => (
                <option key={jd.id} value={jd.id} className="text-black">{jd.title}</option>
              ))}
            </select>
          </div>
          
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full">
          {/* Main Column: Ranked Results */}
          <div className="w-full">
            {!selectedJd ? (
              <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/60 text-lg">Select a Job Description to view candidate rankings.</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-4 border-[#4a6fff] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-white/60 text-lg">No candidates analyzed for this JD yet.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {candidates.map((candidate, index) => {
                  const score = candidate.ats_score || 0;
                  const analysis = candidate.analysis_result || {};
                  const isCompatible = analysis.is_compatible !== false;
                  
                  return (
                    <div key={candidate.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-colors hover:bg-white/10">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">{candidate.candidate_name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-sm font-semibold px-2 py-0.5 rounded border ${isCompatible ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
                                {isCompatible ? 'Compatible' : 'Incompatible'}
                              </span>
                              <span className="text-white/40 text-sm">Status: {candidate.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getMatchColor(score)}`}>
                            {score}%
                          </div>
                          <span className="text-white/40 text-xs">ATS Score</span>
                        </div>
                      </div>

                      {/* Candidate Summary */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">AI Summary</h4>
                          {!(summaries[candidate.id] || analysis['Profile Summary'] || candidate.resume_summary) && (
                            <button 
                              onClick={() => handleGenerateSummary(candidate.id)}
                              disabled={summarizingId === candidate.id}
                              className="text-xs text-[#4a6fff] hover:text-[#3b5bdf] transition-colors flex items-center gap-1"
                            >
                              {summarizingId === candidate.id ? 'Generating...' : 'Generate Summary'}
                            </button>
                          )}
                        </div>
                        
                        {(summaries[candidate.id] || analysis['Profile Summary'] || candidate.resume_summary) ? (
                          <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm leading-relaxed text-white/90">
                            {summaries[candidate.id] || analysis['Profile Summary'] || candidate.resume_summary}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 border-dashed p-4 rounded-xl text-sm text-white/40 italic text-center">
                            No summary generated yet.
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-4 pt-4 border-t border-white/10">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleExportCandidate(candidate)}
                            disabled={exportingId === candidate.id}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center gap-2"
                          >
                            {exportingId === candidate.id ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <Download className="w-4 h-4" />}
                            Export PDF
                          </button>
                          <button 
                            onClick={() => openInterviewKit(candidate)}
                            className="px-4 py-2 bg-[#4a6fff]/20 text-[#4a6fff] hover:bg-[#4a6fff]/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-[#4a6fff]/30"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Interview Kit
                          </button>
                        </div>
                        
                        {/* We could add download resume or change status here */}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      
      {isInterviewModalOpen && (
        <InterviewKitModal 
          isOpen={isInterviewModalOpen}
          onClose={() => setIsInterviewModalOpen(false)}
          candidate={selectedCandidateForInterview}
          jd={jdDataForInterview}
        />
      )}
    </EmployerLayout>
  );
};

export default CandidateRanking;
