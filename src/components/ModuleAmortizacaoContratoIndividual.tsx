import React, { useState } from 'react';
import { Search, Calculator } from 'lucide-react';
import type { Contract } from '../types';
import { initialContracts } from '../mockData';
import { formatCurrency, formatPercent } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModuleAmortizacaoProps {
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleAmortizacaoContratoIndividual: React.FC<ModuleAmortizacaoProps> = ({
  contracts,
  onContractsChange,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const [isEditing, setIsEditing] = useState(true);

  // Contrato ativo selecionado
  const activeContract = contracts.find(c => c.id === selectedContractId) || contracts[0];

  if (!activeContract) {
    return (
      <div className="p-8 text-center text-slate-600 bg-white rounded-lg border">
        Nenhum contrato cadastrado para exibição do sistema de amortização.
      </div>
    );
  }

  // Helper para atualizar campos do contrato ativo
  const handleUpdateActiveField = (field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === activeContract.id ? { ...c, [field]: val } : c))
    );
  };

  // 1. Valores Básicos do Contrato
  const valorPrincipal = activeContract.valorLiberadoContrato || 0;
  const taxaJurosAm = activeContract.taxaJurosMes || 0;
  const prazoMeses = activeContract.qtdParcelasTotal || 0;
  const prestacaoAtual = activeContract.valorParcelaAtual || 0;
  const parcelasPagas = activeContract.qtdParcelasPagas || 0;
  const taxaBacenAm = activeContract.taxaMediaBacenMes || 0;
  const dataContrato = activeContract.dataContrato || '';
  const fatorCorrecao = activeContract.fatorCorrecao7Casas || 1.0; // Fator INPC/IPCA

  // 2. PMT pela Taxa Média BACEN
  // PMT_bacen = VP * [ i*(1+i)^n ] / [ (1+i)^n - 1 ]
  const iBacen = taxaBacenAm / 100;
  const pmtBacen = iBacen > 0 
    ? (valorPrincipal * (iBacen * Math.pow(1 + iBacen, prazoMeses))) / (Math.pow(1 + iBacen, prazoMeses) - 1)
    : (valorPrincipal / prazoMeses);

  // Total das Prestações Pagas até a Data de Ref.
  const prestPagasTotal = prestacaoAtual * parcelasPagas;

  // 3. Cronograma Completo de Amortização Mês a Mês (Sistema Price/Tabela de Evolução)
  let currentSD = valorPrincipal;
  const iContrato = taxaJurosAm / 100;
  const scheduleRows = [];

  // Data inicial de referência
  const baseDateParts = dataContrato.split('-');
  const startYear = parseInt(baseDateParts[0]) || 2021;
  const startMonth = (parseInt(baseDateParts[1]) || 6) - 1; // 0-indexed
  const startDay = parseInt(baseDateParts[2]) || 18;

  // Linha 0 (Data da Assinatura / Saldo Inicial)
  scheduleRows.push({
    num: 0,
    dataStr: formatDate(startYear, startMonth, startDay),
    sd: valorPrincipal,
    juros: 0,
    amort: 0,
    prestacao: 0,
    isPaid: true,
  });

  for (let n = 1; n <= prazoMeses; n++) {
    const jurosMes = currentSD * iContrato;
    const amortMes = prestacaoAtual - jurosMes;
    const nextSD = Math.max(0, currentSD - amortMes);

    const currentDateStr = formatDate(startYear, startMonth + n, startDay);
    const isPaid = n <= parcelasPagas;

    scheduleRows.push({
      num: n,
      dataStr: currentDateStr,
      sd: currentSD,
      juros: jurosMes,
      amort: amortMes,
      prestacao: prestacaoAtual,
      isPaid,
    });

    currentSD = nextSD;
  }

  // Saldo Devedor apurado na parcela N (pagas)
  const saldoDevedorNaParcelaPaga = scheduleRows[parcelasPagas]?.sd || (valorPrincipal - (prestacaoAtual * parcelasPagas * 0.4));
  const saldoDevedorAtualizado = saldoDevedorNaParcelaPaga * fatorCorrecao;

  // Formatador de Datas BR (DD/MM/AAAA)
  function formatDate(y: number, m: number, d: number) {
    const dateObj = new Date(y, m, d);
    const dayStr = String(dateObj.getDate()).padStart(2, '0');
    const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yearStr = dateObj.getFullYear();
    return `${dayStr}/${monthStr}/${yearStr}`;
  }

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 7: Sistema de Amortização Individual dos Contratos
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Evolução Mês a Mês do Saldo Devedor, Juros, Amortização e Benchmark BACEN por Contrato
            </p>
          </div>
        </div>

        {/* Contract Selector & Action Buttons on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DCD8CD]">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-bold text-slate-700">Contrato:</span>
            <select
              value={activeContract.id}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="text-xs font-black bg-white text-[#1C4E5E] rounded-lg px-2 py-0.5 focus:outline-hidden cursor-pointer"
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.credor} - {c.numeroContrato} ({c.modalidade})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
              isEditing ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' : 'bg-white text-slate-700 border-[#DCD8CD]'
            }`}
          >
            <span>{isEditing ? 'Concluir' : 'Editar'}</span>
          </button>

          <button
            onClick={() => onContractsChange(initialContracts)}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-[#DCD8CD] rounded-xl transition-all cursor-pointer"
          >
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => alert(`Amortização do Contrato ${activeContract.numeroContrato} salva com sucesso!`)}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Ficha do Contrato no Padrão Exato da Imagem Anexa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* CARD 1: QUADRO DE PARÂMETROS DO CONTRATO */}
        <div className="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs font-sans text-xs text-slate-900 space-y-3">
          
          {/* Header Bar: ID | Ref | Data Ref */}
          <div className="bg-blue-50 text-blue-900 px-3.5 py-2 rounded-xl font-mono font-bold text-xs flex justify-between items-center border border-blue-200">
            <span className="font-black text-blue-800">{activeContract.id.toUpperCase()}</span>
            <span className="text-blue-700 font-extrabold">7</span>
            <span className="font-mono text-slate-900">{activeContract.numeroContrato}</span>
            <span className="text-slate-700">02/07/2025</span>
          </div>

          {/* Form Grid Estilo Ficha */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-2">
            
            {/* Credor */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Credor:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={activeContract.credor}
                  onChange={(e) => handleUpdateActiveField('credor', e.target.value)}
                  className="w-48 text-right px-2 py-0.5 border border-slate-300 rounded font-bold text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-bold text-slate-900">{activeContract.credor}</span>
              )}
            </div>

            {/* Tipo de Crédito */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Tipo de Crédito:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={activeContract.modalidade}
                  onChange={(e) => handleUpdateActiveField('modalidade', e.target.value)}
                  className="w-48 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal text-slate-800">{activeContract.modalidade}</span>
              )}
            </div>

            {/* Valor Principal */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Valor Principal:</span>
              {isEditing ? (
                <CurrencyInput
                  value={valorPrincipal}
                  onChange={(val) => handleUpdateActiveField('valorLiberadoContrato', val)}
                  className="w-36 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{formatCurrency(valorPrincipal)}</span>
              )}
            </div>

            {/* Taxa de Juros */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Taxa de Juros:</span>
              {isEditing ? (
                <div className="flex items-center gap-1 justify-end">
                  <input
                    type="number"
                    step="0.01"
                    value={taxaJurosAm}
                    onChange={(e) => handleUpdateActiveField('taxaJurosMes', parseFloat(e.target.value) || 0)}
                    className="w-20 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                  />
                  <span className="font-normal text-slate-700">% a.m.</span>
                </div>
              ) : (
                <span className="font-normal font-mono">{formatPercent(taxaJurosAm)} a.m.</span>
              )}
            </div>

            {/* Prazo */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Prazo:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={prazoMeses}
                  onChange={(e) => handleUpdateActiveField('qtdParcelasTotal', parseInt(e.target.value) || 0)}
                  className="w-20 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{prazoMeses} meses</span>
              )}
            </div>

            {/* Prestação */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Prestação:</span>
              {isEditing ? (
                <CurrencyInput
                  value={prestacaoAtual}
                  onChange={(val) => handleUpdateActiveField('valorParcelaAtual', val)}
                  className="w-36 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{formatCurrency(prestacaoAtual)}</span>
              )}
            </div>

            {/* Data Contrato */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Data Contrato:</span>
              {isEditing ? (
                <input
                  type="date"
                  value={dataContrato}
                  onChange={(e) => handleUpdateActiveField('dataContrato', e.target.value)}
                  className="w-32 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{dataContrato}</span>
              )}
            </div>

            {/* Pagas */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Pagas:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={parcelasPagas}
                  onChange={(e) => handleUpdateActiveField('qtdParcelasPagas', parseInt(e.target.value) || 0)}
                  className="w-20 text-right px-2 py-0.5 border border-amber-400 rounded font-black text-amber-950 bg-white text-xs"
                />
              ) : (
                <span className="font-black font-mono text-amber-900 text-sm">{parcelasPagas} parcelas</span>
              )}
            </div>

            {/* Taxa Média BACEN */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Taxa Média BACEN:</span>
              {isEditing ? (
                <div className="flex items-center gap-1 justify-end">
                  <input
                    type="number"
                    step="0.01"
                    value={taxaBacenAm}
                    onChange={(e) => handleUpdateActiveField('taxaMediaBacenMes', parseFloat(e.target.value) || 0)}
                    className="w-20 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                  />
                  <span className="font-normal text-slate-700">% a.m.</span>
                </div>
              ) : (
                <span className="font-normal font-mono text-emerald-800">{formatPercent(taxaBacenAm)} a.m.</span>
              )}
            </div>

            {/* PMT Tx. Média */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">PMT Tx. Média:</span>
              <span className="font-normal font-mono text-emerald-900">{formatCurrency(pmtBacen)}</span>
            </div>

            {/* Prest. Pagas */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Prest. Pagas:</span>
              <span className="font-bold font-mono text-slate-900">{formatCurrency(prestPagasTotal)}</span>
            </div>

            {/* Saldo Devedor */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200 bg-blue-50 px-2 rounded">
              <span className="font-bold text-blue-900">Saldo Devedor:</span>
              <span className="font-black font-mono text-blue-900">{formatCurrency(saldoDevedorNaParcelaPaga)}</span>
            </div>

            {/* Saldo Devedor Atualizado (INPC/IPCA 7 Casas) */}
            <div className="flex justify-between items-center py-1.5 bg-amber-50 px-2 rounded border border-amber-200">
              <span className="font-bold text-amber-950">Saldo Devedor Atualizado:</span>
              <span className="font-black font-mono text-amber-950 text-sm">{formatCurrency(saldoDevedorAtualizado)}</span>
            </div>

          </div>
        </div>

        {/* CARD 2: CRONOGRAMA DE EVOLUÇÃO DA AMORTIZAÇÃO */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-blue-50/80 text-slate-900 p-3.5 border-b border-blue-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                CRONOGRAMA DE EVOLUÇÃO DA AMORTIZAÇÃO DO CONTRATO ({activeContract.credor})
              </span>
              <span className="text-[11px] font-mono text-blue-700 font-bold">
                {scheduleRows.length - 1} Parcelas • {parcelasPagas} Pagas
              </span>
            </div>

            {/* Tabela de Cronograma */}
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left border-collapse text-xs min-w-[500px]">
                {/* Header Limpo */}
                <thead className="sticky top-0 bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300 shadow-2xs z-10">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center w-16">N.º</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Data</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Saldo Devedor (R$)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Juros (R$)</th>
                    <th className="py-2.5 px-3 text-center">Amortização (R$)</th>
                  </tr>
                </thead>
                
                {/* Corpo com Fundo Limpo */}
                <tbody className="divide-y divide-slate-200 font-normal bg-white text-slate-900">
                  {scheduleRows.map((row) => (
                    <tr
                      key={row.num}
                      className={`hover:bg-amber-100/80 transition-colors ${
                        row.num === parcelasPagas
                          ? 'bg-amber-200 font-bold border-y-2 border-amber-400'
                          : row.isPaid
                          ? 'bg-slate-50'
                          : 'bg-white'
                      }`}
                    >
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-900">
                        {row.num}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-900">
                        {row.dataStr}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-900">
                        {formatCurrency(row.sd)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-red-700">
                        {row.num === 0 ? '--' : formatCurrency(row.juros)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-normal text-emerald-800">
                        {row.num === 0 ? '--' : formatCurrency(row.amort)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-100 p-3 border-t border-slate-300 text-slate-700 text-xs font-mono flex justify-between items-center">
            <span>Prestação Contratual: <strong>{formatCurrency(prestacaoAtual)}</strong></span>
            <span>Total Amortizado: <strong>{formatCurrency(valorPrincipal - scheduleRows[scheduleRows.length - 1]?.sd)}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
