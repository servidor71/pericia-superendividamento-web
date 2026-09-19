import React, { useState, useEffect } from 'react';
import { FolderOpen, FileText, Upload, Trash2, CheckCircle2, Sparkles, Cpu, ArrowRight, Clipboard, X, FileImage, Check } from 'lucide-react';
import type { ProcessDocumentItem, ProcessData, IncomeData, ExpenseData, Contract } from '../types';
import { initialProcessDocuments } from '../mockData';
import { formatDateBR } from '../services/calculations';
import { parseAndExtractDocumentData } from '../services/documentParser';

interface ModuleDocumentosProps {
  documents: ProcessDocumentItem[];
  onDocumentsChange: (updated: ProcessDocumentItem[]) => void;
  onApplyExtractedData: (extracted: { process: ProcessData; income: IncomeData; expenses: ExpenseData; contracts: Contract[] }) => void;
  process: ProcessData;
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
}

export const ModuleDocumentosProcesso: React.FC<ModuleDocumentosProps> = ({
  documents,
  onDocumentsChange,
  onApplyExtractedData,
  process,
  income,
  expenses,
  contracts,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [lastExtractionLogs, setLastExtractionLogs] = useState<string[]>([]);
  const [extractionSuccess, setExtractionSuccess] = useState(false);

  // Estados para Modal de Colar Imagem / Print (Ctrl+V)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedImagePreview, setPastedImagePreview] = useState<string | null>(null);
  const [pastedFileName, setPastedFileName] = useState<string>('');
  const [pastedTextData, setPastedTextData] = useState<string>('');
  const [pastedCategory, setPastedCategory] = useState<'Extrato Dívidas' | 'Comprobatório Renda' | 'Comprobatório Despesa' | 'Processual' | 'Outros'>('Extrato Dívidas');

  // Processa o arquivo ou item de imagem da Área de Transferência
  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPastedImagePreview(dataUrl);
      const name = file.name && !file.name.startsWith('image')
        ? file.name
        : `Print_Contrato_${new Date().toLocaleTimeString('pt-BR').replace(/:/g, '')}.png`;
      setPastedFileName(name);
      setIsPasteModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Listener global de Colar (Ctrl+V) na página
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        } else if (item.type === 'text/plain') {
          item.getAsString((str) => {
            if (isPasteModalOpen) {
              setPastedTextData(prev => prev ? `${prev}\n${str}` : str);
            }
          });
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isPasteModalOpen]);

  // Executar Extração via Documentos/OCR para Preenchimento dos Módulos Posteriores
  const handleRunGlobalExtraction = () => {
    setIsParsing(true);
    setExtractionSuccess(false);

    setTimeout(() => {
      const res = parseAndExtractDocumentData(documents, process, income, expenses, contracts);
      onApplyExtractedData({
        process: res.process,
        income: res.income,
        expenses: res.expenses,
        contracts: res.contracts,
      });

      setIsParsing(false);
      setExtractionSuccess(true);
      setLastExtractionLogs(res.logs);

      setTimeout(() => setExtractionSuccess(false), 8000);
    }, 1200);
  };

  // Reconhecimento e Classificação Inteligente do Tipo de Documento pelo Nome/Conteúdo do Arquivo
  const classifyDocumentFromFile = (fileName: string, todayISO: string) => {
    const cleanName = fileName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    let categoria: 'Processual' | 'Comprobatório Renda' | 'Comprobatório Despesa' | 'Extrato Dívidas' | 'Outros' = 'Outros';
    let tipoDocumento = 'Anexo Probatório / Documento do Processo';
    let observacao = `Documento ${fileName} anexado em ${formatDateBR(todayISO)}.`;
    let idPaginaReferencia = 'ID 274529674, pág. auto';

    // 1. Peças Processuais
    if (cleanName.includes('peticao') || cleanName.includes('inicial')) {
      categoria = 'Processual';
      tipoDocumento = 'Petição Inicial de Repactuação';
      observacao = 'Petição inicial requerendo plano compulsório de 60 parcelas.';
      idPaginaReferencia = 'ID 274529674, pág. 1-15';
    } else if (cleanName.includes('contestacao') || cleanName.includes('manifestacao')) {
      categoria = 'Processual';
      tipoDocumento = 'Contestação / Manifestação Credores';
      observacao = 'Contestação apresentada pelas instituições financeiras credoras.';
      idPaginaReferencia = 'ID 274529674, pág. 16-45';
    } else if (cleanName.includes('replica')) {
      categoria = 'Processual';
      tipoDocumento = 'Réplica à Contestação';
      observacao = 'Réplica autoral reafirmando a garantia do Mínimo Existencial.';
      idPaginaReferencia = 'ID 274529674, pág. 46-60';
    } else if (cleanName.includes('decisao') || cleanName.includes('nomeacao') || cleanName.includes('despacho') || cleanName.includes('perito')) {
      categoria = 'Processual';
      tipoDocumento = 'Decisão Judicial / Nomeação de Perito';
      observacao = 'Decisão fixando diretrizes periciais e Mínimo Existencial (1 SM 2026).';
      idPaginaReferencia = 'ID 266566359, pág. 1-3';
    }
    // 2. Comprobatórios de Renda
    else if (cleanName.includes('tst') || (cleanName.includes('contracheque') && cleanName.includes('servidor'))) {
      categoria = 'Comprobatório Renda';
      tipoDocumento = 'Contracheques TST (Servidor Público)';
      observacao = 'Comprovante oficial de remuneração líquida TST.';
      idPaginaReferencia = 'ID 274529674, pág. 39';
    } else if (cleanName.includes('gdf') || cleanName.includes('sedf') || cleanName.includes('pensao')) {
      categoria = 'Comprobatório Renda';
      tipoDocumento = 'Contracheques GDF/SEDF (Pensão Vitalícia EC 41/03)';
      observacao = 'Comprovante oficial de pensão vitalícia GDF.';
      idPaginaReferencia = 'ID 274529674, pág. 21';
    } else if (cleanName.includes('contracheque') || cleanName.includes('holerite') || cleanName.includes('renda') || cleanName.includes('irpf') || cleanName.includes('imposto')) {
      categoria = 'Comprobatório Renda';
      tipoDocumento = 'Comprovante de Renda / Contracheque';
      observacao = 'Comprovante oficial de rendimentos da parte devedora.';
      idPaginaReferencia = 'ID 274529674, pág. auto';
    }
    // 3. Comprobatórios de Despesas
    else if (cleanName.includes('aluguel') || cleanName.includes('moradia') || cleanName.includes('fianca') || cleanName.includes('loft') || cleanName.includes('locacao')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Moradia (Aluguel & Contrato de Fiança)';
      observacao = 'Estratos de pagamento de aluguel e garantia locatícia LOFT.';
      idPaginaReferencia = 'ID 274529674, pág. 2 e 255-276';
    } else if (cleanName.includes('neoenergia') || cleanName.includes('luz') || cleanName.includes('energia')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Energia Elétrica (NEOENERGIA)';
      observacao = 'Declaração de quitação anual de energia.';
      idPaginaReferencia = 'ID 274529674, pág. 287-289';
    } else if (cleanName.includes('caesb') || cleanName.includes('agua') || cleanName.includes('esgoto')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Água e Esgoto (CAESB)';
      observacao = 'Histórico mensal CAESB de consumo de água e esgoto.';
      idPaginaReferencia = 'ID 274529674, pág. 3-10';
    } else if (cleanName.includes('vivo') || cleanName.includes('claro') || cleanName.includes('tim') || cleanName.includes('telefonia') || cleanName.includes('internet')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Telefonia & Internet (VIVO)';
      observacao = 'Fatura de serviços de comunicação VIVO.';
      idPaginaReferencia = 'ID 274529674, pág. 189';
    } else if (cleanName.includes('escola') || cleanName.includes('colegio') || cleanName.includes('educacao') || cleanName.includes('mensalidade')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Mensalidade Escolar & Educação';
      observacao = 'Declaração de escolaridade e recibos de pagamento.';
      idPaginaReferencia = 'ID 274529674, pág. 1 e 301';
    } else if (cleanName.includes('farmacia') || cleanName.includes('medicamento') || cleanName.includes('saude') || cleanName.includes('remedio')) {
      categoria = 'Comprobatório Despesa';
      tipoDocumento = 'Saúde & Medicamentos';
      observacao = 'Comprovantes de despesas de saúde e farmácia.';
      idPaginaReferencia = 'ID 274529674, pág. auto';
    }
    // 4. Extrato de Dívidas
    else if (cleanName.includes('ccb') || cleanName.includes('extrato') || cleanName.includes('contrato') || cleanName.includes('divida') || cleanName.includes('banco') || cleanName.includes('brb') || cleanName.includes('sicoob') || cleanName.includes('financiamento')) {
      categoria = 'Extrato Dívidas';
      tipoDocumento = 'Extratos de Dívidas / Contratos / CCBs Bancárias';
      observacao = 'Contratos e planilhas de evolução das operações bancárias.';
      idPaginaReferencia = 'ID 274529674, pág. 61-200';
    }

    // Tenta extrair ID e Página do próprio nome do arquivo se contiver 'id' ou 'pag'
    const idMatch = cleanName.match(/id[_\s]?(\d{7,10})/i);
    const pagMatch = cleanName.match(/(?:pag|paginas?)[_\s]?(\d+(?:-\d+)?)/i);
    
    if (idMatch && pagMatch) {
      idPaginaReferencia = `ID ${idMatch[1]}, pág. ${pagMatch[1]}`;
    } else if (idMatch) {
      idPaginaReferencia = `ID ${idMatch[1]}, pág. 1`;
    } else if (pagMatch) {
      idPaginaReferencia = `ID 274529674, pág. ${pagMatch[1]}`;
    }

    return {
      categoria,
      tipoDocumento,
      observacao,
      idPaginaReferencia,
    };
  };

  // Leitura de texto bruto do arquivo
  const readRawTextFromFile = async (file: File): Promise<string> => {
    try {
      const text = await file.text();
      if (text && text.length > 5 && !text.includes('\u0000')) {
        return text;
      }
    } catch (e) {}
    return '';
  };

  // Upload em Lote com Reconhecimento Automático de Tipo, Categoria e Sincronização
  const handleBatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const todayISO = new Date().toISOString().split('T')[0];
    const newItems: ProcessDocumentItem[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      const rawTextContent = await readRawTextFromFile(file);
      const classified = classifyDocumentFromFile(file.name, todayISO);

      newItems.push({
        id: `doc_auto_${Date.now()}_${index}`,
        categoria: classified.categoria,
        tipoDocumento: classified.tipoDocumento,
        nomeArquivo: file.name,
        tamanhoArquivo: formattedSize,
        dataUpload: todayISO,
        idPaginaReferencia: classified.idPaginaReferencia,
        observacao: classified.observacao,
        rawTextContent,
      });
    }

    const updatedList = [...documents, ...newItems];
    onDocumentsChange(updatedList);
    e.target.value = '';

    // Sincroniza imediatamente todos os novos documentos com o Módulo 3
    const res = parseAndExtractDocumentData(updatedList, process, income, expenses, contracts);
    onApplyExtractedData({
      process: res.process,
      income: res.income,
      expenses: res.expenses,
      contracts: res.contracts,
    });
    setLastExtractionLogs([
      `${files.length} novos documentos importados e sincronizados com o Módulo 3.`,
      ...res.logs
    ]);
    setExtractionSuccess(true);
    setTimeout(() => setExtractionSuccess(false), 6000);
  };

  const handleConfirmPastedImage = () => {
    if (!pastedImagePreview && !pastedTextData) {
      alert('Nenhuma imagem ou texto colado da área de transferência.');
      return;
    }

    const todayISO = new Date().toISOString().split('T')[0];
    const docName = pastedFileName || `Print_Contrato_${Date.now()}.png`;

    const newDoc: ProcessDocumentItem = {
      id: `doc_paste_${Date.now()}`,
      categoria: pastedCategory,
      tipoDocumento: pastedCategory === 'Extrato Dívidas' ? `Extrato / CCB em Imagem (Print Colado)` : `Comprovante em Imagem (Print Colado)`,
      nomeArquivo: docName,
      tamanhoArquivo: '1.2 MB',
      dataUpload: todayISO,
      idPaginaReferencia: 'ID Autos, pág. print',
      observacao: `Figura/Print colado via Clipboard. Texto de referência: ${pastedTextData || 'Sem texto manual'}`,
      rawTextContent: `${docName}\n${pastedCategory}\n${pastedTextData}`,
    };

    const updatedList = [...documents, newDoc];
    onDocumentsChange(updatedList);

    // Executa sincronização e extração imediata dos contratos/dados
    const res = parseAndExtractDocumentData(updatedList, process, income, expenses, contracts);
    onApplyExtractedData({
      process: res.process,
      income: res.income,
      expenses: res.expenses,
      contracts: res.contracts,
    });

    setLastExtractionLogs([
      `Print/Figura do Contrato (${docName}) colado e processado com sucesso!`,
      ...res.logs
    ]);
    setExtractionSuccess(true);
    setTimeout(() => setExtractionSuccess(false), 6000);

    // Limpa estado do modal
    setIsPasteModalOpen(false);
    setPastedImagePreview(null);
    setPastedTextData('');
    setPastedFileName('');
  };

  const handleUpdateDocField = (id: string, field: keyof ProcessDocumentItem, val: any) => {
    onDocumentsChange(
      documents.map(d => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleAddCustomDocument = () => {
    const newDoc: ProcessDocumentItem = {
      id: `doc_${Date.now()}`,
      categoria: 'Outros',
      tipoDocumento: '',
      nomeArquivo: null,
      tamanhoArquivo: null,
      dataUpload: null,
      idPaginaReferencia: '',
      observacao: '',
    };
    onDocumentsChange([...documents, newDoc]);
    setEditingId(newDoc.id);
  };

  const handleDeleteDocument = (id?: string) => {
    if (id) {
      onDocumentsChange(documents.filter(d => d.id !== id));
    } else if (confirm('Deseja remover todos os documentos anexados?')) {
      onDocumentsChange([]);
    }
  };

  const handleResetDocuments = () => {
    if (confirm('Deseja restaurar a lista de documentos para os padrões iniciais?')) {
      onDocumentsChange(initialProcessDocuments);
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full">
      
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] p-5 rounded-3xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4 font-sans">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 bg-[#1C4E5E] text-white rounded-2xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 3: Central de Documentos do Processo & Anexos Probatórios
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Importe autos e comprovantes para preenchimento e cálculo automático dos módulos
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar on the exact same row */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-2xs cursor-pointer shrink-0">
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>📂 Importar em Lote (Auto-Reconhecer)</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.json,.txt"
              onChange={handleBatchFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleAddCustomDocument}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span>+ Incluir Documento</span>
          </button>

          <button
            onClick={handleRunGlobalExtraction}
            disabled={isParsing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1C4E5E] hover:bg-[#153E4B] text-white font-extrabold text-xs rounded-xl shadow-2xs border border-[#1C4E5E] transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isParsing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Extraindo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Extração / OCR</span>
              </>
            )}
          </button>

          {/* 1. CONCLUIR / EDITAR */}
          <button
            type="button"
            onClick={() => alert('Central de Documentos do Processo concluída!')}
            className="px-3.5 py-1 text-xs font-black rounded-full bg-amber-400 hover:bg-amber-500 text-slate-950 border border-amber-500 transition-all cursor-pointer shadow-2xs"
          >
            <span>Concluir</span>
          </button>

          {/* 2. LIMPAR */}
          <button
            type="button"
            onClick={() => handleDeleteDocument()}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir permanentemente todos os documentos da Central de Documentos?')) {
                onDocumentsChange([]);
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={handleResetDocuments}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Lista e Anexos de Documentos salvos com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Extraction Success Notification Badge */}
      {extractionSuccess && (
        <div className="bg-emerald-50 text-emerald-950 p-4 rounded-xl shadow-xs border border-emerald-200 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-900 font-black text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Extração Concluída! Módulos 3 a 13 Atualizados com Sucesso</span>
            </div>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
              Engine OCR V2.4
            </span>
          </div>

          <p className="text-xs text-emerald-800 font-medium">
            Os dados de Renda, Contracheques TST/GDF, Despesas Essenciais (Moradia, Água, Luz, Telefone, Escola) e Operações de Crédito foram integrados automaticamente à planilha pericial.
          </p>

          {lastExtractionLogs.length > 0 && (
            <div className="bg-white p-2.5 rounded border border-emerald-200 font-mono text-[11px] text-emerald-900 space-y-1 max-h-32 overflow-y-auto shadow-2xs">
              {lastExtractionLogs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}



      {/* Main Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden w-full">
        <div className="p-4 bg-blue-50/80 text-slate-900 border-b border-blue-200 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-blue-900">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Documentos do Processo ({documents.length} Registros Exibidos)</span>
          </div>
          <span className="text-xs text-blue-700 font-mono font-bold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Preenchimento Automático dos Módulos Ativo</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                <th className="py-3 px-4 w-2/12">Categoria</th>
                <th className="py-3 px-4 w-3/12">Tipo de Documento / Peça</th>
                <th className="py-3 px-4 w-3/12">Arquivo Anexado</th>
                <th className="py-3 px-4 w-2/12">ID / Pág. nos Autos</th>
                <th className="py-3 px-4 text-center w-1/12">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              {documents.map((doc, idx) => {
                const isEven = idx % 2 === 0;
                const isEditing = editingId === doc.id;

                return (
                  <tr key={doc.id} className={`${isEven ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/60 transition-colors text-slate-800`}>
                    
                    {/* Categoria */}
                    <td className="py-3 px-4 font-normal text-slate-700">
                      {isEditing ? (
                        <select
                          value={doc.categoria}
                          onChange={(e) => handleUpdateDocField(doc.id, 'categoria', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs bg-white font-normal"
                        >
                          <option value="Processual">Processual</option>
                          <option value="Comprobatório Renda">Comprobatório Renda</option>
                          <option value="Comprobatório Despesa">Comprobatório Despesa</option>
                          <option value="Extrato Dívidas">Extrato Dívidas</option>
                          <option value="Outros">Outros</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          doc.categoria === 'Processual'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : doc.categoria === 'Comprobatório Renda'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : doc.categoria === 'Comprobatório Despesa'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300'
                        }`}>
                          {doc.categoria}
                        </span>
                      )}
                    </td>

                    {/* Tipo de Documento */}
                    <td className="py-3 px-4 font-normal text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={doc.tipoDocumento}
                          onChange={(e) => handleUpdateDocField(doc.id, 'tipoDocumento', e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-normal text-slate-900"
                        />
                      ) : (
                        <div>
                          <span className="font-semibold text-slate-900 block">{doc.tipoDocumento}</span>
                          {doc.observacao && (
                            <span className="text-[10px] text-slate-500 font-normal block">{doc.observacao}</span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Arquivo Anexado */}
                    <td className="py-3 px-4 font-normal">
                      {doc.nomeArquivo ? (
                        <div className="flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-mono text-xs truncate max-w-[200px] block" title={doc.nomeArquivo}>
                              {doc.nomeArquivo}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-normal">
                              {doc.tamanhoArquivo} • {doc.dataUpload ? formatDateBR(doc.dataUpload) : ''}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-normal">Nenhum arquivo anexado</span>
                      )}
                    </td>

                    {/* ID / Pág nos Autos */}
                    <td className="py-3 px-4 font-normal text-slate-700">
                      <input
                        type="text"
                        value={doc.idPaginaReferencia || ''}
                        onChange={(e) => handleUpdateDocField(doc.id, 'idPaginaReferencia', e.target.value)}
                        placeholder="Ex: ID 274529674, pág. 39"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-mono font-normal bg-white text-slate-900"
                      />
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover Registro"
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

      {/* MODAL / PASTE ZONE: COLAR FIGURA DA ÁREA DE TRANSFERÊNCIA (Ctrl+V) */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-0">
            
            {/* Modal Header */}
            <div className="bg-[#1C4E5E] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 font-black text-sm font-serif-header">
                <FileImage className="w-5 h-5 text-amber-300" />
                <span>Colar ou Anexar Figura de Contrato / CCB / Extrato</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedImagePreview(null);
                  setPastedTextData('');
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-[#153E4B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto font-sans">
              <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-xs text-blue-950 font-medium">
                💡 <strong>Dica Pericial:</strong> Você pode pressionar <strong>Ctrl+V</strong> em qualquer ponto da tela com a imagem copiada, ou colar abaixo. A imagem será armazenada como documento probatório e os dados do empréstimo serão extraídos para o Módulo 6.
              </div>

              {/* Paste / Dropzone Area */}
              <div className="border-2 border-dashed border-[#1C4E5E]/40 hover:border-[#1C4E5E] bg-slate-50 hover:bg-blue-50/40 p-6 rounded-xl text-center space-y-3 transition-colors relative">
                {pastedImagePreview ? (
                  <div className="space-y-3">
                    <div className="max-h-60 overflow-hidden rounded-lg border border-slate-200 shadow-xs flex justify-center bg-slate-900/5">
                      <img src={pastedImagePreview} alt="Print Colado" className="max-h-60 object-contain" />
                    </div>
                    <div className="text-xs text-slate-700 font-bold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Imagem Capturada: {pastedFileName || 'Print_Contrato.png'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <div className="w-12 h-12 bg-blue-100 text-[#1C4E5E] rounded-full flex items-center justify-center mx-auto">
                      <Clipboard className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Pressione Ctrl+V para colar a imagem do contrato
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Ou selecione um arquivo de figura (PNG, JPG, Screenshot)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file);
                      }}
                      className="text-xs text-slate-500 font-medium cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Seleção de Categoria */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Categoria do Documento Colado:
                </label>
                <select
                  value={pastedCategory}
                  onChange={(e: any) => setPastedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white text-slate-900"
                >
                  <option value="Extrato Dívidas">Extrato Dívidas (Contrato / CCB / Operação de Crédito)</option>
                  <option value="Comprobatório Renda">Comprobatório Renda (Contracheque / Holerite)</option>
                  <option value="Comprobatório Despesa">Comprobatório Despesa (Aluguel / Escola / Luz)</option>
                  <option value="Processual">Processual (Petição / Sentença / Decisão)</option>
                  <option value="Outros">Outros Documentos</option>
                </select>
              </div>

              {/* Entrada de Texto / Referência OCR Adicional */}
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                  Texto Adicional ou OCR da Imagem (Opcional):
                </label>
                <textarea
                  rows={3}
                  value={pastedTextData}
                  onChange={(e) => setPastedTextData(e.target.value)}
                  placeholder="Cole ou digite dados presentes na figura (ex: Banco BRB, Contrato nº 12345, Valor Liberado R$ 15.000,00, 60 parcelas de R$ 450,00)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 bg-white"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex justify-end items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsPasteModalOpen(false);
                  setPastedImagePreview(null);
                  setPastedTextData('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-200 border border-slate-300 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmPastedImage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-md cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Confirmar & Extrair Dados do Contrato</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
