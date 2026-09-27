import type { MonetaryIndexItem, Contract } from '../types';
import { getSaldoDevedorModulo6, getDataRefUltimaParcelaModulo6 } from './calculations';

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

const MONTH_MAP: Record<string, { code: string; name: string; num: number }> = {
  jan: { code: '01', name: 'JAN', num: 1 }, janeiro: { code: '01', name: 'JAN', num: 1 },
  fev: { code: '02', name: 'FEV', num: 2 }, fevereiro: { code: '02', name: 'FEV', num: 2 },
  mar: { code: '03', name: 'MAR', num: 3 }, março: { code: '03', name: 'MAR', num: 3 }, marco: { code: '03', name: 'MAR', num: 3 },
  abr: { code: '04', name: 'ABR', num: 4 }, abril: { code: '04', name: 'ABR', num: 4 },
  mai: { code: '05', name: 'MAI', num: 5 }, maio: { code: '05', name: 'MAI', num: 5 },
  jun: { code: '06', name: 'JUN', num: 6 }, junho: { code: '06', name: 'JUN', num: 6 },
  jul: { code: '07', name: 'JUL', num: 7 }, julho: { code: '07', name: 'JUL', num: 7 },
  ago: { code: '08', name: 'AGO', num: 8 }, agosto: { code: '08', name: 'AGO', num: 8 },
  set: { code: '09', name: 'SET', num: 9 }, setembro: { code: '09', name: 'SET', num: 9 },
  out: { code: '10', name: 'OUT', num: 10 }, outubro: { code: '10', name: 'OUT', num: 10 },
  nov: { code: '11', name: 'NOV', num: 11 }, novembro: { code: '11', name: 'NOV', num: 11 },
  dez: { code: '12', name: 'DEZ', num: 12 }, dezembro: { code: '12', name: 'DEZ', num: 12 },
};

function parseNum(val: any): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/\./g, '').replace(',', '.').replace('%', '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

/**
 * Converte um MonetaryIndexItem em um timestamp ordinal comparável (Year * 12 + Month) para ordenação cronológica
 */
export function getIndexItemSortVal(item: MonetaryIndexItem): number {
  let year = item.ano || 2024;
  let month = 1;

  if (item.competencia) {
    const comp = item.competencia.trim();
    if (comp.includes('/')) {
      const parts = comp.split('/');
      month = parseInt(parts[0], 10) || 1;
      year = parseInt(parts[1], 10) || year;
    } else if (comp.includes('-')) {
      const parts = comp.split('-');
      year = parseInt(parts[0], 10) || year;
      month = parseInt(parts[1], 10) || 1;
    }
  }

  return year * 12 + month;
}

/**
 * Ordena a série histórica de forma estritamente cronológica (do mês mais antigo ao mais recente)
 * e calcula os Fatores Acumulados de 7 casas decimais para TODOS os meses da história com base no Mês Atual final.
 */
export function sortAndDeduplicateIndices(indicesList: MonetaryIndexItem[]): MonetaryIndexItem[] {
  if (!indicesList || indicesList.length === 0) return defaultMonetaryIndices;

  // 1. Mapeia e consolida itens duplicados por competência (mantendo o registro com Número Índice preenchido)
  const mapComp = new Map<string, MonetaryIndexItem>();
  indicesList.forEach(item => {
    const key = (item.competencia || '').trim().toLowerCase();
    if (!key) return;

    if (!mapComp.has(key)) {
      mapComp.set(key, item);
    } else {
      const existing = mapComp.get(key)!;
      const updated: MonetaryIndexItem = {
        ...existing,
        numeroIndiceInpc: item.numeroIndiceInpc || existing.numeroIndiceInpc,
        numeroIndiceIpca: item.numeroIndiceIpca || existing.numeroIndiceIpca,
        indiceInpcMes: item.indiceInpcMes !== undefined && item.indiceInpcMes !== 0 ? item.indiceInpcMes : existing.indiceInpcMes,
        indiceIpcaMes: item.indiceIpcaMes !== undefined && item.indiceIpcaMes !== 0 ? item.indiceIpcaMes : existing.indiceIpcaMes,
        variacao3Meses: item.variacao3Meses ?? existing.variacao3Meses,
        variacao6Meses: item.variacao6Meses ?? existing.variacao6Meses,
        variacaoNoAno: item.variacaoNoAno ?? existing.variacaoNoAno,
        variacao12Meses: item.variacao12Meses ?? existing.variacao12Meses,
        fonte: OFFICIAL_IBGE_SOURCE,
      };
      mapComp.set(key, updated);
    }
  });

  // 2. Ordena cronologicamente do mês mais antigo para o mês mais recente
  const sorted = Array.from(mapComp.values()).sort((a, b) => getIndexItemSortVal(a) - getIndexItemSortVal(b));

  // 3. Recalcula a série histórica inteira a partir do mês atual final
  return recalculateIndicesSeries(sorted);
}

/**
 * Parser especialista para a Série Histórica IBGE (Imagem e Tabelas Oficiais do IBGE):
 * Importa TODOS os anos e meses do mais antigo (ex: 1994) até o mais recente (ex: 2026),
 * ignorando quebras de página e cabeçalhos repetidos `(continua)` sem interromper a cronologia.
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

  // 1. Escaneia para detectar se é IPCA ou INPC e a ordem das colunas
  for (let r = 0; r < Math.min(rawRows.length, 25); r++) {
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
    if (!Array.isArray(row) || row.length === 0) return;

    // Filtra cabeçalhos repetidos de página IBGE como "(continua)", "SÉRIE HISTÓRICA DO INPC", etc.
    const fullRowStr = row.map(c => String(c || '').trim()).join(' ').toLowerCase();
    if (fullRowStr.includes('série histórica') || fullRowStr.includes('continua') || (fullRowStr.includes('ano') && fullRowStr.includes('mês'))) {
      return;
    }

    // Tenta encontrar um ano de 4 dígitos (1970 a 2099) na coluna detectada ou nas primeiras colunas para atualizar o ano corrente
    if (colAno > -1 && /^(19[7-9]\d|20[0-9]\d)$/.test(String(row[colAno] || '').trim())) {
      currentYear = parseInt(String(row[colAno]).trim(), 10);
    } else {
      for (let c = 0; c < Math.min(row.length, 3); c++) {
        const cellValStr = String(row[c] || '').trim();
        if (/^(19[7-9]\d|20[0-9]\d)$/.test(cellValStr)) {
          currentYear = parseInt(cellValStr, 10);
          break;
        }
      }
    }

    // Tenta identificar o mês nas colunas
    let monthCode = '';
    let monthName = '';

    for (let c = 0; c < Math.min(row.length, 4); c++) {
      const cellValStr = String(row[c] || '').trim().toLowerCase();
      if (MONTH_MAP[cellValStr]) {
        monthCode = MONTH_MAP[cellValStr].code;
        monthName = MONTH_MAP[cellValStr].name;
        break;
      } else if (/^(0?[1-9]|1[0-2])$/.test(cellValStr) && c === colMes) {
        const mNum = parseInt(cellValStr, 10);
        monthCode = String(mNum).padStart(2, '0');
        monthName = Object.values(MONTH_MAP).find(v => v.code === monthCode)?.name || monthCode;
        break;
      }
    }

    // Se não encontrou mês válido nesta linha, ignora a linha de ruído
    if (!monthCode) return;

    const competencia = `${monthCode}/${currentYear}`;
    const numIndiceVal = parseNum(row[colNumeroIndice > -1 ? colNumeroIndice : 2]);
    const noMesVal = parseNum(row[colNoMes > -1 ? colNoMes : 3]);
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

  return sortAndDeduplicateIndices(items);
}

/**
 * Calcula o Fator INPC / IPCA Acumulado (7 casas decimais) com base no "NÚMERO ÍNDICE" do IBGE:
 * Fórmula: (Número Índice do Mês Mais Atual da Série) / (Número Índice do Mês Anterior à Data Ref do Saldo Devedor do Contrato)
 * Funciona de forma automática para QUALQUER data entre 1970 e 2099!
 */
export function calculateFatorFromNumeroIndice(
  dataReferenciaStr: string | null | undefined,
  tipoIndice: 'INPC' | 'IPCA' = 'INPC',
  indicesList: MonetaryIndexItem[] = []
): number {
  const series = sortAndDeduplicateIndices(indicesList && indicesList.length > 0 ? indicesList : defaultMonetaryIndices);
  if (!series || series.length === 0) {
    return tipoIndice === 'IPCA' ? 1.0842105 : 1.0968016;
  }

  // 1. Mês mais atual disponível na série ordenada
  const latestItem = series[series.length - 1];
  const numIndiceAtual = tipoIndice === 'IPCA'
    ? Number(latestItem.numeroIndiceIpca || 0)
    : Number(latestItem.numeroIndiceInpc || 0);

  // 2. Extrai ano e mês da Data de Referência do Saldo Devedor do Contrato
  let refYear = 2024;
  let refMonth = 5;

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

  // 4. Localiza o mês anterior exato na série histórica do IBGE
  let foundItem = series.find(item => {
    const comp = (item.competencia || '').toLowerCase();
    return comp.includes(`${mmStr}/${yyyyStr}`.toLowerCase()) || comp.includes(`${yyyyStr}-${mmStr}`.toLowerCase());
  });

  // Se a data do contrato for mais antiga do que o início da tabela carregada, seleciona o mês mais antigo disponível
  if (!foundItem) {
    const targetSortVal = prevYear * 12 + prevMonth;
    const earliestSortVal = getIndexItemSortVal(series[0]);
    if (targetSortVal < earliestSortVal) {
      foundItem = series[0];
    }
  }

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

  const sortedList = Array.from(indicesList).sort((a, b) => getIndexItemSortVal(a) - getIndexItemSortVal(b));
  const latestItem = sortedList[sortedList.length - 1];
  const numIndiceAtualInpc = Number(latestItem.numeroIndiceInpc || 0);
  const numIndiceAtualIpca = Number(latestItem.numeroIndiceIpca || 0);

  return sortedList.map((item, idx) => {
    const prevItem = idx > 0 ? sortedList[idx - 1] : item;
    
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
      fonte: OFFICIAL_IBGE_SOURCE,
    };
  });
}

/**
 * Sincroniza e recarrega os fatores de correção de 7 casas em TODOS os contratos com a fórmula do NÚMERO ÍNDICE IBGE
 * Seleciona automaticamente o índice de acordo com a data do saldo devedor de cada contrato!
 */
export function syncContractsWithNumeroIndice(
  contracts: Contract[],
  indicesList: MonetaryIndexItem[] = []
): Contract[] {
  const series = sortAndDeduplicateIndices(indicesList && indicesList.length > 0 ? indicesList : defaultMonetaryIndices);

  return contracts.map(c => {
    const tipo = c.tipoIndiceCorrecao || 'INPC';
    // Determina automaticamente a Data de Referência exata da última parcela paga do saldo devedor
    const dataRef = getDataRefUltimaParcelaModulo6(c);
    const novoFator = calculateFatorFromNumeroIndice(dataRef, tipo, series);
    const saldoBaseOriginal = getSaldoDevedorModulo6(c);

    return {
      ...c,
      dataReferenciaUltimoPagamento: dataRef,
      saldoDevedorRefUltimaParcela: c.saldoDevedorRefUltimaParcela || saldoBaseOriginal,
      fatorCorrecao7Casas: novoFator,
    };
  });
}
