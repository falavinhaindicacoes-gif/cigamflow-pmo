import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, MessageSquarePlus, CheckCircle2, ArrowRightLeft, Save, XCircle } from 'lucide-react';

const TIPO_ICONS = {
  acompanhamento: MessageSquarePlus,
  alocacao: ArrowRightLeft,
  desalocacao: ArrowRightLeft,
  conclusao: CheckCircle2,
  salvamento: Save,
  encerramento: XCircle,
};

const TIPO_COLORS = {
  acompanhamento: 'text-blue-600 bg-blue-50 border-blue-200',
  alocacao: 'text-green-600 bg-green-50 border-green-200',
  desalocacao: 'text-orange-600 bg-orange-50 border-orange-200',
  conclusao: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  salvamento: 'text-slate-600 bg-slate-50 border-slate-200',
  encerramento: 'text-red-600 bg-red-50 border-red-200',
};

const TIPO_LABELS = {
  acompanhamento: 'Acompanhamento',
  alocacao: 'Alocação',
  desalocacao: 'Desalocação',
  conclusao: 'Conclusão',
  salvamento: 'Salvamento',
  encerramento: 'Encerramento',
};

export default function AllocationHistoryTab({ allocationId, compact = false }) {
  const queryClient = useQueryClient();
  const [novoAcomp, setNovoAcomp] = useState('');

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['allocation-history', allocationId],
    queryFn: () => base44.entities.AllocationHistory.filter({ allocation_id: allocationId }, '-created_date'),
    enabled: !!allocationId,
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.AllocationHistory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocation-history', allocationId] });
      setNovoAcomp('');
    },
  });

  const handleAddAcompanhamento = () => {
    if (!novoAcomp.trim()) return;
    addMutation.mutate({
      allocation_id: allocationId,
      tipo: 'acompanhamento',
      descricao: novoAcomp.trim(),
    });
  };

  if (compact) {
    if (isLoading) return <div className="flex justify-center py-3"><div className="w-4 h-4 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" /></div>;
    if (history.length === 0) return <p className="text-xs text-muted-foreground text-center py-2">Sem registros ainda</p>;
    return (
      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {history.map((entry) => {
          const colorClass = TIPO_COLORS[entry.tipo] || TIPO_COLORS.acompanhamento;
          return (
            <div key={entry.id} className={`border rounded p-2 ${colorClass}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold">{TIPO_LABELS[entry.tipo] || entry.tipo}</span>
                <span className="text-xs opacity-60">{entry.created_date ? format(new Date(entry.created_date), "dd/MM HH:mm", { locale: ptBR }) : ''}</span>
              </div>
              <p className="text-xs leading-snug">{entry.descricao}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Adicionar acompanhamento */}
      <div className="space-y-2">
        <Label className="text-xs font-medium">Novo Acompanhamento</Label>
        <Textarea
          placeholder="Registre um acompanhamento desta agenda..."
          value={novoAcomp}
          onChange={(e) => setNovoAcomp(e.target.value)}
          className="h-20 text-sm resize-none"
        />
        <Button
          size="sm"
          onClick={handleAddAcompanhamento}
          disabled={!novoAcomp.trim() || addMutation.isPending}
          className="w-full"
        >
          <MessageSquarePlus className="w-3.5 h-3.5 mr-1.5" />
          {addMutation.isPending ? 'Salvando...' : 'Registrar Acompanhamento'}
        </Button>
      </div>

      <div className="border-t pt-3 flex-1 overflow-hidden flex flex-col">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Histórico ({history.length} registro{history.length !== 1 ? 's' : ''})
        </p>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum registro ainda</p>
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {history.map((entry) => {
              const Icon = TIPO_ICONS[entry.tipo] || Clock;
              const colorClass = TIPO_COLORS[entry.tipo] || TIPO_COLORS.acompanhamento;
              return (
                <div key={entry.id} className={`border rounded-lg p-3 ${colorClass}`}>
                  <div className="flex items-start gap-2">
                    <Icon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold">{TIPO_LABELS[entry.tipo] || entry.tipo}</span>
                        <span className="text-xs opacity-60 flex-shrink-0">
                          {entry.created_date
                            ? format(new Date(entry.created_date), "dd/MM/yy HH:mm", { locale: ptBR })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{entry.descricao}</p>
                      {entry.observacoes && (
                        <p className="text-xs mt-1 opacity-70">{entry.observacoes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}