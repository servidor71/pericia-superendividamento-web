// 1. Calculador de CRC16-CCITT Padrão Banco Central do Brasil (BCB) / EMV PIX
export function computePixCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Chave Celular Oficial (Chave Pix DICT cadastrada)
export const MERCADO_PAGO_DIRECT_PIX_KEY = '61985863990';

// 2. Gerador de Código PIX EMV BR Code com Tag 54 (Valor Fixo Travado no Banco Central) e CRC16-CCITT
export function generateFixedPixCode(amount: number, txId: string = 'daqr157967802116298'): string {
  const amountStr = Number(amount).toFixed(2);
  const tag54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // Tag 62 (TxID Adicional)
  const txIdTag = `05${txId.length.toString().padStart(2, '0')}${txId}`;
  const tag62 = `62${txIdTag.length.toString().padStart(2, '0')}${txIdTag}`;

  const basePayload =
    `000201` +
    `26360014br.gov.bcb.pix0114+5561985863990` +
    `52040000` +
    `5303986` +
    tag54 +
    `5802BR` +
    `5920Luiz Antonio Teofilo` +
    `6009Sao Paulo` +
    tag62 +
    `6304`;

  const crc = computePixCRC16(basePayload);
  return basePayload + crc;
}

export const OFFICIAL_PRO_PLAN_PIX_CODE = generateFixedPixCode(159.00);
export const OFFICIAL_CORPORATE_PLAN_PIX_CODE = generateFixedPixCode(299.00);

// 3. Gera a URL da imagem do QR Code com Escape Seguro '%2B' para o caractere '+'
export function getQrCodeImageUrl(pixCodeString: string): string {
  const safeData = encodeURIComponent(pixCodeString)
    .replace(/\+/g, '%2B')
    .replace(/ /g, '%20');
  return `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=10&data=${safeData}`;
}

// 4. Interface dos Dados de Requisição
export interface PixPaymentRequest {
  plan: 'pro' | 'corporate' | 'individual' | 'escritorio';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  description?: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    cpfCnpj: string;
    phone: string;
  };
}

export interface PixPaymentResponse {
  paymentId: string;
  status: string;
  qrCode: string;
  qrCodeBase64?: string;
  amount: number;
  expirationDate: string;
  directPixKey: string;
}

// 5. Função de Criação do Pagamento Pix com Valor Fixo no Banco Central
export async function createPixPayment(req: PixPaymentRequest): Promise<PixPaymentResponse> {
  const paymentId = `PIX-MP-${Date.now().toString().slice(-8)}`;
  const description = req.description || `Assinatura ${req.plan === 'pro' || req.plan === 'individual' ? 'Profissional' : 'Corporate'}`;
  
  // Gera PIX Copia e Cola Oficial com Tag 54 de Valor Fixo Travado no Banco Central
  const qrCode = generateFixedPixCode(req.amount);
  const qrCodeBase64 = getQrCodeImageUrl(qrCode);
  const expDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Tenta integrar com o Backend Node.js (/api/criar-pagamento-pix)
  try {
    const res = await fetch('/api/criar-pagamento-pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_amount: req.amount,
        description,
        payment_method_id: 'pix',
        payer: {
          email: req.payer.email,
          first_name: req.payer.firstName,
          last_name: req.payer.lastName,
          identification: {
            type: req.payer.cpfCnpj.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
            number: req.payer.cpfCnpj.replace(/\D/g, ''),
          },
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.qr_code) {
        return {
          paymentId: String(data.id_pagamento || paymentId),
          status: data.status || 'pending',
          qrCode: data.qr_code,
          qrCodeBase64: data.qr_code_base64 || getQrCodeImageUrl(data.qr_code),
          amount: req.amount,
          expirationDate: expDate,
          directPixKey: MERCADO_PAGO_DIRECT_PIX_KEY,
        };
      }
    }
  } catch (e) {
    // Fallback gracioso com QR Code de valor fixo travado
  }

  return {
    paymentId,
    status: 'pending',
    qrCode,
    qrCodeBase64,
    amount: req.amount,
    expirationDate: expDate,
    directPixKey: MERCADO_PAGO_DIRECT_PIX_KEY,
  };
}

// 6. Consulta Estrita do Status no Mercado Pago (Com retorno padrão 'pending' antifraude)
export async function checkPixPaymentStatus(paymentId: string): Promise<{ status: string; amount?: number }> {
  try {
    const res = await fetch(`/api/verificar-pagamento-pix?id=${paymentId}`);
    if (res.ok) {
      const data = await res.json();
      return {
        status: data.status || 'pending',
        amount: Number(data.transaction_amount || data.amount || 0),
      };
    }
  } catch (e) {}

  // REGRA DE OURO ANTIFRAUDE: Nunca retorne 'approved' se a API falhar!
  return { status: 'pending' };
}
