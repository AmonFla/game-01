# Modos de juego

Hay **dos ejes** independientes que puedes combinar:

1. **Jugadores:** 1 jugador vs CPU, o 2 humanos.
2. **Paletas:** altura fija o altura aleatoria por paleta.

Cambiar cualquiera de los dos **reinicia** el bucle del juego: nuevo `useEffect`, pelota al centro, marcador a cero y teclas limpias.

## 1 jugador

- Tú controlas la paleta izquierda.
- La derecha sigue la pelota con una velocidad ligeramente inferior (`0.85` frente a tu `PADDLE_SPEED`) para que sea superable.

## 2 jugadores

- Cada uno tiene su conjunto de teclas (ver [Controles](controles.md)).
- No hay IA en la derecha.

## Paletas fijas

- Ambas paletas miden `PADDLE_H` píxeles de alto (valor fijo en código).

## Paletas al azar

- Cada paleta tiene su propia altura, entera, entre `PADDLE_H_MIN` y `PADDLE_H_MAX`.
- Las alturas se vuelven a sortear:
  - al entrar en el modo y al montar el efecto;
  - cada `PADDLE_RANDOM_MS` milisegundos durante la partida;
  - al anotar un punto (dentro de `resetBall`), además del saque normal de la pelota.

Tras cada sorteo se **recortan** las posiciones `leftY` / `rightY` para que ninguna paleta quede fuera del campo verticalmente.
