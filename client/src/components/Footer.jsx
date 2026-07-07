import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#030412]/80 backdrop-blur-md pt-20 pb-10 border-t border-white/10 font-montserrat">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-2 text-xl font-semibold">
            <img src="/assets/images/briefcase-search.svg" alt="Logo" className="w-8 h-8" />
            <span>ATS-Eureka</span>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col gap-4">
              <a href="/#about" className="text-white/80 hover:text-white transition-colors">About us</a>
              <a href="/#contact" className="text-white/80 hover:text-white transition-colors">Contact us</a>
            </div>
            <div className="flex flex-col gap-4">
              <a href="/#terms" className="text-white/80 hover:text-white transition-colors">Terms and conditions</a>
              <a href="/#privacy" className="text-white/80 hover:text-white transition-colors">Privacy policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
