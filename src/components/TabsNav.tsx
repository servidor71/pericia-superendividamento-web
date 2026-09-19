import React from 'react';
import { User, Wallet, FileText, TrendingUp, LineChart, PieChart, DollarSign, ListChecks, TableProperties, BarChart3, Calculator, Award } from 'lucide-react';

interface TabsNavProps {
  activeTab: number;
  setActiveTab: (tabIndex: number) => void;
}

export const tabsList = [
  { id: 1, label: '1. Devedor & Processo', icon: User },
  { id: 2, label: '2. RLA & Mínimo Existencial', icon: Wallet },
  { id: 3, label: '3. Credores & Contratos', icon: FileText },
  { id: 4, label: '4. Correção INPC/IPCA & BACEN', icon: TrendingUp },
  { id: 5, label: '5. Contratados x Recebidos (Evolução)', icon: LineChart },
  { id: 6, label: '6. Comprometimento Antes x Pós Plano', icon: PieChart },
  { id: 7, label: '7. Saldos Devedores Atualizados (Tabela C)', icon: DollarSign },
  { id: 8, label: '8. Dívidas Incluídas no Plano', icon: ListChecks },
  { id: 9, label: '9. Amortização Tabela Price', icon: TableProperties },
  { id: 10, label: '10. Consolidação Passivo', icon: BarChart3 },
  { id: 11, label: '11. Planos 60x (CDC 104-B)', icon: Calculator },
  { id: 12, label: '12. Laudo & Documentos', icon: Award },
];

export const TabsNav: React.FC<TabsNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bg-slate-100 border-b border-slate-300 sticky top-[61px] z-20 shadow-2xs w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1.5 overflow-x-auto py-2 no-scrollbar">
          {tabsList.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-blue-700 hover:bg-slate-200/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
