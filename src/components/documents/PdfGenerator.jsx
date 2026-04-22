import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── CIGAM Brand Colors ──────────────────────────────────────────────
const C = {
  navy:      [26, 46, 74],      // #1a2e4a
  orange:    [232, 80, 26],     // #e8501a
  lightGray: [245, 246, 248],
  midGray:   [180, 185, 195],
  darkText:  [30, 35, 45],
  white:     [255, 255, 255],
  lineGray:  [220, 224, 230],
};

const DOC_LABELS = {
  dados_iniciais: 'Dados Iniciais / Proposta',
  termo_abertura: 'Termo de Abertura',
  plano_projeto: 'Plano de Projeto',
  termo_comprometimento: 'Termo de Comprometimento',
  termo_encerramento: 'Termo de Encerramento',
  licoes_aprendidas: 'Lições Aprendidas',
};

// ── PDF builder helpers ─────────────────────────────────────────────
class PDF {
  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.W = 210;
    this.H = 297;
    this.ml = 15; // margin left
    this.mr = 15; // margin right
    this.cw = this.W - this.ml - this.mr; // content width
    this.y = 0;
    this.pageNum = 1;
    this.totalPages = 1; // updated at end
    this.doc.setFont('helvetica');
  }

  rgb(c) { this.doc.setTextColor(...c); }
  fill(c) { this.doc.setFillColor(...c); }
  draw(c) { this.doc.setDrawColor(...c); }

  rect(x, y, w, h, style = 'F') { this.doc.rect(x, y, w, h, style); }

  text(str, x, y, opts = {}) {
    this.doc.text(String(str || ''), x, y, opts);
  }

  setFont(size, style = 'normal', color = C.darkText) {
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', style);
    this.rgb(color);
  }

  line(y) {
    this.draw(C.lineGray);
    this.doc.setLineWidth(0.2);
    this.doc.line(this.ml, y, this.W - this.mr, y);
  }

  addHeader(tipo) {
    // Navy header bar
    this.fill(C.navy);
    this.rect(0, 0, this.W, 28);

    // Orange accent stripe
    this.fill(C.orange);
    this.rect(0, 28, this.W, 3);

    // CIGAM title
    this.setFont(18, 'bold', C.white);
    this.text('CIGAM', this.ml, 13);
    this.setFont(7, 'normal', C.midGray);
    this.text('by Senior', this.ml, 18);

    // Document title (right-aligned)
    this.setFont(10, 'bold', C.white);
    this.text(DOC_LABELS[tipo] || tipo, this.W - this.mr, 12, { align: 'right' });

    // Date
    this.setFont(7, 'normal', C.midGray);
    this.text(format(new Date(), "dd/MM/yyyy", { locale: ptBR }), this.W - this.mr, 18, { align: 'right' });

    this.y = 40;
  }

  addFooter() {
    const fy = this.H - 12;
    this.fill(C.navy);
    this.rect(0, this.H - 14, this.W, 14);
    this.setFont(7, 'normal', C.midGray);
    this.text('www.cigam.com.br  |  0800 377 2442', this.ml, fy);
    this.text(`Página ${this.pageNum}`, this.W - this.mr, fy, { align: 'right' });
  }

  newPage(tipo) {
    this.addFooter();
    this.doc.addPage();
    this.pageNum++;
    this.addHeader(tipo);
  }

  checkY(needed, tipo) {
    if (this.y + needed > this.H - 22) this.newPage(tipo);
  }

  sectionTitle(title, tipo) {
    this.checkY(14, tipo);
    this.fill(C.navy);
    this.rect(this.ml, this.y, this.cw, 8);
    this.setFont(9, 'bold', C.white);
    this.text(title, this.ml + 3, this.y + 5.5);
    this.y += 11;
  }

  field(label, value, tipo, half = false) {
    const val = value || '—';
    const w = half ? this.cw / 2 - 2 : this.cw;
    const lines = this.doc.splitTextToSize(String(val), w - 4);
    const needed = 6 + lines.length * 4.5 + 4;
    this.checkY(needed, tipo);

    // Label
    this.setFont(7, 'bold', C.navy);
    this.text(label, this.ml, this.y + 4);
    this.y += 5;

    // Value box
    this.fill(C.lightGray);
    this.draw(C.lineGray);
    this.doc.setLineWidth(0.2);
    const boxH = lines.length * 4.5 + 4;
    this.rect(this.ml, this.y, w, boxH, 'FD');
    this.setFont(8, 'normal', C.darkText);
    this.doc.text(lines, this.ml + 2, this.y + 3.5);
    this.y += boxH + 3;
  }

  twoFields(label1, val1, label2, val2, tipo) {
    const halfW = this.cw / 2 - 2;
    const v1 = String(val1 || '—');
    const v2 = String(val2 || '—');
    const l1 = this.doc.splitTextToSize(v1, halfW - 4);
    const l2 = this.doc.splitTextToSize(v2, halfW - 4);
    const linesH = Math.max(l1.length, l2.length) * 4.5 + 4;
    const needed = 6 + linesH + 4;
    this.checkY(needed, tipo);

    const x2 = this.ml + halfW + 4;

    // Labels
    this.setFont(7, 'bold', C.navy);
    this.text(label1, this.ml, this.y + 4);
    this.text(label2, x2, this.y + 4);
    this.y += 5;

    // Value boxes
    this.fill(C.lightGray); this.draw(C.lineGray); this.doc.setLineWidth(0.2);
    this.rect(this.ml, this.y, halfW, linesH, 'FD');
    this.rect(x2, this.y, halfW, linesH, 'FD');
    this.setFont(8, 'normal', C.darkText);
    this.doc.text(l1, this.ml + 2, this.y + 3.5);
    this.doc.text(l2, x2 + 2, this.y + 3.5);
    this.y += linesH + 3;
  }

  tableRow(cols, widths, isHeader, tipo) {
    const rowH = isHeader ? 7 : 6;
    this.checkY(rowH + 1, tipo);
    let x = this.ml;
    cols.forEach((c, i) => {
      const w = widths[i];
      if (isHeader) { this.fill(C.navy); this.draw(C.navy); }
      else { this.fill(i % 2 === 0 ? C.white : C.lightGray); this.draw(C.lineGray); }
      this.doc.setLineWidth(0.2);
      this.rect(x, this.y, w, rowH, 'FD');
      this.setFont(isHeader ? 7 : 7.5, isHeader ? 'bold' : 'normal', isHeader ? C.white : C.darkText);
      const lines = this.doc.splitTextToSize(String(c || ''), w - 3);
      this.doc.text(lines[0], x + 1.5, this.y + rowH / 2 + 1.5);
      x += w;
    });
    this.y += rowH;
  }

  boolField(label, value, tipo) {
    this.checkY(7, tipo);
    this.fill(value ? [220, 240, 220] : C.lightGray);
    this.draw(C.lineGray);
    this.doc.setLineWidth(0.2);
    this.rect(this.ml, this.y, this.cw, 6, 'FD');
    this.setFont(7, 'bold', C.navy);
    this.text(label, this.ml + 2, this.y + 4);
    this.setFont(7, 'normal', value ? [0, 120, 0] : C.midGray);
    this.text(value ? '✓ Sim' : '✗ Não', this.W - this.mr - 12, this.y + 4);
    this.y += 7;
  }

  spacer(h = 4) { this.y += h; }

  checklistRow(label, resposta, impacto, tipo) {
    const rowH = 6;
    this.checkY(rowH, tipo);
    const rColor = resposta === 'sim' ? [220,240,220] : resposta === 'nao' ? [255,225,220] : C.lightGray;
    this.fill(rColor); this.draw(C.lineGray); this.doc.setLineWidth(0.2);
    this.rect(this.ml, this.y, this.cw - 30, rowH, 'FD');
    this.rect(this.ml + this.cw - 29, this.y, 15, rowH, 'FD');
    this.rect(this.ml + this.cw - 13, this.y, 13, rowH, 'FD');

    this.setFont(7, 'normal', C.darkText);
    const lines = this.doc.splitTextToSize(label, this.cw - 33);
    this.doc.text(lines[0], this.ml + 2, this.y + 4);

    const rLabel = resposta === 'sim' ? 'Sim' : resposta === 'nao' ? 'Não' : resposta === 'na' ? 'N/A' : '—';
    this.setFont(7, 'bold', resposta === 'sim' ? [0,100,0] : resposta === 'nao' ? [180,0,0] : C.midGray);
    this.text(rLabel, this.ml + this.cw - 21, this.y + 4, { align: 'center' });

    this.setFont(7, 'normal', C.darkText);
    this.text(impacto || '—', this.ml + this.cw - 6, this.y + 4, { align: 'center' });

    this.y += rowH;
  }

  save(filename) {
    this.addFooter();
    this.doc.save(filename);
  }
}

// ── Document renderers ──────────────────────────────────────────────

function renderDadosIniciais(p, c) {
  const tipo = 'dados_iniciais';
  p.sectionTitle('1. Dados do Cliente', tipo);
  p.twoFields('Vendedor CIGAM', c.vendedor_cigam, 'Data do Questionário', c.data_questionario, tipo);
  p.twoFields('Razão Social', c.razao_social, 'CNPJ', c.cnpj, tipo);
  p.twoFields('Município', c.municipio, 'UF', c.uf, tipo);
  p.twoFields('Pessoa de Contato', c.contato, 'Telefone', c.telefone, tipo);
  p.field('E-mail', c.email, tipo);

  p.spacer();
  p.sectionTitle('2. Informações Estratégicas', tipo);
  p.field('Faturamento Anual do Grupo Econômico', c.faturamento_anual, tipo);
  p.field('Como o cliente chegou até a CIGAM?', c.como_chegou, tipo);
  p.field('O que motivou a troca de sistema?', c.motivou_troca, tipo);
  p.field('Expectativas com o novo ERP', c.expectativas, tipo);
  p.field('Sistema de Gestão Atual', c.sistema_atual, tipo);

  p.spacer();
  p.sectionTitle('3. Informações Gerais do Projeto', tipo);
  p.twoFields('Número de Usuários', c.num_usuarios, 'Proposta', c.proposta, tipo);
  p.twoFields('Banco de Dados', c.banco_dados, 'Tipo de Implementação', c.tipo_implementacao, tipo);
  p.boolField('Possui TI Interna?', c.possui_ti_interna, tipo);
  p.boolField('Fluxos Operacionais Documentados?', c.fluxos_documentados, tipo);
  p.boolField('Necessita Customização/Integração?', c.necessita_customizacao, tipo);
  p.boolField('Haverá Importação de Dados?', c.haverá_importacao, tipo);
  p.field('Observações Gerais', c.observacoes, tipo);
  p.field('Data do Fechamento da Venda', c.data_fechamento, tipo);
}

function renderTermoAbertura(p, c) {
  const tipo = 'termo_abertura';
  p.sectionTitle('1. Designação do Gerente de Projeto', tipo);
  p.twoFields('Gerente Designado', c.gerente_nome, 'Data da Designação', c.data_designacao, tipo);
  p.field('Descrição da Designação', c.descricao_designacao, tipo);

  p.spacer();
  p.sectionTitle('2. Objetivos do Projeto', tipo);
  p.field('Objetivos Principais', c.objetivos, tipo);

  if (c.premissas?.length || c.restricoes?.length) {
    p.spacer();
    p.sectionTitle('3. Premissas e Restrições', tipo);
    if (c.premissas?.length) {
      const tw = [p.cw];
      p.tableRow(['Premissas'], tw, true, tipo);
      c.premissas.forEach(r => p.tableRow([r.descricao], tw, false, tipo));
      p.spacer();
    }
    if (c.restricoes?.length) {
      const tw = [p.cw];
      p.tableRow(['Restrições'], tw, true, tipo);
      c.restricoes.forEach(r => p.tableRow([r.descricao], tw, false, tipo));
    }
  }

  p.spacer();
  p.sectionTitle('4. Prazos e Investimentos', tipo);
  p.twoFields('Estimativa de Entrega', c.estimativa_entrega, 'Investimento Estimado (R$)', c.investimento_estimado, tipo);

  if (c.pessoas_envolvidas?.length) {
    p.spacer();
    p.sectionTitle('5. Pessoas Envolvidas', tipo);
    const tw = [p.cw * 0.4, p.cw * 0.3, p.cw * 0.3];
    p.tableRow(['Nome', 'Cargo/Função', 'Empresa'], tw, true, tipo);
    c.pessoas_envolvidas.forEach(r => p.tableRow([r.nome, r.cargo, r.empresa], tw, false, tipo));
  }

  if (c.marcos?.length) {
    p.spacer();
    p.sectionTitle('6. Marcos do Projeto', tipo);
    const tw = [p.cw * 0.7, p.cw * 0.3];
    p.tableRow(['Fase / Marco', 'Data Prevista'], tw, true, tipo);
    c.marcos.forEach(r => p.tableRow([r.fase, r.data_prevista], tw, false, tipo));
  }

  p.spacer();
  p.sectionTitle('7. Aprovações', tipo);
  p.twoFields('Coordenador', c.aprov_coordenador, 'Gerente do Projeto', c.aprov_gerente, tipo);
  p.twoFields('Patrocinador', c.aprov_patrocinador, 'Data de Aprovação', c.data_aprovacao, tipo);
}

function renderPlanoProjeto(p, c) {
  const tipo = 'plano_projeto';
  p.sectionTitle('I. Objetivo do Projeto', tipo);
  p.field('Descrição do Objetivo', c.objetivo, tipo);

  p.spacer();
  p.sectionTitle('II. Justificativa / Expectativa', tipo);
  p.field('Justificativa e Expectativas', c.justificativa, tipo);

  p.spacer();
  p.sectionTitle('III. Escopo Detalhado', tipo);
  p.field('Descrição do Escopo', c.escopo_descricao, tipo);
  p.twoFields('Módulos Incluídos', c.modulos_incluidos, 'Módulos Excluídos', c.modulos_excluidos, tipo);

  if (c.cronograma?.length) {
    p.spacer();
    p.sectionTitle('IV. Cronograma Macro', tipo);
    const tw = [p.cw * 0.35, p.cw * 0.22, p.cw * 0.25, p.cw * 0.18];
    p.tableRow(['Pacote de Trabalho', 'Data Prevista', 'Responsável', 'Status'], tw, true, tipo);
    c.cronograma.forEach(r => p.tableRow([r.pacote, r.data_prevista, r.responsavel, r.status], tw, false, tipo));
  }

  p.spacer();
  p.sectionTitle('V. Aprovações', tipo);
  p.twoFields('Patrocinador', c.aprov_patrocinador, 'Gestor PMO', c.aprov_pmo, tipo);
  p.twoFields('Gerente do Projeto', c.aprov_gerente, 'Data de Aprovação', c.data_aprovacao, tipo);
}

function renderTermoComprometimento(p, c) {
  const tipo = 'termo_comprometimento';
  p.sectionTitle('Identificação', tipo);
  p.twoFields('Empresa', c.empresa, 'Data do Go Live', c.data_go_live, tipo);

  p.spacer();
  p.sectionTitle('Declarações', tipo);
  p.field('Acordo com o Cronograma da Virada', c.acordo_cronograma, tipo);
  p.field('Aptidão para Operar o Sistema', c.aptidao_operacao, tipo);
  p.field('Validação dos Processos', c.validacao_processos, tipo);
  p.field('Pendências Remanescentes', c.pendencias_remanescentes, tipo);

  if (c.participantes?.length) {
    p.spacer();
    p.sectionTitle('Participantes / Assinantes', tipo);
    const tw = [p.cw * 0.45, p.cw * 0.35, p.cw * 0.2];
    p.tableRow(['Nome', 'Função', 'Status'], tw, true, tipo);
    c.participantes.forEach(r => p.tableRow([r.nome, r.funcao, r.status], tw, false, tipo));
  }

  p.spacer();
  p.sectionTitle('Considerações Finais', tipo);
  p.field('Considerações', c.consideracoes, tipo);
}

function renderTermoEncerramento(p, c) {
  const tipo = 'termo_encerramento';
  p.sectionTitle('Tipo de Encerramento', tipo);
  p.field('Tipo', c.tipo_encerramento, tipo);
  p.field('Motivo', c.motivo, tipo);

  p.spacer();
  p.sectionTitle('Identificação do Projeto', tipo);
  p.twoFields('Nome do Projeto', c.nome_projeto, 'Gerente do Projeto', c.gerente, tipo);
  p.twoFields('Data do Go Live', c.data_go_live, 'Data de Entrega/Encerramento', c.data_entrega, tipo);

  p.spacer();
  p.sectionTitle('Objetivo e Observações', tipo);
  p.field('Objetivo do Projeto', c.objetivo, tipo);
  p.field('Observações Adicionais', c.observacoes, tipo);

  if (c.aprovadores?.length) {
    p.spacer();
    p.sectionTitle('Aprovações', tipo);
    const tw = [p.cw * 0.35, p.cw * 0.3, p.cw * 0.2, p.cw * 0.15];
    p.tableRow(['Nome', 'Papel', 'Status', 'Data'], tw, true, tipo);
    c.aprovadores.forEach(r => p.tableRow([r.nome, r.papel, r.status, r.data], tw, false, tipo));
  }
}

function renderLicoesAprendidas(p, c) {
  const tipo = 'licoes_aprendidas';
  const GRUPOS = ['Requisitos e Objetivos','Gestão e Riscos','Pessoas e Equipe','Planejamento','Execução e Controle','Comunicação e Stakeholders','Encerramento'];
  const CHECKLIST = [
    { grupo: 'Requisitos e Objetivos', key: 'req_usuario', label: 'Os requisitos do usuário foram claramente definidos e documentados?' },
    { grupo: 'Requisitos e Objetivos', key: 'metas_definidas', label: 'As metas do projeto foram adequadamente definidas e mensuráveis?' },
    { grupo: 'Requisitos e Objetivos', key: 'aderencia_objetivos', label: 'O projeto aderiu aos objetivos estabelecidos no Termo de Abertura?' },
    { grupo: 'Requisitos e Objetivos', key: 'conceito_aplicavel', label: 'O conceito da solução foi aplicável à realidade do cliente?' },
    { grupo: 'Requisitos e Objetivos', key: 'definicao_projeto', label: 'O projeto foi definido de forma adequada antes de iniciar?' },
    { grupo: 'Gestão e Riscos', key: 'gestao_riscos', label: 'A gestão de riscos foi eficaz durante todo o projeto?' },
    { grupo: 'Gestão e Riscos', key: 'tecnologia_testada', label: 'A tecnologia foi testada antes da implantação no cliente?' },
    { grupo: 'Gestão e Riscos', key: 'sobrecarga_projetos', label: 'Houve sobrecarga por múltiplos projetos simultâneos na equipe?' },
    { grupo: 'Gestão e Riscos', key: 'reporte_gerente', label: 'O gerente de projeto reportou adequadamente o status e riscos?' },
    { grupo: 'Pessoas e Equipe', key: 'selecao_pessoas', label: 'A seleção de pessoas para o projeto foi adequada?' },
    { grupo: 'Pessoas e Equipe', key: 'treinamento_equipe', label: 'O treinamento da equipe de implantação foi suficiente?' },
    { grupo: 'Pessoas e Equipe', key: 'organizacao_escritorio', label: 'O escritório do projeto foi bem organizado e gerenciado?' },
    { grupo: 'Pessoas e Equipe', key: 'disponibilidade_recursos', label: 'Os recursos estiveram disponíveis conforme planejado?' },
    { grupo: 'Pessoas e Equipe', key: 'adequacao_time', label: 'O time do projeto foi adequado em competência e tamanho?' },
    { grupo: 'Pessoas e Equipe', key: 'eficacia_gerente', label: 'O gerente de projeto foi eficaz na condução do projeto?' },
    { grupo: 'Planejamento', key: 'planejamento_detalhado', label: 'O planejamento foi suficientemente detalhado e realista?' },
    { grupo: 'Planejamento', key: 'orcamento_adequado', label: 'O orçamento foi adequado e bem controlado?' },
    { grupo: 'Planejamento', key: 'definicao_tarefas', label: 'As tarefas foram claramente definidas e atribuídas?' },
    { grupo: 'Execução e Controle', key: 'controle_mudancas', label: 'O controle de mudanças funcionou adequadamente?' },
    { grupo: 'Execução e Controle', key: 'clareza_especificacoes', label: 'As especificações estavam claras o suficiente para a equipe?' },
    { grupo: 'Execução e Controle', key: 'suficiencia_documentacao', label: 'A documentação do projeto foi suficiente e mantida atualizada?' },
    { grupo: 'Execução e Controle', key: 'qualidade_performance', label: 'A qualidade e performance da solução atenderam às expectativas?' },
    { grupo: 'Execução e Controle', key: 'variacao_custos', label: 'A variação de custos ficou dentro do tolerável?' },
    { grupo: 'Execução e Controle', key: 'controles_time', label: 'Os controles internos do time foram eficazes?' },
    { grupo: 'Execução e Controle', key: 'controles_gerencia', label: 'Os controles da gerência foram adequados?' },
    { grupo: 'Comunicação e Stakeholders', key: 'comunicacao', label: 'A comunicação entre as partes foi eficaz e frequente?' },
    { grupo: 'Comunicação e Stakeholders', key: 'cooperacao_areas', label: 'Houve boa cooperação entre as áreas envolvidas?' },
    { grupo: 'Comunicação e Stakeholders', key: 'autoridade_responsabilidade', label: 'A autoridade e responsabilidade foram claramente definidas?' },
    { grupo: 'Comunicação e Stakeholders', key: 'suporte_gerencia', label: 'O suporte da alta gestão foi adequado e presente?' },
    { grupo: 'Encerramento', key: 'redirecionamento', label: 'O projeto precisou ser redirecionado? Se sim, foi bem conduzido?' },
    { grupo: 'Encerramento', key: 'criterios_encerramento', label: 'Os critérios de encerramento foram claros e cumpridos?' },
    { grupo: 'Encerramento', key: 'treinamento_usuarios', label: 'O treinamento dos usuários finais foi suficiente para o go live?' },
  ];

  const checklist = c.checklist || {};

  GRUPOS.forEach(grupo => {
    p.spacer();
    p.sectionTitle(grupo, tipo);

    // Table header
    const tw = [p.cw - 28, 14, 14];
    p.tableRow(['Item de Avaliação', 'Resposta', 'Impacto'], tw, true, tipo);

    CHECKLIST.filter(i => i.grupo === grupo).forEach(item => {
      const entry = checklist[item.key] || {};
      const rLabel = entry.resposta === 'sim' ? 'Sim' : entry.resposta === 'nao' ? 'Não' : entry.resposta === 'na' ? 'N/A' : '—';
      p.tableRow([item.label, rLabel, entry.impacto || '—'], tw, false, tipo);
    });
  });

  p.spacer();
  p.sectionTitle('Reflexões Finais', tipo);
  p.field('O que faríamos da mesma forma?', c.mesma_forma, tipo);
  p.field('O que deveríamos fazer diferente?', c.forma_diferente, tipo);
  p.field('Aprendizados do Projeto', c.aprendizado, tipo);
  p.field('Recomendações para Projetos Futuros', c.recomendacoes, tipo);

  if (c.aprovadores?.length) {
    p.spacer();
    p.sectionTitle('Aprovações', tipo);
    const tw = [p.cw * 0.35, p.cw * 0.3, p.cw * 0.2, p.cw * 0.15];
    p.tableRow(['Nome', 'Papel', 'Status', 'Data'], tw, true, tipo);
    c.aprovadores.forEach(r => p.tableRow([r.nome, r.papel, r.status, r.data], tw, false, tipo));
  }
}

// ── Public API ──────────────────────────────────────────────────────
export function generateDocumentPDF(tipo, conteudo, projectName) {
  const p = new PDF();
  const c = conteudo || {};
  const label = DOC_LABELS[tipo] || tipo;

  p.addHeader(tipo);

  // Project identification bar
  p.fill(C.lightGray);
  p.rect(p.ml, p.y, p.cw, 8);
  p.setFont(8, 'bold', C.navy);
  p.text(`Projeto: ${projectName || 'N/A'}`, p.ml + 3, p.y + 5.5);
  p.y += 11;
  p.spacer(2);

  if (tipo === 'dados_iniciais') renderDadosIniciais(p, c);
  else if (tipo === 'termo_abertura') renderTermoAbertura(p, c);
  else if (tipo === 'plano_projeto') renderPlanoProjeto(p, c);
  else if (tipo === 'termo_comprometimento') renderTermoComprometimento(p, c);
  else if (tipo === 'termo_encerramento') renderTermoEncerramento(p, c);
  else if (tipo === 'licoes_aprendidas') renderLicoesAprendidas(p, c);

  const filename = `CIGAM_${label.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  p.save(filename);
}