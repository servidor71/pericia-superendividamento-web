import React, { useState } from 'react';
import { Calculator, Search, CheckCircle2 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { initialContracts } from '../mockData';
import { formatCurrency, formatPercent } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModuleCalculoSaldoPrestacoesPagasProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleCalculoSaldoPrestacoesPagas: React.FC<ModuleCalculoSaldoPrestacoesPagasProps> = ({
  income: _income,
  expenses: _expenses,
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
        Nenhum contrato cadastrado para apuração do saldo devedor.
      </div>
    );
  }

  // Helper para atualizar campos do contrato ativo e propagar bidirecionalmente
  const handleUpdateActiveField = (field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === activeContract.id ? { ...c, [field]: val } : c))
    );
  };

  // Parâmetros do Contrato puxados ESTRITAMENTE do Módulo 5
  const valorPrincipal = Number(activeContract.valorLiberadoContrato) || 0;
  const taxaJurosAm = Number(activeContract.taxaJurosMes) || 0;
  const prazoMeses = Number(activeContract.qtdParcelasTotal) || 0;
  const prestacaoAtual = Number(activeContract.valorParcelaAtual) || 0;
  const parcelasPagas = Number(activeContract.qtdParcelasPagas) || 0;
  const taxaBacenAm = Number(activeContract.taxaMediaBacenMes) || 0;
  const dataContrato = activeContract.dataContrato || '';
  const fatorCorrecao = Number(activeContract.fatorCorrecao7Casas) || 1.0;

  // PMT pela Taxa Média BACEN
  const iBacen = taxaBacenAm / 100;
  const pmtBacen = iBacen > 0 
    ? (valorPrincipal * (iBacen * Math.pow(1 + iBacen, prazoMeses))) / (Math.pow(1 + iBacen, prazoMeses) - 1)
    : (valorPrincipal / prazoMeses);

  // Total das Prestações Pagas até a Data de Referência
  const prestPagasTotal = prestacaoAtual * parcelasPagas;

  // Helper de formatação visual de datas
  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr || dateStr === '—' || dateStr.trim() === '') return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m, d] = dateStr.split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  };

  // Helper de cálculo de datas para a tabela de cronograma
  function computeScheduleDate(n: number, dtContratoStr: string, dt1aParcStr?: string) {
    if (n === 0) {
      return formatDateDisplay(dtContratoStr);
    }

    if (dt1aParcStr && dt1aParcStr.trim() !== '') {
      const parts = dt1aParcStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0]) || 2022;
        const m = (parseInt(parts[1]) || 1) - 1 + (n - 1);
        const d = parseInt(parts[2]) || 10;
        const dt = new Date(y, m, d);
        const dayStr = String(dt.getDate()).padStart(2, '0');
        const monthStr = String(dt.getMonth() + 1).padStart(2, '0');
        return `${dayStr}/${monthStr}/${dt.getFullYear()}`;
      }
    }

    const parts = (dtContratoStr || '2022-10-10').split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0]) || 2022;
      const m = (parseInt(parts[1]) || 10) - 1 + n;
      const d = parseInt(parts[2]) || 10;
      const dt = new Date(y, m, d);
      const dayStr = String(dt.getDate()).padStart(2, '0');
      const monthStr = String(dt.getMonth() + 1).padStart(2, '0');
      return `${dayStr}/${monthStr}/${dt.getFullYear()}`;
    }
    return dtContratoStr;
  }

  // Tabela de Evolução da Amortização Tabela Price Mês a Mês
  let currentSD = valorPrincipal;
  const iContrato = taxaJurosAm / 100;

  // PMT Exato da Tabela Price
  const pmtPriceCalculada = (iContrato > 0 && prazoMeses > 0)
    ? (valorPrincipal * (iContrato * Math.pow(1 + iContrato, prazoMeses))) / (Math.pow(1 + iContrato, prazoMeses) - 1)
    : (valorPrincipal / (prazoMeses || 1));

  const pmtEfetiva = prestacaoAtual > 0 ? prestacaoAtual : pmtPriceCalculada;

  const scheduleRows = [];

  // Linha 0 (n = 0: Liberação do Crédito / Assinatura do Contrato)
  scheduleRows.push({
    n: 0,
    dataStr: computeScheduleDate(0, dataContrato, activeContract.dataPrimeiraParcela),
    sd: valorPrincipal,
    juros: 0,
    amort: 0,
    isPaid: true,
  });

  for (let n = 1; n <= prazoMeses; n++) {
    const jurosMes = currentSD * iContrato;
    let amortMes = pmtEfetiva - jurosMes;

    // Na última parcela (ou se amortização superar o saldo restante), ajusta amortização para zerar o saldo exatamente em R$ 0,00
    if (n === prazoMeses || currentSD - amortMes < 0.05) {
      amortMes = currentSD;
    }

    const nextSD = Math.max(0, currentSD - amortMes);
    const currentDateStr = computeScheduleDate(n, dataContrato, activeContract.dataPrimeiraParcela);
    const isPaid = n <= parcelasPagas;

    scheduleRows.push({
      n,
      dataStr: currentDateStr,
      sd: nextSD, // Saldo Devedor Residual após o pagamento da parcela N
      juros: jurosMes,
      amort: amortMes,
      isPaid,
    });

    currentSD = nextSD;
  }

  // Saldo Devedor apurado exatamente na parcela N pagas
  const saldoDevedorNaParcelaPaga = parcelasPagas === 0 
    ? valorPrincipal 
    : (scheduleRows[parcelasPagas]?.sd ?? 0);
  const saldoDevedorAtualizado = saldoDevedorNaParcelaPaga * fatorCorrecao;

  // Sincronizar o Saldo Devedor Apurado no Estado Global do Contrato
  const handleApplyCalculatedBalance = () => {
    handleUpdateActiveField('saldoDevedorRefUltimaParcela', saldoDevedorNaParcelaPaga);
    alert(`Saldo Devedor de ${formatCurrency(saldoDevedorNaParcelaPaga)} (Corrigido: ${formatCurrency(saldoDevedorAtualizado)}) aplicado aos demais módulos!`);
  };

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
              Módulo 6: Apuração do Saldo Devedor com Base no Total de Prestações Já Pagas
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Cálculo Exato do Saldo Devedor Residual Apurado na Última Parcela Paga ({parcelasPagas}ª Parcela)
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
            onClick={handleApplyCalculatedBalance}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C4E5E] hover:bg-[#153E4B] text-white font-extrabold text-xs rounded-xl shadow-2xs border border-[#1C4E5E] transition-all cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span>Aplicar Saldo</span>
          </button>

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
            onClick={() => alert(`Cálculo do Saldo por Prestações Pagas do Contrato ${activeContract.numeroContrato} salvo com sucesso!`)}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Ficha do Contrato no Padrão Exato da Imagem Anexa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* CARD 1: QUADRO DE PARÂMETROS DO CONTRATO (ESTILO EXACTO DA IMAGEM) */}
        <div className="lg:col-span-1 bg-white p-4 rounded-lg border-2 border-slate-300 shadow-md font-sans text-xs text-slate-900 space-y-2">
          
          {/* Header Bar do Contrato: Nº Contrato, Credor e Data do Contrato */}
          <div className="bg-[#FAF8F3] text-slate-900 px-3 py-2 rounded-lg font-mono font-bold text-xs flex flex-wrap justify-between items-center border border-[#DCD8CD] gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Nº Contrato CCB:</span>
              <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-[#DCD8CD]">{activeContract.numeroContrato || 'Sem número'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Credor:</span>
              <span className="font-black text-[#1C4E5E]">{activeContract.credor || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold text-[10px] uppercase">Data Contrato:</span>
              <span className="font-bold text-slate-800">{formatDateDisplay(dataContrato)}</span>
            </div>
          </div>

          {/* Form / Table Grid Estilo Ficha Spreadsheet */}
          <div className="bg-slate-50 rounded border border-slate-200 p-3 space-y-1.5">
            
            {/* Credor */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Credor:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={activeContract.credor}
                  onChange={(e) => handleUpdateActiveField('credor', e.target.value)}
                  className="w-44 text-right px-2 py-0.5 border border-slate-300 rounded font-bold text-slate-900 bg-white text-xs"
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
                  className="w-44 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal text-slate-800">{activeContract.modalidade}</span>
              )}
            </div>

            {/* Valor Contratado (Substitui Valor Principal) */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Valor Contratado:</span>
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
                    value={taxaJurosAm !== undefined && taxaJurosAm !== null ? Number(taxaJurosAm).toFixed(2) : '0.00'}
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
                <span className="font-normal font-mono">{prazoMeses} parcelas</span>
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
                <span className="font-normal font-mono">{formatDateDisplay(dataContrato)}</span>
              )}
            </div>

            {/* Data 1.ª Parcela */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Data 1.ª Parcela:</span>
              {isEditing ? (
                <input
                  type="date"
                  value={activeContract.dataPrimeiraParcela || ''}
                  onChange={(e) => handleUpdateActiveField('dataPrimeiraParcela', e.target.value)}
                  className="w-32 text-right px-2 py-0.5 border border-slate-[#DCD8CD] rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{formatDateDisplay(activeContract.dataPrimeiraParcela)}</span>
              )}
            </div>

            {/* Data Última Parcela */}
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-bold text-slate-900">Data Última Parcela:</span>
              {isEditing ? (
                <input
                  type="date"
                  value={activeContract.vencimentoFinal || ''}
                  onChange={(e) => handleUpdateActiveField('vencimentoFinal', e.target.value)}
                  className="w-32 text-right px-2 py-0.5 border border-slate-[#DCD8CD] rounded font-normal text-slate-900 bg-white text-xs"
                />
              ) : (
                <span className="font-normal font-mono">{formatDateDisplay(activeContract.vencimentoFinal)}</span>
              )}
            </div>

            {/* Pagas (Campo Chave de Cálculo) */}
            <div className="flex justify-between items-center py-1.5 bg-amber-50 px-2 rounded border border-amber-300">
              <span className="font-bold text-amber-950">Prestações Pagas:</span>
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

            {/* Saldo Devedor Apurado no Total de Pagas */}
            <div className="flex justify-between items-center py-2 bg-blue-50 text-blue-900 px-3 rounded-xl border border-blue-200">
              <span className="font-extrabold text-blue-800">Saldo Devedor (Pagas):</span>
              <span className="font-black font-mono text-blue-900 text-sm">{formatCurrency(saldoDevedorNaParcelaPaga)}</span>
            </div>

            {/* Saldo Devedor Atualizado (INPC/IPCA) */}
            <div className="flex justify-between items-center py-2 bg-amber-50 text-amber-900 px-3 rounded-xl border border-amber-200">
              <span className="font-extrabold text-amber-800">Saldo Devedor Atualizado:</span>
              <span className="font-black font-mono text-amber-950 text-sm">{formatCurrency(saldoDevedorAtualizado)}</span>
            </div>

          </div>
        </div>

        {/* CARD 2: TABELA DE EVOLUÇÃO (n | Data | SD | Juros | Amort) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-300 shadow-md overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-blue-50/80 text-slate-900 p-3.5 border-b border-blue-200 flex justify-between items-center rounded-t-xl">
              <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                CRONOGRAMA DE CÁLCULO DE SALDO DEVEDOR POR PRESTAÇÕES PAGAS ({activeContract.credor})
              </span>
              <span className="text-[11px] font-mono text-blue-700 font-bold">
                {scheduleRows.length - 1} Parcelas • {parcelasPagas}ª Paga Destacada
              </span>
            </div>

            {/* Tabela de Cronograma */}
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-left border-collapse text-xs min-w-[550px]">
                {/* Header Limpo */}
                <thead className="sticky top-0 bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300 shadow-2xs z-10">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center w-12">n</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Data</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Saldo Devedor (R$)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Juros (R$)</th>
                    <th className="py-2.5 px-3 text-center">Amortização (R$)</th>
                  </tr>
                </thead>
                
                {/* Corpo de Linhas com n=0 e Destaque no n=Pagas */}
                <tbody className="divide-y divide-slate-200 font-normal bg-white text-slate-900">
                  {scheduleRows.map((row) => (
                    <tr
                      key={row.n}
                      className={`hover:bg-amber-100/80 transition-colors ${
                        row.n === parcelasPagas
                          ? 'bg-amber-300 font-black border-y-2 border-amber-500 text-amber-950'
                          : row.isPaid
                          ? 'bg-slate-50'
                          : 'bg-white text-slate-600'
                      }`}
                    >
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal text-slate-900">
                        {row.n}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal">
                        {row.dataStr}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal">
                        {formatCurrency(row.sd)}
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal">
                        {row.n === 0 ? '--' : formatCurrency(row.juros)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-normal">
                        {row.n === 0 ? '--' : formatCurrency(row.amort)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-900 p-3 rounded-b-xl border-t border-blue-200 text-xs font-mono flex justify-between items-center font-bold">
            <span>Saldo Apurado na {parcelasPagas}ª Parcela: <strong className="text-blue-900 font-black">{formatCurrency(saldoDevedorNaParcelaPaga)}</strong></span>
            <span>Saldo Devedor Corrigido (INPC): <strong className="text-emerald-700 font-black">{formatCurrency(saldoDevedorAtualizado)}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
