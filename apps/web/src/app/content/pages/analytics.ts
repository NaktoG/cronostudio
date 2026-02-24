export const ANALYTICS_COPY = {
  title: 'Analytics',
  subtitle: 'Resumen de rendimiento de tus videos',
  filters: {
    channel: 'Canal',
    allChannels: 'Todos los canales',
    groupBy: 'Agrupar por',
    from: 'Desde',
    to: 'Hasta',
    range: 'Rango de fechas',
    day: 'Dia',
    week: 'Semana',
    month: 'Mes',
    reset: 'Reset',
    quickSuffix: 'dias',
    quick: [7, 30, 90],
  },
  cards: {
    views: 'Views totales',
    watchTime: 'Tiempo total',
    avgDuration: 'Duracion media',
    period: 'Ultimo periodo',
  },
  chart: {
    title: 'Views por periodo',
    empty: 'Sin datos disponibles',
    loading: 'Cargando datos...',
    showMore: 'Ver 30',
    showLess: 'Ver 10',
  },
  empty: {
    title: 'No hay datos de analytics disponibles',
    subtitle: 'Los datos apareceran cuando empieces a registrar metricas',
  },
  errors: {
    load: 'Error al cargar analytics',
    unknown: 'Error desconocido',
  },
};
