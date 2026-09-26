import React, { useState } from 'react';
import { Clipboard, Trash2, RefreshCw, CheckCircle2, Sparkles, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { MonetaryIndexItem, Contract } from '../types';
import { initialMonetaryIndices } from '../mockData';

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

  const updateIndices = (newIndices: MonetaryIndexItem[]) => {
    if (onIndicesChange) {
      onIndicesChange(newIndices);
    } else {
      setInternalIndices(newIndices);
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
      indiceInpcMes: 0.0,
      fatorInpcAcumulado7Casas: 1.0,
      indiceIpcaMes: 0.0,
      fatorIpcaAcumulado7Casas: 1.0,
      fonte: 'Manual',
    };
    updateIndices([...indices, newItem]);
  };

  const handleDeleteRow = (id: string) => {
    if (confirm('Deseja excluir este índice da tabela?')) {
      updateIndices(indices.filter(i => i.id !== id));
    }
  };

  const handleResetIndices = () => {
    if (confirm('Deseja restaurar a Tabela Oficial de Índices INPC/IPCA do IBGE para o padrão original?')) {
      updateIndices(initialMonetaryIndices);
    }
  };

  // Recálculo automático da série multiplicativa acumulada de fatores de 7 casas decimais
  const handleRecalculateAccumulatedFactors = () => {
    let acumInpc = 1.0;
    let acumIpca = 1.0;

    const recalculated = indices.map((item) => {
      const taxaInpc = (item.indiceInpcMes || 0) / 100;
      const taxaIpca = (item.indiceIpcaMes || 0) / 100;

      acumInpc = acumInpc * (1 + taxaInpc);
      acumIpca = acumIpca * (1 + taxaIpca);

      return {
        ...item,
        fatorInpcAcumulado7Casas: parseFloat(acumInpc.toFixed(7)),
        fatorIpcaAcumulado7Casas: parseFloat(acumIpca.toFixed(7)),
      };
    });

    updateIndices(recalculated);
    setSyncSuccessMessage('Fatores acumulados de 7 casas decimais recalculados com sucesso para toda a série histórica!');
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  // Sincronização direta dos Fatores com os Contratos Bancários da Perícia
  const handleSyncFactorsWithContracts = () => {
    if (!contracts.length || !onContractsChange) {
      setSyncSuccessMessage('Tabela atualizada! (Nenhum contrato ativo cadastrado no momento para sincronizar).');
      setTimeout(() => setSyncSuccessMessage(null), 4000);
      return;
    }

    const latestIndex = indices[indices.length - 1];
    const defaultFatorInpc = latestIndex ? latestIndex.fatorInpcAcumulado7Casas : 1.0;
    const defaultFatorIpca = latestIndex ? latestIndex.fatorIpcaAcumulado7Casas : 1.0;

    const updatedContracts = contracts.map(c => {
      const fatorToApply = c.tipoIndiceCorrecao === 'IPCA' ? defaultFatorIpca : defaultFatorInpc;
      return {
        ...c,
        fatorCorrecao7Casas: fatorToApply,
      };
    });

    onContractsChange(updatedContracts);
    setSyncSuccessMessage(`Sincronização Concluída! Fatores de correção (7 casas) atualizados em todos os ${contracts.length} contratos da perícia!`);
    setTimeout(() => setSyncSuccessMessage(null), 5000);
  };

  // Processa Upload de Arquivo CSV / Excel (.xls, .xlsx, .csv, .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;

        // Suporta .xls (BIFF8/HTML), .xlsx, .csv e .txt via SheetJS (XLSX)
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Converte planilha em matriz 2D de linhas
        const rawRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false });
        const parsedItems: MonetaryIndexItem[] = [];

        // Regex para identificar datas/competências válidas (ex: 01/2024, 2024-01, jan/24, 01/01/2024)
        const dateMonthRegex = /\b(?:(0?[1-9]|1[0-2])[\/\.-](20\d{2}|\d{2})|(20\d{2})[\/\.-](0?[1-9]|1[0-2])|(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[\/\.-]?(20\d{2}|\d{2}))\b/i;

        rawRows.forEach((row: any[], rowIndex: number) => {
          if (!Array.isArray(row) || row.length === 0) return;

          // Procura nas primeiras colunas por uma competência/data válida
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

          // Se a linha não contiver uma data/competência válida (ex: cabeçalhos "mm/yy", "0.000", títulos), ignora
          if (!compString || colIndexDate === -1) return;

          // Padroniza a exibição da competência para MM/YYYY
          let formattedComp = compString;
          const slashMatch = compString.match(/(\d{1,2})[\/\.-](\d{2,4})/);
          if (slashMatch) {
            const m = slashMatch[1].padStart(2, '0');
            let y = slashMatch[2];
            if (y.length === 2) y = '20' + y;
            formattedComp = `${m}/${y}`;
          }

          // Extrai os valores numéricos das colunas seguintes
          const valCol1Str = String(row[colIndexDate + 1] || '').replace(',', '.').replace('%', '').trim();
          const valCol2Str = String(row[colIndexDate + 2] || '').replace(',', '.').replace('%', '').trim();
          const valCol3Str = String(row[colIndexDate + 3] || '').replace(',', '.').replace('%', '').trim();

          const numCol1 = parseFloat(valCol1Str) || 0;
          const numCol2 = valCol2Str ? (parseFloat(valCol2Str) || 0) : numCol1;
          const numCol3 = valCol3Str ? (parseFloat(valCol3Str) || 0) : 0;

          // Trata se o valor lido é porcentagem mensal (ex: 0.57) ou fator de 7 casas (ex: 1.0160724)
          let inpcMes = numCol1;
          let ipcaMes = numCol2;
          let fatorInpc = 1 + inpcMes / 100;
          let fatorIpca = 1 + ipcaMes / 100;

          if (numCol1 > 0.9 && numCol1 < 3.0 && valCol1Str.includes('.')) {
            // Já é um fator de 7 casas decimais
            fatorInpc = numCol1;
            fatorIpca = numCol2 > 0.9 ? numCol2 : numCol1;
            inpcMes = (fatorInpc - 1) * 100;
            ipcaMes = (fatorIpca - 1) * 100;
          }

          if (numCol3 > 0.9 && numCol3 < 3.0) {
            fatorInpc = numCol3;
          }

          parsedItems.push({
            id: `idx_imp_${Date.now()}_${rowIndex}`,
            competencia: formattedComp,
            indiceInpcMes: parseFloat(inpcMes.toFixed(2)),
            fatorInpcAcumulado7Casas: parseFloat(fatorInpc.toFixed(7)),
            indiceIpcaMes: parseFloat(ipcaMes.toFixed(2)),
            fatorIpcaAcumulado7Casas: parseFloat(fatorIpca.toFixed(7)),
            fonte: `Importado (${file.name})`,
          });
        });

        if (parsedItems.length > 0) {
          updateIndices([...indices, ...parsedItems]);
          setSyncSuccessMessage(`${parsedItems.length} meses de índices monetários importados com sucesso do arquivo ${file.name}!`);
          setTimeout(() => setSyncSuccessMessage(null), 5000);
        } else {
          alert(`Nenhuma competência/data válida foi encontrada no arquivo ${file.name}. Certifique-se de que a planilha possui colunas com datas (ex: 01/2024) e valores de índices.`);
        }
      } catch (err) {
        console.error('Erro ao ler arquivo Excel/CSV:', err);
        alert(`Erro ao processar o arquivo ${file.name}. Certifique-se de que é uma planilha Excel (.xls / .xlsx) ou CSV válida.`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Processa Colagem de Dados do Excel
  const handleParsePastedData = () => {
    if (!pasteText.trim()) return;

    const lines = pasteText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsedItems: MonetaryIndexItem[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/\t/).map(p => p.trim());
      if (parts.length >= 2) {
        const comp = parts[0];
        const inpcVal = parseFloat(parts[1].replace(',', '.').replace('%', '')) || 0;
        const ipcaVal = parts[2] ? parseFloat(parts[2].replace(',', '.').replace('%', '')) || inpcVal : inpcVal;

        parsedItems.push({
          id: `idx_paste_${Date.now()}_${index}`,
          competencia: comp,
          indiceInpcMes: inpcVal,
          fatorInpcAcumulado7Casas: parseFloat((1 + inpcVal / 100).toFixed(7)),
          indiceIpcaMes: ipcaVal,
          fatorIpcaAcumulado7Casas: parseFloat((1 + ipcaVal / 100).toFixed(7)),
          fonte: 'Colado do Excel',
        });
      }
    });

    if (parsedItems.length > 0) {
      updateIndices([...indices, ...parsedItems]);
      setShowPasteModal(false);
      setPasteText('');
      setSyncSuccessMessage(`${parsedItems.length} meses importados via colagem com sucesso!`);
      setTimeout(() => setSyncSuccessMessage(null), 5000);
    } else {
      alert('Formato de dados colados inválido. Copie e cole as colunas (Competência, INPC %, IPCA %) direto do Excel.');
    }
  };

  React.useEffect(() => {
    if (onRegisterActions) {
      onRegisterActions({
        handleFileUpload,
        openPasteModal: () => setShowPasteModal(true),
        handleAddRow,
        handleResetIndices,
        handleClearIndices: () => updateIndices([]),
      });
    }
  }, [indices, onRegisterActions]);

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* Action Notification Banner */}

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
            <span>RECÁLCULO & SINCRONIZAÇÃO DOS FATORES DE CORREÇÃO:</span>
          </div>
          <p className="text-xs text-slate-600 font-medium whitespace-nowrap truncate">
            Acumule automaticamente os fatores multiplicativos de correção ou envie os novos índices aos contratos periciais.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRecalculateAccumulatedFactors}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-900 font-extrabold text-[11px] rounded-lg border border-slate-300 shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-blue-600" />
            <span>Recalcular Fatores Acumulados</span>
          </button>

          <button
            onClick={handleSyncFactorsWithContracts}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg border border-blue-500 shadow-2xs transition-all cursor-pointer"
          >
            <Database className="w-3 h-3 text-white" />
            <span>✨ Sincronizar Fatores com os Contratos</span>
          </button>
        </div>
      </div>

      {/* Main Index Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="bg-blue-50/80 text-slate-900 px-4 py-3 border-b border-blue-200 flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wide text-blue-900">
            SÉRIE HISTÓRICA DOS ÍNDICES MONETÁRIOS ({indices.length} MESES CADASTRADOS)
          </span>
          <span className="text-xs text-blue-700 font-mono font-bold">
            Fator Acumulado • Padrão pericial TJDFT / STJ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                <th className="py-3 px-4 text-center border-r border-slate-200 w-2/12">Competência (Mês/Ano)</th>
                <th className="py-3 px-4 text-center border-r border-slate-200 w-2/12">INPC Mensal (%)</th>
                <th className="py-3 px-4 text-center border-r border-slate-200 w-2/12">Fator INPC Acumulado</th>
                <th className="py-3 px-4 text-center border-r border-slate-200 w-2/12">IPCA Mensal (%)</th>
                <th className="py-3 px-4 text-center border-r border-slate-200 w-2/12">Fator IPCA Acumulado</th>
                <th className="py-3 px-4 border-r border-slate-200 w-2/12">Fonte / Referência</th>
                {isEditing && <th className="py-3 px-2 text-center w-1/12 no-print">Ações</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 font-normal bg-white text-slate-900">
              {indices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    <p className="text-sm font-bold text-slate-700 mb-1">Nenhum índice monetário cadastrado nesta série.</p>
                    <p className="text-xs text-slate-500">Utilize a caixa de importação acima para carregar um arquivo Excel/CSV ou clique no botão "+ Adicionar Linha".</p>
                  </td>
                </tr>
              ) : (
                indices.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-slate-800">
                  
                  {/* Competência */}
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.competencia}
                        onChange={(e) => handleUpdateItem(item.id, 'competencia', e.target.value)}
                        className="w-24 text-center px-2 py-0.5 border border-slate-300 rounded font-mono font-bold text-slate-900 bg-white text-xs"
                      />
                    ) : (
                      item.competencia
                    )}
                  </td>

                  {/* INPC Mensal % */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={item.indiceInpcMes}
                        onChange={(e) => handleUpdateItem(item.id, 'indiceInpcMes', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center px-2 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-900 bg-white text-xs"
                      />
                    ) : (
                      `${item.indiceInpcMes.toFixed(2).replace('.', ',')}%`
                    )}
                  </td>

                  {/* Fator INPC */}
                  <td className="py-2.5 px-4 text-center font-mono font-black text-blue-900 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.0000001"
                        value={item.fatorInpcAcumulado7Casas}
                        onChange={(e) => handleUpdateItem(item.id, 'fatorInpcAcumulado7Casas', parseFloat(e.target.value) || 1.0)}
                        className="w-28 text-center px-2 py-0.5 border border-slate-300 rounded font-mono font-black text-blue-900 bg-white text-xs"
                      />
                    ) : (
                      item.fatorInpcAcumulado7Casas.toFixed(7)
                    )}
                  </td>

                  {/* IPCA Mensal % */}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-900 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={item.indiceIpcaMes}
                        onChange={(e) => handleUpdateItem(item.id, 'indiceIpcaMes', parseFloat(e.target.value) || 0)}
                        className="w-20 text-center px-2 py-0.5 border border-slate-300 rounded font-mono font-normal text-slate-900 bg-white text-xs"
                      />
                    ) : (
                      `${item.indiceIpcaMes.toFixed(2).replace('.', ',')}%`
                    )}
                  </td>

                  {/* Fator IPCA */}
                  <td className="py-2.5 px-4 text-center font-mono font-black text-emerald-800 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.0000001"
                        value={item.fatorIpcaAcumulado7Casas}
                        onChange={(e) => handleUpdateItem(item.id, 'fatorIpcaAcumulado7Casas', parseFloat(e.target.value) || 1.0)}
                        className="w-28 text-center px-2 py-0.5 border border-slate-300 rounded font-mono font-black text-emerald-800 bg-white text-xs"
                      />
                    ) : (
                      item.fatorIpcaAcumulado7Casas.toFixed(7)
                    )}
                  </td>

                  {/* Fonte */}
                  <td className="py-2.5 px-4 font-normal text-slate-700 border-r border-slate-200">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.fonte}
                        onChange={(e) => handleUpdateItem(item.id, 'fonte', e.target.value)}
                        className="w-full px-2 py-0.5 border border-slate-300 rounded text-slate-800 bg-white text-xs"
                      />
                    ) : (
                      item.fonte
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
              ))
              )}
            </tbody>

            <tfoot>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase text-xs border-t-2 border-slate-300">
                <td className="py-3 px-4 text-center font-black">TOTAL: {indices.length} MESES</td>
                <td className="py-3 px-4 text-center font-black text-blue-900 font-mono" colSpan={2}>
                  Último Fator INPC: {indices[indices.length - 1]?.fatorInpcAcumulado7Casas.toFixed(7) || '1.0000000'}
                </td>
                <td className="py-3 px-4 text-center font-black text-emerald-800 font-mono" colSpan={2}>
                  Último Fator IPCA: {indices[indices.length - 1]?.fatorIpcaAcumulado7Casas.toFixed(7) || '1.0000000'}
                </td>
                <td className="py-3 px-4 font-black" colSpan={isEditing ? 2 : 1}>
                  Série Atualizada IBGE
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Paste Excel Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 font-sans animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Clipboard className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Colar Tabela de Índices do Excel</h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Copie as colunas da sua planilha no Excel e cole abaixo. O formato esperado por linha é: <br />
              <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-blue-900 border border-slate-300">
                [Competência (ex: 01/2025)] [INPC %] [IPCA %]
              </code>
            </p>

            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={`01/2025\t0,59\t0,52\n02/2025\t0,76\t0,81\n03/2025\t0,28\t0,24`}
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
                Importar Dados Colados
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
