import React, { useState, useRef, useEffect } from 'react';
import { 
  UserCheck,
  User, 
  Wallet, 
  FileText, 
  TrendingUp, 
  LineChart, 
  PieChart, 
  ListChecks, 
  TableProperties, 
  Calculator, 
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';

interface SidebarNavProps {
  activeTab: number;
  setActiveTab: (tabIndex: number) => void;
}

export const sidebarModules = [
  { id: 1, label: 'Módulo 1: Cadastramento Profissional & Logo', group: 'FASE I - CONFIGURAÇÃO & CADASTROS', icon: UserCheck },
  { id: 2, label: 'Módulo 2: Cadastramento do Processo, Devedor & Perícia', group: 'FASE I - CONFIGURAÇÃO & CADASTROS', icon: User },
  { id: 3, label: 'Módulo 3: RLA - Renda Líquida Mensal Ajustada, Despesas & Mínimo Existencial', group: 'FASE II - DADOS DO PROCESSO & RENDA', icon: Wallet },
  { id: 4, label: 'Módulo 4: Comprometimento da Renda Mensal (Antes x Após)', group: 'FASE II - DADOS DO PROCESSO & RENDA', icon: PieChart },
  { id: 5, label: 'Módulo 5: Credores & Cadastramento Individual de Contratos', group: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO', icon: FileText },
  { id: 6, label: 'Módulo 6: Apuração do Saldo Devedor com Base em Prestações Pagas', group: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO', icon: Calculator },
  { id: 7, label: 'Módulo 7: Amortização Individual dos Contratos', group: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO', icon: TableProperties },
  { id: 8, label: 'Módulo 8: Atualização Monetária (INPC/IPCA) & Taxas BACEN', group: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO', icon: TrendingUp },
  { id: 9, label: 'Módulo 9: Saldo Devedor Atualizado & Valor Principal Já Pago', group: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO', icon: ListChecks },
  { id: 10, label: 'Módulo 10: Dívidas Incluídas no Plano Compulsório (Tabela 6)', group: 'FASE IV - DEMONSTRATIVOS & BENCHMARK', icon: ListChecks },
  { id: 11, label: 'Módulo 11: Cenário Revisional com Taxa Média BACEN', group: 'FASE IV - DEMONSTRATIVOS & BENCHMARK', icon: TrendingUp },
  { id: 12, label: 'Módulo 12: Análise da Evolução dos Contratos - Valores Contratados x Recebidos', group: 'FASE IV - DEMONSTRATIVOS & BENCHMARK', icon: LineChart },
  { id: 13, label: 'Módulo 13: Demonstração do Total Pago por Contrato', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: Award },
  { id: 14, label: 'Módulo 14: Cálculo dos Juros Pagos & TIR do Credor', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: TrendingUp },
  { id: 15, label: 'Módulo 15: Amortização Tabela Price (60 Parcelas)', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: TableProperties },
  { id: 16, label: 'Módulo 16: Consolidação do Passivo & Capacidade de Pagamento', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: Calculator },
  { id: 17, label: 'Módulo 17: Engines de Repactuação (Plano Compulsório 60x & Voluntário)', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: Calculator },
  { id: 18, label: 'Módulo 18: Plano de Pagamento Compulsório (Rateio Proporcional Price)', group: 'FASE V - REPACTUAÇÃO & PLANOS 60X', icon: TableProperties },
  { id: 19, label: 'Módulo 19: Parecer Técnico, Emissão do Laudo Pericial & Exportações', group: 'FASE VI - ENCERRAMENTO & LAUDO PERICIAL', icon: Award },
];

export const phaseDefinitions = [
  {
    id: 'fase1',
    shortLabel: 'Fase I: Cadastros',
    fullTitle: 'FASE I - CONFIGURAÇÃO & CADASTROS',
    modules: [1, 2],
  },
  {
    id: 'fase2',
    shortLabel: 'Fase II: Processo & Renda',
    fullTitle: 'FASE II - DADOS DO PROCESSO & RENDA',
    modules: [3, 4],
  },
  {
    id: 'fase3',
    shortLabel: 'Fase III: Análise Bancária',
    fullTitle: 'FASE III - ANÁLISE BANCÁRIA & EVOLUÇÃO',
    modules: [5, 6, 7, 8, 9],
  },
  {
    id: 'fase4',
    shortLabel: 'Fase IV: Demonstrativos',
    fullTitle: 'FASE IV - DEMONSTRATIVOS & BENCHMARK',
    modules: [10, 11, 12],
  },
  {
    id: 'fase5',
    shortLabel: 'Fase V: Repactuação 60x',
    fullTitle: 'FASE V - REPACTUAÇÃO & PLANOS 60X',
    modules: [13, 14, 15, 16, 17, 18],
  },
  {
    id: 'fase6',
    shortLabel: 'Fase VI: Laudo Pericial',
    fullTitle: 'FASE VI - ENCERRAMENTO & LAUDO PERICIAL',
    modules: [19],
  },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, setActiveTab }) => {
  const [openPhaseId, setOpenPhaseId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentModule = sidebarModules.find(m => m.id === activeTab) || sidebarModules[0];

  // Fechar dropdowns ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenPhaseId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevTab = () => {
    if (activeTab > 1) {
      setActiveTab(activeTab - 1);
      setOpenPhaseId(null);
    }
  };

  const handleNextTab = () => {
    if (activeTab < sidebarModules.length) {
      setActiveTab(activeTab + 1);
      setOpenPhaseId(null);
    }
  };

  return (
    <div ref={containerRef} className="w-full bg-[#F0EEE6] border-b border-[#DCD8CD] shadow-2xs font-sans no-print relative z-40">
      <div className="w-full px-3 py-1 flex items-center justify-between gap-2">
        
        {/* LADO ESQUERDO: MENU SUSPENSO POR FASE EM LINHA ÚNICA */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[#1C4E5E] font-black text-[11px] uppercase pr-2 border-r border-[#DCD8CD] shrink-0">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden xl:inline">Fases da Perícia:</span>
          </div>

          {phaseDefinitions.map((phase) => {
            const isPhaseActive = phase.modules.includes(activeTab);
            const isOpen = openPhaseId === phase.id;

            return (
              <div key={phase.id} className="relative shrink-0">
                {/* Botão de Cada Fase */}
                <button
                  type="button"
                  onClick={() => setOpenPhaseId(isOpen ? null : phase.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    isPhaseActive
                      ? 'bg-[#1C4E5E] text-white border-[#153E4B] shadow-2xs font-extrabold'
                      : isOpen
                      ? 'bg-[#FAF8F3] text-[#1C4E5E] border-[#1C4E5E] font-extrabold'
                      : 'bg-white/90 text-[#1C2B33] border-[#DCD8CD] hover:bg-white hover:text-[#1C4E5E]'
                  }`}
                >
                  <span>{phase.shortLabel}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180 text-amber-300' : isPhaseActive ? 'text-white' : 'text-slate-500'}`} />
                </button>

                {/* Lista Suspensa (Dropdown Menu) dos Módulos da Fase */}
                {isOpen && (
                  <div className="absolute left-0 top-full mt-1.5 min-w-[340px] max-w-md w-max bg-white rounded-2xl shadow-2xl border border-slate-300 py-1.5 z-50 animate-fade-in divide-y divide-slate-100">
                    <div className="px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#1C4E5E] bg-slate-100 flex items-center justify-between">
                      <span>{phase.fullTitle}</span>
                      <span className="text-[9px] bg-[#1C4E5E] text-white px-2 py-0.5 rounded-full font-extrabold">
                        {phase.modules.length} Módulos
                      </span>
                    </div>

                    <div className="py-1 space-y-0.5 max-h-96 overflow-y-auto">
                      {phase.modules.map((modId) => {
                        const moduleItem = sidebarModules.find(m => m.id === modId);
                        if (!moduleItem) return null;
                        const Icon = moduleItem.icon;
                        const isModActive = activeTab === modId;

                        return (
                          <button
                            key={modId}
                            type="button"
                            onClick={() => {
                              setActiveTab(modId);
                              setOpenPhaseId(null);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-left transition-colors cursor-pointer ${
                              isModActive
                                ? 'bg-[#1C4E5E] text-white font-extrabold'
                                : 'text-slate-800 hover:bg-slate-100 hover:text-[#1C4E5E]'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isModActive ? 'bg-white/20 text-amber-300' : 'bg-slate-100 text-[#1C4E5E]'}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="leading-snug whitespace-normal">{moduleItem.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* LADO DIREITO: CONTROLES DE NAVEGAÇÃO RÁPIDA (COMPACTOS) */}
        <div className="flex items-center gap-1.5 shrink-0 bg-white/90 px-2.5 py-0.5 rounded-lg border border-[#DCD8CD] shadow-2xs">
          <button
            type="button"
            onClick={handlePrevTab}
            disabled={activeTab === 1}
            className="p-0.5 text-slate-600 hover:text-[#1C4E5E] hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Módulo Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5 font-bold" />
          </button>

          <div className="text-center px-1">
            <span className="text-[11px] font-extrabold text-[#1C4E5E] leading-tight block truncate max-w-[200px] sm:max-w-[260px]">
              Módulo {activeTab}/19: {currentModule.label.replace(/^\d+\.\s*/, '')}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextTab}
            disabled={activeTab === sidebarModules.length}
            className="p-0.5 text-slate-600 hover:text-[#1C4E5E] hover:bg-slate-100 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Próximo Módulo"
          >
            <ChevronRight className="w-3.5 h-3.5 font-bold" />
          </button>
        </div>

      </div>
    </div>
  );
};
