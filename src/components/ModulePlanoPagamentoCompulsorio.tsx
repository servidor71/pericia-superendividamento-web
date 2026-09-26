import React, { useState, useEffect } from 'react';
import { TableProperties, Sparkles, Trash2 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { generatePriceSchedule, formatCurrency, getSaldoDevedorModulo6 } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModulePlanoCompulsorioProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
  taxaJurosAm?: number;
  onTaxaJurosChange?: (taxa: number) => void;
}

export const ModulePlanoPagamentoCompulsorio: React.FC<ModulePlanoCompulsorioProps> = ({
  income: _income,
  expenses: _expenses,
  contracts,
  onContractsChange,
  taxaJurosAm: taxaJurosProp = 1.63,
  onTaxaJurosChange,
}) => {
  const [isEditing, setIsEditing] = useState(true);

  // Parâmetros editáveis do Plano Compulsório 60x Rateio
  const [taxaJurosAm, setTaxaJurosAmState] = useState<number>(taxaJurosProp);
  const [prazoMeses, setPrazoMeses] = useState<number>(60); // 60 parcelas

  useEffect(() => {
    setTaxaJurosAmState(taxaJurosProp);
  }, [taxaJurosProp]);

  const handleTaxaJurosChange = (val: number) => {
    setTaxaJurosAmState(val);
    if (onTaxaJurosChange) {
      onTaxaJurosChange(val);
    }
  };

  // 1. Cálculo do Saldo Devedor TOTAL ORIGINAL (antes da atualização monetária)
  const totalSaldoDevedorOriginal = contracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    return acc + Math.max(0, saldoBase - deducao);
  }, 0);

  // 2. Cálculo do Saldo Devedor TOTAL ATUALIZADO (após correção monetária INPC/IPCA)
  const rawTotalAtualizado = contracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoAjustado = Math.max(0, saldoBase - deducao);
    const fator = c.fatorCorrecao7Casas || 1.0;
    return acc + (saldoAjustado * fator);
  }, 0);
  const totalSaldoDevedorAtualizado = Math.round(rawTotalAtualizado * 100) / 100;

  // PMT Global do Plano via Tabela Price (com taxa e prazo)
  const { pmt: pmtGlobalTotal } = generatePriceSchedule(totalSaldoDevedorAtualizado, taxaJurosAm, prazoMeses);

  // Linhas com Rateio Proporcional Estrito com base no Saldo Devedor ORIGINAL (Art. 104-B §4º CDC)
  let sumTotalPago = 0;

  const rows = contracts.map((c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoDevedorOriginal = Math.max(0, saldoBase - deducao);
    
    const fator = c.fatorCorrecao7Casas || 1.0;
    const saldoDevedorAtualizado = saldoDevedorOriginal * fator;

    // Percentual de rateio calculado COM BASE NO TOTAL DO SALDO DEVEDOR ORIGINAL (antes da atualização)
    const percentualRateio = totalSaldoDevedorOriginal > 0 
      ? (saldoDevedorOriginal / totalSaldoDevedorOriginal) * 100 
      : 0;

    // PMT Mensal individual proporcional (arredondada para 2 casas decimais)
    const rawPmtIndividual = pmtGlobalTotal * (percentualRateio / 100);
    const pmtMensalIndividual = Math.round(rawPmtIndividual * 100) / 100;

    // Total pago no plano = PMT Mensal (2 casas decimais) * prazo em meses do plano
    const totalPagoNoPlano = Math.round((pmtMensalIndividual * prazoMeses) * 100) / 100;

    sumTotalPago += totalPagoNoPlano;

    return {
      ...c,
      saldoDevedorOriginal,
      saldoDevedorAtualizado,
      percentualRateio,
      pmtMensalIndividual,
      totalPagoNoPlano,
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
      modalidade: 'Crédito Pessoal',
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
      tipoIndiceCorrecao: 'INPC',
      fatorCorrecao7Casas: 1.0,
      dataReferenciaUltimoPagamento: new Date().toISOString().split('T')[0],
      saldoDevedorRefUltimaParcela: 0,
      taxaMediaBacenMes: 0,
    };
    onContractsChange([...contracts, newContract]);
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Deseja remover este contrato do plano de repactuação?')) {
      onContractsChange(contracts.filter(c => c.id !== id));
    }
  };

  const handleResetToDefault = () => {
    handleTaxaJurosChange(1.63);
    setPrazoMeses(60);
  };

  return (
    <div className="space-y-6">
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <TableProperties className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 18: Plano de Pagamento Compulsório ({prazoMeses} Parcelas - Rateio Proporcional Price)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Rateio Proporcional Estrito calculated sobre o Saldo Devedor Original (Art. 104-B, §4º, CDC)
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DCD8CD] text-xs">
            <span className="font-bold text-slate-700">Juros:</span>
            <input
              type="number"
              step="0.01"
              disabled={!isEditing}
              value={taxaJurosAm}
              onChange={(e) => handleTaxaJurosChange(parseFloat(e.target.value) || 0)}
              className="w-14 px-1 py-0.5 border border-[#DCD8CD] rounded-lg font-black text-[#1C4E5E] text-center bg-white"
            />
            <span className="font-bold text-slate-500">% a.m.</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DCD8CD] text-xs">
            <span className="font-bold text-slate-700">Prazo:</span>
            <input
              type="number"
              disabled={!isEditing}
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(parseInt(e.target.value) || 60)}
              className="w-12 px-1 py-0.5 border border-[#DCD8CD] rounded-lg font-black text-slate-900 text-center bg-white"
            />
            <span className="font-bold text-slate-500">meses</span>
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
            onClick={handleResetToDefault}
            className="px-3 py-1.5 text-xs font-bold bg-white text-slate-700 border border-[#DCD8CD] rounded-xl transition-all cursor-pointer"
          >
            <span>Restaurar</span>
          </button>

          <button
            onClick={() => alert('Plano Compulsório de 60 parcelas salvo com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Synchronized Live Flow Notice Card - Ultra Slim Single Line */}
      <div className="bg-blue-50/80 text-slate-900 px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-2 font-sans">
        <div className="flex items-center gap-2 overflow-hidden shrink min-w-0">
          <div className="flex items-center space-x-1.5 text-blue-900 font-black text-xs uppercase tracking-wider shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>RATEIO PROPORCIONAL:</span>
          </div>
          <p className="text-xs text-slate-600 font-medium whitespace-nowrap truncate">
            Calculado estritamente sobre a soma dos Saldos Devedores Originais (Art. 104-B, §4º, CDC) via Tabela Price.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-blue-900 shrink-0">
          <span>Orig.: <strong>{formatCurrency(totalSaldoDevedorOriginal)}</strong></span>
          <span>• Corrig.: <strong>{formatCurrency(totalSaldoDevedorAtualizado)}</strong></span>
          <span className="bg-blue-100 text-blue-950 px-2 py-0.5 rounded font-black border border-blue-300">
            PMT: {formatCurrency(pmtGlobalTotal)}
          </span>
        </div>
      </div>

      {/* Tabela de Rateio Proporcional Estrito no Padrão da Imagem */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full font-sans">
        
        {/* Banner de Cabeçalho */}
        <div className="bg-blue-50/80 p-3.5 border-b border-blue-200 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wide text-blue-900">
            8. PLANO DE PAGAMENTO COMPULSÓRIO - {prazoMeses} PARCELAS - Taxa {taxaJurosAm.toString().replace('.', ',')}% a.m. (PRICE)
          </h2>
          <span className="text-xs font-mono font-bold text-blue-700">
            Rateio Calculado pelo Saldo Original (Art. 104-B §4º CDC)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            {/* Cabeçalho da Tabela */}
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] text-center border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">Credor</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">Contrato</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">Saldo Devedor Atualizado</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">% do Total do Saldo Devedor</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">PMT Mensal</th>
                <th className="py-2.5 px-3 border-r border-slate-200 text-center w-2/12">Total Pago no Plano</th>
                {isEditing && <th className="py-2.5 px-2 text-center w-1/12 no-print">Ações</th>}
              </tr>
            </thead>
            
            {/* Corpo da Tabela com Fontes em Peso Normal e Edição Bidirecional */}
            <tbody className="divide-y divide-slate-200 font-normal">
              {rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/80 transition-colors text-slate-800 font-normal`}
                >
                  {/* Credor */}
                  <td className="py-2.5 px-4 text-center font-normal text-slate-900 border-r border-slate-200">
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

                  {/* Contrato */}
                  <td className="py-2.5 px-4 text-center font-mono font-normal text-slate-700 border-r border-slate-200">
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

                  {/* Saldo Devedor Restante Atualizado (Editável com Recálculo Instantâneo) */}
                  <td className="py-2.5 px-4 text-right font-mono font-normal text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <CurrencyInput
                        value={row.saldoDevedorAtualizado}
                        onChange={(val) => handleUpdateContractField(row.id, 'saldoDevedorRefUltimaParcela', val)}
                        className="w-32 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-xs bg-white"
                      />
                    ) : (
                      formatCurrency(row.saldoDevedorAtualizado)
                    )}
                  </td>

                  {/* % do Total do Saldo Devedor (Calculado Dinamicamente com base no Saldo Devedor ORIGINAL) */}
                  <td className="py-2.5 px-4 text-center font-mono font-normal text-slate-800 border-r border-slate-200">
                    {row.percentualRateio.toFixed(2).replace('.', ',')}%
                  </td>

                  {/* PMT Mensal (Calculada Dinamicamente) */}
                  <td className="py-2.5 px-4 text-right font-mono font-normal text-blue-900 border-r border-slate-200">
                    {formatCurrency(row.pmtMensalIndividual)}
                  </td>

                  {/* Total Pago no Plano */}
                  <td className="py-2.5 px-4 text-right font-mono font-normal text-slate-900">
                    {formatCurrency(row.totalPagoNoPlano)}
                  </td>

                  {/* Ação de Exclusão por Linha */}
                  {isEditing && (
                    <td className="py-2.5 px-2 text-center no-print">
                      <button
                        onClick={() => handleDeleteContract(row.id)}
                        className="p-1 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                        title="Excluir Contrato do Plano"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* Rodapé com Totais em Negrito */}
            <tfoot className="bg-slate-100 text-slate-900 font-black uppercase text-xs border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3 px-4 text-left font-black text-slate-900">
                  TOTAL DO ENCARGO MENSAL ==&gt;&gt;
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-950 border-r border-slate-200">
                  {formatCurrency(totalSaldoDevedorAtualizado)}
                </td>
                <td className="py-3 px-4 text-center font-mono font-black text-slate-900 border-r border-slate-200">
                  100,00%
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-blue-900 border-r border-slate-200 text-sm">
                  {formatCurrency(pmtGlobalTotal)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm" colSpan={isEditing ? 2 : 1}>
                  {formatCurrency(sumTotalPago)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
