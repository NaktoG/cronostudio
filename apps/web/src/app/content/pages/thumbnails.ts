import type { Locale } from '@/app/i18n/messages';

const THUMBNAILS_COPY_BY_LOCALE = {
  es: {
    title: 'Miniaturas',
    subtitle: 'Organiza y revisa las miniaturas de tus videos',
    new: 'Nueva miniatura',
    emptyTitle: 'No hay miniaturas todavia',
    emptySubtitle: 'Crea tu primera miniatura',
    create: 'Crear miniatura',
    submittingCreate: 'Creando...',
    delete: 'Eliminar',
    deleteConfirm: '¿Eliminar esta miniatura?',
    cancel: 'Cancelar',
    statusUpdated: 'Estado actualizado',
    controls: {
      channel: 'Canal',
      allChannels: 'Todos los canales',
      selectedCount: 'seleccionadas',
      approve: 'Aprobar',
      designing: 'Disenar',
      clear: 'Limpiar',
      retry: 'Reintentar',
      selectPrefix: 'Seleccionar miniatura',
      select: 'Seleccionar',
      viewProduction: 'Ver produccion',
    },
    list: {
      showMore: 'Ver mas',
      showLess: 'Ver menos',
    },
    modal: {
      scriptIdOptional: 'Script ID (opcional)',
      scriptIdPlaceholder: 'UUID del guion',
      videoIdOptional: 'Video ID (opcional)',
      videoIdPlaceholder: 'UUID del video',
      imageUrlHelper: 'Podes dejarlo vacio y cargar la URL mas tarde.',
    },
    form: {
      title: 'Titulo',
      notes: 'Notas',
      imageUrl: 'URL de imagen',
      placeholderTitle: 'Miniatura para video...',
      placeholderNotes: 'Detalles, estilo o variaciones...',
      placeholderUrl: 'https://.../thumbnail.png',
    },
    statuses: {
      pending: 'Pendiente',
      designing: 'Disenando',
      designed: 'Disenada',
      approved: 'Aprobada',
    },
    toasts: {
      created: 'Miniatura creada',
      deleted: 'Miniatura eliminada',
      error: 'Error',
    },
    errors: {
      create: 'Error al crear miniatura',
      update: 'Error al actualizar miniatura',
      delete: 'Error al eliminar miniatura',
      load: 'Error al cargar miniaturas',
    },
  },
  en: {
    title: 'Thumbnails',
    subtitle: 'Organize and review your video thumbnails',
    new: 'New thumbnail',
    emptyTitle: 'No thumbnails yet',
    emptySubtitle: 'Create your first thumbnail',
    create: 'Create thumbnail',
    submittingCreate: 'Creating...',
    delete: 'Delete',
    deleteConfirm: 'Delete this thumbnail?',
    cancel: 'Cancel',
    statusUpdated: 'Status updated',
    controls: {
      channel: 'Channel',
      allChannels: 'All channels',
      selectedCount: 'selected',
      approve: 'Approve',
      designing: 'Designing',
      clear: 'Clear',
      retry: 'Retry',
      selectPrefix: 'Select thumbnail',
      select: 'Select',
      viewProduction: 'View production',
    },
    list: {
      showMore: 'Show more',
      showLess: 'Show less',
    },
    modal: {
      scriptIdOptional: 'Script ID (optional)',
      scriptIdPlaceholder: 'Script UUID',
      videoIdOptional: 'Video ID (optional)',
      videoIdPlaceholder: 'Video UUID',
      imageUrlHelper: 'You can leave it empty and add the URL later.',
    },
    form: {
      title: 'Title',
      notes: 'Notes',
      imageUrl: 'Image URL',
      placeholderTitle: 'Thumbnail for video...',
      placeholderNotes: 'Details, style, or variations...',
      placeholderUrl: 'https://.../thumbnail.png',
    },
    statuses: {
      pending: 'Pending',
      designing: 'Designing',
      designed: 'Designed',
      approved: 'Approved',
    },
    toasts: {
      created: 'Thumbnail created',
      deleted: 'Thumbnail deleted',
      error: 'Error',
    },
    errors: {
      create: 'Error creating thumbnail',
      update: 'Error updating thumbnail',
      delete: 'Error deleting thumbnail',
      load: 'Error loading thumbnails',
    },
  },
} as const;

export function getThumbnailsCopy(locale: Locale) {
  return THUMBNAILS_COPY_BY_LOCALE[locale] ?? THUMBNAILS_COPY_BY_LOCALE.es;
}

export const THUMBNAILS_COPY = getThumbnailsCopy('es');
