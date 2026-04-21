import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import CapacityGauge from '@/components/shared/CapacityGauge';
import { CalendarClock, UserCog, FolderKanban, TrendingUp } from 'lucide-react';

export default function Allocations() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list('-created_date', 500),
  });
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Allocation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      setShowCreate(false);
    },
  });

  const activeAllocs = allocations.filter(a => a.status === 'ativa');

  const getOccupancy = (consultantId) => {
    const consultant = consultants.find(c => c.id === consultantId);
    if (!consultant) return 0;
    const allocs = activeAllocs.filter(a => a.consultant_id === consultantId);
    const totalHours = allocs.reduce((sum, a) => sum + (a.horas_semanais || 0), 0);
    return consultant.capacidade_semanal ? (totalHours / consultant.capacidade_semanal) * 100 : 0;
  };

  const overloaded = consultants.filter(c => c.status === 'ativo' && getOccupancy(c.id) > 100);
  const attention = consultants.filter(c => c.status === 'ativo' && getOccupancy(c.id) > 80 && getOccupancy(c.id) <= 100);
  const available = consultants.filter(c => c.status === 'ativo' && getOccupancy(c.id) <= 80);

  const getConsultantName = (id) => consultants.find(c => c.id === id)?.name || '-';
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';

  // Capacity by consultant
  const activeConsultants = consultants.filter(c => c.status === 'ativo');

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Alocações" description="Gestão de capacidade e alocação de consultores">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Alocação
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Alocações Ativas" value={activeAllocs.length} icon={CalendarClock} />
        <StatCard title="Disponíveis" value={available.length} icon={UserCog} subtitle="Ocupação ≤ 80%" />
        <StatCard title="Atenção" value={attention.length} icon={TrendingUp} subtitle="Ocupação 80-100%" />
        <StatCard title="Sobrecarregados" value={overloaded.length} icon={AlertTriangle} subtitle="Ocupação > 100%" />
      </div>

      {/* Capacity Overview */}
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold text-sm mb-4">Ocupação por Consultor</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeConsultants.sort((a, b) => getOccupancy(b.id) - getOccupancy(a.id)).map((consultant) => {
            const occupancy = getOccupancy(consultant.id);
            const allocs = activeAllocs.filter(a => a.consultant_id === consultant.id);
            const totalHours = allocs.reduce((sum, a) => sum + (a.horas_semanais || 0), 0);
            return (
              <div key={consultant.id} className="p-4 rounded-lg border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium truncate">{consultant.name}</span>
                  <span className="text-xs text-muted-foreground">{totalHours}/{consultant.capacidade_semanal || 40}h</span>
                </div>
                <CapacityGauge percentage={occupancy} />
                <div className="mt-2 flex flex-wrap gap-1">
                  {allocs.slice(0, 3).map((a) => (
                    <span key={a.id} className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
                      {getProjectName(a.project_id)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Consultor</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Projeto</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Papel</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">H/Semana</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Período</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allocations.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium">{getConsultantName(alloc.consultant_id)}</td>
                  <td className="py-3 px-4">{getProjectName(alloc.project_id)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{alloc.papel_no_projeto || '-'}</td>
                  <td className="py-3 px-4">{alloc.horas_semanais || 0}h</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {alloc.data_inicio ? new Date(alloc.data_inicio).toLocaleDateString('pt-BR') : '-'} →{' '}
                    {alloc.data_fim ? new Date(alloc.data_fim).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      alloc.status === 'ativa' ? 'bg-green-100 text-green-700' :
                      alloc.status === 'encerrada' ? 'bg-gray-100 text-gray-700' :
                      alloc.status === 'pausada' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {alloc.status === 'ativa' ? 'Ativa' : alloc.status === 'encerrada' ? 'Encerrada' : alloc.status === 'pausada' ? 'Pausada' : 'Planejada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAllocationDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        consultants={consultants}
        projects={projects}
        onSubmit={(d) => createMutation.mutate(d)}
        isLoading={createMutation.isPending}
        getOccupancy={getOccupancy}
      />
    </div>
  );
}

function CreateAllocationDialog({ open, onOpenChange, consultants, projects, onSubmit, isLoading, getOccupancy }) {
  const [form, setForm] = useState({ project_id: '', consultant_id: '', papel_no_projeto: '', horas_semanais: 8, horas_mensais: 32, data_inicio: '', data_fim: '', status: 'ativa' });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const selectedConsultant = consultants.find(c => c.id === form.consultant_id);
  const currentOccupancy = form.consultant_id ? getOccupancy(form.consultant_id) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Alocação</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div>
            <Label>Consultor *</Label>
            <Select value={form.consultant_id} onValueChange={(v) => update('consultant_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{consultants.filter(c => c.status === 'ativo').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedConsultant && (
              <div className="mt-2 p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Ocupação atual: {Math.round(currentOccupancy)}%</p>
                <CapacityGauge percentage={currentOccupancy} size="sm" />
                {currentOccupancy > 80 && (
                  <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Consultor com alta ocupação
                  </p>
                )}
              </div>
            )}
          </div>
          <div>
            <Label>Projeto *</Label>
            <Select value={form.project_id} onValueChange={(v) => update('project_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{projects.filter(p => p.status === 'em_andamento').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Papel no Projeto</Label><Input value={form.papel_no_projeto} onChange={(e) => update('papel_no_projeto', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Horas/Semana</Label><Input type="number" value={form.horas_semanais} onChange={(e) => update('horas_semanais', parseInt(e.target.value) || 0)} /></div>
            <div><Label>Horas/Mês</Label><Input type="number" value={form.horas_mensais} onChange={(e) => update('horas_mensais', parseInt(e.target.value) || 0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.data_inicio} onChange={(e) => update('data_inicio', e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.data_fim} onChange={(e) => update('data_fim', e.target.value)} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Criar Alocação'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}