import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const TURNO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

export default function AllocationCellDialog({ cell, projects, clients, onClose, onSaved }) {
  const { consultant, date, turno } = cell;

  const [projectId, setProjectId] = useState('');
  const [statusFaturamento, setStatusFaturamento] = useState('a_confirmar');
  const [obs, setObs] = useState('');

  const getClientName = (project) => {
    const c = clients.find((x) => x.id === project.client_id);
    return c ? c.nome_fantasia || c.razao_social : project.name;
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Allocation.create(data),
    onSuccess: onSaved,
  });

  const handleSave = () => {
    const selectedProject = projects.find((p) => p.id === projectId);
    createMutation.mutate({
      consultant_id: consultant.id,
      company_id: consultant.company_id || undefined,
      project_id: projectId || undefined,
      client_id: selectedProject?.client_id || undefined,
      data: format(date, 'yyyy-MM-dd'),
      periodo_do_dia: turno,
      status_faturamento: statusFaturamento,
      status: 'ativa',
      observacoes: obs,
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova Alocação</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">{consultant.name}</span></p>
          <p>{format(date, "EEEE, dd/MM/yyyy", { locale: ptBR })} — {TURNO_LABELS[turno]}</p>
        </div>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label>Projeto / Cliente</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {getClientName(p)} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Status de Faturamento</Label>
            <Select value={statusFaturamento} onValueChange={setStatusFaturamento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a_confirmar">A Confirmar</SelectItem>
                <SelectItem value="faturado">Faturado</SelectItem>
                <SelectItem value="nao_faturado">Não Faturado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              placeholder="Ex: reunião kick-off, suporte remoto..."
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="h-16"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}