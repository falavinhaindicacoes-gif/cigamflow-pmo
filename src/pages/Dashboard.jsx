import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  FolderKanban, AlertTriangle, ListChecks,
  ArrowRight, TrendingUp, Clock, CheckCircle2, PauseCircle,
  XCircle, Zap
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import HealthBadge from '@/components/shared/HealthBadge';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FASES_PROJETO, getFaseLabel, getActivityStatusInfo } from '@/lib/constants';
import { differenceInDays } from 'date-fns';

export default function Dashboard() {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: () => base44.entities.Project.list('-created_date', 100) });
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => base44.entities.Activity.list('-created_date', 500) });
  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('-created_date', 100) });


  // Projects by status
  const activeProjects = projects.filter(p => p.status === 'em_andamento');
  const pausedProjects = projects.filter(p => p.status === 'pausado');
  const cancelledProjects = projects.filter(p => p.status === 'cancelado');
  const criticalProjects = projects.filter(p => p.saude === 'vermelho');

  // Activities
  const openActivities = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');
  const overdueActivities = openActivities.filter(a => a.prazo && new Date(a.prazo) < new Date());
  const criticalActivities = openActivities.filter(a => a.criticidade === 'critica');

  const projectsByHealth = {
    verde: projects.filter(p => p.saude === 'verde').length,
    amarelo: projects.filter(p => p.saude === 'amarelo').length,
    vermelho: projects.filter(p => p.saude === 'vermelho').length,
  };

  const actByStatus = {
    aberto: openActivities.filter(a => a.status === 'aberto').length,
    aguardando_cliente: openActivities.filter(a => a.status === 'aguardando_cliente').length,
    em_andamento: openActivities.filter(a => a.status === 'em_andamento').length,
    validar_solucao: openActivities.filter(a => a.status === 'validar_solucao').length,
  };

  const concluded = activities.filter(a => a.status === 'concluido' && a.data_conclusao && a.created_date);
  const avgResolution = concluded.length > 0
    ? Math.round(concluded.reduce((s, a) => s + differenceInDays(new Date(a.data_conclusao), new Date(a.created_date)), 0) / concluded.length)
    : 0;

  const getProjectName = (id) => projects.find(p => p.id === id)?.name || '-';
  const getClientName = (id) => clients.find(c => c.id === id)?.razao_social || '-';

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Dashboard PMO" description="Visão consolidada da carteira de projetos" />

      <Tabs defaultValue="executivo">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="executivo" className="text-xs">Executivo</TabsTrigger>
          <TabsTrigger value="gerencial" className="text-xs">Gerencial</TabsTrigger>
          <TabsTrigger value="operacional" className="text-xs">Operacional</TabsTrigger>

        </TabsList>

        {/* EXECUTIVO */}
        <TabsContent value="executivo" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Projetos Ativos" value={activeProjects.length} icon={FolderKanban} subtitle={`${projects.length} total na carteira`} />
            <StatCard title="Projetos Pausados" value={pausedProjects.length} icon={PauseCircle} subtitle="Aguardando retomada" />
            <StatCard title="Projetos Cancelados" value={cancelledProjects.length} icon={XCircle} subtitle="Encerrados" />
            <StatCard title="Itens Abertos" value={openActivities.length} icon={ListChecks} subtitle={`${overdueActivities.length} atrasados`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Saúde da carteira */}
            <div className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Saúde da Carteira</h3>
                <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Saudáveis', count: projectsByHealth.verde, color: 'bg-green-500' },
                  { label: 'Atenção', count: projectsByHealth.amarelo, color: 'bg-yellow-500' },
                  { label: 'Críticos', count: projectsByHealth.vermelho, color: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold">{item.count}</span>
                  </div>
                ))}
              </div>
              {projects.length > 0 && (
                <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-green-500 h-full" style={{ width: `${(projectsByHealth.verde / projects.length) * 100}%` }} />
                  <div className="bg-yellow-500 h-full" style={{ width: `${(projectsByHealth.amarelo / projects.length) * 100}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${(projectsByHealth.vermelho / projects.length) * 100}%` }} />
                </div>
              )}
            </div>

            {/* Projetos críticos */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold text-sm mb-4">Projetos Críticos</h3>
              {criticalProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum projeto crítico</p>
              ) : (
                <div className="space-y-2">
                  {criticalProjects.slice(0, 5).map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-200 hover:shadow-sm transition-shadow">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{getClientName(p.client_id)} · {getFaseLabel(p.fase_atual)}</p>
                      </div>
                      <HealthBadge saude={p.saude} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Projetos pausados */}
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
                  {pausedProjects.slice(0, 5).map(p => (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-200 hover:shadow-sm transition-shadow">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
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

        {/* GERENCIAL */}
        <TabsContent value="gerencial" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Itens Críticos" value={criticalActivities.length} icon={AlertTriangle} />
            <StatCard title="Atrasados" value={overdueActivities.length} icon={Clock} />
            <StatCard title="Resolução Média" value={`${avgResolution}d`} icon={TrendingUp} subtitle="Tempo médio" />
            <StatCard title="Concluídos" value={activities.filter(a => a.status === 'concluido').length} icon={CheckCircle2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Financeiro por projeto */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold text-sm mb-4">Financeiro por Projeto</h3>
              <div className="space-y-3">
                {activeProjects.filter(p => p.horas_previstas > 0).slice(0, 6).map(p => {
                  const perc = p.horas_previstas ? Math.min(100, ((p.horas_realizadas || 0) / p.horas_previstas) * 100) : 0;
                  const desvio = p.custo_previsto ? (((p.custo_realizado || 0) - p.custo_previsto) / p.custo_previsto) * 100 : 0;
                  return (
                    <Link key={p.id} to={`/projects/${p.id}`} className="block hover:bg-muted/30 p-2 rounded-lg transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{p.name}</span>
                        <span className={`text-xs font-medium ${desvio > 10 ? 'text-red-600' : desvio > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {desvio > 0 ? '+' : ''}{desvio.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{p.horas_realizadas || 0}/{p.horas_previstas}h</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${perc > 100 ? 'bg-red-500' : perc > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(100, perc)}%` }} />
                        </div>
                        <span>{perc.toFixed(0)}%</span>
                      </div>
                    </Link>
                  );
                })}
                {activeProjects.filter(p => p.horas_previstas > 0).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">Sem dados financeiros cadastrados</p>
                )}
              </div>
            </div>

            {/* Itens abertos por projeto */}
            <div className="bg-card rounded-xl border p-5">
              <h3 className="font-semibold text-sm mb-4">Itens Abertos por Projeto</h3>
              <div className="space-y-2">
                {activeProjects.slice(0, 7).map(p => {
                  const pActs = openActivities.filter(a => a.project_id === p.id);
                  const pOverdue = pActs.filter(a => a.prazo && new Date(a.prazo) < new Date());
                  return (
                    <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <HealthBadge saude={p.saude} size="sm" />
                        <span className="text-sm truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {pOverdue.length > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">{pOverdue.length} venc</span>}
                        <span className="text-sm font-bold text-muted-foreground">{pActs.length}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Itens atrasados */}
          <div className="bg-card rounded-xl border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Itens Atrasados</h3>
              <Link to="/activities" className="text-xs text-primary hover:underline flex items-center gap-1">Ver todos <ArrowRight className="w-3 h-3" /></Link>
            </div>
            {overdueActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />Nenhum item atrasado
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Item</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Projeto</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Responsável</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Venceu</th>
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {overdueActivities.slice(0, 8).map(a => {
                      const days = differenceInDays(new Date(), new Date(a.prazo));
                      return (
                        <tr key={a.id} className="hover:bg-muted/20">
                          <td className="py-2 px-3 font-medium max-w-[200px] truncate">{a.titulo}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{getProjectName(a.project_id)}</td>
                          <td className="py-2 px-3 text-muted-foreground text-xs">{a.responsavel || '-'}</td>
                          <td className="py-2 px-3"><span className="text-red-600 font-medium text-xs">há {days}d</span></td>
                          <td className="py-2 px-3">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getActivityStatusInfo(a.status).color}`}>
                              {getActivityStatusInfo(a.status).label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* OPERACIONAL */}
        <TabsContent value="operacional" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Abertos" value={actByStatus.aberto} icon={Zap} />
            <StatCard title="Aguard. Cliente" value={actByStatus.aguardando_cliente} icon={Clock} />
            <StatCard title="Em Andamento" value={actByStatus.em_andamento} icon={TrendingUp} />
            <StatCard title="Validar Solução" value={actByStatus.validar_solucao} icon={CheckCircle2} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl border p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Itens Críticos</h3>
                <Link to="/activities" className="text-xs text-primary hover:underline flex items-center gap-1">Lista completa <ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="space-y-2">
                {criticalActivities.slice(0, 8).map(a => {
                  const isOverdue = a.prazo && new Date(a.prazo) < new Date();
                  return (
                    <div key={a.id} className={`p-3 rounded-lg border ${isOverdue ? 'bg-orange-50 border-orange-200' : 'bg-muted/30 border-border'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{a.titulo}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">Crítica</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{getProjectName(a.project_id)} · {a.responsavel || 'Sem responsável'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${getActivityStatusInfo(a.status).color}`}>
                          {getActivityStatusInfo(a.status).label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {criticalActivities.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                    Nenhum item crítico
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-card rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-3">Por Tipo</h3>
                {['pendencia_cliente', 'pendencia_interna', 'bloqueio', 'risco', 'inconsistencia'].map(tipo => {
                  const count = openActivities.filter(a => a.tipo === tipo).length;
                  if (count === 0) return null;
                  const labels = { pendencia_cliente: 'Pend. Cliente', pendencia_interna: 'Pend. Interna', bloqueio: 'Bloqueio', risco: 'Risco', inconsistencia: 'Inconsistência' };
                  return (
                    <div key={tipo} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-xs text-muted-foreground">{labels[tipo]}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-card rounded-xl border p-5">
                <h3 className="font-semibold text-sm mb-3">Por Prioridade</h3>
                {[
                  { val: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-700' },
                  { val: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-700' },
                  { val: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
                  { val: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-700' },
                ].map(p => {
                  const count = openActivities.filter(a => a.prioridade === p.val).length;
                  return (
                    <div key={p.val} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.color}`}>{p.label}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}