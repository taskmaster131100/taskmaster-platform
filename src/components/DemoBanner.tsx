import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function DemoBanner() {
  const [visible, setVisible] = React.useState(true);
  const isDemoMode = localStorage.getItem('taskmaster_demo_mode') === 'true';

  if (!isDemoMode || !visible) return null;

  return (
    <div className="bg-amber-500 text-white py-2 px-4 flex items-center justify-between shadow-md relative z-50">
      <div className="flex items-center gap-2 flex-1 justify-center">
        <AlertCircle className="w-5 h-5" />
        <span className="text-sm font-medium">
          Você está em <strong>modo demonstração</strong>. Os dados não serão salvos permanentemente.
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="p-1 hover:bg-amber-600 rounded transition-colors"
        aria-label="Fechar banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
