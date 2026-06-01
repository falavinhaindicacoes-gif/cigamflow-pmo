import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, UserCog, Pencil, FolderKanban, Mail, Phone, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { ESPECIALIDADES } from '@/lib/constants';
import { Link } from 'react-router-dom';

const MODULOS_DISPONIVEIS = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'contabil', label: 'Contábil' },
  { value: 'fiscal', label: 'Fiscal' },
  { value: 'estoque', label: 'Estoque' },
  { value: 'compras', label: 'Compras' },
  { value: 'vendas', label: 'Vendas' },
  { value: 'producao', label: 'Produção' },
  { value: 'rh', label: 'RH' },
  { value: 'ti', label: 'TI' },
  { value: 'integracao', label: 'Integração' },
  { value: 'customizacao', label: 'Customização' },
  { value: 'folha_pagamento', label: 'Folha de Pagamento' },
  { value: 'ativo_fixo', label: 'Ativo Fixo' },
  { value: 'custos', label: 'Custos' },
  { value: 'planejamento', label: 'Planejamento' },
];

export default function Consultants() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: consultants = [], isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Consultant.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consultants'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consultant.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['consultants'] }); setEditing(null); },
  });

  const espLabel = (val) => ESPECIALIDADES.find(e => e.value === val)?.label || val;

  const getConsultantProjects = (cId) => {
    const projectIds = [...new Set(allocations.filter(a => a.consultant_id === cId && a.project_id).map(a => a.project_id))];
    return projectIds.map(pid => projects.find(p => p.id === pid)).filter(Boolean);
  };

  const filtered = consultants.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.funcao?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const ativos = consultants.filter(c => c.status === 'ativo').length;
  const selectedConsultant = selected ? consultants.find(c => c.id === selected) : null;
  const selectedProjects = selected ? getConsultantProjects(selected) : [];

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Consultores" description={`${consultants.length} consultores cadastrados`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Consultor
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={consultants.length} icon={UserCog} />
        <StatCard title="Ativos" value={ativos} icon={UserCog} />
        <StatCard title="Férias / Afastados" value={consultants.filter(c => c.status === 'ferias' || c.status === 'afastado').length} icon={UserCog} />
        <StatCard title="Inativos" value={consultants.filter(c => c.status === 'inativo').length} icon={UserCog} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, função ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="ferias">Férias</SelectItem>
            <SelectItem value="afastado">Afastado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de consultores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum consultor encontrado</div>
        ) : (
          filtered.map(consultant => {
            const modulos = consultant.modulos_habilitados || [];
            return (
              <div
                key={consultant.id}
                className={`bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer ${selected === consultant.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelected(selected === consultant.id ? null : consultant.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{consultant.name}</h3>
                    {consultant.funcao && <p className="text-xs text-muted-foreground">{consultant.funcao}</p>}
                    {consultant.especialidade_principal && (
                      <p className="text-xs text-muted-foreground">{espLabel(consultant.especialidade_principal)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditing(consultant); }} className="p-1.5 hover:bg-muted rounded-lg">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      consultant.status === 'ativo' ? 'bg-green-100 text-green-700' :
                      consultant.status === 'ferias' ? 'bg-blue-100 text-blue-700' :
                      consultant.status === 'afastado' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {consultant.status === 'ativo' ? 'Ativo' : consultant.status === 'ferias' ? 'Férias' : consultant.status === 'afastado' ? 'Afastado' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  {consultant.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {consultant.email}
                    </p>
                  )}
                  {consultant.telefone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {consultant.telefone}
                    </p>
                  )}
                </div>

                {modulos.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground mb-1">{modulos.length} módulo{modulos.length > 1 ? 's' : ''} habilitado{modulos.length > 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-1">
                      {modulos.slice(0, 3).map(m => {
                        const mod = MODULOS_DISPONIVEIS.find(x => x.value === m);
                        return <span key={m} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{mod?.label || m}</span>;
                      })}
                      {modulos.length > 3 && <span className="text-[10px] text-muted-foreground">+{modulos.length - 3}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detalhe do consultor selecionado */}
      {selectedConsultant && (
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedConsultant.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedConsultant.funcao}{selectedConsultant.funcao && selectedConsultant.especialidade_principal ? ' · ' : ''}{espLabel(selectedConsultant.especialidade_principal)}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(selectedConsultant)} className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'E-mail', value: selectedConsultant.email },
              { label: 'Telefone', value: selectedConsultant.telefone },
              { label: 'Gestor', value: selectedConsultant.gestor },
              { label: 'Especialidade', value: espLabel(selectedConsultant.especialidade_principal) },
              { label: 'Situação', value: selectedConsultant.status === 'ativo' ? 'Ativo' : selectedConsultant.status === 'ferias' ? 'Férias' : selectedConsultant.status === 'afastado' ? 'Afastado' : 'Inativo' },
            ].filter(r => r.value).map(r => (
              <div key={r.label} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="text-sm font-medium mt-0.5">{r.value}</p>
              </div>
            ))}
          </div>

          {/* Módulos habilitados */}
          {(selectedConsultant.modulos_habilitados || []).length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm mb-2">Módulos Habilitados</h4>
              <div className="flex flex-wrap gap-2">
                {(selectedConsultant.modulos_habilitados || []).map(m => {
                  const mod = MODULOS_DISPONIVEIS.find(x => x.value === m);
                  return (
                    <span key={m} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                      {mod?.label || m}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {selectedConsultant.observacoes && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="text-sm mt-0.5">{selectedConsultant.observacoes}</p>
            </div>
          )}

          {/* Projetos vinculados */}
          <h4 className="font-semibold text-sm mb-2">Projetos Vinculados</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto vinculado</p>
            ) : (
              selectedProjects.map(p => (
                <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{p.name}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    p.status === 'em_andamento' ? 'bg-green-100 text-green-700' :
                    p.status === 'concluido' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {p.status === 'em_andamento' ? 'Em andamento' : p.status === 'concluido' ? 'Concluído' : p.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Consultor</DialogTitle></DialogHeader>
          <ConsultantForm onSubmit={d => createMutation.mutate(d)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Consultor</DialogTitle></DialogHeader>
          {editing && (
            <ConsultantForm
              initial={editing}
              onSubmit={d => updateMutation.mutate({ id: editing.id, data: d })}
              isLoading={updateMutation.isPending}
              submitLabel="Salvar Alterações"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsultantForm({ onSubmit, isLoading, initial = {}, submitLabel = 'Cadastrar Consultor' }) {
  const [form, setForm] = useState({
    name: initial.name || '',
    email: initial.email || '',
    telefone: initial.telefone || '',
    funcao: initial.funcao || '',
    especialidade_principal: initial.especialidade_principal || 'geral',
    modulos_habilitados: initial.modulos_habilitados || [],
    status: initial.status || 'ativo',
    gestor: initial.gestor || '',
    observacoes: initial.observacoes || '',
  });

  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const toggleModulo = (value) => {
    setForm(p => ({
      ...p,
      modulos_habilitados: p.modulos_habilitados.includes(value)
        ? p.modulos_habilitados.filter(m => m !== value)
        : [...p.modulos_habilitados, value],
    }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><Label>Nome *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>E-mail</Label><Input value={form.email} onChange={e => u('email', e.target.value)} /></div>
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => u('telefone', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Função / Cargo</Label><Input value={form.funcao} onChange={e => u('funcao', e.target.value)} /></div>
        <div><Label>Gestor</Label><Input value={form.gestor} onChange={e => u('gestor', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Especialidade Principal</Label>
          <Select value={form.especialidade_principal} onValueChange={v => u('especialidade_principal', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ESPECIALIDADES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => u('status', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="ferias">Férias</SelectItem>
              <SelectItem value="afastado">Afastado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Módulos habilitados */}
      <div>
        <Label>Módulos Habilitados</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {MODULOS_DISPONIVEIS.map(mod => {
            const checked = form.modulos_habilitados.includes(mod.value);
            return (
              <button
                key={mod.value}
                type="button"
                onClick={() => toggleModulo(mod.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                  checked ? 'bg-primary/10 border-primary/30 text-primary font-medium' : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {checked ? <CheckSquare className="w-4 h-4 flex-shrink-0" /> : <Square className="w-4 h-4 flex-shrink-0" />}
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>

      <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => u('observacoes', e.target.value)} rows={2} /></div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : submitLabel}</Button>
    </form>
  );
}