import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragOverlay, useDroppable } from '@dnd-kit/core';
import { Plus, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';
import ApplicationCard from '../components/ApplicationCard';
import ApplicationModal from '../components/ApplicationModal';
import { getApplications, createApplication, updateApplication, deleteApplication } from '../lib/api';

const STATUS_COLUMNS = ["Wishlist", "Applied", "Interview Scheduled", "Offered", "Rejected"];

const DroppableColumn = ({ id, title, applications, onEdit, onDelete }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`flex-1 min-w-[280px] border rounded-2xl p-4 flex flex-col transition-colors shadow-sm ${isOver ? 'dark:bg-white/10 bg-blue-50/50 border-[#4a6fff]' : 'dark:bg-white/5 bg-white border-gray-200 dark:border-white/10'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="dark:text-white text-gray-900 font-medium">{title}</h3>
        <span className="dark:bg-white/10 bg-gray-100 dark:text-white/70 text-gray-600 px-2 py-0.5 rounded-full text-xs">
          {applications.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-[150px]">
        {applications.map(app => (
          <ApplicationCard 
            key={app._id || app.id} 
            application={app} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
        {applications.length === 0 && (
          <div className="h-full flex items-center justify-center dark:text-white/20 text-gray-400 text-sm border-2 border-dashed dark:border-white/5 border-gray-200 rounded-xl py-8">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [activeDragApp, setActiveDragApp] = useState(null);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const data = await getApplications(token);
      setApplications(data);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleAddClick = () => {
    setEditingApp(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (app) => {
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleDelete = async (app) => {
    if (window.confirm(`Are you sure you want to delete the application for ${app.company}?`)) {
      try {
        const token = localStorage.getItem('token');
        await deleteApplication(app._id || app.id, token);
        toast.success('Application deleted');
        fetchApps();
      } catch (error) {
        toast.error(error.message);
      }
    }
  };

  const handleModalSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      if (editingApp) {
        await updateApplication(editingApp._id || editingApp.id, data, token);
        toast.success('Application updated');
      } else {
        await createApplication(data, token);
        toast.success('Application created');
      }
      setIsModalOpen(false);
      fetchApps();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const app = applications.find(a => (a._id || a.id) === active.id);
    setActiveDragApp(app);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragApp(null);

    if (!over) return;

    const appId = active.id;
    const newStatus = over.id;

    const app = applications.find(a => (a._id || a.id) === appId);
    if (app && app.status !== newStatus) {
      // Optimistic update
      const originalApps = [...applications];
      setApplications(applications.map(a => 
        (a._id || a.id) === appId ? { ...a, status: newStatus } : a
      ));

      try {
        const token = localStorage.getItem('token');
        await updateApplication(appId, { status: newStatus }, token);
        toast.success('Status updated');
      } catch (error) {
        setApplications(originalApps); // Revert on failure
        toast.error('Failed to update status');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 flex flex-col h-full dark:bg-[#030412] bg-gray-50">
        <header className="h-24 px-8 flex items-center justify-between border-b dark:border-white/5 border-gray-200 dark:bg-white/5 bg-white backdrop-blur-md sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-semibold dark:text-white text-gray-900 flex items-center gap-3">
              <Briefcase className="w-7 h-7 text-[#4a6fff]" />
              Application Tracker
            </h1>
            <p className="dark:text-white/50 text-gray-500 text-sm mt-1">Manage and track your job applications via Kanban board</p>
          </div>
          
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-6 py-3 bg-[#4a6fff] hover:bg-[#3b5bdf] rounded-full text-white font-medium transition-colors shadow-[0_0_20px_rgba(74,111,255,0.3)]"
          >
            <Plus className="w-5 h-5" />
            Log Application
          </button>
        </header>

        <div className="flex-1 p-8 overflow-x-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center text-white/50">
              Loading applications...
            </div>
          ) : (
            <DndContext 
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-6 h-full items-start">
                {STATUS_COLUMNS.map(status => {
                  const columnApps = applications.filter(a => a.status === status);
                  return (
                    <DroppableColumn 
                      key={status} 
                      id={status} 
                      title={status} 
                      applications={columnApps} 
                      onEdit={handleEditClick} 
                      onDelete={handleDelete} 
                    />
                  );
                })}
              </div>
              <DragOverlay>
                {activeDragApp ? (
                  <ApplicationCard 
                    application={activeDragApp} 
                    onEdit={() => {}} 
                    onDelete={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      <ApplicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleModalSubmit}
        initialData={editingApp}
      />
    </DashboardLayout>
  );
};

export default ApplicationTracker;
