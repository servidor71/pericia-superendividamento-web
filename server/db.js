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
// INICIALIZADOR DE CONEXÃO MYSQL
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

      // Testa conexão
      const connection = await dbPool.getConnection();
      console.log(`✅ Conectado com sucesso ao MySQL da Hostinger: ${database}@${host}`);
      connection.release();
      isMySqlConnected = true;

      // Executa auto-criação de tabelas
      await createTablesIfNotExist();
      return true;
    } catch (err) {
      console.warn('⚠️ Não foi possível conectar ao MySQL da Hostinger com as credenciais informadas:', err?.message || err);
      console.warn('📁 Usando armazenamento seguro local (JSON Fallback) para nenhum dado ser perdido.');
      isMySqlConnected = false;
      return false;
    }
  } else {
    console.log('ℹ️ Variáveis de ambiente DB_HOST/DB_USER/DB_NAME não detectadas no .env.');
    console.log('📁 O sistema salvará todas as informações no arquivo de dados local `data/database_fallback.json`.');
    isMySqlConnected = false;
    return false;
  }
}

// -----------------------------------------------------------------------------
// CRIAÇÃO AUTOMÁTICA DAS TABELAS NO MYSQL
// -----------------------------------------------------------------------------
async function createTablesIfNotExist() {
  if (!dbPool || !isMySqlConnected) return;

  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS dados_sistema (
        id VARCHAR(50) PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        conteudo LONGTEXT NOT NULL,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✅ Tabela `dados_sistema` verificada/criada no MySQL.');
  } catch (err) {
    console.error('Erro ao criar tabelas no MySQL:', err?.message || err);
  }
}

// -----------------------------------------------------------------------------
// MÉTODOS DE LEITURA E GRAVAÇÃO DE DADOS (MYSQL + FALLBACK JSON)
// -----------------------------------------------------------------------------
export async function saveSystemData(key, data) {
  const jsonStr = JSON.stringify(data, null, 2);

  // 1. Tenta salvar no MySQL
  if (dbPool && isMySqlConnected) {
    try {
      await dbPool.query(
        `INSERT INTO dados_sistema (id, tipo, conteudo) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE conteudo = VALUES(conteudo)`,
        [key, typeof data === 'object' ? key : 'geral', jsonStr]
      );
      console.log(`💾 Dados [${key}] salvos no MySQL com sucesso!`);
    } catch (err) {
      console.error(`Erro ao salvar [${key}] no MySQL:`, err?.message || err);
    }
  }

  // 2. Salva sempre uma cópia no JSON local de segurança
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
    console.log(`💾 Dados [${key}] salvos no backup local com sucesso!`);
    return { success: true, storage: isMySqlConnected ? 'MySQL + Backup' : 'Local JSON Backup' };
  } catch (err) {
    console.error(`Erro ao salvar no arquivo de dados local:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function loadSystemData(key) {
  // 1. Tenta carregar do MySQL
  if (dbPool && isMySqlConnected) {
    try {
      const [rows] = await dbPool.query(`SELECT conteudo FROM dados_sistema WHERE id = ?`, [key]);
      if (Array.isArray(rows) && rows.length > 0) {
        const row = rows[0];
        return JSON.parse(row.conteudo);
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
    console.error(`Erro ao ler JSON de backup:`, err);
  }

  return null;
}

export function getDbStatus() {
  return {
    isMySqlConnected,
    storageEngine: isMySqlConnected ? 'MySQL Database (Hostinger)' : 'Local JSON Storage',
    fallbackPath: JSON_DB_PATH
  };
}
