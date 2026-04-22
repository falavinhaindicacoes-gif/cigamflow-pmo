import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Database, CheckCircle2, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';

const STEPS = [
  'Empresas',
  'Clientes',
  'Consultores',
  'Projetos',
  'Alocações',
  'Atividades',
  'Status Reports',
  'Notificações',
];

export default function SeedData() {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState([]);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  const log = (step) => setDone(prev => [...prev, step]);

  const seed = async () => {
    setRunning(true);
    setDone([]);
    setError(null);

    try {
      // 1. EMPRESAS
      const emp1 = await base44.entities.Company.create({
        name: 'CIGAM Software', cnpj: '12.345.678/0001-99', city: 'Porto Alegre',
        state: 'RS', segment: 'Tecnologia', status: 'active',
        notes: 'Empresa principal — matriz da operação'
      });
      log('Empresas');

      // 2. CLIENTES
      const cli1 = await base44.entities.Client.create({
        company_id: emp1.id, razao_social: 'Metalúrgica São Pedro Ltda',
        nome_fantasia: 'São Pedro Metal', cnpj: '98.765.432/0001-11',
        municipio: 'Caxias do Sul', uf: 'RS', segmento: 'Indústria Metalúrgica',
        regime_tributario: 'real', contato_principal: 'Rogério Mantovani',
        telefone: '(54) 3214-5678', email: 'rogério@saopedrometal.com.br',
        situacao: 'ativo', vendedor_responsavel: 'Carlos Souza',
        observacoes: 'Cliente de grande porte, implantação complexa com integração de chão de fábrica'
      });

      const cli2 = await base44.entities.Client.create({
        company_id: emp1.id, razao_social: 'Distribuidora Alvorada S.A.',
        nome_fantasia: 'Alvorada Dist', cnpj: '11.222.333/0001-55',
        municipio: 'Florianópolis', uf: 'SC', segmento: 'Distribuição',
        regime_tributario: 'presumido', contato_principal: 'Fernanda Lima',
        telefone: '(48) 3300-1122', email: 'fernanda@alvorada.com.br',
        situacao: 'ativo', vendedor_responsavel: 'Ana Paula Ritter',
        observacoes: 'Distribuidora com 3 filiais. Foco em fiscal e estoque'
      });

      const cli3 = await base44.entities.Client.create({
        company_id: emp1.id, razao_social: 'Construtora BrasPlan Ltda',
        nome_fantasia: 'BrasPlan', cnpj: '44.555.666/0001-77',
        municipio: 'Porto Alegre', uf: 'RS', segmento: 'Construção Civil',
        regime_tributario: 'presumido', contato_principal: 'Marcos Bento',
        telefone: '(51) 3321-9900', email: 'marcos@brasplan.com.br',
        situacao: 'ativo', observacoes: 'Projeto em fase de treinamento, cliente engajado'
      });

      const cli4 = await base44.entities.Client.create({
        company_id: emp1.id, razao_social: 'Agropecuária Vale Verde Ltda',
        nome_fantasia: 'Vale Verde', cnpj: '77.888.999/0001-33',
        municipio: 'Passo Fundo', uf: 'RS', segmento: 'Agronegócio',
        regime_tributario: 'simples', contato_principal: 'Josefina Kern',
        telefone: '(54) 3455-2200', email: 'josefina@valeverde.agr.br',
        situacao: 'ativo', observacoes: 'Projeto em Go Live iminente, alta criticidade'
      });
      log('Clientes');

      // 3. CONSULTORES
      const cons1 = await base44.entities.Consultant.create({
        company_id: emp1.id, name: 'Ana Paula Ritter',
        email: 'ana.ritter@cigam.com.br', telefone: '(51) 99811-2233',
        funcao: 'Consultora Sênior', especialidade_principal: 'financeiro',
        especialidades_secundarias: ['contabil', 'fiscal'],
        capacidade_semanal: 40, capacidade_mensal: 160,
        custo_hora: 180, status: 'ativo', gestor: 'Diretoria Operações'
      });

      const cons2 = await base44.entities.Consultant.create({
        company_id: emp1.id, name: 'Carlos Eduardo Souza',
        email: 'carlos.souza@cigam.com.br', telefone: '(51) 99911-3344',
        funcao: 'Consultor Pleno', especialidade_principal: 'estoque',
        especialidades_secundarias: ['compras', 'vendas'],
        capacidade_semanal: 40, capacidade_mensal: 160,
        custo_hora: 150, status: 'ativo', gestor: 'Ana Paula Ritter'
      });

      const cons3 = await base44.entities.Consultant.create({
        company_id: emp1.id, name: 'Patrícia Mendes',
        email: 'patricia.mendes@cigam.com.br', telefone: '(51) 99722-4455',
        funcao: 'Consultora Plena', especialidade_principal: 'fiscal',
        especialidades_secundarias: ['contabil', 'financeiro'],
        capacidade_semanal: 40, capacidade_mensal: 160,
        custo_hora: 155, status: 'ativo', gestor: 'Ana Paula Ritter'
      });

      const cons4 = await base44.entities.Consultant.create({
        company_id: emp1.id, name: 'Ricardo Fonseca',
        email: 'ricardo.fonseca@cigam.com.br', telefone: '(51) 99633-5566',
        funcao: 'Consultor Técnico', especialidade_principal: 'integracao',
        especialidades_secundarias: ['ti', 'customizacao'],
        capacidade_semanal: 40, capacidade_mensal: 160,
        custo_hora: 200, status: 'ativo', gestor: 'Diretoria Técnica'
      });

      const cons5 = await base44.entities.Consultant.create({
        company_id: emp1.id, name: 'Juliana Carvalho',
        email: 'juliana.carvalho@cigam.com.br', telefone: '(51) 99544-6677',
        funcao: 'Consultora Júnior', especialidade_principal: 'geral',
        especialidades_secundarias: ['treinamento'],
        capacidade_semanal: 40, capacidade_mensal: 160,
        custo_hora: 120, status: 'ativo', gestor: 'Carlos Eduardo Souza'
      });
      log('Consultores');

      // 4. PROJETOS
      const proj1 = await base44.entities.Project.create({
        company_id: emp1.id, client_id: cli1.id,
        name: 'Implantação ERP — São Pedro Metal',
        gerente_projeto: 'Ana Paula Ritter',
        patrocinador: 'Rogério Mantovani',
        coordenador_cliente: 'Sandra Oliveira',
        facilitador: 'Carlos Eduardo Souza',
        tipo_implantacao: 'presencial',
        data_inicio: '2025-08-01',
        data_prevista_termino: '2026-03-31',
        fase_atual: 'definicao_parametrizacao',
        status: 'em_andamento',
        percentual_progresso: 45,
        saude: 'amarelo',
        risco_geral: 'medio',
        prioritario: true,
        bloqueia_go_live: false,
        escopo_modulos: 'Financeiro, Contabilidade, Fiscal, Estoque, Compras, Vendas, Produção',
        qtd_usuarios: 85,
        horas_previstas: 1200,
        horas_realizadas: 520,
        custo_previsto: 216000,
        custo_realizado: 93600,
        sistema_atual_cliente: 'Sistema legado DOS + planilhas Excel',
        motivo_troca: 'Sistema obsoleto sem suporte, falta de integração entre áreas',
        expectativa_cliente: 'Unificação dos processos, rastreabilidade e relatórios gerenciais em tempo real',
        observacoes: 'Projeto complexo com integração de chão de fábrica prevista para fase 2'
      });

      const proj2 = await base44.entities.Project.create({
        company_id: emp1.id, client_id: cli2.id,
        name: 'ERP Alvorada Distribuidora',
        gerente_projeto: 'Carlos Eduardo Souza',
        patrocinador: 'Fernanda Lima',
        coordenador_cliente: 'João Ferreira',
        tipo_implantacao: 'remota',
        data_inicio: '2025-10-15',
        data_prevista_termino: '2026-05-30',
        fase_atual: 'treinamento',
        status: 'em_andamento',
        percentual_progresso: 62,
        saude: 'verde',
        risco_geral: 'baixo',
        prioritario: false,
        bloqueia_go_live: false,
        escopo_modulos: 'Fiscal, Estoque, Compras, Vendas',
        qtd_usuarios: 32,
        horas_previstas: 600,
        horas_realizadas: 372,
        custo_previsto: 90000,
        custo_realizado: 55800,
        sistema_atual_cliente: 'TOTVS Protheus',
        motivo_troca: 'Custo elevado de manutenção e dificuldade de suporte local',
        expectativa_cliente: 'Redução de custos com sistema e melhoria no controle fiscal'
      });

      const proj3 = await base44.entities.Project.create({
        company_id: emp1.id, client_id: cli3.id,
        name: 'CIGAM BrasPlan Construção',
        gerente_projeto: 'Patrícia Mendes',
        patrocinador: 'Marcos Bento',
        tipo_implantacao: 'hibrida',
        data_inicio: '2025-11-01',
        data_prevista_termino: '2026-04-30',
        fase_atual: 'homologacao_piloto',
        status: 'em_andamento',
        percentual_progresso: 71,
        saude: 'verde',
        risco_geral: 'baixo',
        prioritario: false,
        bloqueia_go_live: false,
        escopo_modulos: 'Financeiro, Contabilidade, RH, Obras',
        qtd_usuarios: 24,
        horas_previstas: 480,
        horas_realizadas: 340,
        custo_previsto: 74400,
        custo_realizado: 51000
      });

      const proj4 = await base44.entities.Project.create({
        company_id: emp1.id, client_id: cli4.id,
        name: 'Vale Verde — Implantação CIGAM',
        gerente_projeto: 'Ana Paula Ritter',
        patrocinador: 'Josefina Kern',
        tipo_implantacao: 'remota',
        data_inicio: '2025-06-01',
        data_prevista_termino: '2026-01-31',
        fase_atual: 'preparacao_virada',
        status: 'em_andamento',
        percentual_progresso: 88,
        saude: 'vermelho',
        risco_geral: 'alto',
        prioritario: true,
        bloqueia_go_live: true,
        escopo_modulos: 'Financeiro, Estoque, Compras, Vendas, Fiscal',
        qtd_usuarios: 18,
        horas_previstas: 400,
        horas_realizadas: 380,
        custo_previsto: 72000,
        custo_realizado: 71100,
        observacoes: 'Projeto com atraso. Go Live previsto para 15/05 mas há bloqueios pendentes'
      });
      log('Projetos');

      // 5. ALOCAÇÕES
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj1.id, consultant_id: cons1.id,
        papel_no_projeto: 'Gerente de Projeto', especialidade_aplicada: 'financeiro',
        horas_semanais: 16, horas_mensais: 64, data_inicio: '2025-08-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj1.id, consultant_id: cons2.id,
        papel_no_projeto: 'Consultor de Estoque / Compras', especialidade_aplicada: 'estoque',
        horas_semanais: 20, horas_mensais: 80, data_inicio: '2025-08-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj1.id, consultant_id: cons3.id,
        papel_no_projeto: 'Consultora Fiscal', especialidade_aplicada: 'fiscal',
        horas_semanais: 16, horas_mensais: 64, data_inicio: '2025-08-15',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj1.id, consultant_id: cons4.id,
        papel_no_projeto: 'Consultor de Integração', especialidade_aplicada: 'integracao',
        horas_semanais: 8, horas_mensais: 32, data_inicio: '2025-10-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj2.id, consultant_id: cons2.id,
        papel_no_projeto: 'Gerente / Consultor Principal', especialidade_aplicada: 'estoque',
        horas_semanais: 16, horas_mensais: 64, data_inicio: '2025-10-15',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj2.id, consultant_id: cons3.id,
        papel_no_projeto: 'Consultora Fiscal', especialidade_aplicada: 'fiscal',
        horas_semanais: 12, horas_mensais: 48, data_inicio: '2025-10-15',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj3.id, consultant_id: cons3.id,
        papel_no_projeto: 'Gerente de Projeto', especialidade_aplicada: 'contabil',
        horas_semanais: 16, horas_mensais: 64, data_inicio: '2025-11-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj3.id, consultant_id: cons5.id,
        papel_no_projeto: 'Consultora Treinamento', especialidade_aplicada: 'geral',
        horas_semanais: 20, horas_mensais: 80, data_inicio: '2025-11-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj4.id, consultant_id: cons1.id,
        papel_no_projeto: 'Gerente de Projeto', especialidade_aplicada: 'financeiro',
        horas_semanais: 20, horas_mensais: 80, data_inicio: '2025-06-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj4.id, consultant_id: cons4.id,
        papel_no_projeto: 'Consultor Técnico', especialidade_aplicada: 'integracao',
        horas_semanais: 16, horas_mensais: 64, data_inicio: '2025-09-01',
        status: 'ativa'
      });
      await base44.entities.Allocation.create({
        company_id: emp1.id, project_id: proj4.id, consultant_id: cons5.id,
        papel_no_projeto: 'Consultora de Suporte', especialidade_aplicada: 'geral',
        horas_semanais: 20, horas_mensais: 80, data_inicio: '2025-11-01',
        status: 'ativa'
      });
      log('Alocações');

      // 6. ATIVIDADES
      const today = new Date();
      const d = (days) => {
        const dt = new Date(today);
        dt.setDate(dt.getDate() + days);
        return dt.toISOString().split('T')[0];
      };

      // São Pedro - atividades problemáticas
      await base44.entities.Activity.create({
        project_id: proj1.id, client_id: cli1.id, company_id: emp1.id,
        titulo: 'Integração sistema MES com módulo de Produção CIGAM',
        descricao: 'API de comunicação entre o MES atual e o módulo de produção do CIGAM não está respondendo corretamente. Necessário mapeamento completo dos endpoints.',
        fase_projeto: 'definicao_parametrizacao', origem: 'reuniao',
        tipo: 'bloqueio', categoria: 'integracao', prioridade: 'urgente',
        criticidade: 'critica', recorrencia: 'primeira_vez',
        responsavel: 'Ricardo Fonseca', solicitante: 'Sandra Oliveira',
        consultor_vinculado: 'Ricardo Fonseca', gerente_responsavel: 'Ana Paula Ritter',
        prazo: d(-3), sla_dias: 5, status: 'em_andamento',
        bloqueia_fase: true, bloqueia_go_live: true, exige_aprovacao: false,
        acao_esperada: 'Mapeamento completo dos endpoints e desenvolvimento do conector',
        tratativa_realizada: 'Reunião técnica realizada em 18/04. Fornecedor do MES confirmou suporte.',
        proximo_passo: 'Aguardar documentação técnica do fornecedor do MES — prazo 25/04'
      });

      await base44.entities.Activity.create({
        project_id: proj1.id, client_id: cli1.id, company_id: emp1.id,
        titulo: 'Parametrização do plano de contas não reflete a realidade contábil',
        descricao: 'O plano de contas importado não está adequado à estrutura contábil da empresa. Necessário revisão completa com contador.',
        fase_projeto: 'definicao_parametrizacao', origem: 'homologacao',
        tipo: 'inconsistencia', categoria: 'parametrizacao', prioridade: 'alta',
        criticidade: 'alta', recorrencia: 'reincidente',
        responsavel: 'Ana Paula Ritter', solicitante: 'Sandra Oliveira',
        gerente_responsavel: 'Ana Paula Ritter',
        prazo: d(5), sla_dias: 7, status: 'em_analise',
        bloqueia_fase: false, bloqueia_go_live: false,
        acao_esperada: 'Reunião com contador para revisão do plano de contas',
        motivo_atraso: 'Contador do cliente sem disponibilidade na semana passada'
      });

      await base44.entities.Activity.create({
        project_id: proj1.id, client_id: cli1.id, company_id: emp1.id,
        titulo: 'Usuários do setor de compras sem treinamento concluído',
        descricao: '8 dos 15 usuários do setor de compras não completaram o treinamento obrigatório do módulo.',
        fase_projeto: 'treinamento', origem: 'treinamento',
        tipo: 'pendencia_cliente', categoria: 'treinamento', prioridade: 'alta',
        criticidade: 'media', recorrencia: 'primeira_vez',
        responsavel: 'Juliana Carvalho', solicitante: 'Carlos Eduardo Souza',
        prazo: d(10), sla_dias: 15, status: 'aguardando_cliente',
        bloqueia_fase: false, bloqueia_go_live: true,
        acao_esperada: 'Agendamento de sessões de reposição com usuários faltantes'
      });

      await base44.entities.Activity.create({
        project_id: proj1.id, client_id: cli1.id, company_id: emp1.id,
        titulo: 'Mapeamento dos processos de faturamento concluído',
        descricao: 'Todos os processos de faturamento foram mapeados e validados com o cliente.',
        fase_projeto: 'definicao_parametrizacao', origem: 'reuniao',
        tipo: 'decisao', categoria: 'processo', prioridade: 'media',
        criticidade: 'media', recorrencia: 'primeira_vez',
        responsavel: 'Ana Paula Ritter',
        prazo: d(-10), sla_dias: 5, status: 'concluido',
        data_conclusao: d(-10),
        bloqueia_fase: false, bloqueia_go_live: false,
        solucao_aplicada: 'Documentação de todos os fluxos aprovada pelo cliente'
      });

      // Alvorada - saudável
      await base44.entities.Activity.create({
        project_id: proj2.id, client_id: cli2.id, company_id: emp1.id,
        titulo: 'Validação do SPED Fiscal — Ajuste de CFOPs',
        descricao: 'Alguns CFOPs incorretos identificados na geração do SPED Fiscal do mês de teste.',
        fase_projeto: 'treinamento', origem: 'homologacao',
        tipo: 'inconsistencia', categoria: 'fiscal', prioridade: 'alta',
        criticidade: 'alta', recorrencia: 'primeira_vez',
        responsavel: 'Patrícia Mendes', solicitante: 'João Ferreira',
        prazo: d(3), sla_dias: 5, status: 'em_andamento',
        bloqueia_fase: false, bloqueia_go_live: false,
        acao_esperada: 'Correção das tabelas de CFOP e reprocessamento do SPED'
      });

      await base44.entities.Activity.create({
        project_id: proj2.id, client_id: cli2.id, company_id: emp1.id,
        titulo: 'Cadastro de transportadoras pendente',
        descricao: 'Cliente precisa finalizar o cadastro de 23 transportadoras antes do go live.',
        fase_projeto: 'treinamento', origem: 'reuniao',
        tipo: 'pendencia_cliente', categoria: 'cadastro', prioridade: 'media',
        criticidade: 'media', recorrencia: 'primeira_vez',
        responsavel: 'João Ferreira', solicitante: 'Carlos Eduardo Souza',
        prazo: d(7), sla_dias: 10, status: 'aguardando_cliente',
        bloqueia_fase: false, bloqueia_go_live: false
      });

      // Vale Verde - crítico
      await base44.entities.Activity.create({
        project_id: proj4.id, client_id: cli4.id, company_id: emp1.id,
        titulo: 'Saldo inicial de estoque divergente — erro crítico de go live',
        descricao: 'Os saldos iniciais importados para o estoque apresentam divergência de R$ 127.340 em relação ao balanço do contador. Impossível fazer go live sem correção.',
        fase_projeto: 'preparacao_virada', origem: 'go_live',
        tipo: 'bloqueio', categoria: 'dados', prioridade: 'urgente',
        criticidade: 'critica', recorrencia: 'primeira_vez',
        responsavel: 'Carlos Eduardo Souza', solicitante: 'Josefina Kern',
        gerente_responsavel: 'Ana Paula Ritter',
        prazo: d(-5), sla_dias: 3, status: 'em_andamento',
        bloqueia_fase: true, bloqueia_go_live: true, exige_aprovacao: true,
        acao_esperada: 'Reconciliação dos dados de estoque com inventário físico',
        tratativa_realizada: 'Inventário físico iniciado em 19/04. 40% concluído.',
        causa_raiz: 'Dados exportados do sistema legado com erro de truncamento decimal'
      });

      await base44.entities.Activity.create({
        project_id: proj4.id, client_id: cli4.id, company_id: emp1.id,
        titulo: 'Termo de Comprometimento da Virada pendente de assinatura',
        descricao: 'Patrocinadora Josefina Kern não assinou o Termo de Comprometimento. Go Live está bloqueado até aprovação.',
        fase_projeto: 'preparacao_virada', origem: 'interno',
        tipo: 'bloqueio', categoria: 'aprovacao', prioridade: 'urgente',
        criticidade: 'critica', recorrencia: 'primeira_vez',
        responsavel: 'Ana Paula Ritter', solicitante: 'Ana Paula Ritter',
        prazo: d(-2), sla_dias: 1, status: 'aguardando_cliente',
        bloqueia_fase: true, bloqueia_go_live: true,
        acao_esperada: 'Assinar Termo de Comprometimento',
        proximo_passo: 'Reunião com patrocinadora marcada para 23/04'
      });

      await base44.entities.Activity.create({
        project_id: proj4.id, client_id: cli4.id, company_id: emp1.id,
        titulo: 'Configuração de usuários e permissões de acesso',
        descricao: 'Perfis de acesso dos 18 usuários precisam ser configurados e testados antes do go live.',
        fase_projeto: 'preparacao_virada', origem: 'interno',
        tipo: 'pendencia_interna', categoria: 'parametrizacao', prioridade: 'alta',
        criticidade: 'alta', recorrencia: 'primeira_vez',
        responsavel: 'Ricardo Fonseca', solicitante: 'Ana Paula Ritter',
        prazo: d(2), sla_dias: 5, status: 'em_andamento',
        bloqueia_fase: false, bloqueia_go_live: false,
        acao_esperada: 'Configurar perfis e realizar testes de acesso com usuários-chave'
      });

      // BrasPlan - saudável
      await base44.entities.Activity.create({
        project_id: proj3.id, client_id: cli3.id, company_id: emp1.id,
        titulo: 'Homologação do módulo de RH — pendências de rescisão',
        descricao: 'Cálculo de rescisão com aviso prévio indenizado apresentando diferença no FGTS multa.',
        fase_projeto: 'homologacao_piloto', origem: 'homologacao',
        tipo: 'inconsistencia', categoria: 'processo', prioridade: 'alta',
        criticidade: 'media', recorrencia: 'primeira_vez',
        responsavel: 'Patrícia Mendes', solicitante: 'Marcos Bento',
        prazo: d(4), sla_dias: 7, status: 'em_analise',
        bloqueia_fase: false, bloqueia_go_live: false,
        acao_esperada: 'Revisão da tabela de parâmetros de rescisão no módulo RH'
      });

      await base44.entities.Activity.create({
        project_id: proj3.id, client_id: cli3.id, company_id: emp1.id,
        titulo: 'Treinamento financeiro finalizado — aprovado',
        descricao: 'Todos os 8 usuários do financeiro concluíram o treinamento com nota acima de 8.',
        fase_projeto: 'treinamento', origem: 'treinamento',
        tipo: 'decisao', categoria: 'treinamento', prioridade: 'baixa',
        criticidade: 'baixa', recorrencia: 'primeira_vez',
        responsavel: 'Juliana Carvalho',
        prazo: d(-15), sla_dias: 30, status: 'concluido',
        data_conclusao: d(-15),
        bloqueia_fase: false, bloqueia_go_live: false,
        solucao_aplicada: 'Treinamento concluído com sucesso. Avaliações acima da meta.'
      });
      log('Atividades');

      // 7. STATUS REPORTS
      await base44.entities.StatusReport.create({
        company_id: emp1.id, project_id: proj1.id, client_id: cli1.id,
        gerente_projeto: 'Ana Paula Ritter',
        periodo_inicio: '2026-04-01', periodo_fim: '2026-04-14',
        data_emissao: '2026-04-15',
        progresso_previsto: 50, progresso_realizado: 45, percentual_conclusao: 45,
        status_prazo: 'amarelo', comentario_prazo: 'Integração com MES está atrasando a fase de definição',
        horas_previstas: 120, horas_realizadas: 108,
        custo_previsto: 21600, custo_realizado: 19440,
        status_custo: 'verde', comentario_custo: 'Consumo de horas dentro do planejado',
        entregas_concluidas: 'Mapeamento de processos financeiros concluído. Parametrização básica do plano de contas iniciada. Primeira rodada de treinamento de gestores realizada.',
        riscos: [
          { descricao: 'Atraso na integração com MES pode impactar go live', tipo: 'tecnico', probabilidade: 'alta', impacto: 'alto', responsavel: 'Ricardo Fonseca', plano_acao: 'Escalar para fornecedor do MES e definir SLA de resposta' }
        ],
        pontos_atencao: [
          { ponto: 'Disponibilidade do contador para validar plano de contas', impacto: 'Atraso na parametrização contábil', acao_corretiva: 'Agendar sessão formal com prazo definido', responsavel: 'Sandra Oliveira' }
        ],
        proximas_atividades: [
          { atividade: 'Finalizar parametrização do plano de contas', responsavel: 'Ana Paula Ritter', data_entrega: '2026-04-28' },
          { atividade: 'Resolver integração MES', responsavel: 'Ricardo Fonseca', data_entrega: '2026-04-25' },
          { atividade: 'Reposição de treinamento — usuários de compras', responsavel: 'Juliana Carvalho', data_entrega: '2026-05-02' }
        ],
        comentarios_gerente: 'O projeto mantém progresso consistente apesar do desafio técnico da integração com o MES. A equipe do cliente está engajada e participativa. Foco das próximas semanas: resolver bloqueio técnico e avançar na parametrização.',
        status_aprovacao: 'aprovado', aprovado_por: 'Rogério Mantovani',
        data_aprovacao: '2026-04-16'
      });

      await base44.entities.StatusReport.create({
        company_id: emp1.id, project_id: proj4.id, client_id: cli4.id,
        gerente_projeto: 'Ana Paula Ritter',
        periodo_inicio: '2026-04-01', periodo_fim: '2026-04-14',
        data_emissao: '2026-04-15',
        progresso_previsto: 95, progresso_realizado: 88, percentual_conclusao: 88,
        status_prazo: 'vermelho', comentario_prazo: 'Bloqueios críticos impedem o avanço para go live',
        horas_previstas: 40, horas_realizadas: 38,
        custo_previsto: 7200, custo_realizado: 7100,
        status_custo: 'verde', comentario_custo: 'Horas consumidas dentro do esperado',
        entregas_concluidas: 'Configuração de usuários 80% concluída. Testes de integração fiscal aprovados.',
        riscos: [
          { descricao: 'Go Live em risco por divergência de saldos de estoque', tipo: 'dados', probabilidade: 'alta', impacto: 'critico', responsavel: 'Carlos Eduardo Souza', plano_acao: 'Inventário físico em andamento — conclusão prevista 23/04' },
          { descricao: 'Patrocinadora sem disponibilidade para assinatura do Termo', tipo: 'gestao', probabilidade: 'media', impacto: 'alto', responsavel: 'Ana Paula Ritter', plano_acao: 'Reunião agendada para 23/04' }
        ],
        proximas_atividades: [
          { atividade: 'Concluir inventário e reconciliar saldos', responsavel: 'Carlos Eduardo Souza', data_entrega: '2026-04-23' },
          { atividade: 'Assinatura do Termo de Comprometimento', responsavel: 'Josefina Kern', data_entrega: '2026-04-23' },
          { atividade: 'Go Live', responsavel: 'Ana Paula Ritter', data_entrega: '2026-05-02' }
        ],
        comentarios_gerente: 'Projeto em estado crítico. Os dois bloqueios precisam ser resolvidos até 23/04 para manter o go live no dia 02/05. Escalei para a direção da CIGAM.',
        status_aprovacao: 'pendente'
      });
      log('Status Reports');

      // 8. NOTIFICAÇÕES
      await base44.entities.Notification.create({
        user_email: 'admin@cigam.com.br', tipo: 'go_live_bloqueado',
        titulo: '🚫 Go Live Bloqueado — Vale Verde',
        mensagem: 'Existem 2 bloqueios críticos impedindo o Go Live do projeto Vale Verde. Ação imediata necessária.',
        entity_type: 'Project', entity_id: proj4.id, lida: false, project_id: proj4.id
      });
      await base44.entities.Notification.create({
        user_email: 'admin@cigam.com.br', tipo: 'item_atrasado',
        titulo: '⏰ Itens Atrasados — São Pedro Metal',
        mensagem: 'Integração com MES está 3 dias atrasada. Bloqueio crítico sem tratativa há mais de 48h.',
        entity_type: 'Activity', entity_id: proj1.id, lida: false, project_id: proj1.id
      });
      await base44.entities.Notification.create({
        user_email: 'admin@cigam.com.br', tipo: 'projeto_vermelho',
        titulo: '🔴 Projeto em Vermelho — Vale Verde',
        mensagem: 'O projeto Vale Verde está com saúde CRÍTICA. Go Live em risco iminente.',
        entity_type: 'Project', entity_id: proj4.id, lida: false, project_id: proj4.id
      });
      await base44.entities.Notification.create({
        user_email: 'admin@cigam.com.br', tipo: 'aprovacao_pendente',
        titulo: '📋 Status Report Aguardando Aprovação — Vale Verde',
        mensagem: 'O Status Report do período 01-14/04 do projeto Vale Verde está pendente de aprovação.',
        entity_type: 'StatusReport', entity_id: proj4.id, lida: false, project_id: proj4.id
      });
      await base44.entities.Notification.create({
        user_email: 'admin@cigam.com.br', tipo: 'sobrecarga',
        titulo: '⚠️ Consultor Sobrecarregado — Ana Paula Ritter',
        mensagem: 'Ana Paula Ritter está com 90% de ocupação semanal. Gerenciando 2 projetos críticos simultaneamente.',
        entity_type: 'Consultant', lida: false
      });
      log('Notificações');

      setRunning(false);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao popular dados');
      setRunning(false);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const entities = ['Notification', 'StatusReport', 'Allocation', 'Activity', 'ProjectDocument', 'Project', 'Client', 'Consultant', 'Company'];
      for (const ent of entities) {
        const records = await base44.entities[ent].list('-created_date', 500);
        await Promise.all(records.map(r => base44.entities[ent].delete(r.id)));
      }
    } catch (err) {
      setError(err.message);
    }
    setClearing(false);
    setDone([]);
  };

  return (
    <div className="space-y-6 lg:pl-0 pl-12 max-w-2xl">
      <PageHeader
        title="Dados de Exemplo"
        description="Popule o sistema com dados realistas para demonstração e testes"
      />

      <div className="bg-card border rounded-xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Seed de Dados CIGAM</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Cria uma base realista com 1 empresa, 4 clientes, 5 consultores, 4 projetos em fases diferentes,
              11 alocações, atividades em vários status, status reports e notificações.
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          {STEPS.map((step, idx) => {
            const isDone = done.includes(step);
            const isRunning = running && !isDone && done.length === idx;
            return (
              <div key={step} className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : isRunning ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={`text-sm ${isDone ? 'text-green-700 font-medium' : isRunning ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {done.length === STEPS.length && !running && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Dados populados com sucesso! Explore o sistema pelo menu lateral.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={seed}
            disabled={running || clearing}
            className="flex-1 gap-2"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {running ? `Populando... (${done.length}/${STEPS.length})` : 'Popular Dados de Exemplo'}
          </Button>

          <Button
            variant="outline"
            onClick={clearAll}
            disabled={running || clearing}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {clearing ? 'Limpando...' : 'Limpar Tudo'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          ⚠️ O botão "Limpar Tudo" remove TODOS os registros de todas as entidades. Use com cuidado.
        </p>
      </div>
    </div>
  );
}