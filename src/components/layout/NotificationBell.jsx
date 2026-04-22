import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const TIPO_COLORS = {
  item_atrasado: 'bg-red-100 text-red-700',
  go_live_bloqueado: 'bg-red-100 text-red-700',
  projeto_vermelho: 'bg-red-100 text-red-700',
  bloqueio_criado: 'bg-orange-100 text-orange-700',
  prazo_proximo: 'bg-yellow-100 text-yellow-700',
  aprovacao_pendente: 'bg-blue-100 text-blue-700',
  atividade_atribuida: 'bg-indigo-100 text-indigo-700',
  sobrecarga: 'bg-orange-100 text-orange-700',
  mudanca_status: 'bg-gray-100 text-gray-700',
  mudanca_responsavel: 'bg-gray-100 text-gray-700',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50),
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { lida: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.lida);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { lida: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter(n => !n.lida);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-80 bg-popover border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-semibold text-sm">Notificações</span>
              <div className="flex items-center gap-1">
                {unread.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => markAllReadMutation.mutate()} className="h-7 text-xs gap-1">
                    <CheckCheck className="w-3 h-3" /> Marcar todas
                  </Button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.lida) markReadMutation.mutate(n.id); }}
                    className={`p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.lida ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.lida && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.mensagem}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {n.created_date ? format(new Date(n.created_date), 'dd/MM/yyyy') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}