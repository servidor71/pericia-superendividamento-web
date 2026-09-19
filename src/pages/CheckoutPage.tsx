import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MercadoPagoCheckout } from '../components/MercadoPagoCheckout';

interface CheckoutPageProps {
  onNavigate: (route: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const [plan, setPlan] = useState<'individual' | 'escritorio'>('individual');
  const [frequencia, setFrequencia] = useState<'mensal' | 'anual'>('mensal');

  // Valores oficiais dos planos
  const monthlyPrice = plan === 'individual' ? 159.00 : 299.00;
  const annualTotal = plan === 'individual' ? 1717.20 : 3229.20; // 10% OFF no valor anual

  const handleSuccess = () => {
    alert(`🎉 Assinatura do ${plan === 'individual' ? 'Plano Profissional' : 'Plano Escritório Corporate'} ativada com sucesso via Mercado Pago! Redirecionando para a Plataforma de Perícia...`);
    onNavigate('app');
  };

  return (
    <div className="min-h-screen bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 font-sans">
      
      {/* Checkout Card Container */}
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest block">
              CHECKOUT TRANSPARENTE SEGURO MERCADO PAGO • COBRANÇA {frequencia.toUpperCase()}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {plan === 'individual' ? 'Assinatura do Plano Profissional' : 'Assinatura do Plano Escritório Corporate'}
            </h1>
          </div>

          <button
            onClick={() => onNavigate('landing')}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Plan Switcher Pills */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setPlan('individual')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              plan === 'individual' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👑 Plano Profissional (R$ 159/mês)
          </button>

          <button
            type="button"
            onClick={() => setPlan('escritorio')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              plan === 'escritorio' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Plano Escritório (R$ 299/mês)
          </button>
        </div>

        {/* Mercado Pago Checkout Transparente Component */}
        <MercadoPagoCheckout
          plan={plan === 'individual' ? 'pro' : 'corporate'}
          monthlyPrice={monthlyPrice}
          yearlyPrice={annualTotal}
          onSuccess={handleSuccess}
          onCycleChange={(newCycle) => setFrequencia(newCycle === 'yearly' ? 'anual' : 'mensal')}
        />

      </div>
    </div>
  );
};
