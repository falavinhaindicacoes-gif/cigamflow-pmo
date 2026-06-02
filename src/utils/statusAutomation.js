import { base44 } from '@/api/base44Client';

/**
 * Atualiza automaticamente o status de um ModuleItem baseado no status dos seus sub-itens
 * Se todos os sub-itens estão concluídos, marca o item como concluído
 */
export const updateItemStatusFromSubItems = async (itemId, projectId) => {
  try {
    const subItems = await base44.entities.ModuleSubItem.filter({ module_item_id: itemId }, 'ordem', 500);
    
    if (!subItems.length) return; // Sem sub-itens, sem automação
    
    const allCompleted = subItems.every(s => s.concluido === true);
    const anyCompleted = subItems.some(s => s.concluido === true);
    
    // Se todos estão concluídos, marca item como concluído
    if (allCompleted) {
      await base44.entities.ModuleItem.update(itemId, { status: 'concluido' });
    }
    // Se nenhum estava completo e agora tem algum, marca como em_andamento
    else if (anyCompleted && subItems.length > 0) {
      const item = await base44.entities.ModuleItem.filter({ id: itemId });
      if (item[0]?.status === 'nao_iniciado') {
        await base44.entities.ModuleItem.update(itemId, { status: 'em_andamento' });
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status do item:', error);
  }
};

/**
 * Atualiza automaticamente o status de um ProjectModule baseado no status dos seus itens
 * Se todos os itens estão concluídos, marca o módulo como concluído
 */
export const updateModuleStatusFromItems = async (moduleId, projectId) => {
  try {
    const items = await base44.entities.ModuleItem.filter({ project_module_id: moduleId }, 'ordem', 500);
    
    if (!items.length) return; // Sem itens, sem automação
    
    const allCompleted = items.every(i => i.status === 'concluido');
    const anyCompleted = items.some(i => i.status === 'concluido');
    const anyInProgress = items.some(i => i.status === 'em_andamento');
    
    // Se todos estão concluídos, marca módulo como concluído
    if (allCompleted) {
      await base44.entities.ProjectModule.update(moduleId, { status: 'concluido' });
    }
    // Se tem alguns completos ou em andamento, marca como em_andamento
    else if (anyCompleted || anyInProgress) {
      const module = await base44.entities.ProjectModule.filter({ id: moduleId });
      if (module[0]?.status === 'nao_iniciado') {
        await base44.entities.ProjectModule.update(moduleId, { status: 'em_andamento' });
      }
    }
  } catch (error) {
    console.error('Erro ao atualizar status do módulo:', error);
  }
};

/**
 * Reverte status de um item para não_iniciado quando um sub-item é marcado como incompleto
 */
export const revertItemStatusIfNeeded = async (itemId) => {
  try {
    const item = await base44.entities.ModuleItem.filter({ id: itemId });
    if (!item[0]) return;
    
    const subItems = await base44.entities.ModuleSubItem.filter({ module_item_id: itemId }, 'ordem', 500);
    
    // Se o item está concluído mas tem sub-itens incompletos, volta para em_andamento
    if (item[0].status === 'concluido' && subItems.some(s => !s.concluido)) {
      await base44.entities.ModuleItem.update(itemId, { status: 'em_andamento' });
    }
  } catch (error) {
    console.error('Erro ao reverter status do item:', error);
  }
};

/**
 * Reverte status de um módulo para não_iniciado quando um item é marcado como incompleto
 */
export const revertModuleStatusIfNeeded = async (moduleId) => {
  try {
    const module = await base44.entities.ProjectModule.filter({ id: moduleId });
    if (!module[0]) return;
    
    const items = await base44.entities.ModuleItem.filter({ project_module_id: moduleId }, 'ordem', 500);
    
    // Se o módulo está concluído mas tem itens incompletos, volta para em_andamento
    if (module[0].status === 'concluido' && items.some(i => i.status !== 'concluido')) {
      await base44.entities.ProjectModule.update(moduleId, { status: 'em_andamento' });
    }
  } catch (error) {
    console.error('Erro ao reverter status do módulo:', error);
  }
};