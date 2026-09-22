import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, Edit3, Building2 } from 'lucide-react';
import type { Contract } from '../types';
import { initialContracts } from '../mockData';
import { formatCurrency, formatPercent } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface Module3Props {
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr || dateStr === '—' || dateStr.trim() === '') return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

export const Module3CredoresContratos: React.FC<Module3Props> = ({ contracts, onContractsChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingAll, setIsEditingAll] = useState(false);

  const handleAddContract = () => {
    const newId = `contract_${Date.now()}`;
    const newContract: Contract = {
      id: newId,
      credor: '',
      numeroContrato: '',
      modalidade: 'Consignado Folha',
      dataContrato: new Date().toISOString().split('T')[0],
      dataPrimeiraParcela: '',
      vencimentoFinal: '',
      valorLiberadoContrato: 0,
      valorFinalContrato: 0,
      valorIOF: 0,
      qtdParcelasTotal: 0,
      qtdParcelasPagas: 0,
      qtdParcelasRestantes: 0,
      valorParcelaAtual: 0,
      taxaJurosMes: 0,
      taxaJurosAno: 0,
      cetMes: 0,
      cetAno: 0,
      temSeguroPrestamista: false,
      valorSeguroPrestamista: 0,
      temTarifasAbusivas: false,
      valorTarifasAbusivas: 0,
      expurgarAbusividades: false,
      tipoIndiceCorrecao: 'INPC',
      fatorCorrecao7Casas: 1.0,
      dataReferenciaUltimoPagamento: new Date().toISOString().split('T')[0],
      saldoDevedorRefUltimaParcela: 0,
      taxaMediaBacenMes: 1.5,
    };
    onContractsChange([...contracts, newContract]);
    setEditingId(newId);
  };

  const handleResetContracts = () => {
    if (confirm('Deseja restaurar a lista de contratos para o padrão inicial do sistema?')) {
      onContractsChange(initialContracts);
    }
  };

  const handleClearAllContracts = () => {
    if (confirm('Deseja remover todos os contratos cadastrados?')) {
      onContractsChange([]);
    }
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Deseja realmente remover este contrato?')) {
      onContractsChange(contracts.filter(c => c.id !== id));
    }
  };

  const handleUpdateContract = (id: string, field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const toggleExpurgo = (id: string) => {
    onContractsChange(
      contracts.map(c => (c.id === id ? { ...c, expurgarAbusividades: !c.expurgarAbusividades } : c))
    );
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">Módulo 5: Credores & Cadastramento Individual de Contratos</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Gestão de Operações de Crédito
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <button
            onClick={handleAddContract}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ Contrato</span>
          </button>

          {/* 1. CONCLUIR / EDITAR */}
          <button
            type="button"
            onClick={() => setIsEditingAll(!isEditingAll)}
            className={`px-3.5 py-1 text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs border ${
              isEditingAll ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-300 hover:bg-amber-400 text-slate-900 border-amber-400'
            }`}
          >
            <span>{isEditingAll ? 'Concluir' : 'Editar'}</span>
          </button>

          {/* 2. LIMPAR */}
          <button
            type="button"
            onClick={handleClearAllContracts}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir permanentemente todos os contratos cadastrados?')) {
                handleClearAllContracts();
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={handleResetContracts}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Lista de Contratos salva com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Contracts Dynamic Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="p-4 bg-blue-50/80 text-slate-900 border-b border-blue-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-blue-900">Tabela Consolidada de Operações de Crédito ({contracts.length} Contratos)</span>
          <span className="text-xs text-blue-700 font-bold">STJ Tema 972 • Expurgo de Venda Casada e Tarifas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1950px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-900 font-extrabold uppercase text-[10px]">
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[180px] w-[180px]">Credor / Instituição</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[140px] w-[140px]">N.º Contrato / CCB</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[180px] w-[180px]">Modalidade</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[130px]">Data do Contrato</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[130px]">Data 1.ª Parcela</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[130px]">Data Última Parcela</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[130px]">Vlr. Contratado</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[130px]">Vlr. Final Contrato</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[100px]">Vlr. IOF</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[75px]">Total Parc.</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[75px]">Parc. Pagas</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[75px]">Parc. Restantes</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[115px]">Parc. Atual (R$)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[90px]">Taxa (% a.m.)</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[145px]">Seguro / Tarifas</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center min-w-[125px]">Expurgar?</th>
                <th className="py-2.5 px-3 text-center min-w-[80px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {contracts.map((c) => {
                const totalAbusivo = c.valorSeguroPrestamista + c.valorTarifasAbusivas;
                const isEditing = editingId === c.id || isEditingAll;

                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors font-normal text-slate-800">
                    
                    {/* Credor */}
                    <td className="py-3 px-3 font-normal text-slate-900 min-w-[180px] w-[180px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={c.credor}
                          onChange={(e) => handleUpdateContract(c.id, 'credor', e.target.value)}
                          className="w-full min-w-[180px] px-2.5 py-1 border border-slate-300 rounded text-xs font-normal"
                        />
                      ) : (
                        c.credor
                      )}
                    </td>

                    {/* Contrato */}
                    <td className="py-3 px-3 font-mono text-slate-700 font-normal min-w-[150px] w-[150px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={c.numeroContrato}
                          onChange={(e) => handleUpdateContract(c.id, 'numeroContrato', e.target.value)}
                          className="w-full min-w-[130px] px-2.5 py-1 border border-slate-300 rounded text-xs font-mono font-normal"
                        />
                      ) : (
                        c.numeroContrato
                      )}
                    </td>

                    {/* Modalidade */}
                    <td className="py-3 px-3 text-slate-700 font-normal min-w-[210px] w-[210px]">
                      {isEditing ? (
                        <select
                          value={c.modalidade}
                          onChange={(e) => handleUpdateContract(c.id, 'modalidade', e.target.value)}
                          className="w-full min-w-[190px] px-2 py-1 border border-slate-300 rounded text-xs bg-white font-normal"
                        >
                          <option value="Consignado Público">Consignado Público</option>
                          <option value="Crédito Pessoal">Crédito Pessoal</option>
                          <option value="Cartão de Crédito Parcelado">Cartão de Crédito Parcelado</option>
                          <option value="Antecipação 13º / IRPF">Antecipação 13º / IRPF</option>
                          <option value="Cheque Especial">Cheque Especial</option>
                        </select>
                      ) : (
                        c.modalidade
                      )}
                    </td>

                    {/* Data do Contrato */}
                    <td className="py-3 px-3 text-center font-normal text-slate-800">
                      {isEditing ? (
                        <input
                          type="date"
                          value={c.dataContrato || ''}
                          onChange={(e) => handleUpdateContract(c.id, 'dataContrato', e.target.value)}
                          className="w-[120px] px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal"
                        />
                      ) : (
                        formatDateDisplay(c.dataContrato)
                      )}
                    </td>

                    {/* Data 1.ª Parcela */}
                    <td className="py-3 px-3 text-center font-normal text-slate-800">
                      {isEditing ? (
                        <input
                          type="date"
                          value={c.dataPrimeiraParcela || ''}
                          onChange={(e) => handleUpdateContract(c.id, 'dataPrimeiraParcela', e.target.value)}
                          className="w-[120px] px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal"
                        />
                      ) : (
                        formatDateDisplay(c.dataPrimeiraParcela)
                      )}
                    </td>

                    {/* Data Última Parcela */}
                    <td className="py-3 px-3 text-center font-normal text-slate-800">
                      {isEditing ? (
                        <input
                          type="date"
                          value={c.vencimentoFinal || ''}
                          onChange={(e) => handleUpdateContract(c.id, 'vencimentoFinal', e.target.value)}
                          className="w-[120px] px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal"
                        />
                      ) : (
                        formatDateDisplay(c.vencimentoFinal)
                      )}
                    </td>

                    {/* Vlr. Contratado (Fonte normal) */}
                    <td className="py-3 px-3 text-right font-normal text-slate-900">
                      {isEditing ? (
                        <CurrencyInput
                          value={c.valorLiberadoContrato}
                          onChange={(v) => handleUpdateContract(c.id, 'valorLiberadoContrato', v)}
                          className="w-28 text-right font-normal"
                        />
                      ) : (
                        formatCurrency(c.valorLiberadoContrato)
                      )}
                    </td>

                    {/* Vlr. Final Contrato (Fonte normal) */}
                    <td className="py-3 px-3 text-right font-normal text-slate-800">
                      {isEditing ? (
                        <CurrencyInput
                          value={c.valorFinalContrato}
                          onChange={(v) => handleUpdateContract(c.id, 'valorFinalContrato', v)}
                          className="w-28 text-right font-normal"
                        />
                      ) : (
                        formatCurrency(c.valorFinalContrato)
                      )}
                    </td>

                    {/* Vlr. IOF (Fonte normal) */}
                    <td className="py-3 px-3 text-right font-normal text-slate-700">
                      {isEditing ? (
                        <CurrencyInput
                          value={c.valorIOF}
                          onChange={(v) => handleUpdateContract(c.id, 'valorIOF', v)}
                          className="w-24 text-right font-normal"
                        />
                      ) : (
                        formatCurrency(c.valorIOF)
                      )}
                    </td>

                    {/* Total Parc. Contratadas */}
                    <td className="py-3 px-3 text-center font-normal text-slate-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={c.qtdParcelasTotal}
                          onChange={(e) => handleUpdateContract(c.id, 'qtdParcelasTotal', parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal text-slate-900"
                        />
                      ) : (
                        c.qtdParcelasTotal
                      )}
                    </td>

                    {/* Qtd Parcelas Pagas */}
                    <td className="py-3 px-3 text-center font-normal text-emerald-800">
                      {isEditing ? (
                        <input
                          type="number"
                          value={c.qtdParcelasPagas}
                          onChange={(e) => handleUpdateContract(c.id, 'qtdParcelasPagas', parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal text-emerald-800"
                        />
                      ) : (
                        c.qtdParcelasPagas
                      )}
                    </td>

                    {/* Qtd Parcelas Restantes */}
                    <td className="py-3 px-3 text-center font-normal text-blue-900">
                      {isEditing ? (
                        <input
                          type="number"
                          value={c.qtdParcelasRestantes}
                          onChange={(e) => handleUpdateContract(c.id, 'qtdParcelasRestantes', parseInt(e.target.value) || 0)}
                          className="w-14 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal text-blue-900"
                        />
                      ) : (
                        c.qtdParcelasRestantes
                      )}
                    </td>

                    {/* Parcela Atual (Fonte normal) */}
                    <td className="py-3 px-3 text-right font-normal text-blue-900">
                      {isEditing ? (
                        <CurrencyInput
                          value={c.valorParcelaAtual}
                          onChange={(v) => handleUpdateContract(c.id, 'valorParcelaAtual', v)}
                          className="w-28 text-right font-normal text-blue-900"
                        />
                      ) : (
                        formatCurrency(c.valorParcelaAtual)
                      )}
                    </td>

                    {/* Taxa % a.m. */}
                    <td className="py-3 px-3 text-center font-normal text-slate-800">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={c.taxaJurosMes}
                          onChange={(e) => handleUpdateContract(c.id, 'taxaJurosMes', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 border border-slate-300 rounded text-xs text-center font-normal"
                        />
                      ) : (
                        formatPercent(c.taxaJurosMes, 2)
                      )}
                    </td>

                    {/* Seguro / Tarifas */}
                    <td className="py-3 px-3 text-center text-red-700 font-normal">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <CurrencyInput
                            value={c.valorSeguroPrestamista}
                            onChange={(v) => handleUpdateContract(c.id, 'valorSeguroPrestamista', v)}
                            className="w-20 text-[10px] font-normal"
                            placeholder="Seguro"
                          />
                          <CurrencyInput
                            value={c.valorTarifasAbusivas}
                            onChange={(v) => handleUpdateContract(c.id, 'valorTarifasAbusivas', v)}
                            className="w-20 text-[10px] font-normal"
                            placeholder="Tarifa"
                          />
                        </div>
                      ) : (
                        <span>{formatCurrency(totalAbusivo)}</span>
                      )}
                    </td>

                    {/* Toggle Expurgo */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => toggleExpurgo(c.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                          c.expurgarAbusividades
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {c.expurgarAbusividades ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>EXPURGADO</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>MANTER</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingId(isEditing ? null : c.id)}
                          className="p-1 text-slate-600 hover:text-blue-900 hover:bg-slate-100 rounded"
                          title="Editar Linha"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteContract(c.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remover Contrato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
