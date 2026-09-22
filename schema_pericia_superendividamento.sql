-- =============================================================================
-- ESQUEMA DE BANCO DE DADOS COMPLETO - PERÍCIA SUPERENDIVIDAMENTO WEB
-- Compatibilidade: PostgreSQL / MySQL 8.0+ / MariaDB
-- Descrição: Criação de todas as tabelas para arquivamento e persistência do sistema
-- =============================================================================

-- Desativa temporariamente verificações de chave estrangeira durante a criação (MySQL)
SET FOREIGN_KEY_CHECKS = 0;

-- SELECIONE O SEU BANCO DE DADOS DA HOSTINGER (Substitua u800538042_pericia pelo nome exato do seu banco se necessário)
-- USE u800538042_pericia;

-- -----------------------------------------------------------------------------
-- 1. TABELA DE USUÁRIOS E ASSINATURAS (CONTA SAAS)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20),
    telefone_whatsapp VARCHAR(30),
    plano_tipo VARCHAR(20) DEFAULT 'trial', -- 'trial', 'individual', 'escritorio'
    status_assinatura VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'cancelado', 'inadimplente'
    laudos_gerados_mes INT DEFAULT 0,
    max_laudos_mes INT DEFAULT 2,
    trial_expira_em DATETIME,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. TABELA DE PERFIL PROFISSIONAL DO PERITO / ASSISTENTE TÉCNICO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS perfis_profissionais (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    nome_profissional VARCHAR(255) NOT NULL,
    papel VARCHAR(50) DEFAULT 'Perito Judicial', -- 'Perito Judicial', 'Assistente Técnico', 'Advogado', 'Outro'
    registro_profissional VARCHAR(100), -- Ex: CRC/DF 014773 - Corecon/DF 7822
    cpf_cnpj VARCHAR(20),
    nome_escritorio_empresa VARCHAR(255),
    email VARCHAR(255),
    telefone_whatsapp VARCHAR(30),
    endereco_comercial TEXT,
    cidade_uf VARCHAR(100),
    logomarca_url LONGTEXT, -- Base64 ou URL da Logo
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. TABELA DE PROCESSOS JUDICIAIS E DEVEDORES (CASOS DE PERÍCIA)
-- -----------------------------------------------------------------------------
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
    
    -- Dados do Devedor / Consumidor
    nome_devedor VARCHAR(255) NOT NULL,
    cpf_cnpj_devedor VARCHAR(20),
    profissao VARCHAR(100),
    vinculo_empregaticio VARCHAR(100),
    empregador VARCHAR(255),
    
    -- Parâmetros da Perícia
    perito_designado VARCHAR(255),
    registro_profissional VARCHAR(100),
    prazo_plano_meses INT DEFAULT 60,
    data_pericia DATE,
    valor_causa DECIMAL(15, 2) DEFAULT 0.00,
    status_processo VARCHAR(50) DEFAULT 'Em Análise', -- 'Em Análise', 'Laudo Concluído', 'Audiência Agendada', 'Aguardando Homologação'
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 4. TABELA DE DOCUMENTOS E CONTEÚDOS PROCESSUAIS EXTRAÍDOS (OCR / TEXTO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos_processo (
    id VARCHAR(36) PRIMARY KEY,
    processo_id VARCHAR(36) NOT NULL,
    categoria VARCHAR(50) NOT NULL, -- 'Processual', 'Comprobatório Renda', 'Comprobatório Despesa', 'Extrato Dívidas', 'Outros'
    tipo_documento VARCHAR(100),
    nome_arquivo VARCHAR(255),
    tamanho_arquivo VARCHAR(50),
    id_pagina_referencia VARCHAR(100), -- Ex: "ID 274529674, pág. 39"
    observacao TEXT,
    raw_text_content LONGTEXT, -- Texto OCR extraído de PDFs/Contracheques
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 5. TABELA DE RENDA LÍQUIDA MENSAL AJUSTADA (RLA) DO DEVEDOR
-- -----------------------------------------------------------------------------
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
);

-- Tabela Filha: Contracheques por Múltiplos Empregadores
CREATE TABLE IF NOT EXISTS contracheques_empregadores (
    id VARCHAR(36) PRIMARY KEY,
    renda_id VARCHAR(36) NOT NULL,
    nome_empregador VARCHAR(255) NOT NULL,
    rendimento_bruto DECIMAL(15, 2) DEFAULT 0.00,
    rpps_inss DECIMAL(15, 2) DEFAULT 0.00,
    irrf DECIMAL(15, 2) DEFAULT 0.00,
    plano_saude_folha DECIMAL(15, 2) DEFAULT 0.00,
    fonte_doc VARCHAR(255),
    FOREIGN KEY (renda_id) REFERENCES rendas_processo(id) ON DELETE CASCADE
);

-- Tabela Filha: Descontos Específicos em Folha por Contracheque
CREATE TABLE IF NOT EXISTS descontos_folha_itens (
    id VARCHAR(36) PRIMARY KEY,
    contracheque_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    fonte_doc VARCHAR(255),
    FOREIGN KEY (contracheque_id) REFERENCES contracheques_empregadores(id) ON DELETE CASCADE
);

-- Tabela Filha: Outras Receitas Individuais Extras
CREATE TABLE IF NOT EXISTS outras_receitas_itens (
    id VARCHAR(36) PRIMARY KEY,
    renda_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    fonte_doc VARCHAR(255),
    FOREIGN KEY (renda_id) REFERENCES rendas_processo(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 6. TABELA DE DESPESAS ESSENCIAIS E MÍNIMO EXISTENCIAL (DECRETO 11.150/2022)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas_essenciais (
    id VARCHAR(36) PRIMARY KEY,
    processo_id VARCHAR(36) NOT NULL UNIQUE,
    moradia DECIMAL(15, 2) DEFAULT 0.00, -- Aluguel, Condomínio, IPTU
    alimentacao DECIMAL(15, 2) DEFAULT 0.00, -- Supermercado, Feira
    saude_medicamentos DECIMAL(15, 2) DEFAULT 0.00, -- Farmácia, Tratamentos
    transporte DECIMAL(15, 2) DEFAULT 0.00, -- Combustível, Passe
    educacao_dependentes DECIMAL(15, 2) DEFAULT 0.00, -- Escola, Material
    outras_despesas_essenciais DECIMAL(15, 2) DEFAULT 0.00, -- Luz, Água, Gás, Telefone
    minimo_existencial_config DECIMAL(15, 2) DEFAULT 1621.00, -- Valor de referência do Salário Mínimo
    justificativa_minimo_existencial TEXT,
    
    -- Fontes Documentais das Despesas
    fonte_moradia VARCHAR(255),
    fonte_alimentacao VARCHAR(255),
    fonte_saude VARCHAR(255),
    fonte_transporte VARCHAR(255),
    fonte_educacao VARCHAR(255),
    fonte_outras_despesas VARCHAR(255),
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

-- Tabela Filha: Outras Despesas Individuais Específicas
CREATE TABLE IF NOT EXISTS outras_despesas_itens (
    id VARCHAR(36) PRIMARY KEY,
    despesa_id VARCHAR(36) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(15, 2) NOT NULL,
    fonte_doc VARCHAR(255),
    FOREIGN KEY (despesa_id) REFERENCES despesas_essenciais(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 7. TABELA DE CONTRATOS BANCÁRIOS E OPERAÇÕES DE CRÉDITO
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contratos_bancarios (
    id VARCHAR(36) PRIMARY KEY,
    processo_id VARCHAR(36) NOT NULL,
    credor VARCHAR(255) NOT NULL, -- Banco / Instituição
    numero_contrato VARCHAR(100) NOT NULL,
    modalidade VARCHAR(100) NOT NULL, -- Consignado, Pessoal, Cartão, Cheque Especial
    data_contrato DATE,
    vencimento_final DATE,
    
    -- Valores Contratuais
    valor_liberado_contrato DECIMAL(15, 2) DEFAULT 0.00,
    valor_final_contrato DECIMAL(15, 2) DEFAULT 0.00,
    valor_iof DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Parcelas e Prazos
    qtd_parcelas_total INT DEFAULT 0,
    qtd_parcelas_pagas INT DEFAULT 0,
    qtd_parcelas_restantes INT DEFAULT 0,
    valor_parcela_atual DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Taxas de Juros
    taxa_juros_mes DECIMAL(8, 4) DEFAULT 0.0000, -- % a.m.
    taxa_juros_ano DECIMAL(8, 4) DEFAULT 0.0000, -- % a.a.
    cet_mes DECIMAL(8, 4) DEFAULT 0.0000,
    cet_ano DECIMAL(8, 4) DEFAULT 0.0000,
    
    -- Venda Casada / Abusividades
    tem_seguro_prestamista BOOLEAN DEFAULT FALSE,
    valor_seguro_prestamista DECIMAL(15, 2) DEFAULT 0.00,
    tem_tarifas_abusivas BOOLEAN DEFAULT FALSE,
    valor_tarifas_abusivas DECIMAL(15, 2) DEFAULT 0.00,
    expurgar_abusividades BOOLEAN DEFAULT FALSE,
    
    -- Correção Monetária INPC/IPCA (Fator 7 Casas Decimais)
    tipo_indice_correcao VARCHAR(10) DEFAULT 'INPC', -- 'INPC' ou 'IPCA'
    fator_correcao_7casas DECIMAL(12, 7) DEFAULT 1.0000000, -- Ex: 1.0160724
    data_referencia_ultimo_pagamento DATE,
    saldo_devedor_ref_ultima_parcela DECIMAL(15, 2) DEFAULT 0.00,
    taxa_media_bacen_mes DECIMAL(8, 4) DEFAULT 0.0000, -- % a.m. BACEN
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 8. TABELA DE QUESITOS PERICIAIS E RESPOSTAS TÉCNICAS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quesitos_periciais (
    id VARCHAR(36) PRIMARY KEY,
    processo_id VARCHAR(36) NOT NULL,
    ordem INT DEFAULT 1,
    origem VARCHAR(50) DEFAULT 'Juízo', -- 'Juízo', 'Autor/Devedor', 'Réu/Credor'
    pergunta TEXT NOT NULL,
    resposta_tecnica TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 9. TABELA DE ÍNDICES MONETÁRIOS HISTÓRICOS (INPC / IPCA / BACEN)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS indices_monetarios (
    id VARCHAR(36) PRIMARY KEY,
    competencia VARCHAR(7) NOT NULL UNIQUE, -- Ex: "2025-01" ou "01/2025"
    indice_inpc_mes DECIMAL(8, 4) DEFAULT 0.0000,
    fator_inpc_acumulado_7casas DECIMAL(12, 7) DEFAULT 1.0000000,
    indice_ipca_mes DECIMAL(8, 4) DEFAULT 0.0000,
    fator_ipca_acumulado_7casas DECIMAL(12, 7) DEFAULT 1.0000000,
    fonte VARCHAR(100) DEFAULT 'IBGE / BACEN SGS 433',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 10. TABELA DE TRANSAÇÕES E PAGAMENTOS (MERCADO PAGO)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagamentos_transacoes (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    payment_id_mercadopago VARCHAR(100),
    plano_contratado VARCHAR(50) NOT NULL, -- 'individual', 'escritorio'
    valor DECIMAL(15, 2) NOT NULL,
    metodo_pagamento VARCHAR(30) DEFAULT 'pix', -- 'pix', 'cartao_credito'
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    qr_code_pix TEXT,
    ticket_url TEXT,
    payload_resposta LONGTEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 11. TABELA DE HISTÓRICO E AUDITORIA DE LAUDOS GERADOS (PDF / DOCX / XLSX)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_laudos (
    id VARCHAR(36) PRIMARY KEY,
    usuario_id VARCHAR(36) NOT NULL,
    processo_id VARCHAR(36) NOT NULL,
    tipo_exportacao VARCHAR(10) NOT NULL, -- 'pdf', 'docx', 'xlsx'
    nome_arquivo VARCHAR(255) NOT NULL,
    gerado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

-- Reativa verificações de chave estrangeira (MySQL)
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- FIM DO ESQUEMA SQL
-- =============================================================================
