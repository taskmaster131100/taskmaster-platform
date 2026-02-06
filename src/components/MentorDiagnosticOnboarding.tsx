import React, { useState } from 'react';
import { BrainCircuit, ArrowRight, CheckCircle2, Lightbulb } from 'lucide-react';
import {
  DIAGNOSTIC_QUESTIONS,
  calculateMaturityStage,
  getUserProfile,
  generateActionPlan,
  MaturityStage,
  UserProfile,
  ActionPlan
} from '../services/maturityDiagnosisService';
import { useNavigate } from 'react-router-dom';

interface MentorDiagnosticOnboardingProps {
  onComplete?: (stage: MaturityStage, profile: UserProfile) => void;
}

export default function MentorDiagnosticOnboarding({ onComplete }: MentorDiagnosticOnboardingProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, MaturityStage>>({});
  const [stage, setStage] = useState<MaturityStage | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const navigate = useNavigate();

  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / DIAGNOSTIC_QUESTIONS.length) * 100;

  const handleAnswer = (selectedStage: MaturityStage) => {
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: selectedStage
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Diagnóstico completo
      const calculatedStage = calculateMaturityStage(newAnswers);
      const userProfile = getUserProfile(calculatedStage);
      const plan = generateActionPlan(calculatedStage);

      setStage(calculatedStage);
      setProfile(userProfile);
      setActionPlan(plan);
    }
  };

  // Tela de Resultado
  if (stage && profile && actionPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
          {/* Header */}
          <div className="text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Marcos Menezes Analisou Seu Perfil!</h1>
            <p className="text-white/80">Aqui está seu diagnóstico e plano de ação</p>
          </div>

          {/* Resultado */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Profile Card */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 text-white p-3 rounded-lg">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.stageLabel}</h2>
                  <p className="text-gray-600 mt-1">{profile.description}</p>
                </div>
              </div>
            </div>

            {/* Características */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Suas Características
                </h3>
                <ul className="space-y-2">
                  {profile.characteristics.map((char, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span>{char}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                  Seus Desafios
                </h3>
                <ul className="space-y-2">
                  {profile.challenges.map((challenge, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-amber-600 font-bold mt-0.5">!</span>
                      <span>{challenge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-bold text-indigo-900 mb-2">Seu Primeiro Projeto</h3>
                <p className="text-sm text-indigo-800">{profile.firstProjectSuggestion}</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-purple-900 mb-2">Abordagem do Marcos Menezes</h3>
                <p className="text-sm text-purple-800">{profile.mentorApproach}</p>
              </div>
            </div>
          </div>

          {/* Plano de Ação */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{actionPlan.title}</h2>
              <p className="text-gray-600 mt-1">{actionPlan.description}</p>
            </div>

            <div className="p-6 space-y-4">
              {actionPlan.steps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm">
                      {step.order}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>⏱️ {step.estimatedTime}</span>
                      <span>📚 {step.resources.length} recursos</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Primeiro Projeto */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">🎯 Seu Primeiro Projeto</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{actionPlan.firstProject.name}</h3>
                <p className="text-gray-600 mt-2">{actionPlan.firstProject.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-xs text-blue-600 font-bold uppercase">Duração</div>
                  <div className="text-lg font-bold text-blue-900 mt-1">{actionPlan.firstProject.duration}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-xs text-green-600 font-bold uppercase">Resultado Esperado</div>
                  <div className="text-sm font-bold text-green-900 mt-1">{actionPlan.firstProject.expectedOutcome}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                onComplete?.(stage, profile);
                navigate('/dashboard');
              }}
              className="flex-1 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-50 transition-all border border-indigo-200"
            >
              Voltar ao Dashboard
            </button>
            <button
              onClick={() => navigate('/mentor-chat')}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Conversar com Marcos <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-white/80 text-sm">
            💡 Marcos Menezes está pronto para ajudar você a executar este plano!
          </p>
        </div>
      </div>
    );
  }

  // Tela de Perguntas
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Bem-vindo, Artista! 🎵</h1>
          <p className="text-white/80">Marcos Menezes aqui! Vou fazer algumas perguntas para entender seu perfil e ajudar você da melhor forma.</p>
        </div>

        {/* Progress */}
        <div className="bg-white/10 rounded-full h-2 overflow-hidden backdrop-blur-sm">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Pergunta */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
            <div className="text-sm text-indigo-600 font-bold uppercase mb-2">
              Pergunta {currentQuestionIndex + 1} de {DIAGNOSTIC_QUESTIONS.length}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{currentQuestion.question}</h2>
          </div>

          <div className="p-6 space-y-3">
            {currentQuestion.answers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(answer.stage)}
                className="w-full p-4 text-left border-2 border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-indigo-600 flex-shrink-0 mt-1 group-hover:bg-indigo-600" />
                  <div>
                    <p className="font-bold text-gray-900">{answer.text}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-white/80 text-sm">
          💬 Suas respostas ajudam Marcos Menezes a entender melhor como ajudá-lo
        </p>
      </div>
    </div>
  );
}
