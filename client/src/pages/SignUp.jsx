import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { registerEmployer, registerEmployee } from '../lib/api';

const SignUp = () => {
  const [isEmployer, setIsEmployer] = useState(true);
  const [formData, setFormData] = useState({
    company_name: '',
    business_email: '',
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isEmployer) {
        await registerEmployer({
          company_name: formData.company_name,
          business_email: formData.business_email,
          password: formData.password,
          confirm_password: formData.confirm_password
        });
      } else {
        await registerEmployee({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password
        });
      }
      // Redirect to signin after successful registration
      navigate('/signin');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-8 bg-custom-radial bg-cover pt-24 font-montserrat relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 text-white font-medium hover:opacity-80 transition-opacity">
        <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        <span className="text-xl">ATS-Eureka</span>
      </Link>

      <div className="bg-white/[0.03] backdrop-blur-md rounded-3xl p-12 w-full max-w-lg relative border border-white/5 shadow-2xl">
        <Link to="/" className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>

        {/* Toggle Container */}
        <div className="flex bg-white/5 rounded-full p-1 mb-10 w-fit mx-auto mt-16 relative">
          <div 
            className={`absolute top-1 bottom-1 w-1/2 bg-white/10 rounded-full transition-transform duration-300 ${!isEmployer ? 'translate-x-full' : 'translate-x-0'}`} 
          />
          <button 
            type="button"
            className={`px-8 py-2 rounded-full relative z-10 font-medium transition-colors ${isEmployer ? 'text-white' : 'text-white/60 hover:text-white'}`}
            onClick={() => setIsEmployer(true)}
          >
            Employer
          </button>
          <button 
            type="button"
            className={`px-8 py-2 rounded-full relative z-10 font-medium transition-colors ${!isEmployer ? 'text-white' : 'text-white/60 hover:text-white'}`}
            onClick={() => setIsEmployer(false)}
          >
            Employee
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="text-3xl font-medium text-center mb-6 leading-tight px-4">
            Create your account to<br />
            {isEmployer ? 'find your best employees' : 'find your dream job'}
          </h1>

          {error && <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-center text-sm border border-red-500/50">{error}</div>}

          {isEmployer ? (
            <>
              <input 
                type="text" 
                name="company_name"
                placeholder="Company Name" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                value={formData.company_name}
                onChange={handleChange}
                required
              />
              <input 
                type="email" 
                name="business_email"
                placeholder="Business Email" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                value={formData.business_email}
                onChange={handleChange}
                required
              />
            </>
          ) : (
            <>
              <input 
                type="text" 
                name="full_name"
                placeholder="Full Name" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                value={formData.full_name}
                onChange={handleChange}
                required
              />
              <input 
                type="email" 
                name="email"
                placeholder="Email Address" 
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </>
          )}
          
          <input 
            type="password" 
            name="password"
            placeholder="Password" 
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="8"
          />
          <input 
            type="password" 
            name="confirm_password"
            placeholder="Confirm Password" 
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            minLength="8"
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 p-4 bg-white/10 border border-white/20 rounded-xl text-white font-medium hover:bg-white/15 hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : `Create ${isEmployer ? 'Employer' : 'Employee'} Account`}
          </button>
          
          <p className="text-center mt-8 text-white/60 text-sm">
            Already have an account? <Link to="/signin" className="text-white font-medium hover:underline">Signin</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
