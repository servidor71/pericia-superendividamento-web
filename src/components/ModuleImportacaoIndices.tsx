import React, { useState } from 'react';
import { Clipboard, Trash2, RefreshCw, CheckCircle2, Sparkles, Database, FileSpreadsheet, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MonetaryIndexItem, Contract } from '../types';
import { initialMonetaryIndices } from '../mockData';
import { syncContractsWithNumeroIndice, OFFICIAL_IBGE_SOURCE, parseIBGESerieHistoricaRows, sortAndDeduplicateIndices } from '../services/monetaryIndices';

interface ModuleImportacaoIndicesProps {
  contracts?: Contract[];
  onContractsChange?: (updated: Contract[]) => void;
  indicesList?: MonetaryIndexItem[];
  onIndicesChange?: (indices: MonetaryIndexItem[]) => void;
  isEditing?: boolean;
  onRegisterActions?: (actions: {
    handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    openPasteModal: () => void;
    handleAddRow: () => void;
    handleResetIndices: () => void;
    handleClearIndices?: () => void;
  }) => void;
}

export const ModuleImportacaoIndices: React.FC<ModuleImportacaoIndicesProps> = ({
  contracts = [],
  onContractsChange,
  indicesList: externalIndices,
  onIndicesChange,
  isEditing: externalIsEditing,
  onRegisterActions,
}) => {
  const [internalIndices, setInternalIndices] = useState<MonetaryIndexItem[]>(initialMonetaryIndices);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  const isEditing = externalIsEditing !== undefined ? externalIsEditing : true;
  const indices = externalIndices || internalIndices;

  const updateIndices = (newIndices: MonetaryIndexItem[], syncContracts: boolean = true) => {
    const sorted = sortAndDeduplicateIndices(newIndices);
    if (onIndicesChange) {
      onIndicesChange(sorted);
    } else {
      setInternalIndices(sorted);
    }

    if (syncContracts && contracts.length > 0 && onContractsChange) {
      const updatedContracts = syncContractsWithNumeroIndice(contracts, sorted);
      onContractsChange(updatedContracts);
    }
  };

  const handleUpdateItem = (id: string, field: keyof MonetaryIndexItem, value: any) => {
    const updated = indices.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateIndices(updated);
  };

  const handleAddRow = () => {
    const newItem: MonetaryIndexItem = {
      id: `idx_custom_${Date.now()}`,
      competencia: ``,
      numeroIndiceInpc: 0.0,
      indiceInpcMes: 0.0,
      fatorInpcAcumulado7Casas: 1.0,
      numeroIndiceIpca: 0.0,
      indiceIpcaMes: 0.0,
      fatorIpcaAcumulado7Casas: 1.0,
      fonte: OFFICIAL_IBGE_SOURCE,
    };
    updateIndices([...indices, newItem]);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Deseja excluir este índice da tabela?')) {
      updateIndices(indices.filter(i => i.id !== id));
    }
  };

  const handleResetIndices = () => {
    if (confirm('Deseja restaurar a Tabela Oficial de Índices INPC/IPCA da Série Histórica - IBGE para o padrão original?')) {
      updateIndices(initialMonetaryIndices);
    }
  };

  // Recálculo automático dos Fatores Acumulados de 7 casas decimais via NÚMERO ÍNDICE
  const handleRecalculateAccumulatedFactors = () => {
    const sorted = sortAndDeduplicateIndices(indices);
    updateIndices(sorted, true);
    setSyncSuccessMessage('Série histórica organizada e Fatores acumulados (7 casas) recalculados pela divisão do NÚMERO ÍNDICE!');
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  // Sincronização direta dos Fatores com os Contratos Bancários da Perícia via NÚMERO ÍNDICE conforme a data do saldo devedor
  const handleSyncFactorsWithContracts = () => {
    if (!contracts.length || !onContractsChange) {
      setSyncSuccessMessage('Série organizada! (Nenhum contrato ativo cadastrado para sincronizar).');
      setTimeout(() => setSyncSuccessMessage(null), 4000);
      return;
    }

    const updatedContracts = syncContractsWithNumeroIndice(contracts, indices);
    onContractsChange(updatedContracts);
    setSyncSuccessMessage(`Sincronização Automática Concluída! Fatores INPC/IPCA vinculados por data de saldo devedor em todos os ${contracts.length} contratos!`);
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  // Processa Upload de Arquivo CSV / Excel (.xls, .xlsx, .csv, .txt) importando TODOS os anos (do mais antigo ao mais recente)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;

        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false });

        // Tenta processar com o parser especialista da Série Histórica IBGE (1979/1994 em diante)
        const parsedIbgeItems = parseIBGESerieHistoricaRows(rawRows);

        if (parsedIbgeItems.length > 0) {
          const sorted = sortAndDeduplicateIndices([...indices, ...parsedIbgeItems]);
          updateIndices(sorted, true);
          
          const pMin = sorted[0]?.competencia || 'antigo';
          const pMax = sorted[sorted.length - 1]?.competencia || 'recente';

          setSyncSuccessMessage(`${parsedIbgeItems.length} meses da Série Histórica IBGE (período ${pMin} a ${pMax}) importados e aplicados automaticamente aos contratos!`);
          setTimeout(() => setSyncSuccessMessage(null), 6000);
          return;
        }

        // Fallback para planilhas simples
        const parsedItems: MonetaryIndexItem[] = [];
        const dateMonthRegex = /\b(?:(0?[1-9]|1[0-2])[\/\.-](20\d{2}|\d{2})|(20\d{2})[\/\.-](0?[1-9]|1[0-2])|(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[\/\.-]?(20\d{2}|\d{2}))\b/i;

        rawRows.forEach((row: any[], rowIndex: number) => {
          if (!Array.isArray(row) || row.length === 0) return;

          let compString = '';
          let colIndexDate = -1;

          for (let c = 0; c < Math.min(row.length, 3); c++) {
            const cellVal = String(row[c] || '').trim();
            if (dateMonthRegex.test(cellVal)) {
              compString = cellVal;
              colIndexDate = c;
              break;
            }
          }

          if (!compString || colIndexDate === -1) return;

          let formattedComp = compString;
          const slashMatch = compString.match(/(\d{1,2})[\/\.-](\d{2,4})/);
          if (slashMatch) {
            const m = slashMatch[1].padStart(2, '0');
            let y = slashMatch[2];
            if (y.length === 2) y = (parseInt(y, 10) > 50 ? '19' : '20') + y;
            formattedComp = `${m}/${y}`;
          }

          const valCol1Str = String(row[colIndexDate + 1] || '').replace(/\./g, '').replace(',', '.').replace('%', '').trim();
          const valCol2Str = String(row[colIndexDate + 2] || '').replace(/\./g, '').replace(',', '.').replace('%', '').trim();

          const numCol1 = parseFloat(valCol1Str) || 0;
          const numCol2 = valCol2Str ? (parseFloat(valCol2Str) || 0) : numCol1;

          let inpcMes = numCol1;
          let ipcaMes = numCol2;
          let numIndiceInpc: number | undefined = undefined;

          if (numCol1 > 50) {
            numIndiceInpc = numCol1;
            inpcMes = 0;
          }

          parsedItems.push({
            id: `idx_imp_${Date.now()}_${rowIndex}`,
            competencia: formattedComp,
            numeroIndiceInpc: numIndiceInpc,
            indiceInpcMes: parseFloat(inpcMes.toFixed(2)),
            fatorInpcAcumulado7Casas: 1.0,
            indiceIpcaMes: parseFloat(ipcaMes.toFixed(2)),
            fatorIpcaAcumulado7Casas: 1.0,
            fonte: OFFICIAL_IBGE_SOURCE,
          });
        });

        if (parsedItems.length > 0) {
          const sorted = sortAndDeduplicateIndices([...indices, ...parsedItems]);
          updateIndices(sorted, true);
          setSyncSuccessMessage(`${parsedItems.length} meses de índices monetários importados e sincronizados com sucesso!`);
          setTimeout(() => setSyncSuccessMessage(null), 5000);
        } else {
          alert(`Nenhuma competência/data válida foi encontrada no arquivo ${file.name}. Certifique-se de que a planilha segue o modelo da Série Histórica IBGE (ANO, MÊS, NÚMERO ÍNDICE, VARIAÇÕES).`);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo Excel/CSV:', err);
        alert(`Erro ao processar o arquivo ${file.name}. Certifique-se de que é uma planilha Excel (.xls / .xlsx) ou CSV válida.`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Processa Colagem de Dados do Excel no modelo oficial IBGE ou colunas simples
  const handleParsePastedData = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const rawMatrix = lines.map(line => line.split(/\t/).map(p => p.trim()));

    // Tenta primeiro via parser especialista IBGE
    const ibgeParsed = parseIBGESerieHistoricaRows(rawMatrix);
    if (ibgeParsed.length > 0) {
      const sorted = sortAndDeduplicateIndices([...indices, ...ibgeParsed]);
      updateIndices(sorted, true);
      setShowPasteModal(false);
      setPasteText('');
      setSyncSuccessMessage(`${ibgeParsed.length} registros da Série Histórica IBGE importados e aplicados automaticamente aos contratos!`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
      return;
    }

    // Fallback simples
    const parsedItems: MonetaryIndexItem[] = [];
    rawMatrix.forEach((parts, index) => {
      if (parts.length >= 2) {
        const comp = parts[0];
        const val1 = parseFloat(parts[1].replace(/\./g, '').replace(',', '.').replace('%', '')) || 0;
        const val2 = parts[2] ? parseFloat(parts[2].replace(/\./g, '').replace(',', '.').replace('%', '')) || val1 : val1;

        let numIndiceInpc: number | undefined = undefined;
        let inpcMes = val1;
        if (val1 > 50) {
          numIndiceInpc = val1;
          inpcMes = 0;
        }

        parsedItems.push({
          id: `idx_paste_${Date.now()}_${index}`,
          competencia: comp,
          numeroIndiceInpc: numIndiceInpc,
          indiceInpcMes: inpcMes,
          fatorInpcAcumulado7Casas: 1.0,
          indiceIpcaMes: val2 > 50 ? 0 : val2,
          numeroIndiceIpca: val2 > 50 ? val2 : undefined,
          fatorIpcaAcumulado7Casas: 1.0,
          fonte: OFFICIAL_IBGE_SOURCE,
        });
      }
    });

    if (parsedItems.length > 0) {
      const sorted = sortAndDeduplicateIndices([...indices, ...parsedItems]);
      updateIndices(sorted, true);
      setShowPasteModal(false);
      setPasteText('');
      setSyncSuccessMessage(`${parsedItems.length} meses importados via colagem e sincronizados com sucesso!`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    } else {
      alert('Formato de dados colados não reconhecido. Copie as colunas da Série Histórica IBGE (ANO, MÊS, NÚMERO ÍNDICE, VARIAÇÃO %) direto da planilha.');
    }
  };

  React.useEffect(() => {
    if (onRegisterActions) {
      onRegisterActions({
        handleFileUpload,
        openPasteModal: () => setShowPasteModal(true),
        handleAddRow,
        handleResetIndices,
        handleClearIndices: () => updateIndices([], true),
      });
    }
  }, [indices, onRegisterActions]);

  const minCompetencia = indices[0]?.competencia || '01/1994';
  const maxCompetencia = indices[indices.length - 1]?.competencia || '03/2026';

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* Action Notification Banner */}
      {syncSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-xl shadow-xs flex items-center justify-between animate-fade-in font-sans">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs font-black text-emerald-900">{syncSuccessMessage}</span>
          </div>
        </div>
      )}

      {/* Auxiliary Calculation & Sync Bar - Compact Ultra Slim Banner */}
      <div className="bg-blue-50/80 text-slate-900 px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-2 font-sans">
        <div className="flex items-center gap-2 overflow-hidden shrink min-w-0">
          <div className="flex items-center space-x-1.5 text-blue-900 font-black text-xs uppercase tracking-wider shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>FÓRMULA NÚMERO ÍNDICE — SÉRIE HISTÓRICA IBGE COMPLETA:</span>
          </div>
          <p className="text-xs text-slate-600 font-medium whitespace-nowrap truncate">
            Série histórica completa ({minCompetencia} até {maxCompetencia}) • Fator = (Número Índice Mês Atual) / (Número Índice Mês Anterior Data Ref).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRecalculateAccumulatedFactors}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-[11px] rounded-lg border border-slate-300 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-blue-600" />
            <span>Ordenar & Recalcular Fatores</span>
          </button>

          <button
            onClick={handleSyncFactorsWithContracts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg border border-blue-500 shadow-2xs transition-all cursor-pointer"
          >
            <Database className="w-3 h-3 text-white" />
            <span>✨ Aplicar Fatores por Data de Saldo nos Contratos</span>
          </button>
        </div>
      </div>

      {/* Main Index Table - Structured with Official IBGE Historical Series layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="bg-blue-50/80 text-slate-900 px-4 py-3 border-b border-blue-200 flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-black uppercase tracking-wide text-blue-900">
              SÉRIE HISTÓRICA DO INPC E IPCA ({indices.length} MESES: DE {minCompetencia} A {maxCompetencia})
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px] font-black border border-blue-300 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-blue-700" />
              {OFFICIAL_IBGE_SOURCE}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left border-collapse text-xs min-w-[980px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300 shadow-2xs">
                <th className="py-3 px-2 text-center border-r border-slate-200">Ano</th>
                <th className="py-3 px-2 text-center border-r border-slate-200">Mês</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">Competência</th>
                <th className="py-3 px-3 text-center border-r border-slate-200 bg-amber-50/70 font-black text-amber-950">NÚMERO ÍNDICE (INPC)</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">INPC Mensal (%)</th>
                <th className="py-3 px-3 text-center border-r border-slate-200 font-black text-blue-900">Fator INPC (7 Casas)</th>
                <th className="py-3 px-3 text-center border-r border-slate-200 bg-emerald-50/70 font-black text-emerald-950">NÚMERO ÍNDICE (IPCA)</th>
                <th className="py-3 px-3 text-center border-r border-slate-200">IPCA Mensal (%)</th>
                <th className="py-3 px-3 text-center border-r border-slate-200 font-black text-emerald-900">Fator IPCA (7 Casas)</th>
                <th className="py-3 px-3 border-r border-slate-200">Fonte da Série</th>
                {isEditing && <th className="py-3 px-2 text-center no-print">Ações</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-normal bg-white text-slate-900">
              {indices.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-medium">
                    <p className="text-sm font-bold text-slate-700 mb-1">Nenhum índice monetário cadastrado nesta série.</p>
                    <p className="text-xs text-slate-500">Utilize o botão de importação acima para carregar a Série Histórica Completa do IBGE (1979/1994 até 2026).</p>
                  </td>
                </tr>
              ) : (
                indices.map((item) => {
                  const compParts = item.competencia ? item.competencia.split('/') : ['', ''];
                  const displayMes = item.mes || (compParts.length === 2 ? compParts[0] : '');
                  const displayAno = item.ano || (compParts.length === 2 ? compParts[1] : '');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors text-slate-800">
                      
                      {/* Ano */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-bold border-r border-slate-200">
                        {displayAno}
                      </td>

                      {/* Mês */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700 font-bold border-r border-slate-200">
                        {displayMes}
                      </td>

                      {/* Competência */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.competencia}
                            onChange={(e) => handleUpdateItem(item.id, 'competencia', e.target.value)}
                            className="w-20 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white text-xs"
                          />
                        ) : (
                          item.competencia
                        )}
                      </td>

                      {/* Número Índice INPC */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-950 border-r border-slate-200 bg-amber-50/40">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.numeroIndiceInpc || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'numeroIndiceInpc', parseFloat(e.target.value) || 0)}
                            placeholder="ex: 6816.54"
                            className="w-24 text-center px-1.5 py-0.5 border border-amber-300 rounded font-mono font-bold text-amber-900 bg-white text-xs"
                          />
                        ) : (
                          (item.numeroIndiceInpc || 0).toFixed(2).replace('.', ',')
                        )}
                      </td>

                      {/* INPC Mensal % */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-900 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.indiceInpcMes}
                            onChange={(e) => handleUpdateItem(item.id, 'indiceInpcMes', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-900 bg-white text-xs"
                          />
                        ) : (
                          `${item.indiceInpcMes.toFixed(2).replace('.', ',')}%`
                        )}
                      </td>

                      {/* Fator INPC Acumulado */}
                      <td className="py-2.5 px-3 text-center font-mono font-black text-blue-900 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.0000001"
                            value={item.fatorInpcAcumulado7Casas}
                            onChange={(e) => handleUpdateItem(item.id, 'fatorInpcAcumulado7Casas', parseFloat(e.target.value) || 1.0)}
                            className="w-24 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono font-black text-blue-900 bg-white text-xs"
                          />
                        ) : (
                          item.fatorInpcAcumulado7Casas.toFixed(7)
                        )}
                      </td>

                      {/* Número Índice IPCA */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-950 border-r border-slate-200 bg-emerald-50/40">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.numeroIndiceIpca || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'numeroIndiceIpca', parseFloat(e.target.value) || 0)}
                            placeholder="ex: 7108.74"
                            className="w-24 text-center px-1.5 py-0.5 border border-emerald-300 rounded font-mono font-bold text-emerald-900 bg-white text-xs"
                          />
                        ) : (
                          (item.numeroIndiceIpca || 0).toFixed(2).replace('.', ',')
                        )}
                      </td>

                      {/* IPCA Mensal % */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-900 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.indiceIpcaMes}
                            onChange={(e) => handleUpdateItem(item.id, 'indiceIpcaMes', parseFloat(e.target.value) || 0)}
                            className="w-16 text-center px-1 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-900 bg-white text-xs"
                          />
                        ) : (
                          `${item.indiceIpcaMes.toFixed(2).replace('.', ',')}%`
                        )}
                      </td>

                      {/* Fator IPCA Acumulado */}
                      <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-800 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.0000001"
                            value={item.fatorIpcaAcumulado7Casas}
                            onChange={(e) => handleUpdateItem(item.id, 'fatorIpcaAcumulado7Casas', parseFloat(e.target.value) || 1.0)}
                            className="w-24 text-center px-1.5 py-0.5 border border-slate-300 rounded font-mono font-black text-emerald-800 bg-white text-xs"
                          />
                        ) : (
                          item.fatorIpcaAcumulado7Casas.toFixed(7)
                        )}
                      </td>

                      {/* Fonte */}
                      <td className="py-2.5 px-3 font-medium text-slate-700 border-r border-slate-200">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.fonte || OFFICIAL_IBGE_SOURCE}
                            onChange={(e) => handleUpdateItem(item.id, 'fonte', e.target.value)}
                            className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-slate-800 bg-white text-xs"
                          />
                        ) : (
                          item.fonte || OFFICIAL_IBGE_SOURCE
                        )}
                      </td>

                      {/* Ações */}
                      {isEditing && (
                        <td className="py-2.5 px-2 text-center no-print">
                          <button
                            onClick={() => handleDeleteRow(item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Remover Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 text-center font-black" colSpan={3}>TOTAL: {indices.length} MESES CADASTRADOS</td>
                <td className="py-3 px-4 text-center font-black text-blue-900 font-mono" colSpan={3}>
                  Último Fator INPC: {indices[indices.length - 1]?.fatorInpcAcumulado7Casas.toFixed(7) || '1.0000000'}
                </td>
                <td className="py-3 px-4 text-center font-black text-emerald-800 font-mono" colSpan={3}>
                  Último Fator IPCA: {indices[indices.length - 1]?.fatorIpcaAcumulado7Casas.toFixed(7) || '1.0000000'}
                </td>
                <td className="py-3 px-4 font-black" colSpan={isEditing ? 2 : 1}>
                  {OFFICIAL_IBGE_SOURCE}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Paste Excel Modal - Modelo Série Histórica IBGE */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 font-sans animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Clipboard className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Colar Tabela no Modelo Série Histórica IBGE</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Copie as colunas da tabela oficial do IBGE no Excel (de qualquer ano desde 1979/1994 até o presente) e cole abaixo:<br />
              <code className="bg-blue-50 px-1.5 py-0.5 rounded font-mono text-[11px] text-blue-900 border border-blue-200 block mt-1">
                [ANO] [MÊS (ex: JAN)] [NÚMERO ÍNDICE] [VARIAÇÃO NO MÊS %] [VARIAÇÃO 12m %]
              </code>
              <span className="text-[11px] text-slate-500 block mt-1">Os índices serão ordenados cronologicamente e sincronizados automaticamente em todos os contratos por data de saldo devedor.</span>
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`1994\tJAN\t141,32\t41,32\t2.741,45\n\tFEV\t198,65\t40,57\t3.100,70\n\tMAR\t284,23\t43,08\t3.489,58\n\tABR\t406,05\t42,86\t3.894,75\n\tMAI\t579,56\t42,73\t4.397,36`}
              className="w-full p-3 border border-slate-300 rounded-xl font-mono text-xs text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleParsePastedData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl border border-blue-500 shadow-xs"
              >
                Importar Dados da Série Histórica IBGE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
