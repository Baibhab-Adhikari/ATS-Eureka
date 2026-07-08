import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import EmployerKanbanCard from './EmployerKanbanCard';

const EmployerDroppableColumn = ({ id, title, candidates }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[280px] border rounded-2xl p-4 flex flex-col transition-colors shadow-sm ${isOver ? 'bg-white/10 border-[#4a6fff]' : 'bg-white/5 border-white/10'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">{title}</h3>
        <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded-full text-xs">
          {candidates.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        {candidates.map(candidate => (
          <EmployerKanbanCard key={candidate.id || candidate._id} candidate={candidate} />
        ))}
        {candidates.length === 0 && (
          <div className="h-full flex items-center justify-center text-white/20 text-sm border-2 border-dashed border-white/5 rounded-xl py-8">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerDroppableColumn;
