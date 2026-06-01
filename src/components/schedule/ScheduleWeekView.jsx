import { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';

const TURNOS = [
  { key: 'manha', label: 'Manhã' },
  { key: 'tarde', label: 'Tarde' },
  { key: 'noite', label: 'Noite' },
];

const STATUS_CONFIG = {
  faturado: { label: 'Faturado', bg: 'bg-green-600', text: 'text-white' },
  a_confirmar: { label: 'A Confirmar', bg: 'bg-yellow-400', text: 'text-yellow-900' },
  nao_faturado: { label: 'Não Faturado', bg: 'bg-red-600', text: 'text-white' },
};

function getWeekDays(baseDate) {
  const start = startOfWeek(baseDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export default function ScheduleWeekView({ weekBase, allocations, consultants, onCellClick, onDragEnd, onCycleStatus, onDelete, getProjectName, onAllocationClick }) {
  const days = getWeekDays(weekBase);
  const activeConsultants = consultants.filter((c) => c.status === 'ativo');

  const getCell = useCallback((consultantId, date, turno) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.find(a => a.consultant_id === consultantId && a.data === dateStr && a.periodo_do_dia === turno);
  }, [allocations]);

  return (
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
                  <th key={day.toISOString()} className={`border border-border px-2 py-2 font-semibold min-w-[120px] text-center ${isToday ? 'bg-primary/10 text-primary' : ''}`}>
                    <div>{format(day, 'EEE', { locale: ptBR }).toUpperCase()}</div>
                    <div className="font-normal text-muted-foreground">{format(day, 'dd/MM')}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {activeConsultants.map((consultant) => (
              TURNOS.map((turno, tIdx) => (
                <tr key={`${consultant.id}-${turno.key}`} className={tIdx === 0 ? 'border-t-2 border-border' : ''}>
                  {tIdx === 0 && (
                    <td rowSpan={3} className="sticky left-0 z-10 bg-card border border-border px-3 py-2 align-middle font-semibold text-foreground">
                      <div>{consultant.name}</div>
                      <div className="text-muted-foreground font-normal text-[10px] mt-0.5">{consultant.especialidade_principal}</div>
                    </td>
                  )}
                  <td className="border border-border px-2 py-1 bg-muted/40 font-medium text-muted-foreground text-[10px] whitespace-nowrap">{turno.label}</td>
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
                              onClick={() => !allocation && onCellClick({ consultant, date: day, turno: turno.key })}
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
                                        className={`absolute inset-0.5 rounded text-[10px] flex flex-col justify-between p-1 cursor-pointer ${cfg.bg} ${cfg.text} ${dragSnapshot.isDragging ? 'shadow-lg opacity-90 cursor-grabbing' : ''}`}
                                                                                onClick={(e) => { e.stopPropagation(); if (onAllocationClick) onAllocationClick(allocation); else onCycleStatus(allocation); }}
                                      >
                                        <span className="font-semibold leading-tight line-clamp-2">
                                          {getProjectName(allocation.project_id) || allocation.observacoes || '—'}
                                        </span>
                                        <div className="flex items-center justify-between mt-1">
                                          <span className="opacity-75">{cfg.label}</span>
                                          <button onClick={(e) => { e.stopPropagation(); onDelete(allocation.id); }} className="opacity-60 hover:opacity-100">
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
  );
}