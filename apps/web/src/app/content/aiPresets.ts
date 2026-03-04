export type AiPreset = {
  label: string;
  seed: string;
};

export type AiStylePreset = {
  label: string;
  guide: string;
};

export const IDEA_PRESETS: AiPreset[] = [
  {
    label: 'Finanzas personales',
    seed: 'finanzas personales para jovenes profesionales · tono directo · estructura: problema → solucion → accion',
  },
  {
    label: 'Productividad',
    seed: 'productividad y habitos · tono practico · estructura: checklist + ejemplos',
  },
  {
    label: 'Crecimiento en YouTube',
    seed: 'crecimiento de canales YouTube · tono consultor · estructura: 3 errores + plan de mejora',
  },
  {
    label: 'Marketing para emprendedores',
    seed: 'marketing para emprendedores · tono claro · estructura: dolor → estrategia → accion',
  },
  {
    label: 'IA aplicada',
    seed: 'IA aplicada a negocios · tono directo · estructura: caso real → pasos → resultados',
  },
];

export const SCRIPT_STYLE_PRESETS: AiStylePreset[] = [
  { label: 'Storytelling', guide: 'storytelling con giro final y aprendizaje claro' },
  { label: 'Tutorial paso a paso', guide: 'didactico, con pasos numerados y ejemplos concretos' },
  { label: 'Directo al grano', guide: 'tono directo, frases cortas, sin relleno' },
  { label: 'Analisis experto', guide: 'tono consultor, framework, pros y contras' },
];
