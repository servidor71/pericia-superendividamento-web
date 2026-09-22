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
        data_primeira_parcela DATE,
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

    try {
      await dbPool.query(`ALTER TABLE contratos_bancarios ADD COLUMN data_primeira_parcela DATE;`);
    } catch (e) {
      // Coluna já existe
    }

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
      const procId = process?.id || `proc_${procNum}`;
      if (process && !process.id) {
        process.id = procId;
      }

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
              id, processo_id, credor, numero_contrato, modalidade, data_contrato, data_primeira_parcela, vencimento_final,
              valor_liberado_contrato, valor_final_contrato, valor_iof, qtd_parcelas_total, qtd_parcelas_pagas,
              qtd_parcelas_restantes, valor_parcela_atual, taxa_juros_mes, taxa_juros_ano, cet_mes, cet_ano,
              tem_seguro_prestamista, valor_seguro_prestamista, tem_tarifas_abusivas, valor_tarifas_abusivas,
              expurgar_abusividades, tipo_indice_correcao, fator_correcao_7casas, data_referencia_ultimo_pagamento,
              saldo_devedor_ref_ultima_parcela, taxa_media_bacen_mes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              credor = VALUES(credor),
              numero_contrato = VALUES(numero_contrato),
              modalidade = VALUES(modalidade),
              data_contrato = VALUES(data_contrato),
              data_primeira_parcela = VALUES(data_primeira_parcela),
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
              parseSqlDate(c.dataContrato), parseSqlDate(c.dataPrimeiraParcela), parseSqlDate(c.vencimentoFinal),
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

// -----------------------------------------------------------------------------
// GESTÃO INDIVIDUAL DE PROCESSOS (LISTAR, CARREGAR POR ID, EXCLUIR)
// -----------------------------------------------------------------------------

export async function listAllProcesses() {
  const processList = [];

  // 1. Tenta buscar do MySQL
  if (dbPool && isMySqlConnected) {
    try {
      const [rows] = await dbPool.query(`
        SELECT 
          p.id,
          p.numero_processo as numeroProcesso,
          p.classe_processual as classeProcessual,
          p.tribunal,
          p.comarca,
          p.vara,
          p.magistrado,
          p.cidade_uf as cidadeUf,
          p.nome_devedor as nomeDevedor,
          p.cpf_cnpj_devedor as cpfCnpjDevedor,
          p.profissao,
          p.status_processo as statusProcesso,
          p.data_pericia as dataPericia,
          p.criado_em as criadoEm,
          p.atualizado_em as atualizadoEm,
          (SELECT COUNT(*) FROM contratos_bancarios cb WHERE cb.processo_id = p.id) as qtdContratos,
          (SELECT COALESCE(SUM(cb.valor_final_contrato), 0) FROM contratos_bancarios cb WHERE cb.processo_id = p.id) as valorTotalContratos
        FROM processos p
        ORDER BY p.atualizado_em DESC
      `);

      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map(r => ({
          ...r,
          dataPericia: r.dataPericia ? new Date(r.dataPericia).toISOString().split('T')[0] : '',
          qtdContratos: Number(r.qtdContratos || 0),
          valorTotalContratos: Number(r.valorTotalContratos || 0)
        }));
      }
    } catch (err) {
      console.error('Erro ao listar processos do MySQL:', err?.message || err);
    }
  }

  // 2. Fallback: buscar do arquivo JSON local (e dados_sistema)
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const content = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      
      Object.keys(parsed).forEach(k => {
        if (k.startsWith('dados_processo') || k.startsWith('proc_')) {
          const item = parsed[k];
          if (item && item.process) {
            const proc = item.process;
            const contracts = item.contracts || [];
            const procId = proc.id || k.replace('dados_processo_', '');
            processList.push({
              id: procId,
              numeroProcesso: proc.numeroProcesso || 'Sem número',
              nomeDevedor: proc.nomeDevedor || 'Devedor não identificado',
              cpfCnpjDevedor: proc.cpfCnpj || '',
              tribunal: proc.tribunal || '',
              comarca: proc.comarca || '',
              vara: proc.vara || '',
              statusProcesso: proc.statusProcesso || 'Em Análise',
              dataPericia: proc.dataPericia || '',
              atualizadoEm: parsed.last_updated || new Date().toISOString(),
              qtdContratos: Array.isArray(contracts) ? contracts.length : 0,
              valorTotalContratos: Array.isArray(contracts) 
                ? contracts.reduce((acc, c) => acc + Number(c.valorFinalContrato || 0), 0) 
                : 0
            });
          }
        }
      });

      // Se só houver 'dados_processo' padrão no JSON sem prefixo específico
      if (processList.length === 0 && parsed['dados_processo'] && parsed['dados_processo'].process) {
        const item = parsed['dados_processo'];
        const proc = item.process;
        const contracts = item.contracts || [];
        const procId = proc.id || 'proc_default';
        processList.push({
          id: procId,
          numeroProcesso: proc.numeroProcesso || '0000000-00.2026.8.07.0001',
          nomeDevedor: proc.nomeDevedor || 'Devedor Principal',
          cpfCnpjDevedor: proc.cpfCnpj || '',
          tribunal: proc.tribunal || '',
          comarca: proc.comarca || '',
          vara: proc.vara || '',
          statusProcesso: proc.statusProcesso || 'Em Análise',
          dataPericia: proc.dataPericia || '',
          atualizadoEm: parsed.last_updated || new Date().toISOString(),
          qtdContratos: Array.isArray(contracts) ? contracts.length : 0,
          valorTotalContratos: Array.isArray(contracts) 
            ? contracts.reduce((acc, c) => acc + Number(c.valorFinalContrato || 0), 0) 
            : 0
        });
      }
    }
  } catch (err) {
    console.error('Erro ao ler processos do JSON local:', err);
  }

  return processList;
}

export async function loadProcessById(procId) {
  if (!procId) return null;

  // 1. Tenta carregar do MySQL Relacional
  if (dbPool && isMySqlConnected) {
    try {
      const [pRows] = await dbPool.query(
        `SELECT * FROM processos WHERE id = ? OR numero_processo = ? LIMIT 1`,
        [procId, procId]
      );

      if (Array.isArray(pRows) && pRows.length > 0) {
        const p = pRows[0];
        const actualProcId = p.id;

        // Rendas
        const [rRows] = await dbPool.query(`SELECT * FROM rendas_processo WHERE processo_id = ? LIMIT 1`, [actualProcId]);
        const r = rRows[0] || {};

        // Despesas
        const [dRows] = await dbPool.query(`SELECT * FROM despesas_essenciais WHERE processo_id = ? LIMIT 1`, [actualProcId]);
        const d = dRows[0] || {};

        // Contratos
        const [cRows] = await dbPool.query(`SELECT * FROM contratos_bancarios WHERE processo_id = ?`, [actualProcId]);

        // Quesitos
        const [qRows] = await dbPool.query(`SELECT * FROM quesitos_periciais WHERE processo_id = ? ORDER BY ordem ASC`, [actualProcId]);

        // Documentos
        const [docRows] = await dbPool.query(`SELECT * FROM documentos_processo WHERE processo_id = ?`, [actualProcId]);

        // Perfil Master
        const [profRows] = await dbPool.query(`SELECT * FROM perfis_profissionais WHERE usuario_id = 'usr_master' LIMIT 1`);
        const prof = profRows[0] || {};

        return {
          profile: {
            nomeProfissional: prof.nome_profissional || '',
            papel: prof.papel || 'Perito Judicial',
            registroProfissional: prof.registro_profissional || '',
            cpfCnpj: prof.cpf_cnpj || '',
            nomeEscritorioEmpresa: prof.nome_escritorio_empresa || '',
            email: prof.email || '',
            telefoneWhatsapp: prof.telefone_whatsapp || '',
            enderecoComercial: prof.endereco_comercial || '',
            cidadeUf: prof.cidade_uf || '',
            logomarcaUrl: prof.logomarca_url || null,
          },
          process: {
            id: p.id,
            numeroProcesso: p.numero_processo || '',
            classeProcessual: p.classe_processual || '',
            tribunal: p.tribunal || '',
            comarca: p.comarca || '',
            vara: p.vara || '',
            magistrado: p.magistrado || '',
            cidadeUf: p.cidade_uf || '',
            nomeDevedor: p.nome_devedor || '',
            cpfCnpj: p.cpf_cnpj_devedor || '',
            profissao: p.profissao || '',
            vinculoEmpregaticio: p.vinculo_empregaticio || '',
            empregador: p.empregador || '',
            peritoDesignado: p.perito_designado || '',
            registroProfissional: p.registro_profissional || '',
            prazoPlanoMeses: p.prazo_plano_meses || 60,
            dataPericia: p.data_pericia ? new Date(p.data_pericia).toISOString().split('T')[0] : '',
            statusProcesso: p.status_processo || 'Em Análise',
          },
          income: {
            salarioBruto: Number(r.salario_bruto || 0),
            rppsInss: Number(r.rpps_inss || 0),
            irrf: Number(r.irrf || 0),
            pensaoAlimenticia: Number(r.pensao_alimenticia || 0),
            planoSaudeFolha: Number(r.plano_saude_folha || 0),
            outrasDeducoesLegais: Number(r.outras_deducoes_legais || 0),
          },
          expenses: {
            moradia: Number(d.moradia || 0),
            alimentacao: Number(d.alimentacao || 0),
            saudeMedicamentos: Number(d.saude_medicamentos || 0),
            transporte: Number(d.transporte || 0),
            educacaoDependentes: Number(d.educacao_dependentes || 0),
            outrasDespesasEssenciais: Number(d.outras_despesas_essenciais || 0),
            minimoExistencialConfig: Number(d.minimo_existencial_config || 1621),
            justificativaMinimoExistencial: d.justificativa_minimo_existencial || '',
            fonteMoradia: d.fonte_moradia || '',
            fonteAlimentacao: d.fonte_alimentacao || '',
            fonteSaude: d.fonte_saude || '',
            fonteTransporte: d.fonte_transporte || '',
            fonteEducacao: d.fonte_educacao || '',
            fonteOutrasDespesas: d.fonte_outras_despesas || '',
          },
          contracts: (cRows || []).map(c => ({
            id: c.id,
            credor: c.credor || '',
            numeroContrato: c.numero_contrato || '',
            modalidade: c.modalidade || '',
            dataContrato: c.data_contrato ? new Date(c.data_contrato).toISOString().split('T')[0] : '',
            dataPrimeiraParcela: c.data_primeira_parcela ? new Date(c.data_primeira_parcela).toISOString().split('T')[0] : '',
            vencimentoFinal: c.vencimento_final ? new Date(c.vencimento_final).toISOString().split('T')[0] : '',
            valorLiberadoContrato: Number(c.valor_liberado_contrato || 0),
            valorFinalContrato: Number(c.valor_final_contrato || 0),
            valorIOF: Number(c.valor_iof || 0),
            qtdParcelasTotal: Number(c.qtd_parcelas_total || 0),
            qtdParcelasPagas: Number(c.qtd_parcelas_pagas || 0),
            qtdParcelasRestantes: Number(c.qtd_parcelas_restantes || 0),
            valorParcelaAtual: Number(c.valor_parcela_atual || 0),
            taxaJurosMes: Number(c.taxa_juros_mes || 0),
            taxaJurosAno: Number(c.taxa_juros_ano || 0),
            cetMes: Number(c.cet_mes || 0),
            cetAno: Number(c.cet_ano || 0),
            temSeguroPrestamista: Boolean(c.tem_seguro_prestamista),
            valorSeguroPrestamista: Number(c.valor_seguro_prestamista || 0),
            temTarifasAbusivas: Boolean(c.tem_tarifas_abusivas),
            valorTarifasAbusivas: Number(c.valor_tarifas_abusivas || 0),
            expurgarAbusividades: Boolean(c.expurgar_abusividades),
            tipoIndiceCorrecao: c.tipo_indice_correcao || 'INPC',
            fatorCorrecao7Casas: Number(c.fator_correcao_7casas || 1.0),
            dataReferenciaUltimoPagamento: c.data_referencia_ultimo_pagamento ? new Date(c.data_referencia_ultimo_pagamento).toISOString().split('T')[0] : '',
            saldoDevedorRefUltimaParcela: Number(c.saldo_devedor_ref_ultima_parcela || 0),
            taxaMediaBacenMes: Number(c.taxa_media_bacen_mes || 0),
          })),
          quesitos: (qRows || []).map(q => ({
            id: q.id,
            origem: q.origem,
            pergunta: q.pergunta,
            respostaTecnica: q.resposta_tecnica
          })),
          documents: (docRows || []).map(doc => ({
            id: doc.id,
            categoria: doc.categoria,
            tipoDocumento: doc.tipo_documento,
            nomeArquivo: doc.nome_arquivo,
            tamanhoArquivo: doc.tamanho_arquivo,
            idPaginaReferencia: doc.id_pagina_referencia,
            observacao: doc.observacao,
            rawTextContent: doc.raw_text_content
          }))
        };
      }
    } catch (err) {
      console.error(`Erro ao carregar processo [${procId}] do MySQL:`, err?.message || err);
    }
  }

  // 2. Fallback: carregar do JSON local
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const content = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);

      const keyDirect = `dados_processo_${procId}`;
      if (parsed[keyDirect]) return parsed[keyDirect];
      if (parsed[procId]) return parsed[procId];
      if (parsed['dados_processo']) return parsed['dados_processo'];
    }
  } catch (err) {
    console.error(`Erro ao ler processo [${procId}] do JSON local:`, err);
  }

  return null;
}

export async function deleteProcessById(procId) {
  if (!procId) return { success: false, error: 'ID do processo não fornecido' };

  let deleted = false;

  if (dbPool && isMySqlConnected) {
    try {
      const [res] = await dbPool.query(
        `DELETE FROM processos WHERE id = ? OR numero_processo = ?`,
        [procId, procId]
      );
      await dbPool.query(
        `DELETE FROM dados_sistema WHERE id = ? OR id = ?`,
        [procId, `dados_processo_${procId}`]
      );
      if (res.affectedRows > 0) deleted = true;
    } catch (err) {
      console.error(`Erro ao excluir processo [${procId}] do MySQL:`, err?.message || err);
    }
  }

  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const content = fs.readFileSync(JSON_DB_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      
      const keysToDelete = [
        procId,
        `dados_processo_${procId}`,
        `proc_${procId}`
      ];

      keysToDelete.forEach(k => {
        if (parsed[k]) {
          delete parsed[k];
          deleted = true;
        }
      });

      fs.writeFileSync(JSON_DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error(`Erro ao excluir processo [${procId}] do JSON local:`, err);
  }

  return { success: true, deleted };
}

export function getDbStatus() {
  return {
    isMySqlConnected,
    storageEngine: isMySqlConnected ? 'MySQL Relacional (Hostinger)' : 'Local JSON Storage',
    fallbackPath: JSON_DB_PATH
  };
}
