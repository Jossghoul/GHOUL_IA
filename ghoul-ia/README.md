# GHOUL IA

La IA que construye proyectos contigo: un equipo de agentes (Manager, Analista, Architect, Coder, Designer, Tester, Debugger) que convierte una idea en software.

## Estado: V1

Chat donde el **GHOUL Manager** lee cada mensaje y elige qué agente responde:

| Modo | Agente | Para qué |
| --- | --- | --- |
| Generar | GHOUL Coder | Escribir código nuevo |
| Explicar | GHOUL Mentor | Entender qué hace un código |
| Corregir | GHOUL Debugger | Encontrar la causa de un error y corregirlo |
| Conversar | GHOUL Manager | Hablar de la idea y planear |

También puedes elegir el modo a mano. Las conversaciones se guardan en el navegador (la base de datos llega en el siguiente paso).

## Estructura

```
ghoul-ia/
 ├── apps/web            # Next.js: interfaz de chat y ruta /api/chat
 └── packages/agents     # Manager, agentes y sus prompts (API de Claude)
```

## Cómo correrlo

Requisitos: Node 20+ y pnpm.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # pon tu ANTHROPIC_API_KEY
pnpm dev                                       # http://localhost:3000
```

Otros comandos: `pnpm test` (pruebas del Manager), `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## Hoja de ruta

- **V1 Básica:** chat, generación, explicación y corrección de código.
- **V2 Constructor:** proyectos completos con carpetas, base de datos y APIs.
- **V3 Equipo de IAs:** Analista, Designer, Tester y Debugger trabajando juntos.
- **V4 GHOUL Studio:** editor, archivos, terminal y vista previa.
- **V5 Producto:** cuentas, planes, exportación y despliegue.
