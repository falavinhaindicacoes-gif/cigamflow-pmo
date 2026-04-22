import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Check, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PageHeader from '@/components/shared/PageHeader';
import AllocationCellDialog from '@/components/schedule/AllocationCellDialog';

const TURNOS = [
  { key: 'manha', label: 'Manhã' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noite', label: 'Noite' },
];

const STATUS_CONFIG = {
  faturado: { label: 'Faturado', bg: 'bg-green-600', text: 'text-white', border: 'border-green-700' },
  a_confirmar: { label: 'A Confirmar', bg: 'bg-yellow-400', text: 'text-yellow-900', border: 'border-yellow-500' },
  nao_faturado: { label: 'Não Faturado', bg: 'bg-red-600', text: 'text-white', border: 'border-red-700' },
};

function getWeekDays(baseDate) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function ConsultantSchedule() {
  const queryClient = useQueryClient();
  const [weekBase, setWeekBase] = useState(new Date());
  const [dialogCell, setDialogCell] = useState(null); // { consultant, date, turno, allocation? }

  const days = getWeekDays(weekBase);

  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list(),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations-schedule', format(days[0], 'yyyy-MM-dd'), format(days[6], 'yyyy-MM-dd')],
    queryFn: () => base44.entities.Allocation.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Allocation.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Allocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }),
  });

  const getCell = useCallback((consultantId, date, turno) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.find(
      (a) => a.consultant_id === consultantId && a.data === dateStr && a.periodo_do_dia === turno
    );
  }, [allocations]);

  const getProjectName = (projectId) => {
    const p = projects.find((x) => x.id === projectId);
    if (!p) return '';
    const c = clients.find((x) => x.id === p.client_id);
    return c ? c.nome_fantasia || c.razao_social : p.name;
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    // droppableId format: "consultantId|dateStr|turno"
    const [, destDate, destTurno] = destination.droppableId.split('|');

    // Check if destination is occupied
    const destOccupied = allocations.find(
      (a) =>
        a.id !== draggableId &&
        a.data === destDate &&
        a.periodo_do_dia === destTurno &&
        a.consultant_id === destination.droppableId.split('|')[0]
    );
    if (destOccupied) return;

    updateMutation.mutate({
      id: draggableId,
      data: { data: destDate, periodo_do_dia: destTurno },
    });
  };

  const cycleStatus = (allocation) => {
    const order = ['a_confirmar', 'faturado', 'nao_faturado'];
    const next = order[(order.indexOf(allocation.status_faturamento) + 1) % order.length];
    updateMutation.mutate({ id: allocation.id, data: { status_faturamento: next } });
  };

  const activeConsultants = consultants.filter((c) => c.status === 'ativo');

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="Agenda de Consultores" description="Visualização semanal por turno com arrastar e soltar">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekBase(subWeeks(weekBase, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px] text-center">
            {format(days[0], "dd/MM")} – {format(days[6], "dd/MM/yyyy")}
          </span>
          <Button variant="outline" size="icon" onClick={() => setWeekBase(addWeeks(weekBase, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekBase(new Date())}>
            Hoje
          </Button>
        </div>
      </PageHeader>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <div key={k} className={`flex items-center gap-1.5 px-2 py-1 rounded ${v.bg} ${v.text}`}>
            <span className="font-medium">{v.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-muted-foreground">
          <span>Vazio = Disponível</span>
        </div>
        <span className="text-muted-foreground ml-2">Clique na célula para adicionar • Clique no card para mudar status • Arraste para mover</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="overflow-auto rounded-lg border border-border">
          <table className="min-w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted">
                <th className="sticky left-0 z-20 bg-muted border border-border px-3 py-2 text-left font-semibold min-w-[120px]">Consultor</th>
                <th className="border border-border px-2 py-1 font-medium min-w-[60px] text-muted-foreground">Turno</th>
                {days.map((day) => {
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <th
                      key={day.toISOString()}
                      className={`border border-border px-2 py-2 font-semibold min-w-[120px] text-center ${isToday ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <div>{format(day, 'EEE', { locale: ptBR }).toUpperCase()}</div>
                      <div className="font-normal text-muted-foreground">{format(day, 'dd/MM')}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeConsultants.map((consultant, cIdx) => (
                TURNOS.map((turno, tIdx) => (
                  <tr key={`${consultant.id}-${turno.key}`} className={tIdx === 0 ? 'border-t-2 border-border' : ''}>
                    {tIdx === 0 && (
                      <td
                        rowSpan={3}
                        className="sticky left-0 z-10 bg-card border border-border px-3 py-2 align-middle font-semibold text-foreground"
                      >
                        <div>{consultant.name}</div>
                        <div className="text-muted-foreground font-normal text-[10px] mt-0.5">{consultant.especialidade_principal}</div>
                      </td>
                    )}
                    <td className="border border-border px-2 py-1 bg-muted/40 font-medium text-muted-foreground text-[10px] whitespace-nowrap">
                      {turno.label}
                    </td>
                    {days.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const droppableId = `${consultant.id}|${dateStr}|${turno.key}`;
                      const allocation = getCell(consultant.id, day, turno.key);

                      return (
                        <td key={dateStr} className="border border-border p-0 h-14 align-top">
                          <Droppable droppableId={droppableId}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`w-full h-full min-h-[56px] relative ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                                onClick={() => !allocation && setDialogCell({ consultant, date: day, turno: turno.key })}
                              >
                                {allocation ? (
                                  <Draggable draggableId={allocation.id} index={0}>
                                    {(drag, dragSnapshot) => {
                                      const cfg = STATUS_CONFIG[allocation.status_faturamento] || STATUS_CONFIG.a_confirmar;
                                      return (
                                        <div
                                          ref={drag.innerRef}
                                          {...drag.draggableProps}
                                          {...drag.dragHandleProps}
                                          className={`absolute inset-0.5 rounded text-[10px] flex flex-col justify-between p-1 cursor-grab active:cursor-grabbing ${cfg.bg} ${cfg.text} ${dragSnapshot.isDragging ? 'shadow-lg opacity-90' : ''}`}
                                          onClick={(e) => { e.stopPropagation(); cycleStatus(allocation); }}
                                        >
                                          <span className="font-semibold leading-tight line-clamp-2">
                                            {getProjectName(allocation.project_id) || allocation.observacoes || '—'}
                                          </span>
                                          <div className="flex items-center justify-between mt-1">
                                            <span className="opacity-75">{cfg.label}</span>
                                            <button
                                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(allocation.id); }}
                                              className="opacity-60 hover:opacity-100"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    }}
                                  </Draggable>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                    <Plus className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </DragDropContext>

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