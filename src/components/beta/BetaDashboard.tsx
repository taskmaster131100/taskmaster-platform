import React from 'react';
import { TrendingUp, Users, CheckCircle } from 'lucide-react';

export default function BetaDashboard() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard Beta</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <TrendingUp className="w-8 h-8 text-[#FFAD85] mb-3" />
          <div className="text-3xl font-bold mb-1">95%</div>
          <div className="text-sm text-gray-600">Funcionalidades Completas</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <Users className="w-8 h-8 text-purple-600 mb-3" />
          <div className="text-3xl font-bold mb-1">26</div>
          <div className="text-sm text-gray-600">Tabelas Database</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-3xl font-bold mb-1">12</div>
          <div className="text-sm text-gray-600">Módulos Enterprise</div>
        </div>
      </div>
    </div>
  );
}
