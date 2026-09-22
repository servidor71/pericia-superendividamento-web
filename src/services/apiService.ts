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

export async function checkDatabaseStatus(): Promise<{ isMySqlConnected: boolean; storageEngine: string } | null> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
