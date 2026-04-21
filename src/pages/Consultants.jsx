import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import CapacityGauge from '@/components/shared/CapacityGauge';
import { ESPECIALIDADES } from '@/lib/constants';

export default function Consultants() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      setShowCreate(false);
    },
  });

  const activeAllocations = allocations.filter(a => a.status === 'ativa');

  const getOccupancy = (consultantId) => {
    const consultant = consultants.find(c => c.id === consultantId);
    if (!consultant) return 0;
    const allocs = activeAllocations.filter(a => a.consultant_id === consultantId);
    const totalHours = allocs.reduce((sum, a) => sum + (a.horas_semanais || 0), 0);
    return consultant.capacidade_semanal ? (totalHours / consultant.capacidade_semanal) * 100 : 0;
  };

  const getProjectCount = (consultantId) => {
    return activeAllocations.filter(a => a.consultant_id === consultantId).length;
  };

  const getProjectNames = (consultantId) => {
    const allocs = activeAllocations.filter(a => a.consultant_id === consultantId);
    return allocs.map(a => projects.find(p => p.id === a.project_id)?.name).filter(Boolean);
  };

  const filtered = consultants.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const espLabel = (val) => ESPECIALIDADES.find(e => e.value === val)?.label || val;

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Consultores" description={`${consultants.length} consultores cadastrados`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Consultor
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar consultores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum consultor encontrado</div>
        ) : (
          filtered.map((consultant) => {
            const occupancy = getOccupancy(consultant.id);
            const projectCount = getProjectCount(consultant.id);
            const projectNames = getProjectNames(consultant.id);
            return (
              <div key={consultant.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{consultant.name}</h3>
                    <p className="text-xs text-muted-foreground">{consultant.funcao || espLabel(consultant.especialidade_principal)}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    consultant.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {consultant.status === 'ativo' ? 'Ativo' : consultant.status === 'ferias' ? 'Férias' : 'Inativo'}
                  </span>
                </div>
                <div className="mb-3">
                  <CapacityGauge percentage={occupancy} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{projectCount} projeto{projectCount !== 1 ? 's' : ''}</span>
                  <span>{consultant.capacidade_semanal || 40}h/sem</span>
                </div>
                {projectNames.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {projectNames.slice(0, 3).map((name, i) => (
                      <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px]">{name}</span>
                    ))}
                    {projectNames.length > 3 && <span className="text-[10px] text-muted-foreground">+{projectNames.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Consultor</DialogTitle></DialogHeader>
          <CreateConsultantForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateConsultantForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({ name: '', email: '', telefone: '', funcao: '', especialidade_principal: 'geral', capacidade_semanal: 40, capacidade_mensal: 160, custo_hora: 0, status: 'ativo' });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} /></div>
      </div>
      <div><Label>Função/Cargo</Label><Input value={form.funcao} onChange={(e) => update('funcao', e.target.value)} /></div>
      <div>
        <Label>Especialidade Principal</Label>
        <Select value={form.especialidade_principal} onValueChange={(v) => update('especialidade_principal', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{ESPECIALIDADES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Cap. Semanal (h)</Label><Input type="number" value={form.capacidade_semanal} onChange={(e) => update('capacidade_semanal', parseInt(e.target.value) || 0)} /></div>
        <div><Label>Cap. Mensal (h)</Label><Input type="number" value={form.capacidade_mensal} onChange={(e) => update('capacidade_mensal', parseInt(e.target.value) || 0)} /></div>
        <div><Label>Custo/Hora (R$)</Label><Input type="number" value={form.custo_hora} onChange={(e) => update('custo_hora', parseFloat(e.target.value) || 0)} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Cadastrar Consultor'}</Button>
    </form>
  );
}