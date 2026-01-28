# 🎨 UI Components Context - CronoStudio

## Contexto
Este directorio contiene todos los componentes de interfaz de usuario de CronoStudio, organizados siguiendo la metodología **Atomic Design**.

## Agentes Responsables
- **Agente 05 (Frontend)**: Implementación de componentes React
- **Agente 12 (Figma/UI)**: Diseño de componentes, UX, wireframes

## Skill Aplicable
📖 **Skill Principal**: `skills/stitch-ui.md`

## Arquitectura de Componentes

### Niveles Atómicos
```
components/
├── atoms/           # Botones, inputs, iconos, texto
├── molecules/       # Combinaciones simples (FormField, Card)
├── organisms/       # Secciones complejas (Header, ProductionsList)
├── templates/       # Layouts de página
└── pages/          # Páginas completas (manejadas por Next.js App Router)
```

### Componentes Actuales
- `ProductionsList.tsx`: Organismo que muestra lista de producciones
- `AutomationRuns.tsx`: Organismo que muestra ejecuciones de automatizaciones

## Reglas de Desarrollo

### 1. Usar Stitches para Estilos
```typescript
import { styled } from '@/lib/stitches.config'

const StyledComponent = styled('div', {
  // Usar tokens del theme
  backgroundColor: '$bgPrimary',
  padding: '$4',
  borderRadius: '$md',
})
```

### 2. Seguir Atomic Design
- **Atoms**: Componentes indivisibles sin lógica compleja
- **Molecules**: Combinación de 2-3 atoms
- **Organisms**: Secciones con lógica de negocio

### 3. Props Tipadas con TypeScript
```typescript
import { ComponentProps } from 'react'

export type ButtonProps = ComponentProps<typeof StyledButton> & {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}
```

### 4. Accesibilidad (a11y)
- Usar elementos semánticos HTML
- Añadir `aria-label` a iconos
- Implementar navegación por teclado
- Contraste WCAG AA (4.5:1)

### 5. Testing de Componentes
```typescript
import { render, screen } from '@testing-library/react'

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Convenciones de Naming

### Archivos
- Componentes: `PascalCase.tsx` (ej: `ProductionsList.tsx`)
- Tests: `PascalCase.test.tsx`
- Hooks: `useCamelCase.ts`

### Componentes Styled
```typescript
const StyledButton = styled('button', { ... })
const StyledCard = styled('div', { ... })
```

## Estructura de un Componente

```
ComponentName/
├── ComponentName.tsx       # Componente principal
├── ComponentName.test.tsx  # Tests
├── ComponentName.stories.tsx # Storybook (opcional)
└── index.ts               # Re-export
```

## Design Tokens Disponibles

### Colors
- `$primary`, `$primaryLight`, `$primaryDark`
- `$secondary`, `$secondaryLight`, `$secondaryDark`
- `$success`, `$warning`, `$error`, `$info`
- `$gray50` - `$gray900`

### Spacing
- `$1` (4px) - `$20` (80px)

### Typography
- Sizes: `$xs` - `$4xl`
- Weights: `$normal`, `$medium`, `$semibold`, `$bold`

### Radii
- `$sm`, `$md`, `$lg`, `$xl`, `$full`

## Restricciones

### ❌ NO Permitido
- Estilos inline con `style={{}}`
- CSS modules o archivos `.css` separados
- Lógica de negocio compleja en componentes UI
- Llamadas directas a APIs (usar hooks de application layer)

### ✅ Permitido
- Stitches con design tokens
- Hooks de React (`useState`, `useEffect`, etc.)
- Hooks custom del proyecto (`useProductions`, `useIdeas`)
- Props drilling (máximo 2 niveles)

## Flujo de Trabajo

### Crear Nuevo Componente
1. Determinar nivel atómico (atom/molecule/organism)
2. Crear archivo en directorio correspondiente
3. Implementar con Stitches y design tokens
4. Añadir tests con Testing Library
5. Documentar props con JSDoc
6. Exportar en `index.ts`

### Modificar Componente Existente
1. Verificar tests existentes
2. Hacer cambios manteniendo API de props
3. Actualizar tests si es necesario
4. Verificar accesibilidad
5. Commit con mensaje semántico

## Integración con Application Layer

### ✅ Correcto
```typescript
import { useProductions } from '@/application/hooks/useProductions'

export const ProductionsList = () => {
  const { productions, loading, error } = useProductions()
  
  if (loading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  
  return <Grid>{productions.map(p => <ProductionCard key={p.id} {...p} />)}</Grid>
}
```

### ❌ Incorrecto
```typescript
// NO llamar directamente a APIs desde componentes
export const ProductionsList = () => {
  const [data, setData] = useState([])
  
  useEffect(() => {
    fetch('/api/productions').then(r => r.json()).then(setData)
  }, [])
  
  return <div>{/* ... */}</div>
}
```

## Performance

### Optimizaciones Recomendadas
- `React.memo()` para componentes pesados
- `useMemo()` para cálculos costosos
- `useCallback()` para callbacks en props
- Lazy loading con `React.lazy()` y `Suspense`

## Invocación de Agentes

### Cuando trabajar en este contexto:
- Crear nuevos componentes UI
- Refactorizar componentes existentes
- Implementar diseños de Figma
- Corregir problemas visuales
- Mejorar accesibilidad

### Agentes que NO deben trabajar aquí:
- Agente 04 (Backend): No toca componentes UI
- Agente 03 (DevOps): Solo configuraciones de build
- Agente 14 (Seguridad): Solo validaciones de inputs

---

**Skill de Referencia**: Ver `skills/stitch-ui.md` para guía completa
