import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getResumes } from '../lib/api';

const STATUS_OPTIONS = ["Wishlist", "Applied", "Interview Scheduled", "Offered", "Rejected"];

const ApplicationModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [status, setStatus] = useState('Wishlist');
  const [resumeUsed, setResumeUsed] = useState('');
  const [notes, setNotes] = useState('');
  const [atsScore, setAtsScore] = useState('');
  const [resumes, setResumes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCompany(initialData.company || '');
        setJobTitle(initialData.job_title || '');
        setJobLink(initialData.job_link || '');
        setStatus(initialData.status || 'Wishlist');
        setResumeUsed(initialData.resume_used || '');
        setNotes(initialData.notes || '');
        setAtsScore(initialData.ats_score || '');
      } else {
        setCompany('');
        setJobTitle('');
        setJobLink('');
        setStatus('Wishlist');
        setResumeUsed('');
        setNotes('');
        setAtsScore('');
      }
      fetchResumes();
    }
  }, [isOpen, initialData]);

  const fetchResumes = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getResumes(token);
      setResumes(data);
    } catch (error) {
      console.error('Error fetching resumes:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const appData = {
        company,
        job_title: jobTitle,
        job_link: jobLink,
        status,
        notes,
        resume_used: resumeUsed || null,
        ats_score: atsScore ? parseInt(atsScore, 10) : null
      };
      await onSubmit(appData);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl opacity-100 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">{initialData ? 'Edit Application' : 'Log New Application'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Company *</label>
              <input 
                type="text" 
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                style={{ backgroundColor: 'white', color: 'black' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job Title *</label>
              <input 
                type="text" 
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                style={{ backgroundColor: 'white', color: 'black' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Job Posting URL</label>
            <input 
              type="url" 
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
              style={{ backgroundColor: 'white', color: 'black' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#4a6fff] transition-colors"
                style={{ backgroundColor: 'white', color: 'black' }}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Resume Used</label>
              <select 
                value={resumeUsed}
                onChange={(e) => setResumeUsed(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[#4a6fff] transition-colors"
                style={{ backgroundColor: 'white', color: 'black' }}
              >
                <option value="">None</option>
                {resumes.map(r => (
                  <option key={r._id || r.id} value={r._id || r.id}>{r.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors resize-none"
              style={{ backgroundColor: 'white', color: 'black' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ATS Score (Optional)</label>
            <input 
              type="number" 
              min="0" max="100"
              value={atsScore}
              onChange={(e) => setAtsScore(e.target.value)}
              placeholder="e.g. 85"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
              style={{ backgroundColor: 'white', color: 'black' }}
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !company || !jobTitle}
              className="px-5 py-2.5 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationModal;
