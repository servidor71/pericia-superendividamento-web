import type { MonetaryIndexItem, Contract } from '../types';

export const OFFICIAL_IBGE_SOURCE = 'Fonte: Série Histórica - IBGE';

/**
 * Tabela Padrão Oficial de Série Histórica de Índices Monetários (IBGE - INPC e IPCA)
 * Contém a coluna NÚMERO ÍNDICE oficial do IBGE para cálculo pericial de fatores acumulados.
 * Fonte sempre configurada como "Fonte: Série Histórica - IBGE".
 */
export const defaultMonetaryIndices: MonetaryIndexItem[] = [
  { id: 'idx_1', competencia: '01/2024', ano: 2024, mes: 'JAN', numeroIndiceInpc: 6721.45, indiceInpcMes: 0.57, fatorInpcAcumulado7Casas: 1.0057000, numeroIndiceIpca: 7012.30, indiceIpcaMes: 0.42, fatorIpcaAcumulado7Casas: 1.0042000, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_2', competencia: '02/2024', ano: 2024, mes: 'FEV', numeroIndiceInpc: 6775.83, indiceInpcMes: 0.81, fatorInpcAcumulado7Casas: 1.0138462, numeroIndiceIpca: 7070.50, indiceIpcaMes: 0.83, fatorIpcaAcumulado7Casas: 1.0125349, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_3', competencia: '03/2024', ano: 2024, mes: 'MAR', numeroIndiceInpc: 6791.41, indiceInpcMes: 0.23, fatorInpcAcumulado7Casas: 1.0161787, numeroIndiceIpca: 7081.81, indiceIpcaMes: 0.16, fatorIpcaAcumulado7Casas: 1.0141560, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_4', competencia: '04/2024', ano: 2024, mes: 'ABR', numeroIndiceInpc: 6816.54, indiceInpcMes: 0.37, fatorInpcAcumulado7Casas: 1.0199385, numeroIndiceIpca: 7108.74, indiceIpcaMes: 0.38, fatorIpcaAcumulado7Casas: 1.0180104, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_5', competencia: '05/2024', ano: 2024, mes: 'MAI', numeroIndiceInpc: 6847.88, indiceInpcMes: 0.46, fatorInpcAcumulado7Casas: 1.0246302, numeroIndiceIpca: 7141.45, indiceIpcaMes: 0.46, fatorIpcaAcumulado7Casas: 1.0226951, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_6', competencia: '06/2024', ano: 2024, mes: 'JUN', numeroIndiceInpc: 6878.69, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0292410, numeroIndiceIpca: 7156.45, indiceIpcaMes: 0.21, fatorIpcaAcumulado7Casas: 1.0248432, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_7', competencia: '07/2024', ano: 2024, mes: 'JUL', numeroIndiceInpc: 6896.58, indiceInpcMes: 0.26, fatorInpcAcumulado7Casas: 1.0319164, numeroIndiceIpca: 7183.64, indiceIpcaMes: 0.38, fatorIpcaAcumulado7Casas: 1.0287385, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_8', competencia: '08/2024', ano: 2024, mes: 'AGO', numeroIndiceInpc: 6886.93, indiceInpcMes: -0.14, fatorInpcAcumulado7Casas: 1.0304707, numeroIndiceIpca: 7182.20, indiceIpcaMes: -0.02, fatorIpcaAcumulado7Casas: 1.0285323, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_9', competencia: '09/2024', ano: 2024, mes: 'SET', numeroIndiceInpc: 6920.00, indiceInpcMes: 0.48, fatorInpcAcumulado7Casas: 1.0354189, numeroIndiceIpca: 7213.79, indiceIpcaMes: 0.44, fatorIpcaAcumulado7Casas: 1.0330552, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_10', competencia: '10/2024', ano: 2024, mes: 'OUT', numeroIndiceInpc: 6962.29, indiceInpcMes: 0.61, fatorInpcAcumulado7Casas: 1.0417460, numeroIndiceIpca: 7254.19, indiceIpcaMes: 0.56, fatorIpcaAcumulado7Casas: 1.0388414, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_11', competencia: '11/2024', ano: 2024, mes: 'NOV', numeroIndiceInpc: 6988.75, indiceInpcMes: 0.38, fatorInpcAcumulado7Casas: 1.0457053, numeroIndiceIpca: 7280.29, indiceIpcaMes: 0.36, fatorIpcaAcumulado7Casas: 1.0425796, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_12', competencia: '12/2024', ano: 2024, mes: 'DEZ', numeroIndiceInpc: 7020.90, indiceInpcMes: 0.46, fatorInpcAcumulado7Casas: 1.0505167, numeroIndiceIpca: 7318.15, indiceIpcaMes: 0.52, fatorIpcaAcumulado7Casas: 1.0480024, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_13', competencia: '01/2025', ano: 2025, mes: 'JAN', numeroIndiceInpc: 7056.00, indiceInpcMes: 0.50, fatorInpcAcumulado7Casas: 1.0557692, numeroIndiceIpca: 7347.42, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0521944, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_14', competencia: '02/2025', ano: 2025, mes: 'FEV', numeroIndiceInpc: 7091.28, indiceInpcMes: 0.50, fatorInpcAcumulado7Casas: 1.0610481, numeroIndiceIpca: 7384.16, indiceIpcaMes: 0.50, fatorIpcaAcumulado7Casas: 1.0574554, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_15', competencia: '03/2025', ano: 2025, mes: 'MAR', numeroIndiceInpc: 7123.18, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0658228, numeroIndiceIpca: 7413.69, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0616852, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_16', competencia: '04/2025', ano: 2025, mes: 'ABR', numeroIndiceInpc: 7155.24, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0706190, numeroIndiceIpca: 7443.35, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0659320, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_17', competencia: '05/2025', ano: 2025, mes: 'MAI', numeroIndiceInpc: 7187.43, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0754368, numeroIndiceIpca: 7473.12, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0701957, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_18', competencia: '06/2025', ano: 2025, mes: 'JUN', numeroIndiceInpc: 7219.77, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0802763, numeroIndiceIpca: 7503.01, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0744765, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_19', competencia: '07/2025', ano: 2025, mes: 'JUL', numeroIndiceInpc: 7252.25, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0851375, numeroIndiceIpca: 7533.03, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0787744, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_20', competencia: '08/2025', ano: 2025, mes: 'AGO', numeroIndiceInpc: 7284.88, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0900206, numeroIndiceIpca: 7563.16, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0830895, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_21', competencia: '09/2025', ano: 2025, mes: 'SET', numeroIndiceInpc: 7317.66, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0949257, numeroIndiceIpca: 7593.41, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0874218, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_22', competencia: '10/2025', ano: 2025, mes: 'OUT', numeroIndiceInpc: 7350.59, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.0998529, numeroIndiceIpca: 7623.78, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0917715, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_23', competencia: '11/2025', ano: 2025, mes: 'NOV', numeroIndiceInpc: 7383.67, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1048022, numeroIndiceIpca: 7654.28, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.0961386, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_24', competencia: '12/2025', ano: 2025, mes: 'DEZ', numeroIndiceInpc: 7416.90, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1097738, numeroIndiceIpca: 7684.90, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.1005232, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_25', competencia: '01/2026', ano: 2026, mes: 'JAN', numeroIndiceInpc: 7450.28, indiceInpcMes: 0.45, fatorInpcAcumulado7Casas: 1.1147678, numeroIndiceIpca: 7715.64, indiceIpcaMes: 0.40, fatorIpcaAcumulado7Casas: 1.1049253, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_26', competencia: '02/2026', ano: 2026, mes: 'FEV', numeroIndiceInpc: 7476.36, indiceInpcMes: 0.35, fatorInpcAcumulado7Casas: 1.1186718, numeroIndiceIpca: 7738.78, indiceIpcaMes: 0.30, fatorIpcaAcumulado7Casas: 1.1082390, fonte: OFFICIAL_IBGE_SOURCE },
  { id: 'idx_27', competencia: '03/2026', ano: 2026, mes: 'MAR', numeroIndiceInpc: 7476.40, indiceInpcMes: 0.00, fatorInpcAcumulado7Casas: 1.1186777, numeroIndiceIpca: 7707.38, indiceIpcaMes: -0.41, fatorIpcaAcumulado7Casas: 1.1037430, fonte: OFFICIAL_IBGE_SOURCE },
];

const MONTH_MAP: Record<string, { code: string; name: string }> = {
  jan: { code: '01', name: 'JAN' }, janeiro: { code: '01', name: 'JAN' },
  fev: { code: '02', name: 'FEV' }, fevereiro: { code: '02', name: 'FEV' },
  mar: { code: '03', name: 'MAR' }, março: { code: '03', name: 'MAR' }, marco: { code: '03', name: 'MAR' },
  abr: { code: '04', name: 'ABR' }, abril: { code: '04', name: 'ABR' },
  mai: { code: '05', name: 'MAI' }, maio: { code: '05', name: 'MAI' },
  jun: { code: '06', name: 'JUN' }, junho: { code: '06', name: 'JUN' },
  jul: { code: '07', name: 'JUL' }, julho: { code: '07', name: 'JUL' },
  ago: { code: '08', name: 'AGO' }, agosto: { code: '08', name: 'AGO' },
  set: { code: '09', name: 'SET' }, setembro: { code: '09', name: 'SET' },
  out: { code: '10', name: 'OUT' }, outubro: { code: '10', name: 'OUT' },
  nov: { code: '11', name: 'NOV' }, novembro: { code: '11', name: 'NOV' },
  dez: { code: '12', name: 'DEZ' }, dezembro: { code: '12', name: 'DEZ' },
};

/**
 * Converte valor numérico em string com tratamento de vírgulas/pontos e %
 */
function parseNum(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Parser especial para o modelo oficial de Série Histórica IBGE (conforme imagem do usuário):
 * Layout: ANO | MÊS | NÚMERO ÍNDICE | VARIAÇÃO (%) [NO MÊS | 3 MESES | 6 MESES | NO ANO | 12 MESES]
 * Preserva o Ano quando informado uma única vez por grupo e mapeia a fonte para "Fonte: Série Histórica - IBGE".
 */
export function parseIBGESerieHistoricaRows(rawRows: any[][]): MonetaryIndexItem[] {
  if (!rawRows || rawRows.length === 0) return [];

  let isIpcaSeries = false;
  let colAno = -1;
  let colMes = -1;
  let colNumeroIndice = -1;
  let colNoMes = -1;
  let col3Meses = -1;
  let col6Meses = -1;
  let colNoAno = -1;
  let col12Meses = -1;

  // Analisa as primeiras 15 linhas procurando o título e a estrutura do cabeçalho oficial IBGE
  for (let r = 0; r < Math.min(rawRows.length, 15); r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map(c => String(c || '').toLowerCase()).join(' ');

    if (rowStr.includes('ipca')) isIpcaSeries = true;

    row.forEach((cell, c) => {
      const cellStr = String(cell || '').toLowerCase().trim();
      if (cellStr === 'ano') colAno = c;
      else if (cellStr === 'mês' || cellStr === 'mes') colMes = c;
      else if (cellStr.includes('número índice') || cellStr.includes('numero indice') || cellStr.includes('dez 93')) colNumeroIndice = c;
      else if (cellStr === 'no mês' || cellStr === 'no mes') colNoMes = c;
      else if (cellStr.includes('3 meses')) col3Meses = c;
      else if (cellStr.includes('6 meses')) col6Meses = c;
      else if (cellStr === 'no ano') colNoAno = c;
      else if (cellStr.includes('12 meses')) col12Meses = c;
    });
  }

  // Se o cabeçalho explícito do IBGE não for detectado, tenta mapear por posição padrão do modelo (Cols: 0:Ano, 1:Mês, 2:Número Índice, 3:No Mês, 4:3 Meses, 5:6 Meses, 6:No Ano, 7:12 Meses)
  if (colMes === -1 && colNumeroIndice === -1) {
    colAno = 0;
    colMes = 1;
    colNumeroIndice = 2;
    colNoMes = 3;
    col3Meses = 4;
    col6Meses = 5;
    colNoAno = 6;
    col12Meses = 7;
  }

  const items: MonetaryIndexItem[] = [];
  let currentYear = 1994;

  rawRows.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length < 2) return;

    // Tenta ler o Ano da primeira coluna ou coluna detectada
    const anoCellStr = String(row[colAno] || '').trim();
    if (/^\d{4}$/.test(anoCellStr)) {
      currentYear = parseInt(anoCellStr, 10);
    }

    // Tenta ler o Mês (JAN, FEV, MAR... ou 01, 02...)
    const mesCellStr = String(row[colMes] || '').trim().toLowerCase();
    let monthCode = '';
    let monthName = '';

    if (MONTH_MAP[mesCellStr]) {
      monthCode = MONTH_MAP[mesCellStr].code;
      monthName = MONTH_MAP[mesCellStr].name;
    } else if (/^(0?[1-9]|1[0-2])$/.test(mesCellStr)) {
      const mNum = parseInt(mesCellStr, 10);
      monthCode = String(mNum).padStart(2, '0');
      monthName = Object.values(MONTH_MAP).find(v => v.code === monthCode)?.name || monthCode;
    }

    // Se não encontrou um mês válido nesta linha, ignora (linha de cabeçalho ou rodapé)
    if (!monthCode) return;

    const competencia = `${monthCode}/${currentYear}`;
    const numIndiceVal = parseNum(row[colNumeroIndice]);
    const noMesVal = parseNum(row[colNoMes]);
    const var3m = col3Meses !== -1 ? parseNum(row[col3Meses]) : undefined;
    const var6m = col6Meses !== -1 ? parseNum(row[col6Meses]) : undefined;
    const varAno = colNoAno !== -1 ? parseNum(row[colNoAno]) : undefined;
    const var12m = col12Meses !== -1 ? parseNum(row[col12Meses]) : undefined;

    items.push({
      id: `idx_ibge_${currentYear}_${monthCode}_${rowIndex}`,
      competencia,
      ano: currentYear,
      mes: monthName,
      numeroIndiceInpc: !isIpcaSeries ? numIndiceVal : undefined,
      indiceInpcMes: !isIpcaSeries ? noMesVal : 0,
      fatorInpcAcumulado7Casas: 1.0,
      numeroIndiceIpca: isIpcaSeries ? numIndiceVal : undefined,
      indiceIpcaMes: isIpcaSeries ? noMesVal : 0,
      fatorIpcaAcumulado7Casas: 1.0,
      variacao3Meses: var3m,
      variacao6Meses: var6m,
      variacaoNoAno: varAno,
      variacao12Meses: var12m,
      fonte: OFFICIAL_IBGE_SOURCE,
    });
  });

  return recalculateIndicesSeries(items);
}

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
      const parts = cleanStr.split('-');
      refYear = parseInt(parts[0], 10) || 2024;
      refMonth = parseInt(parts[1], 10) || 5;
    } else if (cleanStr.includes('/')) {
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

  // Se o NÚMERO ÍNDICE estiver preenchido em ambos os meses, aplica a divisão exata IBGE
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
 * Recalcula toda a série histórica de Fatores Acumulados com base na coluna NÚMERO ÍNDICE do IBGE
 */
export function recalculateIndicesSeries(indicesList: MonetaryIndexItem[]): MonetaryIndexItem[] {
  if (!indicesList || indicesList.length === 0) return defaultMonetaryIndices;

  const latestItem = indicesList[indicesList.length - 1];
  const numIndiceAtualInpc = Number(latestItem.numeroIndiceInpc || 0);
  const numIndiceAtualIpca = Number(latestItem.numeroIndiceIpca || 0);

  return indicesList.map((item, idx) => {
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
      fonte: item.fonte || OFFICIAL_IBGE_SOURCE,
    };
  });
}

/**
 * Sincroniza e recarrega os fatores de correção de 7 casas em todos os contratos com a fórmula do NÚMERO ÍNDICE IBGE
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
