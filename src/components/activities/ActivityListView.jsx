import React, { useState } from 'react';
import { Clock, AlertTriangle, ShieldAlert, Pencil, Eye } from 'lucide-react';
import { getActivityStatusInfo, PRIORIDADE_COLORS, CRITICIDADE_COLORS, TIPO_ATIVIDADE } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import ActivityDetailPanel from './ActivityDetailPanel';

export default function ActivityListView({ activities, projects, onEdit, onStatusChange }) {
  const [selectedActivity, setSelectedActivity] = useState(null);

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';
  const getTipoLabel = (val) => TIPO_ATIVIDADE.find(t => t.value === val)?.label || val;

  return (
    <>
      <div className="bg-card border rounded-xl overflow-hidden">
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma atividade encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Título</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Projeto</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Prioridade</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Responsável</th>
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
                  const isSelected = selectedActivity?.id === act.id;

                  return (
                    <tr
                      key={act.id}
                      className={`hover:bg-muted/30 transition-colors cursor-pointer
                        ${isOverdue ? 'bg-red-50/50' : ''}
                        ${isCritical ? 'border-l-2 border-l-red-500' : ''}
                        ${isSelected ? 'bg-primary/5' : ''}
                      `}
                      onClick={() => setSelectedActivity(isSelected ? null : act)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[180px]">{act.titulo}</span>
                          {blocksGoLive && <ShieldAlert className="w-3.5 h-3.5 text-red-500 flex-shrink-0" title="Bloqueia Go-Live" />}
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                        </div>
                        {act.responsavel && <span className="text-[11px] text-muted-foreground md:hidden">{act.responsavel}</span>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[140px] hidden md:table-cell">{getProjectName(act.project_id)}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs hidden lg:table-cell">{getTipoLabel(act.tipo)}</td>
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
                      <td className="py-3 px-4 text-muted-foreground text-xs hidden md:table-cell">{act.responsavel || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {act.prazo && <Clock className="w-3 h-3" />}
                          <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                            {act.prazo ? new Date(act.prazo).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedActivity(isSelected ? null : act)} title="Ver detalhes">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(act)} title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedActivity && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelectedActivity(null)} />
          <ActivityDetailPanel
            activity={selectedActivity}
            projects={projects}
            onClose={() => setSelectedActivity(null)}
            onEdit={(act) => { setSelectedActivity(null); onEdit(act); }}
          />
        </>
      )}
    </>
  );
}