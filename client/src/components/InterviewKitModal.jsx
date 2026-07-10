import React, { useState } from 'react';
import { Download, X, MessageSquare, Briefcase } from 'lucide-react';
import { generateInterviewPrep, exportResume } from '../lib/api';
import { toast } from 'sonner';

const InterviewKitModal = ({ isOpen, onClose, candidate, jd }) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  if (!isOpen || !candidate || !jd) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // candidate.resume_id is the objectid of the resume
      const data = await generateInterviewPrep(candidate.resume_id, jd.full_description, null, token);
      setQuestions(data.questions);
      toast.success('Interview kit generated successfully!');
    } catch (error) {
      toast.error('Failed to generate interview kit');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    if (!questions) return;
    
    // Create markdown
    let markdown = `# Interview Kit: ${candidate.candidate_name}\n\n`;
    markdown += `## Role: ${jd.title}\n`;
    markdown += `## ATS Score: ${candidate.ats_score}%\n\n`;
    
    if (candidate.resume_summary) {
      markdown += `### Candidate Summary\n${candidate.resume_summary}\n\n`;
    }
    
    markdown += `---\n\n## Interview Questions\n\n`;
    
    questions.forEach((q, idx) => {
      markdown += `### ${idx + 1}. [${q.category} - ${q.difficulty}] ${q.question}\n`;
      markdown += `**Suggested Answer/Evaluation Criteria:**\n${q.suggested_answer}\n\n`;
    });

    try {
      const token = localStorage.getItem('token');
      const resultData = await exportResume(format, markdown, token);
      
      if (resultData.isUrl) {
        window.open(resultData.url, '_blank');
      } else {
        const url = window.URL.createObjectURL(resultData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Kit_${candidate.candidate_name.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      toast.success(`Downloaded ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111322] border border-white/10 rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#4a6fff]" />
              Interview Kit Builder
            </h2>
            <p className="text-white/60 mt-1 flex items-center gap-2">
              <UserIcon name={candidate.candidate_name} /> {candidate.candidate_name} 
              <span className="text-white/20">|</span> 
              <Briefcase className="w-4 h-4 text-white/40" /> {jd.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {!questions ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl border border-white/10 border-dashed">
              <MessageSquare className="w-16 h-16 text-white/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Generate Custom Interview Questions</h3>
              <p className="text-white/60 mb-8 max-w-md">
                Our AI will analyze the candidate's resume against the requirements for {jd.title} and generate tailored technical and behavioral questions.
              </p>
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 py-3 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Generate Questions'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold">{q.category}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      q.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                      q.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>{q.difficulty}</span>
                  </div>
                  <h4 className="text-lg font-medium mb-3 text-white/90">Q: {q.question}</h4>
                  <div className="bg-black/20 p-4 rounded-xl border-l-4 border-[#4a6fff]">
                    <span className="text-xs text-white/40 uppercase font-semibold mb-1 block">Evaluation Criteria</span>
                    <p className="text-white/70 text-sm">{q.suggested_answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {questions && (
          <div className="pt-6 mt-4 border-t border-white/10 flex justify-end gap-4">
            <button 
              onClick={() => handleDownload('pdf')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button 
              onClick={() => handleDownload('docx')}
              className="px-6 py-2 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Export DOCX
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const UserIcon = ({ name }) => (
  <div className="w-5 h-5 rounded-full bg-[#4a6fff]/20 text-[#4a6fff] flex items-center justify-center text-[10px] font-bold border border-[#4a6fff]/30">
    {name?.charAt(0) || 'U'}
  </div>
);

export default InterviewKitModal;
