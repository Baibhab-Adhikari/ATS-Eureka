import React, { useState, useRef, useEffect } from 'react';
import { FileText, MoreVertical, Download, Edit2, Trash2 } from 'lucide-react';

const ResumeCard = ({ resume, onDownload, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="dark:bg-white/5 bg-white border dark:border-white/10 border-gray-200 shadow-sm rounded-2xl p-6 dark:hover:bg-white/10 hover:bg-gray-50 transition-colors relative group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[#4a6fff]/20 rounded-xl">
            <FileText className="w-8 h-8 text-[#4a6fff]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg dark:text-white text-gray-900 truncate max-w-[200px]" title={resume.title}>
              {resume.title}
            </h3>
            <p className="text-sm dark:text-white/50 text-gray-500">
              Uploaded {formatDate(resume.created_at)}
            </p>
          </div>
        </div>
        
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 dark:hover:bg-white/10 hover:bg-gray-100 rounded-full transition-colors dark:text-white/70 text-gray-600"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 border dark:border-slate-700 border-gray-200 rounded-xl shadow-2xl z-50 py-1 overflow-hidden dark:bg-[#0f172a] bg-white">
              <button 
                onClick={() => { setShowMenu(false); onDownload(resume); }}
                className="w-full text-left px-4 py-2 dark:hover:bg-white/5 hover:bg-gray-50 flex items-center gap-2 dark:text-white/80 text-gray-700"
              >
                <Download className="w-4 h-4" /> Download
              </button>
              <button 
                onClick={() => { setShowMenu(false); onEdit(resume); }}
                className="w-full text-left px-4 py-2 dark:hover:bg-white/5 hover:bg-gray-50 flex items-center gap-2 dark:text-white/80 text-gray-700"
              >
                <Edit2 className="w-4 h-4" /> Edit Details
              </button>
              <div className="h-px dark:bg-white/10 bg-gray-200 my-1"></div>
              <button 
                onClick={() => { setShowMenu(false); onDelete(resume); }}
                className="w-full text-left px-4 py-2 dark:hover:bg-white/5 hover:bg-red-50 flex items-center gap-2 text-red-500"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mt-6">
        {resume.tags && resume.tags.length > 0 ? (
          resume.tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200 rounded-md text-xs dark:text-white/70 text-gray-600 whitespace-nowrap">
              {tag}
            </span>
          ))
        ) : (
          <span className="px-3 py-1 dark:bg-white/5 bg-gray-100 border dark:border-white/10 border-gray-200 rounded-md text-xs dark:text-white/30 text-gray-400 italic whitespace-nowrap">
            No tags
          </span>
        )}
      </div>
    </div>
  );
};

export default ResumeCard;
