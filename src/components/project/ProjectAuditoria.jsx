import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitCommit, CheckCircle2, AlertTriangle, Edit, Plus, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getActivityStatusInfo } from '@/lib/constants';

const EVENT_ICONS = {
  decisao: GitCommit,
  concluido: CheckCircle2,
  bloqueio: AlertTriangle,
  default: Edit,
};

const EVENT_COLORS = {
  decisao: 'bg-purple-100 text-purple-700',
  concluido: 'bg-green-100 text-green-700',
  bloqueio: 'bg-red-100 text-red-700',
  risco: 'bg-orange-100 text-orange-700',
  default: 'bg-blue-100 text-blue-700',
};

export default function ProjectAuditoria({ project }) {
  const { data: allActivities = [], isLoading } = useQuery({
    queryKey: ['activities-audit', project?.id],
    queryFn: () => base44.entities.Activity.filter({ project_id: project?.id }, '-created_date', 200),
    enabled: !!project?.id,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['reports-audit', project?.id],
    queryFn: () => base44.entities.StatusReport.filter({ project_id: project?.id }, '-data_emissao', 50),
    enabled: !!project?.id,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['docs-audit', project?.id],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: project?.id }, '-created_date', 50),
    enabled: !!project?.id,
  });

  // Build timeline events
  const events = [];

  // Phase changes from decisao activities
  const phaseChanges = allActivities.filter(a => a.titulo?.startsWith('Mudança de fase:'));
  phaseChanges.forEach(a => {
    events.push({
      id: `phase-${a.id}`,
      date: a.created_date,
      tipo: 'fase',
      titulo: a.titulo,
      detalhe: a.descricao,
      autor: a.created_by,
      color: 'bg-primary/10 text-primary',
      icon: ArrowRight,
    });
  });

  // Status reports
  reports.forEach(r => {
    events.push({
      id: `report-${r.id}`,
      date: r.created_date,
      tipo: 'report',
      titulo: `Status Report emitido — ${r.status_aprovacao || 'rascunho'}`,
      detalhe: `Previsto: ${r.progresso_previsto ?? 0}% | Realizado: ${r.progresso_realizado ?? 0}%`,
      autor: r.gerente_projeto,
      color: 'bg-blue-100 text-blue-700',
      icon: GitCommit,
    });
  });

  // Documents
  docs.forEach(d => {
    const tipoLabel = {
      dados_iniciais: 'Dados Iniciais',
      termo_abertura: 'Termo de Abertura',
      plano_projeto: 'Plano de Projeto',
      termo_comprometimento: 'Termo de Comprometimento',
      termo_encerramento: 'Termo de Encerramento',
      licoes_aprendidas: 'Lições Aprendidas',
    }[d.tipo] || d.tipo;
    events.push({
      id: `doc-${d.id}`,
      date: d.created_date,
      tipo: 'documento',
      titulo: `${tipoLabel} — ${d.status}`,
      detalhe: d.observacoes || '',
      autor: d.aprovado_por,
      color: d.status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700',
      icon: d.status === 'aprovado' ? CheckCircle2 : Edit,
    });
  });

  // Activities with notable changes (concluded, blocking)
  allActivities
    .filter(a => !a.titulo?.startsWith('Mudança de fase:'))
    .filter(a => a.status === 'concluido' || a.bloqueia_go_live || a.criticidade === 'critica')
    .forEach(a => {
      const statusInfo = getActivityStatusInfo(a.status);
      events.push({
        id: `act-${a.id}`,
        date: a.updated_date || a.created_date,
        tipo: a.tipo,
        titulo: `[${statusInfo.label}] ${a.titulo}`,
        detalhe: a.tratativa_realizada || a.descricao || '',
        autor: a.responsavel,
        color: EVENT_COLORS[a.tipo] || EVENT_COLORS.default,
        icon: EVENT_ICONS[a.tipo] || EVENT_ICONS.default,
        flags: [
          a.bloqueia_go_live && '🚫 Bloqueia Go-Live',
          a.criticidade === 'critica' && '🔴 Crítico',
        ].filter(Boolean),
      });
    });

  // Sort by date desc
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando auditoria...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Trilha de Auditoria</h3>
        <span className="text-xs text-muted-foreground">{events.length} eventos registrados</span>
      </div>

      {events.length === 0 ? (
        <div className="bg-card border rounded-xl p-10 text-center text-muted-foreground text-sm">
          Nenhum evento registrado ainda.
        </div>
      ) : (
        <div className="bg-card border rounded-xl p-5">
          <div className="space-y-0">
            {events.map((event, idx) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${event.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {idx < events.length - 1 && <div className="w-0.5 flex-1 bg-border min-h-[2rem] my-1" />}
                  </div>
                  <div className="pb-5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{event.titulo}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${event.color}`}>
                        {event.tipo}
                      </span>
                    </div>
                    {event.flags && event.flags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {event.flags.map((f, i) => <span key={i} className="text-[10px] text-muted-foreground">{f}</span>)}
                      </div>
                    )}
                    {event.detalhe && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{event.detalhe}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                      {event.date && (
                        <span>
                          {format(new Date(event.date), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      )}
                      {event.autor && <><span>·</span><span>{event.autor}</span></>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Mudanças de Fase', value: phaseChanges.length, color: 'text-primary' },
          { label: 'Status Reports', value: reports.length, color: 'text-blue-600' },
          { label: 'Documentos', value: docs.length, color: 'text-purple-600' },
          { label: 'Eventos Totais', value: events.length, color: 'text-foreground' },
        ].map(item => (
          <div key={item.label} className="bg-muted/30 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}