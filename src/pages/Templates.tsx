import React from 'react';
import { Library, FileText, Calendar, Music } from 'lucide-react';

export default function Templates() {
  const templates = [
    {
      name: 'Template D-30',
      description: 'Lançamento de single em 30 dias',
      icon: Calendar,
      color: 'from-[#FFAD85] to-[#FF9B6A]'
    },
    {
      name: 'Template D-45',
      description: 'Projeto de DVD em 45 dias',
      icon: Music,
      color: 'from-purple-500 to-[#FF9B6A]'
    },
    {
      name: 'Template D-90',
      description: 'Lançamento de álbum em 90 dias',
      icon: FileText,
      color: 'from-green-500 to-green-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Templates Profissionais</h2>
        <p className="text-gray-600 mt-1">Modelos baseados em 10+ anos de experiência</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template, index) => {
          const Icon = template.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-100 hover:shadow-md transition-all">
              <div className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Usar Template
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
