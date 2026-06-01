import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Building2, Phone, Mail, Pencil, FolderKanban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import { Link } from 'react-router-dom';

const REGIME_OPTIONS = [
  { value: 'real', label: 'Lucro Real' },
  { value: 'presumido', label: 'Lucro Presumido' },
  { value: 'simples', label: 'Simples Nacional' },
  { value: 'mei', label: 'MEI' },
];

export default function Clients() {
  const [search, setSearch] = useState('');
  const [filterSituacao, setFilterSituacao] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['clients'] }); setSelected(null); },
  });

  const getClientProjects = (clientId) => projects.filter(p => p.client_id === clientId);

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      c.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) || c.cnpj?.includes(search);
    const matchSituacao = filterSituacao === 'all' || c.situacao === filterSituacao;
    return matchSearch && matchSituacao;
  });

  const ativos = clients.filter(c => c.situacao === 'ativo').length;
  const comProjeto = clients.filter(c => getClientProjects(c.id).some(p => p.status === 'em_andamento')).length;
  const selectedClient = selected ? clients.find(c => c.id === selected) : null;
  const selectedProjects = selected ? getClientProjects(selected) : [];

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Clientes" description={`${clients.length} clientes cadastrados`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={clients.length} icon={Building2} />
        <StatCard title="Ativos" value={ativos} icon={Building2} />
        <StatCard title="Com Projeto Ativo" value={comProjeto} icon={FolderKanban} />
        <StatCard title="Prospecção" value={clients.filter(c => c.situacao === 'prospeccao').length} icon={Building2} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por razão social, nome fantasia ou CNPJ..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterSituacao} onValueChange={setFilterSituacao}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
            <SelectItem value="prospeccao">Prospecção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum cliente encontrado</div>
        ) : (
          filtered.map(client => {
            const clientProjects = getClientProjects(client.id);
            const activeProjects = clientProjects.filter(p => p.status === 'em_andamento');
            return (
              <div
                key={client.id}
                className={`bg-card border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer ${selected === client.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelected(selected === client.id ? null : client.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{client.razao_social}</h3>
                    {client.nome_fantasia && <p className="text-xs text-muted-foreground">{client.nome_fantasia}</p>}
                    {client.cnpj && <p className="text-xs text-muted-foreground mt-1">{client.cnpj}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); setEditing(client); }} className="p-1.5 hover:bg-muted rounded-lg">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); if (confirm(`Excluir o cliente "${client.razao_social}"? Esta ação não pode ser desfeita.`)) deleteMutation.mutate(client.id); }} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      client.situacao === 'ativo' ? 'bg-green-100 text-green-700' :
                      client.situacao === 'inativo' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {client.situacao === 'ativo' ? 'Ativo' : client.situacao === 'inativo' ? 'Inativo' : 'Prospecção'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  {client.contato_principal && <p className="text-xs text-muted-foreground">{client.contato_principal}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {client.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.telefone}</span>}
                    {client.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 flex-shrink-0" /><span className="truncate">{client.email}</span></span>}
                  </div>
                  {client.municipio && <p className="text-xs text-muted-foreground">{client.municipio}{client.uf ? ` - ${client.uf}` : ''}</p>}
                </div>
                {activeProjects.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-[10px] text-muted-foreground mb-1">{activeProjects.length} projeto{activeProjects.length > 1 ? 's' : ''} ativo{activeProjects.length > 1 ? 's' : ''}</p>
                    <div className="flex flex-wrap gap-1">
                      {activeProjects.slice(0, 2).map(p => (
                        <span key={p.id} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full truncate max-w-[130px]">{p.name}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detalhe do cliente selecionado */}
      {selectedClient && (
        <div className="bg-card border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">{selectedClient.razao_social}</h3>
            <Button size="sm" variant="outline" onClick={() => setEditing(selectedClient)} className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'CNPJ', value: selectedClient.cnpj },
              { label: 'Município/UF', value: selectedClient.municipio ? `${selectedClient.municipio}/${selectedClient.uf}` : '-' },
              { label: 'Segmento', value: selectedClient.segmento },
              { label: 'Regime Tributário', value: REGIME_OPTIONS.find(r => r.value === selectedClient.regime_tributario)?.label },
              { label: 'Grupo Econômico', value: selectedClient.grupo_economico },
              { label: 'Origem', value: selectedClient.origem },
              { label: 'Vendedor', value: selectedClient.vendedor_responsavel },
              { label: 'Contato', value: selectedClient.contato_principal },
            ].map(r => r.value ? (
              <div key={r.label} className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">{r.label}</p>
                <p className="text-sm font-medium mt-0.5">{r.value}</p>
              </div>
            ) : null)}
          </div>

          <h4 className="font-semibold text-sm mb-2">Projetos</h4>
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
                  }`}>{p.status === 'em_andamento' ? 'Em andamento' : p.status === 'concluido' ? 'Concluído' : p.status}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
          <ClientForm onSubmit={d => createMutation.mutate(d)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={v => { if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Cliente</DialogTitle></DialogHeader>
          {editing && (
            <ClientForm
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

function ClientForm({ onSubmit, isLoading, initial = {}, submitLabel = 'Cadastrar Cliente' }) {
  const [form, setForm] = useState({
    razao_social: initial.razao_social || '',
    nome_fantasia: initial.nome_fantasia || '',
    cnpj: initial.cnpj || '',
    municipio: initial.municipio || '',
    uf: initial.uf || '',
    segmento: initial.segmento || '',
    regime_tributario: initial.regime_tributario || 'presumido',
    contato_principal: initial.contato_principal || '',
    telefone: initial.telefone || '',
    email: initial.email || '',
    grupo_economico: initial.grupo_economico || '',
    situacao: initial.situacao || 'ativo',
    origem: initial.origem || '',
    vendedor_responsavel: initial.vendedor_responsavel || '',
    observacoes: initial.observacoes || '',
    valor_hora: initial.valor_hora || '',
  });
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><Label>Razão Social *</Label><Input value={form.razao_social} onChange={e => u('razao_social', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={e => u('nome_fantasia', e.target.value)} /></div>
        <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => u('cnpj', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Município</Label><Input value={form.municipio} onChange={e => u('municipio', e.target.value)} /></div>
        <div><Label>UF</Label><Input value={form.uf} onChange={e => u('uf', e.target.value)} maxLength={2} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Segmento</Label><Input value={form.segmento} onChange={e => u('segmento', e.target.value)} /></div>
        <div>
          <Label>Regime Tributário</Label>
          <Select value={form.regime_tributario} onValueChange={v => u('regime_tributario', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REGIME_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Contato Principal</Label><Input value={form.contato_principal} onChange={e => u('contato_principal', e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => u('telefone', e.target.value)} /></div>
        <div><Label>E-mail</Label><Input value={form.email} onChange={e => u('email', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Grupo Econômico</Label><Input value={form.grupo_economico} onChange={e => u('grupo_economico', e.target.value)} /></div>
        <div><Label>Origem</Label><Input value={form.origem} onChange={e => u('origem', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Vendedor Responsável</Label><Input value={form.vendedor_responsavel} onChange={e => u('vendedor_responsavel', e.target.value)} /></div>
        <div>
          <Label>Situação</Label>
          <Select value={form.situacao} onValueChange={v => u('situacao', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="prospeccao">Prospecção</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Valor da Hora (R$)</Label>
        <Input type="number" min="0" step="0.01" placeholder="0,00" value={form.valor_hora} onChange={e => u('valor_hora', parseFloat(e.target.value) || 0)} />
      </div>
      <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => u('observacoes', e.target.value)} rows={2} /></div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : submitLabel}</Button>
    </form>
  );
}