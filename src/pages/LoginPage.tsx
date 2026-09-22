import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, LogIn, KeyRound, ArrowLeft, CheckCircle2, Crown, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (route: string) => void;
  onLoginMaster?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onLoginMaster }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Estado Modal de Recuperação de Senha
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const fillMasterCredentials = () => {
    setEmail('admin@periciamaster.com.br');
    setSenha('AdminMaster2026!');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      alert('Por favor, preencha o e-mail e a senha de acesso.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verificação de Administrador Master Supremo
    const isMasterEmail = ['admin@periciamaster.com.br', 'admin@master.com', 'admin@pericia.com', 'admin'].includes(cleanEmail);
    const isMasterPassword = ['AdminMaster2026!', 'admin123', 'admin', 'master'].includes(senha.trim());

    if (isMasterEmail && isMasterPassword) {
      alert('👑 Acesso Administrador Master ativado! Você tem acesso ilimitado a todas as funcionalidades.');
      if (onLoginMaster) {
        onLoginMaster();
      } else {
        onNavigate('app');
      }
      return;
    }

    alert(`🔐 Autenticado com sucesso! Bem-vindo de volta, ${email}.`);
    onNavigate('app');
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      alert('Por favor, informe seu e-mail cadastrado.');
      return;
    }
    setRecoverySuccess(true);
    setTimeout(() => {
      setRecoverySuccess(false);
      setIsForgotModalOpen(false);
      setRecoveryEmail('');
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Header with Title and Acesso Seguro badge */}
        <div className="border-b border-slate-200 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Entrar na Plataforma
            </h1>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-extrabold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Acesso Seguro</span>
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            Insira suas credenciais para acessar seus laudos periciais e processos.
          </p>
        </div>

        {/* Master Admin Card */}
        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Acesso Administrador Master
              </span>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
              Sem Limite
            </span>
          </div>

          <div className="text-[11px] text-slate-700 font-medium space-y-1 bg-white/80 p-2.5 rounded-xl border border-amber-200">
            <div><strong>E-mail:</strong> <code className="text-amber-900 font-mono">admin@periciamaster.com.br</code></div>
            <div><strong>Senha:</strong> <code className="text-amber-900 font-mono">AdminMaster2026!</code></div>
          </div>

          <button
            type="button"
            onClick={fillMasterCredentials}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
            <span>Preencher Credenciais Master</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* E-mail */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>E-mail de Acesso</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com.br"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Senha</span>
            </label>
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium placeholder-slate-400"
            />
          </div>

          {/* Lembrar-me & Recuperar Senha Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
              />
              <span>Lembrar meu acesso</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setRecoveryEmail(email);
                setIsForgotModalOpen(true);
              }}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Esqueceu sua senha?
            </button>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md border border-blue-500 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4 text-white" />
              <span>Entrar na Plataforma</span>
            </button>
          </div>

        </form>

        {/* Footer Link to Register */}
        <div className="pt-2 border-t border-slate-200 text-center text-xs text-slate-600 font-medium space-y-2">
          <div>
            <span>Ainda não possui uma conta? </span>
            <button
              onClick={() => onNavigate('cadastro')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Criar Conta Grátis
            </button>
          </div>

          <div>
            <button
              onClick={() => onNavigate('landing')}
              className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Voltar para a página inicial</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL DE RECUPERAÇÃO DE SENHA */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Recuperar Senha de Acesso</h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {recoverySuccess ? (
              <div className="bg-emerald-50 text-emerald-950 p-5 rounded-2xl border border-emerald-200 text-center space-y-3 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-black text-emerald-950">E-mail Enviado com Sucesso!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Enviamos um link de redefinição de senha para <strong>{recoveryEmail}</strong>. Verifique sua caixa de entrada e pasta de spam.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  Informe o e-mail cadastrado na plataforma. Enviaremos um link seguro para você redefinir sua senha.
                </p>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>E-mail Cadastrado</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Link</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
