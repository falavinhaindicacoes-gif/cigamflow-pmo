import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Plus, Search, ArrowRight, FolderKanban, ShieldAlert, Star, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import HealthBadge from '@/components/shared/HealthBadge';
import StatCard from '@/components/shared/StatCard';
import { FASES_PROJETO, getFaseLabel, getStatusLabel } from '@/lib/constants';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [filterSaude, setFilterSaude] = useState('all');
  const [filterFase, setFilterFase] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGerente, setFilterGerente] = useState('all');
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

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const { data: gerentesFilter = [] } = useQuery({
    queryKey: ['projectManagers'],
    queryFn: () => base44.entities.ProjectManager.list('name', 200),
  });
  const gerentes = gerentesFilter.map(g => g.name);

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      clients.find(c => c.id === p.client_id)?.razao_social?.toLowerCase().includes(search.toLowerCase());
    const matchSaude = filterSaude === 'all' || p.saude === filterSaude;
    const matchFase = filterFase === 'all' || p.fase_atual === filterFase;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchGerente = filterGerente === 'all' || p.gerente_projeto === filterGerente;
    return matchSearch && matchSaude && matchFase && matchStatus && matchGerente;
  });

  const getClientName = (id) => clients.find(c => c.id === id)?.razao_social || '-';

  const ativos = projects.filter(p => p.status === 'em_andamento');
  const criticos = projects.filter(p => p.saude === 'vermelho');
  const prioritarios = projects.filter(p => p.prioritario);
  const proximoGoLive = projects.filter(p => p.fase_atual === 'go_live' || p.fase_atual === 'preparacao_virada');

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Projetos" description={`${projects.length} projetos na carteira`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Em Andamento" value={ativos.length} icon={FolderKanban} />
        <StatCard title="Críticos" value={criticos.length} icon={ShieldAlert} />
        <StatCard title="Prioritários" value={prioritarios.length} icon={Star} />
        <StatCard title="Próx. Go Live" value={proximoGoLive.length} icon={Clock} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterSaude} onValueChange={setFilterSaude}>
          <SelectTrigger className="w-38"><SelectValue placeholder="Saúde" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda Saúde</SelectItem>
            <SelectItem value="verde">Saudável</SelectItem>
            <SelectItem value="amarelo">Atenção</SelectItem>
            <SelectItem value="vermelho">Crítico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo Status</SelectItem>
            <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFase} onValueChange={setFilterFase}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Fase" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            {FASES_PROJETO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {gerentes.length > 0 && (
          <Select value={filterGerente} onValueChange={setFilterGerente}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Gerente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos GP</SelectItem>
              {gerentes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="text-xs text-muted-foreground mb-2">{filtered.length} projeto{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</div>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum projeto encontrado</div>
        ) : (
          filtered.map((project) => {
            const isOverdue = project.data_prevista_termino && new Date(project.data_prevista_termino) < new Date() && project.status !== 'concluido';
            return (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className={`bg-card border rounded-xl p-4 hover:shadow-md transition-all group flex flex-col sm:flex-row sm:items-center gap-3 ${project.saude === 'vermelho' ? 'border-l-4 border-l-red-400' : project.saude === 'amarelo' ? 'border-l-4 border-l-yellow-400' : 'border-l-4 border-l-green-400'}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{project.name}</h3>
                    <HealthBadge saude={project.saude} />
                    {project.prioritario && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">⭐ Prioritário</span>
                    )}
                    {project.bloqueia_go_live && (
                      <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🚫 Bloqueia GL</span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚠ Atrasado</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/70">{getClientName(project.client_id)}</span>
                    <span>·</span>
                    <span>{getFaseLabel(project.fase_atual)}</span>
                    <span>·</span>
                    <span>{getStatusLabel(project.status)}</span>
                    {project.gerente_projeto && <><span>·</span><span>GP: {project.gerente_projeto}</span></>}
                    {project.tipo_implantacao && <><span>·</span><span className="capitalize">{project.tipo_implantacao}</span></>}
                    {project.data_prevista_termino && (
                      <><span>·</span><span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Término: {new Date(project.data_prevista_termino).toLocaleDateString('pt-BR')}
                      </span></>
                    )}
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
                  <div onClick={e => e.preventDefault()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted text-muted-foreground" onClick={e => e.preventDefault()}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (confirm(`Excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`)) deleteMutation.mutate(project.id); }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir Projeto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Link>
            );
          })
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

  const { data: gerentes = [] } = useQuery({
    queryKey: ['projectManagers'],
    queryFn: () => base44.entities.ProjectManager.list('name', 200),
  });

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
              <Select value={form.gerente_projeto} onValueChange={(v) => update('gerente_projeto', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o GP" /></SelectTrigger>
                <SelectContent>
                  {gerentes.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
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