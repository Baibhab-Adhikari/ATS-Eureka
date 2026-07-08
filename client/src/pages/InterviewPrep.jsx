import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, FileText, Upload, ChevronDown, ChevronUp, Loader2, Target, Brain, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import DashboardLayout from '../components/DashboardLayout';
import { getResumes, generateInterviewPrep } from '../lib/api';

const InterviewPrep = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const data = await getResumes(token);
        setResumes(data);
        if (data.length > 0) {
          setSelectedResumeId(data[0]._id || data[0].id);
        }
      } catch (error) {
        toast.error(error.message);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      return toast.error('Please select a resume');
    }
    if (!jdText && !jdFile) {
      return toast.error('Please provide a Job Description (text or file)');
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await generateInterviewPrep(selectedResumeId, jdText, jdFile, token);
      setResult(data);
      setExpandedQuestions({});
      toast.success('Interview questions generated successfully!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (idx) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'dark:bg-white/10 bg-gray-100 dark:text-white/70 text-gray-700 dark:border-white/20 border-gray-300';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'project': return <Briefcase className="w-4 h-4" />;
      case 'behavioral': return <Brain className="w-4 h-4" />;
      case 'scenario': return <Target className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  // Group questions by category if result exists
  const groupedQuestions = result?.questions?.reduce((acc, q) => {
    const cat = q.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout>
      <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#02A4FF] to-[#7D40FF]">
            Interview Preparation
          </h1>
          <p className="dark:text-white/60 text-gray-600 text-lg">
            Generate highly tailored interview questions based on your resume and target job.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: Form */}
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-8 backdrop-blur-sm self-start">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium dark:text-white/70 text-gray-700 mb-2">
                  Select Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full dark:bg-black/40 bg-gray-50 border dark:border-white/10 border-gray-300 rounded-xl p-4 dark:text-white text-gray-900 outline-none focus:border-[#02A4FF]/50 transition-colors"
                  required
                >
                  <option value="">Select a resume...</option>
                  {resumes.map(resume => (
                    <option key={resume._id || resume.id} value={resume._id || resume.id}>
                      {resume.title} ({resume.file_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark:text-white/70 text-gray-700 mb-2">
                  Job Description
                </label>
                <div className="space-y-4">
                  <textarea
                    value={jdText}
                    onChange={(e) => { setJdText(e.target.value); setJdFile(null); }}
                    placeholder="Paste the job description here..."
                    className="w-full dark:bg-black/40 bg-gray-50 border dark:border-white/10 border-gray-300 rounded-xl p-4 dark:text-white text-gray-900 dark:placeholder-gray-400 placeholder-gray-500 outline-none focus:border-[#02A4FF]/50 transition-colors h-48 resize-none"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px dark:bg-white/10 bg-gray-300"></div>
                    <span className="dark:text-white/40 text-gray-500 text-sm font-medium">OR</span>
                    <div className="flex-1 h-px dark:bg-white/10 bg-gray-300"></div>
                  </div>
                  <div>
                    <input
                      type="file"
                      id="jd-file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".pdf,.docx,.txt"
                    />
                    <label 
                      htmlFor="jd-file"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-300 border-dashed rounded-xl cursor-pointer dark:hover:bg-white/10 hover:bg-gray-100 transition-colors dark:text-white/70 text-gray-700"
                    >
                      <Upload className="w-5 h-5" />
                      {jdFile ? jdFile.name : 'Upload JD Document'}
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedResumeId || (!jdText && !jdFile)}
                className="w-full py-4 bg-gradient-to-r from-[#02A4FF] to-[#7D40FF] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5" />
                    Generate Interview Prep
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Results */}
          <div className="flex flex-col">
            {!result ? (
              <div className="flex-1 dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 dark:bg-white/5 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-10 h-10 dark:text-white/20 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold dark:text-white/70 text-gray-700 mb-2">No Questions Generated Yet</h3>
                <p className="dark:text-white/40 text-gray-500 max-w-sm">
                  Select your resume, provide the job description, and hit generate to get tailored interview questions.
                </p>
              </div>
            ) : (
              <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-8 backdrop-blur-sm space-y-8">
                {Object.entries(groupedQuestions).map(([category, questions]) => (
                  <div key={category} className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white text-gray-900">
                      {getCategoryIcon(category)}
                      {category} Questions
                    </h2>
                    <div className="space-y-4">
                      {questions.map((q, idx) => {
                        const globalIdx = `${category}-${idx}`;
                        const isExpanded = expandedQuestions[globalIdx];
                        return (
                          <div key={globalIdx} className="dark:bg-black/30 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <div 
                              className="p-5 cursor-pointer dark:hover:bg-white/5 hover:bg-gray-100 transition-colors flex items-start justify-between gap-4"
                              onClick={() => toggleQuestion(globalIdx)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </span>
                                </div>
                                <h3 className="font-medium dark:text-white/90 text-gray-800 leading-relaxed">
                                  {q.question}
                                </h3>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 dark:text-white/40 text-gray-500 shrink-0" />
                              ) : (
                                <ChevronDown className="w-5 h-5 dark:text-white/40 text-gray-500 shrink-0" />
                              )}
                            </div>
                            {isExpanded && (
                              <div className="p-5 border-t dark:border-white/10 border-gray-200 bg-[#02A4FF]/5 text-sm dark:text-white/80 text-gray-700 markdown-body">
                                <h4 className="font-semibold dark:text-white text-gray-900 mb-2">Suggested Key Points:</h4>
                                <ReactMarkdown>
                                  {q.suggested_answer}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;
