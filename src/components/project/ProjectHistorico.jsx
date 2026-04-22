import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, GitBranch, ArrowRight, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FASES_PROJETO, getFaseLabel } from '@/lib/constants';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProjectHistorico({ project }) {
  const [showAdvance, setShowAdvance] = useState(false);
  const queryClient = useQueryClient();

  const { data: history = [] } = useQuery({
    queryKey: ['phase-history', project?.id],
    queryFn: () => base44.entities.Activity.filter({ project_id: project?.id, origem: 'status_report' }, '-created_date', 50),
    enabled: !!project?.id,
  });

  // Use activities with tipo "decisao" to track phase changes (workaround)
  const { data: decisionActivities = [] } = useQuery({
    queryKey: ['decisions', project?.id],
    queryFn: () => base44.entities.Activity.filter({ project_id: project?.id, tipo: 'decisao' }, '-created_date', 50),
    enabled: !!project?.id,
  });

  const advancePhaseMutation = useMutation({
    mutationFn: async ({ novaFase, justificativa }) => {
      const faseAnterior = project.fase_atual;
      await base44.entities.Project.update(project.id, { fase_atual: novaFase });
      await base44.entities.Activity.create({
        project_id: project.id,
        titulo: `Mudança de fase: ${getFaseLabel(faseAnterior)} → ${getFaseLabel(novaFase)}`,
        descricao: justificativa,
        tipo: 'decisao',
        origem: 'interno',
        status: 'concluido',
        data_conclusao: new Date().toISOString().split('T')[0],
        tratativa_realizada: `Fase anterior: ${getFaseLabel(faseAnterior)}. Nova fase: ${getFaseLabel(novaFase)}. Justificativa: ${justificativa}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['decisions', project?.id] });
      setShowAdvance(false);
    },
  });

  const faseChanges = decisionActivities.filter(a => a.titulo?.startsWith('Mudança de fase:'));

  const currentFaseIndex = FASES_PROJETO.findIndex(f => f.value === project?.fase_atual);
  const proximasFases = FASES_PROJETO.slice(currentFaseIndex + 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Histórico de Fases</h3>
        {proximasFases.length > 0 && (
          <Button size="sm" onClick={() => setShowAdvance(true)} className="gap-2">
            <ArrowRight className="w-3 h-3" /> Avançar Fase
          </Button>
        )}
      </div>

      {/* Timeline das fases */}
      <div className="bg-card border rounded-xl p-5">
        <div className="space-y-0">
          {FASES_PROJETO.map((fase, idx) => {
            const isCurrent = fase.value === project?.fase_atual;
            const isPast = idx < currentFaseIndex;
            const isFuture = idx > currentFaseIndex;
            const change = faseChanges.find(a => a.titulo?.includes(`→ ${getFaseLabel(fase.value)}`));

            return (
              <div key={fase.value} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    isPast ? 'bg-green-500 text-white' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isPast ? <span className="text-xs">✓</span> : <span className="text-xs">{idx + 1}</span>}
                  </div>
                  {idx < FASES_PROJETO.length - 1 && (
                    <div className={`w-0.5 h-10 ${isPast ? 'bg-green-300' : 'bg-border'}`} />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`font-medium text-sm ${isFuture ? 'text-muted-foreground' : ''}`}>{fase.label}</span>
                    {isCurrent && <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">Atual</span>}
                  </div>
                  {change && (
                    <div className="mt-1">
                      <p className="text-xs text-muted-foreground">
                        {change.created_date ? format(new Date(change.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : ''}
                      </p>
                      {change.descricao && <p className="text-xs text-muted-foreground italic mt-0.5">"{change.descricao}"</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log de mudanças */}
      {faseChanges.length > 0 && (
        <div className="bg-card border rounded-xl p-5">
          <h4 className="font-semibold text-sm mb-3">Log de Transições</h4>
          <div className="space-y-3">
            {faseChanges.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <GitBranch className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{a.titulo}</p>
                  {a.descricao && <p className="text-xs text-muted-foreground mt-0.5">{a.descricao}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {a.created_date ? format(new Date(a.created_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
                    {a.created_by && ` · ${a.created_by}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={showAdvance} onOpenChange={setShowAdvance}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Avançar Fase do Projeto</DialogTitle></DialogHeader>
          <AdvancePhaseForm
            currentFase={project?.fase_atual}
            proximasFases={proximasFases}
            onSubmit={advancePhaseMutation.mutate}
            isLoading={advancePhaseMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdvancePhaseForm({ currentFase, proximasFases, onSubmit, isLoading }) {
  const [novaFase, setNovaFase] = useState(proximasFases[0]?.value || '');
  const [justificativa, setJustificativa] = useState('');

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ novaFase, justificativa }); }} className="space-y-4">
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">Fase atual</p>
        <p className="font-medium text-sm">{getFaseLabel(currentFase)}</p>
      </div>
      <div>
        <Label>Nova Fase *</Label>
        <Select value={novaFase} onValueChange={setNovaFase}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {proximasFases.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Justificativa</Label>
        <Textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={3} placeholder="Descreva o motivo do avanço de fase..." />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading || !novaFase}>
        {isLoading ? 'Avançando...' : 'Confirmar Avanço de Fase'}
      </Button>
    </form>
  );
}