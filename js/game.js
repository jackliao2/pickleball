const G = 32;
const CW = 20;
const CL = 44;
const NET_Y = 22;
const NVZ = 7;
const NET_HC = 34 / 12;
const NET_HS = 3;
const TAU = Math.PI * 2;

const DIFF = {
  easy: { err: 1.7, react: 0.38, reach: 0.7, chase: 1.85, miss: 0.14 },
  normal: { err: 1.25, react: 0.28, reach: 0.8, chase: 1.1, miss: 0.1 },
  hard: { err: 0.6, react: 0.15, reach: 0.94, chase: 0.38, miss: 0.025 },
};

const STAT_LIST = [
  ["speed", "Speed", "Foot speed around the court"],
  ["power", "Power", "Pace on drives and speed-ups"],
  ["angle", "Angle", "Keeps drives in; low angle sprays out"],
  ["serve", "Serve", "Depth, bite, and fewer faults"],
  ["hands", "Hands", "Kitchen volleys and recovery"],
  ["reach", "Reach", "How far the paddle covers"],
];
const STAT_IDS = STAT_LIST.map((s) => s[0]);
const STAT_UPGRADES = Object.fromEntries(
  STAT_LIST.map(([id, label, desc]) => [id, { label, desc }])
);
const STAT_BUDGET = 36;
const PRESETS = {
  balanced: { name: "All-court", speed: 6, power: 6, angle: 6, serve: 6, hands: 6, reach: 6 },
  kitchen: { name: "Kitchen", speed: 5, power: 4, angle: 8, serve: 4, hands: 9, reach: 6 },
  banger: { name: "Banger", speed: 7, power: 10, angle: 3, serve: 7, hands: 4, reach: 5 },
  touch: { name: "Touch", speed: 5, power: 3, angle: 9, serve: 5, hands: 8, reach: 6 },
  athlete: { name: "Athlete", speed: 9, power: 6, angle: 5, serve: 5, hands: 6, reach: 5 },
  cannon: { name: "Cannon", speed: 4, power: 9, angle: 4, serve: 10, hands: 4, reach: 5 },
};
const SKINS = ["#f3d1b0", "#e2b08c", "#c99272", "#a56b45", "#7a4a2e", "#4d2e1c"];
const SHIRTS = ["#1aa39a", "#e45a43", "#3d7ea6", "#d4e157", "#f4f1e8", "#7b5ea7", "#e07a3d", "#222222", "#2f6f4e", "#c43c6a"];
const SHORTS = ["#16385c", "#f0e6d4", "#222222", "#3a3a3a", "#1aa39a", "#6b3f1f", "#eeeeee", "#2b4c7e"];
const HAT_COLORS = ["#f4f1e8", "#1a1a1a", "#e45a43", "#1aa39a", "#d4e157", "#3d7ea6"];
const HAIR_COLORS = ["#1a1a1a", "#3b2a1a", "#6b4423", "#c4a574", "#e8d5a3", "#2c4a6e", "#888888"];
const SHOES = ["#efe6d8", "#222222", "#e45a43", "#1aa39a", "#f4f1e8"];
const HATS = ["visor", "cap", "band", "none"];
const HAIR_STYLES = ["short", "fade", "bun", "pony", "bald"];
const LOOK_KEY = "pb-look-v1";
const TUTORIAL_KEY = "pb-tutorial-v1";
const MUTE_KEY = "pb-muted-v1";

const DEFAULT_YOU_LOOK = {
  skin: "#e2b08c",
  shirt: "#1aa39a",
  shorts: "#16385c",
  visor: "#f4f1e8",
  paddle: "#1aa39a",
  hair: "#3b2a1a",
  shoes: "#efe6d8",
  hat: "visor",
  hairStyle: "short",
};

function randomLook() {
  const shirt = SHIRTS[(Math.random() * SHIRTS.length) | 0];
  return {
    skin: SKINS[(Math.random() * SKINS.length) | 0],
    shirt,
    shorts: SHORTS[(Math.random() * SHORTS.length) | 0],
    visor: HAT_COLORS[(Math.random() * HAT_COLORS.length) | 0],
    paddle: SHIRTS[(Math.random() * SHIRTS.length) | 0],
    hair: HAIR_COLORS[(Math.random() * HAIR_COLORS.length) | 0],
    shoes: SHOES[(Math.random() * SHOES.length) | 0],
    hat: HATS[(Math.random() * HATS.length) | 0],
    hairStyle: HAIR_STYLES[(Math.random() * HAIR_STYLES.length) | 0],
  };
}

function tintLook(look, amt) {
  return { ...look, shirt: shadeHex(look.shirt, amt), paddle: shadeHex(look.paddle || look.shirt, amt) };
}

const TOURNAMENT = [
  {
    round: "Qualifier",
    name: "Pat Nguyen",
    style: "Club rec",
    blurb: "Soft dinks, slow feet, almost never attacks. A warm-up.",
    venue: "park",
    points: 7,
    objective: { type: "margin", value: 3, label: "Win by at least 3 points" },
    tactic: {
      id: "soft-starter",
      label: "Soft starter",
      tell: "Extends rallies with soft drops and rarely attacks first.",
      counter: "Keep the ball deep, then take the first short return.",
      kitchen: 0.58, attack: 0.08, drive: 0.18, lob: 0.02, target: "open",
    },
    diff: "easy",
    stats: { speed: 3, power: 2, angle: 5, serve: 3, hands: 4, reach: 4 },
    look: { skin: "#c99272", shirt: "#f4f1e8", shorts: "#6b3f1f", visor: "#f4f1e8", paddle: "#e07a3d", hair: "#1a1a1a", shoes: "#efe6d8", hat: "visor", hairStyle: "fade" },
  },
  {
    round: "Round of 8",
    name: "Sam Ortiz",
    style: "All-court",
    blurb: "Gets the ball back. Little pace. Keep it deep and you are fine.",
    venue: "gym",
    points: 7,
    objective: { type: "longest", value: 8, label: "Play a rally of 8 shots" },
    tactic: {
      id: "retriever",
      label: "Retriever",
      tell: "Tracks down open-court balls and waits for you to miss.",
      counter: "Move Sam twice—wide first, then behind the recovery step.",
      kitchen: 0.52, attack: 0.14, drive: 0.32, lob: 0.04, target: "open",
    },
    diff: "easy",
    stats: { speed: 4, power: 3, angle: 5, serve: 4, hands: 4, reach: 4 },
    look: { skin: "#e2b08c", shirt: "#3d7ea6", shorts: "#222222", visor: "#1a1a1a", paddle: "#3d7ea6", hair: "#3b2a1a", shoes: "#222222", hat: "cap", hairStyle: "short" },
  },
  {
    round: "Quarterfinal",
    name: "Jordan Blake",
    style: "Athlete",
    blurb: "Runs the court, still learning the kitchen. Medium pace, not a banger.",
    venue: "beach",
    points: 7,
    objective: { type: "aces", value: 1, label: "Score at least 1 ace" },
    tactic: {
      id: "runner",
      label: "Runner",
      tell: "Covers the sidelines and mixes drives with surprise lobs.",
      counter: "Bring Jordan forward with drops instead of racing side to side.",
      kitchen: 0.62, attack: 0.24, drive: 0.52, lob: 0.14, target: "open",
    },
    diff: "easy",
    stats: { speed: 5, power: 4, angle: 5, serve: 4, hands: 5, reach: 5 },
    look: { skin: "#a56b45", shirt: "#d4e157", shorts: "#222222", visor: "#d4e157", paddle: "#222222", hair: "#1a1a1a", shoes: "#e45a43", hat: "band", hairStyle: "fade" },
  },
  {
    round: "Semifinal",
    name: "Alex Kim",
    style: "Kitchen",
    blurb: "Lives at the NVZ. Soft hands, blocks, then speed-ups when you pop it up.",
    venue: "club",
    points: 9,
    objective: { type: "longest", value: 12, label: "Survive a 12-shot kitchen battle" },
    tactic: {
      id: "kitchen-specialist",
      label: "Kitchen specialist",
      tell: "Rushes the kitchen, dinks patiently, then attacks a high ball.",
      counter: "Use deep returns and lobs before Alex settles at the line.",
      kitchen: 0.98, attack: 0.46, drive: 0.22, lob: 0.06, target: "open",
    },
    diff: "normal",
    stats: { speed: 5, power: 4, angle: 7, serve: 4, hands: 7, reach: 5 },
    look: { skin: "#f3d1b0", shirt: "#c43c6a", shorts: "#eeeeee", visor: "#c43c6a", paddle: "#f4f1e8", hair: "#1a1a1a", shoes: "#f4f1e8", hat: "visor", hairStyle: "bun" },
  },
  {
    round: "Final",
    name: "Morgan Hale",
    style: "Banger",
    blurb: "Big drives and body speed-ups. Weak on touch. Reset to the kitchen.",
    venue: "night",
    points: 9,
    objective: { type: "attackWins", value: 2, label: "Win 2 rallies with speed-ups or smashes" },
    tactic: {
      id: "banger",
      label: "Banger",
      tell: "Drives hard from the baseline and speeds up at your body.",
      counter: "Absorb the pace with soft resets; make Morgan dink.",
      kitchen: 0.7, attack: 0.9, drive: 0.92, lob: 0.02, target: "body",
    },
    diff: "hard",
    stats: { speed: 7, power: 8, angle: 4, serve: 6, hands: 4, reach: 5 },
    look: { skin: "#7a4a2e", shirt: "#222222", shorts: "#e45a43", visor: "#1a1a1a", paddle: "#e45a43", hair: "#1a1a1a", shoes: "#e45a43", hat: "none", hairStyle: "bald" },
  },
  {
    round: "Championship",
    name: "Casey Voss",
    style: "Pro",
    blurb: "Deep serves, heavy pace, fast hands. Championship form.",
    venue: "arena",
    points: 11,
    objective: { type: "margin", value: 3, label: "Win the championship by 3" },
    tactic: {
      id: "complete-pro",
      label: "Complete pro",
      tell: "Changes pace, owns the kitchen, and punishes predictable positioning.",
      counter: "Vary depth and tempo—repeating the same ball gets exposed.",
      kitchen: 0.9, attack: 0.68, drive: 0.7, lob: 0.12, target: "adaptive",
    },
    diff: "hard",
    stats: { speed: 8, power: 8, angle: 6, serve: 8, hands: 7, reach: 6 },
    look: { skin: "#4d2e1c", shirt: "#f4f1e8", shorts: "#16385c", visor: "#1a1a1a", paddle: "#d4e157", hair: "#1a1a1a", shoes: "#f4f1e8", hat: "cap", hairStyle: "pony" },
  },
];
const TOURNEY_KEY = "pb-tourney-v1";
const TOURNEY_RECORD_KEY = "pb-tourney-record-v1";
const VENUE_KEY = "pb-venue-v1";
const VENUES = [
  { id: "park", name: "Park", kind: "out", sky: ["#7ec8e8", "#c7e7f5", "#e7f3ea"], sun: "#f7e3a1", clouds: true, ground: ["#4f8a46", "#2f5c32"], apron: "#8aa7b8", runoff: "#cfc6b4", court: ["#1a6fb4", "#2b8ad0"], kitchen: "rgba(10,50,90,0.22)", line: "#f7f4ea" },
  { id: "dusk", name: "Dusk", kind: "out", sky: ["#1e2a58", "#e07a3d", "#f6c27a"], sun: "#ffb14a", ground: ["#3a5636", "#22301e"], apron: "#6a7684", runoff: "#b7a78c", court: ["#184e88", "#246ab0"], kitchen: "rgba(8,28,70,0.3)", line: "#f4efe0" },
  { id: "night", name: "Night", kind: "out", sky: ["#0a1020", "#17233e", "#243048"], moon: "#e8eef8", lights: true, ground: ["#1a2c1c", "#101810"], apron: "#3a4552", runoff: "#4a5348", court: ["#14386c", "#1e4e8c"], kitchen: "rgba(0,18,48,0.38)", line: "#dfe8ff" },
  { id: "desert", name: "Desert", kind: "out", sky: ["#86b7de", "#f2d39a", "#f6e2b8"], sun: "#ffe08a", ground: ["#d2a36a", "#b07a3c"], apron: "#c9a06a", runoff: "#e6c992", court: ["#c45c2a", "#e07a3d"], kitchen: "rgba(80,30,10,0.24)", line: "#fff6e0" },
  { id: "beach", name: "Beach", kind: "out", sky: ["#6ec4e8", "#bde7f5", "#fff4d6"], sun: "#ffe9a0", clouds: true, ocean: true, ground: ["#e8d5a3", "#d4b56a"], apron: "#6eb4d2", runoff: "#ead7a8", court: ["#1aa39a", "#2bc4b8"], kitchen: "rgba(10,60,60,0.24)", line: "#f7f4ea" },
  { id: "gym", name: "Rec gym", kind: "in", sky: ["#3d3a36", "#58534e", "#6e6860"], indoor: true, ground: ["#4a4036", "#2e2822"], apron: "#6a5e52", runoff: "#8a7a68", court: ["#2f6f4e", "#3d8a62"], kitchen: "rgba(20,40,20,0.3)", line: "#f4f1e8" },
  { id: "arena", name: "Arena", kind: "in", sky: ["#12141c", "#1c2230", "#252b3a"], indoor: true, lights: true, ground: ["#1a1e28", "#10141c"], apron: "#2a3140", runoff: "#3a4254", court: ["#3d7ea6", "#4a92c0"], kitchen: "rgba(10,30,60,0.32)", line: "#e8f0ff" },
  { id: "club", name: "Club", kind: "in", sky: ["#2a2438", "#3d3450", "#4a4060"], indoor: true, ground: ["#2c2438", "#1a1624"], apron: "#4a3f58", runoff: "#6a5d78", court: ["#7b5ea7", "#9478c4"], kitchen: "rgba(40,20,60,0.3)", line: "#f4e8ff" },
];

function emptyStats() {
  return { speed: 6, power: 6, angle: 6, serve: 6, hands: 6, reach: 6 };
}
function statSum(st) {
  return STAT_IDS.reduce((n, id) => n + (st[id] || 0), 0);
}
function rollStats() {
  const st = Object.fromEntries(STAT_IDS.map((id) => [id, 2]));
  let left = STAT_BUDGET - 12;
  let guard = 0;
  while (left > 0 && guard++ < 80) {
    const id = STAT_IDS[(Math.random() * STAT_IDS.length) | 0];
    if (st[id] < 10) {
      st[id] += 1;
      left -= 1;
    }
  }
  return st;
}
function cloneStats(st) {
  return { ...st };
}

function scaleBuild(base, budget) {
  const st = cloneStats(base);
  delete st.name;
  let sum = statSum(st);
  const ranked = STAT_IDS.slice().sort((a, b) => (base[b] || 0) - (base[a] || 0));
  if (sum > budget) {
    for (let i = ranked.length - 1; i >= 0 && sum > budget; i--) {
      const id = ranked[i];
      while (sum > budget && st[id] > 2) {
        st[id] -= 1;
        sum -= 1;
      }
    }
  } else {
    for (const id of ranked) {
      while (sum < budget && st[id] < 10) {
        st[id] += 1;
        sum += 1;
      }
    }
  }
  return st;
}

const $ = (id) => document.getElementById(id);

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}
function rand(a, b) {
  return a + Math.random() * (b - a);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function shadeHex(hex, amt) {
  let n = String(hex || "#888").replace("#", "");
  if (n.length === 3) n = n.split("").map((c) => c + c).join("");
  const v = parseInt(n, 16);
  if (!Number.isFinite(v)) return hex;
  const r = clamp(((v >> 16) & 255) * amt, 0, 255) | 0;
  const g = clamp(((v >> 8) & 255) * amt, 0, 255) | 0;
  const b = clamp((v & 255) * amt, 0, 255) | 0;
  return `rgb(${r},${g},${b})`;
}

function netHeightAt(x) {
  const t = Math.abs(x - 10) / 10;
  return lerp(NET_HC, NET_HS, t);
}

function inCourt(x, y) {
  return x >= -0.08 && x <= CW + 0.08 && y >= -0.08 && y <= CL + 0.08;
}

function inKitchen(x, y) {
  if (x < 0 || x > CW) return false;
  return (y >= NET_Y - NVZ && y <= NET_Y + NVZ);
}

function playerInKitchen(p) {
  const pad = 0.4;
  if (p.side === "near") return p.y >= NET_Y - NVZ + pad && p.y <= NET_Y && p.x >= -0.4 && p.x <= CW + 0.4;
  return p.y <= NET_Y + NVZ - pad && p.y >= NET_Y && p.x >= -0.4 && p.x <= CW + 0.4;
}

function kitchenSafeY(side) {
  return side === "near" ? NET_Y - NVZ - 0.55 : NET_Y + NVZ + 0.55;
}

/** Serve must land past the kitchen line, in the diagonal box, lines-in except NVZ line. */
function inServiceBox(x, y, receiverSide, fromRight) {
  const left = fromRight;
  if (receiverSide === "far") {
    const okX = left ? x >= 0 && x <= 10 : x >= 10 && x <= 20;
    return okX && y > 29 && y <= 44;
  }
  const okX = left ? x >= 10 && x <= 20 : x >= 0 && x <= 10;
  return okX && y >= 0 && y < 15;
}

class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.22;
    this.master.connect(this.ctx.destination);
  }
  /**
   * iOS only starts an AudioContext from inside a touchend/click, and Web Audio
   * follows the ringer switch until an <audio> element has played. Call from a
   * gesture handler; safe to call repeatedly.
   */
  unlock() {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    if (!this.unlocked) {
      const buf = this.ctx.createBuffer(1, 1, 22050);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
      try {
        const a = new Audio(
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA="
        );
        a.setAttribute("playsinline", "");
        a.volume = 0.01;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      } catch {}
      this.unlocked = this.ctx.state === "running";
    }
  }
  beep(freq, dur, type, vol, slide) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  noise(dur, vol) {
    if (this.muted || !this.ctx) return;
    const n = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    const g = this.ctx.createGain();
    src.buffer = buf;
    g.gain.value = vol || 0.12;
    src.connect(g);
    g.connect(this.master);
    src.start();
  }
  hit(power, kind) {
    const dink = kind === "dink" || kind === "drop" || power < 0.32;
    if (dink) {
      this.beep(1280, 0.032, "triangle", 0.1, 820);
      this.beep(540, 0.04, "sine", 0.04, 280);
      this.noise(0.028, 0.05);
      return;
    }
    if (kind === "smash" || kind === "speedup") {
      this.beep(340, 0.05, "square", 0.16, 160);
      this.beep(880, 0.03, "triangle", 0.1, 400);
      this.noise(0.045, 0.11);
      return;
    }
    this.beep(720, 0.042, "triangle", 0.15, 280);
    this.beep(190, 0.07, "sine", 0.07);
    this.noise(0.038, 0.09);
  }
  bounce() {
    this.beep(760, 0.038, "sine", 0.05, 380);
    this.noise(0.022, 0.035);
  }
  net() {
    this.beep(140, 0.1, "triangle", 0.07, 70);
    this.noise(0.05, 0.05);
  }
  point() {
    this.beep(520, 0.12, "triangle", 0.12, 780);
  }
  fault() {
    this.beep(160, 0.18, "sine", 0.1, 80);
  }
  whistle() {
    this.beep(1200, 0.15, "sine", 0.06, 900);
  }
  cheer() {
    this.beep(520, 0.24, "triangle", 0.2, 820);
    this.beep(660, 0.22, "sine", 0.16, 980);
    this.beep(392, 0.28, "triangle", 0.1);
    this.beep(784, 0.16, "sine", 0.08);
    this.noise(0.32, 0.2);
  }
  crowd(level) {
    const n = clamp(level, 0.4, 2);
    this.noise(0.28 + n * 0.16, 0.1 + n * 0.08);
    this.beep(180 + n * 50, 0.18, "sine", 0.06 + n * 0.03);
    this.beep(240 + n * 70, 0.14, "triangle", 0.05);
    this.beep(330, 0.2, "sine", 0.04);
    this.noise(0.12 + n * 0.08, 0.07 + n * 0.04);
  }
}

export class Game {
  constructor() {
    this.canvas = $("c");
    this.ctx = this.canvas.getContext("2d");
    this.sfx = new Sfx();
    try {
      this.sfx.muted = localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      /* ignore */
    }
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, down: false, on: false };
    this.stick = { dx: 0, dy: 0, active: false };
    this.diff = "normal";
    this.menuDiff = "normal";
    this.mode = "cpu";
    this.screen = "menu";
    this.demo = true;
    this.w = 1280;
    this.h = 720;
    this.camX = 0;
    this.shake = 0;
    this.banner = { text: "", t: 0 };
    this.toastT = 0;
    this.time = 0;
    this.rallyLen = 0;
    this.paused = false;
    this.touch = false;

    this.lookSpin = { you: 0, opp: 0 };
    this.venue = this.loadVenue();
    this.youLook = this.loadLook() || { ...DEFAULT_YOU_LOOK };
    this.oppLook = randomLook();
    this.near = this.makePlayer("near");
    this.far = this.makePlayer("far");
    this.nearB = this.makePlayer("near");
    this.farB = this.makePlayer("far");
    this.applyLook(this.near, this.youLook);
    this.applyLook(this.far, this.oppLook);
    this.applyLook(this.nearB, tintLook(this.youLook, 0.72));
    this.applyLook(this.farB, tintLook(this.oppLook, 0.72));
    this.ball = this.makeBall();
    this.match = this.freshMatch();
    this.phase = "serve";
    this.deadT = 0;
    this.serveT = 0;
    this.highlightBox = null;
    this.fx = [];
    this.hitStop = 0;
    this.lastKind = "dink";
    this.meta = this.emptyMeta();
    this.youBuild = { name: "All-court", ...emptyStats() };
    this.oppBuild = { name: "All-court", ...emptyStats() };
    this.pendingMode = "cpu";
    this.tape = [];
    this.pendingHit = null;
    this.replay = null;
    this.challengeIndex = -1;
    this.challengeRunActive = false;
    this.challengeBoosts = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
    this.challengeOriginalVenue = null;
    this.tutorial = { active: false, step: 0 };

    this.bind();
    this.syncSoundButton();
    this.resize();
    this.resetPoint(true);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  makePlayer(side) {
    const near = side === "near";
    return {
      side,
      x: 10,
      y: near ? 3 : 41,
      vx: 0,
      vy: 0,
      speed: 9.52,
      baseSpeed: 9.52,
      powerMul: 1.11,
      aimSpread: 1.16,
      serveSkill: 6,
      hands: 6,
      reachFt: 3.34,
      stats: emptyStats(),
      charge: 0,
      charging: false,
      swing: 0,
      swinging: false,
      swingRate: 2.2,
      chargeDir: 1,
      kitchenWatch: 0,
      walk: 0,
      crouch: 0.34,
      twist: 0.1,
      hand: 1,
      shotKind: "dink",
      lastVolley: -10,
      face: near ? 1 : -1,
      skin: near ? "#e2b08c" : "#c99272",
      shirt: near ? "#1aa39a" : "#e45a43",
      shorts: near ? "#16385c" : "#f0e6d4",
      paddle: near ? "#1aa39a" : "#e45a43",
      visor: near ? "#f4f1e8" : "#1a1a1a",
      hair: "#3b2a1a",
      shoes: "#efe6d8",
      hat: "visor",
      hairStyle: "short",
    };
  }

  applyLook(p, look) {
    if (!p || !look) return;
    p.skin = look.skin || p.skin;
    p.shirt = look.shirt || p.shirt;
    p.shorts = look.shorts || p.shorts;
    p.visor = look.visor || p.visor;
    p.paddle = look.paddle || look.shirt || p.paddle;
    p.hair = look.hair || p.hair;
    p.shoes = look.shoes || p.shoes;
    p.hat = look.hat || "visor";
    p.hairStyle = look.hairStyle || "short";
  }

  loadLook() {
    try {
      const raw = localStorage.getItem(LOOK_KEY);
      if (!raw) return null;
      const look = JSON.parse(raw);
      return look && look.shirt ? look : null;
    } catch {
      return null;
    }
  }

  saveLook() {
    try {
      localStorage.setItem(LOOK_KEY, JSON.stringify(this.youLook));
    } catch {
      /* ignore */
    }
  }

  loadVenue() {
    try {
      const id = localStorage.getItem(VENUE_KEY);
      return VENUES.find((v) => v.id === id) || VENUES[0];
    } catch {
      return VENUES[0];
    }
  }

  setVenue(id) {
    this.venue = VENUES.find((v) => v.id === id) || VENUES[0];
    try {
      localStorage.setItem(VENUE_KEY, this.venue.id);
    } catch {
      /* ignore */
    }
    this.renderVenuePicks();
  }

  randomVenue() {
    const pick = VENUES[(Math.random() * VENUES.length) | 0];
    this.setVenue(pick.id);
  }

  renderVenuePicks() {
    document.querySelectorAll(".venue-grid").forEach((grid) => {
      const kind = grid.dataset.kind;
      grid.innerHTML = "";
      VENUES.filter((v) => v.kind === kind).forEach((v) => {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = v.name;
        b.style.setProperty("--sky", v.sky[0]);
        b.style.setProperty("--court", v.court[1]);
        b.classList.toggle("on", this.venue?.id === v.id);
        b.onclick = () => this.setVenue(v.id);
        grid.appendChild(b);
      });
    });
  }

  rerollLook(who = "you") {
    this.sfx.ensure();
    const canvas = who === "opp" ? $("look-preview-opp") : $("look-preview");
    const btn = who === "opp" ? $("btn-random-look-opp") : $("btn-random-look");
    if (this.lookSpin[who]) cancelAnimationFrame(this.lookSpin[who]);
    canvas?.classList.add("spinning");
    if (btn) btn.disabled = true;
    const start = performance.now();
    const dur = 1000;
    let lastSwap = 0;
    const tick = (now) => {
      const t = clamp((now - start) / dur, 0, 1);
      if (t >= 1) {
        this.commitLook(who, randomLook());
        canvas?.classList.remove("spinning");
        canvas?.classList.add("landed");
        setTimeout(() => canvas?.classList.remove("landed"), 280);
        if (btn) btn.disabled = false;
        this.lookSpin[who] = 0;
        this.sfx.hit(0.45, "dink");
        return;
      }
      const gap = 38 + t * t * 140;
      if (now - lastSwap >= gap) {
        lastSwap = now;
        this.paintLookPreview(canvas, randomLook());
      }
      this.lookSpin[who] = requestAnimationFrame(tick);
    };
    this.lookSpin[who] = requestAnimationFrame(tick);
  }

  commitLook(who, look) {
    if (who === "opp") {
      this.oppLook = look;
      this.applyLook(this.far, look);
    } else {
      this.youLook = look;
      this.saveLook();
      this.applyLook(this.near, look);
    }
    this.drawLookPreview();
  }

  drawLookPreview() {
    this.paintLookPreview($("look-preview"), this.youLook);
    this.paintLookPreview($("look-preview-opp"), this.oppLook);
  }

  paintLookPreview(c, look) {
    if (!c || !look) return;
    const ctx = c.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = 200;
    const h = 260;
    if (c.width !== w * dpr) {
      c.width = w * dpr;
      c.height = h * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(26,111,180,0.35)");
    g.addColorStop(1, "rgba(7,24,44,0.15)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const dummy = {
      ...this.near,
      side: "far",
      swinging: false,
      charging: false,
      charge: 0,
      swing: 0,
      crouch: 0.22,
      twist: 0.04,
      hand: 1,
      shotKind: "dink",
    };
    this.applyLook(dummy, look);
    const prev = this.project.bind(this);
    this.project = () => ({ sx: w / 2, sy: h * 0.9, s: 1.55 });
    this.drawPlayer(ctx, dummy);
    this.project = prev;
  }

  renderLookPicker() {
    this.drawLookPreview();
  }

  makeBall() {
    return {
      x: 10,
      y: 4,
      z: 2.4,
      vx: 0,
      vy: 0,
      vz: 0,
      live: false,
      held: true,
      trail: [],
      lastHit: "near",
      bouncesSide: 0,
      lastBounceSide: null,
    };
  }

  freshMatch() {
    return {
      near: 0,
      far: 0,
      server: "near",
      serveBounced: false,
      returnBounced: false,
      targetRight: true,
      switched: false,
      serverNum: 1,
      startOneServe: true,
    };
  }

  emptyMeta() {
    return { longest: 0, aces: 0, winners: 0, speedups: 0, attackWins: 0, kitchen: 0 };
  }

  bind() {
    const c = this.canvas;
    window.addEventListener("resize", () => this.resize());
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe($("app"));
    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      this.sfx.ensure();
      if (e.code === "Escape") this.togglePause();
      if (e.code === "KeyM") this.toggleMute();
      if ((e.code === "Space" || e.code === "Enter") && this.screen === "play" && this.phase === "replay") {
        this.skipReplay();
        return;
      }
      if (e.code === "Space" && this.screen === "play") this.beginCharge(this.near);
      if (e.code === "Enter" && this.screen === "play" && this.mode === "p2") this.beginCharge(this.far);
    });
    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
      if (e.code === "Space" && this.screen === "play") this.releaseSwing(this.near);
      if (e.code === "Enter" && this.screen === "play" && this.mode === "p2") this.releaseSwing(this.far);
    });
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      this.pointer.x = ((e.clientX - r.left) / r.width) * this.w;
      this.pointer.y = ((e.clientY - r.top) / r.height) * this.h;
      this.pointer.on = true;
    });
    c.addEventListener("pointerdown", (e) => {
      if (this.touch) return;
      if (this.screen !== "play") return;
      this.sfx.ensure();
      if (this.phase === "replay") {
        this.skipReplay();
        return;
      }
      this.pointer.down = true;
      this.beginCharge(this.near);
    });
    window.addEventListener("pointerup", () => {
      if (this.pointer.down) {
        this.pointer.down = false;
        if (this.screen === "play" && !this.touch) this.releaseSwing(this.near);
      }
    });

    $("btn-cpu").onclick = () => this.openRoster("cpu");
    $("btn-doubles").onclick = () => this.openRoster("doubles");
    $("btn-challenge").onclick = () => this.openChallenge();
    $("btn-challenge-back").onclick = () => this.closeChallenge();
    $("btn-challenge-play").onclick = () => this.openScout(Math.min(this.gauntletCleared(), TOURNAMENT.length - 1));
    $("btn-next-challenge").onclick = () => this.playNextChallenge();
    $("btn-scout-play").onclick = () => this.startChallenge(this.scoutIndex);
    $("btn-scout-back").onclick = () => this.closeScout();
    $("btn-p2").onclick = () => this.openRoster("p2");
    $("btn-start-match").onclick = () => this.confirmRoster();
    $("btn-random-look").onclick = () => this.rerollLook("you");
    $("btn-random-look-opp").onclick = () => this.rerollLook("opp");
    $("btn-tune").onclick = () => {
      const card = $("btn-tune").closest(".roster-card");
      const on = card.classList.toggle("tuning");
      $("btn-tune").setAttribute("aria-expanded", String(on));
      $("btn-tune").textContent = on ? "Hide stats & venue" : "Tune stats & venue";
    };
    $("btn-random-venue")?.addEventListener("click", () => this.randomVenue());
    $("btn-random-venue-roster")?.addEventListener("click", () => this.randomVenue());
    this.renderVenuePicks();
    $("btn-roster-back").onclick = () => this.closeRoster();
    $("btn-howto").onclick = () => this.showHowTo(true);
    $("btn-howto-close").onclick = () => this.showHowTo(false);
    $("btn-coach-skip").onclick = () => this.finishTutorial();
    $("btn-tutorial-replay").onclick = () => this.replayTutorial();
    $("btn-pause").onclick = () => this.togglePause();
    $("btn-resume").onclick = () => this.togglePause(false);
    $("btn-menu").onclick = () => this.toMenu();
    $("btn-over-menu").onclick = () => this.toMenu();
    $("btn-rematch").onclick = () => this.startMatch(this.mode);
    $("btn-mute").onclick = () => this.toggleMute();
    $("btn-full").onclick = () => this.toggleFull();
    document.querySelectorAll(".diff button").forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll(".diff button").forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
        this.diff = this.menuDiff = b.dataset.diff;
      };
    });

    this.bindTouch();
    this.buildRosterUI();
    document.body.classList.add("menu-open");
  }

  bindTouch() {
    const stick = $("stick");
    const zone = $("stick-zone");
    const knob = $("knob");
    const swing = $("btn-swing");
    const centerKnob = () => {
      if (!stick.offsetWidth || !knob.offsetWidth) return;
      const rest = (stick.clientWidth - knob.offsetWidth) / 2;
      knob.style.left = `${rest}px`;
      knob.style.top = `${rest}px`;
    };
    const set = (clientX, clientY) => {
      const r = stick.getBoundingClientRect();
      const cx = this.stick.ox ?? r.left + r.width / 2;
      const cy = this.stick.oy ?? r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const m = Math.hypot(dx, dy) || 1;
      const max = r.width * 0.36;
      if (m > max) {
        dx = (dx / m) * max;
        dy = (dy / m) * max;
      }
      const rest = (stick.clientWidth - knob.offsetWidth) / 2;
      knob.style.left = `${rest + dx}px`;
      knob.style.top = `${rest + dy}px`;
      this.stick.dx = dx / max;
      this.stick.dy = dy / max;
    };
    const on = (e) => {
      const t = e.touches ? e.touches[0] : e;
      // Floating origin, but pulled inward so a full deflection in every
      // direction stays on screen. Without this, a thumb landing on the
      // left/bottom edge of the pad could only travel a few px further
      // left/down (and iOS eats swipes that start at the screen edge).
      const r = stick.getBoundingClientRect();
      const margin = r.width / 2 + 16;
      this.stick.ox = Math.min(Math.max(t.clientX, margin), window.innerWidth - margin);
      this.stick.oy = Math.min(Math.max(t.clientY, margin), window.innerHeight - margin);
      // Park the pad under the thumb for this touch.
      const z = zone.getBoundingClientRect();
      stick.style.setProperty("--sx", `${this.stick.ox - z.left}px`);
      stick.style.setProperty("--sy", `${this.stick.oy - z.top}px`);
      stick.classList.add("floating");
      this.stick.active = true;
      this.touch = true;
      $("touch").hidden = false;
      $("keys-hint")?.classList.add("touch");
      set(t.clientX, t.clientY);
    };
    const off = () => {
      this.stick.active = false;
      this.stick.ox = this.stick.oy = null;
      this.stick.dx = 0;
      this.stick.dy = 0;
      stick.classList.remove("floating");
      centerKnob();
    };
    zone.addEventListener("pointerdown", (e) => {
      if (this.stick.active) return;
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      this.stick.pid = e.pointerId;
      on(e);
    });
    zone.addEventListener("pointermove", (e) => {
      if (!this.stick.active || e.pointerId !== this.stick.pid) return;
      e.preventDefault();
      set(e.clientX, e.clientY);
    });
    const offIf = (e) => {
      if (e.pointerId === this.stick.pid) off();
    };
    zone.addEventListener("pointerup", offIf);
    zone.addEventListener("pointercancel", offIf);
    zone.addEventListener("lostpointercapture", offIf);
    swing.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      swing.setPointerCapture(e.pointerId);
      this.touch = true;
      $("touch").hidden = false;
      $("keys-hint")?.classList.add("touch");
      if (this.phase === "replay") {
        this.skipReplay();
        return;
      }
      this.beginCharge(this.near);
    });
    const finishSwing = () => this.releaseSwing(this.near);
    swing.addEventListener("pointerup", finishSwing);
    swing.addEventListener("pointercancel", finishSwing);
    swing.addEventListener("lostpointercapture", finishSwing);
    window.addEventListener(
      "touchstart",
      () => {
        this.touch = true;
        $("touch").hidden = false;
        $("keys-hint")?.classList.add("touch");
      },
      { once: true }
    );
    const unlockAudio = () => {
      this.sfx.unlock();
      if (this.sfx.ctx && this.sfx.ctx.state === "running" && this.sfx.unlocked) {
        for (const ev of ["touchend", "pointerup", "click", "keydown"]) window.removeEventListener(ev, unlockAudio, true);
      }
    };
    for (const ev of ["touchend", "pointerup", "click", "keydown"]) window.addEventListener(ev, unlockAudio, true);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const box = $("app") || this.canvas;
    const cw = Math.floor(box.clientWidth || 0);
    const ch = Math.floor(box.clientHeight || 0);
    this.w = cw > 120 ? cw : Math.max(800, Math.floor(window.innerWidth));
    this.h = ch > 120 ? ch : Math.max(480, Math.floor(window.innerHeight));
    // The court projection expands with the canvas, while players and the ball
    // are drawn in pixels. Scale those world objects too so a large desktop
    // canvas does not make the action look miniature.
    const referenceArea = 1056 * 857;
    this.worldScale = clamp(Math.sqrt((this.w * this.h) / referenceArea), 1, 1.7);
    // Portrait phones: the court is only a few hundred pixels wide, so shrink
    // the sprites with the width and flatten the camera so the far court is
    // not a sliver. Otherwise players tower over a strip of court.
    this.portrait = this.h > this.w * 1.15;
    if (this.portrait) this.worldScale = clamp(this.w / 640, 0.58, 1);
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.view = {
      top: this.portrait ? Math.max(140, this.h * 0.19) : Math.max(72, this.h * 0.12),
      bot: this.h - (this.portrait ? Math.max(150, this.h * 0.2) : Math.max(52, this.h * 0.07)),
      d0: this.portrait ? 60 : 42,
      near: this.portrait ? 1.0 : 1.08,
      halfK: this.portrait ? 0.46 : 0.39,
    };
    if (this.match && $("serve-tag")) this.syncHud();
  }

  courtT(y) {
    const d0 = this.view.d0;
    const d = d0 + y;
    const d1 = d0 + CL;
    return (1 / d0 - 1 / d) / (1 / d0 - 1 / d1);
  }

  yFromCourtT(t) {
    const d0 = this.view.d0;
    const d1 = d0 + CL;
    const inv = 1 / d0 - t * (1 / d0 - 1 / d1);
    return 1 / inv - d0;
  }

  project(x, y, z) {
    const d0 = this.view.d0;
    const t = this.courtT(y);
    const persp = this.view.near * (d0 / Math.max(8, d0 + y));
    const worldScale = this.worldScale || 1;
    const shake = this.shake ? this.shake * (Math.random() - 0.5) : 0;
    const sy = lerp(this.view.bot, this.view.top, t) - z * 13.2 * persp * worldScale + shake;
    const half = this.w * this.view.halfK * persp;
    const sx = this.w / 2 + this.camX + ((x - 10) / 10) * half;
    return { sx, sy, s: persp * worldScale };
  }

  unproject(sx, sy) {
    const { top, bot } = this.view;
    const t = clamp((bot - sy) / (bot - top), -0.12, 1.15);
    const y = this.yFromCourtT(t);
    const d0 = this.view.d0;
    const persp = this.view.near * (d0 / (d0 + y));
    const half = this.w * this.view.halfK * persp;
    const x = 10 + ((sx - this.w / 2 - this.camX) / half) * 10;
    return { x, y };
  }

  startMatch(mode) {
    this.mode = mode;
    this.demo = false;
    this.screen = "play";
    this.paused = false;
    this.replay = null;
    this.tape = [];
    this.applyBuild(this.near, mode === "challenge" ? this.challengeBuild() : this.youBuild);
    this.applyBuild(this.far, this.oppBuild);
    this.applyLook(this.near, this.youLook);
    this.applyLook(this.far, this.oppLook);
    if (mode === "doubles") {
      this.applyBuild(this.nearB, PRESETS.kitchen);
      this.applyBuild(this.farB, this.oppBuild);
      this.applyLook(this.nearB, tintLook(this.youLook, 0.72));
      this.applyLook(this.farB, tintLook(this.oppLook, 0.72));
    }
    document.body.classList.remove("menu-open");
    document.body.classList.add("game-open");
    $("menu").hidden = true;
    $("roster").hidden = true;
    $("howto").hidden = true;
    $("challenge").hidden = true;
    $("scout").hidden = true;
    $("pause").hidden = true;
    $("over").hidden = true;
    $("tourney-upgrade").hidden = true;
    $("btn-rematch").hidden = false;
    const hud = $("hud");
    hud.hidden = false;
    hud.classList.toggle("p2-layout", mode === "p2");
    $("keys-p2").hidden = mode !== "p2";
    $("keys-label").textContent = mode === "p2" ? "player 1 · tap dink · hold speed-up" : "tap dink · hold speed-up";
    $("name-near").textContent = mode === "doubles" ? "YOU" : this.youBuild.name || "YOU";
    $("name-far").textContent =
      mode === "p2" ? this.oppBuild.name || "P2" : mode === "doubles" ? "THEM" : this.oppBuild.name || "CPU";
    $("btn-next-challenge").hidden = true;
    this.match = this.freshMatch();
    this.meta = this.emptyMeta();
    this.resetPoint();
    this.flash("PLAY", 0.8);
    this.sfx.whistle();
    this.syncHud();
    if (mode === "cpu" && !this.tutorialDone()) this.startTutorial();
    else this.hideTutorial();
  }

  applyBuild(p, build) {
    const st = emptyStats();
    for (const id of STAT_IDS) st[id] = clamp(Number(build?.[id]) || 6, 2, 10);
    p.stats = st;
    p.baseSpeed = 7.6 + st.speed * 0.4;
    p.speed = p.baseSpeed;
    p.powerMul = 0.58 + st.power * 0.085;
    p.aimSpread = lerp(4.4, 0.16, st.angle / 10);
    p.serveSkill = st.serve;
    p.hands = st.hands;
    p.reachFt = 1.5 + st.reach * 0.38;
  }

  inReach(p, x, y, z) {
    let reach = p.reachFt || 3.3;
    if (this.isCpuSide(p) && !this.demo && !this.returningServe(p)) reach *= DIFF[this.diff]?.reach ?? 1;
    else if (p === this.near && this.touch && this.isHuman(p)) reach *= 1.15;
    const dx = x - p.x;
    const dy = y - p.y;
    const forward = p.side === "near" ? dy : -dy;
    const bouncedHere = this.ball && this.ball.lastBounceSide === p.side;
    const kit = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.4;
    const h = (p.hands || 6) / 10;
    const volleyHere = kit && !bouncedHere;
    let fwdMax = reach + 0.45 + (kit ? 0.06 + h * 0.85 : 0) + (bouncedHere ? 0.35 : 0) + (volleyHere ? 0.5 : 0);
    let sideMax = reach * 1.05 + (kit ? 0.06 + h * 0.55 : 0) + (bouncedHere ? 0.25 : 0) + (volleyHere ? 0.4 : 0);
    const backMax = (bouncedHere ? 2.0 : 1.15) + (kit ? h * 0.35 : 0) + (volleyHere ? 0.35 : 0);
    if (z > 4.9) {
      fwdMax *= 0.78;
      sideMax *= 0.78;
    }
    if (forward < -backMax || forward > fwdMax) return false;
    if (Math.abs(dx) > sideMax) return false;
    const fy = forward >= 0 ? fwdMax : backMax;
    if ((dx / sideMax) ** 2 + (forward / fy) ** 2 > 1.18) return false;
    if (z < (bouncedHere ? 0.04 : 0.12) || z > 6.3) return false;
    return true;
  }

  needsBounce(p) {
    return (
      (p.side !== this.match.server && !this.match.serveBounced) ||
      (p.side === this.match.server && !this.match.returnBounced)
    );
  }

  returningServe(p) {
    return (
      this.phase === "rally" &&
      this.rallyLen === 1 &&
      p.side !== this.match.server &&
      !this.match.returnBounced
    );
  }

  atKitchenLine(p) {
    return Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
  }

  ballAttackable(p) {
    const b = this.ball;
    if (!b || !b.live) return false;
    if (this.needsBounce(p)) return false;
    const tape = netHeightAt(clamp(b.x, 0, CW));
    return b.z >= tape + 0.35;
  }

  canContact(p, b) {
    if (!b || !b.live) return false;
    if (this.needsBounce(p) && b.lastBounceSide !== p.side) return false;
    if (b.lastHit === p.side) {
      const crossed = p.side === "near" ? b.y > NET_Y + 0.35 : b.y < NET_Y - 0.35;
      if (!crossed) return false;
    }
    const onSide = p.side === "near" ? b.y <= NET_Y + 0.55 : b.y >= NET_Y - 0.55;
    if (!onSide) return false;
    if (this.inReach(p, b.x, b.y, b.z)) return true;
    const hopped = b.lastBounceSide === p.side;
    if (!hopped) return false;
    const kit = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.4;
    let look = 0.03 + (p.hands || 6) * 0.028 + (kit ? 0.05 : 0) + (hopped ? 0.08 : 0);
    if (this.isCpuSide(p) && !this.demo && this.diff !== "hard" && !this.returningServe(p)) look *= 0.42;
    let x = b.x;
    let y = b.y;
    let z = b.z;
    let vx = b.vx;
    let vy = b.vy;
    let vz = b.vz;
    const steps = Math.max(3, Math.ceil(look * 60));
    const dt = look / steps;
    for (let i = 0; i < steps; i++) {
      vz -= G * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      if (z < 0) break;
      if (this.inReach(p, x, y, z)) return true;
    }
    return false;
  }

  isHuman(p) {
    return p === this.near || (this.mode === "p2" && p === this.far);
  }

  closestOpp(p) {
    const opps = this.allPlayers().filter((o) => o.side !== p.side);
    let opp = p.side === "near" ? this.far : this.near;
    if (!opps.length) return opp;
    opp = opps[0];
    let best = dist(p.x, p.y, opp.x, opp.y);
    for (const o of opps) {
      const d2 = dist(p.x, p.y, o.x, o.y);
      if (d2 < best) {
        best = d2;
        opp = o;
      }
    }
    return opp;
  }

  aimAxes(p) {
    let ax = 0;
    let ay = 0;
    if (p === this.near) {
      const arrows = this.mode !== "p2";
      if (this.keys.has("KeyA") || (arrows && this.keys.has("ArrowLeft"))) ax -= 1;
      if (this.keys.has("KeyD") || (arrows && this.keys.has("ArrowRight"))) ax += 1;
      if (this.keys.has("KeyW") || (arrows && this.keys.has("ArrowUp"))) ay += 1;
      if (this.keys.has("KeyS") || (arrows && this.keys.has("ArrowDown"))) ay -= 1;
      if (this.stick.active) {
        ax += this.stick.dx;
        ay -= this.stick.dy;
      }
    } else if (this.mode === "p2" && p === this.far) {
      if (this.keys.has("ArrowLeft")) ax -= 1;
      if (this.keys.has("ArrowRight")) ax += 1;
      if (this.keys.has("ArrowUp")) ay += 1;
      if (this.keys.has("ArrowDown")) ay -= 1;
    }
    return { ax: clamp(ax, -1, 1), ay: clamp(ay, -1, 1) };
  }

  chooseShotKind(p, b, power) {
    const kitLine = p.side === "near" ? 15 : 29;
    const atKitchen = Math.abs(p.y - kitLine) < 3.1;
    const atBase = p.side === "near" ? p.y < 8 : p.y > 36;
    const thirdShot = this.match.serveBounced && !this.match.returnBounced && p.side === this.match.server;
    const { ay } = this.isHuman(p) ? this.aimAxes(p) : { ay: 0 };
    const wantLob = this.isHuman(p)
      ? ay > 0.35 && power > 0.35 && !atKitchen
      : (p.side === "near" ? this.keys.has("KeyW") : this.keys.has("ArrowUp")) && power > 0.35;
    if (atKitchen && power >= 0.36 && this.ballAttackable(p)) return b && b.z > 4.8 ? "smash" : "speedup";
    if (atKitchen && power >= 0.5) return "speedup";
    if (wantLob) return "lob";
    if (b && b.z > 5.2 && Math.abs(p.y - NET_Y) < 10 && power >= 0.45) return "smash";
    if (thirdShot || (atBase && power < 0.5)) return "drop";
    if (power < 0.42 || atKitchen) return "dink";
    return "drive";
  }

  shotFlight(p, kind, power) {
    const kitLine = p.side === "near" ? 15 : 29;
    const atKitchen = Math.abs(p.y - kitLine) < 3.1;
    if (kind === "lob") return lerp(1.45, 1.75, power);
    if (kind === "smash") return 0.62;
    if (kind === "speedup") return lerp(0.62, 0.46, power);
    if (kind === "drop") return lerp(1.32, 1.5, 1 - power);
    if (kind === "dink") return atKitchen ? lerp(0.78, 0.92, 1 - power) : lerp(0.95, 1.12, 1 - power);
    return lerp(1.06, 0.86, power);
  }

  humanLand(p, kind, power, opp) {
    const { ax, ay } = this.aimAxes(p);
    const near = p.side === "near";
    const aimingX = Math.abs(ax) > 0.12;
    let tx;
    if (aimingX) tx = 10 + ax * 7.8;
    else if (kind === "speedup" || kind === "smash") tx = opp ? opp.x : 10;
    else tx = clamp(lerp(10, 20 - p.x, 0.4), 4.2, 15.8);
    tx = clamp(tx, 1.8, 18.2);

    let ty;
    if (kind === "dink" || kind === "drop") {
      const t = clamp(0.5 + ay * 0.45, 0, 1);
      ty = near ? lerp(25.5, 28.7, t) : lerp(18.5, 15.3, t);
    } else if (kind === "lob") {
      const t = clamp(0.55 + ay * 0.4, 0, 1);
      ty = near ? lerp(34, 42.4, t) : lerp(10, 1.8, t);
    } else if (kind === "speedup" || kind === "smash") {
      const t = clamp(0.35 + ay * 0.45, 0, 1);
      ty = near ? lerp(27.4, 30.6, t) : lerp(16.6, 13.4, t);
      if (aimingX) tx = clamp((opp ? opp.x : 10) + ax * 6.8, 2, 18);
    } else {
      const t = clamp(0.32 + power * 0.28 + ay * 0.42, 0, 1);
      ty = near ? lerp(27.4, 41.2, t) : lerp(16.6, 2.8, t);
    }
    return { tx, ty };
  }

  cpuLand(p, b, kind, opp) {
    const tactic = this.aiTactic(p);
    const target = tactic?.target || "open";
    const useBody = target === "body" || (target === "adaptive" && this.rallyLen % 3 === 0);
    const open = useBody ? opp.x + rand(-0.65, 0.65) : opp.x < 10 ? rand(11.5, 17.4) : rand(2.6, 8.5);
    let tx = clamp(open, 2.2, 17.8);
    let ty;
    if (kind === "lob") {
      ty = p.side === "near" ? rand(37, 42) : rand(2, 7);
    } else if (kind === "speedup" || kind === "smash") {
      ty = p.side === "near" ? clamp((opp.y || 30) - 0.2, 27.6, 30.8) : clamp((opp.y || 14) + 0.2, 13.2, 16.4);
      tx = clamp(opp.x + (Math.random() - 0.5) * 1.2, 3, 17);
    } else if (kind === "drop") {
      ty = p.side === "near" ? rand(26.2, 28.6) : rand(15.4, 17.8);
    } else if (kind === "dink") {
      ty = p.side === "near" ? rand(25.8, 28.4) : rand(15.6, 18.2);
    } else {
      ty = p.side === "near" ? rand(31, 39) : rand(5, 13);
    }
    return { tx, ty };
  }

  openRoster(mode) {
    this.pendingMode = mode;
    $("menu").hidden = true;
    $("howto").hidden = true;
    $("challenge").hidden = true;
    $("roster").hidden = false;
    $("opp-label").textContent = mode === "p2" ? "Player 2" : mode === "doubles" ? "Their team" : "Opponent";
    if (mode === "cpu") {
      const map = { easy: "touch", normal: "balanced", hard: "athlete" };
      this.setBuild("opp", PRESETS[map[this.diff] || "balanced"], map[this.diff] || "balanced");
    }
    this.oppLook = randomLook();
    this.refreshRoster();
    this.renderLookPicker();
  }

  closeRoster() {
    $("roster").hidden = true;
    $("menu").hidden = false;
  }

  confirmRoster() {
    if (statSum(this.youBuild) > STAT_BUDGET || statSum(this.oppBuild) > STAT_BUDGET) return;
    this.startMatch(this.pendingMode);
  }

  setBuild(who, stats, presetId) {
    const name = stats.name || (presetId === "random" ? "Random" : "Custom");
    const next = { name, ...cloneStats(stats) };
    delete next.name;
    const build = { name, ...next };
    if (who === "you") this.youBuild = build;
    else {
      this.oppBuild = build;
      this.oppLook = randomLook();
    }
    this.refreshRoster(presetId ? { [who]: presetId } : null);
    this.drawLookPreview();
  }

  buildRosterUI() {
    for (const who of ["you", "opp"]) {
      const presets = $(`presets-${who}`);
      presets.innerHTML = "";
      for (const [id, pre] of Object.entries(PRESETS)) {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.id = id;
        b.textContent = pre.name;
        b.onclick = () => this.setBuild(who, pre, id);
        presets.appendChild(b);
      }
      const r = document.createElement("button");
      r.type = "button";
      r.className = "wide";
      r.textContent = "Random";
      r.onclick = () => this.setBuild(who, { name: "Random", ...rollStats() }, "random");
      presets.appendChild(r);
      const list = $(`stats-${who}`);
      list.innerHTML = "";
      for (const [id, label, desc] of STAT_LIST) {
        const row = document.createElement("div");
        row.className = "stat-row";
        row.innerHTML = `<label title="${desc}">${label}</label><input type="range" min="2" max="10" step="1" data-stat="${id}" /><span class="n">6</span>`;
        const input = row.querySelector("input");
        input.oninput = () => this.onStatSlide(who, id, +input.value);
        list.appendChild(row);
      }
    }
    this.refreshRoster();
  }

  onStatSlide(who, id, val) {
    const build = who === "you" ? this.youBuild : this.oppBuild;
    const prev = build[id];
    build[id] = val;
    let extra = statSum(build) - STAT_BUDGET;
    if (extra > 0) {
      for (const other of STAT_IDS) {
        if (other === id || extra <= 0) continue;
        const take = Math.min(build[other] - 2, extra);
        build[other] -= take;
        extra -= take;
      }
      if (extra > 0) build[id] = prev;
    }
    build.name = "Custom";
    this.refreshRoster();
  }

  refreshRoster() {
    for (const who of ["you", "opp"]) {
      const build = who === "you" ? this.youBuild : this.oppBuild;
      const sum = statSum(build);
      const bud = $(`budget-${who}`);
      bud.textContent = `${sum} / ${STAT_BUDGET}`;
      bud.classList.toggle("over", sum > STAT_BUDGET);
      $(`stats-${who}`).querySelectorAll("input[data-stat]").forEach((input) => {
        const id = input.dataset.stat;
        input.value = String(build[id]);
        input.parentElement.querySelector(".n").textContent = String(build[id]);
      });
      $(`presets-${who}`).querySelectorAll("button").forEach((b) => {
        b.classList.toggle("on", b.textContent === build.name);
      });
    }
    $("btn-start-match").disabled = statSum(this.youBuild) > STAT_BUDGET || statSum(this.oppBuild) > STAT_BUDGET;
  }

  toMenu() {
    if (this.challengeOriginalVenue) this.venue = this.challengeOriginalVenue;
    this.screen = "menu";
    this.demo = true;
    this.mode = "cpu";
    this.paused = false;
    this.replay = null;
    this.challengeIndex = -1;
    this.challengeRunActive = false;
    this.challengeBoosts = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
    this.challengeOriginalVenue = null;
    this.diff = this.menuDiff || "normal";
    document.body.classList.add("menu-open");
    document.body.classList.remove("game-open");
    this.hideTutorial();
    $("menu").hidden = false;
    $("roster").hidden = true;
    $("pause").hidden = true;
    $("over").hidden = true;
    $("howto").hidden = true;
    $("challenge").hidden = true;
    $("scout").hidden = true;
    $("hud").hidden = true;
    this.match = this.freshMatch();
    this.applyLook(this.near, this.youLook);
    this.oppLook = randomLook();
    this.applyLook(this.far, this.oppLook);
    this.resetPoint();
  }

  showHowTo(on) {
    $("howto").hidden = !on;
    $("menu").hidden = on;
  }

  tutorialDone() {
    try {
      return localStorage.getItem(TUTORIAL_KEY) === "done";
    } catch {
      return false;
    }
  }

  startTutorial() {
    this.tutorial.active = true;
    this.tutorial.step = 0;
    this.renderTutorial();
  }

  advanceTutorial(step) {
    if (!this.tutorial.active || step <= this.tutorial.step) return;
    this.tutorial.step = Math.min(2, step);
    this.renderTutorial();
  }

  finishTutorial() {
    this.tutorial.active = false;
    $("coach").hidden = true;
    try {
      localStorage.setItem(TUTORIAL_KEY, "done");
    } catch {
      /* ignore */
    }
    if (this.screen === "play") this.toast("Guided start complete");
  }

  hideTutorial() {
    this.tutorial.active = false;
    $("coach").hidden = true;
  }

  replayTutorial() {
    try {
      localStorage.removeItem(TUTORIAL_KEY);
    } catch {
      /* ignore */
    }
    this.showHowTo(false);
    $("ctrl-hint").textContent = "Guided tutorial ready. Start Singles vs CPU to replay it.";
  }

  renderTutorial() {
    if (!this.tutorial.active) return;
    const touch = this.isTouchInput();
    const steps = [
      {
        title: "Move and aim",
        copy: touch
          ? "Drag the left stick. Movement also aims where your next shot will land."
          : "Press WASD. Movement also aims where your next shot will land.",
      },
      {
        title: "Serve underhand",
        copy: touch
          ? "Tap SWING for a soft serve, or hold briefly for more pace."
          : "Tap Space for a soft serve, or hold briefly for more pace.",
      },
      {
        title: "Respect the two-bounce rule",
        copy: touch
          ? "Let the return bounce, then tap SWING. Not sure of the timing? Hold SWING and it fires itself when the ball arrives."
          : "Let the opponent's return bounce on your side, then tap Space to send it back.",
      },
    ];
    const step = steps[this.tutorial.step];
    $("coach-step").textContent = `Guided start · ${this.tutorial.step + 1} / ${steps.length}`;
    $("coach-title").textContent = step.title;
    $("coach-copy").textContent = step.copy;
    $("coach").hidden = false;
  }

  togglePause(force) {
    if (this.screen !== "play") return;
    this.paused = force == null ? !this.paused : force;
    $("pause").hidden = !this.paused;
  }

  toggleMute() {
    this.sfx.muted = !this.sfx.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.sfx.muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    this.syncSoundButton();
  }

  syncSoundButton() {
    const button = $("btn-mute");
    button.textContent = this.sfx.muted ? "✕" : "♪";
    button.title = this.sfx.muted ? "Unmute sound" : "Mute sound";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-pressed", String(this.sfx.muted));
  }

  isTouchInput() {
    return this.touch || window.matchMedia("(pointer: coarse)").matches;
  }

  toggleFull() {
    const el = $("app") || document.documentElement;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  isDoubles() {
    return this.mode === "doubles";
  }

  matchTargetScore() {
    return this.mode === "challenge" ? TOURNAMENT[this.challengeIndex]?.points || 11 : 11;
  }

  isCpuSide(p) {
    if (p === this.near) return false;
    return this.mode === "cpu" || this.mode === "doubles" || this.mode === "challenge";
  }

  allPlayers() {
    return this.isDoubles() ? [this.near, this.nearB, this.far, this.farB] : [this.near, this.far];
  }

  serverPlayer() {
    if (!this.isDoubles()) return this.match.server === "near" ? this.near : this.far;
    if (this.match.server === "near") return this.match.serverNum === 1 ? this.near : this.nearB;
    return this.match.serverNum === 1 ? this.far : this.farB;
  }
  receiverPlayer() {
    if (!this.isDoubles()) return this.match.server === "near" ? this.far : this.near;
    const even = this.evenScore();
    if (this.match.server === "near") return even ? this.far : this.farB;
    return even ? this.near : this.nearB;
  }
  evenScore() {
    return this.match[this.match.server] % 2 === 0;
  }

  gauntletCleared() {
    try {
      const n = parseInt(localStorage.getItem(TOURNEY_KEY) || "0", 10);
      return Number.isFinite(n) ? clamp(n, 0, TOURNAMENT.length) : 0;
    } catch {
      return 0;
    }
  }

  saveGauntlet(n) {
    try {
      localStorage.setItem(TOURNEY_KEY, String(clamp(n, 0, TOURNAMENT.length)));
    } catch {
      /* ignore */
    }
  }

  tournamentRecords() {
    try {
      const saved = JSON.parse(localStorage.getItem(TOURNEY_RECORD_KEY) || "{}");
      return saved && typeof saved === "object" ? saved : {};
    } catch {
      return {};
    }
  }

  saveTournamentResult(i, grade, won, objectiveMet) {
    const records = this.tournamentRecords();
    const previous = records[i] || { attempts: 0, wins: 0, objectives: 0, bestGrade: "" };
    const grades = ["", "D", "C", "B", "A", "S"];
    const better = grades.indexOf(grade) > grades.indexOf(previous.bestGrade || "");
    records[i] = {
      attempts: previous.attempts + 1,
      wins: previous.wins + (won ? 1 : 0),
      objectives: previous.objectives + (won && objectiveMet ? 1 : 0),
      bestGrade: better ? grade : previous.bestGrade,
    };
    try {
      localStorage.setItem(TOURNEY_RECORD_KEY, JSON.stringify(records));
    } catch {
      /* ignore */
    }
    return records[i];
  }

  openChallenge() {
    $("menu").hidden = true;
    $("roster").hidden = true;
    $("howto").hidden = true;
    $("scout").hidden = true;
    $("challenge").hidden = false;
    this.renderChallengeList();
  }

  closeChallenge() {
    $("challenge").hidden = true;
    $("menu").hidden = false;
  }

  renderChallengeList() {
    const unlocked = this.gauntletCleared();
    const map = $("tourney-map");
    map.innerHTML = "";
    const you = document.createElement("div");
    you.className = "map-you";
    you.innerHTML = `<span class="dot"></span><span>You · start</span>`;
    map.appendChild(you);
    TOURNAMENT.forEach((rnd, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "map-node";
      const done = i < unlocked;
      const lock = i > unlocked;
      const now = i === unlocked || (unlocked >= TOURNAMENT.length && i === TOURNAMENT.length - 1);
      btn.classList.toggle("done", done);
      btn.classList.toggle("locked", lock);
      btn.classList.toggle("now", now && !lock);
      const record = this.tournamentRecords()[i];
      const tag = done ? `Won${record?.bestGrade ? ` · ${record.bestGrade}` : ""}` : lock ? "Locked" : "You are here";
      btn.innerHTML = `<span class="round-meta"><strong>${rnd.round}</strong><em>${rnd.name} · ${rnd.style} · to ${rnd.points}</em></span><span class="tag">${tag}</span>`;
      if (!lock) btn.onclick = () => this.openScout(i);
      map.appendChild(btn);
    });
    const n = unlocked;
    const next = TOURNAMENT[Math.min(n, TOURNAMENT.length - 1)];
    $("btn-challenge-play").textContent = n >= TOURNAMENT.length ? `Replay ${next.round} · ${next.name}` : `Play ${next.round} · ${next.name}`;
    map.querySelector(".map-node.now")?.scrollIntoView({ block: "nearest" });
    $("challenge-lede").textContent =
      n >= TOURNAMENT.length
        ? "Champion. Tap any round to scout and replay."
        : `${n} / ${TOURNAMENT.length} won. Climb the map — each opponent is stronger.`;
  }

  openScout(i) {
    const rnd = TOURNAMENT[i];
    this.scoutIndex = i;
    $("challenge").hidden = true;
    $("over").hidden = true;
    $("scout").hidden = false;
    $("scout-kicker").textContent = rnd.round;
    $("scout-title").textContent = rnd.name;
    $("scout-vs").textContent = `YOU vs ${rnd.name}`;
    $("scout-blurb").textContent = `${rnd.style}. ${rnd.blurb}`;
    const venue = VENUES.find((v) => v.id === rnd.venue);
    $("scout-diff").textContent = `Difficulty · ${rnd.diff} · First to ${rnd.points} · ${venue?.name || "Tournament court"}`;
    $("scout-tactic").textContent = `${rnd.tactic.label}. ${rnd.tactic.tell}`;
    $("scout-counter").textContent = rnd.tactic.counter;
    $("scout-objective").textContent = `${rnd.objective.label}. Clear it for a +2 winner's boost.`;
    const record = this.tournamentRecords()[i];
    $("scout-record").textContent = record
      ? `Best grade ${record.bestGrade || "—"} · ${record.wins} win${record.wins === 1 ? "" : "s"} · ${record.objectives} bonus clear${record.objectives === 1 ? "" : "s"}`
      : "No match history yet";
    const boosts = this.challengeBoostSummary();
    $("scout-boosts").hidden = !boosts;
    $("scout-boosts").textContent = boosts ? `Run boosts · ${boosts}` : "";
    const box = $("scout-stats");
    box.innerHTML = "";
    const st = rnd.stats;
    STAT_LIST.forEach(([id, label]) => {
      const row = document.createElement("div");
      row.className = "scout-stat";
      const v = st[id] || 0;
      row.innerHTML = `<span>${label} ${v}</span><div class="scout-bar"><i style="width:${(v / 10) * 100}%"></i></div>`;
      box.appendChild(row);
    });
  }

  closeScout() {
    $("scout").hidden = true;
    $("challenge").hidden = false;
    this.renderChallengeList();
  }

  startChallenge(i) {
    if (!this.challengeRunActive) {
      this.challengeRunActive = true;
      this.challengeBoosts = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
      this.challengeOriginalVenue = this.venue;
    }
    this.challengeIndex = i;
    const rnd = TOURNAMENT[i];
    this.diff = rnd.diff;
    this.oppBuild = { ...cloneStats(rnd.stats), name: rnd.name };
    this.oppLook = { ...(rnd.look || randomLook()) };
    this.venue = VENUES.find((v) => v.id === rnd.venue) || this.venue;
    $("challenge").hidden = true;
    $("scout").hidden = true;
    this.startMatch("challenge");
    this.flash(rnd.round, 1.15);
    this.toast(`${this.venue.name} · ${rnd.tactic.label}`);
    if (i >= TOURNAMENT.length - 2) this.sfx.crowd(i === TOURNAMENT.length - 1 ? 1.6 : 1.05);
  }

  playNextChallenge() {
    const next = this.challengeIndex + 1;
    if (next >= TOURNAMENT.length || this.gauntletCleared() === 0) {
      this.toMenu();
      this.openChallenge();
      return;
    }
    $("over").hidden = true;
    this.openScout(next);
  }

  challengeBuild() {
    const build = { ...this.youBuild };
    for (const id of STAT_IDS) build[id] = clamp((this.youBuild[id] || 6) + (this.challengeBoosts[id] || 0), 2, 10);
    return build;
  }

  challengeObjectiveState() {
    const objective = TOURNAMENT[this.challengeIndex]?.objective;
    if (!objective) return { current: 0, target: 0, met: false, label: "" };
    let current = 0;
    if (objective.type === "margin") current = Math.max(0, this.match.near - this.match.far);
    else current = this.meta[objective.type] || 0;
    const met = current >= objective.value && (objective.type !== "margin" || this.match.near > this.match.far);
    return { current, target: objective.value, met, label: objective.label, type: objective.type };
  }

  challengeGrade(won, objectiveMet) {
    if (!won) return "D";
    const margin = this.match.near - this.match.far;
    let score = 2 + (objectiveMet ? 1 : 0) + (margin >= 3 ? 1 : 0) + (this.match.far === 0 ? 1 : 0);
    if (score >= 5) return "S";
    if (score === 4) return "A";
    if (score === 3) return "B";
    return "C";
  }

  challengeBoostSummary() {
    return STAT_LIST
      .filter(([id]) => (this.challengeBoosts[id] || 0) > 0)
      .map(([id, label]) => `${label} +${this.challengeBoosts[id]}`)
      .join(" · ");
  }

  challengeUpgradeChoices() {
    const build = this.challengeBuild();
    const available = STAT_IDS.filter((id) => build[id] < 10);
    const picked = [];
    const start = (this.challengeIndex * 2 + statSum(this.challengeBoosts)) % Math.max(1, available.length);
    for (let step = 0; picked.length < Math.min(3, available.length); step++) {
      const id = available[(start + step) % available.length];
      if (!picked.includes(id)) picked.push(id);
    }
    return picked;
  }

  showChallengeUpgrades() {
    const section = $("tourney-upgrade");
    const choices = $("upgrade-choices");
    const bonus = this.challengeObjectiveState().met;
    const amount = bonus ? 2 : 1;
    $("upgrade-kicker").textContent = bonus ? "Bonus cleared · Power boost" : "Winner's boost";
    choices.innerHTML = "";
    for (const id of this.challengeUpgradeChoices()) {
      const info = STAT_UPGRADES[id];
      const gain = Math.min(amount, 10 - this.challengeBuild()[id]);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "upgrade-choice";
      button.dataset.stat = id;
      button.dataset.amount = String(gain);
      button.innerHTML = `<strong>${info.label} +${gain}</strong><span>${info.desc}</span>`;
      button.onclick = () => this.chooseChallengeUpgrade(id, gain);
      choices.appendChild(button);
    }
    section.hidden = false;
    $("btn-rematch").hidden = true;
    $("btn-next-challenge").hidden = true;
  }

  chooseChallengeUpgrade(id, amount = 1) {
    if (!STAT_IDS.includes(id) || this.challengeBuild()[id] >= 10) return;
    const gain = clamp(Number(amount) || 1, 1, 2);
    this.challengeBoosts[id] = Math.min(10 - (this.youBuild[id] || 6), (this.challengeBoosts[id] || 0) + gain);
    $("tourney-upgrade").hidden = true;
    this.playNextChallenge();
  }

  buzz(ms) {
    if (this.time - (this.lastBuzz || 0) < 0.28) return;
    this.lastBuzz = this.time;
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* ignore */
    }
  }

  resetPoint() {
    const m = this.match;
    m.serveBounced = false;
    m.returnBounced = false;
    this.rallyLen = 0;
    this.phase = "serve";
    this.serveT = 0;
    this.deadT = 0;
    this.ball = this.makeBall();
    this.ball.held = true;
    this.ball.lastHit = m.server;
    this.tape = [];
    this.pendingHit = null;
    for (const p of [this.near, this.far, this.nearB, this.farB]) {
      p.swing = 0;
      p.swinging = false;
      p.charging = false;
      p.charge = 0;
      p.lastVolley = -10;
      p.kitchenWatch = 0;
      p.chargeDir = 1;
      p.aiWind = 0;
      p.aiChaseX = null;
      p.aiTrackHit = null;
      p.aiWhiff = false;
    }

    const even = this.evenScore();
    m.targetRight = even;
    if (this.isDoubles()) this.placeDoubles(even);
    else if (m.server === "near") {
      this.near.x = even ? 15.2 : 4.8;
      this.near.y = -1.15;
      this.far.x = even ? 5 : 15;
      this.far.y = 39.5;
    } else {
      this.far.x = even ? 4.8 : 15.2;
      this.far.y = 45.15;
      this.near.x = even ? 15 : 5;
      this.near.y = 3.2;
    }
    this.placeHeldBall();
    this.highlightBox = {
      receiver: m.server === "near" ? "far" : "near",
      fromRight: even,
    };
    this.syncHud();
    if (this.screen === "play" && this.isDoubles() && this.serverPlayer() === this.nearB) {
      this.toast("Partner serving", true);
    }
  }

  placeDoubles(even) {
    const srv = this.serverPlayer();
    const rec = this.receiverPlayer();
    const srvPartner = srv.side === "near" ? (srv === this.near ? this.nearB : this.near) : srv === this.far ? this.farB : this.far;
    const recPartner = rec.side === "far" ? (rec === this.far ? this.farB : this.far) : rec === this.near ? this.nearB : this.near;
    if (srv.side === "near") {
      srv.x = even ? 15.2 : 4.8;
      srv.y = -1.15;
      srvPartner.x = even ? 4.8 : 15.2;
      srvPartner.y = kitchenSafeY("near");
      rec.x = even ? 5 : 15;
      rec.y = 40.6;
      recPartner.x = even ? 15 : 5;
      recPartner.y = kitchenSafeY("far");
    } else {
      srv.x = even ? 4.8 : 15.2;
      srv.y = 45.15;
      srvPartner.x = even ? 15.2 : 4.8;
      srvPartner.y = kitchenSafeY("far");
      rec.x = even ? 15 : 5;
      rec.y = 3.2;
      recPartner.x = even ? 5 : 15;
      recPartner.y = kitchenSafeY("near");
    }
  }

  placeHeldBall() {
    const s = this.serverPlayer();
    const dir = s.side === "near" ? 1 : -1;
    this.ball.x = s.x + 0.55;
    this.ball.y = s.y + dir * 0.35;
    this.ball.z = 2.35;
    this.ball.vx = this.ball.vy = this.ball.vz = 0;
    this.ball.live = false;
    this.ball.held = true;
    this.ball.trail = [];
  }

  beginCharge(p) {
    if (this.paused || this.screen !== "play") return;
    if (this.phase === "dead" || this.phase === "replay") return;
    if (p.swinging) return;
    if (this.phase === "serve" && p !== this.serverPlayer()) return;
    if (this.pendingHit && this.pendingHit.p === p) this.pendingHit = null;
    p.charging = true;
    if (p.charge < 0.05) p.charge = 0.05;
  }

  releaseSwing(p) {
    if (!p.charging && p.charge <= 0) return;
    const tutorialServe = this.tutorial.active && this.tutorial.step === 1 && p === this.near && this.phase === "serve";
    p.charging = false;
    const power = clamp(p.charge, 0.08, 1);
    p.charge = 0;
    if (this.phase === "serve") {
      if (p === this.serverPlayer()) this.doServe(p, power);
      if (tutorialServe && this.phase === "rally") this.advanceTutorial(2);
      return;
    }
    if (this.phase !== "rally") return;
    this.doSwing(p, power);
  }

  doServe(p, power) {
    const even = this.evenScore();
    const behind =
      p.side === "near" ? p.y <= 0.15 : p.y >= CL - 0.15;
    if (!behind) {
      this.flash("FOOT FAULT", 1.1);
      this.sfx.fault();
      this.endRally("foot-fault", p.side);
      return;
    }
    const receiver = p.side === "near" ? "far" : "near";
    const serve = p.serveSkill ?? 6;
    const s = serve / 10;
    const deep = receiver === "far" ? lerp(30.4, 42.8, s) : lerp(13.6, 1.2, s);
    const t = lerp(1.52, 0.92, power * lerp(0.38, 1, s));
    this.ball.held = false;
    this.ball.live = true;
    this.ball.x = p.x + 0.4;
    this.ball.y = p.y + (p.side === "near" ? 0.6 : -0.6);
    this.ball.z = 1.9;
    p.shotKind = "serve";
    p.hand = 1;
    const boxL = even ? (receiver === "far" ? 0 : 10) : receiver === "far" ? 10 : 0;
    const boxR = boxL + 10;
    const aimed = clamp(20 - p.x, boxL + 1.1, boxR - 1.1);
    this.launchTo(this.ball, aimed, deep, t, lerp(2.6, 0.1, s), "serve", p);
    this.ball.serveBite = s;
    this.ball.lastHit = p.side;
    this.phase = "rally";
    this.rallyLen = 1;
    this.highlightBox = null;
    p.swinging = true;
    p.swing = 0.01;
    this.sfx.hit(0.35, "serve");
    this.lastKind = "serve";
    this.toast(p === this.near ? "Serve in · let the return bounce" : "Let it bounce, then swing");
  }

  tryPendingHit() {
    const hit = this.pendingHit;
    if (!hit || this.phase !== "rally") return;
    if (this.time > hit.until) {
      this.pendingHit = null;
      return;
    }
    const p = hit.p;
    if (p.swinging) return;
    if (this.canContact(p, this.ball)) {
      this.pendingHit = null;
      this.doSwing(p, hit.power);
    }
  }

  doSwing(p, power) {
    const b = this.ball;
    if (!b.live) return;
    const sideOk = p.side === "near" ? b.y <= NET_Y + 0.55 : b.y >= NET_Y - 0.55;
    if (!sideOk || !this.canContact(p, b)) {
      const touchEarly = p === this.near && this.isTouchInput() && this.incoming(p);
      if (this.needsBounce(p)) {
        this.pendingHit = { p, power, until: this.time + 0.7 };
        if (p === this.near && this.screen === "play") this.toast("Let it bounce");
      } else if (touchEarly) {
        // On a phone the tap lands a beat early more often than not; hold the
        // swing for a moment and fire it when the ball arrives.
        this.pendingHit = { p, power, until: this.time + 0.55 };
      } else if (p === this.near && this.screen === "play") {
        this.toast("Whiff");
      }
      return;
    }
    this.pendingHit = null;
    p.swinging = true;
    p.swing = 0.01;
    const d = dist(p.x, p.y, b.x, b.y);

    const volley = b.z > 0.42 && this.ball.lastBounceSide !== p.side;
    if (this.needsBounce(p) && volley) {
      if (p === this.near && this.screen === "play") this.toast("Let it bounce");
      return;
    }
    if (volley && playerInKitchen(p)) {
      this.flash("KITCHEN", 1.15);
      this.sfx.fault();
      this.endRally("kitchen", p.side);
      return;
    }
    if (volley) {
      if (!this.match.serveBounced && p.side !== this.match.server) {
        this.flash("TWO-BOUNCE", 1.15);
        this.sfx.fault();
        this.endRally("two-bounce", p.side);
        return;
      }
      if (!this.match.returnBounced && p.side === this.match.server) {
        this.flash("TWO-BOUNCE", 1.15);
        this.sfx.fault();
        this.endRally("two-bounce", p.side);
        return;
      }
      p.lastVolley = this.time;
    }

    const opp = this.closestOpp(p);
    const kind = !this.isHuman(p) && p.aiIntent ? p.aiIntent : this.chooseShotKind(p, b, power);
    p.aiIntent = null;
    p.hand = b.x >= p.x ? 1 : -1;
    const kitLine = p.side === "near" ? 15 : 29;
    const atKitchen = Math.abs(p.y - kitLine) < 3.1;
    const hands = p.hands || 6;
    p.swingRate = atKitchen
      ? 3.2 + hands * 0.34
      : (kind === "speedup" || kind === "smash" ? 3.0 : 1.85) + hands * 0.1;
    if (kind === "speedup" || kind === "smash") this.shake = 5;

    const land = this.isHuman(p) ? this.humanLand(p, kind, power, opp) : this.cpuLand(p, b, kind, opp);
    let tx = land.tx;
    let ty = land.ty;
    const flight = this.shotFlight(p, kind, power);

    const cpu = this.isCpuSide(p);
    const spread = p.aimSpread ?? lerp(4.4, 0.16, (p.stats?.angle ?? 6) / 10);
    let noise = cpu
      ? DIFF[this.diff].err * 0.85 * spread
      : spread * 0.72;
    p.shotKind = kind;
    this.lastKind = kind;
    this.launchTo(b, tx, ty, flight, noise, kind, p);
    b.lastHit = p.side;
    b.lastBounceSide = null;
    b.bouncesSide = 0;
    this.rallyLen += 1;
    if (this.tutorial.active && this.tutorial.step === 2 && p === this.near && this.rallyLen >= 3) {
      this.finishTutorial();
    }
    this.sfx.hit(power, kind);
    if (kind === "smash") this.buzz([24, 30, 48]);
    else if (kind === "speedup") this.buzz([16, 24, 32]);
    else this.buzz(10);
    this.spawnBurst(b.x, b.y, b.z, kind === "speedup" || kind === "smash" ? "#ffe082" : "#d4e157", kind === "speedup" ? 14 : 8);
    if (kind === "speedup" || kind === "smash") this.hitStop = 0.055;
  }

  heightAtNet(y, z, vy, vz) {
    if (Math.abs(vy) < 0.08) return 99;
    const tNet = (NET_Y - y) / vy;
    if (tNet <= 0.02) return 99;
    return z + vz * tNet - 0.5 * G * tNet * tNet;
  }

  launchTo(b, tx, ty, t, noise, style, p) {
    const attack = style === "speedup" || style === "smash";
    if (attack) {
      if (b.y < NET_Y) ty = clamp(ty, NET_Y + 3.3, 33);
      else ty = clamp(ty, 11, NET_Y - 3.3);
    } else if (style === "dink") {
      if (b.y < NET_Y) ty = clamp(ty, NET_Y + 4.2, NET_Y + 7.1);
      else ty = clamp(ty, NET_Y - 7.1, NET_Y - 4.2);
    } else if (style !== "serve") {
      if (b.y < NET_Y) ty = clamp(ty, NET_Y + 5, 43);
      else ty = clamp(ty, 1, NET_Y - 5);
    }
    const nY = noise * (style === "dink" ? 0.35 : 1);
    tx = tx + rand(-noise, noise);
    ty = ty + rand(-nY, nY);

    const pow = p?.powerMul || 1;
    const punch = clamp((pow - 0.58) / 0.85, 0, 1);
    const z0 = Math.max(b.z, attack ? 1.7 : 1.15);
    const dinkish = style === "dink" || style === "drop" || style === "lob";
    let tMin, tMax;
    if (style === "lob") {
      tMin = 1.5;
      tMax = 2.25;
    } else if (style === "drop" || style === "serve") {
      tMin = 1.12;
      tMax = 2.25;
    } else if (style === "dink") {
      tMin = 0.72;
      tMax = 2.25;
    } else if (attack) {
      tMin = lerp(0.5, 0.4, punch);
      tMax = lerp(0.7, 0.54, punch);
    } else {
      tMin = lerp(0.9, 0.7, punch);
      tMax = 2.25;
    }
    t = clamp(t, tMin, tMax);
    const need = style === "lob" ? 6.2 : attack ? 3.42 : style === "dink" ? 4.15 : dinkish || style === "serve" ? 4.55 : 4.05;
    let vx = 0,
      vy = 0,
      vz = 0;
    if (attack) {
      vx = (tx - b.x) / t;
      vy = (ty - b.y) / t;
      vz = 0.5 * G * t - z0 / t;
      const zNet = this.heightAtNet(b.y, z0, vy, vz);
      if (zNet < need && Math.abs(vy) > 0.08) {
        const tNet = (NET_Y - b.y) / vy;
        if (tNet > 0.05) vz = (need - z0 + 0.5 * G * tNet * tNet) / tNet;
      }
      const boost = lerp(1.04, 1.16, punch) + (style === "smash" ? 0.18 : 0.04);
      vx *= boost;
      vy *= boost;
      if (Math.abs(b.y - NET_Y) < 9.5) {
        const cap = lerp(15, 32, punch);
        const hspd = Math.hypot(vx, vy) || 1;
        if (hspd > cap) {
          vx *= cap / hspd;
          vy *= cap / hspd;
        }
      }
    } else {
      for (let i = 0; i < 16; i++) {
        vx = (tx - b.x) / t;
        vy = (ty - b.y) / t;
        vz = 0.5 * G * t - z0 / t;
        if (this.heightAtNet(b.y, z0, vy, vz) >= need) break;
        t = Math.min(tMax, t + 0.1);
        if (i > 5) {
          if (b.y > NET_Y) ty = Math.max(1.8, ty - 0.5);
          else ty = Math.min(42.2, ty + 0.5);
        }
      }
      if (style === "drive") {
        const drive = lerp(1.0, 1.18, punch);
        vx *= drive;
        vy *= drive;
      }
    }
    b.z = z0;
    b.vx = vx;
    b.vy = vy;
    b.vz = vz;
    b.live = true;
    b.held = false;
  }

  predictLanding(b) {
    let x = b.x,
      y = b.y,
      z = b.z,
      vx = b.vx,
      vy = b.vy,
      vz = b.vz;
    for (let i = 0; i < 240; i++) {
      const dt = 1 / 60;
      vz -= G * dt;
      x += vx * dt;
      y += vy * dt;
      z += vz * dt;
      if (z <= 0) return { x, y, t: i / 60 };
    }
    return { x, y, t: 2 };
  }

  updatePlayers(dt) {
    if (this.demo || this.screen === "menu") {
      this.ai(dt);
    } else {
      this.steer(this.near, dt, true);
      if (this.mode === "p2") this.steer(this.far, dt, false);
      else this.ai(dt);
    }

    for (const p of this.allPlayers()) {
      if (p.charging) {
        p.chargeDir = p.chargeDir || 1;
        const kit = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
        p.charge += dt * (kit ? 2.15 : 1.55) * p.chargeDir;
        if (p.charge >= 1) {
          p.charge = 1;
          p.chargeDir = -1;
        } else if (p.charge <= 0) {
          p.charge = 0;
          p.chargeDir = 1;
        }
        p.hand = this.handFor(p, this.ball);
        p.shotKind = p.charge > 0.36 ? "speedup" : "dink";
      }
      if (
        this.isHuman(p) &&
        p.charging &&
        !p.swinging &&
        this.phase === "rally" &&
        this.incoming(p) &&
        !playerInKitchen(p) &&
        this.canContact(p, this.ball)
      ) {
        const kit = this.atKitchenLine(p);
        if (!kit || (p.charge >= 0.36 && this.ballAttackable(p))) this.releaseSwing(p);
      }
      if (p.swinging) {
        p.swing += dt * (p.swingRate || 2.2);
        if (p.swing >= 1) {
          p.swinging = false;
          p.swing = 0;
        }
      }
      const spd = Math.hypot(p.vx, p.vy);
      p.walk += spd * dt * 2.4;
      const punch = p.swinging ? Math.sin(Math.min(p.swing, 1) * Math.PI) : 0;
      const coil = p.charging ? 0.22 + p.charge * 0.55 : 0;
      const wantCrouch = 0.34 + coil * 0.35 + punch * 0.22 + (spd > 1 ? 0.08 : 0);
      p.crouch = lerp(p.crouch ?? 0.34, wantCrouch, 0.2);
      const wantTwist = (p.hand || 1) * (0.16 + coil * 0.95 + punch * 0.5);
      p.twist = lerp(p.twist ?? 0.1, wantTwist, 0.24);
      if (p.side === "near") {
        p.x = clamp(p.x, -2.5, CW + 2.5);
        p.y = clamp(p.y, -3.2, NET_Y - 0.35);
      } else {
        p.x = clamp(p.x, -2.5, CW + 2.5);
        p.y = clamp(p.y, NET_Y + 0.35, CL + 3.2);
      }
      if (p.kitchenWatch && this.time > p.kitchenWatch) p.kitchenWatch = 0;
    }
  }

  steer(p, dt, isNear) {
    let ax = 0,
      ay = 0;
    let stickMag = 0;
    const arrowsForP1 = isNear && this.mode !== "p2";
    if (isNear) {
      if (this.keys.has("KeyA") || (arrowsForP1 && this.keys.has("ArrowLeft"))) ax -= 1;
      if (this.keys.has("KeyD") || (arrowsForP1 && this.keys.has("ArrowRight"))) ax += 1;
      if (this.keys.has("KeyW") || (arrowsForP1 && this.keys.has("ArrowUp"))) ay += 1;
      if (this.keys.has("KeyS") || (arrowsForP1 && this.keys.has("ArrowDown"))) ay -= 1;
      if (this.stick.active) {
        // Analog: a small tilt is a small step. Deadzone, then an ease-in curve.
        const m = Math.hypot(this.stick.dx, this.stick.dy);
        const dead = 0.08;
        const k = m <= dead ? 0 : Math.min(1, (m - dead) / (1 - dead));
        if (m > 0) {
          ax += (this.stick.dx / m) * k;
          ay -= (this.stick.dy / m) * k;
        }
        stickMag = k;
      }
    } else {
      if (this.keys.has("ArrowLeft")) ax -= 1;
      if (this.keys.has("ArrowRight")) ax += 1;
      if (this.keys.has("ArrowUp")) ay += 1;
      if (this.keys.has("ArrowDown")) ay -= 1;
    }
    if (this.phase === "serve" && p === this.serverPlayer()) {
      ay = 0;
    }
    if (isNear && this.tutorial.active && this.tutorial.step === 0 && Math.hypot(ax, ay) > 0.14) {
      this.advanceTutorial(1);
    }
    if (Math.abs(ax) < 0.08) ax = 0;
    if (Math.abs(ay) < 0.08) ay = 0;
    if (ax === 0 && ay === 0) {
      p.vx = 0;
      p.vy = 0;
      return;
    }
    const mag = Math.hypot(ax, ay);
    const kit = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
    const keyed = isNear && this.keys.size > 0;
    const throttle = stickMag > 0 && !keyed ? Math.max(0.6, stickMag) : 1;
    const sp = p.speed * (kit ? 1.28 : 1) * (p.charging ? 0.4 : 1) * throttle;
    p.vx = (ax / mag) * sp;
    p.vy = (ay / mag) * sp;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  incoming(p) {
    if (!this.ball.live) return false;
    return p.side === "near" ? this.ball.vy < 0 : this.ball.vy > 0;
  }

  handFor(p, b) {
    if (!b) return p.hand || 1;
    const right = b.x >= p.x - 0.15;
    return p.side === "near" ? (right ? 1 : -1) : right ? -1 : 1;
  }

  ai(dt) {
    const bots = [];
    if (this.demo || this.screen === "menu") bots.push(this.near, this.far);
    else if (this.mode === "p2") {
      /* human vs human */
    } else if (this.isDoubles()) bots.push(this.nearB, this.far, this.farB);
    else bots.push(this.far);
    for (const p of bots) this.runAI(p, dt);
  }

  aiTactic(p) {
    if (this.mode !== "challenge" || p.side !== "far") return null;
    return TOURNAMENT[this.challengeIndex]?.tactic || null;
  }

  aiHomeY(p, fallback) {
    const tactic = this.aiTactic(p);
    if (!tactic || !this.twoBounceDone()) return fallback;
    const kitchen = clamp(tactic.kitchen ?? 1, 0, 1);
    return p.side === "near"
      ? lerp(5.5, kitchenSafeY("near"), kitchen)
      : lerp(38.5, kitchenSafeY("far"), kitchen);
  }

  runAI(p, dt) {
    const d = DIFF[this.demo ? "normal" : this.diff];
    const serveReturn = this.returningServe(p);
    const atK = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
    const base = p.baseSpeed || 9.2;
    p.speed = base * (atK && this.twoBounceDone() ? 1.18 : 1);
    if (this.phase === "serve") {
      if (p === this.serverPlayer()) {
        this.serveT += dt;
        const delay = this.demo ? 0.7 : p === this.near ? 99 : Math.max(0.45, 1.2 - (p.hands || 6) * 0.07);
        if (this.serveT > delay) {
          this.doServe(p, rand(0.45, 0.72));
        }
      } else if (this.isDoubles()) {
        const rec = this.receiverPlayer();
        if (p === rec) {
          const even = this.evenScore();
          const tx = p.side === "far" ? (even ? 5 : 15) : even ? 15 : 5;
          const ty = p.side === "far" ? 40.6 : 3.2;
          this.moveTo(p, tx, ty, dt);
        } else {
          this.moveTo(p, p.x < 10 ? 5 : 15, kitchenSafeY(p.side), dt);
        }
      } else {
        const even = this.evenScore();
        const tx = p.side === "far" ? (even ? 5 : 15) : even ? 15 : 5;
        const ty = p.side === "far" ? 40.6 : 3.2;
        this.moveTo(p, tx, ty, dt);
      }
      return;
    }
    const outY = kitchenSafeY(p.side);
    if (this.phase !== "rally" || !this.ball.live) {
      const homeY = this.twoBounceDone() ? this.aiHomeY(p, outY) : p.side === "near" ? 4 : 40;
      this.moveTo(p, 10, homeY, dt);
      return;
    }

    const incoming = this.incoming(p);
    const land = this.predictLanding(this.ball);
    if (p.aiTrackHit !== this.ball.lastHit) {
      p.aiTrackHit = this.ball.lastHit;
      p.aiOffX = serveReturn ? 0 : rand(-d.chase, d.chase);
      p.aiOffY = serveReturn ? 0 : rand(-d.chase * 0.35, d.chase * 0.3);
      p.aiWhiff = serveReturn ? false : Math.random() < (d.miss || 0);
      p.aiChaseX = null;
    }
    if (this.time - p.lastVolley < 0.55) {
      this.moveTo(p, p.x, outY, dt);
      return;
    }
    if (incoming) {
      if (this.isDoubles()) {
        const mates = this.allPlayers().filter((o) => o.side === p.side);
        const myD = dist(p.x, p.y, land.x, land.y);
        const closest = mates.every((o) => o === p || dist(o.x, o.y, land.x, land.y) >= myD - 0.35);
        if (!closest) {
          this.moveTo(p, p.x < 10 ? 5 : 15, this.twoBounceDone() ? outY : p.side === "near" ? 5.5 : 38.5, dt);
          return;
        }
      }
      const bouncedHere = this.ball.lastBounceSide === p.side;
      let ty;
      if (!bouncedHere) {
        ty = p.side === "near" ? Math.min(land.y - 1.0, outY) : Math.max(land.y + 1.0, outY);
      } else if (serveReturn) {
        ty = this.ball.y + (p.side === "near" ? -0.8 : 0.8);
      } else {
        ty = land.y + (p.side === "near" ? -0.8 : 0.8);
      }
      const tx = serveReturn && bouncedHere ? this.ball.x : land.x + (p.aiOffX || 0);
      if (p.aiChaseX == null) p.aiChaseX = p.x;
      p.aiChaseX = lerp(p.aiChaseX, tx, serveReturn ? 0.22 : this.diff === "hard" ? 0.18 : 0.08);
      this.moveTo(p, p.aiChaseX, ty + (p.aiOffY || 0), dt);
      const close = this.canContact(p, this.ball);
      const mustLetBounce = this.needsBounce(p);
      const volley = this.ball.z > 0.28 && !bouncedHere;
      if (mustLetBounce && !bouncedHere) {
        /* wait for the two-bounce rule */
      } else if (volley && playerInKitchen(p)) {
        this.moveTo(p, p.x, outY, dt);
      } else if (close && !p.swinging && !p.aiWhiff) {
        if (volley && playerInKitchen(p)) {
          this.moveTo(p, p.x, outY, dt);
        } else {
          p.aiWind = (p.aiWind || 0) + dt;
          const normalWait = Math.max(0.05, d.react * lerp(1.45, 0.55, (p.hands || 6) / 10));
          const wait = serveReturn ? Math.min(0.09, normalWait) : normalWait;
          if (p.aiWind >= wait) {
            p.charge = this.chooseAIShot(p);
            this.doSwing(p, p.charge);
            p.charge = 0;
            p.aiWind = 0;
          }
        }
      } else {
        p.aiWind = Math.max(0, (p.aiWind || 0) - dt * 2);
      }
    } else {
      p.aiChaseX = null;
      p.aiTrackHit = null;
      const homeY = this.twoBounceDone() ? this.aiHomeY(p, outY) : p.side === "near" ? 5.5 : 38.5;
      const homeX = this.isDoubles() ? (p.x < 10 ? 5 : 15) : clamp(lerp(p.x, this.ball.x, 0.18), 3, 17);
      this.moveTo(p, homeX, homeY, dt);
    }
  }

  chooseAIShot(p) {
    const hard = this.diff === "hard" && !this.demo;
    const atK = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
    const third = this.match.serveBounced && !this.match.returnBounced && p.side === this.match.server;
    const pow = p.stats?.power ?? 6;
    const hands = p.hands ?? 6;
    const tactic = this.aiTactic(p);
    p.aiIntent = null;
    if (tactic) {
      const opp = this.closestOpp(p);
      const oppAtKitchen = opp && Math.abs(opp.y - (opp.side === "near" ? 15 : 29)) < 3.8;
      if (this.ball.z > 5.2 && atK) {
        p.aiIntent = "smash";
        return 0.85;
      }
      if (third) {
        p.aiIntent = "drop";
        return 0.16;
      }
      if (atK) {
        if (this.ballAttackable(p) && Math.random() < tactic.attack) {
          p.aiIntent = "speedup";
          return 0.7;
        }
        p.aiIntent = "dink";
        return 0.13;
      }
      if (oppAtKitchen && Math.random() < tactic.lob) {
        p.aiIntent = "lob";
        return 0.56;
      }
      if (Math.random() < tactic.drive) {
        p.aiIntent = "drive";
        return 0.62;
      }
      p.aiIntent = "drop";
      return 0.18;
    }
    if (this.ball.z > 5.2 && atK) return 0.85;
    if (third) return 0.16;
    if (atK) {
      if (this.ballAttackable(p)) {
        const attack = 0.22 + pow * 0.05 + (hard ? 0.15 : 0) + hands * 0.015;
        if (Math.random() < attack) return 0.7;
      }
      return 0.13;
    }
    if (Math.random() < 0.7) return 0.2;
    return rand(0.22, 0.4);
  }

  moveTo(p, x, y, dt) {
    const dx = x - p.x;
    const dy = y - p.y;
    const m = Math.hypot(dx, dy);
    if (m < 0.2) {
      p.vx = p.vy = 0;
      return;
    }
    const sp = p.speed;
    p.vx = (dx / m) * sp;
    p.vy = (dy / m) * sp;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  twoBounceDone() {
    return this.match.serveBounced && this.match.returnBounced;
  }

  updateBall(dt) {
    const b = this.ball;
    if (b.held) {
      this.placeHeldBall();
      return;
    }
    if (!b.live) return;

    const steps = 3;
    const sdt = dt / steps;
    for (let i = 0; i < steps; i++) {
      const y0 = b.y;
      const z0 = b.z;
      const vz0 = b.vz;
      const x0 = b.x;
      b.vz -= G * sdt;
      b.x += b.vx * sdt;
      b.y += b.vy * sdt;
      b.z += b.vz * sdt;

      if ((y0 - NET_Y) * (b.y - NET_Y) <= 0 && Math.abs(b.y - y0) > 1e-6) {
        const frac = clamp((NET_Y - y0) / (b.y - y0), 0, 1);
        const dtN = frac * sdt;
        const zCross = z0 + vz0 * dtN - 0.5 * G * dtN * dtN;
        const xCross = x0 + b.vx * dtN;
        const nh = netHeightAt(xCross);
        if (zCross < nh - 0.05) {
          this.sfx.net();
          this.flash("NET", 0.9);
          this.endRally("net", b.lastHit);
          return;
        }
        if (zCross < nh + 0.18) {
          b.vy *= 0.55;
          b.vx *= 0.82;
          b.vz = Math.max(Math.abs(b.vz) * 0.35, 1.4);
          this.sfx.net();
          this.toast("Net cord — play on", true);
        }
      }

      if (b.z <= 0) {
        b.z = 0;
        const speed = Math.hypot(b.vx, b.vy, vz0);
        const e = lerp(0.52, 0.66, clamp(speed / 30, 0, 1));
        let outVz = Math.abs(vz0) * e;
        let minPeak = speed < 9 ? 1.9 : 2.7;
        let slip = 0.8;
        if (!this.match.serveBounced && b.serveBite != null) {
          minPeak = lerp(3.15, 1.45, b.serveBite);
          slip = lerp(0.64, 0.92, b.serveBite);
          outVz *= lerp(1.12, 0.82, b.serveBite);
        }
        const minVz = Math.sqrt(2 * G * minPeak);
        if (outVz > 0.35) outVz = Math.max(outVz, minVz);
        b.vz = outVz;
        b.vx *= slip;
        b.vy *= slip;
        if (b.vz < 0.4) b.vz = 0;
        this.onBounce();
        if (this.phase !== "rally") return;
        this.sfx.bounce();
      }
    }

    if (!Number.isFinite(b.x) || b.y < -12 || b.y > 58 || b.z > 28 || b.z < -1) {
      if (b.lastBounceSide != null && b.bouncesSide >= 1) {
        this.endRally("double", b.lastBounceSide);
      } else {
        this.endRally("out", b.lastHit);
      }
      return;
    }

    b.trail.push({ x: b.x, y: b.y, z: b.z });
    if (b.trail.length > 10) b.trail.shift();

    if (b.z === 0 && Math.hypot(b.vx, b.vy) < 1.4 && b.vz === 0) {
      const side = b.y < NET_Y ? "near" : "far";
      this.endRally("double", side);
    }
  }

  onBounce() {
    const b = this.ball;
    const side = b.y < NET_Y ? "near" : "far";
    const out = !inCourt(b.x, b.y);

    if (!this.match.serveBounced) {
      if (out || !inServiceBox(b.x, b.y, this.receiverPlayer().side, this.match.targetRight)) {
        const kitchen = inKitchen(b.x, b.y) || Math.abs(b.y - 15) < 0.12 || Math.abs(b.y - 29) < 0.12;
        this.flash(kitchen && !out ? "SHORT" : "FAULT", 1.1);
        this.sfx.fault();
        this.endRally("serve-fault", this.match.server);
        return;
      }
      this.match.serveBounced = true;
      b.lastBounceSide = side;
      b.bouncesSide = 1;
      this.syncHud();
      this.tryPendingHit();
      return;
    }

    if (out) {
      if (b.lastBounceSide != null && b.bouncesSide >= 1) {
        this.endRally("double", b.lastBounceSide);
        return;
      }
      this.endRally("out", b.lastHit);
      return;
    }

    if (b.lastBounceSide === side) {
      b.bouncesSide += 1;
      if (b.bouncesSide >= 2) {
        this.endRally("double", side);
        return;
      }
    } else {
      b.lastBounceSide = side;
      b.bouncesSide = 1;
      if (!this.match.returnBounced && side === this.match.server) {
        this.match.returnBounced = true;
        this.syncHud();
        this.toast(this.isTouchInput()
          ? "Kitchen: hold SWING on a high ball. Let low balls bounce, then tap"
          : "Kitchen: high ball = hold Space (yellow) to speed-up. Low ball = let it bounce, then tap");
      }
    }
    this.tryPendingHit();
  }

  endRally(reason, faulter) {
    if (this.phase === "dead" || this.phase === "replay") return;
    if (!this.demo && this.screen === "play" && this.phase === "rally") this.recordFrame();
    this.phase = "dead";
    this.deadT = this.demo ? 0.55 : 1.25;
    this.ball.live = false;
    this.highlightBox = null;
    if (this.demo || this.screen === "menu") return;

    if (this.rallyLen > this.meta.longest) this.meta.longest = this.rallyLen;
    if (this.lastKind === "speedup" || this.lastKind === "smash") this.meta.speedups += 1;
    if (reason === "kitchen") this.meta.kitchen += 1;

    if (faulter !== "near" && faulter !== "far") faulter = this.ball.lastHit === "far" ? "far" : "near";
    const winner = faulter === "near" ? "far" : "near";
    if (
      winner === "near" &&
      this.ball.lastHit === "near" &&
      (this.lastKind === "speedup" || this.lastKind === "smash")
    ) {
      this.meta.attackWins += 1;
    }
    const server = this.match.server;
    const serverWon = winner === server;
    this.match[winner] += 1;

    let highlight = null;
    const faultCall =
      reason === "double" || reason === "not-up"
        ? "DOUBLE BOUNCE"
        : reason === "out"
          ? "OUT"
          : reason === "net"
            ? "NET"
            : reason === "kitchen"
              ? "KITCHEN"
              : reason === "two-bounce"
                ? "TWO-BOUNCE"
                : reason === "foot-fault"
                  ? "FOOT FAULT"
                  : reason === "serve-fault"
                    ? "FAULT"
                    : null;

    if (!serverWon) {
      if (this.isDoubles() && this.match.startOneServe) {
        this.match.startOneServe = false;
        this.match.server = server === "near" ? "far" : "near";
        this.match.serverNum = 1;
      } else if (this.isDoubles() && this.match.serverNum === 1) {
        this.match.serverNum = 2;
      } else {
        this.match.server = server === "near" ? "far" : "near";
        this.match.serverNum = 1;
      }
    }

    const youWon = winner === "near";
    const opps = this.allPlayers().filter((o) => o.side === faulter);
    const farFromBall = opps.every((o) => dist(o.x, o.y, this.ball.x, this.ball.y) > 3.2);
    if (youWon) {
      this.sfx.cheer();
      if (this.rallyLen <= 1 && this.match.serveBounced && serverWon && (reason === "double" || reason === "not-up")) {
        this.meta.aces += 1;
        this.flash("ACE", 1.15);
        highlight = "ACE";
        this.sfx.crowd(1.4);
        this.buzz([30, 50, 70]);
      } else if ((this.lastKind === "speedup" || this.lastKind === "smash") && farFromBall && this.ball.lastHit === "near") {
        this.meta.winners += 1;
        this.flash("WINNER", 1.1);
        highlight = "WINNER";
        this.sfx.crowd(1.2);
        this.buzz([24, 40, 36]);
      } else if (this.rallyLen >= 12) {
        this.flash("POINT", 1.05);
        this.toast("Hands battle — long kitchen rally");
        highlight = "HANDS";
        this.sfx.crowd(1.1);
        this.buzz([12, 20, 12, 20, 28]);
      } else {
        this.flash("POINT", 1.05);
        this.sfx.crowd(0.7);
        this.buzz(18);
      }
      if (!serverWon) {
        if (this.isDoubles() && this.match.server === "far" && this.match.serverNum === 2) this.toast("Point · second server", true);
        else if (this.match.server === "near") this.toast("Point · your serve");
      }
    } else {
      this.sfx.fault();
      if (faultCall) this.flash(faultCall, 1.1);
      else this.flash("POINT", 1.05);
    }
    const switchAt = Math.ceil(this.matchTargetScore() / 2);
    if (!this.match.switched && (this.match.near === switchAt || this.match.far === switchAt)) {
      this.match.switched = true;
      this.toast(`${switchAt} — switch sides`, true);
    }
    this.syncHud();
    if (highlight && this.tape.length >= 18) {
      this.beginReplay(highlight);
      return;
    }
    this.checkWin();
  }

  checkWin() {
    if (this.screen === "over") return;
    const a = this.match.near;
    const b = this.match.far;
    const target = this.matchTargetScore();
    if ((a >= target || b >= target) && Math.abs(a - b) >= 2) {
      this.screen = "over";
      this.phase = "dead";
      this.deadT = 999;
      $("over").hidden = false;
      $("over-title").textContent = a > b ? "You win" : this.mode === "p2" ? "Player 2 wins" : "CPU wins";
      const m = this.meta;
      $("over-sub").textContent = `${a} – ${b}`;
      $("over-kicker").textContent = `Game to ${target} · win by 2`;
      $("over-stats").textContent = `Longest rally ${m.longest} · ${m.aces} ace${m.aces === 1 ? "" : "s"} · ${m.winners} winner${m.winners === 1 ? "" : "s"} · ${m.speedups} speed-ups`;
      $("tourney-upgrade").hidden = true;
      $("btn-rematch").hidden = false;
      $("btn-next-challenge").hidden = true;
      if (this.mode === "challenge") {
        const i = this.challengeIndex;
        const rnd = TOURNAMENT[i];
        const last = TOURNAMENT.length - 1;
        const objectiveMet = this.challengeObjectiveState().met;
        const grade = this.challengeGrade(a > b, objectiveMet);
        this.saveTournamentResult(i, grade, a > b, objectiveMet);
        $("over-stats").textContent += ` · Grade ${grade}${objectiveMet ? " · bonus cleared" : ""}`;
        if (a > b) {
          this.saveGauntlet(Math.max(this.gauntletCleared(), i + 1));
          if (i >= last) {
            $("over-title").textContent = "Champion";
            $("over-kicker").textContent = `Tournament complete · Grade ${grade}`;
          } else {
            $("over-kicker").textContent = `${rnd.round} won · ${i + 1} / ${TOURNAMENT.length} · Grade ${grade}`;
            $("over-title").textContent = `Beat ${rnd.name}`;
            $("btn-next-challenge").textContent = "Next opponent";
            this.showChallengeUpgrades();
          }
        } else {
          // One loss ends the run: progress and boosts reset, records stay.
          this.saveGauntlet(0);
          this.challengeBoosts = Object.fromEntries(STAT_IDS.map((id) => [id, 0]));
          $("over-title").textContent = "Eliminated";
          $("over-kicker").textContent = `${rnd.round} lost · run over`;
          $("over-stats").textContent += " · Start a new run from Round 1";
          $("btn-rematch").hidden = true;
          $("btn-next-challenge").textContent = "New run";
          $("btn-next-challenge").hidden = false;
        }
      }
      this.sfx.whistle();
      this.sfx.crowd(1.6);
      this.buzz([40, 80, 50]);
    }
  }

  snapPlayer(p) {
    return {
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      swing: p.swing,
      swinging: p.swinging,
      swingRate: p.swingRate,
      charge: p.charge,
      charging: p.charging,
      chargeDir: p.chargeDir,
      crouch: p.crouch,
      twist: p.twist,
      hand: p.hand,
      shotKind: p.shotKind,
    };
  }

  recordFrame() {
    const b = this.ball;
    this.tape.push({
      ball: {
        x: b.x,
        y: b.y,
        z: b.z,
        vx: b.vx,
        vy: b.vy,
        vz: b.vz,
        live: b.live,
        held: b.held,
        trail: b.trail.map((t) => ({ x: t.x, y: t.y, z: t.z })),
      },
      players: this.allPlayers().map((p) => this.snapPlayer(p)),
      camX: this.camX,
    });
    if (this.tape.length > 78) this.tape.shift();
  }

  applyFrame(f) {
    Object.assign(this.ball, f.ball);
    this.ball.trail = f.ball.trail.map((t) => ({ x: t.x, y: t.y, z: t.z }));
    const ps = this.allPlayers();
    for (let i = 0; i < ps.length && i < f.players.length; i++) Object.assign(ps[i], f.players[i]);
    this.camX = f.camX;
  }

  beginReplay(label) {
    this.phase = "replay";
    this.replay = { frames: this.tape.slice(), i: 0, label };
    this.flash(label, 1.35);
    this.sfx.crowd(1.15);
    this.toast(this.isTouchInput() ? "Tap to skip" : "SPACE / click to skip", true);
  }

  skipReplay() {
    if (this.phase !== "replay") return;
    this.replay = null;
    this.phase = "dead";
    this.deadT = 0.2;
    if (this.paused) this.togglePause(false);
    this.checkWin();
  }

  stepReplay(dt) {
    const r = this.replay;
    if (!r) {
      this.skipReplay();
      return;
    }
    r.i += dt * 22;
    const frames = r.frames;
    if (r.i >= frames.length - 1) {
      this.skipReplay();
      return;
    }
    this.applyFrame(frames[Math.min(frames.length - 1, r.i | 0)]);
  }

  syncHud() {
    $("pts-near").textContent = String(this.match.near);
    $("pts-far").textContent = String(this.match.far);
    if (this.isDoubles()) {
      const n = this.match.startOneServe ? 2 : this.match.serverNum;
      $("score-call").textContent = `${this.match.near} – ${this.match.far} – ${n}`;
    } else {
      $("score-call").textContent = `${this.match.near} – ${this.match.far}`;
    }
    const who =
      this.match.server === "near"
        ? this.isDoubles() && this.match.serverNum === 2
          ? "PARTNER"
          : "YOU"
        : this.mode === "p2"
          ? "P2"
          : this.isDoubles() && this.match.serverNum === 2
            ? "CPU 2"
            : "CPU";
    const even = this.evenScore();
    const compact = window.matchMedia("(max-width: 700px), (max-height: 600px)").matches;
    const court = even ? "right / even" : "left / odd";
    $("serve-tag").textContent = compact ? `${who} · ${even ? "RIGHT" : "LEFT"}` : `${who} serving · ${court}`;
    $("chip-serve").classList.toggle("on", this.match.serveBounced);
    $("chip-return").classList.toggle("on", this.match.returnBounced);
    $("chip-rally").textContent = `Rally ${this.rallyLen}`;
    const objectiveChip = $("chip-objective");
    if (this.mode === "challenge" && this.challengeIndex >= 0) {
      const objective = this.challengeObjectiveState();
      const labels = { margin: "Lead", longest: "Rally", aces: "Ace", attackWins: "Attack" };
      objectiveChip.hidden = false;
      objectiveChip.textContent = `Bonus · ${labels[objective.type] || "Goal"} ${Math.min(objective.current, objective.target)}/${objective.target}`;
      objectiveChip.classList.toggle("done", objective.met);
    } else {
      objectiveChip.hidden = true;
      objectiveChip.classList.remove("done");
    }
    this.syncActionButton();
  }

  syncActionButton() {
    const button = $("btn-swing");
    if (!button || !this.near) return;
    const charging = this.near.charging;
    const needsBounce =
      this.phase === "rally" &&
      this.ball.live &&
      this.ball.lastHit === "far" &&
      ((this.match.server === "far" && !this.match.serveBounced) ||
        (this.match.server === "near" && this.match.serveBounced && !this.match.returnBounced));
    let label = "SWING";
    let aria = "Swing";
    let inactive = false;
    if (charging) {
      label = `${Math.round(this.near.charge * 100)}%`;
      aria = "Release to swing";
    } else if (this.phase === "replay") {
      label = "SKIP";
      aria = "Skip replay";
    } else if (this.phase === "dead") {
      label = "POINT";
      aria = "Wait for the next point";
      inactive = true;
    } else if (this.phase === "serve") {
      if (this.serverPlayer() === this.near) {
        label = "SERVE";
        aria = "Serve";
      } else {
        label = "WAIT";
        aria = "Opponent serving";
        inactive = true;
      }
    } else if (needsBounce) {
      label = "BOUNCE";
      aria = "Let the ball bounce";
      inactive = true;
    }
    if (button.textContent !== label) button.textContent = label;
    if (button.getAttribute("aria-label") !== aria) button.setAttribute("aria-label", aria);
    button.classList.toggle("charging", charging);
    button.classList.toggle("inactive", inactive);
    const charge = `${Math.round((charging ? this.near.charge : 0) * 360)}deg`;
    if (button.style.getPropertyValue("--charge") !== charge) button.style.setProperty("--charge", charge);
  }

  flash(text, t) {
    if (this.demo) return;
    this.banner.text = text;
    this.banner.t = t;
    $("banner").textContent = text;
    $("banner").classList.add("show");
  }

  /** Small status line. On touch only `important` toasts show; the coaching
   *  ones ("Let it bounce", "Whiff", serve reminders) just cover the court. */
  toast(text, important = false) {
    if (this.demo) return;
    if (!important && this.isTouchInput() && this.screen === "play") return;
    $("toast").textContent = text;
    $("toast").classList.add("show");
    this.toastT = 1.4;
  }

  loop(now) {
    if (!this._last) this._last = now;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.05);
    if (this.hitStop > 0) {
      this.hitStop -= dt;
      this.updateFx(dt);
    } else if (!this.paused && this.screen !== "over") this.update(dt);
    this.syncActionButton();
    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;
    this.shake *= 0.86;
    this.camX = lerp(this.camX, clamp((this.ball.x - 10) * 6, -28, 28), 0.08);
    if (this.banner.t > 0) {
      this.banner.t -= dt;
      if (this.banner.t <= 0) $("banner").classList.remove("show");
    }
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) $("toast").classList.remove("show");
    }
    this.updateFx(dt);

    if (this.phase === "replay") {
      this.stepReplay(dt);
      return;
    }

    if (this.phase === "dead") {
      this.deadT -= dt;
      if (this.deadT <= 0) this.resetPoint();
      return;
    }

    if (this.screen === "menu") {
      this.near.speed = 13;
      this.far.speed = 13;
    }

    this.updatePlayers(dt);
    if (this.phase === "rally" || this.ball.held) this.updateBall(dt);

    if (this.phase === "serve" && this.screen === "play" && this.serverPlayer() === this.near) {
      this.toastT = Math.max(this.toastT, 0.2);
      if (!$("toast").classList.contains("show")) {
        const touch = this.isTouchInput();
        this.toast(touch ? "Tap or hold SWING to serve underhand" : "Hold SPACE / click to serve underhand", true);
      }
    }

    if (this.phase === "rally" && this.pendingHit) this.tryPendingHit();
    if (this.phase === "rally" && !this.demo && this.screen === "play") this.recordFrame();
  }

  draw() {
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.clearRect(0, 0, w, h);
    this.drawSky(ctx);
    this.drawGround(ctx);
    this.drawCourt(ctx);
    this.drawBranding(ctx);
    if (this.highlightBox) this.drawServeTarget(ctx);
    if (this.ball.live) this.drawLanding(ctx);
    this.drawShadow(ctx);

    const sprites = [
      { y: this.far.y, draw: () => this.drawPlayer(ctx, this.far) },
      { y: this.near.y, draw: () => this.drawPlayer(ctx, this.near) },
      { y: NET_Y, draw: () => this.drawNet(ctx) },
      { y: this.ball.y, draw: () => this.drawBall(ctx) },
    ];
    if (this.isDoubles()) {
      sprites.push(
        { y: this.nearB.y, draw: () => this.drawPlayer(ctx, this.nearB) },
        { y: this.farB.y, draw: () => this.drawPlayer(ctx, this.farB) }
      );
    }
    sprites.sort((a, b) => b.y - a.y);
    for (const s of sprites) s.draw();

    this.drawFx(ctx);
    if (this.screen === "play" && this.phase === "rally") {
      if (this.shouldShowAim(this.near)) this.drawAimPip(ctx, this.near);
      if (this.mode === "p2" && this.shouldShowAim(this.far)) this.drawAimPip(ctx, this.far);
    }
    if (this.near.charging && this.screen === "play") this.drawCharge(ctx, this.near);
    if (this.far.charging && this.mode === "p2" && this.screen === "play") this.drawCharge(ctx, this.far);
    if (this.phase === "replay") this.drawReplayMark(ctx);
    this.drawWatermark(ctx);
  }

  /** Wordmark painted on the far half and the URL on the near half, like court sponsor paint. */
  drawBranding(ctx) {
    const v = this.venue || VENUES[0];
    const strip = (yc, text, wordmark) => {
      const c = this.project(10, yc, 0);
      const l = this.project(0, yc, 0);
      const r = this.project(20, yc, 0);
      const a = this.project(10, yc - 1, 0);
      const b = this.project(10, yc + 1, 0);
      const xs = (r.sx - l.sx) / 20;
      const ys = (a.sy - b.sy) / 2;
      if (xs < 4 || ys < 1.2) return;
      ctx.save();
      ctx.translate(c.sx, c.sy);
      ctx.scale(xs / 20, ys / 20);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "800 64px 'Barlow Condensed', Impact, sans-serif";
      ctx.globalAlpha = 0.34;
      if (wordmark) {
        const vsW = ctx.measureText("VS ").width;
        const pbW = ctx.measureText("PICKLEBALL").width;
        const x0 = -(vsW + pbW) / 2;
        ctx.textAlign = "left";
        ctx.fillStyle = "#d4e157";
        ctx.fillText("VS ", x0, 0);
        ctx.fillStyle = v.line;
        ctx.fillText("PICKLEBALL", x0 + vsW, 0);
      } else {
        ctx.font = "800 28px 'Barlow Condensed', Impact, sans-serif";
        ctx.fillStyle = v.line;
        ctx.globalAlpha = 0.26;
        ctx.fillText(text, 0, 0);
      }
      ctx.restore();
    };
    strip(37.4, "", true);
    strip(3.6, "VSPICKLEBALL.COM", false);
  }

  drawWatermark(ctx) {
    if (this.screen !== "play") return;
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = "#f4f1e8";
    ctx.font = "600 11px Outfit, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("vspickleball.com", this.w - 12, this.h - 10);
    ctx.restore();
  }

  shouldShowAim(p) {
    if (!this.isHuman(p)) return false;
    if (p.charging) return true;
    // On a phone the stick is always moving, so a pip that chases every nudge
    // is just noise. Show it only while the swing is held.
    if (this.isTouchInput() && p === this.near) return false;
    const { ax, ay } = this.aimAxes(p);
    return Math.abs(ax) > 0.14 || Math.abs(ay) > 0.14;
  }

  drawAimPip(ctx, p) {
    const b = this.ball.live ? this.ball : { z: 2, y: p.y + (p.side === "near" ? 2 : -2), x: p.x };
    const power = p.charging ? p.charge : 0.22;
    const kind = this.chooseShotKind(p, b, power);
    const { tx, ty } = this.humanLand(p, kind, power, this.closestOpp(p));
    const pt = this.project(tx, ty, 0);
    ctx.save();
    ctx.translate(pt.sx, pt.sy);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    const touch = this.isTouchInput();
    ctx.arc(0, 0, (touch ? 9 : 12) * pt.s, 0, TAU);
    const attack = kind === "speedup" || kind === "smash";
    ctx.fillStyle = attack ? "rgba(228,90,67,0.42)" : "rgba(212,225,87,0.5)";
    ctx.fill();
    ctx.strokeStyle = attack ? "#e45a43" : "#d4e157";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  drawReplayMark(ctx) {
    ctx.save();
    const label = this.replay?.label ? `REPLAY · ${this.replay.label}` : "REPLAY";
    const y = Math.max(108, this.h * 0.15);
    roundRect(ctx, this.w / 2 - 118, y, 236, 52, 10);
    ctx.fillStyle = "rgba(7,24,44,0.72)";
    ctx.fill();
    ctx.fillStyle = "#d4e157";
    ctx.font = "800 16px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, this.w / 2, y + 18);
    ctx.fillStyle = "rgba(244,241,232,0.75)";
    ctx.font = "600 11px Outfit, sans-serif";
    ctx.fillText(this.isTouchInput() ? "TAP TO SKIP" : "SPACE / click to skip", this.w / 2, y + 38);
    ctx.restore();
  }

  spawnBurst(x, y, z, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      this.fx.push({
        x,
        y,
        z: z + 0.2,
        vx: Math.cos(a) * rand(2, 8),
        vy: Math.sin(a) * rand(1, 5),
        vz: rand(2, 9),
        life: rand(0.22, 0.45),
        color,
      });
    }
  }

  updateFx(dt) {
    for (const f of this.fx) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.z += f.vz * dt;
      f.vz -= 22 * dt;
    }
    this.fx = this.fx.filter((f) => f.life > 0);
  }

  drawFx(ctx) {
    for (const f of this.fx) {
      const p = this.project(f.x, f.y, Math.max(0, f.z));
      ctx.globalAlpha = clamp(f.life * 3, 0, 0.9);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 3.2 * p.s, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  drawSky(ctx) {
    const v = this.venue || VENUES[0];
    const { w, h } = this;
    const g = ctx.createLinearGradient(0, 0, 0, h * (v.indoor ? 0.62 : 0.55));
    g.addColorStop(0, v.sky[0]);
    g.addColorStop(0.55, v.sky[1]);
    g.addColorStop(1, v.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    if (v.indoor) {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(0, 0, w, h * 0.11);
      for (let i = 0; i < 5; i++) {
        const x = w * (0.12 + i * 0.19);
        ctx.fillStyle = "rgba(255,228,150,0.5)";
        ctx.beginPath();
        ctx.ellipse(x, h * 0.075, 26, 9, 0, 0, TAU);
        ctx.fill();
      }
      return;
    }
    if (v.clouds) {
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.ellipse(w * 0.18, h * 0.1, 90, 28, 0, 0, TAU);
      ctx.ellipse(w * 0.22, h * 0.11, 60, 22, 0, 0, TAU);
      ctx.ellipse(w * 0.78, h * 0.08, 110, 30, 0, 0, TAU);
      ctx.fill();
    }
    if (v.sun) {
      ctx.fillStyle = v.sun;
      ctx.beginPath();
      ctx.arc(w * 0.86, h * 0.08, 34, 0, TAU);
      ctx.fill();
    }
    if (v.moon) {
      ctx.fillStyle = v.moon;
      ctx.beginPath();
      ctx.arc(w * 0.84, h * 0.09, 22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = v.sky[0];
      ctx.beginPath();
      ctx.arc(w * 0.85, h * 0.08, 18, 0, TAU);
      ctx.fill();
    }
  }

  drawGround(ctx) {
    const v = this.venue || VENUES[0];
    const { w, h } = this;
    const g = ctx.createLinearGradient(0, h * 0.28, 0, h);
    g.addColorStop(0, v.ground[0]);
    g.addColorStop(1, v.ground[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.28, w, h);
    const fl = this.project(-8, 50, 0);
    ctx.fillStyle = v.apron;
    ctx.fillRect(0, 0, w, fl.sy);
    if (v.ocean) {
      const og = ctx.createLinearGradient(0, fl.sy - 90, 0, fl.sy);
      og.addColorStop(0, "#5aa9d4");
      og.addColorStop(1, v.apron);
      ctx.fillStyle = og;
      ctx.fillRect(0, fl.sy - 90, w, 90);
    }
    ctx.strokeStyle = v.indoor ? "rgba(255,255,255,0.08)" : "rgba(20,40,30,0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const x = lerp(80, w - 80, i / 17);
      ctx.beginPath();
      ctx.moveTo(x, fl.sy - (v.indoor ? 110 : 70));
      ctx.lineTo(x, fl.sy);
      ctx.stroke();
    }
    if (v.lights && !v.indoor) {
      ctx.fillStyle = "rgba(255,230,150,0.35)";
      for (const x of [w * 0.18, w * 0.5, w * 0.82]) {
        ctx.beginPath();
        ctx.ellipse(x, fl.sy - 8, 40, 6, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  drawCourt(ctx) {
    const poly = (pts) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].sx, pts[0].sy);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].sx, pts[i].sy);
      ctx.closePath();
    };
    const P = (x, y) => this.project(x, y, 0);

    const v = this.venue || VENUES[0];
    const runoff = [P(-4, -4), P(24, -4), P(24, 48), P(-4, 48)];
    poly(runoff);
    ctx.fillStyle = v.runoff;
    ctx.fill();

    const court = [P(0, 0), P(20, 0), P(20, 44), P(0, 44)];
    poly(court);
    const cg = ctx.createLinearGradient(0, P(10, 44).sy, 0, P(10, 0).sy);
    cg.addColorStop(0, v.court[0]);
    cg.addColorStop(1, v.court[1]);
    ctx.fillStyle = cg;
    ctx.fill();

    const kn = [P(0, 15), P(20, 15), P(20, 29), P(0, 29)];
    poly(kn);
    ctx.fillStyle = v.kitchen;
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "rgba(212,225,87,0.07)";
    poly([P(0, 15), P(20, 15), P(20, 22), P(0, 22)]);
    ctx.fill();
    ctx.restore();

    const line = (a, b, width) => {
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.lineWidth = width;
      ctx.strokeStyle = v.line;
      ctx.lineCap = "butt";
      ctx.stroke();
    };
    const lw = (y) => lerp(3.4, 1.7, y / CL);
    line(P(0, 0), P(20, 0), lw(0));
    line(P(0, 44), P(20, 44), lw(44));
    line(P(0, 0), P(0, 44), lw(22));
    line(P(20, 0), P(20, 44), lw(22));
    line(P(0, 15), P(20, 15), lw(15));
    line(P(0, 29), P(20, 29), lw(29));
    line(P(10, 0), P(10, 15), lw(8));
    line(P(10, 29), P(10, 44), lw(36));

  }

  drawServeTarget(ctx) {
    const hb = this.highlightBox;
    const y0 = hb.receiver === "far" ? 29 : 0;
    const y1 = hb.receiver === "far" ? 44 : 15;
    let x0, x1;
    if (hb.receiver === "far") {
      x0 = hb.fromRight ? 0 : 10;
      x1 = hb.fromRight ? 10 : 20;
    } else {
      x0 = hb.fromRight ? 10 : 0;
      x1 = hb.fromRight ? 20 : 10;
    }
    const P = (x, y) => this.project(x, y, 0);
    ctx.beginPath();
    ctx.moveTo(P(x0, y0).sx, P(x0, y0).sy);
    ctx.lineTo(P(x1, y0).sx, P(x1, y0).sy);
    ctx.lineTo(P(x1, y1).sx, P(x1, y1).sy);
    ctx.lineTo(P(x0, y1).sx, P(x0, y1).sy);
    ctx.closePath();
    ctx.fillStyle = "rgba(212,225,87,0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212,225,87,0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    const s = this.serverPlayer();
    const aimX = clamp(20 - s.x, x0 + 1.5, x1 - 1.5);
    const aimY = (y0 + y1) / 2;
    const pip = P(aimX, aimY);
    ctx.beginPath();
    ctx.arc(pip.sx, pip.sy, 7, 0, TAU);
    ctx.fillStyle = "rgba(212,225,87,0.85)";
    ctx.fill();
  }

  drawLanding(ctx) {
    const land = this.predictLanding(this.ball);
    const touch = this.isTouchInput();
    // On a phone the far-side marker darts around faster than you can move and
    // just pulls the eye; only show where the ball will land on your side.
    if (touch && this.mode !== "p2" && (land.y > NET_Y || this.ball.vy > 0)) {
      this.landSmooth = null;
      return;
    }
    let lx = land.x;
    let ly = land.y;
    if (touch) {
      const s = this.landSmooth;
      if (s && dist(s.x, s.y, land.x, land.y) < 6) {
        lx = lerp(s.x, land.x, 0.25);
        ly = lerp(s.y, land.y, 0.25);
      }
      this.landSmooth = { x: lx, y: ly };
    }
    const p = this.project(lx, ly, 0);
    const ok = inCourt(land.x, land.y);
    const a = touch ? 0.6 : 1;
    ctx.save();
    ctx.translate(p.sx, p.sy);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, 16 * p.s, 0, TAU);
    ctx.fillStyle = ok ? `rgba(212,225,87,${0.28 * a})` : `rgba(228,90,67,${0.3 * a})`;
    ctx.fill();
    ctx.strokeStyle = ok ? `rgba(212,225,87,${0.9 * a})` : `rgba(228,90,67,${0.9 * a})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  drawShadow(ctx) {
    const b = this.ball;
    const p = this.project(b.x, b.y, 0);
    ctx.save();
    ctx.translate(p.sx, p.sy);
    ctx.scale(1, 0.38);
    ctx.beginPath();
    ctx.arc(0, 0, (12 + b.z * 0.55) * p.s, 0, TAU);
    ctx.fillStyle = `rgba(0,0,0,${0.34 + Math.min(b.z, 8) * 0.03})`;
    ctx.fill();
    ctx.restore();
    const a = this.project(b.x, b.y, 0);
    const c = this.project(b.x, b.y, b.z);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(c.sx, c.sy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawBall(ctx) {
    const b = this.ball;
    for (let i = 0; i < b.trail.length; i++) {
      const t = b.trail[i];
      const p = this.project(t.x, t.y, t.z);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, 3.2 * p.s, 0, TAU);
      ctx.fillStyle = `rgba(212,225,87,${0.08 + i / b.trail.length * 0.2})`;
      ctx.fill();
    }
    const p = this.project(b.x, b.y, b.z);
    const r = 7.2 * p.s;
    const g = ctx.createRadialGradient(p.sx - r * 0.3, p.sy - r * 0.3, r * 0.2, p.sx, p.sy, r);
    g.addColorStop(0, "#f3f7a1");
    g.addColorStop(1, "#b7c63a");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(40,50,10,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(20,30,8,0.28)";
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + this.time * 2;
      ctx.beginPath();
      ctx.arc(p.sx + Math.cos(a) * r * 0.45, p.sy + Math.sin(a) * r * 0.35, r * 0.12, 0, TAU);
      ctx.fill();
    }
  }

  drawNet(ctx) {
    const left = this.project(-1.1, NET_Y, 0);
    const right = this.project(21.1, NET_Y, 0);
    const leftTop = this.project(-1.1, NET_Y, NET_HS);
    const rightTop = this.project(21.1, NET_Y, NET_HS);
    const cBot = this.project(10, NET_Y, 0);
    const cTop = this.project(10, NET_Y, NET_HC);

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(left.sx - 4, leftTop.sy, 8, left.sy - leftTop.sy + 8);
    ctx.fillRect(right.sx - 4, rightTop.sy, 8, right.sy - rightTop.sy + 8);

    ctx.beginPath();
    ctx.moveTo(leftTop.sx, leftTop.sy);
    ctx.lineTo(cTop.sx, cTop.sy);
    ctx.lineTo(rightTop.sx, rightTop.sy);
    ctx.lineTo(right.sx, right.sy);
    ctx.lineTo(cBot.sx, cBot.sy);
    ctx.lineTo(left.sx, left.sy);
    ctx.closePath();
    ctx.fillStyle = "rgba(12,18,28,0.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(230,230,230,0.25)";
    ctx.lineWidth = 1;
    const posts = 14;
    for (let i = 0; i <= posts; i++) {
      const t = i / posts;
      const x = lerp(-1.1, 21.1, t);
      const z = netHeightAt(x);
      const a = this.project(x, NET_Y, 0);
      const b = this.project(x, NET_Y, z);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.strokeStyle = "#f4f1e8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftTop.sx, leftTop.sy);
    ctx.quadraticCurveTo(cTop.sx, cTop.sy + 2, rightTop.sx, rightTop.sy);
    ctx.stroke();
  }

  drawPlayer(ctx, p) {
    const pr = this.project(p.x, p.y, 0);
    const s = pr.s * 1.42;
    const back = p.side === "near";
    const sw = p.swinging ? clamp(p.swing, 0, 1) : 0;
    const charge = p.charging ? p.charge : 0;
    const backswing = sw <= 0 ? charge : sw < 0.35 ? 1 - sw / 0.35 : 0;
    const fwd = sw <= 0 ? 0 : sw < 0.35 ? sw / 0.35 : sw < 0.7 ? 1 : 1 + (sw - 0.7) / 0.3 * 0.85;
    const punch = sw > 0 ? Math.sin(sw * Math.PI) : 0;
    const crouch = p.crouch ?? 0.34;
    const twist = p.twist ?? 0.1;
    const hand = p.hand || 1;
    const dink = p.shotKind === "dink" || p.shotKind === "drop";
    const bob = Math.sin(this.time * 6 + (back ? 0 : 1)) * (1 - punch) * 1.2 * s;

    ctx.save();
    ctx.translate(pr.sx, pr.sy + bob * 0.15);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(twist * 3 * s, 5 * s, 19 * s, 7 * s, 0, 0, TAU);
    ctx.fill();

    const hipX = twist * 5 * s;
    const hipY = (-28 + crouch * 16) * s;
    const shX = twist * 10 * s;
    const shY = hipY - 24 * s;
    const headY = shY - 15 * s;
    const kL = { x: (-9 + twist * 2 - hand * backswing * 2) * s, y: hipY + (13 - crouch * 1.5) * s };
    const kR = { x: (9 + twist * 3 + hand * backswing * 3) * s, y: hipY + (13 - crouch * 1.5) * s };
    const fL = { x: (-12 + twist - hand * backswing * 4) * s, y: 3 * s };
    const fR = { x: (11 + twist * 2 + hand * backswing * 6) * s, y: 3 * s };

    const cap = (a, b, w, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    ctx.fillStyle = p.shoes || "#efe6d8";
    ctx.beginPath();
    ctx.ellipse(fL.x, fL.y, 7.2 * s, 3.1 * s, 0, 0, TAU);
    ctx.ellipse(fR.x, fR.y, 7.2 * s, 3.1 * s, 0, 0, TAU);
    ctx.fill();

    cap({ x: hipX - 6 * s, y: hipY }, kL, 8 * s, p.shorts);
    cap({ x: hipX + 6 * s, y: hipY }, kR, 8 * s, p.shorts);
    cap(kL, fL, 6.4 * s, p.skin);
    cap(kR, fR, 6.4 * s, p.skin);

    ctx.fillStyle = p.shorts;
    roundRect(ctx, hipX - 14 * s, hipY - 5 * s, 28 * s, 15 * s, 7 * s);
    ctx.fill();

    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(-0.1 + hand * backswing * 0.48 - fwd * 0.22 + twist * 0.08);
    ctx.fillStyle = p.shirt;
    roundRect(ctx, -13 * s, -28 * s, 26 * s, 30 * s, 9 * s);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, -13 * s, -18 * s, 26 * s, 3.2 * s, 1.2 * s);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(shX, headY, 11.2 * s, 0, TAU);
    ctx.fill();

    const hair = p.hair || "#3b2a1a";
    const style = p.hairStyle || "short";
    if (style !== "bald") {
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(shX, headY - 2.2 * s, 11.4 * s, Math.PI, TAU);
      ctx.fill();
      if (style === "bun") {
        ctx.beginPath();
        ctx.arc(shX + (back ? 0 : 1) * s, headY - 13.5 * s, 5.2 * s, 0, TAU);
        ctx.fill();
      } else if (style === "pony") {
        ctx.beginPath();
        ctx.moveTo(shX + 4 * s, headY - 6 * s);
        ctx.quadraticCurveTo(shX + 16 * s, headY + 2 * s, shX + 10 * s, headY + 14 * s);
        ctx.quadraticCurveTo(shX + 8 * s, headY + 2 * s, shX + 2 * s, headY - 4 * s);
        ctx.fill();
      } else if (style === "fade") {
        ctx.fillRect(shX - 11 * s, headY - 2 * s, 5 * s, 8 * s);
        ctx.fillRect(shX + 6 * s, headY - 2 * s, 5 * s, 8 * s);
      }
    }

    const hat = p.hat || "visor";
    ctx.fillStyle = p.visor || "#f4f1e8";
    if (hat === "cap" || hat === "visor") {
      if (hat === "cap") {
        ctx.beginPath();
        ctx.ellipse(shX, headY - 6.5 * s, 11.6 * s, 6.2 * s, 0, Math.PI, TAU);
        ctx.fill();
      }
      if (back) roundRect(ctx, shX - 12 * s, headY - 9 * s, 24 * s, 5.5 * s, 2 * s);
      else roundRect(ctx, shX - 13 * s, headY - 5 * s, 26 * s, 4.2 * s, 2 * s);
      ctx.fill();
    } else if (hat === "band") {
      roundRect(ctx, shX - 12 * s, headY - 5 * s, 24 * s, 4.2 * s, 2 * s);
      ctx.fill();
    }

    if (!back) {
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(shX - 4 * s, headY + 1 * s, 1.5 * s, 0, TAU);
      ctx.arc(shX + 4 * s, headY + 1 * s, 1.5 * s, 0, TAU);
      ctx.fill();
    }

    const offHand = {
      x: shX - hand * (18 + backswing * 8 + fwd * 4) * s,
      y: shY + (12 + backswing * 6 - fwd * 5) * s,
    };
    cap({ x: shX - hand * 7 * s, y: shY + 3 * s }, offHand, 5.2 * s, p.skin);

    const span = dink ? 18 : 26;
    const ax = shX + hand * (7 + backswing * 24 - fwd * (8 + span * 0.2)) * s;
    const ay = shY + (10 + backswing * 16 - fwd * span) * s;
    cap({ x: shX + hand * 9 * s, y: shY + 4 * s }, { x: ax, y: ay }, 5.8 * s, p.skin);

    ctx.save();
    ctx.translate(ax + hand * 6 * s, ay - 6 * s);
    ctx.rotate(hand * (0.7 + backswing * 1.45 - fwd * 2.15));
    this.drawPaddle(ctx, p, s * 1.34);
    ctx.restore();

    ctx.restore();
  }

  drawPaddle(ctx, p, s) {
    const fw = 14.2 * s;
    const fh = 18.4 * s;
    const cr = 3.4 * s;
    const edge = 1.35 * s;
    const hw = 3.9 * s;
    const hh = 10.8 * s;
    const faceTop = -fh * 0.58;

    ctx.fillStyle = "#1c1612";
    roundRect(ctx, -hw / 2, faceTop + fh - 1.4 * s, hw, hh, 1.15 * s);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.lineWidth = Math.max(0.6, 0.65 * s);
    for (let i = 0; i < 6; i++) {
      const gy = faceTop + fh + 0.6 * s + i * 1.15 * s;
      ctx.beginPath();
      ctx.moveTo(-hw / 2 + 0.45 * s, gy);
      ctx.lineTo(hw / 2 - 0.45 * s, gy);
      ctx.stroke();
    }
    ctx.fillStyle = "#0d0d0d";
    roundRect(ctx, -hw / 2 - 0.45 * s, faceTop + fh + hh - 2.3 * s, hw + 0.9 * s, 2.15 * s, 0.7 * s);
    ctx.fill();

    ctx.fillStyle = "#161616";
    roundRect(ctx, -fw / 2, faceTop, fw, fh, cr);
    ctx.fill();

    const g = ctx.createLinearGradient(-fw / 2, faceTop, fw / 2, faceTop + fh);
    g.addColorStop(0, shadeHex(p.paddle, 1.22));
    g.addColorStop(0.42, p.paddle);
    g.addColorStop(1, shadeHex(p.paddle, 0.68));
    ctx.fillStyle = g;
    roundRect(ctx, -fw / 2 + edge, faceTop + edge, fw - edge * 2, fh - edge * 2, Math.max(1.2 * s, cr - edge));
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = Math.max(0.6, 0.7 * s);
    roundRect(ctx, -fw * 0.26, faceTop + fh * 0.18, fw * 0.52, fh * 0.48, 2.1 * s);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    roundRect(ctx, -fw / 2 + edge * 1.8, faceTop + edge * 1.4, fw * 0.2, fh * 0.7, 1.6 * s);
    ctx.fill();
  }

  drawCharge(ctx, p) {
    const pr = this.project(p.x, p.y, 6.2);
    const w = 52 * pr.s;
    const x0 = pr.sx - w / 2;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x0, pr.sy, w, 7);
    const rising = (p.chargeDir || 1) > 0;
    ctx.fillStyle = p.charge < 0.36 ? "#d4e157" : p.charge < 0.72 ? "#f0c14a" : "#e45a43";
    ctx.fillRect(x0, pr.sy, w * p.charge, 7);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(x0 + w - 2, pr.sy - 1, 2, 9);
    if (!rising && p.charge < 0.95) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x0, pr.sy, w * p.charge, 7);
    }
  }
}

const game = new Game();
window.game = game;
