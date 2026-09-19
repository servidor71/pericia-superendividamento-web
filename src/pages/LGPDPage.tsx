import React from 'react';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LGPDPageProps {
  onNavigate: (route: string) => void;
}

export const LGPDPage: React.FC<LGPDPageProps> = ({ onNavigate }) => {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-black uppercase">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Lei Geral de Proteção de Dados (Lei 13.709/2018)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Política de LGPD & Segurança dos Dados</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
            Compromisso absoluto com o sigilo profissional contábil, criptografia bancária e conformidade legal com a legislação brasileira de proteção de dados.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6 text-xs text-slate-700 leading-relaxed shadow-md">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              1. Coleta e Finalidade dos Dados Processuais
            </h2>
            <p>
              Os dados dos devedores, números de processos CNJ, valores de renda e contratos inseridos na Plataforma SaaS são tratados única e exclusivamente para a elaboração automatizada de laudos periciais de superendividamento nos termos da Lei nº 14.181/2021.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              2. Criptografia & Armazenamento Seguro
            </h2>
            <p>
              Todos os documentos anexados (contracheques, extratos bancários, peças processuais) são armazenados com criptografia de ponta a ponta AES-256 bits em servidores de alta disponibilidade (ISO 27001), com transmissão segura via TLS 1.3.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              3. Direitos do Titular (Art. 18 da LGPD)
            </h2>
            <p>
              Os peritos e titulares de dados podem solicitar a qualquer momento a confirmação da existência de tratamento, correção de dados incompletos, eliminação de dados ou exportação completa de seu acervo de laudos.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
