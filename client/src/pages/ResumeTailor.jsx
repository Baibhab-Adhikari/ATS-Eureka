import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Wand2, Download, ArrowRight, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import { getResumes, tailorResume, exportResume } from '../lib/api';

const ResumeTailor = () => {
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('tailored');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const data = await getResumes(token);
        setResumes(Array.isArray(data) ? data : (data.resumes || []));
      } catch (err) {
        console.error('Failed to fetch resumes:', err);
        toast.error('Failed to load your resumes');
      }
    };
    fetchResumes();
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
      setJdText('');
    }
  };

  const handleTailor = async () => {
    if (!selectedResumeId) {
      toast.error('Please select a resume to tailor');
      return;
    }
    if (!jdText.trim() && !jdFile) {
      toast.error('Please provide a Job Description');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const data = await tailorResume(selectedResumeId, jdText, jdFile, token);
      setResult(data);
      toast.success('Resume tailored successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to tailor resume');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!result?.tailored_resume) return;
    
    if (format === 'md') {
      const element = document.createElement("a");
      const file = new Blob([result.tailored_resume], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = "tailored_resume.md";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const blob = await exportResume(format, result.tailored_resume, token);
      const element = document.createElement("a");
      element.href = URL.createObjectURL(blob);
      element.download = `tailored_resume.${format}`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()}: ` + error.message);
    }
  };

  const getSelectedResumeText = () => {
    const resume = resumes.find(r => r._id === selectedResumeId);
    return resume ? resume.resume_text : '';
  };

  return (
    <DashboardLayout>
      <div className="p-12 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold mb-2">AI Resume Tailoring</h1>
          <p className="text-lg text-white/60">Customize your resume for a specific job description instantly.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#02A4FF]" /> Select Resume
              </h2>
              <select 
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                style={{ backgroundColor: 'white', color: 'black' }}
                className="w-full p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50"
              >
                <option value="">Choose a resume to tailor...</option>
                {resumes.map(resume => (
                  <option key={resume._id} value={resume._id}>
                    {resume.title} ({resume.file_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7D40FF]" /> Job Description
              </h2>
              <label className={`block p-8 mb-4 border-2 border-dashed ${jdFile ? 'border-green-500 bg-green-500/10' : 'border-white/20 bg-white/5'} rounded-2xl cursor-pointer hover:bg-white/10 transition-colors text-center`}>
                <img src="/assets/images/document-icon.svg" alt="Document" className="w-10 h-10 mx-auto mb-2 opacity-80" />
                <h3 className="text-lg font-semibold mb-1">{jdFile ? jdFile.name : 'Upload Job Description'}</h3>
                <p className="text-white/50 text-sm">{jdFile ? 'Click to change file' : 'Drop your JD here or click to browse'}</p>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              </label>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-px bg-white/20 flex-1"></div>
                <span className="text-white/50 text-sm font-medium">OR PASTE TEXT</span>
                <div className="h-px bg-white/20 flex-1"></div>
              </div>
              <textarea
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value);
                  if (e.target.value) setJdFile(null);
                }}
                placeholder="Paste the job description here..."
                className="w-full h-40 p-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#7D40FF]/50 resize-y"
              />
            </div>

            <button 
              onClick={handleTailor}
              disabled={loading || !selectedResumeId || (!jdText.trim() && !jdFile)}
              className="w-full py-4 bg-gradient-to-r from-[#02A4FF] to-[#7D40FF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-xl font-semibold transition-all shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Tailoring Resume...</>
              ) : (
                <><Wand2 className="w-6 h-6" /> Tailor Resume</>
              )}
            </button>
          </div>

          {/* Right Column: Output / Comparison */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md flex flex-col h-full">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Wand2 className="w-16 h-16 mb-4 text-white/30" />
                <p className="text-lg">Provide a resume and JD to see the tailored result here.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {result.is_compatible === false ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-red-500/10 border border-red-500/30 rounded-3xl">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">Incompatible Profile</h2>
                    <p className="text-white/80 max-w-lg mb-6">
                      {result.compatibility_warning || 'Your resume does not appear to match the core requirements for this Job Description. Please try a different resume or apply for a more relevant role.'}
                    </p>
                    <p className="text-white/50 text-sm">
                      We do not fabricate or hallucinate qualifications to match a job description.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-semibold text-green-400 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6" /> Tailored Successfully
                      </h2>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDownload('md')}
                          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" /> MD
                        </button>
                        <button 
                          onClick={() => handleDownload('pdf')}
                          className="flex items-center gap-2 px-3 py-2 bg-[#7D40FF]/20 text-[#7D40FF] hover:bg-[#7D40FF]/30 rounded-xl transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" /> PDF
                        </button>
                        <button 
                          onClick={() => handleDownload('docx')}
                          className="flex items-center gap-2 px-3 py-2 bg-[#02A4FF]/20 text-[#02A4FF] hover:bg-[#02A4FF]/30 rounded-xl transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" /> DOCX
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 border-b border-white/10 pb-4">
                  <button
                    onClick={() => setActiveTab('tailored')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tailored' ? 'bg-[#02A4FF]/20 text-[#02A4FF]' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    Tailored Resume
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'original' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                  >
                    Original Resume
                  </button>
                </div>

                <div className="flex-1 flex flex-col mb-8">
                  {activeTab === 'original' ? (
                    <div className="flex-1 p-6 bg-black/20 rounded-xl overflow-y-auto border border-white/5 text-sm whitespace-pre-wrap font-mono text-white/70 max-h-[600px]">
                      {getSelectedResumeText()}
                    </div>
                  ) : (
                    <div className="flex-1 p-6 bg-[#02A4FF]/5 rounded-xl overflow-y-auto border border-[#02A4FF]/20 text-sm whitespace-pre-wrap font-mono text-white max-h-[600px]">
                      {result.tailored_resume}
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {result.changes_summary?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-[#7D40FF]" /> AI Changes Summary
                    </h3>
                    <ul className="space-y-2">
                      {result.changes_summary.map((change, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-white/80">
                          <ChevronRight className="w-5 h-5 text-[#7D40FF] shrink-0 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  )}

                  {result.keyword_additions?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <ArrowRight className="w-5 h-5 text-[#02A4FF]" /> Suggested Keywords Integrated
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.keyword_additions.map((kw, idx) => (
                          <span key={idx} className="px-3 py-1 bg-[#02A4FF]/20 text-[#02A4FF] rounded-full text-sm font-medium border border-[#02A4FF]/30">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </>
              )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeTailor;
