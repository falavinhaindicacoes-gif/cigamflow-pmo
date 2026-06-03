import { base44 } from '@/api/base44Client';

export async function updateProjectMetrics(projectId, queryClient) {
  // Buscar módulos válidos do projeto e itens em paralelo
  const [projectModules, allModuleItems] = await Promise.all([
    base44.entities.ProjectModule.filter({ project_id: projectId }, 'ordem', 1000),
    base44.entities.ModuleItem.filter({ project_id: projectId }, '-created_date', 1000),
  ]);

  const validModuleIds = new Set(projectModules.map(m => m.id));
  const moduleItems = allModuleItems.filter(item => validModuleIds.has(item.project_module_id));

  const totalHoras = moduleItems.reduce((sum, item) => sum + (item.horas_necessarias || 0), 0);
  const horasRealizadas = moduleItems
    .filter(item => item.status === 'concluido')
    .reduce((sum, item) => sum + (item.horas_necessarias || 0), 0);
  const percentualProgresso = totalHoras > 0 ? Math.round((horasRealizadas / totalHoras) * 100) : 0;

  const metrics = { horas_previstas: totalHoras, horas_realizadas: horasRealizadas, percentual_progresso: percentualProgresso };

  await base44.entities.Project.update(projectId, metrics);

  // Atualiza o cache imediatamente sem precisar de re-fetch
  if (queryClient) {
    queryClient.setQueryData(['project', projectId], (old) => old ? { ...old, ...metrics } : undefined);
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }

  return { success: true, totalHoras, horasRealizadas, percentualProgresso };
}