import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Save, CheckCircle, Plus, Trash2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { generateDocumentPDF } from '@/components/documents/PdfGenerator';

const DOC_LABELS = {
  dados_iniciais: 'Dados Iniciais / Proposta',
  termo_abertura: 'Termo de Abertura',
  plano_projeto: 'Plano de Projeto',
  termo_comprometimento: 'Termo de Comprometimento',
  termo_encerramento: 'Termo de Encerramento',
  licoes_aprendidas: 'Lições Aprendidas',
};

export default function DocumentForm({ projectId, tipo, docId, onClose }) {
  const queryClient = useQueryClient();
  const [conteudo, setConteudo] = useState({});
  const [status, setStatus] = useState('rascunho');

  const { data: existingDoc } = useQuery({
    queryKey: ['document', projectId, tipo],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId, tipo }),
    enabled: !!projectId && !!tipo,
  });

  const { data: projectData } = useQuery({
    queryKey: ['document-project', projectId],
    queryFn: () => base44.entities.Project.list().then(ps => ps.find(p => p.id === projectId)),
    enabled: !!projectId,
  });
  const projectName = projectData?.name || '';

  const doc = existingDoc?.[0];

  useEffect(() => {
    if (doc) {
      setConteudo(doc.conteudo || {});
      setStatus(doc.status || 'rascunho');
    }
  }, [doc]);

  const saveMutation = useMutation({
    mutationFn: (data) => doc
      ? base44.entities.ProjectDocument.update(doc.id, data)
      : base44.entities.ProjectDocument.create({ project_id: projectId, tipo, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['document', projectId, tipo] });
    },
  });

  const up = (field, value) => setConteudo(prev => ({ ...prev, [field]: value }));
  const handleSave = () => saveMutation.mutate({ conteudo, status });

  const updateList = (field, index, key, value) => {
    const list = [...(conteudo[field] || [])];
    list[index] = { ...list[index], [key]: value };
    up(field, list);
  };
  const addItem = (field, template) => up(field, [...(conteudo[field] || []), template]);
  const removeItem = (field, index) => {
    const list = [...(conteudo[field] || [])];
    list.splice(index, 1);
    up(field, list);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-bold text-lg">{DOC_LABELS[tipo] || tipo}</h2>
            <p className="text-xs text-muted-foreground">Projeto #{projectId?.slice(-6)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="pendente_aprovacao">Pendente Aprovação</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => generateDocumentPDF(tipo, conteudo, projectName)} className="gap-2">
            <FileDown className="w-4 h-4" />
            Baixar PDF
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {tipo === 'dados_iniciais' && <DadosIniciaisForm conteudo={conteudo} up={up} updateList={updateList} addItem={addItem} removeItem={removeItem} />}
      {tipo === 'termo_abertura' && <TermoAberturaForm conteudo={conteudo} up={up} updateList={updateList} addItem={addItem} removeItem={removeItem} />}
      {tipo === 'plano_projeto' && <PlanoProjetoForm conteudo={conteudo} up={up} updateList={updateList} addItem={addItem} removeItem={removeItem} />}
      {tipo === 'termo_comprometimento' && <TermoComprometimentoForm conteudo={conteudo} up={up} updateList={updateList} addItem={addItem} removeItem={removeItem} />}
      {tipo === 'termo_encerramento' && <TermoEncerramentoForm conteudo={conteudo} up={up} updateList={updateList} addItem={addItem} removeItem={removeItem} />}
      {tipo === 'licoes_aprendidas' && <LicoesAprendidasForm conteudo={conteudo} up={up} />}
    </div>
  );
}

// ========== SECTION WRAPPER ==========
function Section({ title, children }) {
  return (
    <div className="bg-card border rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-base border-b pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="mb-1 block text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}

function Grid({ cols = 2, children }) {
  return <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}>{children}</div>;
}

function DynamicList({ label, items = [], onAdd, onRemove, renderItem }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-medium">{label}</Label>
        <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs gap-1">
          <Plus className="w-3 h-3" /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start bg-muted/40 rounded-lg p-3">
            <div className="flex-1">{renderItem(item, i)}</div>
            <button onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive mt-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== DADOS INICIAIS ==========
function DadosIniciaisForm({ conteudo, up, updateList, addItem, removeItem }) {
  return (
    <div className="space-y-4">
      <Section title="Seção 1 — Dados do Cliente">
        <Grid cols={2}>
          <Field label="Vendedor CIGAM"><Input value={conteudo.vendedor_cigam || ''} onChange={e => up('vendedor_cigam', e.target.value)} /></Field>
          <Field label="Data do Questionário"><Input type="date" value={conteudo.data_questionario || ''} onChange={e => up('data_questionario', e.target.value)} /></Field>
          <Field label="Razão Social"><Input value={conteudo.razao_social || ''} onChange={e => up('razao_social', e.target.value)} /></Field>
          <Field label="CNPJ"><Input value={conteudo.cnpj || ''} onChange={e => up('cnpj', e.target.value)} /></Field>
          <Field label="Município"><Input value={conteudo.municipio || ''} onChange={e => up('municipio', e.target.value)} /></Field>
          <Field label="UF"><Input value={conteudo.uf || ''} onChange={e => up('uf', e.target.value)} /></Field>
          <Field label="Pessoa de Contato"><Input value={conteudo.contato || ''} onChange={e => up('contato', e.target.value)} /></Field>
          <Field label="Telefone"><Input value={conteudo.telefone || ''} onChange={e => up('telefone', e.target.value)} /></Field>
          <Field label="E-mail" ><Input value={conteudo.email || ''} onChange={e => up('email', e.target.value)} /></Field>
        </Grid>
      </Section>

      <Section title="Seção 3 — Informações Estratégicas">
        <Field label="Faturamento Anual do Grupo Econômico"><Input value={conteudo.faturamento_anual || ''} onChange={e => up('faturamento_anual', e.target.value)} /></Field>
        <Field label="Como o cliente chegou até a CIGAM?"><Textarea value={conteudo.como_chegou || ''} onChange={e => up('como_chegou', e.target.value)} rows={2} /></Field>
        <Field label="O que motivou a troca de sistema?"><Textarea value={conteudo.motivou_troca || ''} onChange={e => up('motivou_troca', e.target.value)} rows={2} /></Field>
        <Field label="Expectativas com o novo ERP"><Textarea value={conteudo.expectativas || ''} onChange={e => up('expectativas', e.target.value)} rows={2} /></Field>
        <Field label="Sistema de Gestão Atual"><Input value={conteudo.sistema_atual || ''} onChange={e => up('sistema_atual', e.target.value)} /></Field>
      </Section>

      <Section title="Seção 4 — Informações Gerais do Projeto">
        <Grid cols={2}>
          <Field label="Número de Usuários Simultâneos"><Input type="number" value={conteudo.num_usuarios || ''} onChange={e => up('num_usuarios', e.target.value)} /></Field>
          <Field label="Proposta">
            <Select value={conteudo.proposta || ''} onValueChange={v => up('proposta', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="iNOVA">iNOVA</SelectItem>
                <SelectItem value="iNOVA START">iNOVA START</SelectItem>
                <SelectItem value="Super iNOVA">Super iNOVA</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Banco de Dados">
            <Select value={conteudo.banco_dados || ''} onValueChange={v => up('banco_dados', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SQL">SQL Server</SelectItem>
                <SelectItem value="Oracle">Oracle</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo de Implementação">
            <Select value={conteudo.tipo_implementacao || ''} onValueChange={v => up('tipo_implementacao', v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="remota">Remota</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="hibrida">Híbrida</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Grid>
        <Grid cols={2}>
          <div className="flex items-center gap-3">
            <Switch checked={conteudo.possui_ti_interna || false} onCheckedChange={v => up('possui_ti_interna', v)} />
            <Label>Possui TI Interna?</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={conteudo.fluxos_documentados || false} onCheckedChange={v => up('fluxos_documentados', v)} />
            <Label>Fluxos Operacionais Documentados?</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={conteudo.necessita_customizacao || false} onCheckedChange={v => up('necessita_customizacao', v)} />
            <Label>Necessita Customização/Integração?</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={conteudo.haverá_importacao || false} onCheckedChange={v => up('haverá_importacao', v)} />
            <Label>Haverá Importação de Dados?</Label>
          </div>
        </Grid>
        <Field label="Observações Gerais sobre o Cliente"><Textarea value={conteudo.observacoes || ''} onChange={e => up('observacoes', e.target.value)} rows={3} /></Field>
        <Field label="Data do Fechamento da Venda"><Input type="date" value={conteudo.data_fechamento || ''} onChange={e => up('data_fechamento', e.target.value)} /></Field>
      </Section>
    </div>
  );
}

// ========== TERMO DE ABERTURA ==========
function TermoAberturaForm({ conteudo, up, updateList, addItem, removeItem }) {
  return (
    <div className="space-y-4">
      <Section title="Seção 1 — Designação do Gerente de Projeto">
        <Grid cols={2}>
          <Field label="Nome do Gerente Designado"><Input value={conteudo.gerente_nome || ''} onChange={e => up('gerente_nome', e.target.value)} /></Field>
          <Field label="Data da Designação"><Input type="date" value={conteudo.data_designacao || ''} onChange={e => up('data_designacao', e.target.value)} /></Field>
        </Grid>
        <Field label="Descrição da Designação"><Textarea value={conteudo.descricao_designacao || ''} onChange={e => up('descricao_designacao', e.target.value)} rows={3} /></Field>
      </Section>

      <Section title="Seção 4 — Objetivos do Projeto">
        <Field label="Objetivos Principais"><Textarea value={conteudo.objetivos || ''} onChange={e => up('objetivos', e.target.value)} rows={4} placeholder="Implantação do ERP, implementação dos módulos..." /></Field>
      </Section>

      <Section title="Seção 5 — Premissas e Restrições">
        <DynamicList
          label="Premissas"
          items={conteudo.premissas || []}
          onAdd={() => addItem('premissas', { descricao: '' })}
          onRemove={(i) => removeItem('premissas', i)}
          renderItem={(item, i) => (
            <Input placeholder="Descrição da premissa" value={item.descricao || ''} onChange={e => updateList('premissas', i, 'descricao', e.target.value)} />
          )}
        />
        <DynamicList
          label="Restrições"
          items={conteudo.restricoes || []}
          onAdd={() => addItem('restricoes', { descricao: '' })}
          onRemove={(i) => removeItem('restricoes', i)}
          renderItem={(item, i) => (
            <Input placeholder="Descrição da restrição" value={item.descricao || ''} onChange={e => updateList('restricoes', i, 'descricao', e.target.value)} />
          )}
        />
      </Section>

      <Section title="Seção 6 — Prazos e Investimentos">
        <Grid cols={2}>
          <Field label="Estimativa de Entrega"><Input type="date" value={conteudo.estimativa_entrega || ''} onChange={e => up('estimativa_entrega', e.target.value)} /></Field>
          <Field label="Investimento Estimado (R$)"><Input type="number" value={conteudo.investimento_estimado || ''} onChange={e => up('investimento_estimado', e.target.value)} /></Field>
        </Grid>
      </Section>

      <Section title="Seção 7 — Pessoas Envolvidas">
        <DynamicList
          label="Participantes"
          items={conteudo.pessoas_envolvidas || []}
          onAdd={() => addItem('pessoas_envolvidas', { nome: '', cargo: '', empresa: '' })}
          onRemove={(i) => removeItem('pessoas_envolvidas', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Nome" value={item.nome || ''} onChange={e => updateList('pessoas_envolvidas', i, 'nome', e.target.value)} />
              <Input placeholder="Cargo/Função" value={item.cargo || ''} onChange={e => updateList('pessoas_envolvidas', i, 'cargo', e.target.value)} />
              <Input placeholder="Empresa" value={item.empresa || ''} onChange={e => updateList('pessoas_envolvidas', i, 'empresa', e.target.value)} />
            </div>
          )}
        />
      </Section>

      <Section title="Seção 8 — Principais Fases / Marcos">
        <DynamicList
          label="Marcos do Projeto"
          items={conteudo.marcos || []}
          onAdd={() => addItem('marcos', { fase: '', data_prevista: '' })}
          onRemove={(i) => removeItem('marcos', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Fase / Marco" value={item.fase || ''} onChange={e => updateList('marcos', i, 'fase', e.target.value)} />
              <Input type="date" value={item.data_prevista || ''} onChange={e => updateList('marcos', i, 'data_prevista', e.target.value)} />
            </div>
          )}
        />
      </Section>

      <Section title="Seção 9 — Aprovações">
        <Grid cols={2}>
          <Field label="Coordenador"><Input value={conteudo.aprov_coordenador || ''} onChange={e => up('aprov_coordenador', e.target.value)} /></Field>
          <Field label="Gerente do Projeto"><Input value={conteudo.aprov_gerente || ''} onChange={e => up('aprov_gerente', e.target.value)} /></Field>
          <Field label="Patrocinador"><Input value={conteudo.aprov_patrocinador || ''} onChange={e => up('aprov_patrocinador', e.target.value)} /></Field>
          <Field label="Data de Aprovação"><Input type="date" value={conteudo.data_aprovacao || ''} onChange={e => up('data_aprovacao', e.target.value)} /></Field>
        </Grid>
      </Section>
    </div>
  );
}

// ========== PLANO DE PROJETO ==========
function PlanoProjetoForm({ conteudo, up, updateList, addItem, removeItem }) {
  const PAPEIS = ['Gestor PMO', 'Gerente de Projeto', 'Consultor de Implementação', 'Analista de Negócios', 'Customizador', 'Patrocinador', 'Coordenador do Projeto', 'Usuário-Chave', 'Responsável TI', 'Facilitador'];
  return (
    <div className="space-y-4">
      <Section title="Seção I — Objetivo do Projeto">
        <Field label="Descrição do Objetivo"><Textarea value={conteudo.objetivo || ''} onChange={e => up('objetivo', e.target.value)} rows={4} /></Field>
      </Section>
      <Section title="Seção II — Justificativa / Expectativa">
        <Field label="Justificativa e Expectativas"><Textarea value={conteudo.justificativa || ''} onChange={e => up('justificativa', e.target.value)} rows={4} /></Field>
      </Section>
      <Section title="Seção IV — Escopo Detalhado">
        <Field label="Descrição do Escopo"><Textarea value={conteudo.escopo_descricao || ''} onChange={e => up('escopo_descricao', e.target.value)} rows={3} /></Field>
        <Grid cols={2}>
          <Field label="Módulos Incluídos"><Textarea value={conteudo.modulos_incluidos || ''} onChange={e => up('modulos_incluidos', e.target.value)} rows={3} /></Field>
          <Field label="Módulos Excluídos"><Textarea value={conteudo.modulos_excluidos || ''} onChange={e => up('modulos_excluidos', e.target.value)} rows={3} /></Field>
        </Grid>
      </Section>
      <Section title="Seção V — Cronograma Macro">
        <DynamicList
          label="Pacotes de Trabalho"
          items={conteudo.cronograma || []}
          onAdd={() => addItem('cronograma', { pacote: '', data_prevista: '', data_real: '', responsavel: '', status: '' })}
          onRemove={(i) => removeItem('cronograma', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Input placeholder="Pacote de trabalho" value={item.pacote || ''} onChange={e => updateList('cronograma', i, 'pacote', e.target.value)} />
              <Input type="date" placeholder="Data Prevista" value={item.data_prevista || ''} onChange={e => updateList('cronograma', i, 'data_prevista', e.target.value)} />
              <Input placeholder="Responsável" value={item.responsavel || ''} onChange={e => updateList('cronograma', i, 'responsavel', e.target.value)} />
              <Select value={item.status || ''} onValueChange={v => updateList('cronograma', i, 'status', v)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_iniciado">Não Iniciado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </Section>
      <Section title="Seção VIII — Organograma da Equipe">
        {PAPEIS.map(papel => (
          <div key={papel} className="border-b pb-3 last:border-0">
            <p className="text-sm font-medium text-muted-foreground mb-2">{papel}</p>
            <Grid cols={2}>
              <Field label="Nome"><Input value={conteudo[`eq_${papel}_nome`] || ''} onChange={e => up(`eq_${papel}_nome`, e.target.value)} /></Field>
              <Field label="Responsabilidades"><Input value={conteudo[`eq_${papel}_resp`] || ''} onChange={e => up(`eq_${papel}_resp`, e.target.value)} /></Field>
            </Grid>
          </div>
        ))}
      </Section>
      <Section title="Aprovações">
        <Grid cols={2}>
          <Field label="Patrocinador"><Input value={conteudo.aprov_patrocinador || ''} onChange={e => up('aprov_patrocinador', e.target.value)} /></Field>
          <Field label="Gestor PMO"><Input value={conteudo.aprov_pmo || ''} onChange={e => up('aprov_pmo', e.target.value)} /></Field>
          <Field label="Gerente do Projeto"><Input value={conteudo.aprov_gerente || ''} onChange={e => up('aprov_gerente', e.target.value)} /></Field>
          <Field label="Data de Aprovação"><Input type="date" value={conteudo.data_aprovacao || ''} onChange={e => up('data_aprovacao', e.target.value)} /></Field>
        </Grid>
      </Section>
    </div>
  );
}

// ========== TERMO DE COMPROMETIMENTO ==========
function TermoComprometimentoForm({ conteudo, up, updateList, addItem, removeItem }) {
  return (
    <div className="space-y-4">
      <Section title="Identificação">
        <Grid cols={2}>
          <Field label="Empresa"><Input value={conteudo.empresa || ''} onChange={e => up('empresa', e.target.value)} /></Field>
          <Field label="Data definida para Go Live"><Input type="date" value={conteudo.data_go_live || ''} onChange={e => up('data_go_live', e.target.value)} /></Field>
        </Grid>
      </Section>
      <Section title="Declarações">
        <Field label="Acordo com o Cronograma da Virada"><Textarea value={conteudo.acordo_cronograma || ''} onChange={e => up('acordo_cronograma', e.target.value)} rows={3} /></Field>
        <Field label="Aptidão para Operar o Sistema"><Textarea value={conteudo.aptidao_operacao || ''} onChange={e => up('aptidao_operacao', e.target.value)} rows={3} /></Field>
        <Field label="Validação dos Processos"><Textarea value={conteudo.validacao_processos || ''} onChange={e => up('validacao_processos', e.target.value)} rows={3} /></Field>
        <Field label="Pendências Remanescentes"><Textarea value={conteudo.pendencias_remanescentes || ''} onChange={e => up('pendencias_remanescentes', e.target.value)} rows={3} /></Field>
      </Section>
      <Section title="Participantes">
        <DynamicList
          label="Assinantes"
          items={conteudo.participantes || []}
          onAdd={() => addItem('participantes', { nome: '', funcao: '', status: 'pendente' })}
          onRemove={(i) => removeItem('participantes', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Nome" value={item.nome || ''} onChange={e => updateList('participantes', i, 'nome', e.target.value)} />
              <Input placeholder="Função" value={item.funcao || ''} onChange={e => updateList('participantes', i, 'funcao', e.target.value)} />
              <Select value={item.status || 'pendente'} onValueChange={v => updateList('participantes', i, 'status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </Section>
      <Section title="Considerações Finais">
        <Field label="Considerações"><Textarea value={conteudo.consideracoes || ''} onChange={e => up('consideracoes', e.target.value)} rows={4} /></Field>
      </Section>
    </div>
  );
}

// ========== TERMO DE ENCERRAMENTO ==========
function TermoEncerramentoForm({ conteudo, up, updateList, addItem, removeItem }) {
  return (
    <div className="space-y-4">
      <Section title="Tipo de Encerramento">
        <Field label="Tipo">
          <Select value={conteudo.tipo_encerramento || ''} onValueChange={v => up('tipo_encerramento', v)}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="total">Encerramento/Entrega Total</SelectItem>
              <SelectItem value="parcial">Entrega Parcial – Projeto em Andamento</SelectItem>
              <SelectItem value="cancelamento">Cancelamento do Projeto</SelectItem>
              <SelectItem value="suspensao">Suspensão Temporária</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Motivo"><Textarea value={conteudo.motivo || ''} onChange={e => up('motivo', e.target.value)} rows={3} /></Field>
      </Section>
      <Section title="Identificação do Projeto">
        <Grid cols={2}>
          <Field label="Nome do Projeto"><Input value={conteudo.nome_projeto || ''} onChange={e => up('nome_projeto', e.target.value)} /></Field>
          <Field label="Gerente do Projeto"><Input value={conteudo.gerente || ''} onChange={e => up('gerente', e.target.value)} /></Field>
          <Field label="Data do Go Live"><Input type="date" value={conteudo.data_go_live || ''} onChange={e => up('data_go_live', e.target.value)} /></Field>
          <Field label="Data de Entrega/Encerramento"><Input type="date" value={conteudo.data_entrega || ''} onChange={e => up('data_entrega', e.target.value)} /></Field>
        </Grid>
      </Section>
      <Section title="Objetivo e Observações">
        <Field label="Objetivo do Projeto"><Textarea value={conteudo.objetivo || ''} onChange={e => up('objetivo', e.target.value)} rows={3} /></Field>
        <Field label="Observações Adicionais"><Textarea value={conteudo.observacoes || ''} onChange={e => up('observacoes', e.target.value)} rows={3} /></Field>
      </Section>
      <Section title="Aprovações">
        <DynamicList
          label="Aprovadores"
          items={conteudo.aprovadores || []}
          onAdd={() => addItem('aprovadores', { nome: '', papel: '', status: 'pendente', data: '' })}
          onRemove={(i) => removeItem('aprovadores', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-4 gap-2">
              <Input placeholder="Nome" value={item.nome || ''} onChange={e => updateList('aprovadores', i, 'nome', e.target.value)} />
              <Input placeholder="Papel" value={item.papel || ''} onChange={e => updateList('aprovadores', i, 'papel', e.target.value)} />
              <Select value={item.status || 'pendente'} onValueChange={v => updateList('aprovadores', i, 'status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={item.data || ''} onChange={e => updateList('aprovadores', i, 'data', e.target.value)} />
            </div>
          )}
        />
      </Section>
    </div>
  );
}

// ========== LIÇÕES APRENDIDAS ==========
const LICOES_CHECKLIST = [
  // Requisitos e objetivos
  { grupo: 'Requisitos e Objetivos', key: 'req_usuario', label: 'Os requisitos do usuário foram claramente definidos e documentados?' },
  { grupo: 'Requisitos e Objetivos', key: 'metas_definidas', label: 'As metas do projeto foram adequadamente definidas e mensuráveis?' },
  { grupo: 'Requisitos e Objetivos', key: 'aderencia_objetivos', label: 'O projeto aderiu aos objetivos estabelecidos no Termo de Abertura?' },
  { grupo: 'Requisitos e Objetivos', key: 'conceito_aplicavel', label: 'O conceito da solução foi aplicável à realidade do cliente?' },
  { grupo: 'Requisitos e Objetivos', key: 'definicao_projeto', label: 'O projeto foi definido de forma adequada antes de iniciar?' },
  // Gestão e riscos
  { grupo: 'Gestão e Riscos', key: 'gestao_riscos', label: 'A gestão de riscos foi eficaz durante todo o projeto?' },
  { grupo: 'Gestão e Riscos', key: 'tecnologia_testada', label: 'A tecnologia foi testada antes da implantação no cliente?' },
  { grupo: 'Gestão e Riscos', key: 'sobrecarga_projetos', label: 'Houve sobrecarga por múltiplos projetos simultâneos na equipe?' },
  { grupo: 'Gestão e Riscos', key: 'reporte_gerente', label: 'O gerente de projeto reportou adequadamente o status e riscos?' },
  // Pessoas e equipe
  { grupo: 'Pessoas e Equipe', key: 'selecao_pessoas', label: 'A seleção de pessoas para o projeto foi adequada?' },
  { grupo: 'Pessoas e Equipe', key: 'treinamento_equipe', label: 'O treinamento da equipe de implantação foi suficiente?' },
  { grupo: 'Pessoas e Equipe', key: 'organizacao_escritorio', label: 'O escritório do projeto foi bem organizado e gerenciado?' },
  { grupo: 'Pessoas e Equipe', key: 'disponibilidade_recursos', label: 'Os recursos estiveram disponíveis conforme planejado?' },
  { grupo: 'Pessoas e Equipe', key: 'adequacao_time', label: 'O time do projeto foi adequado em competência e tamanho?' },
  { grupo: 'Pessoas e Equipe', key: 'eficacia_gerente', label: 'O gerente de projeto foi eficaz na condução do projeto?' },
  // Planejamento
  { grupo: 'Planejamento', key: 'planejamento_detalhado', label: 'O planejamento foi suficientemente detalhado e realista?' },
  { grupo: 'Planejamento', key: 'orcamento_adequado', label: 'O orçamento foi adequado e bem controlado?' },
  { grupo: 'Planejamento', key: 'definicao_tarefas', label: 'As tarefas foram claramente definidas e atribuídas?' },
  // Execução e controle
  { grupo: 'Execução e Controle', key: 'controle_mudancas', label: 'O controle de mudanças funcionou adequadamente?' },
  { grupo: 'Execução e Controle', key: 'clareza_especificacoes', label: 'As especificações estavam claras o suficiente para a equipe?' },
  { grupo: 'Execução e Controle', key: 'suficiencia_documentacao', label: 'A documentação do projeto foi suficiente e mantida atualizada?' },
  { grupo: 'Execução e Controle', key: 'qualidade_performance', label: 'A qualidade e performance da solução atenderam às expectativas?' },
  { grupo: 'Execução e Controle', key: 'variacao_custos', label: 'A variação de custos ficou dentro do tolerável?' },
  { grupo: 'Execução e Controle', key: 'controles_time', label: 'Os controles internos do time foram eficazes?' },
  { grupo: 'Execução e Controle', key: 'controles_gerencia', label: 'Os controles da gerência foram adequados?' },
  // Comunicação e stakeholders
  { grupo: 'Comunicação e Stakeholders', key: 'comunicacao', label: 'A comunicação entre as partes foi eficaz e frequente?' },
  { grupo: 'Comunicação e Stakeholders', key: 'cooperacao_areas', label: 'Houve boa cooperação entre as áreas envolvidas?' },
  { grupo: 'Comunicação e Stakeholders', key: 'autoridade_responsabilidade', label: 'A autoridade e responsabilidade foram claramente definidas?' },
  { grupo: 'Comunicação e Stakeholders', key: 'suporte_gerencia', label: 'O suporte da alta gestão foi adequado e presente?' },
  // Encerramento
  { grupo: 'Encerramento', key: 'redirecionamento', label: 'O projeto precisou ser redirecionado? Se sim, foi bem conduzido?' },
  { grupo: 'Encerramento', key: 'criterios_encerramento', label: 'Os critérios de encerramento foram claros e cumpridos?' },
  { grupo: 'Encerramento', key: 'treinamento_usuarios', label: 'O treinamento dos usuários finais foi suficiente para o go live?' },
];

function LicoesAprendidasForm({ conteudo, up, updateList, addItem, removeItem }) {
  const updateChecklist = (key, field, value) => {
    const checklist = { ...(conteudo.checklist || {}) };
    checklist[key] = { ...(checklist[key] || {}), [field]: value };
    up('checklist', checklist);
  };

  // Group items by grupo
  const grupos = [...new Set(LICOES_CHECKLIST.map(i => i.grupo))];

  const respostaColor = (r) => {
    if (r === 'sim') return 'bg-green-50 border-green-200';
    if (r === 'nao') return 'bg-red-50 border-red-200';
    if (r === 'na') return 'bg-gray-50 border-gray-200';
    return '';
  };

  return (
    <div className="space-y-4">
      <Section title="Checklist de Avaliação">
        <p className="text-xs text-muted-foreground mb-4">
          Para cada item, selecione a resposta (Sim / Não / N/A) e o nível de impacto no projeto (1 = mínimo · 5 = máximo).
        </p>
        {grupos.map(grupo => (
          <div key={grupo} className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b">{grupo}</h4>
            <div className="space-y-2">
              {LICOES_CHECKLIST.filter(i => i.grupo === grupo).map(item => {
                const entry = conteudo.checklist?.[item.key] || {};
                return (
                  <div key={item.key} className={`flex items-center gap-3 p-2 rounded-lg border ${respostaColor(entry.resposta)}`}>
                    <span className="flex-1 text-sm leading-snug">{item.label}</span>
                    <Select value={entry.resposta || ''} onValueChange={v => updateChecklist(item.key, 'resposta', v)}>
                      <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sim">Sim</SelectItem>
                        <SelectItem value="nao">Não</SelectItem>
                        <SelectItem value="na">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={entry.impacto || ''} onValueChange={v => updateChecklist(item.key, 'impacto', v)}>
                      <SelectTrigger className="w-20 h-8 text-xs"><SelectValue placeholder="1-5" /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} — {['Mín','Baixo','Médio','Alto','Máx'][n-1]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Reflexões Finais">
        <Field label="O que faríamos da mesma forma em projetos futuros?"><Textarea value={conteudo.mesma_forma || ''} onChange={e => up('mesma_forma', e.target.value)} rows={3} /></Field>
        <Field label="O que deveríamos fazer de forma diferente?"><Textarea value={conteudo.forma_diferente || ''} onChange={e => up('forma_diferente', e.target.value)} rows={3} /></Field>
        <Field label="O que sabemos hoje sobre o projeto e pessoas que não sabíamos antes?"><Textarea value={conteudo.aprendizado || ''} onChange={e => up('aprendizado', e.target.value)} rows={3} /></Field>
        <Field label="Que recomendações podem melhorar projetos futuros?"><Textarea value={conteudo.recomendacoes || ''} onChange={e => up('recomendacoes', e.target.value)} rows={3} /></Field>
      </Section>
      <Section title="Aprovações">
        <DynamicList
          label="Aprovadores"
          items={conteudo.aprovadores || []}
          onAdd={() => addItem('aprovadores', { nome: '', papel: '', status: 'pendente', data: '' })}
          onRemove={(i) => removeItem('aprovadores', i)}
          renderItem={(item, i) => (
            <div className="grid grid-cols-4 gap-2">
              <Input placeholder="Nome" value={item.nome || ''} onChange={e => updateList('aprovadores', i, 'nome', e.target.value)} />
              <Input placeholder="Papel" value={item.papel || ''} onChange={e => updateList('aprovadores', i, 'papel', e.target.value)} />
              <Select value={item.status || 'pendente'} onValueChange={v => updateList('aprovadores', i, 'status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={item.data || ''} onChange={e => updateList('aprovadores', i, 'data', e.target.value)} />
            </div>
          )}
        />
      </Section>
    </div>
  );
}