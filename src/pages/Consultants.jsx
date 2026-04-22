import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, UserCog, Pencil, X, FolderKanban, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import CapacityGauge from '@/components/shared/CapacityGauge';
import StatCard from '@/components/shared/StatCard';
import { ESPECIALIDADES } from '@/lib/constants';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export default function Consultants() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEsp, setFilterEsp] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
  });
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list('-created_date', 500),
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Consultant.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consultants'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consultant.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consultants'] }); setEditing(null); },
  });

  const activeAllocations = allocations.filter(a => a.status === 'ativa');

  const getOccupancy = (cId) => {
    const c = consultants.find(x => x.id === cId);
    if (!c || !c.capacidade_semanal) return 0;
    const h = activeAllocations.filter(a => a.consultant_id === cId).reduce((s, a) => s + (a.horas_semanais || 0), 0);
    return (h / c.capacidade_semanal) * 100;
  };

  const getProjectNames = (cId) => {
    const allocs = activeAllocations.filter(a => a.consultant_id === cId);
    return allocs.map(a => ({ name: projects.find(p => p.id === a.project_id)?.name || '-', hours: a.horas_semanais, role: a.papel_no_projeto })).filter(x => x.name !== '-');
  };

  const filtered = consultants.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.funcao?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchEsp = filterEsp === 'all' || c.especialidade_principal === filterEsp;
    return matchSearch && matchStatus && matchEsp;
  });

  const active = consultants.filter(c => c.status === 'ativo');
  const overloaded = active.filter(c => getOccupancy(c.id) > 100);
  const attention = active.filter(c => getOccupancy(c.id) > 80 && getOccupancy(c.id) <= 100);

  const espLabel = (val) => ESPECIALIDADES.find(e => e.value === val)?.label || val;

  const selectedConsultant = selected ? consultants.find(c => c.id === selected) : null;
  const selectedProjects = selected ? getProjectNames(selected) : [];
  const selectedOcc = selected ? getOccupancy(selected) : 0;
  const selectedAllocs = selected ? allocations.filter(a => a.consultant_id === selected) : [];

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Consultores" description={`${consultants.length} consultores cadastrados`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Consultor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Ativos" value={active.length} icon={UserCog} />
        <StatCard title="Disponíveis" value={active.filter(c => getOccupancy(c.id) <= 80).length} icon={TrendingUp} subtitle="≤ 80%" />
        <StatCard title="Atenção" value={attention.length} icon={Clock} subtitle="80-100%" />
        <StatCard title="Sobrecarregados" value={overloaded.length} icon={AlertTriangle} subtitle="> 100%" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar consultor ou função..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterEsp} onValueChange={setFilterEsp}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Especialidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Especialidades</SelectItem>
            {ESPECIALIDADES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
            <SelectItem value="afastado">Afastado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum consultor encontrado</div>
        ) : (
          filtered.map(consultant => {
            const occupancy = getOccupancy(consultant.id);
            const projectNames = getProjectNames(consultant.id);
            const totalH = activeAllocations.filter(a => a.consultant_id === consultant.id).reduce((s, a) => s + (a.horas_semanais || 0), 0);
            return (
              <div
                key={consultant.id}
                className={`bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer ${selected === consultant.id ? 'ring-2 ring-primary' : ''} ${occupancy > 100 ? 'border-red-200' : occupancy > 80 ? 'border-yellow-200' : ''}`}
                onClick={() => setSelected(selected === consultant.id ? null : consultant.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{consultant.name}</h3>
                    <p className="text-xs text-muted-foreground">{consultant.funcao || espLabel(consultant.especialidade_principal)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); setEditing(consultant); }} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      consultant.status === 'ativo' ? 'bg-green-100 text-green-700' :
                      consultant.status === 'ferias' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {consultant.status === 'ativo' ? 'Ativo' : consultant.status === 'ferias' ? 'Férias' : consultant.status === 'afastado' ? 'Afastado' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <CapacityGauge percentage={occupancy} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{totalH}/{consultant.capacidade_semanal || 40}h/sem</span>
                  <span>{projectNames.length} projeto{projectNames.length !== 1 ? 's' : ''}</span>
                </div>
                {projectNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {projectNames.slice(0, 3).map((p, i) => (
                      <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full truncate max-w-[110px]">{p.name}</span>
                    ))}
                    {projectNames.length > 3 && <span className="text-[10px] text-muted-foreground">+{projectNames.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detalhe do consultor selecionado */}
      {selectedConsultant && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedConsultant.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedConsultant.funcao} · {espLabel(selectedConsultant.especialidade_principal)}</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
          </div>

          <Tabs defaultValue="projetos">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger value="projetos" className="text-xs">Projetos Vinculados</TabsTrigger>
              <TabsTrigger value="historico" className="text-xs">Histórico de Alocações</TabsTrigger>
              <TabsTrigger value="dados" className="text-xs">Dados</TabsTrigger>
            </TabsList>

            <TabsContent value="projetos" className="mt-4">
              {selectedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem projetos ativos</p>
              ) : (
                <div className="space-y-2">
                  {selectedProjects.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{p.name}</span>
                        {p.role && <span className="text-xs text-muted-foreground">· {p.role}</span>}
                      </div>
                      <span className="text-sm font-medium">{p.hours}h/sem</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <CapacityGauge percentage={selectedOcc} />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Capacidade: {selectedConsultant.capacidade_semanal || 40}h/sem</span>
                  <span>Saldo: {Math.max(0, (selectedConsultant.capacidade_semanal || 40) - selectedProjects.reduce((s, p) => s + (p.hours || 0), 0))}h/sem</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="mt-4">
              <div className="space-y-2">
                {selectedAllocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhuma alocação encontrada</p>
                ) : (
                  selectedAllocs.map(a => {
                    const proj = projects.find(p => p.id === a.project_id);
                    return (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{proj?.name || '-'}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.data_inicio ? new Date(a.data_inicio).toLocaleDateString('pt-BR') : '-'} →{' '}
                            {a.data_fim ? new Date(a.data_fim).toLocaleDateString('pt-BR') : 'Em aberto'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            a.status === 'ativa' ? 'bg-green-100 text-green-700' :
                            a.status === 'encerrada' ? 'bg-gray-100 text-gray-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{a.status}</span>
                          <p className="text-xs text-muted-foreground mt-1">{a.horas_semanais}h/sem</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="dados" className="mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'E-mail', value: selectedConsultant.email },
                  { label: 'Telefone', value: selectedConsultant.telefone },
                  { label: 'Especialidade', value: espLabel(selectedConsultant.especialidade_principal) },
                  { label: 'Gestor', value: selectedConsultant.gestor },
                  { label: 'Cap. Semanal', value: `${selectedConsultant.capacidade_semanal || 40}h` },
                  { label: 'Cap. Mensal', value: `${selectedConsultant.capacidade_mensal || 160}h` },
                  { label: 'Custo/Hora', value: selectedConsultant.custo_hora ? `R$ ${selectedConsultant.custo_hora}` : '-' },
                ].map(row => (
                  <div key={row.label} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="font-medium mt-0.5">{row.value || '-'}</p>
                  </div>
                ))}
              </div>
              {selectedConsultant.observacoes && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm mt-0.5">{selectedConsultant.observacoes}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Consultor</DialogTitle></DialogHeader>
          <ConsultantForm onSubmit={d => createMutation.mutate(d)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Consultor</DialogTitle></DialogHeader>
          {editing && (
            <ConsultantForm
              initial={editing}
              onSubmit={d => updateMutation.mutate({ id: editing.id, data: d })}
              isLoading={updateMutation.isPending}
              submitLabel="Salvar Alterações"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsultantForm({ onSubmit, isLoading, initial = {}, submitLabel = 'Cadastrar Consultor' }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    telefone: initial.telefone || '',
    funcao: initial.funcao || '',
    especialidade_principal: initial.especialidade_principal || 'geral',
    capacidade_semanal: initial.capacidade_semanal ?? 40,
    capacidade_mensal: initial.capacidade_mensal ?? 160,
    custo_hora: initial.custo_hora ?? 0,
    status: initial.status || 'ativo',
    gestor: initial.gestor || '',
    observacoes: initial.observacoes || '',
  });
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><Label>Nome *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>E-mail</Label><Input value={form.email} onChange={e => u('email', e.target.value)} /></div>
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => u('telefone', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Função/Cargo</Label><Input value={form.funcao} onChange={e => u('funcao', e.target.value)} /></div>
        <div><Label>Gestor</Label><Input value={form.gestor} onChange={e => u('gestor', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Especialidade Principal</Label>
          <Select value={form.especialidade_principal} onValueChange={v => u('especialidade_principal', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ESPECIALIDADES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => u('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="ferias">Férias</SelectItem>
              <SelectItem value="afastado">Afastado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Cap. Semanal (h)</Label><Input type="number" value={form.capacidade_semanal} onChange={e => u('capacidade_semanal', parseInt(e.target.value) || 0)} /></div>
        <div><Label>Cap. Mensal (h)</Label><Input type="number" value={form.capacidade_mensal} onChange={e => u('capacidade_mensal', parseInt(e.target.value) || 0)} /></div>
        <div><Label>Custo/Hora (R$)</Label><Input type="number" value={form.custo_hora} onChange={e => u('custo_hora', parseFloat(e.target.value) || 0)} /></div>
      </div>
      <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => u('observacoes', e.target.value)} rows={2} /></div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : submitLabel}</Button>
    </form>
  );
}