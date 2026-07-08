import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, LayoutDashboard, Search, User, LogOut, TrendingUp, Award, Clock, ChevronDown } from 'lucide-react';
import { getEmployerDashboard } from '../lib/api';
import { toast } from 'sonner';
import EmployerLayout from '../components/EmployerLayout';

const EmployerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEmployerDashboard(token);
      setDashboardData(data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_type');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030412] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#4a6fff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { kpis, charts } = dashboardData || {};

  return (
    <EmployerLayout>
        <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
        </header>

        <div className="p-10 max-w-7xl mx-auto w-full">
          <h1 className="text-3xl font-semibold mb-8">Hiring Overview</h1>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Briefcase className="w-16 h-16" />
              </div>
              <p className="text-white/60 font-medium mb-1 relative z-10">Active Jobs</p>
              <h3 className="text-4xl font-bold relative z-10">{kpis?.active_jobs || 0}</h3>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="w-16 h-16" />
              </div>
              <p className="text-white/60 font-medium mb-1 relative z-10">Total Analyzed</p>
              <h3 className="text-4xl font-bold relative z-10">{kpis?.total_candidates || 0}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Award className="w-16 h-16" />
              </div>
              <p className="text-white/60 font-medium mb-1 relative z-10">Avg ATS Score</p>
              <h3 className="text-4xl font-bold relative z-10 text-[#4a6fff]">{kpis?.average_ats || 0}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:bg-white/10 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-16 h-16" />
              </div>
              <p className="text-white/60 font-medium mb-1 relative z-10">Total Hires</p>
              <h3 className="text-4xl font-bold relative z-10 text-green-400">{kpis?.hires || 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hiring Funnel */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">Hiring Funnel</h3>
              <div className="flex flex-col gap-4">
                {(charts?.hiring_funnel || []).map((step, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="w-32 font-medium text-white/80">{step.stage}</div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="h-10 bg-[#4a6fff]/20 rounded-r-xl border border-[#4a6fff]/30 border-l-0 flex items-center px-4 transition-all" 
                           style={{ width: `${Math.max((step.count / (kpis?.total_candidates || 1)) * 100, 15)}%` }}>
                        <span className="font-bold">{step.count}</span>
                      </div>
                      {step.conversion_to_next !== undefined && (
                        <div className="text-xs text-white/40 flex flex-col justify-center h-full -mb-10 ml-2">
                          <span>{step.conversion_to_next}% conversion</span>
                          <span className="text-[10px]">to next stage</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Applications per Job */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <h3 className="text-xl font-semibold mb-6">Applications per Job Description</h3>
              {charts?.applications_per_job?.length === 0 ? (
                <p className="text-white/50 text-center py-12">No data available yet.</p>
              ) : (
                <div className="flex flex-col gap-5">
                  {(charts?.applications_per_job || []).map((item, idx) => {
                    const maxCount = Math.max(...charts.applications_per_job.map(i => i.applications));
                    const percentage = maxCount > 0 ? (item.applications / maxCount) * 100 : 0;
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="truncate max-w-[250px] font-medium">{item.name}</span>
                          <span className="text-white/60">{item.applications} Candidates</span>
                        </div>
                        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#4a6fff] to-[#6b8fff] rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
    </EmployerLayout>
  );
};

export default EmployerDashboard;
