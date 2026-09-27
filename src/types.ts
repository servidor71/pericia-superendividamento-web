export interface ProfessionalProfile {
  nomeProfissional: string;
  papel: 'Perito Judicial' | 'Assistente Técnico' | 'Advogado' | 'Outro';
  registroProfissional: string; // CRC/OAB/CRA
  cpfCnpj: string;
  nomeEscritorioEmpresa: string;
  email: string;
  telefoneWhatsapp: string;
  enderecoComercial: string;
  cidadeUf: string;
  logomarcaUrl: string | null; // Data URL ou imagem da logo
  pdfModeloPlanoNome: string | null;
  pdfModeloPlanoTamanho: string | null;
  pdfModeloLaudoNome: string | null;
  pdfModeloLaudoTamanho: string | null;
  pdfModeloPeticaoNome: string | null;
  pdfModeloPeticaoTamanho: string | null;
  pdfModeloParecerNome: string | null;
  pdfModeloParecerTamanho: string | null;
}

export interface ProcessDocumentItem {
  id: string;
  categoria: 'Processual' | 'Comprobatório Renda' | 'Comprobatório Despesa' | 'Extrato Dívidas' | 'Outros';
  tipoDocumento: string;
  nomeArquivo: string | null;
  tamanhoArquivo?: string | null;
  dataUpload?: string | null;
  idPaginaReferencia?: string; // ex: "ID 274529674, pág. 39"
  observacao?: string;
  rawTextContent?: string; // Conteúdo de texto extraído do arquivo (PDF, DOCX, TXT, CSV)
}

export interface ProcessData {
  id?: string;
  numeroProcesso: string;
  classeProcessual: string;
  tribunal: string;
  comarca: string;
  vara: string;
  magistrado: string;
  cidadeUf: string;
  
  // Devedor
  nomeDevedor: string;
  cpfCnpj: string;
  profissao: string;
  vinculoEmpregaticio: string;
  empregador: string;

  // Perícia
  peritoDesignado: string;
  registroProfissional: string; // CRC/CRA
  prazoPlanoMeses: number; // Padrão: 60
  dataPericia: string;
  valorCausa?: number;
  statusProcesso: 'Em Análise' | 'Laudo Concluído' | 'Audiência Agendada' | 'Aguardando Homologação';
}

export interface DescontoFolhaItem {
  id: string;
  descricao: string;
  valor: number;
  fonteDoc?: string;
}

export interface ContrachequeEmpregador {
  id: string;
  nomeEmpregador: string; // ex: TST ou GDF/SEDF
  rendimentoBruto: number;
  rppsInss: number;
  irrf: number;
  planoSaudeFolha: number;
  outrosDescontosFolha: DescontoFolhaItem[];
  fonteDoc?: string;
  fonteRpps?: string;
  fonteIrrf?: string;
  fontePlanoSaude?: string;
}

export interface CustomIncomeItem {
  id: string;
  descricao: string;
  valor: number;
  fonteDoc?: string;
}

export interface IncomeData {
  salarioBruto: number;
  rppsInss: number;
  irrf: number;
  pensaoAlimenticia: number;
  planoSaudeFolha: number;
  outrasDeducoesLegais: number;
  outrasReceitasIndividuais: CustomIncomeItem[];
  contrachequesPorEmpregador?: ContrachequeEmpregador[];
}

export interface CustomExpenseItem {
  id: string;
  descricao: string;
  valor: number;
  fonteDoc?: string;
}

export interface ExpenseData {
  moradia: number; // Aluguel / Condomínio / IPTU
  alimentacao: number; // Feira / Supermercado
  saudeMedicamentos: number; // Farmácia / Consultas extra-folha
  transporte: number; // Combustível / Transporte público
  educacaoDependentes: number; // Escola / Material
  outrasDespesasEssenciais: number; // Luz / Água / Gás / Telefone
  outrasDespesasIndividuais: CustomExpenseItem[];
  minimoExistencialConfig: number; // Decreto 11.150/2022
  justificativaMinimoExistencial: string;
  fonteMoradia?: string;
  fonteAlimentacao?: string;
  fonteSaude?: string;
  fonteTransporte?: string;
  fonteEducacao?: string;
  fonteOutrasDespesas?: string;
}

export interface Contract {
  id: string;
  credor: string;
  numeroContrato: string;
  modalidade: string; // Consignado Público, Crédito Pessoal, Cartão Parcelado, Antecipação 13º, Cheque Especial
  dataContrato: string;
  dataPrimeiraParcela?: string; // Data da 1ª Parcela (AAAA-MM-DD)
  vencimentoFinal: string; // Data da Última Parcela / Vencimento Final (AAAA-MM-DD)
  
  // Valores do Contrato
  valorLiberadoContrato: number; // Vlr. Liberado Contrato (R$)
  valorFinalContrato: number; // Vlr. Final Contrato (R$)
  valorIOF: number; // Imposto IOF (R$)
  
  qtdParcelasTotal: number;
  qtdParcelasPagas: number;
  qtdParcelasRestantes: number;
  valorParcelaAtual: number;
  taxaJurosMes: number; // % a.m.
  taxaJurosAno: number; // % a.a.
  cetMes: number;
  cetAno: number;
  
  // Análise de Venda Casada / Expurgo de Seguros
  temSeguroPrestamista: boolean;
  valorSeguroPrestamista: number;
  temTarifasAbusivas: boolean;
  valorTarifasAbusivas: number;
  expurgarAbusividades: boolean;

  // Atualização Monetária (INPC / IPCA) com 7 casas decimais
  tipoIndiceCorrecao: 'INPC' | 'IPCA';
  fatorCorrecao7Casas: number; // Ex: 1.0160724 ou 1.0375664
  dataReferenciaUltimoPagamento: string; // Data Ref. após última parcela paga
  saldoDevedorRefUltimaParcela?: number; // Saldo Devedor Ref. - após última parcela paga (R$)
  taxaMediaBacenMes: number; // % a.m. BACEN da época
}

export interface BacenRateBenchmark {
  modalidade: string;
  taxaMediaAm: number;
  taxaMediaAa: number;
}

export interface ProportionalInstallment {
  credor: string;
  numeroContrato: string;
  saldoDevedorINPC: number;
  percentualDoTotal: number; // Peso %
  parcelaRepactuadaPMT: number; // PMT_i
  totalQuitado60m: number;
}

export interface QuesitoPericial {
  id: string;
  origem: 'Juízo' | 'Autor/Devedor' | 'Réu/Credor';
  pergunta: string;
  respostaTecnica: string;
}

export interface MonetaryIndexItem {
  id: string;
  competencia: string; // Ex: "01/2025" ou "2025-01"
  ano?: number; // Ex: 2025
  mes?: string; // Ex: "JAN" ou "01"
  numeroIndiceInpc?: number; // Ex: 6816.54 (Número Índice INPC IBGE)
  indiceInpcMes: number; // Ex: 0.57 (% a.m. - Variação no Mês)
  fatorInpcAcumulado7Casas: number; // Ex: 1.0160724
  numeroIndiceIpca?: number; // Ex: 7108.74 (Número Índice IPCA IBGE)
  indiceIpcaMes: number; // Ex: 0.42 (% a.m. - Variação no Mês)
  fatorIpcaAcumulado7Casas: number; // Ex: 1.0210543
  variacao3Meses?: number; // Variação % 3 Meses (IBGE)
  variacao6Meses?: number; // Variação % 6 Meses (IBGE)
  variacaoNoAno?: number; // Variação % No Ano (IBGE)
  variacao12Meses?: number; // Variação % 12 Meses (IBGE)
  fonte: string; // "Fonte: Série Histórica - IBGE"
}

export type SubscriptionPlanType = 'trial' | 'individual' | 'escritorio' | 'master';

export interface SubscriptionConfig {
  planId: SubscriptionPlanType;
  planName: string;
  price: number;
  maxLaudosMes: number; // 2 for trial, 15 for individual, 999999 for escritorio
  laudosGeradosMes: number; // Current month count
  maxUsers: number; // 1 for trial, 1 for individual, 5 for escritorio
  activeUsersCount: number;
  customLogoAllowed: boolean;
  teamManagementAllowed: boolean;
  whatsappSupportVip: boolean;
  trialDaysRemaining: number;
  isTrialExpired: boolean;
}
