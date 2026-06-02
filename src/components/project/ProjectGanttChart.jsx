import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  nao_iniciado: { color: 'bg-gray-300', label: 'Não Iniciado' },
  em_andamento: { color: 'bg-blue-400', label: 'Em Andamento' },
  concluido: { color: 'bg-green-500', label: 'Concluído' },
  cancelado: { color: 'bg-red-400', label: 'Cancelado' },
};

export default function ProjectGanttChart({ projectId, project }) {
  const { data: modules = [] } = useQuery({
    queryKey: ['projectModules', projectId],
    queryFn: () => base44.entities.ProjectModule.filter({ project_id: projectId }, 'ordem', 200),
    enabled: !!projectId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['moduleItems', projectId],
    queryFn: () => base44.entities.ModuleItem.filter({ project_id: projectId }, 'ordem', 500),
    enabled: !!projectId,
  });

  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => a.ordem - b.ordem);
  }, [modules]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const start = project?.data_inicio ? parseISO(project.data_inicio) : new Date();
    const end = project?.data_prevista_termino ? parseISO(project.data_prevista_termino) : addDays(start, 90);
    return { start, end, days: differenceInDays(end, start) + 1 };
  }, [project]);

  if (!project?.data_inicio || !project?.data_prevista_termino) {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-700">Para visualizar o Gantt, defina as datas de início e término previsto do projeto.</p>
      </div>
    );
  }

  const getModuleProgress = (moduleId) => {
    const modItems = items.filter(i => i.project_module_id === moduleId);
    if (!modItems.length) return 0;
    const completed = modItems.filter(i => i.status === 'concluido').length;
    return Math.round((completed / modItems.length) * 100);
  };

  const cellWidth = Math.max(20, 1200 / timelineRange.days);
  const dayLabels = Array.from({ length: timelineRange.days }, (_, i) => {
    const date = addDays(timelineRange.start, i);
    return {
      date,
      label: format(date, 'd', { locale: ptBR }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/30 rounded-lg text-xs">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${config.color}`} />
            <span className="text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-x-auto bg-card">
        {/* Header with dates */}
        <div className="flex sticky top-0 bg-muted/40 border-b">
          <div className="w-64 flex-shrink-0 border-r p-2 font-medium text-sm text-muted-foreground sticky left-0 z-10 bg-muted/40">
            Módulos
          </div>
          <div className="flex">
            {dayLabels.map((day, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 flex items-center justify-center text-xs font-medium border-r ${
                  day.isWeekend ? 'bg-muted/60 text-muted-foreground' : 'text-foreground'
                }`}
                style={{ width: `${cellWidth}px`, height: '40px' }}
              >
                {day.label}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {sortedModules.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum módulo adicionado ao projeto
          </div>
        ) : (
          sortedModules.map((mod) => {
            const progress = getModuleProgress(mod.id);
            const statusCfg = STATUS_CONFIG[mod.status] || STATUS_CONFIG.nao_iniciado;

            return (
              <div key={mod.id} className="flex border-b hover:bg-muted/20 transition-colors">
                {/* Module name and progress */}
                <div className="w-64 flex-shrink-0 border-r p-3 sticky left-0 z-10 bg-card hover:bg-muted/10 transition-colors">
                  <div className="font-medium text-sm truncate">{mod.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${statusCfg.color}`} />
                    <span className="text-xs text-muted-foreground">{statusCfg.label}</span>
                    {progress > 0 && <span className="text-xs font-medium text-primary">{progress}%</span>}
                  </div>
                </div>

                {/* Timeline bars */}
                <div className="flex flex-1">
                  {dayLabels.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex-shrink-0 border-r relative ${
                        day.isWeekend ? 'bg-muted/10' : ''
                      }`}
                      style={{ width: `${cellWidth}px`, minHeight: '60px' }}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      <div className="p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground">
        <p>
          <span className="font-medium">Período:</span> {format(timelineRange.start, 'dd/MM/yyyy', { locale: ptBR })} a{' '}
          {format(timelineRange.end, 'dd/MM/yyyy', { locale: ptBR })} ({timelineRange.days} dias)
        </p>
      </div>
    </div>
  );
}