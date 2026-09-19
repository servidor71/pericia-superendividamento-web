import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft } from 'lucide-react';

interface ContatoPageProps {
  onNavigate: (route: string) => void;
}

export const ContatoPage: React.FC<ContatoPageProps> = ({ onNavigate }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Fale Conosco</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">Central de Atendimento & Vendas SaaS</h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto font-medium">
            Nossa equipe técnica e comercial está pronta para atender peritos, sociedades de advogados e órgãos públicos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Info Side */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-6">
            <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">Canais Diretos</h2>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">WhatsApp & Telefone Comercial</div>
                  <div className="text-slate-600 font-mono">+55 (61) 9 8586-3990</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl border border-emerald-200">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">E-mail Comercial</div>
                  <div className="text-slate-600 font-mono">contato@ltpericiacontabil.com.br</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl border border-purple-200">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">Sede Corporativa</div>
                  <div className="text-slate-600">Brasília - DF</div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md space-y-4">
            {submitted ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Mensagem Enviada com Sucesso!</h3>
                <p className="text-xs text-slate-600 font-medium">Em breve nossa equipe entrará em contato pelo e-mail ou WhatsApp cadastrado.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-base font-black text-slate-900 border-b border-slate-200 pb-3">Envie sua Mensagem</h2>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. João Silva"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    required
                    placeholder="joao@escritorio.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mensagem ou Dúvida Técnica</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Gostaria de agendar uma demonstração para nossa equipe..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer transition-all"
                >
                  Enviar Mensagem
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
