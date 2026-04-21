import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, Pencil } from 'lucide-react';
import { getActivityStatusInfo, PRIORIDADE_COLORS, CRITICIDADE_COLORS, TIPO_ATIVIDADE } from '@/lib/constants';
import { Button } from '@/components/ui/button';

export default function ActivityListView({ activities, projects, onEdit, onStatusChange }) {
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';
  const getTipoLabel = (val) => TIPO_ATIVIDADE.find(t => t.value === val)?.label || val;

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade encontrada</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Título</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Projeto</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prioridade</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Responsável</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prazo</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activities.map((act) => {
                const statusInfo = getActivityStatusInfo(act.status);
                const prioridade = PRIORIDADE_COLORS[act.prioridade] || PRIORIDADE_COLORS.media;
                const isOverdue = act.prazo && new Date(act.prazo) < new Date() && act.status !== 'concluido' && act.status !== 'cancelado';
                const isCritical = act.criticidade === 'critica';
                const blocksGoLive = act.bloqueia_go_live;

                return (
                  <tr key={act.id} className={`hover:bg-muted/30 transition-colors ${isOverdue ? 'bg-red-50/50' : ''} ${isCritical ? 'border-l-2 border-l-red-500' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[200px]">{act.titulo}</span>
                        {blocksGoLive && <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" title="Bloqueia Go-Live" />}
                        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground truncate max-w-[150px]">{getProjectName(act.project_id)}</td>
                    <td className="py-3 px-4 text-muted-foreground">{getTipoLabel(act.tipo)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioridade.bg} ${prioridade.text}`}>
                        {prioridade.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{act.responsavel || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {act.prazo && <Clock className="w-3 h-3" />}
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {act.prazo ? new Date(act.prazo).toLocaleDateString('pt-BR') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(act)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}