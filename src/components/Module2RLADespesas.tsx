import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, ShieldCheck, Building2, FileText, CheckCircle2 } from 'lucide-react';
import type { IncomeData, ExpenseData, ContrachequeEmpregador, DescontoFolhaItem, CustomExpenseItem, Contract } from '../types';
import { initialIncomeData, initialExpenseData } from '../mockData';
import { calculateRLA, calculateTotalExpenses, formatCurrency } from '../services/calculations';
import { CurrencyInput } from './CurrencyInput';

interface Module2Props {
  income: IncomeData;
  expenses: ExpenseData;
  onIncomeChange: (updated: IncomeData) => void;
  onExpensesChange: (updated: ExpenseData) => void;
  contracts?: Contract[];
}

export const Module2RLADespesas: React.FC<Module2Props> = ({
  income,
  expenses,
  onIncomeChange,
  onExpensesChange,
  contracts = [],
}) => {
  const [dreMode, setDreMode] = useState<'antes' | 'depois'>('antes');
  const [isEditing, setIsEditing] = useState(true);

  const contracheques = income.contrachequesPorEmpregador || [];

  const rlaAntesTotal = calculateRLA(income);
  const totalDespesas = calculateTotalExpenses(expenses);
  const minimoExistencial = expenses.minimoExistencialConfig || 600;

  // Mapeamento de Empréstimos Consignados x Não Consignados Repactuados
  const consignadosRepactuadosMap: Record<string, number> = {};

  // Cálculo da RLA Após o Plano
  let rlaDepoisTotal = 0;
  contracheques.forEach(emp => {
    let descontosRepactuadosEmp = 0;
    (emp.outrosDescontosFolha || []).forEach(d => {
      const vRepactuado = consignadosRepactuadosMap[d.id] !== undefined ? consignadosRepactuadosMap[d.id] : (d.valor * 0.45);
      descontosRepactuadosEmp += vRepactuado;
    });
    const liquidoEmpApos = emp.rendimentoBruto - (emp.rppsInss + emp.irrf + emp.planoSaudeFolha + descontosRepactuadosEmp);
    rlaDepoisTotal += liquidoEmpApos;
  });

  // Margem Disponível & Recursos Livres
  const margemDisponivelAntes = Math.max(0, rlaAntesTotal - totalDespesas - minimoExistencial);
  const margemDisponivelAposBruta = rlaDepoisTotal - minimoExistencial;
  const totalNaoConsignados = contracts
    .filter(c => c.modalidade && (c.modalidade.toLowerCase().includes('não consignado') || c.modalidade.toLowerCase().includes('pessoal')))
    .reduce((acc, c) => acc + (c.valorParcelaAtual || 0), 0);
  const rendaDisponivelApos = margemDisponivelAposBruta - totalDespesas - totalNaoConsignados;
  const totalRecursosLivresApos = rendaDisponivelApos + minimoExistencial;

  // --- Handlers de Empregadores / Contracheques ---
  const handleAddEmpregador = () => {
    const newEmp: ContrachequeEmpregador = {
      id: `emp_${Date.now()}`,
      nomeEmpregador: '',
      rendimentoBruto: 0,
      rppsInss: 0,
      irrf: 0,
      planoSaudeFolha: 0,
      fonteDoc: '',
      outrosDescontosFolha: [],
    };
    onIncomeChange({
      ...income,
      contrachequesPorEmpregador: [...contracheques, newEmp],
    });
  };

  const handleUpdateEmpregador = (id: string, field: keyof ContrachequeEmpregador, val: any) => {
    onIncomeChange({
      ...income,
      contrachequesPorEmpregador: contracheques.map(emp =>
        emp.id === id ? { ...emp, [field]: val } : emp
      ),
    });
  };

  const handleRemoveEmpregador = (id: string) => {
    if (confirm('Deseja remover este contracheque/empregador?')) {
      onIncomeChange({
        ...income,
        contrachequesPorEmpregador: contracheques.filter(emp => emp.id !== id),
      });
    }
  };

  // --- Handlers de Descontos Consignados em Folha por Empregador ---
  const handleAddDescontoFolha = (empId: string) => {
    const newDesc: DescontoFolhaItem = {
      id: `desc_${Date.now()}`,
      descricao: '',
      valor: 0,
      fonteDoc: '',
    };
    onIncomeChange({
      ...income,
      contrachequesPorEmpregador: contracheques.map(emp =>
        emp.id === empId
          ? { ...emp, outrosDescontosFolha: [...(emp.outrosDescontosFolha || []), newDesc] }
          : emp
      ),
    });
  };

  const handleUpdateDescontoFolha = (empId: string, descId: string, field: keyof DescontoFolhaItem, val: any) => {
    onIncomeChange({
      ...income,
      contrachequesPorEmpregador: contracheques.map(emp =>
        emp.id === empId
          ? {
              ...emp,
              outrosDescontosFolha: (emp.outrosDescontosFolha || []).map(d =>
                d.id === descId ? { ...d, [field]: val } : d
              ),
            }
          : emp
      ),
    });
  };

  const handleRemoveDescontoFolha = (empId: string, descId: string) => {
    onIncomeChange({
      ...income,
      contrachequesPorEmpregador: contracheques.map(emp =>
        emp.id === empId
          ? {
              ...emp,
              outrosDescontosFolha: (emp.outrosDescontosFolha || []).filter(d => d.id !== descId),
            }
          : emp
      ),
    });
  };

  // --- Handlers de Despesas Mensais Essenciais ---
  const handleExpenseFieldChange = (field: keyof ExpenseData, val: any) => {
    onExpensesChange({ ...expenses, [field]: val });
  };

  const handleAddCustomExpense = () => {
    const newExp: CustomExpenseItem = {
      id: `exp_${Date.now()}`,
      descricao: '',
      valor: 0,
      fonteDoc: '',
    };
    onExpensesChange({
      ...expenses,
      outrasDespesasIndividuais: [...(expenses.outrasDespesasIndividuais || []), newExp],
    });
  };

  const handleUpdateCustomExpense = (id: string, field: keyof CustomExpenseItem, val: any) => {
    onExpensesChange({
      ...expenses,
      outrasDespesasIndividuais: (expenses.outrasDespesasIndividuais || []).map(item =>
        item.id === id ? { ...item, [field]: val } : item
      ),
    });
  };

  const handleRemoveCustomExpense = (id: string) => {
    onExpensesChange({
      ...expenses,
  outrasDespesasIndividuais: (expenses.outrasDespesasIndividuais || []).filter(item => item.id !== id),
    });
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 font-sans">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 3: RLA - Renda Líquida Mensal Ajustada, Despesas & Mínimo Existencial
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Renda Líquida Ajustada por Empregador/Contracheque (Antes x Após o Plano Compulsório)
            </p>
          </div>
        </div>

        {/* Right side: Mode Switcher + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-white p-1 rounded-xl border border-[#DCD8CD]">
            <button
              onClick={() => setDreMode('antes')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                dreMode === 'antes'
                  ? 'bg-[#1C4E5E] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              RLA 1 - Antes do Plano
            </button>
            <button
              onClick={() => setDreMode('depois')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                dreMode === 'depois'
                  ? 'bg-[#2E7D62] text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              RLA 2 - Após o Plano
            </button>
          </div>

          <button
            onClick={handleAddEmpregador}
            className="px-3.5 py-1 text-xs font-black bg-[#1C4E5E] hover:bg-[#153E4B] text-white border border-[#1C4E5E] rounded-full transition-all shadow-2xs cursor-pointer"
          >
            <span>+ Contracheque</span>
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
            onClick={() => {
              if (dreMode === 'antes') {
                onIncomeChange({ ...income, contrachequesPorEmpregador: [], outrasReceitasIndividuais: [] });
              } else {
                onExpensesChange({ ...expenses, outrasDespesasIndividuais: [] });
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
              const modeName = dreMode === 'antes' ? 'RLA 1 (Antes do Plano)' : 'RLA 2 (Após o Plano / Despesas)';
              if (confirm(`Deseja excluir permanentemente os registros da aba "${modeName}"?`)) {
                if (dreMode === 'antes') {
                  onIncomeChange({ ...income, contrachequesPorEmpregador: [], outrasReceitasIndividuais: [] });
                } else {
                  onExpensesChange({ ...expenses, outrasDespesasIndividuais: [] });
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
              if (dreMode === 'antes') {
                if (confirm('Deseja restaurar os dados de RLA 1 (Antes do Plano) para os valores iniciais?')) {
                  onIncomeChange(initialIncomeData);
                }
              } else {
                if (confirm('Deseja restaurar os dados de RLA 2 (Após o Plano) para os valores iniciais?')) {
                  onExpensesChange(initialExpenseData);
                }
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert(`Dados de ${dreMode === 'antes' ? 'RLA 1 (Antes do Plano)' : 'RLA 2 (Após o Plano)'} salvos com sucesso!`)}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DRE ANTES DO PLANO COMPULSÓRIO                                    */}
      {/* ========================================================================= */}
      {dreMode === 'antes' ? (
        <div className="space-y-6">
          
          {/* RENDA LÍQUIDA MENSAL AJUSTADA (RLA) - ANTES */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span className="text-slate-900 font-black text-sm uppercase tracking-normal">RENDA LÍQUIDA MENSAL AJUSTADA (RLA) - ANTES DO PLANO COMPULSÓRIO</span>
              </div>
              <span className="text-slate-900 font-mono font-black text-xs">
                RLA CONSOLIDADA: {formatCurrency(rlaAntesTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITEM / RUBRICA</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">FONTE / DOCUMENTO DE COMPROVAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contracheques.map((emp) => {
                    const totalDescontosConsignados = (emp.outrosDescontosFolha || []).reduce((acc, d) => acc + d.valor, 0);
                    const liquidoEmpregador = emp.rendimentoBruto - (emp.rppsInss + emp.irrf + emp.planoSaudeFolha + totalDescontosConsignados);

                    return (
                      <React.Fragment key={emp.id}>
                        
                        <tr className="bg-amber-50/70 border-t-2 border-amber-200">
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            <input
                              type="text"
                              value={emp.nomeEmpregador}
                              onChange={(e) => handleUpdateEmpregador(emp.id, 'nomeEmpregador', e.target.value)}
                              className="w-full px-2 py-0.5 border border-slate-300 rounded font-bold text-slate-900 text-xs bg-white"
                              placeholder="Nome do Empregador (ex: Salário Bruto TST)"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <CurrencyInput
                              value={emp.rendimentoBruto}
                              onChange={(v) => handleUpdateEmpregador(emp.id, 'rendimentoBruto', v)}
                              className="w-36 text-right font-extrabold text-slate-900"
                            />
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              value={emp.fonteDoc || ''}
                              onChange={(e) => handleUpdateEmpregador(emp.id, 'fonteDoc', e.target.value)}
                              className="w-full px-2 py-0.5 border border-slate-300 rounded text-xs text-slate-600 bg-white"
                              placeholder="Ex: Contracheque TST - abr/2026 (ID274529674, pág.39)"
                            />
                          </td>
                        </tr>

                        <tr className="bg-white hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) RPPS / INSS</td>
                          <td className="py-2 px-4 text-right">
                            <CurrencyInput
                              value={emp.rppsInss}
                              onChange={(v) => handleUpdateEmpregador(emp.id, 'rppsInss', v)}
                              className="w-36 text-right text-red-700 font-normal"
                            />
                          </td>
                          <td className="py-2 px-4 text-slate-500 font-normal">{emp.fonteDoc || 'Contracheque em folha'}</td>
                        </tr>

                        <tr className="bg-white hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) IRRF Retido na Fonte</td>
                          <td className="py-2 px-4 text-right">
                            <CurrencyInput
                              value={emp.irrf}
                              onChange={(v) => handleUpdateEmpregador(emp.id, 'irrf', v)}
                              className="w-36 text-right text-red-700 font-normal"
                            />
                          </td>
                          <td className="py-2 px-4 text-slate-500 font-normal">{emp.fonteDoc || 'Contracheque em folha'}</td>
                        </tr>

                        <tr className="bg-white hover:bg-slate-50">
                          <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) Plano de Saúde (Consolidado)</td>
                          <td className="py-2 px-4 text-right">
                            <CurrencyInput
                              value={emp.planoSaudeFolha}
                              onChange={(v) => handleUpdateEmpregador(emp.id, 'planoSaudeFolha', v)}
                              className="w-36 text-right text-red-700 font-normal"
                            />
                          </td>
                          <td className="py-2 px-4 text-slate-500 font-normal">{emp.fonteDoc || 'Contracheque em folha'}</td>
                        </tr>

                        {(emp.outrosDescontosFolha || []).map((desc) => (
                          <tr key={desc.id} className="bg-white hover:bg-slate-50">
                            <td className="py-2 px-4 text-slate-700 pl-8 font-normal flex items-center gap-2">
                              <input
                                type="text"
                                value={desc.descricao}
                                onChange={(e) => handleUpdateDescontoFolha(emp.id, desc.id, 'descricao', e.target.value)}
                                className="flex-1 px-2 py-0.5 border border-slate-300 rounded text-xs font-normal"
                              />
                              <button
                                onClick={() => handleRemoveDescontoFolha(emp.id, desc.id)}
                                className="text-slate-400 hover:text-red-600 p-0.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                            <td className="py-2 px-4 text-right">
                              <CurrencyInput
                                value={desc.valor}
                                onChange={(v) => handleUpdateDescontoFolha(emp.id, desc.id, 'valor', v)}
                                className="w-36 text-right text-red-700 font-normal"
                              />
                            </td>
                            <td className="py-2 px-4 font-normal text-slate-500">{desc.fonteDoc || 'Contracheque em folha'}</td>
                          </tr>
                        ))}

                        <tr className="bg-slate-50/50">
                          <td colSpan={3} className="py-1 px-4 text-left pl-8">
                            <button
                              onClick={() => handleAddDescontoFolha(emp.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Adicionar Desconto em Folha para {emp.nomeEmpregador}</span>
                            </button>
                          </td>
                        </tr>

                        <tr className="bg-blue-50/80 font-bold text-blue-950 border-b border-slate-300">
                          <td className="py-2.5 px-4 uppercase text-xs font-extrabold flex items-center justify-between">
                            <span>Líquido {emp.nomeEmpregador}</span>
                            {contracheques.length > 1 && (
                              <button
                                onClick={() => handleRemoveEmpregador(emp.id)}
                                className="text-red-600 hover:text-red-800 text-[10px] underline ml-2 font-normal"
                              >
                                Excluir Fonte
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right font-extrabold text-sm text-blue-950">
                            {formatCurrency(liquidoEmpregador)}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 text-[11px] font-bold">Renda Líquida Disponível em Folha</td>
                        </tr>

                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-100 text-blue-950 font-extrabold text-xs border-t-2 border-blue-400">
                    <td className="py-3 px-4 uppercase font-extrabold">RENDA LÍQUIDA AJUSTADA (RLA)</td>
                    <td className="py-3 px-4 text-right text-blue-950 font-extrabold text-base">{formatCurrency(rlaAntesTotal)}</td>
                    <td className="py-3 px-4 text-blue-950 font-extrabold">Total Consolidado da Renda Ajustada</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* DESPESAS MENSAIS ESSENCIAIS */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-md overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <span className="text-slate-900 font-black text-sm uppercase tracking-normal">DESPESAS MENSAIS ESSENCIAIS - ANTES DO PLANO COMPULSÓRIO</span>
              </div>
              <span className="text-slate-900 font-mono font-black text-xs">
                TOTAL DE DESPESAS: {formatCurrency(totalDespesas)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITENS / DESPESAS ESSENCIAIS</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">FONTE / COMPROVAÇÃO DE DESPESAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  <tr className="bg-white hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-normal text-slate-900">Aluguel Mensal / Moradia</td>
                    <td className="py-2.5 px-4 text-right">
                      <CurrencyInput
                        value={expenses.moradia}
                        onChange={(v) => handleExpenseFieldChange('moradia', v)}
                        className="w-36 text-right font-normal"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-normal text-slate-600">
                      <input
                        type="text"
                        value={expenses.fonteMoradia ?? 'Comprovante de pagamento de moradia'}
                        onChange={(e) => handleExpenseFieldChange('fonteMoradia', e.target.value)}
                        placeholder="Fonte / Comprovação de moradia..."
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-normal text-slate-700 bg-white"
                      />
                    </td>
                  </tr>

                  <tr className="bg-white hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-normal text-slate-900">Alimentação & Supermercado</td>
                    <td className="py-2.5 px-4 text-right">
                      <CurrencyInput
                        value={expenses.alimentacao}
                        onChange={(v) => handleExpenseFieldChange('alimentacao', v)}
                        className="w-36 text-right font-normal"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-normal text-slate-600">
                      <input
                        type="text"
                        value={expenses.fonteAlimentacao ?? 'Comprovantes de despesas essenciais'}
                        onChange={(e) => handleExpenseFieldChange('fonteAlimentacao', e.target.value)}
                        placeholder="Fonte / Comprovação de alimentação..."
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-normal text-slate-700 bg-white"
                      />
                    </td>
                  </tr>

                  <tr className="bg-white hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-normal text-slate-900">Mensalidade Escolar</td>
                    <td className="py-2.5 px-4 text-right">
                      <CurrencyInput
                        value={expenses.educacaoDependentes}
                        onChange={(v) => handleExpenseFieldChange('educacaoDependentes', v)}
                        className="w-36 text-right font-normal"
                      />
                    </td>
                    <td className="py-2.5 px-4 font-normal text-slate-600">
                      <input
                        type="text"
                        value={expenses.fonteEducacao ?? 'Comprovante de mensalidade escolar'}
                        onChange={(e) => handleExpenseFieldChange('fonteEducacao', e.target.value)}
                        placeholder="Fonte / Comprovação de educação..."
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-normal text-slate-700 bg-white"
                      />
                    </td>
                  </tr>

                  {(expenses.outrasDespesasIndividuais || []).map((exp) => (
                    <tr key={exp.id} className="bg-white hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-normal text-slate-900 flex items-center gap-2">
                        <input
                          type="text"
                          value={exp.descricao}
                          onChange={(e) => handleUpdateCustomExpense(exp.id, 'descricao', e.target.value)}
                          placeholder="Descrição da despesa..."
                          className="flex-1 px-2 py-1 border border-slate-300 rounded text-xs font-normal"
                        />
                        <button
                          onClick={() => handleRemoveCustomExpense(exp.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Remover Despesa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <CurrencyInput
                          value={exp.valor}
                          onChange={(v) => handleUpdateCustomExpense(exp.id, 'valor', v)}
                          className="w-36 text-right font-normal"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-normal text-slate-600">
                        <input
                          type="text"
                          value={exp.fonteDoc || ''}
                          onChange={(e) => handleUpdateCustomExpense(exp.id, 'fonteDoc', e.target.value)}
                          placeholder="Fonte / Comprovação..."
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-normal text-slate-700"
                        />
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={3} className="py-2.5 px-4">
                      <button
                        type="button"
                        onClick={handleAddCustomExpense}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs rounded-lg border border-blue-200 shadow-2xs cursor-pointer transition-all"
                      >
                        <Plus className="w-4 h-4 text-blue-600" />
                        <span>+ Adicionar Nova Despesa Essencial (Editável)</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-blue-100 text-blue-950 font-extrabold text-xs border-t-2 border-blue-400">
                    <td className="py-3 px-4 uppercase font-extrabold">TOTAL DE DESPESAS ESSENCIAIS</td>
                    <td className="py-3 px-4 text-right text-blue-950 font-extrabold text-base">{formatCurrency(totalDespesas)}</td>
                    <td className="py-3 px-4 font-extrabold">Despesas Essenciais Validadas</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* MARGEM DISPONÍVEL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-slate-900 font-black text-sm uppercase tracking-normal">MARGEM DISPONÍVEL PARA O PLANO (MD) - ANTES DO PLANO COMPULSÓRIO</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITEM / RUBRICA</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">BASE LEGAL / DETERMINAÇÃO JUDICIAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-normal text-slate-900">Renda Líquida Mensal Ajustada (RLA)</td>
                    <td className="py-3 px-4 text-right font-normal text-slate-900">{formatCurrency(rlaAntesTotal)}</td>
                    <td className="py-3 px-4 font-normal text-slate-600">Renda Bruta deduzida dos tributos e saúde</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-normal text-slate-700">(-) Mínimo Existencial (ME)</td>
                    <td className="py-3 px-4 text-right font-normal text-red-700">
                      <CurrencyInput
                        value={expenses.minimoExistencialConfig}
                        onChange={(v) => handleExpenseFieldChange('minimoExistencialConfig', v)}
                        className="w-36 text-right font-bold text-red-700 bg-white"
                      />
                    </td>
                    <td className="py-3 px-4 font-normal text-slate-600">
                      <input
                        type="text"
                        value={expenses.justificativaMinimoExistencial || ''}
                        onChange={(e) => handleExpenseFieldChange('justificativaMinimoExistencial', e.target.value)}
                        placeholder="Conforme Determinação Judicial / Decreto 11.150/2022..."
                        className="w-full px-2.5 py-1 border border-slate-300 rounded font-normal text-xs text-slate-800 bg-white"
                      />
                    </td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-normal text-slate-700">(-) Despesas Mensais Essenciais</td>
                    <td className="py-3 px-4 text-right font-normal text-red-700">-{formatCurrency(totalDespesas)}</td>
                    <td className="py-3 px-4 font-normal text-slate-600">Despesas essenciais comprovadas</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-xs uppercase border-t-2 border-slate-300">
                    <td className="py-2.5 px-4 font-extrabold text-xs text-slate-900">MARGEM DISPONÍVEL (MD)</td>
                    <td className="py-2.5 px-4 text-right text-blue-900 font-extrabold text-xs">{formatCurrency(margemDisponivelAntes)}</td>
                    <td className="py-2.5 px-4 font-semibold text-xs text-blue-900">Margem Disponível para o Plano</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: DRE APÓS O PLANO COMPULSÓRIO (IMAGEM ANEXA DO USUÁRIO)           */
        /* ========================================================================= */
        <div className="space-y-6">
          
          {/* RENDA LÍQUIDA MENSAL AJUSTADA (RLA) - APÓS O PLANO COMPULSÓRIO */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <span className="text-slate-900 font-black text-sm uppercase tracking-normal">RENDA LÍQUIDA MENSAL AJUSTADA (RLA) - APÓS O PLANO COMPULSÓRIO</span>
              </div>
              <span className="text-emerald-800 font-mono font-black text-xs">
                RLA REPACTUADA: {formatCurrency(rlaDepoisTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITEM / RUBRICA</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">FONTE / DOCUMENTO DE COMPROVAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {contracheques.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">
                        Nenhum rendimento/contracheque cadastrado para repactuação.
                      </td>
                    </tr>
                  ) : (
                    contracheques.map((emp) => {
                      let descontosRepactuadosEmp = 0;
                      const descontosMapeados = (emp.outrosDescontosFolha || []).map(d => {
                        const vRepactuado = consignadosRepactuadosMap[d.id] !== undefined ? consignadosRepactuadosMap[d.id] : (d.valor * 0.45);
                        descontosRepactuadosEmp += vRepactuado;
                        return { ...d, vRepactuado };
                      });

                      const liquidoEmpApos = emp.rendimentoBruto - (emp.rppsInss + emp.irrf + emp.planoSaudeFolha + descontosRepactuadosEmp);

                      return (
                        <React.Fragment key={emp.id}>
                          
                          {/* Linha do Empregador */}
                          <tr className="bg-amber-50/70 border-t-2 border-amber-200">
                            <td className="py-2.5 px-4 font-bold text-slate-900">{emp.nomeEmpregador}</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-slate-900">{formatCurrency(emp.rendimentoBruto)}</td>
                            <td className="py-2.5 px-4 font-normal text-slate-600">{emp.fonteDoc || 'Contracheque / Comprovante'}</td>
                          </tr>

                          <tr className="bg-white hover:bg-slate-50">
                            <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) RPPS/INSS</td>
                            <td className="py-2 px-4 text-right font-normal text-red-700">-{formatCurrency(emp.rppsInss)}</td>
                            <td className="py-2 px-4 font-normal text-slate-500">{emp.fonteDoc || 'Contracheque / Comprovante'}</td>
                          </tr>

                          <tr className="bg-white hover:bg-slate-50">
                            <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) IRRF</td>
                            <td className="py-2 px-4 text-right font-normal text-red-700">-{formatCurrency(emp.irrf)}</td>
                            <td className="py-2 px-4 font-normal text-slate-500">{emp.fonteDoc || 'Contracheque / Comprovante'}</td>
                          </tr>

                          {emp.planoSaudeFolha > 0 && (
                            <tr className="bg-white hover:bg-slate-50">
                              <td className="py-2 px-4 text-slate-700 pl-8 font-normal">(-) Plano de Saúde (Consolidado)</td>
                              <td className="py-2 px-4 text-right font-normal text-red-700">-{formatCurrency(emp.planoSaudeFolha)}</td>
                              <td className="py-2 px-4 font-normal text-slate-500">{emp.fonteDoc || 'Contracheque / Comprovante'}</td>
                            </tr>
                          )}

                          {/* Descontos Consignados Repactuados */}
                          {descontosMapeados.map((d) => (
                            <tr key={d.id} className="bg-white hover:bg-slate-50">
                              <td className="py-2 px-4 text-slate-700 pl-8 font-normal">{d.descricao}</td>
                              <td className="py-2 px-4 text-right font-normal text-red-700">-{formatCurrency(d.vRepactuado)}</td>
                              <td className="py-2 px-4 font-normal text-emerald-800 font-semibold">Empréstimos Consignados Repactuados</td>
                            </tr>
                          ))}

                          {/* Subtotal Líquido do Empregador */}
                          <tr className="bg-blue-50/80 font-bold text-blue-950 border-b border-slate-300">
                            <td className="py-2.5 px-4 uppercase text-xs font-extrabold">Líquido {emp.nomeEmpregador.replace('Salário Bruto ', '')}</td>
                            <td className="py-2.5 px-4 text-right font-extrabold text-sm text-blue-950">{formatCurrency(liquidoEmpApos)}</td>
                            <td className="py-2.5 px-4 text-slate-600 text-[11px] font-bold">Renda Líquida Disponível Pós-Repactuação</td>
                          </tr>

                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-100 text-blue-950 font-extrabold text-xs border-t-2 border-blue-400">
                    <td className="py-3 px-4 uppercase font-extrabold">RENDA LÍQUIDA AJUSTADA APÓS O PLANO (RLA)</td>
                    <td className="py-3 px-4 text-right text-blue-950 font-extrabold text-base">{formatCurrency(rlaDepoisTotal)}</td>
                    <td className="py-3 px-4 text-blue-950 font-extrabold">Total RLA Repactuada</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* DESPESAS MENSAIS ESSENCIAIS */}
          <div className="bg-white rounded-lg border border-slate-300 shadow-md overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <span className="text-slate-900 font-black text-sm uppercase tracking-normal">DESPESAS MENSAIS ESSENCIAIS - APÓS O PLANO COMPULSÓRIO</span>
              </div>
              <span className="text-slate-900 font-mono font-black text-xs">
                TOTAL DE DESPESAS: {formatCurrency(totalDespesas)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITENS / DESPESAS ESSENCIAIS</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">FONTE / COMPROVAÇÃO DE DESPESAS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-normal text-slate-900">Aluguel Mensal / Moradia</td>
                    <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(expenses.moradia)}</td>
                    <td className="py-2.5 px-4 font-normal text-slate-600">{expenses.fonteMoradia || 'Comprovante de pagamento de moradia'}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-normal text-slate-900">Alimentação & Supermercado</td>
                    <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(expenses.alimentacao)}</td>
                    <td className="py-2.5 px-4 font-normal text-slate-600">{expenses.fonteAlimentacao || 'Comprovantes de despesas essenciais'}</td>
                  </tr>
                  {expenses.educacaoDependentes > 0 && (
                    <tr className="bg-white">
                      <td className="py-2.5 px-4 font-normal text-slate-900">Mensalidade Escolar</td>
                      <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(expenses.educacaoDependentes)}</td>
                      <td className="py-2.5 px-4 font-normal text-slate-600">{expenses.fonteEducacao || 'Comprovante de mensalidade escolar'}</td>
                    </tr>
                  )}
                  {expenses.saudeMedicamentos > 0 && (
                    <tr className="bg-white">
                      <td className="py-2.5 px-4 font-normal text-slate-900">Saúde & Medicamentos</td>
                      <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(expenses.saudeMedicamentos)}</td>
                      <td className="py-2.5 px-4 font-normal text-slate-600">{expenses.fonteSaude || 'Comprovante de despesas médicas'}</td>
                    </tr>
                  )}
                  {expenses.transporte > 0 && (
                    <tr className="bg-white">
                      <td className="py-2.5 px-4 font-normal text-slate-900">Transporte & Locomoção</td>
                      <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(expenses.transporte)}</td>
                      <td className="py-2.5 px-4 font-normal text-slate-600">{expenses.fonteTransporte || 'Comprovante de transporte'}</td>
                    </tr>
                  )}
                  {(expenses.outrasDespesasIndividuais || []).map(exp => (
                    <tr key={exp.id} className="bg-white">
                      <td className="py-2.5 px-4 font-normal text-slate-900">{exp.descricao}</td>
                      <td className="py-2.5 px-4 text-right font-normal text-slate-900">{formatCurrency(exp.valor)}</td>
                      <td className="py-2.5 px-4 font-normal text-slate-600">{exp.fonteDoc || 'Comprovante em anexo'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-100 text-blue-950 font-extrabold text-xs border-t-2 border-blue-400">
                    <td className="py-3 px-4 uppercase font-extrabold">TOTAL DE DESPESAS ESSENCIAIS</td>
                    <td className="py-3 px-4 text-right text-blue-950 font-extrabold text-base">{formatCurrency(totalDespesas)}</td>
                    <td className="py-3 px-4 font-extrabold">Despesas Essenciais Preservadas</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* MÍNIMO EXISTENCIAL (ME) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span className="text-slate-900 font-black text-sm uppercase tracking-normal">MÍNIMO EXISTENCIAL (ME) - APÓS O PLANO COMPULSÓRIO</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3 px-4 w-5/12 uppercase tracking-wider">ITEM / REGULAMENTAÇÃO</th>
                    <th className="py-3 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3 px-4 w-4/12 uppercase tracking-wider">BASE LEGAL / DETERMINAÇÃO JUDICIAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  <tr className="bg-white">
                    <td className="py-3 px-4 font-normal text-slate-900">Mínimo Existencial (ME)</td>
                    <td className="py-3 px-4 text-right font-normal text-slate-900">{formatCurrency(minimoExistencial)}</td>
                    <td className="py-3 px-4 font-normal text-slate-700">{expenses.justificativaMinimoExistencial || 'Conforme Determinação Judicial'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* MARGEM DISPONÍVEL APÓS O PLANO COMPULSÓRIO (MD) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="bg-slate-100 text-slate-900 px-4 py-3 font-black border-b border-slate-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="text-slate-900 font-black text-sm uppercase tracking-normal">MARGEM DISPONÍVEL APÓS O PLANO COMPULSÓRIO (MD)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[11px] border-b border-slate-300">
                    <th className="py-3.5 px-4 w-5/12 uppercase tracking-wider">ITEM / DEMONSTRATIVO</th>
                    <th className="py-3.5 px-4 text-right w-3/12 uppercase tracking-wider">VALOR (R$)</th>
                    <th className="py-3.5 px-4 w-4/12 uppercase tracking-wider">OBSERVAÇÃO / FONTE DE COMPROVAÇÃO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-normal">
                  
                  {/* RENDA LÍQUIDA MENSAL AJUSTADA */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold uppercase text-slate-900 text-xs">RENDA LÍQUIDA MENSAL AJUSTADA (RLA)</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 text-xs">{formatCurrency(rlaDepoisTotal)}</td>
                    <td className="py-2.5 px-4 font-normal text-slate-600 text-xs">Já estão incluídos todos os empréstimos consignados</td>
                  </tr>

                  {/* (-) Mínimo Existencial */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold uppercase text-slate-700 text-xs">(-) MÍNIMO EXISTENCIAL (ME)</td>
                    <td className="py-2.5 px-4 text-right font-bold text-red-700 text-xs">-{formatCurrency(minimoExistencial)}</td>
                    <td className="py-2.5 px-4 font-normal text-slate-500 text-xs">Dedução do Mínimo Existencial</td>
                  </tr>

                  {/* (=) MARGEM DISPONÍVEL */}
                  <tr className="bg-blue-50 text-blue-900 font-extrabold border-y border-blue-200">
                    <td className="py-2.5 px-4 uppercase font-extrabold text-xs">(=) MARGEM DISPONÍVEL</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-xs text-blue-900">{formatCurrency(margemDisponivelAposBruta)}</td>
                    <td className="py-2.5 px-4 font-semibold text-xs text-blue-900">Margem Orçamentária Bruta</td>
                  </tr>

                  {/* (-) DESPESAS ESSENCIAIS */}
                  <tr className="bg-amber-50/70 text-amber-950 font-extrabold">
                    <td className="py-2.5 px-4 uppercase font-extrabold text-xs">(-) DESPESAS ESSENCIAIS</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-xs text-red-700">-{formatCurrency(totalDespesas)}</td>
                    <td className="py-2.5 px-4 font-semibold text-xs text-amber-900">Despesas essenciais deduzidas da margem</td>
                  </tr>

                  {/* Empréstimos Não Consignados Repactuados Dinâmicos */}
                  {contracts.filter(c => c.modalidade && (c.modalidade.toLowerCase().includes('não consignado') || c.modalidade.toLowerCase().includes('pessoal'))).map((c) => (
                    <tr key={c.id} className="bg-white">
                      <td className="py-2 px-4 font-normal text-slate-700 text-xs">(-) {c.credor} - {c.numeroContrato}</td>
                      <td className="py-2 px-4 text-right font-normal text-red-700 text-xs">-{formatCurrency(c.valorParcelaAtual)}</td>
                      <td className="py-2 px-4 font-normal text-emerald-800 text-xs">Empréstimos não Consignados Repactuados</td>
                    </tr>
                  ))}

                  {/* (=) RENDA DISPONÍVEL */}
                  <tr className="bg-blue-50 font-extrabold text-blue-900 border-t border-slate-300">
                    <td className="py-2.5 px-4 uppercase font-extrabold text-xs">(=) RENDA DISPONÍVEL</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-xs text-blue-900">{formatCurrency(rendaDisponivelApos)}</td>
                    <td className="py-2.5 px-4 font-semibold text-xs text-blue-900">Sobra Orçamentária Líquida Apoiada</td>
                  </tr>

                  {/* (+) Mínimo Existencial (ME) */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold uppercase text-emerald-800 text-xs">(+) MÍNIMO EXISTENCIAL (ME)</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-800 text-xs">+{formatCurrency(minimoExistencial)}</td>
                    <td className="py-2.5 px-4 font-normal text-slate-600 text-xs">Recomposição da dignidade humana</td>
                  </tr>

                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold text-xs border-t-2 border-slate-300">
                    <td className="py-2.5 px-4 uppercase font-extrabold text-xs text-blue-900">(=) TOTAL DE RECURSOS LIVRES</td>
                    <td className="py-2.5 px-4 text-right font-extrabold text-xs text-emerald-700">{formatCurrency(totalRecursosLivresApos)}</td>
                    <td className="py-2.5 px-4 font-semibold text-xs text-slate-700">Recursos Livres Mantidos com Dignidade</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
