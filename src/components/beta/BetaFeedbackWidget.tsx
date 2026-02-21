import React, { useState } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BetaFeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast.error('Escreva seu feedback antes de enviar');
      return;
    }
    toast.success('Feedback enviado! Obrigado pela sua contribuição.');
    setFeedback('');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl p-4 w-80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Enviar Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFAD85] focus:border-transparent resize-none text-sm"
            rows={3}
            placeholder="Compartilhe sua experiência..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
          <button 
            onClick={handleSubmit}
            className="w-full mt-2 px-4 py-2 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-lg hover:opacity-90 transition-all text-sm"
          >
            Enviar Feedback
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-[#FFAD85] to-[#FF9B6A] text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
