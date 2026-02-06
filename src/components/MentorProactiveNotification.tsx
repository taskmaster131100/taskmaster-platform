import React, { useState, useEffect } from 'react';
import { X, BrainCircuit, AlertCircle, Lightbulb, Zap, Heart } from 'lucide-react';
import { MentorProactiveMessage, generateProactiveMessages } from '../services/mentorLiveService';
import { useNavigate } from 'react-router-dom';

interface MentorProactiveNotificationProps {
  userId: string;
  position?: 'top' | 'bottom';
  onDismiss?: () => void;
}

export default function MentorProactiveNotification({
  userId,
  position = 'bottom',
  onDismiss
}: MentorProactiveNotificationProps) {
  const [notification, setNotification] = useState<MentorProactiveMessage | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadNotification = async () => {
      const messages = await generateProactiveMessages(userId);
      if (messages.length > 0) {
        // Priorizar mensagens por urgência
        const sorted = messages.sort((a, b) => {
          const urgencyOrder = { high: 0, medium: 1, low: 2 };
          return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        });
        setNotification(sorted[0]);
      }
      setLoading(false);
    };

    loadNotification();
  }, [userId]);

  if (loading || !notification || dismissed) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'inactivity_check':
        return <BrainCircuit className="w-5 h-5 text-indigo-600" />;
      case 'milestone':
        return <Heart className="w-5 h-5 text-red-600" />;
      case 'opportunity':
        return <Zap className="w-5 h-5 text-amber-600" />;
      case 'reminder':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'celebration':
        return <Heart className="w-5 h-5 text-pink-600" />;
      default:
        return <Lightbulb className="w-5 h-5 text-indigo-600" />;
    }
  };

  const getBackgroundColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200';
      case 'medium':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
      case 'low':
        return 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getTextColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-red-900';
      case 'medium':
        return 'text-amber-900';
      case 'low':
        return 'text-indigo-900';
      default:
        return 'text-gray-900';
    }
  };

  const handleAction = () => {
    if (notification.actionPath) {
      navigate(notification.actionPath);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const positionClasses = position === 'top' 
    ? 'top-4 left-4 right-4 md:left-auto md:right-4 md:w-96'
    : 'bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96';

  return (
    <div
      className={`fixed ${positionClasses} z-50 animate-in slide-in-from-bottom-4 duration-300`}
    >
      <div className={`rounded-xl border shadow-lg overflow-hidden ${getBackgroundColor(notification.urgency)}`}>
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-1">{getIcon(notification.type)}</div>
            <div className="flex-1">
              <h3 className={`font-bold text-sm ${getTextColor(notification.urgency)}`}>
                {notification.title}
              </h3>
              <p className={`text-xs mt-1 opacity-90 ${getTextColor(notification.urgency)}`}>
                {notification.message}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className={`p-1 rounded-lg hover:bg-black/5 transition-colors flex-shrink-0 ${getTextColor(notification.urgency)}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        {notification.actionLabel && (
          <div className="px-4 pb-4 flex gap-2">
            <button
              onClick={handleAction}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                notification.urgency === 'high'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : notification.urgency === 'medium'
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {notification.actionLabel}
            </button>
            <button
              onClick={handleDismiss}
              className="py-2 px-3 rounded-lg font-bold text-xs border border-current opacity-50 hover:opacity-100 transition-opacity"
            >
              Depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
