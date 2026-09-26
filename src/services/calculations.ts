import type { IncomeData, ExpenseData, Contract, ProportionalInstallment } from '../types';

export function calculateRLA(income: IncomeData): number {
  if (income.contrachequesPorEmpregador && income.contrachequesPorEmpregador.length > 0) {
    let rlaCalculada = 0;
    
    for (const emp of income.contrachequesPorEmpregador) {
      const descontosFolhaTotal = (emp.outrosDescontosFolha || []).reduce((acc, d) => acc + (d.valor || 0), 0);
      const liquidoEmp = emp.rendimentoBruto - (emp.rppsInss + emp.irrf + emp.planoSaudeFolha + descontosFolhaTotal);
      rlaCalculada += liquidoEmp;
    }

    const outrasReceitasTotal = (income.outrasReceitasIndividuais || []).reduce(
      (acc, r) => acc + (r.valor || 0), 
      0
    );

    return Math.max(0, rlaCalculada + outrasReceitasTotal);
  }

  const deducoes = 
    income.rppsInss + 
    income.irrf + 
    income.pensaoAlimenticia + 
    income.planoSaudeFolha + 
    income.outrasDeducoesLegais;
  
  const outrasReceitasTotal = (income.outrasReceitasIndividuais || []).reduce(
    (acc, r) => acc + (r.valor || 0), 
    0
  );

  return Math.max(0, income.salarioBruto + outrasReceitasTotal - deducoes);
}

export function calculateTotalExpenses(expenses: ExpenseData): number {
  const padrao = 
    expenses.moradia +
    expenses.alimentacao +
    expenses.saudeMedicamentos +
    expenses.transporte +
    expenses.educacaoDependentes +
    expenses.outrasDespesasEssenciais;

  const outrasDespesasTotal = (expenses.outrasDespesasIndividuais || []).reduce(
    (acc, d) => acc + (d.valor || 0), 
    0
  );

  return padrao + outrasDespesasTotal;
}

/**
 * Apura o Saldo Devedor do Módulo 6 (Saldo Devedor por Prestações Pagas no Sistema Price)
 */
export function getSaldoDevedorModulo6(c: Contract): number {
  if (c.saldoDevedorRefUltimaParcela !== undefined && c.saldoDevedorRefUltimaParcela > 0) {
    return c.saldoDevedorRefUltimaParcela;
  }

  const valorPrincipal = Number(c.valorLiberadoContrato) || 0;
  const taxaJurosAm = Number(c.taxaJurosMes) || 0;
  const prazoMeses = Number(c.qtdParcelasTotal) || 0;
  const prestacaoAtual = Number(c.valorParcelaAtual) || 0;
  const parcelasPagas = Number(c.qtdParcelasPagas) || 0;

  if (valorPrincipal <= 0 || prazoMeses <= 0) return 0;
  if (parcelasPagas === 0) return valorPrincipal;

  const iContrato = taxaJurosAm / 100;
  const pmtPriceCalculada = iContrato > 0
    ? (valorPrincipal * (iContrato * Math.pow(1 + iContrato, prazoMeses))) / (Math.pow(1 + iContrato, prazoMeses) - 1)
    : (valorPrincipal / prazoMeses);

  const pmtEfetiva = prestacaoAtual > 0 ? prestacaoAtual : pmtPriceCalculada;

  let currentSD = valorPrincipal;
  for (let n = 1; n <= prazoMeses; n++) {
    const jurosMes = currentSD * iContrato;
    let amortMes = pmtEfetiva - jurosMes;

    if (n === prazoMeses || currentSD - amortMes < 0.05) {
      amortMes = currentSD;
    }

    const nextSD = Math.max(0, currentSD - amortMes);
    if (n === parcelasPagas) {
      return Math.round(nextSD * 100) / 100;
    }
    currentSD = nextSD;
  }

  return Math.round(currentSD * 100) / 100;
}

export function calculateFinancialSummary(income: IncomeData, expenses: ExpenseData, contracts: Contract[]) {
  const rla = calculateRLA(income);
  const totalDespesas = calculateTotalExpenses(expenses);
  const minimoExistencial = expenses.minimoExistencialConfig;

  // Sobra Líquida Orçamentária = RLA - Despesas Básicas - Mínimo Existencial
  const sobraLiquida = rla - totalDespesas;
  const capacidadeMensalPlano = Math.max(0, sobraLiquida);

  // Total das Parcelas Atuais dos Contratos
  const totalParcelasAtuais = contracts.reduce((acc, c) => acc + c.valorParcelaAtual, 0);

  // Percentual de Comprometimento Atual da RLA pelas dívidas
  const percentualComprometimentoRLA = rla > 0 ? (totalParcelasAtuais / rla) * 100 : 0;

  // Saldo Devedor Consolidado (Original vs INPC/IPCA Ajustado com expurgos)
  let totalSaldoDevedorOriginal = 0;
  let totalSaldoDevedorINPC = 0;

  const contractsCalculated = contracts.map(c => {
    const saldoBaseOriginal = getSaldoDevedorModulo6(c);

    const deducaoAbusiva = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    const saldoBaseAjustado = Math.max(0, saldoBaseOriginal - deducaoAbusiva);
    const fatorCorrecao = c.fatorCorrecao7Casas || 1.0;
    
    // Saldo Devedor Restante Atualizado (INPC/IPCA) arredondado para 2 casas decimais
    const saldoINPC = Math.round((saldoBaseAjustado * fatorCorrecao) * 100) / 100;

    totalSaldoDevedorOriginal += saldoBaseOriginal;
    totalSaldoDevedorINPC += saldoINPC;

    return {
      ...c,
      saldoBaseAjustado,
      saldoINPC,
      deducaoAbusiva,
      percentualRLA: rla > 0 ? (c.valorParcelaAtual / rla) * 100 : 0
    };
  });

  return {
    rla: Math.round(rla * 100) / 100,
    totalDespesas: Math.round(totalDespesas * 100) / 100,
    minimoExistencial: Math.round(minimoExistencial * 100) / 100,
    sobraLiquida: Math.round(sobraLiquida * 100) / 100,
    capacidadeMensalPlano: Math.round(capacidadeMensalPlano * 100) / 100,
    totalParcelasAtuais: Math.round(totalParcelasAtuais * 100) / 100,
    percentualComprometimentoRLA,
    totalSaldoDevedorOriginal: Math.round(totalSaldoDevedorOriginal * 100) / 100,
    totalSaldoDevedorINPC: Math.round(totalSaldoDevedorINPC * 100) / 100,
    contractsCalculated
  };
}

export function calculateProportional60xPlan(contracts: Contract[], capacidadeMensal: number): ProportionalInstallment[] {
  // 1. Apurar total do saldo INPC/IPCA com expurgos
  const contractsAjustados = contracts.map(c => {
    let saldoBaseOriginal = c.valorParcelaAtual * c.qtdParcelasRestantes;
    let deducaoAbusiva = c.expurgarAbusividades ? (c.valorSeguroPrestamista + c.valorTarifasAbusivas) : 0;
    let fator = c.fatorCorrecao7Casas || 1.0;
    let saldoINPC = Math.max(0, saldoBaseOriginal - deducaoAbusiva) * fator;
    return { ...c, saldoINPC };
  });

  const totalSaldoINPC = contractsAjustados.reduce((acc, c) => acc + c.saldoINPC, 0);

  if (totalSaldoINPC === 0) {
    return contracts.map(c => ({
      credor: c.credor,
      numeroContrato: c.numeroContrato,
      saldoDevedorINPC: 0,
      percentualDoTotal: 0,
      parcelaRepactuadaPMT: 0,
      totalQuitado60m: 0
    }));
  }

  // 2. Aplicar fórmula PMT_i = Capacidade * (Saldo_INPC_i / Total_Saldo_INPC)
  return contractsAjustados.map(c => {
    const pesoPercentual = (c.saldoINPC / totalSaldoINPC) * 100;
    const parcelaRepactuadaPMT = capacidadeMensal * (c.saldoINPC / totalSaldoINPC);
    const totalQuitado60m = parcelaRepactuadaPMT * 60;

    return {
      credor: c.credor,
      numeroContrato: c.numeroContrato,
      saldoDevedorINPC: c.saldoINPC,
      percentualDoTotal: pesoPercentual,
      parcelaRepactuadaPMT: parcelaRepactuadaPMT,
      totalQuitado60m: totalQuitado60m
    };
  });
}

/**
 * Calculador de PMT no Sistema Francês de Amortização (Tabela Price)
 */
export function calculatePricePMT(principal: number, taxaAmPercent: number, prazoMeses: number): number {
  if (principal <= 0 || prazoMeses <= 0) return 0;
  const i = taxaAmPercent / 100;
  if (i === 0) return principal / prazoMeses;
  const factor = Math.pow(1 + i, prazoMeses);
  return principal * ((i * factor) / (factor - 1));
}

/**
 * Gerador do Cronograma de Amortização Tabela Price
 */
export function generatePriceSchedule(principal: number, taxaAmPercent: number, prazoMeses: number) {
  const pmt = calculatePricePMT(principal, taxaAmPercent, prazoMeses);
  const i = taxaAmPercent / 100;
  let saldoInicial = principal;
  const schedule = [];

  for (let m = 1; m <= prazoMeses; m++) {
    const juros = saldoInicial * i;
    let amortizacao = pmt - juros;
    if (m === prazoMeses) {
      amortizacao = saldoInicial; // Ajuste no saldo final da última parcela
    }
    const prestacao = juros + amortizacao;
    const saldoFinal = Math.max(0, saldoInicial - amortizacao);

    schedule.push({
      parcela: m,
      saldoInicial,
      juros,
      amortizacao,
      prestacao,
      saldoFinal
    });

    saldoInicial = saldoFinal;
  }

  return { pmt, schedule };
}

/**
 * Cálculo da TIR Mensal e Anual baseado na Função TAXA do Excel:
 * TAXA(nper, pgto=0, va=-valorLiberado, vf=(prestacoesPagas + prestacoesRepactuadas), tipo=0)
 * nper = total de prestações pagas + prestações a pagar no plano (qtdParcelasPagas + prazoMesesPlano)
 * va = (-) valor liberado no contrato
 * vf = prestações já pagas + prestações repactuadas no plano
 * TIR mensal = ((vf / (-va)) ^ (1 / nper) - 1) * 100
 * TIR anual = ((1 + TIR_mensal_decimal)^12 - 1) * 100
 */
export function calculateExcelTaxaTIR(
  valorLiberado: number,
  prestacoesPagas: number,
  prestacoesRepactuadas: number,
  qtdParcelasPagas: number,
  prazoMesesPlano: number = 60
) {
  const nper = (qtdParcelasPagas || 0) + (prazoMesesPlano || 60);
  const va = -Math.abs(valorLiberado || 0);
  const vf = (prestacoesPagas || 0) + (prestacoesRepactuadas || 0);

  if (va === 0 || nper <= 0 || vf <= 0) {
    return {
      nper: 0,
      va: 0,
      vf: 0,
      tirAmDecimal: 0,
      tirAmPercent: 0,
      tirAaPercent: 0,
    };
  }

  // Formula Excel TAXA com pgto=0: (vf / (-va)) ^ (1 / nper) - 1
  const tirAmDecimal = Math.pow(vf / Math.abs(va), 1 / nper) - 1;
  const tirAmPercent = tirAmDecimal * 100;
  const tirAaPercent = (Math.pow(1 + tirAmDecimal, 12) - 1) * 100;

  return {
    nper,
    va,
    vf,
    tirAmDecimal,
    tirAmPercent,
    tirAaPercent,
  };
}

/**
 * Calculador de TIR (Internal Rate of Return - Taxa Interna de Retorno mensal) via Método Newton-Raphson
 */
export function calculateIRR(cashFlows: number[], guess = 0.01): number {
  const maxIter = 100;
  const tol = 1e-7;
  let rate = guess;

  for (let iter = 0; iter < maxIter; iter++) {
    let npv = 0;
    let dnpv = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const discount = Math.pow(1 + rate, t);
      npv += cashFlows[t] / discount;
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }

    if (Math.abs(dnpv) < 1e-12) break;

    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < tol) {
      return newRate;
    }
    rate = newRate;
  }

  return Math.max(0, rate);
}

/**
 * Análise de Evolução dos Contratos - Valores Contratados x Recebidos (Tabela da Imagem do Usuário)
 */
export function calculateContractEvolution(contracts: Contract[], capacidadeMensal: number) {
  const plan60x = calculateProportional60xPlan(contracts, capacidadeMensal);

  return contracts.map((c, idx) => {
    const pmt60 = plan60x[idx]?.parcelaRepactuadaPMT || 0;
    const qtdPagas = c.qtdParcelasPagas || 0;
    const qtdPagar = c.qtdParcelasRestantes || 60;
    const valorLiberado = c.valorLiberadoContrato || 0;
    const indice7Casas = c.fatorCorrecao7Casas || 1.0;

    const valorLiberadoCorrigido = valorLiberado * indice7Casas;
    const totalPrestacoesJaPagas = qtdPagas * c.valorParcelaAtual;
    const totalRepactuado60m = pmt60 * 60;
    const totalPagoJaPagasERepactuadas = totalPrestacoesJaPagas + totalRepactuado60m;
    const totalPagoAcimaDoValorLiberado = totalPagoJaPagasERepactuadas - valorLiberado;

    const percentualAcimaContratado = valorLiberado > 0 
      ? ((totalPagoJaPagasERepactuadas / valorLiberado) - 1) * 100 
      : 0;

    // Função TAXA do Excel solicitada: Nper = pagas + repactuadas, Pgto = 0, Va = -valorLiberado, Vf = pagas + repactuadas
    const tirResult = calculateExcelTaxaTIR(
      valorLiberado,
      totalPrestacoesJaPagas,
      totalRepactuado60m,
      qtdPagas,
      60
    );

    return {
      id: c.id,
      credor: c.credor,
      numeroContrato: c.numeroContrato,
      modalidade: c.modalidade,
      qtdPagas,
      qtdPagar,
      valorLiberado,
      tipoIndice: c.tipoIndiceCorrecao || 'INPC',
      indice7Casas,
      valorLiberadoCorrigido,
      totalPrestacoesJaPagas,
      totalRepactuado60m,
      totalPagoJaPagasERepactuadas,
      totalPagoAcimaDoValorLiberado,
      percentualAcimaContratado,
      tirAmPercent: tirResult.tirAmPercent,
      tirAaPercent: tirResult.tirAaPercent
    };
  });
}

export function getBacenStatus(taxaContratadaAm: number, taxaBacenAm: number): {
  status: 'ABAIXO' | 'NA_MEDIA' | 'ABUSIVA';
  label: string;
  badgeClass: string;
} {
  const diff = taxaContratadaAm - taxaBacenAm;

  if (diff > 1.0 || (taxaBacenAm > 0 && taxaContratadaAm / taxaBacenAm >= 1.5)) {
    return {
      status: 'ABUSIVA',
      label: 'ABUSIVA / ACIMA DA MÉDIA',
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-semibold'
    };
  } else if (diff < -0.2) {
    return {
      status: 'ABAIXO',
      label: 'ABAIXO DA MÉDIA',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold'
    };
  } else {
    return {
      status: 'NA_MEDIA',
      label: 'NA MÉDIA DE MERCADO',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-semibold'
    };
  }
}

/**
 * Formatação de Moeda Brasileira Padronizada (R$, separador de milhar, 2 casas decimais)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/**
 * Formatação de Datas Padronizada (dd/mm/aaaa)
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  
  // Se já estiver formatada como dd/mm/aaaa
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return dateString;

  // Se estiver no formato ISO YYYY-MM-DD
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }

  return dateString;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value || 0).toFixed(decimals)}%`;
}

export function format7Decimals(value: number): string {
  return (value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 7,
    maximumFractionDigits: 7
  });
}

/**
 * Formatação e Separação Automática de Dígitos de CPF (XXX.XXX.XXX-XX) ou CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCpfCnpj(val: string): string {
  if (!val) return '';
  const digits = val.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    return digits
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
}
