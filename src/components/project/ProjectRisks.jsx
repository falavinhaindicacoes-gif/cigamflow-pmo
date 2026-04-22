import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShieldAlert, Plus, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CRITICIDADE_COLORS = {
  baixa: 'bg-gray-100 text-gray-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
  urgente: 'bg-red-100 text-red-700',
};

const TIPO_ICONS = {
  bloqueio: Lock,
  risco: AlertTriangle,
  default: ShieldAlert,
};

export default function ProjectRisks({ projectId, onNewActivity }) {
  const { data: activities = [] } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => base44.entities.Activity.filter({ project_id: projectId }),
  });

  const risks = activities.filter(a =>
    ['bloqueio', 'risco'].includes(a.tipo) &&
    !['concluido', 'cancelado'].includes(a.status)
  );

  const blockers = activities.filter(a => a.bloqueia_go_live && !['concluido', 'cancelado'].includes(a.status));

  return (
    <div className="space-y-6">
      {blockers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-700">Bloqueios de Go Live ({blockers.length})</h4>
          </div>
          <div className="space-y-2">
            {blockers.map(b => (
              <div key={b.id} className="bg-white border border-red-100 rounded-lg p-3">
                <p className="font-medium text-sm">{b.titulo}</p>
                <p className="text-xs text-muted-foreground mt-1">{b.descricao}</p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${CRITICIDADE_COLORS[b.criticidade] || CRITICIDADE_COLORS.media}`}>{b.criticidade}</span>
                  {b.responsavel && <span className="text-[11px] text-muted-foreground">Resp: {b.responsavel}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Riscos e Bloqueios Ativos ({risks.length})</h4>
          <Button size="sm" variant="outline" onClick={onNewActivity} className="gap-1">
            <Plus className="w-3 h-3" /> Registrar
          </Button>
        </div>

        {risks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum risco ou bloqueio ativo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {risks.map(r => {
              const Icon = TIPO_ICONS[r.tipo] || TIPO_ICONS.default;
              const isOverdue = r.prazo && new Date(r.prazo) < new Date();
              return (
                <div key={r.id} className={`border rounded-xl p-4 ${isOverdue ? 'border-red-200 bg-red-50' : 'bg-card'}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${r.tipo === 'bloqueio' ? 'text-red-500' : 'text-orange-500'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.titulo}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${CRITICIDADE_COLORS[r.criticidade] || CRITICIDADE_COLORS.media}`}>{r.criticidade}</span>
                        {isOverdue && <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">Vencido</span>}
                      </div>
                      {r.descricao && <p className="text-xs text-muted-foreground mt-1">{r.descricao}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        {r.responsavel && <span>Resp: {r.responsavel}</span>}
                        {r.prazo && <span>Prazo: {r.prazo}</span>}
                        {r.acao_esperada && <span>Ação: {r.acao_esperada}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}