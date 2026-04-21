import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/shared/PageHeader';
import HealthBadge from '@/components/shared/HealthBadge';
import { FASES_PROJETO, STATUS_PROJETO, getFaseLabel, getStatusLabel } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [filterSaude, setFilterSaude] = useState('all');
  const [filterFase, setFilterFase] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Project.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreate(false);
    },
  });

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchSaude = filterSaude === 'all' || p.saude === filterSaude;
    const matchFase = filterFase === 'all' || p.fase_atual === filterFase;
    return matchSearch && matchSaude && matchFase;
  });

  const getClientName = (id) => clients.find(c => c.id === id)?.razao_social || '-';

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Projetos" description={`${projects.length} projetos na carteira`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar projetos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterSaude} onValueChange={setFilterSaude}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Saúde" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="verde">Saudável</SelectItem>
            <SelectItem value="amarelo">Atenção</SelectItem>
            <SelectItem value="vermelho">Crítico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFase} onValueChange={setFilterFase}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Fase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {FASES_PROJETO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum projeto encontrado</div>
        ) : (
          filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-card border rounded-xl p-5 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{project.name}</h3>
                    <HealthBadge saude={project.saude} />
                    {project.prioritario && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Prioritário
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{getClientName(project.client_id)}</span>
                    <span>•</span>
                    <span>{getFaseLabel(project.fase_atual)}</span>
                    <span>•</span>
                    <span>{getStatusLabel(project.status)}</span>
                    {project.gerente_projeto && <><span>•</span><span>GP: {project.gerente_projeto}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="w-32">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{project.percentual_progresso || 0}%</span>
                    </div>
                    <Progress value={project.percentual_progresso || 0} className="h-1.5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateProjectDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        clients={clients}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}

function CreateProjectDialog({ open, onOpenChange, clients, onSubmit, isLoading }) {
  const [form, setForm] = useState({ name: '', client_id: '', gerente_projeto: '', tipo_implantacao: 'remota', fase_atual: 'comercial', status: 'nao_iniciado' });
  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome do Projeto *</Label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div>
            <Label>Cliente *</Label>
            <Select value={form.client_id} onValueChange={(v) => update('client_id', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.razao_social}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Gerente do Projeto</Label>
              <Input value={form.gerente_projeto} onChange={(e) => update('gerente_projeto', e.target.value)} />
            </div>
            <div>
              <Label>Tipo de Implantação</Label>
              <Select value={form.tipo_implantacao} onValueChange={(v) => update('tipo_implantacao', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="remota">Remota</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="hibrida">Híbrida</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data Início</Label>
              <Input type="date" value={form.data_inicio || ''} onChange={(e) => update('data_inicio', e.target.value)} />
            </div>
            <div>
              <Label>Data Prevista Término</Label>
              <Input type="date" value={form.data_prevista_termino || ''} onChange={(e) => update('data_prevista_termino', e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando...' : 'Criar Projeto'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}