import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, CheckCircle, Clock, AlertCircle, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DOCS = [
  { tipo: 'dados_iniciais', label: 'Dados Iniciais / Proposta', desc: 'Questionário de levantamento e contexto do projeto', fase: 'comercial' },
  { tipo: 'termo_abertura', label: 'Termo de Abertura', desc: 'Designação do GP e autorização formal do projeto', fase: 'inicializacao' },
  { tipo: 'plano_projeto', label: 'Plano de Projeto', desc: 'Planejamento completo, escopo, cronograma e papéis', fase: 'planejamento' },
  { tipo: 'termo_comprometimento', label: 'Termo de Comprometimento', desc: 'Aprovação da virada e aptidão para go live', fase: 'preparacao_virada' },
  { tipo: 'termo_encerramento', label: 'Termo de Encerramento', desc: 'Formalização do encerramento do projeto', fase: 'encerramento' },
  { tipo: 'licoes_aprendidas', label: 'Lições Aprendidas', desc: 'Registro e checklist de aprendizados do projeto', fase: 'encerramento' },
];

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pendente_aprovacao: { label: 'Pendente Aprovação', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

export default function ProjectDocuments({ projectId, onOpenDoc }) {
  const { data: docs = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => base44.entities.ProjectDocument.filter({ project_id: projectId }),
  });

  const getDoc = (tipo) => docs.find(d => d.tipo === tipo);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documentos da Metodologia</h3>
      <div className="grid gap-3">
        {DOCS.map((doc) => {
          const existing = getDoc(doc.tipo);
          const statusInfo = existing ? STATUS_CONFIG[existing.status] || STATUS_CONFIG.rascunho : null;
          const Icon = statusInfo ? statusInfo.icon : FileText;

          return (
            <button
              key={doc.tipo}
              onClick={() => onOpenDoc(doc.tipo, existing)}
              className="w-full text-left bg-card border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${existing ? 'bg-primary/10' : 'bg-muted'}`}>
                <FileText className={`w-5 h-5 ${existing ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-medium text-sm">{doc.label}</span>
                  {existing && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{doc.desc}</p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {!existing && (
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Criar
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}