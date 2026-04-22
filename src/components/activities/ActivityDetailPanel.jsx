import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Pencil, Clock, ShieldAlert, AlertTriangle, CheckCircle2, User, Calendar, Tag, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getActivityStatusInfo, PRIORIDADE_COLORS, CRITICIDADE_COLORS, TIPO_ATIVIDADE, STATUS_ATIVIDADE } from '@/lib/constants';

export default function ActivityDetailPanel({ activity, projects, onClose, onEdit }) {
  const [showTratativa, setShowTratativa] = useState(false);
  const [tratativa, setTratativa] = useState('');
  const [novoStatus, setNovoStatus] = useState(activity?.status || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.update(activity.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowTratativa(false);
      setTratativa('');
    },
  });

  if (!activity) return null;

  const projectName = projects.find(p => p.id === activity.project_id)?.name || '-';
  const statusInfo = getActivityStatusInfo(activity.status);
  const prioridade = PRIORIDADE_COLORS[activity.prioridade] || PRIORIDADE_COLORS.media;
  const criticidade = CRITICIDADE_COLORS[activity.criticidade] || CRITICIDADE_COLORS.media;
  const tipo = TIPO_ATIVIDADE.find(t => t.value === activity.tipo)?.label || activity.tipo;
  const isOverdue = activity.prazo && new Date(activity.prazo) < new Date() && activity.status !== 'concluido' && activity.status !== 'cancelado';

  const handleSaveTratativa = () => {
    const updates = {
      status: novoStatus || activity.status,
      tratativa_realizada: activity.tratativa_realizada
        ? `${activity.tratativa_realizada}\n\n[${new Date().toLocaleDateString('pt-BR')}] ${tratativa}`
        : `[${new Date().toLocaleDateString('pt-BR')}] ${tratativa}`,
    };
    if (novoStatus === 'concluido') {
      updates.data_conclusao = new Date().toISOString().split('T')[0];
    }
    updateMutation.mutate(updates);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-card border-l shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 border-b ${activity.saude === 'vermelho' || isOverdue ? 'bg-red-50/50' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioridade.bg} ${prioridade.text}`}>{prioridade.label}</span>
              {activity.bloqueia_go_live && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1"><ShieldAlert className="w-3 h-3" />Bloqueia Go-Live</span>}
              {isOverdue && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Atrasado</span>}
            </div>
            <h2 className="font-semibold text-base leading-tight">{activity.titulo}</h2>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(activity)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Tag, label: 'Projeto', value: projectName },
            { icon: Tag, label: 'Tipo', value: tipo },
            { icon: User, label: 'Responsável', value: activity.responsavel },
            { icon: User, label: 'Solicitante', value: activity.solicitante },
            { icon: Calendar, label: 'Prazo', value: activity.prazo ? new Date(activity.prazo).toLocaleDateString('pt-BR') : null, highlight: isOverdue },
            { icon: Clock, label: 'Conclusão', value: activity.data_conclusao ? new Date(activity.data_conclusao).toLocaleDateString('pt-BR') : null },
            { icon: Tag, label: 'Criticidade', value: criticidade.label },
            { icon: Tag, label: 'Categoria', value: activity.categoria },
          ].filter(r => r.value).map(row => (
            <div key={row.label} className="flex items-start gap-2 p-2.5 bg-muted/30 rounded-lg">
              <row.icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className={`text-xs font-medium ${row.highlight ? 'text-red-600' : ''}`}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          {activity.bloqueia_fase && <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-md font-medium">Bloqueia Fase</span>}
          {activity.bloqueia_go_live && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">Bloqueia Go-Live</span>}
          {activity.exige_aprovacao && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md font-medium">Exige Aprovação</span>}
          {activity.recorrencia === 'reincidente' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">Reincidente</span>}
          {activity.recorrencia === 'recorrente' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md font-medium">Recorrente</span>}
        </div>

        {/* Description */}
        {activity.descricao && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Descrição</p>
            <p className="text-sm text-foreground/80 leading-relaxed bg-muted/20 rounded-lg p-3">{activity.descricao}</p>
          </div>
        )}

        {/* Ação esperada */}
        {activity.acao_esperada && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Ação Esperada</p>
            <p className="text-sm text-foreground/80 bg-blue-50 border border-blue-100 rounded-lg p-3">{activity.acao_esperada}</p>
          </div>
        )}

        {/* Tratativas */}
        {activity.tratativa_realizada && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tratativas Realizadas</p>
            <div className="bg-muted/20 rounded-lg p-3 space-y-2">
              {activity.tratativa_realizada.split('\n\n').map((t, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed border-b last:border-0 pb-2 last:pb-0">{t}</p>
              ))}
            </div>
          </div>
        )}

        {/* Próximo passo */}
        {activity.proximo_passo && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Próximo Passo</p>
            <p className="text-sm text-foreground/80 bg-green-50 border border-green-100 rounded-lg p-3">{activity.proximo_passo}</p>
          </div>
        )}

        {/* Solução / Causa raiz */}
        {(activity.causa_raiz || activity.solucao_aplicada) && (
          <div className="grid gap-2">
            {activity.causa_raiz && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Causa Raiz</p>
                <p className="text-sm text-foreground/80 bg-muted/20 rounded-lg p-3">{activity.causa_raiz}</p>
              </div>
            )}
            {activity.solucao_aplicada && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Solução Aplicada</p>
                <p className="text-sm text-foreground/80 bg-muted/20 rounded-lg p-3">{activity.solucao_aplicada}</p>
              </div>
            )}
          </div>
        )}

        {/* Add tratativa */}
        {activity.status !== 'concluido' && activity.status !== 'cancelado' && (
          <div className="border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTratativa(!showTratativa)}
              className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Registrar Tratativa
              </div>
              {showTratativa ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showTratativa && (
              <div className="p-4 space-y-3 border-t">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Novo Status</p>
                  <Select value={novoStatus} onValueChange={setNovoStatus}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Manter status atual" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_ATIVIDADE.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Descreva a tratativa realizada, próximos passos..."
                  value={tratativa}
                  onChange={e => setTratativa(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleSaveTratativa} disabled={updateMutation.isPending || !tratativa.trim()}>
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Tratativa'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowTratativa(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Concluir */}
        {activity.status !== 'concluido' && activity.status !== 'cancelado' && !showTratativa && (
          <Button
            variant="outline"
            className="w-full gap-2 border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => updateMutation.mutate({ status: 'concluido', data_conclusao: new Date().toISOString().split('T')[0] })}
            disabled={updateMutation.isPending}
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Concluído
          </Button>
        )}
      </div>
    </div>
  );
}