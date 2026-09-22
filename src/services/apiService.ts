// Servico de comunicacao com a API backend Express / Banco de Dados (MySQL / Storage)

export interface SavePayload {
  profile: any;
  process: any;
  income: any;
  expenses: any;
  contracts: any;
  documents: any;
  quesitos: any;
}

export async function saveProcessToDatabase(data: SavePayload): Promise<{ success: boolean; storage?: string; error?: string }> {
  try {
    const res = await fetch('/api/salvar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error(`Erro no servidor: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json;
  } catch (err: any) {
    console.warn('⚠️ Falha ao salvar via API backend:', err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function loadProcessFromDatabase(): Promise<SavePayload | null> {
  try {
    const res = await fetch('/api/dados');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch (err: any) {
    console.warn('⚠️ Falha ao carregar dados do banco:', err?.message || err);
    return null;
  }
}

export interface ProcessSummary {
  id: string;
  numeroProcesso: string;
  classeProcessual?: string;
  tribunal?: string;
  comarca?: string;
  vara?: string;
  magistrado?: string;
  cidadeUf?: string;
  nomeDevedor: string;
  cpfCnpjDevedor?: string;
  profissao?: string;
  statusProcesso: string;
  dataPericia?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  qtdContratos: number;
  valorTotalContratos: number;
}

export async function fetchAllProcesses(): Promise<ProcessSummary[]> {
  try {
    const res = await fetch('/api/processos');
    if (!res.ok) return [];
    const json = await res.json();
    return json.success && Array.isArray(json.processos) ? json.processos : [];
  } catch (err) {
    console.warn('⚠️ Falha ao buscar lista de processos:', err);
    return [];
  }
}

export async function fetchProcessById(id: string): Promise<SavePayload | null> {
  try {
    const res = await fetch(`/api/processos/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch (err) {
    console.warn(`⚠️ Falha ao carregar processo [${id}]:`, err);
    return null;
  }
}

export async function deleteProcessById(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/processos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(`Erro ao excluir: ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.warn(`⚠️ Falha ao excluir processo [${id}]:`, err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function checkDatabaseStatus(): Promise<{ isMySqlConnected: boolean; storageEngine: string } | null> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
