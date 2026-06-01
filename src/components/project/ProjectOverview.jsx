import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Save, Calendar, Users, Target, Shield } from 'lucide-react';
import { FASES_PROJETO, STATUS_PROJETO, SAUDE_COLORS } from '@/lib/constants';
import HealthBadge from '@/components/shared/HealthBadge';

export default function ProjectOverview({ project, client, onUpdate }) {
  const [form, setForm] = useState({ ...project });
  const [dirty, setDirty] = useState(false);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = () => {
    onUpdate(form);
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Target className="w-4 h-4" /> Progresso
          </div>
          <div className="text-2xl font-bold">{form.percentual_progresso || 0}%</div>
          <Progress value={form.percentual_progresso || 0} className="h-1.5 mt-2" />
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Calendar className="w-4 h-4" /> Prazo
          </div>
          <div className="text-sm font-medium">{form.data_inicio || '-'}</div>
          <div className="text-xs text-muted-foreground">até {form.data_prevista_termino || '-'}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Shield className="w-4 h-4" /> Risco
          </div>
          <div className="text-sm font-medium capitalize">{form.risco_geral || 'Baixo'}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
            <Users className="w-4 h-4" /> Horas
          </div>
          <div className="text-sm font-medium">{form.horas_realizadas || 0} / {form.horas_previstas || 0}h</div>
          <div className="text-xs text-muted-foreground">
            {form.horas_previstas > 0
              ? `${Math.round((form.horas_realizadas || 0) / form.horas_previstas * 100)}% consumido`
              : 'Sem estimativa'
            }
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Dados do Projeto</h3>
          {dirty && (
            <Button onClick={handleSave} size="sm" className="gap-2">
              <Save className="w-4 h-4" /> Salvar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><Label>Nome</Label><Input value={form.name || ''} onChange={(e) => update('name', e.target.value)} /></div>
          <div><Label>Gerente do Projeto</Label><Input value={form.gerente_projeto || ''} onChange={(e) => update('gerente_projeto', e.target.value)} /></div>
          <div><Label>Patrocinador</Label><Input value={form.patrocinador || ''} onChange={(e) => update('patrocinador', e.target.value)} /></div>
          <div><Label>Coordenador (Cliente)</Label><Input value={form.coordenador_cliente || ''} onChange={(e) => update('coordenador_cliente', e.target.value)} /></div>
          <div><Label>Facilitador</Label><Input value={form.facilitador || ''} onChange={(e) => update('facilitador', e.target.value)} /></div>
          <div><Label>Responsável TI</Label><Input value={form.responsavel_ti || ''} onChange={(e) => update('responsavel_ti', e.target.value)} /></div>
          <div>
            <Label>Fase Atual</Label>
            <Select value={form.fase_atual} onValueChange={(v) => update('fase_atual', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FASES_PROJETO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUS_PROJETO.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Saúde</Label>
            <Select value={form.saude} onValueChange={(v) => update('saude', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="verde">Verde - Saudável</SelectItem>
                <SelectItem value="amarelo">Amarelo - Atenção</SelectItem>
                <SelectItem value="vermelho">Vermelho - Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Progresso (%)</Label>
            <Input type="number" min={0} max={100} value={form.percentual_progresso || 0} onChange={(e) => update('percentual_progresso', parseInt(e.target.value) || 0)} />
          </div>
          <div><Label>Data Início</Label><Input type="date" value={form.data_inicio || ''} onChange={(e) => update('data_inicio', e.target.value)} /></div>
          <div><Label>Data Prevista Término</Label><Input type="date" value={form.data_prevista_termino || ''} onChange={(e) => update('data_prevista_termino', e.target.value)} /></div>
          <div><Label>Horas Previstas</Label><Input type="number" value={form.horas_previstas || ''} onChange={(e) => update('horas_previstas', parseFloat(e.target.value) || 0)} /></div>
          <div><Label>Tipo Implantação</Label>
            <Select value={form.tipo_implantacao || 'remota'} onValueChange={(v) => update('tipo_implantacao', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remota">Remota</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrida">Híbrida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Label>Observações</Label>
          <Textarea value={form.observacoes || ''} onChange={(e) => update('observacoes', e.target.value)} rows={3} />
        </div>
      </div>
    </div>
  );
}