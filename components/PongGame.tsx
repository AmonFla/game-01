"use client";

/**
 * @fileoverview Pong en HTML Canvas dentro de Next.js (App Router).
 *
 * @remarks
 * - Un único componente cliente dibuja el tablero y ejecuta la simulación.
 * - El bucle del juego vive en `useEffect`: no usa `useState` para la pelota ni
 *   las paletas, para no disparar un re-render por frame (~60/s).
 * - React solo re-renderiza al cambiar modo (`twoPlayers`, `randomPaddles`);
 *   al hacerlo se desmonta el efecto anterior (se cancela `requestAnimationFrame`
 *   y se quitan los listeners de teclado) y arranca uno nuevo.
 *
 * Documentación: `README.md` (raíz del repo); wiki por temas: `docs/wiki/README.md`.
 */

import { useEffect, useRef, useState } from "react";

// =============================================================================
// Geometría y ritmo (coordenadas en píxeles del canvas interno, no CSS)
// =============================================================================

/** Ancho lógico del canvas (atributo `width` del elemento). */
const W = 640;
/** Alto lógico del canvas (atributo `height`). */
const H = 360;

const PADDLE_W = 12;

/** Altura de paleta cuando el modo “Paletas al azar” está desactivado. */
const PADDLE_H = 72;

/** Diámetro de la pelota (colisiones usan radio BALL/2). */
const BALL = 10;

/** Píxeles por frame al mantener pulsado subir/bajar (jugador e IA). */
const PADDLE_SPEED = 4;

// --- Modo paletas al azar (cada paleta puede medir distinto) ---

/** Altura mínima sorteable (píxeles). */
const PADDLE_H_MIN = 36;
/** Altura máxima sorteable (píxeles). */
const PADDLE_H_MAX = 120;
/** Tiempo entre re-sorteos de altura mientras el partido sigue. */
const PADDLE_RANDOM_MS = 4500;

// --- Velocidad de la pelota (magnitud del vector, sube con el tiempo) ---

/** Magnitud inicial tras cada saque (lenta). */
const BALL_SPEED_INITIAL = 2.2;
/** Tope de magnitud para no volverse injugable. */
const BALL_SPEED_MAX = 7.5;
/** Incremento de magnitud en cada escalón del temporizador. */
const BALL_SPEED_STEP = 0.45;
/** Cada cuántos ms sube un escalón la velocidad de la pelota. */
const BALL_SPEED_RAMP_MS = 4000;

// =============================================================================
// Entrada: teclas mapeadas a flags (el bucle solo lee el ref)
// =============================================================================

/**
 * Estado de teclas en un instante. `left*` = paleta izquierda (W/S);
 * `right*` = paleta derecha (solo en 2 jugadores: flechas arriba/abajo).
 *
 * En 1 jugador, las flechas se duplican sobre `left*` para que un solo
 * jugador pueda usar W/S o flechas indistintamente.
 */
type Keys = {
  leftUp: boolean;
  leftDown: boolean;
  rightUp: boolean;
  rightDown: boolean;
};

/** Estado inicial de teclas (ninguna pulsada). */
const emptyKeys = (): Keys => ({
  leftUp: false,
  leftDown: false,
  rightUp: false,
  rightDown: false,
});

/** Entero en [PADDLE_H_MIN, PADDLE_H_MAX] para una paleta. */
function randomPaddleHeight(): number {
  return Math.round(PADDLE_H_MIN + Math.random() * (PADDLE_H_MAX - PADDLE_H_MIN));
}

// =============================================================================
// Componente
// =============================================================================

export function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Keys>(emptyKeys());

  /** Si es true, la paleta derecha la controla un humano (flechas). */
  const [twoPlayers, setTwoPlayers] = useState(false);
  /** Si es true, `leftPh` / `rightPh` se sortean periódicamente y al anotar. */
  const [randomPaddles, setRandomPaddles] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    keysRef.current = emptyKeys();

    // --- Alturas de paletas (variables porque cambian en modo al azar) ---

    let leftPh = PADDLE_H;
    let rightPh = PADDLE_H;
    /** Último instante en que se sortearon alturas (modo al azar). */
    let lastPaddleRollAt = performance.now();

    /**
     * Fija alturas fijas o las sortea según `randomPaddles` (estado de React
     * capturado al montar este efecto).
     */
    const rollPaddleHeights = () => {
      if (!randomPaddles) {
        leftPh = PADDLE_H;
        rightPh = PADDLE_H;
        return;
      }
      leftPh = randomPaddleHeight();
      rightPh = randomPaddleHeight();
      lastPaddleRollAt = performance.now();
    };

    rollPaddleHeights();

    // `leftY` / `rightY`: borde superior de cada paleta (origen arriba-izquierda).
    let leftY = H / 2 - leftPh / 2;
    let rightY = H / 2 - rightPh / 2;

    // Centro de la pelota.
    let ballX = W / 2;
    let ballY = H / 2;
    /** Componentes de velocidad (píxeles por frame, aprox.). */
    let vx = 0;
    let vy = 0;

    /**
     * Magnitud deseada del vector velocidad; al subir, se reescala (vx, vy)
     * manteniendo la dirección.
     */
    let ballSpeed = BALL_SPEED_INITIAL;
    let lastSpeedRampAt = performance.now();

    let leftScore = 0;
    let rightScore = 0;
    let raf = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const k = keysRef.current;
      if (e.code === "KeyW") {
        k.leftUp = true;
        e.preventDefault();
      }
      if (e.code === "KeyS") {
        k.leftDown = true;
        e.preventDefault();
      }
      if (e.code === "ArrowUp") {
        if (twoPlayers) k.rightUp = true;
        else k.leftUp = true;
        e.preventDefault();
      }
      if (e.code === "ArrowDown") {
        if (twoPlayers) k.rightDown = true;
        else k.leftDown = true;
        e.preventDefault();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = keysRef.current;
      if (e.code === "KeyW") k.leftUp = false;
      if (e.code === "KeyS") k.leftDown = false;
      if (e.code === "ArrowUp") {
        if (twoPlayers) k.rightUp = false;
        else k.leftUp = false;
      }
      if (e.code === "ArrowDown") {
        if (twoPlayers) k.rightDown = false;
        else k.leftDown = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    /**
     * Coloca la pelota al centro, reinicia velocidad base y (opcional) paletas.
     * @param towardRight - true: saque hacia la derecha; false: hacia la izquierda.
     */
    const resetBall = (towardRight: boolean) => {
      ballX = W / 2;
      ballY = H / 2;
      ballSpeed = BALL_SPEED_INITIAL;
      lastSpeedRampAt = performance.now();
      if (randomPaddles) rollPaddleHeights();
      leftY = Math.max(0, Math.min(H - leftPh, leftY));
      rightY = Math.max(0, Math.min(H - rightPh, rightY));
      const dir = towardRight ? 1 : -1;
      const nx = dir;
      const ny = Math.random() * 2 - 1;
      const len = Math.hypot(nx, ny) || 1;
      vx = (nx / len) * ballSpeed;
      vy = (ny / len) * ballSpeed;
    };

    resetBall(Math.random() > 0.5);

    /**
     * Un frame: entrada → IA (si aplica) → integración de la pelota → colisiones
     * → puntuación → dibujo → encolar siguiente frame.
     */
    const tick = () => {
      const now = performance.now();

      // Re-sorteo periódico de alturas de paletas (solo modo al azar).
      if (randomPaddles && now - lastPaddleRollAt >= PADDLE_RANDOM_MS) {
        rollPaddleHeights();
        leftY = Math.max(0, Math.min(H - leftPh, leftY));
        rightY = Math.max(0, Math.min(H - rightPh, rightY));
      }

      // Subida escalonada de la magnitud de velocidad de la pelota.
      if (now - lastSpeedRampAt >= BALL_SPEED_RAMP_MS) {
        lastSpeedRampAt = now;
        ballSpeed = Math.min(ballSpeed + BALL_SPEED_STEP, BALL_SPEED_MAX);
        const len = Math.hypot(vx, vy) || 1e-6;
        const scale = ballSpeed / len;
        vx *= scale;
        vy *= scale;
      }

      const keys = keysRef.current;

      // Paleta izquierda (humano).
      if (keys.leftUp) leftY -= PADDLE_SPEED;
      if (keys.leftDown) leftY += PADDLE_SPEED;
      leftY = Math.max(0, Math.min(H - leftPh, leftY));

      // Paleta derecha: segundo jugador o IA que sigue la pelota (más lenta).
      if (twoPlayers) {
        if (keys.rightUp) rightY -= PADDLE_SPEED;
        if (keys.rightDown) rightY += PADDLE_SPEED;
        rightY = Math.max(0, Math.min(H - rightPh, rightY));
      } else {
        const aiTarget = ballY - rightPh / 2;
        if (rightY < aiTarget - 2) rightY += PADDLE_SPEED * 0.85;
        else if (rightY > aiTarget + 2) rightY -= PADDLE_SPEED * 0.85;
        rightY = Math.max(0, Math.min(H - rightPh, rightY));
      }

      ballX += vx;
      ballY += vy;

      if (ballY <= BALL / 2 || ballY >= H - BALL / 2) vy *= -1;

      const leftX = 24;
      const rightX = W - 24 - PADDLE_W;

      // Golpe paleta izquierda: forzar movimiento hacia la derecha.
      if (
        ballX - BALL / 2 <= leftX + PADDLE_W &&
        ballX - BALL / 2 >= leftX &&
        ballY >= leftY &&
        ballY <= leftY + leftPh
      ) {
        ballX = leftX + PADDLE_W + BALL / 2;
        vx = Math.abs(vx);
      }
      // Golpe paleta derecha: hacia la izquierda.
      if (
        ballX + BALL / 2 >= rightX &&
        ballX + BALL / 2 <= rightX + PADDLE_W &&
        ballY >= rightY &&
        ballY <= rightY + rightPh
      ) {
        ballX = rightX - BALL / 2;
        vx = -Math.abs(vx);
      }

      if (ballX < 0) {
        rightScore += 1;
        resetBall(false);
      } else if (ballX > W) {
        leftScore += 1;
        resetBall(true);
      }

      // --- Render (orden: fondo, red, paletas, pelota, marcador) ---

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#333";
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(W / 2, 0);
      ctx.lineTo(W / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#e5e5e5";
      ctx.fillRect(leftX, leftY, PADDLE_W, leftPh);
      ctx.fillRect(rightX, rightY, PADDLE_W, rightPh);
      ctx.beginPath();
      ctx.arc(ballX, ballY, BALL / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "20px var(--font-geist-sans), system-ui, sans-serif";
      ctx.fillText(String(leftScore), W / 4, 32);
      ctx.fillText(String(rightScore), (3 * W) / 4 - 10, 32);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [twoPlayers, randomPaddles]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Modo de juego"
      >
        <button
          type="button"
          onClick={() => setTwoPlayers(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !twoPlayers
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-100 dark:text-black"
              : "border border-zinc-600 bg-transparent text-zinc-600 hover:bg-zinc-800/40 dark:text-zinc-400"
          }`}
        >
          1 jugador
        </button>
        <button
          type="button"
          onClick={() => setTwoPlayers(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            twoPlayers
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-100 dark:text-black"
              : "border border-zinc-600 bg-transparent text-zinc-600 hover:bg-zinc-800/40 dark:text-zinc-400"
          }`}
        >
          2 jugadores
        </button>
      </div>
      <div
        className="flex flex-wrap items-center justify-center gap-2"
        role="group"
        aria-label="Tamaño de paletas"
      >
        <button
          type="button"
          onClick={() => setRandomPaddles(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !randomPaddles
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-100 dark:text-black"
              : "border border-zinc-600 bg-transparent text-zinc-600 hover:bg-zinc-800/40 dark:text-zinc-400"
          }`}
        >
          Paletas fijas
        </button>
        <button
          type="button"
          onClick={() => setRandomPaddles(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            randomPaddles
              ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-100 dark:text-black"
              : "border border-zinc-600 bg-transparent text-zinc-600 hover:bg-zinc-800/40 dark:text-zinc-400"
          }`}
        >
          Paletas al azar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="max-w-full rounded-lg border border-zinc-700"
      />
      <p className="max-w-md text-center text-sm text-zinc-500">
        {twoPlayers ? (
          <>
            Izquierda: <strong className="text-zinc-400">W / S</strong> · Derecha:{" "}
            <strong className="text-zinc-400">↑ / ↓</strong>
          </>
        ) : (
          <>
            Tú: <strong className="text-zinc-400">W / S</strong> o{" "}
            <strong className="text-zinc-400">flechas</strong> · Derecha: CPU
          </>
        )}
        {randomPaddles && (
          <>
            {" "}
            · Alturas al azar cada unos segundos y al anotar (
            {PADDLE_H_MIN}–{PADDLE_H_MAX}px).
          </>
        )}
      </p>
    </div>
  );
}
