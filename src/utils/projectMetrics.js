import { base44 } from '@/api/base44Client';

export async function updateProjectMetrics(projectId) {
  try {
    // Buscar módulos válidos do projeto
    const projectModules = await base44.entities.ProjectModule.filter(
      { project_id: projectId },
      'ordem',
      1000
    );
    const validModuleIds = new Set(projectModules.map(m => m.id));

    // Buscar itens apenas dos módulos válidos
    const allModuleItems = await base44.entities.ModuleItem.filter(
      { project_id: projectId },
      '-created_date',
      1000
    );
    const moduleItems = allModuleItems.filter(item => validModuleIds.has(item.project_module_id));

    const totalHoras = moduleItems.reduce(
      (sum, item) => sum + (item.horas_necessarias || 0),
      0
    );

    const horasRealizadas = moduleItems
      .filter((item) => item.status === 'concluido')
      .reduce((sum, item) => sum + (item.horas_necessarias || 0), 0);

    // Percentual = (horas realizadas / horas previstas) * 100
    const percentualProgresso = totalHoras > 0 ? Math.round((horasRealizadas / totalHoras) * 100) : 0;

    await base44.entities.Project.update(projectId, {
      horas_previstas: totalHoras,
      horas_realizadas: horasRealizadas,
      percentual_progresso: percentualProgresso,
    });

    return { success: true, totalHoras, horasRealizadas, percentualProgresso };
  } catch (error) {
    console.error('Error updating project metrics:', error);
    throw error;
  }
}