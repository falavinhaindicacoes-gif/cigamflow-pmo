import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Layers, ListChecks, Trash2 } from 'lucide-react';

const TURNO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

const TIPO_AGENDA_OPTIONS = [
  { value: 'projeto_modulos', label: 'Módulos do Projeto' },
  { value: 'atividades_avulsas', label: 'Lista de Atividades' },
  { value: 'outros', label: 'Outro' },
];

/* ── Módulos/itens pendentes do projeto ── */
function ProjectModulesSelector({ projectId, selectedItems, onToggle }) {
  const [expandedModules, setExpandedModules] = useState({});

  const { data: modules = [] } = useQuery({
    queryKey: ['projectModules', projectId],
    queryFn: () => base44.entities.ProjectModule.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['moduleItems', projectId],
    queryFn: () => base44.entities.ModuleItem.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const pendingItems = items.filter(i => i.status !== 'concluido' && i.status !== 'cancelado');
  const modulesWithItems = modules.filter(m => pendingItems.some(i => i.project_module_id === m.id));

  if (!projectId) return null;

  if (modulesWithItems.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded-lg px-3">
        Nenhuma atividade pendente neste projeto
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
        <Layers className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Atividades pendentes do projeto</span>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y">
        {modulesWithItems.map(mod => {
          const modItems = pendingItems.filter(i => i.project_module_id === mod.id);
          const isExpanded = expandedModules[mod.id] !== false;
          return (
            <div key={mod.id}>
              <button
                type="button"
                onClick={() => setExpandedModules(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                <span className="text-xs font-medium">{mod.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{modItems.length}</span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {modItems.map(item => (
                    <label key={item.id} className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-muted/20 cursor-pointer">
                      <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => onToggle(item.id)} className="mt-0.5" />
                      <span className="text-xs leading-tight">{item.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Atividades avulsas em aberto ── */
function AvulsaActivitiesSelector({ projectId, selectedIds, onToggle }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities-avulsas', projectId],
    queryFn: () =>
      projectId
        ? base44.entities.Activity.filter({ project_id: projectId })
        : base44.entities.Activity.list(),
    enabled: true,
  });

  const open = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');

  if (open.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-2 bg-muted/30 rounded-lg px-3">
        Nenhuma atividade em aberto
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
        <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Atividades em aberto</span>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y">
        {open.map(a => (
          <label key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-muted/20 cursor-pointer">
            <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => onToggle(a.id)} className="mt-0.5" />
            <span className="text-xs leading-tight">{a.titulo}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── Dialog principal ── */
export default function AllocationEditDialog({ allocation, consultant, projects, clients, onClose }) {
  const queryClient = useQueryClient();

  const [projectId, setProjectId] = useState(allocation.project_id || '');
  const [tipoAgenda, setTipoAgenda] = useState(allocation.tipo_agenda || 'projeto_modulos');
  const [statusFaturamento, setStatusFaturamento] = useState(allocation.status_faturamento || 'a_confirmar');
  const [obs, setObs] = useState(allocation.observacoes || '');
  const [selectedModuleItemIds, setSelectedModuleItemIds] = useState([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState([]);

  const toggleModuleItem = (id) =>
    setSelectedModuleItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleActivity = (id) =>
    setSelectedActivityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getClientLabel = (p) => {
    const c = clients.find(x => x.id === p.client_id);
    return c ? `${c.nome_fantasia || c.razao_social} — ${p.name}` : p.name;
  };

  const allocationDate = allocation.data ? new Date(allocation.data + 'T12:00:00') : new Date();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Allocation.update(allocation.id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }); onClose(); },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Allocation.delete(allocation.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }); onClose(); },
  });

  const syncModuleItems = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.ModuleItem.update(id, { status: 'concluido' }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] }),
  });

  const syncActivities = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Activity.update(id, { status: 'concluido', data_conclusao: format(new Date(), 'yyyy-MM-dd') }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] }),
  });

  const handleSave = async (encerrar = false) => {
    if (encerrar) {
      if (tipoAgenda === 'projeto_modulos' && selectedModuleItemIds.length > 0)
        await syncModuleItems.mutateAsync(selectedModuleItemIds);
      if (tipoAgenda === 'atividades_avulsas' && selectedActivityIds.length > 0)
        await syncActivities.mutateAsync(selectedActivityIds);
    }
    const selectedProject = projects.find(p => p.id === projectId);
    updateMutation.mutate({
      project_id: projectId || undefined,
      client_id: selectedProject?.client_id || undefined,
      tipo_agenda: tipoAgenda,
      status_faturamento: statusFaturamento,
      observacoes: obs,
      status: encerrar ? 'encerrada' : allocation.status,
    });
  };

  const hasSelected =
    (tipoAgenda === 'projeto_modulos' && selectedModuleItemIds.length > 0) ||
    (tipoAgenda === 'atividades_avulsas' && selectedActivityIds.length > 0);

  const isPending = updateMutation.isPending || syncModuleItems.isPending || syncActivities.isPending;

  const selectedCount = tipoAgenda === 'projeto_modulos' ? selectedModuleItemIds.length : selectedActivityIds.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar Alocação</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground">
          <p><span className="font-medium text-foreground">{consultant?.name}</span></p>
          <p>{format(allocationDate, "EEEE, dd/MM/yyyy", { locale: ptBR })} — {TURNO_LABELS[allocation.periodo_do_dia]}</p>
        </div>

        <div className="space-y-4 mt-2">
          {/* Projeto */}
          <div className="space-y-1">
            <Label>Projeto / Cliente</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setSelectedModuleItemIds([]); setSelectedActivityIds([]); }}>
              <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>— Sem projeto —</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{getClientLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de agenda */}
          <div className="space-y-1">
            <Label>Finalidade da Agenda</Label>
            <Select value={tipoAgenda} onValueChange={(v) => { setTipoAgenda(v); setSelectedModuleItemIds([]); setSelectedActivityIds([]); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPO_AGENDA_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor condicional */}
          {tipoAgenda === 'projeto_modulos' && projectId && (
            <ProjectModulesSelector
              projectId={projectId}
              selectedItems={selectedModuleItemIds}
              onToggle={toggleModuleItem}
            />
          )}

          {tipoAgenda === 'atividades_avulsas' && (
            <AvulsaActivitiesSelector
              projectId={projectId}
              selectedIds={selectedActivityIds}
              onToggle={toggleActivity}
            />
          )}

          {/* Status faturamento */}
          <div className="space-y-1">
            <Label>Status de Faturamento</Label>
            <Select value={statusFaturamento} onValueChange={setStatusFaturamento}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a_confirmar">A Confirmar</SelectItem>
                <SelectItem value="faturado">Faturado</SelectItem>
                <SelectItem value="nao_faturado">Não Faturado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea placeholder="Ex: reunião kick-off, suporte remoto..." value={obs} onChange={(e) => setObs(e.target.value)} className="h-16" />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {hasSelected && (
            <Button className="w-full" onClick={() => handleSave(true)} disabled={isPending}>
              {isPending ? 'Salvando...' : `Concluir e sincronizar (${selectedCount} item${selectedCount > 1 ? 's' : ''})`}
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm('Excluir esta alocação?')) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button variant={hasSelected ? 'secondary' : 'default'} className="flex-1" onClick={() => handleSave(false)} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}