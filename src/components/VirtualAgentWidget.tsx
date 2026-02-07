import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Info, CheckCircle2, ArrowRight, X, Bell } from 'lucide-react';
import { getAgentNotifications, AgentNotification } from '../services/virtualAgentService';
import { useNavigate } from 'react-router-dom';

export default function VirtualAgentWidget() {
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotifications = async () => {
      const data = await getAgentNotifications();
      setNotifications(data);
      setLoading(false);
    };
    loadNotifications();
  }, []);

  const activeNotifications = notifications.filter(n => !dismissed.includes(n.id));

  if (loading || activeNotifications.length === 0) return null;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed([...dismissed, id]);
  };

  const getTypeStyles = (type: AgentNotification['type']) => {
    switch (type) {
      case 'critical': return 'bg-white border-red-200 text-gray-900 shadow-sm border-l-4 border-l-red-500';
      case 'warning': return 'bg-white border-amber-200 text-gray-900 shadow-sm border-l-4 border-l-amber-500';
      case 'success': return 'bg-white border-green-200 text-gray-900 shadow-sm border-l-4 border-l-green-500';
      case 'suggestion': return 'bg-white border-purple-200 text-gray-900 shadow-sm border-l-4 border-l-purple-500';
      default: return 'bg-white border-blue-200 text-gray-900 shadow-sm border-l-4 border-l-blue-500';
    }
  };

  const getIcon = (type: AgentNotification['type']) => {
    switch (type) {
      case 'critical': return <div className="bg-red-100 p-2 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>;
      case 'warning': return <div className="bg-amber-100 p-2 rounded-lg"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>;
      case 'success': return <div className="bg-green-100 p-2 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>;
      case 'suggestion': return <div className="bg-purple-100 p-2 rounded-lg"><Sparkles className="w-5 h-5 text-purple-600" /></div>;
      default: return <div className="bg-blue-100 p-2 rounded-lg"><Info className="w-5 h-5 text-blue-600" /></div>;
    }
  };

  return (
    <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 p-1.5 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Seu Copiloto TaskMaster</h3>
        </div>
        <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full">
          {activeNotifications.length} MENSAGENS
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeNotifications.slice(0, 4).map((notification) => (
          <div
            key={notification.id}
            onClick={() => notification.actionPath && navigate(notification.actionPath)}
            className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${getTypeStyles(notification.type)}`}
          >
            <button
              onClick={(e) => handleDismiss(notification.id, e)}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold mb-0.5">{notification.title}</h4>
                <p className="text-xs opacity-90 leading-relaxed mb-2">{notification.message}</p>
                
                {notification.actionLabel && (
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    {notification.actionLabel}
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {activeNotifications.length > 4 && (
        <button className="w-full py-2 text-xs font-bold text-gray-400 hover:text-purple-600 transition-colors">
          VER TODOS OS ALERTAS
        </button>
      )}
    </div>
  );
}
