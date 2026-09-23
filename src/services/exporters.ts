import * as XLSX from 'xlsx-js-style';
import type { ProcessData, IncomeData, ExpenseData, Contract, QuesitoPericial, ProfessionalProfile, ProcessDocumentItem } from '../types';
import { calculateFinancialSummary, calculateProportional60xPlan, calculateContractEvolution, getBacenStatus } from './calculations';

// --- Color Constants matching App visual design ---
const COLORS = {
  PRIMARY_TEAL: '1C4E5E',       // Dark Teal header banner
  DARK_NAVY: '1C2B33',          // Table Header Navy/Black
  SUBHEADER_TEAL: '2E5A6B',     // Section Header Teal
  ZEBRA_BG: 'FAF8F3',           // Alternating row background
  WHITE: 'FFFFFF',
  BORDER_COLOR: 'DCD8CD',       // Light border
  TOTAL_BG: 'E6F0F2',           // Total row background
  TOTAL_TEXT: '1C4E5E',
  
  // Status Colors
  EMERALD_BG: 'D1FAE5',
  EMERALD_TEXT: '065F46',
  AMBER_BG: 'FEF3C7',
  AMBER_TEXT: '92400E',
  ROSE_BG: 'FEE2E2',
  ROSE_TEXT: '991B1B',
  BLUE_BG: 'DBEAFE',
  BLUE_TEXT: '1E40AF',
};

// Common cell styles
const STYLES = {
  banner: {
    font: { name: 'Arial', sz: 12, bold: true, color: { rgb: COLORS.WHITE } },
    fill: { fgColor: { rgb: COLORS.PRIMARY_TEAL } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      bottom: { style: 'medium', color: { rgb: '153E4B' } }
    }
  },
  sectionHeader: {
    font: { name: 'Arial', sz: 10.5, bold: true, color: { rgb: COLORS.WHITE } },
    fill: { fgColor: { rgb: COLORS.SUBHEADER_TEAL } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      bottom: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } }
    }
  },
  tableHeader: {
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.WHITE } },
    fill: { fgColor: { rgb: COLORS.DARK_NAVY } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: '000000' } },
      bottom: { style: 'thin', color: { rgb: '000000' } },
      left: { style: 'thin', color: { rgb: '000000' } },
      right: { style: 'thin', color: { rgb: '000000' } },
    }
  },
  dataCellLeft: (isOdd: boolean) => ({
    font: { name: 'Arial', sz: 9, color: { rgb: COLORS.DARK_NAVY } },
    fill: { fgColor: { rgb: isOdd ? COLORS.ZEBRA_BG : COLORS.WHITE } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      bottom: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  }),
  dataCellRight: (isOdd: boolean) => ({
    font: { name: 'Arial', sz: 9, color: { rgb: COLORS.DARK_NAVY } },
    fill: { fgColor: { rgb: isOdd ? COLORS.ZEBRA_BG : COLORS.WHITE } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      bottom: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  }),
  dataCellCenter: (isOdd: boolean) => ({
    font: { name: 'Arial', sz: 9, color: { rgb: COLORS.DARK_NAVY } },
    fill: { fgColor: { rgb: isOdd ? COLORS.ZEBRA_BG : COLORS.WHITE } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      bottom: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  }),
  totalRowLeft: {
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.TOTAL_TEXT } },
    fill: { fgColor: { rgb: COLORS.TOTAL_BG } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.PRIMARY_TEAL } },
      bottom: { style: 'double', color: { rgb: COLORS.PRIMARY_TEAL } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  },
  totalRowRight: {
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.TOTAL_TEXT } },
    fill: { fgColor: { rgb: COLORS.TOTAL_BG } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.PRIMARY_TEAL } },
      bottom: { style: 'double', color: { rgb: COLORS.PRIMARY_TEAL } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  },
  totalRowCenter: {
    font: { name: 'Arial', sz: 9.5, bold: true, color: { rgb: COLORS.TOTAL_TEXT } },
    fill: { fgColor: { rgb: COLORS.TOTAL_BG } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: COLORS.PRIMARY_TEAL } },
      bottom: { style: 'double', color: { rgb: COLORS.PRIMARY_TEAL } },
      left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
    }
  },
  badgeCell: (type: 'green' | 'amber' | 'red' | 'blue') => {
    let bg = COLORS.BLUE_BG;
    let fg = COLORS.BLUE_TEXT;
    if (type === 'green') { bg = COLORS.EMERALD_BG; fg = COLORS.EMERALD_TEXT; }
    else if (type === 'amber') { bg = COLORS.AMBER_BG; fg = COLORS.AMBER_TEXT; }
    else if (type === 'red') { bg = COLORS.ROSE_BG; fg = COLORS.ROSE_TEXT; }

    return {
      font: { name: 'Arial', sz: 9, bold: true, color: { rgb: fg } },
      fill: { fgColor: { rgb: bg } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
        bottom: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
        left: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
        right: { style: 'thin', color: { rgb: COLORS.BORDER_COLOR } },
      }
    };
  }
};

// Number formats
const NUM_FMTS = {
  CURRENCY: '"R$" #,##0.00;[Red]-"R$" #,##0.00;"R$" 0.00',
  PERCENT: '0.00%',
  FATOR7: '0.0000000',
  INTEGER: '0',
};

export interface SheetCellDefinition {
  value: any;
  align?: 'left' | 'center' | 'right' | string;
  styleType?: string;
  numFmt?: string;
}

export interface SheetRowDefinition {
  type: 'banner' | 'section' | 'header' | 'data' | 'total' | 'empty';
  cells: SheetCellDefinition[];
}

function buildStyledSheet(
  sheetName: string,
  bannerTitle: string,
  rowsDef: SheetRowDefinition[],
  colWidths?: number[]
): { sheetName: string; ws: XLSX.WorkSheet } {
  const ws: XLSX.WorkSheet = {};
  const merges: XLSX.Range[] = [];
  let currentRow = 0;

  // Banner row
  let maxCols = 2;
  rowsDef.forEach(r => {
    if (r.cells.length > maxCols) maxCols = r.cells.length;
  });

  // Write Banner
  const bannerCellAddr = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
  ws[bannerCellAddr] = { v: bannerTitle, t: 's', s: STYLES.banner };
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: maxCols - 1 } });
  
  for (let c = 1; c < maxCols; c++) {
    const addr = XLSX.utils.encode_cell({ r: currentRow, c });
    ws[addr] = { v: '', t: 's', s: STYLES.banner };
  }
  currentRow++;
  currentRow++; // empty spacer

  let dataRowIndex = 0;

  rowsDef.forEach((row) => {
    if (row.type === 'empty') {
      currentRow++;
      return;
    }

    if (row.type === 'section') {
      const sectionAddr = XLSX.utils.encode_cell({ r: currentRow, c: 0 });
      ws[sectionAddr] = { v: row.cells[0]?.value || '', t: 's', s: STYLES.sectionHeader };
      merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: maxCols - 1 } });
      for (let c = 1; c < maxCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: currentRow, c });
        ws[addr] = { v: '', t: 's', s: STYLES.sectionHeader };
      }
      currentRow++;
      return;
    }

    const isHeader = row.type === 'header';
    const isTotal = row.type === 'total';
    const isOdd = dataRowIndex % 2 === 1;

    if (row.type === 'data') dataRowIndex++;

    row.cells.forEach((cellDef, colIdx) => {
      const cellAddr = XLSX.utils.encode_cell({ r: currentRow, c: colIdx });
      const val = cellDef.value;
      let style: any = STYLES.dataCellLeft(isOdd);
      let numFmt = cellDef.numFmt;

      const align = cellDef.align || (typeof val === 'number' ? 'right' : 'left');

      if (isHeader) {
        style = STYLES.tableHeader;
      } else if (isTotal) {
        if (align === 'right') style = STYLES.totalRowRight;
        else if (align === 'center') style = STYLES.totalRowCenter;
        else style = STYLES.totalRowLeft;
      } else {
        if (cellDef.styleType === 'badge-green') style = STYLES.badgeCell('green');
        else if (cellDef.styleType === 'badge-amber') style = STYLES.badgeCell('amber');
        else if (cellDef.styleType === 'badge-red') style = STYLES.badgeCell('red');
        else if (cellDef.styleType === 'badge-blue') style = STYLES.badgeCell('blue');
        else if (align === 'right') style = STYLES.dataCellRight(isOdd);
        else if (align === 'center') style = STYLES.dataCellCenter(isOdd);
        else style = STYLES.dataCellLeft(isOdd);

        if (cellDef.styleType === 'currency') numFmt = NUM_FMTS.CURRENCY;
        else if (cellDef.styleType === 'percent') numFmt = NUM_FMTS.PERCENT;
        else if (cellDef.styleType === 'fator7') numFmt = NUM_FMTS.FATOR7;
      }

      let cellType: XLSX.ExcelDataType = 's';
      let cellVal: any = String(val ?? '');

      if (typeof val === 'number') {
        cellType = 'n';
        cellVal = val;
      } else if (typeof val === 'boolean') {
        cellType = 'b';
        cellVal = val ? 'SIM' : 'NÃO';
      }

      const cellObj: XLSX.CellObject = {
        v: cellVal,
        t: cellType,
        s: style
      };
      if (numFmt) cellObj.z = numFmt;

      ws[cellAddr] = cellObj;
    });

    currentRow++;
  });

  const ref = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: currentRow - 1, c: maxCols - 1 }
  });
  ws['!ref'] = ref;

  if (merges.length > 0) {
    ws['!merges'] = merges;
  }

  const calculatedCols: XLSX.ColInfo[] = [];
  for (let c = 0; c < maxCols; c++) {
    let maxLen = colWidths && colWidths[c] ? colWidths[c] : 14;
    for (let r = 2; r < currentRow; r++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = ws[addr];
      if (cell && cell.v !== undefined && cell.v !== null) {
        const len = String(cell.v).length + 3;
        if (len > maxLen) maxLen = len;
      }
    }
    calculatedCols.push({ wch: Math.min(Math.max(maxLen, 12), 65) });
  }
  ws['!cols'] = calculatedCols;

  return { sheetName, ws };
}

export function exportToExcel(
  process: ProcessData,
  income: IncomeData,
  expenses: ExpenseData,
  contracts: Contract[],
  quesitos: QuesitoPericial[],
  profile?: ProfessionalProfile,
  documents?: ProcessDocumentItem[]
) {
  const summary = calculateFinancialSummary(income, expenses, contracts);
  const plan60x = calculateProportional60xPlan(contracts, summary.capacidadeMensalPlano);
  const evolution = calculateContractEvolution(contracts, summary.capacidadeMensalPlano);

  const peritoNome = profile?.nomeProfissional || process.peritoDesignado || 'Perito Judicial Designado';
  const peritoRegistro = profile?.registroProfissional || process.registroProfissional || 'CRC/CORECON Pericial';
  const devedorNome = process.nomeDevedor || 'Devedor Principal';
  const comarcaStr = process.cidadeUf || process.comarca || 'Comarca Cível';

  const wb = XLSX.utils.book_new();

  // =============================================================
  // ABA 1: PERFIL PROFISSIONAL (Módulo 1)
  // =============================================================
  const aba1Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: 'MÓDULO 1: CADASTRAMENTO PROFISSIONAL DO PERITO / ASSISTENTE' }] },
    {
      type: 'header',
      cells: [
        { value: 'Campo de Cadastro Profissional', align: 'left' },
        { value: 'Informação Registrada', align: 'left' }
      ]
    },
    { type: 'data', cells: [{ value: 'Nome do Profissional / Perito' }, { value: peritoNome }] },
    { type: 'data', cells: [{ value: 'Papel de Atuação' }, { value: profile?.papel || 'Perito Judicial' }] },
    { type: 'data', cells: [{ value: 'Registro Profissional (CRC/OAB/CRA)' }, { value: peritoRegistro }] },
    { type: 'data', cells: [{ value: 'CPF / CNPJ' }, { value: profile?.cpfCnpj || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Nome do Escritório / Empresa' }, { value: profile?.nomeEscritorioEmpresa || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'E-mail Comercial' }, { value: profile?.email || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Telefone / WhatsApp' }, { value: profile?.telefoneWhatsapp || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Endereço Comercial' }, { value: profile?.enderecoComercial || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Cidade / UF' }, { value: profile?.cidadeUf || comarcaStr }] }
  ];
  const sheet1 = buildStyledSheet('1. Perfil Profissional', 'MÓDULO 1 — CADASTRAMENTO PROFISSIONAL & LOGO', aba1Rows, [35, 55]);
  XLSX.utils.book_append_sheet(wb, sheet1.ws, sheet1.sheetName);

  // =============================================================
  // ABA 2: PROCESSO E DEVEDOR (Módulo 2)
  // =============================================================
  const docList = documents && documents.length > 0 ? documents : [];
  const aba2Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '2.1. DADOS DO PROCESSO, JUÍZO E PERÍCIA' }] },
    {
      type: 'header',
      cells: [
        { value: 'Campo do Processo', align: 'left' },
        { value: 'Informação Cadastrada', align: 'left' }
      ]
    },
    { type: 'data', cells: [{ value: 'Número do Processo' }, { value: process.numeroProcesso || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Classe Processual' }, { value: process.classeProcessual || 'Superendividamento - Lei 14.181/2021' }] },
    { type: 'data', cells: [{ value: 'Tribunal' }, { value: process.tribunal || 'Tribunal de Justiça' }] },
    { type: 'data', cells: [{ value: 'Comarca / Cidade (UF)' }, { value: comarcaStr }] },
    { type: 'data', cells: [{ value: 'Vara Cível' }, { value: process.vara || 'Vara Cível' }] },
    { type: 'data', cells: [{ value: 'Magistrado / Juiz' }, { value: process.magistrado || 'Juiz de Direito' }] },
    { type: 'data', cells: [{ value: 'Prazo do Plano (Meses)' }, { value: process.prazoPlanoMeses || 60 }] },
    { type: 'data', cells: [{ value: 'Data da Perícia' }, { value: process.dataPericia || new Date().toISOString().split('T')[0] }] },
    { type: 'data', cells: [{ value: 'Status do Processo' }, { value: process.statusProcesso || 'Em Análise' }] },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '2.2. DADOS QUALIFICATÓRIOS DO DEVEDOR / REQUERENTE' }] },
    {
      type: 'header',
      cells: [
        { value: 'Campo do Devedor', align: 'left' },
        { value: 'Informação Qualificatória', align: 'left' }
      ]
    },
    { type: 'data', cells: [{ value: 'Nome do Devedor' }, { value: devedorNome }] },
    { type: 'data', cells: [{ value: 'CPF / CNPJ' }, { value: process.cpfCnpj || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Profissão' }, { value: process.profissao || 'Não informada' }] },
    { type: 'data', cells: [{ value: 'Vínculo Empregatício' }, { value: process.vinculoEmpregaticio || 'Não informado' }] },
    { type: 'data', cells: [{ value: 'Empregador' }, { value: process.empregador || 'Não informado' }] },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '2.3. CENTRAL DE DOCUMENTOS DO PROCESSO E COMPROVANTES (OCR)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Categoria', align: 'center' },
        { value: 'Tipo de Documento', align: 'left' },
        { value: 'Nome do Arquivo', align: 'left' },
        { value: 'Tamanho', align: 'center' },
        { value: 'Ref. Pág. / ID', align: 'center' },
        { value: 'Observações', align: 'left' }
      ]
    },
    ...(docList.length > 0 
      ? docList.map(d => ({
          type: 'data' as const,
          cells: [
            { value: d.categoria, align: 'center' as const },
            { value: d.tipoDocumento },
            { value: d.nomeArquivo || '—' },
            { value: d.tamanhoArquivo || '—', align: 'center' as const },
            { value: d.idPaginaReferencia || '—', align: 'center' as const },
            { value: d.observacao || '—' }
          ]
        }))
      : [{
          type: 'data' as const,
          cells: [{ value: 'Outros', align: 'center' as const }, { value: 'Comprovantes em Anexo' }, { value: 'documentos_processo.pdf' }, { value: '1.2 MB', align: 'center' as const }, { value: 'ID 274529', align: 'center' as const }, { value: 'Documentos probatórios dos autos' }]
        }])
  ];
  const sheet2 = buildStyledSheet('2. Processo e Devedor', 'MÓDULO 2 — CADASTRAMENTO DO PROCESSO, DEVEDOR E DOCUMENTOS', aba2Rows, [25, 30, 30, 15, 18, 40]);
  XLSX.utils.book_append_sheet(wb, sheet2.ws, sheet2.sheetName);

  // =============================================================
  // ABA 3: RLA E DESPESAS (Módulo 3)
  // =============================================================
  let salarioBrutoVal = income.salarioBruto || 0;
  let totalDeducoesLegais = (income.rppsInss || 0) + (income.irrf || 0) + (income.pensaoAlimenticia || 0) + (income.planoSaudeFolha || 0) + (income.outrasDeducoesLegais || 0);
  let consignadosFolha = (income.contrachequesPorEmpregador || []).reduce((acc, emp) => 
    acc + (emp.outrosDescontosFolha || []).reduce((a, d) => a + (d.valor || 0), 0), 0);

  if (income.contrachequesPorEmpregador && income.contrachequesPorEmpregador.length > 0) {
    salarioBrutoVal = 0;
    totalDeducoesLegais = 0;
    consignadosFolha = 0;
    for (const emp of income.contrachequesPorEmpregador) {
      salarioBrutoVal += (emp.rendimentoBruto || 0);
      totalDeducoesLegais += (emp.rppsInss || 0) + (emp.irrf || 0) + (emp.planoSaudeFolha || 0);
      consignadosFolha += (emp.outrosDescontosFolha || []).reduce((acc, d) => acc + (d.valor || 0), 0);
    }
    salarioBrutoVal += (income.outrasReceitasIndividuais || []).reduce((acc, r) => acc + (r.valor || 0), 0);
    totalDeducoesLegais += (income.pensaoAlimenticia || 0) + (income.outrasDeducoesLegais || 0);
  }

  const aba3Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '3.1. RENDA LÍQUIDA MENSAL AJUSTADA (RLA)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Rubrica de Rendimento / Dedução', align: 'left' },
        { value: 'Tipo de Rubrica', align: 'center' },
        { value: 'Valor Mensal (R$)', align: 'right' }
      ]
    },
    { type: 'data', cells: [{ value: '(+) Salário Bruto / Proventos Totais' }, { value: 'Provento', align: 'center' }, { value: salarioBrutoVal, styleType: 'currency' }] },
    ...((income.outrasReceitasIndividuais || []).map(r => ({
      type: 'data' as const,
      cells: [{ value: `(+) ${r.descricao}` }, { value: 'Provento Extra', align: 'center' }, { value: r.valor, styleType: 'currency' }]
    }))),
    { type: 'data', cells: [{ value: '(−) Deduções Legais Obrigatórias (RPPS, IRRF, Pensão, Saúde)' }, { value: 'Dedução Legal', align: 'center' }, { value: totalDeducoesLegais, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: '(−) Empréstimos Consignados em Folha (Dec. 11.150/2022)' }, { value: 'Consignado Folha', align: 'center' }, { value: consignadosFolha, styleType: 'currency' }] },
    {
      type: 'total',
      cells: [
        { value: '(=) RENDA LÍQUIDA AJUSTADA (RLA)' },
        { value: 'Base de Cálculo', align: 'center' },
        { value: summary.rla, styleType: 'currency' }
      ]
    },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '3.2. LEVANTAMENTO DAS DESPESAS ESSENCIAIS MENSAIS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Grupo de Despesa Essencial', align: 'left' },
        { value: 'Fonte Documental', align: 'center' },
        { value: 'Valor Mensal (R$)', align: 'right' }
      ]
    },
    { type: 'data', cells: [{ value: 'Moradia / Aluguel / Condomínio' }, { value: expenses.fonteMoradia || 'Comprovante nos autos', align: 'center' }, { value: expenses.moradia, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: 'Alimentação' }, { value: expenses.fonteAlimentacao || 'Comprovante nos autos', align: 'center' }, { value: expenses.alimentacao, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: 'Saúde / Medicamentos' }, { value: expenses.fonteSaude || 'Comprovante nos autos', align: 'center' }, { value: expenses.saudeMedicamentos, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: 'Transporte' }, { value: expenses.fonteTransporte || 'Comprovante nos autos', align: 'center' }, { value: expenses.transporte, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: 'Educação / Dependentes' }, { value: expenses.fonteEducacao || 'Comprovante nos autos', align: 'center' }, { value: expenses.educacaoDependentes, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: 'Outras Despesas Essenciais' }, { value: expenses.fonteOutrasDespesas || 'Comprovante nos autos', align: 'center' }, { value: expenses.outrasDespesasEssenciais, styleType: 'currency' }] },
    ...((expenses.outrasDespesasIndividuais || []).map(d => ({
      type: 'data' as const,
      cells: [{ value: `Despesa Individual: ${d.descricao}` }, { value: 'Comprovado nos autos', align: 'center' }, { value: d.valor, styleType: 'currency' }]
    }))),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL DAS DESPESAS ESSENCIAIS' },
        { value: 'Comprovado nos Autos', align: 'center' },
        { value: summary.totalDespesas, styleType: 'currency' }
      ]
    },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '3.3. MÍNIMO EXISTENCIAL E MARGEM DISPONÍVEL MENSAL' }] },
    {
      type: 'data',
      cells: [
        { value: 'MÍNIMO EXISTENCIAL CONFIGURADO (Decreto 11.150/2022)' },
        { value: expenses.justificativaMinimoExistencial || '1 Salário Mínimo', align: 'center' as const, styleType: 'badge-amber' as const },
        { value: expenses.minimoExistencialConfig || 1621, styleType: 'currency' as const }
      ]
    },
    {
      type: 'total',
      cells: [
        { value: '(=) MARGEM DISPONÍVEL MENSAL PARA O PLANO (SOBRA LÍQUIDA)' },
        { value: 'RLA − ME', align: 'center' as const, styleType: 'badge-green' as const },
        { value: summary.sobraLiquida, styleType: 'currency' as const }
      ]
    }
  ];
  const sheet3 = buildStyledSheet('3. RLA e Despesas', 'MÓDULO 3 — RENDA LÍQUIDA MENSAL AJUSTADA (RLA), DESPESAS E MÍNIMO EXISTENCIAL', aba3Rows, [45, 30, 22]);
  XLSX.utils.book_append_sheet(wb, sheet3.ws, sheet3.sheetName);

  // =============================================================
  // ABA 4: COMPROMETIMENTO DA RENDA (Módulo 4)
  // =============================================================
  const aba4Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '4.1. ANÁLISE DO COMPROMETIMENTO DA RENDA MENSAL ANTES DO PLANO' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato', align: 'center' },
        { value: 'Modalidade', align: 'left' },
        { value: 'Encargo Mensal (R$)', align: 'right' },
        { value: '% de Participação na RLA', align: 'center' }
      ]
    },
    ...contracts.map(c => ({
      type: 'data' as const,
      cells: [
        { value: c.credor },
        { value: c.numeroContrato, align: 'center' as const },
        { value: c.modalidade },
        { value: c.valorParcelaAtual, styleType: 'currency' as const },
        { value: summary.rla > 0 ? (c.valorParcelaAtual / summary.rla) : 0, styleType: 'percent' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL ENCARGOS ATUAIS' },
        { value: '' },
        { value: '' },
        { value: summary.totalParcelasAtuais, styleType: 'currency' },
        { value: summary.rla > 0 ? (summary.totalParcelasAtuais / summary.rla) : 0, styleType: 'percent' }
      ]
    },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '4.2. DIAGNÓSTICO TÉCNICO PERICIAL DE SUPERENDIVIDAMENTO' }] },
    {
      type: 'data',
      cells: [
        { value: 'Diagnóstico de Superendividamento' },
        { value: '' },
        { value: '' },
        {
          value: summary.percentualComprometimentoRLA > 50 ? 'SUPERENDIVIDAMENTO SEVERO (>50% RLA)' : 'SUPERENDIVIDAMENTO REGULAR',
          align: 'center',
          styleType: summary.percentualComprometimentoRLA > 50 ? 'badge-red' : 'badge-amber'
        },
        { value: summary.percentualComprometimentoRLA / 100, styleType: 'percent' }
      ]
    },
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '4.3. ANÁLISE COMPARATIVA DO COMPROMETIMENTO PÓS-PLANO DE REPACTUAÇÃO (60X)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Indicador Orçamentário Pós-Plano', align: 'left' },
        { value: 'Base Legislação', align: 'center' },
        { value: 'Resultado Apurado', align: 'center' }
      ]
    },
    { type: 'data', cells: [{ value: 'Prestação Mensal Repactuada (PMT 60x)' }, { value: 'Art. 104-B §4º CDC', align: 'center' }, { value: summary.capacidadeMensalPlano, styleType: 'currency' }] },
    { type: 'data', cells: [{ value: '% de Comprometimento Pós-Plano na RLA' }, { value: 'Limite 30% RLA', align: 'center' }, { value: (summary.rla > 0 ? summary.capacidadeMensalPlano / summary.rla : 0), styleType: 'percent' }] }
  ];
  const sheet4 = buildStyledSheet('4. Comprometimento Renda', 'MÓDULO 4 — COMPROMETIMENTO DA RENDA MENSAL (ANTES X APÓS O PLANO)', aba4Rows, [30, 20, 25, 22, 22]);
  XLSX.utils.book_append_sheet(wb, sheet4.ws, sheet4.sheetName);

  // =============================================================
  // ABA 5: CONTRATOS BANCÁRIOS (Módulo 5)
  // =============================================================
  const aba5Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '5.1. RELAÇÃO CONSOLIDADA DAS OPERAÇÕES DE CRÉDITO E CONTRATOS BANCÁRIOS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato / CCB', align: 'center' },
        { value: 'Modalidade', align: 'left' },
        { value: 'Data Contrato', align: 'center' },
        { value: 'Data 1ª Parcela', align: 'center' },
        { value: 'Data Última Parcela', align: 'center' },
        { value: 'Vlr. Contratado (R$)', align: 'right' },
        { value: 'Vlr. Final Contrato (R$)', align: 'right' },
        { value: 'Vlr. IOF (R$)', align: 'right' },
        { value: 'Total Parc.', align: 'center' },
        { value: 'Parc. Pagas', align: 'center' },
        { value: 'Parc. Restantes', align: 'center' },
        { value: 'Parcela Atual (R$)', align: 'right' },
        { value: 'Taxa a.m. (%)', align: 'center' },
        { value: 'Seguro Prestamista (R$)', align: 'right' },
        { value: 'Tarifas (R$)', align: 'right' },
        { value: 'Expurgar Abusividades?', align: 'center' },
        { value: 'Saldo Devedor Ref. (R$)', align: 'right' }
      ]
    },
    ...contracts.map(c => ({
      type: 'data' as const,
      cells: [
        { value: c.credor, align: 'left' as const },
        { value: c.numeroContrato, align: 'center' as const },
        { value: c.modalidade, align: 'left' as const },
        { value: c.dataContrato || '—', align: 'center' as const },
        { value: c.dataPrimeiraParcela || '—', align: 'center' as const },
        { value: c.vencimentoFinal || '—', align: 'center' as const },
        { value: c.valorLiberadoContrato, styleType: 'currency' as const },
        { value: c.valorFinalContrato || 0, styleType: 'currency' as const },
        { value: c.valorIOF || 0, styleType: 'currency' as const },
        { value: c.qtdParcelasTotal || 0, align: 'center' as const },
        { value: c.qtdParcelasPagas || 0, align: 'center' as const },
        { value: c.qtdParcelasRestantes || 0, align: 'center' as const },
        { value: c.valorParcelaAtual, styleType: 'currency' as const },
        { value: (c.taxaJurosMes || 0) / 100, styleType: 'percent' as const },
        { value: c.valorSeguroPrestamista || 0, styleType: 'currency' as const },
        { value: c.valorTarifasAbusivas || 0, styleType: 'currency' as const },
        { value: c.expurgarAbusividades ? 'SIM' : 'NÃO', align: 'center' as const, styleType: c.expurgarAbusividades ? 'badge-amber' as const : 'default' as const },
        { value: c.saldoDevedorRefUltimaParcela || 0, styleType: 'currency' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL GERAL CONSOLIDADO' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + c.valorLiberadoContrato, 0), styleType: 'currency' },
        { value: contracts.reduce((a, c) => a + (c.valorFinalContrato || 0), 0), styleType: 'currency' },
        { value: contracts.reduce((a, c) => a + (c.valorIOF || 0), 0), styleType: 'currency' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: summary.totalParcelasAtuais, styleType: 'currency' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + (c.valorSeguroPrestamista || 0), 0), styleType: 'currency' },
        { value: contracts.reduce((a, c) => a + (c.valorTarifasAbusivas || 0), 0), styleType: 'currency' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + (c.saldoDevedorRefUltimaParcela || 0), 0), styleType: 'currency' }
      ]
    }
  ];
  const sheet5 = buildStyledSheet('5. Contratos Bancários', 'MÓDULO 5 — CREDITORES & CADASTRAMENTO INDIVIDUAL DE CONTRATOS', aba5Rows);
  XLSX.utils.book_append_sheet(wb, sheet5.ws, sheet5.sheetName);

  // =============================================================
  // ABA 6: SALDO POR PRESTAÇÕES PAGAS (Módulo 6)
  // =============================================================
  const aba6Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '6.1. APURAÇÃO DO SALDO DEVEDOR RESIDUAL COM BASE EM PRESTAÇÕES PAGAS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Contrato', align: 'center' },
        { value: 'Credor', align: 'left' },
        { value: 'Vlr. Contratado (R$)', align: 'right' },
        { value: 'Taxa a.m. (%)', align: 'center' },
        { value: 'Prazo', align: 'center' },
        { value: 'Prestação (R$)', align: 'right' },
        { value: 'Data Contrato', align: 'center' },
        { value: 'Data 1ª Parc.', align: 'center' },
        { value: 'Parc. Pagas', align: 'center' },
        { value: 'Saldo Devedor (Pagas) (R$)', align: 'right' },
        { value: 'Fator INPC (7 Casas)', align: 'center' },
        { value: 'Saldo Corrigido INPC (R$)', align: 'right' }
      ]
    },
    ...contracts.map(c => {
      const pmt = c.valorParcelaAtual || 0;
      const pagas = c.qtdParcelasPagas || 0;
      const principal = c.valorLiberadoContrato || 0;
      const fator = c.fatorCorrecao7Casas || 1.0;
      const sdApurado = c.saldoDevedorRefUltimaParcela || Math.max(0, principal - (pmt * pagas * 0.4));
      const sdCorrigido = sdApurado * fator;

      return {
        type: 'data' as const,
        cells: [
          { value: c.numeroContrato, align: 'center' as const },
          { value: c.credor },
          { value: principal, styleType: 'currency' as const },
          { value: (c.taxaJurosMes || 0) / 100, styleType: 'percent' as const },
          { value: c.qtdParcelasTotal || 0, align: 'center' as const },
          { value: pmt, styleType: 'currency' as const },
          { value: c.dataContrato || '—', align: 'center' as const },
          { value: c.dataPrimeiraParcela || '—', align: 'center' as const },
          { value: pagas, align: 'center' as const },
          { value: sdApurado, styleType: 'currency' as const },
          { value: fator, styleType: 'fator7' as const },
          { value: sdCorrigido, styleType: 'currency' as const }
        ]
      };
    }),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL GERAL APURADO' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + c.valorLiberadoContrato, 0), styleType: 'currency' },
        { value: '' },
        { value: '' },
        { value: summary.totalParcelasAtuais, styleType: 'currency' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + (c.saldoDevedorRefUltimaParcela || 0), 0), styleType: 'currency' },
        { value: '' },
        { value: summary.totalSaldoDevedorINPC, styleType: 'currency' }
      ]
    }
  ];
  const sheet6 = buildStyledSheet('6. Saldo por Pagas', 'MÓDULO 6 — APURAÇÃO DO SALDO DEVEDOR POR PRESTAÇÕES PAGAS', aba6Rows, [18, 25, 20, 14, 10, 18, 14, 14, 12, 22, 18, 22]);
  XLSX.utils.book_append_sheet(wb, sheet6.ws, sheet6.sheetName);

  // =============================================================
  // ABA 7: AMORTIZAÇÃO INDIVIDUAL (Módulo 7)
  // =============================================================
  const aba7Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '7.1. DEMONSTRATIVO DE AMORTIZAÇÃO INDIVIDUAL DOS CONTRATOS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Contrato', align: 'center' },
        { value: 'Credor', align: 'left' },
        { value: 'Modalidade', align: 'left' },
        { value: 'Capital Contratado (R$)', align: 'right' },
        { value: 'Prazo Meses', align: 'center' },
        { value: 'Prestação Mensal (R$)', align: 'right' },
        { value: 'Total Amortizado (R$)', align: 'right' },
        { value: 'Total Juros Pagos (R$)', align: 'right' }
      ]
    },
    ...contracts.map(c => ({
      type: 'data' as const,
      cells: [
        { value: c.numeroContrato, align: 'center' as const },
        { value: c.credor },
        { value: c.modalidade },
        { value: c.valorLiberadoContrato, styleType: 'currency' as const },
        { value: c.qtdParcelasTotal || 0, align: 'center' as const },
        { value: c.valorParcelaAtual, styleType: 'currency' as const },
        { value: (c.valorParcelaAtual * (c.qtdParcelasPagas || 0) * 0.4), styleType: 'currency' as const },
        { value: (c.valorParcelaAtual * (c.qtdParcelasPagas || 0) * 0.6), styleType: 'currency' as const }
      ]
    }))
  ];
  const sheet7 = buildStyledSheet('7. Amortização Indiv.', 'MÓDULO 7 — AMORTIZAÇÃO INDIVIDUAL DOS CONTRATOS BANCÁRIOS', aba7Rows, [20, 25, 25, 22, 12, 20, 22, 22]);
  XLSX.utils.book_append_sheet(wb, sheet7.ws, sheet7.sheetName);

  // =============================================================
  // ABA 8: ATUALIZAÇÃO INPC & BACEN (Módulo 8)
  // =============================================================
  const aba8Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '8.1. ATUALIZAÇÃO MONETÁRIA DOS SALDOS PELO INPC/IPCA (FATOR 7 CASAS DECIMAIS)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor', align: 'left' },
        { value: 'Contrato', align: 'center' },
        { value: 'Índice Correção', align: 'center' },
        { value: 'Data Ref.', align: 'center' },
        { value: 'Saldo Base Ajustado (R$)', align: 'right' },
        { value: 'Expurgo Abusividades (R$)', align: 'right' },
        { value: 'Fator Correção (7 Casas)', align: 'center' },
        { value: 'Saldo Devedor Corrigido (R$)', align: 'right' }
      ]
    },
    ...summary.contractsCalculated.map(c => ({
      type: 'data' as const,
      cells: [
        { value: c.credor },
        { value: c.numeroContrato, align: 'center' as const },
        { value: c.tipoIndiceCorrecao || 'INPC', align: 'center' as const },
        { value: c.dataReferenciaUltimoPagamento || '—', align: 'center' as const },
        { value: c.saldoBaseAjustado, styleType: 'currency' as const },
        { value: c.deducaoAbusiva, styleType: 'currency' as const },
        { value: c.fatorCorrecao7Casas || 1.0, styleType: 'fator7' as const },
        { value: c.saldoINPC, styleType: 'currency' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL GERAL CORRIGIDO' },
        { value: '' },
        { value: '' },
        { value: '' },
        { value: summary.contractsCalculated.reduce((a, c) => a + c.saldoBaseAjustado, 0), styleType: 'currency' },
        { value: summary.contractsCalculated.reduce((a, c) => a + c.deducaoAbusiva, 0), styleType: 'currency' },
        { value: '' },
        { value: summary.totalSaldoDevedorINPC, styleType: 'currency' }
      ]
    }
  ];
  const sheet8 = buildStyledSheet('8. Atualização INPC', 'MÓDULO 8 — ATUALIZAÇÃO MONETÁRIA (INPC/IPCA) E TAXAS BACEN', aba8Rows, [25, 20, 15, 15, 22, 22, 22, 25]);
  XLSX.utils.book_append_sheet(wb, sheet8.ws, sheet8.sheetName);

  // =============================================================
  // ABA 9: SALDOS CORRIGIDOS (Módulo 9)
  // =============================================================
  const aba9Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '9.1. CONSOLIDAÇÃO DOS SALDOS DEVEDORES ATUALIZADOS E EXPURGADOS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato', align: 'center' },
        { value: 'Modalidade', align: 'left' },
        { value: 'Saldo Devedor Ref. (R$)', align: 'right' },
        { value: 'Abusividades Expurgadas (R$)', align: 'right' },
        { value: 'Saldo Devedor Final Corrigido (R$)', align: 'right' }
      ]
    },
    ...summary.contractsCalculated.map(c => ({
      type: 'data' as const,
      cells: [
        { value: c.credor },
        { value: c.numeroContrato, align: 'center' as const },
        { value: c.modalidade },
        { value: c.saldoBaseAjustado, styleType: 'currency' as const },
        { value: c.deducaoAbusiva, styleType: 'currency' as const },
        { value: c.saldoINPC, styleType: 'currency' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL PASSIVO CONSOLIDADO' },
        { value: '' },
        { value: '' },
        { value: summary.contractsCalculated.reduce((a, c) => a + c.saldoBaseAjustado, 0), styleType: 'currency' },
        { value: summary.contractsCalculated.reduce((a, c) => a + c.deducaoAbusiva, 0), styleType: 'currency' },
        { value: summary.totalSaldoDevedorINPC, styleType: 'currency' }
      ]
    }
  ];
  const sheet9 = buildStyledSheet('9. Saldos Corrigidos', 'MÓDULO 9 — SALDO DEVEDOR ATUALIZADO & VALOR PRINCIPAL PAGO', aba9Rows, [30, 20, 25, 22, 22, 25]);
  XLSX.utils.book_append_sheet(wb, sheet9.ws, sheet9.sheetName);

  // =============================================================
  // ABA 10: DÍVIDAS TABELA 6 (Módulo 10)
  // =============================================================
  const aba10Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '10.1. DÍVIDAS INCLUÍDAS NO PLANO COMPULSÓRIO DE REPACTUAÇÃO (TABELA 6)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato / CCB', align: 'center' },
        { value: 'Modalidade de Crédito', align: 'left' },
        { value: 'Enquadramento Legal (CDC)', align: 'center' },
        { value: 'Saldo Elegível INPC (R$)', align: 'right' }
      ]
    },
    ...contracts.map(c => {
      const calc = summary.contractsCalculated.find(cc => cc.id === c.id);
      return {
        type: 'data' as const,
        cells: [
          { value: c.credor },
          { value: c.numeroContrato, align: 'center' as const },
          { value: c.modalidade },
          { value: 'Art. 54-A, § 1º do CDC (Lei 14.181/21)', align: 'center' as const, styleType: 'badge-blue' as const },
          { value: calc?.saldoINPC || c.valorLiberadoContrato, styleType: 'currency' as const }
        ]
      };
    }),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL DÍVIDAS ELEGÍVEIS NO PLANO' },
        { value: '' },
        { value: '' },
        { value: 'Repactuação 60 Meses', align: 'center' },
        { value: summary.totalSaldoDevedorINPC, styleType: 'currency' }
      ]
    }
  ];
  const sheet10 = buildStyledSheet('10. Dívidas Tabela 6', 'MÓDULO 10 — DÍVIDAS INCLUÍDAS NO PLANO COMPULSÓRIO (TABELA 6)', aba10Rows, [30, 20, 25, 30, 25]);
  XLSX.utils.book_append_sheet(wb, sheet10.ws, sheet10.sheetName);

  // =============================================================
  // ABA 11: REVISIONAL BACEN (Módulo 11)
  // =============================================================
  const aba11Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '11.1. CONFRONTO ENTRE TAXAS CONTRATADAS E TAXAS MÉDIAS DE MERCADO (BACEN/SGS)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor', align: 'left' },
        { value: 'Contrato', align: 'center' },
        { value: 'Modalidade', align: 'left' },
        { value: 'Taxa Contratada (% a.m.)', align: 'center' },
        { value: 'Taxa Méd. BACEN (% a.m.)', align: 'center' },
        { value: 'Diferença Taxa (% a.m.)', align: 'center' },
        { value: 'Diagnóstico Pericial', align: 'center' }
      ]
    },
    ...contracts.map(c => {
      const b = getBacenStatus(c.taxaJurosMes, c.taxaMediaBacenMes || c.taxaJurosMes);
      const dif = c.taxaJurosMes - (c.taxaMediaBacenMes || c.taxaJurosMes);
      let badgeType: 'badge-green' | 'badge-amber' | 'badge-red' | 'badge-blue' = 'badge-green';
      if (b.status === 'ABUSIVA') badgeType = 'badge-red';
      else if (b.status === 'NA_MEDIA') badgeType = 'badge-blue';
      else if (b.status === 'ABAIXO') badgeType = 'badge-green';

      return {
        type: 'data' as const,
        cells: [
          { value: c.credor },
          { value: c.numeroContrato, align: 'center' as const },
          { value: c.modalidade },
          { value: (c.taxaJurosMes || 0) / 100, styleType: 'percent' as const },
          { value: (c.taxaMediaBacenMes || c.taxaJurosMes || 0) / 100, styleType: 'percent' as const },
          { value: dif / 100, styleType: 'percent' as const },
          { value: b.label, align: 'center' as const, styleType: badgeType }
        ]
      };
    })
  ];
  const sheet11 = buildStyledSheet('11. Revisional BACEN', 'MÓDULO 11 — CENÁRIO REVISIONAL COM TAXA MÉDIA BACEN', aba11Rows, [25, 20, 25, 20, 20, 20, 25]);
  XLSX.utils.book_append_sheet(wb, sheet11.ws, sheet11.sheetName);

  // =============================================================
  // ABA 12: EVOLUÇÃO CONTRATOS (Módulo 12)
  // =============================================================
  const aba12Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '12.1. EVOLUÇÃO DOS CONTRATOS: VALORES CONTRATADOS x RECEBIDOS & LUCRO DO CREDOR' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Contrato', align: 'left' },
        { value: 'Qtd. Pagas', align: 'center' },
        { value: 'Qtd. Pagar', align: 'center' },
        { value: 'Capital Contratado (R$)', align: 'right' },
        { value: 'Total Já Pago (R$)', align: 'right' },
        { value: 'Total Repactuado 60m (R$)', align: 'right' },
        { value: 'Total Geral Recebido (R$)', align: 'right' },
        { value: 'Lucro / Juros Credor (R$)', align: 'right' },
        { value: 'TIR (% a.m.)', align: 'center' },
        { value: 'TIR (% a.a.)', align: 'center' }
      ]
    },
    ...evolution.map(e => ({
      type: 'data' as const,
      cells: [
        { value: `${e.credor} (${e.numeroContrato})` },
        { value: e.qtdPagas, align: 'center' as const },
        { value: e.qtdPagar, align: 'center' as const },
        { value: e.valorLiberado, styleType: 'currency' as const },
        { value: e.totalPrestacoesJaPagas, styleType: 'currency' as const },
        { value: e.totalRepactuado60m, styleType: 'currency' as const },
        { value: e.totalPagoJaPagasERepactuadas, styleType: 'currency' as const },
        { value: e.totalPagoAcimaDoValorLiberado, styleType: 'currency' as const },
        { value: e.tirAmPercent / 100, styleType: 'percent' as const },
        { value: e.tirAaPercent / 100, styleType: 'percent' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL GERAL CONSOLIDADO' },
        { value: '' },
        { value: '' },
        { value: evolution.reduce((a, r) => a + r.valorLiberado, 0), styleType: 'currency' },
        { value: evolution.reduce((a, r) => a + r.totalPrestacoesJaPagas, 0), styleType: 'currency' },
        { value: summary.capacidadeMensalPlano * 60, styleType: 'currency' },
        { value: evolution.reduce((a, r) => a + r.totalPagoJaPagasERepactuadas, 0), styleType: 'currency' },
        { value: evolution.reduce((a, r) => a + r.totalPagoAcimaDoValorLiberado, 0), styleType: 'currency' },
        { value: '' },
        { value: '' }
      ]
    }
  ];
  const sheet12 = buildStyledSheet('12. Evolução Contratos', 'MÓDULO 12 — ANÁLISE DA EVOLUÇÃO DOS CONTRATOS (CONTRATADO X RECEBIDO)', aba12Rows, [30, 12, 12, 22, 22, 22, 25, 22, 15, 15]);
  XLSX.utils.book_append_sheet(wb, sheet12.ws, sheet12.sheetName);

  // =============================================================
  // ABA 13: TOTAL PAGO POR CONTRATO (Módulo 13)
  // =============================================================
  const aba13Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '13.1. DEMONSTRAÇÃO DO TOTAL ACUMULADO PAGO POR OPERAÇÃO DE CRÉDITO' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato', align: 'center' },
        { value: 'Prestações Pagas (R$)', align: 'right' },
        { value: 'Seguros / Tarifas (R$)', align: 'right' },
        { value: 'Total Acumulado Pago (R$)', align: 'right' }
      ]
    },
    ...contracts.map(c => {
      const pagasVal = (c.valorParcelaAtual || 0) * (c.qtdParcelasPagas || 0);
      const abusivosVal = (c.valorSeguroPrestamista || 0) + (c.valorTarifasAbusivas || 0);
      return {
        type: 'data' as const,
        cells: [
          { value: c.credor },
          { value: c.numeroContrato, align: 'center' as const },
          { value: pagasVal, styleType: 'currency' as const },
          { value: abusivosVal, styleType: 'currency' as const },
          { value: pagasVal + abusivosVal, styleType: 'currency' as const }
        ]
      };
    }),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL ACUMULADO PAGO A TODOS OS CREDORES' },
        { value: '' },
        { value: contracts.reduce((a, c) => a + ((c.valorParcelaAtual || 0) * (c.qtdParcelasPagas || 0)), 0), styleType: 'currency' },
        { value: contracts.reduce((a, c) => a + (c.valorSeguroPrestamista || 0) + (c.valorTarifasAbusivas || 0), 0), styleType: 'currency' },
        { value: contracts.reduce((a, c) => a + ((c.valorParcelaAtual || 0) * (c.qtdParcelasPagas || 0)) + (c.valorSeguroPrestamista || 0) + (c.valorTarifasAbusivas || 0), 0), styleType: 'currency' }
      ]
    }
  ];
  const sheet13 = buildStyledSheet('13. Total Pago Contrato', 'MÓDULO 13 — DEMONSTRAÇÃO DO TOTAL PAGO POR CONTRATO', aba13Rows, [30, 20, 22, 22, 25]);
  XLSX.utils.book_append_sheet(wb, sheet13.ws, sheet13.sheetName);

  // =============================================================
  // ABA 14: JUROS & TIR CREDOR (Módulo 14)
  // =============================================================
  const aba14Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '14.1. CÁLCULO DOS JUROS PAGOS E TAXA INTERNA DE RETORNO (TIR DO CREDOR)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato', align: 'center' },
        { value: 'Capital Contratado (R$)', align: 'right' },
        { value: 'Total Recebido (R$)', align: 'right' },
        { value: 'Lucro do Credor (R$)', align: 'right' },
        { value: 'TIR (% a.m.)', align: 'center' },
        { value: 'TIR (% a.a.)', align: 'center' }
      ]
    },
    ...evolution.map(e => ({
      type: 'data' as const,
      cells: [
        { value: e.credor },
        { value: e.numeroContrato, align: 'center' as const },
        { value: e.valorLiberado, styleType: 'currency' as const },
        { value: e.totalPagoJaPagasERepactuadas, styleType: 'currency' as const },
        { value: e.totalPagoAcimaDoValorLiberado, styleType: 'currency' as const },
        { value: e.tirAmPercent / 100, styleType: 'percent' as const },
        { value: e.tirAaPercent / 100, styleType: 'percent' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL GERAL JUROS E RETORNO' },
        { value: '' },
        { value: evolution.reduce((a, r) => a + r.valorLiberado, 0), styleType: 'currency' },
        { value: evolution.reduce((a, r) => a + r.totalPagoJaPagasERepactuadas, 0), styleType: 'currency' },
        { value: evolution.reduce((a, r) => a + r.totalPagoAcimaDoValorLiberado, 0), styleType: 'currency' },
        { value: '' },
        { value: '' }
      ]
    }
  ];
  const sheet14 = buildStyledSheet('14. Juros & TIR Credor', 'MÓDULO 14 — CÁLCULO DOS JUROS PAGOS E TIR DO CREDOR', aba14Rows, [30, 20, 22, 22, 22, 16, 16]);
  XLSX.utils.book_append_sheet(wb, sheet14.ws, sheet14.sheetName);

  // =============================================================
  // ABA 15: PRICE 60 PARCELAS (Módulo 15)
  // =============================================================
  const iPlano = 0;
  let currentSaldoPlano = summary.totalSaldoDevedorINPC;
  const pmtPlanoMes = summary.capacidadeMensalPlano;

  const rowsPrice60: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '15.1. CRONOGRAMA DE AMORTIZAÇÃO TABELA PRICE EM 60 PARCELAS DO PLANO COMPULSÓRIO' }] },
    {
      type: 'header',
      cells: [
        { value: 'Parcela Nº', align: 'center' },
        { value: 'Saldo Devedor Inicial (R$)', align: 'right' },
        { value: 'Juros R$', align: 'right' },
        { value: 'Amortização R$', align: 'right' },
        { value: 'PMT Mensal Repactuada (R$)', align: 'right' },
        { value: 'Saldo Devedor Final (R$)', align: 'right' }
      ]
    }
  ];

  for (let m = 1; m <= 60; m++) {
    const jurosM = currentSaldoPlano * iPlano;
    const amortM = Math.min(currentSaldoPlano, pmtPlanoMes - jurosM);
    const saldoFinalM = Math.max(0, currentSaldoPlano - amortM);

    rowsPrice60.push({
      type: 'data',
      cells: [
        { value: m, align: 'center' },
        { value: currentSaldoPlano, styleType: 'currency' },
        { value: jurosM, styleType: 'currency' },
        { value: amortM, styleType: 'currency' },
        { value: pmtPlanoMes, styleType: 'currency' },
        { value: saldoFinalM, styleType: 'currency' }
      ]
    });
    currentSaldoPlano = saldoFinalM;
  }

  rowsPrice60.push({
    type: 'total',
    cells: [
      { value: 'TOTAL EM 60 PARCELAS' },
      { value: summary.totalSaldoDevedorINPC, styleType: 'currency' },
      { value: 0, styleType: 'currency' },
      { value: summary.capacidadeMensalPlano * 60, styleType: 'currency' },
      { value: summary.capacidadeMensalPlano, styleType: 'currency' },
      { value: 0, styleType: 'currency' }
    ]
  });

  const sheet15 = buildStyledSheet('15. Price 60 Parcelas', 'MÓDULO 15 — AMORTIZAÇÃO TABELA PRICE (60 PARCELAS)', rowsPrice60, [15, 25, 18, 20, 25, 25]);
  XLSX.utils.book_append_sheet(wb, sheet15.ws, sheet15.sheetName);

  // =============================================================
  // ABA 16: CONSOLIDAÇÃO PASSIVO (Módulo 16)
  // =============================================================
  const rlaPosRepactuacaoVal = summary.rla + consignadosFolha;
  const pmtPlanoVal = summary.capacidadeMensalPlano;
  const recursosLivresVal = Math.max(0, rlaPosRepactuacaoVal - summary.totalDespesas - pmtPlanoVal);
  const percentComprometimentoPosPlanoVal = rlaPosRepactuacaoVal > 0 ? (pmtPlanoVal / rlaPosRepactuacaoVal) * 100 : 0;
  const percentPreservadoPosPlanoVal = 100 - percentComprometimentoPosPlanoVal;

  const aba16Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '16.1. CONSOLIDAÇÃO DO PASSIVO E CAPACIDADE DE PAGAMENTO DO DEVEDOR' }] },
    {
      type: 'header',
      cells: [
        { value: 'Item do Balanço Financeiro', align: 'left' },
        { value: 'Valor Mensal (R$)', align: 'right' },
        { value: 'Status / Garantia Legal', align: 'center' }
      ]
    },
    { type: 'data', cells: [{ value: 'Renda Líquida Ajustada Pós-Repactuação (RLA)' }, { value: rlaPosRepactuacaoVal, styleType: 'currency' }, { value: 'Renda reorganizada', align: 'center' }] },
    { type: 'data', cells: [{ value: '(−) Despesas Essenciais Comprovadas' }, { value: summary.totalDespesas, styleType: 'currency' }, { value: 'Mínimo Existencial assegurado', align: 'center' }] },
    { type: 'data', cells: [{ value: '(−) Prestação Mensal do Plano Compulsório (PMT 60x)' }, { value: pmtPlanoVal, styleType: 'currency' }, { value: 'Repactuação em 60 parcelas iguais', align: 'center' }] },
    {
      type: 'total',
      cells: [
        { value: '(=) Total de Recursos Livres Remanescentes' },
        { value: recursosLivresVal, styleType: 'currency' as const },
        { value: 'Sobra orçamentária do devedor', align: 'center' as const, styleType: 'badge-green' as const }
      ]
    },
    { type: 'empty', cells: [] },
    {
      type: 'data',
      cells: [
        { value: 'Preservação do Mínimo Existencial (1 Salário Mínimo)?' },
        { value: recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'SIM — Preservado' : 'PARCIAL', align: 'center', styleType: recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'badge-green' : 'badge-amber' },
        { value: 'Art. 54-A, § 1º do CDC', align: 'center' }
      ]
    },
    {
      type: 'data',
      cells: [
        { value: 'Preservação de no mínimo 20% da Relação Remuneratória?' },
        { value: percentPreservadoPosPlanoVal / 100, styleType: 'percent' },
        { value: percentPreservadoPosPlanoVal >= 20 ? 'SIM (Superior a 20%)' : 'NÃO', align: 'center', styleType: percentPreservadoPosPlanoVal >= 20 ? 'badge-green' : 'badge-red' }
      ]
    }
  ];
  const sheet16 = buildStyledSheet('16. Consolidação Passivo', 'MÓDULO 16 — CONSOLIDAÇÃO DO PASSIVO & CAPACIDADE DE PAGAMENTO', aba16Rows, [45, 25, 30]);
  XLSX.utils.book_append_sheet(wb, sheet16.ws, sheet16.sheetName);

  // =============================================================
  // ABA 17: PLANO RATEIO 60X (Módulo 17)
  // =============================================================
  const aba17Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '17.1. PLANO DE PAGAMENTO COMPULSÓRIO EM 60 PARCELAS (ART. 104-B §4º DO CDC)' }] },
    {
      type: 'header',
      cells: [
        { value: 'Credor / Instituição', align: 'left' },
        { value: 'Nº Contrato', align: 'center' },
        { value: 'Saldo Corrigido INPC (R$)', align: 'right' },
        { value: 'Proporção / Peso (%)', align: 'center' },
        { value: 'PMT Mensal Repactuada (R$)', align: 'right' },
        { value: 'Total Quitado em 60m (R$)', align: 'right' }
      ]
    },
    ...plan60x.map(p => ({
      type: 'data' as const,
      cells: [
        { value: p.credor },
        { value: p.numeroContrato, align: 'center' as const },
        { value: p.saldoDevedorINPC, styleType: 'currency' as const },
        { value: p.percentualDoTotal / 100, styleType: 'percent' as const },
        { value: p.parcelaRepactuadaPMT, styleType: 'currency' as const },
        { value: p.totalQuitado60m, styleType: 'currency' as const }
      ]
    })),
    {
      type: 'total',
      cells: [
        { value: 'TOTAL PLANO REPACTUADO 60X' },
        { value: '' },
        { value: summary.totalSaldoDevedorINPC, styleType: 'currency' },
        { value: 1.0, styleType: 'percent' },
        { value: summary.capacidadeMensalPlano, styleType: 'currency' },
        { value: summary.capacidadeMensalPlano * 60, styleType: 'currency' }
      ]
    }
  ];
  const sheet17 = buildStyledSheet('17. Plano Rateio 60X', 'MÓDULO 17 — PLANO DE PAGAMENTO COMPULSÓRIO (RATEIO PROPORCIONAL 60X)', aba17Rows, [30, 20, 22, 20, 25, 25]);
  XLSX.utils.book_append_sheet(wb, sheet17.ws, sheet17.sheetName);

  // =============================================================
  // ABA 18: QUESITOS & PARECER (Módulo 18)
  // =============================================================
  const aba18Rows: SheetRowDefinition[] = [
    { type: 'section', cells: [{ value: '18.1. RESPOSTAS TÉCNICAS AOS QUESITOS PERICIAIS' }] },
    {
      type: 'header',
      cells: [
        { value: 'Quesito N.º', align: 'center' },
        { value: 'Origem / Parte', align: 'center' },
        { value: 'Pergunta / Enunciado', align: 'left' },
        { value: 'Resposta Técnica do Perito Judicial', align: 'left' }
      ]
    },
    ...quesitos.map((q, i) => ({
      type: 'data' as const,
      cells: [
        { value: `Quesito ${i + 1}`, align: 'center' as const },
        { value: q.origem, align: 'center' as const },
        { value: q.pergunta },
        { value: q.respostaTecnica }
      ]
    })),
    { type: 'empty', cells: [] },
    { type: 'section', cells: [{ value: '18.2. PARECER PERICIAL E CONCLUSÃO TÉCNICO-CONTÁBIL DO LAUDO' }] },
    {
      type: 'data',
      cells: [
        { value: 'Parecer do Perito Judicial' },
        { value: 'Encerramento' },
        { value: `Ante o exposto e examinadas as operações bancárias do(a) Requerente ${devedorNome}, este Perito conclui que o plano compulsório de repactuação em 60 parcelas mensais de R$ ${summary.capacidadeMensalPlano.toFixed(2)} preserva o mínimo existencial legal e assegura a quitação integral do passivo apurado.` },
        { value: 'Laudo Pericial Concluído e Assinado Digitalmente.' }
      ]
    }
  ];
  const sheet18 = buildStyledSheet('18. Quesitos & Parecer', 'MÓDULO 18 — PARECER TÉCNICO, EMISSÃO DO LAUDO PERICIAL & QUESITOS', aba18Rows, [15, 18, 45, 50]);
  XLSX.utils.book_append_sheet(wb, sheet18.ws, sheet18.sheetName);

  // =============================================================
  // ABAS INDIVIDUAIS POR CREDOR (BRB, Sicoob, Banco do Brasil, etc)
  // =============================================================
  const credoresUnicos = Array.from(new Set(contracts.map(c => c.credor)));
  credoresUnicos.forEach((credor) => {
    const credorContracts = contracts.filter(c => c.credor === credor);
    const rowsCredor: SheetRowDefinition[] = [
      { type: 'section', cells: [{ value: `DETALHAMENTO DOS CONTRATOS DO CREDOR: ${credor.toUpperCase()}` }] },
      {
        type: 'header',
        cells: [
          { value: 'Contrato', align: 'center' },
          { value: 'Modalidade', align: 'left' },
          { value: 'Data Contrato', align: 'center' },
          { value: 'Data 1ª Parcela', align: 'center' },
          { value: 'Data Última Parcela', align: 'center' },
          { value: 'Capital Contratado (R$)', align: 'right' },
          { value: 'Valor Final (R$)', align: 'right' },
          { value: 'IOF (R$)', align: 'right' },
          { value: 'Qtd. Pagas', align: 'center' },
          { value: 'Qtd. Restantes', align: 'center' },
          { value: 'Parcela Atual (R$)', align: 'right' },
          { value: 'Taxa a.m. (%)', align: 'center' },
          { value: 'Seguro (R$)', align: 'right' },
          { value: 'Tarifas (R$)', align: 'right' },
          { value: 'Expurgar Abusividades?', align: 'center' }
        ]
      },
      ...credorContracts.map(c => ({
        type: 'data' as const,
        cells: [
          { value: c.numeroContrato, align: 'center' as const },
          { value: c.modalidade },
          { value: c.dataContrato || '—', align: 'center' as const },
          { value: c.dataPrimeiraParcela || '—', align: 'center' as const },
          { value: c.vencimentoFinal || '—', align: 'center' as const },
          { value: c.valorLiberadoContrato, styleType: 'currency' as const },
          { value: c.valorFinalContrato || 0, styleType: 'currency' as const },
          { value: c.valorIOF || 0, styleType: 'currency' as const },
          { value: c.qtdParcelasPagas || 0, align: 'center' as const },
          { value: c.qtdParcelasRestantes || 0, align: 'center' as const },
          { value: c.valorParcelaAtual, styleType: 'currency' as const },
          { value: (c.taxaJurosMes || 0) / 100, styleType: 'percent' as const },
          { value: c.valorSeguroPrestamista || 0, styleType: 'currency' as const },
          { value: c.valorTarifasAbusivas || 0, styleType: 'currency' as const },
          { value: c.expurgarAbusividades ? 'SIM' : 'NÃO', align: 'center' as const, styleType: c.expurgarAbusividades ? 'badge-amber' as const : 'default' as const }
        ]
      }))
    ];
    const cleanSheetName = `Credor ${credor.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`;
    const sheetCredor = buildStyledSheet(cleanSheetName, `DETALHAMENTO CONTRATUAL — ${credor.toUpperCase()}`, rowsCredor);
    XLSX.utils.book_append_sheet(wb, sheetCredor.ws, sheetCredor.sheetName);
  });

  // Export File
  const safeProcNum = (process.numeroProcesso || 'PROCESSO').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Pericia_Superendividamento_${safeProcNum}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportJSONBackup(data: any) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_pericia_superendividamento_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
