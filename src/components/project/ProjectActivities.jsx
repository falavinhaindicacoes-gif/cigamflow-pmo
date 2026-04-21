import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ListChecks, ArrowRight, Clock, AlertTriangle } from 'lucide-react';
import { getActivityStatusInfo } from '@/lib/constants';
import { PRIORIDADE_COLORS } from '@/lib/constants';

export default function ProjectActivities({ projectId }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => base44.entities.Activity.filter({ project_id: projectId }, '-created_date', 200),
    enabled: !!projectId,
  });

  const open = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');
  const overdue = open.filter(a => a.prazo && new Date(a.prazo) < new Date());

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{activities.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{open.length}</p>
          <p className="text-xs text-muted-foreground">Abertos</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activities.filter(a => a.status === 'concluido').length}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl divide-y">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade registrada</div>
        ) : (
          activities.slice(0, 20).map((act) => {
            const statusInfo = getActivityStatusInfo(act.status);
            const isOverdue = act.prazo && new Date(act.prazo) < new Date() && act.status !== 'concluido' && act.status !== 'cancelado';
            const prioridade = PRIORIDADE_COLORS[act.prioridade] || PRIORIDADE_COLORS.media;
            return (
              <div key={act.id} className={`p-4 hover:bg-muted/50 transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">{act.titulo}</span>
                      {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioridade.bg} ${prioridade.text}`}>{prioridade.label}</span>
                      {act.responsavel && <span className="text-xs text-muted-foreground">{act.responsavel}</span>}
                    </div>
                  </div>
                  {act.prazo && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(act.prazo).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center">
        <Link to="/activities" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          Ver todas as atividades <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}