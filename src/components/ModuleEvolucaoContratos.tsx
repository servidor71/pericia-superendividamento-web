import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { calculateFinancialSummary, calculateContractEvolution, formatCurrency, formatPercent, format7Decimals } from '../services/calculations';

interface ModuleEvolucaoProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
}

export const ModuleEvolucaoContratos: React.FC<ModuleEvolucaoProps> = ({ income, expenses, contracts }) => {
  const [taxaSelicAa, setTaxaSelicAa] = useState<number>(14.25);
  const [isEditing, setIsEditing] = useState(true);

  const summary = calculateFinancialSummary(income, expenses, contracts);
  const evolution = calculateContractEvolution(contracts, summary.capacidadeMensalPlano);

  // Totais Consolidados (helper para mapeamento consistente)
  const totais = {
    valorLiberado: evolution.reduce((acc, row) => acc + row.valorLiberado, 0),
    valorLiberadoCorrigido: evolution.reduce((acc, row) => acc + row.valorLiberadoCorrigido, 0),
    totalPrestacoesJaPagas: evolution.reduce((acc, row) => acc + row.totalPrestacoesJaPagas, 0),
    totalPagoJaPagasERepactuadas: evolution.reduce((acc, row) => acc + row.totalPagoJaPagasERepactuadas, 0),
    totalPagoAcimaDoValorLiberado: evolution.reduce((acc, row) => acc + row.totalPagoAcimaDoValorLiberado, 0),
    percentualAcimaDoValorContratado: evolution.length > 0 ? (evolution.reduce((acc, row) => acc + row.totalPagoAcimaDoValorLiberado, 0) / (evolution.reduce((acc, row) => acc + row.valorLiberado, 0) || 1)) * 100 : 0,
    tirAm: 0, // Placeholder
    tirAa: 0  // Placeholder
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 12: Análise da Evolução dos Contratos - Valores Contratados x Recebidos
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Comparativo entre Capital Efetivamente Liberado Corrigido x Total a ser Pago pós-Repactuação
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DCD8CD] text-xs">
            <span className="font-bold text-slate-700">Taxa Selic:</span>
            <input
              type="number"
              step="0.01"
              value={taxaSelicAa}
              onChange={(e) => setTaxaSelicAa(parseFloat(e.target.value) || 14.25)}
              className="w-14 px-1 py-0.5 bg-transparent font-black text-xs text-[#1C4E5E] text-center border-b border-[#DCD8CD]"
            />
            <span className="font-bold text-slate-500">% a.a.</span>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
              isEditing ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' : 'bg-white text-slate-700 border-[#DCD8CD]'
            }`}
          >
            <span>{isEditing ? 'Concluir Edição' : 'Editar'}</span>
          </button>

          <button
            onClick={() => setTaxaSelicAa(14.25)}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-[#DCD8CD] rounded-xl transition-all cursor-pointer"
          >
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => alert('Demonstrativo de Evolução dos Contratos salvo com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Main Evolution Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1200px] bg-transparent">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Qtda Prestações Já Pagas</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Qtda Prestações Pagar</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Valor Contratado</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center whitespace-nowrap min-w-[170px]">Fator INPC / IPCA</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Valor Liberado Corrigido</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Total Prestações Já Pagas</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Total Já Pagas + Repactuadas</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Total Pago Acima do Liberado</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">% Acima do Contratado</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">TIR % a.m</th>
                <th className="py-2.5 px-3 text-center">TIR % a.a</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-normal">
              {evolution.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors text-slate-800 font-normal">
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal">{row.qtdPagas}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-blue-900">{row.qtdPagar}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{formatCurrency(row.valorLiberado)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-800 whitespace-nowrap min-w-[170px]">
                    {format7Decimals(row.indice7Casas)} ({row.tipoIndice})
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{formatCurrency(row.valorLiberadoCorrigido)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-800">{formatCurrency(row.totalPrestacoesJaPagas)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-blue-900">{formatCurrency(row.totalPagoJaPagasERepactuadas)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-emerald-800">{formatCurrency(row.totalPagoAcimaDoValorLiberado)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{formatPercent(row.percentualAcimaContratado, 2)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-blue-900">{formatPercent(row.tirAmPercent, 2)}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-blue-950 font-bold">{formatPercent(row.tirAaPercent, 2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-extrabold text-xs uppercase border-t-2 border-slate-300">
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black" colSpan={2}>TOT. CONSOLIDADO</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">{formatCurrency(totais.valorLiberado)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">-</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">{formatCurrency(totais.valorLiberadoCorrigido)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">{formatCurrency(totais.totalPrestacoesJaPagas)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-blue-900">{formatCurrency(totais.totalPagoJaPagasERepactuadas)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-emerald-800">{formatCurrency(totais.totalPagoAcimaDoValorLiberado)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">{formatPercent(totais.percentualAcimaDoValorContratado, 2)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-black text-blue-900">-</td>
                <td className="py-2.5 px-3 text-center font-mono font-black text-blue-950">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
