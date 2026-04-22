import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';

const TURNOS = ['manha', 'tarde', 'noite'];
const STATUS_CONFIG = {
  faturado: { bg: 'bg-green-500' },
  a_confirmar: { bg: 'bg-yellow-400' },
  nao_faturado: { bg: 'bg-red-500' },
};

export default function ScheduleMonthView({ baseDate, allocations, consultants, onCellClick, getProjectName }) {
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);
  // pad to full weeks
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const days = [];
  let d = gridStart;
  while (d <= monthEnd || days.length % 7 !== 0) {
    days.push(d);
    d = addDays(d, 1);
    if (days.length > 42) break;
  }

  const activeConsultants = consultants.filter(c => c.status === 'ativo');
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  const getAllocations = (dateStr) => allocations.filter(a => a.data === dateStr);

  return (
    <div className="overflow-auto rounded-lg border border-border">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="grid grid-cols-7 bg-muted">
          {weekDays.map(wd => (
            <div key={wd} className="border border-border px-2 py-2 text-xs font-semibold text-center text-muted-foreground">{wd}</div>
          ))}
        </div>
        {/* Weeks */}
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {days.slice(wi * 7, wi * 7 + 7).map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = format(day, 'MM') === format(baseDate, 'MM');
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
              const dayAllocs = getAllocations(dateStr);

              // group by consultant
              const byConsultant = {};
              dayAllocs.forEach(a => {
                if (!byConsultant[a.consultant_id]) byConsultant[a.consultant_id] = [];
                byConsultant[a.consultant_id].push(a);
              });

              return (
                <div key={dateStr} className={`border border-border min-h-[90px] p-1 ${!isCurrentMonth ? 'bg-muted/30' : 'bg-card'}`}>
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {Object.entries(byConsultant).slice(0, 3).map(([cid, allocs]) => {
                      const consultant = activeConsultants.find(c => c.id === cid);
                      return (
                        <div key={cid} className="text-[9px] flex gap-0.5 items-center">
                          <span className="truncate text-foreground font-medium">{consultant?.name?.split(' ')[0]}</span>
                          <div className="flex gap-0.5 ml-auto flex-shrink-0">
                            {allocs.map(a => (
                              <div key={a.id} className={`w-2 h-2 rounded-full ${STATUS_CONFIG[a.status_faturamento]?.bg || 'bg-gray-400'}`} title={a.periodo_do_dia} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(byConsultant).length > 3 && (
                      <div className="text-[9px] text-muted-foreground">+{Object.keys(byConsultant).length - 3} mais</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}