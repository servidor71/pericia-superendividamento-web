import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { calculateFinancialSummary, generatePriceSchedule, formatCurrency } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModulePriceProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  taxaJurosAm?: number;
  onTaxaJurosChange?: (taxa: number) => void;
}

export const ModuleTabelaPrice: React.FC<ModulePriceProps> = ({ 
  income, 
  expenses, 
  contracts,
  taxaJurosAm: taxaJurosProp = 1.63,
  onTaxaJurosChange,
}) => {
  const summary = calculateFinancialSummary(income, expenses, contracts);
  const [isEditing, setIsEditing] = useState(true);

  // Parâmetros editáveis da Tabela Price - Inicializados com o Saldo Devedor Restante Atualizado
  const [taxaJurosAm, setTaxaJurosAmState] = useState<number>(taxaJurosProp);
  const [saldoInicialCustom, setSaldoInicialCustom] = useState<number>(
    Math.round((summary.totalSaldoDevedorINPC || 0) * 100) / 100
  );
  const [prazoMeses, setPrazoMeses] = useState<number>(60);
  const [notaTaxa, setNotaTaxa] = useState<string>('');

  useEffect(() => {
    setTaxaJurosAmState(taxaJurosProp);
  }, [taxaJurosProp]);

  const handleTaxaJurosChange = (val: number) => {
    setTaxaJurosAmState(val);
    if (onTaxaJurosChange) {
      onTaxaJurosChange(val);
    }
  };

  // Sincronização Automática com o Saldo Devedor Restante Atualizado (INPC/IPCA) dos Contratos
  useEffect(() => {
    setSaldoInicialCustom(Math.round((summary.totalSaldoDevedorINPC || 0) * 100) / 100);
  }, [summary.totalSaldoDevedorINPC]);

  // Geração Automática do Cronograma Tabela Price
  const { pmt, schedule } = generatePriceSchedule(saldoInicialCustom, taxaJurosAm, prazoMeses);

  // Totais do Cronograma
  const totalJuros = schedule.reduce((acc, row) => acc + row.juros, 0);
  const totalAmortizacao = schedule.reduce((acc, row) => acc + row.amortizacao, 0);
  const totalPago = schedule.reduce((acc, row) => acc + row.prestacao, 0);

  // Handlers para a Toolbar Unificada
  const handleAddExtraMonth = () => {
    setPrazoMeses(prev => prev + 12);
  };

  const handleClearPriceData = () => {
    if (confirm('Deseja zerar os valores de simulação da Tabela Price?')) {
      setSaldoInicialCustom(0);
      handleTaxaJurosChange(0);
      setPrazoMeses(60);
      setNotaTaxa('');
    }
  };

  const handleResetToCalculatedSaldo = () => {
    handleTaxaJurosChange(1.63);
    setSaldoInicialCustom(summary.totalSaldoDevedorINPC || 0);
    setPrazoMeses(60);
    setNotaTaxa('');
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 15: TABELA PRICE - AMORTIZAÇÃO DO PLANO ({prazoMeses} PARCELAS)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Cálculo exato da prestação de amortização do plano compulsório via Sistema Price
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAddExtraMonth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>+ 12 Meses</span>
          </button>

          <button
            onClick={handleResetToCalculatedSaldo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#1C4E5E] bg-white border border-[#DCD8CD] rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#1C4E5E]" />
            <span>Sincronizar Saldo</span>
          </button>

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
            onClick={handleClearPriceData}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir os dados da simulação Tabela Price?')) {
                handleClearPriceData();
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={handleResetToCalculatedSaldo}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Simulação Tabela Price salva com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Parâmetros Editáveis da Tabela Price - Compact Ultra Slim Banner */}
      <div className="bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs font-sans text-xs">
        <h3 className="text-[11px] font-black text-blue-700 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
          Parâmetros de Entrada da Tabela Price (Ajuste Automático)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          
          {/* Taxa de Juros */}
          <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-tight">Taxa de juros (a.m.)</label>
            <div className="flex items-center gap-1 my-0.5">
              <input
                type="number"
                step="0.01"
                disabled={!isEditing}
                value={taxaJurosAm}
                onChange={(e) => handleTaxaJurosChange(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-extrabold text-blue-900 text-xs bg-white disabled:bg-slate-100"
              />
              <span className="font-bold text-blue-900 text-[11px] shrink-0">% a.m</span>
            </div>
            <input
              type="text"
              disabled={!isEditing}
              value={notaTaxa}
              onChange={(e) => setNotaTaxa(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] text-slate-500 bg-white border border-slate-200 rounded italic disabled:bg-slate-100"
              placeholder="Nota de referência..."
            />
          </div>

          {/* Saldo Inicial */}
          <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-tight">Saldo Devedor Restante (R$)</label>
            <div className="my-0.5">
              <CurrencyInput
                value={saldoInicialCustom}
                onChange={(v) => setSaldoInicialCustom(v)}
                disabled={!isEditing}
                className="w-full text-xs font-extrabold text-slate-900 bg-white disabled:bg-slate-100 px-2 py-0.5 border border-slate-300 rounded"
              />
            </div>
            <span className="text-[9px] text-slate-500 font-medium block truncate">Total Saldo Restante (INPC/IPCA)</span>
          </div>

          {/* Prazo Meses */}
          <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 flex flex-col justify-between">
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-tight">Prazo do Plano (Meses)</label>
            <div className="flex items-center gap-1 my-0.5">
              <input
                type="number"
                disabled={!isEditing}
                value={prazoMeses}
                onChange={(e) => setPrazoMeses(parseInt(e.target.value) || 60)}
                className="w-full px-2 py-0.5 border border-slate-300 rounded font-extrabold text-slate-900 text-xs bg-white disabled:bg-slate-100"
              />
              <span className="font-bold text-slate-700 text-[11px] shrink-0">meses</span>
            </div>
            <span className="text-[9px] text-slate-500 font-medium block">Padrão Legal: 60 parcelas</span>
          </div>

          {/* Resultado PMT */}
          <div className="bg-blue-50/90 text-blue-900 px-2.5 py-1.5 rounded-lg border border-blue-200 flex flex-col justify-between shadow-2xs">
            <label className="block text-[10px] font-extrabold text-blue-800 uppercase tracking-tight">PRESTAÇÃO CALCULADA (PMT)</label>
            <div className="text-sm font-black text-blue-950 my-0.5">{formatCurrency(pmt)}</div>
            <span className="text-[9px] text-blue-700 font-semibold block">Total a pagar: {formatCurrency(totalPago)}</span>
          </div>

        </div>
      </div>

      {/* Cronograma Completo Tabela Price */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="p-4 bg-blue-50/80 border-b border-blue-200 text-slate-900 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-blue-800">
            Cronograma Mês a Mês da Tabela Price ({schedule.length} Meses)
          </span>
          <span className="text-xs text-blue-700 font-mono font-bold">
            PMT Fixa: {formatCurrency(pmt)} • Taxa: {taxaJurosAm}% a.m.
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead className="sticky top-0 z-10 bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300 shadow-2xs">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">n (Mês)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Saldo Devedor Inicial</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Juros Mês ({taxaJurosAm}%)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Amortização (R$)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center">Prestação PMT (R$)</th>
                <th className="py-2.5 px-3 text-center">Saldo Devedor Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {schedule.map((row) => (
                <tr key={row.parcela} className="hover:bg-slate-50 transition-colors font-normal text-slate-800">
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900 bg-slate-50">{row.parcela}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-slate-900">{formatCurrency(row.saldoInicial)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-red-700">{formatCurrency(row.juros)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-emerald-800">{formatCurrency(row.amortizacao)}</td>
                  <td className="py-2.5 px-3 border-r border-slate-200 text-center font-normal text-blue-900">{formatCurrency(row.prestacao)}</td>
                  <td className="py-2.5 px-3 text-center font-normal text-slate-900 font-mono">{formatCurrency(row.saldoFinal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-extrabold border-t-2 border-slate-300 uppercase font-mono text-[11px]">
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">TOTAL</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black">-</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-red-700">{formatCurrency(totalJuros)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-emerald-800">{formatCurrency(totalAmortizacao)}</td>
                <td className="py-2.5 px-3 border-r border-slate-200 text-center font-black text-blue-900">{formatCurrency(totalPago)}</td>
                <td className="py-2.5 px-3 text-center font-black">R$ 0,00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
