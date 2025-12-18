import React from 'react';
import { Briefcase } from 'lucide-react';

interface ProjectDashboardProps {
  project?: any;
  tasks?: any[];
  departments?: any[];
  onTaskUpdate?: (task: any) => void;
  onAddTask?: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project }) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <Briefcase className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            {project?.name || 'Dashboard do Projeto'}
          </h2>
        </div>
        <p className="text-gray-600">Detalhes do projeto serão exibidos aqui</p>
      </div>
    </div>
  );
};

export default ProjectDashboard;
