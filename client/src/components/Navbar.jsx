import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 py-6 px-16 flex justify-between items-center bg-[#030412]/80 backdrop-blur-md z-50 font-montserrat">
      <Link to="/" className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white hover:opacity-80 transition-opacity">
        <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-10 h-10" />
        ATS-Eureka
      </Link>
      <div className="flex gap-8">
        <Link to="/" className="text-white text-base hover:opacity-80 transition-opacity font-normal">Home</Link>
        <a href="/#about" className="text-white text-base hover:opacity-80 transition-opacity font-normal">About us</a>
        <a href="/#contact" className="text-white text-base hover:opacity-80 transition-opacity font-normal">Contact us</a>
        <Link to="/signup" className="text-white text-base hover:opacity-80 transition-opacity font-normal">Signup</Link>
      </div>
    </nav>
  );
};

export default Navbar;
