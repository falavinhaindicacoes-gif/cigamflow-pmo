import React from 'react';
import { STATUS_ATIVIDADE, PRIORIDADE_COLORS, getActivityStatusInfo } from '@/lib/constants';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const KANBAN_COLUMNS = STATUS_ATIVIDADE.filter(s => s.value !== 'cancelado');

export default function ActivityKanban({ activities, projects, onStatusChange, onEdit }) {
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const items = activities.filter(a => a.status === col.value);
        return (
          <div key={col.value} className="min-w-[260px] w-[260px] flex-shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.color}`}>{col.label}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {items.map((act) => {
                const prioridade = PRIORIDADE_COLORS[act.prioridade] || PRIORIDADE_COLORS.media;
                const isOverdue = act.prazo && new Date(act.prazo) < new Date() && act.status !== 'concluido';
                return (
                  <div
                    key={act.id}
                    onClick={() => onEdit(act)}
                    className={cn(
                      "bg-card border rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow",
                      isOverdue && "border-red-300 bg-red-50/50",
                      act.criticidade === 'critica' && "border-l-2 border-l-red-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium leading-tight">{act.titulo}</p>
                      <div className="flex gap-1 flex-shrink-0">
                        {act.bloqueia_go_live && <ShieldAlert className="w-3 h-3 text-red-500" />}
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2 truncate">{getProjectName(act.project_id)}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${prioridade.bg} ${prioridade.text}`}>
                        {prioridade.label}
                      </span>
                      {act.prazo && (
                        <span className={`text-[10px] ${isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                          {new Date(act.prazo).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {act.responsavel && (
                      <p className="text-[10px] text-muted-foreground mt-1">{act.responsavel}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}