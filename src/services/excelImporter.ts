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

  const parseNum = (cell: any): number => {
    if (typeof cell === 'number') return isNaN(cell) ? 0 : cell;
    if (!cell) return 0;
    const str = String(cell).replace(/[^\d.,-]/g, '').replace(',', '.');
    const val = Number(str);
    return isNaN(val) ? 0 : val;
  };

  const cleanStr = (cell: any): string => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell).trim();
    if (str === 'Não informado' || str === 'Não informada' || str === '—' || str === 'N/A') return '';
    return str;
  };

  // Iterate over EVERY sheet in the workbook to capture all data regardless of sheet names
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (!Array.isArray(rows) || rows.length === 0) continue;

    let contractHeaderRowIdx = -1;
    let colCredorIdx = -1;
    let colContratoIdx = -1;
    let colModalidadeIdx = -1;
    let colDataContratoIdx = -1;
    let colData1ParcIdx = -1;
    let colDataUlParcIdx = -1;
    let colVlrContratadoIdx = -1;
    let colVlrFinalIdx = -1;
    let colVlrIofIdx = -1;
    let colTotalParcIdx = -1;
    let colParcPagasIdx = -1;
    let colParcRestIdx = -1;
    let colVlrParcIdx = -1;
    let colTaxaMesIdx = -1;
    let colSeguroIdx = -1;
    let colTarifasIdx = -1;
    let colExpurgarIdx = -1;
    let colSaldoDevedorIdx = -1;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      // Scan key-value pairs in row (e.g. Col 0: Label, Col 1: Value, Col 2: Alt Value)
      for (let c = 0; c < row.length - 1; c++) {
        const label = String(row[c] || '').toLowerCase().trim();
        const rawVal = row[c + 1];
        const valStr = cleanStr(rawVal);

        if (label.includes('nome do profissional') || label.includes('nome do perito')) {
          if (valStr && !profile.nomeProfissional) profile.nomeProfissional = valStr;
        } else if (label.includes('papel de atuação')) {
          if (valStr) profile.papel = valStr as any;
        } else if (label.includes('registro profissional')) {
          if (valStr && !profile.registroProfissional) profile.registroProfissional = valStr;
        } else if (label.includes('escritório') || label.includes('empresa')) {
          if (valStr && !profile.nomeEscritorioEmpresa) profile.nomeEscritorioEmpresa = valStr;
        } else if (label.includes('e-mail comercial') || label.includes('e-mail')) {
          if (valStr && !profile.email) profile.email = valStr;
        } else if (label.includes('telefone') || label.includes('whatsapp')) {
          if (valStr && !profile.telefoneWhatsapp) profile.telefoneWhatsapp = valStr;
        } else if (label.includes('endereço comercial')) {
          if (valStr && !profile.enderecoComercial) profile.enderecoComercial = valStr;
        } else if (label.includes('número do processo') || label.includes('nº processo')) {
          if (valStr && !process.numeroProcesso) process.numeroProcesso = valStr;
        } else if (label.includes('classe processual')) {
          if (valStr && !process.classeProcessual) process.classeProcessual = valStr;
        } else if (label.includes('tribunal')) {
          if (valStr && !process.tribunal) process.tribunal = valStr;
        } else if (label.includes('comarca')) {
          if (valStr && !process.comarca) process.comarca = valStr;
        } else if (label.includes('vara cível') || label.includes('vara')) {
          if (valStr && !process.vara) process.vara = valStr;
        } else if (label.includes('magistrado') || label.includes('juiz')) {
          if (valStr && !process.magistrado) process.magistrado = valStr;
        } else if (label.includes('prazo do plano')) {
          const num = parseNum(rawVal);
          if (num > 0) process.prazoPlanoMeses = num;
        } else if (label.includes('data da perícia')) {
          if (valStr && !process.dataPericia) process.dataPericia = valStr;
        } else if (label.includes('status do processo')) {
          if (valStr) process.statusProcesso = valStr as any;
        } else if (label.includes('nome do devedor')) {
          if (valStr && !process.nomeDevedor) process.nomeDevedor = valStr;
        } else if (label.includes('cpf / cnpj') || (label.includes('cpf') && label.includes('devedor'))) {
          if (valStr && !process.cpfCnpj) process.cpfCnpj = valStr;
        } else if (label.includes('profissão')) {
          if (valStr && !process.profissao) process.profissao = valStr;
        } else if (label.includes('vínculo empregatício')) {
          if (valStr && !process.vinculoEmpregaticio) process.vinculoEmpregaticio = valStr;
        } else if (label.includes('empregador')) {
          if (valStr && !process.empregador) process.empregador = valStr;
        } else if (label.includes('salário bruto') || label.includes('proventos totais')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) income.salarioBruto = num;
        } else if (label.includes('deduções legais')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) income.rppsInss = num;
        } else if (label.includes('moradia')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.moradia = num;
        } else if (label.includes('alimentação')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.alimentacao = num;
        } else if (label.includes('saúde') || label.includes('medicamentos')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.saudeMedicamentos = num;
        } else if (label.includes('transporte')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.transporte = num;
        } else if (label.includes('educação') || label.includes('dependentes')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.educacaoDependentes = num;
        } else if (label.includes('outras despesas essenciais')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.outrasDespesasEssenciais = num;
        } else if (label.includes('mínimo existencial configurado')) {
          const num = parseNum(row[c + 2] ?? rawVal);
          if (num > 0) expenses.minimoExistencialConfig = num;
        }
      }

      // Check if this row is a contract table header row
      const rowText = row.map(cell => String(cell || '').toLowerCase()).join(' | ');
      if (rowText.includes('credor') || rowText.includes('instituição') || rowText.includes('nº contrato')) {
        contractHeaderRowIdx = r;
        row.forEach((cell, idx) => {
          const headerStr = String(cell || '').toLowerCase().trim();
          if (headerStr.includes('credor') || headerStr.includes('instituição')) colCredorIdx = idx;
          else if (headerStr.includes('contrato') || headerStr.includes('ccb')) colContratoIdx = idx;
          else if (headerStr.includes('modalidade')) colModalidadeIdx = idx;
          else if (headerStr.includes('data contrato')) colDataContratoIdx = idx;
          else if (headerStr.includes('data 1ª') || headerStr.includes('1ª parcela')) colData1ParcIdx = idx;
          else if (headerStr.includes('última parcela') || headerStr.includes('vencimento')) colDataUlParcIdx = idx;
          else if (headerStr.includes('vlr. contratado') || headerStr.includes('liberado')) colVlrContratadoIdx = idx;
          else if (headerStr.includes('vlr. final') || headerStr.includes('final contrato')) colVlrFinalIdx = idx;
          else if (headerStr.includes('iof')) colVlrIofIdx = idx;
          else if (headerStr.includes('total parc')) colTotalParcIdx = idx;
          else if (headerStr.includes('parc. pagas')) colParcPagasIdx = idx;
          else if (headerStr.includes('parc. rest')) colParcRestIdx = idx;
          else if (headerStr.includes('parcela atual') || headerStr.includes('vlr. parcela')) colVlrParcIdx = idx;
          else if (headerStr.includes('taxa')) colTaxaMesIdx = idx;
          else if (headerStr.includes('seguro')) colSeguroIdx = idx;
          else if (headerStr.includes('tarifas')) colTarifasIdx = idx;
          else if (headerStr.includes('expurgar')) colExpurgarIdx = idx;
          else if (headerStr.includes('saldo devedor')) colSaldoDevedorIdx = idx;
        });
      }
    }

    // Parse contract rows under the header row if found
    if (contractHeaderRowIdx >= 0 && colCredorIdx >= 0) {
      for (let r = contractHeaderRowIdx + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        const credorStr = cleanStr(row[colCredorIdx]);
        if (!credorStr || credorStr.toLowerCase().includes('total') || credorStr.toLowerCase().includes('resumo')) {
          continue;
        }

        const numeroContrato = colContratoIdx >= 0 ? cleanStr(row[colContratoIdx]) : '000000';
        const modalidade = colModalidadeIdx >= 0 ? (cleanStr(row[colModalidadeIdx]) || 'Empréstimo') : 'Empréstimo';
        const dataContrato = colDataContratoIdx >= 0 ? cleanStr(row[colDataContratoIdx]) : '';
        const dataPrimeiraParcela = colData1ParcIdx >= 0 ? cleanStr(row[colData1ParcIdx]) : '';
        const vencimentoFinal = colDataUlParcIdx >= 0 ? cleanStr(row[colDataUlParcIdx]) : '';

        const valorLiberadoContrato = colVlrContratadoIdx >= 0 ? parseNum(row[colVlrContratadoIdx]) : 0;
        const valorFinalContrato = colVlrFinalIdx >= 0 ? parseNum(row[colVlrFinalIdx]) : 0;
        const valorIOF = colVlrIofIdx >= 0 ? parseNum(row[colVlrIofIdx]) : 0;
        const qtdParcelasTotal = colTotalParcIdx >= 0 ? parseNum(row[colTotalParcIdx]) : 0;
        const qtdParcelasPagas = colParcPagasIdx >= 0 ? parseNum(row[colParcPagasIdx]) : 0;
        const qtdParcelasRestantes = colParcRestIdx >= 0 ? parseNum(row[colParcRestIdx]) : 0;
        const valorParcelaAtual = colVlrParcIdx >= 0 ? parseNum(row[colVlrParcIdx]) : 0;
        
        let taxaJurosMes = colTaxaMesIdx >= 0 ? parseNum(row[colTaxaMesIdx]) : 0;
        if (taxaJurosMes < 1 && taxaJurosMes > 0) taxaJurosMes = taxaJurosMes * 100;

        const valorSeguroPrestamista = colSeguroIdx >= 0 ? parseNum(row[colSeguroIdx]) : 0;
        const valorTarifasAbusivas = colTarifasIdx >= 0 ? parseNum(row[colTarifasIdx]) : 0;
        const expurgarStr = colExpurgarIdx >= 0 ? String(row[colExpurgarIdx] || '').toLowerCase() : '';
        const expurgarAbusividades = expurgarStr.includes('sim') || expurgarStr.includes('true');
        const saldoDevedorRefUltimaParcela = colSaldoDevedorIdx >= 0 ? parseNum(row[colSaldoDevedorIdx]) : 0;

        // Prevent adding duplicate contracts
        const exists = contracts.some(c => c.credor === credorStr && c.numeroContrato === numeroContrato);
        if (!exists) {
          contracts.push({
            id: `ctr_imp_${Date.now()}_${contracts.length + 1}`,
            credor: credorStr,
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
    }
  }

  console.log(`✅ Excel Parser Concluído: ${contracts.length} contrato(s) recuperado(s). Devedor: ${process.nomeDevedor || 'Não identificado'}`);

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
