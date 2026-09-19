import React from 'react';
import { Scale, Award, ArrowLeft, Sparkles } from 'lucide-react';

interface SobrePageProps {
  onNavigate: (route: string) => void;
}

export const SobrePage: React.FC<SobrePageProps> = ({ onNavigate }) => {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded-full text-xs font-black uppercase">
            <Scale className="w-4 h-4 text-blue-600" />
            <span>Quem Somos</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Sobre a Plataforma SaaS de Perícia</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto font-medium">
            Referência nacional na automação contábil para a Lei do Superendividamento (Lei n.º 14.181/2021).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6 text-xs text-slate-700 leading-relaxed shadow-md">
          
          <p className="text-sm text-slate-800 font-medium">
            A Plataforma SaaS de Perícia em Superendividamento foi concebida por peritos contábeis, economistas e advogados especialistas em direito bancário para suprir a demanda judicial por laudos céleres, matematicamente exatos e rigorosamente fundamentados na Lei 14.181/2021.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Nossa Missão</span>
              </div>
              <p className="text-xs text-slate-600">
                Democratizar o acesso a laudos periciais de alta precisão técnica, fornecendo a peritos e escritórios uma solução automatizada em 19 módulos integrados.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Inovação Contínua</span>
              </div>
              <p className="text-xs text-slate-600">
                Atualização constante das tabelas de índices INPC/IPCA e Taxas Médias BACEN, combinada com tecnologia OCR para leitura rápida de autos do processo.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
