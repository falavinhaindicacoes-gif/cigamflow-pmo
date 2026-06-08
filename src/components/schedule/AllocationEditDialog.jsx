import { useState, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Layers, ListChecks, Trash2 } from 'lucide-react';
import AllocationHistoryTab from './AllocationHistoryTab';
import AllocationLogsTab from './AllocationLogsTab';
import { updateProjectMetrics } from '@/utils/projectMetrics';
import { updateModuleStatusFromItems } from '@/utils/statusAutomation';
import { useAuth } from '@/lib/AuthContext';

const TURNO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

const TIPO_AGENDA_OPTIONS = [
  { value: 'projeto_modulos', label: 'Módulos do Projeto' },
  { value: 'atividades_avulsas', label: 'Lista de Atividades' },
  { value: 'outros', label: 'Outro' },
];

/* ── Módulos/itens do projeto — duas seções ── */
function ProjectModulesSelector({ projectId, allocatedIds, excludeIds = [], selectedFreeIds, onToggleFree, selectedAllocatedIds, onToggleAllocated }) {
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

  const freeItems = items.filter(i =>
    !['concluido', 'cancelado'].includes(i.status) &&
    !allocatedIds.includes(i.id) &&
    !excludeIds.includes(i.id)
  );
  const allocatedItems = items.filter(i => allocatedIds.includes(i.id) && !excludeIds.includes(i.id));

  const freeModules = modules.filter(m => freeItems.some(i => i.project_module_id === m.id));
  const allocatedModules = modules.filter(m => allocatedItems.some(i => i.project_module_id === m.id));

  if (!projectId) return null;

  return (
    <div className="space-y-2">
      {/* Seção: Disponíveis para alocar */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Disponíveis para alocar</span>
        </div>
        {freeModules.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-3 px-3">Nenhuma atividade disponível</div>
        ) : (
          <div className="max-h-40 overflow-y-auto divide-y">
            {freeModules.map(mod => {
              const modItems = freeItems.filter(i => i.project_module_id === mod.id);
              const isExpanded = expandedFree[mod.id] !== false;
              return (
                <div key={mod.id}>
                  <button type="button"
                    onClick={() => setExpandedFree(prev => ({ ...prev, [mod.id]: !isExpanded }))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                    <span className="text-xs font-medium">{mod.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{modItems.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pb-1">
                      {modItems.map(item => (
                        <div key={item.id} className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-muted/20 cursor-pointer" onClick={() => onToggleFree(item.id)}>
                          <Checkbox checked={selectedFreeIds.includes(item.id)} onCheckedChange={() => {}} className="mt-0.5 pointer-events-none" />
                          <span className="text-xs leading-tight flex items-center gap-1.5">
                            {item.name}
                            {item.status === 'aguardando_confirmacao' && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium whitespace-nowrap">aguard. confirmação</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção: Alocados nesta agenda */}
      {allocatedModules.length > 0 && (
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200">
            <Layers className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Alocados nesta agenda</span>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-orange-100">
            {allocatedModules.map(mod => {
              const modItems = allocatedItems.filter(i => i.project_module_id === mod.id);
              const isExpanded = expandedAllocated[mod.id] !== false;
              return (
                <div key={mod.id}>
                  <button type="button"
                    onClick={() => setExpandedAllocated(prev => ({ ...prev, [mod.id]: !isExpanded }))}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-orange-50/60 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-orange-400" /> : <ChevronRight className="w-3 h-3 text-orange-400" />}
                    <span className="text-xs font-medium text-orange-700">{mod.name}</span>
                    <span className="ml-auto text-xs text-orange-400">{modItems.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="pb-1">
                      {modItems.map(item => (
                        <div key={item.id} className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-orange-50/40 cursor-pointer" onClick={() => onToggleAllocated(item.id)}>
                          <Checkbox
                            checked={selectedAllocatedIds.includes(item.id)}
                            onCheckedChange={() => {}}
                            className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 pointer-events-none"
                          />
                          <span className="text-xs leading-tight text-orange-700">{item.name}</span>
                        </div>
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
function AvulsaActivitiesSelector({ projectId, allocatedIds, excludeIds = [], selectedFreeIds, onToggleFree, selectedAllocatedIds, onToggleAllocated }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities-avulsas', projectId],
    queryFn: () =>
      projectId
        ? base44.entities.Activity.filter({ project_id: projectId })
        : base44.entities.Activity.list(),
    enabled: true,
  });

  const freeActivities = activities.filter(a =>
    !['concluido', 'cancelado'].includes(a.status) &&
    !allocatedIds.includes(a.id) &&
    !excludeIds.includes(a.id)
  );
  const allocatedActivities = activities.filter(a => allocatedIds.includes(a.id) && !excludeIds.includes(a.id));

  return (
    <div className="space-y-2">
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
              <div key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-muted/20 cursor-pointer" onClick={() => onToggleFree(a.id)}>
                <Checkbox checked={selectedFreeIds.includes(a.id)} onCheckedChange={() => {}} className="mt-0.5 pointer-events-none" />
                <span className="text-xs leading-tight">{a.titulo}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {allocatedActivities.length > 0 && (
        <div className="border border-orange-200 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200">
            <ListChecks className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-xs font-medium text-orange-600">Alocadas nesta agenda</span>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-orange-100">
            {allocatedActivities.map(a => (
              <div key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-orange-50/40 cursor-pointer" onClick={() => onToggleAllocated(a.id)}>
                <Checkbox
                  checked={selectedAllocatedIds.includes(a.id)}
                  onCheckedChange={() => {}}
                  className="mt-0.5 border-orange-400 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 pointer-events-none"
                />
                <span className="text-xs leading-tight text-orange-700">{a.titulo}</span>
              </div>
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
  const { user } = useAuth();

  const [rightTab, setRightTab] = useState('anotacoes');
  const [projectId, setProjectId] = useState(allocation.project_id || '');
  const [tipoAgenda, setTipoAgenda] = useState(
    ['projeto_modulos', 'atividades_avulsas', 'outros'].includes(allocation.tipo_agenda)
      ? allocation.tipo_agenda
      : 'projeto_modulos'
  );
  const [statusFaturamento, setStatusFaturamento] = useState(allocation.status_faturamento || 'a_confirmar');
  const [obs, setObs] = useState(allocation.observacoes || '');
  const [selectedFreeIds, setSelectedFreeIds] = useState([]);
  const [selectedAllocatedIds, setSelectedAllocatedIds] = useState([]);
  const [isPending, setIsPending] = useState(false);

  // ── REFS para evitar problemas de stale closure em handlers assíncronos ──
  const moduleItemIdsRef = useRef(allocation.module_item_ids || []);
  const activityIdsRef = useRef(allocation.activity_ids || []);
  const concludedIdsRef = useRef([]);
  const deallocatedIdsRef = useRef([]);
  // Refs para os campos de formulário (evita closure stale no saveAllocation)
  const projectIdRef = useRef(allocation.project_id || '');
  const tipoAgendaRef = useRef(
    ['projeto_modulos', 'atividades_avulsas', 'outros'].includes(allocation.tipo_agenda)
      ? allocation.tipo_agenda
      : 'projeto_modulos'
  );
  const statusFaturamentoRef = useRef(allocation.status_faturamento || 'a_confirmar');
  const obsRef = useRef(allocation.observacoes || '');

  // States derivados dos refs para forçar re-render quando necessário
  const [moduleItemIdsTick, setModuleItemIdsTick] = useState(0);
  const [activityIdsTick, setActivityIdsTick] = useState(0);
  const [excludeIdsTick, setExcludeIdsTick] = useState(0);

  // Helpers para atualizar ref + forçar re-render
  const setModuleItemIds = (ids) => {
    moduleItemIdsRef.current = ids;
    setModuleItemIdsTick(t => t + 1);
  };
  const setActivityIds = (ids) => {
    activityIdsRef.current = ids;
    setActivityIdsTick(t => t + 1);
  };
  const addConcludedIds = (ids) => {
    concludedIdsRef.current = [...concludedIdsRef.current, ...ids];
    setExcludeIdsTick(t => t + 1);
  };
  const addDeallocatedIds = (ids) => {
    deallocatedIdsRef.current = [...deallocatedIdsRef.current, ...ids];
    setExcludeIdsTick(t => t + 1);
  };

  const toggleFreeItem = (id) => {
    console.log('[toggleFreeItem] id:', id, 'current:', selectedFreeIds);
    setSelectedFreeIds(prev => {
      const newVal = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      console.log('[toggleFreeItem] new:', newVal);
      return newVal;
    });
  };

  const toggleAllocatedItem = (id) => {
    console.log('[toggleAllocatedItem] id:', id, 'current:', selectedAllocatedIds);
    setSelectedAllocatedIds(prev => {
      const newVal = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      console.log('[toggleAllocatedItem] new:', newVal);
      return newVal;
    });
  };

  const getClientLabel = (p) => {
    const c = clients.find(x => x.id === p.client_id);
    return c ? `${c.nome_fantasia || c.razao_social} — ${p.name}` : p.name;
  };

  const allocationDate = allocation.data ? new Date(allocation.data + 'T12:00:00') : new Date();

  // Salva a allocation lendo SEMPRE dos refs (nunca do closure do render)
  // Nota: NÃO altera status automaticamente — apenas os campos que foram explicitamente atualizados
  const saveAllocation = async (extraData = {}) => {
    const pid = projectIdRef.current;
    const data = {
      ...(pid ? { project_id: pid } : {}),
      ...(pid ? { client_id: projects.find(p => p.id === pid)?.client_id } : {}),
      tipo_agenda: tipoAgendaRef.current,
      status_faturamento: statusFaturamentoRef.current,
      observacoes: obsRef.current,
      module_item_ids: moduleItemIdsRef.current,
      activity_ids: activityIdsRef.current,
      ...extraData,
    };
    console.log('[saveAllocation] saving:', JSON.stringify(data));
    try {
      const result = await base44.entities.Allocation.update(allocation.id, data);
      console.log('[saveAllocation] SUCCESS, result:', result);
    } catch (err) {
      console.error('[saveAllocation] FAILED:', err?.message || err);
      throw err;
    }
    queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] });
  };

  const syncProjectAfterModuleItemChange = async (affectedIds) => {
    if (!projectId || !affectedIds.length) return;
    const freshItems = await base44.entities.ModuleItem.filter({ project_id: projectId });
    const affectedModuleIds = [...new Set(
      freshItems.filter(i => affectedIds.includes(i.id)).map(i => i.project_module_id).filter(Boolean)
    )];
    if (affectedModuleIds.length > 0) {
      await Promise.all(affectedModuleIds.map(mid => updateModuleStatusFromItems(mid, projectId)));
    }
    await updateProjectMetrics(projectId, queryClient);
    queryClient.setQueryData(['moduleItems', projectId], freshItems);
    queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] });
  };

  // ── Registra histórico com nomes dos itens afetados ──
  const registrarHistorico = async (tipo, descricaoBase, itemIds, entityType = 'modulo') => {
    let itemNames = [];
    if (entityType === 'modulo' && projectId) {
      const allItems = queryClient.getQueryData(['moduleItems', projectId]) || [];
      const allModules = queryClient.getQueryData(['projectModules', projectId]) || [];
      itemNames = itemIds.map(id => {
        const item = allItems.find(i => i.id === id);
        if (!item) return id;
        const mod = allModules.find(m => m.id === item.project_module_id);
        return mod ? `${mod.name} → ${item.name}` : item.name;
      });
    } else if (entityType === 'atividade') {
      const allActivities = queryClient.getQueryData(['activities-avulsas', projectId]) || [];
      itemNames = itemIds.map(id => {
        const a = allActivities.find(x => x.id === id);
        return a ? a.titulo : id;
      });
    }
    const detalhe = itemNames.length > 0 ? `\n• ${itemNames.join('\n• ')}` : '';
    await base44.entities.AllocationHistory.create({
      allocation_id: allocation.id,
      tipo,
      descricao: descricaoBase + detalhe,
      autor: user?.full_name || user?.email || '',
    });
    queryClient.invalidateQueries({ queryKey: ['allocation-history', allocation.id] });
  };

  // ── ALOCAR: move itens de "disponível" para "alocados nesta agenda" ──
  const handleAllocar = async () => {
    console.log('[handleAllocar] selectedFreeIds:', selectedFreeIds, 'tipoAgenda:', tipoAgendaRef.current);
    if (selectedFreeIds.length === 0) return;
    setIsPending(true);
    try {
      if (tipoAgendaRef.current === 'projeto_modulos') {
        const idsToAllocate = [...selectedFreeIds];
        const newIds = [...moduleItemIdsRef.current, ...idsToAllocate];
        await Promise.all(idsToAllocate.map(id => base44.entities.ModuleItem.update(id, { status: 'em_andamento' })));
        await saveAllocation({ module_item_ids: newIds, status: 'ativa' });
        await registrarHistorico('alocacao', `${idsToAllocate.length} item(ns) alocado(s) nesta agenda:`, idsToAllocate, 'modulo');
        setModuleItemIds(newIds);
        setSelectedFreeIds([]);
        await syncProjectAfterModuleItemChange(idsToAllocate);
      } else if (tipoAgendaRef.current === 'atividades_avulsas') {
        const idsToAllocate = [...selectedFreeIds];
        const newIds = [...activityIdsRef.current, ...idsToAllocate];
        await Promise.all(idsToAllocate.map(id => base44.entities.Activity.update(id, { status: 'em_andamento' })));
        await saveAllocation({ activity_ids: newIds, status: 'ativa' });
        await registrarHistorico('alocacao', `${idsToAllocate.length} atividade(s) alocada(s) nesta agenda:`, idsToAllocate, 'atividade');
        setActivityIds(newIds);
        setSelectedFreeIds([]);
        queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] });
      }
    } catch (err) {
      console.error('[handleAllocar] error:', err.message);
    } finally {
      setIsPending(false);
    }
  };

  // ── DESALOCAR: remove itens de "alocados" e reverte status ──
  const handleDesalocar = async () => {
    if (selectedAllocatedIds.length === 0) return;
    setIsPending(true);
    try {
      if (tipoAgenda === 'projeto_modulos') {
        const idsToDeallocate = [...selectedAllocatedIds];
        const remaining = moduleItemIdsRef.current.filter(id => !idsToDeallocate.includes(id));
        await Promise.all(idsToDeallocate.map(id => base44.entities.ModuleItem.update(id, { status: 'nao_iniciado' })));
        const statusAfterRemoval = remaining.length > 0 ? 'ativa' : 'encerrada';
        await saveAllocation({ module_item_ids: remaining, status: statusAfterRemoval });
        await registrarHistorico('desalocacao', `${idsToDeallocate.length} item(ns) desalocado(s) desta agenda:`, idsToDeallocate, 'modulo');
        setModuleItemIds(remaining);
        addDeallocatedIds(idsToDeallocate);
        setSelectedAllocatedIds([]);
        await syncProjectAfterModuleItemChange(idsToDeallocate);
      } else {
        const idsToDeallocate = [...selectedAllocatedIds];
        const remaining = activityIdsRef.current.filter(id => !idsToDeallocate.includes(id));
        await Promise.all(idsToDeallocate.map(id => base44.entities.Activity.update(id, { status: 'aberto' })));
        const statusAfterRemoval = remaining.length > 0 ? 'ativa' : 'encerrada';
        await saveAllocation({ activity_ids: remaining, status: statusAfterRemoval });
        await registrarHistorico('desalocacao', `${idsToDeallocate.length} atividade(s) desalocada(s) desta agenda:`, idsToDeallocate, 'atividade');
        setActivityIds(remaining);
        addDeallocatedIds(idsToDeallocate);
        setSelectedAllocatedIds([]);
        queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] });
      }
    } catch (err) {
      console.error('[handleDesalocar] error:', err.message);
    } finally {
      setIsPending(false);
    }
  };

  // ── CONCLUIR ALOCADOS: marca como "aguardando_confirmacao" e remove da agenda ──
  const handleConcluirAlocados = async () => {
    console.log('[handleConcluirAlocados] selectedAllocatedIds:', selectedAllocatedIds, 'moduleItemIdsRef:', moduleItemIdsRef.current);
    if (selectedAllocatedIds.length === 0) return;
    setIsPending(true);
    try {
      if (tipoAgenda === 'projeto_modulos') {
        const idsToConclude = [...selectedAllocatedIds];
        const remaining = moduleItemIdsRef.current.filter(id => !idsToConclude.includes(id));
        await Promise.all(idsToConclude.map(id => base44.entities.ModuleItem.update(id, { status: 'concluido' })));
        const statusAfterRemoval = remaining.length > 0 ? 'ativa' : 'encerrada';
        await saveAllocation({ module_item_ids: remaining, status: statusAfterRemoval });
        await registrarHistorico('conclusao', `${idsToConclude.length} item(ns) concluído(s) e sincronizados:`, idsToConclude, 'modulo');
        setModuleItemIds(remaining);
        addConcludedIds(idsToConclude);
        setSelectedAllocatedIds([]);
        await syncProjectAfterModuleItemChange(idsToConclude);
      } else {
        const idsToConclude = [...selectedAllocatedIds];
        const remaining = activityIdsRef.current.filter(id => !idsToConclude.includes(id));
        await Promise.all(idsToConclude.map(id => base44.entities.Activity.update(id, {
          status: 'concluido',
          data_conclusao: format(new Date(), 'yyyy-MM-dd'),
        })));
        const statusAfterRemoval = remaining.length > 0 ? 'ativa' : 'encerrada';
        await saveAllocation({ activity_ids: remaining, status: statusAfterRemoval });
        await registrarHistorico('conclusao', `${idsToConclude.length} atividade(s) concluída(s) e sincronizadas:`, idsToConclude, 'atividade');
        setActivityIds(remaining);
        addConcludedIds(idsToConclude);
        setSelectedAllocatedIds([]);
        queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] });
      }
    } catch (err) {
      console.error('[handleConcluirAlocados] error:', err.message);
    } finally {
      setIsPending(false);
    }
  };

  // ── NOTIF. CONCLUSÃO: seleciona itens livres → conclui sem alocar ──
  // (itens da seção "disponíveis" que serão marcados como concluído)
  const handleNotifConclusao = async () => {
    if (selectedFreeIds.length === 0) return;
    setIsPending(true);
    try {
      if (tipoAgenda === 'projeto_modulos') {
        await Promise.all(selectedFreeIds.map(id => base44.entities.ModuleItem.update(id, { status: 'concluido' })));
        await syncProjectAfterModuleItemChange(selectedFreeIds);
      } else if (tipoAgenda === 'atividades_avulsas') {
        await Promise.all(selectedFreeIds.map(id => base44.entities.Activity.update(id, {
          status: 'concluido',
          data_conclusao: format(new Date(), 'yyyy-MM-dd'),
        })));
        queryClient.invalidateQueries({ queryKey: ['activities-avulsas', projectId] });
      }
      await saveAllocation({ status: 'encerrada' });
      onClose();
    } catch (err) {
      console.error('[handleNotifConclusao] error:', err.message);
    } finally {
      setIsPending(false);
    }
  };

  // ── SALVAR: salva campos básicos e fecha ──
  const handleSave = async () => {
    if (tipoAgenda === 'outros' && !obs.trim()) return;
    setIsPending(true);
    try {
      await saveAllocation({});
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Excluir esta alocação?')) return;
    setIsPending(true);
    try {
      await base44.entities.Allocation.delete(allocation.id);
      queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] });
      onClose();
    } catch (err) {
      console.error('[handleDelete] error:', err.message);
    } finally {
      setIsPending(false);
    }
  };

  const hasFreeSelected = selectedFreeIds.length > 0;
  const hasAllocatedSelected = selectedAllocatedIds.length > 0;

  // excludeIds: itens que foram concluídos ou desalocados nesta sessão
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const excludeIds = [...concludedIdsRef.current, ...deallocatedIdsRef.current];

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        <div className="sr-only"><DialogHeader><DialogTitle>Editar Alocação</DialogTitle></DialogHeader></div>
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

        {/* Body: duas colunas */}
        <div className="flex min-h-[520px] max-h-[70vh] overflow-hidden">

          {/* Coluna esquerda */}
          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 border-r">
            <div className="space-y-1">
              <Label>Projeto / Cliente</Label>
              <Select value={projectId} onValueChange={(v) => { projectIdRef.current = v; setProjectId(v); setSelectedFreeIds([]); setSelectedAllocatedIds([]); }}>
                <SelectTrigger><SelectValue placeholder="Selecione um projeto" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>— Sem projeto —</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getClientLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Finalidade da Agenda</Label>
              <Select value={tipoAgenda} onValueChange={(v) => { tipoAgendaRef.current = v; setTipoAgenda(v); setSelectedFreeIds([]); setSelectedAllocatedIds([]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_AGENDA_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status de Faturamento</Label>
              <Select value={statusFaturamento} onValueChange={(v) => { statusFaturamentoRef.current = v; setStatusFaturamento(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_confirmar">A Confirmar</SelectItem>
                  <SelectItem value="faturado">Faturado</SelectItem>
                  <SelectItem value="nao_faturado">Não Faturado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tipoAgenda === 'projeto_modulos' && projectId && (
              <ProjectModulesSelector
                key={`modules-${moduleItemIdsTick}-${excludeIdsTick}`}
                projectId={projectId}
                allocatedIds={moduleItemIdsRef.current}
                excludeIds={excludeIds}
                selectedFreeIds={selectedFreeIds}
                onToggleFree={toggleFreeItem}
                selectedAllocatedIds={selectedAllocatedIds}
                onToggleAllocated={toggleAllocatedItem}
              />
            )}

            {tipoAgenda === 'atividades_avulsas' && (
              <AvulsaActivitiesSelector
                key={`activities-${activityIdsTick}-${excludeIdsTick}`}
                projectId={projectId}
                allocatedIds={activityIdsRef.current}
                excludeIds={excludeIds}
                selectedFreeIds={selectedFreeIds}
                onToggleFree={toggleFreeItem}
                selectedAllocatedIds={selectedAllocatedIds}
                onToggleAllocated={toggleAllocatedItem}
              />
            )}

            <div className="space-y-1">
              <Label>Observações {tipoAgenda === 'outros' && <span className="text-destructive">*</span>}</Label>
              <Textarea
                placeholder={tipoAgenda === 'outros' ? 'Descreva o motivo desta agenda...' : 'Ex: reunião kick-off, suporte remoto...'}
                value={obs}
                onChange={(e) => { obsRef.current = e.target.value; setObs(e.target.value); }}
                className={`h-24 resize-none text-sm ${tipoAgenda === 'outros' && !obs.trim() ? 'border-destructive' : ''}`}
              />
              {tipoAgenda === 'outros' && !obs.trim() && (
                <p className="text-xs text-destructive">Obrigatório quando a finalidade é "Outro"</p>
              )}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="w-96 flex-shrink-0 flex flex-col border-l overflow-hidden">
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
          {/* Linha de ações contextuais — aparece somente quando há seleção */}
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
                  {isPending ? '...' : `Alocar (${selectedFreeIds.length})`}
                </Button>
              )}
            </div>
          )}
          {/* Linha principal sempre visível */}
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="icon" className="text-destructive hover:text-destructive border-destructive/30"
              onClick={handleDelete} disabled={isPending}>
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}