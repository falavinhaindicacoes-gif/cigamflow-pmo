import { useMemo } from 'react';
import { format, addDays, startOfWeek, eachWeekOfInterval, addMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';

const TURNOS = [
  { key: 'manha', label: 'M' },
  { key: 'tarde', label: 'T' },
  { key: 'noite', label: 'N' },
];

const STATUS_CONFIG = {
  faturado: { bg: 'bg-green-600', text: 'text-white' },
  a_confirmar: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  nao_faturado: { bg: 'bg-red-600', text: 'text-white' },
};

// Returns all days in the range
function getDaysInRange(start, end) {
  const days = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}

export default function ScheduleMultiWeekView({ rangeStart, rangeEnd, allocations, consultants, onCellClick, onDelete, onCycleStatus, getProjectName }) {
  const days = getDaysInRange(rangeStart, rangeEnd);
  const activeConsultants = consultants.filter(c => c.status === 'ativo');

  // Group days by month for header
  const monthGroups = [];
  days.forEach(day => {
    const key = format(day, 'yyyy-MM');
    if (!monthGroups.length || monthGroups[monthGroups.length - 1].key !== key) {
      monthGroups.push({ key, label: format(day, 'MMMM yyyy', { locale: ptBR }), count: 1 });
    } else {
      monthGroups[monthGroups.length - 1].count++;
    }
  });

  // Agrupa alocações uma única vez em vez de filtrar o array inteiro para cada célula (dia × turno × consultor)
  const cellsMap = useMemo(() => {
    const map = new Map();
    for (const a of allocations) {
      const key = `${a.consultant_id}|${a.data}|${a.periodo_do_dia}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }, [allocations]);

  const getCells = (consultantId, date, turno) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return cellsMap.get(`${consultantId}|${dateStr}|${turno}`) || [];
  };

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse text-[10px]">
        <thead>
          {/* Month row */}
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-20 bg-muted border border-border px-3 py-1" rowSpan={2} />
            <th className="border border-border px-1 py-1 text-[9px] text-muted-foreground" rowSpan={2}>T</th>
            {monthGroups.map(mg => (
              <th key={mg.key} colSpan={mg.count} className="border border-border px-2 py-1 text-xs font-semibold text-center capitalize">
                {mg.label}
              </th>
            ))}
          </tr>
          {/* Day row */}
          <tr className="bg-muted">
            {days.map(day => {
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isWeekend = [0, 6].includes(day.getDay());
              return (
                <th key={day.toISOString()} className={`border border-border px-0.5 py-1 min-w-[28px] text-center font-medium ${isToday ? 'bg-primary/20 text-primary' : isWeekend ? 'text-muted-foreground/50' : ''}`}>
                  <div className="text-[9px]">{format(day, 'EE', { locale: ptBR }).slice(0, 1).toUpperCase()}</div>
                  <div>{format(day, 'd')}</div>
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
                  <td rowSpan={3} className="sticky left-0 z-10 bg-card border border-border px-2 py-1 align-middle font-semibold text-foreground min-w-[100px]">
                    <div className="text-xs">{consultant.name}</div>
                  </td>
                )}
                <td className="border border-border px-1 py-0.5 bg-muted/40 font-bold text-muted-foreground text-center">{turno.label}</td>
                {days.map(day => {
                   const cellAllocations = getCells(consultant.id, day, turno.key);
                   const isWeekend = [0, 6].includes(day.getDay());
                   return (
                     <td
                       key={format(day, 'yyyy-MM-dd')}
                       className={`border border-border p-0 align-top ${isWeekend ? 'bg-muted/30' : ''}`}
                       onClick={() => !isWeekend && onCellClick({ consultant, date: day, turno: turno.key })}
                     >
                       {!isWeekend && (
                         <div className="flex flex-col gap-px p-px min-h-[32px]">
                           {cellAllocations.map(allocation => {
                             const cfg = STATUS_CONFIG[allocation.status_faturamento] || STATUS_CONFIG.a_confirmar;
                             return (
                               <div
                                 key={allocation.id}
                                 className={`flex items-center justify-center cursor-pointer text-[9px] font-bold rounded-sm h-3 ${cfg.bg} ${cfg.text}`}
                                 onClick={e => { e.stopPropagation(); onCycleStatus(allocation); }}
                                 title={`${getProjectName(allocation.project_id)} — ${allocation.status_faturamento}`}
                               >
                                 ●
                               </div>
                             );
                           })}
                           {cellAllocations.length === 0 && (
                             <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer min-h-[28px]">
                               <Plus className="w-3 h-3 text-muted-foreground" />
                             </div>
                           )}
                         </div>
                       )}
                     </td>
                   );
                 })}
              </tr>
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
}