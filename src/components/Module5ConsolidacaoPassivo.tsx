import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { calculateFinancialSummary, formatCurrency, formatPercent } from '../services/calculations';

interface Module5Props {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
}

const PALETTE_COLORS = [
  '#1C4E5E', // Deep Teal
  '#D97706', // Amber
  '#2563EB', // Blue
  '#16A34A', // Emerald Green
  '#DC2626', // Red
  '#9333EA', // Purple
  '#0891B2', // Cyan
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#059669', // Emerald
];

export const Module5ConsolidacaoPassivo: React.FC<Module5Props> = ({ income, expenses, contracts }) => {
  const [isEditing, setIsEditing] = useState(true);
  const summary = calculateFinancialSummary(income, expenses, contracts);

  // Consolidação / Agrupamento por Credor para eliminar poluição visual e sobreposição de 35 rótulos
  const creditorGroupedMap = summary.contractsCalculated.reduce((acc: { [key: string]: number }, c) => {
    const credorName = c.credor && c.credor.trim() !== '' ? c.credor.trim() : 'Outros Credores';
    acc[credorName] = (acc[credorName] || 0) + (c.saldoINPC || 0);
    return acc;
  }, {});

  const groupedCreditors = Object.entries(creditorGroupedMap)
    .map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100,
    }))
    .sort((a, b) => b.value - a.value);

  const getAlertBadge = (perc: number) => {
    if (perc > 70) {
      return {
        label: 'CRÍTICO / SUPERENDIVIDAMENTO GRAVE (>70%)',
        class: 'bg-red-600 text-white border-red-700 font-extrabold',
      };
    } else if (perc > 50) {
      return {
        label: 'SUPERENDIVIDAMENTO CONFIRMADO (>50%)',
        class: 'bg-amber-600 text-white border-amber-700 font-extrabold',
      };
    }
    return {
      label: 'SITUAÇÃO REGULAR',
      class: 'bg-emerald-600 text-white border-emerald-700 font-extrabold',
    };
  };

  const alertBadge = getAlertBadge(summary.percentualComprometimentoRLA);

  return (
    <div className="space-y-6 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">Módulo 16: Consolidação do Passivo & Capacidade de Pagamento</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Síntese Global das Dívidas e Limite Legal da RLA para o Plano de 60 Parcelas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl text-xs border shadow-2xs ${alertBadge.class}`}>
            {alertBadge.label}
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
            onClick={() => alert('Campos da Consolidação do Passivo limpos.')}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir permanentemente a consolidação do passivo?')) {
                alert('Dados excluídos.');
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={() => alert('Consolidação restaurada para os padrões.')}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Consolidação do Passivo e Gráficos salvos com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Table of Consolidated Passive */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-blue-50/80 border-b border-blue-200 text-slate-900 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider text-blue-900">Painel de Passivos Elegíveis à Repactuação</span>
          <span className="text-xs font-mono font-bold text-blue-700">Total INPC: {formatCurrency(summary.totalSaldoDevedorINPC)}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold uppercase text-[10px]">
                <th className="py-3 px-4">Credor</th>
                <th className="py-3 px-4">N.º Contrato</th>
                <th className="py-3 px-4 text-right">Saldo Devedor INPC (R$)</th>
                <th className="py-3 px-4 text-center">Peso no Passivo (%)</th>
                <th className="py-3 px-4 text-right">Parcela Atual (R$)</th>
                <th className="py-3 px-4 text-center">% de Comprometimento RLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {summary.contractsCalculated.map((c) => {
                const pesoPassivo = summary.totalSaldoDevedorINPC > 0 ? (c.saldoINPC / summary.totalSaldoDevedorINPC) * 100 : 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 font-normal text-slate-800">
                    <td className="py-3 px-4 font-normal text-slate-900">{c.credor}</td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-normal">{c.numeroContrato}</td>
                    <td className="py-3 px-4 text-right font-normal text-blue-900">{formatCurrency(c.saldoINPC)}</td>
                    <td className="py-3 px-4 text-center font-normal text-slate-800">{formatPercent(pesoPassivo)}</td>
                    <td className="py-3 px-4 text-right font-normal text-slate-900">{formatCurrency(c.valorParcelaAtual)}</td>
                    <td className="py-3 px-4 text-center font-normal text-red-700">{formatPercent(c.percentualRLA)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 font-black">TOTAL PASSIVO CONSOLIDADO</td>
                <td className="py-3 px-4 font-black">{summary.contractsCalculated.length} Contratos</td>
                <td className="py-3 px-4 text-right text-blue-900 font-black">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                <td className="py-3 px-4 text-center font-black">100.00%</td>
                <td className="py-3 px-4 text-right text-blue-900 font-black">{formatCurrency(summary.totalParcelasAtuais)}</td>
                <td className="py-3 px-4 text-center text-amber-400 font-extrabold">{formatPercent(summary.percentualComprometimentoRLA)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full font-sans">
        
        {/* Bar Chart: Agrupado por Credor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Distribuição dos Saldos Devedores por Credor (INPC)
            </h3>
            <span className="text-[11px] font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
              Total: {formatCurrency(summary.totalSaldoDevedorINPC)}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedCreditors} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(val) => val.length > 14 ? `${val.substring(0, 14)}...` : val}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Saldo INPC']}
                  contentStyle={{ backgroundColor: '#1C2B33', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" fill="#1C4E5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Agrupado por Credor com Legenda Limpa sem Sobreposição */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Proporção Percentual de Cada Credor no Passivo Total
            </h3>
            <span className="text-[11px] font-bold text-[#1C4E5E] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              {groupedCreditors.length} Credores Conciliados
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 items-center">
            {/* Gráfico Donut */}
            <div className="xl:col-span-3 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupedCreditors}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ percent }: any) => ((percent || 0) * 100) >= 4 ? `${((percent || 0) * 100).toFixed(2).replace('.', ',')}%` : ''}
                    labelLine={false}
                  >
                    {groupedCreditors.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE_COLORS[index % PALETTE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${formatCurrency(Number(val))} (${((Number(val) / (summary.totalSaldoDevedorINPC || 1)) * 100).toFixed(2).replace('.', ',')}%)`,
                      name
                    ]}
                    contentStyle={{ backgroundColor: '#1C2B33', color: '#fff', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#FCD34D' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legenda de Credores Estruturada sem sobreposição de rótulos */}
            <div className="xl:col-span-2 space-y-1.5 max-h-64 overflow-y-auto pr-1 text-xs divide-y divide-slate-100">
              {groupedCreditors.map((item, idx) => {
                const percent = summary.totalSaldoDevedorINPC > 0 ? (item.value / summary.totalSaldoDevedorINPC) * 100 : 0;
                return (
                  <div key={item.name} className="pt-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: PALETTE_COLORS[idx % PALETTE_COLORS.length] }}
                      />
                      <span className="font-bold text-slate-800 truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0 font-mono">
                      <span className="font-black text-slate-900 block text-[11px]">{formatCurrency(item.value)}</span>
                      <span className="text-[10px] font-bold text-slate-500">{percent.toFixed(2).replace('.', ',')}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
