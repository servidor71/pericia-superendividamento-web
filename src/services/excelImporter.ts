import * as XLSX from 'xlsx-js-style';
import type { SavePayload } from './apiService';
import { initialProfessionalProfile, initialProcessData, initialIncomeData, initialExpenseData } from '../mockData';

export async function parseExcelBackup(file: File): Promise<SavePayload> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const profile = { ...initialProfessionalProfile };
  const process = { ...initialProcessData };
  const income = { ...initialIncomeData };
  const expenses = { ...initialExpenseData };
  const contracts: any[] = [];
  const documents: any[] = [];
  const quesitos: any[] = [];

  // Helper to get worksheet matrix as 2D array of strings/numbers
  const getSheetData = (sheetNamePartial: string): any[][] => {
    const targetName = workbook.SheetNames.find(n => 
      n.toLowerCase().includes(sheetNamePartial.toLowerCase())
    );
    if (!targetName) return [];
    const sheet = workbook.Sheets[targetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  };

  // 1. PARSE ABA 1: PERFIL PROFISSIONAL
  const sheet1Data = getSheetData('Perfil');
  sheet1Data.forEach(row => {
    if (!Array.isArray(row) || row.length < 2) return;
    const label = String(row[0] || '').toLowerCase().trim();
    const val = String(row[1] || '').trim();
    if (!val || val === 'Não informado' || val === '—') return;

    if (label.includes('nome do profissional') || label.includes('perito')) profile.nomeProfissional = val;
    else if (label.includes('papel de atuação')) profile.papel = val as any;
    else if (label.includes('registro profissional')) profile.registroProfissional = val;
    else if (label.includes('cpf / cnpj') || label.includes('cpf')) profile.cpfCnpj = val;
    else if (label.includes('escritório') || label.includes('empresa')) profile.nomeEscritorioEmpresa = val;
    else if (label.includes('e-mail')) profile.email = val;
    else if (label.includes('telefone') || label.includes('whatsapp')) profile.telefoneWhatsapp = val;
    else if (label.includes('endereço')) profile.enderecoComercial = val;
    else if (label.includes('cidade')) profile.cidadeUf = val;
  });

  // 2. PARSE ABA 2: PROCESSO E DEVEDOR
  const sheet2Data = getSheetData('Processo');
  sheet2Data.forEach(row => {
    if (!Array.isArray(row) || row.length < 2) return;
    const label = String(row[0] || '').toLowerCase().trim();
    const val = String(row[1] || '').trim();
    if (!val || val === 'Não informado' || val === '—') return;

    if (label.includes('número do processo')) process.numeroProcesso = val;
    else if (label.includes('classe processual')) process.classeProcessual = val;
    else if (label.includes('tribunal')) process.tribunal = val;
    else if (label.includes('comarca')) process.comarca = val;
    else if (label.includes('vara')) process.vara = val;
    else if (label.includes('magistrado') || label.includes('juiz')) process.magistrado = val;
    else if (label.includes('prazo do plano')) process.prazoPlanoMeses = Number(val) || 60;
    else if (label.includes('data da perícia')) process.dataPericia = val;
    else if (label.includes('status do processo')) process.statusProcesso = val as any;
    else if (label.includes('nome do devedor')) process.nomeDevedor = val;
    else if (label.includes('cpf') && label.includes('devedor')) process.cpfCnpj = val;
    else if (label.includes('profissão')) process.profissao = val;
    else if (label.includes('vínculo empregatício')) process.vinculoEmpregaticio = val;
    else if (label.includes('empregador')) process.empregador = val;
  });

  // 3. PARSE ABA 3: RLA E DESPESAS
  const sheet3Data = getSheetData('RLA');
  sheet3Data.forEach(row => {
    if (!Array.isArray(row) || row.length < 3) return;
    const label = String(row[0] || '').toLowerCase().trim();
    const rawVal = row[2];
    const numVal = typeof rawVal === 'number' ? rawVal : Number(String(rawVal).replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;

    if (label.includes('salário bruto')) income.salarioBruto = numVal;
    else if (label.includes('deduções legais')) income.rppsInss = numVal;
    else if (label.includes('moradia')) expenses.moradia = numVal;
    else if (label.includes('alimentação')) expenses.alimentacao = numVal;
    else if (label.includes('saúde') || label.includes('medicamentos')) expenses.saudeMedicamentos = numVal;
    else if (label.includes('transporte')) expenses.transporte = numVal;
    else if (label.includes('educação') || label.includes('dependentes')) expenses.educacaoDependentes = numVal;
    else if (label.includes('outras despesas essenciais')) expenses.outrasDespesasEssenciais = numVal;
    else if (label.includes('mínimo existencial configurado')) expenses.minimoExistencialConfig = numVal;
  });

  // 4. PARSE ABA 5: CONTRATOS BANCÁRIOS
  const sheet5Data = getSheetData('Contratos');
  let isHeaderFound = false;

  for (const row of sheet5Data) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const col0 = String(row[0] || '').trim();
    
    // Detect header row
    if (col0.toLowerCase().includes('credor') || col0.toLowerCase().includes('instituição')) {
      isHeaderFound = true;
      continue;
    }

    if (!isHeaderFound) continue;

    // Skip section footer / totals
    if (col0.toLowerCase().includes('total') || col0.toLowerCase().includes('resumo') || col0 === '') {
      continue;
    }

    // Parse contract row
    const credor = col0;
    const numeroContrato = String(row[1] || '').trim();
    const modalidade = String(row[2] || '').trim() || 'Empréstimo';
    const dataContrato = String(row[3] || '').trim();
    const dataPrimeiraParcela = String(row[4] || '').trim();
    const vencimentoFinal = String(row[5] || '').trim();

    const parseNum = (cell: any): number => {
      if (typeof cell === 'number') return cell;
      if (!cell) return 0;
      const str = String(cell).replace(/[^\d.,-]/g, '').replace(',', '.');
      return Number(str) || 0;
    };

    const valorLiberadoContrato = parseNum(row[6]);
    const valorFinalContrato = parseNum(row[7]);
    const valorIOF = parseNum(row[8]);
    const qtdParcelasTotal = parseNum(row[9]);
    const qtdParcelasPagas = parseNum(row[10]);
    const qtdParcelasRestantes = parseNum(row[11]);
    const valorParcelaAtual = parseNum(row[12]);
    let taxaJurosMes = parseNum(row[13]);
    if (taxaJurosMes < 1 && taxaJurosMes > 0) taxaJurosMes = taxaJurosMes * 100; // convert float percentage

    const valorSeguroPrestamista = parseNum(row[14]);
    const valorTarifasAbusivas = parseNum(row[15]);
    const expurgarStr = String(row[16] || '').toLowerCase();
    const expurgarAbusividades = expurgarStr.includes('sim') || expurgarStr.includes('true');
    const saldoDevedorRefUltimaParcela = parseNum(row[17]);

    if (credor && credor !== '—') {
      contracts.push({
        id: `ctr_imported_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        credor,
        numeroContrato: numeroContrato || '000000',
        modalidade,
        dataContrato: dataContrato !== '—' ? dataContrato : '',
        dataPrimeiraParcela: dataPrimeiraParcela !== '—' ? dataPrimeiraParcela : '',
        vencimentoFinal: vencimentoFinal !== '—' ? vencimentoFinal : '',
        valorLiberadoContrato: valorLiberadoContrato || 0,
        valorFinalContrato: valorFinalContrato || 0,
        valorIOF: valorIOF || 0,
        qtdParcelasTotal: qtdParcelasTotal || 0,
        qtdParcelasPagas: qtdParcelasPagas || 0,
        qtdParcelasRestantes: qtdParcelasRestantes || 0,
        valorParcelaAtual: valorParcelaAtual || 0,
        taxaJurosMes: taxaJurosMes || 0,
        taxaJurosAno: (taxaJurosMes || 0) * 12,
        cetMes: taxaJurosMes || 0,
        cetAno: (taxaJurosMes || 0) * 12,
        temSeguroPrestamista: valorSeguroPrestamista > 0,
        valorSeguroPrestamista: valorSeguroPrestamista || 0,
        temTarifasAbusivas: valorTarifasAbusivas > 0,
        valorTarifasAbusivas: valorTarifasAbusivas || 0,
        expurgarAbusividades,
        tipoIndiceCorrecao: 'INPC',
        fatorCorrecao7Casas: 1.0,
        saldoDevedorRefUltimaParcela: saldoDevedorRefUltimaParcela || 0,
        taxaMediaBacenMes: 1.5,
      });
    }
  }

  return {
    profile,
    process,
    income,
    expenses,
    contracts,
    documents,
    quesitos
  };
}
