import React, { useState, useRef } from 'react';
import { FileUp, Cpu, CheckCircle2, Sparkles } from 'lucide-react';

interface TopBannerOCRProps {
  onProcessExtractedData: (extracted: any) => void;
}

export const TopBannerOCR: React.FC<TopBannerOCRProps> = ({ onProcessExtractedData }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setExtractedSuccess(false);
    setLastUploadedFile(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      setTimeout(() => {
        setIsProcessing(false);
        setExtractedSuccess(true);

        const contentStr = event.target?.result as string;
        let mockExtracted: any = {};

        // Tentativa de parsing inteligente se for JSON
        if (file.name.endsWith('.json') && contentStr) {
          try {
            const parsed = JSON.parse(contentStr);
            mockExtracted = {
              numeroProcesso: parsed.process?.numeroProcesso || parsed.numeroProcesso,
              nomeDevedor: parsed.process?.nomeDevedor || parsed.nomeDevedor,
              cpfCnpj: parsed.process?.cpfCnpj || parsed.cpfCnpj,
              salarioBruto: parsed.income?.salarioBruto || parsed.salarioBruto,
              rppsInss: parsed.income?.rppsInss || parsed.rppsInss,
              irrf: parsed.income?.irrf || parsed.irrf,
            };
          } catch (err) {
            // fallback
          }
        }

        onProcessExtractedData(mockExtracted);

        setTimeout(() => setExtractedSuccess(false), 7000);
      }, 1000);
    };

    // Lê como texto ou arraybuffer
    reader.readAsText(file);
    // Limpa a seleção para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/80 via-white to-blue-50/80 text-slate-900 border-b border-slate-200 px-4 py-2.5 shadow-2xs w-full">
      <div className="w-full max-w-full px-2 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        
        {/* Left Label & Description */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-slate-900 tracking-tight">
                Leitor Automático de Documentos (OCR)
              </span>
              <span className="bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full border border-blue-300">
                Engine V4.0
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Importe PDF, Contracheques, CCBs ou Extratos para preencher automaticamente os dados do devedor e contratos
            </p>
          </div>
        </div>

        {/* Right CTA Button & File Input */}
        <div className="flex items-center space-x-3 shrink-0">
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.json,.csv"
            className="hidden"
          />

          {isProcessing ? (
            <div className="flex items-center space-x-2 bg-blue-100 text-blue-900 border border-blue-300 px-3 py-1.5 rounded-xl font-bold">
              <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
              <span>Processando OCR...</span>
            </div>
          ) : extractedSuccess ? (
            <div className="flex items-center space-x-2 bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Dados Extraídos: {lastUploadedFile}</span>
            </div>
          ) : (
            <button
              onClick={handleButtonClick}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 border border-blue-500 rounded-xl transition-all shadow-2xs cursor-pointer active:scale-95"
              title="Importar PDF ou Imagem para Extração via OCR"
            >
              <FileUp className="w-4 h-4 text-white" />
              <span>Importar PDF/OCR</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
