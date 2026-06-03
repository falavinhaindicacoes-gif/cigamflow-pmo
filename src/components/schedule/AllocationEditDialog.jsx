import { useState, useRef } from 'react';
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
import AllocationHistoryTab from './AllocationHistoryTab';
import AllocationLogsTab from './AllocationLogsTab';

const TURNO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

const TIPO_AGENDA_OPTIONS = [
  { value: 'projeto_modulos', label: 'Módulos do Projeto' },
  { value: 'atividades_avulsas', label: 'Lista de Atividades' },
  { value: 'outros', label: 'Outro' },
];

/* ── Módulos/itens do projeto — duas seções ── */
function ProjectModulesSelector({ projectId, allocatedIds, selectedFreeIds, onToggleFree, selectedAllocatedIds, onToggleAllocated }) {
  const [expandedFree, setExpandedFree] = useState({});
  const [expandedAllocated, setExpandedAllocated] = useState({});

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

  // Livres: qualquer status exceto concluído/cancelado e não alocado nesta agenda
  const freeItems = items.filter(i =>
    i.status !== 'concluido' && i.status !== 'cancelado' && !allocatedIds.includes(i.id)
  );
  // Alocados nesta agenda
  const allocatedItems = items.filter(i => allocatedIds.includes(i.id));

  const freeModules = modules.filter(m => freeItems.some(i => i.project_module_id === m.id));
  const allocatedModules = modules.filter(m => allocatedItems.some(i => i.project_module_id === m.id));

  if (!projectId) return null;

  return (
    <div className="space-y-3">
      {/* Seção: Disponíveis */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Disponíveis para alocar</span>
        </div>
        {freeModules.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3 px-3">
            Nenhuma atividade disponível
          </div>
        ) : (
          <div className="max-h-40 overflow-y-auto divide-y">
            {freeModules.map(mod => {
              const modItems = freeItems.filter(i => i.project_module_id === mod.id);
              const isExpanded = expandedFree[mod.id] !== false;
              return (
                <div key={mod.id}>
                  <button type="button"
                    onClick={() => setExpandedFree(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
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
                          <Checkbox checked={selectedFreeIds.includes(item.id)} onCheckedChange={() => onToggleFree(item.id)} className="mt-0.5" />
                          <span className="text-xs leading-tight">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção: Já alocados */}
      {allocatedModules.length > 0 && (
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Alocados nesta agenda</span>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y">
            {allocatedModules.map(mod => {
              const modItems = allocatedItems.filter(i => i.project_module_id === mod.id);
              const isExpanded = expandedAllocated[mod.id] !== false;
              return (
                <div key={mod.id}>
                  <button type="button"
                    onClick={() => setExpandedAllocated(prev => ({ ...prev, [mod.id]: !prev[mod.id] }))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-orange-50/60 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-orange-400" /> : <ChevronRight className="w-3 h-3 text-orange-400" />}
                    <span className="text-xs font-medium text-orange-700">{mod.name}</span>
                    <span className="ml-auto text-xs text-orange-400">{modItems.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pb-1">
                      {modItems.map(item => (
                        <label key={item.id} className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-orange-50/40 cursor-pointer">
                          <Checkbox
                            checked={selectedAllocatedIds.includes(item.id)}
                            onCheckedChange={() => onToggleAllocated(item.id)}
                            className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <span className="text-xs leading-tight text-orange-700">{item.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Atividades avulsas — duas seções ── */
function AvulsaActivitiesSelector({ projectId, allocatedIds, selectedFreeIds, onToggleFree, selectedAllocatedIds, onToggleAllocated }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities-avulsas', projectId],
    queryFn: () =>
      projectId
        ? base44.entities.Activity.filter({ project_id: projectId })
        : base44.entities.Activity.list(),
    enabled: true,
  });

  const freeActivities = activities.filter(a =>
    a.status !== 'concluido' && a.status !== 'cancelado' && !allocatedIds.includes(a.id)
  );
  const allocatedActivities = activities.filter(a => allocatedIds.includes(a.id));

  return (
    <div className="space-y-3">
      {/* Disponíveis */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
          <ListChecks className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Disponíveis para alocar</span>
        </div>
        {freeActivities.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3 px-3">Nenhuma atividade disponível</div>
        ) : (
          <div className="max-h-40 overflow-y-auto divide-y">
            {freeActivities.map(a => (
              <label key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-muted/20 cursor-pointer">
                <Checkbox checked={selectedFreeIds.includes(a.id)} onCheckedChange={() => onToggleFree(a.id)} className="mt-0.5" />
                <span className="text-xs leading-tight">{a.titulo}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Já alocadas */}
      {allocatedActivities.length > 0 && (
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200">
            <ListChecks className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Alocadas nesta agenda</span>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y">
            {allocatedActivities.map(a => (
              <label key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-orange-50/40 cursor-pointer">
                <Checkbox
                  checked={selectedAllocatedIds.includes(a.id)}
                  onCheckedChange={() => onToggleAllocated(a.id)}
                  className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <span className="text-xs leading-tight text-orange-700">{a.titulo}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Dialog principal ── */
export default function AllocationEditDialog({ allocation, consultant, projects, clients, onClose }) {
  const queryClient = useQueryClient();

  const [rightTab, setRightTab] = useState('anotacoes');
  const [projectId, setProjectId] = useState(allocation.project_id || '');
  const [tipoAgenda, setTipoAgenda] = useState(allocation.tipo_agenda || 'projeto_modulos');
  const [statusFaturamento, setStatusFaturamento] = useState(allocation.status_faturamento || 'a_confirmar');
  const [obs, setObs] = useState(allocation.observacoes || '');
  const [selectedFreeIds, setSelectedFreeIds] = useState([]);
  const [selectedAllocatedIds, setSelectedAllocatedIds] = useState([]);

  // Estado local dos IDs alocados (sincronizado com a prop mas atualizado localmente)
  const [localModuleItemIds, setLocalModuleItemIds] = useState(allocation.module_item_ids || []);
  const [localActivityIds, setLocalActivityIds] = useState(allocation.activity_ids || []);

  const toggleFreeItem = (id) =>
    setSelectedFreeIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllocatedItem = (id) =>
    setSelectedAllocatedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const getClientLabel = (p) => {
    const c = clients.find(x => x.id === p.client_id);
    return c ? `${c.nome_fantasia || c.razao_social} — ${p.name}` : p.name;
  };

  const allocationDate = allocation.data ? new Date(allocation.data + 'T12:00:00') : new Date();

  // ref para saber se deve fechar ao salvar (evita problema de closure com state)
  const closeOnSuccessRef = useRef(true);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Allocation.update(allocation.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] });
      if (closeOnSuccessRef.current) onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.Allocation.delete(allocation.id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] }); onClose(); },
  });

  const syncModuleItems = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.ModuleItem.update(id, { status: 'aguardando_confirmacao' }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] }),
  });

  const allocateModuleItems = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.ModuleItem.update(id, { status: 'em_andamento' }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] }),
  });

  const syncActivities = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Activity.update(id, { status: 'em_andamento' }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] }),
  });

  const concludeActivities = useMutation({
    mutationFn: (ids) => Promise.all(ids.map(id => base44.entities.Activity.update(id, { status: 'concluido', data_conclusao: format(new Date(), 'yyyy-MM-dd') }))),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] }),
  });

  const baseUpdate = () => ({
    project_id: projectId || undefined,
    client_id: projects.find(p => p.id === projectId)?.client_id || undefined,
    tipo_agenda: tipoAgenda,
    status_faturamento: statusFaturamento,
    observacoes: obs,
    status: allocation.status,
  });

  const handleAllocar = async () => {
    closeOnSuccessRef.current = false;
    if (tipoAgenda === 'projeto_modulos' && selectedFreeIds.length > 0) {
      await allocateModuleItems.mutateAsync(selectedFreeIds);
      const newIds = [...localModuleItemIds, ...selectedFreeIds];
      setLocalModuleItemIds(newIds);
      setSelectedFreeIds([]);
      updateMutation.mutate({ ...baseUpdate(), module_item_ids: newIds, activity_ids: localActivityIds });
    } else if (tipoAgenda === 'atividades_avulsas' && selectedFreeIds.length > 0) {
      await syncActivities.mutateAsync(selectedFreeIds);
      const newIds = [...localActivityIds, ...selectedFreeIds];
      setLocalActivityIds(newIds);
      setSelectedFreeIds([]);
      updateMutation.mutate({ ...baseUpdate(), activity_ids: newIds, module_item_ids: localModuleItemIds });
    }
  };

  const handleDesalocar = async () => {
    closeOnSuccessRef.current = false;
    if (tipoAgenda === 'projeto_modulos') {
      await Promise.all(selectedAllocatedIds.map(id => base44.entities.ModuleItem.update(id, { status: 'nao_iniciado' })));
      const remaining = localModuleItemIds.filter(id => !selectedAllocatedIds.includes(id));
      setLocalModuleItemIds(remaining);
      setSelectedAllocatedIds([]);
      updateMutation.mutate({ ...baseUpdate(), module_item_ids: remaining, activity_ids: localActivityIds });
    } else {
      await Promise.all(selectedAllocatedIds.map(id => base44.entities.Activity.update(id, { status: 'aberto' })));
      const remaining = localActivityIds.filter(id => !selectedAllocatedIds.includes(id));
      setLocalActivityIds(remaining);
      setSelectedAllocatedIds([]);
      updateMutation.mutate({ ...baseUpdate(), activity_ids: remaining, module_item_ids: localModuleItemIds });
    }
  };

  const handleConcluirAlocados = async () => {
    closeOnSuccessRef.current = false;
    if (tipoAgenda === 'projeto_modulos') {
      await Promise.all(selectedAllocatedIds.map(id => base44.entities.ModuleItem.update(id, { status: 'aguardando_confirmacao' })));
      const remaining = localModuleItemIds.filter(id => !selectedAllocatedIds.includes(id));
      setLocalModuleItemIds(remaining);
      setSelectedAllocatedIds([]);
      updateMutation.mutate({ ...baseUpdate(), module_item_ids: remaining, activity_ids: localActivityIds });
    } else {
      await concludeActivities.mutateAsync(selectedAllocatedIds);
      const remaining = localActivityIds.filter(id => !selectedAllocatedIds.includes(id));
      setLocalActivityIds(remaining);
      setSelectedAllocatedIds([]);
      updateMutation.mutate({ ...baseUpdate(), activity_ids: remaining, module_item_ids: localModuleItemIds });
    }
  };

  const handleSave = async (encerrar = false) => {
    if (tipoAgenda === 'outros' && !obs.trim()) return;
    closeOnSuccessRef.current = true;
    if (encerrar && tipoAgenda === 'projeto_modulos' && selectedFreeIds.length > 0)
      await syncModuleItems.mutateAsync(selectedFreeIds);
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

  const hasFreeSelected = selectedFreeIds.length > 0;
  const hasAllocatedSelected = selectedAllocatedIds.length > 0;

  const isPending = updateMutation.isPending || syncModuleItems.isPending || syncActivities.isPending || allocateModuleItems.isPending || concludeActivities.isPending;

  const freeCount = selectedFreeIds.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b">
          <div>
            <h2 className="text-base font-semibold">Editar Alocação</h2>
            <div className="space-y-0.5 text-sm text-muted-foreground mt-0.5">
              <p><span className="font-medium text-foreground">{consultant?.name}</span></p>
              <p>{format(allocationDate, "EEEE, dd/MM/yyyy", { locale: ptBR })} — {TURNO_LABELS[allocation.periodo_do_dia]}</p>
            </div>
          </div>
        </div>


        {/* Body: duas colunas fixas */}
        <div className="flex min-h-[520px] max-h-[70vh] overflow-hidden">

          {/* Coluna esquerda — campos da agenda */}
          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 border-r">
            {/* Projeto */}
            <div className="space-y-1">
              <Label>Projeto / Cliente</Label>
              <Select value={projectId} onValueChange={(v) => { setProjectId(v); setSelectedFreeIds([]); setSelectedAllocatedIds([]); }}>
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
              <Select value={tipoAgenda} onValueChange={(v) => { setTipoAgenda(v); setSelectedFreeIds([]); setSelectedAllocatedIds([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_AGENDA_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Seletor condicional */}
            {tipoAgenda === 'projeto_modulos' && projectId && (
              <ProjectModulesSelector
                projectId={projectId}
                allocatedIds={localModuleItemIds}
                selectedFreeIds={selectedFreeIds}
                onToggleFree={toggleFreeItem}
                selectedAllocatedIds={selectedAllocatedIds}
                onToggleAllocated={toggleAllocatedItem}
              />
            )}

            {tipoAgenda === 'atividades_avulsas' && (
              <AvulsaActivitiesSelector
                projectId={projectId}
                allocatedIds={localActivityIds}
                selectedFreeIds={selectedFreeIds}
                onToggleFree={toggleFreeItem}
                selectedAllocatedIds={selectedAllocatedIds}
                onToggleAllocated={toggleAllocatedItem}
              />
            )}

            {/* Observações — na coluna esquerda */}
            <div className="space-y-1">
              <Label>Observações {tipoAgenda === 'outros' && <span className="text-destructive">*</span>}</Label>
              <Textarea
                placeholder={tipoAgenda === 'outros' ? 'Descreva o motivo desta agenda...' : 'Ex: reunião kick-off, suporte remoto...'}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className={`h-24 resize-none text-sm ${tipoAgenda === 'outros' && !obs.trim() ? 'border-destructive' : ''}`}
              />
              {tipoAgenda === 'outros' && !obs.trim() && (
                <p className="text-xs text-destructive">Obrigatório quando a finalidade é "Outro"</p>
              )}
            </div>
          </div>

          {/* Coluna direita — Anotações / Logs */}
          <div className="w-96 flex-shrink-0 flex flex-col border-l overflow-hidden">
            {/* Sub-tabs estilo pill */}
            <div className="flex gap-1 px-4 py-2.5 border-b bg-muted/20">
              <button
                onClick={() => setRightTab('anotacoes')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${rightTab === 'anotacoes' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                Anotações
              </button>
              <button
                onClick={() => setRightTab('logs')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${rightTab === 'logs' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                Histórico
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {rightTab === 'anotacoes'
                ? <AllocationHistoryTab allocationId={allocation.id} />
                : <AllocationLogsTab allocationId={allocation.id} />
              }
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex flex-col gap-2">
          {(hasFreeSelected || hasAllocatedSelected) && (
            <div className="flex gap-2 w-full">
              {hasAllocatedSelected && (
                <Button variant="outline" className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50" onClick={handleDesalocar} disabled={isPending}>
                  {isPending ? '...' : `Desalocar (${selectedAllocatedIds.length})`}
                </Button>
              )}
              {hasAllocatedSelected && (
                <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={handleConcluirAlocados} disabled={isPending}>
                  {isPending ? '...' : `Concluir (${selectedAllocatedIds.length})`}
                </Button>
              )}
              {hasFreeSelected && (
                <Button variant="outline" className="flex-1" onClick={handleAllocar} disabled={isPending}>
                  {isPending ? '...' : `Alocar (${freeCount})`}
                </Button>
              )}
              {hasFreeSelected && (
                <Button className="flex-1" onClick={() => handleSave(true)} disabled={isPending}>
                  {isPending ? '...' : `Notif. conclusão (${freeCount})`}
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive"
              onClick={() => { if (confirm('Excluir esta alocação?')) deleteMutation.mutate(); }}
              disabled={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button variant={hasFreeSelected || hasAllocatedSelected ? 'secondary' : 'default'} className="flex-1" onClick={() => handleSave(false)} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}