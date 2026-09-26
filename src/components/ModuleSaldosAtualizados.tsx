import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { Contract } from '../types';
import { initialContracts } from '../mockData';
import { formatCurrency, getSaldoDevedorModulo6 } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModuleSaldosProps {
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleSaldosAtualizados: React.FC<ModuleSaldosProps> = ({ contracts, onContractsChange }) => {
  const [isEditing, setIsEditing] = useState(true);

  const handleUpdateContract = (id: string, field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleResetSaldos = () => {
    if (confirm('Deseja restaurar os saldos devedores para os valores padrão da perícia?')) {
      onContractsChange(initialContracts);
    }
  };

  // Calculations for Table C
  let totalSaldoRef = 0;
  let totalSaldoAtualizado = 0;

  const rows = contracts.map(c => {
    let saldoRefBase = getSaldoDevedorModulo6(c);

    let fator7Casas = c.fatorCorrecao7Casas || 1.0;
    let saldoAtualizado = saldoRefBase * fator7Casas;

    totalSaldoRef += saldoRefBase;
    totalSaldoAtualizado += saldoAtualizado;

    return {
      ...c,
      saldoRefBase,
      fator7Casas,
      saldoAtualizado,
    };
  });

  return (
    <div className="space-y-6 pb-24 w-full">

      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] p-5 rounded-3xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 font-sans">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#1C4E5E] text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 9: Demonstrativo dos Saldos Devedores Atualizados (Tabela C)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Evolução dos Saldos Devedores com Correção Monetária (INPC / IPCA 7 Casas)
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
            onClick={handleResetSaldos}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-[#DCD8CD] rounded-xl transition-all cursor-pointer"
          >
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => alert('Saldos Devedores Atualizados salvos com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>
      
      {/* Header Estilo Planilha */}
      <div className="bg-blue-50/80 text-slate-900 p-4 rounded-xl border border-blue-200 shadow-xs space-y-1">
        <div className="flex items-center space-x-2 text-blue-900 font-black text-sm uppercase">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2>C. SALDOS DEVEDORES ATUALIZADOS PELO INPC/IBGE DE JUNHO/2026 - ÚLTIMO ÍNDICE DISPONÍVEL</h2>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          Atualização monetária simples dos saldos devedores remanescentes a partir da data de referência após a última parcela paga
        </p>
      </div>

      {/* Tabela C de Detalhamento por Contrato */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="bg-blue-50/80 text-slate-900 px-4 py-2.5 font-black text-xs uppercase tracking-wide border-b border-blue-200">
          DETALHAMENTO POR CONTRATO
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                <th className="py-3 px-4">Credor</th>
                <th className="py-3 px-4">Contrato</th>
                <th className="py-3 px-4 text-center">Data Ref. (dd/mm/aaaa)</th>
                <th className="py-3 px-4 text-right">Saldo Devedor Ref. - após última parcela paga (R$)</th>
                <th className="py-3 px-4 text-center">Fator INPC / IPCA (7 Casas)</th>
                <th className="py-3 px-4 text-right">Saldo Devedor Atualizado (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {rows.map((row) => {
                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors font-normal text-slate-800">
                    
                    {/* Credor */}
                    <td className="py-2.5 px-4 font-normal text-slate-900">{row.credor}</td>
                    
                    {/* Contrato */}
                    <td className="py-2.5 px-4 font-mono font-normal text-slate-700">{row.numeroContrato}</td>
                    
                    {/* Data Ref */}
                    <td className="py-2.5 px-4 text-center font-mono font-normal text-slate-700">
                      <input
                        type="date"
                        value={row.dataReferenciaUltimoPagamento}
                        onChange={(e) => handleUpdateContract(row.id, 'dataReferenciaUltimoPagamento', e.target.value)}
                        className="px-2 py-1 border border-slate-300 rounded font-mono font-normal text-slate-900 text-xs bg-white"
                      />
                    </td>
                    
                    {/* Saldo Devedor Ref */}
                    <td className="py-2.5 px-4 text-right font-normal text-slate-900 text-xs">
                      <CurrencyInput
                        value={row.saldoRefBase}
                        onChange={(v) => handleUpdateContract(row.id, 'saldoDevedorRefUltimaParcela', v)}
                        className="w-36 text-right font-normal text-slate-900 text-xs"
                      />
                    </td>
                    
                    {/* Fator 7 Casas */}
                    <td className="py-2.5 px-4 text-center font-mono font-normal text-slate-800">
                      <input
                        type="number"
                        step="0.0000001"
                        value={row.fator7Casas}
                        onChange={(e) => handleUpdateContract(row.id, 'fatorCorrecao7Casas', parseFloat(e.target.value) || 1.0)}
                        className="w-32 px-2 py-1 border border-slate-300 rounded text-center font-mono font-normal text-slate-900 text-xs bg-white"
                      />
                    </td>
                    
                    {/* Saldo Devedor Atualizado em R$ */}
                    <td className="py-2.5 px-4 text-right font-normal text-slate-900 text-xs">
                      {formatCurrency(row.saldoAtualizado)}
                    </td>

                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black text-xs uppercase border-t-2 border-slate-300">
                <td className="py-3 px-4 font-black" colSpan={3}>TOTAL GERAL</td>
                <td className="py-3 px-4 text-right text-slate-900 font-black text-sm">{formatCurrency(totalSaldoRef)}</td>
                <td className="py-3 px-4 text-center font-black">—</td>
                <td className="py-3 px-4 text-right text-blue-900 font-black text-base">{formatCurrency(totalSaldoAtualizado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
