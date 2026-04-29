# Wiki — Pong (game-01)

Mini wiki del proyecto: cómo se juega, qué modos hay y cómo está montado el código.

La guía **completa** (objetivo, controles, modos, constantes, arquitectura, comandos) está en el **[README del repositorio](../../README.md)**.

## Contenido

| Página | Descripción |
|--------|----------------|
| [Controles](controles.md) | Teclas, `preventDefault` y convenciones por modo |
| [Modos de juego](modos.md) | 1 vs 2 jugadores y paletas fijas vs al azar |
| [Arquitectura y código](arquitectura.md) | Canvas, `useEffect`, bucle `tick`, por qué no hay `useState` del juego |
| [Constantes y balance](constantes.md) | Tabla de constantes en `PongGame.tsx` y cómo tunearlas |

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La partida está en la página principal (`app/page.tsx`), componente `PongGame` en `components/PongGame.tsx`.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- React 19 (componente cliente `"use client"`)
- TypeScript
- Canvas 2D API (sin librerías de juego)

## Código comentado

El archivo `components/PongGame.tsx` incluye comentarios por secciones (geometría, entrada, bucle, render) y enlaza a esta wiki en el encabezado del módulo.
