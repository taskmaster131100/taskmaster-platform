import React, { useState, useEffect } from 'react';
import { DollarSign, PieChart, TrendingUp, Users, ArrowRight, Save, Calculator } from 'lucide-react';
import { Show, updateShow } from '../services/showService';
import { toast } from 'sonner';

interface FinancialSplitProps {
  show: Show;
  onUpdate: () => void;
}

export default function FinancialSplit({ show, onUpdate }: FinancialSplitProps) {
  const [commissionRate, setCommissionRate] = useState(show.commission_rate || 20);
  const [artistSplit, setArtistSplit] = useState(show.artist_split || 80);
  const [isSaving, setIsSaving] = useState(false);

  const totalValue = show.value || 0;
  const commissionValue = (totalValue * commissionRate) / 100;
  const artistValue = (totalValue * artistSplit) / 100;
  const productionValue = totalValue - artistValue;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateShow(show.id, {
        commission_rate: commissionRate,
        artist_split: artistSplit,
        production_split: 100 - artistSplit
      });
      toast.success('Divisão financeira atualizada!');
      onUpdate();
    } catch (error) {
      console.error('Erro ao salvar split:', error);
      toast.error('Erro ao salvar divisão financeira');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Valor Bruto</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {show.currency} {totalValue.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Líquido Artista ({artistSplit}%)</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {show.currency} {artistValue.toLocaleString('pt-BR')}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <PieChart className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Comissão Produtora ({100 - artistSplit}%)</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {show.currency} {productionValue.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#FFAD85]" />
          Configurar Divisão (Split)
        </h3>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Porcentagem do Artista</label>
              <span className="text-sm font-bold text-[#FFAD85]">{artistSplit}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={artistSplit}
              onChange={(e) => setArtistSplit(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#FFAD85]"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">0%</span>
              <span className="text-[10px] text-gray-400">50%</span>
              <span className="text-[10px] text-gray-400">100%</span>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Resumo da Operação</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cache Total:</span>
                <span className="font-medium">{show.currency} {totalValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Repasse Artista:</span>
                <span className="font-medium text-green-600">+ {show.currency} {artistValue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Taxa Administrativa:</span>
                <span className="font-medium text-purple-600">+ {show.currency} {productionValue.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-[#FFAD85] text-white rounded-lg font-bold hover:bg-[#FF9B6A] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Configuração de Split
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex gap-3">
        <TrendingUp className="w-5 h-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          <strong>Dica Pro:</strong> Esta divisão será usada automaticamente na geração do contrato e nos relatórios de fechamento mensal do artista.
        </p>
      </div>
    </div>
  );
}
