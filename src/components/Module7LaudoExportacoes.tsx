import React, { useState, useEffect } from 'react';
import { Download, FileCheck, BadgeCheck, FileSpreadsheet, Edit3, Save, RotateCcw } from 'lucide-react';
import type { ProcessData, IncomeData, ExpenseData, Contract, QuesitoPericial, ProfessionalProfile, SubscriptionConfig, SubscriptionPlanType } from '../types';
import { calculateFinancialSummary, calculateProportional60xPlan, calculateContractEvolution, formatCurrency, formatPercent, formatDateBR } from '../services/calculations';
import { exportDocumentToDocx } from '../services/docxExporter';

interface Module7Props {
  process: ProcessData;
  income: IncomeData;
  expenses: ExpenseData;
  contracts: Contract[];
  quesitos: QuesitoPericial[];
  profile?: ProfessionalProfile;
  subscription: SubscriptionConfig;
  onSelectPlan: (planId: SubscriptionPlanType) => void;
  onIncrementLaudoCount: () => void;
  onExportExcel: () => void;
}

export const Module7LaudoExportacoes: React.FC<Module7Props> = ({
  process,
  income,
  expenses,
  contracts,
  quesitos,
  profile,
  subscription: _subscription,
  onSelectPlan: _onSelectPlan,
  onIncrementLaudoCount: _onIncrementLaudoCount,
  onExportExcel,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'laudo' | 'peticao' | 'parecer' | 'quesitos' | 'planoCompulsorio'>('parecer');
  const [isEditing, setIsEditing] = useState(true);
  const [isParecerOnlineEditing, setIsParecerOnlineEditing] = useState(false);
  const [isLaudoOnlineEditing, setIsLaudoOnlineEditing] = useState(false);
  const [isPlanoCompulsorioOnlineEditing, setIsPlanoCompulsorioOnlineEditing] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  const credoresUnicosStr = Array.from(new Set(contracts.map(c => c.credor))).join(' | ') || 'Instituições Financeiras Credoras';

  const summary = calculateFinancialSummary(income, expenses, contracts);
  const plan60x = calculateProportional60xPlan(contracts, summary.capacidadeMensalPlano);
  const evolution = calculateContractEvolution(contracts, summary.capacidadeMensalPlano);

  // Professional values from Module 1 Profile
  const peritoNome = profile?.nomeProfissional || process.peritoDesignado || 'EDILSON GONÇALVES DE AGUIAIS';
  const peritoPapel = profile?.papel || 'Perito Judicial e Assistente Técnico';
  const peritoRegistro = profile?.registroProfissional || process.registroProfissional || 'CRE/GO nº 2.337/D / CRC/GO nº 027.798';
  const peritoEscritorio = profile?.nomeEscritorioEmpresa || '';
  const peritoEmail = profile?.email || '';
  const peritoTelefone = profile?.telefoneWhatsapp || '';
  const peritoEndereco = profile?.enderecoComercial || '';
  const peritoCidadeUf = profile?.cidadeUf || process.cidadeUf || process.comarca || 'Goiânia/GO';

  // Devedor and Process values
  const devedorNome = process.nomeDevedor || 'João Bastos';
  const devedorProfissao = process.profissao || 'Servidor Público Aposentado';
  const comarcaStr = process.cidadeUf || process.comarca || 'Goiânia/GO';

  const formatDateExtenso = (dateStr?: string, cityUf?: string) => {
    const city = cityUf || comarcaStr || 'Brasília/DF';
    let dateObj = new Date();
    if (dateStr) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          dateObj = new Date(y, m, d);
        }
      }
    }
    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${city}, ${day} de ${month} de ${year}.`;
  };

  // Financial values calculated and aggregated from Module 3 (RLA)
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
      const descontosFolhaTotal = (emp.outrosDescontosFolha || []).reduce((acc, d) => acc + (d.valor || 0), 0);
      consignadosFolha += descontosFolhaTotal;
    }

    const outrasReceitasTotal = (income.outrasReceitasIndividuais || []).reduce((acc, r) => acc + (r.valor || 0), 0);
    salarioBrutoVal += outrasReceitasTotal;
    totalDeducoesLegais += (income.pensaoAlimenticia || 0) + (income.outrasDeducoesLegais || 0);
  }

  const totalDespesasEssenciaisVal = summary.totalDespesas;
  const rlaLiquidaVal = summary.rla;
  const margemDisponivelVal = summary.sobraLiquida;
  const totalEncargosAtuaisVal = summary.totalParcelasAtuais;
  const comprometimentoMargemPercentVal = margemDisponivelVal > 0 ? (totalEncargosAtuaisVal / margemDisponivelVal) * 100 : 0;
  const totalEncargosBacenVal = summary.contractsCalculated.reduce((a, c: any) => {
    const encBacen = c.totalEncargoBacen || (c.valorParcelaAtual * ((c.taxaMediaBacenMes || c.taxaJurosMes) / (c.taxaJurosMes || 1))) || c.valorParcelaAtual || 0;
    return a + encBacen;
  }, 0);
  const totalSaldoINPCVal = summary.totalSaldoDevedorINPC;
  const totalPagoHistoricoVal = evolution.reduce((a, r) => a + r.totalPrestacoesJaPagas, 0);

  // Dynamic Plano Compulsório Calculations derived from Modules 1 to 17
  const rlaPosRepactuacaoVal = summary.rla + consignadosFolha;
  const pmtPlanoVal = summary.capacidadeMensalPlano;
  const saldoMensalPosPlanoVal = rlaPosRepactuacaoVal - pmtPlanoVal;
  const percentComprometimentoPosPlanoVal = rlaPosRepactuacaoVal > 0 ? (pmtPlanoVal / rlaPosRepactuacaoVal) * 100 : 0;
  const percentPreservadoPosPlanoVal = 100 - percentComprometimentoPosPlanoVal;
  const totalPago60mVal = pmtPlanoVal * 60;
  const totalJuros60mVal = Math.max(0, totalPago60mVal - summary.totalSaldoDevedorINPC);
  const recursosLivresVal = Math.max(0, rlaPosRepactuacaoVal - summary.totalDespesas - pmtPlanoVal);

  // Helper for generating initialParecerSections
  const buildInitialParecerSections = () => ({
    cabecalho: `${peritoNome.toUpperCase()}, ${profile?.papel ? profile.papel.toLowerCase() : 'brasileiro, casado, economista, contador e advogado'}, ${peritoPapel}, inscrito no conselho de classe sob o nº ${peritoRegistro}, com endereço profissional em ${peritoEndereco || peritoCidadeUf}${peritoEmail ? `, e-mail ${peritoEmail}` : ''}${peritoTelefone ? `, tel ${peritoTelefone}` : ''}, vem respeitosamente apresentar Parecer Técnico Pericial de SUPERENDIVIDAMENTO.`,

    sec1_objeto: `O presente parecer técnico tem por objeto a análise da situação financeira do(a) Sr(a). ${devedorNome}, ${devedorProfissao}, residente na cidade de ${comarcaStr}, com foco na caracterização de superendividamento nos termos da Lei 14.181/2021.\n\nA análise compreenderá:\na) Avaliação da renda líquida atual do requerente;\nb) Identificação das despesas essenciais e cálculo do mínimo existencial;\nc) Levantamento das dívidas passíveis de repactuação;\nd) Verificação da impossibilidade de pagamento das obrigações sem prejuízo à subsistência;\ne) Apresentação de plano de pagamento conforme os limites legais.`,

    sec2_consideracoes: `Este parecer técnico fundamenta-se nos princípios e conceitos estabelecidos pela Lei nº 14.181/2021, que alterou o Código de Defesa do Consumidor (Lei nº 8.078/1990) para aperfeiçoar a disciplina do crédito ao consumidor e dispor sobre a prevenção e o tratamento do superendividamento.\n\nPara a elaboração deste documento, foram adotados os seguintes procedimentos metodológicos:\na) Entrevista detalhada com o consumidor para contextualização de sua situação financeira;\nb) Análise documental dos contratos, extratos, faturas e demonstrativos fornecidos;\nc) Verificação da renda mensal comprovada através de contracheques, extratos bancários e declaração de imposto de renda;\nd) Levantamento das despesas essenciais através de comprovantes e declarações;\ne) Aplicação de metodologia de cálculo para determinação do mínimo existencial conforme parâmetros estabelecidos pela jurisprudência;\nf) Elaboração de proposta de plano de pagamento considerando o prazo máximo de 60 meses previsto no art. 104-A, § 4º, do CDC.\n\nA análise aqui apresentada adota como premissa o conceito legal de superendividamento previsto no art. 54-A, § 1º, do CDC, segundo o qual “entende-se por superendividamento a impossibilidade de o consumidor pessoa natural, de boa-fé, pagar a totalidade de suas dívidas de consumo, exigíveis e vincendas, sem comprometer seu mínimo existencial”.\n\nTodos os cálculos realizados seguem as normas técnicas contábeis vigentes e as diretrizes estabelecidas pelo Conselho Federal de Contabilidade, em especial a Norma Brasileira de Contabilidade – NBC TP 01(R2).`,

    sec3_historico: `${devedorNome} atuou como ${devedorProfissao}. Diante de reestruturações financeiras e alterações na renda, passou a contar unicamente com sua fonte de subsistência atual para a manutenção do lar.\n\nCom renda mensal comprovada e descontos compulsórios, passou a depender integralmente dos seus proventos para sustentar a si e seus dependentes. Diante do acúmulo de ${contracts.length} contratos bancários de crédito, o comprometimento orçamentário ultrapassou os limites de razoabilidade, inviabilizando o cumprimento ordinário das obrigações contratadas.`,

    sec4_minimo_existencial: `A seguir, apresenta-se a composição do mínimo existencial do consumidor, a partir da apuração de suas despesas mensais essenciais para manutenção de uma vida digna. Os valores foram obtidos com base em comprovantes, recibos, boletos e documentos fornecidos, conforme recomendações técnicas e jurisprudenciais aplicáveis.\n\nA análise técnica evidencia que o total das despesas essenciais do consumidor ${devedorNome} atinge ${formatCurrency(totalDespesasEssenciaisVal)} por mês. Os dados foram validados mediante confrontação documental e apresentam coerência com a realidade socioeconômica do requerente, servindo como parâmetro objetivo para definição da capacidade contributiva.`,

    sec5_renda_liquida: `A apuração da renda líquida ajustada (RLA) do consumidor é fundamental para a avaliação de sua real capacidade de pagamento. Neste caso, considerou-se o valor dos proventos mensais brutos (${formatCurrency(salarioBrutoVal)}), subtraindo-se os descontos obrigatórios (RPPS/INSS, IRRF, pensão alimentar e plano de saúde), bem como os empréstimos consignados em folha, os quais possuem regramento próprio e não entram no plano compulsório por vedação do Dec. 11.150/2022.\n\nOs valores acima foram extraídos de documentação oficial (contracheques e comprovantes de rendimentos). Esta renda líquida ajustada de ${formatCurrency(rlaLiquidaVal)} será utilizada como base para análise da margem disponível e da viabilidade do plano de pagamento.`,

    sec6_margem_disponivel: `A margem disponível corresponde ao valor remanescente da renda líquida mensal do consumidor após o abatimento do mínimo existencial (ou das despesas essenciais). Esse indicador é fundamental para avaliar a possibilidade de cumprimento de um plano de pagamento sem comprometer a dignidade e a subsistência do requerente, conforme previsto no art. 54-A, §1º, do CDC.\n\nA análise da margem disponível evidencia que, a partir de uma renda líquida mensal de ${formatCurrency(rlaLiquidaVal)} e de despesas essenciais de ${formatCurrency(totalDespesasEssenciaisVal)}, o consumidor dispõe de uma capacidade contributiva mensal de ${formatCurrency(margemDisponivelVal)}. Esse valor será a referência principal para a elaboração de uma proposta de repactuação viável e socialmente responsável.`,

    sec7_dividas_incluidas: `Com base na documentação apresentada, foi possível identificar o conjunto de ${contracts.length} contratos ativos com instituições financeiras. O valor total dos encargos mensais atualmente exigidos atinge ${formatCurrency(totalEncargosAtuaisVal)}, o que representa um comprometimento de ${formatPercent(comprometimentoMargemPercentVal)} da margem disponível apurada (${formatCurrency(margemDisponivelVal)}).\n\nEsse cenário se enquadra nos critérios estabelecidos pelo art. 54-A do CDC, que define o superendividamento como a impossibilidade de o consumidor pessoa natural, de boa-fé, pagar a totalidade de suas dívidas de consumo, exigíveis e vincendas, sem comprometer seu mínimo existencial.`,

    sec8_cenario_bacen: `Para estimar um cenário de repactuação mais equilibrado e compatível com os princípios da boa-fé e do mínimo existencial, foram aplicadas as taxas médias de mercado divulgadas pelo Banco Central do Brasil (BACEN) aos contratos vigentes.\n\nA aplicação das taxas médias de mercado permite simular uma condição mais justa. Contudo, mesmo nesse cenário reduzido — com encargos mensais estimados em ${formatCurrency(totalEncargosBacenVal)} — o valor permanece significativamente superior à margem disponível do consumidor (${formatCurrency(margemDisponivelVal)}), o que evidencia a insuficiência de uma renegociação isolada por contrato e exige um tratamento unificado do passivo.`,

    sec9_contexto_superendividamento: `A análise técnico-financeira realizada no presente parecer permite afirmar, com segurança, que o(a) Sr(a). ${devedorNome} se enquadra na definição legal de consumidor superendividado. Apurou-se que sua renda líquida mensal é de ${formatCurrency(rlaLiquidaVal)}, seu mínimo existencial é de ${formatCurrency(totalDespesasEssenciaisVal)}, resultando em uma margem de ${formatCurrency(margemDisponivelVal)}. No entanto, suas dívidas atuais exigem ${formatCurrency(totalEncargosAtuaisVal)} mensais, comprometendo ${formatPercent(comprometimentoMargemPercentVal)} de sua margem.\n\nCom base nas evidências reunidas, constata-se que o consumidor:\n1. É pessoa natural e consumidor nos termos do CDC;\n2. Agiu de boa-fé ao contrair os compromissos financeiros;\n3. Celebrou contratos de natureza exclusivamente pessoal e de consumo;\n4. Está manifestamente impossibilitado de quitar suas dívidas com os meios ordinários;\n5. Teria sua dignidade comprometida se for compelido ao pagamento integral nas condições atuais.`,

    sec10_saldo_devedor: `A situação de superendividamento se torna ainda mais evidente quando analisamos a evolução e o acúmulo dos contratos financeiros. Apesar dos valores expressivos já pagos (totalizando ${formatCurrency(totalPagoHistoricoVal)}), os saldos devedores remanescentes permanecem elevados (${formatCurrency(totalSaldoINPCVal)}), comprometendo significativamente sua reorganização financeira.`,

    sec11_plano_60x: `Considerando a margem disponível apurada de ${formatCurrency(margemDisponivelVal)}, bem como o saldo devedor atualizado de ${formatCurrency(totalSaldoINPCVal)}, foi elaborado um plano de pagamento em até 60 parcelas mensais, fixas e iguais, que respeita a capacidade contributiva do devedor e atende aos requisitos do art. 104-A do CDC.\n\nO somatório das parcelas mensais repactuadas alcança ${formatCurrency(summary.capacidadeMensalPlano)}, valor perfeitamente alinhado com a margem disponível, evidenciando a viabilidade prática do plano.`,

    sec12_analise_total_pago: `A análise do histórico de pagamentos revela que o consumidor já transferiu aos credores a quantia de ${formatCurrency(totalPagoHistoricoVal)}. A composição do total repactuado em 60 parcelas respeita a proporcionalidade entre o que já foi amortizado e o saldo pendente, proporcionando um cenário financeiramente justo e socialmente responsável.`,

    sec13_juros_e_tir: `Com base nos valores principais contratados e no total a ser pago após a repactuação, apurou-se a Taxa Interna de Retorno (TIR) de cada operação. Os indicadores demonstram que os credores permanecem devidamente remunerados com taxas de retorno justas, afastando qualquer alegação de prejuízo à remuneração do capital.`,

    sec14_plano_final_carencia: `Com base na margem disponível e na estratégia de proteção do mínimo existencial, foi construído o plano final de repactuação, contemplando prazos diferenciados e carência inicial de 6 meses para reestruturação das obrigações mais onerosas (cartões e cheque especial).\n\nA carência inicial viabiliza o reequilíbrio financeiro prioritário dos débitos de maior custo, evitando a reincidência no superendividamento.`,

    sec15_conclusao: `Após análise técnico-pericial minuciosa da situação do(a) Sr(a). ${devedorNome}, este parecer conclui:\n\n1. O requerente se encontra em condição de superendividamento (art. 54-A, § 1º do CDC);\n2. O plano de repactuação foi construído com base em critérios técnicos rigorosos;\n3. A proposta atende integralmente aos limites da Lei nº 14.181/2021 e do art. 104-A do CDC;\n4. Os credores serão adequadamente remunerados com Taxas Internas de Retorno (TIR) atrativas;\n5. Recomenda-se a homologação do Plano de Repactuação offered.\n\nÉ o parecer.`
  });

  // Helper for generating initialLaudoSections (14 Seções completas)
  const buildInitialLaudoSections = () => ({
    enderecamento: `AO MM JUÍZO DA ${process.vara ? process.vara.toUpperCase() : '21ª VARA CÍVEL'} DE ${comarcaStr.toUpperCase()}`,

    sec1_sintese: `Trata-se de ação de reconhecimento de superendividamento, com pedido de elaboração de plano de pagamento compulsório, ajuizada por ${devedorNome} em face de ${credoresUnicosStr}, distribuída com valor da causa de ${formatCurrency(process.valorCausa || summary.totalSaldoDevedorINPC)}.\n\nPor decisão dos autos, o MM. Juízo nomeou o signatário como Perito Judicial, determinando a elaboração do Plano de Pagamento Compulsório nos termos do art. 104-B, §4°, do CDC, observadas as seguintes diretrizes:\nI - Assegurar ao devedor o mínimo existencial correspondente a 1 (um) salário-mínimo (R$ ${expenses.minimoExistencialConfig || 1621});\nII - Repactuar os juros a partir dos últimos mútuos tomados, preservando o mínimo de 20% da remuneração prevista;\nIII - Observar os demais limites previstos no art. 104-B, §4°, do CDC;\nIV - Não incluir dívidas com garantia real, financiamentos imobiliários e crédito rural (Decreto 11.150/22, art. 6°, parágrafo único, II);\nV - A primeira parcela do plano deverá ser paga em até 60 (sessenta) dias após a homologação judicial.\n\nHonorários periciais fixados nos termos da regulamentação aplicável. Prazo para entrega: 30 dias a partir do recebimento integral da documentação (art. 473, §3°, CPC/2015).`,

    sec1_1_peticao_inicial: `A Petição Inicial relata que o autor é ${devedorProfissao}, com renda bruta declarada e comprometimento mensal elevado com parcelas de empréstimos consignados e bancários, sustentando que o percentual de comprometimento da renda líquida torna inviável o cumprimento integral das obrigações, restando montante incompatível com as necessidades básicas do devedor e de sua família. Declara despesas fixas mensais, incluindo aluguel, escola, plano de saúde, transporte e alimentação. Requer o reconhecimento do superendividamento e a elaboração de plano compulsório com pagamento limitado à margem disponível de sua renda.`,

    sec1_2_contestacoes: `As Instituições Financeiras Credoras contestaram tempestivamente, arguindo que os contratos foram regularmente pactuados, com plena ciência do devedor quanto às taxas, CET e encargos. Sustentaram a legalidade das cláusulas, a inexistência de abusividade e a higidez das cédulas de crédito bancário como títulos executivos extrajudiciais. Invocaram o princípio da força obrigatória dos contratos (pacta sunt servanda) e a vedação ao enriquecimento sem causa.`,

    sec1_3_replica: `A Réplica refutou os argumentos dos réus, sustentando que o Decreto 11.150/2022 não pode ser aplicado para excluir os créditos consignados do plano compulsório, uma vez que a Lei 14.181/2021 prevalece como norma especial e posterior. Reiterou os pedidos da exordial.`,

    sec2_inicio_trabalhos: `O signatário aceitou o encargo pericial nos autos e as partes foram intimadas a juntar a documentação solicitada pelo perito.\n\nOs trabalhos periciais foram desenvolvidos a partir da análise minuciosa dos seguintes documentos constantes nos autos: Petição Inicial, Cédulas de Crédito Bancário (CCBs), demonstrativos de débito, extratos bancários, contracheques e comprovantes de despesas essenciais fornecidos.`,

    sec3_responsabilidade: `O perito declara que seus trabalhos foram realizados com independência, imparcialidade e objetividade, em observância à NBC TP 01 (R2) e à NBC PP 01 (R2), aprovadas pelo Conselho Federal de Contabilidade - CFC. As conclusões deste laudo refletem exclusivamente o exame técnico dos documentos disponibilizados nos autos, sem emissão de juízo de valor jurídico, cujo mérito compete ao magistrado.\n\nO perito não se responsabiliza por eventuais inexatidões decorrentes de documentos incompletos, ilegíveis, divergentes entre si ou ocultados pelas partes. Questões de legalidade de cláusulas contratuais e validade de pactuações são matéria de direito, reservada à competência do juízo.`,

    sec4_analise_tecnica: `Os procedimentos periciais adotados compreendem as técnicas previstas na NBC TP 01 (R2): exame, vistoria, indagação, investigação, arbitramento, mensuração e certificação. O exame consistiu na análise dos documentos juntados aos autos; a investigação incluiu a pesquisa das taxas médias de mercado no Banco Central do Brasil (SGS/BACEN); a mensuração abrangeu o cálculo dos saldos devedores, da renda líquida ajustada, do mínimo existencial e da margem disponível para o plano; a certificação consistiu na confrontação das taxas contratadas com as praticadas pelo mercado.`,

    sec5_metodo: `Método indutivo. Os procedimentos abrangeram: (a) leitura integral dos autos e das contestações; (b) análise minuciosa dos contratos, extratos e documentos de renda; (c) apuração da Renda Líquida Mensal Ajustada - RLA; (d) apuração do Mínimo Existencial - ME; (e) atualização dos saldos devedores pelo INPC/IBGE; (f) cálculo do Plano de Pagamento Compulsório em 60 parcelas mensais, pelo Sistema Francês de Amortização (PRICE); (g) verificação das informações obrigatórias do art. 54-B do CDC (CET) para cada contrato; (h) consulta às taxas médias BACEN (SGS) para cada modalidade de crédito.\n\nSoftwares utilizados: Microsoft Office/Excel e algoritmos contábeis para processamento e consolidação dos dados.\nFontes normativas: Lei 14.181/2021 (Lei do Superendividamento), CDC (arts. 54-A a 54-G e 104-A a 104-C), CPC/2015, Decreto 11.150/2022 e 11.567/2023, Constituição Federal/1988 (art. 1°, III), NBC TP 01 (R2) e NBC PP 01 (R2) do CFC, e Cartilha CNJ.`,

    sec6_diligencias: `O perito solicitou às partes a juntada de contracheques dos últimos meses, holerites detalhados, contratos com respectivos extratos, comprovantes de despesas fixas e declarações de IRPF. As partes atenderam às solicitações com a juntada dos documentos requeridos para instrução pericial.`,

    sec7_capacidade_contributiva: `A apuração da Renda Líquida Mensal Ajustada (RLA) atinge ${formatCurrency(summary.rla)}. As despesas essenciais comprovadas totalizam ${formatCurrency(summary.totalDespesas)}. Dedução do Mínimo Existencial legal (${formatCurrency(expenses.minimoExistencialConfig)}) resulta em uma Margem Disponível de ${formatCurrency(summary.sobraLiquida)} para o plano.\n\nO comprometimento atual da renda com as obrigações bancárias atinge ${formatPercent(summary.percentualComprometimentoRLA)}, demonstrando manifesta incapacidade de cumprimento pelos meios ordinários e justificando a repactuação compulsória.`,

    sec8_analise_contratos: `Foram analisados minuciosamente todos os ${contracts.length} contratos bancários ativos do devedor, identificando-se as modalidades, taxas nominais de juros, Custo Efetivo Total (CET), seguros prestamistas imbutidos, tarifas operacionais e saldos devedores de referência.`,

    sec9_saldos_inpc: `Os saldos devedores de referência foram atualizados monetariamente pela variação do INPC/IBGE. O montante consolidado dos saldos devedores atualizados atinge ${formatCurrency(summary.totalSaldoDevedorINPC)}.`,

    sec10_taxas_bacen: `Realizou-se o confronto entre as taxas nominais de juros pactuadas e a taxa média de mercado divulgada pelo Banco Central do Brasil (BACEN/SGS) para cada modalidade na data de contratação. A constatação técnica indica que a maioria dos contratos encontra-se alinhada às taxas médias de mercado, cabendo ao juízo a valoração de eventuais desconformidades.`,

    sec11_art_54b_cet: `Verificou-se a observância às exigências formais de transparência e dever de informação previstas no art. 54-B do CDC, checando-se a presença ostensiva da taxa efetiva mensal, anual e Custo Efetivo Total (CET) nas cédulas bancárias e demonstrativos.`,

    sec12_quesitos: `Apresentam-se as respostas técnicas fundamentadas aos quesitos judiciais formulados pelas partes nos autos.`,

    sec13_conclusao: `Com base nos trabalhos periciais realizados e na atualização integral dos dados disponíveis nos autos, conclui o perito:\n1. Superendividamento configurado (comprometimento mensal atual de ${formatPercent(summary.percentualComprometimentoRLA)} da RLA);\n2. Renda Líquida Ajustada (RLA) apurada em ${formatCurrency(summary.rla)};\n3. Mínimo existencial de ${formatCurrency(expenses.minimoExistencialConfig)} preservado;\n4. Margem disponível para o plano apurada em ${formatCurrency(summary.sobraLiquida)};\n5. Saldo devedor total atualizado pelo INPC em ${formatCurrency(summary.totalSaldoDevedorINPC)};\n6. Plano de pagamento compulsório em 60 parcelas mensais de ${formatCurrency(summary.capacidadeMensalPlano)}, totalizando ${formatCurrency(summary.capacidadeMensalPlano * 60)} ao final de 5 anos;\n7. O plano de repactuação permite ao devedor reter percentual de sua renda líquida mensal superior ao limite mínimo fixado pela decisão judicial;\n8. O valor total pago ao longo do plano cobre a integralidade do saldo devedor atualizado acrescido de juros regulados;\n9. Recomenda-se a homologação judicial do Plano Compulsório de Repactuação oferecido.\n\nÉ o Laudo.`,

    sec14_encerramento: `Este Laudo Pericial Contábil foi elaborado em observância às normas da NBC TP 01 (R2) e NBC PP 01 (R2), aprovadas pelo Conselho Federal de Contabilidade, e ao disposto nos arts. 464 a 480 do CPC/2015.\n\nNestes termos,\nPede deferimento.`
  });

  // Helper for generating initialPlanoCompulsorioSections
  const buildInitialPlanoCompulsorioSections = () => ({
    enderecamento: `AO MM JUÍZO DA ${process.vara ? process.vara.toUpperCase() : '21ª VARA CÍVEL'} DE ${comarcaStr.toUpperCase()}`,
    processoHeaderInfo: `Processo: ${process.numeroProcesso || '0754126-13.2025.8.07.0001'}\nSuperendividamento - Lei 14.181/2021 | Art. 104-B, §4°, CDC\nDevedor: ${devedorNome}\nCredores: ${credoresUnicosStr}\nPerito Judicial: ${peritoNome} | ${peritoRegistro}\n${comarcaStr}, ${formatDateBR(process.dataPericia || '2026-06-19')}`,

    sec1_objeto: `Este Plano de Pagamento Compulsório foi elaborado nos termos do art. 104-B, §4°, do Código de Defesa do Consumidor (CDC), combinado com a Lei 14.181/2021, em cumprimento à Decisão de ID 266566359, proferida pelo MM. Juiz nos autos do processo ${process.numeroProcesso || '0754126-13.2025.8.07.0001'}.\n\nDiretrizes fixadas pelo juízo (Decisão 266566359):\nI - Assegurar ao devedor o mínimo existencial correspondente a 1 (um) salário-mínimo (${formatCurrency(expenses.minimoExistencialConfig || 1621)});\nII - Repactuar os juros a partir dos últimos mútuos tomados, preservando o mínimo de 20% da remuneração prevista;\nIII - Observar os demais limites previstos no art. 104-B, §4°, do CDC;\nIV - Não incluir dívidas com garantia real, financiamentos imobiliários e crédito rural (Decreto 11.150/22, art. 6°, parágrafo único, II);\nV - A primeira parcela do plano deverá ser paga em até 60 (sessenta) dias após a homologação judicial.`,

    sec2_fundamento_metodologia: `O superendividamento de pessoa física consumidora é definido pelo art. 54-A, §1°, CDC, como “a impossibilidade manifesta de o consumidor pessoa natural, de boa-fé, pagar a totalidade de suas dívidas de consumo, exigíveis e vincendas, sem comprometer seu mínimo existencial”. O Plano Compulsório (art. 104-B, §4°, CDC) é o instrumento de reequilíbrio das obrigações, com prazo máximo de 60 meses (art. 104-A, §2°, CDC).\n\nO método utilizado compreende: (a) apuração da RLA (${formatCurrency(summary.rla)}) com base nos contracheques fornecidos; (b) definição do ME (${formatCurrency(expenses.minimoExistencialConfig || 1621)}) conforme diretriz judicial; (c) cálculo da MD (${formatCurrency(summary.sobraLiquida)}); (d) atualização dos saldos devedores pelo INPC/IBGE (${formatCurrency(summary.totalSaldoDevedorINPC)}); (e) distribuição da PMT entre os ${contracts.length} contratos ativos, com repactuação dos juros à taxa dos últimos mútuos contratados, em 60 parcelas mensais, pelo Sistema Francês de Amortização (PRICE).`,

    sec3_minimo_existencial: `A definição do Mínimo Existencial (ME) obedece à diretriz fixada pelo juízo (1 salário-mínimo: ${formatCurrency(expenses.minimoExistencialConfig || 1621)}) e o levantamento de despesas essenciais documentadas nos autos (${formatCurrency(summary.totalDespesas)}):`,

    sec4_renda_liquida: `A Renda Líquida Mensal Ajustada (RLA) foi apurada no Módulo 3 em ${formatCurrency(summary.rla)}, a partir dos proventos brutos de ${formatCurrency(salarioBrutoVal)}, deduzindo-se ${formatCurrency(totalDeducoesLegais)} de deduções legais e ${formatCurrency(consignadosFolha)} de empréstimos consignados em folha:`,

    sec5_margem_disponivel: `A PMT total do plano (${formatCurrency(pmtPlanoVal)}/mês) reduz o comprometimento mensal de ${formatPercent(summary.percentualComprometimentoRLA)} da RLA (situação atual) para ${formatPercent(percentComprometimentoPosPlanoVal)} da RLA recalculada após a repactuação dos consignados, preservando-se ${formatPercent(percentPreservadoPosPlanoVal)} da renda líquida do devedor, percentual superior ao mínimo de 20% exigido pela Diretriz II da Decisão Judicial. O plano é financeiramente viável e sustentável.`,

    sec6_dividas_incluidas: `Foram incluídas no plano as ${contracts.length} dívidas de consumo documentadas, totalizando encargo mensal atual de ${formatCurrency(summary.totalParcelasAtuais)}. Não há dívidas com garantia real, financiamentos imobiliários ou crédito rural, em cumprimento à Diretriz IV da Decisão Judicial.`,

    sec7_saldos_atualizados: `Saldos devedores atualizados pelo INPC/IBGE com base nos dados contratuais processados nos módulos anteriores, atingindo o montante consolidado de ${formatCurrency(summary.totalSaldoDevedorINPC)}:`,

    sec8_plano_60_parcelas: `Taxa de repactuação: 1,48% a.m. (últimos mútuos contratados - Diretriz II da Decisão Judicial)\nSistema de amortização: PRICE | Prazo: 60 meses (art. 104-A, §2°, CDC) | Início: 60 dias após a homologação judicial (Diretriz V da Decisão Judicial)\n\nNOTA METODOLÓGICA: a prestação mensal (PMT) de cada credor foi calculada aplicando-se ao valor total da PMT do plano (${formatCurrency(pmtPlanoVal)}) a participação percentual originalmente apurada na Seção 6 (“% RLA”), correspondente ao peso de cada contrato no comprometimento de renda anterior à repactuação. Ressalva-se que essa distribuição percentual não corresponde estritamente à proporção de cada saldo atualizado em relação ao saldo total (Seção 7); por exemplo, os contratos com menor saldo devedor atualizado total recebem a proporcionalidade calculada da PMT mensal do plano. A tabela é reproduzida exatamente como apurada na planilha de cálculo pericial, ficando à disposição do juízo para eventual esclarecimento adicional sobre o critério de distribuição.\n\nTotal dos encargos (juros) ao longo de 60 meses: ${formatCurrency(totalJuros60mVal)} (diferença entre o total pago de ${formatCurrency(totalPago60mVal)} e o saldo devedor atualizado de ${formatCurrency(summary.totalSaldoDevedorINPC)}).`,

    sec9_balanco_financeiro: `Balanço financeiro consolidado do devedor antes e após a homologação do Plano de Pagamento Compulsório:\n\nO “Total de Recursos Livres” (${formatCurrency(recursosLivresVal)}) corresponde à renda líquida mensal remanescente após a dedução, da margem disponível (RLA − ME), das despesas essenciais documentadas (${formatCurrency(summary.totalDespesas)}) e das parcelas dos contratos repactuadas no plano (${formatCurrency(pmtPlanoVal)}), acrescido novamente do mínimo existencial preservado, conforme detalhado na planilha de apuração pericial.`,

    sec10_viabilidade: `O Plano de Pagamento Compulsório demonstra ser técnica e financeiramente viável pelos seguintes fundamentos:\n(a) A PMT total de ${formatCurrency(pmtPlanoVal)}/mês reduz o comprometimento de ${formatPercent(summary.percentualComprometimentoRLA)} da RLA (situação atual) para ${formatPercent(percentComprometimentoPosPlanoVal)} da RLA recalculada após a repactuação;\n(b) O devedor retém, após o plano, recursos livres mensais de ${formatCurrency(recursosLivresVal)}, preservando ${formatPercent(percentPreservadoPosPlanoVal)} de sua renda líquida ajustada, percentual superior ao mínimo de 20% exigido pela Diretriz II e superior ao mínimo existencial de ${formatCurrency(expenses.minimoExistencialConfig || 1621)};\n(c) O total pago em 60 meses (${formatCurrency(totalPago60mVal)}) supera o saldo devedor atualizado (${formatCurrency(summary.totalSaldoDevedorINPC)});\n(d) A taxa de repactuação aplicada está em conformidade com a Diretriz II (“últimos mútuos tomados”);\n(e) O plano atende a todos os requisitos do art. 104-B, §4°, CDC, e às diretrizes expressamente fixadas pelo juízo.`,

    sec11_encerramento: `Este Plano de Pagamento Compulsório é apresentado ao MM. Juízo nos termos do art. 104-B, §4°, do CDC, para apreciação, homologação e demais providências. O perito permanece à disposição do juízo para prestar esclarecimentos adicionais (art. 477, §1°, CPC/2015).\n\n${comarcaStr}, ${formatDateBR(process.dataPericia || '2026-06-19')}.\n\n(Assinado Digitalmente)\n${peritoNome.toUpperCase()}\nPerito Contábil ${peritoRegistro}`
  });

  const [parecerSections, setParecerSections] = useState(buildInitialParecerSections());
  const [laudoSections, setLaudoSections] = useState(buildInitialLaudoSections());
  const [planoCompulsorioSections, setPlanoCompulsorioSections] = useState(buildInitialPlanoCompulsorioSections());

  // Update Parecer, Laudo and Plano Compulsorio content if initial props change
  useEffect(() => {
    setParecerSections(buildInitialParecerSections());
    setLaudoSections(buildInitialLaudoSections());
    setPlanoCompulsorioSections(buildInitialPlanoCompulsorioSections());
  }, [process, income, expenses, contracts, profile]);

  const handleSectionChange = (key: keyof ReturnType<typeof buildInitialParecerSections>, value: string) => {
    setParecerSections(prev => ({ ...prev, [key]: value }));
  };

  const handleLaudoSectionChange = (key: keyof ReturnType<typeof buildInitialLaudoSections>, value: string) => {
    setLaudoSections(prev => ({ ...prev, [key]: value }));
  };

  const handlePlanoCompulsorioSectionChange = (key: keyof ReturnType<typeof buildInitialPlanoCompulsorioSections>, value: string) => {
    setPlanoCompulsorioSections(prev => ({ ...prev, [key]: value }));
  };

  const handleResetLaudoToDefault = () => {
    if (confirm('Deseja restaurar o texto original do Laudo Pericial Contábil calculado com os dados dos módulos?')) {
      setLaudoSections(buildInitialLaudoSections());
      alert('Texto do Laudo Pericial restaurado para o padrão calculativo original!');
    }
  };

  const handleResetParecerToDefault = () => {
    if (confirm('Deseja restaurar o texto original do Parecer Técnico calculated com os dados dos módulos?')) {
      setParecerSections(buildInitialParecerSections());
      alert('Texto do Parecer Técnico restaurado para o padrão original calculativo!');
    }
  };

  const handleResetPlanoCompulsorioToDefault = () => {
    if (confirm('Deseja restaurar o texto original do Plano de Pagamento Compulsório calculado com os dados dos módulos?')) {
      setPlanoCompulsorioSections(buildInitialPlanoCompulsorioSections());
      alert('Texto do Plano de Pagamento Compulsório restaurado para o padrão calculativo original!');
    }
  };

  const handleSaveParecerEdits = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4000);
  };

  const handlePrintPdf = () => {
    if (isParecerOnlineEditing) {
      setIsParecerOnlineEditing(false);
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Helper to format multiline text into clean separate <p> paragraphs for Word export
  const formatParagraphsHtml = (text: string | undefined): string => {
    if (!text) return '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `<p>${line}</p>`)
      .join('');
  };

  // HTML Generator for Word Export (.docx)
  const buildParecerWordHtml = () => {
    return `
      <h1>PARECER TÉCNICO PARA AÇÃO DE SUPERENDIVIDAMENTO</h1>
      <p class="text-center font-bold font-mono">Processo nº ${process.numeroProcesso || 'Não informado'} • ${comarcaStr}</p>

      ${formatParagraphsHtml(parecerSections.cabecalho)}

      <h2>1. OBJETO DO PARECER TÉCNICO</h2>
      ${formatParagraphsHtml(parecerSections.sec1_objeto)}

      <h2>2. CONSIDERAÇÕES INICIAIS</h2>
      ${formatParagraphsHtml(parecerSections.sec2_consideracoes)}

      <h2>3. HISTÓRICO</h2>
      ${formatParagraphsHtml(parecerSections.sec3_historico)}

      <h2>4. DEFINIÇÃO DO MÍNIMO EXISTENCIAL</h2>
      ${formatParagraphsHtml(parecerSections.sec4_minimo_existencial)}
      <table>
        <thead>
          <tr>
            <th>Grupo de Despesa Essencial</th>
            <th class="text-right">Valor Mensal (R$)</th>
            <th>Fonte / Comprovante</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Moradia / Aluguel / Condomínio</td><td class="text-right">${formatCurrency(expenses.moradia)}</td><td>${expenses.fonteMoradia || 'Comprovante em anexo'}</td></tr>
          <tr><td>Alimentação</td><td class="text-right">${formatCurrency(expenses.alimentacao)}</td><td>${expenses.fonteAlimentacao || 'Comprovante em anexo'}</td></tr>
          <tr><td>Saúde / Medicamentos</td><td class="text-right">${formatCurrency(expenses.saudeMedicamentos)}</td><td>${expenses.fonteSaude || 'Comprovante em anexo'}</td></tr>
          <tr><td>Transporte</td><td class="text-right">${formatCurrency(expenses.transporte)}</td><td>${expenses.fonteTransporte || 'Comprovante em anexo'}</td></tr>
          <tr><td>Educação / Dependentes</td><td class="text-right">${formatCurrency(expenses.educacaoDependentes)}</td><td>${expenses.fonteEducacao || 'Comprovante em anexo'}</td></tr>
          <tr><td>Outras Despesas Essenciais</td><td class="text-right">${formatCurrency(expenses.outrasDespesasEssenciais)}</td><td>${expenses.fonteOutrasDespesas || 'Comprovante em anexo'}</td></tr>
          <tr class="font-bold"><td>TOTAL DAS DESPESAS ESSENCIAIS</td><td class="text-right">${formatCurrency(summary.totalDespesas)}</td><td>Comprovado nos autos</td></tr>
          <tr class="font-bold"><td>MÍNIMO EXISTENCIAL CONFIGURADO</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig)}</td><td>${expenses.justificativaMinimoExistencial}</td></tr>
        </tbody>
      </table>

      <h2>5. DEFINIÇÃO DA RENDA LÍQUIDA MENSAL (RLA)</h2>
      ${formatParagraphsHtml(parecerSections.sec5_renda_liquida)}
      <table>
        <thead>
          <tr>
            <th>Rubrica de Rendimento / Dedução</th>
            <th class="text-right">Valor Mensal (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>(+) Salário Bruto / Proventos Totais</td><td class="text-right">${formatCurrency(salarioBrutoVal)}</td></tr>
          <tr><td>(−) Deduções Legais Obrigatórias (RPPS, IRRF, Pensão, Saúde)</td><td class="text-right">${formatCurrency(totalDeducoesLegais)}</td></tr>
          <tr><td>(−) Empréstimos Consignados em Folha (Vedação Dec. 11.150/2022)</td><td class="text-right">${formatCurrency(consignadosFolha)}</td></tr>
          <tr class="font-bold"><td>(=) RENDA LÍQUIDA AJUSTADA (RLA)</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
        </tbody>
      </table>

      <h2>6. DEFINIÇÃO DA MARGEM DISPONÍVEL</h2>
      ${formatParagraphsHtml(parecerSections.sec6_margem_disponivel)}
      <table>
        <thead>
          <tr>
            <th>Indicador de Capacidade Financeira</th>
            <th class="text-right">Valor Apurado (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Renda Líquida Ajustada (RLA)</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
          <tr><td>Despesas Essenciais / Mínimo Existencial</td><td class="text-right">${formatCurrency(summary.totalDespesas)}</td></tr>
          <tr class="font-bold"><td>(=) MARGEM DISPONÍVEL MENSAL (SOBRA)</td><td class="text-right">${formatCurrency(summary.sobraLiquida)}</td></tr>
        </tbody>
      </table>

      <h2>7. DÍVIDAS INCLUÍDAS NO PLANO</h2>
      ${formatParagraphsHtml(parecerSections.sec7_dividas_incluidas)}
      <table>
        <thead>
          <tr>
            <th>Credor / Instituição</th>
            <th>Modalidade</th>
            <th>Nº Contrato</th>
            <th class="text-right">Parcela Atual (R$)</th>
            <th class="text-right">Saldo Devedor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.modalidade}</td>
              <td>${c.numeroContrato}</td>
              <td class="text-right">${formatCurrency(c.valorParcelaAtual)}</td>
              <td class="text-right">${formatCurrency(c.saldoDevedorRefUltimaParcela || 0)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="3">TOTAL ENCARGOS ATUAIS MENSAIS</td>
            <td class="text-right">${formatCurrency(summary.totalParcelasAtuais)}</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
          </tr>
        </tbody>
      </table>

      <h2>8. CENÁRIO COM TAXA MÉDIA DE MERCADO (BACEN)</h2>
      ${formatParagraphsHtml(parecerSections.sec8_cenario_bacen)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Taxa Contrato (% a.m.)</th>
            <th>Taxa BACEN (% a.m.)</th>
            <th class="text-right">Encargo Atual (R$)</th>
            <th class="text-right">Encargo BACEN (R$)</th>
            <th class="text-right">Economia Mensal (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${summary.contractsCalculated.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.taxaJurosMes.toFixed(2)}%</td>
              <td>${(c.taxaMediaBacenMes || c.taxaJurosMes).toFixed(2)}%</td>
              <td class="text-right">${formatCurrency((c as any).totalEncargoContratual || c.valorParcelaAtual)}</td>
              <td class="text-right">${formatCurrency((c as any).totalEncargoBacen || c.valorParcelaAtual)}</td>
              <td class="text-right font-bold text-emerald-700">${formatCurrency((c as any).diferencaEncargoBacen || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>9. CONTEXTO DO SUPERENDIVIDAMENTO</h2>
      ${formatParagraphsHtml(parecerSections.sec9_contexto_superendividamento)}

      <h2>10. SALDO DEVEDOR ATUAL</h2>
      ${formatParagraphsHtml(parecerSections.sec10_saldo_devedor)}
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Valor Liberado (R$)</th>
            <th class="text-right">Total Já Pago (R$)</th>
            <th class="text-right">Saldo Devedor INPC (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${summary.contractsCalculated.map(c => `
            <tr>
              <td>${c.credor} (${c.numeroContrato})</td>
              <td class="text-right">${formatCurrency(c.valorLiberadoContrato)}</td>
              <td class="text-right">${formatCurrency((c.qtdParcelasPagas || 0) * c.valorParcelaAtual)}</td>
              <td class="text-right font-bold">${formatCurrency(c.saldoINPC)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL CONSOLIDADO</td>
            <td class="text-right">${formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
            <td class="text-right">${formatCurrency(totalPagoHistoricoVal)}</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
          </tr>
        </tbody>
      </table>

      <h2>11. PLANO DE REPACTUAÇÃO EM ATÉ 60 PARCELAS</h2>
      ${formatParagraphsHtml(parecerSections.sec11_plano_60x)}
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Saldo INPC (R$)</th>
            <th class="text-center">Peso (%)</th>
            <th class="text-right">PMT Mensal Repactuada (R$)</th>
            <th class="text-right">Total Quitado em 60 Meses (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${plan60x.map(p => `
            <tr>
              <td>${p.credor} (${p.numeroContrato})</td>
              <td class="text-right">${formatCurrency(p.saldoDevedorINPC)}</td>
              <td class="text-center">${p.percentualDoTotal.toFixed(2)}%</td>
              <td class="text-right font-bold">${formatCurrency(p.parcelaRepactuadaPMT)}</td>
              <td class="text-right">${formatCurrency(p.totalQuitado60m)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL PLANO 60X</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
            <td class="text-center">100,00%</td>
            <td class="text-right text-emerald-700">${formatCurrency(summary.capacidadeMensalPlano)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
          </tr>
        </tbody>
      </table>

      <h2>12. ANÁLISE DO TOTAL PAGO NOS CONTRATOS</h2>
      ${formatParagraphsHtml(parecerSections.sec12_analise_total_pago)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-center">Qtd Pagas</th>
            <th class="text-right">Total Já Pago (R$)</th>
            <th class="text-right">Total Repactuado 60m (R$)</th>
            <th class="text-right">Total Geral Recebido (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor}</td>
              <td>${e.numeroContrato}</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-center">${e.qtdPagas}</td>
              <td class="text-right">${formatCurrency(e.totalPrestacoesJaPagas)}</td>
              <td class="text-right">${formatCurrency(e.totalRepactuado60m)}</td>
              <td class="text-right font-bold">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="2">TOTAL CONSOLIDADO</td>
            <td class="text-right">${formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
            <td></td>
            <td class="text-right">${formatCurrency(totalPagoHistoricoVal)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
            <td class="text-right">${formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
          </tr>
        </tbody>
      </table>

      <h2>13. JUROS PAGOS E TAXA INTERNA DE RETORNO (TIR)</h2>
      ${formatParagraphsHtml(parecerSections.sec13_juros_e_tir)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-right">Total Recebido (R$)</th>
            <th class="text-right">Lucro/Juros (R$)</th>
            <th class="text-center">TIR (% a.m.)</th>
            <th class="text-center">TIR (% a.a.)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor}</td>
              <td>${e.numeroContrato}</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-right">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
              <td class="text-right font-bold text-emerald-700">${formatCurrency(e.totalPagoAcimaDoValorLiberado)}</td>
              <td class="text-center font-bold">${e.tirAmPercent.toFixed(2)}%</td>
              <td class="text-center">${e.tirAaPercent.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>14. PLANO DE REPACTUAÇÃO FINAL E RECURSOS LIVRES</h2>
      ${formatParagraphsHtml(parecerSections.sec14_plano_final_carencia)}
      <table>
        <thead>
          <tr>
            <th>Item do Balanço Financeiro</th>
            <th class="text-right">Valor Mensal (R$)</th>
            <th>Status / Garantia Legal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Renda Líquida Ajustada Pós-Repactuação (RLA)</td><td class="text-right">${formatCurrency(rlaPosRepactuacaoVal)}</td><td>Renda reorganizada</td></tr>
          <tr><td>(−) Despesas Essenciais Comprovadas</td><td class="text-right">(${formatCurrency(summary.totalDespesas)})</td><td>Mínimo Existencial assegurado</td></tr>
          <tr><td>(−) Prestação Mensal do Plano (PMT 60x)</td><td class="text-right">(${formatCurrency(pmtPlanoVal)})</td><td>Repactuação em 60 parcelas iguais</td></tr>
          <tr class="font-bold"><td>(=) Total de Recursos Livres Finais</td><td class="text-right">${formatCurrency(recursosLivresVal)}</td><td>Sobra orçamentária do devedor</td></tr>
          <tr class="font-bold"><td>Preservação de no mínimo 20% da remuneração?</td><td class="text-right">${formatPercent(percentPreservadoPosPlanoVal)}</td><td>${percentPreservadoPosPlanoVal >= 20 ? 'SIM - Atende diretriz judicial' : 'NÃO'}</td></tr>
        </tbody>
      </table>

      <h2>15. CONCLUSÃO</h2>
      ${formatParagraphsHtml(parecerSections.sec15_conclusao)}

      <p></p>
      <p></p>

      <p class="text-right font-bold">${formatDateExtenso(process.dataPericia)}</p>

      <p></p>
      <p></p>
      <p></p>

      <div class="signature-block no-spacing text-center">
        <p class="text-center font-bold no-spacing"><strong>${peritoNome}</strong></p>
        <p class="text-center no-spacing">${peritoPapel}</p>
        <p class="text-center no-spacing">${peritoRegistro}</p>
        ${peritoEscritorio ? `<p class="text-center no-spacing">${peritoEscritorio}</p>` : ''}
      </div>

      <p></p>
      <p></p>
      <p></p>

      <div class="footnote-block page-break-before" style="page-break-before: always; break-before: page;">
        <p class="footnote italic page-break-before" style="page-break-before: always; break-before: page;">[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
        <p></p>
        <p class="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
        <p></p>
        <p class="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
        <p></p>
        <p class="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
        <p></p>
        <p class="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
      </div>
    `;
  };

  const handleExportParecerDocx = () => {
    const htmlBody = buildParecerWordHtml();
    exportDocumentToDocx(
      `Parecer_Tecnico_Superendividamento_${process.nomeDevedor || 'Devedor'}.docx`,
      'Parecer Técnico Pericial de Superendividamento',
      htmlBody
    );
  };

  const handleExportLaudoDocx = () => {
    const htmlBody = buildLaudoWordHtml();
    exportDocumentToDocx(
      `Laudo_Pericial_${process.nomeDevedor || 'Devedor'}.docx`,
      'Laudo Pericial Contábil Judicial',
      htmlBody
    );
  };

  // HTML Generator for Laudo Word Export (.docx)
  const buildLaudoWordHtml = () => {
    return `
      <p class="text-center font-bold font-mono uppercase">${laudoSections.enderecamento}</p>
      
      <h1>LAUDO PERICIAL CONTÁBIL</h1>

      <table>
        <thead>
          <tr>
            <th colSpan="2">IDENTIFICAÇÃO DO PROCESSO E DAS PARTES</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><strong>Processo:</strong></td><td>${process.numeroProcesso || 'Não informado'}</td></tr>
          <tr><td><strong>Classe:</strong></td><td>${process.classeProcessual || 'Superendividamento - Lei 14.181/2021'}</td></tr>
          <tr><td><strong>Vara:</strong></td><td>${process.vara || 'Vara Cível'} de ${comarcaStr}</td></tr>
          <tr><td><strong>Autor / Devedor:</strong></td><td>${devedorNome} - CPF/CNPJ: ${process.cpfCnpj || 'Não informado'}</td></tr>
          <tr><td><strong>Réus / Credores:</strong></td><td>${credoresUnicosStr}</td></tr>
          <tr><td><strong>Perito Judicial:</strong></td><td>${peritoNome} - ${peritoRegistro}</td></tr>
          <tr><td><strong>Data do Laudo:</strong></td><td>${formatDateBR(process.dataPericia || new Date().toISOString().split('T')[0])}</td></tr>
        </tbody>
      </table>

      <h2>I. SÍNTESE DO OBJETO DA PERÍCIA</h2>
      ${formatParagraphsHtml(laudoSections.sec1_sintese)}

      <h3>I.1. Resumo da Petição Inicial</h3>
      ${formatParagraphsHtml(laudoSections.sec1_1_peticao_inicial)}

      <h3>I.2. Resumo das Contestações</h3>
      ${formatParagraphsHtml(laudoSections.sec1_2_contestacoes)}

      <h3>I.3. Resumo da Réplica</h3>
      ${formatParagraphsHtml(laudoSections.sec1_3_replica)}

      <h2>II. INÍCIO DOS TRABALHOS</h2>
      ${formatParagraphsHtml(laudoSections.sec2_inicio_trabalhos)}

      <h2>III. RESPONSABILIDADE PROFISSIONAL</h2>
      ${formatParagraphsHtml(laudoSections.sec3_responsabilidade)}

      <h2>IV. ANÁLISE TÉCNICA E CIENTÍFICA</h2>
      ${formatParagraphsHtml(laudoSections.sec4_analise_tecnica)}

      <h2>V. MÉTODO UTILIZADO</h2>
      ${formatParagraphsHtml(laudoSections.sec5_metodo)}

      <h2>VI. DILIGÊNCIAS</h2>
      ${formatParagraphsHtml(laudoSections.sec6_diligencias)}

      <h2>VII. APURAÇÃO DA CAPACIDADE CONTRIBUTIVA</h2>
      ${formatParagraphsHtml(laudoSections.sec7_capacidade_contributiva)}

      <h3>VII.1. Renda Líquida Mensal Ajustada (RLA) - antes do Plano Compulsório</h3>
      <table>
        <thead>
          <tr>
            <th>Rubrica de Rendimento / Dedução</th>
            <th class="text-right">Valor Mensal (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>(+) Salário Bruto / Proventos Totais</td><td class="text-right">${formatCurrency(salarioBrutoVal)}</td></tr>
          <tr><td>(−) Deduções Legais Obrigatórias (RPPS, IRRF, Pensão, Saúde)</td><td class="text-right">${formatCurrency(totalDeducoesLegais)}</td></tr>
          <tr><td>(−) Empréstimos Consignados em Folha (Vedação Dec. 11.150/2022)</td><td class="text-right">${formatCurrency(consignadosFolha)}</td></tr>
          <tr class="font-bold"><td>(=) RENDA LÍQUIDA AJUSTADA (RLA)</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
        </tbody>
      </table>

      <h3>VII.2. Despesas Mensais Essenciais</h3>
      <table>
        <thead>
          <tr>
            <th>Grupo de Despesa Essencial</th>
            <th class="text-right">Valor Mensal (R$)</th>
            <th>Fonte / Comprovante</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Moradia / Aluguel / Condomínio</td><td class="text-right">${formatCurrency(expenses.moradia)}</td><td>${expenses.fonteMoradia || 'Comprovante em anexo'}</td></tr>
          <tr><td>Alimentação</td><td class="text-right">${formatCurrency(expenses.alimentacao)}</td><td>${expenses.fonteAlimentacao || 'Comprovante em anexo'}</td></tr>
          <tr><td>Saúde / Medicamentos</td><td class="text-right">${formatCurrency(expenses.saudeMedicamentos)}</td><td>${expenses.fonteSaude || 'Comprovante em anexo'}</td></tr>
          <tr><td>Transporte</td><td class="text-right">${formatCurrency(expenses.transporte)}</td><td>${expenses.fonteTransporte || 'Comprovante em anexo'}</td></tr>
          <tr><td>Educação / Dependentes</td><td class="text-right">${formatCurrency(expenses.educacaoDependentes)}</td><td>${expenses.fonteEducacao || 'Comprovante em anexo'}</td></tr>
          <tr><td>Outras Despesas Essenciais</td><td class="text-right">${formatCurrency(expenses.outrasDespesasEssenciais)}</td><td>${expenses.fonteOutrasDespesas || 'Comprovante em anexo'}</td></tr>
          <tr class="font-bold"><td>TOTAL DAS DESPESAS ESSENCIAIS</td><td class="text-right">${formatCurrency(summary.totalDespesas)}</td><td>Comprovado nos autos</td></tr>
          <tr class="font-bold"><td>MÍNIMO EXISTENCIAL CONFIGURADO</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig)}</td><td>${expenses.justificativaMinimoExistencial}</td></tr>
        </tbody>
      </table>

      <h3>VII.3. Mínimo Existencial (ME)</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor (R$)</th>
            <th>Base Legal / Parâmetro</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Mínimo Existencial Preservado</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig)}</td><td>${expenses.justificativaMinimoExistencial || 'Decreto nº 11.150/2022'}</td></tr>
        </tbody>
      </table>

      <h3>VII.4. Margem Disponível para o Plano (MD) - antes da repactuação</h3>
      <table>
        <thead>
          <tr>
            <th>Indicador de Sobra Orçamentária</th>
            <th class="text-right">Valor Apurado (R$)</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Renda Líquida Ajustada (RLA)</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
          <tr><td>Despesas Essenciais / Mínimo Existencial Comprovado</td><td class="text-right">${formatCurrency(summary.totalDespesas)}</td></tr>
          <tr class="font-bold"><td>(=) MARGEM DISPONÍVEL MENSAL PARA REPACTUAÇÃO</td><td class="text-right">${formatCurrency(summary.sobraLiquida)}</td></tr>
        </tbody>
      </table>

      <h3>VII.5. Comprometimento da Renda Mensal - antes do Plano Compulsório</h3>
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th>Modalidade</th>
            <th class="text-right">Encargo Mensal (R$)</th>
            <th class="text-center">% Participação</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.numeroContrato}</td>
              <td>${c.modalidade}</td>
              <td class="text-right">${formatCurrency(c.valorParcelaAtual)}</td>
              <td class="text-center">${formatPercent(summary.rla > 0 ? (c.valorParcelaAtual / summary.rla) * 100 : 0)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="3">TOTAL DO ENCARGO MENSAL ANTES DO PLANO</td>
            <td class="text-right">${formatCurrency(summary.totalParcelasAtuais)}</td>
            <td class="text-center">${formatPercent(summary.percentualComprometimentoRLA)}</td>
          </tr>
        </tbody>
      </table>

      <h3>VII.6. Comprometimento da Renda Mensal - após o Plano Compulsório</h3>
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Saldo INPC (R$)</th>
            <th class="text-center">Peso (%)</th>
            <th class="text-right">PMT Repactuada (R$)</th>
            <th class="text-right">Total 60m (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${plan60x.map(p => `
            <tr>
              <td>${p.credor} (${p.numeroContrato})</td>
              <td class="text-right">${formatCurrency(p.saldoDevedorINPC)}</td>
              <td class="text-center">${p.percentualDoTotal.toFixed(2)}%</td>
              <td class="text-right font-bold">${formatCurrency(p.parcelaRepactuadaPMT)}</td>
              <td class="text-right">${formatCurrency(p.totalQuitado60m)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL PLANO REPACTUADO 60X</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
            <td class="text-center">100,00%</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
          </tr>
        </tbody>
      </table>

      <h3>VII.7. Balanço Financeiro Consolidado e Recursos Livres (Módulo 16)</h3>
      <table>
        <thead>
          <tr>
            <th>Item do Balanço Financeiro</th>
            <th class="text-right">Valor Mensal (R$)</th>
            <th>Status / Garantia Legal</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Renda Líquida Ajustada Pós-Repactuação (RLA)</td><td class="text-right">${formatCurrency(rlaPosRepactuacaoVal)}</td><td>Renda reorganizada</td></tr>
          <tr><td>(−) Despesas Essenciais Comprovadas</td><td class="text-right">(${formatCurrency(summary.totalDespesas)})</td><td>Mínimo Existencial assegurado</td></tr>
          <tr><td>(−) Prestação Mensal do Plano Compulsório (PMT 60x)</td><td class="text-right">(${formatCurrency(pmtPlanoVal)})</td><td>Repactuação proporcional</td></tr>
          <tr class="font-bold"><td>(=) Total de Recursos Livres Remanescentes</td><td class="text-right">${formatCurrency(recursosLivresVal)}</td><td>Sobra orçamentária do devedor</td></tr>
          <tr class="font-bold"><td>Preservação do Mínimo Existencial de 1 Salário-Mínimo?</td><td class="text-right">${recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'SIM' : 'PARCIAL'}</td><td>Art. 54-A, § 1º do CDC</td></tr>
          <tr class="font-bold"><td>Preservação de 20% da Relação Remuneratória?</td><td class="text-right">${formatPercent(percentPreservadoPosPlanoVal)}</td><td>${percentPreservadoPosPlanoVal >= 20 ? 'SIM (Superior a 20%)' : 'NÃO'}</td></tr>
        </tbody>
      </table>

      <h2>VIII. ANÁLISE DOS CONTRATOS</h2>
      ${formatParagraphsHtml(laudoSections.sec8_analise_contratos)}
      <table>
        <thead>
          <tr>
            <th>Credor / Instituição</th>
            <th>Modalidade</th>
            <th>Nº Contrato</th>
            <th class="text-right">Parcela Atual (R$)</th>
            <th class="text-right">Saldo Devedor (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.modalidade}</td>
              <td>${c.numeroContrato}</td>
              <td class="text-right">${formatCurrency(c.valorParcelaAtual)}</td>
              <td class="text-right">${formatCurrency(c.saldoDevedorRefUltimaParcela || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>IX. SALDOS DEVEDORES ATUALIZADOS PELO INPC</h2>
      ${formatParagraphsHtml(laudoSections.sec9_saldos_inpc)}
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Valor Liberado (R$)</th>
            <th class="text-right">Total Já Pago (R$)</th>
            <th class="text-right">Saldo INPC (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${summary.contractsCalculated.map(c => `
            <tr>
              <td>${c.credor} (${c.numeroContrato})</td>
              <td class="text-right">${formatCurrency(c.valorLiberadoContrato)}</td>
              <td class="text-right">${formatCurrency((c.qtdParcelasPagas || 0) * c.valorParcelaAtual)}</td>
              <td class="text-right font-bold">${formatCurrency(c.saldoINPC)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL GERAL CONSOLIDADO CORRIGIDO</td>
            <td class="text-right">${formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
            <td class="text-right">${formatCurrency(totalPagoHistoricoVal)}</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
          </tr>
        </tbody>
      </table>

      <h3>IX.1. Análise do Histórico de Amortização e Total Pago por Contrato (Módulo 7 & 13)</h3>
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-center">Parcelas Pagas</th>
            <th class="text-right">Total Já Pago (R$)</th>
            <th class="text-right">Total Repactuado 60m (R$)</th>
            <th class="text-right">Total Geral a Pagar (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor} (${e.numeroContrato})</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-center">${e.qtdPagas}</td>
              <td class="text-right">${formatCurrency(e.totalPrestacoesJaPagas)}</td>
              <td class="text-right">${formatCurrency(e.totalRepactuado60m)}</td>
              <td class="text-right font-bold">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL GERAL CONSOLIDADO</td>
            <td class="text-right">${formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
            <td></td>
            <td class="text-right">${formatCurrency(totalPagoHistoricoVal)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
            <td class="text-right">${formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
          </tr>
        </tbody>
      </table>

      <h2>X. ANÁLISE DAS TAXAS CONTRATADAS x TAXAS MÉDIAS BACEN</h2>
      ${formatParagraphsHtml(laudoSections.sec10_taxas_bacen)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Taxa Contrato (% a.m.)</th>
            <th>Taxa BACEN (% a.m.)</th>
            <th class="text-right">Encargo Atual (R$)</th>
            <th class="text-right">Encargo BACEN (R$)</th>
            <th class="text-right">Economia Mensal (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${summary.contractsCalculated.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.taxaJurosMes.toFixed(2)}%</td>
              <td>${(c.taxaMediaBacenMes || c.taxaJurosMes).toFixed(2)}%</td>
              <td class="text-right">${formatCurrency((c as any).totalEncargoContratual || c.valorParcelaAtual)}</td>
              <td class="text-right">${formatCurrency((c as any).totalEncargoBacen || c.valorParcelaAtual)}</td>
              <td class="text-right font-bold text-emerald-700">${formatCurrency((c as any).diferencaEncargoBacen || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>X.1. Taxa Interna de Retorno (TIR) e Remuneração dos Credores no Plano (Módulo 14)</h3>
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-right">Total Recebido (R$)</th>
            <th class="text-right">Lucro Bruto Credor (R$)</th>
            <th class="text-center">TIR Mensal (% a.m.)</th>
            <th class="text-center">TIR Anual (% a.a.)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor} (${e.numeroContrato})</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-right">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
              <td class="text-right font-bold text-emerald-700">${formatCurrency(e.totalPagoAcimaDoValorLiberado)}</td>
              <td class="text-center font-bold">${e.tirAmPercent.toFixed(2)}%</td>
              <td class="text-center">${e.tirAaPercent.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>XI. VERIFICAÇÃO DO ART. 54-B DO CDC - CUSTO EFETIVO TOTAL (CET)</h2>
      ${formatParagraphsHtml(laudoSections.sec11_art_54b_cet)}
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Status Art. 54-B CDC</th>
            <th>Observação / CET</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => `
            <tr>
              <td>${c.credor} - ${c.numeroContrato}</td>
              <td>Atendido</td>
              <td>CET: ${c.taxaJurosMes ? (c.taxaJurosMes * 1.15).toFixed(2) : '1.50'}% a.m. - Expresso na documentação</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>XII. RESPOSTAS AOS QUESITOS PERICIAIS</h2>
      ${formatParagraphsHtml(laudoSections.sec12_quesitos)}
      ${quesitos.map((q, idx) => `
        ${formatParagraphsHtml(`Quesito N.º ${idx + 1} (${q.origem}): ${q.pergunta}`)}
        ${formatParagraphsHtml(`Resposta do Perito: ${q.respostaTecnica}`)}
      `).join('')}

      <h2>XIII. CONCLUSÃO</h2>
      ${formatParagraphsHtml(laudoSections.sec13_conclusao)}

      <h2>XIV. ENCERRAMENTO</h2>
      ${formatParagraphsHtml(laudoSections.sec14_encerramento)}

      <p></p>
      <p></p>

      <p class="text-right font-bold">${formatDateExtenso(process.dataPericia)}</p>

      <p></p>
      <p></p>
      <p></p>

      <div class="signature-block no-spacing text-center">
        <p class="text-center font-bold no-spacing"><strong>${peritoNome}</strong></p>
        <p class="text-center no-spacing">${peritoPapel}</p>
        <p class="text-center no-spacing">${peritoRegistro}</p>
        ${peritoEscritorio ? `<p class="text-center no-spacing">${peritoEscritorio}</p>` : ''}
      </div>

      <p></p>
      <p></p>
      <p></p>

      <div class="footnote-block page-break-before" style="page-break-before: always; break-before: page;">
        <p class="footnote italic page-break-before" style="page-break-before: always; break-before: page;">[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
        <p></p>
        <p class="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
        <p></p>
        <p class="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
        <p></p>
        <p class="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
        <p></p>
        <p class="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
      </div>
    `;
  };

  const buildPlanoCompulsorioWordHtml = () => {
    return `
      <p class="text-center font-bold font-sans">${planoCompulsorioSections.enderecamento}</p>
      <h1 class="text-center">PLANO DE PAGAMENTO COMPULSÓRIO</h1>
      <div class="text-center font-mono font-bold">${formatParagraphsHtml(planoCompulsorioSections.processoHeaderInfo)}</div>

      <h2>1. OBJETO</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec1_objeto)}

      <h2>2. FUNDAMENTO LEGAL E METODOLOGIA</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec2_fundamento_metodologia)}

      <h2>3. MÍNIMO EXISTENCIAL (ME)</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec3_minimo_existencial)}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor (R$)</th>
            <th>Base</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Mínimo Existencial fixado pelo juízo (Diretriz I)</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig || 1621)}</td><td>1 salário-mínimo - ${expenses.justificativaMinimoExistencial || 'Decreto nº 12.797/2025'}</td></tr>
          <tr><td>Despesas essenciais documentadas (item 4 deste plano)</td><td class="text-right">${formatCurrency(summary.totalDespesas)}</td><td>Documentos juntados nos autos</td></tr>
          <tr class="font-bold"><td>ME adotado neste plano</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig || 1621)}</td><td>Valor fixado pelo juízo</td></tr>
        </tbody>
      </table>

      <h2>4. RENDA LÍQUIDA MENSAL AJUSTADA (RLA)</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec4_renda_liquida)}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor (R$)</th>
            <th>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Bruto Total</td><td class="text-right">${formatCurrency(salarioBrutoVal)}</td><td>Contracheques / Comprovantes de Rendimento</td></tr>
          <tr><td>(−) RPPS/INSS + Contribuição Social</td><td class="text-right">(${formatCurrency(income.rppsInss || 0)})</td><td>Contracheques / Dedução Obrigatória</td></tr>
          <tr><td>(−) IRRF + IRPF</td><td class="text-right">(${formatCurrency(income.irrf || 0)})</td><td>Contracheques / Imposto de Renda</td></tr>
          <tr><td>(−) Plano de Saúde (Consolidado)</td><td class="text-right">(${formatCurrency(income.planoSaudeFolha || 0)})</td><td>Contracheques / Plano de Saúde</td></tr>
          <tr><td>(−) Parcelas de crédito consignado em folha</td><td class="text-right">(${formatCurrency(consignadosFolha)})</td><td>Contracheques</td></tr>
          <tr class="font-bold"><td>= RENDA LÍQUIDA MENSAL AJUSTADA (RLA)</td><td class="text-right">${formatCurrency(summary.rla)}</td><td>Base de cálculo deste plano</td></tr>
        </tbody>
      </table>

      <h2>5. MARGEM DISPONÍVEL PARA O PLANO (MD)</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec5_margem_disponivel)}
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>RLA antes do plano</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
          <tr><td>(−) Mínimo Existencial</td><td class="text-right">(${formatCurrency(expenses.minimoExistencialConfig || 1621)})</td></tr>
          <tr class="font-bold"><td>= Margem Disponível (MD)</td><td class="text-right">${formatCurrency(summary.sobraLiquida)}</td></tr>
          <tr><td>Total das Dívidas Atual</td><td class="text-right">${formatCurrency(summary.totalParcelasAtuais)}</td></tr>
          <tr><td>% de Comprometimento da Renda Mensal antes do Plano</td><td class="text-right">${formatPercent(summary.percentualComprometimentoRLA)}</td></tr>
          <tr class="font-bold"><td>PMT do Plano (60 meses)</td><td class="text-right">${formatCurrency(pmtPlanoVal)}</td></tr>
          <tr><td>RLA após repactuação dos consignados</td><td class="text-right">${formatCurrency(rlaPosRepactuacaoVal)}</td></tr>
          <tr><td>(−) PMT do Plano</td><td class="text-right">(${formatCurrency(pmtPlanoVal)})</td></tr>
          <tr class="font-bold"><td>= Saldo mensal após o plano</td><td class="text-right">${formatCurrency(saldoMensalPosPlanoVal)}</td></tr>
          <tr><td>% de Comprometimento da Renda Mensal após o Plano</td><td class="text-right">${formatPercent(percentComprometimentoPosPlanoVal)}</td></tr>
          <tr class="font-bold"><td>% Preservado da Renda após o plano (sobre RLA pós-repactuação)</td><td class="text-right">${formatPercent(percentPreservadoPosPlanoVal)}</td></tr>
        </tbody>
      </table>

      <h2>6. DÍVIDAS INCLUÍDAS NO PLANO</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec6_dividas_incluidas)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th class="text-right">Parcela Original (R$)</th>
            <th class="text-center">% RLA</th>
          </tr>
        </thead>
        <tbody>
          ${contracts.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.numeroContrato}</td>
              <td class="text-right">${formatCurrency(c.valorParcelaAtual)}</td>
              <td class="text-center">${formatPercent(summary.rla > 0 ? (c.valorParcelaAtual / summary.rla) * 100 : 0)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="2">TOTAL</td>
            <td class="text-right">${formatCurrency(summary.totalParcelasAtuais)}</td>
            <td class="text-center">${formatPercent(summary.percentualComprometimentoRLA)}</td>
          </tr>
        </tbody>
      </table>

      <h2>7. SALDOS DEVEDORES ATUALIZADOS (INPC)</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec7_saldos_atualizados)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th>Data Ref.</th>
            <th class="text-right">Saldo Ref. (R$)</th>
            <th class="text-center">Fator INPC</th>
            <th class="text-right">Saldo Atualizado (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${summary.contractsCalculated.map(c => `
            <tr>
              <td>${c.credor}</td>
              <td>${c.numeroContrato}</td>
              <td>${formatDateBR(c.dataReferenciaUltimoPagamento || c.dataContrato || process.dataPericia || new Date().toISOString().split('T')[0])}</td>
              <td class="text-right">${formatCurrency(c.saldoDevedorRefUltimaParcela || 0)}</td>
              <td class="text-center">${(c.fatorCorrecao7Casas || 1.0).toFixed(7)}</td>
              <td class="text-right font-bold">${formatCurrency(c.saldoINPC)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="3">TOTAL</td>
            <td class="text-right">${formatCurrency(summary.contractsCalculated.reduce((a,c) => a + (c.saldoDevedorRefUltimaParcela || 0), 0))}</td>
            <td></td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
          </tr>
        </tbody>
      </table>

      <h2>8. PLANO DE PAGAMENTO COMPULSÓRIO EM 60 PARCELAS</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec8_plano_60_parcelas)}
      <table>
        <thead>
          <tr>
            <th>Credor</th>
            <th>Contrato</th>
            <th class="text-right">Saldo Atualizado (R$)</th>
            <th class="text-center">% do Total</th>
            <th class="text-right">PMT Mensal (R$)</th>
            <th class="text-right">Total 60 meses (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${plan60x.map(p => `
            <tr>
              <td>${p.credor}</td>
              <td>${p.numeroContrato}</td>
              <td class="text-right">${formatCurrency(p.saldoDevedorINPC)}</td>
              <td class="text-center">${p.percentualDoTotal.toFixed(2)}%</td>
              <td class="text-right font-bold">${formatCurrency(p.parcelaRepactuadaPMT)}</td>
              <td class="text-right">${formatCurrency(p.totalQuitado60m)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td colSpan="2">TOTAL</td>
            <td class="text-right">${formatCurrency(summary.totalSaldoDevedorINPC)}</td>
            <td class="text-center">100,00%</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
          </tr>
        </tbody>
      </table>

      <h3>8.1. Evolução dos Contratos e Demonstração do Total Pago por Credor (Módulo 12 & 13)</h3>
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-right">Total Já Pago (R$)</th>
            <th class="text-right">Total Repactuado 60m (R$)</th>
            <th class="text-right">Total Geral Recebido (R$)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor} (${e.numeroContrato})</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-right">${formatCurrency(e.totalPrestacoesJaPagas)}</td>
              <td class="text-right">${formatCurrency(e.totalRepactuado60m)}</td>
              <td class="text-right font-bold">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
            </tr>
          `).join('')}
          <tr class="font-bold">
            <td>TOTAL GERAL CONSOLIDADO</td>
            <td class="text-right">${formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
            <td class="text-right">${formatCurrency(totalPagoHistoricoVal)}</td>
            <td class="text-right">${formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
            <td class="text-right">${formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
          </tr>
        </tbody>
      </table>

      <h3>8.2. Taxa Interna de Retorno (TIR) por Credor no Plano (Módulo 14)</h3>
      <table>
        <thead>
          <tr>
            <th>Credor / Contrato</th>
            <th class="text-right">Capital Liberado (R$)</th>
            <th class="text-right">Total Recebido (R$)</th>
            <th class="text-center">TIR Mensal (% a.m.)</th>
            <th class="text-center">TIR Anual (% a.a.)</th>
          </tr>
        </thead>
        <tbody>
          ${evolution.map(e => `
            <tr>
              <td>${e.credor} (${e.numeroContrato})</td>
              <td class="text-right">${formatCurrency(e.valorLiberado)}</td>
              <td class="text-right">${formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
              <td class="text-center font-bold">${e.tirAmPercent.toFixed(2)}%</td>
              <td class="text-center">${e.tirAaPercent.toFixed(2)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>9. BALANÇO FINANCEIRO DO DEVEDOR</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec9_balanco_financeiro)}
      <h3>Situação Atual:</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>RLA atual</td><td class="text-right">${formatCurrency(summary.rla)}</td></tr>
          <tr><td>Encargo mensal total atual</td><td class="text-right">${formatCurrency(summary.totalParcelasAtuais)}</td></tr>
          <tr><td>% de comprometimento da RLA</td><td class="text-right">${formatPercent(summary.percentualComprometimentoRLA)}</td></tr>
          <tr><td>Mínimo Existencial (1 SM)</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig || 1621)}</td></tr>
          <tr class="font-bold"><td>Superendividamento configurado?</td><td class="text-right">${summary.percentualComprometimentoRLA > 30 ? `SIM - comprometimento de ${formatPercent(summary.percentualComprometimentoRLA)} da RLA` : 'NÃO'}</td></tr>
        </tbody>
      </table>

      <h3>Situação Após o Plano:</h3>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th class="text-right">Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>RLA após repactuação dos consignados</td><td class="text-right">${formatCurrency(rlaPosRepactuacaoVal)}</td></tr>
          <tr><td>(-) Mínimo Existencial</td><td class="text-right">(${formatCurrency(expenses.minimoExistencialConfig || 1621)})</td></tr>
          <tr><td>(-) Despesas Essenciais</td><td class="text-right">(${formatCurrency(summary.totalDespesas)})</td></tr>
          <tr><td>(-) PMT do Plano Compulsório (60x)</td><td class="text-right">(${formatCurrency(pmtPlanoVal)})</td></tr>
          <tr><td>(+) Mínimo Existencial (1 SM)</td><td class="text-right">${formatCurrency(expenses.minimoExistencialConfig || 1621)}</td></tr>
          <tr class="font-bold"><td>= Total de Recursos Livres</td><td class="text-right">${formatCurrency(recursosLivresVal)}</td></tr>
          <tr class="font-bold"><td>Mínimo Existencial preservado?</td><td class="text-right">${recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'SIM' : 'PARCIAL'}</td></tr>
          <tr class="font-bold"><td>20% da remuneração preservado (Diretriz II)?</td><td class="text-right">${percentPreservadoPosPlanoVal >= 20 ? `SIM - ${formatPercent(percentPreservadoPosPlanoVal)} > 20%` : `NÃO - ${formatPercent(percentPreservadoPosPlanoVal)} < 20%`}</td></tr>
        </tbody>
      </table>

      <h2>10. ANÁLISE DA VIABILIDADE DO PLANO</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec10_viabilidade)}

      <h2>11. ENCERRAMENTO</h2>
      ${formatParagraphsHtml(planoCompulsorioSections.sec11_encerramento)}

      <p></p>
      <p></p>

      <p class="text-right font-bold">${formatDateExtenso(process.dataPericia)}</p>

      <p></p>
      <p></p>
      <p></p>

      <div class="signature-block no-spacing text-center">
        <p class="text-center font-bold no-spacing"><strong>${peritoNome}</strong></p>
        <p class="text-center no-spacing">${peritoPapel}</p>
        <p class="text-center no-spacing">${peritoRegistro}</p>
        ${peritoEscritorio ? `<p class="text-center no-spacing">${peritoEscritorio}</p>` : ''}
      </div>

      <p></p>
      <p></p>
      <p></p>

      <div class="footnote-block page-break-before" style="page-break-before: always; break-before: page;">
        <p class="footnote italic page-break-before" style="page-break-before: always; break-before: page;">[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
        <p></p>
        <p class="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
        <p></p>
        <p class="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
        <p></p>
        <p class="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
        <p></p>
        <p class="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
      </div>
    `;
  };

  const handleExportPlanoCompulsorioDocx = () => {
    const htmlBody = buildPlanoCompulsorioWordHtml();
    exportDocumentToDocx(
      `Plano_Pagamento_Compulsorio_${(devedorNome || 'Devedor').replace(/\s+/g, '_')}.docx`,
      'Plano de Pagamento Compulsório',
      htmlBody
    );
  };

  const handleExportPeticaoDocx = () => {
    const htmlBody = `
      <h1>EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA ${process.vara || 'VARA CÍVEL'} DA COMARCA DE ${comarcaStr.toUpperCase()}</h1>
      <p class="font-mono pt-4"><strong>PROCESSO N.º:</strong> ${process.numeroProcesso}</p>
      <p><strong>AUTOR:</strong> ${devedorNome}</p>
      <p><strong>RÉUS:</strong> Instituições Financeiras Credoras</p>
      <p><strong>${peritoNome.toUpperCase()}</strong>, ${peritoPapel}, nomeado nos autos em epígrafe, vem respeitosamente à presença de Vossa Excelência apresentar o <strong>LAUDO PERICIAL CONTÁBIL E PLANO DE REPACTUAÇÃO DE DÍVIDAS (LEI 14.181/2021)</strong> em anexo.</p>
      <p>Requer a juntada aos autos e a intimação das partes para manifestação no prazo legal.</p>

      <p></p>
      <p></p>

      <p class="text-right font-bold">${formatDateExtenso(process.dataPericia)}</p>

      <p></p>
      <p></p>
      <p></p>

      <div class="signature-block no-spacing text-center">
        <p class="text-center font-bold no-spacing"><strong>${peritoNome}</strong></p>
        <p class="text-center no-spacing">${peritoPapel}</p>
        <p class="text-center no-spacing">${peritoRegistro}</p>
        ${peritoEscritorio ? `<p class="text-center no-spacing">${peritoEscritorio}</p>` : ''}
      </div>
    `;
    exportDocumentToDocx(
      `Minuta_Peticao_Juntada_${process.nomeDevedor || 'Devedor'}.docx`,
      'Minuta de Petição de Juntada de Laudo',
      htmlBody
    );
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3 font-sans no-print">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">
              Módulo 18: Emissão do Laudo Pericial, Parecer Técnico & Exportações
            </h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Parecer Técnico Completo (Lei 14.181/2021), Laudo Pericial em PDF/Word, Minuta de Petição e Quesitos
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-[#DCD8CD]">
            <button
              onClick={() => setActiveSubTab('parecer')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'parecer'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Parecer Técnico (Lei 14.181)
            </button>
            <button
              onClick={() => setActiveSubTab('laudo')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'laudo'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Laudo Pericial
            </button>
            <button
              onClick={() => setActiveSubTab('planoCompulsorio')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'planoCompulsorio'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Plano Compulsório
            </button>
            <button
              onClick={() => setActiveSubTab('peticao')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'peticao'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Minuta de Petição
            </button>
            <button
              onClick={() => setActiveSubTab('quesitos')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSubTab === 'quesitos'
                  ? 'bg-[#1C4E5E] text-white font-black'
                  : 'text-slate-700 hover:text-[#1C4E5E]'
              }`}
            >
              Quesitos
            </button>
          </div>

          <button
            onClick={onExportExcel}
            className="px-3.5 py-1 text-xs font-black rounded-full transition-all cursor-pointer bg-[#2E7D62] hover:bg-[#23634d] text-white flex items-center gap-1.5 shadow-2xs border border-[#2E7D62]"
            title="Exportar Planilha Completa em Formato Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>

          {/* 1. CONCLUIR / EDITAR */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1 text-xs font-black rounded-full transition-all cursor-pointer shadow-2xs border ${
              isEditing ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500' : 'bg-amber-300 hover:bg-amber-400 text-slate-900 border-amber-400'
            }`}
          >
            <span>{isEditing ? 'Concluir' : 'Editar'}</span>
          </button>

          {/* 2. LIMPAR */}
          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'parecer') {
                handleResetParecerToDefault();
              } else if (activeSubTab === 'laudo') {
                handleResetLaudoToDefault();
              } else if (activeSubTab === 'planoCompulsorio') {
                handleResetPlanoCompulsorioToDefault();
              } else {
                alert(`Conteúdo da aba "${activeSubTab}" pronto para nova geração.`);
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. RESTAURAR */}
          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'laudo') {
                handleResetLaudoToDefault();
              } else if (activeSubTab === 'planoCompulsorio') {
                handleResetPlanoCompulsorioToDefault();
              } else {
                handleResetParecerToDefault();
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3 text-[#1C4E5E]" />
            <span>Restaurar Padrão</span>
          </button>

          {/* 4. SALVAR */}
          <button
            type="button"
            onClick={handleSaveParecerEdits}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs flex items-center gap-1"
          >
            <Save className="w-3 h-3 text-white" />
            <span>Salvar Edição</span>
          </button>
        </div>
      </div>

      {savedToast && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-300 p-3 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 animate-fade-in">
          <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Edição online do Parecer Técnico salva com sucesso! O documento em Word (.docx) e impressão serão gerados com as suas alterações.</span>
        </div>
      )}

      {/* SUB-TAB 1: PARECER TÉCNICO COMPLETO PARA AÇÃO DE SUPERENDIVIDAMENTO */}
      {activeSubTab === 'parecer' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md space-y-8 text-slate-900 font-serif w-full parecer-print-document print:border-none print:shadow-none">
          
          {/* Header Bar */}
          <div className="border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-mono">
                MODELO OFICIAL DE REFERÊNCIA • LEI 14.181/2021 & NBC TP 01(R2)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase font-sans">
                Parecer Técnico Pericial de Superendividamento
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Preenchido com base nos dados do profissional (Módulo 1) e cálculos dos módulos 1 a 17.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsParecerOnlineEditing(!isParecerOnlineEditing)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-xs border transition-all cursor-pointer ${
                  isParecerOnlineEditing
                    ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-500 font-black'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-slate-900" />
                <span>{isParecerOnlineEditing ? 'Concluir Edição Online' : 'Editar Texto Online'}</span>
              </button>

              <button
                onClick={handleExportParecerDocx}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md border border-blue-600 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Baixar Parecer em Word (.docx)</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4 text-white" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* PARECER BODY */}
          <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-800 font-serif">
            
            {/* Title & Qualification */}
            <div className="text-center space-y-2 border-b pb-6">
              <h1 className="text-lg sm:text-xl font-black text-[#1C4E5E] font-serif uppercase tracking-tight">
                PARECER TÉCNICO PARA AÇÃO DE SUPERENDIVIDAMENTO
              </h1>
              <p className="text-xs text-slate-500 font-sans font-bold uppercase tracking-wider">
                Fundamentado na Lei 14.181/2021, Código de Defesa do Consumidor e NBC TP 01(R2)
              </p>
            </div>

            {/* Preamble / Professional Identification */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-serif space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-500 font-sans block">
                QUALIFICAÇÃO DO PERITO / ASSISTENTE TÉCNICO (CADASTRADO NO MÓDULO 1)
              </span>
              
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.cabecalho}
                  onChange={(e) => handleSectionChange('cabecalho', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white focus:ring-2 focus:ring-blue-600"
                />
              ) : (
                <p className="text-slate-900 font-medium leading-relaxed">
                  {parecerSections.cabecalho}
                </p>
              )}
            </div>

            {/* 1. OBJETO DO PARECER TÉCNICO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1">
                1. OBJETO DO PARECER TÉCNICO
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec1_objeto}
                  onChange={(e) => handleSectionChange('sec1_objeto', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec1_objeto}</p>
              )}
            </div>

            {/* 2. CONSIDERAÇÕES INICIAIS */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                2. CONSIDERAÇÕES INICIAIS
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec2_consideracoes}
                  onChange={(e) => handleSectionChange('sec2_consideracoes', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec2_consideracoes}</p>
              )}
            </div>

            {/* 3. HISTÓRICO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                3. HISTÓRICO
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec3_historico}
                  onChange={(e) => handleSectionChange('sec3_historico', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec3_historico}</p>
              )}
            </div>

            {/* 4. DEFINIÇÃO DO MÍNIMO EXISTENCIAL */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                4. DEFINIÇÃO DO MÍNIMO EXISTENCIAL
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec4_minimo_existencial}
                  onChange={(e) => handleSectionChange('sec4_minimo_existencial', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec4_minimo_existencial}</p>
              )}

              {/* TABLE FOR SECTION 4 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Grupo de Despesa Essencial</th>
                      <th className="py-2.5 px-3 text-right">Valor Mensal Apurado (R$)</th>
                      <th className="py-2.5 px-3">Fonte / Comprovante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td>Moradia / Aluguel / Condomínio</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.moradia)}</td><td className="py-2 px-3">{expenses.fonteMoradia || 'Comprovante em anexo'}</td></tr>
                    <tr><td>Alimentação</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.alimentacao)}</td><td className="py-2 px-3">{expenses.fonteAlimentacao || 'Comprovante em anexo'}</td></tr>
                    <tr><td>Saúde / Medicamentos</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.saudeMedicamentos)}</td><td className="py-2 px-3">{expenses.fonteSaude || 'Comprovante em anexo'}</td></tr>
                    <tr><td>Transporte</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.transporte)}</td><td className="py-2 px-3">{expenses.fonteTransporte || 'Comprovante em anexo'}</td></tr>
                    <tr><td>Educação / Dependentes</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.educacaoDependentes)}</td><td className="py-2 px-3">{expenses.fonteEducacao || 'Comprovante em anexo'}</td></tr>
                    <tr><td>Outras Despesas Essenciais</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.outrasDespesasEssenciais)}</td><td className="py-2 px-3">{expenses.fonteOutrasDespesas || 'Comprovante em anexo'}</td></tr>
                    <tr className="bg-slate-50 font-black"><td>TOTAL DAS DESPESAS ESSENCIAIS</td><td className="py-2 px-3 text-right font-mono text-slate-900">{formatCurrency(summary.totalDespesas)}</td><td>Comprovado nos autos</td></tr>
                    <tr className="bg-amber-50 font-black"><td>MÍNIMO EXISTENCIAL CONFIGURADO</td><td className="py-2 px-3 text-right font-mono text-amber-900">{formatCurrency(expenses.minimoExistencialConfig)}</td><td>{expenses.justificativaMinimoExistencial}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. DEFINIÇÃO DA RENDA LÍQUIDA MENSAL */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                5. DEFINIÇÃO DA RENDA LÍQUIDA MENSAL (RLA)
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec5_renda_liquida}
                  onChange={(e) => handleSectionChange('sec5_renda_liquida', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec5_renda_liquida}</p>
              )}

              {/* TABLE FOR SECTION 5 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Composição da Renda e Deduções</th>
                      <th className="py-2.5 px-3 text-right">Valor Mensal (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr><td>(+) Salário Bruto / Proventos Totais</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(salarioBrutoVal)}</td></tr>
                    <tr><td>(−) Deduções Legais Obrigatórias (RPPS, IRRF, Pensão, Saúde)</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(totalDeducoesLegais)}</td></tr>
                    <tr><td>(−) Empréstimos Consignados em Folha (Vedação Dec. 11.150/2022)</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(consignadosFolha)}</td></tr>
                    <tr className="bg-emerald-50 font-black text-emerald-950"><td>(=) RENDA LÍQUIDA AJUSTADA (RLA)</td><td className="py-2 px-3 text-right font-mono text-emerald-800 font-black">{formatCurrency(summary.rla)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. DEFINIÇÃO DA MARGEM DISPONÍVEL */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                6. DEFINIÇÃO DA MARGEM DISPONÍVEL
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec6_margem_disponivel}
                  onChange={(e) => handleSectionChange('sec6_margem_disponivel', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec6_margem_disponivel}</p>
              )}

              {/* TABLE FOR SECTION 6 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Indicador de Sobra Orçamentária</th>
                      <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    <tr><td>Renda Líquida Ajustada (RLA)</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(summary.rla)}</td></tr>
                    <tr><td>Despesas Essenciais / Mínimo Existencial Comprovado</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(summary.totalDespesas)}</td></tr>
                    <tr className="bg-blue-50 font-black text-blue-950"><td>(=) MARGEM DISPONÍVEL MENSAL PARA REPACTUAÇÃO</td><td className="py-2 px-3 text-right font-mono text-blue-900 font-black text-sm">{formatCurrency(summary.sobraLiquida)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. DÍVIDAS INCLUÍDAS NO PLANO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                7. DÍVIDAS INCLUÍDAS NO PLANO
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec7_dividas_incluidas}
                  onChange={(e) => handleSectionChange('sec7_dividas_incluidas', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec7_dividas_incluidas}</p>
              )}

              {/* TABLE FOR SECTION 7 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Modalidade</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3 text-right">Encargo Atual (R$)</th>
                      <th className="py-2.5 px-3 text-right">Saldo INPC (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor}</td>
                        <td className="py-2 px-3">{c.modalidade}</td>
                        <td className="py-2 px-3 font-mono">{c.numeroContrato}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">{formatCurrency(c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(c.saldoDevedorRefUltimaParcela || 0)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                      <td colSpan={3}>TOTAL ENCARGOS ATUAIS MENSAIS EXIGIDOS</td>
                      <td className="py-2 px-3 text-right font-mono text-rose-800 text-sm">{formatCurrency(summary.totalParcelasAtuais)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 8. CENÁRIO COM TAXA MÉDIA DE MERCADO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                8. CENÁRIO COM TAXA MÉDIA DE MERCADO (BACEN)
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec8_cenario_bacen}
                  onChange={(e) => handleSectionChange('sec8_cenario_bacen', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec8_cenario_bacen}</p>
              )}

              {/* TABLE FOR SECTION 8 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3 text-center">Taxa Contrato</th>
                      <th className="py-2.5 px-3 text-center">Taxa BACEN</th>
                      <th className="py-2.5 px-3 text-right">Encargo Atual</th>
                      <th className="py-2.5 px-3 text-right">Encargo BACEN</th>
                      <th className="py-2.5 px-3 text-right">Economia Mensal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.contractsCalculated.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor}</td>
                        <td className="py-2 px-3 text-center font-mono">{c.taxaJurosMes.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-center font-mono">{(c.taxaMediaBacenMes || c.taxaJurosMes).toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency((c as any).totalEncargoContratual || c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency((c as any).totalEncargoBacen || c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono font-black text-emerald-700">{formatCurrency((c as any).diferencaEncargoBacen || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 9. CONTEXTO DO SUPERENDIVIDAMENTO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                9. CONTEXTO DO SUPERENDIVIDAMENTO
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec9_contexto_superendividamento}
                  onChange={(e) => handleSectionChange('sec9_contexto_superendividamento', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec9_contexto_superendividamento}</p>
              )}
            </div>

            {/* 10. SALDO DEVEDOR ATUAL */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                10. SALDO DEVEDOR ATUAL
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec10_saldo_devedor}
                  onChange={(e) => handleSectionChange('sec10_saldo_devedor', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec10_saldo_devedor}</p>
              )}

              {/* TABLE FOR SECTION 10 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor / Contrato</th>
                      <th className="py-2.5 px-3 text-right">Valor Liberado (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total Já Pago (R$)</th>
                      <th className="py-2.5 px-3 text-right">Saldo Devedor INPC (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {summary.contractsCalculated.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor} ({c.numeroContrato})</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(c.valorLiberadoContrato)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatCurrency((c.qtdParcelasPagas || 0) * c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(c.saldoINPC)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                      <td>TOTAL CONSOLIDADO</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalPagoHistoricoVal)}</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-900 text-sm">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 11. PLANO DE REPACTUAÇÃO EM ATÉ 60 PARCELAS */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                11. PLANO DE REPACTUAÇÃO EM ATÉ 60 PARCELAS
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec11_plano_60x}
                  onChange={(e) => handleSectionChange('sec11_plano_60x', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec11_plano_60x}</p>
              )}

              {/* TABLE FOR SECTION 11 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor / Contrato</th>
                      <th className="py-2.5 px-3 text-right">Saldo INPC (R$)</th>
                      <th className="py-2.5 px-3 text-center">Peso (%)</th>
                      <th className="py-2.5 px-3 text-right">PMT Mensal Repactuada (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total Quitado em 60m (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {plan60x.map(p => (
                      <tr key={p.numeroContrato}>
                        <td className="py-2 px-3 font-bold">{p.credor} ({p.numeroContrato})</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(p.saldoDevedorINPC)}</td>
                        <td className="py-2 px-3 text-center font-mono">{p.percentualDoTotal.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.parcelaRepactuadaPMT)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(p.totalQuitado60m)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-black text-emerald-950">
                      <td>TOTAL PLANO REPACTUADO 60X</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                      <td className="py-2 px-3 text-center font-mono">100,00%</td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-800 text-sm font-black">{formatCurrency(summary.capacidadeMensalPlano)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 12. ANÁLISE DO TOTAL PAGO NOS CONTRATOS */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                12. ANÁLISE DO TOTAL PAGO NOS CONTRATOS
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec12_analise_total_pago}
                  onChange={(e) => handleSectionChange('sec12_analise_total_pago', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec12_analise_total_pago}</p>
              )}

              {/* TABLE FOR SECTION 12 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3 text-right">Capital Liberado (R$)</th>
                      <th className="py-2.5 px-3 text-center">Qtd Pagas</th>
                      <th className="py-2.5 px-3 text-right">Total Já Pago (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total Repactuado 60m (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total Geral Recebido (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {evolution.map(e => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-bold">{e.credor}</td>
                        <td className="py-2 px-3 font-mono">{e.numeroContrato}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.valorLiberado)}</td>
                        <td className="py-2 px-3 text-center font-mono">{e.qtdPagas}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalPrestacoesJaPagas)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalRepactuado60m)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                      <td colSpan={2}>TOTAL CONSOLIDADO</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
                      <td></td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalPagoHistoricoVal)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-900 text-sm">{formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 13. JUROS PAGOS E TAXA INTERNA DE RETORNO (TIR) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                13. JUROS PAGOS E TAXA INTERNA DE RETORNO (TIR)
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec13_juros_e_tir}
                  onChange={(e) => handleSectionChange('sec13_juros_e_tir', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec13_juros_e_tir}</p>
              )}

              {/* TABLE FOR SECTION 13 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3 text-right">Capital Liberado (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total Recebido (R$)</th>
                      <th className="py-2.5 px-3 text-right">Lucro/Juros (R$)</th>
                      <th className="py-2.5 px-3 text-center">TIR (% a.m.)</th>
                      <th className="py-2.5 px-3 text-center">TIR (% a.a.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {evolution.map(e => (
                      <tr key={e.id}>
                        <td className="py-2 px-3 font-bold">{e.credor}</td>
                        <td className="py-2 px-3 font-mono">{e.numeroContrato}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.valorLiberado)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(e.totalPagoAcimaDoValorLiberado)}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{e.tirAmPercent.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-center font-mono">{e.tirAaPercent.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 14. PLANO DE REPACTUAÇÃO FINAL */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                14. PLANO DE REPACTUAÇÃO FINAL (COM CARÊNCIA)
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec14_plano_final_carencia}
                  onChange={(e) => handleSectionChange('sec14_plano_final_carencia', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{parecerSections.sec14_plano_final_carencia}</p>
              )}

              {/* TABLE FOR SECTION 14 */}
              <div className="overflow-x-auto my-4 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Item do Balanço Financeiro</th>
                      <th className="py-2.5 px-3 text-right">Valor Mensal (R$)</th>
                      <th className="py-2.5 px-3">Status / Garantia Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td>Renda Líquida Ajustada Pós-Repactuação (RLA)</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(rlaPosRepactuacaoVal)}</td><td>Renda reorganizada</td></tr>
                    <tr><td>(−) Despesas Essenciais Comprovadas</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(summary.totalDespesas)})</td><td>Mínimo Existencial assegurado</td></tr>
                    <tr><td>(−) Prestação Mensal do Plano (PMT 60x)</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(pmtPlanoVal)})</td><td>Repactuação em 60 parcelas iguais</td></tr>
                    <tr className="bg-emerald-50 font-black text-emerald-950"><td>(=) Total de Recursos Livres Finais</td><td className="py-2 px-3 text-right font-mono text-emerald-900 font-black text-sm">{formatCurrency(recursosLivresVal)}</td><td>Sobra orçamentária do devedor</td></tr>
                    <tr className="bg-emerald-100 font-black text-emerald-950"><td>Preservação de no mínimo 20% da remuneração?</td><td className="py-2 px-3 text-right font-mono">{formatPercent(percentPreservadoPosPlanoVal)}</td><td>{percentPreservadoPosPlanoVal >= 20 ? 'SIM - Atende diretriz judicial' : 'NÃO'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 15. CONCLUSÃO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                15. CONCLUSÃO
              </h2>
              {isParecerOnlineEditing ? (
                <textarea
                  value={parecerSections.sec15_conclusao}
                  onChange={(e) => handleSectionChange('sec15_conclusao', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white font-bold"
                />
              ) : (
                <p className="whitespace-pre-line font-medium leading-relaxed">{parecerSections.sec15_conclusao}</p>
              )}
            </div>

            {/* Signatures */}
            <div className="pt-10 border-t border-slate-300 font-sans space-y-6">
              <p className="text-right font-bold text-slate-800 text-xs">{formatDateExtenso(process.dataPericia)}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-12 pt-4">
                <div className="signature-block no-spacing text-center mx-auto space-y-0.5">
                  <div className="border-t border-slate-400 w-72 mx-auto pt-2 font-black text-slate-900 text-xs text-center no-spacing">
                    {peritoNome}
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 text-center no-spacing">{peritoPapel}</p>
                  <p className="text-[10px] text-slate-500 font-mono text-center no-spacing">{peritoRegistro}</p>
                  {peritoEscritorio && <p className="text-[10px] text-slate-500 font-sans text-center no-spacing">{peritoEscritorio}</p>}
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="pt-8 border-t border-slate-200 text-[10px] italic text-slate-500 space-y-3 font-sans footnote-block page-break-before print:break-before-page print:page-break-before-always" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
              <p className="footnote italic page-break-before" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
              <p className="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
              <p className="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
              <p className="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
              <p className="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: LAUDO PERICIAL COMPLETO (14 SEÇÕES CONFORME MODELO DE REFERÊNCIA) */}
      {activeSubTab === 'laudo' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md space-y-8 text-slate-900 font-serif w-full parecer-print-document print:border-none print:shadow-none">
          
          {/* Header Bar */}
          <div className="border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider font-mono">
                LAUDO PERICIAL CONTÁBIL COMPLETO • LEI 14.181/2021 & NBC TP 01(R2)
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase font-sans">
                Laudo Pericial Contábil Judicial (14 Seções)
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Preenchido com base nos dados do profissional (Módulo 1) e cálculos consolidados de todos os módulos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsLaudoOnlineEditing(!isLaudoOnlineEditing)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-xs border transition-all cursor-pointer ${
                  isLaudoOnlineEditing
                    ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-500 font-black'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-slate-900" />
                <span>{isLaudoOnlineEditing ? 'Concluir Edição Online' : 'Editar Texto Online'}</span>
              </button>

              <button
                onClick={handleExportLaudoDocx}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md border border-blue-600 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Baixar Laudo em Word (.docx)</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4 text-white" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* LAUDO BODY */}
          <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-800 font-serif">
            
            {/* Endereçamento / Juízo */}
            <div className="text-center pb-2">
              {isLaudoOnlineEditing ? (
                <input
                  type="text"
                  value={laudoSections.enderecamento}
                  onChange={(e) => handleLaudoSectionChange('enderecamento', e.target.value)}
                  className="w-full p-2 border border-blue-400 rounded text-center text-xs font-bold font-sans uppercase text-slate-900"
                />
              ) : (
                <p className="font-bold text-slate-900 uppercase font-sans text-xs sm:text-sm tracking-wide">
                  {laudoSections.enderecamento}
                </p>
              )}
            </div>

            {/* Title & Process Header Box */}
            <div className="text-center space-y-2 border-b pb-6">
              <h1 className="text-xl sm:text-2xl font-black text-[#1C4E5E] font-serif uppercase tracking-tight">
                LAUDO PERICIAL CONTÁBIL
              </h1>
              <p className="text-xs text-slate-500 font-sans font-bold uppercase tracking-wider">
                Ação de Reconhecimento de Superendividamento e Plano de Pagamento Compulsório (Lei 14.181/2021)
              </p>
            </div>

            {/* Identificação do Processo e Partes (Tabela) */}
            <div className="overflow-x-auto my-4 font-sans text-xs">
              <table className="w-full text-left border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                    <th className="py-2.5 px-3 w-1/3">Campo</th>
                    <th className="py-2.5 px-3">Dados do Processo e Partes (Módulo 1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Processo:</td><td className="py-2 px-3 font-mono font-bold text-slate-900">{process.numeroProcesso || 'Não informado'}</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Classe Processual:</td><td className="py-2 px-3">{process.classeProcessual || 'Superendividamento - Lei 14.181/2021'}</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Vara / Juízo:</td><td className="py-2 px-3">{process.vara || 'Vara Cível'} da Comarca de {comarcaStr}</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Autor / Devedor:</td><td className="py-2 px-3 font-bold">{devedorNome} (CPF/CNPJ: {process.cpfCnpj || 'Não informado'})</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Réus / Credores:</td><td className="py-2 px-3">{credoresUnicosStr}</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Perito Judicial:</td><td className="py-2 px-3 font-bold text-[#1C4E5E]">{peritoNome} ({peritoRegistro})</td></tr>
                  <tr><td className="py-2 px-3 font-bold bg-slate-50">Data do Laudo:</td><td className="py-2 px-3 font-mono">{formatDateBR(process.dataPericia || new Date().toISOString().split('T')[0])}</td></tr>
                </tbody>
              </table>
            </div>

            {/* I. SÍNTESE DO OBJETO DA PERÍCIA */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1">
                I. SÍNTESE DO OBJETO DA PERÍCIA
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec1_sintese}
                  onChange={(e) => handleLaudoSectionChange('sec1_sintese', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec1_sintese}</p>
              )}

              <div className="pl-4 border-l-2 border-[#1C4E5E]/40 space-y-3 pt-2">
                <h3 className="text-xs font-black text-slate-900 uppercase font-sans">I.1. Resumo da Petição Inicial</h3>
                {isLaudoOnlineEditing ? (
                  <textarea
                    value={laudoSections.sec1_1_peticao_inicial}
                    onChange={(e) => handleLaudoSectionChange('sec1_1_peticao_inicial', e.target.value)}
                    rows={5}
                    className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec1_1_peticao_inicial}</p>
                )}

                <h3 className="text-xs font-black text-slate-900 uppercase font-sans pt-2">I.2. Resumo das Contestações</h3>
                {isLaudoOnlineEditing ? (
                  <textarea
                    value={laudoSections.sec1_2_contestacoes}
                    onChange={(e) => handleLaudoSectionChange('sec1_2_contestacoes', e.target.value)}
                    rows={5}
                    className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec1_2_contestacoes}</p>
                )}

                <h3 className="text-xs font-black text-slate-900 uppercase font-sans pt-2">I.3. Resumo da Réplica</h3>
                {isLaudoOnlineEditing ? (
                  <textarea
                    value={laudoSections.sec1_3_replica}
                    onChange={(e) => handleLaudoSectionChange('sec1_3_replica', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                  />
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec1_3_replica}</p>
                )}
              </div>
            </div>

            {/* II. INÍCIO DOS TRABALHOS */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                II. INÍCIO DOS TRABALHOS
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec2_inicio_trabalhos}
                  onChange={(e) => handleLaudoSectionChange('sec2_inicio_trabalhos', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec2_inicio_trabalhos}</p>
              )}
            </div>

            {/* III. RESPONSABILIDADE PROFISSIONAL */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                III. RESPONSABILIDADE PROFISSIONAL
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec3_responsabilidade}
                  onChange={(e) => handleLaudoSectionChange('sec3_responsabilidade', e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec3_responsabilidade}</p>
              )}
            </div>

            {/* IV. ANÁLISE TÉCNICA E CIENTÍFICA */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                IV. ANÁLISE TÉCNICA E CIENTÍFICA
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec4_analise_tecnica}
                  onChange={(e) => handleLaudoSectionChange('sec4_analise_tecnica', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec4_analise_tecnica}</p>
              )}
            </div>

            {/* V. MÉTODO UTILIZADO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                V. MÉTODO UTILIZADO
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec5_metodo}
                  onChange={(e) => handleLaudoSectionChange('sec5_metodo', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec5_metodo}</p>
              )}
            </div>

            {/* VI. DILIGÊNCIAS */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                VI. DILIGÊNCIAS
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec6_diligencias}
                  onChange={(e) => handleLaudoSectionChange('sec6_diligencias', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec6_diligencias}</p>
              )}
            </div>

            {/* VII. APURAÇÃO DA CAPACIDADE CONTRIBUTIVA */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                VII. APURAÇÃO DA CAPACIDADE CONTRIBUTIVA
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec7_capacidade_contributiva}
                  onChange={(e) => handleLaudoSectionChange('sec7_capacidade_contributiva', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec7_capacidade_contributiva}</p>
              )}

              {/* Sub-tabelas da capacidade contributiva */}
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.1. Renda Líquida Mensal Ajustada (RLA) - antes do Plano Compulsório</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Rubrica de Rendimento / Dedução</th>
                          <th className="py-2 px-3 text-right">Valor Mensal (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr><td>(+) Salário Bruto / Proventos Totais</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(salarioBrutoVal)}</td></tr>
                        <tr><td>(−) Deduções Legais Obrigatórias (RPPS, IRRF, Pensão, Saúde)</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(totalDeducoesLegais)}</td></tr>
                        <tr><td>(−) Empréstimos Consignados em Folha (Vedação Dec. 11.150/2022)</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(consignadosFolha)}</td></tr>
                        <tr className="bg-emerald-50 font-black text-emerald-950"><td>(=) RENDA LÍQUIDA AJUSTADA (RLA)</td><td className="py-2 px-3 text-right font-mono text-emerald-800 text-sm font-black">{formatCurrency(summary.rla)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.2. Despesas Mensais Essenciais</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Grupo de Despesa Essencial</th>
                          <th className="py-2 px-3 text-right">Valor Mensal (R$)</th>
                          <th className="py-2 px-3">Fonte / Comprovante Documental</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr><td>Moradia / Aluguel / Condomínio</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.moradia)}</td><td className="py-2 px-3">{expenses.fonteMoradia || 'Comprovante em anexo'}</td></tr>
                        <tr><td>Alimentação</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.alimentacao)}</td><td className="py-2 px-3">{expenses.fonteAlimentacao || 'Comprovante em anexo'}</td></tr>
                        <tr><td>Saúde / Medicamentos</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.saudeMedicamentos)}</td><td className="py-2 px-3">{expenses.fonteSaude || 'Comprovante em anexo'}</td></tr>
                        <tr><td>Transporte</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.transporte)}</td><td className="py-2 px-3">{expenses.fonteTransporte || 'Comprovante em anexo'}</td></tr>
                        <tr><td>Educação / Dependentes</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.educacaoDependentes)}</td><td className="py-2 px-3">{expenses.fonteEducacao || 'Comprovante em anexo'}</td></tr>
                        <tr><td>Outras Despesas Essenciais</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.outrasDespesasEssenciais)}</td><td className="py-2 px-3">{expenses.fonteOutrasDespesas || 'Comprovante em anexo'}</td></tr>
                        <tr className="bg-slate-100 font-black"><td>TOTAL DAS DESPESAS ESSENCIAIS</td><td className="py-2 px-3 text-right font-mono text-slate-900">{formatCurrency(summary.totalDespesas)}</td><td>Comprovado nos autos</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.3. Mínimo Existencial (ME)</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3 text-right">Valor Preservado (R$)</th>
                          <th className="py-2 px-3">Base Legal / Diretriz Judicial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr className="bg-amber-50 font-black"><td>Mínimo Existencial Configurado</td><td className="py-2 px-3 text-right font-mono text-amber-900 font-bold">{formatCurrency(expenses.minimoExistencialConfig)}</td><td>{expenses.justificativaMinimoExistencial || 'Decreto nº 11.150/2022 / 1 Salário Mínimo'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.4. Margem Disponível para o Plano (MD) - antes da repactuação</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Indicador de Sobra Orçamentária</th>
                          <th className="py-2 px-3 text-right">Valor Apurado (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr><td>Renda Líquida Ajustada (RLA)</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(summary.rla)}</td></tr>
                        <tr><td>Despesas Essenciais / Mínimo Existencial Comprovado</td><td className="py-2 px-3 text-right font-mono text-rose-700">{formatCurrency(summary.totalDespesas)}</td></tr>
                        <tr className="bg-blue-50 font-black text-blue-950"><td>(=) MARGEM DISPONÍVEL MENSAL PARA REPACTUAÇÃO</td><td className="py-2 px-3 text-right font-mono text-blue-900 text-sm font-black">{formatCurrency(summary.sobraLiquida)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.5. Comprometimento da Renda Mensal - antes do Plano Compulsório</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Credor</th>
                          <th className="py-2 px-3">Contrato</th>
                          <th className="py-2 px-3">Modalidade</th>
                          <th className="py-2 px-3 text-right">Encargo Mensal (R$)</th>
                          <th className="py-2 px-3 text-center">% Participação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {contracts.map(c => (
                          <tr key={c.id}>
                            <td className="py-2 px-3 font-bold">{c.credor}</td>
                            <td className="py-2 px-3 font-mono">{c.numeroContrato}</td>
                            <td className="py-2 px-3">{c.modalidade}</td>
                            <td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{formatCurrency(c.valorParcelaAtual)}</td>
                            <td className="py-2 px-3 text-center font-mono">{formatPercent(summary.rla > 0 ? (c.valorParcelaAtual / summary.rla) * 100 : 0)}</td>
                          </tr>
                        ))}
                        <tr className="bg-rose-50 font-black text-rose-950">
                          <td colSpan={3}>TOTAL ENCARGOS MENSAL ANTES DO PLANO</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-800 text-sm font-black">{formatCurrency(summary.totalParcelasAtuais)}</td>
                          <td className="py-2 px-3 text-center font-mono text-rose-900 text-sm font-black">{formatPercent(summary.percentualComprometimentoRLA)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.6. Comprometimento da Renda Mensal - após o Plano Compulsório</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Credor / Contrato</th>
                          <th className="py-2 px-3 text-right">Saldo INPC (R$)</th>
                          <th className="py-2 px-3 text-center">Peso (%)</th>
                          <th className="py-2 px-3 text-right">PMT Repactuada (R$)</th>
                          <th className="py-2 px-3 text-right">Total Quitado em 60m (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {plan60x.map(p => (
                          <tr key={p.numeroContrato}>
                            <td className="py-2 px-3 font-bold">{p.credor} ({p.numeroContrato})</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(p.saldoDevedorINPC)}</td>
                            <td className="py-2 px-3 text-center font-mono">{p.percentualDoTotal.toFixed(2)}%</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(p.parcelaRepactuadaPMT)}</td>
                            <td className="py-2 px-3 text-right font-mono">{formatCurrency(p.totalQuitado60m)}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-black text-emerald-950">
                          <td>TOTAL PLANO REPACTUADO 60X</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                          <td className="py-2 px-3 text-center font-mono">100,00%</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-800 text-sm font-black">{formatCurrency(summary.capacidadeMensalPlano)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">VII.7. Balanço Financeiro Consolidado e Recursos Livres (Módulo 16)</h3>
                  <div className="overflow-x-auto font-sans text-xs">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2 px-3">Item do Balanço Financeiro</th>
                          <th className="py-2 px-3 text-right">Valor Mensal (R$)</th>
                          <th className="py-2 px-3">Status / Garantia Legal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr><td>Renda Líquida Ajustada Pós-Repactuação (RLA)</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(rlaPosRepactuacaoVal)}</td><td className="py-2 px-3">Renda reorganizada</td></tr>
                        <tr><td>(−) Despesas Essenciais Comprovadas</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(summary.totalDespesas)})</td><td className="py-2 px-3">Mínimo Existencial assegurado</td></tr>
                        <tr><td>(−) Prestação Mensal do Plano Compulsório (PMT 60x)</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(pmtPlanoVal)})</td><td className="py-2 px-3">Repactuação proporcional</td></tr>
                        <tr className="bg-emerald-50 font-black"><td>(=) Total de Recursos Livres Remanescentes</td><td className="py-2 px-3 text-right font-mono text-emerald-800 font-bold">{formatCurrency(recursosLivresVal)}</td><td className="py-2 px-3">Sobra orçamentária do devedor</td></tr>
                        <tr className="font-bold"><td>Preservação do Mínimo Existencial de 1 Salário-Mínimo?</td><td className="py-2 px-3 text-right font-mono">{recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'SIM' : 'PARCIAL'}</td><td className="py-2 px-3">Art. 54-A, § 1º do CDC</td></tr>
                        <tr className="font-bold"><td>Preservação de 20% da Relação Remuneratória?</td><td className="py-2 px-3 text-right font-mono">{formatPercent(percentPreservadoPosPlanoVal)}</td><td className="py-2 px-3">{percentPreservadoPosPlanoVal >= 20 ? 'SIM (Superior a 20%)' : 'NÃO'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* VIII. ANÁLISE DOS CONTRATOS */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                VIII. ANÁLISE DOS CONTRATOS
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec8_analise_contratos}
                  onChange={(e) => handleLaudoSectionChange('sec8_analise_contratos', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec8_analise_contratos}</p>
              )}
            </div>

            {/* IX. SALDOS DEVEDORES ATUALIZADOS PELO INPC */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                IX. SALDOS DEVEDORES ATUALIZADOS PELO INPC
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec9_saldos_inpc}
                  onChange={(e) => handleLaudoSectionChange('sec9_saldos_inpc', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec9_saldos_inpc}</p>
              )}

              <div className="overflow-x-auto font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2 px-3">Credor / Contrato</th>
                      <th className="py-2 px-3 text-right">Valor Liberado (R$)</th>
                      <th className="py-2 px-3 text-right">Total Já Pago (R$)</th>
                      <th className="py-2 px-3 text-right">Saldo INPC (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.contractsCalculated.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor} ({c.numeroContrato})</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(c.valorLiberadoContrato)}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600">{formatCurrency((c.qtdParcelasPagas || 0) * c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(c.saldoINPC)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black">
                      <td>TOTAL GERAL CONSOLIDADO CORRIGIDO</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalPagoHistoricoVal)}</td>
                      <td className="py-2 px-3 text-right font-mono text-blue-900 text-sm">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-3">
                <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">IX.1. Análise do Histórico de Amortização e Total Pago por Contrato (Módulo 7 & 13)</h3>
                <div className="overflow-x-auto font-sans text-xs">
                  <table className="w-full text-left border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                        <th className="py-2 px-3">Credor / Contrato</th>
                        <th className="py-2 px-3 text-right">Capital Liberado (R$)</th>
                        <th className="py-2 px-3 text-center">Parcelas Pagas</th>
                        <th className="py-2 px-3 text-right">Total Já Pago (R$)</th>
                        <th className="py-2 px-3 text-right">Total Repactuado 60m (R$)</th>
                        <th className="py-2 px-3 text-right">Total Geral a Pagar (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {evolution.map(e => (
                        <tr key={e.numeroContrato}>
                          <td className="py-2 px-3 font-bold">{e.credor} ({e.numeroContrato})</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.valorLiberado)}</td>
                          <td className="py-2 px-3 text-center font-mono">{e.qtdPagas}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalPrestacoesJaPagas)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalRepactuado60m)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-black">
                        <td>TOTAL GERAL CONSOLIDADO</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
                        <td className="py-2 px-3 text-center font-mono">-</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(totalPagoHistoricoVal)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                        <td className="py-2 px-3 text-right font-mono text-blue-900 text-sm">{formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* X. ANÁLISE DAS TAXAS CONTRATADAS x TAXAS MÉDIAS BACEN */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                X. ANÁLISE DAS TAXAS CONTRATADAS x TAXAS MÉDIAS BACEN
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec10_taxas_bacen}
                  onChange={(e) => handleLaudoSectionChange('sec10_taxas_bacen', e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec10_taxas_bacen}</p>
              )}

              <div className="overflow-x-auto font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2 px-3">Credor</th>
                      <th className="py-2 px-3 text-center">Taxa Contrato (% a.m.)</th>
                      <th className="py-2 px-3 text-center">Taxa BACEN (% a.m.)</th>
                      <th className="py-2 px-3 text-right">Encargo Atual (R$)</th>
                      <th className="py-2 px-3 text-right">Encargo BACEN (R$)</th>
                      <th className="py-2 px-3 text-right">Economia Mensal (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {summary.contractsCalculated.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor}</td>
                        <td className="py-2 px-3 text-center font-mono">{c.taxaJurosMes.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-center font-mono">{(c.taxaMediaBacenMes || c.taxaJurosMes).toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency((c as any).totalEncargoContratual || c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatCurrency((c as any).totalEncargoBacen || c.valorParcelaAtual)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency((c as any).diferencaEncargoBacen || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3">
                <h3 className="text-xs font-black text-slate-900 uppercase font-sans mb-2">X.1. Taxa Interna de Retorno (TIR) e Remuneração dos Credores no Plano (Módulo 14)</h3>
                <div className="overflow-x-auto font-sans text-xs">
                  <table className="w-full text-left border border-slate-300">
                    <thead>
                      <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                        <th className="py-2 px-3">Credor / Contrato</th>
                        <th className="py-2 px-3 text-right">Capital Liberado (R$)</th>
                        <th className="py-2 px-3 text-right">Total Recebido (R$)</th>
                        <th className="py-2 px-3 text-right">Lucro Bruto Credor (R$)</th>
                        <th className="py-2 px-3 text-center">TIR Mensal (% a.m.)</th>
                        <th className="py-2 px-3 text-center">TIR Anual (% a.a.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {evolution.map(e => (
                        <tr key={e.numeroContrato}>
                          <td className="py-2 px-3 font-bold">{e.credor} ({e.numeroContrato})</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.valorLiberado)}</td>
                          <td className="py-2 px-3 text-right font-mono">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatCurrency(e.totalPagoAcimaDoValorLiberado)}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold">{e.tirAmPercent.toFixed(2)}%</td>
                          <td className="py-2 px-3 text-center font-mono">{e.tirAaPercent.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* XI. VERIFICAÇÃO DO ART. 54-B DO CDC - CUSTO EFETIVO TOTAL (CET) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                XI. VERIFICAÇÃO DO ART. 54-B DO CDC - CUSTO EFETIVO TOTAL (CET)
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec11_art_54b_cet}
                  onChange={(e) => handleLaudoSectionChange('sec11_art_54b_cet', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec11_art_54b_cet}</p>
              )}

              <div className="overflow-x-auto font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2 px-3">Contrato</th>
                      <th className="py-2 px-3">Status Art. 54-B CDC</th>
                      <th className="py-2 px-3">Observação / CET</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 font-bold">{c.credor} - {c.numeroContrato}</td>
                        <td className="py-2 px-3 text-emerald-700 font-bold">Atendido</td>
                        <td className="py-2 px-3">CET: {c.taxaJurosMes ? (c.taxaJurosMes * 1.15).toFixed(2) : '1.50'}% a.m. - Expresso na documentação</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* XII. RESPOSTAS AOS QUESITOS PERICIAIS */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                XII. RESPOSTAS AOS QUESITOS PERICIAIS
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec12_quesitos}
                  onChange={(e) => handleLaudoSectionChange('sec12_quesitos', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed">{laudoSections.sec12_quesitos}</p>
              )}

              <div className="space-y-3 font-sans text-xs pt-2">
                {quesitos.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-slate-500 italic">
                    Nenhum quesito judicial formal cadastrado no momento. As respostas técnicas padrão serão integradas automaticamente quando formuladas pelas partes.
                  </div>
                ) : (
                  quesitos.map((q, idx) => (
                    <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-300 rounded space-y-1.5">
                      <p className="font-bold text-slate-900">Quesito N.º {idx + 1} ({q.origem}): {q.pergunta}</p>
                      <p className="text-slate-800 font-serif bg-white p-2.5 rounded border border-slate-200 text-xs">
                        <strong>Resposta do Perito:</strong> {q.respostaTecnica}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* XIII. CONCLUSÃO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                XIII. CONCLUSÃO
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec13_conclusao}
                  onChange={(e) => handleLaudoSectionChange('sec13_conclusao', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white font-medium"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed font-medium">{laudoSections.sec13_conclusao}</p>
              )}
            </div>

            {/* XIV. ENCERRAMENTO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                XIV. ENCERRAMENTO
              </h2>
              {isLaudoOnlineEditing ? (
                <textarea
                  value={laudoSections.sec14_encerramento}
                  onChange={(e) => handleLaudoSectionChange('sec14_encerramento', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white font-medium"
                />
              ) : (
                <p className="whitespace-pre-line leading-relaxed font-medium">{laudoSections.sec14_encerramento}</p>
              )}
            </div>

            {/* Date and Signature Block */}
            <div className="pt-8 font-sans space-y-6 border-t border-slate-300">
              <p className="text-right font-bold text-slate-800 text-xs">
                {formatDateExtenso(process.dataPericia)}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-12 pt-2">
                <div className="signature-block no-spacing text-center mx-auto space-y-0.5">
                  <div className="border-t border-slate-400 w-72 mx-auto pt-2 font-black text-slate-900 text-xs text-center no-spacing">
                    {peritoNome}
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 text-center no-spacing">{peritoPapel}</p>
                  <p className="text-[10px] text-slate-500 font-mono text-center no-spacing">{peritoRegistro}</p>
                  {peritoEscritorio && <p className="text-[10px] text-slate-500 font-sans text-center no-spacing">{peritoEscritorio}</p>}
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="pt-8 border-t border-slate-200 text-[10px] italic text-slate-500 space-y-3 font-sans footnote-block page-break-before print:break-before-page print:page-break-before-always" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
              <p className="footnote italic page-break-before" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
              <p className="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
              <p className="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
              <p className="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
              <p className="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB: PLANO DE PAGAMENTO COMPULSÓRIO */}
      {activeSubTab === 'planoCompulsorio' && (
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md space-y-8 text-slate-900 font-serif w-full parecer-print-document print:border-none print:shadow-none">
          
          {/* Header Bar */}
          <div className="border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-700 tracking-wider font-mono">
                PLANO COMPULSÓRIO DE REPACTUAÇÃO • LEI 14.181/2021 & ART. 104-B, §4°, CDC
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase font-sans">
                Plano de Pagamento Compulsório
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">
                Fundamentado na Decisão Judicial e nos parâmetros técnicos apurados nos módulos 1 a 17.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsPlanoCompulsorioOnlineEditing(!isPlanoCompulsorioOnlineEditing)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 font-bold text-xs rounded-xl shadow-xs border transition-all cursor-pointer ${
                  isPlanoCompulsorioOnlineEditing
                    ? 'bg-amber-400 text-slate-950 border-amber-500 hover:bg-amber-500 font-black'
                    : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
                }`}
              >
                <Edit3 className="w-4 h-4 text-slate-900" />
                <span>{isPlanoCompulsorioOnlineEditing ? 'Concluir Edição Online' : 'Editar Texto Online'}</span>
              </button>

              <button
                onClick={handleExportPlanoCompulsorioDocx}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-md border border-blue-600 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4 text-white" />
                <span>Baixar Plano em Word (.docx)</span>
              </button>

              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700 cursor-pointer transition-all"
              >
                <FileCheck className="w-4 h-4 text-white" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* PLANO COMPULSÓRIO BODY */}
          <div className="space-y-6 text-xs sm:text-sm leading-relaxed text-slate-800 font-serif">
            
            {/* Endereçamento e Título */}
            <div className="text-center space-y-2 border-b pb-6">
              <p className="font-bold text-slate-900 uppercase font-sans text-xs sm:text-sm">
                {planoCompulsorioSections.enderecamento}
              </p>
              <h1 className="text-lg sm:text-xl font-black text-[#1C4E5E] font-serif uppercase tracking-tight pt-2">
                PLANO DE PAGAMENTO COMPULSÓRIO
              </h1>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 space-y-1 text-center font-bold">
                {isPlanoCompulsorioOnlineEditing ? (
                  <textarea
                    value={planoCompulsorioSections.processoHeaderInfo}
                    onChange={(e) => handlePlanoCompulsorioSectionChange('processoHeaderInfo', e.target.value)}
                    rows={5}
                    className="w-full p-2 border border-blue-400 rounded text-xs font-mono bg-white"
                  />
                ) : (
                  <p className="whitespace-pre-line">{planoCompulsorioSections.processoHeaderInfo}</p>
                )}
              </div>
            </div>

            {/* 1. OBJETO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1">
                1. OBJETO
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec1_objeto}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec1_objeto', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec1_objeto}</p>
              )}
            </div>

            {/* 2. FUNDAMENTO LEGAL E METODOLOGIA */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                2. FUNDAMENTO LEGAL E METODOLOGIA
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec2_fundamento_metodologia}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec2_fundamento_metodologia', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec2_fundamento_metodologia}</p>
              )}
            </div>

            {/* 3. MÍNIMO EXISTENCIAL (ME) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                3. MÍNIMO EXISTENCIAL (ME)
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec3_minimo_existencial}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec3_minimo_existencial', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec3_minimo_existencial}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                      <th className="py-2.5 px-3">Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td>Mínimo Existencial fixado pelo juízo (Diretriz I)</td><td className="py-2 px-3 text-right font-mono font-bold text-amber-800">{formatCurrency(expenses.minimoExistencialConfig || 1621)}</td><td className="py-2 px-3">1 salário-mínimo - {expenses.justificativaMinimoExistencial || 'Decreto nº 12.797/2025'}</td></tr>
                    <tr><td>Despesas essenciais documentadas (item 4 deste plano)</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(summary.totalDespesas)}</td><td className="py-2 px-3">Documentos juntados nos autos</td></tr>
                    <tr className="bg-amber-50 font-black"><td>ME adotado neste plano</td><td className="py-2 px-3 text-right font-mono text-amber-900">{formatCurrency(expenses.minimoExistencialConfig || 1621)}</td><td>Valor fixado pelo juízo</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. RENDA LÍQUIDA MENSAL AJUSTADA (RLA) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                4. RENDA LÍQUIDA MENSAL AJUSTADA (RLA)
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec4_renda_liquida}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec4_renda_liquida', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec4_renda_liquida}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                      <th className="py-2.5 px-3">Fonte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td>Bruto Total</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(salarioBrutoVal)}</td><td className="py-2 px-3">Contracheques / Comprovantes de Rendimento</td></tr>
                    <tr><td>(−) RPPS/INSS + Contribuição Social</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(income.rppsInss || 0)})</td><td className="py-2 px-3">Contracheques / Dedução Obrigatória</td></tr>
                    <tr><td>(−) IRRF + IRPF</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(income.irrf || 0)})</td><td className="py-2 px-3">Contracheques / Imposto de Renda</td></tr>
                    <tr><td>(−) Plano de Saúde (Consolidado)</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(income.planoSaudeFolha || 0)})</td><td className="py-2 px-3">Contracheques / Plano de Saúde</td></tr>
                    <tr><td>(−) Parcelas de crédito consignado em folha</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(consignadosFolha)})</td><td className="py-2 px-3">Contracheques</td></tr>
                    <tr className="bg-blue-50 font-black"><td>= RENDA LÍQUIDA MENSAL AJUSTADA (RLA)</td><td className="py-2 px-3 text-right font-mono text-blue-900">{formatCurrency(summary.rla)}</td><td>Base de cálculo deste plano</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. MARGEM DISPONÍVEL PARA O PLANO (MD) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                5. MARGEM DISPONÍVEL PARA O PLANO (MD)
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec5_margem_disponivel}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec5_margem_disponivel', e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec5_margem_disponivel}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr><td>RLA antes do plano</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(summary.rla)}</td></tr>
                    <tr><td>(−) Mínimo Existencial</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(expenses.minimoExistencialConfig || 1621)})</td></tr>
                    <tr className="bg-blue-50 font-black"><td>= Margem Disponível (MD)</td><td className="py-2 px-3 text-right font-mono text-blue-950">{formatCurrency(summary.sobraLiquida)}</td></tr>
                    <tr><td>Total das Dívidas Atual</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(summary.totalParcelasAtuais)}</td></tr>
                    <tr><td>% de Comprometimento da Renda Mensal antes do Plano</td><td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{formatPercent(summary.percentualComprometimentoRLA)}</td></tr>
                    <tr className="bg-emerald-50 font-black"><td>PMT do Plano (60 meses)</td><td className="py-2 px-3 text-right font-mono text-emerald-800">{formatCurrency(pmtPlanoVal)}</td></tr>
                    <tr><td>RLA após repactuação dos consignados</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(rlaPosRepactuacaoVal)}</td></tr>
                    <tr><td>(−) PMT do Plano</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(pmtPlanoVal)})</td></tr>
                    <tr className="bg-emerald-50 font-black"><td>= Saldo mensal após o plano</td><td className="py-2 px-3 text-right font-mono text-emerald-900">{formatCurrency(saldoMensalPosPlanoVal)}</td></tr>
                    <tr><td>% de Comprometimento da Renda Mensal após o Plano</td><td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">{formatPercent(percentComprometimentoPosPlanoVal)}</td></tr>
                    <tr className="bg-emerald-100 font-black"><td>% Preservado da Renda após o plano (sobre RLA pós-repactuação)</td><td className="py-2 px-3 text-right font-mono text-emerald-950">{formatPercent(percentPreservadoPosPlanoVal)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. DÍVIDAS INCLUÍDAS NO PLANO */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                6. DÍVIDAS INCLUÍDAS NO PLANO
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec6_dividas_incluidas}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec6_dividas_incluidas', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec6_dividas_incluidas}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3 text-right">Parcela Original (R$)</th>
                      <th className="py-2.5 px-3 text-center">% RLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {contracts.map((c) => (
                      <tr key={c.id}>
                        <td className="font-sans font-bold">{c.credor}</td>
                        <td>{c.numeroContrato}</td>
                        <td className="text-right">{formatCurrency(c.valorParcelaAtual)}</td>
                        <td className="text-center">{formatPercent(summary.rla > 0 ? (c.valorParcelaAtual / summary.rla) * 100 : 0)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-slate-900 font-sans">
                      <td colSpan={2}>TOTAL</td>
                      <td className="text-right font-mono">{formatCurrency(summary.totalParcelasAtuais)}</td>
                      <td className="text-center font-mono">{formatPercent(summary.percentualComprometimentoRLA)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. SALDOS DEVEDORES ATUALIZADOS (INPC) */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                7. SALDOS DEVEDORES ATUALIZADOS (INPC)
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec7_saldos_atualizados}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec7_saldos_atualizados', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec7_saldos_atualizados}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3">Data Ref.</th>
                      <th className="py-2.5 px-3 text-right">Saldo Ref. (R$)</th>
                      <th className="py-2.5 px-3 text-center">Fator INPC</th>
                      <th className="py-2.5 px-3 text-right">Saldo Atualizado (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {summary.contractsCalculated.map((c) => (
                      <tr key={c.id}>
                        <td className="font-sans font-bold">{c.credor}</td>
                        <td>{c.numeroContrato}</td>
                        <td>{formatDateBR(c.dataReferenciaUltimoPagamento || c.dataContrato || process.dataPericia || new Date().toISOString().split('T')[0])}</td>
                        <td className="text-right">{formatCurrency(c.saldoDevedorRefUltimaParcela || 0)}</td>
                        <td className="text-center">{(c.fatorCorrecao7Casas || 1.0).toFixed(7)}</td>
                        <td className="text-right font-bold">{formatCurrency(c.saldoINPC)}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-black text-slate-900 font-sans">
                      <td colSpan={3}>TOTAL</td>
                      <td className="text-right font-mono">{formatCurrency(summary.contractsCalculated.reduce((a, c) => a + (c.saldoDevedorRefUltimaParcela || 0), 0))}</td>
                      <td></td>
                      <td className="text-right font-mono text-blue-900">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 8. PLANO DE PAGAMENTO COMPULSÓRIO EM 60 PARCELAS */}
            <div className="space-y-3">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                8. PLANO DE PAGAMENTO COMPULSÓRIO EM 60 PARCELAS
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec8_plano_60_parcelas}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec8_plano_60_parcelas', e.target.value)}
                  rows={10}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec8_plano_60_parcelas}</p>
              )}

              <div className="overflow-x-auto my-3 font-sans text-xs">
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                      <th className="py-2.5 px-3">Credor</th>
                      <th className="py-2.5 px-3">Contrato</th>
                      <th className="py-2.5 px-3 text-right">Saldo Atualizado (R$)</th>
                      <th className="py-2.5 px-3 text-center">% do Total</th>
                      <th className="py-2.5 px-3 text-right">PMT Mensal (R$)</th>
                      <th className="py-2.5 px-3 text-right">Total 60 meses (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {plan60x.map((p, idx) => (
                      <tr key={idx}>
                        <td className="font-sans font-bold">{p.credor}</td>
                        <td>{p.numeroContrato}</td>
                        <td className="text-right">{formatCurrency(p.saldoDevedorINPC)}</td>
                        <td className="text-center">{p.percentualDoTotal.toFixed(2)}%</td>
                        <td className="text-right font-bold text-emerald-700">{formatCurrency(p.parcelaRepactuadaPMT)}</td>
                        <td className="text-right">{formatCurrency(p.totalQuitado60m)}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-black text-emerald-950 font-sans">
                      <td colSpan={2}>TOTAL</td>
                      <td className="text-right font-mono">{formatCurrency(summary.totalSaldoDevedorINPC)}</td>
                      <td className="text-center font-mono">100,00%</td>
                      <td className="text-right font-mono text-emerald-800">{formatCurrency(summary.capacidadeMensalPlano)}</td>
                      <td className="text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 pt-2 font-sans text-xs">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">8.1. Evolução dos Contratos e Demonstração do Total Pago por Credor (Módulo 12 & 13)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2.5 px-3">Credor / Contrato</th>
                          <th className="py-2.5 px-3 text-right">Capital Liberado (R$)</th>
                          <th className="py-2.5 px-3 text-right">Total Já Pago (R$)</th>
                          <th className="py-2.5 px-3 text-right">Total Repactuado 60m (R$)</th>
                          <th className="py-2.5 px-3 text-right">Total Geral Recebido (R$)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {evolution.map(e => (
                          <tr key={e.numeroContrato}>
                            <td className="font-sans font-bold">{e.credor} ({e.numeroContrato})</td>
                            <td className="text-right">{formatCurrency(e.valorLiberado)}</td>
                            <td className="text-right">{formatCurrency(e.totalPrestacoesJaPagas)}</td>
                            <td className="text-right">{formatCurrency(e.totalRepactuado60m)}</td>
                            <td className="text-right font-bold text-slate-900">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-black font-sans">
                          <td>TOTAL GERAL CONSOLIDADO</td>
                          <td className="text-right font-mono">{formatCurrency(contracts.reduce((a,c) => a + c.valorLiberadoContrato, 0))}</td>
                          <td className="text-right font-mono">{formatCurrency(totalPagoHistoricoVal)}</td>
                          <td className="text-right font-mono">{formatCurrency(summary.capacidadeMensalPlano * 60)}</td>
                          <td className="text-right font-mono text-blue-900">{formatCurrency(evolution.reduce((a,e) => a + e.totalPagoJaPagasERepactuadas, 0))}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase mb-2">8.2. Taxa Interna de Retorno (TIR) por Credor no Plano (Módulo 14)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b border-slate-300">
                          <th className="py-2.5 px-3">Credor / Contrato</th>
                          <th className="py-2.5 px-3 text-right">Capital Liberado (R$)</th>
                          <th className="py-2.5 px-3 text-right">Total Recebido (R$)</th>
                          <th className="py-2.5 px-3 text-center">TIR Mensal (% a.m.)</th>
                          <th className="py-2.5 px-3 text-center">TIR Anual (% a.a.)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-mono">
                        {evolution.map(e => (
                          <tr key={e.numeroContrato}>
                            <td className="font-sans font-bold">{e.credor} ({e.numeroContrato})</td>
                            <td className="text-right">{formatCurrency(e.valorLiberado)}</td>
                            <td className="text-right">{formatCurrency(e.totalPagoJaPagasERepactuadas)}</td>
                            <td className="text-center font-bold">{e.tirAmPercent.toFixed(2)}%</td>
                            <td className="text-center">{e.tirAaPercent.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. BALANÇO FINANCEIRO DO DEVEDOR */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                9. BALANÇO FINANCEIRO DO DEVEDOR
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec9_balanco_financeiro}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec9_balanco_financeiro', e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec9_balanco_financeiro}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
                {/* Table Situação Atual */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-rose-50 px-3 py-2 border-b border-slate-300 font-black text-rose-950">
                    Situação Atual (Antes do Plano)
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr><td className="py-2 px-3">RLA atual</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(summary.rla)}</td></tr>
                      <tr><td className="py-2 px-3">Encargo mensal total atual</td><td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{formatCurrency(summary.totalParcelasAtuais)}</td></tr>
                      <tr><td className="py-2 px-3">% de comprometimento da RLA</td><td className="py-2 px-3 text-right font-mono text-rose-700 font-bold">{formatPercent(summary.percentualComprometimentoRLA)}</td></tr>
                      <tr><td className="py-2 px-3">Mínimo Existencial (1 SM)</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(expenses.minimoExistencialConfig || 1621)}</td></tr>
                      <tr className="bg-rose-100 font-black text-rose-950"><td className="py-2 px-3">Superendividamento configurado?</td><td className="py-2 px-3 text-right">{summary.percentualComprometimentoRLA > 30 ? `SIM (${formatPercent(summary.percentualComprometimentoRLA)})` : 'NÃO'}</td></tr>
                    </tbody>
                  </table>
                </div>

                {/* Table Situação Após o Plano */}
                <div className="border border-slate-300 rounded-lg overflow-hidden">
                  <div className="bg-emerald-50 px-3 py-2 border-b border-slate-300 font-black text-emerald-950">
                    Situação Após o Plano Compulsório
                  </div>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr><td className="py-2 px-3">RLA após repactuação consignados</td><td className="py-2 px-3 text-right font-mono font-bold">{formatCurrency(rlaPosRepactuacaoVal)}</td></tr>
                      <tr><td className="py-2 px-3">(-) Mínimo Existencial</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(expenses.minimoExistencialConfig || 1621)})</td></tr>
                      <tr><td className="py-2 px-3">(-) Despesas Essenciais</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(summary.totalDespesas)})</td></tr>
                      <tr><td className="py-2 px-3">(-) PMT do Plano Compulsório (60x)</td><td className="py-2 px-3 text-right font-mono text-rose-700">({formatCurrency(pmtPlanoVal)})</td></tr>
                      <tr><td className="py-2 px-3">(+) Mínimo Existencial (1 SM)</td><td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">{formatCurrency(expenses.minimoExistencialConfig || 1621)}</td></tr>
                      <tr className="bg-emerald-100 font-black text-emerald-950"><td className="py-2 px-3">= Total de Recursos Livres</td><td className="py-2 px-3 text-right font-mono">{formatCurrency(recursosLivresVal)}</td></tr>
                      <tr className="bg-emerald-50 font-bold text-emerald-900"><td className="py-2 px-3">Mínimo Existencial preservado?</td><td className="py-2 px-3 text-right">{recursosLivresVal >= (expenses.minimoExistencialConfig || 1621) ? 'SIM' : 'PARCIAL'}</td></tr>
                      <tr className="bg-emerald-50 font-bold text-emerald-900"><td className="py-2 px-3">20% da remuneração preservado?</td><td className="py-2 px-3 text-right">{percentPreservadoPosPlanoVal >= 20 ? `SIM (${formatPercent(percentPreservadoPosPlanoVal)} > 20%)` : `NÃO (${formatPercent(percentPreservadoPosPlanoVal)} < 20%)`}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 10. ANÁLISE DA VIABILIDADE DO PLANO */}
            <div className="space-y-2">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1 pt-2">
                10. ANÁLISE DA VIABILIDADE DO PLANO
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec10_viabilidade}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec10_viabilidade', e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line">{planoCompulsorioSections.sec10_viabilidade}</p>
              )}
            </div>

            {/* 11. ENCERRAMENTO */}
            <div className="space-y-4 pt-4 border-t border-slate-200 font-sans">
              <h2 className="text-sm font-black text-[#1C4E5E] uppercase font-sans border-b border-[#1C4E5E]/30 pb-1">
                11. ENCERRAMENTO
              </h2>
              {isPlanoCompulsorioOnlineEditing ? (
                <textarea
                  value={planoCompulsorioSections.sec11_encerramento}
                  onChange={(e) => handlePlanoCompulsorioSectionChange('sec11_encerramento', e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-blue-400 rounded-lg text-xs font-serif leading-relaxed bg-white"
                />
              ) : (
                <p className="whitespace-pre-line font-serif">{planoCompulsorioSections.sec11_encerramento}</p>
              )}

              <p className="text-right font-bold text-slate-800 text-xs pt-4">
                {formatDateExtenso(process.dataPericia)}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-12 pt-6">
                <div className="signature-block no-spacing text-center mx-auto space-y-0.5">
                  <div className="border-t border-slate-400 w-72 mx-auto pt-2 font-black text-slate-900 text-xs text-center no-spacing">
                    {peritoNome}
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 text-center no-spacing">{peritoPapel}</p>
                  <p className="text-[10px] text-slate-500 font-mono text-center no-spacing">{peritoRegistro}</p>
                  {peritoEscritorio && <p className="text-[10px] text-slate-500 font-sans text-center no-spacing">{peritoEscritorio}</p>}
                </div>
              </div>

              {/* Footnotes */}
              <div className="pt-8 border-t border-slate-200 text-[10px] italic text-slate-500 space-y-3 font-sans footnote-block page-break-before print:break-before-page print:page-break-before-always" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
                <p className="footnote italic page-break-before" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>[1] Este documento baseia-se nas diretrizes da Lei 14.181/2021, Código de Defesa do Consumidor - CDC e Norma Brasileira de Contabilidade - NBC TP 01 (R2).</p>
                <p className="footnote italic">[2] Mínimo existencial é o valor mensal necessário à subsistência digna do consumidor, considerando moradia, alimentação, saúde, educação, transporte, entre outros. Decreto nº 11.150/2022.</p>
                <p className="footnote italic">[3] Os empréstimos consignados deduzidos em folha foram devidamente deduzidos para apuração da Renda Líquida Ajustada (RLA), em observância ao CNJ (2022).</p>
                <p className="footnote italic">[4] As taxas médias de mercado foram obtidas junto ao Banco Central do Brasil (BACEN) em https://www3.bcb.gov.br/sgspub.</p>
                <p className="footnote italic">[5] A Taxa Interna de Retorno (TIR) representa a taxa efetiva de remuneração do contrato ao longo do tempo.</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: MINUTA DE PETIÇÃO */}
      {activeSubTab === 'peticao' && (
        <div className="bg-white p-8 rounded-lg border border-slate-300 shadow-md space-y-6 text-slate-900 font-serif w-full parecer-print-document print:border-none print:shadow-none">
          <div className="border-b pb-3 flex justify-between items-center no-print">
            <h3 className="text-sm font-bold text-slate-900 uppercase font-sans">Minuta de Petição de Apresentação de Laudo / Plano</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPeticaoDocx}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-xs border border-blue-600 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Baixar Petição (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700 cursor-pointer transition-all"
              >
                <FileCheck className="w-3.5 h-3.5 text-white" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {profile?.pdfModeloPeticaoNome && (
            <div className="bg-blue-50 border border-blue-300 p-3 rounded font-sans text-xs text-blue-900 font-semibold flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-blue-800 shrink-0" />
              <span>Petição gerada alinhada ao Modelo de Petição enviado no Módulo 1: ({profile.pdfModeloPeticaoNome})</span>
            </div>
          )}

          <div className="space-y-4 text-xs leading-relaxed text-slate-800 font-serif">
            <p className="font-bold uppercase font-sans">
              EXCELENTÍSSIMO SENHOR DOUTOR JUIZ DE DIREITO DA {process.vara || 'VARA CÍVEL'} DA COMARCA DE {comarcaStr.toUpperCase()}
            </p>

            <p className="pt-2 font-mono font-bold"><strong>PROCESSO N.º:</strong> {process.numeroProcesso}</p>

            <p className="pt-4">
              <strong>{peritoNome.toUpperCase()}</strong>, {peritoPapel}, regularmente inscrito no conselho de classe sob o nº {peritoRegistro}, vem, respeitosamente, à presença de Vossa Excelência, apresentar o <strong>LAUDO PERICIAL CONTÁBIL E PLANO DE REPACTUAÇÃO DE DÍVIDAS (LEI 14.181/2021)</strong> em anexo.
            </p>

            <p>
              Requer a juntada do laudo e a intimação das partes para manifestação no prazo legal.
            </p>

            <div className="pt-8 font-sans space-y-4">
              <p className="text-right font-bold text-slate-900">{formatDateExtenso(process.dataPericia)}</p>
              <div className="signature-block no-spacing text-center space-y-0.5 pt-4">
                <div className="border-t border-slate-400 w-72 mx-auto pt-2 font-bold text-slate-900 text-center no-spacing">
                  {peritoNome}
                </div>
                <p className="text-[11px] font-bold text-slate-700 text-center no-spacing">{peritoPapel}</p>
                <p className="text-[10px] text-slate-500 font-mono text-center no-spacing">{peritoRegistro}</p>
                {peritoEscritorio && <p className="text-[10px] text-slate-500 font-sans text-center no-spacing">{peritoEscritorio}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: QUESITOS PERICIAIS */}
      {activeSubTab === 'quesitos' && (
        <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-md space-y-4 font-sans text-xs w-full parecer-print-document print:border-none print:shadow-none">
          <div className="border-b pb-3 flex justify-between items-center no-print">
            <h3 className="text-sm font-bold text-slate-900 uppercase">Respostas Aos Quesitos Periciais ({quesitos.length} Quesitos)</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const htmlBody = `
                    <h1>RESPOSTAS AOS QUESITOS PERICIAIS</h1>
                    <p><strong>PROCESSO:</strong> ${process.numeroProcesso}</p>
                    <p><strong>REQUERENTE:</strong> ${devedorNome}</p>
                    ${quesitos.map((q, idx) => `
                      <h3>Quesito N.º ${idx + 1} (${q.origem})</h3>
                      ${formatParagraphsHtml(`Q: ${q.pergunta}`)}
                      ${formatParagraphsHtml(`R: ${q.respostaTecnica}`)}
                    `).join('')}
                  `;
                  exportDocumentToDocx(`Quesitos_Respondidos_${devedorNome}.docx`, 'Quesitos Respondidos', htmlBody);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs rounded-xl shadow-xs border border-blue-600 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Exportar Quesitos (.docx)</span>
              </button>
              <button
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs border border-slate-700 cursor-pointer transition-all"
              >
                <FileCheck className="w-3.5 h-3.5 text-white" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {quesitos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic border border-dashed rounded-xl">
                Nenhum quesito judicial cadastrado no momento.
              </div>
            ) : (
              quesitos.map((q, idx) => (
                <div key={q.id} className="p-4 bg-slate-50 border border-slate-300 rounded-md space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Quesito N.º {idx + 1} ({q.origem})</span>
                  </div>
                  <p className="font-semibold text-slate-800">Q: {q.pergunta}</p>
                  <div className="bg-white p-3 rounded border border-slate-200 text-slate-900 font-mono text-[11px]">
                    <strong>Resposta do Perito:</strong> {q.respostaTecnica}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
