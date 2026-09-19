import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  TrendingUp, 
  Calculator, 
  Award, 
  Scale, 
  FolderOpen,
  DollarSign
} from 'lucide-react';
import type { SubscriptionPlanType } from '../types';

interface LandingPageProps {
  onNavigate: (route: string) => void;
  onSelectPlan?: (planId: SubscriptionPlanType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectPlan }) => {
  const handleStartTrial = () => {
    if (onSelectPlan) onSelectPlan('trial');
    onNavigate('app');
  };
  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#1C2B33] font-sans selection:bg-[#1C4E5E] selection:text-white">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#FAF8F3] border-b border-[#DCD8CD]">
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E7F3EE] border border-[#C5E2D6] text-[#2E7D62] text-xs font-black uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#2E7D62]" />
            <span>Plataforma Pericial em Superendividamento (Lei 14.181/2021)</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#1C2B33] font-serif-header tracking-tight leading-none max-w-5xl mx-auto">
            Elabore Laudos Periciais Rastreáveis com <span className="text-[#1C4E5E] italic">Máxima Rigorosidade</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Automação completa com Reconhecimento de Peças por OCR, Expurgo de Tarifas Abusivas, Correção INPC/IPCA e Geração dos Planos de Pagamento <span className="inline-block font-bold text-slate-800">(CDC 104-A e 104-B).</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleStartTrial}
              className="w-full sm:w-auto px-8 py-4 bg-[#1C4E5E] hover:bg-[#153E4B] text-white font-extrabold text-base rounded-2xl shadow-lg border border-[#1C4E5E] transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3"
            >
              <span>⚡ Experimentar Grátis (7 Dias)</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleStartTrial}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-base rounded-2xl border border-[#DCD8CD] shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Acessar Demonstração do Sistema</span>
            </button>
          </div>

          {/* Social Proof Counters */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-[#DCD8CD]/80">
            <div>
              <div className="text-3xl font-black text-slate-900 font-mono">+1.200</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Laudos Processados</div>
            </div>
            <div>
              <div className="text-3xl font-black text-blue-600 font-mono">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Conformidade Lei 14.181</div>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 font-mono">100%</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Precisão nos Cálculos</div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 font-mono">+120</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Peritos & Escritórios</div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. DEMONSTRAÇÃO DOS 19 MÓDULOS PERICIAIS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest">Arquitetura de Cálculo Completa</h2>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Tudo o que Você Precisa para Perícias em Superendividamento em 19 Módulos
          </h3>
          <p className="text-slate-600 text-sm">
            Estrutura pericial desenhada rigorosamente para atender aos requisitos judiciais da Lei nº 14.181/2021 e jurisprudências dos Tribunais de Justiça.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-200">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulos 1 a 3: Cadastros & OCR Inteligente</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Importação em lote de petições e comprovantes. Reconhecimento automático por OCR do tipo de peça, ID do processo, número CNJ, contracheques e despesas.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulos 4 a 6: RLA & Mínimo Existencial</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cálculo preciso da Renda Líquida Auferida (RLA), dedução de despesas existenciais (Moradia, Água, Luz, Educação, Saúde) e preservação do Mínimo Existencial fixado judicialmente.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulos 7 a 10: Atualização INPC/IPCA</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Consolidação do Saldo Devedor com suporte a índices históricos INPC/IPCA acumulados e expurgo configurável de seguro prestamista e tarifas abusivas.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-200">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulos 11 a 13: Revisional BACEN & Benchmark</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confronto das taxas cobradas pelos credores com as Taxas Médias de Mercado divulgadas pelo Banco Central do Brasil.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center border border-cyan-200">
              <Calculator className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulos 14 a 18: Amortização Price 60x & Rateio</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Simulação de amortização compulsória em 60 parcelas mensais, cálculo da Taxa Interna de Retorno (TIR) do Credor e plano de rateio proporcional.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-400 hover:shadow-md transition-all">
            <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-200">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Módulo 19: Exportação de Laudo em 1-Clique</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exportação do laudo pericial completo em formato Word (.docx), Excel (.xlsx) e PDF com resposta automatizada aos quesitos judiciais do juízo e partes.
            </p>
          </div>

        </div>
      </section>

      {/* 3. PLANOS E PREÇOS RECORRENTES (SaaS SUBSCRIPTION) */}
      <section className="py-20 bg-slate-100/80 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <h2 className="text-xs font-black uppercase text-blue-600 tracking-widest">Planos de Assinatura Recorrente</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Escolha o Plano Ideal para o Seu Negócio
            </h3>
            <p className="text-slate-600 text-sm">
              Sem fidelidade. Cancele ou altere seu plano quando quiser com 1-clique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            
            {/* Plano 1: Profissional */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black text-blue-600 uppercase tracking-wider">👑 PLANO PROFISSIONAL</span>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">Perito Individual</h4>
                  <p className="text-xs text-slate-500 mt-2">Para peritos contábeis autônomos e administradores judiciais.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 159</span>
                  <span className="text-xs text-slate-500 font-medium">/mês</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Até 15 Laudos Periciais / mês</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Acesso a todos os 19 Módulos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Reconhecimento de Peças por OCR</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exportação Word, Excel e PDF</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (onSelectPlan) onSelectPlan('individual');
                  onNavigate('checkout');
                }}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-xl border border-slate-300 transition-all cursor-pointer"
              >
                Assinar Plano Profissional
              </button>
            </div>

            {/* Plano 2: Escritório Corporate (Destaque) */}
            <div className="bg-gradient-to-b from-blue-50/80 via-white to-slate-50 p-8 rounded-3xl border-2 border-blue-600 shadow-xl shadow-blue-600/10 space-y-8 flex flex-col justify-between relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
                ★ Mais Popular para Escritórios
              </div>

              <div className="space-y-6 pt-2">
                <div>
                  <span className="text-xs font-black text-purple-700 uppercase tracking-wider">🏢 ESCRITÓRIO CORPORATE</span>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">Plano Team Unlimited</h4>
                  <p className="text-xs text-slate-600 mt-2">Para sociedades de advogados, peritos e consultorias contábeis.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 299</span>
                  <span className="text-xs text-slate-500 font-medium">/mês</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-800 border-t border-blue-200 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span><strong>Laudos Periciais Ilimitados</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Até 5 Usuários / Peritos simultâneos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Personalização de Logo (White-Label)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Suporte VIP via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  if (onSelectPlan) onSelectPlan('escritorio');
                  onNavigate('checkout');
                }}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 transition-all cursor-pointer"
              >
                Assinar Plano Escritório
              </button>
            </div>

            {/* Plano 3: Trial Degustação */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 flex flex-col justify-between hover:shadow-md transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black text-amber-600 uppercase tracking-wider">⚡ TRIAL DEGUSTAÇÃO</span>
                  <h4 className="text-2xl font-black text-slate-900 mt-1">7 Dias Grátis</h4>
                  <p className="text-xs text-slate-500 mt-2">Para testar todas as funcionalidades da plataforma gratuitamente.</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">R$ 0</span>
                  <span className="text-xs text-slate-500 font-medium">/ 7 dias</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-700 border-t border-slate-200 pt-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Acesso a todos os 19 Módulos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Até 2 Laudos Periciais de Teste</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Validade de 7 Dias Corridos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Bloqueio automático pós 7d exigindo upgrade</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={handleStartTrial}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md border border-amber-400 transition-all cursor-pointer"
              >
                Experimentar Grátis (7 Dias)
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 text-slate-400 text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2 text-white font-extrabold">
            <Scale className="w-5 h-5 text-blue-400" />
            <span>Plataforma SaaS Perícia Superendividamento</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
            <button onClick={() => onNavigate('sobre')} className="hover:text-white cursor-pointer">Sobre Nós</button>
            <button onClick={() => onNavigate('contato')} className="hover:text-white cursor-pointer">Contato</button>
            <button onClick={() => onNavigate('suporte')} className="hover:text-white cursor-pointer">Suporte & FAQ</button>
            <button onClick={() => onNavigate('lgpd')} className="hover:text-white cursor-pointer">LGPD & Privacidade</button>
            <button onClick={() => onNavigate('termos')} className="hover:text-white cursor-pointer">Termos de Uso</button>
            <button onClick={() => onNavigate('admin')} className="text-amber-400 font-bold hover:underline cursor-pointer">Painel Admin SaaS</button>
          </div>

          <div>
            © {new Date().getFullYear()} Plataforma Pericial SaaS • Lei 14.181/2021
          </div>
        </div>
      </footer>

    </div>
  );
};
