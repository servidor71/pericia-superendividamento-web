import React, { useState } from 'react';
import { User, Scale, FileBadge, ShieldCheck } from 'lucide-react';
import type { ProcessData, ProcessDocumentItem } from '../types';
import { initialProcessData } from '../mockData';
import { formatCpfCnpj } from '../services/calculations';

interface Module1Props {
  process: ProcessData;
  onChange: (updated: ProcessData) => void;
  documents?: ProcessDocumentItem[];
}

export const Module1DevedorProcesso: React.FC<Module1Props> = ({ process, onChange, documents: _documents = [] }) => {
  const [isEditing, setIsEditing] = useState(true);

  const handleFieldChange = (field: keyof ProcessData, value: any) => {
    onChange({ ...process, [field]: value });
  };

  const handleResetProcess = () => {
    if (confirm('Deseja restaurar os dados do processo e do devedor para os valores padrão?')) {
      onChange(initialProcessData);
    }
  };

  const handleClearProcess = () => {
    if (confirm('Deseja limpar os dados do processo?')) {
      onChange({
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
        vinculoEmpregaticio: 'Servidor Público - Estatutário',
        empregador: '',
        peritoDesignado: '',
        registroProfissional: '',
        prazoPlanoMeses: 60,
        dataPericia: new Date().toISOString().split('T')[0],
        statusProcesso: 'Em Análise',
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 w-full font-sans">
      {/* SINGLE CONSOLIDATED MODULE HEADER CARD */}
      <div className="bg-[#FAF8F3] py-2.5 px-4 rounded-2xl border border-[#DCD8CD] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#1C4E5E] text-white rounded-xl flex items-center justify-center shadow-xs shrink-0 font-black">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-[#1C2B33] font-serif-header">Módulo 2: Cadastramento do Processo, Devedor & Perícia</h2>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Dados do Processo Judicial, Qualificação do Devedor e Diretrizes da Perícia (Lei 14.181/2021)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DCD8CD] text-xs font-bold">
            <span className="text-slate-500 text-[11px]">Status:</span>
            <select
              value={process.statusProcesso}
              onChange={(e) => handleFieldChange('statusProcesso', e.target.value)}
              className="text-xs font-bold bg-transparent text-[#1C2B33] focus:outline-none border-none p-0 cursor-pointer"
            >
              <option value="Em Análise">Em Análise</option>
              <option value="Laudo Concluído">Laudo Concluído</option>
              <option value="Audiência Agendada">Audiência Agendada</option>
              <option value="Aguardando Homologação">Aguardando Homologação</option>
            </select>
          </div>

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
            onClick={handleClearProcess}
            className="px-3.5 py-1 text-xs font-bold bg-[#FDF2F2] hover:bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Limpar</span>
          </button>

          {/* 3. DELETAR */}
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja excluir permanentemente todos os dados do processo?')) {
                handleClearProcess();
              }
            }}
            className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white border border-red-700 rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Deletar</span>
          </button>

          {/* 4. RESTAURAR */}
          <button
            type="button"
            onClick={handleResetProcess}
            className="px-3.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-[#1C4E5E] border border-[#DCD8CD] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Restaurar</span>
          </button>

          {/* 5. SALVAR */}
          <button
            type="button"
            onClick={() => alert('Dados do Processo salvos com sucesso!')}
            className="px-4 py-1 text-xs font-black bg-[#2E7D62] hover:bg-[#23624D] text-white border border-[#2E7D62] rounded-full transition-all cursor-pointer shadow-2xs"
          >
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        {/* Section 1: Dados do Processo */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <FileBadge className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">1. Dados do Processo Judicial</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Número do Processo (CNJ)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.numeroProcesso}
                onChange={(e) => handleFieldChange('numeroProcesso', e.target.value)}
                placeholder="0000000-00.202X.8.07.0001"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-mono font-bold text-slate-900 bg-white disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Classe Processual</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.classeProcessual}
                onChange={(e) => handleFieldChange('classeProcessual', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Tribunal</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.tribunal}
                  onChange={(e) => handleFieldChange('tribunal', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Comarca</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.comarca}
                  onChange={(e) => handleFieldChange('comarca', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vara Cível / Juizado</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.vara}
                  onChange={(e) => handleFieldChange('vara', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Magistrado / Juiz</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.magistrado}
                  onChange={(e) => handleFieldChange('magistrado', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dados do Devedor / Autor */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
            <User className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">2. Dados do Devedor / Requerente</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo do Devedor</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.nomeDevedor}
                onChange={(e) => handleFieldChange('nomeDevedor', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-bold text-slate-900 bg-white disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">CPF / CNPJ</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.cpfCnpj}
                  onChange={(e) => handleFieldChange('cpfCnpj', formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={18}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-mono font-bold text-slate-900 bg-white disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Profissão / Cargo</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.profissao}
                  onChange={(e) => handleFieldChange('profissao', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vínculo Empregatício</label>
                <select
                  disabled={!isEditing}
                  value={process.vinculoEmpregaticio}
                  onChange={(e) => handleFieldChange('vinculoEmpregaticio', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-semibold text-slate-900 disabled:bg-slate-100"
                >
                  <option value="Servidor Público - Estatutário">Servidor Público - Estatutário</option>
                  <option value="Empregado CLT">Empregado CLT</option>
                  <option value="Aposentado INSS">Aposentado INSS</option>
                  <option value="Pensionista INSS">Pensionista INSS</option>
                  <option value="Autônomo / Profissional Liberal">Autônomo / Profissional Liberal</option>
                  <option value="Militar Forças Armadas / PM">Militar Forças Armadas / PM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Empresa / Órgão Empregador</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={process.empregador}
                  onChange={(e) => handleFieldChange('empregador', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-medium disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Section 3: Dados da Perícia */}
      <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-xs space-y-4 w-full">
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">3. Dados da Perícia Judicial & Prazo do Plano</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Perito Judicial Designado</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.peritoDesignado}
                onChange={(e) => handleFieldChange('peritoDesignado', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-bold text-slate-900 bg-white disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Registro Profissional (CRC / CRA)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.registroProfissional}
                onChange={(e) => handleFieldChange('registroProfissional', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-mono font-bold text-slate-900 bg-white disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prazo Máximo do Plano (Meses)</label>
              <input
                type="number"
                disabled={!isEditing}
                value={process.prazoPlanoMeses}
                onChange={(e) => handleFieldChange('prazoPlanoMeses', parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 font-extrabold text-blue-900 bg-white disabled:bg-slate-100"
              />
              <span className="text-[10px] text-slate-500 font-medium">Padrão Legal: 60 parcelas (5 anos)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Cidade / Estado (UF)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={process.cidadeUf || ''}
                onChange={(e) => handleFieldChange('cidadeUf', e.target.value)}
                placeholder="Ex: Goiânia - GO"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-semibold text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Data de Emissão do Laudo / Data</label>
              <input
                type="date"
                disabled={!isEditing}
                value={process.dataPericia || ''}
                onChange={(e) => handleFieldChange('dataPericia', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-800 bg-white font-semibold text-slate-900 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
