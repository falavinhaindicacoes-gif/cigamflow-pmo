import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_ATIVIDADE, TIPO_ATIVIDADE, CATEGORIA_ATIVIDADE, PRIORIDADE_COLORS, CRITICIDADE_COLORS } from '@/lib/constants';

export default function ActivityFilters({ filters, setFilters, projects }) {
  const set = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={filters.status || 'all'} onValueChange={(v) => set('status', v)}>
        <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Status</SelectItem>
          {STATUS_ATIVIDADE.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.prioridade || 'all'} onValueChange={(v) => set('prioridade', v)}>
        <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Prioridade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Prioridades</SelectItem>
          {Object.entries(PRIORIDADE_COLORS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.tipo || 'all'} onValueChange={(v) => set('tipo', v)}>
        <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Tipo" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Tipos</SelectItem>
          {TIPO_ATIVIDADE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.project_id || 'all'} onValueChange={(v) => set('project_id', v)}>
        <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Projeto" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos Projetos</SelectItem>
          {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}