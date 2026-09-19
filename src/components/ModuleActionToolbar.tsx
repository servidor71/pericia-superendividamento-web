import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export interface ModuleActionToolbarProps {
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onClear?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onSave?: () => void;
  onUpgrade?: () => void;
  editLabel?: string;
  clearLabel?: string;
  deleteLabel?: string;
  restoreLabel?: string;
  saveLabel?: string;
  upgradeLabel?: string;
  moduleTitle?: string;
  extraActions?: React.ReactNode;
}

export const ModuleActionToolbar: React.FC<ModuleActionToolbarProps> = ({
  isEditing = false,
  onToggleEdit,
  onClear,
  onDelete,
  onRestore,
  onSave,
  editLabel,
  clearLabel = 'Limpar',
  deleteLabel = 'Deletar',
  restoreLabel = 'Restaurar',
  saveLabel = 'Salvar',
  moduleTitle,
  extraActions,
}) => {
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = () => {
    if (onSave) onSave();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="bg-[#FAF8F3] py-2 px-3 sm:px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full my-2.5 font-sans">
      
      {/* Title / Module Badge & Feedback Toast */}
      <div className="flex items-center space-x-2">
        {moduleTitle && (
          <span className="text-[11px] font-black uppercase tracking-wider text-[#1C4E5E]">
            {moduleTitle}
          </span>
        )}
        {saveToast && (
          <span className="flex items-center gap-1 bg-[#E7F3EE] text-[#2E7D62] border border-[#C5E2D6] text-[11px] px-2.5 py-0.5 rounded-full font-extrabold animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D62]" />
            <span>Dados Salvos com Sucesso!</span>
          </span>
        )}
      </div>

      {/* Action Buttons Toolbar: Concluir | Limpar | Deletar | Restaurar | Salvar | Upgrade */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {extraActions}

        {/* 1. CONCLUIR / EDITAR */}
        {onToggleEdit && (
          <button
            type="button"
            onClick={onToggleEdit}
            className={`px-4 py-1 text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs border ${
              isEditing
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500'
                : 'bg-amber-300 hover:bg-amber-400 text-slate-900 border-amber-400'
            }`}
            title="Alternar Edição / Concluir"
          >
            <span>{editLabel || (isEditing ? 'Concluir' : 'Editar')}</span>
          </button>
        )}

        {/* 2. LIMPAR */}
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
            title="Limpar campos e dados"
          >
            <span>{clearLabel}</span>
          </button>
        )}

        {/* 3. DELETAR */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-4 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
            title="Deletar dados do módulo/aba"
          >
            <span>{deleteLabel}</span>
          </button>
        )}

        {/* 4. RESTAURAR */}
        {onRestore && (
          <button
            type="button"
            onClick={onRestore}
            className="px-4 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
            title="Restaurar padrão inicial"
          >
            <span>{restoreLabel}</span>
          </button>
        )}

        {/* 5. SALVAR */}
        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
            title="Salvar dados do módulo/aba"
          >
            <span>{saveLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
