import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';

const TURNO_LABELS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' };

function ProjectActivitiesSelector({ projectId, selectedItems, onToggle }) {
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

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  if (!projectId) return null;

  const modulesWithItems = modules.filter(m =>
    pendingItems.some(i => i.project_module_id === m.id)
  );

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
          const isExpanded = expandedModules[mod.id] !== false; // default expanded
          return (
            <div key={mod.id}>
              <button
                type="button"
                onClick={() => toggleModule(mod.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                <span className="text-xs font-medium">{mod.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{modItems.length}</span>
              </button>
              {isExpanded && (
                <div className="pb-1">
                  {modItems.map(item => (
                    <label
                      key={item.id}
                      className="flex items-start gap-2.5 px-5 py-1.5 hover:bg-muted/20 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => onToggle(item.id)}
                        className="mt-0.5"
                      />
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

export default function AllocationCellDialog({ cell, projects, clients, onClose, onSaved }) {
  const { consultant, date, turno } = cell;

  const [projectId, setProjectId] = useState('');
  const [statusFaturamento, setStatusFaturamento] = useState('a_confirmar');
  const [obs, setObs] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  // Reset selected items when project changes
  useEffect(() => { setSelectedItemIds([]); }, [projectId]);

  const getClientName = (project) => {
    const c = clients.find((x) => x.id === project.client_id);
    return c ? c.nome_fantasia || c.razao_social : project.name;
  };

  const toggleItem = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const updateItemsMutation = useMutation({
    mutationFn: (ids) =>
      Promise.all(ids.map(id => base44.entities.ModuleItem.update(id, { status: 'concluido' }))),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Allocation.create(data),
    onSuccess: async (allocation) => {
      // If status is 'concluida' and there are selected items, mark them as done
      if (selectedItemIds.length > 0 && allocation.status === 'encerrada') {
        await updateItemsMutation.mutateAsync(selectedItemIds);
      }
      onSaved();
    },
  });

  const handleSave = (concludeAndSync = false) => {
    const selectedProject = projects.find((p) => p.id === projectId);
    createMutation.mutate({
      consultant_id: consultant.id,
      company_id: consultant.company_id || undefined,
      project_id: projectId || undefined,
      client_id: selectedProject?.client_id || undefined,
      data: format(date, 'yyyy-MM-dd'),
      periodo_do_dia: turno,
      status_faturamento: statusFaturamento,
      status: concludeAndSync ? 'encerrada' : 'ativa',
      observacoes: obs,
    });
  };

  const hasSelectedItems = selectedItemIds.length > 0;

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

          {projectId && (
            <ProjectActivitiesSelector
              projectId={projectId}
              selectedItems={selectedItemIds}
              onToggle={toggleItem}
            />
          )}

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

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {hasSelectedItems && (
            <Button
              className="w-full"
              onClick={() => handleSave(true)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Salvando...' : `Concluir e sincronizar (${selectedItemIds.length} atividade${selectedItemIds.length > 1 ? 's' : ''})`}
            </Button>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button variant={hasSelectedItems ? 'secondary' : 'default'} className="flex-1" onClick={() => handleSave(false)} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}