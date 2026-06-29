import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, LayoutList, Columns3, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import ActivityListView from '@/components/activities/ActivityListView';
import ActivityKanban from '@/components/activities/ActivityKanban';
import ActivityDashboard from '@/components/activities/ActivityDashboard';
import ActivityFormDialog from '@/components/activities/ActivityFormDialog';
import ActivityFilters from '@/components/activities/ActivityFilters';
import { ListChecks, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

export default function Activities() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const queryClient = useQueryClient();

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 500),
    staleTime: 30_000,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
    staleTime: 60_000,
  });
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-name', 100),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Activity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Activity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setEditActivity(null);
    },
  });

  const open = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');
  const overdue = open.filter(a => a.prazo && new Date(a.prazo) < new Date());
  const critical = open.filter(a => a.criticidade === 'critica');
  const blocking = open.filter(a => a.bloqueia_go_live);

  const filtered = activities.filter(a => {
    if (search && !a.titulo?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filters.status && filters.status !== 'all' && a.status !== filters.status) return false;
    if (filters.prioridade && filters.prioridade !== 'all' && a.prioridade !== filters.prioridade) return false;
    if (filters.criticidade && filters.criticidade !== 'all' && a.criticidade !== filters.criticidade) return false;
    if (filters.tipo && filters.tipo !== 'all' && a.tipo !== filters.tipo) return false;
    if (filters.project_id && filters.project_id !== 'all' && a.project_id !== filters.project_id) return false;
    if (filters.categoria && filters.categoria !== 'all' && a.categoria !== filters.categoria) return false;
    return true;
  });

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Lista de Atividades" description="Núcleo operacional — inconsistências, pendências, riscos e bloqueios">
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Atividade
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Abertos" value={open.length} icon={ListChecks} />
        <StatCard title="Atrasados" value={overdue.length} icon={Clock} />
        <StatCard title="Críticos" value={critical.length} icon={AlertTriangle} />
        <StatCard title="Bloqueiam Go-Live" value={blocking.length} icon={ShieldAlert} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar atividades..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <ActivityFilters filters={filters} setFilters={setFilters} projects={projects} />
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list" className="gap-2"><LayoutList className="w-4 h-4" /> Lista</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-2"><Columns3 className="w-4 h-4" /> Kanban</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2"><BarChart3 className="w-4 h-4" /> Dashboard</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <ActivityListView
            activities={filtered}
            projects={projects}
            onEdit={setEditActivity}
            onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
          />
        </TabsContent>
        <TabsContent value="kanban">
          <ActivityKanban
            activities={filtered}
            projects={projects}
            onStatusChange={(id, status) => updateMutation.mutate({ id, data: { status } })}
            onEdit={setEditActivity}
          />
        </TabsContent>
        <TabsContent value="dashboard">
          <ActivityDashboard activities={activities} projects={projects} />
        </TabsContent>
      </Tabs>

      <ActivityFormDialog
        open={showCreate || !!editActivity}
        onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditActivity(null); } }}
        activity={editActivity}
        projects={projects}
        consultants={consultants}
        onSubmit={(data) => {
          // Remove campos vazios para não conflitar com validações do schema
          const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== null && v !== undefined));
          if (editActivity) {
            updateMutation.mutate({ id: editActivity.id, data: clean });
          } else {
            createMutation.mutate(clean);
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}