import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowCreate(false);
    },
  });

  const filtered = clients.filter(c =>
    !search || c.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
    c.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
    c.cnpj?.includes(search)
  );

  return (
    <div className="space-y-6 lg:pl-0 pl-12">
      <PageHeader title="Clientes" description={`${clients.length} clientes cadastrados`}>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por razão social, nome fantasia ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Nenhum cliente encontrado</div>
        ) : (
          filtered.map((client) => (
            <div key={client.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm truncate">{client.razao_social}</h3>
                  {client.nome_fantasia && <p className="text-xs text-muted-foreground">{client.nome_fantasia}</p>}
                  {client.cnpj && <p className="text-xs text-muted-foreground mt-1">{client.cnpj}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  client.situacao === 'ativo' ? 'bg-green-100 text-green-700' :
                  client.situacao === 'inativo' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {client.situacao === 'ativo' ? 'Ativo' : client.situacao === 'inativo' ? 'Inativo' : 'Prospecção'}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                {client.contato_principal && <p className="text-xs text-muted-foreground">{client.contato_principal}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {client.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{client.telefone}</span>}
                  {client.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{client.email}</span>}
                </div>
                {client.municipio && <p className="text-xs text-muted-foreground">{client.municipio}{client.uf ? ` - ${client.uf}` : ''}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateClientDialog open={showCreate} onOpenChange={setShowCreate} onSubmit={(d) => createMutation.mutate(d)} isLoading={createMutation.isPending} />
    </div>
  );
}

function CreateClientDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [form, setForm] = useState({ razao_social: '', nome_fantasia: '', cnpj: '', municipio: '', uf: '', segmento: '', regime_tributario: 'presumido', contato_principal: '', telefone: '', email: '', situacao: 'ativo', observacoes: '' });
  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
          <div><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => update('razao_social', e.target.value)} required /></div>
          <div><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => update('nome_fantasia', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => update('cnpj', e.target.value)} /></div>
            <div><Label>UF</Label><Input value={form.uf} onChange={(e) => update('uf', e.target.value)} /></div>
          </div>
          <div><Label>Município</Label><Input value={form.municipio} onChange={(e) => update('municipio', e.target.value)} /></div>
          <div><Label>Segmento</Label><Input value={form.segmento} onChange={(e) => update('segmento', e.target.value)} /></div>
          <div><Label>Contato Principal</Label><Input value={form.contato_principal} onChange={(e) => update('contato_principal', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => update('telefone', e.target.value)} /></div>
            <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
          </div>
          <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => update('observacoes', e.target.value)} rows={2} /></div>
          <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Cadastrar Cliente'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}