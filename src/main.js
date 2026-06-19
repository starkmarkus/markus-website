const clock = document.querySelector("#clock");
const desktopStage = document.querySelector(".desktop-stage");
const menubar = document.querySelector(".menubar");
const openButtons = [...document.querySelectorAll("[data-open]")];
const easterTriggerButtons = [...document.querySelectorAll("[data-easter-trigger]")];
const menuTriggers = [...document.querySelectorAll("[data-menu-trigger]")];
const menuDropdowns = [...document.querySelectorAll("[data-menu]")];
const menuLinkButtons = [...document.querySelectorAll("[data-link]")];
const closeButtons = [...document.querySelectorAll("[data-close]")];
const maximizeButtons = [...document.querySelectorAll("[data-toggle-maximize]")];
const windows = [...document.querySelectorAll(".window")];
const windowBodies = windows
  .map((windowElement) => windowElement.querySelector(".window-body"))
  .filter(Boolean);
const contactForm = document.querySelector("#contact-form");
const contactStatus = document.querySelector("#contact-status");
const contactSubmitButton = contactForm?.querySelector('button[type="submit"]') || null;
const contactFormFields = contactForm ? [...contactForm.querySelectorAll("input, textarea, button")] : [];
const contactMessageField = contactForm?.querySelector('textarea[name="message"]') || null;
const contactMessageDefaultPlaceholder = contactMessageField?.getAttribute("placeholder") || "What's on your mind?";
const contactSubmitDefaultLabel = contactSubmitButton?.textContent?.trim() || "Send Message";
const contactLinkedinLink = document.querySelector("#contact-linkedin");
const cvRequestDetailsButton = document.querySelector("#cv-request-details");
const currentAppLabel = document.querySelector("#current-app-label");
const easterOverlay = document.querySelector("#easter-overlay");
const easterOverlayLabel = document.querySelector("#easter-overlay-label");
const easterOverlayMessage = document.querySelector("#easter-overlay-message");
const aboutHomeStage = document.querySelector("#about-home-stage");
const aboutHomeHeading = document.querySelector("#about-home-heading");
const aboutHomeSubtext = document.querySelector("#about-home-subtext");
const aboutHomeFocusTyping = document.querySelector("#about-home-focus-typing");
const aboutHomeFocusLine = document.querySelector("#about-home-focus-line");
const aboutHomeNote = document.querySelector("#about-home-note");
const aboutWordEnergy = document.querySelector("#about-word-energy");
const aboutWordSustainability = document.querySelector("#about-word-sustainability");
const aboutWordData = document.querySelector("#about-word-data");
const aboutHomeRule = document.querySelector("#about-home-rule");
const aboutHomeActions = document.querySelector("#about-home-actions");
const projectsBrowserList = document.querySelector("#projects-browser-list");
const projectsBrowserPath = document.querySelector("#projects-browser-path");
const projectsBrowserBack = document.querySelector("#projects-browser-back");
const desktopIconsContainer = document.querySelector(".desktop-icons");
const desktopTrash = document.querySelector("#desktop-trash");
const projectsDesktopIcon = document.querySelector('.desktop-icon[data-open="projects-window"]');
const projectsDesktopIconImage = projectsDesktopIcon?.querySelector(".icon");
const formFields = document.querySelectorAll("input, textarea");
const desktopDragLayer = desktopStage ? document.createElement("div") : null;
const desktopSelectionBox = desktopStage ? document.createElement("div") : null;
const projectsSelectionBox = projectsBrowserList ? document.createElement("div") : null;

if (desktopDragLayer) {
  desktopDragLayer.className = "desktop-drag-layer";
  desktopStage.append(desktopDragLayer);
}

if (desktopSelectionBox) {
  desktopSelectionBox.className = "desktop-selection-box";
  desktopSelectionBox.hidden = true;
  desktopStage.append(desktopSelectionBox);
}

if (projectsSelectionBox) {
  projectsSelectionBox.className = "projects-selection-box";
  projectsSelectionBox.hidden = true;
}

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const LINKEDIN_URL = "https://www.linkedin.com/in/mastark/";
const GITHUB_PROFILE_URL = "https://github.com/starkmarkus";
const MINUTO_REPO_URL = "https://github.com/starkmarkus/minuto";
const CONTACT_API_ENDPOINT = "/api/contact";
const PROJECTS_FOLDER_ICON = "/assets/icns/portfolio-folder.svg";
const PROJECTS_FOLDER_OPEN_ICON = "/assets/icns/portfolio-folder-open.svg";
const GENERIC_PROJECT_ICON = "/assets/icns/project-sheet.svg";
const CHESS_STAGE_ICON = "/assets/icns/chess-piece.svg";
const CHESS_DESKTOP_ICON = "/assets/icns/chess-piece-desktop.svg";
const WINDOW_CLOSE_FADE_MS = 110;
const TRASH_RESPAWN_DELAY_MS = 3000;
const TRASH_DUPLICATION_LIMIT = 30;
const TRASH_EJECT_ANIMATION_MS = 560;
const TRASH_EXPLOSION_ANIMATION_MS = 640;
const DESKTOP_DUPLICATE_OFFSET = { x: 42, y: 24 };
const DESKTOP_TRASH_SPAWN_OFFSETS = [
  { x: 42, y: 24 },
  { x: 78, y: 12 },
  { x: 24, y: 56 },
  { x: 94, y: 38 },
  { x: 58, y: 72 },
];
const DESKTOP_ITEM_DIMENSIONS = {
  folder: { width: 90, height: 96 },
  document: { width: 82, height: 84 },
  chess: { width: 68, height: 72 },
};
const CUSTOM_SCROLLBAR_THUMB_INSET = 2;
const MIN_WINDOW_WIDTH = 320;
const MIN_WINDOW_HEIGHT = 220;
const RESIZE_DIRECTIONS = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];

let audioContext = null;
let audioUnlocked = false;
let unlockPromise = null;
let masterGainNode = null;
let noiseBuffer = null;
let easterOverlayTimer = null;
let projectsFolderTimer = null;
let projectsWindowOpenTimer = null;
let projectsStageTransitionTimer = null;
let scrollbarSyncFrame = null;
let trashOpenAnimationTimer = null;
let trashSpitAnimationTimer = null;
let trashExplosionAnimationTimer = null;
let trashHideTimer = null;
let trashOverflowSequenceTimer = null;
let trashIsDisabled = false;
let aboutIntroTimers = [];
let nextDynamicDesktopItemId = 1;
let nextDesktopCloneBaseId = 1;
let nextProjectDetailWindowId = 1;
let desktopDragLayerDepth = 0;
let customScrollbarObserver = null;
let chessModulePromise = null;
let chessController = null;
let chessStageIcon = CHESS_STAGE_ICON;
let chessDesktopIcon = CHESS_DESKTOP_ICON;

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const windowMap = new Map(windows.map((windowElement) => [windowElement.dataset.window, windowElement]));
const projectDetailTemplateWindow = windowMap.get("project-detail-window");
const customScrollbarMap = new Map();
const desktopItemBases = new Map();
const dynamicDesktopItems = new Map();
const maximizedWindowBounds = new WeakMap();
const closingWindowTimers = new WeakMap();
const appState = {
  focusedWindow: null,
  highestZIndex: 10,
  openMenu: null,
  activeEasterOverlay: null,
  activeProjectCategory: null,
  activeProjectId: null,
  projectsBrowserAllowBack: false,
  aboutIntroPlayed: false,
  aboutIntroRunning: false,
  selectedDesktopItemIds: new Set(),
  selectedProjectStageItemIds: new Set(),
  selectedProjectStageViewKey: null,
  projectStagePositions: {},
  projectStageRemovedItems: {},
  projectStageInjectedItems: {},
};

function getAllWindows() {
  return [...document.querySelectorAll(".window")];
}

function getWindowElement(windowId) {
  return windowMap.get(windowId) || document.querySelector(`.window[data-window="${windowId}"]`);
}

function ensureWindowReady(windowElement) {
  if (!windowElement) {
    return;
  }

  initializeWindowElement(windowElement);
  bindWindowChromeButtons(windowElement);

  if (isProjectDetailWindow(windowElement)) {
    bindProjectDetailWindowActions(windowElement);
  }
}

function hydrateDeferredWindowAssets(windowElement) {
  if (!windowElement) {
    return;
  }

  windowElement.querySelectorAll("img[data-deferred-src]").forEach((image) => {
    if (!image.getAttribute("src")) {
      image.setAttribute("src", image.dataset.deferredSrc || "");
    }
  });
}

function syncChessAssetIcons() {
  projectCategories.forEach((category) => {
    if (category.id === "chess") {
      category.projects.forEach((project) => {
        const mappedProject = projectMap.get(project.id);
        if (mappedProject) {
          mappedProject.icon = chessStageIcon;
        }
      });
    }
  });

  desktopItemBases.forEach((base) => {
    if (base.action?.type === "chess-window") {
      base.icon = chessStageIcon;
    }
  });

  document.querySelectorAll('[data-stage-window="chess-window"] .project-stage-icon').forEach((image) => {
    image.src = chessStageIcon;
  });

  document.querySelectorAll('.desktop-icon[data-desktop-kind="chess"] .icon').forEach((image) => {
    image.src = chessDesktopIcon;
  });
}

async function ensureChessWindowLoaded() {
  if (chessController) {
    return chessController;
  }

  if (!chessModulePromise) {
    chessModulePromise = import("./chess.js");
  }

  const chessModule = await chessModulePromise;
  const existingWindow = getWindowElement("chess-window");
  let chessWindow = existingWindow;

  if (!chessWindow) {
    const template = document.createElement("template");
    template.innerHTML = chessModule.CHESS_WINDOW_MARKUP.trim();
    chessWindow = template.content.firstElementChild;

    const contactWindow = getWindowElement("contact-window");
    if (contactWindow) {
      contactWindow.before(chessWindow);
    } else {
      desktopStage?.append(chessWindow);
    }

    initializeWindowElement(chessWindow);
    bindWindowChromeButtons(chessWindow);

    if (customScrollbarObserver) {
      customScrollbarObserver.observe(chessWindow);
      const body = chessWindow.querySelector(".window-body");
      if (body) {
        customScrollbarObserver.observe(body);
      }
    }
  }

  chessStageIcon = chessModule.CHESS_STAGE_ICON;
  chessDesktopIcon = chessModule.CHESS_DESKTOP_ICON;
  syncChessAssetIcons();

  chessController = chessModule.createChessController({
    windowElement: chessWindow,
    playUiSound,
    requestCustomScrollbarSync,
    showSystemOverlay,
  });
  chessController.mount();

  return chessController;
}

function getProjectDetailWindowRefs(windowElement) {
  if (!windowElement) {
    return null;
  }

  return {
    windowTitle: windowElement.querySelector('[data-project-detail-ref="window-title"]'),
    category: windowElement.querySelector('[data-project-detail-ref="category"]'),
    icon: windowElement.querySelector('[data-project-detail-ref="icon"]'),
    title: windowElement.querySelector('[data-project-detail-ref="title"]'),
    status: windowElement.querySelector('[data-project-detail-ref="status"]'),
    type: windowElement.querySelector('[data-project-detail-ref="type"]'),
    duration: windowElement.querySelector('[data-project-detail-ref="duration"]'),
    gradeRow: windowElement.querySelector('[data-project-detail-ref="grade-row"]'),
    grade: windowElement.querySelector('[data-project-detail-ref="grade"]'),
    summary: windowElement.querySelector('[data-project-detail-ref="summary"]'),
    more: windowElement.querySelector('[data-project-detail-ref="more"]'),
    expand: windowElement.querySelector('[data-project-detail-ref="expand"]'),
    request: windowElement.querySelector('[data-project-detail-ref="request"]'),
    secondaryActions: windowElement.querySelector('[data-project-detail-ref="secondary-actions"]'),
    github: windowElement.querySelector('[data-project-detail-ref="github"]'),
  };
}

function isProjectDetailWindow(windowElement) {
  return (windowElement?.dataset.windowType || windowElement?.dataset.window) === "project-detail-window";
}

function getProjectDetailWindows(projectId = null) {
  return getAllWindows().filter((windowElement) => {
    if (!isProjectDetailWindow(windowElement)) {
      return false;
    }

    if (windowElement.dataset.projectDetailTemplate === "true") {
      return false;
    }

    if (!projectId) {
      return true;
    }

    return windowElement.dataset.projectId === projectId;
  });
}

const projectCategories = [
  {
    id: "applied-ai",
    label: "Applied AI",
    summary: "Tools, workflows, and interfaces shaped around applied machine intelligence.",
    projects: [
      {
        id: "satellite",
        label: "Satellite data",
        detailCategory: "APPLIED AI",
        title: "Satellite data",
        requestTitle: "Satellite data",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about your bachelor's thesis on satellite data?\n\nBest,\n",
        detailTitle: "Advancing economic statistics: A suitability test of satellite data",
        windowTitle: "Satellite Data",
        status: "Completed",
        type: "Bachelor thesis",
        duration: "4 months",
        grade: "6.0 / 6.0 (best possible grade)",
        summary:
          "Exploring satellite data as a proxy for economic activity.\nTesting whether remote sensing can provide earlier signals than traditional data.\nDeveloped in cooperation with the German Federal Statistical Office (Destatis).",
        details:
          "Evaluated multiple satellite-derived indicators and their correlation with economic metrics.\n\nApplied linear, polynomial, and support vector regressions to ten satellite-derived economic indicators to test their predictive capabilities for official economic statistics.",
      },
      {
        id: "migration",
        label: "Migration Forecasting",
        detailCategory: "APPLIED AI",
        title: "Migration Forecasting",
        requestTitle: "Migration forecasting",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about your master's thesis on migration forecasting?\n\nBest,\n",
        detailTitle: "Bridging reporting delays: Forecasting migration flows in real time",
        windowTitle: "Migration Forecasting",
        status: "Ongoing",
        type: "Master thesis",
        duration: "6 months",
        grade: "Pending",
        summary:
          "Building models to estimate immigration and emigration flows in near real-time for Germany.\nAddressing delays in official data through statistical correction.\nImproving early insights for decision making.\nDeveloped in cooperation with the German Federal Statistical Office (Destatis).",
        details:
          "Developing nowcasting models to estimate migration flows before official release.\n\nCorrecting for reporting delays using time series methods (ARIMA, ARIMAX) and Bayesian forecasting models (Kalman filters).\n\nOngoing research.",
      },
      {
        id: "news-app",
        label: "Minuto",
        detailCategory: "APPLIED AI",
        title: "Minuto",
        requestTitle: "Minuto",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about Minuto?\n\nBest,\n",
        status: "Completed",
        type: "Personal project",
        duration: "3 months",
        githubUrl: MINUTO_REPO_URL,
        summary:
          "A personal news app built from a simple problem: too much noise in daily news consumption.\nTransforms daily news into short visual stories with optional audio.\nA full working app installed on my iPhone and used every day.\nConsidering making the app available on the App Store for free soon.",
        details:
          "Built a full working app including story based navigation, personalized topic selection, and audio playback.\nIntegrated multiple APIs for news sourcing, enrichment, and speech generation.\n\nExplored early concepts for GroundNews-inspired perspective comparison and story clustering.",
      },
      {
        id: "website",
        label: "Website",
        title: "Website",
        systemOverlayKind: "website",
        icon: "/assets/icns/project-website.svg",
      },
    ],
  },
  {
    id: "energy",
    label: "Energy & Sustainability",
    summary: "Energy products and systems with a bias toward precision and usability.",
    projects: [
      {
        id: "rwe-project",
        label: "Energy Flexibility",
        detailCategory: "ENERGY",
        title: "Energy Flexibility",
        requestTitle: "Energy flexibility",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about your energy flexibility work at RWE?\n\nBest,\n",
        detailTitle: "Re-imagining RWE's strategic positioning in the energy flexibility market",
        windowTitle: "Energy Flexibility",
        status: "Completed",
        type: "Project study",
        duration: "3 months",
        grade: "1.0 / 1.0 (best possible grade)",
        requestDetails: true,
        summary:
          "Strategic work on energy flexibility at RWE.\nStarted as an academic module and evolved into a broader strategy project.\nAssessing energy flexibility options for RWE's transition toward a more volatile power system shaped by wind and solar generation.",
        details:
          "Conducted ten expert interviews, multiple sparring sessions with RWE Strategy, a workshop, and a final presentation to the Chief Sustainability and Strategy Officer.\n\nEvaluated battery energy storage systems, demand side response, and vehicle-to-grid systems through a structured framework to derive concrete strategic options for RWE through 2030.",
      },
      {
        id: "myclever",
        label: "Fungal Materials",
        detailCategory: "SUSTAINABILITY",
        title: "Fungal Materials",
        requestTitle: "Fungal materials",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about your work on fungal materials at Mycolever?\n\nBest,\n",
        detailTitle: "Go-to-market strategy at Mycolever",
        status: "Completed",
        type: "Full-time internship",
        duration: "3 months",
        requestDetails: true,
        summary:
          "Worked closely with a biotech startup focused on sustainable materials.\nContributed across strategy, operations, and go-to-market.\nBuilt for execution in a fast moving environment.",
        details:
          "Worked on market entry strategy, including country prioritization and initial sales setup.\nSupported investor communication and internal structuring such as OKRs and hiring processes.\n\nExposure to early stage execution across multiple functions.",
      },
      {
        id: "food-labs",
        label: "Venture Building",
        detailCategory: "SUSTAINABILITY",
        title: "Venture Building",
        requestTitle: "Founder Associate program at FoodLabs",
        requestMessage: "Hi Markus,\n\nCould you please send me more details about your Founder Associate Program at FoodLabs?\n\nBest,\n",
        detailTitle: "Founder Associate program at FoodLabs",
        status: "Ongoing",
        type: "Part-time internship",
        duration: "12 months",
        requestDetails: true,
        summary:
          "FoodLabs is an early stage investor and venture platform focused on food, climate, and AI.\nSupporting founders on product, operations, and growth.\nHands on exposure to how companies are built from day one.",
        details:
          "Worked directly with founders on high impact problems across product and operations.\n\nIncludes mentorship, masterclasses, and access to the founder network.",
      },
    ],
  },
  {
    id: "chess",
    label: "Chess",
    summary: "A smaller set of strategic side projects around learning, analysis, and play.",
    projects: [
      {
        id: "opening-lab",
        title: "Opening Lab",
        summary:
          "A chess study tool focused on openings without overwhelming the learner.\nLines, branches, and key ideas were organized into a clearer rhythm.\nThe experience emphasized pattern memory over brute-force storage.\nBuilt to make preparation feel more tactile and less abstract.",
        details:
          "Expanded details:\nThe concept explored how guidance, notation, and repetition can feel lighter inside a focused training interface.",
      },
      {
        id: "game-review",
        title: "Game Review",
        summary:
          "A review flow for understanding games after they finish.\nThe interface separated critical moments from everything less important.\nIt was designed to support reflection rather than raw engine overload.\nUseful for players who want insight, not just evaluation numbers.",
        details:
          "Expanded details:\nKey moments, mistakes, and turning points were treated like readable story beats inside the analysis flow.",
      },
      {
        id: "puzzle-trainer",
        title: "Puzzle Trainer",
        summary:
          "A compact trainer built around repetition, timing, and recognition.\nThe interaction stayed quick and focused to support habit building.\nVisual noise was reduced so the moves themselves stayed central.\nMade for short sessions that still feel meaningful.",
        details:
          "Expanded details:\nThe product idea centered on cadence, progression, and keeping challenge visible without becoming gamified clutter.",
      },
    ],
  },
];

const projectCategoryMap = new Map(projectCategories.map((category) => [category.id, category]));
const projectMap = new Map(
  projectCategories.flatMap((category) =>
    category.projects.map((project) => [
      project.id,
      {
        ...project,
        categoryId: category.id,
        categoryLabel: category.label,
      },
    ]),
  ),
);

const PROJECT_STAGE_DOCUMENT_ICON = GENERIC_PROJECT_ICON;
const PROJECT_STAGE_PROJECT_ICONS = {
  satellite: "/assets/icns/project-satellite.svg",
  migration: "/assets/icns/project-migration.svg",
  "news-app": "/assets/icns/project-news-app.svg",
  website: "/assets/icns/project-website.svg",
  "rwe-project": "/assets/icns/project-rwe.svg",
  myclever: "/assets/icns/project-myclever.svg",
  "food-labs": "/assets/icns/project-food-labs.svg",
};
const PROJECT_STAGE_FOLDER_ICONS = {
  "applied-ai": {
    closed: "/assets/icns/applied-ai-folder.svg",
    open: "/assets/icns/applied-ai-folder-open.svg",
  },
  energy: {
    closed: "/assets/icns/energy-folder.svg",
    open: "/assets/icns/energy-folder-open.svg",
  },
};
const PROJECT_STAGE_LAYOUTS = {
  root: [
    { id: "energy", kind: "folder", x: 20, y: 24, width: 132 },
    { id: "applied-ai", kind: "folder", x: 184, y: 24, width: 132 },
    { id: "chess", kind: "chess", x: 538, y: 206, width: 74 },
  ],
  "applied-ai": [
    { id: "satellite", kind: "document", x: 20, y: 24, width: 132 },
    { id: "migration", kind: "document", x: 172, y: 24, width: 132 },
    { id: "news-app", kind: "document", x: 324, y: 24, width: 132 },
    { id: "website", kind: "document", x: 476, y: 24, width: 132 },
  ],
  energy: [
    { id: "rwe-project", kind: "document", x: 20, y: 24, width: 132 },
    { id: "myclever", kind: "document", x: 172, y: 24, width: 132 },
    { id: "food-labs", kind: "document", x: 324, y: 24, width: 132 },
  ],
  chess: [
    { id: "opening-lab", kind: "document", x: 70, y: 52, width: 98 },
    { id: "game-review", kind: "document", x: 292, y: 154, width: 104 },
    { id: "puzzle-trainer", kind: "document", x: 492, y: 76, width: 102 },
  ],
};
const PROJECT_STAGE_ITEM_HEIGHTS = {
  folder: 122,
  chess: 84,
  document: 96,
};
const PROJECT_STAGE_MIN_HEIGHTS = {
  root: 338,
  "applied-ai": 320,
  energy: 344,
  chess: 334,
};
const DESKTOP_EDGE_INSET = 18;
const COMPACT_DESKTOP_BREAKPOINT = 760;

function getDesktopItemMetrics(kind) {
  return DESKTOP_ITEM_DIMENSIONS[kind] || DESKTOP_ITEM_DIMENSIONS.folder;
}

function clampDesktopItemPosition(x, y, kind) {
  const metrics = getDesktopItemMetrics(kind);
  return {
    x: clamp(x, DESKTOP_EDGE_INSET, Math.max(desktopStage.clientWidth - metrics.width - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET)),
    y: clamp(y, DESKTOP_EDGE_INSET, Math.max(desktopStage.clientHeight - metrics.height - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET)),
  };
}

function getDesktopDuplicatePosition(position, kind) {
  return clampDesktopItemPosition(position.x + DESKTOP_DUPLICATE_OFFSET.x, position.y + DESKTOP_DUPLICATE_OFFSET.y, kind);
}

function getDesktopTrashSpawnPosition(position, kind) {
  const offset = DESKTOP_TRASH_SPAWN_OFFSETS[(nextDesktopCloneBaseId - 1) % DESKTOP_TRASH_SPAWN_OFFSETS.length];
  return clampDesktopItemPosition(position.x + offset.x, position.y + offset.y, kind);
}

function getDesktopItemElementById(itemId) {
  return desktopIconsContainer?.querySelector(`[data-desktop-item-id="${itemId}"]`) || null;
}

function getSelectableDesktopIcons() {
  return [...(desktopIconsContainer?.querySelectorAll(".desktop-icon") || [])].filter((button) => !button.hidden);
}

function ensureProjectsSelectionBox() {
  if (!projectsBrowserList || !projectsSelectionBox) {
    return;
  }

  if (projectsSelectionBox.parentElement !== projectsBrowserList) {
    projectsBrowserList.append(projectsSelectionBox);
  }
}

function getSelectableProjectStageItems(stageElement = projectsBrowserList) {
  return [...(stageElement?.querySelectorAll("[data-project-stage-item]") || [])].filter((button) => !button.hidden);
}

function getTotalDesktopIconCount() {
  return desktopIconsContainer?.querySelectorAll(".desktop-icon").length || 0;
}

function wouldTrashExceedDuplicationLimit(additionalIcons = 1) {
  if (trashIsDisabled) {
    return true;
  }

  return getTotalDesktopIconCount() + additionalIcons > TRASH_DUPLICATION_LIMIT;
}

function syncDesktopSelection() {
  getSelectableDesktopIcons().forEach((button) => {
    button.classList.toggle("is-selected", appState.selectedDesktopItemIds.has(button.dataset.desktopItemId));
  });
}

function clearDesktopSelection() {
  appState.selectedDesktopItemIds.clear();
  syncDesktopSelection();
}

function syncProjectStageSelection() {
  const currentViewKey = projectsBrowserList?.dataset.view || null;
  const selectionViewKey = appState.selectedProjectStageViewKey;

  getSelectableProjectStageItems().forEach((button) => {
    button.classList.toggle(
      "is-selected",
      selectionViewKey === currentViewKey && appState.selectedProjectStageItemIds.has(button.dataset.stageItemId || ""),
    );
  });
}

function clearProjectStageSelection() {
  appState.selectedProjectStageItemIds.clear();
  appState.selectedProjectStageViewKey = null;
  syncProjectStageSelection();
}

function normalizeIconLabel(value, fallback = "") {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.replace(/\S+/g, (token) => {
    if (!/[A-Za-z]/.test(token)) {
      return token;
    }

    return token
      .split("-")
      .map((segment) => {
        if (!/[A-Za-z]/.test(segment)) {
          return segment;
        }

        if (/^[A-Z]{2,4}$/.test(segment)) {
          return segment;
        }

        return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
      })
      .join("-");
  });
}

function updateDesktopBaseLabel(baseId, nextLabel) {
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return;
  }

  base.label = nextLabel;

  dynamicDesktopItems.forEach((record) => {
    if (record.baseId === baseId) {
      record.label = nextLabel;
    }
  });

  (desktopIconsContainer?.querySelectorAll(".desktop-icon") || []).forEach((button) => {
    if (button.dataset.desktopBaseId !== baseId) {
      return;
    }

    button.dataset.desktopLabel = nextLabel;
    const label = button.querySelector("[data-rename-label]");
    if (label) {
      setRenameLabelText(label, nextLabel);
    }
  });
}

function syncProjectsBrowserLabels() {
  const projectsWindow = windowMap.get("projects-window");
  if (!projectsWindow || projectsWindow.hidden) {
    return;
  }

  renderProjectsBrowser(appState.activeProjectCategory, {
    allowBack: appState.projectsBrowserAllowBack,
  });
}

function renameProjectCategory(categoryId, nextLabel) {
  const category = projectCategoryMap.get(categoryId);
  if (!category) {
    return;
  }

  category.label = nextLabel;
  category.projects.forEach((project) => {
    const mappedProject = projectMap.get(project.id);
    if (mappedProject) {
      mappedProject.categoryLabel = nextLabel;
    }
  });

  desktopItemBases.forEach((base) => {
    if (base.action?.type === "projects-window" && base.action.categoryId === categoryId) {
      updateDesktopBaseLabel(base.baseId, nextLabel);
    }

    if (categoryId === "chess" && base.action?.type === "chess-window") {
      updateDesktopBaseLabel(base.baseId, nextLabel);
    }
  });

  getProjectDetailWindows().forEach((windowElement) => {
    const projectId = windowElement.dataset.projectId;
    const activeProject = projectMap.get(projectId || "");
    if (activeProject?.categoryId === categoryId && !windowElement.hidden) {
      populateProjectDetail(activeProject.id, windowElement);
    }
  });

  syncProjectsBrowserLabels();
}

function renameProjectItem(projectId, nextLabel) {
  const project = projectMap.get(projectId);
  if (!project) {
    return;
  }

  project.label = nextLabel;

  desktopItemBases.forEach((base) => {
    if (base.action?.type === "project-detail" && base.action.projectId === projectId) {
      updateDesktopBaseLabel(base.baseId, nextLabel);
    }
  });

  syncProjectsBrowserLabels();
}

function renameDesktopTrash(nextLabel) {
  if (!desktopTrash) {
    return;
  }

  const normalizedLabel = normalizeIconLabel(nextLabel, "Bin");
  const labelElement = desktopTrash.querySelector(".desktop-trash-label");
  if (labelElement) {
    labelElement.textContent = normalizedLabel;
  }
  desktopTrash.setAttribute("aria-label", normalizedLabel);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getDesktopIconLabelLines(label, availableWidth = 0) {
  const normalizedLabel = String(label || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalizedLabel) {
    return [""];
  }

  return getProjectStageLabelLines(normalizedLabel, availableWidth);
}

function getDesktopIconLabelMarkup(label, availableWidth) {
  const lines = getDesktopIconLabelLines(label, availableWidth);
  return lines.map((line) => `<span class="desktop-icon-label-line">${escapeHtml(line)}</span>`).join("");
}

function getProjectStageLabelLines(label, availableWidth = 0) {
  const normalizedLabel = String(label || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalizedLabel) {
    return [""];
  }

  const words = normalizedLabel.split(" ");
  if (words.length === 1) {
    return [normalizedLabel];
  }

  if (words.length === 2) {
    return words;
  }

  if (words.length === 3 && words[1] === "&") {
    return [`${words[0]} ${words[1]}`, words[2]];
  }

  const maxCharsPerLine = Math.max(10, Math.floor((Math.max(availableWidth, 84) - 10) / 6.8));
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function getProjectStageLabelMarkup(label, availableWidth) {
  const lines = getProjectStageLabelLines(label, availableWidth);
  return lines.map((line) => `<span class="project-stage-label-line">${escapeHtml(line)}</span>`).join("");
}

function setRenameLabelText(labelElement, nextLabel) {
  if (!labelElement) {
    return;
  }

  labelElement.dataset.iconLabel = nextLabel;

  const stageItem = labelElement.closest(".project-stage-item");
  if (stageItem) {
    const stageWidth = parseFloat(stageItem.style.width || "") || stageItem.offsetWidth || 120;
    labelElement.innerHTML = getProjectStageLabelMarkup(nextLabel, stageWidth);
    return;
  }

  if (labelElement.closest(".desktop-icon")) {
    const desktopIcon = labelElement.closest(".desktop-icon");
    const desktopWidth = parseFloat(desktopIcon?.style.width || "") || desktopIcon?.offsetWidth || 90;
    labelElement.innerHTML = getDesktopIconLabelMarkup(nextLabel, desktopWidth);
    return;
  }

  labelElement.textContent = nextLabel;
}

function isDesktopItemSelectableForMarquee(button) {
  const rect = button.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const samplePoints = [
    [rect.left + rect.width / 2, rect.top + rect.height / 2],
    [rect.left + 8, rect.top + 8],
    [rect.right - 8, rect.top + 8],
    [rect.left + 8, rect.bottom - 8],
    [rect.right - 8, rect.bottom - 8],
  ];

  return samplePoints.some(([x, y]) => {
    const pointX = clamp(x, 0, window.innerWidth - 1);
    const pointY = clamp(y, 0, window.innerHeight - 1);
    const topElement = document.elementFromPoint(pointX, pointY);
    if (!topElement) {
      return false;
    }

    if (topElement.closest(".window")) {
      return false;
    }

    return true;
  });
}

function doRectsIntersect(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

function setDesktopTrashTargetState(isTarget) {
  if (!desktopTrash) {
    return;
  }

  desktopTrash.classList.toggle("is-target", !trashIsDisabled && !desktopTrash.hidden && Boolean(isTarget));
}

function isPointerOverTrash(clientX, clientY) {
  if (!desktopTrash || desktopTrash.hidden || trashIsDisabled) {
    return false;
  }

  const trashRect = desktopTrash.getBoundingClientRect();
  return clientX >= trashRect.left && clientX <= trashRect.right && clientY >= trashRect.top && clientY <= trashRect.bottom;
}

function getProjectsDesktopDropTarget(clientX, clientY, draggingButton = null) {
  return null;
}

function isPointInsideRect(clientX, clientY, rect) {
  return Boolean(rect && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom);
}

function getProjectsWindowDropZones() {
  const projectsWindow = windowMap.get("projects-window");
  const projectsWindowTitlebar = projectsWindow?.querySelector(".titlebar");
  const stageRect = projectsBrowserList?.getBoundingClientRect();

  if (!projectsWindow || projectsWindow.hidden || !projectsWindowTitlebar || !stageRect) {
    return null;
  }

  return {
    titlebarRect: projectsWindowTitlebar.getBoundingClientRect(),
    stageRect,
  };
}

function getProjectsWindowDropTarget(clientX, clientY, baseId) {
  const base = desktopItemBases.get(baseId);
  const targetViewKey = getProjectStageViewKey(appState.activeProjectCategory);
  const zones = getProjectsWindowDropZones();

  if (!zones || !canInsertBaseIntoProjectView(base, targetViewKey)) {
    return null;
  }

  if (isPointInsideRect(clientX, clientY, zones.stageRect)) {
    return { viewKey: targetViewKey, zone: "stage" };
  }

  if (isPointInsideRect(clientX, clientY, zones.titlebarRect)) {
    return { viewKey: targetViewKey, zone: "titlebar" };
  }

  return null;
}

function isPointerOverProjectsWindowBody(clientX, clientY, baseId) {
  const base = desktopItemBases.get(baseId);
  const targetViewKey = getProjectStageViewKey(appState.activeProjectCategory);
  const zones = getProjectsWindowDropZones();

  if (!zones || !canInsertBaseIntoProjectView(base, targetViewKey)) {
    return false;
  }

  return isPointInsideRect(clientX, clientY, zones.stageRect) || isPointInsideRect(clientX, clientY, zones.titlebarRect);
}

function isPointerOverProjectsWindowBodyRect(clientX, clientY) {
  const zones = getProjectsWindowDropZones();
  if (!zones) {
    return false;
  }

  return isPointInsideRect(clientX, clientY, zones.stageRect) || isPointInsideRect(clientX, clientY, zones.titlebarRect);
}

function isPointOverVisibleWindow(clientX, clientY) {
  return getVisibleWindows().some((windowElement) => {
    const rect = windowElement.getBoundingClientRect();
    return isPointInsideRect(clientX, clientY, rect);
  });
}

function getProjectStageInset() {
  return isCompactDesktopLayout() ? 8 : 16;
}

function getProjectStageOuterInset() {
  return isCompactDesktopLayout() ? getProjectStageInset() : 24;
}

function getCompactProjectStageColumnCount() {
  return 3;
}

function getCompactProjectStageWidth(kind) {
  if (kind === "chess") {
    return 68;
  }

  return 88;
}

function getProjectStageIconWidth(kind) {
  if (kind === "folder") {
    return 60;
  }

  if (kind === "chess") {
    return 34;
  }

  return 46;
}

function getProjectStagePlacementHeight(kind) {
  if (isCompactDesktopLayout()) {
    if (kind === "chess") {
      return 70;
    }
    return 82;
  }

  return PROJECT_STAGE_ITEM_HEIGHTS[kind] || 96;
}

function getProjectStageCollisionGap() {
  return isCompactDesktopLayout() ? 2 : 10;
}

function getProjectStageMaxX(contentWidth, itemWidth, kind) {
  const inset = getProjectStageInset();
  const outerInset = getProjectStageOuterInset();
  if (isCompactDesktopLayout()) {
    const compactIconOffset = Math.max(Math.round((itemWidth - getProjectStageIconWidth(kind)) / 2), 0);
    return Math.max(contentWidth - itemWidth - outerInset + compactIconOffset, inset);
  }

  return Math.max(contentWidth - itemWidth - outerInset, inset);
}

function getCompactProjectStageDefaultPosition(viewKey, entry, index, baseWidth) {
  const inset = getProjectStageInset();
  const compactColumns = getCompactProjectStageColumnCount();
  const compactColumn = index % compactColumns;
  const compactRow = Math.floor(index / compactColumns);
  const iconWidth = getProjectStageIconWidth(entry.kind);
  const compactIconOffset = Math.max(Math.round((entry.width - iconWidth) / 2), 0);
  const compactLeftX = Math.max(inset - compactIconOffset, 0);
  const compactRightX = Math.max(baseWidth - inset - entry.width + compactIconOffset, inset);
  const compactLeftVisibleCenter = compactLeftX + compactIconOffset + iconWidth / 2;
  const compactRightVisibleCenter = compactRightX + compactIconOffset + iconWidth / 2;
  const compactCenterX = Math.max(
    Math.round((compactLeftVisibleCenter + compactRightVisibleCenter) / 2 - compactIconOffset - iconWidth / 2),
    inset,
  );
  const compactX =
    compactColumn === 0 ? compactLeftX : compactColumn === 1 ? compactCenterX : compactRightX;
  const compactY = inset + compactRow * (Math.max(96, PROJECT_STAGE_ITEM_HEIGHTS[entry.kind] || 96) + 18);

  if (viewKey === "root") {
    if (entry.id === "energy") {
      return { x: compactLeftX, y: inset };
    }
    if (entry.id === "applied-ai") {
      const folderIconWidth = getProjectStageIconWidth("folder");
      const folderIconOffset = Math.max(Math.round((entry.width - folderIconWidth) / 2), 0);
      const leftVisibleCenter = compactLeftX + folderIconOffset + folderIconWidth / 2;
      const chessWidth = getCompactProjectStageWidth("chess");
      const chessIconWidth = getProjectStageIconWidth("chess");
      const chessIconOffset = Math.max(Math.round((chessWidth - chessIconWidth) / 2), 0);
      const chessX = Math.max(Math.min(compactRightX - 18, getProjectStageMaxX(baseWidth, chessWidth, "chess")), inset);
      const rightVisibleCenter = chessX + chessIconOffset + chessIconWidth / 2;
      const targetVisibleCenter = Math.round((leftVisibleCenter + rightVisibleCenter) / 2);
      return {
        x: Math.max(targetVisibleCenter - folderIconOffset - folderIconWidth / 2 + 70, inset),
        y: inset,
      };
    }
    if (entry.id === "chess") {
      return {
        x: Math.max(Math.min(compactRightX - 18, getProjectStageMaxX(baseWidth, entry.width, entry.kind)), inset),
        y: inset + 118,
      };
    }
  }

  if (viewKey === "energy" && entry.id === "myclever") {
    return {
      x: compactCenterX + 4,
      y: compactY,
    };
  }

  if (viewKey === "applied-ai" && entry.id === "website") {
    return {
      x: compactX,
      y: compactY - 10,
    };
  }

  return { x: compactX, y: compactY };
}

function getProjectStageLayoutEntry(viewKey, itemId) {
  return (PROJECT_STAGE_LAYOUTS[viewKey] || []).find((entry) => entry.id === itemId) || null;
}

function getProjectStageBaseHeight(viewKey) {
  const layout = PROJECT_STAGE_LAYOUTS[viewKey] || [];
  if (isCompactDesktopLayout()) {
    const maxItemHeight = Math.max(82, ...layout.map((entry) => getProjectStagePlacementHeight(entry.kind)));
    const rows = Math.max(1, Math.ceil(layout.length / getCompactProjectStageColumnCount()));
    const inset = getProjectStageInset();
    const compactLayoutHeight = Math.max(220, inset + rows * maxItemHeight + Math.max(rows - 1, 0) * 18 + 24);
    return Math.max(projectsBrowserList?.clientHeight || 0, compactLayoutHeight);
  }
  const minHeight = PROJECT_STAGE_MIN_HEIGHTS[viewKey] || 320;
  return Math.max(
    minHeight,
    ...layout.map((entry) => entry.y + (PROJECT_STAGE_ITEM_HEIGHTS[entry.kind] || 96) + 42),
  );
}

function getProjectStageBaseWidth() {
  if (isCompactDesktopLayout()) {
    return Math.max(Math.min(projectsBrowserList?.clientWidth || 0, 300), 278);
  }
  return Math.max(projectsBrowserList?.clientWidth || 0, 640);
}

function getProjectStageRectForPlacement(position, width, height) {
  return {
    left: position.x,
    top: position.y,
    right: position.x + width,
    bottom: position.y + height,
  };
}

function doProjectStageRectsOverlap(firstRect, secondRect, gap = null) {
  const effectiveGap = gap ?? getProjectStageCollisionGap();
  return !(
    firstRect.right + effectiveGap <= secondRect.left ||
    firstRect.left >= secondRect.right + effectiveGap ||
    firstRect.bottom + effectiveGap <= secondRect.top ||
    firstRect.top >= secondRect.bottom + effectiveGap
  );
}

function getProjectStageOccupiedRects(viewKey, excludedKeys = new Set()) {
  const categoryId = viewKey === "root" ? null : viewKey;
  return getProjectStageEntries(categoryId)
    .filter((entry) => !excludedKeys.has(entry.stageInstanceKey || entry.id))
    .map((entry) => {
      const width = entry.width || getDefaultProjectStageWidth(entry.kind);
      const height = getProjectStagePlacementHeight(entry.kind);
      return getProjectStageRectForPlacement({ x: entry.x, y: entry.y }, width, height);
    });
}

function resolveProjectStageDropPosition(
  position,
  viewKey,
  base,
  width = null,
  excludedKeys = new Set(),
  additionalRects = [],
) {
  if (!position || !viewKey || !base) {
    return position;
  }

  const itemWidth = getProjectStageWidthForBase(base, width);
  const itemHeight = getProjectStagePlacementHeight(base.kind);
  const contentWidth = Math.max(getProjectStageBaseWidth(), itemWidth + 32);
  const contentHeight = Math.max(getProjectStageBaseHeight(viewKey), itemHeight + 32);
  const inset = getProjectStageInset();
  const outerInset = getProjectStageOuterInset();
  const maxX = getProjectStageMaxX(contentWidth, itemWidth, base.kind);
  const maxY = Math.max(contentHeight - itemHeight - outerInset, inset);
  const clampedPosition = {
    x: Math.round(clamp(position.x, inset, maxX)),
    y: Math.round(clamp(position.y, inset, maxY)),
  };
  const occupiedRects = [...getProjectStageOccupiedRects(viewKey, excludedKeys), ...additionalRects];
  const candidateRect = getProjectStageRectForPlacement(clampedPosition, itemWidth, itemHeight);

  if (!occupiedRects.some((rect) => doProjectStageRectsOverlap(candidateRect, rect))) {
    return clampedPosition;
  }

  const localStep = 4;
  const maxRadius = Math.max(maxX - inset, maxY - inset);
  for (let radius = localStep; radius <= maxRadius; radius += localStep) {
    const minOffsetY = -radius;
    const maxOffsetY = radius;
    for (let offsetY = minOffsetY; offsetY <= maxOffsetY; offsetY += localStep) {
      const remaining = radius - Math.abs(offsetY);
      const xOffsets = remaining === 0 ? [0] : [-remaining, remaining];
      for (const offsetX of xOffsets) {
        const nextPosition = {
          x: Math.round(clamp(clampedPosition.x + offsetX, inset, maxX)),
          y: Math.round(clamp(clampedPosition.y + offsetY, inset, maxY)),
        };
        const nextRect = getProjectStageRectForPlacement(nextPosition, itemWidth, itemHeight);
        if (!occupiedRects.some((rect) => doProjectStageRectsOverlap(nextRect, rect))) {
          return nextPosition;
        }
      }
    }
  }

  const stepX = 12;
  const stepY = 12;
  const scanStarts = [
    { startX: clampedPosition.x, startY: clampedPosition.y },
    { startX: inset, startY: clampedPosition.y },
    { startX: inset, startY: inset },
  ];

  for (const scanStart of scanStarts) {
    for (let y = scanStart.startY; y <= maxY; y += stepY) {
      for (let x = y === scanStart.startY ? scanStart.startX : inset; x <= maxX; x += stepX) {
        const nextPosition = { x: Math.round(x), y: Math.round(y) };
        const nextRect = getProjectStageRectForPlacement(nextPosition, itemWidth, itemHeight);
        if (!occupiedRects.some((rect) => doProjectStageRectsOverlap(nextRect, rect))) {
          return nextPosition;
        }
      }
    }
  }

  return clampedPosition;
}

function getProjectStageDropPositionForBase(clientX, clientY, viewKey, base, width = null) {
  if (!projectsBrowserList || !base || !viewKey) {
    return null;
  }

  const stageRect = projectsBrowserList.getBoundingClientRect();
  const itemWidth = getProjectStageWidthForBase(base, width);
  const itemHeight = getProjectStagePlacementHeight(base.kind);
  const contentWidth = Math.max(getProjectStageBaseWidth(), itemWidth + 32);
  const contentHeight = Math.max(getProjectStageBaseHeight(viewKey), itemHeight + 32);
  const inset = getProjectStageInset();
  const outerInset = getProjectStageOuterInset();
  const nextX = clientX - stageRect.left - itemWidth / 2;
  const nextY = clientY - stageRect.top - itemHeight / 2;

  return {
    x: Math.round(clamp(nextX, inset, getProjectStageMaxX(contentWidth, itemWidth, base.kind))),
    y: Math.round(clamp(nextY, inset, Math.max(contentHeight - itemHeight - outerInset, inset))),
  };
}

function getProjectStageVisibleDropPositionForBase(clientX, clientY, base, width = null) {
  if (!projectsBrowserList || !base) {
    return null;
  }

  const stageRect = projectsBrowserList.getBoundingClientRect();
  const itemWidth = getProjectStageWidthForBase(base, width);
  const itemHeight = getProjectStagePlacementHeight(base.kind);
  const inset = getProjectStageInset();
  const nextX = clientX - stageRect.left - itemWidth / 2;
  const nextY = clientY - stageRect.top - itemHeight / 2;
  const maxX = getProjectStageMaxX(projectsBrowserList.clientWidth || stageRect.width, itemWidth, base.kind);
  const maxY = Math.max((projectsBrowserList.clientHeight || stageRect.height) - itemHeight - getProjectStageOuterInset(), inset);

  return {
    x: Math.round(clamp(nextX, inset, maxX)),
    y: Math.round(clamp(nextY, inset, maxY)),
  };
}

function getProjectStageVisibleTopLeftPosition(position, base, width = null) {
  if (!projectsBrowserList || !base || !position) {
    return position;
  }

  const itemWidth = getProjectStageWidthForBase(base, width);
  const itemHeight = getProjectStagePlacementHeight(base.kind);
  const inset = getProjectStageInset();
  const maxX = getProjectStageMaxX(projectsBrowserList.clientWidth, itemWidth, base.kind);
  const maxY = Math.max(projectsBrowserList.clientHeight - itemHeight - getProjectStageOuterInset(), inset);

  return {
    x: Math.round(clamp(position.x, inset, maxX)),
    y: Math.round(clamp(position.y, inset, maxY)),
  };
}

function getProjectStageGroupDropPositions(anchorPosition, viewKey, groupItems, anchorItem, options = {}) {
  const { preserveFormation = false, useVisibleStage = false } = options;
  if (!anchorPosition || !viewKey || !groupItems?.length || !anchorItem) {
    return new Map();
  }

  const inset = getProjectStageInset();
  const contentWidth = useVisibleStage ? (projectsBrowserList?.clientWidth || getProjectStageBaseWidth()) : getProjectStageBaseWidth();
  const contentHeight = useVisibleStage ? (projectsBrowserList?.clientHeight || getProjectStageBaseHeight(viewKey)) : getProjectStageBaseHeight(viewKey);
  const projected = groupItems
    .filter((item) => item.baseId)
    .map((item) => {
      const base = desktopItemBases.get(item.baseId);
      const width = getProjectStageWidthForBase(base, item.stageWidth || item.width);
      const height = getProjectStagePlacementHeight(base?.kind || item.kind || "document");
      const itemLeft = item.currentLeft ?? item.startLeft;
      const itemTop = item.currentTop ?? item.startTop;
      const anchorLeft = anchorItem.currentLeft ?? anchorItem.startLeft;
      const anchorTop = anchorItem.currentTop ?? anchorItem.startTop;
      return {
        item,
        width,
        height,
        x: anchorPosition.x + (itemLeft - anchorLeft),
        y: anchorPosition.y + (itemTop - anchorTop),
      };
    });

  if (projected.length === 0) {
    return new Map();
  }

  const minX = Math.min(...projected.map((entry) => entry.x));
  const minY = Math.min(...projected.map((entry) => entry.y));
  const maxRight = Math.max(...projected.map((entry) => entry.x + entry.width));
  const maxBottom = Math.max(...projected.map((entry) => entry.y + entry.height));

  let adjustX = 0;
  let adjustY = 0;

  if (minX < inset) {
    adjustX = inset - minX;
  }
  if (maxRight + adjustX > contentWidth - inset) {
    adjustX += (contentWidth - inset) - (maxRight + adjustX);
  }

  if (minY < inset) {
    adjustY = inset - minY;
  }
  if (maxBottom + adjustY > contentHeight - inset) {
    adjustY += (contentHeight - inset) - (maxBottom + adjustY);
  }

  const excludedKeys = new Set(
    projected.map((entry) => getProjectStageInjectedItemKey(entry.item.baseId, entry.item.instanceRole || "original")),
  );
  const occupiedRects = getProjectStageOccupiedRects(viewKey, excludedKeys);
  const desiredProjected = projected.map((entry) => ({
    ...entry,
    x: Math.round(entry.x + adjustX),
    y: Math.round(entry.y + adjustY),
  }));

  if (preserveFormation) {
    const result = new Map();
    desiredProjected.forEach((entry) => {
      const base = desktopItemBases.get(entry.item.baseId);
      const nextWidth = getProjectStageWidthForBase(base, entry.item.stageWidth || entry.item.width);
      const nextHeight = getProjectStagePlacementHeight(base?.kind || entry.item.kind || "document");
      result.set(
        getProjectStageInjectedItemKey(entry.item.baseId, entry.item.instanceRole || "original"),
        {
          x: Math.round(clamp(entry.x, inset, getProjectStageMaxX(contentWidth, nextWidth, base?.kind || entry.item.kind || "document"))),
          y: Math.round(clamp(entry.y, inset, Math.max(contentHeight - nextHeight - getProjectStageOuterInset(), inset))),
        },
      );
    });
    return result;
  }

  function buildResolvedGroup(dx = 0, dy = 0) {
    const resolved = [];

    for (const entry of desiredProjected) {
      const base = desktopItemBases.get(entry.item.baseId);
      const nextWidth = getProjectStageWidthForBase(base, entry.item.stageWidth || entry.item.width);
      const nextHeight = getProjectStagePlacementHeight(base?.kind || entry.item.kind || "document");
      const nextX = Math.round(clamp(entry.x + dx, inset, getProjectStageMaxX(contentWidth, nextWidth, base?.kind || entry.item.kind || "document")));
      const nextY = Math.round(clamp(entry.y + dy, inset, Math.max(contentHeight - nextHeight - getProjectStageOuterInset(), inset)));
      const rect = getProjectStageRectForPlacement({ x: nextX, y: nextY }, nextWidth, nextHeight);
      resolved.push({
        entry,
        position: { x: nextX, y: nextY },
        rect,
      });
    }

    const collidesWithExisting = resolved.some(({ rect }) =>
      occupiedRects.some((occupiedRect) => doProjectStageRectsOverlap(rect, occupiedRect)),
    );
    if (collidesWithExisting) {
      return null;
    }

    for (let index = 0; index < resolved.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < resolved.length; compareIndex += 1) {
        if (doProjectStageRectsOverlap(resolved[index].rect, resolved[compareIndex].rect)) {
          return null;
        }
      }
    }

    const result = new Map();
    resolved.forEach(({ entry, position }) => {
      result.set(
        getProjectStageInjectedItemKey(entry.item.baseId, entry.item.instanceRole || "original"),
        position,
      );
    });
    return result;
  }

  const directResolved = buildResolvedGroup();
  if (directResolved) {
    return directResolved;
  }

  const localStep = 4;
  const maxRadius = Math.max(contentWidth, contentHeight);
  for (let radius = localStep; radius <= maxRadius; radius += localStep) {
    const minOffsetY = -radius;
    const maxOffsetY = radius;
    for (let offsetY = minOffsetY; offsetY <= maxOffsetY; offsetY += localStep) {
      const remaining = radius - Math.abs(offsetY);
      const xOffsets = remaining === 0 ? [0] : [-remaining, remaining];
      for (const offsetX of xOffsets) {
        const resolved = buildResolvedGroup(offsetX, offsetY);
        if (resolved) {
          return resolved;
        }
      }
    }
  }

  const resolvedPositions = new Map();
  const placedRects = [];
  projected.forEach((entry) => {
    const base = desktopItemBases.get(entry.item.baseId);
    const nextWidth = getProjectStageWidthForBase(base, entry.item.stageWidth || entry.item.width);
    const nextHeight = PROJECT_STAGE_ITEM_HEIGHTS[base?.kind || entry.item.kind || "document"] || 96;
    const desiredPosition = {
      x: Math.round(entry.x + adjustX),
      y: Math.round(entry.y + adjustY),
    };
    const resolvedPosition = resolveProjectStageDropPosition(
      desiredPosition,
      viewKey,
      base,
      entry.item.stageWidth || entry.item.width,
      excludedKeys,
      placedRects,
    );

    resolvedPositions.set(
      getProjectStageInjectedItemKey(entry.item.baseId, entry.item.instanceRole || "original"),
      resolvedPosition,
    );
    placedRects.push(getProjectStageRectForPlacement(resolvedPosition, nextWidth, nextHeight));
  });

  return resolvedPositions;
}

function clearDesktopDragProxies() {
  desktopIconsContainer?.querySelectorAll(".desktop-icon.is-drag-proxy").forEach((element) => {
    element.remove();
  });
  desktopDragLayer?.querySelectorAll(".desktop-icon.is-drag-proxy").forEach((element) => {
    element.remove();
  });
}

function pushDesktopDragLayer() {
  if (!desktopDragLayer) {
    return;
  }

  desktopDragLayerDepth += 1;
}

function popDesktopDragLayer() {
  if (!desktopDragLayer) {
    return;
  }

  desktopDragLayerDepth = Math.max(0, desktopDragLayerDepth - 1);
  if (desktopDragLayerDepth === 0) {
    clearDesktopDragProxies();
  }
}

function createDesktopDragProxyFromButton(button) {
  if (!button || !desktopDragLayer) {
    return null;
  }

  const proxy = button.cloneNode(true);
  proxy.classList.add("is-drag-proxy");
  proxy.removeAttribute("id");
  proxy.tabIndex = -1;
  desktopDragLayer.append(proxy);
  return proxy;
}

function initializeDesktopTrashPosition() {
  if (!desktopTrash || !desktopStage) {
    return;
  }

  const trashRect = desktopTrash.getBoundingClientRect();
  const stageRect = desktopStage.getBoundingClientRect();
  desktopTrash.style.left = `${Math.round(trashRect.left - stageRect.left)}px`;
  desktopTrash.style.top = `${Math.round(trashRect.top - stageRect.top)}px`;
  desktopTrash.style.right = "auto";
  desktopTrash.style.bottom = "auto";
}

function buildDesktopBase(baseId, descriptor, originalPosition, options = {}) {
  const position = clampDesktopItemPosition(originalPosition.x, originalPosition.y, descriptor.kind);
  const base = {
    baseId,
    kind: descriptor.kind,
    label: descriptor.label,
    icon: descriptor.icon,
    openIcon: descriptor.openIcon || "",
    action: descriptor.action,
    originalPosition: position,
    duplicatePosition: getDesktopDuplicatePosition(position, descriptor.kind),
    originalInstanceId: options.originalInstanceId || null,
    originalIsStatic: Boolean(options.originalIsStatic),
    duplicateInstanceId: null,
    duplicatedOnce: false,
    respawnTimers: {
      original: null,
      duplicate: null,
    },
  };

  desktopItemBases.set(baseId, base);
  return base;
}

function getDesktopDescriptorForBase(base) {
  return {
    baseId: base.baseId,
    kind: base.kind,
    label: base.label,
    icon: base.icon,
    openIcon: base.openIcon,
    action: base.action,
  };
}

function createDesktopItemElement(record) {
  const button = document.createElement("button");
  const variantClass = record.kind === "document" ? "desktop-icon-document" : record.kind === "chess" ? "desktop-icon-chess" : "";
  button.className = `desktop-icon ${variantClass}`.trim();
  button.type = "button";
  button.dataset.desktopItemId = record.itemId;
  button.dataset.desktopBaseId = record.baseId;
  button.dataset.desktopInstanceRole = record.role;
  button.dataset.desktopKind = record.kind;
  button.dataset.desktopLabel = record.label;
  button.dataset.stageDefaultIcon = record.icon;
  if (record.action?.type === "projects-window" && record.action.categoryId) {
    button.dataset.desktopCategory = record.action.categoryId;
  }
  if (record.action?.type === "project-detail" && record.action.projectId) {
    button.dataset.desktopProjectId = record.action.projectId;
  }
  if (record.openIcon) {
    button.dataset.stageOpenIcon = record.openIcon;
  }
  button.style.left = `${record.x}px`;
  button.style.top = `${record.y}px`;

  const image = document.createElement("img");
  image.src = record.kind === "chess" ? chessDesktopIcon : record.icon;
  image.alt = "";
  image.className = "icon";

  const label = document.createElement("span");
  label.setAttribute("data-rename-label", "");
  label.dataset.iconLabel = record.label;
  setRenameLabelText(label, record.label);

  button.append(image, label);
  desktopTrash?.before(button);
  attachDynamicDesktopItem(button);
  return button;
}

function startDesktopRespawnAnimation(element, position, seedKey = "") {
  if (!element) {
    return;
  }

  const existingTimer = Number(element.dataset.respawnAnimationTimer || 0);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
  }

  let startX = 0;
  let startY = 0;
  let midX = 0;
  let midY = -10;
  let startRotate = 0;
  let midRotate = 0;

  if (desktopTrash && desktopStage) {
    const trashRect = desktopTrash.getBoundingClientRect();
    const stageRect = desktopStage.getBoundingClientRect();
    const width = element.offsetWidth || getDesktopItemMetrics(element.dataset.desktopKind || "folder").width;
    const height = element.offsetHeight || getDesktopItemMetrics(element.dataset.desktopKind || "folder").height;
    const targetCenterX = position.x + width / 2;
    const targetCenterY = position.y + Math.min(height * 0.5, height - 10);
    const trashCenterX = trashRect.left - stageRect.left + trashRect.width / 2;
    const trashCenterY = trashRect.top - stageRect.top + Math.min(trashRect.height * 0.34, 22);
    const seed = [...String(seedKey)].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    const spinBias = ((seed % 7) - 3) * 4;

    startX = Math.round(trashCenterX - targetCenterX);
    startY = Math.round(trashCenterY - targetCenterY);
    midX = clamp(Math.round(-startX * 0.14), -18, 18);
    midY = clamp(Math.round(-Math.abs(startY) * 0.1) - 12, -28, -10);
    startRotate = clamp((startX > 0 ? -14 : 14) + spinBias, -24, 24);
    midRotate = clamp(Math.round(-startRotate * 0.3), -10, 10);
  }

  element.style.setProperty("--desktop-eject-start-x", `${startX}px`);
  element.style.setProperty("--desktop-eject-start-y", `${startY}px`);
  element.style.setProperty("--desktop-eject-mid-x", `${midX}px`);
  element.style.setProperty("--desktop-eject-mid-y", `${midY}px`);
  element.style.setProperty("--desktop-eject-start-rotate", `${startRotate}deg`);
  element.style.setProperty("--desktop-eject-mid-rotate", `${midRotate}deg`);
  element.classList.remove("is-respawning");
  void element.offsetWidth;
  element.classList.add("is-respawning");

  const timer = window.setTimeout(() => {
    element.classList.remove("is-respawning");
    delete element.dataset.respawnAnimationTimer;
  }, TRASH_EJECT_ANIMATION_MS);

  element.dataset.respawnAnimationTimer = String(timer);
}

function showDynamicDesktopItem(record, position, options = {}) {
  const { animate = false } = options;
  const nextPosition = clampDesktopItemPosition(position.x, position.y, record.kind);
  record.x = nextPosition.x;
  record.y = nextPosition.y;

  let element = getDesktopItemElementById(record.itemId);
  if (!element) {
    element = createDesktopItemElement(record);
  }

  element.hidden = false;
  element.style.left = `${record.x}px`;
  element.style.top = `${record.y}px`;

  if (animate) {
    startDesktopRespawnAnimation(element, nextPosition, record.itemId);
  }

  return element;
}

function hideDynamicDesktopItem(itemId) {
  const element = getDesktopItemElementById(itemId);
  if (element) {
    element.hidden = true;
  }
}

function createDynamicDesktopInstance(base, role, position, options = {}) {
  const { animate = false } = options;
  const itemId = `${base.baseId}-${role}-${nextDynamicDesktopItemId++}`;
  const record = {
    itemId,
    baseId: base.baseId,
    role,
    kind: base.kind,
    label: base.label,
    icon: base.icon,
    openIcon: base.openIcon,
    action: base.action,
    x: position.x,
    y: position.y,
  };

  dynamicDesktopItems.set(itemId, record);
  showDynamicDesktopItem(record, position, { animate });
  return record;
}

function spawnDesktopCloneBase(base, sourcePosition) {
  const descriptor = getDesktopDescriptorForBase(base);
  const cloneBaseId = `${base.baseId}-clone-${nextDesktopCloneBaseId++}`;
  const clonePosition = getDesktopTrashSpawnPosition(sourcePosition, base.kind);
  const cloneBase = buildDesktopBase(cloneBaseId, descriptor, clonePosition);
  const cloneRecord = createDynamicDesktopInstance(cloneBase, "original", cloneBase.originalPosition, { animate: true });
  cloneBase.originalInstanceId = cloneRecord.itemId;
  return cloneBase;
}

function triggerTrashAnimation(kind = "open") {
  if (!desktopTrash || desktopTrash.hidden || trashIsDisabled) {
    return;
  }

  const className = kind === "spit" ? "is-spitting" : "is-opening";
  const timerKey = kind === "spit" ? "trashSpitAnimationTimer" : "trashOpenAnimationTimer";
  const activeTimer = kind === "spit" ? trashSpitAnimationTimer : trashOpenAnimationTimer;

  if (activeTimer) {
    window.clearTimeout(activeTimer);
  }

  desktopTrash.classList.remove(className);
  void desktopTrash.offsetWidth;
  desktopTrash.classList.add(className);

  const nextTimer = window.setTimeout(() => {
    desktopTrash.classList.remove(className);
    if (kind === "spit") {
      trashSpitAnimationTimer = null;
    } else {
      trashOpenAnimationTimer = null;
    }
  }, kind === "spit" ? 420 : 320);

  if (timerKey === "trashSpitAnimationTimer") {
    trashSpitAnimationTimer = nextTimer;
  } else {
    trashOpenAnimationTimer = nextTimer;
  }
}

function explodeAndDisableTrash() {
  if (!desktopTrash || desktopTrash.hidden || trashIsDisabled) {
    return;
  }

  trashIsDisabled = true;
  playUiSound("trashOverload");

  if (trashOpenAnimationTimer) {
    window.clearTimeout(trashOpenAnimationTimer);
    trashOpenAnimationTimer = null;
  }

  if (trashSpitAnimationTimer) {
    window.clearTimeout(trashSpitAnimationTimer);
    trashSpitAnimationTimer = null;
  }

  if (trashExplosionAnimationTimer) {
    window.clearTimeout(trashExplosionAnimationTimer);
    trashExplosionAnimationTimer = null;
  }

  if (trashHideTimer) {
    window.clearTimeout(trashHideTimer);
    trashHideTimer = null;
  }

  desktopTrash.classList.remove("is-opening", "is-spitting", "is-target", "is-dragging");
  desktopTrash.classList.add("is-disabled");
  void desktopTrash.offsetWidth;
  desktopTrash.classList.add("is-exploding");

  trashExplosionAnimationTimer = window.setTimeout(() => {
    desktopTrash.classList.remove("is-exploding");
    trashExplosionAnimationTimer = null;
  }, TRASH_EXPLOSION_ANIMATION_MS);

  trashHideTimer = window.setTimeout(() => {
    desktopTrash.hidden = true;
    desktopTrash.classList.remove("is-disabled");
    trashHideTimer = null;
  }, TRASH_EXPLOSION_ANIMATION_MS - 40);
}

function scheduleTrashOverflowDisable(delayMs = TRASH_EJECT_ANIMATION_MS) {
  if (trashIsDisabled) {
    return;
  }

  if (trashOverflowSequenceTimer) {
    window.clearTimeout(trashOverflowSequenceTimer);
  }

  trashOverflowSequenceTimer = window.setTimeout(() => {
    trashOverflowSequenceTimer = null;
    explodeAndDisableTrash();
  }, delayMs);
}

function respawnDesktopBase(baseId, instanceRole = "original") {
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return;
  }

  if (instanceRole === "duplicate") {
    if (base.duplicateInstanceId) {
      const duplicateRecord = dynamicDesktopItems.get(base.duplicateInstanceId);
      if (duplicateRecord) {
        showDynamicDesktopItem(duplicateRecord, base.duplicatePosition, { animate: true });

        if (wouldTrashExceedDuplicationLimit(1)) {
          scheduleTrashOverflowDisable();
          return;
        }

        triggerTrashAnimation("spit");
        spawnDesktopCloneBase(base, base.duplicatePosition);
      }
    }
    return;
  }

  if (base.originalIsStatic) {
    const element = getDesktopItemElementById(base.originalInstanceId);
    if (element) {
      element.hidden = false;
      element.style.left = `${base.originalPosition.x}px`;
      element.style.top = `${base.originalPosition.y}px`;
      startDesktopRespawnAnimation(element, base.originalPosition, base.baseId);
    }
  } else if (base.originalInstanceId) {
    const record = dynamicDesktopItems.get(base.originalInstanceId);
    if (record) {
      showDynamicDesktopItem(record, base.originalPosition, { animate: true });
    }
  }

  if (wouldTrashExceedDuplicationLimit(1)) {
    scheduleTrashOverflowDisable();
    return;
  }

  triggerTrashAnimation("spit");

  if (!base.duplicatedOnce) {
    base.duplicatedOnce = true;
    const duplicateRecord = createDynamicDesktopInstance(base, "duplicate", base.duplicatePosition, { animate: true });
    base.duplicateInstanceId = duplicateRecord.itemId;
    return;
  }

  spawnDesktopCloneBase(base, base.originalPosition);
}

function scheduleDesktopBaseRespawn(baseId, instanceRole = "original") {
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return;
  }

  const activeTimer = base.respawnTimers?.[instanceRole];
  if (activeTimer) {
    window.clearTimeout(activeTimer);
  }

  base.respawnTimers[instanceRole] = window.setTimeout(() => {
    base.respawnTimers[instanceRole] = null;
    respawnDesktopBase(baseId, instanceRole);
  }, TRASH_RESPAWN_DELAY_MS);
}

function removeProjectStageItemFromSource(itemButton, viewKey) {
  if (!itemButton) {
    return;
  }

  const itemId = itemButton.dataset.stageItemId;
  const stageInstanceKey = itemButton.dataset.stageInstanceKey;
  const stageBaseId = itemButton.dataset.stageBaseId;
  if (stageInstanceKey) {
    delete getProjectStageInjectedItems(viewKey)[stageInstanceKey];
    if (itemId) {
      delete getProjectStagePositions(viewKey)[itemId];
    }
  } else if (stageBaseId) {
    delete getProjectStageInjectedItems(viewKey)[stageBaseId];
    if (itemId) {
      delete getProjectStagePositions(viewKey)[itemId];
    }
  } else if (itemId) {
    getProjectStageRemovedItems(viewKey).add(itemId);
  }

  if (itemId) {
    appState.selectedProjectStageItemIds.delete(itemId);
  }

  itemButton.classList.remove("is-proxy-hidden");
  itemButton.remove();
  syncProjectStageSelection();
  requestCustomScrollbarSync();
}

function insertDesktopItemIntoProjectsView(
  baseId,
  instanceRole = "original",
  targetViewKey,
  dropPosition = null,
  width = null,
  dropPositionIsResolved = false,
) {
  const base = desktopItemBases.get(baseId);
  if (!base || !canInsertBaseIntoProjectView(base, targetViewKey)) {
    return false;
  }

  const stageInstanceKey = getProjectStageInjectedItemKey(base.baseId, instanceRole);
  delete getProjectStagePositions(targetViewKey)[`injected-${stageInstanceKey}`];
  clearDesktopBaseRespawnTimers(base);
  removeInjectedProjectStageInstance(base.baseId, instanceRole);
  const targetPosition =
    dropPosition ||
    getProjectStageDropPositionForBase(
      (projectsBrowserList?.getBoundingClientRect().left || 0) + 32,
      (projectsBrowserList?.getBoundingClientRect().top || 0) + 32,
      targetViewKey,
      base,
      width,
    );
  const resolvedPosition = dropPositionIsResolved
    ? targetPosition
    : resolveProjectStageDropPosition(
        targetPosition,
        targetViewKey,
        base,
        width,
        new Set([getProjectStageInjectedItemKey(base.baseId, instanceRole)]),
      );
  const entry = buildInjectedProjectStageEntry(base, targetViewKey, resolvedPosition, width, instanceRole);
  if (!entry) {
    return false;
  }

  getProjectStageInjectedItems(targetViewKey)[entry.stageInstanceKey] = entry;

  if (instanceRole === "duplicate") {
    if (base.duplicateInstanceId) {
      hideDynamicDesktopItem(base.duplicateInstanceId);
    }
  } else if (!base.originalIsStatic && base.originalInstanceId) {
    hideDynamicDesktopItem(base.originalInstanceId);
  }

  const projectsWindow = windowMap.get("projects-window");
  const activeViewKey = getProjectStageViewKey(appState.activeProjectCategory);
  if (projectsWindow && !projectsWindow.hidden && activeViewKey === targetViewKey) {
    renderProjectsBrowser(appState.activeProjectCategory, {
      allowBack: appState.projectsBrowserAllowBack,
    });
  }

  return true;
}

function clearDesktopBaseRespawnTimers(base) {
  if (!base?.respawnTimers) {
    return;
  }

  Object.keys(base.respawnTimers).forEach((key) => {
    const timer = base.respawnTimers[key];
    if (timer) {
      window.clearTimeout(timer);
      base.respawnTimers[key] = null;
    }
  });
}

function getProjectStageSourceForBase(base) {
  if (!base?.action) {
    return null;
  }

  if (base.action.type === "projects-window" && base.action.categoryId) {
    return {
      viewKey: "root",
      itemId: base.action.categoryId,
    };
  }

  if (base.action.type === "chess-window") {
    return {
      viewKey: "root",
      itemId: "chess",
      kind: "chess",
    };
  }

  if (base.action.type === "project-detail") {
    const project = projectMap.get(base.action.projectId);
    if (!project) {
      return null;
    }

    return {
      viewKey: project.categoryId,
      itemId: project.id,
    };
  }

  return null;
}

function restoreDesktopItemToProjects(baseId, instanceRole = "original", dropPosition = null) {
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return false;
  }

  const source = getProjectStageSourceForBase(base);
  if (!source) {
    return false;
  }

  clearDesktopBaseRespawnTimers(base);
  getProjectStageRemovedItems(source.viewKey).delete(source.itemId);
  if (dropPosition) {
    getProjectStagePositions(source.viewKey)[source.itemId] = dropPosition;
  }

  if (instanceRole === "duplicate") {
    if (base.duplicateInstanceId) {
      hideDynamicDesktopItem(base.duplicateInstanceId);
    }
  } else if (!base.originalIsStatic && base.originalInstanceId) {
    hideDynamicDesktopItem(base.originalInstanceId);
  }

  const projectsWindow = windowMap.get("projects-window");
  const activeViewKey = getProjectStageViewKey(appState.activeProjectCategory);
  if (projectsWindow && !projectsWindow.hidden && activeViewKey === source.viewKey) {
    renderProjectsBrowser(appState.activeProjectCategory, {
      allowBack: appState.projectsBrowserAllowBack,
    });
  }

  return true;
}

function trashDesktopItemBase(baseId, instanceRole = "original", options = {}) {
  const { overflowDrop = false, triggerExplosion = true } = options;
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return false;
  }

  if (trashIsDisabled) {
    return false;
  }

  if (!overflowDrop && wouldTrashExceedDuplicationLimit(1)) {
    explodeAndDisableTrash();
    return false;
  }

  triggerTrashAnimation("open");

  if (instanceRole === "duplicate") {
    hideDynamicDesktopItem(base.duplicateInstanceId);
    scheduleDesktopBaseRespawn(baseId, "duplicate");
    if (overflowDrop && triggerExplosion) {
      explodeAndDisableTrash();
    }
    return true;
  }

  const originalElement = getDesktopItemElementById(base.originalInstanceId);
  if (originalElement) {
    originalElement.hidden = true;
  }

  scheduleDesktopBaseRespawn(baseId, "original");
  if (overflowDrop && triggerExplosion) {
    explodeAndDisableTrash();
  }
  return true;
}

function ensureDesktopBaseFromDescriptor(descriptor, position) {
  if (!descriptor?.baseId) {
    return null;
  }

  const existingBase = desktopItemBases.get(descriptor.baseId);
  if (existingBase) {
    return existingBase;
  }

  const base = buildDesktopBase(descriptor.baseId, descriptor, position);
  const originalRecord = createDynamicDesktopInstance(base, "original", base.originalPosition);
  base.originalInstanceId = originalRecord.itemId;
  return base;
}

function updateDesktopBaseSlot(base, instanceRole, position) {
  const nextPosition = clampDesktopItemPosition(position.x, position.y, base.kind);
  if (instanceRole === "duplicate") {
    base.duplicatePosition = nextPosition;
  } else {
    base.originalPosition = nextPosition;
    if (!base.duplicatedOnce) {
      base.duplicatePosition = getDesktopDuplicatePosition(nextPosition, base.kind);
    }
  }
}

function seedDesktopItemBases() {
  if (!projectsDesktopIcon) {
    return;
  }

  buildDesktopBase(
    "projects-root",
    {
      kind: "folder",
      label: "Projects",
      icon: PROJECTS_FOLDER_ICON,
      openIcon: PROJECTS_FOLDER_OPEN_ICON,
      action: { type: "projects-window", categoryId: null },
    },
    { x: 22, y: 28 },
    { originalInstanceId: "desktop-projects-root", originalIsStatic: true },
  );
}

const soundBanks = {
  click: [
    {
      type: "triangle",
      from: 1180,
      to: 860,
      peak: 0.078,
      duration: 0.048,
      filter: 3200,
      noise: { peak: 0.006, duration: 0.011, frequency: 2800, q: 0.9 },
    },
    {
      type: "square",
      from: 1520,
      to: 980,
      peak: 0.086,
      duration: 0.03,
      filter: 4300,
      noise: { peak: 0.014, duration: 0.013, frequency: 3400, q: 1.15 },
    },
    {
      type: "triangle",
      from: 1310,
      to: 900,
      peak: 0.073,
      duration: 0.036,
      filter: 3600,
      layer: { type: "sine", from: 760, to: 620, peak: 0.02, duration: 0.03, filter: 2200 },
    },
    {
      type: "sine",
      from: 980,
      to: 760,
      peak: 0.06,
      duration: 0.045,
      filter: 2600,
      accent: { type: "triangle", from: 1620, to: 1220, peak: 0.016, duration: 0.018, delay: 0.001, filter: 4200 },
    },
    {
      type: "square",
      from: 1260,
      to: 820,
      peak: 0.074,
      duration: 0.038,
      filter: 3900,
      layer: { type: "triangle", from: 940, to: 720, peak: 0.022, duration: 0.04, delay: 0.001, filter: 2600 },
      noise: { peak: 0.008, duration: 0.01, frequency: 2600, q: 0.72 },
    },
  ],
  focus: [
    { type: "sine", from: 760, to: 880, peak: 0.058, duration: 0.05, filter: 2500 },
    { type: "triangle", from: 690, to: 920, peak: 0.052, duration: 0.048, filter: 2800 },
    {
      type: "triangle",
      from: 720,
      to: 940,
      peak: 0.054,
      duration: 0.042,
      filter: 3000,
      layer: { type: "sine", from: 540, to: 620, peak: 0.016, duration: 0.04, filter: 1900 },
    },
  ],
  open: [
    { type: "triangle", from: 760, to: 1180, peak: 0.09, duration: 0.062, filter: 3200 },
    {
      type: "sine",
      from: 720,
      to: 980,
      peak: 0.078,
      duration: 0.068,
      filter: 2600,
      accent: { type: "triangle", from: 1160, to: 1460, peak: 0.02, duration: 0.03, delay: 0.006, filter: 3600 },
    },
    {
      type: "square",
      from: 820,
      to: 1120,
      peak: 0.07,
      duration: 0.048,
      filter: 3500,
      layer: { type: "triangle", from: 1220, to: 1480, peak: 0.016, duration: 0.026, delay: 0.005, filter: 4200 },
    },
  ],
  close: [
    { type: "square", from: 1020, to: 620, peak: 0.082, duration: 0.057, filter: 2800 },
    { type: "triangle", from: 920, to: 580, peak: 0.074, duration: 0.06, filter: 2400 },
    {
      type: "square",
      from: 1180,
      to: 700,
      peak: 0.076,
      duration: 0.044,
      filter: 3000,
      noise: { peak: 0.007, duration: 0.012, frequency: 2200, q: 0.85 },
    },
  ],
  drag: [
    { type: "triangle", from: 860, to: 760, peak: 0.045, duration: 0.04, filter: 2200 },
    { type: "square", from: 820, to: 700, peak: 0.032, duration: 0.032, filter: 1900 },
    { type: "sine", from: 760, to: 700, peak: 0.028, duration: 0.03, filter: 1800 },
  ],
  drop: [
    { type: "sine", from: 780, to: 660, peak: 0.04, duration: 0.035, filter: 2100 },
    { type: "triangle", from: 720, to: 610, peak: 0.036, duration: 0.03, filter: 1800 },
    { type: "square", from: 860, to: 640, peak: 0.032, duration: 0.028, filter: 2400 },
  ],
  submit: [
    { type: "triangle", from: 640, to: 1040, peak: 0.082, duration: 0.072, filter: 3200 },
    {
      type: "sine",
      from: 720,
      to: 1120,
      peak: 0.074,
      duration: 0.075,
      filter: 2800,
      accent: { type: "triangle", from: 1260, to: 1480, peak: 0.02, duration: 0.03, delay: 0.01, filter: 3600 },
    },
  ],
  menuOpen: [
    { type: "triangle", from: 700, to: 980, peak: 0.06, duration: 0.05, filter: 2600 },
    { type: "square", from: 760, to: 1040, peak: 0.048, duration: 0.04, filter: 3200 },
    { type: "sine", from: 720, to: 960, peak: 0.05, duration: 0.042, filter: 2400 },
  ],
  menuClose: [
    { type: "triangle", from: 880, to: 620, peak: 0.05, duration: 0.038, filter: 2200 },
    { type: "sine", from: 820, to: 600, peak: 0.042, duration: 0.032, filter: 1800 },
  ],
  menuPick: [
    {
      type: "square",
      from: 1120,
      to: 860,
      peak: 0.07,
      duration: 0.04,
      filter: 3800,
      accent: { type: "triangle", from: 1480, to: 1180, peak: 0.02, duration: 0.022, delay: 0.003, filter: 4200 },
    },
    { type: "triangle", from: 1040, to: 740, peak: 0.066, duration: 0.046, filter: 3200 },
    {
      type: "square",
      from: 1340,
      to: 880,
      peak: 0.08,
      duration: 0.032,
      filter: 4300,
      noise: { peak: 0.012, duration: 0.011, frequency: 3000, q: 0.94 },
    },
  ],
  hover: [
    { type: "sine", from: 980, to: 920, peak: 0.024, duration: 0.024, filter: 2600 },
    { type: "triangle", from: 1060, to: 980, peak: 0.02, duration: 0.02, filter: 3000 },
    { type: "square", from: 1180, to: 1040, peak: 0.016, duration: 0.016, filter: 3400 },
  ],
  trashOverload: [
    {
      type: "triangle",
      from: 520,
      to: 240,
      peak: 0.048,
      duration: 0.07,
      filter: 1600,
      noise: { peak: 0.01, duration: 0.028, frequency: 1300, q: 0.7 },
    },
    {
      type: "sine",
      from: 460,
      to: 210,
      peak: 0.042,
      duration: 0.082,
      filter: 1200,
      noise: { peak: 0.008, duration: 0.032, frequency: 1050, q: 0.6 },
    },
  ],
};

function scaleSoundLayer(layer, ratio) {
  const scaledLayer = { ...layer };

  if (typeof layer.from === "number") {
    scaledLayer.from = layer.from * ratio;
  }

  if (typeof layer.to === "number") {
    scaledLayer.to = layer.to * ratio;
  }

  if (typeof layer.filter === "number") {
    scaledLayer.filter = layer.filter * ratio;
  }

  if (layer.accent) {
    scaledLayer.accent = scaleSoundLayer(layer.accent, ratio);
  }

  if (layer.layer) {
    scaledLayer.layer = scaleSoundLayer(layer.layer, ratio);
  }

  if (layer.noise) {
    scaledLayer.noise = { ...layer.noise };

    if (typeof layer.noise.frequency === "number") {
      scaledLayer.noise.frequency = layer.noise.frequency * ratio;
    }
  }

  return scaledLayer;
}

function pickSoundPreset(kind) {
  const bank = soundBanks[kind] || soundBanks.click;
  const basePreset = bank[Math.floor(Math.random() * bank.length)];
  const variance = 0.025;
  const ratio = 1 + (Math.random() * variance * 2 - variance);

  return scaleSoundLayer(basePreset, ratio);
}

function getAudioContext() {
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGainNode = audioContext.createGain();
    masterGainNode.gain.value = 0.92;
    masterGainNode.connect(audioContext.destination);
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

async function unlockAudio() {
  const context = getAudioContext();
  if (!context) {
    return false;
  }

  if (context.state === "running") {
    audioUnlocked = true;
    return true;
  }

  if (!unlockPromise) {
    unlockPromise = context
      .resume()
      .then(() => {
        audioUnlocked = context.state === "running";
        unlockPromise = null;
        return audioUnlocked;
      })
      .catch(() => {
        unlockPromise = null;
        return false;
      });
  }

  return unlockPromise;
}

function getNoiseBuffer(context) {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
    return noiseBuffer;
  }

  const length = Math.max(1, Math.floor(context.sampleRate * 0.08));
  noiseBuffer = context.createBuffer(1, length, context.sampleRate);
  const channelData = noiseBuffer.getChannelData(0);

  for (let index = 0; index < length; index += 1) {
    channelData[index] = Math.random() * 2 - 1;
  }

  return noiseBuffer;
}

function playNoiseBurst(context, targetNode, noiseSettings, now) {
  const startTime = now + (noiseSettings.delay || 0);
  const noiseSource = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  noiseSource.buffer = getNoiseBuffer(context);
  filter.type = noiseSettings.filterType || "bandpass";
  filter.frequency.setValueAtTime(noiseSettings.frequency || 2800, startTime);
  filter.Q.value = noiseSettings.q || 1;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    noiseSettings.peak,
    startTime + Math.min(0.004, noiseSettings.duration * 0.4),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + noiseSettings.duration);

  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(targetNode);

  noiseSource.start(startTime);
  noiseSource.stop(startTime + noiseSettings.duration + 0.01);
}

function playOscillatorLayer(context, targetNode, layerSettings, now) {
  const startTime = now + (layerSettings.delay || 0);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = layerSettings.type;
  oscillator.frequency.setValueAtTime(Math.max(layerSettings.from, 1), startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(layerSettings.to, 1),
    startTime + layerSettings.duration,
  );

  filter.type = layerSettings.filterType || "lowpass";
  filter.frequency.setValueAtTime(layerSettings.filter || 3000, startTime);
  filter.Q.value = layerSettings.q || 0.0001;

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(
    layerSettings.peak,
    startTime + (layerSettings.attack || 0.004),
  );
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + layerSettings.duration);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(targetNode);

  oscillator.start(startTime);
  oscillator.stop(startTime + layerSettings.duration + 0.01);

  if (layerSettings.layer) {
    playOscillatorLayer(context, targetNode, layerSettings.layer, now);
  }

  if (layerSettings.accent) {
    playOscillatorLayer(context, targetNode, layerSettings.accent, now);
  }

  if (layerSettings.noise) {
    playNoiseBurst(context, targetNode, layerSettings.noise, now);
  }
}

function playUiSound(kind = "click") {
  const context = getAudioContext();
  const preset = pickSoundPreset(kind);

  if (!context || !preset) {
    return;
  }

  if (!audioUnlocked) {
    unlockAudio().then((isReady) => {
      if (isReady) {
        playUiSound(kind);
      }
    });
    return;
  }

  const now = context.currentTime;
  playOscillatorLayer(context, masterGainNode, preset, now);
}

function getCurrentClockLabel() {
  return clockFormatter.format(new Date());
}

function updateClock() {
  clock.textContent = getCurrentClockLabel();

  if (appState.activeEasterOverlay === "time" && easterOverlayMessage && easterOverlay && !easterOverlay.hidden) {
    easterOverlayMessage.textContent = `Current time:\n\n${getCurrentClockLabel()}\n\nUse it wisely.`;
  }
}

function syncMenus() {
  menuTriggers.forEach((button) => {
    const isOpen = button.dataset.menuTrigger === appState.openMenu;
    button.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
  });

  menuDropdowns.forEach((dropdown) => {
    const isOpen = dropdown.dataset.menu === appState.openMenu;
    dropdown.hidden = !isOpen;
  });
}

function syncOpeners() {
  openButtons.forEach((button) => {
    if (!button.classList.contains("desktop-icon")) {
      return;
    }

    const targetId = button.dataset.open;
    const windowElement = getWindowElement(targetId);
    const isOpen = windowElement && !windowElement.hidden;
    const isFocused = targetId === appState.focusedWindow;

    button.classList.toggle("is-open", Boolean(isOpen));
    button.classList.toggle("is-focused", Boolean(isFocused));
    button.setAttribute("aria-pressed", String(Boolean(isFocused)));
  });

  refreshCoveredDesktopIcons();
}

function getCurrentAppLabel() {
  if (appState.activeEasterOverlay) {
    return "System";
  }

  if (!appState.focusedWindow) {
    return "Desktop";
  }

  const windowElement = getWindowElement(appState.focusedWindow);
  if (!windowElement || windowElement.hidden) {
    return "Desktop";
  }

  return windowElement.dataset.appLabel || "Desktop";
}

function syncCurrentAppLabel() {
  if (!currentAppLabel) {
    return;
  }

  currentAppLabel.textContent = getCurrentAppLabel();
}

function getVisibleWindows() {
  return getAllWindows().filter(
    (windowElement) => !windowElement.hidden && windowElement.dataset.projectDetailTemplate !== "true",
  );
}

function refreshCoveredDesktopIcons() {
  const desktopIcons = [...(desktopIconsContainer?.querySelectorAll(".desktop-icon") || [])];
  if (desktopIcons.length === 0) {
    return;
  }

  if (!isCompactDesktopLayout()) {
    desktopIcons.forEach((button) => {
      button.classList.remove("is-covered-by-window");
    });
    return;
  }

  const visibleWindowRects = getVisibleWindows().map((windowElement) => windowElement.getBoundingClientRect());

  desktopIcons.forEach((button) => {
    const hitTarget = button.querySelector(".icon") || button;
    const iconRect = hitTarget.getBoundingClientRect();
    const iconArea = Math.max(iconRect.width * iconRect.height, 1);
    const maxCoveredRatio = visibleWindowRects.reduce((highestRatio, windowRect) => {
      const overlapWidth = Math.max(0, Math.min(iconRect.right, windowRect.right) - Math.max(iconRect.left, windowRect.left));
      const overlapHeight = Math.max(0, Math.min(iconRect.bottom, windowRect.bottom) - Math.max(iconRect.top, windowRect.top));
      const overlapArea = overlapWidth * overlapHeight;
      return Math.max(highestRatio, overlapArea / iconArea);
    }, 0);
    const isCovered = maxCoveredRatio > 0.7;
    button.classList.toggle("is-covered-by-window", isCovered);
  });
}

function getProjectStageViewKey(categoryId = null) {
  return categoryId || "root";
}

function getProjectStagePositions(viewKey) {
  if (!appState.projectStagePositions[viewKey]) {
    appState.projectStagePositions[viewKey] = {};
  }

  return appState.projectStagePositions[viewKey];
}

function getProjectStageRemovedItems(viewKey) {
  if (!appState.projectStageRemovedItems[viewKey]) {
    appState.projectStageRemovedItems[viewKey] = new Set();
  }

  return appState.projectStageRemovedItems[viewKey];
}

function getProjectStageInjectedItems(viewKey) {
  if (!appState.projectStageInjectedItems[viewKey]) {
    appState.projectStageInjectedItems[viewKey] = {};
  }

  return appState.projectStageInjectedItems[viewKey];
}

function getProjectStageInjectedItemKey(baseId, instanceRole = "original") {
  return `${baseId}__${instanceRole}`;
}

function getDefaultProjectStageWidth(kind) {
  if (kind === "folder") {
    return 132;
  }

  if (kind === "chess") {
    return 74;
  }

  return 108;
}

function getProjectStageWidthForBase(base, fallbackWidth = null) {
  if (isCompactDesktopLayout()) {
    return getCompactProjectStageWidth(base?.kind || "document");
  }

  const source = getProjectStageSourceForBase(base);
  const layoutEntry = source ? getProjectStageLayoutEntry(source.viewKey, source.itemId) : null;
  return fallbackWidth || layoutEntry?.width || getDefaultProjectStageWidth(base?.kind || "document");
}

function canInsertBaseIntoProjectView(base, viewKey) {
  if (!base || !viewKey) {
    return false;
  }

  if (base.kind === "folder") {
    return Boolean(
      viewKey === "root" &&
        base.action?.type === "projects-window" &&
        base.action.categoryId,
    );
  }

  return !(base.action?.type === "projects-window" && !base.action.categoryId);
}

function removeInjectedProjectStageInstance(baseId, instanceRole = "original") {
  const instanceKey = getProjectStageInjectedItemKey(baseId, instanceRole);
  Object.keys(appState.projectStageInjectedItems).forEach((viewKey) => {
    const injectedItems = getProjectStageInjectedItems(viewKey);
    if (injectedItems[instanceKey]) {
      delete injectedItems[instanceKey];
    }
  });
}

function restoreDesktopBaseInstance(base, instanceRole = "original") {
  if (!base) {
    return;
  }

  if (instanceRole === "duplicate") {
    if (base.duplicateInstanceId) {
      const duplicateRecord = dynamicDesktopItems.get(base.duplicateInstanceId);
      if (duplicateRecord) {
        showDynamicDesktopItem(duplicateRecord, base.duplicatePosition);
      }
    }
    return;
  }

  if (base.originalIsStatic) {
    const element = getDesktopItemElementById(base.originalInstanceId);
    if (element) {
      element.hidden = false;
      element.style.left = `${base.originalPosition.x}px`;
      element.style.top = `${base.originalPosition.y}px`;
    }
    return;
  }

  if (base.originalInstanceId) {
    const record = dynamicDesktopItems.get(base.originalInstanceId);
    if (record) {
      showDynamicDesktopItem(record, base.originalPosition);
    }
  }
}

function buildInjectedProjectStageEntry(base, viewKey, position, width = null, instanceRole = "original") {
  if (!canInsertBaseIntoProjectView(base, viewKey)) {
    return null;
  }

  const nextWidth = getProjectStageWidthForBase(base, width);
  const kind = base.kind;
  const stageInstanceKey = getProjectStageInjectedItemKey(base.baseId, instanceRole);
  const entry = {
    id: `injected-${stageInstanceKey}`,
    stageInstanceKey,
    stageBaseId: base.baseId,
    kind,
    label: base.label,
    icon: base.icon,
    openIcon: base.openIcon || "",
    instanceRole,
    x: position.x,
    y: position.y,
    width: nextWidth,
  };

  if (base.action?.type === "projects-window" && base.action.categoryId) {
    return {
      ...entry,
      targetCategoryId: base.action.categoryId,
    };
  }

  if (base.action?.type === "chess-window") {
    return {
      ...entry,
      targetWindowId: "chess-window",
    };
  }

  if (base.action?.type === "project-detail" && base.action.projectId) {
    return {
      ...entry,
      targetProjectId: base.action.projectId,
    };
  }

  if (base.action?.type === "system-overlay" && base.action.kind) {
    return {
      ...entry,
      systemOverlayKind: base.action.kind,
    };
  }

  return null;
}

function getProjectStageEntries(categoryId = null) {
  const viewKey = getProjectStageViewKey(categoryId);
  const storedPositions = getProjectStagePositions(viewKey);
  const removedItems = getProjectStageRemovedItems(viewKey);
  const injectedItems = Object.values(getProjectStageInjectedItems(viewKey)).filter((entry) => {
    const base = entry.stageBaseId ? desktopItemBases.get(entry.stageBaseId) : null;
    if (!base || canInsertBaseIntoProjectView(base, viewKey)) {
      return true;
    }

    delete getProjectStageInjectedItems(viewKey)[entry.stageInstanceKey || entry.stageBaseId];
    restoreDesktopBaseInstance(base, entry.instanceRole || "original");
    return false;
  });
  const layout = PROJECT_STAGE_LAYOUTS[viewKey] || [];
  const baseHeight = getProjectStageBaseHeight(viewKey);
  const baseWidth = getProjectStageBaseWidth();

  const staticEntries = layout
    .filter((entry) => !removedItems.has(entry.id))
    .map((entry) => {
      if (viewKey === "root") {
        const category = projectCategoryMap.get(entry.id);
        if (!category) {
          return null;
        }

        if (entry.kind === "chess") {
          return {
            ...entry,
            label: category.label,
            targetWindowId: "chess-window",
            icon: chessStageIcon,
          };
        }

        const folderIcons = PROJECT_STAGE_FOLDER_ICONS[entry.id];
        return {
          ...entry,
          label: category.label,
          targetCategoryId: category.id,
          icon: folderIcons?.closed || PROJECTS_FOLDER_ICON,
          openIcon: folderIcons?.open || PROJECTS_FOLDER_OPEN_ICON,
        };
      }

      const project = projectMap.get(entry.id);
      if (!project) {
        return null;
      }

      if (project.systemOverlayKind) {
        return {
          ...entry,
          label: project.label || project.title,
          systemOverlayKind: project.systemOverlayKind,
          icon: project.icon || PROJECT_STAGE_PROJECT_ICONS[project.id] || PROJECT_STAGE_DOCUMENT_ICON,
        };
      }

      if (project.windowTarget) {
        return {
          ...entry,
          label: project.label || project.title,
          targetWindowId: project.windowTarget,
          replayAboutIntro: Boolean(project.replayAboutIntro),
          icon: project.icon || PROJECT_STAGE_PROJECT_ICONS[project.id] || PROJECT_STAGE_DOCUMENT_ICON,
        };
      }

      return {
        ...entry,
        label: project.label || project.title,
        targetProjectId: project.id,
        icon: PROJECT_STAGE_PROJECT_ICONS[project.id] || PROJECT_STAGE_DOCUMENT_ICON,
      };
    })
    .filter(Boolean);

  return [...staticEntries, ...injectedItems].map((entry, index) => {
    const entryHeight = PROJECT_STAGE_ITEM_HEIGHTS[entry.kind] || 96;
    const inset = getProjectStageInset();
    const outerInset = getProjectStageOuterInset();
    const compactPosition = getCompactProjectStageDefaultPosition(viewKey, entry, index, baseWidth);
    const fallbackX =
      isCompactDesktopLayout() && !entry.stageBaseId ? compactPosition.x : entry.x;
    const fallbackY =
      isCompactDesktopLayout() && !entry.stageBaseId ? compactPosition.y : entry.y;
    const storedPosition = storedPositions[entry.id] || null;
    const isCompactStaticEntry = isCompactDesktopLayout() && !entry.stageBaseId;
    const shouldUseStoredPosition =
      storedPosition?.x != null &&
      storedPosition?.y != null &&
      (
        !isCompactDesktopLayout() ||
        entry.stageBaseId ||
        storedPosition.custom === true ||
        !isCompactStaticEntry
      );

    return {
      ...entry,
      x:
        shouldUseStoredPosition
          ? clamp(storedPosition.x, inset, getProjectStageMaxX(baseWidth, entry.width, entry.kind))
          : clamp(fallbackX, inset, getProjectStageMaxX(baseWidth, entry.width, entry.kind)),
      y:
        shouldUseStoredPosition
          ? clamp(
              storedPosition.y,
              inset,
              Math.max(baseHeight - entryHeight - outerInset, inset),
            )
          : clamp(fallbackY, inset, Math.max(baseHeight - entryHeight - outerInset, inset)),
    };
  });
}

function getProjectStageHeight(viewKey) {
  return getProjectStageBaseHeight(viewKey);
}

function renderProjectStageItem(entry) {
  const labelClass = entry.kind === "chess" ? "project-stage-label project-stage-label-chess" : "project-stage-label";
  const itemClass = `project-stage-item project-stage-item-${entry.kind}`;
  const baseAttribute = entry.stageBaseId
    ? ` data-stage-base-id="${entry.stageBaseId}" data-stage-instance-key="${entry.stageInstanceKey || ""}" data-stage-instance-role="${
        entry.instanceRole || "original"
      }"`
    : "";
  const dataAttributes = entry.targetProjectId
    ? `data-project-id="${entry.targetProjectId}" data-stage-item-kind="${entry.kind}"`
    : entry.systemOverlayKind
      ? `data-system-overlay="${entry.systemOverlayKind}" data-stage-item-kind="${entry.kind}"`
      : entry.targetWindowId
        ? `data-stage-window="${entry.targetWindowId}" data-stage-item-kind="${entry.kind}" data-stage-default-icon="${entry.icon}"${
            entry.replayAboutIntro ? ' data-replay-about-intro="true"' : ""
        }`
      : `data-project-category="${entry.targetCategoryId}" data-stage-item-kind="${entry.kind}" data-stage-default-icon="${entry.icon}"${
          entry.openIcon ? ` data-stage-open-icon="${entry.openIcon}"` : ""
        }`;

  return `
    <button
      class="${itemClass}"
      type="button"
      data-project-stage-item
      data-stage-item-id="${entry.id}"
      style="left: ${entry.x}px; top: ${entry.y}px; width: ${entry.width}px;"
      ${baseAttribute}
      ${dataAttributes}
    >
      <img src="${entry.icon}" alt="" class="project-stage-icon project-stage-icon-${entry.kind}" />
      <span class="${labelClass}" data-rename-label data-icon-label="${escapeHtml(entry.label)}">${getProjectStageLabelMarkup(entry.label, entry.width)}</span>
    </button>
  `;
}

function animateProjectsStageFolder(stageItem) {
  const icon = stageItem.querySelector(".project-stage-icon");
  const defaultIcon = stageItem.dataset.stageDefaultIcon;
  const openIcon = stageItem.dataset.stageOpenIcon;

  if (!icon || !defaultIcon || !openIcon) {
    return 0;
  }

  stageItem.classList.remove("is-opening");
  icon.src = defaultIcon;
  void stageItem.offsetWidth;

  stageItem.classList.add("is-opening");
  icon.src = openIcon;

  window.setTimeout(() => {
    stageItem.classList.remove("is-opening");
    icon.src = defaultIcon;
  }, 240);

  return 150;
}

function getProjectsStageTransitionOrigin(stageItem) {
  if (!projectsBrowserList || !stageItem) {
    return null;
  }

  const stageRect = projectsBrowserList.getBoundingClientRect();
  const itemRect = stageItem.getBoundingClientRect();

  return {
    x: Math.round(itemRect.left - stageRect.left + itemRect.width / 2),
    y: Math.round(itemRect.top - stageRect.top + Math.min(itemRect.height * 0.42, 34)),
  };
}

function animateProjectsStageSurface(origin) {
  if (!projectsBrowserList || !origin) {
    return;
  }

  if (projectsStageTransitionTimer) {
    window.clearTimeout(projectsStageTransitionTimer);
    projectsStageTransitionTimer = null;
  }

  projectsBrowserList.classList.remove("is-stage-opening");
  projectsBrowserList.style.setProperty("--project-stage-origin-x", `${origin.x}px`);
  projectsBrowserList.style.setProperty("--project-stage-origin-y", `${origin.y}px`);
  void projectsBrowserList.offsetWidth;
  projectsBrowserList.classList.add("is-stage-opening");

  projectsStageTransitionTimer = window.setTimeout(() => {
    projectsBrowserList.classList.remove("is-stage-opening");
    projectsStageTransitionTimer = null;
  }, 260);
}

function renderProjectsBrowser(categoryId = null, options = {}) {
  const { transitionOrigin = null, allowBack = categoryId !== null } = options;
  if (!projectsBrowserList || !projectsBrowserPath || !projectsBrowserBack) {
    return;
  }

  appState.activeProjectCategory = categoryId;
  appState.projectsBrowserAllowBack = Boolean(categoryId) && Boolean(allowBack);

  if (!categoryId) {
    projectsBrowserPath.textContent = "Client and personal projects.";
    const useMobilePlaceholder = isCompactDesktopLayout();
    projectsBrowserBack.hidden = !useMobilePlaceholder;
    projectsBrowserBack.classList.toggle("is-placeholder", useMobilePlaceholder);
    projectsBrowserBack.parentElement?.classList.toggle("is-root-placeholder", useMobilePlaceholder);
    projectsBrowserBack.setAttribute("aria-hidden", "true");
    projectsBrowserBack.tabIndex = -1;
  } else {
    const category = projectCategoryMap.get(categoryId);
    if (!category) {
      renderProjectsBrowser(null);
      return;
    }

    projectsBrowserPath.textContent = `Projects / ${category.label}`;
    projectsBrowserBack.hidden = !appState.projectsBrowserAllowBack;
    projectsBrowserBack.classList.remove("is-placeholder");
    projectsBrowserBack.parentElement?.classList.remove("is-root-placeholder");
    projectsBrowserBack.setAttribute("aria-hidden", String(!appState.projectsBrowserAllowBack));
    projectsBrowserBack.tabIndex = appState.projectsBrowserAllowBack ? 0 : -1;
  }

  const viewKey = getProjectStageViewKey(categoryId);
  if (appState.selectedProjectStageViewKey && appState.selectedProjectStageViewKey !== viewKey) {
    appState.selectedProjectStageItemIds.clear();
    appState.selectedProjectStageViewKey = null;
  }
  const stageEntries = getProjectStageEntries(categoryId);

  projectsBrowserList.dataset.view = viewKey;
  projectsBrowserList.style.height = `${getProjectStageHeight(viewKey, stageEntries)}px`;
  projectsBrowserList.innerHTML = stageEntries.map((entry) => renderProjectStageItem(entry)).join("");

  projectsBrowserList.querySelectorAll("[data-project-stage-item]").forEach((itemButton) => {
    attachProjectStageItemDragging(itemButton, projectsBrowserList, viewKey);
  });
  ensureProjectsSelectionBox();
  syncProjectStageSelection();

  animateProjectsStageSurface(transitionOrigin);
  requestCustomScrollbarSync();
}

function populateProjectDetail(projectId, windowElement = projectDetailTemplateWindow) {
  const project = projectMap.get(projectId);
  const refs = getProjectDetailWindowRefs(windowElement);

  if (
    !project ||
    !refs?.windowTitle ||
    !refs.category ||
    !refs.title ||
    !refs.summary ||
    !refs.status ||
    !refs.type ||
    !refs.duration
  ) {
    return null;
  }

  windowElement.dataset.projectId = projectId;
  windowElement.dataset.appLabel = project.title;
  appState.activeProjectId = projectId;
  const detailTitle = project.detailTitle || project.title;
  refs.windowTitle.textContent = project.windowTitle || project.title;
  refs.category.textContent = project.detailCategory || project.categoryLabel;
  if (refs.icon) {
    refs.icon.src = PROJECT_STAGE_PROJECT_ICONS[project.id] || PROJECT_STAGE_DOCUMENT_ICON;
  }
  refs.title.textContent = detailTitle;
  refs.status.textContent = project.status || "";
  refs.type.textContent = project.type || "";
  refs.duration.textContent = project.duration || "";
  if (refs.gradeRow && refs.grade) {
    if (project.grade) {
      refs.grade.textContent = project.grade;
      refs.gradeRow.hidden = false;
    } else {
      refs.grade.textContent = "";
      refs.gradeRow.hidden = true;
    }
  }
  refs.summary.textContent = project.summary;

  if (refs.more) {
    refs.more.hidden = true;
    refs.more.textContent = project.details || "";
  }

  if (refs.expand) {
    const hasDetails = Boolean(project.details);
    refs.expand.hidden = !hasDetails;
    refs.expand.textContent = "Expand";
  }

  if (refs.request) {
    refs.request.hidden = false;
  }

  if (refs.github) {
    refs.github.hidden = !project.githubUrl;
  }

  if (refs.github) {
    if (project.githubUrl) {
      refs.github.dataset.githubUrl = project.githubUrl;
    } else {
      delete refs.github.dataset.githubUrl;
    }
  }

  if (refs.secondaryActions) {
    refs.secondaryActions.hidden = true;
  }

  requestCustomScrollbarSync();
  return project;
}

function prefillContactMessageForProject(projectValue) {
  if (!contactMessageField || !projectValue) {
    return;
  }

  const nextValue =
    typeof projectValue === "string"
      ? projectValue
      : projectValue.requestMessage ||
        (projectValue.requestTitle || projectValue.title || projectValue.label || ""
          ? `Hi Markus,\n\nCould you please send me more details about ${projectValue.requestTitle || projectValue.title || projectValue.label}?\n\nBest,\n`
          : "");

  if (!nextValue) {
    return;
  }
  contactMessageField.value = nextValue;

  window.requestAnimationFrame(() => {
    contactMessageField.focus();
    const end = contactMessageField.value.length;
    contactMessageField.setSelectionRange(end, end);
  });
}

function prepareContactWindowForGeneralMessage() {
  if (!contactMessageField) {
    return;
  }

  contactMessageField.value = "";
  contactMessageField.setAttribute("placeholder", contactMessageDefaultPlaceholder);
}

function hideEasterOverlay() {
  if (easterOverlayTimer) {
    window.clearTimeout(easterOverlayTimer);
    easterOverlayTimer = null;
  }

  appState.activeEasterOverlay = null;

  if (easterOverlay) {
    delete easterOverlay.dataset.easterKind;
    easterOverlay.hidden = true;
  }

  syncCurrentAppLabel();
}

function clearAboutIntroTimers() {
  aboutIntroTimers.forEach((timer) => {
    window.clearTimeout(timer);
  });
  aboutIntroTimers = [];
}

function normalizeAboutIntroText(value) {
  return value
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function prepareAboutIntroText(element) {
  if (!element) {
    return "";
  }

  if (element === aboutHomeHeading && isCompactDesktopLayout()) {
    return "Markus Stark is a\nstudent from Munich,\nworking across strategy\nand applied AI.";
  }

  if (element === aboutHomeFocusTyping && isCompactDesktopLayout()) {
    return "Focused on energy,\nsustainability, and\ndata analytics.";
  }

  if (element === aboutHomeFocusTyping) {
    return "Focused on energy, sustainability,\nand data analytics.";
  }

  if (!element.dataset.fullText) {
    element.dataset.fullText = normalizeAboutIntroText(element.textContent || "");
  }

  return element.dataset.fullText;
}

function renderAboutIntroLines(element, text, templateText, lineClassName, activeLineIndex = -1) {
  if (!element) {
    return;
  }

  const templateLines = String(templateText || "").split("\n");
  const nextLines = String(text || "").split("\n");
  element.replaceChildren(
    ...templateLines.map((_, index) => {
      const line = document.createElement("span");
      line.className = lineClassName;
      if (index === activeLineIndex) {
        line.classList.add("is-active");
      }
      line.textContent = nextLines[index] || "";
      return line;
    }),
  );
}

function renderCompactAboutHeadingLines(text, activeLineIndex = -1) {
  if (!aboutHomeHeading) {
    return;
  }

  renderAboutIntroLines(
    aboutHomeHeading,
    text,
    prepareAboutIntroText(aboutHomeHeading),
    "about-home-heading-line",
    activeLineIndex,
  );
}

function renderAboutHeadingLines(text, activeLineIndex = -1) {
  if (!aboutHomeHeading) {
    return;
  }

  renderAboutIntroLines(
    aboutHomeHeading,
    text,
    prepareAboutIntroText(aboutHomeHeading),
    "about-home-heading-line",
    activeLineIndex,
  );
}

function renderAboutFocusTypingLines(text, activeLineIndex = -1) {
  if (!aboutHomeFocusTyping) {
    return;
  }

  renderAboutIntroLines(
    aboutHomeFocusTyping,
    text,
    prepareAboutIntroText(aboutHomeFocusTyping),
    "about-home-focus-typing-line",
    activeLineIndex,
  );
}

function resetAboutWordEmphasis() {
  [aboutWordEnergy, aboutWordSustainability, aboutWordData].forEach((element) => {
    if (!element) {
      return;
    }

    element.classList.remove("is-emphasized", "is-icon-visible");
  });
}

function runAboutWordEmphasis(callback) {
  const wordSequence = [aboutWordEnergy, aboutWordSustainability, aboutWordData].filter(Boolean);
  if (wordSequence.length === 0) {
    callback?.();
    return;
  }

  let offset = 0;
  wordSequence.forEach((element) => {
    const colorTimer = window.setTimeout(() => {
      element.classList.add("is-emphasized");
    }, offset);
    aboutIntroTimers.push(colorTimer);

    const iconTimer = window.setTimeout(() => {
      element.classList.add("is-icon-visible");
    }, offset + 180);
    aboutIntroTimers.push(iconTimer);

    offset += 520;
  });

  const completeTimer = window.setTimeout(() => {
    callback?.();
  }, offset + 120);
  aboutIntroTimers.push(completeTimer);
}

function setAboutIntroFinalState() {
  const headingText = prepareAboutIntroText(aboutHomeHeading);
  const noteText = prepareAboutIntroText(aboutHomeNote);

  if (aboutHomeHeading) {
    renderAboutHeadingLines(headingText);
    aboutHomeHeading.classList.remove("is-typing");
  }

  if (aboutHomeFocusTyping) {
    aboutHomeFocusTyping.hidden = true;
    aboutHomeFocusTyping.textContent = "";
    aboutHomeFocusTyping.classList.remove("is-typing");
  }

  if (aboutHomeFocusLine) {
    aboutHomeFocusLine.hidden = false;
  }

  if (aboutHomeNote) {
    aboutHomeNote.textContent = noteText;
    aboutHomeNote.classList.remove("is-typing");
  }

  if (aboutHomeStage) {
    aboutHomeStage.classList.remove("is-intro-pending", "is-intro-active");
    aboutHomeStage.classList.add("is-rule-visible", "is-actions-visible");
    aboutHomeStage.classList.add("is-subtext-visible");
  }

  resetAboutWordEmphasis();
  [aboutWordEnergy, aboutWordSustainability, aboutWordData].forEach((element) => {
    if (!element) {
      return;
    }

    element.classList.add("is-emphasized", "is-icon-visible");
  });

  aboutHomeActions?.querySelectorAll("button").forEach((button) => {
    button.disabled = false;
  });

  appState.aboutIntroRunning = false;
}

function typeAboutIntroText(element, text, delay, stepMs, callback) {
  if (!element) {
    callback?.();
    return;
  }

  if (element === aboutHomeHeading && isCompactDesktopLayout()) {
    renderCompactAboutHeadingLines("");
  } else if (element === aboutHomeHeading) {
    renderAboutHeadingLines("");
  } else if (element === aboutHomeFocusTyping) {
    renderAboutFocusTypingLines("");
  } else {
    element.textContent = "";
  }
  element.classList.add("is-typing");

  const startTimer = window.setTimeout(() => {
    let index = 0;

    const tick = () => {
      index += 1;
      const nextText = text.slice(0, index);
      if (element === aboutHomeHeading && isCompactDesktopLayout()) {
        renderCompactAboutHeadingLines(nextText, Math.max(nextText.split("\n").length - 1, 0));
      } else if (element === aboutHomeHeading) {
        renderAboutHeadingLines(nextText, Math.max(nextText.split("\n").length - 1, 0));
      } else if (element === aboutHomeFocusTyping) {
        renderAboutFocusTypingLines(nextText, Math.max(nextText.split("\n").length - 1, 0));
      } else {
        element.textContent = nextText;
      }

      if (index >= text.length) {
        element.classList.remove("is-typing");
        if (element === aboutHomeHeading && isCompactDesktopLayout()) {
          renderCompactAboutHeadingLines(text);
        } else if (element === aboutHomeHeading) {
          renderAboutHeadingLines(text);
        } else if (element === aboutHomeFocusTyping) {
          renderAboutFocusTypingLines(text);
        }
        callback?.();
        return;
      }

      const timer = window.setTimeout(tick, stepMs);
      aboutIntroTimers.push(timer);
    };

    tick();
  }, delay);

  aboutIntroTimers.push(startTimer);
}

function startAboutIntroAnimation(options = {}) {
  const { forceReplay = false } = options;
  if (
    !aboutHomeStage ||
    !aboutHomeHeading ||
    !aboutHomeSubtext ||
    !aboutHomeFocusTyping ||
    !aboutHomeFocusLine ||
    !aboutHomeNote ||
    !aboutHomeRule ||
    !aboutHomeActions
  ) {
    return;
  }

  if (!forceReplay && (appState.aboutIntroPlayed || appState.aboutIntroRunning)) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    appState.aboutIntroPlayed = true;
    setAboutIntroFinalState();
    return;
  }

  clearAboutIntroTimers();
  appState.aboutIntroPlayed = false;
  appState.aboutIntroRunning = true;

  const headingText = prepareAboutIntroText(aboutHomeHeading);
  const focusText = prepareAboutIntroText(aboutHomeFocusTyping);
  const noteText = prepareAboutIntroText(aboutHomeNote);

  aboutHomeStage.classList.remove("is-intro-pending");
  aboutHomeStage.classList.add("is-intro-active");
  aboutHomeStage.classList.remove("is-rule-visible", "is-actions-visible", "is-subtext-visible");
  aboutHomeFocusTyping.hidden = false;
  aboutHomeFocusTyping.textContent = "";
  aboutHomeFocusLine.hidden = true;
  aboutHomeNote.textContent = "";
  if (isCompactDesktopLayout()) {
    renderCompactAboutHeadingLines("");
  } else if (aboutHomeHeading) {
    renderAboutHeadingLines("");
  }
  aboutHomeHeading.classList.remove("is-typing");
  aboutHomeFocusTyping.classList.remove("is-typing");
  aboutHomeNote.classList.remove("is-typing");
  resetAboutWordEmphasis();
  aboutHomeActions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });

  typeAboutIntroText(aboutHomeHeading, headingText, 1000, 29, () => {
    aboutHomeStage.classList.add("is-subtext-visible");
    typeAboutIntroText(aboutHomeFocusTyping, focusText, 110, 24, () => {
      aboutHomeFocusTyping.hidden = true;
      aboutHomeFocusLine.hidden = false;

      typeAboutIntroText(aboutHomeNote, noteText, 150, 30, () => {
        const ruleTimer = window.setTimeout(() => {
          aboutHomeStage.classList.add("is-rule-visible");
        }, 70);
        aboutIntroTimers.push(ruleTimer);

        const actionsTimer = window.setTimeout(() => {
          aboutHomeStage.classList.add("is-actions-visible");
          aboutHomeActions.querySelectorAll("button").forEach((button) => {
            button.disabled = false;
          });
        }, 280);
        aboutIntroTimers.push(actionsTimer);

        const emphasisTimer = window.setTimeout(() => {
          runAboutWordEmphasis(() => {
            const completeTimer = window.setTimeout(() => {
              appState.aboutIntroPlayed = true;
              setAboutIntroFinalState();
            }, 180);
            aboutIntroTimers.push(completeTimer);
          });
        }, 620);
        aboutIntroTimers.push(emphasisTimer);
      });
    });
  });
}

function replayAboutWindowIntro(options = {}) {
  const { playSound = true } = options;
  const aboutWindow = getWindowElement("about-window");
  if (!aboutWindow) {
    return;
  }

  closeMenus();
  clearAboutIntroTimers();

  const wasHidden = aboutWindow.hidden;
  openWindowElement(aboutWindow, { playSound });

  const restartTimer = window.setTimeout(() => {
    startAboutIntroAnimation({ forceReplay: true });
  }, wasHidden ? 180 : 40);
  aboutIntroTimers.push(restartTimer);
}

function showSystemOverlay(kind = "system") {
  showEasterOverlay(kind);
}

function showEasterOverlay(kind) {
  if (!easterOverlay || !easterOverlayLabel || !easterOverlayMessage) {
    return;
  }

  closeMenus();

  if (kind === "time") {
    easterOverlayLabel.textContent = "System";
    easterOverlayMessage.textContent = `Current time:\n\n${getCurrentClockLabel()}\n\nUse it wisely.`;
  } else if (kind === "chess-win") {
    easterOverlayLabel.textContent = "System";
    easterOverlayMessage.textContent = "Well played.";
  } else if (kind === "website") {
    easterOverlayLabel.textContent = "System";
    easterOverlayMessage.textContent = "You are already here.";
  } else {
    easterOverlayLabel.textContent = "System";
    easterOverlayMessage.textContent = "MarkOS active.\n\nLearning continuously.";
  }

  appState.activeEasterOverlay = kind;
  easterOverlay.dataset.easterKind = kind;
  easterOverlay.hidden = false;
  syncCurrentAppLabel();

  if (easterOverlayTimer) {
    window.clearTimeout(easterOverlayTimer);
  }

  easterOverlayTimer = window.setTimeout(() => {
    hideEasterOverlay();
  }, 2600);

  playUiSound("menuPick");
}

function closeMenus(options = {}) {
  const { playSound = false } = options;
  if (!appState.openMenu) {
    return;
  }

  appState.openMenu = null;
  syncMenus();

  if (playSound) {
    playUiSound("menuClose");
  }
}

function cancelWindowCloseAnimation(windowElement) {
  if (!windowElement) {
    return;
  }

  const activeTimer = closingWindowTimers.get(windowElement);
  if (activeTimer) {
    window.clearTimeout(activeTimer);
    closingWindowTimers.delete(windowElement);
  }

  windowElement.classList.remove("is-closing");
}

function toggleMenu(menuId) {
  if (appState.openMenu === menuId) {
    closeMenus({ playSound: true });
    return;
  }

  appState.openMenu = menuId;
  syncMenus();
  playUiSound("menuOpen");
}

function hideWindow(windowElement, options = {}) {
  const { playSound = false } = options;

  if (!windowElement || windowElement.hidden) {
    return;
  }

  cancelWindowCloseAnimation(windowElement);

  if (playSound) {
    playUiSound("close");
  }

  windowElement.hidden = true;
  windowElement.classList.remove("is-open", "is-focused", "is-dragging", "is-resizing");

  if (appState.focusedWindow === windowElement.dataset.window) {
    appState.focusedWindow = null;
  }

  if (isProjectDetailWindow(windowElement) && appState.activeProjectId === windowElement.dataset.projectId) {
    appState.activeProjectId = null;
  }

}

function getCompactProjectsWindowBounds(stageRect) {
  return {
    width: Math.max(Math.min(stageRect.width - 24, 344), 280),
    height: Math.max(Math.min(stageRect.height - 166, 474), 398),
    left: 12,
  };
}

function centerWindow(windowElement) {
  if (!windowElement || !isDesktopLayout()) {
    return;
  }

  const stageRect = desktopStage.getBoundingClientRect();
  if (isCompactDesktopLayout()) {
    const compactInset = 0;
    const compactProjectsBounds =
      windowElement.dataset.window === "projects-window" ? getCompactProjectsWindowBounds(stageRect) : null;
    const compactWidthInset = windowElement.dataset.window === "projects-window" ? 12 : 6;
    const nextCompactWidth =
      windowElement.dataset.window === "projects-window"
        ? compactProjectsBounds.width
        : Math.max(stageRect.width - compactWidthInset * 2, 280);
    const compactHeight =
      windowElement.dataset.window === "about-window"
        ? Math.max(stageRect.height - 180, 260)
        : windowElement.dataset.window === "chess-window"
          ? Math.max(stageRect.height - 140, 430)
        : windowElement.dataset.window === "projects-window"
          ? compactProjectsBounds.height
        : Math.max(stageRect.height - 88, 320);
    const visibleWindowCount = getAllWindows().filter((entry) => entry !== windowElement && !entry.hidden).length;
    const cascadeStep = Math.min(visibleWindowCount, 3);
    const compactLeft =
      windowElement.dataset.window === "projects-window"
        ? compactProjectsBounds.left
        : Math.max(Math.round((stageRect.width - nextCompactWidth) / 2), compactInset);
    const compactTop =
      (windowElement.dataset.window === "chess-window" ? 12 : 36) + cascadeStep * 14;
    if (windowElement.dataset.window === "chess-window") {
      windowElement.dataset.compactSpawnWidth = String(Math.round(nextCompactWidth));
    }
    windowElement.style.width = `${nextCompactWidth}px`;
    windowElement.style.height = `${compactHeight}px`;
    windowElement.style.left = `${compactLeft}px`;
    windowElement.style.top = `${compactTop}px`;
    return;
  }

  const centeredLeft = clamp(
    Math.round((stageRect.width - windowElement.offsetWidth) / 2),
    16,
    Math.max(stageRect.width - windowElement.offsetWidth - 16, 16),
  );
  const centeredTop = clamp(
    Math.round((stageRect.height - windowElement.offsetHeight) / 2),
    16,
    Math.max(stageRect.height - windowElement.offsetHeight - 16, 16),
  );
  const preferredTop = Number(windowElement.dataset.preferTop);
  const visibleWindowCount = getAllWindows().filter((entry) => entry !== windowElement && !entry.hidden).length;
  const cascadeStep = Math.min(visibleWindowCount, 3);
  const nextLeft = clamp(
    centeredLeft + cascadeStep * 26,
    16,
    Math.max(stageRect.width - windowElement.offsetWidth - 16, 16),
  );
  const nextTop = clamp(
    (Number.isFinite(preferredTop) ? preferredTop : centeredTop) + cascadeStep * 18,
    16,
    Math.max(stageRect.height - windowElement.offsetHeight - 16, 16),
  );

  windowElement.style.left = `${nextLeft}px`;
  windowElement.style.top = `${nextTop}px`;
}

function focusWindow(windowElement, options = {}) {
  const { playSound = true } = options;

  if (!windowElement || windowElement.hidden) {
    return false;
  }

  const focusChanged = appState.focusedWindow !== windowElement.dataset.window;
  appState.highestZIndex += 1;
  appState.focusedWindow = windowElement.dataset.window;
  if (isProjectDetailWindow(windowElement)) {
    appState.activeProjectId = windowElement.dataset.projectId || null;
  }
  windowElement.style.zIndex = String(appState.highestZIndex);

  getAllWindows().forEach((entry) => {
    entry.classList.toggle("is-focused", entry === windowElement && !entry.hidden);
  });

  syncOpeners();
  syncCurrentAppLabel();

  if (playSound && focusChanged) {
    playUiSound("focus");
  }

  return focusChanged;
}

function openWindowElement(windowElement, options = {}) {
  const { playSound = true } = options;
  if (!windowElement) {
    return;
  }

  hydrateDeferredWindowAssets(windowElement);
  cancelWindowCloseAnimation(windowElement);

  const wasHidden = windowElement.hidden;
  windowElement.hidden = false;
  windowElement.classList.add("is-open");

  if (wasHidden) {
    if (windowElement.classList.contains("is-maximized")) {
      const bounds = getMaximizedWindowBounds(windowElement);
      if (bounds) {
        applyWindowBounds(windowElement, bounds);
      }
    } else {
      centerWindow(windowElement);
    }
  }

  const focusChanged = focusWindow(windowElement, { playSound: playSound && !wasHidden });
  syncWindowMaximizeButton(windowElement);

  if (wasHidden && playSound) {
    playUiSound("open");
  } else if (!focusChanged && playSound) {
    playUiSound("click");
  }

  if (windowElement.dataset.window === "chess-window") {
    chessController?.onOpen();
  }

  requestCustomScrollbarSync();
}

async function openWindow(targetId, options = {}) {
  const { playSound = true, projectsCategoryId = null, projectsAllowBack = projectsCategoryId !== null } = options;
  if (targetId === "chess-window") {
    try {
      await ensureChessWindowLoaded();
    } catch (error) {
      console.error("Failed to load chess window.", error);
      return;
    }
  }
  const windowElement = getWindowElement(targetId);
  if (!windowElement) {
    return;
  }

  ensureWindowReady(windowElement);
  closeMenus();

  if (targetId === "projects-window") {
    renderProjectsBrowser(projectsCategoryId, { allowBack: projectsAllowBack });
  }

  openWindowElement(windowElement, { playSound });
}

function runDeferredStartup() {
  seedDesktopItemBases();
  initializeDesktopTrashPosition();
  attachDesktopTrashDragging();

  openButtons.forEach((button) => {
    if (button.classList.contains("desktop-icon")) {
      attachDesktopIconDragging(button);
    }
  });

  document.querySelectorAll("[data-rename-label]").forEach((labelElement) => {
    if (!labelElement.dataset.iconLabel) {
      labelElement.dataset.iconLabel = normalizeIconLabel(labelElement.textContent || "");
    }
    setRenameLabelText(labelElement, labelElement.dataset.iconLabel);
  });

  if (window.ResizeObserver) {
    customScrollbarObserver = new ResizeObserver(() => {
      requestCustomScrollbarSync();
    });

    const visibleWindows = getAllWindows().filter((windowElement) => !windowElement.hidden);
    const visibleWindowBodies = visibleWindows
      .map((windowElement) => windowElement.querySelector(".window-body"))
      .filter(Boolean);

    visibleWindows.forEach((windowElement) => {
      customScrollbarObserver.observe(windowElement);
    });

    visibleWindowBodies.forEach((scrollBody) => {
      customScrollbarObserver.observe(scrollBody);
    });
  }

  requestCustomScrollbarSync();
  refreshCoveredDesktopIcons();
}

function scheduleDeferredStartup() {
  const run = () => {
    window.setTimeout(runDeferredStartup, 0);
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 1200 });
    return;
  }

  window.requestAnimationFrame(() => {
    window.setTimeout(runDeferredStartup, 0);
  });
}

function animateProjectsDesktopIcon() {
  if (!projectsDesktopIcon || !projectsDesktopIconImage) {
    return 0;
  }

  if (projectsFolderTimer) {
    window.clearTimeout(projectsFolderTimer);
  }

  projectsDesktopIcon.classList.remove("is-opening");
  projectsDesktopIconImage.src = PROJECTS_FOLDER_ICON;
  void projectsDesktopIcon.offsetWidth;

  projectsDesktopIcon.classList.add("is-opening");
  projectsDesktopIconImage.src = PROJECTS_FOLDER_OPEN_ICON;

  projectsFolderTimer = window.setTimeout(() => {
    projectsDesktopIcon.classList.remove("is-opening");
    projectsDesktopIconImage.src = PROJECTS_FOLDER_ICON;
    projectsFolderTimer = null;
  }, 240);

  return 150;
}

function animateDesktopFolderButton(button) {
  const icon = button?.querySelector(".icon");
  const defaultIcon = button?.dataset.stageDefaultIcon;
  const openIcon = button?.dataset.stageOpenIcon;

  if (!button || !icon || !defaultIcon || !openIcon) {
    return 0;
  }

  button.classList.remove("is-opening");
  icon.src = defaultIcon;
  void button.offsetWidth;

  button.classList.add("is-opening");
  icon.src = openIcon;

  window.setTimeout(() => {
    button.classList.remove("is-opening");
    icon.src = defaultIcon;
  }, 240);

  return 150;
}

function openDesktopBaseAction(button) {
  const baseId = button.dataset.desktopBaseId;
  const base = desktopItemBases.get(baseId);
  if (!base) {
    return;
  }

  if (base.action.type === "projects-window") {
    const delay = base.kind === "folder" ? animateDesktopFolderButton(button) : 0;
    window.setTimeout(() => {
      openWindow("projects-window", {
        projectsCategoryId: base.action.categoryId || null,
        projectsAllowBack: false,
      });
    }, delay);
    return;
  }

  if (base.action.type === "chess-window") {
    openWindow("chess-window");
    return;
  }

  if (base.action.type === "system-overlay") {
    showSystemOverlay(base.action.kind);
    return;
  }

  if (base.action.type === "project-detail") {
    const project = openProjectDetailWindow(base.action.projectId);
    if (!project) {
      return;
    }
  }
}

function attachDynamicDesktopItem(button) {
  button.addEventListener("click", (event) => {
    if (button.dataset.suppressOpen === "true") {
      button.dataset.suppressOpen = "false";
      return;
    }

    if (!shouldUseSingleTapOpen(event)) {
      return;
    }

    openDesktopBaseAction(button);
  });

  attachDesktopIconDragging(button);
}

function getDesktopDescriptorFromStageItem(itemButton) {
  const labelElement = itemButton.querySelector(".project-stage-label");
  const label = labelElement?.dataset.iconLabel?.trim() || labelElement?.textContent?.trim();
  const icon = itemButton.querySelector(".project-stage-icon")?.getAttribute("src");
  const openIcon = itemButton.dataset.stageOpenIcon || "";
  const desktopKind =
    itemButton.dataset.stageItemKind === "chess"
      ? "chess"
      : itemButton.dataset.stageItemKind === "document"
        ? "document"
        : "folder";

  if (!label || !icon) {
    return null;
  }

  if (itemButton.dataset.stageBaseId) {
    const base = desktopItemBases.get(itemButton.dataset.stageBaseId);
    if (base) {
      return getDesktopDescriptorForBase(base);
    }
  }

  if (itemButton.dataset.projectCategory) {
    return {
      baseId: `desktop-category-${itemButton.dataset.projectCategory}`,
      kind: desktopKind,
      label,
      icon,
      openIcon,
      action: { type: "projects-window", categoryId: itemButton.dataset.projectCategory },
    };
  }

  if (itemButton.dataset.stageWindow) {
    return {
      baseId: itemButton.dataset.replayAboutIntro === "true" ? "desktop-about-intro" : `desktop-window-${itemButton.dataset.stageWindow}`,
      kind: desktopKind,
      label,
      icon,
      openIcon,
      action:
        itemButton.dataset.replayAboutIntro === "true"
          ? { type: "about-intro" }
          : { type: itemButton.dataset.stageWindow },
    };
  }

  if (itemButton.dataset.systemOverlay) {
    return {
      baseId: `desktop-system-overlay-${itemButton.dataset.systemOverlay}`,
      kind: desktopKind,
      label,
      icon,
      openIcon,
      action: { type: "system-overlay", kind: itemButton.dataset.systemOverlay },
    };
  }

  if (itemButton.dataset.projectId) {
    return {
      baseId: `desktop-project-${itemButton.dataset.projectId}`,
      kind: "document",
      label,
      icon,
      openIcon,
      action: { type: "project-detail", projectId: itemButton.dataset.projectId },
    };
  }

  return null;
}

function placeDesktopDescriptor(descriptor, position, options = {}) {
  const { animate = false } = options;
  const base = ensureDesktopBaseFromDescriptor(descriptor, position);
  if (!base) {
    return null;
  }
  clearDesktopBaseRespawnTimers(base);

  if (!base.originalIsStatic && base.originalInstanceId) {
    const record = dynamicDesktopItems.get(base.originalInstanceId);
    if (record) {
      updateDesktopBaseSlot(base, "original", position);
      showDynamicDesktopItem(record, base.originalPosition, { animate });
    }
  }

  return base;
}

function openProjectsWindowWithCue(options = {}) {
  const { playSound = true } = options;

  closeMenus();

  if (projectsWindowOpenTimer) {
    window.clearTimeout(projectsWindowOpenTimer);
    projectsWindowOpenTimer = null;
  }

  const delay = animateProjectsDesktopIcon();
  if (!delay) {
    openWindow("projects-window", { playSound });
    return;
  }

  projectsWindowOpenTimer = window.setTimeout(() => {
    openWindow("projects-window", { playSound });
    projectsWindowOpenTimer = null;
  }, delay);
}

function closeWindow(windowElement) {
  if (!windowElement || windowElement.hidden || closingWindowTimers.has(windowElement)) {
    return;
  }

  playUiSound("close");
  windowElement.classList.add("is-closing");

  const closeTimer = window.setTimeout(() => {
    closingWindowTimers.delete(windowElement);
    hideWindow(windowElement, { playSound: false });
    syncOpeners();
    syncCurrentAppLabel();
    requestCustomScrollbarSync();
  }, WINDOW_CLOSE_FADE_MS);

  closingWindowTimers.set(windowElement, closeTimer);
}

function getWindowMinimumSize(windowElement) {
  return {
    width: Number(windowElement?.dataset.minWidth) || MIN_WINDOW_WIDTH,
    height: Number(windowElement?.dataset.minHeight) || MIN_WINDOW_HEIGHT,
  };
}

function getMaximizedWindowBounds(windowElement) {
  if (!desktopStage || !windowElement) {
    return null;
  }

  const stageRect = desktopStage.getBoundingClientRect();
  const minSize = getWindowMinimumSize(windowElement);
  return {
    left: 16,
    top: 16,
    width: Math.max(stageRect.width - 32, minSize.width),
    height: Math.max(stageRect.height - 32, minSize.height),
  };
}

function applyWindowBounds(windowElement, bounds) {
  if (!windowElement || !bounds) {
    return;
  }

  windowElement.style.left = `${Math.round(bounds.left)}px`;
  windowElement.style.top = `${Math.round(bounds.top)}px`;
  windowElement.style.width = `${Math.round(bounds.width)}px`;
  windowElement.style.height = `${Math.round(bounds.height)}px`;
}

function windowCanMaximize(windowElement) {
  return Boolean(
    windowElement &&
      windowElement.dataset.disableMaximize !== "true" &&
      windowElement.querySelector("[data-toggle-maximize]"),
  );
}

function syncWindowMaximizeButton(windowElement) {
  const maximizeButton = windowElement?.querySelector("[data-toggle-maximize]");
  if (!maximizeButton) {
    return;
  }

  const isMaximized = windowElement.classList.contains("is-maximized");
  maximizeButton.classList.toggle("is-active", isMaximized);
  maximizeButton.setAttribute("aria-pressed", String(isMaximized));
  maximizeButton.setAttribute("aria-label", isMaximized ? "Restore window size" : "Expand window");
}

function maximizeWindow(windowElement) {
  if (!windowCanMaximize(windowElement) || !isDesktopLayout()) {
    return;
  }

  const stageRect = desktopStage.getBoundingClientRect();
  const windowRect = windowElement.getBoundingClientRect();
  maximizedWindowBounds.set(windowElement, {
    left: windowRect.left - stageRect.left,
    top: windowRect.top - stageRect.top,
    width: windowElement.offsetWidth,
    height: windowElement.offsetHeight,
  });

  const bounds = getMaximizedWindowBounds(windowElement);
  if (!bounds) {
    return;
  }

  windowElement.classList.add("is-maximized");
  applyWindowBounds(windowElement, bounds);
  syncWindowMaximizeButton(windowElement);
  if (windowElement.dataset.window === "chess-window") {
    chessController?.onMaximize();
  }
  requestCustomScrollbarSync();
}

function restoreWindowSize(windowElement) {
  if (!windowElement) {
    return;
  }

  const previousBounds = maximizedWindowBounds.get(windowElement);
  windowElement.classList.remove("is-maximized");

  if (previousBounds) {
    applyWindowBounds(windowElement, previousBounds);
  }

  syncWindowMaximizeButton(windowElement);
  if (windowElement.dataset.window === "chess-window") {
    chessController?.onRestore();
  }
  requestCustomScrollbarSync();
}

function toggleWindowMaximize(windowElement, options = {}) {
  const { playSound = true } = options;
  if (!windowCanMaximize(windowElement) || !isDesktopLayout()) {
    return;
  }

  if (windowElement.classList.contains("is-maximized")) {
    restoreWindowSize(windowElement);
  } else {
    maximizeWindow(windowElement);
  }

  focusWindow(windowElement, { playSound: false });
  if (playSound) {
    playUiSound("click");
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function isCompactDesktopLayout() {
  return window.innerWidth <= COMPACT_DESKTOP_BREAKPOINT;
}

function isTouchPrimaryDevice() {
  return window.matchMedia?.("(pointer: coarse)")?.matches || (navigator.maxTouchPoints || 0) > 0;
}

function shouldUseSingleTapOpen(event) {
  return isCompactDesktopLayout() || isTouchPrimaryDevice() || event.detail >= 2;
}

function isDesktopLayout() {
  return true;
}

function syncCustomScrollbar(scrollBody) {
  const chrome = customScrollbarMap.get(scrollBody);
  if (!chrome) {
    return;
  }

  const { root, track, thumb, upButton, downButton, windowElement } = chrome;
  const canRenderChrome = isDesktopLayout() && !windowElement.hidden;

  if (!canRenderChrome) {
    windowElement.classList.remove("has-visible-scrollbar");
    root.hidden = true;
    root.classList.remove("is-disabled");
    upButton.disabled = true;
    downButton.disabled = true;
    return;
  }

  root.hidden = false;
  windowElement.classList.remove("has-visible-scrollbar");

  let scrollRange = Math.max(scrollBody.scrollHeight - scrollBody.clientHeight, 0);
  let trackHeight = Math.max(track.clientHeight, 0);
  const shouldShow = trackHeight > 0 && scrollRange > 10;

  if (!shouldShow) {
    root.hidden = true;
    root.classList.remove("is-disabled");
    upButton.disabled = true;
    downButton.disabled = true;
    return;
  }

  windowElement.classList.add("has-visible-scrollbar");
  root.hidden = false;
  scrollRange = Math.max(scrollBody.scrollHeight - scrollBody.clientHeight, 0);
  trackHeight = Math.max(track.clientHeight, 0);

  root.classList.remove("is-disabled");
  upButton.disabled = false;
  downButton.disabled = false;

  const thumbHeight = clamp(
    Math.round((scrollBody.clientHeight / scrollBody.scrollHeight) * trackHeight),
    34,
    trackHeight - CUSTOM_SCROLLBAR_THUMB_INSET * 2,
  );
  const thumbTravel = Math.max(trackHeight - thumbHeight - CUSTOM_SCROLLBAR_THUMB_INSET * 2, 0);
  const thumbTop = Math.round((scrollBody.scrollTop / scrollRange) * thumbTravel);

  thumb.style.height = `${thumbHeight}px`;
  thumb.style.transform = `translateY(${thumbTop}px)`;
}

function requestCustomScrollbarSync() {
  if (scrollbarSyncFrame) {
    return;
  }

  scrollbarSyncFrame = window.requestAnimationFrame(() => {
    scrollbarSyncFrame = null;
    customScrollbarMap.forEach((_, scrollBody) => {
      syncCustomScrollbar(scrollBody);
    });
  });
}

function attachCustomScrollbar(windowElement) {
  if (!windowElement || windowElement.dataset.disableCustomScrollbar === "true") {
    return;
  }

  const scrollBody = windowElement.querySelector(".window-body");
  if (!scrollBody) {
    return;
  }

  windowElement.classList.add("has-custom-scrollbar");

  const scrollbar = document.createElement("div");
  scrollbar.className = "window-scrollbar";
  scrollbar.innerHTML = `
    <button class="window-scrollbar-button window-scrollbar-button-up" type="button" tabindex="-1" aria-label="Scroll up">
      <span class="window-scrollbar-arrow"></span>
    </button>
    <div class="window-scrollbar-track">
      <div class="window-scrollbar-thumb"></div>
    </div>
    <button class="window-scrollbar-button window-scrollbar-button-down" type="button" tabindex="-1" aria-label="Scroll down">
      <span class="window-scrollbar-arrow"></span>
    </button>
  `;

  windowElement.append(scrollbar);

  const upButton = scrollbar.querySelector(".window-scrollbar-button-up");
  const downButton = scrollbar.querySelector(".window-scrollbar-button-down");
  const track = scrollbar.querySelector(".window-scrollbar-track");
  const thumb = scrollbar.querySelector(".window-scrollbar-thumb");

  if (!upButton || !downButton || !track || !thumb) {
    scrollbar.remove();
    return;
  }

  customScrollbarMap.set(scrollBody, {
    root: scrollbar,
    upButton,
    downButton,
    track,
    thumb,
    windowElement,
  });

  const scrollStep = 96;
  const dragState = {
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
  };

  upButton.addEventListener("click", (event) => {
    event.stopPropagation();
    scrollBody.scrollBy({ top: -scrollStep, behavior: "auto" });
    playUiSound("click");
  });

  downButton.addEventListener("click", (event) => {
    event.stopPropagation();
    scrollBody.scrollBy({ top: scrollStep, behavior: "auto" });
    playUiSound("click");
  });

  track.addEventListener("pointerdown", (event) => {
    if (event.target !== track) {
      return;
    }

    event.stopPropagation();
    const thumbRect = thumb.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const direction = event.clientY < thumbRect.top ? -1 : 1;
    const pageStep = Math.max(scrollBody.clientHeight - 40, 80) * direction;
    scrollBody.scrollBy({ top: pageStep, behavior: "auto" });
    playUiSound("click");
    syncCustomScrollbar(scrollBody);

    if (trackRect.height === 0) {
      return;
    }
  });

  thumb.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragState.pointerId = event.pointerId;
    dragState.startY = event.clientY;
    dragState.startScrollTop = scrollBody.scrollTop;
    thumb.setPointerCapture(event.pointerId);
    scrollbar.classList.add("is-dragging");
    focusWindow(windowElement, { playSound: false });
    playUiSound("drag");
  });

  thumb.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    const scrollRange = Math.max(scrollBody.scrollHeight - scrollBody.clientHeight, 0);
    const trackTravel = Math.max(track.clientHeight - thumb.offsetHeight, 1);
    if (scrollRange <= 0 || trackTravel <= 0) {
      return;
    }

    const deltaY = event.clientY - dragState.startY;
    const scrollRatio = scrollRange / trackTravel;
    scrollBody.scrollTop = dragState.startScrollTop + deltaY * scrollRatio;
    syncCustomScrollbar(scrollBody);
  });

  function finishThumbDrag(event) {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.pointerId = null;
    scrollbar.classList.remove("is-dragging");

    if (thumb.hasPointerCapture(event.pointerId)) {
      thumb.releasePointerCapture(event.pointerId);
    }

    playUiSound("drop");
  }

  thumb.addEventListener("pointerup", finishThumbDrag);
  thumb.addEventListener("pointercancel", finishThumbDrag);
  scrollBody.addEventListener("scroll", () => syncCustomScrollbar(scrollBody), { passive: true });
}

function createEdgeResizeHandles(windowElement) {
  return RESIZE_DIRECTIONS.map((direction) => {
    const edgeHandle = document.createElement("div");
    edgeHandle.className = `window-edge-resizer window-edge-resizer-${direction}`;
    edgeHandle.dataset.resizeEdge = direction;
    edgeHandle.setAttribute("aria-hidden", "true");
    windowElement.append(edgeHandle);
    return edgeHandle;
  });
}

function shouldCancelPointerDragFromButtons(event) {
  return event.pointerType === "mouse" && event.buttons === 0;
}

function attachDragging(windowElement) {
  const handle = windowElement.querySelector("[data-drag-handle]");
  if (!handle) {
    return;
  }

  const dragState = {
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    frame: 0,
    pendingLeft: null,
    pendingTop: null,
  };

  function flushDraggingFrame() {
    dragState.frame = 0;
    if (dragState.pendingLeft === null || dragState.pendingTop === null) {
      return;
    }

    windowElement.style.left = `${Math.round(dragState.pendingLeft)}px`;
    windowElement.style.top = `${Math.round(dragState.pendingTop)}px`;
    refreshCoveredDesktopIcons();
  }

  function clearDragging(pointerId = null) {
    dragState.pointerId = null;
    if (dragState.frame) {
      window.cancelAnimationFrame(dragState.frame);
      dragState.frame = 0;
    }
    dragState.pendingLeft = null;
    dragState.pendingTop = null;
    windowElement.classList.remove("is-dragging");

    if (pointerId !== null && handle.hasPointerCapture(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }
  }

  handle.addEventListener("pointerdown", (event) => {
    if (
      !isDesktopLayout() ||
      event.button !== 0 ||
      event.target.closest(".titlebar-action") ||
      windowElement.classList.contains("is-maximized")
    ) {
      return;
    }

    event.preventDefault();
    const windowRect = windowElement.getBoundingClientRect();
    dragState.pointerId = event.pointerId;
    dragState.offsetX = event.clientX - windowRect.left;
    dragState.offsetY = event.clientY - windowRect.top;

    handle.setPointerCapture(event.pointerId);
    windowElement.classList.add("is-dragging");
    focusWindow(windowElement, { playSound: false });
    playUiSound("drag");
  });

  handle.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId || !isDesktopLayout()) {
      return;
    }

    if (shouldCancelPointerDragFromButtons(event)) {
      clearDragging(event.pointerId);
      playUiSound("drop");
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const stageRect = desktopStage.getBoundingClientRect();
    const compactInset = isCompactDesktopLayout() ? 0 : 16;
    const nextLeft = clamp(
      event.clientX - stageRect.left - dragState.offsetX,
      compactInset,
      Math.max(stageRect.width - windowElement.offsetWidth - compactInset, compactInset),
    );
    const nextTop = clamp(
      event.clientY - stageRect.top - dragState.offsetY,
      compactInset,
      Math.max(stageRect.height - windowElement.offsetHeight - compactInset, compactInset),
    );

    dragState.pendingLeft = nextLeft;
    dragState.pendingTop = nextTop;
    if (!dragState.frame) {
      dragState.frame = window.requestAnimationFrame(flushDraggingFrame);
    }
  });

  function finishDragging(event) {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    clearDragging(event.pointerId);
    playUiSound("drop");
    refreshCoveredDesktopIcons();
  }

  handle.addEventListener("pointerup", finishDragging);
  handle.addEventListener("pointercancel", finishDragging);
  handle.addEventListener("lostpointercapture", (event) => {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    clearDragging();
    refreshCoveredDesktopIcons();
  });

  handle.addEventListener("dblclick", (event) => {
    if (
      !isDesktopLayout() ||
      isCompactDesktopLayout() ||
      event.target.closest(".titlebar-action") ||
      !windowCanMaximize(windowElement)
    ) {
      return;
    }

    event.preventDefault();
    toggleWindowMaximize(windowElement);
  });
}

function attachDesktopIconDragging(iconButton) {
  if (iconButton.dataset.desktopDragAttached === "true") {
    return;
  }

  iconButton.dataset.desktopDragAttached = "true";
  const dragState = {
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    startLeft: 0,
    startTop: 0,
    didMove: false,
    dragLayerActive: false,
    useDragLayer: false,
    groupItems: [],
  };

  iconButton.addEventListener("pointerdown", (event) => {
    if (!isDesktopLayout() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    clearDesktopDragProxies();
    const iconRect = iconButton.getBoundingClientRect();
    dragState.pointerId = event.pointerId;
    dragState.offsetX = event.clientX - iconRect.left;
    dragState.offsetY = event.clientY - iconRect.top;
    dragState.startLeft = parseFloat(iconButton.style.left) || 0;
    dragState.startTop = parseFloat(iconButton.style.top) || 0;
    dragState.didMove = false;
    dragState.dragLayerActive = false;
    const dragSelectedGroup =
      appState.selectedDesktopItemIds.has(iconButton.dataset.desktopItemId) && appState.selectedDesktopItemIds.size > 1;
    const dragButtons = dragSelectedGroup
      ? getSelectableDesktopIcons().filter((button) => appState.selectedDesktopItemIds.has(button.dataset.desktopItemId))
      : [iconButton];
    dragState.groupItems = dragButtons.map((button) => ({
      button,
      baseId: button.dataset.desktopBaseId || "",
      instanceRole: button.dataset.desktopInstanceRole || "original",
      kind: button.dataset.desktopKind || "folder",
      isAnchor: button === iconButton,
      startLeft: parseFloat(button.style.left) || 0,
      startTop: parseFloat(button.style.top) || 0,
      width: button.offsetWidth,
      height: button.offsetHeight,
      stageWidth: getProjectStageWidthForBase(desktopItemBases.get(button.dataset.desktopBaseId || "")),
      proxy: null,
    }));
    const activeProjectsViewKey = getProjectStageViewKey(appState.activeProjectCategory);
    dragState.useDragLayer = dragState.groupItems.some((item) => {
      const base = desktopItemBases.get(item.baseId);
      return Boolean(
        base &&
          (Boolean(getProjectStageSourceForBase(base)) || canInsertBaseIntoProjectView(base, activeProjectsViewKey)),
      );
    });

    iconButton.setPointerCapture(event.pointerId);
    dragState.groupItems.forEach((item) => {
      item.button.classList.add("is-dragging");
    });
  });

  iconButton.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId || !isDesktopLayout()) {
      return;
    }

    if (shouldCancelPointerDragFromButtons(event)) {
      finishDragging(event);
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const stageRect = desktopStage.getBoundingClientRect();
    const nextLeft = clamp(
      event.clientX - stageRect.left - dragState.offsetX,
      DESKTOP_EDGE_INSET,
      Math.max(stageRect.width - iconButton.offsetWidth - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
    );
    const nextTop = clamp(
      event.clientY - stageRect.top - dragState.offsetY,
      DESKTOP_EDGE_INSET,
      Math.max(stageRect.height - iconButton.offsetHeight - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
    );

    const movedEnough =
      Math.abs(event.movementX) > 0 ||
      Math.abs(event.movementY) > 0 ||
      dragState.didMove;

    if (!dragState.didMove && movedEnough) {
      playUiSound("drag");
    }

    dragState.didMove = movedEnough;
    if (dragState.didMove && dragState.useDragLayer && !dragState.dragLayerActive) {
      pushDesktopDragLayer();
      dragState.groupItems.forEach((item) => {
        item.proxy = createDesktopDragProxyFromButton(item.button);
        item.button.classList.add("is-proxy-hidden");
      });
      dragState.dragLayerActive = true;
    }

    const deltaX = nextLeft - dragState.startLeft;
    const deltaY = nextTop - dragState.startTop;
    dragState.groupItems.forEach((item) => {
      const itemLeft = clamp(
        item.startLeft + deltaX,
        DESKTOP_EDGE_INSET,
        Math.max(stageRect.width - item.width - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
      );
      const itemTop = clamp(
        item.startTop + deltaY,
        DESKTOP_EDGE_INSET,
        Math.max(stageRect.height - item.height - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
      );

      item.button.style.left = `${Math.round(itemLeft)}px`;
      item.button.style.top = `${Math.round(itemTop)}px`;
      if (item.proxy) {
        item.proxy.style.left = `${Math.round(itemLeft)}px`;
        item.proxy.style.top = `${Math.round(itemTop)}px`;
      }
    });
    setDesktopTrashTargetState(isPointerOverTrash(event.clientX, event.clientY));
  });

  function finishDragging(event) {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.pointerId = null;
    dragState.groupItems.forEach((item) => {
      item.button.classList.remove("is-dragging");
    });

    if (iconButton.hasPointerCapture(event.pointerId)) {
      iconButton.releasePointerCapture(event.pointerId);
    }

    if (dragState.didMove) {
      dragState.groupItems.forEach((item) => {
        item.button.dataset.suppressOpen = "true";
      });

      const droppedOnTrash = isPointerOverTrash(event.clientX, event.clientY);
      const anchorBaseId = iconButton.dataset.desktopBaseId;
      const projectsWindowDropTarget = anchorBaseId
        ? getProjectsWindowDropTarget(event.clientX, event.clientY, anchorBaseId)
        : null;
      const droppedOnProjectsWindowBody =
        anchorBaseId && !projectsWindowDropTarget
          ? isPointerOverProjectsWindowBody(event.clientX, event.clientY, anchorBaseId)
          : false;
      const projectsWindowDropPosition =
        projectsWindowDropTarget
          ? getProjectStageVisibleDropPositionForBase(
              event.clientX,
              event.clientY,
              desktopItemBases.get(anchorBaseId),
              dragState.groupItems.find((item) => item.isAnchor)?.stageWidth || null,
            )
          : null;
      const projectsDropTarget = getProjectsDesktopDropTarget(event.clientX, event.clientY, iconButton);

      if (droppedOnTrash) {
        const trashableItems = dragState.groupItems.filter((item) => Boolean(item.baseId));
        const overflowDrop = wouldTrashExceedDuplicationLimit(trashableItems.length);
        dragState.groupItems.forEach((item) => {
          if (!item.baseId) {
            return;
          }

          if (trashDesktopItemBase(item.baseId, item.instanceRole, { overflowDrop, triggerExplosion: false })) {
            appState.selectedDesktopItemIds.delete(item.button.dataset.desktopItemId);
          }
        });

        if (overflowDrop) {
          scheduleTrashOverflowDisable(TRASH_RESPAWN_DELAY_MS + TRASH_EJECT_ANIMATION_MS);
        }

        syncDesktopSelection();
      } else if (projectsWindowDropTarget) {
        const stageRect = projectsBrowserList?.getBoundingClientRect();
        const desktopRect = desktopStage?.getBoundingClientRect();
        dragState.groupItems.forEach((item) => {
          if (!item.baseId) {
            return;
          }

          const base = desktopItemBases.get(item.baseId);
          const currentLeft = parseFloat(item.proxy?.style.left || item.button.style.left || "") || item.startLeft;
          const currentTop = parseFloat(item.proxy?.style.top || item.button.style.top || "") || item.startTop;
          const rawStagePosition =
            stageRect && desktopRect
              ? {
                  x: currentLeft - (stageRect.left - desktopRect.left),
                  y: currentTop - (stageRect.top - desktopRect.top),
                }
              : projectsWindowDropPosition;
          const dropPosition = getProjectStageVisibleTopLeftPosition(rawStagePosition, base, item.stageWidth);

          if (
            insertDesktopItemIntoProjectsView(
              item.baseId,
              item.instanceRole,
              projectsWindowDropTarget.viewKey,
              dropPosition,
              item.stageWidth,
              true,
            )
          ) {
            appState.selectedDesktopItemIds.delete(item.button.dataset.desktopItemId);
          }
        });
        syncDesktopSelection();
        playUiSound("drop");
      } else if (droppedOnProjectsWindowBody) {
        const stageRect = projectsBrowserList?.getBoundingClientRect();
        const desktopRect = desktopStage?.getBoundingClientRect();
        dragState.groupItems.forEach((item) => {
          const targetViewKey = getProjectStageViewKey(appState.activeProjectCategory);
          const base = item.baseId ? desktopItemBases.get(item.baseId) : null;
          const currentLeft = parseFloat(item.proxy?.style.left || item.button.style.left || "") || item.startLeft;
          const currentTop = parseFloat(item.proxy?.style.top || item.button.style.top || "") || item.startTop;
          const rawStagePosition =
            stageRect && desktopRect
              ? {
                  x: currentLeft - (stageRect.left - desktopRect.left),
                  y: currentTop - (stageRect.top - desktopRect.top),
                }
              : null;
          const dropPosition = base ? getProjectStageVisibleTopLeftPosition(rawStagePosition, base, item.stageWidth) : null;
          if (
            item.baseId &&
            insertDesktopItemIntoProjectsView(
              item.baseId,
              item.instanceRole,
              targetViewKey,
              dropPosition,
              item.stageWidth,
              true,
            )
          ) {
            appState.selectedDesktopItemIds.delete(item.button.dataset.desktopItemId);
          }
        });
        syncDesktopSelection();
        playUiSound("drop");
      } else if (projectsDropTarget) {
        dragState.groupItems.forEach((item) => {
          if (item.baseId && restoreDesktopItemToProjects(item.baseId, item.instanceRole)) {
            appState.selectedDesktopItemIds.delete(item.button.dataset.desktopItemId);
          }
        });
        syncDesktopSelection();
        animateDesktopFolderButton(projectsDropTarget);
        playUiSound("drop");
      } else {
        dragState.groupItems.forEach((item) => {
          if (!item.baseId) {
            return;
          }

          const base = desktopItemBases.get(item.baseId);
          if (base) {
            updateDesktopBaseSlot(base, item.instanceRole, {
              x: parseFloat(item.button.style.left) || 0,
              y: parseFloat(item.button.style.top) || 0,
            });
          }
        });

        playUiSound("drop");
      }

      dragState.groupItems.forEach((item) => {
        window.setTimeout(() => {
          item.button.dataset.suppressOpen = "false";
        }, 0);
      });
    }

    setDesktopTrashTargetState(false);
    if (dragState.dragLayerActive) {
      dragState.groupItems.forEach((item) => {
        item.button.classList.remove("is-proxy-hidden");
        if (item.proxy) {
          item.proxy.remove();
          item.proxy = null;
        }
      });
      popDesktopDragLayer();
      dragState.dragLayerActive = false;
    }
  }

  iconButton.addEventListener("pointerup", finishDragging);
  iconButton.addEventListener("pointercancel", finishDragging);
  iconButton.addEventListener("lostpointercapture", finishDragging);
}

function attachDesktopTrashDragging() {
  if (!desktopTrash || desktopTrash.dataset.dragAttached === "true") {
    return;
  }

  desktopTrash.dataset.dragAttached = "true";
  desktopTrash.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  const dragState = {
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
  };

  desktopTrash.addEventListener("pointerdown", (event) => {
    if (!isDesktopLayout() || isCompactDesktopLayout() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const trashRect = desktopTrash.getBoundingClientRect();
    dragState.pointerId = event.pointerId;
    dragState.offsetX = event.clientX - trashRect.left;
    dragState.offsetY = event.clientY - trashRect.top;

    desktopTrash.setPointerCapture(event.pointerId);
    desktopTrash.classList.add("is-dragging");
  });

  desktopTrash.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId || !isDesktopLayout() || isCompactDesktopLayout()) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const stageRect = desktopStage.getBoundingClientRect();
    const nextLeft = clamp(
      event.clientX - stageRect.left - dragState.offsetX,
      DESKTOP_EDGE_INSET,
      Math.max(stageRect.width - desktopTrash.offsetWidth - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
    );
    const nextTop = clamp(
      event.clientY - stageRect.top - dragState.offsetY,
      DESKTOP_EDGE_INSET,
      Math.max(stageRect.height - desktopTrash.offsetHeight - DESKTOP_EDGE_INSET, DESKTOP_EDGE_INSET),
    );

    desktopTrash.style.left = `${Math.round(nextLeft)}px`;
    desktopTrash.style.top = `${Math.round(nextTop)}px`;
  });

  function finishDragging(event) {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.pointerId = null;
    desktopTrash.classList.remove("is-dragging");

    if (desktopTrash.hasPointerCapture(event.pointerId)) {
      desktopTrash.releasePointerCapture(event.pointerId);
    }
  }

  desktopTrash.addEventListener("pointerup", finishDragging);
  desktopTrash.addEventListener("pointercancel", finishDragging);
}

function attachProjectStageItemDragging(itemButton, stageElement, viewKey) {
  const itemId = itemButton.dataset.stageItemId;
  if (!itemId) {
    return;
  }

  const dragState = {
    pointerId: null,
    offsetX: 0,
    offsetY: 0,
    startLeft: 0,
    startTop: 0,
    didMove: false,
    groupItems: [],
  };

  itemButton.addEventListener("pointerdown", (event) => {
    if (!isDesktopLayout() || event.button !== 0) {
      return;
    }

    event.preventDefault();
    clearDesktopDragProxies();
    pushDesktopDragLayer();
    const itemRect = itemButton.getBoundingClientRect();
    dragState.pointerId = event.pointerId;
    dragState.offsetX = event.clientX - itemRect.left;
    dragState.offsetY = event.clientY - itemRect.top;
    dragState.startLeft = parseFloat(itemButton.style.left) || 0;
    dragState.startTop = parseFloat(itemButton.style.top) || 0;
    dragState.didMove = false;
    const dragSelectedGroup =
      appState.selectedProjectStageViewKey === viewKey &&
      appState.selectedProjectStageItemIds.has(itemId) &&
      appState.selectedProjectStageItemIds.size > 1;
    const dragButtons = dragSelectedGroup
      ? getSelectableProjectStageItems(stageElement).filter((button) =>
          appState.selectedProjectStageItemIds.has(button.dataset.stageItemId || ""),
        )
      : [itemButton];
    dragState.groupItems = dragButtons.map((button) => ({
      button,
      itemId: button.dataset.stageItemId || "",
      descriptor: getDesktopDescriptorFromStageItem(button),
      startLeft: parseFloat(button.style.left) || 0,
      startTop: parseFloat(button.style.top) || 0,
      width: button.offsetWidth,
      height: button.offsetHeight,
      proxy: null,
    }));

    itemButton.setPointerCapture(event.pointerId);
    dragState.groupItems.forEach((item) => {
      item.button.classList.add("is-dragging");
    });
    const projectsWindow = windowMap.get("projects-window");
    if (projectsWindow) {
      focusWindow(projectsWindow, { playSound: false });
    }
  });

  itemButton.addEventListener("pointermove", (event) => {
    if (dragState.pointerId !== event.pointerId || !isDesktopLayout()) {
      return;
    }

    if (shouldCancelPointerDragFromButtons(event)) {
      finishDragging(event);
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const stageRect = stageElement.getBoundingClientRect();
    const desktopRect = desktopStage.getBoundingClientRect();
    const pointerInsideStage =
      event.clientX >= stageRect.left &&
      event.clientX <= stageRect.right &&
      event.clientY >= stageRect.top &&
      event.clientY <= stageRect.bottom;
    const pointerInsideDesktop =
      event.clientX >= desktopRect.left &&
      event.clientX <= desktopRect.right &&
      event.clientY >= desktopRect.top &&
      event.clientY <= desktopRect.bottom &&
      !isPointOverVisibleWindow(event.clientX, event.clientY);
    const stageInset = getProjectStageInset();
    const anchorLeft = clamp(
      event.clientX - stageRect.left - dragState.offsetX,
      stageInset,
      Math.max(stageElement.clientWidth - itemButton.offsetWidth - stageInset, stageInset),
    );
    const anchorTop = clamp(
      event.clientY - stageRect.top - dragState.offsetY,
      stageInset,
      Math.max(stageElement.clientHeight - itemButton.offsetHeight - stageInset, stageInset),
    );

    const movedEnough =
      dragState.didMove ||
      Math.abs(event.movementX) > 0 ||
      Math.abs(event.movementY) > 0;

    if (!dragState.didMove && movedEnough) {
      playUiSound("drag");
    }

    dragState.didMove = movedEnough;

    const deltaX = anchorLeft - dragState.startLeft;
    const deltaY = anchorTop - dragState.startTop;

    if (!dragState.groupItems.some((item) => item.proxy) && pointerInsideStage) {
      dragState.groupItems.forEach((item) => {
        const itemLeft = clamp(
          item.startLeft + deltaX,
          stageInset,
          Math.max(stageElement.clientWidth - item.width - stageInset, stageInset),
        );
        const itemTop = clamp(
          item.startTop + deltaY,
          stageInset,
          Math.max(stageElement.clientHeight - item.height - stageInset, stageInset),
        );

        item.button.style.left = `${Math.round(itemLeft)}px`;
        item.button.style.top = `${Math.round(itemTop)}px`;
        getProjectStagePositions(viewKey)[item.itemId] = {
          x: Math.round(itemLeft),
          y: Math.round(itemTop),
          custom: true,
        };
      });
      setDesktopTrashTargetState(false);
      return;
    }

    if (!dragState.groupItems.some((item) => item.proxy) && pointerInsideDesktop) {
      clearDesktopDragProxies();
      dragState.groupItems.forEach((item) => {
        if (!item.descriptor) {
          return;
        }

        const proxy = document.createElement("button");
        proxy.className = `desktop-icon ${
          item.descriptor.kind === "document"
            ? "desktop-icon-document"
            : item.descriptor.kind === "chess"
              ? "desktop-icon-chess"
              : ""
        } is-drag-proxy`.trim();
        proxy.type = "button";
        proxy.tabIndex = -1;
        proxy.innerHTML = `
          <img src="${item.descriptor.icon}" alt="" class="icon" />
          <span data-rename-label data-icon-label="${escapeHtml(item.descriptor.label)}">${getDesktopIconLabelMarkup(item.descriptor.label)}</span>
        `;
        desktopDragLayer?.append(proxy);
        item.proxy = proxy;
        item.button.classList.add("is-proxy-hidden");
      });
    }

    if (dragState.groupItems.some((item) => item.proxy) && pointerInsideDesktop) {
      const anchorKind = dragState.groupItems[0]?.descriptor?.kind || "folder";
      const anchorPosition = clampDesktopItemPosition(
        event.clientX - desktopRect.left - dragState.offsetX,
        event.clientY - desktopRect.top - dragState.offsetY,
        anchorKind,
      );
      dragState.groupItems.forEach((item) => {
        if (!item.proxy) {
          return;
        }

        const proxyPosition = clampDesktopItemPosition(
          anchorPosition.x + (item.startLeft - dragState.startLeft),
          anchorPosition.y + (item.startTop - dragState.startTop),
          item.descriptor?.kind || "folder",
        );
        item.proxy.style.left = `${proxyPosition.x}px`;
        item.proxy.style.top = `${proxyPosition.y}px`;
      });
      setDesktopTrashTargetState(isPointerOverTrash(event.clientX, event.clientY));
    }
  });

  function finishDragging(event) {
    if (dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.pointerId = null;
    dragState.groupItems.forEach((item) => {
      item.button.classList.remove("is-dragging");
    });

    if (itemButton.hasPointerCapture(event.pointerId)) {
      itemButton.releasePointerCapture(event.pointerId);
    }

    if (dragState.didMove) {
      dragState.groupItems.forEach((item) => {
        item.button.dataset.suppressOpen = "true";
      });

      if (dragState.groupItems.some((item) => item.proxy)) {
        const droppedOnTrash = isPointerOverTrash(event.clientX, event.clientY);
        const droppedOnProjectsWindowBody = isPointerOverProjectsWindowBodyRect(event.clientX, event.clientY);

        const proxyPositions = dragState.groupItems.map((item) => ({
          item,
          left: parseFloat(item.proxy?.style.left || "") || 24,
          top: parseFloat(item.proxy?.style.top || "") || 24,
        }));

        dragState.groupItems.forEach((item) => {
          item.proxy?.remove();
          item.proxy = null;
          item.button.classList.remove("is-proxy-hidden");
        });

        if (droppedOnTrash) {
          const trashableItems = proxyPositions.filter(({ item }) => Boolean(item.descriptor));
          const overflowDrop = wouldTrashExceedDuplicationLimit(trashableItems.length);
          trashableItems.forEach(({ item, left, top }) => {
            removeProjectStageItemFromSource(item.button, viewKey);
            const base = placeDesktopDescriptor(item.descriptor, { x: left, y: top });
            if (base && !base.originalIsStatic && base.originalInstanceId) {
              hideDynamicDesktopItem(base.originalInstanceId);
            }
            if (base) {
              trashDesktopItemBase(base.baseId, "original", { overflowDrop, triggerExplosion: false });
            }
            appState.selectedProjectStageItemIds.delete(item.itemId);
          });
          if (overflowDrop) {
            scheduleTrashOverflowDisable(TRASH_RESPAWN_DELAY_MS + TRASH_EJECT_ANIMATION_MS);
          }
          syncProjectStageSelection();
        } else if (droppedOnProjectsWindowBody) {
          dragState.groupItems.forEach((item) => {
            item.button.style.left = `${Math.round(item.startLeft)}px`;
            item.button.style.top = `${Math.round(item.startTop)}px`;
            getProjectStagePositions(viewKey)[item.itemId] = {
              x: Math.round(item.startLeft),
              y: Math.round(item.startTop),
              custom: true,
            };
          });
          playUiSound("drop");
        } else {
          proxyPositions.forEach(({ item, left, top }) => {
            if (!item.descriptor) {
              return;
            }

            removeProjectStageItemFromSource(item.button, viewKey);
            placeDesktopDescriptor(item.descriptor, { x: left, y: top });
            appState.selectedProjectStageItemIds.delete(item.itemId);
          });
          syncProjectStageSelection();
          playUiSound("drop");
        }
      } else {
        playUiSound("drop");
      }

      window.setTimeout(() => {
        dragState.groupItems.forEach((item) => {
          item.button.dataset.suppressOpen = "false";
        });
      }, 0);
    }

    dragState.groupItems.forEach((item) => {
      item.button.classList.remove("is-proxy-hidden");
      item.proxy?.remove();
      item.proxy = null;
    });
    setDesktopTrashTargetState(false);
    popDesktopDragLayer();
  }

  itemButton.addEventListener("pointerup", finishDragging);
  itemButton.addEventListener("pointercancel", finishDragging);
  itemButton.addEventListener("lostpointercapture", finishDragging);
}

function attachResizing(windowElement) {
  if (!windowElement || windowElement.dataset.disableResize === "true") {
    return;
  }

  const cornerHandle = windowElement.querySelector("[data-resize]");
  if (!cornerHandle) {
    return;
  }

  const edgeHandles = createEdgeResizeHandles(windowElement);

  const resizeState = {
    pointerId: null,
    direction: "se",
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0,
    startX: 0,
    startY: 0,
    frame: 0,
    pendingBounds: null,
  };
  const minWidth = Number(windowElement.dataset.minWidth) || MIN_WINDOW_WIDTH;
  const minHeight = Number(windowElement.dataset.minHeight) || MIN_WINDOW_HEIGHT;

  function startResize(event, direction, triggerElement) {
    if (!isDesktopLayout() || event.button !== 0 || windowElement.classList.contains("is-maximized")) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();

    const stageRect = desktopStage.getBoundingClientRect();
    const windowRect = windowElement.getBoundingClientRect();

    resizeState.pointerId = event.pointerId;
    resizeState.direction = direction;
    resizeState.startWidth = windowElement.offsetWidth;
    resizeState.startHeight = windowElement.offsetHeight;
    resizeState.startLeft = windowRect.left - stageRect.left;
    resizeState.startTop = windowRect.top - stageRect.top;
    resizeState.startX = event.clientX;
    resizeState.startY = event.clientY;

    windowElement.style.width = `${resizeState.startWidth}px`;
    windowElement.style.height = `${resizeState.startHeight}px`;
    windowElement.style.left = `${Math.round(resizeState.startLeft)}px`;
    windowElement.style.top = `${Math.round(resizeState.startTop)}px`;
    windowElement.classList.add("is-resizing");

    triggerElement.setPointerCapture(event.pointerId);
    focusWindow(windowElement, { playSound: false });
    playUiSound("drag");
  }

  cornerHandle.addEventListener("pointerdown", (event) => {
    startResize(event, "se", cornerHandle);
  });

  edgeHandles.forEach((edgeHandle) => {
    edgeHandle.addEventListener("pointerdown", (event) => {
      startResize(event, edgeHandle.dataset.resizeEdge || "se", edgeHandle);
    });
  });

  function resizeWindow(event) {
    if (resizeState.pointerId !== event.pointerId || !isDesktopLayout()) {
      return;
    }

    if (event.cancelable) {
      event.preventDefault();
    }

    const stageRect = desktopStage.getBoundingClientRect();
    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;
    const compactProjectsBounds =
      isCompactDesktopLayout() && windowElement.dataset.window === "projects-window"
        ? getCompactProjectsWindowBounds(stageRect)
        : null;
    const compactChessMinWidth =
      isCompactDesktopLayout() && windowElement.dataset.window === "chess-window"
        ? Math.max(
            Number(windowElement.dataset.compactSpawnWidth) || 0,
            Math.ceil(windowElement.offsetWidth || 0),
          )
        : null;
    const effectiveMinWidth = isCompactDesktopLayout()
      ? windowElement.dataset.window === "projects-window"
        ? compactProjectsBounds.width
        : windowElement.dataset.window === "chess-window"
          ? Math.max(compactChessMinWidth || 0, 220)
        : 220
      : minWidth;
    const effectiveMinHeight = isCompactDesktopLayout()
      ? windowElement.dataset.window === "projects-window"
        ? compactProjectsBounds.height
        : windowElement.dataset.window === "chess-window"
          ? 400
        : 220
      : minHeight;
    const maxWidthFromLeft = Math.max(stageRect.width - resizeState.startLeft - 16, effectiveMinWidth);
    const maxHeightFromTop = Math.max(stageRect.height - resizeState.startTop - 16, effectiveMinHeight);
    let nextLeft = resizeState.startLeft;
    let nextTop = resizeState.startTop;
    let nextWidth = resizeState.startWidth;
    let nextHeight = resizeState.startHeight;

    if (resizeState.direction.includes("e")) {
      nextWidth = clamp(
        resizeState.startWidth + deltaX,
        effectiveMinWidth,
        maxWidthFromLeft,
      );
    }

    if (resizeState.direction.includes("s")) {
      nextHeight = clamp(
        resizeState.startHeight + deltaY,
        effectiveMinHeight,
        maxHeightFromTop,
      );
    }

    if (resizeState.direction.includes("w")) {
      const maxLeft = resizeState.startLeft + resizeState.startWidth - effectiveMinWidth;
      nextLeft = clamp(resizeState.startLeft + deltaX, 16, maxLeft);
      nextWidth = resizeState.startWidth - (nextLeft - resizeState.startLeft);
    }

    if (resizeState.direction.includes("n")) {
      const maxTop = resizeState.startTop + resizeState.startHeight - effectiveMinHeight;
      nextTop = clamp(resizeState.startTop + deltaY, 16, maxTop);
      nextHeight = resizeState.startHeight - (nextTop - resizeState.startTop);
    }

    resizeState.pendingBounds = {
      left: Math.round(nextLeft),
      top: Math.round(nextTop),
      width: Math.round(nextWidth),
      height: Math.round(nextHeight),
    };
    if (!resizeState.frame) {
      resizeState.frame = window.requestAnimationFrame(() => {
        resizeState.frame = 0;
        if (!resizeState.pendingBounds) {
          return;
        }

        const { left, top, width, height } = resizeState.pendingBounds;
        windowElement.style.left = `${left}px`;
        windowElement.style.top = `${top}px`;
        windowElement.style.width = `${width}px`;
        windowElement.style.height = `${height}px`;
        refreshCoveredDesktopIcons();

        if (windowElement.dataset.window === "chess-window") {
          chessController?.onResize();
        }
      });
    }
  }

  cornerHandle.addEventListener("pointermove", resizeWindow);
  edgeHandles.forEach((edgeHandle) => {
    edgeHandle.addEventListener("pointermove", resizeWindow);
  });

  function finishResizing(event) {
    if (resizeState.pointerId !== event.pointerId) {
      return;
    }

    resizeState.pointerId = null;
    if (resizeState.frame) {
      window.cancelAnimationFrame(resizeState.frame);
      resizeState.frame = 0;
    }
    if (resizeState.pendingBounds) {
      const { left, top, width, height } = resizeState.pendingBounds;
      windowElement.style.left = `${left}px`;
      windowElement.style.top = `${top}px`;
      windowElement.style.width = `${width}px`;
      windowElement.style.height = `${height}px`;
      resizeState.pendingBounds = null;
    }
    windowElement.classList.remove("is-resizing");

    [cornerHandle, ...edgeHandles].forEach((handleElement) => {
      if (handleElement.hasPointerCapture(event.pointerId)) {
        handleElement.releasePointerCapture(event.pointerId);
      }
    });

    playUiSound("drop");
    refreshCoveredDesktopIcons();

    if (windowElement.dataset.window === "chess-window") {
      chessController?.onResize();
    }
  }

  cornerHandle.addEventListener("pointerup", finishResizing);
  cornerHandle.addEventListener("pointercancel", finishResizing);
  edgeHandles.forEach((edgeHandle) => {
    edgeHandle.addEventListener("pointerup", finishResizing);
    edgeHandle.addEventListener("pointercancel", finishResizing);
  });
}

function initializeWindowElement(windowElement) {
  if (!windowElement || windowElement.dataset.windowInitialized === "true") {
    return;
  }

  windowElement.dataset.windowInitialized = "true";
  windowElement.addEventListener("pointerdown", () => {
    focusWindow(windowElement);
  });
  attachCustomScrollbar(windowElement);
  attachDragging(windowElement);
  attachResizing(windowElement);
  syncWindowMaximizeButton(windowElement);

  if (customScrollbarObserver) {
    customScrollbarObserver.observe(windowElement);
    const body = windowElement.querySelector(".window-body");
    if (body) {
      customScrollbarObserver.observe(body);
    }
  }
}

function bindWindowChromeButtons(windowElement) {
  if (!windowElement || windowElement.dataset.windowChromeBound === "true") {
    return;
  }

  windowElement.dataset.windowChromeBound = "true";

  windowElement.querySelectorAll("[data-close]").forEach((button) => {
    button.dataset.chromeActionBound = "true";
    button.onpointerdown = (event) => {
      event.stopPropagation();
    };
    button.onclick = () => {
      closeWindow(windowElement);
    };
  });

  windowElement.querySelectorAll("[data-toggle-maximize]").forEach((button) => {
    button.dataset.chromeActionBound = "true";
    button.onpointerdown = (event) => {
      event.stopPropagation();
    };
    button.onclick = () => {
      toggleWindowMaximize(windowElement);
    };
  });
}

function bindProjectDetailWindowActions(windowElement) {
  if (!windowElement || windowElement.dataset.projectDetailActionsBound === "true") {
    return;
  }

  windowElement.dataset.projectDetailActionsBound = "true";
  const refs = getProjectDetailWindowRefs(windowElement);
  if (!refs) {
    return;
  }

  if (refs.expand && refs.more) {
    refs.expand.addEventListener("click", () => {
      const nextHiddenState = !refs.more.hidden;
      refs.more.hidden = nextHiddenState;
      refs.expand.textContent = nextHiddenState ? "Expand" : "Collapse";
      if (refs.secondaryActions && refs.github) {
        refs.secondaryActions.hidden = nextHiddenState || refs.github.hidden || !refs.github.dataset.githubUrl;
      }
      playUiSound("click");
      requestCustomScrollbarSync();
    });
  }

  if (refs.github) {
    refs.github.addEventListener("click", () => {
      const githubUrl = refs.github.dataset.githubUrl;
      if (!githubUrl) {
        return;
      }

      playUiSound("menuPick");
      window.open(githubUrl, "_blank", "noopener,noreferrer");
    });
  }

  if (refs.request) {
    refs.request.addEventListener("click", () => {
      const project = projectMap.get(windowElement.dataset.projectId || "");
      prefillContactMessageForProject(project || refs.title?.textContent?.trim() || "");
      openWindow("contact-window");
    });
  }
}

function createProjectDetailWindowInstance() {
  if (!projectDetailTemplateWindow) {
    return null;
  }

  const windowElement = projectDetailTemplateWindow.cloneNode(true);
  const windowId = `project-detail-window-${nextProjectDetailWindowId++}`;
  windowElement.dataset.window = windowId;
  windowElement.dataset.windowType = "project-detail-window";
  delete windowElement.dataset.projectDetailTemplate;
  delete windowElement.dataset.windowInitialized;
  delete windowElement.dataset.windowChromeBound;
  delete windowElement.dataset.projectDetailActionsBound;
  windowElement.querySelectorAll("[data-chrome-action-bound]").forEach((element) => {
    delete element.dataset.chromeActionBound;
  });
  windowElement.hidden = true;
  windowElement.classList.remove("is-open", "is-focused", "is-dragging", "is-resizing", "is-maximized");
  windowElement.style.zIndex = "";

  const titleElement = windowElement.querySelector('[data-project-detail-ref="window-title"]');
  if (titleElement) {
    const titleId = `${windowId}-title`;
    titleElement.id = titleId;
    windowElement.setAttribute("aria-labelledby", titleId);
  }

  projectDetailTemplateWindow.after(windowElement);
  initializeWindowElement(windowElement);
  bindWindowChromeButtons(windowElement);
  bindProjectDetailWindowActions(windowElement);
  return windowElement;
}

function repairWindowChromeButtons(windowElement) {
  if (!windowElement) {
    return;
  }

  delete windowElement.dataset.windowChromeBound;
  windowElement.querySelectorAll("[data-chrome-action-bound]").forEach((element) => {
    delete element.dataset.chromeActionBound;
  });
  bindWindowChromeButtons(windowElement);
}

function openProjectDetailWindow(projectId) {
  const project = projectMap.get(projectId);
  if (!project) {
    return null;
  }

  const existingWindow = getProjectDetailWindows(projectId)[0];
  if (existingWindow) {
    repairWindowChromeButtons(existingWindow);
    populateProjectDetail(projectId, existingWindow);
    openWindowElement(existingWindow);
    return project;
  }

  const windowElement = createProjectDetailWindowInstance();
  if (!windowElement) {
    return null;
  }

  repairWindowChromeButtons(windowElement);
  populateProjectDetail(projectId, windowElement);
  openWindowElement(windowElement);
  return project;
}

openButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.dataset.suppressOpen === "true") {
      button.dataset.suppressOpen = "false";
      return;
    }

    if (
      button.classList.contains("desktop-icon") &&
      button.dataset.desktopKind === "folder" &&
      !shouldUseSingleTapOpen(event)
    ) {
      return;
    }

    if (button.classList.contains("menu-dropdown-item")) {
      playUiSound("menuPick");
    }

    if (button.dataset.open === "projects-window") {
      openProjectsWindowWithCue();
    } else if (button.dataset.open === "contact-window") {
      prepareContactWindowForGeneralMessage();
      openWindow("contact-window");
    } else {
      openWindow(button.dataset.open);
    }

    if (button.classList.contains("menubar-logo")) {
      button.blur();
    }
  });
});

if (projectsBrowserList) {
  projectsBrowserList.addEventListener("pointerdown", (event) => {
    if (!isDesktopLayout() || event.target !== projectsBrowserList || event.button !== 0) {
      return;
    }

    closeMenus();
    clearProjectStageSelection();
    ensureProjectsSelectionBox();

    if (!projectsSelectionBox) {
      playUiSound("click");
      return;
    }

    const stageRect = projectsBrowserList.getBoundingClientRect();
    const viewKey = projectsBrowserList.dataset.view || getProjectStageViewKey(appState.activeProjectCategory);
    const selectionState = {
      pointerId: event.pointerId,
      startX: clamp(event.clientX - stageRect.left, 0, stageRect.width),
      startY: clamp(event.clientY - stageRect.top, 0, stageRect.height),
      didMove: false,
    };

    projectsSelectionBox.hidden = false;
    projectsSelectionBox.style.left = `${Math.round(selectionState.startX)}px`;
    projectsSelectionBox.style.top = `${Math.round(selectionState.startY)}px`;
    projectsSelectionBox.style.width = "0px";
    projectsSelectionBox.style.height = "0px";
    projectsBrowserList.setPointerCapture(event.pointerId);

    function finishProjectStageSelection(pointerEvent) {
      if (selectionState.pointerId !== pointerEvent.pointerId) {
        return;
      }

      selectionState.pointerId = null;
      projectsSelectionBox.hidden = true;
      projectsSelectionBox.style.width = "0px";
      projectsSelectionBox.style.height = "0px";

      if (projectsBrowserList.hasPointerCapture(pointerEvent.pointerId)) {
        projectsBrowserList.releasePointerCapture(pointerEvent.pointerId);
      }

      projectsBrowserList.removeEventListener("pointermove", handleProjectStageSelectionMove);
      projectsBrowserList.removeEventListener("pointerup", finishProjectStageSelection);
      projectsBrowserList.removeEventListener("pointercancel", finishProjectStageSelection);

      if (!selectionState.didMove) {
        playUiSound("click");
      }
    }

    function handleProjectStageSelectionMove(pointerEvent) {
      if (selectionState.pointerId !== pointerEvent.pointerId || !isDesktopLayout()) {
        return;
      }

      if (pointerEvent.buttons === 0) {
        finishProjectStageSelection(pointerEvent);
        return;
      }

      const nextX = clamp(pointerEvent.clientX - stageRect.left, 0, stageRect.width);
      const nextY = clamp(pointerEvent.clientY - stageRect.top, 0, stageRect.height);
      const left = Math.min(selectionState.startX, nextX);
      const top = Math.min(selectionState.startY, nextY);
      const width = Math.abs(nextX - selectionState.startX);
      const height = Math.abs(nextY - selectionState.startY);

      selectionState.didMove = selectionState.didMove || width > 3 || height > 3;

      projectsSelectionBox.style.left = `${Math.round(left)}px`;
      projectsSelectionBox.style.top = `${Math.round(top)}px`;
      projectsSelectionBox.style.width = `${Math.round(width)}px`;
      projectsSelectionBox.style.height = `${Math.round(height)}px`;

      if (!selectionState.didMove) {
        return;
      }

      const selectionRect = {
        left: stageRect.left + left,
        top: stageRect.top + top,
        right: stageRect.left + left + width,
        bottom: stageRect.top + top + height,
      };

      appState.selectedProjectStageItemIds.clear();
      appState.selectedProjectStageViewKey = viewKey;
      getSelectableProjectStageItems(projectsBrowserList).forEach((button) => {
        if (doRectsIntersect(button.getBoundingClientRect(), selectionRect)) {
          appState.selectedProjectStageItemIds.add(button.dataset.stageItemId || "");
        }
      });
      syncProjectStageSelection();
    }

    projectsBrowserList.addEventListener("pointermove", handleProjectStageSelectionMove);
    projectsBrowserList.addEventListener("pointerup", finishProjectStageSelection);
    projectsBrowserList.addEventListener("pointercancel", finishProjectStageSelection);
  });

  projectsBrowserList.addEventListener("click", (event) => {
    const windowButton = event.target.closest("[data-stage-window]");
    if (windowButton) {
      if (windowButton.dataset.suppressOpen === "true") {
        windowButton.dataset.suppressOpen = "false";
        return;
      }

      if (!shouldUseSingleTapOpen(event)) {
        return;
      }

      if (windowButton.dataset.replayAboutIntro === "true") {
        replayAboutWindowIntro();
        return;
      } else {
        openWindow(windowButton.dataset.stageWindow);
      }
      playUiSound("open");
      return;
    }

    const systemOverlayButton = event.target.closest("[data-system-overlay]");
    if (systemOverlayButton) {
      if (systemOverlayButton.dataset.suppressOpen === "true") {
        systemOverlayButton.dataset.suppressOpen = "false";
        return;
      }

      if (!shouldUseSingleTapOpen(event)) {
        return;
      }

      showSystemOverlay(systemOverlayButton.dataset.systemOverlay);
      return;
    }

    const categoryButton = event.target.closest("[data-project-category]");
    if (categoryButton) {
      if (categoryButton.dataset.suppressOpen === "true") {
        categoryButton.dataset.suppressOpen = "false";
        return;
      }

      if (categoryButton.dataset.stageItemKind === "folder" && !shouldUseSingleTapOpen(event)) {
        return;
      }

      const transitionOrigin = getProjectsStageTransitionOrigin(categoryButton);
      const openDelay =
        categoryButton.dataset.stageItemKind === "folder" ? animateProjectsStageFolder(categoryButton) : 0;
      window.setTimeout(() => {
        renderProjectsBrowser(categoryButton.dataset.projectCategory, { transitionOrigin, allowBack: true });
        playUiSound("open");
      }, openDelay);
      return;
    }

    const projectButton = event.target.closest("[data-project-id]");
    if (!projectButton) {
      return;
    }

    if (projectButton.dataset.suppressOpen === "true") {
      projectButton.dataset.suppressOpen = "false";
      return;
    }

    if (!shouldUseSingleTapOpen(event)) {
      return;
    }

    const project = openProjectDetailWindow(projectButton.dataset.projectId);
    if (!project) {
      return;
    }
  });
}

if (projectsBrowserBack) {
  projectsBrowserBack.addEventListener("click", () => {
    renderProjectsBrowser(null);
    playUiSound("menuClose");
  });
}

easterTriggerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showEasterOverlay(button.dataset.easterTrigger);
    button.blur();
  });
});

menuLinkButtons.forEach((button) => {
  button.addEventListener("click", () => {
    playUiSound("menuPick");
    closeMenus();
    const nextUrl = button.dataset.link === "github" ? GITHUB_PROFILE_URL : LINKEDIN_URL;
    window.open(nextUrl, "_blank", "noopener,noreferrer");
  });
});

menuTriggers.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu(button.dataset.menuTrigger);
    button.blur();
  });
});

menuDropdowns.forEach((dropdown) => {
  dropdown.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });

  dropdown.querySelectorAll(".menu-dropdown-item").forEach((item) => {
    item.addEventListener("pointerenter", () => {
      playUiSound("hover");
    });
  });
});

desktopStage.addEventListener("pointerdown", (event) => {
  if (!isDesktopLayout() || event.target !== desktopStage || event.button !== 0) {
    return;
  }

  closeMenus();
  clearDesktopSelection();
  appState.focusedWindow = null;
  getAllWindows().forEach((windowElement) => {
    windowElement.classList.remove("is-focused");
  });
  syncOpeners();
  syncCurrentAppLabel();

  if (!desktopSelectionBox) {
    playUiSound("click");
    return;
  }

  const stageRect = desktopStage.getBoundingClientRect();
  const selectionState = {
    pointerId: event.pointerId,
    startX: clamp(event.clientX - stageRect.left, 0, stageRect.width),
    startY: clamp(event.clientY - stageRect.top, 0, stageRect.height),
    didMove: false,
  };

  desktopSelectionBox.hidden = false;
  desktopSelectionBox.style.left = `${Math.round(selectionState.startX)}px`;
  desktopSelectionBox.style.top = `${Math.round(selectionState.startY)}px`;
  desktopSelectionBox.style.width = "0px";
  desktopSelectionBox.style.height = "0px";
  desktopStage.setPointerCapture(event.pointerId);

  function finishDesktopSelection(pointerEvent) {
    if (selectionState.pointerId !== pointerEvent.pointerId) {
      return;
    }

    selectionState.pointerId = null;
    desktopSelectionBox.hidden = true;
    desktopSelectionBox.style.width = "0px";
    desktopSelectionBox.style.height = "0px";

    if (desktopStage.hasPointerCapture(pointerEvent.pointerId)) {
      desktopStage.releasePointerCapture(pointerEvent.pointerId);
    }

    desktopStage.removeEventListener("pointermove", handleDesktopSelectionMove);
    desktopStage.removeEventListener("pointerup", finishDesktopSelection);
    desktopStage.removeEventListener("pointercancel", finishDesktopSelection);

    if (!selectionState.didMove) {
      playUiSound("click");
    }
  }

  function handleDesktopSelectionMove(pointerEvent) {
    if (selectionState.pointerId !== pointerEvent.pointerId || !isDesktopLayout()) {
      return;
    }

    if (pointerEvent.buttons === 0) {
      finishDesktopSelection(pointerEvent);
      return;
    }

    const nextX = clamp(pointerEvent.clientX - stageRect.left, 0, stageRect.width);
    const nextY = clamp(pointerEvent.clientY - stageRect.top, 0, stageRect.height);
    const left = Math.min(selectionState.startX, nextX);
    const top = Math.min(selectionState.startY, nextY);
    const width = Math.abs(nextX - selectionState.startX);
    const height = Math.abs(nextY - selectionState.startY);

    selectionState.didMove = selectionState.didMove || width > 3 || height > 3;

    desktopSelectionBox.style.left = `${Math.round(left)}px`;
    desktopSelectionBox.style.top = `${Math.round(top)}px`;
    desktopSelectionBox.style.width = `${Math.round(width)}px`;
    desktopSelectionBox.style.height = `${Math.round(height)}px`;

    if (!selectionState.didMove) {
      return;
    }

    const selectionRect = {
      left: stageRect.left + left,
      top: stageRect.top + top,
      right: stageRect.left + left + width,
      bottom: stageRect.top + top + height,
    };

    appState.selectedDesktopItemIds.clear();
    getSelectableDesktopIcons().forEach((button) => {
      if (!isDesktopItemSelectableForMarquee(button)) {
        return;
      }

      if (doRectsIntersect(button.getBoundingClientRect(), selectionRect)) {
        appState.selectedDesktopItemIds.add(button.dataset.desktopItemId);
      }
    });
    syncDesktopSelection();
  }

  desktopStage.addEventListener("pointermove", handleDesktopSelectionMove);
  desktopStage.addEventListener("pointerup", finishDesktopSelection);
  desktopStage.addEventListener("pointercancel", finishDesktopSelection);
});

document.addEventListener("pointerdown", (event) => {
  if (!menubar.contains(event.target)) {
    closeMenus();
  }
});

function setContactStatus(message, state) {
  if (!contactStatus) {
    return;
  }

  contactStatus.textContent = message;
  contactStatus.dataset.state = state;
  contactStatus.hidden = !message;
  requestCustomScrollbarSync();
}

function setContactFormPending(isPending) {
  contactFormFields.forEach((field) => {
    field.disabled = isPending;
  });

  if (contactSubmitButton) {
    contactSubmitButton.textContent = isPending ? "Sending..." : contactSubmitDefaultLabel;
  }
}

async function submitContactForm(payload) {
  const response = await fetch(CONTACT_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new Error(responseBody?.error || "Message could not be sent right now.");
  }

  return responseBody;
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    playUiSound("submit");

    const formData = new FormData(contactForm);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      message: String(formData.get("message") || ""),
    };

    setContactFormPending(true);
    setContactStatus("Sending message...", "pending");

    try {
      const responseBody = await submitContactForm(payload);
      contactForm.reset();
      if (contactMessageField) {
        contactMessageField.placeholder = contactMessageDefaultPlaceholder;
      }
      setContactStatus(
        responseBody?.message || "Message sent. Markus will get back to you soon.",
        "success",
      );
    } catch (error) {
      console.error(error);
      setContactStatus(
        error instanceof Error ? error.message : "Message could not be sent right now.",
        "error",
      );
    } finally {
      setContactFormPending(false);
    }
  });
}

formFields.forEach((field) => {
  field.addEventListener("focus", () => {
    playUiSound("click");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appState.openMenu) {
    closeMenus({ playSound: true });
    return;
  }

  if (event.key !== "Escape" || !appState.focusedWindow) {
    return;
  }

  const windowElement = getWindowElement(appState.focusedWindow);
  if (windowElement && !windowElement.hidden) {
    closeWindow(windowElement);
  }
});

if (contactLinkedinLink) {
  contactLinkedinLink.href = LINKEDIN_URL;
}

if (cvRequestDetailsButton) {
  cvRequestDetailsButton.addEventListener("click", () => {
    prefillContactMessageForProject("Hi Markus,\n\nCould you please send me more details about your CV?\n\nBest,\n");
    openWindow("contact-window");
    playUiSound("click");
  });
}

window.addEventListener("resize", () => {
  getAllWindows().forEach((windowElement) => {
    if (windowElement.classList.contains("is-maximized")) {
      const bounds = getMaximizedWindowBounds(windowElement);
      if (bounds) {
        applyWindowBounds(windowElement, bounds);
      }

      if (windowElement.dataset.window === "chess-window") {
        chessController?.onResize();
      }
    }
  });
  if (getWindowElement("chess-window") && !getWindowElement("chess-window")?.classList.contains("is-maximized")) {
    chessController?.onResize();
  }
  if (isDesktopLayout() && getVisibleWindows().length === 0 && !appState.aboutIntroPlayed) {
    void openWindow("about-window", { playSound: false });
    startAboutIntroAnimation();
  }
  requestCustomScrollbarSync();
  refreshCoveredDesktopIcons();
});

updateClock();
window.setInterval(updateClock, 1000);
syncOpeners();
syncMenus();
syncCurrentAppLabel();
if (isDesktopLayout()) {
  void openWindow("about-window", { playSound: false });
  startAboutIntroAnimation();
}
requestCustomScrollbarSync();
refreshCoveredDesktopIcons();
scheduleDeferredStartup();

document.addEventListener("pointerdown", unlockAudio, { once: true, capture: true });
document.addEventListener("keydown", unlockAudio, { once: true, capture: true });
