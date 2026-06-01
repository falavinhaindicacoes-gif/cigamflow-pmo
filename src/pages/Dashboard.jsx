import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  FolderKanban, ArrowRight, CheckCircle2, PauseCircle, XCircle, Clock, Filter, X
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import HealthBadge from '@/components/shared/HealthBadge';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { FASES_PROJETO, getFaseLabel } from '@/lib/constants';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState('all');

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-created_date', 100), staleTime: 0 });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-created_date', 100), staleTime: 0 });
  const { data: allocations = [] } = useQuery({ queryKey: ['allocations'], queryFn: () => base44.entities.Allocation.list('-created_date', 500), staleTime: 0 });
  const { data: moduleItems = [] } = useQuery({ queryKey: ['moduleItems'], queryFn: () => base44.entities.ModuleItem.list('-created_date', 1000), staleTime: 0 });

  // Projects by status
  const allActiveProjects = projects.filter(p => p.status === 'em_andamento' || p.status === 'nao_iniciado');
  const activeProjects = selectedProjectId === 'all'
    ? allActiveProjects
    : allActiveProjects.filter(p => p.id === selectedProjectId);
  const pausedProjects = projects.filter(p => p.status === 'pausado');
  const cancelledProjects = projects.filter(p => p.status === 'cancelado');

  // Horas previstas = soma das horas dos ModuleItems por projeto
  const getHorasPrevistas = (projectId) =>
    moduleItems.filter(i => i.project_id === projectId).reduce((sum, i) => sum + (i.horas_necessarias || 0), 0);

  const activeProjectIds = new Set(activeProjects.map(p => p.id));
  const getHorasRealizadas = (projectId) =>
    moduleItems.filter(i => i.project_id === projectId && i.status === 'concluido').reduce((sum, i) => sum + (i.horas_necessarias || 0), 0);

  const totalHorasPrevistas = activeProjects.reduce((sum, p) => sum + getHorasPrevistas(p.id), 0);
  const totalHorasRealizadas = activeProjects.reduce((sum, p) => sum + getHorasRealizadas(p.id), 0);
  const progressPercentage = totalHorasPrevistas > 0 ? Math.round(totalHorasRealizadas / totalHorasPrevistas * 100) : 0;

  // Activities
  const getClientName = (id) => clients.find(c => c.id === id)?.razao_social || '-';

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title="Dashboard PMO" description="Visão consolidada da carteira de projetos" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Todos os projetos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {allActiveProjects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProjectId !== 'all' && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedProjectId('all')}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="executivo">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="executivo" className="text-xs">Executivo</TabsTrigger>
        </TabsList>

        {/* EXECUTIVO */}
        <TabsContent value="executivo" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projetos em Carteira" value={activeProjects.length} icon={FolderKanban} subtitle={`${projects.length} total na carteira`} />
            <StatCard title="Projetos Pausados" value={pausedProjects.length} icon={PauseCircle} subtitle="Aguardando retomada" />
            <StatCard title="Projetos Cancelados" value={cancelledProjects.length} icon={XCircle} subtitle="Encerrados" />
            <StatCard title="Horas Previstas (Ativos)" value={`${totalHorasPrevistas}h`} icon={Clock} subtitle={`${totalHorasRealizadas}h realizadas (${progressPercentage}%)`} />
          </div>

          {/* Horas por Projeto */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-4">Horas por Projeto (Ativos)</h3>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum projeto ativo</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.map(p => {
                  const horasPrev = getHorasPrevistas(p.id);
                  const horasReal = getHorasRealizadas(p.id);
                  const pct = horasPrev > 0 ? Math.min(Math.round(horasReal / horasPrev * 100), 100) : 0;
                  const clientName = clients.find(c => c.id === p.client_id)?.razao_social || '-';
                  return (
                    <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="min-w-0">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">{p.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{clientName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground ml-4 shrink-0">{horasReal}h / {horasPrev}h</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projetos Ativos */}
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Projetos em Carteira</h3>
                <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum projeto ativo</p>
              ) : (
                <div className="space-y-2">
                  {activeProjects.slice(0, 6).map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-200 hover:shadow-sm transition-shadow">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{getClientName(p.client_id)} · {getFaseLabel(p.fase_atual)}</p>
                      </div>
                      <HealthBadge saude={p.saude} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Projetos Pausados */}
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Projetos Pausados</h3>
                <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {pausedProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  Nenhum projeto pausado
                </div>
              ) : (
                <div className="space-y-2">
                  {pausedProjects.slice(0, 6).map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-200 hover:shadow-sm transition-shadow">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{getClientName(p.client_id)} · {getFaseLabel(p.fase_atual)}</p>
                      </div>
                      <HealthBadge saude={p.saude} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Projetos Cancelados */}
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Projetos Cancelados</h3>
                <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
              </div>
              {cancelledProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  Nenhum projeto cancelado
                </div>
              ) : (
                <div className="space-y-2">
                  {cancelledProjects.slice(0, 6).map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-200 hover:shadow-sm transition-shadow">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{getClientName(p.client_id)} · {getFaseLabel(p.fase_atual)}</p>
                      </div>
                      <HealthBadge saude={p.saude} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Projetos por fase */}
          <div className="bg-card rounded-xl border p-5">
            <h3 className="font-semibold text-sm mb-4">Projetos Ativos por Fase</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
              {FASES_PROJETO.map(fase => {
                const count = activeProjects.filter(p => p.fase_atual === fase.value).length;
                return (
                  <div key={fase.value} className="text-center p-3 rounded-lg bg-background border">
                    <p className="text-xl font-bold text-primary">{count}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{fase.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>




      </Tabs>
    </div>
  );
}