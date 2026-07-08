import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { login } from '../lib/api';

const SignIn = () => {
  const [isEmployer, setIsEmployer] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password, isEmployer ? 'employer' : 'employee');
      // Store token
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user_type', isEmployer ? 'employer' : 'employee');
      
      // Redirect
      navigate(isEmployer ? '/employer' : '/employee');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-8 bg-custom-radial bg-cover pt-24 font-montserrat relative dark:bg-[#030412] bg-gray-50">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 dark:text-white text-gray-900 font-medium hover:opacity-80 transition-opacity">
        <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        <span className="text-xl">ATS-Eureka</span>
      </Link>

      <div className="dark:bg-white/[0.03] bg-white backdrop-blur-md rounded-3xl p-12 w-full max-w-lg relative border dark:border-white/5 border-gray-200 shadow-2xl">
        <Link to="/" className="absolute top-8 left-8 w-10 h-10 rounded-full dark:bg-white/10 bg-gray-100 flex items-center justify-center dark:hover:bg-white/20 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 dark:text-white text-gray-600" />
        </Link>

        {/* Toggle Container */}
        <div className="flex dark:bg-white/5 bg-gray-100 rounded-full p-1 mb-10 w-fit mx-auto mt-16 relative">
          <div 
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] dark:bg-white/10 bg-white shadow-sm rounded-full transition-transform duration-300 ${!isEmployer ? 'translate-x-full' : 'translate-x-0'}`} 
          />
          <button 
            type="button"
            className={`px-8 py-2 rounded-full relative z-10 font-medium transition-colors ${isEmployer ? 'dark:text-white text-gray-900' : 'dark:text-white/60 text-gray-500 dark:hover:text-white hover:text-gray-900'}`}
            onClick={() => setIsEmployer(true)}
          >
            Employer
          </button>
          <button 
            type="button"
            className={`px-8 py-2 rounded-full relative z-10 font-medium transition-colors ${!isEmployer ? 'dark:text-white text-gray-900' : 'dark:text-white/60 text-gray-500 dark:hover:text-white hover:text-gray-900'}`}
            onClick={() => setIsEmployer(false)}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium text-center mb-6 leading-tight px-4 dark:text-white text-gray-900">
            {isEmployer ? 'Find your best employees' : 'Find your dream job'}
          </h1>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-center text-sm border border-red-500/50">{error}</div>}

          <input 
            type="email" 
            placeholder={isEmployer ? "Business Email" : "Email Address"} 
            className="w-full px-5 py-4 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl dark:text-white text-gray-900 dark:placeholder-white/50 placeholder-gray-400 focus:outline-none dark:focus:border-white/20 focus:border-gray-400 dark:focus:bg-white/10 focus:bg-white transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full px-5 py-4 dark:bg-white/5 bg-gray-50 border dark:border-white/10 border-gray-200 rounded-xl dark:text-white text-gray-900 dark:placeholder-white/50 placeholder-gray-400 focus:outline-none dark:focus:border-white/20 focus:border-gray-400 dark:focus:bg-white/10 focus:bg-white transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 p-4 dark:bg-white/10 bg-[#02A4FF]/10 border dark:border-white/20 border-[#02A4FF]/20 rounded-xl dark:text-white text-[#02A4FF] font-medium dark:hover:bg-white/15 hover:bg-[#02A4FF]/20 dark:hover:border-white/30 hover:border-[#02A4FF]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <p className="text-center mt-8 dark:text-white/60 text-gray-500 text-sm">
            Don't have an account? <Link to="/signup" className="dark:text-white text-[#02A4FF] font-medium hover:underline">Signup</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
