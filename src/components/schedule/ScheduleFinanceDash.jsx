import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DollarSign, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const HORAS_POR_TURNO = 4; // cada turno = 4h

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

export default function ScheduleFinanceDash({ allocations, clients, projects }) {
  const getClientValorHora = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    const client = clients.find(c => c.id === project.client_id);
    return client?.valor_hora || 0;
  };

  const calcValor = (allocation) => getClientValorHora(allocation.project_id) * HORAS_POR_TURNO;

  // Totals
  const totals = useMemo(() => {
    const faturado = allocations.filter(a => a.status_faturamento === 'faturado').reduce((s, a) => s + calcValor(a), 0);
    const a_confirmar = allocations.filter(a => a.status_faturamento === 'a_confirmar').reduce((s, a) => s + calcValor(a), 0);
    const nao_faturado = allocations.filter(a => a.status_faturamento === 'nao_faturado').reduce((s, a) => s + calcValor(a), 0);
    return { faturado, a_confirmar, nao_faturado, total: faturado + a_confirmar + nao_faturado };
  }, [allocations, clients, projects]);

  // Monthly bar chart (last 6 months + next 3)
  const months = useMemo(() => {
    const start = subMonths(new Date(), 5);
    const end = addMonths(new Date(), 3);
    return eachMonthOfInterval({ start, end }).map(month => {
      const monthStr = format(month, 'yyyy-MM');
      const monthAllocs = allocations.filter(a => a.data?.startsWith(monthStr));
      const faturado = monthAllocs.filter(a => a.status_faturamento === 'faturado').reduce((s, a) => s + calcValor(a), 0);
      const a_confirmar = monthAllocs.filter(a => a.status_faturamento === 'a_confirmar').reduce((s, a) => s + calcValor(a), 0);
      const nao_faturado = monthAllocs.filter(a => a.status_faturamento === 'nao_faturado').reduce((s, a) => s + calcValor(a), 0);
      return {
        name: format(month, 'MMM/yy', { locale: ptBR }),
        Faturado: Math.round(faturado),
        'A Confirmar': Math.round(a_confirmar),
        'Não Faturado': Math.round(nao_faturado),
      };
    });
  }, [allocations, clients, projects]);

  // By client
  const byClient = useMemo(() => {
    const map = {};
    allocations.forEach(a => {
      const project = projects.find(p => p.id === a.project_id);
      if (!project) return;
      const client = clients.find(c => c.id === project.client_id);
      if (!client) return;
      const name = client.nome_fantasia || client.razao_social;
      if (!map[name]) map[name] = { name, faturado: 0, a_confirmar: 0 };
      const val = calcValor(a);
      if (a.status_faturamento === 'faturado') map[name].faturado += val;
      else if (a.status_faturamento === 'a_confirmar') map[name].a_confirmar += val;
    });
    return Object.values(map).sort((a, b) => (b.faturado + b.a_confirmar) - (a.faturado + a.a_confirmar)).slice(0, 8);
  }, [allocations, clients, projects]);

  // Pie data
  const pieData = [
    { name: 'Faturado', value: Math.round(totals.faturado), color: '#16a34a' },
    { name: 'A Confirmar', value: Math.round(totals.a_confirmar), color: '#facc15' },
    { name: 'Não Faturado', value: Math.round(totals.nao_faturado), color: '#dc2626' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={DollarSign} label="Total Faturado" value={fmt(totals.faturado)} color="bg-green-600" />
        <StatBox icon={Clock} label="A Confirmar" value={fmt(totals.a_confirmar)} color="bg-yellow-500" />
        <StatBox icon={AlertCircle} label="Não Faturado" value={fmt(totals.nao_faturado)} color="bg-red-600" />
        <StatBox icon={TrendingUp} label="Previsão Total" value={fmt(totals.total)} color="bg-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Evolução Mensal de Faturamento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={months} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Faturado" fill="#16a34a" radius={[3,3,0,0]} />
              <Bar dataKey="A Confirmar" fill="#facc15" radius={[3,3,0,0]} />
              <Bar dataKey="Não Faturado" fill="#dc2626" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Distribuição por Status</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-semibold">{totals.total > 0 ? Math.round(d.value / totals.total * 100) : 0}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* By client */}
      {byClient.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Faturamento por Cliente</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byClient} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="faturado" name="Faturado" fill="#16a34a" radius={[0,3,3,0]} />
              <Bar dataKey="a_confirmar" name="A Confirmar" fill="#facc15" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">* Cálculo baseado em {HORAS_POR_TURNO}h por turno × valor/hora do cliente. Configure o valor/hora no cadastro de cada cliente.</p>
    </div>
  );
}