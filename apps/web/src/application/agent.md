# 🧠 Application Layer Context - CronoStudio

## Contexto
Este directorio contiene la **capa de aplicación** siguiendo Clean Architecture. Aquí reside la lógica de casos de uso (Use Cases) que orquestan las entidades del dominio.

## Agentes Responsables
- **Agente 02 (Arquitecto)**: Estructura y patrones de diseño
- **Agente 04 (Backend)**: Implementación de lógica de negocio
- **Agente 08 (Testing)**: Tests de casos de uso

## Skills Aplicables
📖 **Skills Principales**:
- `skills/testing-standard.md` - Metodología TDD/FDD
- `skills/technical-audit.md` - Auditoría de arquitectura

## Arquitectura de la Capa de Aplicación

### Estructura
```
application/
├── usecases/
│   ├── idea/
│   │   ├── CreateIdeaUseCase.ts
│   │   ├── DeleteIdeaUseCase.ts
│   │   ├── UpdateIdeaUseCase.ts
│   │   └── GetIdeasUseCase.ts
│   ├── production/
│   ├── script/
│   └── automation/
└── hooks/              # React hooks que consumen use cases
    ├── useIdeas.ts
    ├── useProductions.ts
    └── useAutomations.ts
```

## Principios de Clean Architecture

### 1. Dependencias
```
UI → Application → Domain → Infrastructure
```

- **Application** depende de **Domain** (entidades, repositorios)
- **Application** NO depende de **Infrastructure** (implementaciones concretas)
- **Application** NO depende de **UI** (componentes React)

### 2. Use Cases
Cada Use Case representa una **acción del usuario** o **proceso de negocio**.

```typescript
// Ejemplo: DeleteIdeaUseCase.ts
import { IdeaRepository } from '@/domain/repositories/IdeaRepository'

export class DeleteIdeaUseCase {
  constructor(private repository: IdeaRepository) {}

  async execute(ideaId: string, userId: string): Promise<{ success: boolean }> {
    // 1. Validar entrada
    if (!ideaId || !userId) {
      throw new Error('Invalid parameters')
    }

    // 2. Obtener entidad del dominio
    const idea = await this.repository.findById(ideaId)
    
    if (!idea) {
      throw new Error('Idea not found')
    }

    // 3. Validar reglas de negocio
    if (idea.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // 4. Ejecutar acción
    await this.repository.delete(ideaId)

    // 5. Retornar resultado
    return { success: true }
  }
}
```

### 3. Inyección de Dependencias
Los Use Cases reciben repositorios por constructor (Dependency Injection).

```typescript
// En API Route o hook
import { DeleteIdeaUseCase } from '@/application/usecases/idea/DeleteIdeaUseCase'
import { SupabaseIdeaRepository } from '@/infrastructure/repositories/SupabaseIdeaRepository'

const repository = new SupabaseIdeaRepository()
const useCase = new DeleteIdeaUseCase(repository)

await useCase.execute(ideaId, userId)
```

## Metodología Feature-Driven Development (FDD)

### Ciclo de Desarrollo
1. **Diseñar Feature**: Definir caso de uso y sus reglas
2. **Escribir Tests**: TDD - tests que fallen primero
3. **Implementar**: Código mínimo para pasar tests
4. **Refactorizar**: Mejorar sin romper tests
5. **Documentar**: JSDoc y README

### Ejemplo de Flujo FDD

```typescript
// 1. DISEÑO
// Feature: "Eliminar Idea"
// Actor: Usuario autenticado
// Precondición: La idea existe y pertenece al usuario
// Postcondición: La idea es eliminada de la base de datos

// 2. TEST (Red)
describe('DeleteIdeaUseCase', () => {
  it('should delete an existing idea', async () => {
    const mockRepo = { 
      findById: vi.fn().mockResolvedValue({ id: '1', userId: 'user1' }),
      delete: vi.fn().mockResolvedValue(true)
    }
    const useCase = new DeleteIdeaUseCase(mockRepo as any)
    
    const result = await useCase.execute('1', 'user1')
    
    expect(result.success).toBe(true)
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
  })
})

// 3. IMPLEMENTACIÓN (Green)
// Ver ejemplo anterior de DeleteIdeaUseCase

// 4. REFACTOR
// Extraer validaciones, mejorar nombres, etc.
```

## Reglas de Desarrollo

### ✅ Permitido
- Usar entidades del dominio (`@/domain/entities`)
- Usar interfaces de repositorios (`@/domain/repositories`)
- Validar inputs con Zod
- Lanzar errores descriptivos
- Retornar DTOs (Data Transfer Objects)

### ❌ NO Permitido
- Importar componentes React
- Usar `fetch` o llamadas HTTP directas
- Acceder a Supabase directamente
- Lógica de presentación (UI)
- Dependencias de frameworks (Next.js, etc.)

## Testing de Use Cases

### Estructura de Tests
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('UseCaseName', () => {
  let useCase: UseCaseName
  let mockRepository: Repository

  beforeEach(() => {
    mockRepository = {
      method: vi.fn(),
    } as unknown as Repository
    
    useCase = new UseCaseName(mockRepository)
  })

  it('should handle happy path', async () => {
    // Arrange
    mockRepository.method = vi.fn().mockResolvedValue(expectedValue)

    // Act
    const result = await useCase.execute(input)

    // Assert
    expect(result).toEqual(expectedOutput)
    expect(mockRepository.method).toHaveBeenCalledWith(expectedParams)
  })

  it('should throw error on invalid input', async () => {
    await expect(useCase.execute(invalidInput)).rejects.toThrow('Error message')
  })
})
```

### Cobertura Mínima
- **Happy path**: Caso exitoso
- **Error cases**: Validaciones fallidas
- **Edge cases**: Valores límite, null, undefined
- **Authorization**: Permisos y roles

## Hooks de React (Puente UI ↔ Application)

Los hooks son el **único punto de contacto** entre UI y Application Layer.

```typescript
// hooks/useIdeas.ts
import { useState, useEffect } from 'react'
import { GetIdeasUseCase } from '@/application/usecases/idea/GetIdeasUseCase'
import { SupabaseIdeaRepository } from '@/infrastructure/repositories/SupabaseIdeaRepository'

export const useIdeas = () => {
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const repository = new SupabaseIdeaRepository()
        const useCase = new GetIdeasUseCase(repository)
        const result = await useCase.execute()
        setIdeas(result.ideas)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchIdeas()
  }, [])

  return { ideas, loading, error }
}
```

## Validación de Inputs con Zod

```typescript
import { z } from 'zod'

const CreateIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  userId: z.string().uuid(),
})

export class CreateIdeaUseCase {
  async execute(input: unknown) {
    // Validar input
    const validatedInput = CreateIdeaSchema.parse(input)
    
    // Continuar con lógica
    // ...
  }
}
```

## Manejo de Errores

### Tipos de Errores
```typescript
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}
```

### Uso en Use Cases
```typescript
export class DeleteIdeaUseCase {
  async execute(ideaId: string, userId: string) {
    const idea = await this.repository.findById(ideaId)
    
    if (!idea) {
      throw new NotFoundError('Idea')
    }
    
    if (idea.userId !== userId) {
      throw new UnauthorizedError()
    }
    
    await this.repository.delete(ideaId)
    return { success: true }
  }
}
```

## Convenciones de Naming

### Use Cases
- Verbo + Sustantivo + `UseCase`
- Ejemplos: `CreateIdeaUseCase`, `DeleteProductionUseCase`, `GetUserProfileUseCase`

### Métodos
- `execute()`: Método principal del Use Case
- Parámetros: Primitivos o DTOs validados

### Archivos
- `PascalCaseUseCase.ts`
- `PascalCaseUseCase.test.ts`

## Invocación de Agentes

### Cuando trabajar en este contexto:
- Crear nuevos casos de uso
- Implementar lógica de negocio
- Refactorizar arquitectura
- Añadir validaciones
- Escribir tests de use cases

### Agentes que NO deben trabajar aquí:
- Agente 05 (Frontend): Solo consume hooks
- Agente 12 (UI): No toca lógica de negocio
- Agente 03 (DevOps): Solo configuraciones

---

**Skills de Referencia**:
- Ver `skills/testing-standard.md` para metodología TDD/FDD
- Ver `skills/technical-audit.md` para auditoría de arquitectura
