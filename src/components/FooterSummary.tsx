import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercent } from '../services/calculations';

interface FooterSummaryProps {
  rla: number;
  totalDespesas?: number;
  minimoExistencial: number;
  sobraLiquida: number;
  totalPassivoINPC: number;
  percentualComprometimento: number;
}

export const FooterSummary: React.FC<FooterSummaryProps> = ({
  rla,
  minimoExistencial,
  sobraLiquida,
  totalPassivoINPC,
  percentualComprometimento,
}) => {
  const isSuperendividado = percentualComprometimento > 50;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#FAF8F3] border-t border-[#DCD8CD] z-30 shadow-lg py-1 px-3 sm:px-6 no-print w-full font-sans">
      <div className="w-full flex flex-row items-center justify-between gap-2 text-xs">
        
        {/* Financial Stat Cards - Slim 1-Line Compact Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
          
          {/* Card 1: Renda Líquida */}
          <div className="bg-[#E6F0F4] border border-[#CDE1E9] px-3 py-1 rounded-xl flex items-center justify-between gap-2">
            <span className="text-[9px] text-[#1C4E5E] font-black uppercase tracking-wider">RENDA LÍQUIDA</span>
            <div className="text-xs font-black text-slate-900 font-mono">{formatCurrency(rla)}</div>
          </div>

          {/* Card 2: Mínimo Preservado */}
          <div className="bg-[#F5EFE6] border border-[#E9DFC8] px-3 py-1 rounded-xl flex items-center justify-between gap-2">
            <span className="text-[9px] text-[#8C6D3B] font-black uppercase tracking-wider">MÍNIMO PRESERVADO</span>
            <div className="text-xs font-black text-[#8C6D3B] font-mono">{formatCurrency(minimoExistencial)}</div>
          </div>

          {/* Card 3: Capacidade Mensal */}
          <div className="bg-[#E7F3EE] border border-[#C5E2D6] px-3 py-1 rounded-xl flex items-center justify-between gap-2">
            <span className="text-[9px] text-[#2E7D62] font-black uppercase tracking-wider">CAPACIDADE MENSAL</span>
            <div className="text-xs font-black text-[#2E7D62] font-mono">{formatCurrency(sobraLiquida)}</div>
          </div>

          {/* Card 4: Passivo Habilitado */}
          <div className="bg-[#EAEEF3] border border-[#D5DFE8] px-3 py-1 rounded-xl flex items-center justify-between gap-2">
            <span className="text-[9px] text-[#1C4E5E] font-black uppercase tracking-wider">PASSIVO HABILITADO</span>
            <div className="text-xs font-black text-[#1C4E5E] font-mono">{formatCurrency(totalPassivoINPC)}</div>
          </div>

        </div>

        {/* Global Debt Commitment Badge - Compact Single Line */}
        <div className="hidden sm:flex items-center border-l border-[#DCD8CD] pl-2 shrink-0">
          {isSuperendividado ? (
            <div className="flex items-center gap-1.5 bg-[#FDF2F2] text-[#9B1C1C] border border-[#F8B4B4] px-2.5 py-0.5 rounded-xl shadow-2xs">
              <AlertTriangle className="w-3.5 h-3.5 text-[#C81E1E] shrink-0" />
              <div className="text-[10px] font-black text-[#771D1D]">
                <span>Superendividado: {formatPercent(percentualComprometimento)}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-[#E7F3EE] text-[#2E7D62] border border-[#C5E2D6] px-2.5 py-0.5 rounded-xl shadow-2xs">
              <CheckCircle className="w-3.5 h-3.5 text-[#2E7D62] shrink-0" />
              <div className="text-[10px] font-black text-[#1E5643]">
                <span>Sustentável: {formatPercent(percentualComprometimento)}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
