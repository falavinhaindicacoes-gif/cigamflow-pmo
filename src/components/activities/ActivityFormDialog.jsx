import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_ATIVIDADE, TIPO_ATIVIDADE, CATEGORIA_ATIVIDADE, FASES_PROJETO } from '@/lib/constants';

const ORIGENS = [
  { value: 'reuniao', label: 'Reunião' },
  { value: 'agenda', label: 'Agenda' },
  { value: 'treinamento', label: 'Treinamento' },
  { value: 'homologacao', label: 'Homologação' },
  { value: 'status_report', label: 'Status Report' },
  { value: 'go_live', label: 'Go Live' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'interno', label: 'Interno' },
  { value: 'comite', label: 'Comitê' },
  { value: 'outro', label: 'Outro' },
];

const EMPTY = {
  titulo: '', descricao: '', project_id: '', fase_projeto: '', origem: 'interno',
  tipo: 'pendencia_interna', categoria: 'processo', prioridade: 'media',
  recorrencia: 'primeira_vez', responsavel: '', solicitante: '', consultor_vinculado: '',
  gerente_responsavel: '', prazo: '', status: 'aberto',
  acao_esperada: '', tratativa_realizada: '', causa_raiz: '',
  solucao_aplicada: '', observacoes: '',
};

export default function ActivityFormDialog({ open, onOpenChange, activity, projects, consultants, onSubmit, isLoading }) {
  const [form, setForm] = useState(EMPTY);

  const { data: gerentes = [] } = useQuery({
    queryKey: ['projectManagers'],
    queryFn: () => base44.entities.ProjectManager.list('name', 200),
  });

  useEffect(() => {
    if (activity) setForm({ ...EMPTY, ...activity });
    else setForm(EMPTY);
  }, [activity]);

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activity ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identification */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identificação</h4>
            <div><Label>Título *</Label><Input value={form.titulo} onChange={(e) => update('titulo', e.target.value)} required /></div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => update('descricao', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Projeto *</Label>
                <Select value={form.project_id} onValueChange={(v) => update('project_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fase do Projeto</Label>
                <Select value={form.fase_projeto} onValueChange={(v) => update('fase_projeto', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{FASES_PROJETO.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Classificação</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label>Origem</Label>
                <Select value={form.origem} onValueChange={(v) => update('origem', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORIGENS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => update('tipo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TIPO_ATIVIDADE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => update('categoria', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIA_ATIVIDADE.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.prioridade} onValueChange={(v) => update('prioridade', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recorrência</Label>
                <Select value={form.recorrencia} onValueChange={(v) => update('recorrencia', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primeira_vez">Primeira vez</SelectItem>
                    <SelectItem value="recorrente">Recorrente</SelectItem>
                    <SelectItem value="reincidente">Reincidente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Responsibility */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsabilidade</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => update('responsavel', e.target.value)} /></div>
              <div><Label>Solicitante</Label><Input value={form.solicitante} onChange={(e) => update('solicitante', e.target.value)} /></div>
              <div>
                <Label>Consultor Vinculado</Label>
                <Select value={form.consultor_vinculado || ''} onValueChange={(v) => update('consultor_vinculado', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {consultants.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gerente Responsável</Label>
                <Select value={form.gerente_responsavel || ''} onValueChange={(v) => update('gerente_responsavel', v)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {gerentes.filter(g => g.ativo).map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Control */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Controle</h4>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prazo</Label><Input type="date" value={form.prazo} onChange={(e) => update('prazo', e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUS_ATIVIDADE.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Execution */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Execução</h4>
            <div><Label>Ação Esperada</Label><Textarea value={form.acao_esperada} onChange={(e) => update('acao_esperada', e.target.value)} rows={2} /></div>
            <div><Label>Tratativa Realizada</Label><Textarea value={form.tratativa_realizada} onChange={(e) => update('tratativa_realizada', e.target.value)} rows={2} /></div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} rows={2} /></div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Salvando...' : (activity ? 'Salvar Alterações' : 'Criar Atividade')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}