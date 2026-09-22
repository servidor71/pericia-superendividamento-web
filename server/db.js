import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JSON_DB_PATH = path.resolve(__dirname, '../data/database_fallback.json');

// Garante que o diretório de dados existe
const dataDir = path.dirname(JSON_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let dbPool = null;
let isMySqlConnected = false;

// -----------------------------------------------------------------------------
// INICIALIZADOR DE CONEXÃO MYSQL DA HOSTINGER
// -----------------------------------------------------------------------------
export async function initDatabase() {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.DB_PASS;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.DB_DATABASE;
  const port = Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306);

  if (host && user && database) {
    try {
      dbPool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const connection = await dbPool.getConnection();
      console.log(`✅ Conectado com sucesso ao MySQL da Hostinger: ${database}@${host}`);
      connection.release();
      isMySqlConnected = true;

      // Executa auto-criação de tabelas e usuário master
      await createTablesIfNotExist();
      return true;
    } catch (err) {
      console.warn('⚠️ Não foi possível conectar ao MySQL com as credenciais do .env:', err?.message || err);
      console.warn('📁 Usando armazenamento seguro local (JSON Fallback) para nenhum dado ser perdido.');
      isMySqlConnected = false;
      return false;
    }
  } else {
    console.log('ℹ️ Variáveis de ambiente DB_HOST/DB_USER/DB_NAME não detectadas no .env.');
    console.log('📁 O sistema salvará todas as informações no arquivo local `data/database_fallback.json`.');
    isMySqlConnected = false;
    return false;
  }
}

// -----------------------------------------------------------------------------
// CRIAÇÃO AUTOMÁTICA E VERIFICAÇÃO DE TABELAS RELACIONAIS
// -----------------------------------------------------------------------------
async function createTablesIfNotExist() {
  if (!dbPool || !isMySqlConnected) return;

  try {
    // 1. Tabela Tabela Auxiliar de Dados JSON
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS dados_sistema (
        id VARCHAR(50) PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        conteudo LONGTEXT NOT NULL,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Tabela de Usuários (Garante chave estrangeira para usuario_id)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR(36) PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NOT NULL,
        cpf_cnpj VARCHAR(20),
        telefone_whatsapp VARCHAR(30),
        plano_tipo VARCHAR(20) DEFAULT 'master',
        status_assinatura VARCHAR(20) DEFAULT 'ativo',
        laudos_gerados_mes INT DEFAULT 0,
        max_laudos_mes INT DEFAULT 999999,
        trial_expira_em DATETIME,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insere o Usuário Master Padrão se não existir
    await dbPool.query(`
      INSERT INTO usuarios (id, nome, email, senha_hash, plano_tipo, status_assinatura)
      VALUES ('usr_master', 'Administrador Master', 'admin@periciamaster.com.br', 'AdminMaster2026!', 'master', 'ativo')
      ON DUPLICATE KEY UPDATE nome = VALUES(nome);
    `);

    // 3. Tabela de Perfis Profissionais
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS perfis_profissionais (
        id VARCHAR(36) PRIMARY KEY,
        usuario_id VARCHAR(36) NOT NULL,
        nome_profissional VARCHAR(255) NOT NULL,
        papel VARCHAR(50) DEFAULT 'Perito Judicial',
        registro_profissional VARCHAR(100),
        cpf_cnpj VARCHAR(20),
        nome_escritorio_empresa VARCHAR(255),
        email VARCHAR(255),
        telefone_whatsapp VARCHAR(30),
        endereco_comercial TEXT,
        cidade_uf VARCHAR(100),
        logomarca_url LONGTEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Tabela de Processos
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS processos (
        id VARCHAR(36) PRIMARY KEY,
        usuario_id VARCHAR(36) NOT NULL,
        numero_processo VARCHAR(50) NOT NULL,
        classe_processual VARCHAR(100) DEFAULT 'Superendividamento - Lei 14.181/2021',
        tribunal VARCHAR(100),
        comarca VARCHAR(100),
        vara VARCHAR(100),
        magistrado VARCHAR(255),
        cidade_uf VARCHAR(100),
        nome_devedor VARCHAR(255) NOT NULL,
        cpf_cnpj_devedor VARCHAR(20),
        profissao VARCHAR(100),
        vinculo_empregaticio VARCHAR(100),
        empregador VARCHAR(255),
        perito_designado VARCHAR(255),
        registro_profissional VARCHAR(100),
        prazo_plano_meses INT DEFAULT 60,
        data_pericia DATE,
        valor_causa DECIMAL(15, 2) DEFAULT 0.00,
        status_processo VARCHAR(50) DEFAULT 'Em Análise',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Tabela de Rendas (RLA)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS rendas_processo (
        id VARCHAR(36) PRIMARY KEY,
        processo_id VARCHAR(36) NOT NULL UNIQUE,
        salario_bruto DECIMAL(15, 2) DEFAULT 0.00,
        rpps_inss DECIMAL(15, 2) DEFAULT 0.00,
        irrf DECIMAL(15, 2) DEFAULT 0.00,
        pensao_alimenticia DECIMAL(15, 2) DEFAULT 0.00,
        plano_saude_folha DECIMAL(15, 2) DEFAULT 0.00,
        outras_deducoes_legais DECIMAL(15, 2) DEFAULT 0.00,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Tabela de Despesas Essenciais
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS despesas_essenciais (
        id VARCHAR(36) PRIMARY KEY,
        processo_id VARCHAR(36) NOT NULL UNIQUE,
        moradia DECIMAL(15, 2) DEFAULT 0.00,
        alimentacao DECIMAL(15, 2) DEFAULT 0.00,
        saude_medicamentos DECIMAL(15, 2) DEFAULT 0.00,
        transporte DECIMAL(15, 2) DEFAULT 0.00,
        educacao_dependentes DECIMAL(15, 2) DEFAULT 0.00,
        outras_despesas_essenciais DECIMAL(15, 2) DEFAULT 0.00,
        minimo_existencial_config DECIMAL(15, 2) DEFAULT 1621.00,
        justificativa_minimo_existencial TEXT,
        fonte_moradia VARCHAR(255),
        fonte_alimentacao VARCHAR(255),
        fonte_saude VARCHAR(255),
        fonte_transporte VARCHAR(255),
        fonte_educacao VARCHAR(255),
        fonte_outras_despesas VARCHAR(255),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Tabela de Contratos Bancários
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS contratos_bancarios (
        id VARCHAR(36) PRIMARY KEY,
        processo_id VARCHAR(36) NOT NULL,
        credor VARCHAR(255) NOT NULL,
        numero_contrato VARCHAR(100) NOT NULL,
        modalidade VARCHAR(100) NOT NULL,
        data_contrato DATE,
        vencimento_final DATE,
        valor_liberado_contrato DECIMAL(15, 2) DEFAULT 0.00,
        valor_final_contrato DECIMAL(15, 2) DEFAULT 0.00,
        valor_iof DECIMAL(15, 2) DEFAULT 0.00,
        qtd_parcelas_total INT DEFAULT 0,
        qtd_parcelas_pagas INT DEFAULT 0,
        qtd_parcelas_restantes INT DEFAULT 0,
        valor_parcela_atual DECIMAL(15, 2) DEFAULT 0.00,
        taxa_juros_mes DECIMAL(8, 4) DEFAULT 0.0000,
        taxa_juros_ano DECIMAL(8, 4) DEFAULT 0.0000,
        cet_mes DECIMAL(8, 4) DEFAULT 0.0000,
        cet_ano DECIMAL(8, 4) DEFAULT 0.0000,
        tem_seguro_prestamista BOOLEAN DEFAULT FALSE,
        valor_seguro_prestamista DECIMAL(15, 2) DEFAULT 0.00,
        tem_tarifas_abusivas BOOLEAN DEFAULT FALSE,
        valor_tarifas_abusivas DECIMAL(15, 2) DEFAULT 0.00,
        expurgar_abusividades BOOLEAN DEFAULT FALSE,
        tipo_indice_correcao VARCHAR(10) DEFAULT 'INPC',
        fator_correcao_7casas DECIMAL(12, 7) DEFAULT 1.0000000,
        data_referencia_ultimo_pagamento DATE,
        saldo_devedor_ref_ultima_parcela DECIMAL(15, 2) DEFAULT 0.00,
        taxa_media_bacen_mes DECIMAL(8, 4) DEFAULT 0.0000,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Tabela de Quesitos Periciais
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS quesitos_periciais (
        id VARCHAR(36) PRIMARY KEY,
        processo_id VARCHAR(36) NOT NULL,
        ordem INT DEFAULT 1,
        origem VARCHAR(50) DEFAULT 'Juízo',
        pergunta TEXT NOT NULL,
        resposta_tecnica TEXT NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Tabela de Documentos
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS documentos_processo (
        id VARCHAR(36) PRIMARY KEY,
        processo_id VARCHAR(36) NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        tipo_documento VARCHAR(100),
        nome_arquivo VARCHAR(255),
        tamanho_arquivo VARCHAR(50),
        id_pagina_referencia VARCHAR(100),
        observacao TEXT,
        raw_text_content LONGTEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('✅ Todas as tabelas relacionais do banco MySQL foram verificadas/criadas!');
  } catch (err) {
    console.error('Erro ao verificar/criar tabelas relacionais no MySQL:', err?.message || err);
  }
}

// Helper para validar datas no formato AAAA-MM-DD
function parseSqlDate(dateStr) {
  if (!dateStr || dateStr === '—') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return null;
}

// -----------------------------------------------------------------------------
// MÉTODO DE GRAVAÇÃO NAS TABELAS RELACIONAIS MYSQL (+ JSON FALLBACK)
// -----------------------------------------------------------------------------
export async function saveSystemData(key, data) {
  const jsonStr = JSON.stringify(data, null, 2);
  const userId = 'usr_master'; // Usuário padrão master do sistema

  // 1. GRAVAÇÃO RELACIONAL NO MYSQL (TABELAS INDIVIDUAIS)
  if (dbPool && isMySqlConnected && data && typeof data === 'object') {
    try {
      // A. Salva no JSON auxiliar dados_sistema
      await dbPool.query(
        `INSERT INTO dados_sistema (id, tipo, conteudo) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE conteudo = VALUES(conteudo)`,
        [key, key, jsonStr]
      );

      const { profile, process, income, expenses, contracts, quesitos, documents } = data;

      // B. Salva Perfil Profissional
      if (profile) {
        const perfId = `perf_${userId}`;
        await dbPool.query(
          `INSERT INTO perfis_profissionais (
            id, usuario_id, nome_profissional, papel, registro_profissional, cpf_cnpj,
            nome_escritorio_empresa, email, telefone_whatsapp, endereco_comercial, cidade_uf, logomarca_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            nome_profissional = VALUES(nome_profissional),
            papel = VALUES(papel),
            registro_profissional = VALUES(registro_profissional),
            cpf_cnpj = VALUES(cpf_cnpj),
            nome_escritorio_empresa = VALUES(nome_escritorio_empresa),
            email = VALUES(email),
            telefone_whatsapp = VALUES(telefone_whatsapp),
            endereco_comercial = VALUES(endereco_comercial),
            cidade_uf = VALUES(cidade_uf),
            logomarca_url = VALUES(logomarca_url)`,
          [
            perfId, userId, profile.nomeProfissional || 'Perito Judicial', profile.papel || 'Perito Judicial',
            profile.registroProfissional || '', profile.cpfCnpj || '', profile.nomeEscritorioEmpresa || '',
            profile.email || '', profile.telefoneWhatsapp || '', profile.enderecoComercial || '',
            profile.cidadeUf || '', profile.logomarcaUrl || null
          ]
        );
      }

      // C. Salva Processo Principal
      const procNum = (process?.numeroProcesso || '0000000-00.2026.8.07.0001').replace(/[^a-zA-Z0-9-.]/g, '_');
      const procId = `proc_${procNum}`;

      if (process) {
        await dbPool.query(
          `INSERT INTO processos (
            id, usuario_id, numero_processo, classe_processual, tribunal, comarca, vara, magistrado,
            cidade_uf, nome_devedor, cpf_cnpj_devedor, profissao, vinculo_empregaticio, empregador,
            perito_designado, registro_profissional, prazo_plano_meses, data_pericia, status_processo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            numero_processo = VALUES(numero_processo),
            classe_processual = VALUES(classe_processual),
            tribunal = VALUES(tribunal),
            comarca = VALUES(comarca),
            vara = VALUES(vara),
            magistrado = VALUES(magistrado),
            cidade_uf = VALUES(cidade_uf),
            nome_devedor = VALUES(nome_devedor),
            cpf_cnpj_devedor = VALUES(cpf_cnpj_devedor),
            profissao = VALUES(profissao),
            vinculo_empregaticio = VALUES(vinculo_empregaticio),
            empregador = VALUES(empregador),
            perito_designado = VALUES(perito_designado),
            registro_profissional = VALUES(registro_profissional),
            prazo_plano_meses = VALUES(prazo_plano_meses),
            data_pericia = VALUES(data_pericia),
            status_processo = VALUES(status_processo)`,
          [
            procId, userId, process.numeroProcesso || '0000000-00.2026.8.07.0001',
            process.classeProcessual || 'Superendividamento - Lei 14.181/2021',
            process.tribunal || '', process.comarca || '', process.vara || '', process.magistrado || '',
            process.cidadeUf || '', process.nomeDevedor || 'Devedor', process.cpfCnpj || '',
            process.profissao || '', process.vinculoEmpregaticio || '', process.empregador || '',
            process.peritoDesignado || '', process.registroProfissional || '',
            Number(process.prazoPlanoMeses || 60), parseSqlDate(process.dataPericia), process.statusProcesso || 'Em Análise'
          ]
        );
      }

      // D. Salva RLA (Rendas)
      if (income && procId) {
        const rendaId = `renda_${procId}`;
        await dbPool.query(
          `INSERT INTO rendas_processo (
            id, processo_id, salario_bruto, rpps_inss, irrf, pensao_alimenticia, plano_saude_folha, outras_deducoes_legais
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            salario_bruto = VALUES(salario_bruto),
            rpps_inss = VALUES(rpps_inss),
            irrf = VALUES(irrf),
            pensao_alimenticia = VALUES(pensao_alimenticia),
            plano_saude_folha = VALUES(plano_saude_folha),
            outras_deducoes_legais = VALUES(outras_deducoes_legais)`,
          [
            rendaId, procId, Number(income.salarioBruto || 0), Number(income.rppsInss || 0),
            Number(income.irrf || 0), Number(income.pensaoAlimenticia || 0),
            Number(income.planoSaudeFolha || 0), Number(income.outrasDeducoesLegais || 0)
          ]
        );
      }

      // E. Salva Despesas Essenciais
      if (expenses && procId) {
        const despesaId = `desp_${procId}`;
        await dbPool.query(
          `INSERT INTO despesas_essenciais (
            id, processo_id, moradia, alimentacao, saude_medicamentos, transporte, educacao_dependentes,
            outras_despesas_essenciais, minimo_existencial_config, justificativa_minimo_existencial,
            fonte_moradia, fonte_alimentacao, fonte_saude, fonte_transporte, fonte_educacao, fonte_outras_despesas
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            moradia = VALUES(moradia),
            alimentacao = VALUES(alimentacao),
            saude_medicamentos = VALUES(saude_medicamentos),
            transporte = VALUES(transporte),
            educacao_dependentes = VALUES(educacao_dependentes),
            outras_despesas_essenciais = VALUES(outras_despesas_essenciais),
            minimo_existencial_config = VALUES(minimo_existencial_config),
            justificativa_minimo_existencial = VALUES(justificativa_minimo_existencial),
            fonte_moradia = VALUES(fonte_moradia),
            fonte_alimentacao = VALUES(fonte_alimentacao),
            fonte_saude = VALUES(fonte_saude),
            fonte_transporte = VALUES(fonte_transporte),
            fonte_educacao = VALUES(fonte_educacao),
            fonte_outras_despesas = VALUES(fonte_outras_despesas)`,
          [
            despesaId, procId, Number(expenses.moradia || 0), Number(expenses.alimentacao || 0),
            Number(expenses.saudeMedicamentos || 0), Number(expenses.transporte || 0),
            Number(expenses.educacaoDependentes || 0), Number(expenses.outrasDespesasEssenciais || 0),
            Number(expenses.minimoExistencialConfig || 1621), expenses.justificativaMinimoExistencial || '',
            expenses.fonteMoradia || '', expenses.fonteAlimentacao || '', expenses.fonteSaude || '',
            expenses.fonteTransporte || '', expenses.fonteEducacao || '', expenses.fonteOutrasDespesas || ''
          ]
        );
      }

      // F. Salva Contratos Bancários (Cada contrato individualmente)
      if (Array.isArray(contracts) && procId) {
        for (const c of contracts) {
          const contractId = c.id ? `ctr_${c.id}` : `ctr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await dbPool.query(
            `INSERT INTO contratos_bancarios (
              id, processo_id, credor, numero_contrato, modalidade, data_contrato, vencimento_final,
              valor_liberado_contrato, valor_final_contrato, valor_iof, qtd_parcelas_total, qtd_parcelas_pagas,
              qtd_parcelas_restantes, valor_parcela_atual, taxa_juros_mes, taxa_juros_ano, cet_mes, cet_ano,
              tem_seguro_prestamista, valor_seguro_prestamista, tem_tarifas_abusivas, valor_tarifas_abusivas,
              expurgar_abusividades, tipo_indice_correcao, fator_correcao_7casas, data_referencia_ultimo_pagamento,
              saldo_devedor_ref_ultima_parcela, taxa_media_bacen_mes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              credor = VALUES(credor),
              numero_contrato = VALUES(numero_contrato),
              modalidade = VALUES(modalidade),
              data_contrato = VALUES(data_contrato),
              vencimento_final = VALUES(vencimento_final),
              valor_liberado_contrato = VALUES(valor_liberado_contrato),
              valor_final_contrato = VALUES(valor_final_contrato),
              valor_iof = VALUES(valor_iof),
              qtd_parcelas_total = VALUES(qtd_parcelas_total),
              qtd_parcelas_pagas = VALUES(qtd_parcelas_pagas),
              qtd_parcelas_restantes = VALUES(qtd_parcelas_restantes),
              valor_parcela_atual = VALUES(valor_parcela_atual),
              taxa_juros_mes = VALUES(taxa_juros_mes),
              taxa_juros_ano = VALUES(taxa_juros_ano),
              cet_mes = VALUES(cet_mes),
              cet_ano = VALUES(cet_ano),
              tem_seguro_prestamista = VALUES(tem_seguro_prestamista),
              valor_seguro_prestamista = VALUES(valor_seguro_prestamista),
              tem_tarifas_abusivas = VALUES(tem_tarifas_abusivas),
              valor_tarifas_abusivas = VALUES(valor_tarifas_abusivas),
              expurgar_abusividades = VALUES(expurgar_abusividades),
              tipo_indice_correcao = VALUES(tipo_indice_correcao),
              fator_correcao_7casas = VALUES(fator_correcao_7casas),
              data_referencia_ultimo_pagamento = VALUES(data_referencia_ultimo_pagamento),
              saldo_devedor_ref_ultima_parcela = VALUES(saldo_devedor_ref_ultima_parcela),
              taxa_media_bacen_mes = VALUES(taxa_media_bacen_mes)`,
            [
              contractId, procId, c.credor || 'Banco', c.numeroContrato || '000000', c.modalidade || 'Empréstimo',
              parseSqlDate(c.dataContrato), parseSqlDate(c.vencimentoFinal),
              Number(c.valorLiberadoContrato || 0), Number(c.valorFinalContrato || 0), Number(c.valorIOF || 0),
              Number(c.qtdParcelasTotal || 0), Number(c.qtdParcelasPagas || 0), Number(c.qtdParcelasRestantes || 0),
              Number(c.valorParcelaAtual || 0), Number(c.taxaJurosMes || 0), Number(c.taxaJurosAno || 0),
              Number(c.cetMes || 0), Number(c.cetAno || 0), Boolean(c.temSeguroPrestamista),
              Number(c.valorSeguroPrestamista || 0), Boolean(c.temTarifasAbusivas), Number(c.valorTarifasAbusivas || 0),
              Boolean(c.expurgarAbusividades), c.tipoIndiceCorrecao || 'INPC', Number(c.fatorCorrecao7Casas || 1.0),
              parseSqlDate(c.dataReferenciaUltimoPagamento), Number(c.saldoDevedorRefUltimaParcela || 0),
              Number(c.taxaMediaBacenMes || 0)
            ]
          );
        }
      }

      // G. Salva Quesitos Periciais
      if (Array.isArray(quesitos) && procId) {
        for (let idx = 0; idx < quesitos.length; idx++) {
          const q = quesitos[idx];
          const qId = q.id ? `q_${q.id}` : `q_${procId}_${idx + 1}`;
          await dbPool.query(
            `INSERT INTO quesitos_periciais (id, processo_id, ordem, origem, pergunta, resposta_tecnica)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               origem = VALUES(origem),
               pergunta = VALUES(pergunta),
               resposta_tecnica = VALUES(resposta_tecnica)`,
            [qId, procId, idx + 1, q.origem || 'Juízo', q.pergunta || '', q.respostaTecnica || '']
          );
        }
      }

      // H. Salva Documentos
      if (Array.isArray(documents) && procId) {
        for (const d of documents) {
          const docId = d.id ? `doc_${d.id}` : `doc_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await dbPool.query(
            `INSERT INTO documentos_processo (id, processo_id, categoria, tipo_documento, nome_arquivo, tamanho_arquivo, id_pagina_referencia, observacao, raw_text_content)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               categoria = VALUES(categoria),
               tipo_documento = VALUES(tipo_documento),
               nome_arquivo = VALUES(nome_arquivo),
               tamanho_arquivo = VALUES(tamanho_arquivo),
               id_pagina_referencia = VALUES(id_pagina_referencia),
               observacao = VALUES(observacao),
               raw_text_content = VALUES(raw_text_content)`,
            [
              docId, procId, d.categoria || 'Outros', d.tipoDocumento || 'Anexo', d.nomeArquivo || 'documento.pdf',
              d.tamanhoArquivo || '', d.idPaginaReferencia || '', d.observacao || '', d.rawTextContent || ''
            ]
          );
        }
      }

      console.log(`💾 Gravação relacional MySQL concluída para o processo ${procId}!`);
    } catch (err) {
      console.error(`Erro ao gravar dados relacionais no MySQL:`, err?.message || err);
    }
  }

  // 2. SALVA UMA CÓPIA NO ARQUIVO LOCAL DE SEGURANÇA
  try {
    let currentData = {};
    if (fs.existsSync(JSON_DB_PATH)) {
      try {
        currentData = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
      } catch (e) {
        currentData = {};
      }
    }
    currentData[key] = data;
    currentData['last_updated'] = new Date().toISOString();
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    return { success: true, storage: isMySqlConnected ? 'MySQL Relacional + Backup' : 'Local JSON Backup' };
  } catch (err) {
    console.error(`Erro ao salvar no arquivo local de backup:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

// -----------------------------------------------------------------------------
// LEITURA DE DADOS RELACIONAIS DO MYSQL (+ FALLBACK JSON)
// -----------------------------------------------------------------------------
export async function loadSystemData(key) {
  // 1. Tenta carregar do MySQL (Relacional ou JSON)
  if (dbPool && isMySqlConnected) {
    try {
      const [rows] = await dbPool.query(`SELECT conteudo FROM dados_sistema WHERE id = ?`, [key]);
      if (Array.isArray(rows) && rows.length > 0) {
        return JSON.parse(rows[0].conteudo);
      }
    } catch (err) {
      console.error(`Erro ao carregar [${key}] do MySQL:`, err?.message || err);
    }
  }

  // 2. Fallback: carrega do JSON local
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const content = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      return parsed[key] || null;
    }
  } catch (err) {
    console.error(`Erro ao ler arquivo local:`, err);
  }

  return null;
}

export function getDbStatus() {
  return {
    isMySqlConnected,
    storageEngine: isMySqlConnected ? 'MySQL Relacional (Hostinger)' : 'Local JSON Storage',
    fallbackPath: JSON_DB_PATH
  };
}
