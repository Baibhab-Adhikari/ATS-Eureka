import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

const Navbar = () => {
  const location = useLocation();

  // Hide navbar on dashboard routes
  if (location.pathname.startsWith('/employee') || location.pathname.startsWith('/employer')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 py-6 px-16 flex justify-between items-center dark:bg-[#030412]/80 bg-white/80 backdrop-blur-md z-50 font-montserrat border-b dark:border-white/10 border-gray-200">
      <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight dark:text-white text-gray-900 hover:opacity-80 transition-opacity">
        <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        ATS-Eureka
      </Link>
      <div className="flex items-center gap-8">
        <Link to="/" className="dark:text-white text-gray-900 text-base hover:opacity-80 transition-opacity font-normal">Home</Link>
        <Link to="/signup" className="dark:text-white text-gray-900 text-base hover:opacity-80 transition-opacity font-normal">Signup</Link>
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Navbar;
