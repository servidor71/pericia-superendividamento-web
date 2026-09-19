import React, { useState } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Search, 
  FileText,
  Cpu,
  Award
} from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (route: string) => void;
}

interface Subscriber {
  id: string;
  nome: string;
  email: string;
  plano: 'Individual' | 'Escritório' | 'Enterprise';
  status: 'Ativo' | 'Degustação' | 'Suspenso' | 'Cancelado';
  mrr: number;
  laudosMes: number;
  dataInicio: string;
  uf: string;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  // Assinantes Reais Cadastrados na Plataforma SaaS
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const toggleUserStatus = (id: string) => {
    setSubscribers(subscribers.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === 'Ativo' ? 'Suspenso' : 'Ativo';
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const filteredSubscribers = subscribers.filter(s => {
    const matchesSearch = s.nome.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'TODOS' || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalMRR = subscribers.reduce((acc, s) => acc + (s.status === 'Ativo' ? s.mrr : 0), 0);
  const totalARR = totalMRR * 12;
  const totalLaudosMes = subscribers.reduce((acc, s) => acc + s.laudosMes, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans space-y-8">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Painel de Administrador SaaS & Gestão Financeira
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Controle de Assinantes, Indicadores de Receita Recorrente (MRR/ARR) e KPIs de Produtividade
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('app')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md border border-blue-500 transition-all cursor-pointer"
        >
          💻 Voltar para Plataforma de Perícia
        </button>
      </div>

      {/* 1. FINANCIAL INDICATORS & SAAS METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: MRR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>MRR (Receita Mensal)</span>
            <span className="flex items-center text-slate-400 font-extrabold text-[11px] gap-0.5">
              0.0%
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            R$ {totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Faturamento recorrente acumulado este mês</p>
        </div>

        {/* Metric 2: ARR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>ARR (Projeção Anual)</span>
            <span className="flex items-center text-slate-400 font-extrabold text-[11px] gap-0.5">
              0.0%
            </span>
          </div>
          <div className="text-3xl font-black text-blue-600 font-mono">
            R$ {totalARR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Receita recorrente anualizada projetada</p>
        </div>

        {/* Metric 3: Active Subscribers */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Assinantes Ativos</span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
              SaaS Active
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {subscribers.filter(s => s.status === 'Ativo').length} <span className="text-sm text-slate-500 font-normal">/ {subscribers.length} total</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Peritos e sociedades ativas no sistema</p>
        </div>

        {/* Metric 4: Churn & LTV */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Churn Rate & LTV</span>
            <span className="text-slate-400 font-bold text-[11px]">0.00% Churn</span>
          </div>
          <div className="text-3xl font-black text-amber-600 font-mono">
            R$ 0,00
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Valor de Vida Média por Cliente (LTV)</p>
        </div>

      </div>

      {/* 2. PRODUCTIVITY KPIS & SYSTEM USAGE */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-black text-slate-900">Indicadores de Produtividade da Plataforma</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">Engine OCR v2.4</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Laudos Emitidos (Mês)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalLaudosMes}</div>
            <div className="text-[10px] text-slate-500">Média de 0 laudos/dia</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>Leituras por OCR</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">0</div>
            <div className="text-[10px] text-slate-500">Documentos e autos lidos</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Expurgos de Abusividades</span>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">R$ 0,00</div>
            <div className="text-[10px] text-slate-500">Economia gerada aos devedores</div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <span>SLA de Disponibilidade</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">100,0%</div>
            <div className="text-[10px] text-slate-500">Uptime do servidor cloud</div>
          </div>

        </div>
      </div>

      {/* 3. SUBSCRIBERS MANAGEMENT TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-4 p-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-black text-slate-900">Gerenciamento de Assinantes & Usuários</h2>
            <p className="text-xs text-slate-500">Controle de ativação, planos e faturamento individual</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Degustação">Degustação 7d</option>
              <option value="Suspenso">Suspensos</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                <th className="py-3 px-4">Assinante / Razão Social</th>
                <th className="py-3 px-4">Plano SaaS</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">MRR (R$)</th>
                <th className="py-3 px-4 text-center">Laudos (Mês)</th>
                <th className="py-3 px-4 text-center">Início</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium italic">
                    Nenhum assinante cadastrado até o momento. A plataforma está limpa e pronta para novos registros de peritos e escritórios.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sub.nome}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{sub.email} • {sub.uf}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {sub.plano}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        sub.status === 'Ativo' ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' :
                        sub.status === 'Degustação' ? 'bg-amber-50 text-amber-800 border border-amber-300' :
                        'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}>
                        {sub.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      R$ {sub.mrr.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-amber-600">
                      {sub.laudosMes}
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-600 font-mono">
                      {sub.dataInicio}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => toggleUserStatus(sub.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer border ${
                          sub.status === 'Ativo'
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                        }`}
                      >
                        {sub.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
