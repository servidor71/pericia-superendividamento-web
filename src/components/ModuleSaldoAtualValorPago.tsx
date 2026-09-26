import React, { useState } from 'react';
import { DollarSign, Trash2 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { formatCurrency, getSaldoDevedorModulo6 } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModuleSaldoAtualValorPagoProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleSaldoAtualValorPago: React.FC<ModuleSaldoAtualValorPagoProps> = ({
  income: _income,
  expenses: _expenses,
  contracts,
  onContractsChange,
}) => {
  const [isEditing, setIsEditing] = useState(true);
  const [selectedIndiceGlobal, setSelectedIndiceGlobal] = useState<'INPC' | 'IPCA'>('INPC');

  // Handler para trocar globalmente o índice de atualização entre INPC e IPCA
  const handleGlobalIndiceChange = (novoIndice: 'INPC' | 'IPCA') => {
    setSelectedIndiceGlobal(novoIndice);
    // Atualiza o tipo de índice de todos os contratos de forma síncrona
    const fatorPadrao = novoIndice === 'INPC' ? 1.0968016 : 1.0842105;
    onContractsChange(
      contracts.map(c => ({
        ...c,
        tipoIndiceCorrecao: novoIndice,
        fatorCorrecao7Casas: c.fatorCorrecao7Casas || fatorPadrao,
      }))
    );
  };

  // Totais acumulados para o rodapé
  let sumSaldoDevedorBase = 0;
  let sumSaldoAtualizadoInpc = 0;
  let sumValorJaPago = 0;

  const rows = contracts.map((c) => {
    // 1. Saldo Devedor Base vindo da apuração do Módulo 6
    const saldoBase = getSaldoDevedorModulo6(c);

    // 2. Saldo Devedor Atualizado pelo INPC/IPCA selecionado (7 Casas)
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoAjustado = Math.max(0, saldoBase - deducao);
    const fator = c.fatorCorrecao7Casas || (selectedIndiceGlobal === 'INPC' ? 1.0968016 : 1.0842105);
    const saldoDevedorAtualizadoInpc = saldoAjustado * fator;

    // 3. Valor Já Pago (Total das Prestações Pagas)
    const valorJaPago = c.valorParcelaAtual * c.qtdParcelasPagas;

    sumSaldoDevedorBase += saldoBase;
    sumSaldoAtualizadoInpc += saldoDevedorAtualizadoInpc;
    sumValorJaPago += valorJaPago;

    return {
      ...c,
      saldoBase,
      saldoDevedorAtualizadoInpc,
      valorJaPago,
    };
  });

  // Handlers Reativos para Atualização Bidirecional em Tempo Real
  const handleUpdateContractField = (id: string, field: keyof Contract, val: any) => {
    onContractsChange(
      contracts.map(c => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleAddContract = () => {
    const newId = `ct_${Date.now()}`;
    const newContract: Contract = {
      id: newId,
      credor: '',
      numeroContrato: '',
      modalidade: 'Consignado Folha',
      dataContrato: new Date().toISOString().split('T')[0],
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
      tipoIndiceCorrecao: selectedIndiceGlobal,
      fatorCorrecao7Casas: selectedIndiceGlobal === 'INPC' ? 1.0968016 : 1.0842105,
      dataReferenciaUltimoPagamento: new Date().toISOString().split('T')[0],
      saldoDevedorRefUltimaParcela: 3563.42,
      taxaMediaBacenMes: 1.26,
    };
    onContractsChange([...contracts, newContract]);
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Deseja remover este contrato da definição de saldos?')) {
      onContractsChange(contracts.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3 shrink min-w-0 overflow-hidden">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="shrink min-w-0 overflow-hidden">
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 9: Definição do Valor do Saldo Devedor Atualizado e Valor Principal Já Pago
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5 whitespace-nowrap truncate">
              Tabela sintética que confronta o Valor Principal Contratado com o Saldo Devedor Restante Atualizado ({selectedIndiceGlobal}) e o Valor Total Efetivamente Já Pago pelo devedor em cada contrato.
            </p>
          </div>
        </div>

        {/* Index Selector & Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#DCD8CD] text-[10px] font-bold">
            <span className="text-slate-500 text-[10px]">Índice:</span>
            <select
              value={selectedIndiceGlobal}
              onChange={(e) => handleGlobalIndiceChange(e.target.value as 'INPC' | 'IPCA')}
              className="text-[10px] font-bold bg-white text-[#1C4E5E] focus:outline-hidden cursor-pointer px-1 py-0.5 border border-slate-200 rounded-md"
            >
              <option value="INPC">INPC / IBGE</option>
              <option value="IPCA">IPCA / IBGE</option>
            </select>
          </div>

          <button
            onClick={handleAddContract}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>+ Contrato</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1.5 text-xs font-bold border rounded-xl transition-all cursor-pointer ${
              isEditing ? 'bg-amber-400 text-slate-950 border-amber-500 font-black' : 'bg-white text-slate-700 border-[#DCD8CD]'
            }`}
          >
            <span>{isEditing ? 'Concluir Edição' : 'Editar'}</span>
          </button>

          <button
            onClick={() => handleGlobalIndiceChange('INPC')}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-[#DCD8CD] rounded-xl transition-all cursor-pointer"
          >
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => alert(`Definição de Saldos (${selectedIndiceGlobal}) e Valores Pagos salva com sucesso!`)}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Tabela de Definição do Saldo Devedor Atualizado */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full font-sans">
        
        {/* Banner de Cabeçalho */}
        <div className="bg-blue-50/80 p-3.5 border-b border-blue-200 text-center">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">
            DEFINIÇÃO DO VALOR DO SALDO DEVEDOR ATUALIZADO E VALOR PRINCIPAL JÁ PAGO
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            {/* Cabeçalho da Tabela */}
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] text-center border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[15%]">Credor</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[13%]">N. Contrato</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[15%]">Tipo de Crédito</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[14%]">Saldo Devedor</th>
                
                {/* Coluna Separada: ÍNDICE DE ATUALIZAÇÃO MONETÁRIA */}
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[13%]">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="leading-tight">Índice de Atualização</span>
                    <select
                      value={selectedIndiceGlobal}
                      onChange={(e) => handleGlobalIndiceChange(e.target.value as 'INPC' | 'IPCA')}
                      className="bg-white text-blue-900 font-black text-[10px] px-1.5 py-0.5 rounded border border-slate-300 cursor-pointer shadow-2xs"
                    >
                      <option value="INPC">INPC</option>
                      <option value="IPCA">IPCA</option>
                    </select>
                  </div>
                </th>

                {/* Coluna Separada: SALDO DEVEDOR ATUALIZADO */}
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[15%]">
                  Saldo Devedor Atualizado
                </th>

                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-[11%]">Vlr. Já pago</th>
                {isEditing && <th className="py-2.5 px-2 text-center w-[4%] no-print">Ações</th>}
              </tr>
            </thead>
            
            {/* Corpo da Tabela */}
            <tbody className="divide-y divide-slate-200 font-normal bg-white text-slate-900">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50 transition-colors font-normal text-slate-800"
                >
                  {/* Credor */}
                  <td className="py-2.5 px-3 text-center font-normal text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.credor}
                        onChange={(e) => handleUpdateContractField(row.id, 'credor', e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-center bg-white"
                      />
                    ) : (
                      row.credor
                    )}
                  </td>

                  {/* N. Contrato */}
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-700 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.numeroContrato}
                        onChange={(e) => handleUpdateContractField(row.id, 'numeroContrato', e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-800 text-center bg-white"
                      />
                    ) : (
                      row.numeroContrato
                    )}
                  </td>

                  {/* Tipo de Crédito */}
                  <td className="py-2.5 px-3 text-center font-normal text-slate-800 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.modalidade}
                        onChange={(e) => handleUpdateContractField(row.id, 'modalidade', e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-800 text-center bg-white"
                      />
                    ) : (
                      row.modalidade
                    )}
                  </td>

                  {/* Saldo Devedor (extraído do Módulo 6) */}
                  <td className="py-2.5 px-3 text-right font-mono font-normal text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <CurrencyInput
                        value={row.saldoBase}
                        onChange={(val) => handleUpdateContractField(row.id, 'saldoDevedorRefUltimaParcela', val)}
                        className="w-full max-w-[120px] text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-xs bg-white inline-block"
                      />
                    ) : (
                      formatCurrency(row.saldoBase)
                    )}
                  </td>

                  {/* Coluna Separada: ÍNDICE DE ATUALIZAÇÃO MONETÁRIA (Exibe apenas o Fator 7 Casas nas linhas) */}
                  <td className="py-2.5 px-3 text-center border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.0000001"
                        value={row.fatorCorrecao7Casas || (row.tipoIndiceCorrecao === 'IPCA' ? 1.0842105 : 1.0968016)}
                        onChange={(e) => handleUpdateContractField(row.id, 'fatorCorrecao7Casas', parseFloat(e.target.value) || 1.0)}
                        className="w-24 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono text-xs bg-white text-blue-900 font-bold"
                        title="Fator de Correção"
                      />
                    ) : (
                      <span className="font-mono text-xs font-extrabold text-blue-900">
                        {(row.fatorCorrecao7Casas || (row.tipoIndiceCorrecao === 'IPCA' ? 1.0842105 : 1.0968016)).toFixed(7).replace('.', ',')}
                      </span>
                    )}
                  </td>

                  {/* Coluna Separada: SALDO DEVEDOR ATUALIZADO */}
                  <td className="py-2.5 px-3 text-right font-mono font-normal text-blue-900 border-r border-slate-200">
                    {isEditing ? (
                      <CurrencyInput
                        value={row.saldoDevedorAtualizadoInpc}
                        onChange={(val) => handleUpdateContractField(row.id, 'saldoDevedorRefUltimaParcela', val)}
                        className="w-full max-w-[120px] text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-xs bg-white inline-block"
                      />
                    ) : (
                      formatCurrency(row.saldoDevedorAtualizadoInpc)
                    )}
                  </td>

                  {/* Vlr. Já pago */}
                  <td className="py-2.5 px-3 text-right font-mono font-normal text-emerald-800 border-r border-slate-200">
                    {isEditing ? (
                      <CurrencyInput
                        value={row.valorJaPago}
                        onChange={(val) => handleUpdateContractField(row.id, 'valorParcelaAtual', val / (row.qtdParcelasPagas || 1))}
                        className="w-full max-w-[120px] text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-xs bg-white inline-block"
                      />
                    ) : (
                      formatCurrency(row.valorJaPago)
                    )}
                  </td>

                  {/* Ações */}
                  {isEditing && (
                    <td className="py-2.5 px-2 text-center no-print">
                      <button
                        onClick={() => handleDeleteContract(row.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Remover Contrato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* Rodapé com Totais Finais */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase text-xs border-t-2 border-slate-300">
                <td colSpan={3} className="py-3 px-4 text-right font-black">
                  Total do Encargo Mensal ==&gt;&gt;
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm border-r border-slate-200">
                  {formatCurrency(sumSaldoDevedorBase)}
                </td>
                <td className="py-3 px-3 text-center font-mono font-black text-blue-900 text-xs border-r border-slate-200">
                  {selectedIndiceGlobal} (Fator Acumulado)
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-blue-900 text-sm border-r border-slate-200">
                  {formatCurrency(sumSaldoAtualizadoInpc)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-emerald-800 text-sm">
                  {formatCurrency(sumValorJaPago)}
                </td>
                {isEditing && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
