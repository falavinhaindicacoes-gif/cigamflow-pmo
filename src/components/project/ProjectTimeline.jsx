import React from 'react';
import { FASES_PROJETO } from '@/lib/constants';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectTimeline({ project }) {
  const currentIndex = FASES_PROJETO.findIndex(f => f.value === project.fase_atual);

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-sm mb-6">Cronograma de Fases</h3>
        <div className="relative">
          {FASES_PROJETO.map((fase, index) => {
            const isPast = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isFuture = index > currentIndex;
            return (
              <div key={fase.value} className="flex items-start gap-4 mb-6 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                    isPast && "bg-green-500 border-green-500",
                    isCurrent && "bg-primary border-primary",
                    isFuture && "bg-background border-muted-foreground/30"
                  )}>
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground/30" />
                    )}
                  </div>
                  {index < FASES_PROJETO.length - 1 && (
                    <div className={cn(
                      "w-0.5 h-8",
                      isPast ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
                <div className={cn("pt-1", isFuture && "opacity-50")}>
                  <p className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-primary"
                  )}>{fase.label}</p>
                  {isCurrent && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                      Fase Atual
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6">
        <h3 className="font-semibold text-sm mb-4">Resumo de Prazos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Data Início</p>
            <p className="text-sm font-medium mt-1">{project.data_inicio ? new Date(project.data_inicio).toLocaleDateString('pt-BR') : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Previsão Término</p>
            <p className="text-sm font-medium mt-1">{project.data_prevista_termino ? new Date(project.data_prevista_termino).toLocaleDateString('pt-BR') : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Término Real</p>
            <p className="text-sm font-medium mt-1">{project.data_real_termino ? new Date(project.data_real_termino).toLocaleDateString('pt-BR') : '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}