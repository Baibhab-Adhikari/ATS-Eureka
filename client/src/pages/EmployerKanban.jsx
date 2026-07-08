import React, { useState, useEffect } from 'react';
import { getEmployerJds, getCandidateRankings, updateEmployerCandidateStatus } from '../lib/api';
import { toast } from 'sonner';
import EmployerLayout from '../components/EmployerLayout';
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core';
import EmployerDroppableColumn from '../components/EmployerDroppableColumn';
import EmployerKanbanCard from '../components/EmployerKanbanCard';
import { ChevronDown } from 'lucide-react';

const EmployerKanban = () => {

  // Kanban state
  const [jds, setJds] = useState([]);
  const [selectedJd, setSelectedJd] = useState('');
  const [kanbanCandidates, setKanbanCandidates] = useState([]);
  const [activeDragCandidate, setActiveDragCandidate] = useState(null);
  const [loadingKanban, setLoadingKanban] = useState(false);

  const STATUS_COLUMNS = ["Analyzed", "Shortlisted", "Interviewing", "Offered", "Hired", "Rejected"];

  useEffect(() => {
    fetchJds();
  }, []);

  useEffect(() => {
    if (selectedJd) {
      fetchKanbanCandidates(selectedJd);
    } else {
      setKanbanCandidates([]);
    }
  }, [selectedJd]);

  const fetchJds = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = await getEmployerJds(token);
      setJds(data);
      if (data.length > 0) setSelectedJd(data[0].id || data[0]._id);
    } catch (error) {
      toast.error('Failed to fetch JDs');
    }
  };

  const fetchKanbanCandidates = async (jdId) => {
    try {
      setLoadingKanban(true);
      const token = localStorage.getItem('token');
      const data = await getCandidateRankings(jdId, token);
      setKanbanCandidates(data.candidates || []);
    } catch (error) {
      toast.error('Failed to load kanban candidates');
    } finally {
      setLoadingKanban(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const candidate = kanbanCandidates.find(c => (c.id || c._id) === active.id);
    setActiveDragCandidate(candidate);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragCandidate(null);
    if (!over) return;
    
    const candidateId = active.id;
    const newStatus = over.id;
    const candidate = kanbanCandidates.find(c => (c.id || c._id) === candidateId);
    
    if (candidate && candidate.status !== newStatus) {
      const originalStatus = candidate.status;
      
      // Optimistic update
      setKanbanCandidates(prev => 
        prev.map(c => (c.id || c._id) === candidateId ? { ...c, status: newStatus } : c)
      );

      try {
        const token = localStorage.getItem('token');
        await updateEmployerCandidateStatus(candidateId, newStatus, token);
        toast.success(`Candidate moved to ${newStatus}`);
      } catch (error) {
        toast.error('Failed to update status');
        // Revert
        setKanbanCandidates(prev => 
          prev.map(c => (c.id || c._id) === candidateId ? { ...c, status: originalStatus } : c)
        );
      }
    }
  };

  return (
    <EmployerLayout>
        <header className="h-24 px-8 flex items-center justify-between border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-semibold">Hiring Pipeline</h2>
        </header>

        <div className="p-10 max-w-[1600px] mx-auto w-full h-[calc(100vh-6rem)] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Pipeline Kanban Board</h3>
                <div className="relative min-w-[250px]">
                  <select 
                    value={selectedJd}
                    onChange={(e) => setSelectedJd(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 appearance-none focus:outline-none focus:border-[#4a6fff]/50 transition-colors cursor-pointer"
                  >
                    <option value="" disabled className="bg-[#0b0c16]">Select a Job Description</option>
                    {jds.map(jd => (
                      <option key={jd.id || jd._id} value={jd.id || jd._id} className="bg-[#0b0c16]">
                        {jd.title} {jd.department ? `(${jd.department})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-white/50 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              {!selectedJd ? (
                <div className="text-center py-12 text-white/50 border-2 border-dashed border-white/5 rounded-2xl">
                  Please select a Job Description to view its pipeline.
                </div>
              ) : loadingKanban ? (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-4 border-[#4a6fff] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex overflow-x-auto pb-4 gap-6 custom-scrollbar" style={{ minHeight: '400px' }}>
                  <DndContext 
                    collisionDetection={closestCorners} 
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                    {STATUS_COLUMNS.map(status => (
                      <EmployerDroppableColumn 
                        key={status} 
                        id={status} 
                        title={status} 
                        candidates={kanbanCandidates.filter(c => c.status === status)} 
                      />
                    ))}
                    
                    <DragOverlay>
                      {activeDragCandidate ? <EmployerKanbanCard candidate={activeDragCandidate} /> : null}
                    </DragOverlay>
                  </DndContext>
                </div>
              )}
        </div>
    </EmployerLayout>
  );
};

export default EmployerKanban;
