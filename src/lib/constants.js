export const FASES_PROJETO = [
  { value: 'comercial', label: 'Comercial / Pré-projeto' },
  { value: 'inicializacao', label: 'Inicialização' },
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'definicao_parametrizacao', label: 'Definição e Parametrização' },
  { value: 'treinamento', label: 'Treinamento' },
  { value: 'homologacao_piloto', label: 'Homologação / Piloto' },
  { value: 'preparacao_virada', label: 'Preparação da Virada' },
  { value: 'go_live', label: 'Go Live' },
  { value: 'encerramento', label: 'Encerramento' },
];

export const STATUS_PROJETO = [
  { value: 'nao_iniciado', label: 'Não Iniciado' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const SAUDE_COLORS = {
  verde: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', border: 'border-green-200', label: 'Saudável' },
  amarelo: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', border: 'border-yellow-200', label: 'Atenção' },
  vermelho: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', border: 'border-red-200', label: 'Crítico' },
};

export const PRIORIDADE_COLORS = {
  baixa: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Baixa' },
  media: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Média' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
  urgente: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgente' },
};

export const CRITICIDADE_COLORS = {
  baixa: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Baixa' },
  media: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Média' },
  alta: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Alta' },
  critica: { bg: 'bg-red-100', text: 'text-red-700', label: 'Crítica' },
};

export const STATUS_ATIVIDADE = [
  { value: 'aberto', label: 'Aberto', color: 'bg-blue-100 text-blue-700' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-purple-100 text-purple-700' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'aguardando_interno', label: 'Aguardando Interno', color: 'bg-orange-100 text-orange-700' },
  { value: 'aguardando_terceiro', label: 'Aguardando Terceiro', color: 'bg-orange-100 text-orange-700' },
  { value: 'validar_solucao', label: 'Validar Solução', color: 'bg-purple-100 text-purple-700' },
  { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-gray-100 text-gray-700' },
];

export const TIPO_ATIVIDADE = [
  { value: 'pendencia_cliente', label: 'Pendência Cliente' },
  { value: 'pendencia_interna', label: 'Pendência Interna' },
  { value: 'bloqueio', label: 'Bloqueio' },
  { value: 'risco', label: 'Risco' },
  { value: 'inconsistencia', label: 'Inconsistência' },
  { value: 'melhoria', label: 'Melhoria' },
  { value: 'decisao', label: 'Decisão' },
];

export const CATEGORIA_ATIVIDADE = [
  { value: 'processo', label: 'Processo' },
  { value: 'cadastro', label: 'Cadastro' },
  { value: 'treinamento', label: 'Treinamento' },
  { value: 'parametrizacao', label: 'Parametrização' },
  { value: 'integracao', label: 'Integração' },
  { value: 'infraestrutura', label: 'Infraestrutura' },
  { value: 'dados', label: 'Dados' },
  { value: 'customizacao', label: 'Customização' },
  { value: 'escopo', label: 'Escopo' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comunicacao', label: 'Comunicação' },
  { value: 'aprovacao', label: 'Aprovação' },
];

export const ESPECIALIDADES = [
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
  { value: 'geral', label: 'Geral' },
];

export const getFaseLabel = (value) => FASES_PROJETO.find(f => f.value === value)?.label || value;
export const getStatusLabel = (value) => STATUS_PROJETO.find(s => s.value === value)?.label || value;
export const getActivityStatusInfo = (value) => STATUS_ATIVIDADE.find(s => s.value === value) || { label: value, color: 'bg-gray-100 text-gray-700' };