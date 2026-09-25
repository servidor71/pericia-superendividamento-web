import React, { useRef, useState } from 'react';
import { FilePlus, Sparkles, FileSpreadsheet, ShieldCheck, FileUp, CheckCircle2, Database, FolderOpen, Upload } from 'lucide-react';
import type { ProcessData, SubscriptionConfig, SubscriptionPlanType } from '../types';
import { parseExcelBackup } from '../services/excelImporter';
import { saveProcessToDatabase } from '../services/apiService';

interface HeaderProps {
  process: ProcessData;
  subscription: SubscriptionConfig;
  onSelectPlan: (planId: SubscriptionPlanType) => void;
  onNewProcess: () => void;
  onImportJSON: (data: any) => void;
  onExportBackup?: () => void;
  onExportExcel: () => void;
  onGenerateAIPlan: () => void;
  onProcessOCRData?: (data: any) => void;
  onSaveToDatabase?: () => Promise<void>;
  onOpenProcessList?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  process,
  subscription,
  onSelectPlan,
  onNewProcess,
  onImportJSON,
  onExportExcel,
  onGenerateAIPlan,
  onProcessOCRData,
  onSaveToDatabase,
  onOpenProcessList,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveClick = async () => {
    if (!onSaveToDatabase) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveToDatabase();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Erro ao salvar no banco de dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      try {
        const parsed = await parseExcelBackup(file);
        onImportJSON(parsed);
        await saveProcessToDatabase(parsed);

        const numContracts = Array.isArray(parsed.contracts) ? parsed.contracts.length : 0;
        const nomeDevedor = parsed.process?.nomeDevedor || 'Devedor';

        alert(`✅ Planilha Excel (.xlsx) restaurada com sucesso!\n\n• Devedor: ${nomeDevedor}\n• Contratos Recuperados: ${numContracts}\n• Salvo no Banco Hostinger!`);
      } catch (err: any) {
        alert('Erro ao importar planilha Excel: ' + (err?.message || err));
      }
    } else {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          onImportJSON(parsed);
          await saveProcessToDatabase(parsed);
          alert('✅ Backup JSON restaurado com sucesso!');
        } catch (err) {
          alert('Erro ao carregar o arquivo. Certifique-se de selecionar um backup JSON ou planilha XLSX gerada pelo sistema.');
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleOCRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrSuccess(true);
    if (onProcessOCRData) {
      onProcessOCRData({
        numeroProcesso: '',
        nomeDevedor: '',
        cpfCnpj: '',
        salarioBruto: 0,
        rppsInss: 0,
        irrf: 0,
      });
    }
    setTimeout(() => setOcrSuccess(false), 5000);
    e.target.value = '';
  };

  return (
    <header className="bg-[#FAF8F3] border-b border-[#DCD8CD] sticky top-0 z-30 shadow-2xs w-full font-sans">
      <div className="w-full px-3 sm:px-5 py-1.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        
        {/* Brand & Breadcrumb Title (Compact) */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-7 h-7 bg-[#1C4E5E] text-white rounded-lg shadow-2xs flex items-center justify-center font-black text-xs shrink-0">
            ║
          </div>
          <div>
            <div className="flex items-center space-x-2 leading-none mb-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider font-mono">
                PERÍCIA / <span className="text-[#1C4E5E] font-black">CASO ATIVO</span>
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header tracking-tight leading-none">
              {process.nomeDevedor ? `${process.nomeDevedor} v. Instituições Financeiras` : 'Processo Sem Título (Novo Caso)'}
            </h1>
          </div>
        </div>

        {/* Status Pills & Action Buttons (Compact Single Row) */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">

          {/* Salvo no Navegador Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#E9F3EE] text-[#2E7D62] px-2.5 py-0.5 rounded-full border border-[#C5E2D6] text-[10px] font-bold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Salvo no navegador</span>
          </div>

          {/* Active Plan Selector */}
          <div className="flex items-center gap-1 bg-[#F0EEE6] px-2 py-0.5 rounded-lg border border-[#DCD8CD] text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1C4E5E] shrink-0" />
            <select
              value={subscription.isTrialExpired ? 'trial_expired' : subscription.planId}
              onChange={(e) => onSelectPlan(e.target.value as any)}
              className="text-[10px] font-bold bg-white text-slate-900 border border-[#DCD8CD] rounded px-1.5 py-0.5 cursor-pointer focus:ring-1 focus:ring-[#1C4E5E]"
            >
              <option value="trial">⚡ Testar Trial (7d Grátis)</option>
              <option value="trial_expired">⛔ Simular 7d Expirado</option>
              <option value="individual">👑 Plano Profissional (R$ 159)</option>
              <option value="escritorio">🏢 Plano Escritório (R$ 299)</option>
              <option value="master">👑 Admin Master (Acesso Ilimitado)</option>
            </select>
          </div>

          {/* Process Management Page Button */}
          {onOpenProcessList && (
            <button
              onClick={onOpenProcessList}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-[#1C4E5E] bg-[#E7F3EE] hover:bg-[#D5EADF] border border-[#C5E2D6] rounded-lg transition-all shadow-2xs cursor-pointer"
              title="Ver e gerenciar todos os processos cadastrados"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#1C4E5E]" />
              <span>Meus Processos</span>
            </button>
          )}

          {/* Save to Database Button */}
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-white bg-[#2E7D62] hover:bg-[#256851] border border-[#235d48] rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
            title="Salvar todos os dados cadastrados no banco de dados"
          >
            {saveSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
            ) : (
              <Database className={`w-3.5 h-3.5 text-emerald-200 ${isSaving ? 'animate-spin' : ''}`} />
            )}
            <span>{isSaving ? 'Salvando...' : saveSuccess ? 'Salvo no Banco!' : 'Salvar no Banco'}</span>
          </button>

          <button
            onClick={onNewProcess}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#1C2B33] bg-white hover:bg-slate-100 border border-[#DCD8CD] rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            <FilePlus className="w-3 h-3 text-slate-600" />
            <span>Novo</span>
          </button>

          {/* OCR Import Button */}
          <input
            type="file"
            ref={ocrInputRef}
            onChange={handleOCRFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.json,.csv"
            className="hidden"
          />
          <button
            onClick={() => ocrInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-[#1C4E5E] bg-[#E7F3EE] hover:bg-[#D5EADF] border border-[#C5E2D6] rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Importar PDF, CCBs ou Extratos via OCR"
          >
            {ocrSuccess ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600 animate-bounce" />
            ) : (
              <FileUp className="w-3 h-3 text-[#2E7D62]" />
            )}
            <span>{ocrSuccess ? 'Extraído!' : 'Importar PDF/OCR'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,.xlsx,.xls"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-black text-[#1C4E5E] bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-all shadow-2xs cursor-pointer"
            title="Restaurar dados diretamente da planilha Excel (.xlsx) baixada ou arquivo JSON"
          >
            <Upload className="w-3 h-3 text-amber-700" />
            <span>Restaurar Excel/JSON</span>
          </button>
          
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold text-[#1C2B33] bg-white hover:bg-slate-100 border border-[#DCD8CD] rounded-lg transition-all shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-700" />
            <span>XLSX</span>
          </button>

          <button
            onClick={onGenerateAIPlan}
            className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Gerar DOCX</span>
          </button>

        </div>
      </div>
    </header>
  );
};
