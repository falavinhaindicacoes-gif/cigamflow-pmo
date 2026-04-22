import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileBarChart, Search, Calendar, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const SAUDE_CONFIG = {
  verde: { label: 'Verde', color: 'bg-green-100 text-green-700' },
  amarelo: { label: 'Amarelo', color: 'bg-yellow-100 text-yellow-700' },
  vermelho: { label: 'Vermelho', color: 'bg-red-100 text-red-700' },
};

export default function StatusReports() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['status-reports'],
    queryFn: () => base44.entities.StatusReport.list('-data_emissao', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const getProject = (id) => projects.find(p => p.id === id);

  const filtered = reports.filter(r => {
    const p = getProject(r.project_id);
    const matchSearch = !search || p?.name?.toLowerCase().includes(search.toLowerCase()) || r.gerente_projeto?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status_aprovacao === filterStatus;
    return matchSearch && matchStatus;
  });

  const aprovados = reports.filter(r => r.status_aprovacao === 'aprovado').length;
  const pendentes = reports.filter(r => r.status_aprovacao === 'pendente').length;
  const criticos = reports.filter(r => r.status_prazo === 'vermelho').length;

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Status Reports" description="Acompanhamento periódico dos projetos" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={reports.length} icon={FileBarChart} />
        <StatCard title="Aprovados" value={aprovados} icon={FileBarChart} />
        <StatCard title="Pendentes" value={pendentes} icon={FileBarChart} />
        <StatCard title="Prazo Crítico" value={criticos} icon={FileBarChart} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por projeto ou gerente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="pendente">Pendente Aprovação</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="rejeitado">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum status report encontrado</p>
          <p className="text-sm mt-1">Crie reports a partir da aba "Status Reports" dentro de cada projeto.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => {
            const project = getProject(r.project_id);
            const prazoInfo = SAUDE_CONFIG[r.status_prazo] || SAUDE_CONFIG.verde;
            const aprovStatus = r.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' : r.status_aprovacao === 'rejeitado' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
            return (
              <Link
                key={r.id}
                to={`/projects/${r.project_id}`}
                className="bg-card border rounded-xl p-4 hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileBarChart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-sm">{project?.name || 'Projeto'}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${prazoInfo.color}`}>Prazo: {prazoInfo.label}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${aprovStatus}`}>{r.status_aprovacao || 'rascunho'}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                      {r.periodo_inicio ? format(new Date(r.periodo_inicio), 'dd/MM') : '-'} - {r.periodo_fim ? format(new Date(r.periodo_fim), 'dd/MM/yyyy') : '-'}
                    </span>
                    {r.gerente_projeto && <span>GP: {r.gerente_projeto}</span>}
                    <span>Previsto: {r.progresso_previsto ?? 0}% · Realizado: {r.progresso_realizado ?? 0}%</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}