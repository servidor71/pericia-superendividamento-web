import React from 'react';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TermosUsoPageProps {
  onNavigate: (route: string) => void;
}

export const TermosUsoPage: React.FC<TermosUsoPageProps> = ({ onNavigate }) => {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-slate-200/80 border border-slate-300 text-slate-800 rounded-full text-xs font-black uppercase">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Contrato de Licença & Uso SaaS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Termos de Uso da Plataforma</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
            Direitos, deveres, condições de assinatura recorrente e garantia de serviço.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6 text-xs text-slate-700 leading-relaxed shadow-md">
          
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              1. Concessão de Licença SaaS
            </h2>
            <p>
              Ao assinar qualquer plano da Plataforma, é concedida ao contratante uma licença de uso revogável, não exclusiva e intransferível para aceso aos 19 módulos de cálculo pericial e geração de laudos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              2. Faturamento Recorrente e Renovação
            </h2>
            <p>
              As assinaturas são renovadas automaticamente a cada ciclo (mensal ou anual), podendo ser canceladas pelo assinante a qualquer momento no painel do usuário sem cobrança de multa rescisória.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              3. Responsabilidade do Perito Contábil
            </h2>
            <p>
              A Plataforma atua como ferramenta tecnológica de apoio ao cálculo. A validação técnica final dos parâmetros contábeis, taxas e premissas periciais é de responsabilidade exclusiva do perito nomeado ou assistente técnico.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
