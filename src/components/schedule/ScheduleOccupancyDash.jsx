import { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, addDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Cell } from 'recharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

// Turnos máximos por período: 3 turnos/dia × 5 dias úteis = 15/semana, ×4 ~= 60/mês
const TURNOS_DIA = 3;
const DIAS_UTEIS_SEMANA = 5;
const TURNOS_SEMANA = TURNOS_DIA * DIAS_UTEIS_SEMANA;

function getWeekRange(base) {
  const start = startOfWeek(base, { weekStartsOn: 1 });
  const end = endOfWeek(base, { weekStartsOn: 1 });
  return { start, end };
}

function getMonthRange(base) {
  return { start: startOfMonth(base), end: endOfMonth(base) };
}

function countDiasUteis(start, end) {
  let count = 0;
  let d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d = addDays(d, 1);
  }
  return count;
}

function OccupancyBar({ percentage, height = 8 }) {
  const clamped = Math.min(percentage, 150);
  const color = percentage > 100 ? '#dc2626' : percentage > 80 ? '#f59e0b' : '#16a34a';
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: '#e2e8f0' }}>
      <div
        style={{ width: `${Math.min(clamped, 100)}%`, height, background: color, transition: 'width 0.4s ease' }}
        className="rounded-full"
      />
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ScheduleOccupancyDash({ allocations, consultants, projects, clients, baseDate }) {
  const [periodo, setPeriodo] = useState('semana');
  const today = format(new Date(), 'yyyy-MM-dd');
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  const range = useMemo(() => {
    if (periodo === 'semana') return getWeekRange(baseDate);
    if (periodo === 'mes') return getMonthRange(baseDate);
    // personalizado
    const start = customStart ? new Date(customStart + 'T00:00:00') : new Date();
    const end = customEnd ? new Date(customEnd + 'T23:59:59') : new Date();
    return { start, end };
  }, [periodo, baseDate, customStart, customEnd]);

  const diasUteis = useMemo(() => countDiasUteis(range.start, range.end), [range]);
  const turnosMaximos = diasUteis * TURNOS_DIA;

  const getProjectName = (projectId) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return 'Sem projeto';
    const c = clients.find(x => x.id === p.client_id);
    return c ? (c.nome_fantasia || c.razao_social) : p.name;
  };

  // Alocações no período por consultor
  const consultorData = useMemo(() => {
    const activeConsultants = consultants.filter(c => c.status === 'ativo');
    return activeConsultants.map(c => {
      const allocs = allocations.filter(a => {
        if (a.consultant_id !== c.id || !a.data) return false;
        const d = parseISO(a.data);
        return d >= range.start && d <= range.end;
      });
      const turnos = allocs.length;
      const pct = turnosMaximos > 0 ? Math.round((turnos / turnosMaximos) * 100) : 0;

      // por projeto
      const porProjeto = {};
      allocs.forEach(a => {
        const key = a.project_id || 'sem_projeto';
        if (!porProjeto[key]) porProjeto[key] = { name: getProjectName(a.project_id), turnos: 0, faturado: 0, a_confirmar: 0 };
        porProjeto[key].turnos++;
        if (a.status_faturamento === 'faturado') porProjeto[key].faturado++;
        else if (a.status_faturamento === 'a_confirmar') porProjeto[key].a_confirmar++;
      });

      return {
        id: c.id,
        name: c.name,
        especialidade: c.especialidade_principal,
        status: c.status,
        turnos,
        turnosMaximos,
        pct,
        allocs,
        porProjeto: Object.values(porProjeto).sort((a, b) => b.turnos - a.turnos),
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [consultants, allocations, range, turnosMaximos, projects, clients]);

  const sobrecarregados = consultorData.filter(c => c.pct > 100);
  const atencao = consultorData.filter(c => c.pct > 80 && c.pct <= 100);
  const disponiveis = consultorData.filter(c => c.pct <= 80 && c.pct > 0);
  const semAlocacao = consultorData.filter(c => c.pct === 0);

  // Dados para gráfico de barras comparativo
  const chartData = consultorData.slice(0, 12).map(c => ({
    name: c.name.split(' ')[0],
    Turnos: c.turnos,
    Máximo: turnosMaximos,
    pct: c.pct,
  }));

  const labelPeriodo = periodo === 'semana'
    ? `${format(range.start, 'dd/MM')} – ${format(range.end, 'dd/MM/yyyy')}`
    : periodo === 'mes'
    ? format(range.start, 'MMMM yyyy', { locale: ptBR })
    : `${format(range.start, 'dd/MM/yyyy')} – ${format(range.end, 'dd/MM/yyyy')}`;

  return (
    <div className="space-y-5">
      {/* Período */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {[{ key: 'semana', label: 'Semana' }, { key: 'mes', label: 'Mês' }, { key: 'personalizado', label: 'Personalizado' }].map(v => (
            <button
              key={v.key}
              onClick={() => setPeriodo(v.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${periodo === v.key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-muted'}`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {periodo === 'personalizado' && (
          <div className="flex items-center gap-2">
            <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-8 text-xs w-36" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-8 text-xs w-36" />
          </div>
        )}
        <span className="text-sm text-muted-foreground capitalize">{labelPeriodo} — {diasUteis} dias úteis · {turnosMaximos} turnos máx./consultor</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={AlertTriangle} label="Sobrecarregados" value={sobrecarregados.length} color="bg-red-500" sub="> 100% de ocupação" />
        <StatBox icon={TrendingUp} label="Em Atenção" value={atencao.length} color="bg-yellow-500" sub="80–100% de ocupação" />
        <StatBox icon={CheckCircle2} label="Com Alocação" value={disponiveis.length} color="bg-green-600" sub="≤ 80% de ocupação" />
        <StatBox icon={Users} label="Sem Alocação" value={semAlocacao.length} color="bg-slate-400" sub="0 turnos no período" />
      </div>

      {/* Gráfico comparativo */}
      {chartData.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Turnos Alocados vs Capacidade</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v, name) => [v, name === 'Máximo' ? 'Cap. máxima' : 'Turnos alocados']}
                labelFormatter={(label) => {
                  const d = chartData.find(x => x.name === label);
                  return d ? `${label} — ${d.pct}%` : label;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Máximo" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="Cap. máxima" />
              <Bar dataKey="Turnos" radius={[3, 3, 0, 0]} name="Turnos alocados">
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pct > 100 ? '#dc2626' : entry.pct > 80 ? '#f59e0b' : '#16a34a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ranking detalhado */}
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Ocupação por Consultor</h3>
        <div className="space-y-3">
          {consultorData.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum consultor ativo encontrado.</p>
          )}
          {consultorData.map(c => (
            <div key={c.id} className={`p-3 rounded-lg border ${c.pct > 100 ? 'border-red-200 bg-red-50/50' : c.pct > 80 ? 'border-yellow-200 bg-yellow-50/50' : 'border-border bg-background'}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{c.name}</span>
                  {c.especialidade && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize hidden sm:block">{c.especialidade}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{c.turnos}/{c.turnosMaximos} turnos</span>
                  <span className={`text-sm font-bold ${c.pct > 100 ? 'text-red-600' : c.pct > 80 ? 'text-yellow-600' : c.pct > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {c.pct}%
                  </span>
                </div>
              </div>
              <OccupancyBar percentage={c.pct} />
              {c.porProjeto.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
                  {c.porProjeto.map((p, i) => (
                    <span key={i} className="text-[10px] text-muted-foreground">
                      {p.name} <span className="font-medium text-foreground">{p.turnos}t</span>
                      {' '}({Math.round((p.turnos / c.turnosMaximos) * 100)}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        * Capacidade calculada com base em {TURNOS_DIA} turnos/dia × dias úteis do período selecionado.
      </p>
    </div>
  );
}