import { useState, useEffect } from 'react';
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
import { ChevronDown, ChevronRight, Layers, ListChecks } from 'lucide-react';

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
        <span className="text-xs font-medium text-muted-foreground">Disponíveis para alocar</span>
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
                    <div key={item.id} className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-muted/20 cursor-pointer" onClick={() => onToggle(item.id)}>
                      <Checkbox checked={selectedItems.includes(item.id)} onCheckedChange={() => {}} className="mt-0.5 pointer-events-none" />
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
    </div>
  );
}

/* ── Atividades avulsas em aberto ── */
function AvulsaActivitiesSelector({ projectId, selectedIds, onToggle }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities-avulsas', projectId],
    queryFn: () =>
      projectId
        ? base44.entities.Activity.filter({ project_id: projectId }, '-created_date', 500)
        : Promise.resolve([]),
    enabled: !!projectId,
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
        <span className="text-xs font-medium text-muted-foreground">Disponíveis para alocar</span>
      </div>
      <div className="max-h-48 overflow-y-auto divide-y">
        {open.map(a => (
          <div key={a.id} className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-muted/20 cursor-pointer" onClick={() => onToggle(a.id)}>
            <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => {}} className="mt-0.5 pointer-events-none" />
            <span className="text-xs leading-tight">{a.titulo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Painel direito simples (sem allocation ainda) ── */
function NewAllocationNotes({ note, onNoteChange }) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs font-medium">Anotação inicial (opcional)</Label>
        <Textarea
          placeholder="Registre uma observação para esta agenda..."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          className="h-32 text-sm resize-none"
        />
      </div>
      <p className="text-xs text-muted-foreground">Após criar a agenda, você poderá adicionar mais acompanhamentos no histórico.</p>
    </div>
  );
}

/* ── Dialog principal ── */
export default function AllocationCellDialog({ cell, projects, clients, onClose, onSaved }) {
  const { consultant, date, turno } = cell;
  const queryClient = useQueryClient();

  const [projectId, setProjectId] = useState('');
  const [tipoAgenda, setTipoAgenda] = useState('projeto_modulos');
  const [statusFaturamento, setStatusFaturamento] = useState('a_confirmar');
  const [obs, setObs] = useState('');
  const [nota, setNota] = useState('');
  const [selectedModuleItemIds, setSelectedModuleItemIds] = useState([]);
  const [selectedActivityIds, setSelectedActivityIds] = useState([]);
  const [rightTab, setRightTab] = useState('anotacoes');

  useEffect(() => { setSelectedModuleItemIds([]); setSelectedActivityIds([]); }, [projectId, tipoAgenda]);

  const getClientLabel = (p) => {
    const c = clients.find(x => x.id === p.client_id);
    return c ? `${c.nome_fantasia || c.razao_social} — ${p.name}` : p.name;
  };

  const toggleModuleItem = (id) =>
    setSelectedModuleItemIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleActivity = (id) =>
    setSelectedActivityIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const allocation = await base44.entities.Allocation.create(data);
      // Se há nota inicial, salva como acompanhamento
      if (nota.trim()) {
        await base44.entities.AllocationHistory.create({
          allocation_id: allocation.id,
          tipo: 'acompanhamento',
          descricao: nota.trim(),
        });
      }
      return allocation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations-schedule'] });
      onSaved();
    },
  });

  const handleSave = () => {
    if (tipoAgenda === 'outros' && !obs.trim()) return;
    const selectedProject = projects.find(p => p.id === projectId);
    createMutation.mutate({
      consultant_id: consultant.id,
      company_id: consultant.company_id || undefined,
      project_id: projectId || undefined,
      client_id: selectedProject?.client_id || undefined,
      data: format(date, 'yyyy-MM-dd'),
      periodo_do_dia: turno,
      tipo_agenda: tipoAgenda,
      status_faturamento: statusFaturamento,
      status: 'ativa',
      observacoes: obs,
      module_item_ids: tipoAgenda === 'projeto_modulos' ? selectedModuleItemIds : [],
      activity_ids: tipoAgenda === 'atividades_avulsas' ? selectedActivityIds : [],
    });
  };

  const allocationDate = new Date(format(date, 'yyyy-MM-dd') + 'T12:00:00');
  const isPending = createMutation.isPending;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        <div className="sr-only"><DialogHeader><DialogTitle>Nova Alocação</DialogTitle></DialogHeader></div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b">
          <div>
            <h2 className="text-base font-semibold">Nova Alocação</h2>
            <div className="space-y-0.5 text-sm text-muted-foreground mt-0.5">
              <p><span className="font-medium text-foreground">{consultant.name}</span></p>
              <p>{format(allocationDate, "EEEE, dd/MM/yyyy", { locale: ptBR })} — {TURNO_LABELS[turno]}</p>
            </div>
          </div>
        </div>

        {/* Body: duas colunas */}
        <div className="flex min-h-[480px] max-h-[70vh] overflow-hidden">

          {/* Coluna esquerda */}
          <div className="flex-1 px-6 py-4 overflow-y-auto space-y-4 border-r">
            <div className="space-y-1">
              <Label>Projeto / Cliente</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger><SelectValue placeholder="Selecione um projeto (opcional)" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{getClientLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Finalidade da Agenda</Label>
              <Select value={tipoAgenda} onValueChange={setTipoAgenda}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_AGENDA_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-1">
              <Label>Observações {tipoAgenda === 'outros' && <span className="text-destructive">*</span>}</Label>
              <Textarea
                placeholder={tipoAgenda === 'outros' ? 'Descreva o motivo desta agenda...' : 'Ex: reunião kick-off, suporte remoto...'}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                className={`h-20 resize-none text-sm ${tipoAgenda === 'outros' && !obs.trim() ? 'border-destructive' : ''}`}
              />
              {tipoAgenda === 'outros' && !obs.trim() && (
                <p className="text-xs text-destructive">Obrigatório quando a finalidade é "Outro"</p>
              )}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden">
            <div className="flex gap-1 px-4 py-2.5 border-b bg-muted/20">
              <button
                onClick={() => setRightTab('anotacoes')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${rightTab === 'anotacoes' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                Anotações
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <NewAllocationNotes note={nota} onNoteChange={setNota} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave} disabled={isPending}>
            {isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}