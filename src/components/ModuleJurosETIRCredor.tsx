import React, { useState } from 'react';
import { Percent, Trash2 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { generatePriceSchedule, formatCurrency, calculateExcelTaxaTIR, getSaldoDevedorModulo6 } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface ModuleJurosETIRCredorProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleJurosETIRCredor: React.FC<ModuleJurosETIRCredorProps> = ({
  income: _income,
  expenses: _expenses,
  contracts,
  onContractsChange,
}) => {
  const [isEditing, setIsEditing] = useState(true);

  // Parâmetros do Plano Compulsório 60x Rateio
  const taxaJurosAm = 1.48; // 1.48% a.m.
  const prazoMeses = 60; // 60 parcelas

  // 1. Cálculo do Saldo Devedor Total Original acumulado reativo
  const totalSaldoDevedorOriginal = contracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    return acc + Math.max(0, saldoBase - deducao);
  }, 0);

  // 2. Cálculo do Saldo Devedor Total Atualizado acumulado reativo
  const totalSaldoDevedorAtualizado = contracts.reduce((acc, c) => {
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoAjustado = Math.max(0, saldoBase - deducao);
    const fator = c.fatorCorrecao7Casas || 1.0;
    return acc + (saldoAjustado * fator);
  }, 0);

  // PMT Global do Plano via Tabela Price
  const { pmt: pmtGlobalTotal } = generatePriceSchedule(totalSaldoDevedorAtualizado, taxaJurosAm, prazoMeses);

  // Totais acumulados para o rodapé
  let sumValorPrincipal = 0;
  let sumTotalASerPago = 0;
  let sumJurosPagos = 0;

  const rows = contracts.map((c) => {
    // 1. Valor Principal do Contrato
    const valorPrincipal = c.valorLiberadoContrato || 0;

    // 2. Prestações Pagas (Original)
    const prestacoesPagas = c.valorParcelaAtual * c.qtdParcelasPagas;

    // 3. Prestações Repactuadas (Plano 60x Rateio Price)
    const saldoBase = getSaldoDevedorModulo6(c);
    const deducao = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoDevedorOriginal = Math.max(0, saldoBase - deducao);

    const percentualRateio = totalSaldoDevedorOriginal > 0 
      ? (saldoDevedorOriginal / totalSaldoDevedorOriginal) * 100 
      : 0;

    const rawPmtIndividual = pmtGlobalTotal * (percentualRateio / 100);
    const pmtMensalIndividual = Math.round(rawPmtIndividual * 100) / 100;
    const prestacoesRepactuadas = Math.round((pmtMensalIndividual * prazoMeses) * 100) / 100;

    // 4. Total a ser pago (repactuação) = Pagas + Repactuadas
    const totalASerPago = prestacoesPagas + prestacoesRepactuadas;

    // 5. Juros Pagos ao Credor = Total a ser pago - Valor Principal
    const jurosPagosAoCredor = Math.max(0, totalASerPago - valorPrincipal);

    // 6. Taxa Interna de Retorno (TIR % a.m. e % a.a.) baseada na Função TAXA do Excel:
    // TAXA(nper = pagas + repactuadas, pgto = 0, va = -valorPrincipal, vf = prestacoesPagas + prestacoesRepactuadas, tipo = 0)
    const tirResult = calculateExcelTaxaTIR(
      valorPrincipal,
      prestacoesPagas,
      prestacoesRepactuadas,
      c.qtdParcelasPagas || 0,
      prazoMeses
    );
    const tirMes = tirResult.tirAmPercent;
    const tirAno = tirResult.tirAaPercent;

    sumValorPrincipal += valorPrincipal;
    sumTotalASerPago += totalASerPago;
    sumJurosPagos += jurosPagosAoCredor;

    return {
      ...c,
      valorPrincipal,
      totalASerPago,
      jurosPagosAoCredor,
      tirMes,
      tirAno,
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
      modalidade: 'Empréstimo Pessoal',
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
    if (confirm('Deseja remover este contrato do cálculo de juros e TIR?')) {
      onContractsChange(contracts.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 14: Cálculo dos Juros Pagos e da Taxa Interna de Retorno do Credor (TIR)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Demonstrativo de Juros Auferidos pelos Bancos e Rentabilidade Efetiva (% a.m. e % a.a.)
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => alert('Cálculo de Juros e TIR do Credor salvo com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Tabela de Cálculo dos Juros e TIR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full font-sans">
        
        {/* Banner de Cabeçalho */}
        <div className="bg-blue-50/80 p-3.5 border-b border-blue-200 text-center">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-900">
            CÁLCULO DOS JUROS PAGOS E DA TAXA INTERNA DE RETORNO DO CREDOR
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            {/* Cabeçalho da Tabela - Colunas Centralizadas e Redimensionadas */}
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] text-center border-b border-slate-300">
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[18%]">Credor</th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[11%]">N.º Contrato</th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[15%]">Tipo de Crédito</th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[13%]">Valor Principal</th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[14%]">
                  Total a Ser Pago<br />(Repactuação)
                </th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[13%]">
                  Juros Pagos ao<br />Credor
                </th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[8%]">TIR (% a.m.)</th>
                <th className="py-3 px-3 text-center align-middle border-r border-slate-300 w-[8%]">TIR (% a.a.)</th>
                {isEditing && <th className="py-3 px-2 text-center align-middle w-[5%] no-print">Ações</th>}
              </tr>
            </thead>
            
            {/* Corpo da Tabela Branco com Linhas Pretas Identico à Imagem */}
            <tbody className="divide-y divide-black font-normal bg-white text-slate-900">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-100 transition-colors font-normal border-b border-black"
                >
                  {/* Credor */}
                  <td className="py-2.5 px-3 text-left font-normal text-slate-900 border-r border-black">
                    {isEditing ? (
                      <input
                        type="text"
                        value={row.credor}
                        onChange={(e) => handleUpdateContractField(row.id, 'credor', e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 bg-white"
                      />
                    ) : (
                      row.credor
                    )}
                  </td>

                  {/* N. Contrato */}
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-800 border-r border-black">
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
                  <td className="py-2.5 px-3 text-center font-normal text-slate-800 border-r border-black">
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

                  {/* Valor Principal */}
                  <td className="py-2.5 px-3 text-right font-mono font-normal text-slate-900 border-r border-black">
                    {isEditing ? (
                      <CurrencyInput
                        value={row.valorPrincipal}
                        onChange={(val) => handleUpdateContractField(row.id, 'valorLiberadoContrato', val)}
                        className="w-28 text-right px-2 py-0.5 border border-slate-300 rounded font-normal text-slate-900 text-xs bg-white"
                      />
                    ) : (
                      formatCurrency(row.valorPrincipal)
                    )}
                  </td>

                  {/* Total a ser pago (repactuação) */}
                  <td className="py-2.5 px-3 text-right font-mono font-normal text-slate-900 border-r border-black bg-slate-50/50">
                    {formatCurrency(row.totalASerPago)}
                  </td>

                  {/* Juros Pagos ao Credor */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950 border-r border-black bg-amber-50">
                    {formatCurrency(row.jurosPagosAoCredor)}
                  </td>

                  {/* TIR (% a.m.) - 2 casas decimais */}
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-900 border-r border-black">
                    {row.tirMes.toFixed(2).replace('.', ',')}%
                  </td>

                  {/* TIR (% a.a.) - 2 casas decimais ex: 3,87% */}
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-900 border-r border-black">
                    {row.tirAno.toFixed(2).replace('.', ',')}%
                  </td>

                  {/* Ação de Exclusão por Linha */}
                  {isEditing && (
                    <td className="py-2.5 px-2 text-center no-print">
                      <button
                        onClick={() => handleDeleteContract(row.id)}
                        className="p-1 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                        title="Excluir Contrato"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* Rodapé Limpo */}
            <tfoot className="bg-slate-100 text-slate-900 font-black text-xs uppercase border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right font-black">
                  TOTAL CONSOLIDADO
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200">
                  {formatCurrency(sumValorPrincipal)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-slate-900 text-xs border-r border-slate-200">
                  {formatCurrency(sumTotalASerPago)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-blue-900 text-sm border-r border-slate-200">
                  {formatCurrency(sumJurosPagos)}
                </td>
                <td colSpan={2} className="py-3 px-3 text-center font-mono font-bold text-slate-700 text-xs">
                  -- Taxas TIR Auferidas --
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
