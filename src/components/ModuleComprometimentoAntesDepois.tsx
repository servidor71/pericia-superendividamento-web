import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { calculateFinancialSummary, calculateProportional60xPlan, formatCurrency, formatPercent } from '../services/calculations';

interface ModuleComprometimentoProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
}

export const ModuleComprometimentoAntesDepois: React.FC<ModuleComprometimentoProps> = ({ income, expenses, contracts }) => {
  const [isEditing, setIsEditing] = useState(true);

  const summary = calculateFinancialSummary(income, expenses, contracts);
  const plan60x = calculateProportional60xPlan(contracts, summary.capacidadeMensalPlano);

  const rla = summary.rla;
  const totalEncargoAntes = summary.totalParcelasAtuais;
  const percentualAntes = rla > 0 ? (totalEncargoAntes / rla) * 100 : 0;

  const totalEncargoApos = summary.capacidadeMensalPlano;
  const percentualApos = rla > 0 ? (totalEncargoApos / rla) * 100 : 0;
  const percentualRendaPreservada = Math.max(0, 100 - percentualApos);

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 4: Comprometimento da Renda Mensal (Antes x Após o Plano Compulsório)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Análise comparativa do comprometimento da RLA antes e após a repactuação
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
              isEditing ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' : 'bg-white text-slate-700 border-[#DCD8CD]'
            }`}
          >
            <span>{isEditing ? 'Concluir Edição' : 'Editar'}</span>
          </button>

          <button
            onClick={() => alert('Análise de Comprometimento da Renda salva com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Grid containing both Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Table ANTES DO PLANO COMPULSÓRIO */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header High Contrast & High Definition */}
            <div className="bg-slate-100 text-slate-900 px-4 py-3 border-b border-slate-300 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-normal">
                COMPROMETIMENTO DA RENDA MENSAL ANTES DO PLANO COMPULSÓRIO
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">CREDOR</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">N.º CONTRATO</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">TIPO DE CRÉDITO</th>
                    <th className="py-2.5 px-3 text-center uppercase">ENCARGO MENSAL CONTRATO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {contracts.map((c, idx) => (
                    <tr key={c.id || idx} className="hover:bg-slate-50 font-normal text-slate-800">
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-normal">{c.credor}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-slate-700 font-normal">{c.numeroContrato}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-700 font-normal">{c.modalidade}</td>
                      <td className="py-2.5 px-3 text-center font-normal text-slate-900">{formatCurrency(c.valorParcelaAtual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Box ANTES */}
          <div className="bg-slate-50 border-t border-slate-200 p-3.5 space-y-2 text-xs font-bold text-slate-900">
            <div className="flex justify-between items-center bg-slate-100 p-2 rounded">
              <span className="uppercase text-[11px] font-extrabold text-slate-800">TOTAL DO ENCARGO MENSAL ANTES DO PLANO</span>
              <span className="text-sm font-extrabold text-slate-900">{formatCurrency(totalEncargoAntes)}</span>
            </div>

            <div className="flex justify-between items-center p-1.5 font-bold">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">RECEITA LÍQUIDA AJUSTADA ANTES DO PLANO (RLA)</span>
              <span className="font-bold">{formatCurrency(rla)}</span>
            </div>

            <div className="flex justify-between items-center bg-red-50 border border-red-200 text-red-900 p-2 rounded">
              <span className="uppercase text-[11px] font-extrabold">% COMPROMETIDO DA RENDA LÍQUIDA MENSAL</span>
              <span className="text-base font-extrabold text-red-700">{formatPercent(percentualAntes)}</span>
            </div>
          </div>
        </div>

        {/* Table APÓS O PLANO COMPULSÓRIO */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header High Contrast & High Definition */}
            <div className="bg-slate-100 text-slate-900 px-4 py-3 border-b border-slate-300 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-normal">
                COMPROMETIMENTO DA RENDA MENSAL APÓS O PLANO COMPULSÓRIO
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">CREDOR</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">N.º CONTRATO</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center uppercase">TIPO DE CRÉDITO</th>
                    <th className="py-2.5 px-3 text-center uppercase">ENCARGO MENSAL REPACTUADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {contracts.map((c, idx) => {
                    const pmtRepactuado = plan60x[idx]?.parcelaRepactuadaPMT || 0;
                    return (
                      <tr key={c.id || idx} className="hover:bg-slate-50 font-normal text-slate-800">
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-normal">{c.credor}</td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-slate-700 font-normal">{c.numeroContrato}</td>
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 text-slate-700 font-normal">{c.modalidade}</td>
                        <td className="py-2.5 px-3 text-center font-normal text-emerald-900">{formatCurrency(pmtRepactuado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Box APÓS */}
          <div className="bg-slate-50 border-t border-slate-200 p-3.5 space-y-2 text-xs font-bold text-slate-900">
            <div className="flex justify-between items-center bg-emerald-100/70 p-2 rounded">
              <span className="uppercase text-[11px] text-emerald-950 font-extrabold">TOTAL DO ENCARGO MENSAL APÓS O PLANO</span>
              <span className="text-sm font-extrabold text-emerald-900">{formatCurrency(totalEncargoApos)}</span>
            </div>

            <div className="flex justify-between items-center p-1.5 font-bold">
              <span className="text-[11px] font-extrabold uppercase text-slate-700">RECEITA LÍQUIDA AJUSTADA APÓS O PLANO (RLA)</span>
              <span className="font-bold">{formatCurrency(rla)}</span>
            </div>

            <div className="flex justify-between items-center bg-blue-50 border border-blue-200 text-blue-900 p-2 rounded">
              <span className="uppercase text-[11px] font-extrabold">% COMPROMETIDO DA RENDA LÍQUIDA MENSAL</span>
              <span className="text-base font-extrabold text-blue-900">{formatPercent(percentualApos)}</span>
            </div>

            <div className="flex justify-between items-center bg-emerald-50 border border-emerald-300 text-emerald-900 p-2 rounded">
              <span className="uppercase text-[11px] font-extrabold">% DA RENDA PRESERVADA APÓS O PLANO COMPULSÓRIO</span>
              <span className="text-base font-extrabold text-emerald-700">{formatPercent(percentualRendaPreservada)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
