import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronDown, ChevronRight, Circle, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateItemStatusFromSubItems, revertItemStatusIfNeeded } from '@/utils/statusAutomation';
import { updateProjectMetrics } from '@/utils/projectMetrics';

const SUB_STATUS_CONFIG = {
  nao_iniciado:          { label: 'Não Iniciado',          icon: Circle,        color: 'text-gray-400' },
  em_andamento:          { label: 'Em Andamento',          icon: Loader2,       color: 'text-blue-500' },
  aguardando_confirmacao:{ label: 'Aguard. Confirmação',   icon: Clock,         color: 'text-yellow-500' },
  concluido:             { label: 'Concluído',             icon: CheckCircle2,  color: 'text-green-600' },
  cancelado:             { label: 'Cancelado',             icon: XCircle,       color: 'text-red-500' },
};

export default function ModuleItemSubItems({ item, projectId }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { data: subItems = [] } = useQuery({
    queryKey: ['moduleSubItems', item.id],
    queryFn: () => base44.entities.ModuleSubItem.filter({ module_item_id: item.id }, 'ordem', 200),
    staleTime: 15_000,
  });

  const createSub = useMutation({
    mutationFn: (d) => base44.entities.ModuleSubItem.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleSubItems', item.id] });
      queryClient.invalidateQueries({ queryKey: ['allModuleSubItems', projectId] });
      setNewName('');
      setShowInput(false);
    },
  });

  const updateSub = useMutation({
    mutationFn: async ({ id, data }) => {
      await base44.entities.ModuleSubItem.update(id, data);
      await updateItemStatusFromSubItems(item.id, projectId);
      await updateProjectMetrics(projectId, queryClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleSubItems', item.id] });
      queryClient.invalidateQueries({ queryKey: ['allModuleSubItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] });
    },
  });

  const deleteSub = useMutation({
    mutationFn: async (id) => {
      await base44.entities.ModuleSubItem.delete(id);
      await revertItemStatusIfNeeded(item.id);
      await updateProjectMetrics(projectId, queryClient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['moduleSubItems', item.id] });
      queryClient.invalidateQueries({ queryKey: ['allModuleSubItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['moduleItems', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectModules', projectId] });
    },
  });

  const concluded = subItems.filter(s => s.status === 'concluido').length;
  const total = subItems.length;
  const progress = total > 0 ? Math.round((concluded / total) * 100) : 0;

  const handleAddSub = () => {
    if (!newName.trim()) return;
    createSub.mutate({
      module_item_id: item.id,
      project_module_id: item.project_module_id,
      project_id: projectId,
      name: newName.trim(),
      status: 'nao_iniciado',
      ordem: subItems.length,
    });
  };

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
      >
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {total > 0 ? (
          <span>{concluded}/{total} concluídos</span>
        ) : (
          <span>Sub-itens</span>
        )}
        {total > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <Progress value={progress} className="w-12 h-1" />
            <span>{progress}%</span>
          </div>
        )}
      </button>

      {expanded && (
        <div className="mt-2 ml-2 pl-3 border-l-2 border-border space-y-1">
          {subItems.map(sub => {
            const cfg = SUB_STATUS_CONFIG[sub.status] || SUB_STATUS_CONFIG.nao_iniciado;
            const Icon = cfg.icon;
            return (
              <div key={sub.id} className="flex items-center gap-2 group py-0.5">
                <Select
                  value={sub.status || 'nao_iniciado'}
                  onValueChange={(v) => updateSub.mutate({ id: sub.id, data: { status: v } })}
                >
                  <SelectTrigger className="h-5 w-5 border-0 bg-transparent p-0 flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUB_STATUS_CONFIG).map(([v, c]) => {
                      const CIcon = c.icon;
                      return (
                        <SelectItem key={v} value={v}>
                          <span className="flex items-center gap-2">
                            <CIcon className={`w-3.5 h-3.5 ${c.color}`} />
                            {c.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <span className={`text-xs flex-1 ${sub.status === 'concluido' ? 'line-through text-muted-foreground' : ''}`}>
                  {sub.name}
                </span>
                <button
                  onClick={() => deleteSub.mutate(sub.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {showInput ? (
            <div className="flex items-center gap-1 pt-1">
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSub(); if (e.key === 'Escape') { setShowInput(false); setNewName(''); } }}
                placeholder="Nome do sub-item..."
                className="h-6 text-xs"
              />
              <Button size="sm" className="h-6 text-xs px-2" onClick={handleAddSub} disabled={!newName.trim()}>OK</Button>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setShowInput(false); setNewName(''); }}>✕</Button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors pt-1"
            >
              <Plus className="w-3 h-3" /> Adicionar sub-item
            </button>
          )}
        </div>
      )}
    </div>
  );
}