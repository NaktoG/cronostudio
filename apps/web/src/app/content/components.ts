export const COMPONENT_COPY = {
  priorityActions: {
    title: 'Acciones pendientes',
    emptyTitle: '¡Todo al dia!',
    emptySubtitle: 'Sin pendientes por ahora',
    createTitle: 'Crear nuevo contenido',
    createSubtitle: 'Empieza aqui',
    goTo: 'Ir',
    itemsLabel: 'items',
  },
  productionsList: {
    emptyActive: 'Sin contenidos activos',
    emptyStage: 'Sin contenidos en esta etapa',
    changeFilter: 'Cambiar filtro →',
    createFirst: 'Crear tu primer contenido →',
    new: '+ Nuevo',
    reviewScript: 'Revisar guion',
  },
  automationRuns: {
    title: 'Automatizaciones',
    emptyTitle: 'Sin ejecuciones recientes',
    emptySubtitle: 'Los agentes estan listos',
    runsLabel: 'runs',
    now: 'ahora',
    minutesAgo: 'hace {n}m',
    hoursAgo: 'hace {n}h',
  },
  pipeline: {
    title: 'Pipeline de produccion',
    totalLabel: 'contenidos',
  },
} as const;
