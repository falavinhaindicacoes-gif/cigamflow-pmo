import { base44 } from '@/api/base44Client';

/**
 * Atualiza automaticamente o status de um ModuleItem baseado no status dos seus sub-itens.
 * Se todos os sub-itens estão concluídos, marca o item como concluído.
 * Também dispara a atualização do módulo pai.
 */
export const updateItemStatusFromSubItems = async (itemId, projectId) => {
  // Buscar sub-itens e item em paralelo
  const [subItems, itemArr] = await Promise.all([
    base44.entities.ModuleSubItem.filter({ module_item_id: itemId }, 'ordem', 500),
    base44.entities.ModuleItem.filter({ id: itemId }, 'ordem', 1),
  ]);

  if (!subItems.length || !itemArr[0]) return;

  const item = itemArr[0];
  const allCompleted = subItems.every(s => s.status === 'concluido');
  const anyActive = subItems.some(s => s.status === 'em_andamento' || s.status === 'aguardando_confirmacao' || s.status === 'concluido');

  let newStatus = item.status;
  if (allCompleted) {
    newStatus = 'concluido';
  } else if (anyActive && item.status === 'nao_iniciado') {
    newStatus = 'em_andamento';
  } else if (!allCompleted && item.status === 'concluido') {
    newStatus = 'em_andamento';
  }

  if (newStatus !== item.status) {
    await base44.entities.ModuleItem.update(itemId, { status: newStatus });
  }

  // Propagar para o módulo pai
  if (item.project_module_id) {
    await updateModuleStatusFromItems(item.project_module_id, projectId);
  }
};

/**
 * Atualiza automaticamente o status de um ProjectModule baseado no status dos seus itens.
 */
export const updateModuleStatusFromItems = async (moduleId, projectId) => {
  const [items, moduleArr] = await Promise.all([
    base44.entities.ModuleItem.filter({ project_module_id: moduleId }, 'ordem', 500),
    base44.entities.ProjectModule.filter({ id: moduleId }, 'ordem', 1),
  ]);

  if (!items.length || !moduleArr[0]) return;

  const module = moduleArr[0];
  const allCompleted = items.every(i => i.status === 'concluido');
  const anyCompleted = items.some(i => i.status === 'concluido');
  const anyInProgress = items.some(i => i.status === 'em_andamento');

  let newStatus = module.status;
  if (allCompleted) {
    newStatus = 'concluido';
  } else if ((anyCompleted || anyInProgress) && module.status !== 'em_andamento') {
    newStatus = 'em_andamento';
  } else if (!allCompleted && module.status === 'concluido') {
    // Se o módulo estava concluído mas nem todos os itens estão concluídos, reverte para em_andamento
    newStatus = 'em_andamento';
  }

  if (newStatus !== module.status) {
    await base44.entities.ProjectModule.update(moduleId, { status: newStatus });
  }
};

/**
 * Reverte status de um item quando um sub-item é removido/desmarcado.
 */
export const revertItemStatusIfNeeded = async (itemId) => {
  const [itemArr, subItems] = await Promise.all([
    base44.entities.ModuleItem.filter({ id: itemId }, 'ordem', 1),
    base44.entities.ModuleSubItem.filter({ module_item_id: itemId }, 'ordem', 500),
  ]);

  if (!itemArr[0]) return;
  const item = itemArr[0];

  if (item.status === 'concluido' && subItems.some(s => s.status !== 'concluido')) {
    await base44.entities.ModuleItem.update(itemId, { status: 'em_andamento' });
    // Propagar para o módulo pai
    if (item.project_module_id) {
      await revertModuleStatusIfNeeded(item.project_module_id);
    }
  }
};

/**
 * Reverte status de um módulo quando um item é removido/desmarcado.
 */
export const revertModuleStatusIfNeeded = async (moduleId) => {
  const [moduleArr, items] = await Promise.all([
    base44.entities.ProjectModule.filter({ id: moduleId }, 'ordem', 1),
    base44.entities.ModuleItem.filter({ project_module_id: moduleId }, 'ordem', 500),
  ]);

  if (!moduleArr[0]) return;
  const module = moduleArr[0];

  if (module.status === 'concluido' && items.some(i => i.status !== 'concluido')) {
    await base44.entities.ProjectModule.update(moduleId, { status: 'em_andamento' });
  }
};

/**
 * Sincroniza todos os status de módulos de um projeto garantindo consistência
 */
export const syncAllProjectModuleStatuses = async (projectId) => {
  const projectModules = await base44.entities.ProjectModule.filter({ project_id: projectId }, 'ordem', 1000);
  
  for (const module of projectModules) {
    await updateModuleStatusFromItems(module.id, projectId);
  }
};