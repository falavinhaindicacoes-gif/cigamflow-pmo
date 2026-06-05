import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, FileBarChart, Calendar, CheckCircle, Clock, XCircle, ChevronRight, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

const SAUDE_CONFIG = {
  verde: { label: 'Verde', color: 'bg-green-100 text-green-700' },
  amarelo: { label: 'Amarelo', color: 'bg-yellow-100 text-yellow-700' },
  vermelho: { label: 'Vermelho', color: 'bg-red-100 text-red-700' },
};

export default function ProjectStatusReports({ projectId, project }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['status-reports', projectId],
    queryFn: () => base44.entities.StatusReport.filter({ project_id: projectId }, '-data_emissao'),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ['activities', projectId],
    queryFn: () => base44.entities.Activity.filter({ project_id: projectId }),
    enabled: !!projectId,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['projectModules', projectId],
    queryFn: () => base44.entities.ProjectModule.filter({ project_id: projectId }, 'ordem'),
    enabled: !!projectId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StatusReport.create({ ...data, project_id: projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-reports', projectId] });
      setShowCreate(false);
    },
  });

  if (selected) {
    return <ReportDetail report={selected} onBack={() => setSelected(null)} projectId={projectId} modules={modules} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Status Reports ({reports.length})</h3>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Novo Report
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileBarChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum status report registrado</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => {
            const prazoInfo = SAUDE_CONFIG[r.status_prazo] || SAUDE_CONFIG.verde;
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full text-left bg-card border rounded-xl p-4 hover:shadow-md transition-all group flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileBarChart className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      Período: {r.periodo_inicio ? format(new Date(r.periodo_inicio), 'dd/MM/yyyy') : '-'} a {r.periodo_fim ? format(new Date(r.periodo_fim), 'dd/MM/yyyy') : '-'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${prazoInfo.color}`}>
                      Prazo: {prazoInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Emitido em {r.data_emissao ? format(new Date(r.data_emissao), 'dd/MM/yyyy') : '-'}</span>
                    <span>Progresso: {r.progresso_realizado ?? 0}%</span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${r.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {r.status_aprovacao === 'aprovado' ? 'Aprovado' : 'Rascunho'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <CreateReportDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSubmit={createMutation.mutate}
        isLoading={createMutation.isPending}
        project={project}
        activities={activities}
      />
    </div>
  );
}

const MODULE_STATUS_CONFIG = {
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  em_andamento: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700',    icon: Clock },
  nao_iniciado: { label: 'Não iniciado', color: 'bg-gray-100 text-gray-600',    icon: Clock },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-600',      icon: XCircle },
};

function ModulesPanel({ modules }) {
  if (!modules || modules.length === 0) return null;

  const concluidos = modules.filter(m => m.status === 'concluido');
  const pendentes  = modules.filter(m => m.status !== 'concluido' && m.status !== 'cancelado');
  const cancelados = modules.filter(m => m.status === 'cancelado');
  const pct = modules.length > 0 ? Math.round((concluidos.length / modules.length) * 100) : 0;

  return (
    <div className="bg-card border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h4 className="font-semibold text-sm">Módulos do Projeto</h4>
        </div>
        <span className="text-xs font-medium text-muted-foreground">{concluidos.length}/{modules.length} concluídos ({pct}%)</span>
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-1.5 max-h-64 overflow-y-auto">
        {modules.map(m => {
          const cfg = MODULE_STATUS_CONFIG[m.status] || MODULE_STATUS_CONFIG.nao_iniciado;
          const Icon = cfg.icon;
          return (
            <div key={m.id} className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/40">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${m.status === 'concluido' ? 'text-green-600' : m.status === 'cancelado' ? 'text-red-500' : 'text-blue-500'}`} />
                <span className={`text-sm truncate ${m.status === 'cancelado' ? 'line-through text-muted-foreground' : ''}`}>{m.name}</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {pendentes.length > 0 && (
        <div className="text-xs text-muted-foreground border-t pt-2">
          <span className="font-medium text-foreground">{pendentes.length} pendente(s):</span>{' '}
          {pendentes.map(m => m.name).join(', ')}
        </div>
      )}
    </div>
  );
}

function ReportDetail({ report, onBack, projectId, modules = [] }) {
  const saude = SAUDE_CONFIG[report.status_prazo] || SAUDE_CONFIG.verde;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-primary flex items-center gap-1 hover:underline">← Voltar aos reports</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm">Indicadores de Prazo</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progresso Previsto</span>
            <span className="font-medium">{report.progresso_previsto ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Progresso Realizado</span>
            <span className="font-medium">{report.progresso_realizado ?? 0}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status Prazo</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${saude.color}`}>{saude.label}</span>
          </div>
          {report.comentario_prazo && <p className="text-xs text-muted-foreground border-t pt-2">{report.comentario_prazo}</p>}
        </div>
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <h4 className="font-semibold text-sm">Indicadores de Custo</h4>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Horas Previstas</span>
            <span className="font-medium">{report.horas_previstas ?? 0}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Horas Realizadas</span>
            <span className="font-medium">{report.horas_realizadas ?? 0}h</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Custo Realizado</span>
            <span className="font-medium">R$ {(report.custo_realizado ?? 0).toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status Custo</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${(SAUDE_CONFIG[report.status_custo] || SAUDE_CONFIG.verde).color}`}>
              {(SAUDE_CONFIG[report.status_custo] || SAUDE_CONFIG.verde).label}
            </span>
          </div>
        </div>
      </div>
      <ModulesPanel modules={modules} />
      {report.entregas_concluidas && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-2">Entregas Concluídas</h4>
          <p className="text-sm text-muted-foreground">{report.entregas_concluidas}</p>
        </div>
      )}
      {report.riscos?.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-3">Riscos e Fatores Críticos</h4>
          <div className="space-y-2">
            {report.riscos.map((r, i) => (
              <div key={i} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="text-sm font-medium">{r.descricao}</p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>Prob: {r.probabilidade}</span>
                  <span>Impacto: {r.impacto}</span>
                  <span>Resp: {r.responsavel}</span>
                </div>
                {r.plano_acao && <p className="text-xs mt-1 text-muted-foreground">Plano: {r.plano_acao}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {report.proximas_atividades?.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-3">Próximas Atividades</h4>
          <div className="space-y-2">
            {report.proximas_atividades.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <span>{a.atividade}</span>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{a.responsavel}</span>
                  <span>{a.data_entrega}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {report.comentarios_gerente && (
        <div className="bg-card border rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-2">Comentários do Gerente</h4>
          <p className="text-sm text-muted-foreground">{report.comentarios_gerente}</p>
        </div>
      )}
    </div>
  );
}

function CreateReportDialog({ open, onOpenChange, onSubmit, isLoading, project, activities = [] }) {
  // Calcula horas realizadas: project.horas_realizadas + soma das atividades concluídas
  const horasAtividades = activities
    .filter(a => a.status === 'concluido')
    .reduce((sum, a) => sum + (a.sla_dias || 0), 0);
  const horasPrevistas = project?.horas_previstas ?? '';
  const horasRealizadas = (project?.horas_realizadas ?? 0) + horasAtividades;
  const progressoRealizado = project?.percentual_progresso ?? '';

  const [form, setForm] = useState({
    periodo_inicio: '', periodo_fim: '', data_emissao: '',
    gerente_projeto: project?.gerente_projeto || '',
    progresso_realizado: progressoRealizado,
    comentario_prazo: '',
    horas_previstas: horasPrevistas,
    horas_realizadas: horasRealizadas,
    entregas_concluidas: '', comentarios_gerente: '', status_aprovacao: 'rascunho',
  });

  // Atualiza gerente e horas quando o projeto carrega
  React.useEffect(() => {
    setForm(p => ({
      ...p,
      gerente_projeto: project?.gerente_projeto || '',
      progresso_realizado: project?.percentual_progresso ?? '',
      horas_previstas: project?.horas_previstas ?? '',
      horas_realizadas: (project?.horas_realizadas ?? 0) + horasAtividades,
    }));
  }, [project?.id]);

  const up = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Status Report</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Período Início</Label><Input type="date" value={form.periodo_inicio} onChange={e => up('periodo_inicio', e.target.value)} /></div>
            <div><Label>Período Fim</Label><Input type="date" value={form.periodo_fim} onChange={e => up('periodo_fim', e.target.value)} /></div>
            <div><Label>Data Emissão</Label><Input type="date" value={form.data_emissao} onChange={e => up('data_emissao', e.target.value)} /></div>
          </div>
          <div><Label>Gerente do Projeto</Label><Input value={form.gerente_projeto} onChange={e => up('gerente_projeto', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Progresso Realizado (%)</Label>
              <Input type="number" value={form.progresso_realizado} onChange={e => up('progresso_realizado', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Calculado automaticamente do projeto</p>
            </div>
            <div></div>
          </div>
          <div><Label>Comentário de Prazo</Label><Textarea value={form.comentario_prazo} onChange={e => up('comentario_prazo', e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Horas Previstas</Label>
              <Input type="number" value={form.horas_previstas} onChange={e => up('horas_previstas', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Do cadastro do projeto</p>
            </div>
            <div>
              <Label>Horas Realizadas</Label>
              <Input type="number" value={form.horas_realizadas} onChange={e => up('horas_realizadas', e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">Projeto + atividades concluídas</p>
            </div>
          </div>
          <div><Label>Entregas Concluídas</Label><Textarea value={form.entregas_concluidas} onChange={e => up('entregas_concluidas', e.target.value)} rows={3} /></div>
          <div><Label>Comentários do Gerente</Label><Textarea value={form.comentarios_gerente} onChange={e => up('comentarios_gerente', e.target.value)} rows={3} /></div>
          <div><Label>Status</Label>
            <Select value={form.status_aprovacao} onValueChange={v => up('status_aprovacao', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="pendente">Pendente Aprovação</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => onSubmit(form)} disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Status Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}