import React, { useState } from 'react';
import { 
  Upload, 
  Trash2, 
  Building, 
  Lock, 
  Users, 
  Plus, 
  Key, 
  CreditCard, 
  Receipt, 
  Sparkles, 
  User, 
  ShieldCheck,
  Crown,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import type { ProfessionalProfile, SubscriptionConfig, SubscriptionPlanType } from '../types';
import { initialProfessionalProfile } from '../mockData';
import { formatCpfCnpj } from '../services/calculations';

interface ModulePerfilProps {
  profile: ProfessionalProfile;
  onChange: (updated: ProfessionalProfile) => void;
  subscription?: SubscriptionConfig;
  onSelectPlan?: (planId: SubscriptionPlanType) => void;
}

export const ModulePerfilProfissional: React.FC<ModulePerfilProps> = ({
  profile,
  onChange,
  subscription = {
    planId: 'individual',
    planName: 'Plano Profissional (Individual)',
    price: 159,
    maxLaudosMes: 15,
    laudosGeradosMes: 4,
    maxUsers: 1,
    activeUsersCount: 1,
    customLogoAllowed: false,
    teamManagementAllowed: false,
    whatsappSupportVip: false,
  },
  onSelectPlan,
}) => {
  const [activeAccountTab, setActiveAccountTab] = useState<'perfil' | 'senha' | 'assinatura' | 'faturas'>('perfil');
  const [isEditing, setIsEditing] = useState(true);

  // Form states para troca de senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estado de Cancelamento de Assinatura
  const [isSubscriptionCancelled, setIsSubscriptionCancelled] = useState(false);

  // Estado de Gestão de Equipe (Peritos Simultâneos)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; nome: string; papel: string; registro: string; email: string; status: 'Ativo' | 'Pendente' }>>([]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePapel, setInvitePapel] = useState('Perito Assistente');
  const [inviteRegistro, setInviteRegistro] = useState('');

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) {
      alert('Por favor, preencha o Nome e o E-mail do integrante.');
      return;
    }
    const maxAllowed = subscription.maxUsers || 5;
    if (teamMembers.length + 1 >= maxAllowed) {
      alert(`Você atingiu o limite de ${maxAllowed} peritos/membros da sua licença.`);
    }

    const newMember = {
      id: `member_${Date.now()}`,
      nome: inviteName,
      papel: invitePapel,
      registro: inviteRegistro || 'N/A',
      email: inviteEmail,
      status: 'Ativo' as const,
    };

    setTeamMembers([...teamMembers, newMember]);
    setIsInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInvitePapel('Perito Assistente');
    setInviteRegistro('');
    alert(`📧 Convite enviado com sucesso para ${inviteEmail}! Integrante adicionado à equipe.`);
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Deseja remover este integrante da licença do escritório?')) {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    }
  };

  const handleCancelSubscription = () => {
    if (confirm('Tem certeza de que deseja cancelar a sua assinatura recorrente?\n\n- Sua cota de laudos e recursos do plano continuarão ativos até o fim do período já pago.\n- Nenhuma nova cobrança será realizada no seu cartão de crédito ou PIX.')) {
      setIsSubscriptionCancelled(true);
      alert('Assinatura cancelada com sucesso! Você continuará com acesso total até o final do ciclo atual.');
    }
  };

  const handleReactivateSubscription = () => {
    setIsSubscriptionCancelled(false);
    alert('Assinatura reativada com sucesso! A renovação automática continuará sem interrupções.');
  };

  // Histórico de Faturas Pagas (Zerado para novas faturas reais)
  const invoices: Array<{ id: string; data: string; valor: number; status: string; metodo: string }> = [];

  const handleFieldChange = (field: keyof ProfessionalProfile, val: any) => {
    onChange({ ...profile, [field]: val });
  };

  const handleResetProfile = () => {
    if (confirm('Deseja restaurar os dados do perfil profissional para os valores padrão?')) {
      onChange(initialProfessionalProfile);
    }
  };

  const handleClearProfile = () => {
    if (confirm('Deseja limpar todos os campos do perfil profissional?')) {
      onChange({
        nomeProfissional: '',
        papel: 'Perito Judicial',
        registroProfissional: '',
        cpfCnpj: '',
        nomeEscritorioEmpresa: '',
        email: '',
        telefoneWhatsapp: '',
        enderecoComercial: '',
        cidadeUf: '',
        logomarcaUrl: null,
        pdfModeloPlanoNome: null,
        pdfModeloPlanoTamanho: null,
        pdfModeloLaudoNome: null,
        pdfModeloLaudoTamanho: null,
        pdfModeloPeticaoNome: null,
        pdfModeloPeticaoTamanho: null,
        pdfModeloParecerNome: null,
        pdfModeloParecerTamanho: null,
      });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange('logomarcaUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    handleFieldChange('logomarcaUrl', null);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      alert('As senhas não coincidem ou estão em branco.');
      return;
    }
    alert('🔒 Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      
      {/* 1. SINGLE UNIFIED HORIZONTAL HEADER CARD (All elements on the EXACT SAME row) */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        
        {/* Left: User Avatar & Admin Info */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <User className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#1C2B33] font-serif-header">
                {profile.nomeProfissional || 'Administrador Master'}
              </h2>
              
              <span className="inline-flex items-center gap-1 bg-[#E7F3EE] text-[#2E7D62] border border-[#C5E2D6] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>{subscription.planId === 'escritorio' ? 'PLANO ESCRITÓRIO' : 'PLANO PROFISSIONAL'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              {profile.email || 'admin@periciasuperendividamento.com.br'}
            </p>
          </div>
        </div>

        {/* Center: Sub-navigation Tabs (Terms on the exact same row as requested) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-2xl border border-[#DCD8CD]">
          <button
            onClick={() => setActiveAccountTab('perfil')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeAccountTab === 'perfil'
                ? 'bg-[#1C4E5E] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Perfil & Empresa</span>
          </button>

          <button
            onClick={() => setActiveAccountTab('senha')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeAccountTab === 'senha'
                ? 'bg-[#1C4E5E] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Trocar Senha</span>
          </button>

          <button
            onClick={() => setActiveAccountTab('assinatura')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeAccountTab === 'assinatura'
                ? 'bg-[#1C4E5E] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gerenciar Assinatura</span>
          </button>

          <button
            onClick={() => setActiveAccountTab('faturas')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
              activeAccountTab === 'faturas'
                ? 'bg-[#1C4E5E] text-white shadow-2xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Faturas Pagas ({invoices.length})</span>
          </button>
        </div>

        {/* Right: Action Buttons Toolbar (Independent per sub-tab) */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {/* 1. CONCLUIR / EDITAR */}
          <button
            type="button"
            onClick={() => {
              if (activeAccountTab === 'senha') {
                if (newPassword) {
                  alert('🔒 Nova senha confirmada e salva com sucesso!');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } else {
                  setIsEditing(!isEditing);
                }
              } else {
                setIsEditing(!isEditing);
              }
            }}
            className={`px-3.5 py-1 text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs border ${
              isEditing ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-300 hover:bg-amber-400 text-slate-900 border-amber-400'
            }`}
          >
            <span>{isEditing ? 'Concluir' : 'Editar'}</span>
          </button>

          {/* 2. LIMPAR */}
          <button
            type="button"
            onClick={() => {
              if (activeAccountTab === 'perfil') {
                handleClearProfile();
              } else if (activeAccountTab === 'senha') {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } else if (activeAccountTab === 'assinatura') {
                if (onSelectPlan) onSelectPlan('individual');
                alert('Seleção de plano redefinida.');
              } else if (activeAccountTab === 'faturas') {
                alert('Filtro de faturas limpo.');
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              const tabName = activeAccountTab === 'perfil' 
                ? 'Perfil & Empresa' 
                : activeAccountTab === 'senha' 
                ? 'Trocar Senha' 
                : activeAccountTab === 'assinatura' 
                ? 'Gerenciar Assinatura' 
                : 'Faturas Pagas';

              if (confirm(`Deseja excluir permanentemente os dados da aba "${tabName}"?`)) {
                if (activeAccountTab === 'perfil') {
                  handleClearProfile();
                } else if (activeAccountTab === 'senha') {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                } else if (activeAccountTab === 'assinatura') {
                  handleCancelSubscription();
                } else if (activeAccountTab === 'faturas') {
                  alert('Histórico local de faturas zerado.');
                }
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={() => {
              if (activeAccountTab === 'perfil') {
                handleResetProfile();
              } else if (activeAccountTab === 'senha') {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              } else if (activeAccountTab === 'assinatura') {
                if (onSelectPlan) onSelectPlan('individual');
                alert('Plano de assinatura restaurado para o padrão.');
              } else if (activeAccountTab === 'faturas') {
                alert('Histórico de faturas restaurado.');
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => {
              if (activeAccountTab === 'perfil') {
                alert('Dados do Perfil Profissional & Empresa salvos com sucesso!');
              } else if (activeAccountTab === 'senha') {
                if (!newPassword || newPassword !== confirmPassword) {
                  alert('Por favor, preencha e confirme a nova senha antes de salvar.');
                } else {
                  alert('🔒 Nova senha gravada com sucesso!');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }
              } else if (activeAccountTab === 'assinatura') {
                alert('Configurações de Assinatura salvas com sucesso!');
              } else if (activeAccountTab === 'faturas') {
                alert('Histórico de faturas gravado/exportado com sucesso!');
              }
            }}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>

      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: PERFIL & EMPRESA (Identical layout to reference image) */}
      {activeAccountTab === 'perfil' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              Dados Pessoais & Do Escritório Contábil
            </h3>
          </div>

          <div className="space-y-4">
            
            {/* Row 1: Nome + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={profile.nomeProfissional}
                  onChange={(e) => handleFieldChange('nomeProfissional', e.target.value)}
                  placeholder="Administrador Master"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder="admin@ivasimulador.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Row 2: Telefone + CPF/CNPJ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={profile.telefoneWhatsapp}
                  onChange={(e) => handleFieldChange('telefoneWhatsapp', e.target.value)}
                  placeholder="(61) 9 8586-3990"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CPF ou CNPJ do Escritório</label>
                <input
                  type="text"
                  value={profile.cpfCnpj}
                  onChange={(e) => handleFieldChange('cpfCnpj', formatCpfCnpj(e.target.value))}
                  placeholder="12.345.678/0001-90"
                  maxLength={18}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Row 3: Razão Social */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social / Nome do Escritório Contábil</label>
              <input
                type="text"
                value={profile.nomeEscritorioEmpresa}
                onChange={(e) => handleFieldChange('nomeEscritorioEmpresa', e.target.value)}
                placeholder="Ex: Teófilo & Associados Perícias Contábeis"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Row 4: Logomarca Upload Box (Dashed style identical to reference image) */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">Logomarca do Escritório (White-Label em PDF)</label>
              
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 text-center space-y-3 min-h-[160px]">
                {profile.logomarcaUrl ? (
                  <div className="space-y-3 flex flex-col items-center">
                    <img
                      src={profile.logomarcaUrl}
                      alt="Logomarca do Escritório"
                      className="max-h-24 max-w-full object-contain rounded border border-slate-200 shadow-2xs"
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-800 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remover Logomarca</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400" />
                    <p className="text-xs text-slate-600 font-medium">Selecione uma imagem de logo no seu computador</p>
                    
                    <label className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs border border-blue-500 cursor-pointer transition-all inline-block">
                      <span>Selecionar Logomarca</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Right Action Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={() => alert('🛡️ Dados do Perfil e Escritório salvos com sucesso!')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Salvar Perfil & Empresa</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: TROCAR SENHA */}
      {activeAccountTab === 'senha' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-6 max-w-xl">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
            <Key className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              Segurança de Acesso & Alteração de Senha
            </h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Senha Atual</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Atualizar Senha de Acesso</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: GERENCIAR ASSINATURA */}
      {activeAccountTab === 'assinatura' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              Detalhes da Assinatura SaaS Recorrente
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Plano Ativo</span>
                <h4 className="text-xl font-black text-slate-900 mt-1">{subscription.planName}</h4>
                <p className="text-xs text-slate-600 mt-1">Faturamento Mensal Recorrente</p>
              </div>

              <div className="text-3xl font-black text-blue-600 font-mono">
                R$ {subscription.price},00 <span className="text-xs text-slate-500 font-normal">/mês</span>
              </div>

              <div className="space-y-2 text-xs text-slate-700 border-t border-slate-200 pt-4">
                <div className="flex justify-between">
                  <span>Cota Mensal de Laudos:</span>
                  <span className="font-bold text-emerald-700">{subscription.planId === 'escritorio' ? 'Ilimitado' : `${subscription.laudosGeradosMes} de ${subscription.maxLaudosMes} gerados`}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usuários Permitidos:</span>
                  <span className="font-bold text-slate-900">{subscription.maxUsers} perito(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Status do Pagamento:</span>
                  <span className={`font-bold ${isSubscriptionCancelled ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isSubscriptionCancelled ? 'Cancelamento Agendado (Válido até 05/09/2026)' : 'Em dia (Renovação em 05/09/2026)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Deseja alterar seu plano?</span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Alterne entre o <strong>Plano Individual (R$ 159/mês - 15 laudos)</strong> e o <strong>Plano Escritório Team Unlimited (R$ 299/mês - Laudos Ilimitados e 5 usuários)</strong> a qualquer momento sem custos adicionais de migração.
                </p>
              </div>

              {onSelectPlan && (
                <button
                  onClick={() => onSelectPlan(subscription.planId === 'individual' ? 'escritorio' : 'individual')}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer transition-all"
                >
                  {subscription.planId === 'individual' ? 'Migrar para o Plano Escritório (R$ 299/mês)' : 'Migrar para o Plano Individual (R$ 159/mês)'}
                </button>
              )}
            </div>
          </div>

          {/* DEDICATED SECTOR FOR SUBSCRIPTION CANCELLATION */}
          <div className="bg-[#FDF2F2] p-6 rounded-2xl border border-[#F8B4B4] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center text-red-700 font-bold">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#9B1C1C]">Cancelar Assinatura Recorrente</h4>
                  <p className="text-xs text-[#771D1D] mt-0.5">
                    Você pode encerrar sua assinatura a qualquer momento. Seus acessos continuarão válidos até o encerramento do ciclo pago.
                  </p>
                </div>
              </div>

              {isSubscriptionCancelled ? (
                <button
                  onClick={handleReactivateSubscription}
                  className="px-5 py-2.5 bg-[#2E7D62] hover:bg-[#23624D] text-white font-black text-xs rounded-xl border border-[#2E7D62] cursor-pointer shadow-2xs transition-all shrink-0 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Reativar Assinatura</span>
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl border border-red-700 cursor-pointer shadow-2xs transition-all shrink-0 flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-white" />
                  <span>Cancelar Assinatura</span>
                </button>
              )}
            </div>

            {isSubscriptionCancelled && (
              <div className="bg-white p-3.5 rounded-xl border border-red-200 text-xs text-red-900 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Sua solicitação de cancelamento foi gravada. A renovação automática foi desativada e nenhuma nova cobrança será efetuada. Seu acesso aos laudos permanecerá liberado até <strong>05/09/2026</strong>.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: FATURAS PAGAS */}
      {activeAccountTab === 'faturas' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
            <Receipt className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-black text-slate-900">
              Histórico de Faturas & Recibos de Assinatura
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                  <th className="py-3 px-4">Recibo / ID</th>
                  <th className="py-3 px-4">Data do Faturamento</th>
                  <th className="py-3 px-4">Método de Pagamento</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium italic">
                      Nenhuma fatura ou recibo de pagamento cadastrado até o momento.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.data}</td>
                      <td className="py-3.5 px-4 text-slate-700">{inv.metodo}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">R$ {inv.valor},00</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => alert(`📄 Baixando recibo em PDF da fatura ${inv.id}...`)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg border border-slate-300 cursor-pointer"
                        >
                          Baixar PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SEÇÃO GESTÃO DA EQUIPE & MODELOS DE ARQUIVOS (Módulo 1) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 w-full">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Gestão da Equipe & Peritos Simultâneos</h3>
          </div>
          <span className={`text-[11px] font-bold px-3 py-0.5 rounded-full border ${
            subscription.teamManagementAllowed 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}>
            {subscription.teamManagementAllowed ? `Até ${subscription.maxUsers} Peritos Simultâneos` : '1 Perito Único (Plano Individual)'}
          </span>
        </div>

        {!subscription.teamManagementAllowed ? (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-center space-y-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-amber-950 uppercase">Gestão de Equipe Bloqueada no Plano Individual</h4>
              <p className="text-xs text-amber-900 mt-1 max-w-xl mx-auto leading-relaxed">
                No <strong>Plano Profissional Individual (R$ 159/mês)</strong>, a licença é exclusiva para 1 único perito.
              </p>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                Faça o upgrade para o <strong>Plano Team Unlimited (R$ 299/mês)</strong> para convidar e gerenciar até 5 peritos/membros da equipe simultaneamente no sistema.
              </p>
            </div>
            {onSelectPlan && (
              <button
                onClick={() => onSelectPlan('escritorio')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs border border-blue-500 cursor-pointer"
              >
                Liberar 5 Usuários no Plano Escritório (R$ 299/mês)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Integrantes Cadastrados na Sua Licença de Escritório ({teamMembers.length + 1} de {subscription.maxUsers || 5} vagas utilizadas):</span>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-2xs cursor-pointer transition-all border border-blue-500"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Convidar Perito / Membro</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-extrabold uppercase text-[10px] border-b border-slate-300">
                    <th className="py-2.5 px-3">Perito / Membro</th>
                    <th className="py-2.5 px-3">Papel Pericial</th>
                    <th className="py-2.5 px-3">Registro (CRC/OAB)</th>
                    <th className="py-2.5 px-3">E-mail de Acesso</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Titular */}
                  <tr className="bg-white">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{profile.nomeProfissional || 'Perito Titular (Você)'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{profile.papel} (Titular)</td>
                    <td className="py-2.5 px-3 font-mono text-slate-800">{profile.registroProfissional || 'Não informado'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{profile.email || 'Não informado'}</td>
                    <td className="py-2.5 px-3"><span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Ativo</span></td>
                    <td className="py-2.5 px-3 text-center"><span className="text-[10px] text-slate-400 font-bold uppercase">Titular</span></td>
                  </tr>

                  {/* Integrantes Convidado */}
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="bg-white hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{member.nome}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">{member.papel}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-800">{member.registro}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{member.email}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {member.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer transition-all"
                          title="Remover Membro da Licença"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONVIDAR INTEGRANTE */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Convidar Integrante da Equipe</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Perito / Membro</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: Dra. Mariana Santos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Profissional (Acesso)</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="mariana@escritoriopericias.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Papel Pericial / Função</label>
                <select
                  value={invitePapel}
                  onChange={(e) => setInvitePapel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-600 cursor-pointer"
                >
                  <option value="Perito Assistente">Perito Assistente</option>
                  <option value="Assistente Técnica">Assistente Técnica / Advogada</option>
                  <option value="Analista Contábil">Analista Contábil / Financeiro</option>
                  <option value="Calculista Pericial">Calculista Pericial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registro Profissional (CRC / OAB / CRA)</label>
                <input
                  type="text"
                  value={inviteRegistro}
                  onChange={(e) => setInviteRegistro(e.target.value)}
                  placeholder="Ex: CRC-DF 098765/O"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md border border-blue-500 cursor-pointer"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
