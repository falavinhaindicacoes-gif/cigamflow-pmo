import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import CapacityGauge from '@/components/shared/CapacityGauge';
import { CalendarClock, UserCog, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Allocations() {
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocations'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Allocation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allocations'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Allocation.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allocations'] }),
  });

  const activeAllocs = allocations.filter(a => a.status === 'ativa');

  const getOccupancy = (cId) => {
    const c = consultants.find(x => x.id === cId);
    if (!c || !c.capacidade_semanal) return 0;
    const h = activeAllocs.filter(a => a.consultant_id === cId).reduce((s, a) => s + (a.horas_semanais || 0), 0);
    return (h / c.capacidade_semanal) * 100;
  };

  const getConsultantName = (id) => consultants.find(c => c.id === id)?.name || '-';
  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';

  const activeConsultants = consultants.filter(c => c.status === 'ativo');
  const overloaded = activeConsultants.filter(c => getOccupancy(c.id) > 100);
  const attention = activeConsultants.filter(c => getOccupancy(c.id) > 80 && getOccupancy(c.id) <= 100);
  const available = activeConsultants.filter(c => getOccupancy(c.id) <= 80);

  const filteredAllocs = allocations.filter(a => {
    const matchSearch = !search ||
      getConsultantName(a.consultant_id).toLowerCase().includes(search.toLowerCase()) ||
      getProjectName(a.project_id).toLowerCase().includes(search.toLowerCase()) ||
      a.papel_no_projeto?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Alocações" description="Gestão de capacidade e alocação de consultores">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Alocação
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Alocações Ativas" value={activeAllocs.length} icon={CalendarClock} />
        <StatCard title="Disponíveis" value={available.length} icon={UserCog} subtitle="Ocupação ≤ 80%" />
        <StatCard title="Atenção" value={attention.length} icon={TrendingUp} subtitle="Ocupação 80-100%" />
        <StatCard title="Sobrecarregados" value={overloaded.length} icon={AlertTriangle} subtitle="Ocupação > 100%" />
      </div>

      <Tabs defaultValue="capacidade">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="capacidade" className="text-xs">Capacidade</TabsTrigger>
          <TabsTrigger value="lista" className="text-xs">Lista de Alocações</TabsTrigger>
        </TabsList>

        <TabsContent value="capacidade" className="mt-4">
          <div className="bg-card border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Ocupação por Consultor</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeConsultants.sort((a, b) => getOccupancy(b.id) - getOccupancy(a.id)).map(consultant => {
                const occupancy = getOccupancy(consultant.id);
                const allocs = activeAllocs.filter(a => a.consultant_id === consultant.id);
                const totalHours = allocs.reduce((s, a) => s + (a.horas_semanais || 0), 0);
                const saldo = Math.max(0, (consultant.capacidade_semanal || 40) - totalHours);
                return (
                  <div key={consultant.id} className={`p-4 rounded-lg border bg-background ${occupancy > 100 ? 'border-red-200' : occupancy > 80 ? 'border-yellow-200' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium truncate">{consultant.name}</span>
                      <span className={`text-xs font-bold ${occupancy > 100 ? 'text-red-600' : occupancy > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {Math.round(occupancy)}%
                      </span>
                    </div>
                    <CapacityGauge percentage={occupancy} />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{totalHours}/{consultant.capacidade_semanal || 40}h/sem</span>
                      <span className={saldo === 0 ? 'text-red-500' : 'text-green-600'}>saldo: {saldo}h</span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {allocs.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-[10px]">
                          <span className="truncate text-muted-foreground max-w-[140px]">{getProjectName(a.project_id)}</span>
                          <span className="text-muted-foreground">{a.horas_semanais}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="lista" className="mt-4">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar consultor, projeto ou papel..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredAllocs.map(alloc => (
                    <tr key={alloc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-medium">{getConsultantName(alloc.consultant_id)}</td>
                      <td className="py-3 px-4">{getProjectName(alloc.project_id)}</td>
                      <td className="py-3 px-4 text-muted-foreground">{alloc.papel_no_projeto || '-'}</td>
                      <td className="py-3 px-4">{alloc.horas_semanais || 0}h</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {alloc.data_inicio ? new Date(alloc.data_inicio).toLocaleDateString('pt-BR') : '-'} →{' '}
                        {alloc.data_fim ? new Date(alloc.data_fim).toLocaleDateString('pt-BR') : 'Em aberto'}
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditing(alloc)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button onClick={() => { if (confirm('Excluir alocação?')) deleteMutation.mutate(alloc.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAllocs.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">Nenhuma alocação encontrada</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create */}
      <AllocationDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        consultants={consultants}
        projects={projects}
        getOccupancy={getOccupancy}
        onSubmit={d => createMutation.mutate(d)}
        isLoading={createMutation.isPending}
      />

      {/* Edit */}
      <AllocationDialog
        open={!!editing}
        onOpenChange={v => { if (!v) setEditing(null); }}
        consultants={consultants}
        projects={projects}
        getOccupancy={getOccupancy}
        initial={editing}
        onSubmit={d => updateMutation.mutate({ id: editing.id, data: d })}
        isLoading={updateMutation.isPending}
        title="Editar Alocação"
        submitLabel="Salvar Alterações"
      />
    </div>
  );
}

function AllocationDialog({ open, onOpenChange, consultants, projects, getOccupancy, initial = null, onSubmit, isLoading, title = "Nova Alocação", submitLabel = "Criar Alocação" }) {
  const [form, setForm] = useState({
    project_id: initial?.project_id || '',
    consultant_id: initial?.consultant_id || '',
    papel_no_projeto: initial?.papel_no_projeto || '',
    especialidade_aplicada: initial?.especialidade_aplicada || '',
    horas_semanais: initial?.horas_semanais ?? 8,
    horas_mensais: initial?.horas_mensais ?? 32,
    data_inicio: initial?.data_inicio || '',
    data_fim: initial?.data_fim || '',
    status: initial?.status || 'ativa',
    observacoes: initial?.observacoes || '',
  });
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const selectedConsultant = consultants.find(c => c.id === form.consultant_id);
  const currentOccupancy = form.consultant_id ? getOccupancy(form.consultant_id) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4">
          <div>
            <Label>Consultor *</Label>
            <Select value={form.consultant_id} onValueChange={v => u('consultant_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{consultants.filter(c => c.status === 'ativo').map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            {selectedConsultant && (
              <div className="mt-2 p-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Ocupação atual: {Math.round(currentOccupancy)}%</p>
                <CapacityGauge percentage={currentOccupancy} size="sm" />
                {currentOccupancy > 100 && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Consultor sobrecarregado!</p>}
                {currentOccupancy > 80 && currentOccupancy <= 100 && <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Consultor com alta ocupação</p>}
              </div>
            )}
          </div>
          <div>
            <Label>Projeto *</Label>
            <Select value={form.project_id} onValueChange={v => u('project_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{projects.filter(p => p.status !== 'cancelado').map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Papel no Projeto</Label><Input value={form.papel_no_projeto} onChange={e => u('papel_no_projeto', e.target.value)} /></div>
            <div><Label>Especialidade Aplicada</Label><Input value={form.especialidade_aplicada} onChange={e => u('especialidade_aplicada', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Horas/Semana</Label><Input type="number" value={form.horas_semanais} onChange={e => u('horas_semanais', parseInt(e.target.value) || 0)} /></div>
            <div><Label>Horas/Mês</Label><Input type="number" value={form.horas_mensais} onChange={e => u('horas_mensais', parseInt(e.target.value) || 0)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.data_inicio} onChange={e => u('data_inicio', e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.data_fim} onChange={e => u('data_fim', e.target.value)} /></div>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => u('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="planejada">Planejada</SelectItem>
                <SelectItem value="pausada">Pausada</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => u('observacoes', e.target.value)} rows={2} /></div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : submitLabel}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}