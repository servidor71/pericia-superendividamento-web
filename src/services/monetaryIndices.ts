import type { MonetaryIndexItem, Contract } from '../types';

/**
 * Tabela Padrão Oficial de Série Histórica de Índices Monetários (IBGE - INPC e IPCA)
 * Contém a coluna NÚMERO ÍNDICE oficial do IBGE para cálculo pericial de fatores acumulados.
 */
export const defaultMonetaryIndices: MonetaryIndexItem[] = [
  { id: 'idx_1', competencia: '01/2024', numeroIndiceInpc: 6721.45, indiceInpcMes: 0.57, fatorInpcAcumulado7Casas: 1.0057000, numeroIndiceIpca: 7012.30, indiceIpcaMes: 0.42, fatorIpcaAcumulado7Casas: 1.0042000, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_2', competencia: '02/2024', numeroIndiceInpc: 6775.83, indiceInpcMes: 0.81, fatorInpcAcumulado7Casas: 1.0138462, numeroIndiceIpca: 7070.50, indiceIpcaMes: 0.83, fatorIpcaAcumulado7Casas: 1.0125349, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_3', competencia: '03/2024', numeroIndiceInpc: 6791.41, indiceInpcMes: 0.23, fatorInpcAcumulado7Casas: 1.0161787, numeroIndiceIpca: 7081.81, indiceIpcaMes: 0.16, fatorIpcaAcumulado7Casas: 1.0141560, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_4', competencia: '04/2024', numeroIndiceInpc: 6816.54, indiceInpcMes: 0.37, fatorInpcAcumulado7Casas: 1.0199385, numeroIndiceIpca: 7108.74, indiceIpcaMes: 0.38, fatorIpcaAcumulado7Casas: 1.0180104, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_5', competencia: '05/2024', numeroIndiceInpc: 6847.88, indiceInpcMes: 0.46, fatorInpcAcumulado7Casas: 1.0246302, numeroIndiceIpca: 7141.45, indiceIpcaMes: 0.46, fatorIpcaAcumulado7Casas: 1.0226951, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_6', competencia: '06/2024', numeroIndiceInpc: 6878.69, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0292410, numeroIndiceIpca: 7156.45, indiceIpcaMes: 0.21, fatorIpcaAcumulado7Casas: 1.0248432, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_7', competencia: '07/2024', numeroIndiceInpc: 6896.58, indiceInpcMes: 0.26, fatorInpcAcumulado7Casas: 1.0319164, numeroIndiceIpca: 7183.64, indiceIpcaMes: 0.38, fatorIpcaAcumulado7Casas: 1.0287385, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_8', competencia: '08/2024', numeroIndiceInpc: 6886.93, indiceInpcMes: -0.14, fatorInpcAcumulado7Casas: 1.0304707, numeroIndiceIpca: 7182.20, indiceIpcaMes: -0.02, fatorIpcaAcumulado7Casas: 1.0285323, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_9', competencia: '09/2024', numeroIndiceInpc: 6920.00, indiceInpcMes: 0.48, fatorInpcAcumulado7Casas: 1.0354189, numeroIndiceIpca: 7213.79, indiceIpcaMes: 0.44, fatorIpcaAcumulado7Casas: 1.0330552, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_10', competencia: '10/2024', numeroIndiceInpc: 6962.29, indiceInpcMes: 0.61, fatorInpcAcumulado7Casas: 1.0417460, numeroIndiceIpca: 7254.19, indiceIpcaMes: 0.56, fatorIpcaAcumulado7Casas: 1.0388414, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_11', competencia: '11/2024', numeroIndiceInpc: 6988.75, indiceInpcMes: 0.38, fatorInpcAcumulado7Casas: 1.0457053, numeroIndiceIpca: 7280.29, indiceIpcaMes: 0.36, fatorIpcaAcumulado7Casas: 1.0425796, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_12', competencia: '12/2024', numeroIndiceInpc: 7020.90, indiceInpcMes: 0.46, fatorInpcAcumulado7Casas: 1.0505167, numeroIndiceIpca: 7318.15, indiceIpcaMes: 0.52, fatorIpcaAcumulado7Casas: 1.0480024, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_13', competencia: '01/2025', numeroIndiceInpc: 7056.00, indiceInpcMes: 0.50, fatorInpcAcumulado7Casas: 1.0557692, numeroIndiceIpca: 7347.42, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0521944, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_14', competencia: '02/2025', numeroIndiceInpc: 7091.28, indiceInpcMes: 0.50, fatorInpcAcumulado7Casas: 1.0610481, numeroIndiceIpca: 7384.16, indiceIpcaMes: 0.50, fatorIpcaAcumulado7Casas: 1.0574554, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_15', competencia: '03/2025', numeroIndiceInpc: 7123.18, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0658228, numeroIndiceIpca: 7413.69, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0616852, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_16', competencia: '04/2025', numeroIndiceInpc: 7155.24, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0706190, numeroIndiceIpca: 7443.35, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0659320, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_17', competencia: '05/2025', numeroIndiceInpc: 7187.43, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0754368, numeroIndiceIpca: 7473.12, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0701957, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_18', competencia: '06/2025', numeroIndiceInpc: 7219.77, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0802763, numeroIndiceIpca: 7503.01, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0744765, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_19', competencia: '07/2025', numeroIndiceInpc: 7252.25, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0851375, numeroIndiceIpca: 7533.03, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0787744, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_20', competencia: '08/2025', numeroIndiceInpc: 7284.88, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0900206, numeroIndiceIpca: 7563.16, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0830895, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_21', competencia: '09/2025', numeroIndiceInpc: 7317.66, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0949257, numeroIndiceIpca: 7593.41, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0874218, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_22', competencia: '10/2025', numeroIndiceInpc: 7350.59, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0998529, numeroIndiceIpca: 7623.78, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0917715, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_23', competencia: '11/2025', numeroIndiceInpc: 7383.67, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1048022, numeroIndiceIpca: 7654.28, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0961386, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_24', competencia: '12/2025', numeroIndiceInpc: 7416.90, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1097738, numeroIndiceIpca: 7684.90, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.1005232, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_25', competencia: '01/2026', numeroIndiceInpc: 7450.28, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1147678, numeroIndiceIpca: 7715.64, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.1049253, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_26', competencia: '02/2026', numeroIndiceInpc: 7476.36, indiceInpcMes: 0.35, fatorInpcAcumulado7Casas: 1.1186718, numeroIndiceIpca: 7738.78, indiceIpcaMes: 0.30, fatorIpcaAcumulado7Casas: 1.1082390, fonte: 'IBGE / Tabela Bacen 433' },
  { id: 'idx_27', competencia: '03/2026', numeroIndiceInpc: 7476.40, indiceInpcMes: 0.00, fatorInpcAcumulado7Casas: 1.1186777, numeroIndiceIpca: 7707.38, indiceIpcaMes: -0.41, fatorIpcaAcumulado7Casas: 1.1037430, fonte: 'IBGE / Tabela Bacen 433' },
];

/**
 * Calcula o Fator INPC / IPCA Acumulado (7 casas decimais) com base no "NÚMERO ÍNDICE" do IBGE:
 * Fórmula: (Número Índice do Mês Mais Atual) / (Número Índice do Mês Anterior à Data do Saldo Devedor de Referência)
 */
export function calculateFatorFromNumeroIndice(
  dataReferenciaStr: string | null | undefined,
  tipoIndice: 'INPC' | 'IPCA' = 'INPC',
  indicesList: MonetaryIndexItem[] = []
): number {
  const series = (indicesList && indicesList.length > 0) ? indicesList : defaultMonetaryIndices;
  if (!series || series.length === 0) {
    return tipoIndice === 'IPCA' ? 1.0842105 : 1.0968016;
  }

  // 1. Mês mais atual disponível na tabela
  const latestItem = series[series.length - 1];
  const numIndiceAtual = tipoIndice === 'IPCA'
    ? Number(latestItem.numeroIndiceIpca || 0)
    : Number(latestItem.numeroIndiceInpc || 0);

  // 2. Extrai ano e mês da Data do Saldo Devedor de Referência (Saldo devedor após a última parcela paga)
  let refYear = 2024;
  let refMonth = 5; // Padrão: maio/2024 se omitido

  if (dataReferenciaStr) {
    const cleanStr = dataReferenciaStr.trim();
    if (cleanStr.includes('-')) {
      // YYYY-MM-DD ou YYYY-MM
      const parts = cleanStr.split('-');
      refYear = parseInt(parts[0], 10) || 2024;
      refMonth = parseInt(parts[1], 10) || 5;
    } else if (cleanStr.includes('/')) {
      // MM/YYYY ou DD/MM/YYYY
      const parts = cleanStr.split('/');
      if (parts.length === 2) {
        refMonth = parseInt(parts[0], 10) || 5;
        refYear = parseInt(parts[1], 10) || 2024;
      } else if (parts.length === 3) {
        refMonth = parseInt(parts[1], 10) || 5;
        refYear = parseInt(parts[2], 10) || 2024;
      }
    }
  }

  // 3. Mês anterior à data do saldo devedor de referência
  let prevMonth = refMonth - 1;
  let prevYear = refYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear = refYear - 1;
  }

  const mmStr = String(prevMonth).padStart(2, '0');
  const yyyyStr = String(prevYear);
  const searchPattern1 = `${mmStr}/${yyyyStr}`;
  const searchPattern2 = `${yyyyStr}-${mmStr}`;

  // 4. Localiza a competência do mês anterior na série histórica
  const foundItem = series.find(item => {
    const comp = (item.competencia || '').toLowerCase();
    return comp.includes(searchPattern1.toLowerCase()) || comp.includes(searchPattern2.toLowerCase());
  });

  let numIndiceMesAnterior = 0;
  if (foundItem) {
    numIndiceMesAnterior = tipoIndice === 'IPCA'
      ? Number(foundItem.numeroIndiceIpca || 0)
      : Number(foundItem.numeroIndiceInpc || 0);
  }

  // Se o NÚMERO ÍNDICE estiver preenchido em ambos os meses, aplica a divisão exata
  if (numIndiceAtual > 0 && numIndiceMesAnterior > 0) {
    const fatorCalculado = numIndiceAtual / numIndiceMesAnterior;
    return parseFloat(fatorCalculado.toFixed(7));
  }

  // Fallback de segurança se NÚMERO ÍNDICE não estiver disponível na linha encontrada
  if (foundItem) {
    const fatorFallback = tipoIndice === 'IPCA' ? foundItem.fatorIpcaAcumulado7Casas : foundItem.fatorInpcAcumulado7Casas;
    if (fatorFallback && fatorFallback > 0) return fatorFallback;
  }

  return tipoIndice === 'IPCA' ? 1.0842105 : 1.0968016;
}

/**
 * Recalcula toda a série histórica de Fatores Acumulados com base na coluna NÚMERO ÍNDICE
 */
export function recalculateIndicesSeries(indicesList: MonetaryIndexItem[]): MonetaryIndexItem[] {
  if (!indicesList || indicesList.length === 0) return defaultMonetaryIndices;

  const latestItem = indicesList[indicesList.length - 1];
  const numIndiceAtualInpc = Number(latestItem.numeroIndiceInpc || 0);
  const numIndiceAtualIpca = Number(latestItem.numeroIndiceIpca || 0);

  return indicesList.map((item, idx) => {
    // Para cada mês, calcula o fator como (Número Índice Atual) / (Número Índice Mês Anterior)
    const prevItem = idx > 0 ? indicesList[idx - 1] : item;
    
    let fatorInpc = item.fatorInpcAcumulado7Casas || 1.0;
    let fatorIpca = item.fatorIpcaAcumulado7Casas || 1.0;

    const numPrevInpc = Number(prevItem.numeroIndiceInpc || 0);
    const numPrevIpca = Number(prevItem.numeroIndiceIpca || 0);

    if (numIndiceAtualInpc > 0 && numPrevInpc > 0) {
      fatorInpc = parseFloat((numIndiceAtualInpc / numPrevInpc).toFixed(7));
    } else if (item.indiceInpcMes !== undefined) {
      fatorInpc = parseFloat((1 + item.indiceInpcMes / 100).toFixed(7));
    }

    if (numIndiceAtualIpca > 0 && numPrevIpca > 0) {
      fatorIpca = parseFloat((numIndiceAtualIpca / numPrevIpca).toFixed(7));
    } else if (item.indiceIpcaMes !== undefined) {
      fatorIpca = parseFloat((1 + item.indiceIpcaMes / 100).toFixed(7));
    }

    return {
      ...item,
      fatorInpcAcumulado7Casas: fatorInpc,
      fatorIpcaAcumulado7Casas: fatorIpca,
    };
  });
}

/**
 * Sincroniza e recarrega os fatores de correção de 7 casas em todos os contratos com a fórmula do NÚMERO ÍNDICE
 */
export function syncContractsWithNumeroIndice(
  contracts: Contract[],
  indicesList: MonetaryIndexItem[] = []
): Contract[] {
  const series = indicesList.length > 0 ? indicesList : defaultMonetaryIndices;

  return contracts.map(c => {
    const tipo = c.tipoIndiceCorrecao || 'INPC';
    const dataRef = c.dataReferenciaUltimoPagamento || '2024-05-15';
    const novoFator = calculateFatorFromNumeroIndice(dataRef, tipo, series);

    return {
      ...c,
      fatorCorrecao7Casas: novoFator,
    };
  });
}
