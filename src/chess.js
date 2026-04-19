export const CHESS_WINDOW_MARKUP = `
<section
  class="window chess-window"
  data-window="chess-window"
  data-app-label="Chess"
  data-min-width="680"
  data-min-height="520"
  data-disable-custom-scrollbar="true"
  aria-labelledby="chess-title"
  style="left: 264px; top: 112px; width: min(744px, calc(100vw - 170px)); height: min(552px, calc(100vh - 146px));"
  hidden
>
  <header class="titlebar" data-drag-handle>
    <div class="titlebar-controls">
      <button class="titlebar-action titlebar-maximize" type="button" data-toggle-maximize aria-label="Expand window">
        <span class="titlebar-action-box"></span>
      </button>
      <button class="titlebar-action titlebar-close" type="button" data-close aria-label="Close Chess window">
        <span class="titlebar-action-line"></span>
      </button>
    </div>
    <div class="window-title-shell">
      <img src="/assets/icns/chess-piece.svg" alt="" class="window-title-icon window-title-icon-chess" />
      <h2 id="chess-title" class="window-title">Chess</h2>
    </div>
    <span class="titlebar-balance" aria-hidden="true"></span>
  </header>

  <div class="window-body chess-window-body" data-chess-board-scale="standard">
    <div class="chess-layout">
      <section class="chess-board-panel">
        <div class="chess-meta">
          <p class="chess-meta-eyebrow">Play vs Markus</p>
          <p id="chess-status" class="chess-status">White to move.</p>
        </div>
        <div id="chess-opponent-material" class="chess-material chess-material-opponent" aria-live="polite"></div>
        <div class="chess-board-shell">
          <div id="chess-board" class="chess-board" aria-label="Chess board"></div>
          <button
            id="chess-board-size-toggle"
            class="chess-board-size-toggle"
            type="button"
            aria-label="Resize board"
            title="Drag to resize board"
          ></button>
        </div>
        <div id="chess-player-material" class="chess-material chess-material-player" aria-live="polite"></div>
      </section>

      <aside class="chess-sidebar">
        <section class="chess-card">
          <h3 class="chess-card-title">Game</h3>
          <div class="chess-side-select" aria-label="Switch side">
            <button id="chess-switch-side" class="button chess-side-button" type="button">Switch side</button>
          </div>
          <div class="chess-navigation" aria-label="Move navigation">
            <button id="chess-first" class="button chess-nav-button" type="button" aria-label="Go to first move">&laquo;</button>
            <button id="chess-prev" class="button chess-nav-button" type="button" aria-label="Go to previous move">&lsaquo;</button>
            <button id="chess-next" class="button chess-nav-button" type="button" aria-label="Go to next move">&rsaquo;</button>
            <button id="chess-last" class="button chess-nav-button" type="button" aria-label="Go to latest move">&raquo;</button>
          </div>
          <div class="chess-controls">
            <button id="chess-abort" class="button chess-control-button" type="button">Abort game</button>
            <button id="chess-resign" class="button chess-control-button" type="button">Resign</button>
          </div>
        </section>

        <section class="chess-card chess-history-card">
          <div class="chess-history-header">
            <h3 class="chess-card-title">Moves</h3>
            <button id="chess-copy-pgn" class="button chess-copy-pgn-button" type="button">Copy PGN</button>
          </div>
          <p id="chess-turn" class="chess-turn chess-history-status">Live</p>
          <ol id="chess-history" class="chess-history-list"></ol>
        </section>
      </aside>
    </div>
  </div>
  <button class="window-resizer" type="button" data-resize aria-label="Resize Chess window"></button>
</section>`;

export const CHESS_STAGE_ICON = "/assets/icns/chess-piece.svg";
export const CHESS_DESKTOP_ICON = "/assets/icns/chess-piece-desktop.svg";

export function createChessController({
  windowElement,
  playUiSound,
  requestCustomScrollbarSync,
  showSystemOverlay,
}) {
  const desktopStage = document.querySelector(".desktop-stage");
  const chessBoard = windowElement.querySelector("#chess-board");
  const chessWindowBody = windowElement.querySelector(".chess-window-body");
  const chessLayout = windowElement.querySelector(".chess-layout");
  const chessBoardPanel = windowElement.querySelector(".chess-board-panel");
  const chessBoardShell = windowElement.querySelector(".chess-board-shell");
  const chessSidebar = windowElement.querySelector(".chess-sidebar");
  const chessMeta = chessBoardPanel?.querySelector(".chess-meta") || null;
  const chessStatus = windowElement.querySelector("#chess-status");
  const chessTurn = windowElement.querySelector("#chess-turn");
  const chessOpponentMaterial = windowElement.querySelector("#chess-opponent-material");
  const chessPlayerMaterial = windowElement.querySelector("#chess-player-material");
  const chessBoardSizeToggle = windowElement.querySelector("#chess-board-size-toggle");
  const chessSwitchSideButton = windowElement.querySelector("#chess-switch-side");
  const chessAbortButton = windowElement.querySelector("#chess-abort");
  const chessDrawButton = windowElement.querySelector("#chess-draw");
  const chessResignButton = windowElement.querySelector("#chess-resign");
  const chessCopyPgnButton = windowElement.querySelector("#chess-copy-pgn");
  const chessFirstButton = windowElement.querySelector("#chess-first");
  const chessPrevButton = windowElement.querySelector("#chess-prev");
  const chessNextButton = windowElement.querySelector("#chess-next");
  const chessLastButton = windowElement.querySelector("#chess-last");
  const chessHistoryList = windowElement.querySelector("#chess-history");
  const chessPieceDragGhost = chessBoardShell ? document.createElement("div") : null;
  const chessPromotionPicker = chessBoardShell ? document.createElement("div") : null;

  if (chessPieceDragGhost && chessBoardShell) {
    chessPieceDragGhost.className = "chess-piece-drag-ghost";
    chessPieceDragGhost.hidden = true;
    chessBoardShell.append(chessPieceDragGhost);
  }

  if (chessPromotionPicker && chessBoardShell) {
    chessPromotionPicker.className = "chess-promotion-picker";
    chessPromotionPicker.hidden = true;
    chessBoardShell.append(chessPromotionPicker);
  }

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const isCompactDesktopLayout = () => window.innerWidth <= 760;
const CHESS_PIECE_ASSET_TYPE_CODES = {
  p: "P",
  n: "N",
  b: "B",
  r: "R",
  q: "Q",
  k: "K",
};
const CHESS_PROMOTION_PIECES = ["q", "r", "b", "n"];
const CHESS_BOARD_SCALES = ["compact", "standard", "expanded"];
const CHESS_BOARD_SCALE_LABELS = {
  compact: "S",
  standard: "M",
  expanded: "L",
};
const CHESS_BOARD_SCALE_VALUES = {
  compact: 36,
  standard: 42,
  expanded: 50,
};
const CHESS_BOARD_SIZE_MIN = 34;
const CHESS_BOARD_SIZE_MAX = 64;
const DESKTOP_EDGE_INSET = 18;
const COMPACT_DESKTOP_BREAKPOINT = 760;
const CHESS_PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};
const CHESS_MATERIAL_DISPLAY_VALUES = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};
const STOCKFISH_WORKER_PATH = "/assets/vendor/stockfish/stockfish-18-lite-single.js";
const STOCKFISH_SKILL_LEVEL = 6;
const STOCKFISH_MOVE_TIME_MS = 550;
const CHESS_ENGINE_THINK_DELAY_MS = 420;
const CHESS_ENGINE_SEARCH_DEPTH = 3;

let chessTimeline = [];
let chessTimelineIndex = 0;
let chessSelectedSquare = null;
let chessPendingPromotion = null;
let chessResultMessage = "";
let chessRematchReady = false;
let chessNoticeMessage = "";
let chessNoticeTimer = null;
let chessBoardScaleIndex = 1;
let chessPlayerColor = "w";
let chessEngineColor = "b";
let chessPerspective = "w";
let chessEngineTimer = null;
let chessEngineThinking = false;
let chessEngineWorker = null;
let chessEngineReady = false;
let chessEngineInitStarted = false;
let chessEngineFailed = false;
let chessEngineSearchToken = 0;
let chessEnginePendingSearch = null;
let chessBoardResizeState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  startSize: 42,
  didMove: false,
};
let chessPieceDragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  sourceRow: null,
  sourceCol: null,
  piece: "",
  didDrag: false,
  suppressClick: false,
};

function getChessPieceAssetPath(piece) {
  const color = getChessPieceColor(piece);
  const type = getChessPieceType(piece);
  const assetType = CHESS_PIECE_ASSET_TYPE_CODES[type];
  if (!color || !assetType) {
    return "";
  }

  return `/assets/chess/cburnett/${color}${assetType}.svg`;
}

function getChessPieceMarkup(piece, options = {}) {
  if (!piece) {
    return "";
  }

  const { material = false } = options;
  const wrapperClass = material ? "chess-material-piece" : "chess-piece";
  const imageClass = material ? "chess-piece-image chess-piece-image-material" : "chess-piece-image";

  return `
    <span class="${wrapperClass}" aria-hidden="true">
      <img class="${imageClass}" src="${getChessPieceAssetPath(piece)}" alt="" draggable="false" />
    </span>
  `;
}

function createInitialChessBoard() {
  return [
    ["br", "bn", "bb", "bq", "bk", "bb", "bn", "br"],
    ["bp", "bp", "bp", "bp", "bp", "bp", "bp", "bp"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["wp", "wp", "wp", "wp", "wp", "wp", "wp", "wp"],
    ["wr", "wn", "wb", "wq", "wk", "wb", "wn", "wr"],
  ];
}

function cloneChessBoard(board) {
  return board.map((row) => row.slice());
}

function cloneChessState(state) {
  return {
    board: cloneChessBoard(state.board),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant ? { ...state.enPassant } : null,
  };
}

function createInitialChessState() {
  return {
    board: createInitialChessBoard(),
    turn: "w",
    castling: {
      wKing: true,
      wQueen: true,
      bKing: true,
      bQueen: true,
    },
    enPassant: null,
  };
}

function getCurrentChessEntry() {
  return chessTimeline[chessTimelineIndex] || null;
}

function getCurrentChessState() {
  return getCurrentChessEntry()?.state || null;
}

function clearChessNotice() {
  if (chessNoticeTimer) {
    window.clearTimeout(chessNoticeTimer);
    chessNoticeTimer = null;
  }

  chessNoticeMessage = "";
}

function setChessNotice(message, duration = 1800) {
  clearChessNotice();
  chessNoticeMessage = message;
  renderChessGame();

  if (duration > 0) {
    chessNoticeTimer = window.setTimeout(() => {
      chessNoticeTimer = null;
      chessNoticeMessage = "";
      renderChessGame();
    }, duration);
  }
}

function initChessEngine() {
  if (chessEngineInitStarted || chessEngineFailed || typeof Worker !== "function") {
    return;
  }

  chessEngineInitStarted = true;

  try {
    chessEngineWorker = new Worker(STOCKFISH_WORKER_PATH);
  } catch (error) {
    console.error("Failed to start Stockfish worker.", error);
    chessEngineFailed = true;
    chessEngineWorker = null;
    return;
  }

  chessEngineWorker.addEventListener("message", (event) => {
    const payload = String(event.data || "");
    const lines = payload.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

    lines.forEach((line) => {
      if (line === "uciok") {
        chessEngineWorker?.postMessage("setoption name Threads value 1");
        chessEngineWorker?.postMessage(`setoption name Skill Level value ${STOCKFISH_SKILL_LEVEL}`);
        chessEngineWorker?.postMessage("setoption name Hash value 8");
        chessEngineWorker?.postMessage("ucinewgame");
        chessEngineWorker?.postMessage("isready");
        return;
      }

      if (line === "readyok") {
        chessEngineReady = true;
        return;
      }

      if (!line.startsWith("bestmove")) {
        return;
      }

      const pendingSearch = chessEnginePendingSearch;
      chessEnginePendingSearch = null;
      if (!pendingSearch) {
        return;
      }

      const bestmove = line.split(/\s+/)[1] || "";
      pendingSearch.resolve(bestmove === "(none)" ? null : bestmove);
    });
  });

  chessEngineWorker.addEventListener("error", (error) => {
    console.error("Stockfish worker error.", error);
    chessEngineFailed = true;
    chessEngineReady = false;
    if (chessEnginePendingSearch) {
      chessEnginePendingSearch.resolve(null);
      chessEnginePendingSearch = null;
    }
  });

  chessEngineWorker.postMessage("uci");
}

function getChessMoveUci(move) {
  if (!move) {
    return "";
  }

  const promotion = move.promotion ? move.promotion.toLowerCase() : "";
  return `${getChessSquareName(move.fromRow, move.fromCol)}${getChessSquareName(move.toRow, move.toCol)}${promotion}`;
}

function getChessMoveListUci() {
  return chessTimeline
    .slice(1)
    .map((entry) => entry.uci || getChessMoveUci(entry.move))
    .filter(Boolean);
}

function findChessLegalMoveByUci(state, uciMove) {
  if (!state || !uciMove) {
    return null;
  }

  return getAllChessLegalMoves(state, state.turn).find((move) => getChessMoveUci(move) === uciMove) || null;
}

function requestStockfishMove(state, token) {
  initChessEngine();

  if (!chessEngineWorker || !chessEngineReady || chessEngineFailed) {
    return Promise.resolve(null);
  }

  if (chessEnginePendingSearch) {
    chessEnginePendingSearch.resolve(null);
    chessEnginePendingSearch = null;
  }

  const moves = getChessMoveListUci();

  return new Promise((resolve) => {
    chessEnginePendingSearch = {
      token,
      resolve: (uciMove) => {
        if (token !== chessEngineSearchToken) {
          resolve(null);
          return;
        }

        resolve(uciMove);
      },
    };

    chessEngineWorker.postMessage("stop");
    chessEngineWorker.postMessage(`position startpos${moves.length ? ` moves ${moves.join(" ")}` : ""}`);
    chessEngineWorker.postMessage(`go movetime ${STOCKFISH_MOVE_TIME_MS}`);
  });
}

function clearChessEngineTurn() {
  if (chessEngineTimer) {
    window.clearTimeout(chessEngineTimer);
    chessEngineTimer = null;
  }

  chessEngineSearchToken += 1;

  if (chessEnginePendingSearch) {
    chessEnginePendingSearch.resolve(null);
    chessEnginePendingSearch = null;
  }

  if (chessEngineWorker && chessEngineReady) {
    try {
      chessEngineWorker.postMessage("stop");
    } catch {}
  }

  chessEngineThinking = false;
}

function getChessPositionalBonus(type, color, row, col) {
  const normalizedRow = color === "w" ? row : 7 - row;
  const centerDistance = Math.abs(3.5 - col) + Math.abs(3.5 - normalizedRow);

  if (type === "p") {
    return (6 - normalizedRow) * 7 - Math.abs(3.5 - col) * 2;
  }

  if (type === "n") {
    return Math.round(26 - centerDistance * 8);
  }

  if (type === "b") {
    return Math.round(18 - centerDistance * 5);
  }

  if (type === "r") {
    return normalizedRow <= 1 ? 10 : 0;
  }

  if (type === "q") {
    return Math.round(10 - centerDistance * 3);
  }

  if (type === "k") {
    return normalizedRow >= 6 && (col === 1 || col === 2 || col === 5 || col === 6) ? 18 : -Math.round(centerDistance * 3);
  }

  return 0;
}

function evaluateChessState(state, perspectiveColor) {
  let score = 0;

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (!piece) {
        continue;
      }

      const color = getChessPieceColor(piece);
      const type = getChessPieceType(piece);
      const direction = color === perspectiveColor ? 1 : -1;
      score += direction * ((CHESS_PIECE_VALUES[type] || 0) + getChessPositionalBonus(type, color, row, col));
    }
  }

  if (isChessKingInCheck(state, perspectiveColor)) {
    score -= 24;
  }

  if (isChessKingInCheck(state, getChessOppositeColor(perspectiveColor))) {
    score += 24;
  }

  return score;
}

function scoreChessMoveOrdering(state, move) {
  const piece = state.board[move.fromRow][move.fromCol];
  const target = move.isEnPassant ? `${getChessOppositeColor(getChessPieceColor(piece))}p` : state.board[move.toRow][move.toCol];
  let score = 0;

  if (target) {
    score += (CHESS_PIECE_VALUES[getChessPieceType(target)] || 0) - (CHESS_PIECE_VALUES[getChessPieceType(piece)] || 0) * 0.08;
  }

  if (move.promotion) {
    score += 850;
  }

  if (move.isCastleKingSide || move.isCastleQueenSide) {
    score += 40;
  }

  const nextState = applyChessMove(state, move);
  if (isChessKingInCheck(nextState, nextState.turn)) {
    score += 35;
  }

  return score;
}

function minimaxChess(state, depth, alpha, beta, perspectiveColor) {
  const legalMoves = getAllChessLegalMoves(state, state.turn);

  if (depth === 0 || legalMoves.length === 0) {
    if (legalMoves.length === 0) {
      if (isChessKingInCheck(state, state.turn)) {
        return state.turn === perspectiveColor ? -100000 - depth : 100000 + depth;
      }

      return 0;
    }

    return evaluateChessState(state, perspectiveColor);
  }

  const orderedMoves = [...legalMoves].sort((a, b) => scoreChessMoveOrdering(state, b) - scoreChessMoveOrdering(state, a));
  const maximizing = state.turn === perspectiveColor;

  if (maximizing) {
    let bestScore = -Infinity;

    for (const move of orderedMoves) {
      const score = minimaxChess(applyChessMove(state, move), depth - 1, alpha, beta, perspectiveColor);
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) {
        break;
      }
    }

    return bestScore;
  }

  let bestScore = Infinity;

  for (const move of orderedMoves) {
    const score = minimaxChess(applyChessMove(state, move), depth - 1, alpha, beta, perspectiveColor);
    bestScore = Math.min(bestScore, score);
    beta = Math.min(beta, bestScore);
    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function chooseChessEngineMove(state, engineColor) {
  const legalMoves = getAllChessLegalMoves(state, state.turn);
  if (!legalMoves.length) {
    return null;
  }

  const orderedMoves = [...legalMoves].sort((a, b) => scoreChessMoveOrdering(state, b) - scoreChessMoveOrdering(state, a));
  let bestScore = -Infinity;
  let bestMove = orderedMoves[0];

  for (const move of orderedMoves) {
    const nextState = applyChessMove(state, move);
    const score = minimaxChess(nextState, CHESS_ENGINE_SEARCH_DEPTH - 1, -Infinity, Infinity, engineColor);
    const shouldReplace =
      score > bestScore ||
      (score === bestScore && Math.random() > 0.5);

    if (shouldReplace) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function syncChessTerminalState(state = getCurrentChessState()) {
  if (!state || chessTimelineIndex < chessTimeline.length - 1) {
    return false;
  }

  const legalMoves = getAllChessLegalMoves(state, state.turn);
  if (legalMoves.length > 0) {
    chessResultMessage = "";
    return false;
  }

  chessResultMessage = isChessKingInCheck(state, state.turn)
    ? `${getChessColorLabel(getChessOppositeColor(state.turn))} wins by checkmate.`
    : "Draw by stalemate.";
  return true;
}

function shouldChessEngineMove() {
  const state = getCurrentChessState();
  return Boolean(
    state &&
      chessTimelineIndex === chessTimeline.length - 1 &&
      !chessResultMessage &&
      state.turn === chessEngineColor,
  );
}

async function runChessEngineTurn() {
  chessEngineTimer = null;

  if (!shouldChessEngineMove()) {
    chessEngineThinking = false;
    renderChessGame();
    return;
  }

  if (chessEngineInitStarted && !chessEngineReady && !chessEngineFailed) {
    chessEngineTimer = window.setTimeout(() => {
      runChessEngineTurn();
    }, 120);
    return;
  }

  const state = getCurrentChessState();
  const searchToken = chessEngineSearchToken;
  let move = null;

  if (chessEngineReady && !chessEngineFailed) {
    const engineUciMove = await requestStockfishMove(state, searchToken);
    if (searchToken !== chessEngineSearchToken) {
      return;
    }

    move = findChessLegalMoveByUci(state, engineUciMove);
  }

  if (!move) {
    move = chooseChessEngineMove(state, chessEngineColor);
  }

  chessEngineThinking = false;

  if (!move) {
    syncChessTerminalState(state);
    renderChessGame();
    return;
  }

  commitChessMove(move, { fromEngine: true });
  playUiSound("menuPick");
}

function syncChessEngineTurn(options = {}) {
  const { delay = CHESS_ENGINE_THINK_DELAY_MS } = options;
  initChessEngine();

  if (!shouldChessEngineMove()) {
    clearChessEngineTurn();
    renderChessGame();
    return;
  }

  if (chessEngineTimer || chessEngineThinking) {
    return;
  }

  chessEngineThinking = true;
  renderChessGame();

  chessEngineTimer = window.setTimeout(() => {
    runChessEngineTurn();
  }, delay);
}

function applyChessBoardScale(scaleName = CHESS_BOARD_SCALES[chessBoardScaleIndex] || "standard") {
  if (!chessWindowBody) {
    return;
  }

  const nextScale = CHESS_BOARD_SCALES.includes(scaleName) ? scaleName : "standard";
  chessBoardScaleIndex = CHESS_BOARD_SCALES.indexOf(nextScale);
  chessWindowBody.dataset.chessBoardScale = nextScale;
  chessWindowBody.style.setProperty("--chess-square-size", `${CHESS_BOARD_SCALE_VALUES[nextScale] || CHESS_BOARD_SCALE_VALUES.standard}px`);

  if (chessBoardSizeToggle) {
    chessBoardSizeToggle.setAttribute("aria-label", `Board size: ${nextScale}`);
    chessBoardSizeToggle.setAttribute("title", `Drag to resize board (${nextScale})`);
  }
}

function setChessPlayerColor(color, options = {}) {
  const { playSound = false } = options;
  const nextColor = color === "b" ? "b" : "w";
  if (chessTimeline.length > 1 || chessPlayerColor === nextColor) {
    renderChessGame();
    return;
  }

  chessPlayerColor = nextColor;
  chessEngineColor = getChessOppositeColor(nextColor);
  chessPerspective = nextColor;
  resetChessGame({ preservePlayerColor: true });

  if (playSound) {
    playUiSound("click");
  }
}

function toggleChessPlayerColor(options = {}) {
  setChessPlayerColor(chessPlayerColor === "w" ? "b" : "w", options);
}

function startChessRematch(options = {}) {
  const { playSound = false } = options;
  chessPlayerColor = getChessOppositeColor(chessPlayerColor);
  chessEngineColor = getChessOppositeColor(chessPlayerColor);
  chessPerspective = chessPlayerColor;
  chessRematchReady = false;
  resetChessGame({ preservePlayerColor: true });

  if (playSound) {
    playUiSound("submit");
  }
}

function getChessSquareSizeValue() {
  const raw = Number.parseFloat(chessWindowBody?.style.getPropertyValue("--chess-square-size") || "");
  if (Number.isFinite(raw)) {
    return raw;
  }

  return CHESS_BOARD_SCALE_VALUES[CHESS_BOARD_SCALES[chessBoardScaleIndex]] || CHESS_BOARD_SCALE_VALUES.standard;
}

function getChessBoardMaxSquareSize() {
  if (!chessWindowBody || !chessLayout || !chessBoardPanel || !chessBoard || !chessSidebar) {
    return CHESS_BOARD_SIZE_MAX;
  }

  const layoutStyles = window.getComputedStyle(chessLayout);
  const panelStyles = window.getComputedStyle(chessBoardPanel);
  const columnGap = Number.parseFloat(layoutStyles.columnGap || layoutStyles.gap || "0") || 0;
  const rowGap = Number.parseFloat(panelStyles.rowGap || panelStyles.gap || "0") || 0;
  const boardExtraWidth = Math.max(chessBoardShell.offsetWidth - chessBoard.offsetWidth, 0);
  const boardShellExtraHeight = Math.max(chessBoardShell.offsetHeight - chessBoard.offsetHeight, 0);
  const boardPanelChromeHeight =
    (chessMeta?.offsetHeight || 0) +
    (chessOpponentMaterial?.offsetHeight || 0) +
    (chessPlayerMaterial?.offsetHeight || 0) +
    rowGap * 3;
  const boardExtraHeight = boardShellExtraHeight + boardPanelChromeHeight;
  const availableWidth = Math.max(chessLayout.clientWidth - chessSidebar.offsetWidth - columnGap - 2, 0);
  const availableHeight = Math.max(chessLayout.clientHeight + 6, 0);
  const maxByWidth = Math.floor((availableWidth - boardExtraWidth) / 8);
  const maxByHeight = Math.floor((availableHeight - boardExtraHeight) / 8);

  return clamp(Math.min(maxByWidth, maxByHeight, CHESS_BOARD_SIZE_MAX), CHESS_BOARD_SIZE_MIN, CHESS_BOARD_SIZE_MAX);
}

function getCompactChessSpawnSquareSize() {
  const stageRect = desktopStage?.getBoundingClientRect();
  const stageWidth = stageRect?.width || window.innerWidth || 390;
  const availableBoardWidth = Math.max(stageWidth - 36, 320);
  return clamp(Math.floor(availableBoardWidth / 8), 40, 44);
}

function applyCompactChessBoardPreset() {
  if (!chessWindowBody) {
    return;
  }

  const nextSize = getCompactChessSpawnSquareSize();
  chessWindowBody.dataset.chessBoardScale = "expanded";
  chessWindowBody.dataset.compactChessSpawnSize = String(nextSize);
  chessWindowBody.style.setProperty("--chess-square-size", `${nextSize}px`);
}

function syncChessLayoutMetrics() {
  if (!chessWindowBody || !chessBoardPanel) {
    return;
  }

  if (isCompactDesktopLayout()) {
    const lockedSize =
      Number.parseFloat(chessWindowBody.dataset.compactChessSpawnSize || "") || getCompactChessSpawnSquareSize();
    chessWindowBody.style.setProperty("--chess-square-size", `${lockedSize}px`);
    if (chessSidebar) {
      chessSidebar.style.height = "";
    }
    requestCustomScrollbarSync();
    return;
  }

  const maxSquareSize = getChessBoardMaxSquareSize();
  const currentSize = getChessSquareSizeValue();
  if (currentSize > maxSquareSize) {
    chessWindowBody.style.setProperty("--chess-square-size", `${maxSquareSize}px`);
  }

  window.requestAnimationFrame(() => {
    if (!chessWindowBody || !chessSidebar || !chessBoardShell) {
      return;
    }

    const boardShellRect = chessBoardShell.getBoundingClientRect();
    const sidebarRect = chessSidebar.getBoundingClientRect();
    const targetSidebarHeight = Math.max(Math.round(boardShellRect.bottom - sidebarRect.top), 0);
    chessSidebar.style.height = `${targetSidebarHeight}px`;

    requestCustomScrollbarSync();
  });
}

function expandChessBoardToWindow() {
  if (!chessWindowBody) {
    return;
  }

  const maxSquareSize = getChessBoardMaxSquareSize();
  chessWindowBody.style.setProperty("--chess-square-size", `${maxSquareSize}px`);
  const nearestScale = CHESS_BOARD_SCALES.reduce((best, scaleName) => {
    const distance = Math.abs(CHESS_BOARD_SCALE_VALUES[scaleName] - maxSquareSize);
    const bestDistance = Math.abs(CHESS_BOARD_SCALE_VALUES[best] - maxSquareSize);
    return distance < bestDistance ? scaleName : best;
  }, "standard");

  chessBoardScaleIndex = CHESS_BOARD_SCALES.indexOf(nearestScale);
  chessWindowBody.dataset.chessBoardScale = nearestScale;

  if (chessBoardSizeToggle) {
    chessBoardSizeToggle.setAttribute("aria-label", `Board size: ${maxSquareSize}px`);
    chessBoardSizeToggle.setAttribute("title", `Drag to resize board (${maxSquareSize}px)`);
  }

  syncChessLayoutMetrics();
}

function setChessBoardSizeFromPixels(nextSize, options = {}) {
  const { playSound = false } = options;
  const clamped = clamp(Math.round(nextSize), CHESS_BOARD_SIZE_MIN, getChessBoardMaxSquareSize());
  const nearestScale = CHESS_BOARD_SCALES.reduce((best, scaleName) => {
    const distance = Math.abs(CHESS_BOARD_SCALE_VALUES[scaleName] - clamped);
    const bestDistance = Math.abs(CHESS_BOARD_SCALE_VALUES[best] - clamped);
    return distance < bestDistance ? scaleName : best;
  }, "standard");

  chessBoardScaleIndex = CHESS_BOARD_SCALES.indexOf(nearestScale);
  if (chessWindowBody) {
    chessWindowBody.dataset.chessBoardScale = nearestScale;
    chessWindowBody.style.setProperty("--chess-square-size", `${clamped}px`);
  }

  if (chessBoardSizeToggle) {
    chessBoardSizeToggle.setAttribute("aria-label", `Board size: ${clamped}px`);
    chessBoardSizeToggle.setAttribute("title", `Drag to resize board (${clamped}px)`);
  }

  syncChessLayoutMetrics();

  if (playSound) {
    playUiSound("click");
  }
}

function jumpToChessTimeline(index, options = {}) {
  const { playSound = false } = options;
  const nextIndex = clamp(index, 0, Math.max(chessTimeline.length - 1, 0));
  if (nextIndex === chessTimelineIndex) {
    return false;
  }

  const previousIndex = chessTimelineIndex;
  clearChessEngineTurn();
  chessTimelineIndex = nextIndex;
  chessSelectedSquare = null;
  chessPendingPromotion = null;
  renderChessGame();
  syncChessEngineTurn({ delay: 160 });

  if (playSound) {
    playUiSound(nextIndex > previousIndex ? "menuPick" : "menuClose");
  }

  return true;
}

function getChessPieceColor(piece) {
  return piece ? piece[0] : null;
}

function getChessPieceType(piece) {
  return piece ? piece[1] : null;
}

function isChessSquareInside(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function getChessSquareName(row, col) {
  return `${"abcdefgh"[col]}${8 - row}`;
}

function getChessColorLabel(color) {
  return color === "w" ? "White" : "Black";
}

function getChessOppositeColor(color) {
  return color === "w" ? "b" : "w";
}

function getChessDisplaySquareFromBoard(row, col) {
  if (chessPerspective === "b") {
    return {
      row: 7 - row,
      col: 7 - col,
    };
  }

  return { row, col };
}

function getChessMaterialBalance(board) {
  const counts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }

      const color = getChessPieceColor(piece);
      const type = getChessPieceType(piece);
      if (type !== "k") {
        counts[color][type] += 1;
      }
    }
  }

  return counts;
}

function getChessMaterialDisplayCounts(counts) {
  const displayCounts = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 },
  };
  const pieceTypes = ["p", "n", "b", "r", "q"];

  pieceTypes.forEach((type) => {
    const diff = counts.w[type] - counts.b[type];
    if (diff > 0) {
      displayCounts.w[type] = diff;
    } else if (diff < 0) {
      displayCounts.b[type] = Math.abs(diff);
    }
  });

  const equalValueGroups = [
    ["q"],
    ["r"],
    ["b", "n"],
    ["p"],
  ];

  equalValueGroups.forEach((group) => {
    while (true) {
      const whiteType = group.find((type) => displayCounts.w[type] > 0);
      const blackType = group.find((type) => displayCounts.b[type] > 0);
      if (!whiteType || !blackType) {
        break;
      }

      displayCounts.w[whiteType] -= 1;
      displayCounts.b[blackType] -= 1;
    }
  });

  return displayCounts;
}

function getChessMaterialDisplayValueForColor(color, displayCounts) {
  return Object.entries(displayCounts[color]).reduce(
    (total, [type, amount]) => total + (CHESS_MATERIAL_DISPLAY_VALUES[type] || 0) * amount,
    0,
  );
}

function getChessMaterialAdvantageMarkup(color, displayCounts) {
  const pieceOrder = ["q", "r", "b", "n", "p"];
  const pieces = [];
  const ownValue = getChessMaterialDisplayValueForColor(color, displayCounts);
  const opponentValue = getChessMaterialDisplayValueForColor(getChessOppositeColor(color), displayCounts);
  const netScore = ownValue - opponentValue;

  pieceOrder.forEach((type) => {
    const advantage = displayCounts[color][type];
    if (advantage <= 0) {
      return;
    }

    for (let index = 0; index < advantage; index += 1) {
      pieces.push(getChessPieceMarkup(`${color}${type}`, { material: true }));
    }
  });

  if (!pieces.length && netScore <= 0) {
    return "";
  }

  const scoreMarkup = netScore > 0 ? `<span class="chess-material-score">+${netScore}</span>` : "";
  return `${pieces.join("")}${scoreMarkup}`;
}

function getChessPromotionChoices(state, move) {
  if (!state || !move?.promotion) {
    return move ? [move] : [];
  }

  const piece = state.board?.[move.fromRow]?.[move.fromCol];
  if (!piece || getChessPieceType(piece) !== "p") {
    return [move];
  }

  return getChessLegalMovesForPiece(state, move.fromRow, move.fromCol)
    .filter(
      (candidate) =>
        candidate.toRow === move.toRow &&
        candidate.toCol === move.toCol &&
        Boolean(candidate.promotion),
    )
    .sort(
      (left, right) =>
        CHESS_PROMOTION_PIECES.indexOf(left.promotion) - CHESS_PROMOTION_PIECES.indexOf(right.promotion),
    );
}

function queueChessPromotion(state, move) {
  const choices = getChessPromotionChoices(state, move);
  if (choices.length <= 1) {
    return false;
  }

  chessPendingPromotion = {
    fromRow: move.fromRow,
    fromCol: move.fromCol,
    toRow: move.toRow,
    toCol: move.toCol,
    moves: choices,
  };
  chessSelectedSquare = {
    row: move.fromRow,
    col: move.fromCol,
  };
  renderChessGame();
  playUiSound("click");
  return true;
}

function attemptChessMove(move, options = {}) {
  const { fromEngine = false } = options;
  const state = getCurrentChessState();
  if (!move || !state) {
    return false;
  }

  if (!fromEngine && move.promotion && queueChessPromotion(state, move)) {
    return false;
  }

  chessPendingPromotion = null;
  commitChessMove(move, options);
  return true;
}

function renderChessPromotionPicker() {
  if (!chessPromotionPicker || !chessBoardShell) {
    return;
  }

  if (!chessPendingPromotion?.moves?.length) {
    chessPromotionPicker.hidden = true;
    chessPromotionPicker.innerHTML = "";
    return;
  }

  const { toRow, toCol, moves } = chessPendingPromotion;
  const pieceColor = getChessPieceColor(getCurrentChessState()?.board?.[moves[0].fromRow]?.[moves[0].fromCol] || `${chessPlayerColor}p`);
  const displaySquare = getChessDisplaySquareFromBoard(toRow, toCol);
  const squareSize = getChessSquareSizeValue();
  const shellPadding = 8;
  const anchorLeft = shellPadding + displaySquare.col * squareSize + squareSize / 2;
  const anchorTop = shellPadding + displaySquare.row * squareSize + squareSize / 2;
  const verticalBias = displaySquare.row > 3 ? -1 : 1;
  const offsetY = Math.round((squareSize * 0.64 + 12) * verticalBias);

  chessPromotionPicker.style.left = `${Math.round(anchorLeft)}px`;
  chessPromotionPicker.style.top = `${Math.round(anchorTop + offsetY)}px`;
  chessPromotionPicker.innerHTML = moves
    .map(
      (move) => `
        <button
          class="chess-promotion-option"
          type="button"
          data-promotion-piece="${move.promotion}"
          aria-label="Promote to ${move.promotion.toUpperCase()}"
        >
          ${getChessPieceMarkup(`${pieceColor}${move.promotion}`)}
        </button>
      `,
    )
    .join("");
  chessPromotionPicker.hidden = false;
}

function serializeChessHistoryForClipboard() {
  if (chessTimeline.length <= 1) {
    return "";
  }

  const lines = [];
  for (let index = 1; index < chessTimeline.length; index += 2) {
    const whiteMove = chessTimeline[index]?.label || "";
    const blackMove = chessTimeline[index + 1]?.label || "";
    const moveNumber = Math.ceil(index / 2);
    lines.push(`${moveNumber}. ${whiteMove}${blackMove ? ` ${blackMove}` : ""}`);
  }

  return lines.join("\n");
}

function renderChessMaterial(counts) {
  if (!chessOpponentMaterial || !chessPlayerMaterial) {
    return;
  }

  const displayCounts = getChessMaterialDisplayCounts(counts);
  const topColor = chessPerspective === "w" ? "b" : "w";
  const bottomColor = chessPerspective === "w" ? "w" : "b";

  chessOpponentMaterial.innerHTML = getChessMaterialAdvantageMarkup(topColor, displayCounts);
  chessOpponentMaterial.hidden = !chessOpponentMaterial.innerHTML;

  chessPlayerMaterial.innerHTML = getChessMaterialAdvantageMarkup(bottomColor, displayCounts);
  chessPlayerMaterial.hidden = !chessPlayerMaterial.innerHTML;
}

function getChessPieceAt(board, row, col) {
  return isChessSquareInside(row, col) ? board[row][col] : null;
}

function findChessKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      if (board[row][col] === `${color}k`) {
        return { row, col };
      }
    }
  }

  return null;
}

function isChessSquareAttacked(board, row, col, attackerColor) {
  const pawnRowOffset = attackerColor === "w" ? 1 : -1;
  for (const deltaCol of [-1, 1]) {
    const piece = getChessPieceAt(board, row + pawnRowOffset, col + deltaCol);
    if (piece === `${attackerColor}p`) {
      return true;
    }
  }

  const knightOffsets = [
    [-2, -1],
    [-2, 1],
    [-1, -2],
    [-1, 2],
    [1, -2],
    [1, 2],
    [2, -1],
    [2, 1],
  ];
  for (const [deltaRow, deltaCol] of knightOffsets) {
    const piece = getChessPieceAt(board, row + deltaRow, col + deltaCol);
    if (piece === `${attackerColor}n`) {
      return true;
    }
  }

  const bishopDirections = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];
  for (const [deltaRow, deltaCol] of bishopDirections) {
    let nextRow = row + deltaRow;
    let nextCol = col + deltaCol;
    while (isChessSquareInside(nextRow, nextCol)) {
      const piece = board[nextRow][nextCol];
      if (piece) {
        if (getChessPieceColor(piece) === attackerColor) {
          const type = getChessPieceType(piece);
          if (type === "b" || type === "q") {
            return true;
          }
        }
        break;
      }
      nextRow += deltaRow;
      nextCol += deltaCol;
    }
  }

  const rookDirections = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [deltaRow, deltaCol] of rookDirections) {
    let nextRow = row + deltaRow;
    let nextCol = col + deltaCol;
    while (isChessSquareInside(nextRow, nextCol)) {
      const piece = board[nextRow][nextCol];
      if (piece) {
        if (getChessPieceColor(piece) === attackerColor) {
          const type = getChessPieceType(piece);
          if (type === "r" || type === "q") {
            return true;
          }
        }
        break;
      }
      nextRow += deltaRow;
      nextCol += deltaCol;
    }
  }

  for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
    for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
      if (deltaRow === 0 && deltaCol === 0) {
        continue;
      }

      const piece = getChessPieceAt(board, row + deltaRow, col + deltaCol);
      if (piece === `${attackerColor}k`) {
        return true;
      }
    }
  }

  return false;
}

function isChessKingInCheck(state, color) {
  const kingSquare = findChessKing(state.board, color);
  if (!kingSquare) {
    return false;
  }

  const opponent = color === "w" ? "b" : "w";
  return isChessSquareAttacked(state.board, kingSquare.row, kingSquare.col, opponent);
}

function getChessSlidingMoves(state, row, col, directions) {
  const piece = state.board[row][col];
  const color = getChessPieceColor(piece);
  const moves = [];

  for (const [deltaRow, deltaCol] of directions) {
    let nextRow = row + deltaRow;
    let nextCol = col + deltaCol;
    while (isChessSquareInside(nextRow, nextCol)) {
      const target = state.board[nextRow][nextCol];
      if (!target) {
        moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol });
      } else {
        if (getChessPieceColor(target) !== color) {
          moves.push({ fromRow: row, fromCol: col, toRow: nextRow, toCol: nextCol });
        }
        break;
      }
      nextRow += deltaRow;
      nextCol += deltaCol;
    }
  }

  return moves;
}

function getChessPseudoMoves(state, row, col) {
  const piece = state.board[row][col];
  if (!piece) {
    return [];
  }

  const color = getChessPieceColor(piece);
  const type = getChessPieceType(piece);
  const moves = [];
  const forward = color === "w" ? -1 : 1;
  const startRow = color === "w" ? 6 : 1;
  const promotionRow = color === "w" ? 0 : 7;
  const appendPawnMove = (targetMove) => {
    if (targetMove.toRow !== promotionRow) {
      moves.push({ ...targetMove, promotion: null });
      return;
    }

    CHESS_PROMOTION_PIECES.forEach((promotionPiece) => {
      moves.push({ ...targetMove, promotion: promotionPiece });
    });
  };

  if (type === "p") {
    const oneRow = row + forward;
    if (isChessSquareInside(oneRow, col) && !state.board[oneRow][col]) {
      appendPawnMove({
        fromRow: row,
        fromCol: col,
        toRow: oneRow,
        toCol: col,
      });

      const twoRow = row + forward * 2;
      if (row === startRow && !state.board[twoRow][col]) {
        moves.push({ fromRow: row, fromCol: col, toRow: twoRow, toCol: col, isDoublePawnPush: true });
      }
    }

    for (const deltaCol of [-1, 1]) {
      const targetRow = row + forward;
      const targetCol = col + deltaCol;
      if (!isChessSquareInside(targetRow, targetCol)) {
        continue;
      }

      const targetPiece = state.board[targetRow][targetCol];
      if (targetPiece && getChessPieceColor(targetPiece) !== color) {
        appendPawnMove({
          fromRow: row,
          fromCol: col,
          toRow: targetRow,
          toCol: targetCol,
        });
      } else if (state.enPassant && state.enPassant.row === targetRow && state.enPassant.col === targetCol) {
        moves.push({
          fromRow: row,
          fromCol: col,
          toRow: targetRow,
          toCol: targetCol,
          isEnPassant: true,
        });
      }
    }

    return moves;
  }

  if (type === "n") {
    const knightOffsets = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];
    for (const [deltaRow, deltaCol] of knightOffsets) {
      const targetRow = row + deltaRow;
      const targetCol = col + deltaCol;
      if (!isChessSquareInside(targetRow, targetCol)) {
        continue;
      }

      const targetPiece = state.board[targetRow][targetCol];
      if (!targetPiece || getChessPieceColor(targetPiece) !== color) {
        moves.push({ fromRow: row, fromCol: col, toRow: targetRow, toCol: targetCol });
      }
    }
    return moves;
  }

  if (type === "b") {
    return getChessSlidingMoves(state, row, col, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
  }

  if (type === "r") {
    return getChessSlidingMoves(state, row, col, [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  if (type === "q") {
    return getChessSlidingMoves(state, row, col, [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);
  }

  if (type === "k") {
    for (let deltaRow = -1; deltaRow <= 1; deltaRow += 1) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol += 1) {
        if (deltaRow === 0 && deltaCol === 0) {
          continue;
        }

        const targetRow = row + deltaRow;
        const targetCol = col + deltaCol;
        if (!isChessSquareInside(targetRow, targetCol)) {
          continue;
        }

        const targetPiece = state.board[targetRow][targetCol];
        if (!targetPiece || getChessPieceColor(targetPiece) !== color) {
          moves.push({ fromRow: row, fromCol: col, toRow: targetRow, toCol: targetCol });
        }
      }
    }

    const opponent = color === "w" ? "b" : "w";
    if (!isChessKingInCheck(state, color)) {
      if (
        color === "w" &&
        state.castling.wKing &&
        !state.board[7][5] &&
        !state.board[7][6] &&
        !isChessSquareAttacked(state.board, 7, 5, opponent) &&
        !isChessSquareAttacked(state.board, 7, 6, opponent)
      ) {
        moves.push({ fromRow: 7, fromCol: 4, toRow: 7, toCol: 6, isCastleKingSide: true });
      }

      if (
        color === "w" &&
        state.castling.wQueen &&
        !state.board[7][1] &&
        !state.board[7][2] &&
        !state.board[7][3] &&
        !isChessSquareAttacked(state.board, 7, 3, opponent) &&
        !isChessSquareAttacked(state.board, 7, 2, opponent)
      ) {
        moves.push({ fromRow: 7, fromCol: 4, toRow: 7, toCol: 2, isCastleQueenSide: true });
      }

      if (
        color === "b" &&
        state.castling.bKing &&
        !state.board[0][5] &&
        !state.board[0][6] &&
        !isChessSquareAttacked(state.board, 0, 5, opponent) &&
        !isChessSquareAttacked(state.board, 0, 6, opponent)
      ) {
        moves.push({ fromRow: 0, fromCol: 4, toRow: 0, toCol: 6, isCastleKingSide: true });
      }

      if (
        color === "b" &&
        state.castling.bQueen &&
        !state.board[0][1] &&
        !state.board[0][2] &&
        !state.board[0][3] &&
        !isChessSquareAttacked(state.board, 0, 3, opponent) &&
        !isChessSquareAttacked(state.board, 0, 2, opponent)
      ) {
        moves.push({ fromRow: 0, fromCol: 4, toRow: 0, toCol: 2, isCastleQueenSide: true });
      }
    }

    return moves;
  }

  return moves;
}

function applyChessMove(state, move) {
  const nextState = cloneChessState(state);
  const piece = nextState.board[move.fromRow][move.fromCol];
  const color = getChessPieceColor(piece);
  const type = getChessPieceType(piece);
  const targetPiece = nextState.board[move.toRow][move.toCol];

  nextState.board[move.fromRow][move.fromCol] = null;

  if (move.isEnPassant) {
    nextState.board[move.fromRow][move.toCol] = null;
  }

  if (move.isCastleKingSide) {
    nextState.board[move.toRow][move.toCol] = piece;
    nextState.board[move.toRow][5] = nextState.board[move.toRow][7];
    nextState.board[move.toRow][7] = null;
  } else if (move.isCastleQueenSide) {
    nextState.board[move.toRow][move.toCol] = piece;
    nextState.board[move.toRow][3] = nextState.board[move.toRow][0];
    nextState.board[move.toRow][0] = null;
  } else {
    nextState.board[move.toRow][move.toCol] = move.promotion ? `${color}${move.promotion}` : piece;
  }

  if (type === "k") {
    if (color === "w") {
      nextState.castling.wKing = false;
      nextState.castling.wQueen = false;
    } else {
      nextState.castling.bKing = false;
      nextState.castling.bQueen = false;
    }
  }

  if (type === "r") {
    if (move.fromRow === 7 && move.fromCol === 0) {
      nextState.castling.wQueen = false;
    }
    if (move.fromRow === 7 && move.fromCol === 7) {
      nextState.castling.wKing = false;
    }
    if (move.fromRow === 0 && move.fromCol === 0) {
      nextState.castling.bQueen = false;
    }
    if (move.fromRow === 0 && move.fromCol === 7) {
      nextState.castling.bKing = false;
    }
  }

  if (targetPiece === "wr") {
    if (move.toRow === 7 && move.toCol === 0) {
      nextState.castling.wQueen = false;
    }
    if (move.toRow === 7 && move.toCol === 7) {
      nextState.castling.wKing = false;
    }
  }

  if (targetPiece === "br") {
    if (move.toRow === 0 && move.toCol === 0) {
      nextState.castling.bQueen = false;
    }
    if (move.toRow === 0 && move.toCol === 7) {
      nextState.castling.bKing = false;
    }
  }

  nextState.enPassant = null;
  if (type === "p" && Math.abs(move.toRow - move.fromRow) === 2) {
    nextState.enPassant = {
      row: (move.toRow + move.fromRow) / 2,
      col: move.fromCol,
    };
  }

  nextState.turn = color === "w" ? "b" : "w";
  return nextState;
}

function getChessLegalMovesForPiece(state, row, col) {
  const piece = state.board[row][col];
  if (!piece || getChessPieceColor(piece) !== state.turn) {
    return [];
  }

  return getChessPseudoMoves(state, row, col).filter((move) => {
    const nextState = applyChessMove(state, move);
    return !isChessKingInCheck(nextState, getChessPieceColor(piece));
  });
}

function getAllChessLegalMoves(state, color = state.turn) {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = state.board[row][col];
      if (piece && getChessPieceColor(piece) === color) {
        moves.push(...getChessLegalMovesForPiece({ ...state, turn: color }, row, col));
      }
    }
  }
  return moves;
}

function getChessMoveLabel(state, move) {
  const piece = state.board[move.fromRow][move.fromCol];
  const targetPiece = state.board[move.toRow][move.toCol];

  if (move.isCastleKingSide) {
    return "O-O";
  }

  if (move.isCastleQueenSide) {
    return "O-O-O";
  }

  const captureMarker = targetPiece || move.isEnPassant ? "x" : "-";
  const promotionLabel = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  const prefix = getChessPieceType(piece) === "p" ? "" : getChessPieceType(piece).toUpperCase();
  return `${prefix}${getChessSquareName(move.fromRow, move.fromCol)}${captureMarker}${getChessSquareName(move.toRow, move.toCol)}${promotionLabel}`;
}

function getChessSanMove(state, move) {
  const piece = state.board[move.fromRow][move.fromCol];
  if (!piece) {
    return "";
  }

  if (move.isCastleKingSide) {
    const nextState = applyChessMove(state, move);
    const nextMoves = getAllChessLegalMoves(nextState, nextState.turn);
    const suffix = isChessKingInCheck(nextState, nextState.turn) ? (nextMoves.length === 0 ? "#" : "+") : "";
    return `O-O${suffix}`;
  }

  if (move.isCastleQueenSide) {
    const nextState = applyChessMove(state, move);
    const nextMoves = getAllChessLegalMoves(nextState, nextState.turn);
    const suffix = isChessKingInCheck(nextState, nextState.turn) ? (nextMoves.length === 0 ? "#" : "+") : "";
    return `O-O-O${suffix}`;
  }

  const pieceType = getChessPieceType(piece);
  const pieceColor = getChessPieceColor(piece);
  const targetPiece = move.isEnPassant ? `${getChessOppositeColor(pieceColor)}p` : state.board[move.toRow][move.toCol];
  const isCapture = Boolean(targetPiece);
  const destination = getChessSquareName(move.toRow, move.toCol);
  const prefix = pieceType === "p" ? "" : pieceType.toUpperCase();

  let disambiguation = "";
  if (pieceType !== "p") {
    const competingMoves = getAllChessLegalMoves(state, pieceColor).filter((candidate) => {
      if (
        candidate.fromRow === move.fromRow &&
        candidate.fromCol === move.fromCol &&
        candidate.toRow === move.toRow &&
        candidate.toCol === move.toCol
      ) {
        return false;
      }

      const candidatePiece = state.board[candidate.fromRow][candidate.fromCol];
      return (
        candidatePiece &&
        getChessPieceType(candidatePiece) === pieceType &&
        candidate.toRow === move.toRow &&
        candidate.toCol === move.toCol
      );
    });

    if (competingMoves.length > 0) {
      const sameFile = competingMoves.some((candidate) => candidate.fromCol === move.fromCol);
      const sameRank = competingMoves.some((candidate) => candidate.fromRow === move.fromRow);

      if (!sameFile) {
        disambiguation = getChessSquareName(move.fromRow, move.fromCol)[0];
      } else if (!sameRank) {
        disambiguation = getChessSquareName(move.fromRow, move.fromCol)[1];
      } else {
        disambiguation = getChessSquareName(move.fromRow, move.fromCol);
      }
    }
  } else if (isCapture) {
    disambiguation = getChessSquareName(move.fromRow, move.fromCol)[0];
  }

  const promotionLabel = move.promotion ? `=${move.promotion.toUpperCase()}` : "";
  const nextState = applyChessMove(state, move);
  const nextMoves = getAllChessLegalMoves(nextState, nextState.turn);
  const suffix = isChessKingInCheck(nextState, nextState.turn) ? (nextMoves.length === 0 ? "#" : "+") : "";

  return `${prefix}${disambiguation}${isCapture ? "x" : ""}${destination}${promotionLabel}${suffix}`;
}

function getChessPgnResult() {
  if (chessResultMessage === "White wins by checkmate." || chessResultMessage === "White wins by resignation.") {
    return "1-0";
  }

  if (chessResultMessage === "Black wins by checkmate." || chessResultMessage === "Black wins by resignation.") {
    return "0-1";
  }

  if (chessResultMessage === "Draw by stalemate.") {
    return "1/2-1/2";
  }

  return "*";
}

function formatChessPgn() {
  const result = getChessPgnResult();
  const date = new Date();
  const dateLabel = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  const whiteLabel = chessPlayerColor === "w" ? "Visitor" : "Markus";
  const blackLabel = chessPlayerColor === "b" ? "Visitor" : "Markus";
  const movetext = [];

  for (let index = 1; index < chessTimeline.length; index += 2) {
    const moveNumber = Math.ceil(index / 2);
    const whiteMove = chessTimeline[index]?.san || chessTimeline[index]?.label || "";
    const blackMove = chessTimeline[index + 1]?.san || chessTimeline[index + 1]?.label || "";
    if (blackMove) {
      movetext.push(`${moveNumber}. ${whiteMove} ${blackMove}`);
    } else {
      movetext.push(`${moveNumber}. ${whiteMove}`);
    }
  }

  movetext.push(result);

  return [
    '[Event "Play vs Markus"]',
    '[Site "Markus Stark Website"]',
    `[Date "${dateLabel}"]`,
    `[White "${whiteLabel}"]`,
    `[Black "${blackLabel}"]`,
    `[Result "${result}"]`,
    "",
    movetext.join(" "),
  ].join("\n");
}

async function copyTextToClipboard(text) {
  if (!text) {
    return false;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  textarea.remove();
  return copied;
}

function resetChessGame(options = {}) {
  const { preservePlayerColor = true } = options;

  initChessEngine();
  clearChessNotice();
  clearChessEngineTurn();
  chessResultMessage = "";
  chessRematchReady = false;
  if (!preservePlayerColor) {
    chessPlayerColor = "w";
    chessEngineColor = "b";
    chessPerspective = "w";
  } else {
    chessEngineColor = getChessOppositeColor(chessPlayerColor);
    chessPerspective = chessPlayerColor;
  }
  chessTimeline = [{ state: createInitialChessState(), move: null, label: null }];
  chessTimelineIndex = 0;
  chessSelectedSquare = null;
  chessPendingPromotion = null;
  if (chessEngineWorker && chessEngineReady) {
    try {
      chessEngineWorker.postMessage("ucinewgame");
      chessEngineWorker.postMessage("isready");
    } catch {}
  }
  syncChessTerminalState();
  renderChessGame();
  syncChessEngineTurn();
}

function commitChessMove(move, options = {}) {
  const { fromEngine = false } = options;
  const currentState = getCurrentChessState();
  if (!currentState || chessTimelineIndex !== chessTimeline.length - 1 || chessResultMessage) {
    return;
  }

  clearChessNotice();
  clearChessEngineTurn();
  const nextState = applyChessMove(currentState, move);
  const label = getChessMoveLabel(currentState, move);
  const san = getChessSanMove(currentState, move);
  const uci = getChessMoveUci(move);
  chessTimeline = chessTimeline.slice(0, chessTimelineIndex + 1);
  chessTimeline.push({ state: nextState, move, label, san, uci });
  chessTimelineIndex += 1;
  chessSelectedSquare = null;
  chessPendingPromotion = null;
  syncChessTerminalState(nextState);
  renderChessGame();
  maybeCelebrateChessWin();

  if (!fromEngine) {
    syncChessEngineTurn();
  }
}

function maybeCelebrateChessWin() {
  if (!chessResultMessage) {
    return;
  }

  const visitorWonByCheckmate = chessResultMessage === `${getChessColorLabel(chessPlayerColor)} wins by checkmate.`;
  const visitorWonByResignation = chessResultMessage === `${getChessColorLabel(chessPlayerColor)} wins by resignation.`;
  if (!visitorWonByCheckmate && !visitorWonByResignation) {
    return;
  }

  showSystemOverlay?.("chess-win");
}

function getChessGameStatus(state) {
  if (chessNoticeMessage) {
    return chessNoticeMessage;
  }

  if (chessEngineThinking) {
    return "Markus is thinking...";
  }

  if (chessTimelineIndex < chessTimeline.length - 1) {
    return `Reviewing move ${chessTimelineIndex} of ${Math.max(chessTimeline.length - 1, 0)}.`;
  }

  if (chessResultMessage) {
    return chessResultMessage;
  }

  const legalMoves = getAllChessLegalMoves(state, state.turn);
  const inCheck = isChessKingInCheck(state, state.turn);

  if (legalMoves.length === 0 && inCheck) {
    return `${getChessColorLabel(state.turn === "w" ? "b" : "w")} wins by checkmate.`;
  }

  if (legalMoves.length === 0) {
    return "Draw by stalemate.";
  }

  return `${getChessColorLabel(state.turn)} to move${inCheck ? " - check." : "."}`;
}

function renderChessHistory() {
  if (!chessHistoryList) {
    return;
  }

  if (chessTimeline.length <= 1) {
    chessHistoryList.innerHTML = '<li class="chess-history-empty">No moves yet.</li>';
    return;
  }

  const rows = [];
  for (let index = 1; index < chessTimeline.length; index += 2) {
    const whiteMove = chessTimeline[index]?.label || "";
    const blackMove = chessTimeline[index + 1]?.label || "";
    const moveNumber = Math.ceil(index / 2);
    rows.push(`
      <li class="chess-history-row">
        <span class="chess-history-move-number">${moveNumber}</span>
        <button
          class="chess-history-move${chessTimelineIndex === index ? " is-active" : ""}"
          type="button"
          data-history-index="${index}"
        >
          ${whiteMove}
        </button>
        ${
          blackMove
            ? `
              <button
                class="chess-history-move${chessTimelineIndex === index + 1 ? " is-active" : ""}"
                type="button"
                data-history-index="${index + 1}"
              >
                ${blackMove}
              </button>
            `
            : '<span class="chess-history-move chess-history-move-empty"></span>'
        }
      </li>
    `);
  }

  chessHistoryList.innerHTML = rows.join("");
}

function getChessDisplayToBoardSquare(displayRow, displayCol) {
  if (chessPerspective === "b") {
    return {
      row: 7 - displayRow,
      col: 7 - displayCol,
    };
  }

  return {
    row: displayRow,
    col: displayCol,
  };
}

function renderChessBoard() {
  if (!chessBoard) {
    return;
  }

  const state = getCurrentChessState();
  if (!state) {
    return;
  }

  const selectedMoves = chessSelectedSquare
    ? getChessLegalMovesForPiece(state, chessSelectedSquare.row, chessSelectedSquare.col)
    : [];
  const lastMove = getCurrentChessEntry()?.move;

  const squares = [];
  for (let displayRow = 0; displayRow < 8; displayRow += 1) {
    for (let displayCol = 0; displayCol < 8; displayCol += 1) {
      const { row, col } = getChessDisplayToBoardSquare(displayRow, displayCol);
      const piece = state.board[row][col];
      const coordinate = getChessSquareName(row, col);
      const isLight = (row + col) % 2 === 0;
      const isSelected = chessSelectedSquare && chessSelectedSquare.row === row && chessSelectedSquare.col === col;
      const isDragSource =
        chessPieceDragState.didDrag && chessPieceDragState.sourceRow === row && chessPieceDragState.sourceCol === col;
      const legalMove = selectedMoves.find((move) => move.toRow === row && move.toCol === col);
      const isLastMove =
        lastMove &&
        ((lastMove.fromRow === row && lastMove.fromCol === col) || (lastMove.toRow === row && lastMove.toCol === col));
      const rankLabel = displayCol === 7 ? coordinate[1] : "";
      const fileLabel = displayRow === 7 ? coordinate[0] : "";
      const classes = [
        "chess-square",
        isLight ? "chess-square-light" : "chess-square-dark",
        isSelected ? "is-selected" : "",
        isDragSource ? "is-drag-source" : "",
        legalMove ? (piece ? "is-capture" : "is-legal") : "",
        isLastMove ? "is-last-move" : "",
      ]
        .filter(Boolean)
        .join(" ");

      squares.push(`
        <button class="${classes}" type="button" data-chess-row="${displayRow}" data-chess-col="${displayCol}" data-coordinate="${coordinate}">
          ${piece ? getChessPieceMarkup(piece) : ""}
          ${rankLabel ? `<span class="chess-rank-label">${rankLabel}</span>` : ""}
          ${fileLabel ? `<span class="chess-file-label">${fileLabel}</span>` : ""}
        </button>
      `);
    }
  }

  chessBoard.innerHTML = squares.join("");
}

function renderChessGame() {
  const state = getCurrentChessState();
  if (!state) {
    return;
  }

  renderChessBoard();
  renderChessHistory();
  renderChessMaterial(getChessMaterialBalance(state.board));
  renderChessPromotionPicker();
  syncChessLayoutMetrics();

  if (chessStatus) {
    chessStatus.textContent = getChessGameStatus(state);
  }

  if (chessTurn) {
    chessTurn.textContent =
      chessTimelineIndex < chessTimeline.length - 1
        ? `Review ${chessTimelineIndex}/${Math.max(chessTimeline.length - 1, 0)}`
        : chessResultMessage?.includes("checkmate")
          ? "Checkmate"
          : chessResultMessage?.includes("stalemate")
            ? "Stalemate"
            : chessResultMessage
              ? "Game over"
              : "Live";
  }

  const canChangeSide = chessTimeline.length <= 1;
  if (chessSwitchSideButton) {
    chessSwitchSideButton.disabled = !canChangeSide || chessEngineThinking;
  }

  if (chessAbortButton) {
    const chessAbortLocked = !chessRematchReady && chessTimeline.length - 1 >= 4;
    chessAbortButton.textContent = chessRematchReady ? "Rematch" : "Abort game";
    chessAbortButton.disabled = chessEngineThinking || chessAbortLocked;
  }

  if (chessBoardSizeToggle) {
    chessBoardSizeToggle.hidden = chessTimeline.length - 1 >= 4;
  }

  if (chessFirstButton) {
    chessFirstButton.disabled = chessTimelineIndex === 0;
  }

  if (chessPrevButton) {
    chessPrevButton.disabled = chessTimelineIndex === 0;
  }

  if (chessNextButton) {
    chessNextButton.disabled = chessTimelineIndex >= chessTimeline.length - 1;
  }

  if (chessLastButton) {
    chessLastButton.disabled = chessTimelineIndex >= chessTimeline.length - 1;
  }

  if (chessDrawButton) {
    chessDrawButton.disabled = Boolean(chessResultMessage) || chessTimelineIndex < chessTimeline.length - 1;
  }

  if (chessResignButton) {
    chessResignButton.disabled = Boolean(chessResultMessage) || chessTimelineIndex < chessTimeline.length - 1;
  }
}

function handleChessSquareSelection(row, col) {
  const boardSquare = getChessDisplayToBoardSquare(row, col);
  const state = getCurrentChessState();
  if (
    !state ||
    chessResultMessage ||
    chessTimelineIndex !== chessTimeline.length - 1 ||
    chessEngineThinking ||
    chessPendingPromotion ||
    state.turn !== chessPlayerColor
  ) {
    return;
  }

  const piece = state.board[boardSquare.row][boardSquare.col];
  const legalMoves = chessSelectedSquare
    ? getChessLegalMovesForPiece(state, chessSelectedSquare.row, chessSelectedSquare.col)
    : [];
  const chosenMove = legalMoves.find((move) => move.toRow === boardSquare.row && move.toCol === boardSquare.col);

  if (chosenMove) {
    if (attemptChessMove(chosenMove)) {
      playUiSound("drop");
    }
    return;
  }

  if (
    chessSelectedSquare &&
    chessSelectedSquare.row === boardSquare.row &&
    chessSelectedSquare.col === boardSquare.col
  ) {
    chessSelectedSquare = null;
    renderChessGame();
    return;
  }

  if (piece && getChessPieceColor(piece) === state.turn) {
    chessSelectedSquare = { row: boardSquare.row, col: boardSquare.col };
    renderChessGame();
    playUiSound("click");
    return;
  }

  chessSelectedSquare = null;
  renderChessGame();
}

function isChessPlayerInteractionLocked() {
  const state = getCurrentChessState();
  return (
    !state ||
    chessResultMessage ||
    chessTimelineIndex !== chessTimeline.length - 1 ||
    chessEngineThinking ||
    Boolean(chessPendingPromotion) ||
    state.turn !== chessPlayerColor
  );
}

function getChessMoveTargetsForSquare(row, col) {
  const state = getCurrentChessState();
  if (!state) {
    return [];
  }

  return getChessLegalMovesForPiece(state, row, col);
}

function getChessBoardSquareFromElement(squareElement) {
  if (!squareElement) {
    return null;
  }

  return getChessDisplayToBoardSquare(Number(squareElement.dataset.chessRow), Number(squareElement.dataset.chessCol));
}

function getChessSquareElementFromPoint(clientX, clientY) {
  const target = document.elementFromPoint(clientX, clientY);
  return target?.closest?.("[data-chess-row][data-chess-col]") || null;
}

function resetChessPieceDrag(options = {}) {
  const { clearSelection = false } = options;

  if (chessPieceDragGhost) {
    chessPieceDragGhost.hidden = true;
    chessPieceDragGhost.innerHTML = "";
  }

  chessPieceDragState.pointerId = null;
  chessPieceDragState.sourceRow = null;
  chessPieceDragState.sourceCol = null;
  chessPieceDragState.piece = "";
  chessPieceDragState.didDrag = false;
  chessPieceDragState.suppressClick = false;

  if (clearSelection) {
    chessSelectedSquare = null;
  }
}

function positionChessPieceDragGhost(clientX, clientY) {
  if (!chessPieceDragGhost || !chessBoardShell) {
    return;
  }

  const shellRect = chessBoardShell.getBoundingClientRect();
  const squareSize = getChessSquareSizeValue();
  const nextX = clientX - shellRect.left - squareSize / 2;
  const nextY = clientY - shellRect.top - squareSize / 2;
  chessPieceDragGhost.style.transform = `translate(${Math.round(nextX)}px, ${Math.round(nextY)}px)`;
}

if (chessBoard) {
  chessBoard.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || isChessPlayerInteractionLocked()) {
      return;
    }

    const squareElement = event.target.closest("[data-chess-row][data-chess-col]");
    if (!squareElement) {
      return;
    }

    const boardSquare = getChessBoardSquareFromElement(squareElement);
    const state = getCurrentChessState();
    const piece = state?.board?.[boardSquare?.row]?.[boardSquare?.col];
    if (!boardSquare || !piece || getChessPieceColor(piece) !== chessPlayerColor) {
      return;
    }

    const legalMoves = getChessMoveTargetsForSquare(boardSquare.row, boardSquare.col);
    if (!legalMoves.length) {
      return;
    }

    chessPieceDragState.pointerId = event.pointerId;
    chessPieceDragState.startX = event.clientX;
    chessPieceDragState.startY = event.clientY;
    chessPieceDragState.sourceRow = boardSquare.row;
    chessPieceDragState.sourceCol = boardSquare.col;
    chessPieceDragState.piece = piece;
    chessPieceDragState.didDrag = false;
    chessBoard.setPointerCapture(event.pointerId);
  });

  chessBoard.addEventListener("pointermove", (event) => {
    if (chessPieceDragState.pointerId !== event.pointerId) {
      return;
    }

    if (event.buttons === 0) {
      resetChessPieceDrag();
      renderChessGame();
      return;
    }

    const deltaX = event.clientX - chessPieceDragState.startX;
    const deltaY = event.clientY - chessPieceDragState.startY;
    if (!chessPieceDragState.didDrag && Math.hypot(deltaX, deltaY) < 1) {
      return;
    }

    if (!chessPieceDragState.didDrag) {
      chessPieceDragState.didDrag = true;
      chessPieceDragState.suppressClick = true;
      chessSelectedSquare = {
        row: chessPieceDragState.sourceRow,
        col: chessPieceDragState.sourceCol,
      };

      if (chessPieceDragGhost) {
        chessPieceDragGhost.hidden = false;
        chessPieceDragGhost.innerHTML = getChessPieceMarkup(chessPieceDragState.piece);
      }

      renderChessGame();
    }

    positionChessPieceDragGhost(event.clientX, event.clientY);
  });

  const finishChessPieceDrag = (event) => {
    const squareElement =
      getChessSquareElementFromPoint(event.clientX, event.clientY) ||
      event.target.closest?.("[data-chess-row][data-chess-col]") ||
      null;

    if (chessPieceDragState.pointerId === event.pointerId) {
      const didDrag = chessPieceDragState.didDrag;
      const sourceRow = chessPieceDragState.sourceRow;
      const sourceCol = chessPieceDragState.sourceCol;

      if (chessBoard.hasPointerCapture(event.pointerId)) {
        chessBoard.releasePointerCapture(event.pointerId);
      }

      if (!didDrag) {
        resetChessPieceDrag();
        if (squareElement && !isChessPlayerInteractionLocked()) {
          chessPieceDragState.suppressClick = true;
          handleChessSquareSelection(Number(squareElement.dataset.chessRow), Number(squareElement.dataset.chessCol));
        }
        return;
      }

      const state =
        getCurrentChessState();
      const legalMoves =
        state && sourceRow !== null && sourceCol !== null ? getChessMoveTargetsForSquare(sourceRow, sourceCol) : [];
      const dropSquareElement = getChessSquareElementFromPoint(event.clientX, event.clientY);
      const boardSquare = getChessBoardSquareFromElement(dropSquareElement);
      const chosenMove = boardSquare
        ? legalMoves.find((move) => move.toRow === boardSquare.row && move.toCol === boardSquare.col)
        : null;

      resetChessPieceDrag({ clearSelection: !chosenMove });

      if (chosenMove) {
        if (attemptChessMove(chosenMove)) {
          playUiSound("drop");
        }
      } else {
        renderChessGame();
      }
      return;
    }

    if (event.button !== 0 || !squareElement || isChessPlayerInteractionLocked()) {
      return;
    }

    chessPieceDragState.suppressClick = true;
    handleChessSquareSelection(Number(squareElement.dataset.chessRow), Number(squareElement.dataset.chessCol));
  };

  chessBoard.addEventListener("pointerup", finishChessPieceDrag);
  chessBoard.addEventListener("pointercancel", finishChessPieceDrag);

  chessBoard.addEventListener("click", (event) => {
    if (chessPieceDragState.suppressClick) {
      chessPieceDragState.suppressClick = false;
      return;
    }

    const square = event.target.closest("[data-chess-row][data-chess-col]");
    if (!square || isChessPlayerInteractionLocked()) {
      return;
    }

    handleChessSquareSelection(Number(square.dataset.chessRow), Number(square.dataset.chessCol));
  });
}

if (chessPromotionPicker) {
  chessPromotionPicker.addEventListener("click", (event) => {
    const promotionButton = event.target.closest("[data-promotion-piece]");
    if (!promotionButton || !chessPendingPromotion?.moves?.length) {
      return;
    }

    const move = chessPendingPromotion.moves.find(
      (candidate) => candidate.promotion === promotionButton.dataset.promotionPiece,
    );
    if (!move) {
      return;
    }

    chessPendingPromotion = null;
    commitChessMove(move);
    playUiSound("drop");
  });
}

if (chessAbortButton) {
  chessAbortButton.addEventListener("click", () => {
    const state = getCurrentChessState();
    if (!state || chessEngineThinking) {
      return;
    }

    if (chessRematchReady) {
      startChessRematch({ playSound: true });
      return;
    }

    if (chessTimeline.length - 1 >= 4) {
      return;
    }

    clearChessNotice();
    clearChessEngineTurn();
    chessResultMessage = "Game aborted.";
    chessRematchReady = true;
    chessSelectedSquare = null;
    chessPendingPromotion = null;
    renderChessGame();
    playUiSound("submit");
  });
}

if (chessDrawButton) {
  chessDrawButton.addEventListener("click", () => {
    if (chessResultMessage) {
      return;
    }

    setChessNotice("Draw offer sent.");
    playUiSound("menuPick");
  });
}

if (chessResignButton) {
  chessResignButton.addEventListener("click", () => {
    const state = getCurrentChessState();
    if (!state || chessResultMessage) {
      return;
    }

    clearChessNotice();
    clearChessEngineTurn();
    chessResultMessage = `${getChessColorLabel(state.turn === "w" ? "b" : "w")} wins by resignation.`;
    chessRematchReady = true;
    chessSelectedSquare = null;
    chessPendingPromotion = null;
    renderChessGame();
    playUiSound("menuClose");
  });
}

if (chessCopyPgnButton) {
  chessCopyPgnButton.addEventListener("click", async () => {
    const copied = await copyTextToClipboard(formatChessPgn());
    if (copied) {
      setChessNotice("PGN copied to clipboard.");
      playUiSound("menuPick");
      return;
    }

    setChessNotice("Copy failed.");
    playUiSound("close");
  });
}

if (chessFirstButton) {
  chessFirstButton.addEventListener("click", () => {
    jumpToChessTimeline(0, { playSound: true });
  });
}

if (chessPrevButton) {
  chessPrevButton.addEventListener("click", () => {
    jumpToChessTimeline(chessTimelineIndex - 1, { playSound: true });
  });
}

if (chessNextButton) {
  chessNextButton.addEventListener("click", () => {
    jumpToChessTimeline(chessTimelineIndex + 1, { playSound: true });
  });
}

if (chessLastButton) {
  chessLastButton.addEventListener("click", () => {
    jumpToChessTimeline(chessTimeline.length - 1, { playSound: true });
  });
}

if (chessBoardSizeToggle) {
  chessBoardSizeToggle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    chessBoardResizeState.pointerId = event.pointerId;
    chessBoardResizeState.startX = event.clientX;
    chessBoardResizeState.startY = event.clientY;
    chessBoardResizeState.startSize = getChessSquareSizeValue();
    chessBoardResizeState.didMove = false;
    chessBoardSizeToggle.setPointerCapture(event.pointerId);
  });

  chessBoardSizeToggle.addEventListener("pointermove", (event) => {
    if (chessBoardResizeState.pointerId !== event.pointerId) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const deltaX = event.clientX - chessBoardResizeState.startX;
    const deltaY = event.clientY - chessBoardResizeState.startY;
    const dominantDelta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
    if (Math.abs(dominantDelta) > 1.5) {
      chessBoardResizeState.didMove = true;
    }

    setChessBoardSizeFromPixels(chessBoardResizeState.startSize + dominantDelta / 8);
  });

  const finishChessBoardResize = (event) => {
    if (chessBoardResizeState.pointerId !== event.pointerId) {
      return;
    }

    if (chessBoardSizeToggle.hasPointerCapture(event.pointerId)) {
      chessBoardSizeToggle.releasePointerCapture(event.pointerId);
    }

    const didMove = chessBoardResizeState.didMove;
    chessBoardResizeState.pointerId = null;
    chessBoardResizeState.didMove = false;

    if (didMove) {
      chessBoardSizeToggle.dataset.suppressClick = "true";
      playUiSound("drop");
    }
  };

  chessBoardSizeToggle.addEventListener("pointerup", finishChessBoardResize);
  chessBoardSizeToggle.addEventListener("pointercancel", finishChessBoardResize);
}

if (chessSwitchSideButton) {
  chessSwitchSideButton.addEventListener("click", () => {
    toggleChessPlayerColor({ playSound: true });
  });
}

if (chessHistoryList) {
  chessHistoryList.addEventListener("click", (event) => {
    const moveButton = event.target.closest("[data-history-index]");
    if (!moveButton) {
      return;
    }

    jumpToChessTimeline(Number(moveButton.dataset.historyIndex), { playSound: true });
  });

  chessHistoryList.addEventListener("copy", (event) => {
    const moveText = serializeChessHistoryForClipboard();
    if (!moveText || !event.clipboardData) {
      return;
    }

    event.preventDefault();
    event.clipboardData.setData("text/plain", moveText);
  });
}

  function mount() {
    resetChessGame();
    applyChessBoardScale("standard");
    syncChessLayoutMetrics();
  }

  function onOpen() {
    if (isCompactDesktopLayout()) {
      applyCompactChessBoardPreset();
      syncChessLayoutMetrics();
    } else {
      expandChessBoardToWindow();
    }
    requestCustomScrollbarSync?.();
  }

  function onMaximize() {
    expandChessBoardToWindow();
    requestCustomScrollbarSync?.();
  }

  function onRestore() {
    syncChessLayoutMetrics();
    requestCustomScrollbarSync?.();
  }

  function onResize() {
    if (windowElement.classList.contains("is-maximized")) {
      expandChessBoardToWindow();
    } else if (isCompactDesktopLayout()) {
      applyCompactChessBoardPreset();
      syncChessLayoutMetrics();
    } else {
      syncChessLayoutMetrics();
    }
    requestCustomScrollbarSync?.();
  }

  return {
    mount,
    onOpen,
    onMaximize,
    onRestore,
    onResize,
  };
}
