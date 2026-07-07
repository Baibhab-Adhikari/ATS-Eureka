import React, { useState, useEffect } from 'react';
import { Search, Plus, X, UploadCloud, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import ResumeCard from '../components/ResumeCard';
import { getResumes, uploadResume, updateResume, deleteResume, downloadResumeUrl } from '../lib/api';

const ResumeManager = () => {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  // Form state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingResume, setEditingResume] = useState(null);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await getResumes(token);
      setResumes(data);
    } catch (error) {
      toast.error('Failed to load resumes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title) return toast.error('File and title are required');
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      await uploadResume(file, title, tags, token);
      toast.success('Resume uploaded successfully!');
      setIsUploadOpen(false);
      setFile(null);
      setTitle('');
      setTags('');
      fetchResumes();
    } catch (error) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error('Title is required');
    
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');
      
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      await updateResume(editingResume._id || editingResume.id, { title, tags: tagArray }, token);
      
      toast.success('Resume updated successfully!');
      setIsEditOpen(false);
      setEditingResume(null);
      setTitle('');
      setTags('');
      fetchResumes();
    } catch (error) {
      toast.error(error.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resume) => {
    if (!window.confirm('Are you sure you want to delete this resume?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await deleteResume(resume._id || resume.id, token);
      toast.success('Resume deleted successfully');
      setResumes(resumes.filter(r => (r._id || r.id) !== (resume._id || resume.id)));
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleDownload = async (resume) => {
    try {
      const token = localStorage.getItem('token');
      const blob = await downloadResumeUrl(resume._id || resume.id, token);
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      toast.error('Failed to download resume');
      console.error(error);
    }
  };

  const openEditModal = (resume) => {
    setEditingResume(resume);
    setTitle(resume.title);
    setTags(resume.tags ? resume.tags.join(', ') : '');
    setIsEditOpen(true);
  };

  const filteredResumes = resumes.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.tags && r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center bg-white/5 rounded-full px-6 py-3 border border-white/10 w-96 max-w-full">
          <input 
            type="text" 
            placeholder="Search resumes by title or tag..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-white w-full placeholder-white/50"
          />
          <Search className="w-5 h-5 text-white/50 ml-2 flex-shrink-0" />
        </div>
      </header>

      {/* Content Area */}
      <div className="p-8 md:p-12 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 md:mb-4 text-white">Resume Manager</h1>
            <p className="text-base md:text-lg text-white/60">Upload and manage multiple versions of your resume for different roles.</p>
          </div>
          <button 
            onClick={() => setIsUploadOpen(true)}
            className="px-6 py-3 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-[#4a6fff]/30 flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            New Resume
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 text-[#4a6fff] animate-spin" />
          </div>
        ) : filteredResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResumes.map(resume => (
              <ResumeCard 
                key={resume._id || resume.id}
                resume={resume}
                onDownload={handleDownload}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white/5 border border-white/10 rounded-3xl">
            <div className="p-6 bg-white/5 rounded-full mb-6">
              <FileText className="w-12 h-12 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No resumes found</h3>
            <p className="text-white/50 mb-8 max-w-md text-center">
              {searchQuery ? 'Try adjusting your search criteria.' : "You haven't uploaded any resumes yet. Add one to get started."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setIsUploadOpen(true)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-colors"
              >
                Upload First Resume
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl opacity-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Upload New Resume</h2>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleUploadSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Resume File (PDF, DOCX)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    required
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`flex items-center gap-3 p-4 border-2 border-dashed ${file ? 'border-[#4a6fff] bg-[#4a6fff]/20' : 'border-slate-600 bg-slate-800'} rounded-xl transition-colors`}>
                    <UploadCloud className={`w-6 h-6 ${file ? 'text-[#4a6fff]' : 'text-slate-400'}`} />
                    <span className={`text-sm ${file ? 'text-white truncate' : 'text-slate-400'}`}>
                      {file ? file.name : 'Click or drag file here'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Frontend Engineer - Dark Theme"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. React, UI/UX, Startup"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUploadOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !file || !title}
                  className="px-5 py-2.5 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Uploading...' : 'Upload Resume'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl opacity-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">Edit Resume Details</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Frontend Engineer - Dark Theme"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. React, UI/UX, Startup"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 placeholder-gray-400 outline-none focus:border-[#4a6fff] transition-colors"
                  style={{ backgroundColor: 'white', color: 'black' }}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !title}
                  className="px-5 py-2.5 bg-[#4a6fff] hover:bg-[#3b5bdf] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ResumeManager;
