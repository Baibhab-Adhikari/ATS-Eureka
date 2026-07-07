import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Building, Calendar, Edit2, Trash2, ExternalLink, Activity } from 'lucide-react';

const ApplicationCard = ({ application, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: application._id || application.id,
    data: { application }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  // Formatting dates
  const appliedDate = new Date(application.application_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const interviewDate = application.interview_date ? new Date(application.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="bg-[#0b0c16]/50 hover:bg-[#0b0c16]/80 border border-white/10 rounded-2xl p-4 mb-3 cursor-grab active:cursor-grabbing transition-colors"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-white font-medium text-sm">{application.job_title}</h4>
          <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
            <Building className="w-3 h-3" />
            <span>{application.company}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEdit(application); }} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {application.ats_score && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#4a6fff]/20 text-[#4a6fff] px-2 py-0.5 rounded text-[10px] font-medium">
            <Activity className="w-3 h-3" /> ATS: {application.ats_score}
          </div>
        </div>
      )}
      
      <div className="mt-3 flex justify-between items-center text-xs text-white/40 border-t border-white/5 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{appliedDate}</span>
        </div>
        {application.job_link && (
          <a 
            href={application.job_link} 
            target="_blank" 
            rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="text-[#4a6fff] hover:underline flex items-center gap-1"
          >
            Link <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
};

export default ApplicationCard;
