// Definição central de todas as páginas/áreas controláveis
export const ALL_PAGES = [
  { slug: 'dashboard', label: 'Dashboard', path: '/' },
  { slug: 'projetos', label: 'Projetos', path: '/projects' },
  { slug: 'clientes', label: 'Clientes', path: '/clients' },
  { slug: 'consultores', label: 'Consultores', path: '/consultants' },
  { slug: 'atividades', label: 'Lista de Atividades', path: '/activities' },
  { slug: 'reports', label: 'Status Reports', path: '/reports' },
  { slug: 'agenda', label: 'Agenda', path: '/schedule' },
  { slug: 'templates', label: 'Templates de Módulos', path: '/module-templates' },
  { slug: 'configuracoes', label: 'Configurações', path: '/settings' },
];

export const getPageByPath = (path) => {
  return ALL_PAGES.find(p => {
    if (p.path === '/') return path === '/';
    return path.startsWith(p.path);
  });
};

export const getPageBySlug = (slug) => ALL_PAGES.find(p => p.slug === slug);