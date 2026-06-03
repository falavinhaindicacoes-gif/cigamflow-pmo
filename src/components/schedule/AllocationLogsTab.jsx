import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock } from 'lucide-react';

const DOT_COLORS = {
  alocacao: 'bg-green-500',
  desalocacao: 'bg-orange-500',
  conclusao: 'bg-emerald-500',
  encerramento: 'bg-red-500',
  salvamento: 'bg-slate-400',
  acompanhamento: 'bg-blue-400',
};

export default function AllocationLogsTab({ allocationId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['allocation-history', allocationId],
    queryFn: () => base44.entities.AllocationHistory.filter({ allocation_id: allocationId }, '-created_date'),
    enabled: !!allocationId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs">Nenhum log registrado ainda</p>
      </div>
    );
  }

  return (
    <div className="space-y-0 overflow-y-auto pr-1">
      {logs.map((entry, idx) => {
        const dotColor = DOT_COLORS[entry.tipo] || 'bg-slate-400';
        const isLast = idx === logs.length - 1;
        return (
          <div key={entry.id} className="flex gap-3 relative">
            {/* linha vertical */}
            {!isLast && (
              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
            )}
            {/* dot */}
            <div className="flex-shrink-0 mt-1.5">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-background ring-1 ring-border ${dotColor}`} />
            </div>
            {/* conteúdo */}
            <div className="pb-4 flex-1 min-w-0">
              <p className="text-sm leading-snug font-medium text-foreground">{entry.descricao}</p>
              {entry.observacoes && (
                <p className="text-xs text-muted-foreground mt-0.5">{entry.observacoes}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {entry.autor && <span>{entry.autor} em </span>}
                {entry.created_date
                  ? format(new Date(entry.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}