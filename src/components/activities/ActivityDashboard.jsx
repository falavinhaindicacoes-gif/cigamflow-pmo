import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { STATUS_ATIVIDADE, TIPO_ATIVIDADE, PRIORIDADE_COLORS, CRITICIDADE_COLORS } from '@/lib/constants';

const CHART_COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];

export default function ActivityDashboard({ activities, projects }) {
  const open = activities.filter(a => a.status !== 'concluido' && a.status !== 'cancelado');
  const overdue = open.filter(a => a.prazo && new Date(a.prazo) < new Date());
  const concluded = activities.filter(a => a.status === 'concluido');

  const byStatus = STATUS_ATIVIDADE.map(s => ({
    name: s.label,
    value: activities.filter(a => a.status === s.value).length,
  })).filter(d => d.value > 0);

  const byType = TIPO_ATIVIDADE.map(t => ({
    name: t.label,
    value: activities.filter(a => a.tipo === t.value).length,
  })).filter(d => d.value > 0);

  const byProject = projects.map(p => ({
    name: p.name?.substring(0, 15),
    abertos: activities.filter(a => a.project_id === p.id && a.status !== 'concluido' && a.status !== 'cancelado').length,
    concluidos: activities.filter(a => a.project_id === p.id && a.status === 'concluido').length,
  })).filter(d => d.abertos > 0 || d.concluidos > 0);

  // Average resolution time
  const resolvedWithDates = concluded.filter(a => a.created_date && a.data_conclusao);
  const avgResolution = resolvedWithDates.length > 0
    ? Math.round(resolvedWithDates.reduce((sum, a) => {
        const start = new Date(a.created_date);
        const end = new Date(a.data_conclusao);
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0) / resolvedWithDates.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{activities.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{overdue.length}</p>
          <p className="text-xs text-muted-foreground">Atrasados</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{concluded.length}</p>
          <p className="text-xs text-muted-foreground">Concluídos</p>
        </div>
        <div className="bg-card border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-primary">{avgResolution}d</p>
          <p className="text-xs text-muted-foreground">Tempo Médio Resolução</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Por Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold text-sm mb-4">Por Tipo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byType} layout="vertical">
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">Por Projeto</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byProject}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="abertos" name="Abertos" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="concluidos" name="Concluídos" fill="#22c55e" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}