import test from "node:test";
import assert from "node:assert/strict";

import {
  createInitialState,
  pickFoodPosition,
  queueDirection,
  stepGame,
} from "../src/snake.js";

test("moves snake in queued direction", () => {
  const initial = createInitialState({ rng: () => 0 });
  const next = stepGame(initial, () => 0);

  assert.deepEqual(next.snake[0], { x: 3, y: 8 });
  assert.equal(next.score, 0);
  assert.equal(next.isGameOver, false);
});

test("ignores immediate reverse direction", () => {
  const initial = createInitialState({ rng: () => 0 });
  const queued = queueDirection(initial, "left");

  assert.equal(queued.queuedDirection, "right");
});

test("grows and increments score when eating food", () => {
  const state = {
    gridSize: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
    ],
    direction: "right",
    queuedDirection: "right",
    food: { x: 3, y: 2 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake[0], { x: 3, y: 2 });
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 3, y: 2 });
});

test("ends game on wall collision", () => {
  const state = {
    gridSize: 4,
    snake: [{ x: 3, y: 1 }],
    direction: "right",
    queuedDirection: "right",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.isGameOver, true);
});

test("ends game on self collision", () => {
  const state = {
    gridSize: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    direction: "up",
    queuedDirection: "left",
    food: { x: 5, y: 5 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.isGameOver, true);
});

test("never places food on occupied cells", () => {
  const food = pickFoodPosition(
    2,
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    () => 0,
  );

  assert.deepEqual(food, { x: 1, y: 1 });
});
