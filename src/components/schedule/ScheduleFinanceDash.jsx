import { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, addMonths, parseISO, isWithinInterval, startOfYear, endOfYear, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Clock, TrendingDown, Minus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const HORAS_POR_TURNO = 4;
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const fmtDelta = (v) => (v >= 0 ? '+' : '') + fmt(v);
const fmtPct = (v) => (v >= 0 ? '+' : '') + v.toFixed(1) + '%';

const PRESETS = [
  { key: 'mes_atual', label: 'Mês Atual' },
  { key: 'mes_anterior', label: 'Mês Anterior' },
  { key: 'trimestre', label: 'Trimestre Atual' },
  { key: 'semestre', label: 'Semestre Atual' },
  { key: 'ano', label: 'Ano Atual' },
  { key: 'custom', label: 'Personalizado' },
];

function getPresetRange(preset) {
  const now = new Date();
  if (preset === 'mes_atual') return { start: startOfMonth(now), end: endOfMonth(now) };
  if (preset === 'mes_anterior') { const m = subMonths(now, 1); return { start: startOfMonth(m), end: endOfMonth(m) }; }
  if (preset === 'trimestre') {
    const q = Math.floor(now.getMonth() / 3);
    return { start: new Date(now.getFullYear(), q * 3, 1), end: new Date(now.getFullYear(), q * 3 + 3, 0) };
  }
  if (preset === 'semestre') {
    const s = now.getMonth() < 6 ? 0 : 6;
    return { start: new Date(now.getFullYear(), s, 1), end: new Date(now.getFullYear(), s + 6, 0) };
  }
  if (preset === 'ano') return { start: startOfYear(now), end: endOfYear(now) };
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

function Delta({ current, previous, label }) {
  const delta = current - previous;
  const pct = previous > 0 ? (delta / previous) * 100 : null;
  const isPos = delta >= 0;
  const Icon = delta === 0 ? Minus : isPos ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center gap-1 text-xs mt-0.5">
      <Icon className={`w-3 h-3 ${delta === 0 ? 'text-muted-foreground' : isPos ? 'text-green-600' : 'text-red-500'}`} />
      <span className={delta === 0 ? 'text-muted-foreground' : isPos ? 'text-green-600' : 'text-red-500'}>
        {fmtDelta(delta)}{pct !== null ? ` (${fmtPct(pct)})` : ''} vs mês ant.
      </span>
    </div>
  );
}

function StatBox({ icon: Icon, label, value, color, delta, previous }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </div>
      {previous !== undefined && <Delta current={delta} previous={previous} />}
    </div>
  );
}

export default function ScheduleFinanceDash({ allocations, clients, projects }) {
  const [preset, setPreset] = useState('mes_atual');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const range = useMemo(() => {
    if (preset === 'custom') return { start: parseISO(customStart), end: parseISO(customEnd) };
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  // Previous period = same length, one month back (for comparison)
  const prevRange = useMemo(() => {
    const m = subMonths(range.start, 1);
    return { start: startOfMonth(m), end: endOfMonth(m) };
  }, [range]);

  const getClientValorHora = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    const client = clients.find(c => c.id === project.client_id);
    return client?.valor_hora || 0;
  };

  const calcValor = (a) => getClientValorHora(a.project_id) * HORAS_POR_TURNO;

  const inRange = (a, r) => {
    if (!a.data) return false;
    const d = parseISO(a.data);
    return d >= r.start && d <= r.end;
  };

  // nao_faturado is excluded from a_confirmar and total (previsão financeira)
  const calcTotals = (allocs, r) => {
    const filtered = allocs.filter(a => inRange(a, r));
    const faturado = filtered.filter(a => a.status_faturamento === 'faturado').reduce((s, a) => s + calcValor(a), 0);
    const a_confirmar = filtered.filter(a => a.status_faturamento === 'a_confirmar').reduce((s, a) => s + calcValor(a), 0);
    const nao_faturado = filtered.filter(a => a.status_faturamento === 'nao_faturado').reduce((s, a) => s + calcValor(a), 0);
    return { faturado, a_confirmar, nao_faturado, total: faturado + a_confirmar };
  };

  const totals = useMemo(() => calcTotals(allocations, range), [allocations, range, clients, projects]);
  const prevTotals = useMemo(() => calcTotals(allocations, prevRange), [allocations, prevRange, clients, projects]);

  // Monthly chart (always shows 9 months context)
  const months = useMemo(() => {
    const start = subMonths(new Date(), 5);
    const end = addMonths(new Date(), 3);
    return eachMonthOfInterval({ start, end }).map(month => {
      const r = { start: startOfMonth(month), end: endOfMonth(month) };
      const t = calcTotals(allocations, r);
      return {
        name: format(month, 'MMM/yy', { locale: ptBR }),
        Faturado: Math.round(t.faturado),
        'A Confirmar': Math.round(t.a_confirmar),
        'Não Faturado': Math.round(t.nao_faturado),
      };
    });
  }, [allocations, clients, projects]);

  // By client (faturado + a_confirmar only)
  const byClient = useMemo(() => {
    const filtered = allocations.filter(a => inRange(a, range) && a.status_faturamento !== 'nao_faturado');
    const map = {};
    filtered.forEach(a => {
      const project = projects.find(p => p.id === a.project_id);
      if (!project) return;
      const client = clients.find(c => c.id === project.client_id);
      if (!client) return;
      const name = client.nome_fantasia || client.razao_social;
      if (!map[name]) map[name] = { name, faturado: 0, a_confirmar: 0 };
      const val = calcValor(a);
      if (a.status_faturamento === 'faturado') map[name].faturado += val;
      else map[name].a_confirmar += val;
    });
    return Object.values(map).sort((a, b) => (b.faturado + b.a_confirmar) - (a.faturado + a.a_confirmar)).slice(0, 8);
  }, [allocations, range, clients, projects]);

  const pieData = [
    { name: 'Faturado', value: Math.round(totals.faturado), color: '#16a34a' },
    { name: 'A Confirmar', value: Math.round(totals.a_confirmar), color: '#facc15' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Período</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRESETS.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {preset === 'custom' && (
          <>
            <div className="space-y-1">
              <Label className="text-xs">De</Label>
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Até</Label>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="h-8 text-xs w-36" />
            </div>
          </>
        )}
        <div className="text-xs text-muted-foreground self-center">
          Comparativo com: <span className="font-medium">{format(prevRange.start, 'MMM/yy', { locale: ptBR })}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={DollarSign} label="Total Faturado" value={fmt(totals.faturado)} color="bg-green-600"
          delta={totals.faturado} previous={prevTotals.faturado} />
        <StatBox icon={Clock} label="A Confirmar" value={fmt(totals.a_confirmar)} color="bg-yellow-500"
          delta={totals.a_confirmar} previous={prevTotals.a_confirmar} />
        <StatBox icon={TrendingUp} label="Previsão Financeira" value={fmt(totals.total)} color="bg-primary"
          delta={totals.total} previous={prevTotals.total} />
        <StatBox icon={TrendingDown} label="Não Faturado" value={fmt(totals.nao_faturado)} color="bg-slate-500"
          delta={totals.nao_faturado} previous={prevTotals.nao_faturado} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly bar */}
        <div className="lg:col-span-2 bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Evolução Mensal (contexto 9 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={months} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Faturado" fill="#16a34a" radius={[3,3,0,0]} />
              <Bar dataKey="A Confirmar" fill="#facc15" radius={[3,3,0,0]} />
              <Bar dataKey="Não Faturado" fill="#94a3b8" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie - faturado vs a_confirmar only */}
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-1">Distribuição Financeira</h3>
          <p className="text-[10px] text-muted-foreground mb-3">Exclui acompanhamentos comerciais</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{fmt(d.value)}</span>
                      <span className="text-muted-foreground ml-1">({totals.total > 0 ? Math.round(d.value / totals.total * 100) : 0}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados no período</div>
          )}
        </div>
      </div>

      {/* By client */}
      {byClient.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-4">Faturamento por Cliente — período selecionado</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, byClient.length * 36)}>
            <BarChart data={byClient} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="faturado" name="Faturado" fill="#16a34a" radius={[0,3,3,0]} />
              <Bar dataKey="a_confirmar" name="A Confirmar" fill="#facc15" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        * Cálculo: {HORAS_POR_TURNO}h/turno × valor/hora do cliente. Agendas "Não Faturado" não são contabilizadas na Previsão Financeira nem em A Confirmar.
      </p>
    </div>
  );
}