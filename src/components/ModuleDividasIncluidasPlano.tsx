import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import type { Contract } from '../types';
import { formatCurrency } from '../services/calculations';

interface ModuleDividasProps {
  contracts: Contract[];
}

export const ModuleDividasIncluidasPlano: React.FC<ModuleDividasProps> = ({ contracts }) => {
  const [isEditing, setIsEditing] = useState(true);

  let totalSaldoRef = 0;

  const rows = contracts.map(c => {
    let saldoRefBase = c.saldoDevedorRefUltimaParcela !== undefined 
      ? c.saldoDevedorRefUltimaParcela 
      : (c.valorParcelaAtual * c.qtdParcelasRestantes);

    totalSaldoRef += saldoRefBase;

    return {
      ...c,
      saldoRefBase,
    };
  });

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <ListChecks className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 10: Dívidas Incluídas no Plano de Pagamento Compulsório (Tabela 6)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Relação consolidada das operações de crédito abarcadas na repactuação (Petição Inicial)
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
            onClick={() => alert('Tabela 6 (Dívidas Incluídas no Plano) salva com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>
      
      {/* Tabela 6: DÍVIDAS INCLUÍDAS NO PLANO DE PAGAMENTO COMPULSÓRIO */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        {/* Header Estilo Planilha */}
        <div className="bg-blue-50/80 p-4 border-b border-blue-200 flex items-center space-x-2">
          <ListChecks className="w-5 h-5 text-blue-600" />
          <h2 className="text-xs font-black uppercase tracking-wide text-blue-900">
            6. DÍVIDAS INCLUÍDAS NO PLANO DE PAGAMENTO COMPULSÓRIO - CONFORME PETIÇÃO INICIAL
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] text-center border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[8%]">Item</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[42%]">Credor / Instituição Financeira</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[25%]">N.º do Contrato / CCB</th>
                <th className="py-2.5 px-3 text-center align-middle w-[25%]">Saldo Devedor na Data Ref. (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {rows.map((row, idx) => (
                <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/70 transition-colors text-slate-800`}>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-700">{idx + 1}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{row.credor}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-700">{row.numeroContrato}</td>
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-900">{formatCurrency(row.saldoRefBase)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 text-slate-900 font-extrabold text-xs uppercase border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-2.5 px-3 border-r border-slate-200 text-center font-black">TOTAL DO PASSIVO REPACTUANDO NA PETIÇÃO INICIAL:</td>
                <td className="py-2.5 px-3 text-center font-black text-blue-900 text-sm font-mono">{formatCurrency(totalSaldoRef)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
