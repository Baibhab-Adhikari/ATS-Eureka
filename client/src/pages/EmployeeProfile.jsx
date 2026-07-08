import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployeeProfile, updateEmployeeProfile } from '../lib/api';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    skills: '',
    employment_status: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const data = await getEmployeeProfile(token);
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          skills: data.skills || '',
          employment_status: data.employment_status || ''
        });
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await updateEmployeeProfile(formData, token);
      toast.success('Profile updated successfully');
      // Refresh profile data locally
      setProfile(prev => ({ ...prev, ...formData }));
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-12 max-w-4xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-semibold mb-2">Your Profile</h1>
          <p className="text-lg text-white/60">Manage your personal details and account settings.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/10">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#02A4FF] to-[#7D40FF] p-[3px]">
              <div className="w-full h-full bg-[#0b0c16] rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white/80" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-semibold">{profile?.full_name || 'User'}</h2>
              <p className="text-white/60 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {profile?.email}
              </p>
              <div className="mt-3 inline-block bg-white/10 px-3 py-1 rounded-full text-sm text-white/80 capitalize">
                {profile?.user_type} Account
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-white/80 ml-1">Full Name</label>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  style={{ backgroundColor: 'white', color: 'black' }}
                  className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/80 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={profile?.email || ''}
                  disabled
                  style={{ backgroundColor: '#ffffff80', color: 'black' }}
                  className="w-full px-4 py-3 rounded-xl border-none outline-none cursor-not-allowed opacity-70"
                />
                <p className="text-xs text-white/40 ml-1">Email cannot be changed.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80 ml-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Employment Status
              </label>
              <select
                name="employment_status"
                value={formData.employment_status}
                onChange={handleChange}
                style={{ backgroundColor: 'white', color: 'black' }}
                className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50"
              >
                <option value="">Select your status...</option>
                <option value="Actively looking">Actively looking</option>
                <option value="Open to offers">Open to offers</option>
                <option value="Not looking">Not looking</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/80 ml-1 flex items-center gap-2">
                <Code className="w-4 h-4" /> Skills (comma separated)
              </label>
              <textarea 
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                style={{ backgroundColor: 'white', color: 'black' }}
                className="w-full px-4 py-3 rounded-xl border-none outline-none focus:ring-2 focus:ring-[#02A4FF]/50 min-h-[100px] resize-y"
                placeholder="React, Python, AWS, Docker..."
              />
            </div>

            <div className="pt-6 flex justify-end">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-gradient-to-r from-[#02A4FF] to-[#7D40FF] hover:opacity-90 text-white font-medium py-3 px-8 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
