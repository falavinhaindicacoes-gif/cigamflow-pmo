import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, FileText, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';

export default function StatusReports() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({
    queryKey: ['statusReports'],
    queryFn: () => base44.entities.StatusReport.list('-created_date', 100),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StatusReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statusReports'] });
      setShowCreate(false);
    },
  });

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';
  const statusColors = {
    verde: 'bg-green-100 text-green-700',
    amarelo: 'bg-yellow-100 text-yellow-700',
    vermelho: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Status Reports" description="Relatórios periódicos de acompanhamento">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Report
        </Button>
      </PageHeader>

      <div className="grid gap-3">
        {reports.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum status report criado</div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{getProjectName(report.project_id)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {report.periodo_inicio && report.periodo_fim
                        ? `${new Date(report.periodo_inicio).toLocaleDateString('pt-BR')} - ${new Date(report.periodo_fim).toLocaleDateString('pt-BR')}`
                        : report.data_emissao ? new Date(report.data_emissao).toLocaleDateString('pt-BR') : '-'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.status_prazo && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[report.status_prazo]}`}>
                      Prazo: {report.status_prazo}
                    </span>
                  )}
                  {report.status_custo && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[report.status_custo]}`}>
                      Custo: {report.status_custo}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    report.status_aprovacao === 'aprovado' ? 'bg-green-100 text-green-700' :
                    report.status_aprovacao === 'pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {report.status_aprovacao === 'aprovado' ? 'Aprovado' : report.status_aprovacao === 'pendente' ? 'Pendente' : 'Rascunho'}
                  </span>
                </div>
              </div>
              {report.comentarios_gerente && (
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{report.comentarios_gerente}</p>
              )}
            </div>
          ))
        )}
      </div>

      <CreateReportDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        projects={projects}
        onSubmit={(d) => createMutation.mutate(d)}
        isLoading={createMutation.isPending}
      />

      {selectedReport && (
        <ReportDetailDialog
          open={!!selectedReport}
          onOpenChange={(o) => !o && setSelectedReport(null)}
          report={selectedReport}
          projects={projects}
        />
      )}
    </div>
  );
}

function CreateReportDialog({ open, onOpenChange, projects, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    project_id: '', periodo_inicio: '', periodo_fim: '', data_emissao: new Date().toISOString().split('T')[0],
    progresso_previsto: 0, progresso_realizado: 0, percentual_conclusao: 0,
    status_prazo: 'verde', comentario_prazo: '',
    horas_previstas: 0, horas_realizadas: 0, custo_previsto: 0, custo_realizado: 0,
    status_custo: 'verde', comentario_custo: '',
    entregas_concluidas: '', comentarios_gerente: '', status_aprovacao: 'rascunho',
  });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Status Report</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div>
            <Label>Projeto *</Label>
            <Select value={form.project_id} onValueChange={(v) => update('project_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Período Início</Label><Input type="date" value={form.periodo_inicio} onChange={(e) => update('periodo_inicio', e.target.value)} /></div>
            <div><Label>Período Fim</Label><Input type="date" value={form.periodo_fim} onChange={(e) => update('periodo_fim', e.target.value)} /></div>
            <div><Label>Data Emissão</Label><Input type="date" value={form.data_emissao} onChange={(e) => update('data_emissao', e.target.value)} /></div>
          </div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Prazo</h4>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Progresso Previsto (%)</Label><Input type="number" value={form.progresso_previsto} onChange={(e) => update('progresso_previsto', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Progresso Realizado (%)</Label><Input type="number" value={form.progresso_realizado} onChange={(e) => update('progresso_realizado', parseFloat(e.target.value) || 0)} /></div>
            <div>
              <Label>Status Prazo</Label>
              <Select value={form.status_prazo} onValueChange={(v) => update('status_prazo', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="verde">Verde</SelectItem>
                  <SelectItem value="amarelo">Amarelo</SelectItem>
                  <SelectItem value="vermelho">Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Comentário Prazo</Label><Textarea value={form.comentario_prazo} onChange={(e) => update('comentario_prazo', e.target.value)} rows={2} /></div>

          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Custo</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label>Horas Previstas</Label><Input type="number" value={form.horas_previstas} onChange={(e) => update('horas_previstas', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Horas Realizadas</Label><Input type="number" value={form.horas_realizadas} onChange={(e) => update('horas_realizadas', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Custo Previsto</Label><Input type="number" value={form.custo_previsto} onChange={(e) => update('custo_previsto', parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Custo Realizado</Label><Input type="number" value={form.custo_realizado} onChange={(e) => update('custo_realizado', parseFloat(e.target.value) || 0)} /></div>
          </div>

          <div><Label>Entregas Concluídas</Label><Textarea value={form.entregas_concluidas} onChange={(e) => update('entregas_concluidas', e.target.value)} rows={3} /></div>
          <div><Label>Comentários do Gerente</Label><Textarea value={form.comentarios_gerente} onChange={(e) => update('comentarios_gerente', e.target.value)} rows={3} /></div>

          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Criar Status Report'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportDetailDialog({ open, onOpenChange, report, projects }) {
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';
  const statusColors = { verde: 'text-green-600', amarelo: 'text-yellow-600', vermelho: 'text-red-600' };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Status Report - {getProjectName(report.project_id)}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground text-xs">Período</span><p className="font-medium">{report.periodo_inicio && report.periodo_fim ? `${new Date(report.periodo_inicio).toLocaleDateString('pt-BR')} - ${new Date(report.periodo_fim).toLocaleDateString('pt-BR')}` : '-'}</p></div>
            <div><span className="text-muted-foreground text-xs">Prazo</span><p className={`font-semibold ${statusColors[report.status_prazo] || ''}`}>{(report.status_prazo || '-').toUpperCase()}</p></div>
            <div><span className="text-muted-foreground text-xs">Custo</span><p className={`font-semibold ${statusColors[report.status_custo] || ''}`}>{(report.status_custo || '-').toUpperCase()}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground text-xs">Progresso Previsto</span><p className="font-medium">{report.progresso_previsto || 0}%</p></div>
            <div><span className="text-muted-foreground text-xs">Progresso Realizado</span><p className="font-medium">{report.progresso_realizado || 0}%</p></div>
          </div>
          {report.entregas_concluidas && (
            <div><span className="text-muted-foreground text-xs">Entregas Concluídas</span><p className="text-sm mt-1">{report.entregas_concluidas}</p></div>
          )}
          {report.comentarios_gerente && (
            <div><span className="text-muted-foreground text-xs">Comentários do Gerente</span><p className="text-sm mt-1">{report.comentarios_gerente}</p></div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}