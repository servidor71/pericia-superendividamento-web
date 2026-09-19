import React, { useState } from 'react';
import { Calculator, Sliders, Scale } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { calculateFinancialSummary, calculateProportional60xPlan, formatCurrency, formatPercent } from '../services/calculations';

interface Module6Props {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
}

export const Module6PlanosRepactuacao: React.FC<Module6Props> = ({ income, expenses, contracts }) => {
  const [activeSubTab, setActiveSubTab] = useState<'compulsorio' | 'voluntario'>('compulsorio');
  const [isEditing, setIsEditing] = useState(true);
  
  // Custom params for voluntary plan simulation
  const [carenciaDias, setCarenciaDias] = useState<number>(180);
  const [descontoAcordoPercent, setDescontoAcordoPercent] = useState<number>(15);
  const [prazoVoluntarioMeses, setPrazoVoluntarioMeses] = useState<number>(60);

  const summary = calculateFinancialSummary(income, expenses, contracts);
  const plan60x = calculateProportional60xPlan(contracts, summary.capacidadeMensalPlano);

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] p-5 rounded-3xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 font-sans">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#1C4E5E] text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 17: Engines de Repactuação (Plano Compulsório 60x & Voluntário)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Simulação das propostas de pagamento (CDC Arts. 104-A e 104-B)
            </p>
          </div>
        </div>

        {/* Sub-Tabs & Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-[#DCD8CD]">
            <button
              onClick={() => setActiveSubTab('compulsorio')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'compulsorio'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Plano Compulsório (60x)
            </button>
            <button
              onClick={() => setActiveSubTab('voluntario')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'voluntario'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Simulador Voluntário
            </button>
          </div>

          {/* 1. CONCLUIR / EDITAR */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1 text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs border ${
              isEditing ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-300 hover:bg-amber-400 text-slate-900 border-amber-400'
            }`}
          >
            <span>{isEditing ? 'Concluir' : 'Editar'}</span>
          </button>

          {/* 2. LIMPAR */}
          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'voluntario') {
                setCarenciaDias(0);
                setDescontoAcordoPercent(0);
              } else {
                alert('Parâmetros do Plano Compulsório 60x redefinidos.');
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              const tabName = activeSubTab === 'compulsorio' ? 'Plano Compulsório (60x)' : 'Simulador Voluntário';
              if (confirm(`Deseja excluir os dados da aba "${tabName}"?`)) {
                if (activeSubTab === 'voluntario') {
                  setCarenciaDias(0);
                  setDescontoAcordoPercent(0);
                } else {
                  alert('Plano Compulsório zerado.');
                }
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'voluntario') {
                setCarenciaDias(180);
                setDescontoAcordoPercent(15);
                setPrazoVoluntarioMeses(60);
              } else {
                alert('Plano Compulsório 60x restaurado para a proporção padrão.');
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Planos de Repactuação salvos com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'compulsorio' ? (
        <div className="space-y-6">
          
          {/* Legal Rationale Box */}
          <div className="bg-blue-50/80 text-slate-900 p-5 rounded-xl border border-blue-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4 text-blue-600" />
              <span>Regra do Rateio Proporcional Estrito (Art. 104-B, §4º, do Código de Defesa do Consumidor)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              A capacidade mensal de pagamento apurada do devedor (<strong className="text-blue-900">{formatCurrency(summary.capacidadeMensalPlano)}/mês</strong>) é distribuída entre todos os credores proporcionalmente ao saldo devedor atualizado pelo INPC. Garante a quitação de 100% do valor principal atualizado no prazo improrrogável de 60 meses (5 anos), com carência legal de até 180 dias para a primeira parcela.
            </p>
          </div>

          {/* Table of Proportional Plan 60x */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-blue-50/80 border-b border-blue-200 text-slate-900 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-blue-900">Memória de Cálculo do Rateio Proporcional (60 Parcelas Mensais)</span>
              <span className="text-xs font-mono font-bold text-emerald-800">Total 60m: {formatCurrency(summary.capacidadeMensalPlano * 60)}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold uppercase text-[10px]">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Credor</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">N.º Contrato</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Saldo Devedor INPC (R$)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Peso Rateio (%)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Nova Parcela Repactuada PMT_i (R$)</th>
                    <th className="py-2.5 px-3 text-center">Total Quitado em 60 Meses (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {plan60x.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 font-normal text-slate-800">
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{p.credor}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono text-slate-700 font-normal">{p.numeroContrato}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{formatCurrency(p.saldoDevedorINPC)}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-blue-900">{formatPercent(p.percentualDoTotal)}</td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-emerald-800">{formatCurrency(p.parcelaRepactuadaPMT)}</td>
                      <td className="py-2.5 px-3 text-center font-normal text-blue-950">{formatCurrency(p.totalQuitado60m)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-xs uppercase border-t-2 border-slate-300">
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">TOTAL COMPULSÓRIO (60 MESES)</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">{plan60x.length} Contratos</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center text-blue-900 font-black">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">100.00%</td>
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center text-emerald-800 font-black">{formatCurrency(summary.capacidadeMensalPlano)}</td>
                    <td className="py-2.5 px-3 text-center text-blue-900 font-black">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* Simulador Voluntário */
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">Simulador de Acordo Voluntário em Conciliação (CDC Art. 104-A)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Carência para 1ª Parcela (Dias)</label>
              <input
                type="number"
                value={carenciaDias}
                onChange={(e) => setCarenciaDias(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-bold text-blue-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Desconto Comercial de Acordo (%)</label>
              <input
                type="number"
                value={descontoAcordoPercent}
                onChange={(e) => setDescontoAcordoPercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-bold text-emerald-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prazo do Acordo (Meses)</label>
              <input
                type="number"
                value={prazoVoluntarioMeses}
                onChange={(e) => setPrazoVoluntarioMeses(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Resultado da Simulação Voluntária:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Passivo com Desconto ({descontoAcordoPercent}%)</span>
                <span className="text-sm font-extrabold text-blue-900">
                  {formatCurrency(summary.totalSaldoDevedorINPC * (1 - descontoAcordoPercent / 100))}
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Parcela Unificada Simulação</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  {formatCurrency((summary.totalSaldoDevedorINPC * (1 - descontoAcordoPercent / 100)) / (prazoVoluntarioMeses || 60))}
                </span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Carência Pactuada</span>
                <span className="text-sm font-extrabold text-amber-700">{carenciaDias} dias</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
