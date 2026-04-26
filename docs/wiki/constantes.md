# Constantes y balance

Todas viven en `components/PongGame.tsx` al inicio del archivo. Valores orientativos; ajústalos y prueba en `npm run dev`.

## Tablero y piezas

| Constante | Valor por defecto | Efecto |
|-----------|-------------------|--------|
| `W`, `H` | 640 × 360 | Resolución interna del canvas (atributos HTML). El CSS puede escalar el elemento. |
| `PADDLE_W` | 12 | Ancho de ambas paletas. |
| `PADDLE_H` | 72 | Alto en modo **Paletas fijas**. |
| `BALL` | 10 | Diámetro de la pelota. |
| `PADDLE_SPEED` | 4 | Píxeles por frame al mover paletas (humano e IA). |

## Modo paletas al azar

| Constante | Default | Efecto |
|-----------|---------|--------|
| `PADDLE_H_MIN` | 36 | Altura mínima sorteable. |
| `PADDLE_H_MAX` | 120 | Altura máxima sorteable (debe caber en `H`). |
| `PADDLE_RANDOM_MS` | 4500 | Ms entre re-sorteos durante el rally. |

## Velocidad de la pelota

| Constante | Default | Efecto |
|-----------|---------|--------|
| `BALL_SPEED_INITIAL` | 2.2 | Magnitud del vector velocidad tras cada saque. |
| `BALL_SPEED_MAX` | 7.5 | Tope de magnitud al acelerar con el tiempo. |
| `BALL_SPEED_STEP` | 0.45 | Cuánto sube la magnitud en cada “tick” del temporizador. |
| `BALL_SPEED_RAMP_MS` | 4000 | Cada cuántos ms se aplica un `BALL_SPEED_STEP`. |

La dirección se conserva al subir la magnitud: se escala `(vx, vy)` para que `hypot(vx, vy)` se acerque a `ballSpeed`.

## IA (solo 1 jugador)

La velocidad efectiva de la paleta derecha es `PADDLE_SPEED * 0.85`. Ese factor está **inline** en `tick`; si quieres más o menos dificultad, cámbialo ahí o extráelo a una constante `AI_PADDLE_FACTOR`.

## Ideas de tuning

- Partidas más largas: bajar `BALL_SPEED_STEP` o subir `BALL_SPEED_RAMP_MS`.
- Más caos con paletas: acortar `PADDLE_RANDOM_MS` o ampliar el rango `PADDLE_H_MIN`–`PADDLE_H_MAX` (sin pasarse de `H`).
