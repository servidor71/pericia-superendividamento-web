import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, User, Crown, Building, Zap, CheckCircle2 } from 'lucide-react';

interface CadastroPageProps {
  onNavigate: (route: string) => void;
}

export const CadastroPage: React.FC<CadastroPageProps> = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  const [selectedPlano, setSelectedPlano] = useState<'individual' | 'escritorio' | 'trial'>('individual');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      alert('As senhas digitadas não coincidem.');
      return;
    }
    alert(`🎉 Conta criada com sucesso para ${formData.nome || 'o usuário'}! Entrando na plataforma...`);
    onNavigate('app');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-2xl w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
        
        {/* Header with Title and "Acesso Seguro" badge */}
        <div className="border-b border-slate-200 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Criar Conta na Plataforma
            </h1>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-extrabold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Acesso Seguro</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Preencha seus dados abaixo para acessar os 19 módulos da plataforma.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. Nome Completo / Nome do Escritório */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Nome Completo / Nome do Escritório</span>
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Dr. Luiz Antonio Teófilo"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* 2. E-mail Corporativo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>E-mail Corporativo</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu.email@empresa.com.br"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* 3. Senha de Acesso */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Senha de Acesso</span>
            </label>
            <input
              type="password"
              required
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* 4. Confirmar Senha de Acesso */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Confirmar Senha de Acesso</span>
            </label>
            <input
              type="password"
              required
              value={formData.confirmarSenha}
              onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* 5. Escolha seu Plano Inicial (3 Cards Grid matching reference screenshot) */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-800">Escolha seu Plano Inicial:</label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option 1: Plano Profissional */}
              <div
                onClick={() => setSelectedPlano('individual')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  selectedPlano === 'individual'
                    ? 'border-2 border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>PLANO PROFISSIONAL</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">R$ 159 / mês</div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">19 Módulos + White-Label</div>
              </div>

              {/* Option 2: Escritório Corporate */}
              <div
                onClick={() => setSelectedPlano('escritorio')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  selectedPlano === 'escritorio'
                    ? 'border-2 border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-purple-600">
                    <Building className="w-3.5 h-3.5 text-purple-600" />
                    <span>ESCRITÓRIO CORPORATE</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">R$ 299 / mês</div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Escritórios & Multi-Usuários</div>
              </div>

              {/* Option 3: Trial Degustação */}
              <div
                onClick={() => setSelectedPlano('trial')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                  selectedPlano === 'trial'
                    ? 'border-2 border-blue-600 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-600">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>TRIAL DEGUSTAÇÃO</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">R$ 0 (7 Dias)</div>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Acesso básico de teste</div>
              </div>

            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md border border-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Cadastro & Entrar na Plataforma</span>
            </button>
          </div>

        </form>

        {/* Footer Login Link */}
        <div className="pt-2 text-center text-xs text-slate-600 font-medium">
          <span>Já possui uma conta? </span>
          <button
            onClick={() => onNavigate('login')}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Fazer Login
          </button>
        </div>

      </div>
    </div>
  );
};
