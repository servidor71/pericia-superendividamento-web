import React, { useState } from 'react';
import { TrendingUp, BadgeCheck, Upload, Filter, Clipboard } from 'lucide-react';
import type { Contract, MonetaryIndexItem } from '../types';
import { initialContracts } from '../mockData';
import { formatCurrency, getBacenStatus, getSaldoDevedorModulo6, getDataRefUltimaParcelaModulo6 } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';
import { ModuleImportacaoIndices } from './ModuleImportacaoIndices';

interface Module4Props {
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
  indicesList?: MonetaryIndexItem[];
  onIndicesChange?: (indices: MonetaryIndexItem[]) => void;
}

export const Module4INPCBACEN: React.FC<Module4Props> = ({
  contracts,
  onContractsChange,
  indicesList,
  onIndicesChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'liberado' | 'saldoDevedor' | 'tabelaIndices'>('liberado');
  const [isEditing, setIsEditing] = useState(true);
  const [selectedCreditor, setSelectedCreditor] = useState<string>('TODOS');
  const [indicesActions, setIndicesActions] = useState<{
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    openPasteModal: () => void;
    handleAddRow: () => void;
    handleResetIndices: () => void;
    handleClearIndices?: () => void;
  } | null>(null);

  const creditorsList = Array.from(new Set(contracts.map(c => c.credor))).filter(Boolean);

  const filteredContracts = selectedCreditor === 'TODOS' 
    ? contracts 
    : contracts.filter(c => c.credor === selectedCreditor);

  const handleUpdate = (id: string, field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleGlobalIndexChange = (newIndice: 'INPC' | 'IPCA') => {
    onContractsChange(
      contracts.map(c => ({ ...c, tipoIndiceCorrecao: newIndice }))
    );
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as taxas BACEN e os fatores de correção monetária para o padrão?')) {
      onContractsChange(initialContracts);
    }
  };

  // Cálculo Totais Aba 1 (Valor Liberado)
  const totalValorLiberadoOriginal = filteredContracts.reduce((acc, c) => acc + (c.valorLiberadoContrato || 0), 0);
  const totalValorLiberadoCorrigido = filteredContracts.reduce((acc, c) => {
    const vlr = c.valorLiberadoContrato || 0;
    const fator = c.fatorCorrecao7Casas || 1.0;
    return acc + (vlr * fator);
  }, 0);

  // Cálculo Totais Aba 2 (Saldo Devedor Restante pós Última Parcela do Módulo 6)
  const totalSaldoDevedorOriginal = filteredContracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    return acc + Math.max(0, saldoBase - deducao);
  }, 0);

  const totalSaldoDevedorCorrigido7Casas = filteredContracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoAjustado = Math.max(0, saldoBase - deducao);
    const fator = c.fatorCorrecao7Casas || 1.0;
    return acc + (saldoAjustado * fator);
  }, 0);

  const currentGlobalIndex = contracts[0]?.tipoIndiceCorrecao || 'INPC';

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 8: Atualização Monetária (INPC / IPCA) & Taxas BACEN
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Ajustes de Valor Liberado, Taxa Média BACEN, Saldo Devedor e Importação de Tabelas IBGE
            </p>
          </div>
        </div>

        {/* Sub-Tabs + Action Buttons on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-[#DCD8CD] gap-1 shrink-0">
            <button
              onClick={() => setActiveSubTab('liberado')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'liberado'
                  ? 'bg-[#1C4E5E] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Aba 1: Valor Liberado
            </button>
            <button
              onClick={() => setActiveSubTab('saldoDevedor')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'saldoDevedor'
                  ? 'bg-[#2E7D62] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Aba 2: Saldo Devedor
            </button>
            <button
              onClick={() => setActiveSubTab('tabelaIndices')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'tabelaIndices'
                  ? 'bg-[#1C4E5E] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Aba 3: Tabela Índices</span>
            </button>
          </div>

          {activeSubTab === 'tabelaIndices' && (
            <>
              {/* File Upload Button */}
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1C4E5E] hover:bg-[#153E4B] text-white font-black text-xs rounded-xl shadow-2xs border border-[#1C4E5E] transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-white" />
                <span>Importar (CSV / XLS)</span>
                <input
                  type="file"
                  accept=".csv,.txt,.tsv,.xls,.xlsx"
                  onChange={(e) => indicesActions?.handleFileUpload(e)}
                  className="hidden"
                />
              </label>

              {/* Paste Excel Button */}
              <button
                onClick={() => indicesActions?.openPasteModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 font-bold text-xs rounded-xl border border-[#DCD8CD] transition-all cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5 text-[#1C4E5E]" />
                <span>Colar Excel</span>
              </button>

              <button
                onClick={() => indicesActions?.handleAddRow()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <span>+ Mês/Índice</span>
              </button>
            </>
          )}

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
              if (activeSubTab === 'liberado') {
                onContractsChange(contracts.map(c => ({ ...c, valorLiberadoContrato: 0 })));
              } else if (activeSubTab === 'saldoDevedor') {
                onContractsChange(contracts.map(c => ({ ...c, saldoDevedorRefUltimaParcela: 0 })));
              } else if (activeSubTab === 'tabelaIndices' && indicesActions?.handleClearIndices) {
                indicesActions.handleClearIndices();
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
              if (confirm(`Deseja excluir os dados da aba "${activeSubTab === 'liberado' ? 'Valor Liberado' : activeSubTab === 'saldoDevedor' ? 'Saldo Devedor' : 'Tabela Índices'}"?`)) {
                if (activeSubTab === 'liberado') {
                  onContractsChange(contracts.map(c => ({ ...c, valorLiberadoContrato: 0 })));
                } else if (activeSubTab === 'saldoDevedor') {
                  onContractsChange(contracts.map(c => ({ ...c, saldoDevedorRefUltimaParcela: 0 })));
                } else if (activeSubTab === 'tabelaIndices' && indicesActions?.handleClearIndices) {
                  indicesActions.handleClearIndices();
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
              if (activeSubTab === 'tabelaIndices' && indicesActions) {
                indicesActions.handleResetIndices();
              } else {
                handleReset();
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert(`Dados de Atualização Monetária (${activeSubTab === 'liberado' ? 'Aba 1: Valor Liberado' : activeSubTab === 'saldoDevedor' ? 'Aba 2: Saldo Devedor' : 'Aba 3: Tabela Índices'}) salvos com sucesso!`)}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'tabelaIndices' ? (
        <ModuleImportacaoIndices
          contracts={contracts}
          onContractsChange={onContractsChange}
          indicesList={indicesList}
          onIndicesChange={onIndicesChange}
          isEditing={isEditing}
          onRegisterActions={setIndicesActions}
        />
      ) : (
        <>

      {/* ========================================================================= */}
      {/* ABA 1: ATUALIZAÇÃO DO VALOR LIBERADO NO CONTRATO & TAXAS BACEN            */}
      {/* ========================================================================= */}
      {activeSubTab === 'liberado' && (
        <div className="space-y-6 w-full">
          
          {/* Information Card Aba 1 - Ultra Slim Single Line Banner */}
          <div className="bg-blue-50/80 text-slate-900 px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2 font-sans">
            <div className="flex items-center gap-2 overflow-hidden shrink min-w-0">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider shrink-0">
                1. ATUALIZAÇÃO MONETÁRIA DO VALOR LIBERADO:
              </span>
              <p className="text-xs text-slate-600 font-medium whitespace-nowrap truncate">
                Ajuste monetário pelo INPC/IPCA do montante originalmente disponibilizado ao contratante e análise de abusividade frente à Taxa Média do Banco Central.
              </p>
            </div>

            {/* Creditor Filter + Total Badge na mesma linha */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-blue-200 text-xs shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-700 text-[11px]">Credor:</span>
                <select
                  value={selectedCreditor}
                  onChange={(e) => setSelectedCreditor(e.target.value)}
                  className="text-xs font-black bg-white text-blue-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos ({contracts.length})</option>
                  {creditorsList.map(cr => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 text-right shadow-2xs flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">TOTAL CORRIGIDO:</span>
                <span className="text-xs font-black text-blue-900 font-mono">{formatCurrency(totalValorLiberadoCorrigido)}</span>
              </div>
            </div>
          </div>

          {/* Table Aba 1 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-blue-50/80 text-slate-900 p-3.5 border-b border-blue-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wide text-blue-900">
                RELAÇÃO DE CONTRATOS - VALOR LIBERADO ORIGINAL X VALOR CORRIGIDO (INPC/IPCA)
              </span>
              <span className="text-xs text-blue-700 font-mono font-bold">
                {filteredContracts.length} Contratos Exibidos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Item</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Credor / Contrato</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Data Contrato</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Valor Liberado (R$)</th>
                    
                    {/* Header Coluna com Dropdown de Índice no Cabeçalho */}
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>Índice / Fator de Correção</span>
                        <select
                          disabled={!isEditing}
                          value={currentGlobalIndex}
                          onChange={(e) => handleGlobalIndexChange(e.target.value as 'INPC' | 'IPCA')}
                          className="px-1.5 py-0.5 border border-slate-300 rounded font-bold text-blue-900 text-[10px] bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="INPC">INPC / IBGE</option>
                          <option value="IPCA">IPCA / IBGE</option>
                        </select>
                      </div>
                    </th>

                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Valor Liberado Corrigido (R$)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Taxa Contratada (% a.m.)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Taxa BACEN (% a.m.)</th>
                    <th className="py-2.5 px-3 text-center">Status BACEN</th>
                  </tr>
                </thead>
                
                {/* Corpo da tabela: FONTES EM PESO NORMAL (SEM NEGRITO) */}
                <tbody className="divide-y divide-slate-200 font-normal">
                  {filteredContracts.map((c, idx) => {
                    const vlrLiberado = c.valorLiberadoContrato || 0;
                    const fator = c.fatorCorrecao7Casas || 1.0;
                    const vlrCorrigido = vlrLiberado * fator;
                    const bacenStatus = getBacenStatus(c.taxaJurosMes, c.taxaMediaBacenMes);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors text-slate-800 font-normal">
                        <td className="py-2.5 px-3 text-center font-normal text-slate-900 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <span className="font-normal text-slate-900 block">{c.credor}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">{c.numeroContrato}</span>
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-center font-normal text-slate-700">
                          <input
                            type="date"
                            disabled={!isEditing}
                            value={c.dataContrato || '2024-01-01'}
                            onChange={(e) => handleUpdate(c.id, 'dataContrato', e.target.value)}
                            className="px-1.5 py-0.5 border border-slate-300 rounded font-mono text-[11px] bg-white disabled:bg-slate-100 text-slate-800 font-normal"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-normal text-slate-900">
                          <CurrencyInput
                            disabled={!isEditing}
                            value={c.valorLiberadoContrato}
                            onChange={(val) => handleUpdate(c.id, 'valorLiberadoContrato', val)}
                            className="w-28 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                        </td>
                        
                        {/* Fator sozinho na célula sem dropdown repetido */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-slate-50/50">
                          <input
                            type="number"
                            step="0.0000001"
                            disabled={!isEditing}
                            value={c.fatorCorrecao7Casas || 1.0}
                            onChange={(e) => handleUpdate(c.id, 'fatorCorrecao7Casas', parseFloat(e.target.value) || 1.0)}
                            className="w-24 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100 block mx-auto"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-normal text-slate-800 font-mono">
                          {formatCurrency(vlrCorrigido)}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-normal text-slate-800">
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isEditing}
                            value={c.taxaJurosMes}
                            onChange={(e) => handleUpdate(c.id, 'taxaJurosMes', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right px-1.5 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                          <span className="text-[10px] text-slate-500 font-normal ml-0.5">%</span>
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200">
                          <input
                            type="number"
                            step="0.01"
                            disabled={!isEditing}
                            value={c.taxaMediaBacenMes}
                            onChange={(e) => handleUpdate(c.id, 'taxaMediaBacenMes', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right px-1.5 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                          <span className="text-[10px] text-slate-500 block font-normal">% a.m.</span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-normal border ${bacenStatus.badgeClass}`}>
                            {bacenStatus.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Totais */}
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-black text-xs uppercase border-t-2 border-slate-300">
                    <td colSpan={3} className="py-3 px-4 text-right font-black">TOTAIS DO VALOR LIBERADO:</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(totalValorLiberadoOriginal)}</td>
                    <td className="py-3 px-4 text-center font-black">-- Fatores Acumulados --</td>
                    <td className="py-3 px-4 text-right font-black text-blue-900 text-sm">{formatCurrency(totalValorLiberadoCorrigido)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: ATUALIZAÇÃO DO SALDO DEVEDOR RESTANTE (PÓS ÚLTIMA PARCELA PAGA)     */}
      {/* ========================================================================= */}
      {activeSubTab === 'saldoDevedor' && (
        <div className="space-y-6 w-full">
          
          {/* Information Card Aba 2 - Ultra Slim Single Line Banner */}
          <div className="bg-emerald-50/80 text-slate-900 px-3.5 py-1.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2 font-sans">
            <div className="flex items-center gap-2 overflow-hidden shrink min-w-0">
              <div className="flex items-center space-x-1.5 text-emerald-900 font-black text-xs uppercase tracking-wider shrink-0">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. SALDO DEVEDOR RESTANTE CORRIGIDO:</span>
              </div>
              <p className="text-xs text-slate-600 font-medium whitespace-nowrap truncate">
                Saldo devedor apurado pós-última parcela que servirá de Entrada (VP) na Tabela Price (Módulo 16).
              </p>
            </div>

            {/* Creditor Filter + Total Badge na mesma linha */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 text-xs shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-700 text-[11px]">Credor:</span>
                <select
                  value={selectedCreditor}
                  onChange={(e) => setSelectedCreditor(e.target.value)}
                  className="text-xs font-black bg-white text-emerald-900 focus:outline-hidden cursor-pointer"
                >
                  <option value="TODOS">Todos ({contracts.length})</option>
                  {creditorsList.map(cr => (
                    <option key={cr} value={cr}>{cr}</option>
                  ))}
                </select>
              </div>

              <div className="bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 text-right shadow-2xs flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-tight">SALDO CORRIGIDO:</span>
                <span className="text-xs font-black text-emerald-900 font-mono">{formatCurrency(totalSaldoDevedorCorrigido7Casas)}</span>
              </div>
            </div>
          </div>

          {/* Table Aba 2 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-blue-50/80 text-slate-900 p-3.5 border-b border-blue-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-wide text-blue-900">
                DEMONSTRATIVO DO SALDO DEVEDOR RESTANTE POR CONTRATO (FATOR INPC/IPCA)
              </span>
              <span className="text-xs text-blue-700 font-mono font-bold">
                {filteredContracts.length} Contratos Exibidos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[950px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Item</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Credor / Contrato</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Parcelas Pagas</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Parcelas Restantes</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Data Ref. Últ. Parcela</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">Saldo Devedor Restante Base (R$)</th>
                    <th className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span>Índice / Fator de Correção</span>
                        <select
                          disabled={!isEditing}
                          value={currentGlobalIndex}
                          onChange={(e) => handleGlobalIndexChange(e.target.value as 'INPC' | 'IPCA')}
                          className="px-1.5 py-0.5 border border-slate-300 rounded font-bold text-blue-900 text-[10px] bg-white cursor-pointer shadow-2xs"
                        >
                          <option value="INPC">INPC / IBGE</option>
                          <option value="IPCA">IPCA / IBGE</option>
                        </select>
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center">Saldo Devedor Restante Atualizado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  {filteredContracts.map((c, idx) => {
                    let saldoBaseOriginal = getSaldoDevedorModulo6(c);
                    let dataRefUltima = getDataRefUltimaParcelaModulo6(c);
                    let deducaoAbusiva = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
                    let saldoBaseAjustado = Math.max(0, saldoBaseOriginal - deducaoAbusiva);
                    let fator7Casas = c.fatorCorrecao7Casas || 1.0;
                    let saldoCorrigido = saldoBaseAjustado * fator7Casas;

                    return (
                      <tr key={c.id} className="hover:bg-emerald-50/70 transition-colors text-slate-800 font-normal">
                        <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-700 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 border-r border-slate-200">
                          <span className="font-normal text-slate-800 block">{c.credor}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-normal">{c.numeroContrato}</span>
                        </td>
                        
                        {/* Coluna 1: Parcelas Pagas */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal">
                          <input
                            type="number"
                            disabled={!isEditing}
                            value={c.qtdParcelasPagas}
                            onChange={(e) => handleUpdate(c.id, 'qtdParcelasPagas', parseInt(e.target.value) || 0)}
                            className="w-16 text-center px-1.5 py-0.5 border border-slate-300 rounded font-normal text-emerald-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                          <span className="text-[9px] text-slate-500 block font-normal">pagas</span>
                        </td>

                        {/* Coluna 2: Parcelas Restantes */}
                        <td className="py-2.5 px-3 border-r border-slate-200 text-center font-mono font-normal">
                          <input
                            type="number"
                            disabled={!isEditing}
                            value={c.qtdParcelasRestantes}
                            onChange={(e) => handleUpdate(c.id, 'qtdParcelasRestantes', parseInt(e.target.value) || 0)}
                            className="w-16 text-center px-1.5 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                          <span className="text-[9px] text-slate-500 block font-normal">restantes</span>
                        </td>

                        <td className="py-2.5 px-3 text-right border-r border-slate-200">
                          <input
                            type="date"
                            disabled={!isEditing}
                            value={dataRefUltima}
                            onChange={(e) => handleUpdate(c.id, 'dataReferenciaUltimoPagamento', e.target.value)}
                            className="px-1.5 py-0.5 border border-slate-300 rounded font-mono text-[11px] bg-white disabled:bg-slate-100 text-slate-800 font-normal"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-slate-200 font-normal">
                          <CurrencyInput
                            disabled={!isEditing}
                            value={saldoBaseAjustado}
                            onChange={(val) => handleUpdate(c.id, 'saldoDevedorRefUltimaParcela', val)}
                            className="w-32 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100"
                          />
                          {c.expurgarAbusividades && deducaoAbusiva > 0 && (
                            <span className="text-[9px] text-red-700 block font-normal">
                              (Expurgo Seg/Tarifa: -{formatCurrency(deducaoAbusiva)})
                            </span>
                          )}
                        </td>
                        
                        {/* Fator sozinho na célula sem dropdown repetido */}
                        <td className="py-2.5 px-3 text-center border-r border-slate-200">
                          <input
                            type="number"
                            step="0.0000001"
                            disabled={!isEditing}
                            value={c.fatorCorrecao7Casas || 1.0}
                            onChange={(e) => handleUpdate(c.id, 'fatorCorrecao7Casas', parseFloat(e.target.value) || 1.0)}
                            className="w-24 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-800 text-[11px] bg-white disabled:bg-slate-100 block mx-auto"
                          />
                        </td>

                        <td className="py-2.5 px-3 text-right font-normal text-slate-800 text-xs font-mono">
                          {formatCurrency(saldoCorrigido)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-slate-100 text-slate-900 font-black text-xs uppercase border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-right font-black">TOTAL DO SALDO DEVEDOR RESTANTE ATUALIZADO:</td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">{formatCurrency(totalSaldoDevedorOriginal)}</td>
                    <td className="py-3 px-4 text-center font-black">-- Fatores Acumulados --</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-800 text-base font-mono">{formatCurrency(totalSaldoDevedorCorrigido7Casas)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
};
