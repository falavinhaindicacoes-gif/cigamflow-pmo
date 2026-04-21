import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserCog } from 'lucide-react';
import CapacityGauge from '@/components/shared/CapacityGauge';

export default function ProjectTeam({ projectId }) {
  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations', projectId],
    queryFn: () => base44.entities.Allocation.filter({ project_id: projectId }, '-created_date', 50),
    enabled: !!projectId,
  });
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 100),
  });
  const { data: allAllocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list('-created_date', 200),
  });

  const activeAllocations = allocations.filter(a => a.status === 'ativa');

  const getConsultant = (id) => consultants.find(c => c.id === id);

  const getOccupancy = (consultantId) => {
    const consultant = getConsultant(consultantId);
    if (!consultant) return 0;
    const allActive = allAllocations.filter(a => a.consultant_id === consultantId && a.status === 'ativa');
    const totalHours = allActive.reduce((sum, a) => sum + (a.horas_semanais || 0), 0);
    return consultant.capacidade_semanal ? (totalHours / consultant.capacidade_semanal) * 100 : 0;
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-4">
        <h3 className="font-semibold text-sm mb-4">Equipe Alocada ({activeAllocations.length} consultores)</h3>
        {activeAllocations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum consultor alocado</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeAllocations.map((alloc) => {
              const consultant = getConsultant(alloc.consultant_id);
              const occupancy = getOccupancy(alloc.consultant_id);
              return (
                <div key={alloc.id} className="flex items-center gap-3 p-3 rounded-lg border bg-background">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{consultant?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground">{alloc.papel_no_projeto || alloc.especialidade_aplicada || '-'}</p>
                    <p className="text-xs text-muted-foreground">{alloc.horas_semanais || 0}h/semana</p>
                    <div className="mt-1">
                      <CapacityGauge percentage={occupancy} size="sm" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}