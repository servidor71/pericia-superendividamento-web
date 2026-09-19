import type { ProcessData, IncomeData, ExpenseData, Contract, QuesitoPericial, ProfessionalProfile, ProcessDocumentItem, MonetaryIndexItem } from './types';

// 1. Perfil Profissional Inicial Limpo
export const initialProfessionalProfile: ProfessionalProfile = {
  nomeProfissional: '',
  papel: 'Perito Judicial',
  registroProfissional: '',
  cpfCnpj: '',
  nomeEscritorioEmpresa: '',
  email: '',
  telefoneWhatsapp: '',
  enderecoComercial: '',
  cidadeUf: '',
  logomarcaUrl: null,
  pdfModeloPlanoNome: null,
  pdfModeloPlanoTamanho: null,
  pdfModeloLaudoNome: null,
  pdfModeloLaudoTamanho: null,
  pdfModeloPeticaoNome: null,
  pdfModeloPeticaoTamanho: null,
  pdfModeloParecerNome: null,
  pdfModeloParecerTamanho: null,
};

// 2. Central de Documentos Inicial Limpa
export const initialProcessDocuments: ProcessDocumentItem[] = [];

// 3. Dados do Processo e Devedor Inicial Limpo
export const initialProcessData: ProcessData = {
  numeroProcesso: '',
  classeProcessual: 'Repactuação de Dívidas (Superendividamento - Lei 14.181/2021)',
  tribunal: '',
  comarca: '',
  vara: '',
  magistrado: '',
  cidadeUf: '',
  nomeDevedor: '',
  cpfCnpj: '',
  profissao: '',
  vinculoEmpregaticio: '',
  empregador: '',
  peritoDesignado: '',
  registroProfissional: '',
  prazoPlanoMeses: 60,
  dataPericia: new Date().toISOString().split('T')[0],
  statusProcesso: 'Em Análise',
};

// 4. Renda (RLA) Inicial Limpa
export const initialIncomeData: IncomeData = {
  salarioBruto: 0,
  rppsInss: 0,
  irrf: 0,
  pensaoAlimenticia: 0,
  planoSaudeFolha: 0,
  outrasDeducoesLegais: 0,
  contrachequesPorEmpregador: [],
  outrasReceitasIndividuais: [],
};

// 5. Despesas Essenciais Inicial Limpa
export const initialExpenseData: ExpenseData = {
  moradia: 0,
  alimentacao: 0,
  saudeMedicamentos: 0,
  transporte: 0,
  educacaoDependentes: 0,
  outrasDespesasEssenciais: 0,
  outrasDespesasIndividuais: [],
  minimoExistencialConfig: 0,
  justificativaMinimoExistencial: 'Conforme Determinação Judicial / Decreto 11.150/2022',
  fonteMoradia: '',
  fonteAlimentacao: '',
  fonteSaude: '',
  fonteTransporte: '',
  fonteEducacao: '',
  fonteOutrasDespesas: '',
};

// 6. Contratos e Empréstimos Inicial Limpo
export const initialContracts: Contract[] = [];

// 7. Quesitos Periciais Inicial Limpo
export const initialQuesitos: QuesitoPericial[] = [];

// 8. Tabela de Índices Monetários Inicial Limpa
export const initialMonetaryIndices: MonetaryIndexItem[] = [];
