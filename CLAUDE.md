# Rocket Mission Control — CLAUDE.md

## Contexto del proyecto
Simulador de lanzamiento de cohetes con dashboard de control de misión.
Proyecto educativo orientado a aprender conceptos de software de vuelo espacial.
Referencia directa al cohete MIURA 1 de PLD Space (empresa española).

## Stack tecnológico
- React 18 + TypeScript (modo strict, sin `any`)
- Vite como bundler
- Three.js + React Three Fiber + Drei para la visualización 3D
- Recharts para gráficas de telemetría
- Tailwind CSS para estilos
- Zustand para estado global
- Vitest para tests unitarios

## Estructura de carpetas obligatoria
src/
  physics/        # Física pura — funciones sin efectos secundarios
  fsm/            # Máquina de estados de la misión
  telemetry/      # Canales, store y hooks de telemetría
  components/
    Scene3D/      # Componentes Three.js
    MissionControl/
    Panels/
    HUD/
    Graphs/
  presets/        # Configuraciones de cohetes (MIURA 1, etc.)
  types/          # Interfaces TypeScript globales

## Convenciones de código

### Física
- Todas las funciones de física deben tener JSDoc con:
  - La ecuación implementada en notación matemática
  - Unidades de entrada y salida (SI siempre: metros, kg, segundos, Newtons)
  - Referencia o fuente del modelo
- La física NO debe depender de React ni de ningún store
- Usar RK4 para integración numérica, nunca Euler simple

### TypeScript
- Strict mode activado en tsconfig
- Interfaces definidas en src/types/physics.ts
- No usar `any` bajo ningún concepto
- Nombrar tipos con PascalCase, variables con camelCase

### Componentes React
- Un componente por archivo
- Props tipadas siempre con interface, nunca inline
- Hooks personalizados en src/telemetry/hooks.ts

### Commits
- Mensajes en inglés, estilo conventional commits:
  feat: add RK4 integrator
  fix: correct drag coefficient at transonic regime
  docs: add atmosphere model explanation to PHYSICS.md

## Archivos de documentación obligatorios
- `PHYSICS.md`: explicar todos los modelos físicos implementados,
  sus ecuaciones, suposiciones y simplificaciones respecto a la realidad.
  Debe ser legible por alguien con conocimientos de ingeniería aeroespacial.

## Restricciones importantes
- No usar Euler para integración (solo RK4)
- No mezclar lógica de física con componentes de UI
- No usar localStorage ni persistencia — estado solo en memoria
- El preset MIURA 1 debe usar datos reales públicos del cohete de PLD Space
- Los tests de física son obligatorios, no opcionales

## Comandos útiles
npm run dev        # Servidor de desarrollo
npm run test       # Tests unitarios con Vitest
npm run build      # Build de producción
npm run typecheck  # Verificar tipos sin compilar

## Estado actual y bugs conocidos

### Bugs pendientes (prioridad alta)
1. ORIENTACIÓN COHETE: El mesh aparece tumbado horizontalmente.
   Debe estar vertical (eje Y) en la plataforma. Arreglar rotación
   inicial en Scene3D.

2. LAG DE CÁMARA: La simulación va entrecortada durante el vuelo.
   - Desacoplar bucle de física del requestAnimationFrame de Three.js
   - Usar useFrame de R3F solo para actualizar posiciones visuales
   - Limitar máximo 20 pasos de física por frame (evita bloqueo en 50x)
   - Usar selectores atómicos en Zustand para evitar re-renders masivos

### Lo que funciona bien
- Build y tests pasan (14/14)
- Física RK4, atmósfera, FSM correctos
- Gráficas de telemetría funcionan
- Presets MIURA 1 y Falcon 9 cargados
```

Así la próxima sesión arrancas con:
```
Lee el CLAUDE.md y arregla los bugs conocidos de la sección 
"Estado actual y bugs conocidos", empezando por el lag de cámara.