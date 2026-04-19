export const GRID_SIZE = 16;
export const INITIAL_DIRECTION = "right";
export const TICK_MS = 140;

const VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createInitialSnake() {
  return [
    { x: 2, y: 8 },
    { x: 1, y: 8 },
    { x: 0, y: 8 },
  ];
}

export function serializePosition(position) {
  return `${position.x},${position.y}`;
}

export function getAvailableCells(gridSize, occupiedPositions) {
  const occupied = new Set(occupiedPositions.map(serializePosition));
  const cells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function pickFoodPosition(gridSize, occupiedPositions, rng = Math.random) {
  const availableCells = getAvailableCells(gridSize, occupiedPositions);

  if (availableCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * availableCells.length);
  return availableCells[index];
}

export function createInitialState({ gridSize = GRID_SIZE, rng = Math.random } = {}) {
  const snake = createInitialSnake();

  return {
    gridSize,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: pickFoodPosition(gridSize, snake, rng),
    score: 0,
    isGameOver: false,
    isPaused: false,
  };
}

export function queueDirection(state, nextDirection) {
  if (!VECTORS[nextDirection]) {
    return state;
  }

  const currentDirection = state.direction;
  if (OPPOSITES[currentDirection] === nextDirection && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    queuedDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (state.isGameOver) {
    return state;
  }

  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function stepGame(state, rng = Math.random) {
  if (state.isGameOver || state.isPaused) {
    return state;
  }

  const direction = state.queuedDirection;
  const vector = VECTORS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };
  const hitsWall =
    nextHead.x < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y < 0 ||
    nextHead.y >= state.gridSize;

  if (hitsWall) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const isEating =
    state.food &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;
  const bodyToCheck = isEating ? state.snake : state.snake.slice(0, -1);
  const hitsSelf = bodyToCheck.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
  );

  if (hitsSelf) {
    return {
      ...state,
      direction,
      isGameOver: true,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!isEating) {
    nextSnake.pop();
  }

  const nextFood = isEating ? pickFoodPosition(state.gridSize, nextSnake, rng) : state.food;

  return {
    ...state,
    snake: nextSnake,
    direction,
    queuedDirection: direction,
    food: nextFood,
    score: isEating ? state.score + 1 : state.score,
    isGameOver: nextFood === null ? true : state.isGameOver,
  };
}
