import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronRight, Copy, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';

export default function ModuleTemplates() {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemModuleId, setEditingItemModuleId] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  const { data: templates = [] } = useQuery({
    queryKey: ['moduleTemplates'],
    queryFn: () => base44.entities.ModuleTemplate.list('-created_date', 100),
  });

  const { data: templateModules = [] } = useQuery({
    queryKey: ['templateModules', selectedTemplate?.id],
    queryFn: () => base44.entities.TemplateModule.filter({ template_id: selectedTemplate.id }, 'ordem', 100),
    enabled: !!selectedTemplate?.id,
  });

  const { data: templateItems = [] } = useQuery({
    queryKey: ['templateModuleItems', selectedTemplate?.id],
    queryFn: () => base44.entities.TemplateModuleItem.filter({ template_id: selectedTemplate.id }, 'ordem', 500),
    enabled: !!selectedTemplate?.id,
  });

  // Template mutations
  const createTemplate = useMutation({
    mutationFn: (d) => base44.entities.ModuleTemplate.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['moduleTemplates'] }); setShowTemplateForm(false); setEditingTemplate(null); },
  });
  const updateTemplate = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModuleTemplate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['moduleTemplates'] }); setShowTemplateForm(false); setEditingTemplate(null); },
  });
  const deleteTemplate = useMutation({
    mutationFn: (id) => base44.entities.ModuleTemplate.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['moduleTemplates'] }); setSelectedTemplate(null); },
  });

  // Module mutations
  const createModule = useMutation({
    mutationFn: (d) => base44.entities.TemplateModule.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templateModules', selectedTemplate?.id] }); setShowModuleForm(false); setEditingModule(null); },
  });
  const updateModule = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TemplateModule.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templateModules', selectedTemplate?.id] }); setShowModuleForm(false); setEditingModule(null); },
  });
  const deleteModule = useMutation({
    mutationFn: (id) => base44.entities.TemplateModule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templateModules', selectedTemplate?.id] }),
  });

  // Item mutations
  const createItem = useMutation({
    mutationFn: (d) => base44.entities.TemplateModuleItem.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templateModuleItems', selectedTemplate?.id] }); setShowItemForm(false); setEditingItem(null); },
  });
  const updateItem = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TemplateModuleItem.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templateModuleItems', selectedTemplate?.id] }); setShowItemForm(false); setEditingItem(null); },
  });
  const deleteItem = useMutation({
    mutationFn: (id) => base44.entities.TemplateModuleItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templateModuleItems', selectedTemplate?.id] }),
  });

  const handleModuleDragEnd = (result) => {
    if (!result.destination) return;
    const sorted = Array.from(templateModules).sort((a, b) => a.ordem - b.ordem);
    const [moved] = sorted.splice(result.source.index, 1);
    sorted.splice(result.destination.index, 0, moved);
    sorted.forEach((m, i) => updateModule.mutate({ id: m.id, data: { ordem: i } }));
  };

  const handleItemDragEnd = (moduleId, result) => {
    if (!result.destination) return;
    const items = templateItems.filter(i => i.template_module_id === moduleId).sort((a, b) => a.ordem - b.ordem);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    items.forEach((it, i) => updateItem.mutate({ id: it.id, data: { ordem: i } }));
  };

  const toggleModule = (id) => setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));

  const sortedModules = [...templateModules].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-5">
      <PageHeader title="Templates de Módulos" description="Gerencie templates reutilizáveis de módulos e atividades para projetos">
        <Button size="sm" onClick={() => { setEditingTemplate(null); setShowTemplateForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Template
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Template list */}
        <div className="md:col-span-1 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Templates</p>
          {templates.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
              Nenhum template criado
            </div>
          )}
          {templates.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTemplate(t)}
              className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border transition-colors ${selectedTemplate?.id === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted'}`}
            >
              <LayoutTemplate className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.name}</p>
                {t.categoria && <p className="text-xs text-muted-foreground truncate">{t.categoria}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={() => { setEditingTemplate(t); setShowTemplateForm(true); }} className="p-1 hover:text-primary rounded">
                  <Pencil className="w-3 h-3" />
                </button>
                <button onClick={() => { if (confirm('Excluir este template?')) deleteTemplate.mutate(t.id); }} className="p-1 hover:text-destructive rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Module editor */}
        <div className="md:col-span-3">
          {!selectedTemplate ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl">
              <LayoutTemplate className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">Selecione um template para editar seus módulos</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedTemplate.name}</h2>
                  {selectedTemplate.descricao && <p className="text-sm text-muted-foreground">{selectedTemplate.descricao}</p>}
                </div>
                <Button size="sm" onClick={() => { setEditingModule(null); setShowModuleForm(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Módulo
                </Button>
              </div>

              <DragDropContext onDragEnd={handleModuleDragEnd}>
                <Droppable droppableId="modules">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                      {sortedModules.map((mod, idx) => {
                        const items = templateItems.filter(i => i.template_module_id === mod.id).sort((a, b) => a.ordem - b.ordem);
                        const isExpanded = expandedModules[mod.id] !== false;
                        return (
                          <Draggable key={mod.id} draggableId={mod.id} index={idx}>
                            {(prov) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} className="border border-border rounded-xl bg-card overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 bg-muted/40">
                                  <div {...prov.dragHandleProps} className="cursor-grab text-muted-foreground">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <button onClick={() => toggleModule(mod.id)} className="flex items-center gap-2 flex-1 text-left">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    <span className="font-medium text-sm">{mod.name}</span>
                                    <span className="text-xs text-muted-foreground">({items.length} itens)</span>
                                  </button>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => { setEditingModule(mod); setShowModuleForm(true); }} className="p-1 hover:text-primary rounded text-muted-foreground">
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => { if (confirm('Excluir módulo?')) deleteModule.mutate(mod.id); }} className="p-1 hover:text-destructive rounded text-muted-foreground">
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
                                            {items.map((item, iIdx) => (
                                              <Draggable key={item.id} draggableId={item.id} index={iIdx}>
                                                {(pI) => (
                                                  <div ref={pI.innerRef} {...pI.draggableProps} className="flex items-center gap-2 px-3 py-2 bg-background rounded-lg border border-border text-sm">
                                                    <div {...pI.dragHandleProps} className="cursor-grab text-muted-foreground">
                                                      <GripVertical className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="flex-1 min-w-0 truncate">{item.name}</span>
                                                    {item.horas_necessarias > 0 && (
                                                      <span className="text-xs text-muted-foreground flex-shrink-0">{item.horas_necessarias}h</span>
                                                    )}
                                                    <div className="flex gap-1 flex-shrink-0">
                                                      <button onClick={() => { setEditingItem(item); setEditingItemModuleId(mod.id); setShowItemForm(true); }} className="p-1 hover:text-primary rounded text-muted-foreground">
                                                        <Pencil className="w-3 h-3" />
                                                      </button>
                                                      <button onClick={() => { if (confirm('Excluir item?')) deleteItem.mutate(item.id); }} className="p-1 hover:text-destructive rounded text-muted-foreground">
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {pItem.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </DragDropContext>
                                    <Button variant="ghost" size="sm" className="mt-2 text-xs h-7" onClick={() => { setEditingItem(null); setEditingItemModuleId(mod.id); setShowItemForm(true); }}>
                                      <Plus className="w-3 h-3 mr-1" /> Adicionar Item
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

              {sortedModules.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
                  Nenhum módulo adicionado. Clique em "+ Módulo" para começar.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Template Form Dialog */}
      <TemplateFormDialog
        open={showTemplateForm}
        onClose={() => { setShowTemplateForm(false); setEditingTemplate(null); }}
        initial={editingTemplate}
        onSubmit={(data) => {
          if (editingTemplate) updateTemplate.mutate({ id: editingTemplate.id, data });
          else createTemplate.mutate(data);
        }}
      />

      {/* Module Form Dialog */}
      <ModuleFormDialog
        open={showModuleForm}
        onClose={() => { setShowModuleForm(false); setEditingModule(null); }}
        initial={editingModule}
        onSubmit={(data) => {
          if (editingModule) updateModule.mutate({ id: editingModule.id, data });
          else createModule.mutate({ ...data, template_id: selectedTemplate.id, ordem: templateModules.length });
        }}
      />

      {/* Item Form Dialog */}
      <ItemFormDialog
        open={showItemForm}
        onClose={() => { setShowItemForm(false); setEditingItem(null); }}
        initial={editingItem}
        onSubmit={(data) => {
          const items = templateItems.filter(i => i.template_module_id === editingItemModuleId);
          if (editingItem) updateItem.mutate({ id: editingItem.id, data });
          else createItem.mutate({ ...data, template_module_id: editingItemModuleId, template_id: selectedTemplate.id, ordem: items.length });
        }}
      />
    </div>
  );
}

function TemplateFormDialog({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState({ name: '', descricao: '', categoria: '' });
  useEffect(() => {
    setForm({ name: initial?.name || '', descricao: initial?.descricao || '', categoria: initial?.categoria || '' });
  }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? 'Editar Template' : 'Novo Template'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Categoria</Label><Input value={form.categoria} onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))} placeholder="Ex: Financeiro, RH..." /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { if (form.name) onSubmit(form); }} disabled={!form.name}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModuleFormDialog({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState({ name: '', descricao: '' });
  useEffect(() => {
    setForm({ name: initial?.name || '', descricao: initial?.descricao || '' });
  }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? 'Editar Módulo' : 'Novo Módulo'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { if (form.name) onSubmit(form); }} disabled={!form.name}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ItemFormDialog({ open, onClose, initial, onSubmit }) {
  const [form, setForm] = useState({ name: '', descricao: '', horas_necessarias: 0, horas_detalhadas: '', responsavel: '' });
  useEffect(() => {
    setForm({
      name: initial?.name || '',
      descricao: initial?.descricao || '',
      horas_necessarias: initial?.horas_necessarias || 0,
      horas_detalhadas: initial?.horas_detalhadas || '',
      responsavel: initial?.responsavel || '',
    });
  }, [initial, open]);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial ? 'Editar Item' : 'Novo Item'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Horas Necessárias</Label><Input type="number" value={form.horas_necessarias} onChange={e => setForm(p => ({ ...p, horas_necessarias: Number(e.target.value) }))} /></div>
            <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
          </div>
          <div><Label>Horas Detalhadas (observações)</Label><Textarea value={form.horas_detalhadas} onChange={e => setForm(p => ({ ...p, horas_detalhadas: e.target.value }))} rows={2} placeholder="Detalhamento ou observações sobre as horas..." /></div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { if (form.name) onSubmit(form); }} disabled={!form.name}>Salvar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}