import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  FolderKanban, Users, UserCog, AlertTriangle, ListChecks,
  Clock, TrendingUp, ArrowRight, ShieldAlert
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import HealthBadge from '@/components/shared/HealthBadge';
import CapacityGauge from '@/components/shared/CapacityGauge';
import PageHeader from '@/components/shared/PageHeader';
import { FASES_PROJETO, getFaseLabel, getActivityStatusInfo } from '@/lib/constants';

export default function Dashboard() {
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
  });
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list('-created_date', 200),
  });
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.Activity.list('-created_date', 500),
  });

  const activeProjects = projects.filter(p => p.status === 'em_andamento');
  const criticalProjects = projects.filter(p => p.saude === 'vermelho');
  const openActivities = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');
  const overdueActivities = openActivities.filter(a => a.prazo && new Date(a.prazo) < new Date());
  const blockingActivities = openActivities.filter(a => a.bloqueia_go_live);
  const activeAllocations = allocations.filter(a => a.status === 'ativa');

  const getConsultantOccupancy = (consultantId) => {
    const consultant = consultants.find(c => c.id === consultantId);
    if (!consultant) return 0;
    const allocs = activeAllocations.filter(a => a.consultant_id === consultantId);
    const totalHours = allocs.reduce((sum, a) => sum + (a.horas_semanais || 0), 0);
    return consultant.capacidade_semanal ? (totalHours / consultant.capacidade_semanal) * 100 : 0;
  };

  const overloadedConsultants = consultants.filter(c => getConsultantOccupancy(c.id) > 100);

  const projectsByHealth = {
    verde: projects.filter(p => p.saude === 'verde').length,
    amarelo: projects.filter(p => p.saude === 'amarelo').length,
    vermelho: projects.filter(p => p.saude === 'vermelho').length,
  };

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader
        title="Dashboard Executivo"
        description="Visão consolidada da carteira de projetos"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Projetos Ativos" value={activeProjects.length} icon={FolderKanban}
          subtitle={`${projects.length} total`} />
        <StatCard title="Itens Abertos" value={openActivities.length} icon={ListChecks}
          subtitle={`${overdueActivities.length} atrasados`} />
        <StatCard title="Consultores" value={consultants.filter(c => c.status === 'ativo').length} icon={UserCog}
          subtitle={`${overloadedConsultants.length} sobrecarregados`} />
        <StatCard title="Bloqueios Go-Live" value={blockingActivities.length} icon={ShieldAlert}
          subtitle="Requerem ação imediata" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects by Health */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Saúde da Carteira</h3>
            <Link to="/projects" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Saudáveis', count: projectsByHealth.verde, color: 'bg-green-500' },
              { label: 'Atenção', count: projectsByHealth.amarelo, color: 'bg-yellow-500' },
              { label: 'Críticos', count: projectsByHealth.vermelho, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-lg font-bold">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 h-3 rounded-full bg-muted overflow-hidden flex">
            {projects.length > 0 && (
              <>
                <div className="bg-green-500 h-full" style={{ width: `${(projectsByHealth.verde / projects.length) * 100}%` }} />
                <div className="bg-yellow-500 h-full" style={{ width: `${(projectsByHealth.amarelo / projects.length) * 100}%` }} />
                <div className="bg-red-500 h-full" style={{ width: `${(projectsByHealth.vermelho / projects.length) * 100}%` }} />
              </>
            )}
          </div>
        </div>

        {/* Critical Projects */}
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-semibold text-sm mb-4">Projetos Críticos</h3>
          {criticalProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum projeto crítico</p>
          ) : (
            <div className="space-y-3">
              {criticalProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 hover:shadow-sm transition-shadow"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{getFaseLabel(project.fase_atual)}</p>
                  </div>
                  <HealthBadge saude={project.saude} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Activities */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Itens Atrasados</h3>
            <Link to="/activities" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {overdueActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum item atrasado</p>
          ) : (
            <div className="space-y-2">
              {overdueActivities.slice(0, 6).map((act) => {
                const daysOverdue = Math.ceil((new Date() - new Date(act.prazo)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{act.titulo}</p>
                      <p className="text-xs text-red-600">{daysOverdue} dias de atraso</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityStatusInfo(act.status).color}`}>
                      {getActivityStatusInfo(act.status).label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Capacity Overview */}
      <div className="bg-card rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Ocupação dos Consultores</h3>
          <Link to="/allocations" className="text-xs text-primary hover:underline flex items-center gap-1">
            Ver detalhes <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {consultants.filter(c => c.status === 'ativo').slice(0, 8).map((consultant) => {
            const occupancy = getConsultantOccupancy(consultant.id);
            return (
              <div key={consultant.id} className="p-3 rounded-lg border bg-background">
                <p className="text-sm font-medium mb-2 truncate">{consultant.name}</p>
                <CapacityGauge percentage={occupancy} size="sm" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Projects by Phase */}
      <div className="bg-card rounded-xl border p-5">
        <h3 className="font-semibold text-sm mb-4">Projetos por Fase</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
          {FASES_PROJETO.map((fase) => {
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
    </div>
  );
}