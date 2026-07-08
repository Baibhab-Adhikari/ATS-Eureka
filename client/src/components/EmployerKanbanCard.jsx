import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { User, Activity, FileText } from 'lucide-react';

const EmployerKanbanCard = ({ candidate }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id || candidate._id,
    data: { candidate }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const score = candidate.ats_score || 0;
  const matchColor = score >= 75 ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                     score >= 50 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                                   'text-red-400 border-red-500/30 bg-red-500/10';

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
          <h4 className="text-white font-medium text-sm">{candidate.candidate_name}</h4>
          <div className="flex items-center gap-1.5 text-white/50 text-xs mt-1">
            <FileText className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{candidate.analysis_result?.["Job Title Match"] || "Candidate"}</span>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${matchColor} flex items-center gap-1`}>
          <Activity className="w-3 h-3" /> {score}%
        </div>
      </div>
      
      {candidate.analysis_result?.["Profile Summary"] && (
        <div className="mt-3 text-xs text-white/40 line-clamp-2 italic border-t border-white/5 pt-2">
          {candidate.analysis_result["Profile Summary"]}
        </div>
      )}
    </div>
  );
};

export default EmployerKanbanCard;
