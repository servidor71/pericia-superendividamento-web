import React, { useState } from 'react';
import { HelpCircle, ArrowLeft, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface SuportePageProps {
  onNavigate: (route: string) => void;
}

export const SuportePage: React.FC<SuportePageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Como funciona o preenchimento automático em 19 Módulos?',
      a: 'Ao anexar a Petição Inicial ou comprovantes no Módulo 2, o sistema de leitor de documentos OCR analisa o texto e auto-popula a qualificação das partes (Módulo 3), salários e pensões (Módulo 5) e operações bancárias.'
    },
    {
      q: 'Como são aplicadas as taxas médias de juros do Banco Central?',
      a: 'O sistema inclui a tabela histórica oficial de taxas médias de mercado do BACEN para consignados e crédito pessoal, aplicando automaticamente o confronto revisional nos Módulos 12 e 15.'
    },
    {
      q: 'Como exportar o Laudo em formato Word (.docx) ou Excel?',
      a: 'No Módulo 19 (Laudo & Exportações), basta clicar nos botões de download. O laudo é gerado em formato Word 100% editável com timbre, tabelas de cálculo e resposta aos quesitos.'
    },
    {
      q: 'Posso utilizar em mais de um computador ou escritório?',
      a: 'Sim! A plataforma é 100% web baseada em nuvem SaaS. No Plano Escritório você pode cadastrar múltiplos peritos e acessar de qualquer lugar.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a Página Inicial</span>
        </button>

        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-black uppercase">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>Central de Ajuda & Base de Conhecimento</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Como Podemos Ajudar Você?</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
            Tutoriais passo a passo, modelo de respostas a quesitos e suporte técnico especializado.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">Perguntas Frequentes (FAQ)</h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-4 text-left text-xs font-bold text-slate-900 flex justify-between items-center cursor-pointer hover:bg-slate-100"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {openFaq === idx && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 bg-white">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support CTA */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-6 rounded-3xl border border-blue-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-white shadow-lg">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-8 h-8 text-amber-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Suporte Técnico Prioritário VIP via WhatsApp</h3>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">Exclusivo Plano Escritório</span>
              </div>
              <p className="text-xs text-slate-200 mt-1">Nossa equipe técnica atende em até 15 minutos com canal direto pelo WhatsApp para tiragem de dúvidas periciais.</p>
            </div>
          </div>

          <button
            onClick={() => {
              window.open('https://api.whatsapp.com/send?phone=5561985863990&text=Ol%C3%A1!%20Sou%20assinante%20do%20Plano%20Escrit%C3%B3rio%20e%20preciso%20de%20suporte%20técnico.', '_blank');
            }}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer shrink-0 border border-emerald-400/30 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chamar WhatsApp VIP</span>
          </button>
        </div>

      </div>
    </div>
  );
};
