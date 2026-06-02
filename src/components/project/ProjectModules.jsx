import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { updateProjectMetrics } from '@/utils/projectMetrics';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, LayoutTemplate, CheckCircle2, Circle, AlertCircle, XCircle, Copy, MoreHorizontal } from 'lucide-react';
import ModuleItemSubItems from './ModuleItemSubItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const STATUS_CONFIG = {
  nao_iniciado: { label: 'Não Iniciado', color: 'bg-gray-100 text-gray-600', icon: Circle },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function ProjectModules({ projectId, project }) {
  const queryClient = useQueryClient();
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemModuleId, setEditingItemModuleId] = useState(null);
  const [showLoadTemplate, setShowLoadTemplate] = useState(false);

  const { data: modules = [] } = useQuery({
    queryKey: ['projectModules', projectId],
    queryFn: () => base44.entities.ProjectModule.filter({ project_id: projectId }, 'ordem', 200),
  });

  const { data: items = [] } = useQuery({
    queryKey: ['moduleItems', projectId],
    queryFn: () => base44.entities.ModuleItem.filter({ project_id: projectId }, 'ordem', 500),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['moduleTemplates'],
    queryFn: () => base44.entities.ModuleTemplate.list('-created_date', 100),
  });

  const { data: templateModules = [] } = useQuery({
    queryKey: ['allTemplateModules'],
    queryFn: () => base44.entities.TemplateModule.list('ordem', 500),
  });

  const { data: templateItems = [] } = useQuery({
    queryKey: ['allTemplateModuleItems'],
    queryFn: () => base44.entities.TemplateModuleItem.list('ordem', 1000),
  });

  const { data: allSubItems = [] } = useQuery({
    queryKey: ['allModuleSubItems', projectId],
    queryFn: () => base44.entities.ModuleSubItem.filter({ project_id: projectId }, 'ordem', 2000),
  });

  // Module mutations
  const createModule = useMutation({
    mutationFn: (d) => base44.entities.ProjectModule.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] }); setShowModuleForm(false); setEditingModule(null); },
  });
  const updateModule = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ProjectModule.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] }),
  });
  const deleteModule = useMutation({
    mutationFn: (id) => base44.entities.ProjectModule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] }),
  });

  // Item mutations
   const createItem = useMutation({
     mutationFn: (d) => base44.entities.ModuleItem.create(d),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
       updateProjectMetrics(projectId);
       setShowItemForm(false);
       setEditingItem(null);
     },
   });
   const updateItem = useMutation({
     mutationFn: ({ id, data }) => base44.entities.ModuleItem.update(id, data),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
       updateProjectMetrics(projectId);
     },
   });
   const deleteItem = useMutation({
     mutationFn: (id) => base44.entities.ModuleItem.delete(id),
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
       updateProjectMetrics(projectId);
     },
   });

  const duplicateItem = useMutation({
    mutationFn: async (item) => {
      const modItems = items.filter(i => i.project_module_id === item.project_module_id);
      return base44.entities.ModuleItem.create({
        project_module_id: item.project_module_id,
        project_id: projectId,
        name: `${item.name} (cópia)`,
        descricao: item.descricao,
        horas_necessarias: item.horas_necessarias,
        horas_detalhadas: item.horas_detalhadas,
        responsavel: item.responsavel,
        status: 'nao_iniciado',
        ordem: modItems.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
      updateProjectMetrics(projectId);
    },
  });

  const handleModuleDragEnd = (result) => {
    if (!result.destination) return;
    const sorted = [...modules].sort((a, b) => a.ordem - b.ordem);
    const [moved] = sorted.splice(result.source.index, 1);
    sorted.splice(result.destination.index, 0, moved);
    sorted.forEach((m, i) => { if (m.ordem !== i) updateModule.mutate({ id: m.id, data: { ordem: i } }); });
  };

  const handleItemDragEnd = (moduleId, result) => {
    if (!result.destination) return;
    const its = items.filter(i => i.project_module_id === moduleId).sort((a, b) => a.ordem - b.ordem);
    const [moved] = its.splice(result.source.index, 1);
    its.splice(result.destination.index, 0, moved);
    its.forEach((it, i) => { if (it.ordem !== i) updateItem.mutate({ id: it.id, data: { ordem: i } }); });
  };

  const loadFromTemplate = async (templateId) => {
    const tMods = templateModules.filter(m => m.template_id === templateId).sort((a, b) => a.ordem - b.ordem);
    const baseOrdem = modules.length;
    for (let i = 0; i < tMods.length; i++) {
      const mod = tMods[i];
      const created = await base44.entities.ProjectModule.create({
        project_id: projectId, name: mod.name, descricao: mod.descricao,
        template_module_id: mod.id, status: 'nao_iniciado', ordem: baseOrdem + i,
      });
      const tItems = templateItems.filter(it => it.template_module_id === mod.id).sort((a, b) => a.ordem - b.ordem);
      for (let j = 0; j < tItems.length; j++) {
        const it = tItems[j];
        await base44.entities.ModuleItem.create({
          project_id: projectId, project_module_id: created.id, name: it.name,
          descricao: it.descricao, horas_necessarias: it.horas_necessarias,
          horas_detalhadas: it.horas_detalhadas, responsavel: it.responsavel,
          template_item_id: it.id, status: 'nao_iniciado', ordem: j,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] });
    queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
    await updateProjectMetrics(projectId);
    setShowLoadTemplate(false);
    };

  const sortedModules = [...modules].sort((a, b) => a.ordem - b.ordem);

  // Update project metrics on load or when items change
  useEffect(() => {
    updateProjectMetrics(projectId);
  }, [projectId, items]);

  // Progress based on sub-items if available, otherwise on item status
  const getItemProgress = (itemId) => {
    const subs = allSubItems.filter(s => s.module_item_id === itemId);
    if (!subs.length) return null; // no sub-items
    const done = subs.filter(s => s.concluido).length;
    return { done, total: subs.length, pct: Math.round((done / subs.length) * 100) };
  };

  const getModuleProgress = (moduleId) => {
    const mItems = items.filter(i => i.project_module_id === moduleId);
    if (!mItems.length) return 0;
    // Use sub-item based progress if available, otherwise item status
    let totalPct = 0;
    mItems.forEach(item => {
      const ip = getItemProgress(item.id);
      if (ip) totalPct += ip.pct;
      else totalPct += item.status === 'concluido' ? 100 : 0;
    });
    return Math.round(totalPct / mItems.length);
  };

  const getProjectProgress = () => {
    if (!allSubItems.length && !items.length) return 0;
    let totalPct = 0;
    const moduleIds2 = new Set(modules.map(m => m.id));
    const validItemsList = items.filter(i => moduleIds2.has(i.project_module_id));
    if (!validItemsList.length) return 0;
    validItemsList.forEach(item => {
      const ip = getItemProgress(item.id);
      if (ip) totalPct += ip.pct;
      else totalPct += item.status === 'concluido' ? 100 : 0;
    });
    return Math.round(totalPct / validItemsList.length);
  };

  // Only count items that belong to existing modules (avoid orphan items)
   const moduleIds = new Set(modules.map(m => m.id));
   const validItems = items.filter(i => moduleIds.has(i.project_module_id));
   const totalHoras = validItems.reduce((s, i) => s + (i.horas_necessarias || 0), 0);
   const horasRealizadas = validItems
     .filter(i => i.status === 'concluido')
     .reduce((s, i) => s + (i.horas_necessarias || 0), 0);
   const projectProgress = getProjectProgress();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {modules.length} módulos · {validItems.length} atividades · {totalHoras}h previstas · {horasRealizadas}h realizadas
            </p>
          </div>
          {validItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Progress value={project?.percentual_progresso || 0} className="w-24 h-1.5" />
              <span className="text-xs text-muted-foreground">{project?.percentual_progresso || 0}% do projeto</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLoadTemplate(true)}>
            <LayoutTemplate className="w-4 h-4 mr-1" /> Carregar Template
          </Button>
          <Button size="sm" onClick={() => { setEditingModule(null); setShowModuleForm(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Módulo
          </Button>
        </div>
      </div>

      {/* Module list */}
      {sortedModules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border border-dashed rounded-xl">
          <LayoutTemplate className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum módulo adicionado</p>
          <p className="text-xs mt-1">Crie módulos manualmente ou carregue um template</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleModuleDragEnd}>
          <Droppable droppableId="project-modules">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {sortedModules.map((mod, idx) => {
                  const modItems = items.filter(i => i.project_module_id === mod.id).sort((a, b) => a.ordem - b.ordem);
                  const isExpanded = expandedModules[mod.id] !== false;
                  const progress = getModuleProgress(mod.id);
                  const statusCfg = STATUS_CONFIG[mod.status] || STATUS_CONFIG.nao_iniciado;
                  return (
                    <Draggable key={mod.id} draggableId={mod.id} index={idx}>
                      {(prov) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} className="border border-border rounded-xl bg-card overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
                            <div {...prov.dragHandleProps} className="cursor-grab text-muted-foreground">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button onClick={() => setExpandedModules(p => ({ ...p, [mod.id]: !isExpanded }))} className="flex items-center gap-2 flex-1 text-left min-w-0">
                              {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                              <span className="font-medium text-sm truncate">{mod.name}</span>
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {modItems.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Progress value={progress} className="w-16 h-1.5" />
                                  <span className="text-xs text-muted-foreground">{progress}%</span>
                                </div>
                              )}
                              <Select value={mod.status} onValueChange={(v) => updateModule.mutate({ id: mod.id, data: { status: v } })}>
                                <SelectTrigger className="h-6 text-xs border-0 bg-transparent px-2 w-auto">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                                    <SelectItem key={v} value={v}><span className={`px-2 py-0.5 rounded-full text-xs ${c.color}`}>{c.label}</span></SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button onClick={() => { setEditingModule(mod); setShowModuleForm(true); }} className="p-1 hover:text-primary rounded text-muted-foreground">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { if (confirm('Excluir módulo e todos seus itens?')) deleteModule.mutate(mod.id); }} className="p-1 hover:text-destructive rounded text-muted-foreground">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-4 pb-3 pt-2">
                              <DragDropContext onDragEnd={(r) => handleItemDragEnd(mod.id, r)}>
                                <Droppable droppableId={`items-${mod.id}`}>
                                  {(pItem) => (
                                    <div {...pItem.droppableProps} ref={pItem.innerRef} className="space-y-1.5">
                                      {modItems.map((item, iIdx) => {
                                        const iStatus = STATUS_CONFIG[item.status] || STATUS_CONFIG.nao_iniciado;
                                        return (
                                          <Draggable key={item.id} draggableId={item.id} index={iIdx}>
                                           {(pI) => {
                                             const itemProg = getItemProgress(item.id);
                                             return (
                                               <div ref={pI.innerRef} {...pI.draggableProps} className="px-3 py-2 bg-background rounded-lg border border-border text-sm group">
                                                 <div className="flex items-center gap-2">
                                                   <div {...pI.dragHandleProps} className="cursor-grab text-muted-foreground">
                                                     <GripVertical className="w-3.5 h-3.5" />
                                                   </div>
                                                   <Select value={item.status} onValueChange={(v) => updateItem.mutate({ id: item.id, data: { status: v } })}>
                                                     <SelectTrigger className="h-5 w-5 border-0 bg-transparent p-0 flex-shrink-0">
                                                       <iStatus.icon className={`w-4 h-4 ${item.status === 'concluido' ? 'text-green-600' : item.status === 'em_andamento' ? 'text-blue-600' : 'text-gray-400'}`} />
                                                     </SelectTrigger>
                                                     <SelectContent>
                                                       {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                                                         <SelectItem key={v} value={v}><span className={`px-2 py-0.5 rounded-full text-xs ${c.color}`}>{c.label}</span></SelectItem>
                                                       ))}
                                                     </SelectContent>
                                                   </Select>
                                                   <span className={`flex-1 min-w-0 truncate ${item.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                                                   {itemProg && (
                                                     <div className="flex items-center gap-1 flex-shrink-0">
                                                       <Progress value={itemProg.pct} className="w-12 h-1" />
                                                       <span className="text-xs text-muted-foreground">{itemProg.pct}%</span>
                                                     </div>
                                                   )}
                                                   {item.responsavel && <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">{item.responsavel}</span>}
                                                   {item.horas_necessarias > 0 && <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{item.horas_necessarias}h</span>}
                                                   <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <DropdownMenu>
                                                       <DropdownMenuTrigger asChild>
                                                         <button className="p-1 hover:text-foreground rounded text-muted-foreground">
                                                           <MoreHorizontal className="w-3.5 h-3.5" />
                                                         </button>
                                                       </DropdownMenuTrigger>
                                                       <DropdownMenuContent align="end" className="w-40">
                                                         <DropdownMenuItem onClick={() => { setEditingItem(item); setEditingItemModuleId(mod.id); setShowItemForm(true); }}>
                                                           <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                                                         </DropdownMenuItem>
                                                         <DropdownMenuItem onClick={() => duplicateItem.mutate(item)}>
                                                           <Copy className="w-3.5 h-3.5 mr-2" /> Replicar
                                                         </DropdownMenuItem>
                                                         <DropdownMenuSeparator />
                                                         <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (confirm('Excluir item?')) deleteItem.mutate(item.id); }}>
                                                           <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                                                         </DropdownMenuItem>
                                                       </DropdownMenuContent>
                                                     </DropdownMenu>
                                                   </div>
                                                 </div>
                                                 <ModuleItemSubItems item={item} projectId={projectId} />
                                               </div>
                                             );
                                           }}
                                          </Draggable>
                                        );
                                      })}
                                      {pItem.placeholder}
                                    </div>
                                  )}
                                </Droppable>
                              </DragDropContext>
                              <Button variant="ghost" size="sm" className="mt-2 text-xs h-7" onClick={() => { setEditingItem(null); setEditingItemModuleId(mod.id); setShowItemForm(true); }}>
                                <Plus className="w-3 h-3 mr-1" /> Adicionar Atividade
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Load Template Dialog */}
      <Dialog open={showLoadTemplate} onOpenChange={setShowLoadTemplate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Carregar Template</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Selecione um template para adicionar seus módulos e atividades ao projeto:</p>
            {templates.length === 0 ? (
              <p className="text-sm text-center py-6 text-muted-foreground">Nenhum template disponível. Crie templates em "Templates de Módulos".</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {templates.map(t => (
                  <button key={t.id} onClick={() => loadFromTemplate(t.id)} className="w-full text-left p-3 border rounded-lg hover:bg-muted transition-colors">
                    <p className="font-medium text-sm">{t.name}</p>
                    {t.categoria && <p className="text-xs text-muted-foreground">{t.categoria}</p>}
                    {t.descricao && <p className="text-xs text-muted-foreground mt-0.5">{t.descricao}</p>}
                    <p className="text-xs text-primary mt-1">{templateModules.filter(m => m.template_id === t.id).length} módulos</p>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setShowLoadTemplate(false)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Form Dialog */}
      <ModuleFormDialog
        open={showModuleForm}
        onClose={() => { setShowModuleForm(false); setEditingModule(null); }}
        initial={editingModule}
        onSubmit={(data) => {
          if (editingModule) updateModule.mutate({ id: editingModule.id, data });
          else createModule.mutate({ ...data, project_id: projectId, ordem: modules.length });
        }}
      />

      {/* Item Form Dialog */}
      <ItemFormDialog
        open={showItemForm}
        onClose={() => { setShowItemForm(false); setEditingItem(null); }}
        initial={editingItem}
        onSubmit={(data) => {
          const modItems = items.filter(i => i.project_module_id === editingItemModuleId);
          if (editingItem) updateItem.mutate({ id: editingItem.id, data });
          else createItem.mutate({ ...data, project_module_id: editingItemModuleId, project_id: projectId, ordem: modItems.length });
        }}
      />
    </div>
  );
}

function ModuleFormDialog({ open, onClose, initial, onSubmit }) {
   const [form, setForm] = useState({ name: '', descricao: '', status: 'nao_iniciado' });
   useEffect(() => {
     setForm({ name: initial?.name || '', descricao: initial?.descricao || '', status: initial?.status || 'nao_iniciado' });
   }, [initial, open]);
   return (
     <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
       <DialogContent>
         <DialogHeader><DialogTitle>{initial ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle></DialogHeader>
         <div className="space-y-3">
           <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
           <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
           <div>
             <Label>Status</Label>
             <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
               <SelectTrigger><SelectValue /></SelectTrigger>
               <SelectContent>
                 {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                   <SelectItem key={v} value={v}>{c.label}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
           <div className="flex gap-2 justify-end pt-2">
             <Button variant="outline" onClick={onClose}>Cancelar</Button>
             <Button onClick={() => { if (form.name) { onSubmit(form); onClose(); } }} disabled={!form.name}>Salvar</Button>
           </div>
         </div>
       </DialogContent>
     </Dialog>
   );
}

function ItemFormDialog({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState({ name: '', descricao: '', horas_necessarias: 0, horas_detalhadas: '', responsavel: '', status: 'nao_iniciado' });
  useEffect(() => {
    setForm({
      name: initial?.name || '', descricao: initial?.descricao || '',
      horas_necessarias: initial?.horas_necessarias || 0, horas_detalhadas: initial?.horas_detalhadas || '',
      responsavel: initial?.responsavel || '', status: initial?.status || 'nao_iniciado',
    });
  }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Horas Necessárias</Label><Input type="number" value={form.horas_necessarias} onChange={e => setForm(p => ({ ...p, horas_necessarias: Number(e.target.value) }))} /></div>
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm(p => ({ ...p, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([v, c]) => (
                  <SelectItem key={v} value={v}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Horas Detalhadas (observações)</Label><Textarea value={form.horas_detalhadas} onChange={e => setForm(p => ({ ...p, horas_detalhadas: e.target.value }))} rows={2} placeholder="Detalhamento ou observações sobre as horas..." /></div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { if (form.name) { onSubmit(form); onClose(); } }} disabled={!form.name}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}