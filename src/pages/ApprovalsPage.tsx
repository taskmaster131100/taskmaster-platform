import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function ApprovalsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Aprovações</h2>
        <p className="text-gray-600 mt-1">Gerencie aprovações de projetos e tarefas</p>
      </div>
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nenhuma aprovação pendente</p>
      </div>
    </div>
  );
}
