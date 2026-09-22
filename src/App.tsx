import { useState } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { FooterSummary } from './components/FooterSummary';

import { LandingPage } from './pages/LandingPage';
import { CadastroPage } from './pages/CadastroPage';
import { LoginPage } from './pages/LoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ContatoPage } from './pages/ContatoPage';
import { LGPDPage } from './pages/LGPDPage';
import { SobrePage } from './pages/SobrePage';
import { SuportePage } from './pages/SuportePage';
import { TermosUsoPage } from './pages/TermosUsoPage';
import { GerenciarProcessosPage } from './pages/GerenciarProcessosPage';

import { ModulePerfilProfissional } from './components/ModulePerfilProfissional';
import { Module1DevedorProcesso } from './components/Module1DevedorProcesso';
import { Module2RLADespesas } from './components/Module2RLADespesas';
import { Module3CredoresContratos } from './components/Module3CredoresContratos';
import { ModuleAmortizacaoContratoIndividual } from './components/ModuleAmortizacaoContratoIndividual';
import { ModuleCalculoSaldoPrestacoesPagas } from './components/ModuleCalculoSaldoPrestacoesPagas';
import { Module4INPCBACEN } from './components/Module4INPCBACEN';
import { ModuleCenarioRevisionalBacen } from './components/ModuleCenarioRevisionalBacen';
import { ModuleSaldoAtualValorPago } from './components/ModuleSaldoAtualValorPago';
import { ModuleEvolucaoContratos } from './components/ModuleEvolucaoContratos';
import { ModuleComprometimentoAntesDepois } from './components/ModuleComprometimentoAntesDepois';
import { ModuleDividasIncluidasPlano } from './components/ModuleDividasIncluidasPlano';
import { ModuleTabelaPrice } from './components/ModuleTabelaPrice';
import { ModulePlanoPagamentoCompulsorio } from './components/ModulePlanoPagamentoCompulsorio';
import { ModuleDemonstracaoTotalPagoContrato } from './components/ModuleDemonstracaoTotalPagoContrato';
import { ModuleJurosETIRCredor } from './components/ModuleJurosETIRCredor';
import { Module5ConsolidacaoPassivo } from './components/Module5ConsolidacaoPassivo';
import { Module6PlanosRepactuacao } from './components/Module6PlanosRepactuacao';
import { Module7LaudoExportacoes } from './components/Module7LaudoExportacoes';

import type { ProfessionalProfile, ProcessData, IncomeData, ExpenseData, Contract, QuesitoPericial, ProcessDocumentItem, SubscriptionConfig, SubscriptionPlanType } from './types';
import { initialProfessionalProfile, initialProcessData, initialIncomeData, initialExpenseData, initialContracts, initialQuesitos, initialProcessDocuments } from './mockData';
import { calculateFinancialSummary } from './services/calculations';
import { useEffect } from 'react';
import { exportToExcel, exportJSONBackup } from './services/exporters';
import { saveProcessToDatabase, loadProcessFromDatabase } from './services/apiService';
import { 
  Globe, 
  LayoutDashboard,
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('landing');
  const [activeTab, setActiveTab] = useState<number>(1);

  // Global Route Listener for Upgrade and Navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleNav = (e: any) => {
        if (e.detail) setCurrentRoute(e.detail);
      };
      window.addEventListener('navigate-route', handleNav);
      return () => window.removeEventListener('navigate-route', handleNav);
    }
  }, []);

  // Carrega automaticamente os dados do banco de dados na inicialização
  useEffect(() => {
    async function loadInitialData() {
      try {
        const savedData = await loadProcessFromDatabase();
        if (savedData) {
          if (savedData.profile) setProfile(savedData.profile);
          if (savedData.process) setProcess(savedData.process);
          if (savedData.income) setIncome(savedData.income);
          if (savedData.expenses) setExpenses(savedData.expenses);
          if (savedData.contracts) setContracts(savedData.contracts);
          if (savedData.documents) setDocuments(savedData.documents);
          console.log('✅ Dados do processo carregados do banco de dados.');
        }
      } catch (err) {
        console.warn('Servidor sem dados prévios no banco.');
      }
    }
    loadInitialData();
  }, []);

  // Core Application State
  const [profile, setProfile] = useState<ProfessionalProfile>(initialProfessionalProfile);
  const [documents, setDocuments] = useState<ProcessDocumentItem[]>(initialProcessDocuments);
  const [process, setProcess] = useState<ProcessData>(initialProcessData);
  const [income, setIncome] = useState<IncomeData>(initialIncomeData);
  const [expenses, setExpenses] = useState<ExpenseData>(initialExpenseData);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [quesitos] = useState<QuesitoPericial[]>(initialQuesitos);

  // Subscription Plan State (Rigorously Enforced Features)
  const [subscription, setSubscription] = useState<SubscriptionConfig>({
    planId: 'individual',
    planName: 'Plano Profissional',
    price: 159,
    maxLaudosMes: 15,
    laudosGeradosMes: 4,
    maxUsers: 1,
    activeUsersCount: 1,
    customLogoAllowed: false,
    teamManagementAllowed: false,
    whatsappSupportVip: false,
    trialDaysRemaining: 0,
    isTrialExpired: false,
  });

  const handleSelectPlan = (planId: SubscriptionPlanType | 'trial_expired') => {
    if (planId === 'trial') {
      setSubscription({
        planId: 'trial',
        planName: 'Trial Degustação (7 Dias Grátis)',
        price: 0,
        maxLaudosMes: 2,
        laudosGeradosMes: 1,
        maxUsers: 1,
        activeUsersCount: 1,
        customLogoAllowed: false,
        teamManagementAllowed: false,
        whatsappSupportVip: false,
        trialDaysRemaining: 7,
        isTrialExpired: false,
      });
    } else if (planId === 'trial_expired') {
      setSubscription({
        planId: 'trial',
        planName: 'Trial Degustação (7d EXPIRADO)',
        price: 0,
        maxLaudosMes: 2,
        laudosGeradosMes: 2,
        maxUsers: 1,
        activeUsersCount: 1,
        customLogoAllowed: false,
        teamManagementAllowed: false,
        whatsappSupportVip: false,
        trialDaysRemaining: 0,
        isTrialExpired: true,
      });
    } else if (planId === 'master') {
      setSubscription({
        planId: 'master',
        planName: '👑 Administrador Master Supremo (Acesso Ilimitado)',
        price: 0,
        maxLaudosMes: 999999,
        laudosGeradosMes: 0,
        maxUsers: 9999,
        activeUsersCount: 1,
        customLogoAllowed: true,
        teamManagementAllowed: true,
        whatsappSupportVip: true,
        trialDaysRemaining: 999,
        isTrialExpired: false,
      });
    } else if (planId === 'individual') {
      setSubscription({
        planId: 'individual',
        planName: 'Plano Profissional',
        price: 159,
        maxLaudosMes: 15,
        laudosGeradosMes: 4,
        maxUsers: 1,
        activeUsersCount: 1,
        customLogoAllowed: false,
        teamManagementAllowed: false,
        whatsappSupportVip: false,
        trialDaysRemaining: 0,
        isTrialExpired: false,
      });
      setCurrentRoute('checkout');
    } else {
      setSubscription({
        planId: 'escritorio',
        planName: 'Plano Escritório Corporate',
        price: 299,
        maxLaudosMes: 999999,
        laudosGeradosMes: 18,
        maxUsers: 5,
        activeUsersCount: 3,
        customLogoAllowed: true,
        teamManagementAllowed: true,
        whatsappSupportVip: true,
        trialDaysRemaining: 0,
        isTrialExpired: false,
      });
      setCurrentRoute('checkout');
    }
  };

  const handleIncrementLaudoCount = () => {
    setSubscription(prev => ({
      ...prev,
      laudosGeradosMes: prev.laudosGeradosMes + 1,
    }));
  };

  // Financial Calculations
  const summary = calculateFinancialSummary(income, expenses, contracts);

  // Handlers
  const handleNewProcess = () => {
    if (confirm('Deseja iniciar um novo processo? Os campos serão zerados para preenchimento.')) {
      setProcess(initialProcessData);
      setIncome(initialIncomeData);
      setExpenses(initialExpenseData);
      setContracts(initialContracts);
      setDocuments(initialProcessDocuments);
      setActiveTab(1);
    }
  };

  const handleOpenProcessFromList = (savedData: any) => {
    if (savedData) {
      if (savedData.profile) setProfile(savedData.profile);
      if (savedData.process) setProcess(savedData.process);
      if (savedData.income) setIncome(savedData.income);
      if (savedData.expenses) setExpenses(savedData.expenses);
      if (savedData.contracts) setContracts(savedData.contracts);
      if (savedData.documents) setDocuments(savedData.documents);
      setActiveTab(2);
      setCurrentRoute('app');
    }
  };

  const handleImportJSON = (data: any) => {
    try {
      if (data.process) setProcess(data.process);
      if (data.income) setIncome(data.income);
      if (data.expenses) setExpenses(data.expenses);
      if (data.contracts) setContracts(data.contracts);
      if (data.profile) setProfile(data.profile);
      if (data.documents) setDocuments(data.documents);
      alert('Backup importado com sucesso!');
    } catch (err) {
      alert('Erro ao importar arquivo JSON de backup. Formato inválido.');
    }
  };

  const handleSaveToDatabase = async () => {
    const payload = {
      profile,
      process,
      income,
      expenses,
      contracts,
      documents,
      quesitos,
    };
    const res = await saveProcessToDatabase(payload);
    if (!res.success) {
      throw new Error(res.error || 'Erro ao salvar no banco');
    }
  };

  const handleExportBackup = () => {
    exportJSONBackup({
      profile,
      process,
      income,
      expenses,
      contracts,
      documents,
      quesitos
    });
  };

  const handleExportExcel = () => {
    exportToExcel(process, income, expenses, contracts, quesitos);
  };

  const handleGenerateAIPlan = () => {
    alert('Plano de Repactuação Pericial gerado com sucesso!');
  };

  const handleProcessOCRData = (ocrText: string) => {
    console.log('Dados do OCR recebidos no App:', ocrText.slice(0, 100));
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* GLOBAL SAAS PLATFORM NAVIGATION HEADER (ALWAYS VISIBLE FOR MULTI-DOMAIN ROUTING) */}
      {/* GLOBAL SAAS PLATFORM NAVIGATION HEADER (SINGLE COMPACT ROW) */}
      <header className="bg-[#1C4E5E] border-b border-[#153E4B] text-white py-1 px-3 sm:px-4 z-40 shrink-0 shadow-2xs font-sans no-print">
        <div className="w-full flex items-center justify-between gap-2 text-xs flex-nowrap overflow-x-auto no-scrollbar whitespace-nowrap">
          
          {/* Left Brand & Status */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setCurrentRoute('landing')}
              className="flex items-center space-x-1.5 font-black text-white hover:text-amber-300 transition-colors cursor-pointer text-xs font-serif-header tracking-wide shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>arquivo FORENSE</span>
            </button>

            <span className="text-white/30 text-xs">|</span>

            <div className="flex items-center gap-1 bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/20 text-[10px] font-bold shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-300" />
              <span>Plano Escritório Team • Sistema Ativo</span>
            </div>
          </div>

          {/* Right Route Navigation Links */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            
            <button
              onClick={() => setCurrentRoute('landing')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'landing' ? 'bg-white text-[#1C4E5E] font-black' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              Início
            </button>

            <button
              onClick={() => setCurrentRoute('app')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                currentRoute === 'app' ? 'bg-amber-400 text-slate-950 shadow-2xs' : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-white/20'
              }`}
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>💻 Perícia Judicial</span>
            </button>

            <button
              onClick={() => setCurrentRoute('admin')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'admin' ? 'bg-white/20 text-white font-black border border-white/30' : 'hover:bg-white/10 text-white/80'
              }`}
            >
              ⚙️ Admin SaaS
            </button>

            <button
              onClick={() => setCurrentRoute('cadastro')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'cadastro' ? 'bg-white text-[#1C4E5E] font-black' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              Cadastro
            </button>

            <button
              onClick={() => setCurrentRoute('login')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'login' ? 'bg-white text-[#1C4E5E] font-black' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              Login
            </button>

            <button
              onClick={() => setCurrentRoute('checkout')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'checkout' ? 'bg-white text-[#1C4E5E] font-black' : 'hover:bg-white/10 text-white/90'
              }`}
            >
              Checkout
            </button>

            <button
              onClick={() => setCurrentRoute('contato')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'contato' ? 'bg-white text-[#1C4E5E] font-black' : 'hover:bg-white/10 text-white/80'
              }`}
            >
              Contato
            </button>

            <button
              onClick={() => setCurrentRoute('suporte')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'suporte' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              Suporte
            </button>

            <button
              onClick={() => setCurrentRoute('lgpd')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'lgpd' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              LGPD
            </button>

            <button
              onClick={() => setCurrentRoute('sobre')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'sobre' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              Sobre
            </button>

            <button
              onClick={() => setCurrentRoute('termos')}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentRoute === 'termos' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              Termos
            </button>

            {/* SINGLE TOP HEADER UPGRADE BUTTON */}
            <button
              type="button"
              onClick={() => setCurrentRoute('checkout')}
              className="px-3 py-0.5 text-xs font-black bg-[#133E4B] hover:bg-[#0E2F39] text-white border border-white/20 rounded-full transition-all cursor-pointer shadow-2xs flex items-center gap-1 shrink-0 ml-1"
              title="Fazer Upgrade de Plano SaaS"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Upgrade</span>
            </button>

          </div>
        </div>
      </header>

      {/* INDEPENDENT ROUTE RENDERING */}
      {currentRoute === 'landing' && <LandingPage onNavigate={setCurrentRoute} onSelectPlan={handleSelectPlan} />}
      {currentRoute === 'cadastro' && <CadastroPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'login' && (
        <LoginPage
          onNavigate={setCurrentRoute}
          onLoginMaster={() => {
            handleSelectPlan('master');
            setCurrentRoute('app');
          }}
        />
      )}
      {currentRoute === 'checkout' && <CheckoutPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'admin' && <AdminDashboardPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'contato' && <ContatoPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'lgpd' && <LGPDPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'sobre' && <SobrePage onNavigate={setCurrentRoute} />}
      {currentRoute === 'suporte' && <SuportePage onNavigate={setCurrentRoute} />}
      {currentRoute === 'termos' && <TermosUsoPage onNavigate={setCurrentRoute} />}
      {currentRoute === 'processos' && (
        <GerenciarProcessosPage
          onNavigate={setCurrentRoute}
          onOpenProcess={handleOpenProcessFromList}
          onNewProcess={() => {
            setProcess(initialProcessData);
            setIncome(initialIncomeData);
            setExpenses(initialExpenseData);
            setContracts(initialContracts);
            setDocuments(initialProcessDocuments);
            setActiveTab(1);
          }}
        />
      )}

      {/* PLATAFORMA PERICIAL (COMPLETA COM OS 19 MÓDULOS) */}
      {currentRoute === 'app' && (
        <div className="h-[calc(100vh-45px)] w-screen bg-[#F7F6F0] flex flex-col overflow-hidden font-sans text-[#1C2B33] antialiased">
          
          {/* 1. Header Navigation Bar (Unificada em Faixa Única) */}
          <div className="shrink-0 z-20 no-print">
            <Header
              process={process}
              subscription={subscription}
              onSelectPlan={handleSelectPlan}
              onNewProcess={handleNewProcess}
              onImportJSON={handleImportJSON}
              onExportBackup={handleExportBackup}
              onExportExcel={handleExportExcel}
              onGenerateAIPlan={handleGenerateAIPlan}
              onProcessOCRData={handleProcessOCRData}
              onSaveToDatabase={handleSaveToDatabase}
              onOpenProcessList={() => setCurrentRoute('processos')}
            />
          </div>

          {/* 2. Top Phase Dropdown Navigation Bar (Menu Suspenso por Fase) */}
          <div className="shrink-0 relative z-40 no-print">
            <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* 3. Área de Conteúdo Principal (Largura Total 100%) */}
          <main className="flex-1 h-full overflow-y-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-28">
              
              {activeTab === 1 && (
                <ModulePerfilProfissional
                  profile={profile}
                  onChange={setProfile}
                  subscription={subscription}
                  onSelectPlan={handleSelectPlan}
                />
              )}

              {activeTab === 2 && (
                <Module1DevedorProcesso process={process} onChange={setProcess} documents={documents} />
              )}

              {activeTab === 3 && (
                <Module2RLADespesas
                  income={income}
                  expenses={expenses}
                  onIncomeChange={setIncome}
                  onExpensesChange={setExpenses}
                  contracts={contracts}
                />
              )}

              {activeTab === 4 && (
                <ModuleComprometimentoAntesDepois income={income} expenses={expenses} contracts={contracts} />
              )}

              {activeTab === 5 && (
                <Module3CredoresContratos contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 6 && (
                <ModuleCalculoSaldoPrestacoesPagas income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 7 && (
                <ModuleAmortizacaoContratoIndividual contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 8 && (
                <Module4INPCBACEN contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 9 && (
                <ModuleSaldoAtualValorPago income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 10 && (
                <ModuleDividasIncluidasPlano contracts={contracts} />
              )}

              {activeTab === 11 && (
                <ModuleCenarioRevisionalBacen income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 12 && (
                <ModuleEvolucaoContratos income={income} expenses={expenses} contracts={contracts} />
              )}

              {activeTab === 13 && (
                <ModuleDemonstracaoTotalPagoContrato income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 14 && (
                <ModuleJurosETIRCredor income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 15 && (
                <ModuleTabelaPrice income={income} expenses={expenses} contracts={contracts} />
              )}

              {activeTab === 16 && (
                <div className="space-y-6">
                  <Module5ConsolidacaoPassivo income={income} expenses={expenses} contracts={contracts} />
                  <Module6PlanosRepactuacao income={income} expenses={expenses} contracts={contracts} />
                </div>
              )}

              {activeTab === 17 && (
                <ModulePlanoPagamentoCompulsorio income={income} expenses={expenses} contracts={contracts} onContractsChange={setContracts} />
              )}

              {activeTab === 18 && (
                <Module7LaudoExportacoes
                  process={process}
                  income={income}
                  expenses={expenses}
                  contracts={contracts}
                  quesitos={quesitos}
                  profile={profile}
                  subscription={subscription}
                  onSelectPlan={handleSelectPlan}
                  onIncrementLaudoCount={handleIncrementLaudoCount}
                  onExportExcel={handleExportExcel}
                />
              )}

            </main>

          {/* 4. Sticky Bottom Financial Summary Footer (Fixed Bottom) */}
          <div className="shrink-0 z-30 no-print">
            <FooterSummary
              rla={summary.rla}
              totalDespesas={summary.totalDespesas}
              minimoExistencial={summary.minimoExistencial}
              sobraLiquida={summary.sobraLiquida}
              totalPassivoINPC={summary.totalSaldoDevedorINPC}
              percentualComprometimento={summary.percentualComprometimentoRLA}
            />
          </div>
        </div>
      )}

      {/* Trial 7 Days Expiration Lock Modal Overlay */}
      {subscription.isTrialExpired && currentRoute === 'app' && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-8 shadow-2xl space-y-6 text-center text-slate-900">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
              <Lock className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="bg-red-100 text-red-800 text-[11px] font-black uppercase px-3.5 py-1 rounded-full border border-red-300">
                ⛔ Período de 7 Dias Grátis Expirado
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Acesso à Plataforma Bloqueado
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Seu período de teste gratuito de 7 dias expirou. Para desbloquear o acesso imediato aos 19 módulos e emitir novos laudos periciais, escolha seu plano definitivo:
              </p>
            </div>

            {/* Upgrade Options Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-2">
              
              <div 
                onClick={() => handleSelectPlan('individual')}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer space-y-2"
              >
                <div className="text-[11px] font-black text-blue-600 uppercase">👑 PLANO PROFISSIONAL</div>
                <div className="text-xl font-black text-slate-900">R$ 159 <span className="text-xs font-medium text-slate-500">/mês</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Até 15 laudos/mês • 19 Módulos</div>
                <button className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer">
                  Ativar Plano Individual (R$ 159)
                </button>
              </div>

              <div 
                onClick={() => handleSelectPlan('escritorio')}
                className="bg-gradient-to-b from-blue-50 to-white p-5 rounded-2xl border-2 border-blue-600 shadow-md hover:shadow-lg transition-all cursor-pointer space-y-2"
              >
                <div className="text-[11px] font-black text-purple-600 uppercase">🏢 ESCRITÓRIO CORPORATE</div>
                <div className="text-xl font-black text-slate-900">R$ 299 <span className="text-xs font-medium text-slate-500">/mês</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Laudos Ilimitados • 5 Usuários • Logo</div>
                <button className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer">
                  Ativar Plano Escritório (R$ 299)
                </button>
              </div>

            </div>

            <div className="pt-2">
              <button
                onClick={() => setCurrentRoute('landing')}
                className="text-xs text-slate-500 font-bold hover:underline cursor-pointer"
              >
                Voltar para a Página Inicial
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
