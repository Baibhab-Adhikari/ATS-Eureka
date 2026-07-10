import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, LayoutDashboard, Plus, Trash2, Edit2, Play, LogOut, Search, User, Upload } from 'lucide-react';
import { getEmployerJds, createEmployerJd, updateEmployerJd, deleteEmployerJd, parseEmployerJdFile } from '../lib/api';
import { toast } from 'sonner';
import EmployerLayout from '../components/EmployerLayout';

const JdManager = () => {
  const [jds, setJds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isParsing, setIsParsing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJd, setEditingJd] = useState(null);
  const fileInputRef = React.useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    employment_type: '',
    location: '',
    experience_required: '',
    salary_range: '',
    required_skills: '',
    preferred_skills: '',
    full_description: '',
    status: 'Open'
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchJds();
  }, []);

  const fetchJds = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEmployerJds(token);
      setJds(data);
    } catch (error) {
      toast.error('Failed to load Job Descriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  const handleOpenModal = (jd = null) => {
    if (jd) {
      setEditingJd(jd);
      setFormData({
        title: jd.title || '',
        department: jd.department || '',
        employment_type: jd.employment_type || '',
        location: jd.location || '',
        experience_required: jd.experience_required || '',
        salary_range: jd.salary_range || '',
        required_skills: jd.required_skills?.join(', ') || '',
        preferred_skills: jd.preferred_skills?.join(', ') || '',
        full_description: jd.full_description || '',
        status: jd.status || 'Open'
      });
    } else {
      setEditingJd(null);
      setFormData({
        title: '',
        department: '',
        employment_type: '',
        location: '',
        experience_required: '',
        salary_range: '',
        required_skills: '',
        preferred_skills: '',
        full_description: '',
        status: 'Open',
        file_path: null
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const token = localStorage.getItem('token');
      const parsedData = await parseEmployerJdFile(file, token);
      
      setEditingJd(null);
      setFormData({
        title: parsedData.title || '',
        department: parsedData.department || '',
        employment_type: '',
        location: parsedData.location || '',
        experience_required: parsedData.experience_required || '',
        salary_range: '',
        required_skills: parsedData.required_skills || '',
        preferred_skills: '',
        full_description: parsedData.full_description || '',
        status: 'Open',
        file_path: parsedData.file_path || null
      });
      setIsModalOpen(true);
      toast.success('Successfully parsed JD from file');
    } catch (error) {
      toast.error(error.message || 'Failed to parse file');
    } finally {
      setIsParsing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        required_skills: formData.required_skills.split(',').map(s => s.trim()).filter(Boolean),
        preferred_skills: formData.preferred_skills.split(',').map(s => s.trim()).filter(Boolean),
      };

      if (editingJd) {
        await updateEmployerJd(editingJd.id, payload, token);
        toast.success('Job description updated');
      } else {
        await createEmployerJd(payload, token);
        toast.success('Job description created');
      }
      setIsModalOpen(false);
      fetchJds();
    } catch (error) {
      toast.error(error.message || 'Failed to save job description');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job description?')) {
      try {
        const token = localStorage.getItem('token');
        await deleteEmployerJd(id, token);
        toast.success('Job description deleted');
        fetchJds();
      } catch (error) {
        toast.error('Failed to delete job description');
      }
    }
  };

  return (
    <EmployerLayout>
        <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center bg-white/5 rounded-full px-6 py-3 border border-white/10 w-96">
            <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-white w-full placeholder-white/50" />
            <Search className="w-5 h-5 text-white/50" />
          </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-semibold mb-4">Job Descriptions</h1>
              <p className="text-lg text-white/60">Manage your open roles and requirements.</p>
            </div>
            <div className="flex gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.txt" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current.click()} 
                disabled={isParsing}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-semibold transition-colors flex items-center gap-2 border border-white/10 disabled:opacity-50"
              >
                {isParsing ? <div className="w-5 h-5 border-2 border-white/50 border-t-transparent rounded-full animate-spin"></div> : <Upload className="w-5 h-5" />}
                {isParsing ? 'Parsing...' : 'Import from File'}
              </button>
              <button 
                onClick={() => handleOpenModal()} 
                className="px-6 py-3 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-xl text-white font-semibold transition-colors flex items-center gap-2 shadow-lg hover:shadow-[#4a6fff]/30"
              >
                <Plus className="w-5 h-5" /> New Job Description
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-[#4a6fff] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : jds.length === 0 ? (
            <div className="text-center p-12 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-white/60 text-lg">No job descriptions found. Create one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jds.map(jd => (
                <div key={jd.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-white/90 line-clamp-1">{jd.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      jd.status === 'Open' ? 'bg-green-500/20 text-green-300' : 
                      jd.status === 'Draft' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                    }`}>
                      {jd.status}
                    </span>
                  </div>
                  
                  <div className="text-white/60 text-sm space-y-2 mb-6 flex-grow">
                    {jd.department && <p><span className="text-white/40">Dept:</span> {jd.department}</p>}
                    {jd.location && <p><span className="text-white/40">Loc:</span> {jd.location}</p>}
                    {jd.experience_required && <p><span className="text-white/40">Exp:</span> {jd.experience_required}</p>}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <button 
                      onClick={() => navigate(`/employer/ats?jd=${jd.id}`)}
                      className="text-[#4a6fff] hover:text-[#3b5bdf] text-sm font-medium flex items-center gap-1"
                    >
                      <Play className="w-4 h-4" /> Analyze
                    </button>
                    <div className="flex gap-3">
                      <button onClick={() => handleOpenModal(jd)} className="text-white/40 hover:text-white transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(jd.id)} className="text-red-400/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111322] border border-white/10 rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">{editingJd ? 'Edit Job Description' : 'New Job Description'}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Job Title *</label>
                  <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Department</label>
                  <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Location</label>
                  <input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Experience Required</label>
                  <input value={formData.experience_required} onChange={e => setFormData({...formData, experience_required: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Required Skills (comma separated)</label>
                <input value={formData.required_skills} onChange={e => setFormData({...formData, required_skills: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none" placeholder="React, Python, System Design" />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Full Description *</label>
                <textarea required rows="6" value={formData.full_description} onChange={e => setFormData({...formData, full_description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#4a6fff] outline-none"></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-xl font-medium transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployerLayout>
  );
};

export default JdManager;
