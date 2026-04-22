import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, endOfMonth, addQuarters, subQuarters, startOfQuarter, endOfQuarter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import AllocationCellDialog from '@/components/schedule/AllocationCellDialog';
import ScheduleWeekView from '@/components/schedule/ScheduleWeekView';
import ScheduleMonthView from '@/components/schedule/ScheduleMonthView';
import ScheduleMultiWeekView from '@/components/schedule/ScheduleMultiWeekView';
import ScheduleFinanceDash from '@/components/schedule/ScheduleFinanceDash';

const VIEW_OPTIONS = [
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'semestre', label: 'Semestre' },
];

function getRangeLabel(view, base) {
  if (view === 'semana') {
    const start = startOfWeek(base, { weekStartsOn: 1 });
    const end = addDays(start, 6);
    return `${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')}`;
  }
  if (view === 'mes') return format(base, 'MMMM yyyy', { locale: ptBR });
  if (view === 'trimestre') {
    const start = startOfQuarter(base);
    const end = endOfQuarter(base);
    return `${format(start, 'MMM')} – ${format(end, 'MMM yyyy', { locale: ptBR })}`;
  }
  if (view === 'semestre') {
    const month = base.getMonth();
    const semStart = month < 6 ? new Date(base.getFullYear(), 0, 1) : new Date(base.getFullYear(), 6, 1);
    const semEnd = month < 6 ? new Date(base.getFullYear(), 5, 30) : new Date(base.getFullYear(), 11, 31);
    return `${format(semStart, 'MMM')} – ${format(semEnd, 'MMM yyyy', { locale: ptBR })}`;
  }
  return '';
}

function navigate(view, base, dir) {
  if (view === 'semana') return dir > 0 ? addWeeks(base, 1) : subWeeks(base, 1);
  if (view === 'mes') return dir > 0 ? addMonths(base, 1) : subMonths(base, 1);
  if (view === 'trimestre') return dir > 0 ? addQuarters(base, 1) : subQuarters(base, 1);
  if (view === 'semestre') return dir > 0 ? addMonths(base, 6) : subMonths(base, 6);
  return base;
}

function getMultiRange(view, base) {
  if (view === 'trimestre') {
    return { start: startOfQuarter(base), end: endOfQuarter(base) };
  }
  if (view === 'semestre') {
    const month = base.getMonth();
    return {
      start: month < 6 ? new Date(base.getFullYear(), 0, 1) : new Date(base.getFullYear(), 6, 1),
      end: month < 6 ? new Date(base.getFullYear(), 5, 30) : new Date(base.getFullYear(), 11, 31),
    };
  }
  return null;
}

export default function ConsultantSchedule() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('semana');
  const [base, setBase] = useState(new Date());
  const [tab, setTab] = useState('agenda');
  const [dialogCell, setDialogCell] = useState(null);

  const { data: consultants = [] } = useQuery({ queryKey: ['consultants'], queryFn: () => base44.entities.Consultant.list() });
  const { data: allocations = [] } = useQuery({ queryKey: ['allocations-schedule'], queryFn: () => base44.entities.Allocation.list() });
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list() });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Allocation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Allocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }),
  });

  const getProjectName = useCallback((projectId) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return '';
    const c = clients.find(x => x.id === p.client_id);
    return c ? (c.nome_fantasia || c.razao_social) : p.name;
  }, [projects, clients]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    const [destConsultantId, destDate, destTurno] = destination.droppableId.split('|');
    const destOccupied = allocations.find(a =>
      a.id !== draggableId && a.data === destDate && a.periodo_do_dia === destTurno && a.consultant_id === destConsultantId
    );
    if (destOccupied) return;
    updateMutation.mutate({ id: draggableId, data: { data: destDate, periodo_do_dia: destTurno } });
  };

  const cycleStatus = (allocation) => {
    const order = ['a_confirmar', 'faturado', 'nao_faturado'];
    const next = order[(order.indexOf(allocation.status_faturamento) + 1) % order.length];
    updateMutation.mutate({ id: allocation.id, data: { status_faturamento: next } });
  };

  const multiRange = getMultiRange(view, base);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <PageHeader title="Agenda de Consultores" description="Alocações por turno com previsão financeira" />
          <TabsList>
            <TabsTrigger value="agenda" className="gap-1.5"><CalendarDays className="w-4 h-4" /> Agenda</TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1.5"><BarChart3 className="w-4 h-4" /> Financeiro</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="agenda" className="space-y-4 mt-0">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View selector */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {VIEW_OPTIONS.map(v => (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === v.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBase(navigate(view, base, -1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-[200px] text-center capitalize">
                {getRangeLabel(view, base)}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setBase(navigate(view, base, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBase(new Date())}>Hoje</Button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-600 text-white font-medium">Faturado</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-400 text-yellow-900 font-medium">A Confirmar</div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-600 text-white font-medium">Não Faturado</div>
            <span className="text-muted-foreground">Clique na célula vazia para adicionar • Clique no card para mudar status</span>
          </div>

          {/* Grid */}
          {view === 'semana' && (
            <ScheduleWeekView
              weekBase={base}
              allocations={allocations}
              consultants={consultants}
              onCellClick={setDialogCell}
              onDragEnd={onDragEnd}
              onCycleStatus={cycleStatus}
              onDelete={(id) => deleteMutation.mutate(id)}
              getProjectName={getProjectName}
            />
          )}
          {view === 'mes' && (
            <ScheduleMonthView
              baseDate={base}
              allocations={allocations}
              consultants={consultants}
              onCellClick={setDialogCell}
              getProjectName={getProjectName}
            />
          )}
          {(view === 'trimestre' || view === 'semestre') && multiRange && (
            <ScheduleMultiWeekView
              rangeStart={multiRange.start}
              rangeEnd={multiRange.end}
              allocations={allocations}
              consultants={consultants}
              onCellClick={setDialogCell}
              onDelete={(id) => deleteMutation.mutate(id)}
              onCycleStatus={cycleStatus}
              getProjectName={getProjectName}
            />
          )}
        </TabsContent>

        <TabsContent value="financeiro" className="mt-0">
          <ScheduleFinanceDash allocations={allocations} clients={clients} projects={projects} />
        </TabsContent>
      </Tabs>

      {dialogCell && (
        <AllocationCellDialog
          cell={dialogCell}
          projects={projects}
          clients={clients}
          onClose={() => setDialogCell(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] });
            setDialogCell(null);
          }}
        />
      )}
    </div>
  );
}