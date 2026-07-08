import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getDashboardData } from '../lib/api';
import { toast } from 'sonner';
import {
  Loader2, Briefcase, FileText, Target, Award, Calendar, 
  CheckCircle2, XCircle, Clock, Lightbulb, TrendingUp
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#02A4FF', '#7D40FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/');
          return;
        }
        const dashboardData = await getDashboardData(token);
        setData(dashboardData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen w-full flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#02A4FF]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="h-screen w-full flex items-center justify-center dark:text-white/50 text-gray-500">
          Failed to load data. Please try refreshing.
        </div>
      </DashboardLayout>
    );
  }

  const { 
    summary, 
    application_statistics, 
    resume_statistics, 
    ats_analytics, 
    charts, 
    recent_activity, 
    upcoming_interviews,
    insights
  } = data;

  const StatCard = ({ title, value, icon: Icon, subtitle, gradient = false }) => (
    <div className={`p-6 rounded-2xl border ${gradient ? 'bg-gradient-to-tr from-[#02A4FF]/10 to-[#7D40FF]/10 border-[#7D40FF]/20' : 'dark:bg-white/5 bg-white border-gray-200 dark:border-white/10 shadow-sm'} backdrop-blur-md`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl dark:bg-white/5 bg-gray-100">
          <Icon className={`w-6 h-6 ${gradient ? 'text-[#7D40FF]' : 'dark:text-white/70 text-gray-600'}`} />
        </div>
      </div>
      <div>
        <h3 className="dark:text-white/60 text-gray-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold dark:text-white text-gray-900 mb-1">{value}</div>
        {subtitle && <p className="text-sm dark:text-white/40 text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Header Section */}
        <div>
          <h1 className="text-3xl font-bold mb-2 dark:text-white text-gray-900">Career Analytics Dashboard</h1>
          <p className="dark:text-white/60 text-gray-600">Track your job search progress, analyze your resume performance, and discover insights.</p>
        </div>

        {/* AI Insights Section */}
        {insights && insights.length > 0 && (
          <div className="bg-gradient-to-r from-[#02A4FF]/10 via-[#7D40FF]/10 to-transparent border border-[#7D40FF]/20 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-[#7D40FF]" />
              <h2 className="text-lg font-semibold dark:text-white text-gray-900">AI Personalized Insights</h2>
            </div>
            <ul className="space-y-3">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-[#02A4FF] shrink-0 mt-0.5" />
                  <span className="dark:text-white/80 text-gray-700">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Applications" value={summary.applications} icon={Briefcase} subtitle={`Avg ${application_statistics.avg_apps_per_week} per week`} />
          <StatCard title="Total Resumes" value={summary.resumes} icon={FileText} subtitle={`Most used: ${resume_statistics.most_used}`} />
          <StatCard title="Avg ATS Score" value={summary.average_ats} icon={Target} gradient subtitle={`Highest: ${ats_analytics.highest}`} />
          <StatCard title="Success Rate" value={`${summary.success_rate}%`} icon={Award} subtitle={`${summary.offers} Offers received`} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-xl p-4 text-center">
            <div className="dark:text-white/50 text-gray-500 text-xs mb-1">Wishlist</div>
            <div className="text-xl font-bold dark:text-white text-gray-900">{summary.wishlist}</div>
          </div>
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-xl p-4 text-center">
            <div className="dark:text-white/50 text-gray-500 text-xs mb-1">Interviews</div>
            <div className="text-xl font-bold text-[#10B981]">{summary.interviews}</div>
          </div>
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-xl p-4 text-center">
            <div className="dark:text-white/50 text-gray-500 text-xs mb-1">Offers</div>
            <div className="text-xl font-bold text-[#F59E0B]">{summary.offers}</div>
          </div>
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-xl p-4 text-center">
            <div className="dark:text-white/50 text-gray-500 text-xs mb-1">Rejections</div>
            <div className="text-xl font-bold text-[#EF4444]">{summary.rejections}</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Application Status Distribution */}
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 dark:text-white text-gray-900">Application Status</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.status_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.status_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ATS Score Trend */}
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 dark:text-white text-gray-900">ATS Score Trend</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.ats_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    itemStyle={{ color: '#02A4FF' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#02A4FF" 
                    strokeWidth={3}
                    dot={{ fill: '#02A4FF', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ATS Score Distribution */}
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 dark:text-white text-gray-900">ATS Score Distribution</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.ats_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  />
                  <Bar dataKey="count" fill="#7D40FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Bottom Section: Activity */}
        <div className="grid grid-cols-1 gap-6">
          {/* Recent Activity */}
          <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 dark:text-white text-gray-900">
              <Clock className="w-5 h-5 text-[#02A4FF]" />
              Recent Applications
            </h3>
            {recent_activity.length > 0 ? (
              <div className="space-y-4">
                {recent_activity.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-3 rounded-xl dark:hover:bg-white/5 hover:bg-gray-50 transition-colors">
                    <div className="p-2 rounded-lg dark:bg-white/5 bg-gray-100">
                      <Briefcase className="w-4 h-4 text-[#02A4FF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white text-gray-900 truncate">{activity.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs dark:text-white/40 text-gray-400">
                          {new Date(activity.date).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full 
                          ${activity.status === 'Offered' ? 'bg-[#10B981]/20 text-[#10B981]' : 
                            activity.status === 'Rejected' ? 'bg-[#EF4444]/20 text-[#EF4444]' :
                            activity.status === 'Interview Scheduled' ? 'bg-[#F59E0B]/20 text-[#F59E0B]' :
                            'dark:bg-white/10 bg-gray-200 dark:text-white/60 text-gray-600'}`
                        }>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 dark:text-white/40 text-gray-400">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p>No recent activity found</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
