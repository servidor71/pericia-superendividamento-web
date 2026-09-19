import React, { useState } from 'react';
import { TrendingDown, Trash2 } from 'lucide-react';
import type { Contract, IncomeData, ExpenseData } from '../types';
import { formatCurrency } from '../services/calculations';

interface ModuleCenarioRevisionalBacenProps {
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  onContractsChange: (updated: Contract[]) => void;
}

export const ModuleCenarioRevisionalBacen: React.FC<ModuleCenarioRevisionalBacenProps> = ({
  income: _income,
  expenses: _expenses,
  contracts,
  onContractsChange,
}) => {
  const [isEditing, setIsEditing] = useState(true);

  // Helper para calcular a PMT pela Taxa Média BACEN de cada contrato
  const calculatePmtBacen = (c: Contract) => {
    const vp = c.valorLiberadoContrato || 5000;
    const n = c.qtdParcelasTotal || 60;
    const iBacen = (c.taxaMediaBacenMes || 1.26) / 100;

    if (iBacen <= 0 || n <= 0) return vp / (n || 1);
    return (vp * (iBacen * Math.pow(1 + iBacen, n))) / (Math.pow(1 + iBacen, n) - 1);
  };

  // Cálculo da PMT contratual vs PMT BACEN acumulada
  let totalEncargoContratual = 0;
  let totalEncargoBacen = 0;

  const rows = contracts.map((c) => {
    const pmtContratual = c.valorParcelaAtual || 0;
    const pmtBacen = calculatePmtBacen(c);
    const economiaMensal = Math.max(0, pmtContratual - pmtBacen);

    totalEncargoContratual += pmtContratual;
    totalEncargoBacen += pmtBacen;

    return {
      ...c,
      pmtContratual,
      pmtBacen,
      economiaMensal,
    };
  });

  const totalEconomiaMensal = totalEncargoContratual - totalEncargoBacen;

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
      fatorCorrecao7Casas: 1.0160724,
      dataReferenciaUltimoPagamento: new Date().toISOString().split('T')[0],
      saldoDevedorRefUltimaParcela: 5000.00,
      taxaMediaBacenMes: 1.45,
    };
    onContractsChange([...contracts, newContract]);
  };

  const handleDeleteContract = (id: string) => {
    if (confirm('Deseja remover este contrato do cenário revisional BACEN?')) {
      onContractsChange(contracts.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 11: Cenário Revisional com Taxa Média de Mercado (BACEN)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Recálculo da Prestação Mensal Utilizando a Taxa Média BACEN • Economia: {formatCurrency(totalEconomiaMensal)}/mês
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
            onClick={() => alert('Cenário Revisional BACEN salvo com sucesso!')}
            className="px-4 py-1.5 text-xs font-black bg-[#2E7D62] text-white border border-[#2E7D62] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Tabela do Cenário Revisional BACEN */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full font-sans">
        
        {/* Banner de Cabeçalho */}
        <div className="bg-blue-50/80 p-3.5 border-b border-blue-200 text-center">
          <h2 className="text-xs font-black uppercase tracking-wider text-blue-900">
            CENÁRIO REVISIONAL COM TAXA MÉDIA DE MERCADO | BACEN
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            {/* Cabeçalho da Tabela - Colunas Centralizadas e Redimensionadas */}
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] text-center border-b border-slate-300">
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[28%]">Credor</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[18%]">N.º Contrato</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[26%]">Tipo de Crédito</th>
                <th className="py-2.5 px-3 border-r border-slate-300 text-center align-middle w-[23%]">Encargo Mensal Taxa Média BACEN</th>
                {isEditing && <th className="py-2.5 px-2 text-center align-middle w-[5%] no-print">Ações</th>}
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
                  <td className="py-2.5 px-3 text-center font-normal text-slate-700 border-r border-slate-200">
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

                  {/* Encargo Mensal Taxa Media BACEN */}
                  <td className="py-2.5 px-3 text-center font-mono font-normal text-slate-900 border-r border-slate-200">
                    {formatCurrency(row.pmtBacen)}
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

            {/* Rodapé com Totais Finais do Cenário Revisional BACEN */}
            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 text-center font-black border-r border-slate-200" colSpan={3}>
                  TOTAL ENCARGO MENSAL COM TAXA MÉDIA BACEN ==&gt;&gt;
                </td>
                <td className="py-3 px-4 text-right font-black font-mono text-emerald-800 text-sm" colSpan={isEditing ? 2 : 1}>
                  {formatCurrency(totalEncargoBacen)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
};
