import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Building2, Users, Shield, Plus, Search, Pencil, Check, X, AlertCircle, Tag, Trash2
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function Settings() {
  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Configurações" description="Gestão de empresas, usuários e parâmetros do sistema" />

      <Tabs defaultValue="empresas">
        <TabsList className="bg-muted/50 p-1 h-auto">
          <TabsTrigger value="empresas" className="text-xs">Empresas</TabsTrigger>
          <TabsTrigger value="usuarios" className="text-xs">Usuários</TabsTrigger>
          <TabsTrigger value="parametros" className="text-xs">Parâmetros</TabsTrigger>
          <TabsTrigger value="categorias" className="text-xs">Categorias de Template</TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="mt-4">
          <EmpresasTab />
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <UsuariosTab />
        </TabsContent>

        <TabsContent value="parametros" className="mt-4">
          <ParametrosTab />
        </TabsContent>

        <TabsContent value="categorias" className="mt-4">
          <CategoriasTemplateTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmpresasTab() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['companies'] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['companies'] }),
  });

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? <p className="text-muted-foreground">Carregando...</p> :
          filtered.map(company => (
            <div key={company.id} className="bg-card border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{company.name}</h3>
                  {company.cnpj && <p className="text-xs text-muted-foreground">{company.cnpj}</p>}
                  {company.city && <p className="text-xs text-muted-foreground">{company.city}{company.state ? ` - ${company.state}` : ''}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {company.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              {company.notes && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{company.notes}</p>}
            </div>
          ))
        }
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
          <CompanyForm onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CompanyForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({ name: '', cnpj: '', city: '', state: '', segment: '', status: 'active', notes: '' });
  const u = (f, v) => setForm(p => ({ ...p, [f]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><Label>Nome da Empresa *</Label><Input value={form.name} onChange={e => u('name', e.target.value)} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => u('cnpj', e.target.value)} /></div>
        <div><Label>Segmento</Label><Input value={form.segment} onChange={e => u('segment', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Cidade</Label><Input value={form.city} onChange={e => u('city', e.target.value)} /></div>
        <div><Label>UF</Label><Input value={form.state} onChange={e => u('state', e.target.value)} maxLength={2} /></div>
      </div>
      <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => u('notes', e.target.value)} rows={2} /></div>
      <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Criar Empresa'}</Button>
    </form>
  );
}

function UsuariosTab() {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
  });

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteResult(null);
    try {
      await base44.users.inviteUser(inviteEmail, inviteRole);
      setInviteResult({ ok: true, msg: `Convite enviado para ${inviteEmail}` });
      setInviteEmail('');
    } catch (err) {
      setInviteResult({ ok: false, msg: 'Erro ao enviar convite. Verifique o e-mail.' });
    }
    setInviting(false);
  };

  const ROLE_LABELS = {
    admin: 'Administrador',
    user: 'Usuário',
    pmo: 'PMO / Coordenação',
    gerente: 'Gerente de Projeto',
    consultor: 'Consultor',
    diretoria: 'Diretoria',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
        <Button onClick={() => setShowInvite(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Convidar Usuário
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nome</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">E-mail</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Perfil</th>
              <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Carregando...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-muted/20">
                <td className="py-3 px-4 font-medium">{u.full_name || '-'}</td>
                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                <td className="py-3 px-4">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {ROLE_LABELS[u.role] || u.role || 'Usuário'}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-muted-foreground">
                  {u.created_date ? new Date(u.created_date).toLocaleDateString('pt-BR') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showInvite} onOpenChange={v => { setShowInvite(v); setInviteResult(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Convidar Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div><Label>E-mail</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required placeholder="usuario@empresa.com" /></div>
            <div>
              <Label>Perfil</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${inviteResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {inviteResult.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {inviteResult.msg}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={inviting}>{inviting ? 'Enviando...' : 'Enviar Convite'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoriasTemplateTab() {
  const [newName, setNewName] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['templateCategories'],
    queryFn: () => base44.entities.TemplateCategory.list('ordem', 200),
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.TemplateCategory.create({ name, ordem: categories.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templateCategories'] }); setNewName(''); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TemplateCategory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templateCategories'] }),
  });

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-card border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tag className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Categorias de Template</h3>
            <p className="text-xs text-muted-foreground">Categorias disponíveis na criação de templates</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nova categoria..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) createMutation.mutate(newName.trim()); }}
          />
          <Button onClick={() => { if (newName.trim()) createMutation.mutate(newName.trim()); }} disabled={!newName.trim() || createMutation.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-lg">
              <span className="text-sm">{cat.name}</span>
              <button
                onClick={() => { if (confirm(`Excluir a categoria "${cat.name}"?`)) deleteMutation.mutate(cat.id); }}
                className="p-1 hover:text-destructive text-muted-foreground rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {!isLoading && categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ParametrosTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Regras de Saúde</h3>
              <p className="text-xs text-muted-foreground">Configure os critérios de semáforo</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Itens críticos para vermelho', value: '1' },
              { label: 'Dias de atraso para amarelo', value: '3' },
              { label: 'Dias de atraso para vermelho', value: '7' },
              { label: 'Bloqueios para vermelho', value: '1' },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{p.label}</span>
                <Input className="w-16 h-7 text-xs text-center" defaultValue={p.value} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Travas do Workflow</h3>
              <p className="text-xs text-muted-foreground">Controle de avanço de fase</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Exigir Termo de Abertura aprovado', defaultChecked: true },
              { label: 'Exigir Plano de Projeto aprovado', defaultChecked: true },
              { label: 'Bloquear Go Live sem Termo Comprometimento', defaultChecked: true },
              { label: 'Exigir Lições Aprendidas no encerramento', defaultChecked: false },
            ].map(p => (
              <label key={p.label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={p.defaultChecked} className="w-4 h-4 rounded" />
                <span className="text-xs text-muted-foreground">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Alertas de Capacidade</h3>
              <p className="text-xs text-muted-foreground">Limites do semáforo de consultor</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Amarelo acima de (%)', value: '80' },
              { label: 'Vermelho acima de (%)', value: '100' },
            ].map(p => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{p.label}</span>
                <Input className="w-16 h-7 text-xs text-center" defaultValue={p.value} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Notificações</h3>
              <p className="text-xs text-muted-foreground">Eventos que geram alertas</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Item atrasado', defaultChecked: true },
              { label: 'Bloqueio criado', defaultChecked: true },
              { label: 'Prazo em 3 dias', defaultChecked: true },
              { label: 'Projeto vermelho', defaultChecked: true },
              { label: 'Sobrecarga de consultor', defaultChecked: false },
            ].map(p => (
              <label key={p.label} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={p.defaultChecked} className="w-4 h-4 rounded" />
                <span className="text-xs text-muted-foreground">{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2"><Check className="w-4 h-4" /> Salvar Configurações</Button>
      </div>
    </div>
  );
}