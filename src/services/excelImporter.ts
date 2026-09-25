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

  // Helper to parse numerical values (supports R$ 1.500,00 or float numbers)
  const parseNum = (cell: any): number => {
    if (typeof cell === 'number') return isNaN(cell) ? 0 : cell;
    if (!cell) return 0;
    let str = String(cell).trim();
    if (str === '—' || str === 'N/A' || str === '-') return 0;

    // Check if Brazilian format (1.234,56) or standard float (1234.56)
    if (str.includes(',') && str.includes('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    }
    str = str.replace(/[^\d.-]/g, '');
    const val = parseFloat(str);
    return isNaN(val) ? 0 : val;
  };

  // Helper to parse percentages (0.0185 -> 1.85 or '1,85%' -> 1.85)
  const parsePercent = (cell: any): number => {
    if (typeof cell === 'number') {
      return cell < 1 && cell > 0 ? cell * 100 : cell;
    }
    const val = parseNum(cell);
    return val < 1 && val > 0 ? val * 100 : val;
  };

  // Helper to clean string values
  const cleanStr = (cell: any): string => {
    if (cell === null || cell === undefined) return '';
    const str = String(cell).trim();
    if (str === 'Não informado' || str === 'Não informada' || str === '—' || str === 'N/A') return '';
    return str;
  };

  // Helper to find worksheet data by matching sheet names
  const getSheetMatrix = (keywords: string[]): any[][] => {
    const sheetName = workbook.SheetNames.find(n => {
      const lower = n.toLowerCase();
      return keywords.some(kw => lower.includes(kw.toLowerCase()));
    });
    if (!sheetName) return [];
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  };

  // =========================================================================
  // MÓDULO 1: PERFIL PROFISSIONAL (Aba 1: '1. Perfil Profissional')
  // =========================================================================
  const rowsM1 = getSheetMatrix(['1.', 'Perfil']);
  rowsM1.forEach(row => {
    if (!Array.isArray(row) || row.length < 2) return;
    const label = String(row[0] || '').toLowerCase().trim();
    const val = cleanStr(row[1]);
    if (!val) return;

    if (label.includes('nome do profissional') || label.includes('perito')) profile.nomeProfissional = val;
    else if (label.includes('papel de atuação')) profile.papel = val as any;
    else if (label.includes('registro profissional')) profile.registroProfissional = val;
    else if (label.includes('cpf') || label.includes('cnpj')) profile.cpfCnpj = val;
    else if (label.includes('escritório') || label.includes('empresa')) profile.nomeEscritorioEmpresa = val;
    else if (label.includes('e-mail')) profile.email = val;
    else if (label.includes('telefone') || label.includes('whatsapp')) profile.telefoneWhatsapp = val;
    else if (label.includes('endereço')) profile.enderecoComercial = val;
    else if (label.includes('cidade')) profile.cidadeUf = val;
  });

  // =========================================================================
  // MÓDULO 2: PROCESSO, DEVEDOR E DOCUMENTOS (Aba 2: '2. Processo e Devedor')
  // =========================================================================
  const rowsM2 = getSheetMatrix(['2.', 'Processo']);
  let isDocSection = false;

  rowsM2.forEach(row => {
    if (!Array.isArray(row) || row.length === 0) return;
    const col0Str = String(row[0] || '').trim();
    const label = col0Str.toLowerCase();

    // Check if entering Section 2.3 (Central de Documentos OCR)
    if (label.includes('central de documentos') || label.includes('2.3.')) {
      isDocSection = true;
      return;
    }

    if (!isDocSection) {
      if (row.length >= 2) {
        const val = cleanStr(row[1]);
        if (!val) return;

        if (label.includes('número do processo')) process.numeroProcesso = val;
        else if (label.includes('classe processual')) process.classeProcessual = val;
        else if (label.includes('tribunal')) process.tribunal = val;
        else if (label.includes('comarca')) process.comarca = val;
        else if (label.includes('vara')) process.vara = val;
        else if (label.includes('magistrado') || label.includes('juiz')) process.magistrado = val;
        else if (label.includes('prazo do plano')) process.prazoPlanoMeses = parseNum(val) || 60;
        else if (label.includes('data da perícia')) process.dataPericia = val;
        else if (label.includes('status do processo')) process.statusProcesso = val as any;
        else if (label.includes('nome do devedor')) process.nomeDevedor = val;
        else if (label.includes('cpf') && label.includes('devedor')) process.cpfCnpj = val;
        else if (label.includes('profissão')) process.profissao = val;
        else if (label.includes('vínculo empregatício')) process.vinculoEmpregaticio = val;
        else if (label.includes('empregador')) process.empregador = val;
      }
    } else {
      // Parse Document items in Section 2.3
      if (row.length >= 3 && !label.includes('categoria') && !label.includes('central')) {
        const categoria = cleanStr(row[0]) || 'Outros';
        const tipoDocumento = cleanStr(row[1]) || 'Anexo';
        const nomeArquivo = cleanStr(row[2]) || 'documento.pdf';
        const tamanhoArquivo = cleanStr(row[3]);
        const idPaginaReferencia = cleanStr(row[4]);
        const observacao = cleanStr(row[5]);

        if (nomeArquivo && nomeArquivo !== 'documentos_processo.pdf') {
          documents.push({
            id: `doc_imp_${Date.now()}_${documents.length + 1}`,
            categoria,
            tipoDocumento,
            nomeArquivo,
            tamanhoArquivo,
            idPaginaReferencia,
            observacao
          });
        }
      }
    }
  });

  // =========================================================================
  // MÓDULO 3: RLA, DESPESAS E MÍNIMO EXISTENCIAL (Aba 3: '3. RLA e Despesas')
  // =========================================================================
  const rowsM3 = getSheetMatrix(['3.', 'RLA']);
  rowsM3.forEach(row => {
    if (!Array.isArray(row) || row.length < 3) return;
    const label = String(row[0] || '').toLowerCase().trim();
    const valNum = parseNum(row[2]);

    if (label.includes('salário bruto') || label.includes('proventos totais')) {
      income.salarioBruto = valNum;
    } else if (label.includes('deduções legais')) {
      income.rppsInss = valNum;
    } else if (label.includes('moradia')) {
      expenses.moradia = valNum;
    } else if (label.includes('alimentação')) {
      expenses.alimentacao = valNum;
    } else if (label.includes('saúde') || label.includes('medicamentos')) {
      expenses.saudeMedicamentos = valNum;
    } else if (label.includes('transporte')) {
      expenses.transporte = valNum;
    } else if (label.includes('educação') || label.includes('dependentes')) {
      expenses.educacaoDependentes = valNum;
    } else if (label.includes('outras despesas essenciais')) {
      expenses.outrasDespesasEssenciais = valNum;
    } else if (label.includes('mínimo existencial configurado')) {
      expenses.minimoExistencialConfig = valNum;
    }
  });

  // =========================================================================
  // MÓDULO 5: CONTRATOS BANCÁRIOS (Aba 5: '5. Relação de Contratos')
  // =========================================================================
  const rowsM5 = getSheetMatrix(['5.', 'Contratos', 'Relação']);
  let isContractHeaderFound = false;

  for (let r = 0; r < rowsM5.length; r++) {
    const row = rowsM5[r];
    if (!Array.isArray(row) || row.length < 4) continue;

    const col0Str = String(row[0] || '').trim();
    const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' | ');

    // Detect Contract Header Row
    if (rowStr.includes('credor') || rowStr.includes('nº contrato') || rowStr.includes('modalidade')) {
      isContractHeaderFound = true;
      continue;
    }

    if (!isContractHeaderFound) continue;

    // Skip Totals or empty rows
    if (col0Str.toLowerCase().includes('total') || col0Str.toLowerCase().includes('resumo') || col0Str === '') {
      continue;
    }

    // Column Mapping based on exporters.ts Sheet 5 layout:
    // Col 0: Credor | Col 1: Nº Contrato | Col 2: Modalidade | Col 3: Data Contrato | Col 4: Data 1ª Parc
    // Col 5: Data Ul Parc | Col 6: Vlr Contratado | Col 7: Vlr Final | Col 8: IOF | Col 9: Total Parc
    // Col 10: Parc Pagas | Col 11: Parc Rest | Col 12: Parcela Atual | Col 13: Taxa a.m. (%)
    // Col 14: Seguro | Col 15: Tarifas | Col 16: Expurgar | Col 17: Saldo Devedor
    const credor = col0Str;
    const numeroContrato = cleanStr(row[1]) || '000000';
    const modalidade = cleanStr(row[2]) || 'Empréstimo';
    const dataContrato = cleanStr(row[3]);
    const dataPrimeiraParcela = cleanStr(row[4]);
    const vencimentoFinal = cleanStr(row[5]);
    const valorLiberadoContrato = parseNum(row[6]);
    const valorFinalContrato = parseNum(row[7]);
    const valorIOF = parseNum(row[8]);
    const qtdParcelasTotal = parseNum(row[9]);
    const qtdParcelasPagas = parseNum(row[10]);
    const qtdParcelasRestantes = parseNum(row[11]);
    const valorParcelaAtual = parseNum(row[12]);
    const taxaJurosMes = parsePercent(row[13]);
    const valorSeguroPrestamista = parseNum(row[14]);
    const valorTarifasAbusivas = parseNum(row[15]);
    const expurgarStr = String(row[16] || '').toLowerCase();
    const expurgarAbusividades = expurgarStr.includes('sim') || expurgarStr.includes('true');
    const saldoDevedorRefUltimaParcela = parseNum(row[17]);

    if (credor && credor !== '—') {
      contracts.push({
        id: `ctr_imp_${Date.now()}_${contracts.length + 1}`,
        credor,
        numeroContrato,
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

  // =========================================================================
  // MÓDULO 18: QUESITOS PERICIAIS E PARECER (Aba 18: '18. Quesitos & Parecer')
  // =========================================================================
  const rowsM18 = getSheetMatrix(['18.', 'Quesitos']);
  let isQuesitosHeader = false;

  rowsM18.forEach((row) => {
    if (!Array.isArray(row) || row.length < 3) return;
    const col0Str = String(row[0] || '').trim();

    if (col0Str.toLowerCase().includes('ordem') || col0Str.toLowerCase().includes('quesito')) {
      isQuesitosHeader = true;
      return;
    }

    if (isQuesitosHeader && col0Str.startsWith('Quesito')) {
      const origem = cleanStr(row[1]) || 'Juízo';
      const pergunta = cleanStr(row[2]);
      const respostaTecnica = cleanStr(row[3]);

      if (pergunta) {
        quesitos.push({
          id: `q_imp_${Date.now()}_${quesitos.length + 1}`,
          origem,
          pergunta,
          respostaTecnica
        });
      }
    }
  });

  console.log(`📊 Importação Completa por Módulo Concluída!`);
  console.log(`• Módulo 1 (Perfil): ${profile.nomeProfissional || 'OK'}`);
  console.log(`• Módulo 2 (Processo & Devedor): ${process.nomeDevedor || 'OK'} - Processo: ${process.numeroProcesso}`);
  console.log(`• Módulo 3 (RLA & Despesas): RLA ${income.salarioBruto} | Despesas Moradia ${expenses.moradia}`);
  console.log(`• Módulo 5 (Contratos): ${contracts.length} contrato(s) recarregado(s)`);
  console.log(`• Módulo 18 (Quesitos): ${quesitos.length} quesito(s) recarregado(s)`);

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
