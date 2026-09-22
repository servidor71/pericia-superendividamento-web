import React, { useEffect, useState } from 'react';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  Calendar, 
  Building2, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Download,
  ArrowLeft,
  RefreshCw,
  Eye,
  DollarSign
} from 'lucide-react';
import { fetchAllProcesses, fetchProcessById, deleteProcessById, type ProcessSummary } from '../services/apiService';
import { exportJSONBackup } from '../services/exporters';

interface GerenciarProcessosPageProps {
  onNavigate: (route: string) => void;
  onOpenProcess: (procData: any) => void;
  onNewProcess: () => void;
}

export const GerenciarProcessosPage: React.FC<GerenciarProcessosPageProps> = ({
  onNavigate,
  onOpenProcess,
  onNewProcess,
}) => {
  const [processes, setProcesses] = useState<ProcessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProcesses = async () => {
    setLoading(true);
    try {
      const data = await fetchAllProcesses();
      setProcesses(data);
    } catch (err) {
      console.error('Erro ao carregar processos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  const handleOpen = async (id: string) => {
    try {
      const fullData = await fetchProcessById(id);
      if (fullData) {
        onOpenProcess(fullData);
      } else {
        alert('Não foi possível carregar os dados detalhados deste processo.');
      }
    } catch (err) {
      alert('Erro ao abrir o processo solicitado.');
    }
  };

  const handleExportSingleJSON = async (proc: ProcessSummary) => {
    try {
      const fullData = await fetchProcessById(proc.id);
      if (fullData) {
        exportJSONBackup(fullData);
      } else {
        alert('Erro ao carregar dados completos para exportação.');
      }
    } catch (err) {
      alert('Erro ao exportar backup.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);
    try {
      const res = await deleteProcessById(deleteConfirmId);
      if (res.success) {
        setProcesses(prev => prev.filter(p => p.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      } else {
        alert(`Erro ao excluir processo: ${res.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      alert('Falha na comunicação ao tentar excluir o processo.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = 
      (p.numeroProcesso || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nomeDevedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.tribunal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.comarca || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = 
      statusFilter === 'todos' || 
      (p.statusProcesso || 'Em Análise').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalProcessos = processes.length;
  const emAnaliseCount = processes.filter(p => (p.statusProcesso || 'Em Análise') === 'Em Análise').length;
  const concluidoCount = processes.filter(p => (p.statusProcesso || '') === 'Laudo Concluído').length;
  const totalPassivo = processes.reduce((acc, p) => acc + (p.valorTotalContratos || 0), 0);

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#1C2B33] font-sans antialiased pb-20">
      
      {/* Top Banner Navigation */}
      <header className="bg-[#FAF8F3] border-b border-[#DCD8CD] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onNavigate('app')}
              className="p-2 bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 text-xs font-black"
              title="Voltar ao Editor de Laudo"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-[#1C4E5E] bg-[#E7F3EE] px-2 py-0.5 rounded-md border border-[#C5E2D6] tracking-wider font-mono">
                  SISTEMA DE GESTÃO PERICIAL
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1C2B33] font-serif-header tracking-tight">
                📂 Gerenciador de Processos Cadastrados
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProcesses}
              className="px-3 py-2 text-xs font-bold text-[#1C2B33] bg-white hover:bg-slate-100 border border-[#DCD8CD] rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Atualizar lista de processos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => {
                onNewProcess();
                onNavigate('app');
              }}
              className="px-4 py-2 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] border border-[#1C4E5E] rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Novo Processo</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* 1. Dashboard Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-[#DCD8CD] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Total de Processos</span>
              <FolderOpen className="w-5 h-5 text-[#1C4E5E]" />
            </div>
            <div className="text-2xl font-black text-[#1C2B33]">{totalProcessos}</div>
            <p className="text-[11px] text-slate-500">Casos salvos no banco de dados</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCD8CD] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-600">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Em Análise</span>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{emAnaliseCount}</div>
            <p className="text-[11px] text-slate-500">Aguardando elaboração do laudo</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCD8CD] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Laudos Concluídos</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{concluidoCount}</div>
            <p className="text-[11px] text-slate-500">Prontos para homologação judicial</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DCD8CD] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-blue-600">
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Volume de Passivos</span>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {totalPassivo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-[11px] text-slate-500">Soma de contratos cadastrados</p>
          </div>

        </div>

        {/* 2. Filters & Search Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nº processo, devedor, tribunal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-[#FAF8F3] text-slate-900 border border-[#DCD8CD] rounded-xl focus:ring-2 focus:ring-[#1C4E5E] focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filtrar Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs font-bold bg-[#FAF8F3] text-slate-900 border border-[#DCD8CD] rounded-xl focus:ring-2 focus:ring-[#1C4E5E]"
            >
              <option value="todos">Todos os Status</option>
              <option value="em análise">Em Análise</option>
              <option value="laudo concluído">Laudo Concluído</option>
              <option value="audiência agendada">Audiência Agendada</option>
              <option value="aguardando homologação">Aguardando Homologação</option>
            </select>
          </div>

        </div>

        {/* 3. Process Cards List */}
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-[#DCD8CD] text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#1C4E5E] animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Carregando processos salvos no banco de dados...</p>
          </div>
        ) : filteredProcesses.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#DCD8CD] text-center space-y-4">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">Nenhum processo cadastrado encontrado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Nenhum resultado corresponde aos filtros aplicados. Tente limpar a busca.' 
                  : 'Você ainda não possui perícias ou processos cadastrados no banco de dados.'}
              </p>
            </div>
            <button
              onClick={() => {
                onNewProcess();
                onNavigate('app');
              }}
              className="px-4 py-2 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Cadastrar Primeiro Processo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProcesses.map((proc) => {
              const isConcluido = (proc.statusProcesso || '').toLowerCase().includes('concluído');

              return (
                <div
                  key={proc.id}
                  className="bg-white rounded-2xl border border-[#DCD8CD] hover:border-[#1C4E5E] transition-all shadow-2xs hover:shadow-md flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-5 space-y-3 border-b border-[#F0EEE6]">
                    
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        isConcluido
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {proc.statusProcesso || 'Em Análise'}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        ID: {proc.id.substring(0, 12)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-[#1C4E5E] transition-colors line-clamp-1">
                        {proc.nomeDevedor || 'Devedor sem nome'}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono font-bold">
                        <FileText className="w-3.5 h-3.5 text-[#1C4E5E] shrink-0" />
                        <span>{proc.numeroProcesso || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{proc.tribunal || proc.comarca || 'Tribunal N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{proc.dataPericia || 'Sem Data'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Financial Stats Bar */}
                  <div className="bg-[#FAF8F3] px-5 py-3 border-b border-[#F0EEE6] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-slate-700">{proc.qtdContratos} Contrato(s)</span>
                    </div>
                    <div className="font-black text-[#1C4E5E]">
                      {proc.valorTotalContratos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-white flex items-center justify-between gap-2">
                    
                    <button
                      onClick={() => handleOpen(proc.id)}
                      className="flex-1 py-2 px-3 text-xs font-black text-white bg-[#1C4E5E] hover:bg-[#153E4B] rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Abrir & Editar</span>
                    </button>

                    <button
                      onClick={() => handleExportSingleJSON(proc)}
                      className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
                      title="Exportar backup JSON deste processo"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(proc.id)}
                      className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
                      title="Excluir este processo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
            
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border border-red-200">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">Excluir Processo do Banco?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Esta ação removerá permanentemente o processo, contratos e laudos associados do banco de dados MySQL e do arquivo local.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
