import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TemplateItemSubItems({ item }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { data: subItems = [] } = useQuery({
    queryKey: ['templateSubItems', item.id],
    queryFn: () => base44.entities.TemplateModuleSubItem.filter({ template_module_item_id: item.id }, 'ordem', 200),
    staleTime: 15_000,
  });

  const createSub = useMutation({
    mutationFn: (d) => base44.entities.TemplateModuleSubItem.create(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templateSubItems', item.id] });
      setNewName('');
      setShowInput(false);
    },
  });

  const deleteSub = useMutation({
    mutationFn: (id) => base44.entities.TemplateModuleSubItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templateSubItems', item.id] }),
  });

  const handleAdd = () => {
    if (!newName.trim()) return;
    createSub.mutate({
      template_module_item_id: item.id,
      template_module_id: item.template_module_id,
      template_id: item.template_id,
      name: newName.trim(),
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
        <span>{subItems.length > 0 ? `${subItems.length} sub-item(s)` : 'Sub-itens'}</span>
      </button>

      {expanded && (
        <div className="mt-2 ml-2 pl-3 border-l-2 border-border space-y-1">
          {subItems.map(sub => (
            <div key={sub.id} className="flex items-center gap-2 group py-0.5">
              <span className="text-xs flex-1">{sub.name}</span>
              <button
                onClick={() => deleteSub.mutate(sub.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {showInput ? (
            <div className="flex items-center gap-1 pt-1">
              <Input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setShowInput(false); setNewName(''); }
                }}
                placeholder="Nome do sub-item..."
                className="h-6 text-xs"
              />
              <Button size="sm" className="h-6 text-xs px-2" onClick={handleAdd} disabled={!newName.trim()}>OK</Button>
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