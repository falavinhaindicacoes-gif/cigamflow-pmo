import { base44 } from '@/api/base44Client';

export async function updateProjectMetrics(projectId) {
  try {
    const moduleItems = await base44.entities.ModuleItem.filter(
      { project_id: projectId },
      '-created_date',
      1000
    );

    const totalHoras = moduleItems.reduce(
      (sum, item) => sum + (item.horas_necessarias || 0),
      0
    );

    const horasRealizadas = moduleItems
      .filter((item) => item.status === 'concluido')
      .reduce((sum, item) => sum + (item.horas_necessarias || 0), 0);

    const percentualProgresso =
      totalHoras > 0 ? Math.round((horasRealizadas / totalHoras) * 100) : 0;

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