# Controles

## Resumen por modo

### Un jugador (vs CPU)

| Acción | Teclas |
|--------|--------|
| Subir paleta izquierda | **W** o **↑** |
| Bajar paleta izquierda | **S** o **↓** |

La paleta derecha la mueve la IA. Las flechas controlan la misma paleta que W/S.

### Dos jugadores

| Jugador | Lado | Subir | Bajar |
|---------|------|-------|-------|
| 1 | Izquierda | **W** | **S** |
| 2 | Derecha | **↑** | **↓** |

En este modo las flechas **solo** mueven la derecha, para no solaparse con W/S del jugador 1.

## Detalles de implementación

- Los eventos son `keydown` / `keyup` en `window`, registrados dentro del `useEffect` del juego.
- El estado de teclas no vive en React: se guarda en un `useRef<Keys>` para que el bucle `tick` lea el instante actual sin provocar renders.
- En `keydown`, para las teclas del juego se llama a `preventDefault()` para reducir scroll accidental de la página (sobre todo con las flechas).

## Accesibilidad

Hoy el juego depende del teclado. Para ratón o gamepad habría que ampliar los listeners y mapear a los mismos flags `Keys` (o a deltas analógicos).
