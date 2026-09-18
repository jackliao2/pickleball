const G = 32;
const CW = 20;
const CL = 44;
const NET_Y = 22;
const NVZ = 7;
const NET_HC = 34 / 12;
const NET_HS = 3;
const TAU = Math.PI * 2;

const DIFF = {
  easy: { speed: 7.1, err: 2.2, react: 0.35 },
  normal: { speed: 8.4, err: 1.1, react: 0.2 },
  hard: { speed: 9.8, err: 0.45, react: 0.12 },
};

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

function netHeightAt(x) {
  const t = Math.abs(x - 10) / 10;
  return lerp(NET_HC, NET_HS, t);
}

function inCourt(x, y) {
  return x >= 0 && x <= CW && y >= 0 && y <= CL;
}

function inKitchen(x, y) {
  if (x < 0 || x > CW) return false;
  return (y >= NET_Y - NVZ && y <= NET_Y + NVZ);
}

function playerInKitchen(p) {
  if (p.side === "near") return p.y >= NET_Y - NVZ && p.y <= NET_Y && p.x >= -0.4 && p.x <= CW + 0.4;
  return p.y <= NET_Y + NVZ && p.y >= NET_Y && p.x >= -0.4 && p.x <= CW + 0.4;
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
    if (kind === "smash") {
      this.beep(210, 0.07, "square", 0.15, 110);
      this.noise(0.06, 0.12);
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
}

export class Game {
  constructor() {
    this.canvas = $("c");
    this.ctx = this.canvas.getContext("2d");
    this.sfx = new Sfx();
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, down: false, on: false };
    this.stick = { dx: 0, dy: 0, active: false };
    this.diff = "normal";
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

    this.near = this.makePlayer("near");
    this.far = this.makePlayer("far");
    this.ball = this.makeBall();
    this.match = this.freshMatch();
    this.phase = "serve";
    this.deadT = 0;
    this.serveT = 0;
    this.highlightBox = null;

    this.bind();
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
      speed: 9.1,
      charge: 0,
      charging: false,
      swing: 0,
      swinging: false,
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
    };
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
    };
  }

  bind() {
    const c = this.canvas;
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (e) => {
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      this.sfx.ensure();
      if (e.code === "Escape") this.togglePause();
      if (e.code === "KeyM") this.toggleMute();
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
      this.pointer.down = true;
      this.sfx.ensure();
      this.beginCharge(this.near);
    });
    window.addEventListener("pointerup", () => {
      if (this.pointer.down) {
        this.pointer.down = false;
        if (this.screen === "play" && !this.touch) this.releaseSwing(this.near);
      }
    });

    $("btn-cpu").onclick = () => this.startMatch("cpu");
    $("btn-p2").onclick = () => this.startMatch("p2");
    $("btn-howto").onclick = () => this.showHowTo(true);
    $("btn-howto-close").onclick = () => this.showHowTo(false);
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
        this.diff = b.dataset.diff;
      };
    });

    this.bindTouch();
    document.body.classList.add("menu-open");
  }

  bindTouch() {
    const stick = $("stick");
    const knob = $("knob");
    const swing = $("btn-swing");
    const set = (clientX, clientY) => {
      const r = stick.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const m = Math.hypot(dx, dy) || 1;
      const max = r.width * 0.32;
      if (m > max) {
        dx = (dx / m) * max;
        dy = (dy / m) * max;
      }
      knob.style.left = `${33 + dx}px`;
      knob.style.top = `${33 + dy}px`;
      this.stick.dx = dx / max;
      this.stick.dy = dy / max;
    };
    const on = (e) => {
      const t = e.touches ? e.touches[0] : e;
      this.stick.active = true;
      this.touch = true;
      $("touch").hidden = false;
      set(t.clientX, t.clientY);
    };
    const off = () => {
      this.stick.active = false;
      this.stick.dx = 0;
      this.stick.dy = 0;
      knob.style.left = "33px";
      knob.style.top = "33px";
    };
    stick.addEventListener("pointerdown", (e) => {
      stick.setPointerCapture(e.pointerId);
      on(e);
    });
    stick.addEventListener("pointermove", (e) => {
      if (this.stick.active) set(e.clientX, e.clientY);
    });
    stick.addEventListener("pointerup", off);
    stick.addEventListener("pointercancel", off);
    swing.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.touch = true;
      $("touch").hidden = false;
      this.beginCharge(this.near);
    });
    swing.addEventListener("pointerup", () => this.releaseSwing(this.near));
    window.addEventListener(
      "touchstart",
      () => {
        this.touch = true;
        $("touch").hidden = false;
      },
      { once: true }
    );
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(960, Math.floor(window.innerWidth));
    this.h = Math.max(540, Math.floor(window.innerHeight));
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.view = {
      top: Math.max(64, this.h * 0.1),
      bot: this.h - Math.max(56, this.h * 0.08),
      near: 1.18,
      far: 0.54,
    };
  }

  project(x, y, z) {
    const t = clamp(y / CL, -0.2, 1.25);
    const persp = lerp(this.view.near, this.view.far, clamp(y / CL, 0, 1));
    const sy = lerp(this.view.bot, this.view.top, t) - z * 12.5 * persp + this.shake * (Math.random() - 0.5);
    const half = this.w * 0.4 * persp;
    const sx = this.w / 2 + this.camX + ((x - 10) / 10) * half;
    return { sx, sy, s: persp };
  }

  unproject(sx, sy) {
    const { top, bot } = this.view;
    const t = clamp((bot - sy) / (bot - top), -0.15, 1.2);
    const y = t * CL;
    const persp = lerp(this.view.near, this.view.far, clamp(y / CL, 0, 1));
    const half = this.w * 0.4 * persp;
    const x = 10 + ((sx - this.w / 2 - this.camX) / half) * 10;
    return { x, y };
  }

  startMatch(mode) {
    this.mode = mode;
    this.demo = false;
    this.screen = "play";
    this.paused = false;
    document.body.classList.remove("menu-open");
    $("menu").hidden = true;
    $("howto").hidden = true;
    $("pause").hidden = true;
    $("over").hidden = true;
    $("hud").hidden = false;
    $("name-near").textContent = "YOU";
    $("name-far").textContent = mode === "p2" ? "P2" : "CPU";
    this.match = this.freshMatch();
    this.resetPoint(true);
    this.flash("PLAY", 0.8);
    this.sfx.whistle();
    this.syncHud();
  }

  toMenu() {
    this.screen = "menu";
    this.demo = true;
    this.paused = false;
    document.body.classList.add("menu-open");
    $("menu").hidden = false;
    $("pause").hidden = true;
    $("over").hidden = true;
    $("howto").hidden = true;
    $("hud").hidden = true;
    this.match = this.freshMatch();
    this.resetPoint(true);
  }

  showHowTo(on) {
    $("howto").hidden = !on;
    $("menu").hidden = on;
  }

  togglePause(force) {
    if (this.screen !== "play") return;
    this.paused = force == null ? !this.paused : force;
    $("pause").hidden = !this.paused;
  }

  toggleMute() {
    this.sfx.muted = !this.sfx.muted;
    $("btn-mute").textContent = this.sfx.muted ? "✕" : "♪";
  }

  toggleFull() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  serverPlayer() {
    return this.match.server === "near" ? this.near : this.far;
  }
  receiverPlayer() {
    return this.match.server === "near" ? this.far : this.near;
  }
  evenScore() {
    return this.match[this.match.server] % 2 === 0;
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
    this.near.swing = 0;
    this.far.swing = 0;
    this.near.charging = false;
    this.far.charging = false;
    this.near.charge = 0;
    this.far.charge = 0;
    this.near.lastVolley = -10;
    this.far.lastVolley = -10;

    const even = this.evenScore();
    m.targetRight = even;
    if (m.server === "near") {
      this.near.x = even ? 15.2 : 4.8;
      this.near.y = -1.15;
      this.far.x = even ? 5 : 15;
      this.far.y = 39.5;
    } else {
      this.far.x = even ? 4.8 : 15.2;
      this.far.y = 45.15;
      this.near.x = even ? 15 : 5;
      this.near.y = 4.5;
    }
    this.placeHeldBall();
    this.highlightBox = {
      receiver: m.server === "near" ? "far" : "near",
      fromRight: even,
    };
    this.syncHud();
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
    if (this.phase === "dead") return;
    if (p.swinging) return;
    if (this.phase === "serve" && p !== this.serverPlayer()) return;
    p.charging = true;
    if (p.charge < 0.05) p.charge = 0.05;
  }

  releaseSwing(p) {
    if (!p.charging && p.charge <= 0) return;
    p.charging = false;
    const power = clamp(p.charge, 0.08, 1);
    p.charge = 0;
    if (this.phase === "serve") {
      if (p === this.serverPlayer()) this.doServe(p, power);
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
    const tx = even ? (receiver === "far" ? 5 : 15) : receiver === "far" ? 15 : 5;
    const ty = receiver === "far" ? rand(32.5, 41) : rand(3, 11.5);
    const t = lerp(1.38, 1.18, power);
    this.ball.held = false;
    this.ball.live = true;
    this.ball.x = p.x + 0.4;
    this.ball.y = p.y + (p.side === "near" ? 0.6 : -0.6);
    this.ball.z = 1.9;
    p.shotKind = "serve";
    p.hand = 1;
    this.launchTo(this.ball, tx + rand(-0.35, 0.35), ty, t, 0.18 + (1 - power) * 0.18, "serve");
    this.ball.lastHit = p.side;
    this.phase = "rally";
    this.rallyLen = 1;
    this.highlightBox = null;
    p.swinging = true;
    p.swing = 0.01;
    this.sfx.hit(0.35, "serve");
    this.toast(even ? "Even court · diagonal" : "Odd court · diagonal");
  }

  doSwing(p, power) {
    p.swinging = true;
    p.swing = 0.01;
    const b = this.ball;
    if (!b.live) return;
    const reach = 3.35;
    const d = dist(p.x, p.y, b.x, b.y);
    const sideOk = p.side === "near" ? b.y <= NET_Y + 0.35 : b.y >= NET_Y - 0.35;
    if (!sideOk || d > reach + 0.6 || b.z > 8.2 || b.z < -0.05) return;

    const volley = b.z > 0.28 && this.ball.lastBounceSide !== p.side;
    if (volley && (playerInKitchen(p) || inKitchen(p.x, p.y))) {
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

    const opp = p.side === "near" ? this.far : this.near;
    const lob = p.side === "near" ? this.keys.has("KeyW") && power > 0.35 : this.keys.has("ArrowUp") && power > 0.35;
    const atKitchen = playerInKitchen(p) || Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 2.2;
    const atBase = p.side === "near" ? p.y < 8 : p.y > 36;
    const thirdShot = this.match.serveBounced && !this.match.returnBounced && p.side === this.match.server;

    let tx, ty, flight, kind;
    const open = opp.x < 10 ? rand(11.5, 17.4) : rand(2.6, 8.5);
    const aimBias = p.side === "near" ? (this.keys.has("KeyD") ? 2.4 : this.keys.has("KeyA") ? -2.4 : 0) : this.keys.has("ArrowRight") ? 2.4 : this.keys.has("ArrowLeft") ? -2.4 : 0;
    tx = clamp(open + aimBias * 0.7, 2.2, 17.8);
    p.hand = b.x >= p.x ? 1 : -1;

    if (lob) {
      ty = p.side === "near" ? rand(37, 42) : rand(2, 7);
      flight = lerp(1.45, 1.75, power);
      kind = "lob";
    } else if (b.z > 5.2 && Math.abs(p.y - NET_Y) < 10) {
      ty = p.side === "near" ? opp.y - 1.2 : opp.y + 1.2;
      tx = clamp(opp.x + (Math.random() - 0.5) * 1.6, 2, 18);
      flight = 0.85;
      kind = "smash";
      this.shake = 5;
    } else if (power < 0.4 || atKitchen || thirdShot) {
      ty = p.side === "near" ? rand(26.2, 28.8) : rand(15.2, 17.8);
      flight = thirdShot || atBase ? lerp(1.35, 1.55, 1 - power) : lerp(1.05, 1.28, 1 - power);
      kind = thirdShot || atBase ? "drop" : "dink";
    } else {
      ty = p.side === "near" ? rand(32, 40) : rand(4, 12);
      flight = lerp(1.18, 1.0, power);
      kind = "drive";
    }

    let noise = (p === this.far && this.mode === "cpu" ? DIFF[this.diff].err : 0.4) * (0.2 + d * 0.06);
    if (p === this.far && this.mode === "cpu") {
      tx = clamp(tx, 3.6, 16.4);
      ty = p.side === "far" ? clamp(ty, 3.2, 17.0) : clamp(ty, 27.0, 40.8);
      noise *= 0.3;
    }
    p.shotKind = kind;
    this.launchTo(b, tx, ty, flight, noise, kind);
    b.lastHit = p.side;
    b.lastBounceSide = null;
    b.bouncesSide = 0;
    this.rallyLen += 1;
    this.sfx.hit(power, kind);
    try {
      navigator.vibrate?.(12);
    } catch {
      /* ignore */
    }
  }

  heightAtNet(y, z, vy, vz) {
    if (Math.abs(vy) < 0.08) return 99;
    const tNet = (NET_Y - y) / vy;
    if (tNet <= 0.02) return 99;
    return z + vz * tNet - 0.5 * G * tNet * tNet;
  }

  launchTo(b, tx, ty, t, noise, style) {
    tx = clamp(tx + rand(-noise, noise), 1.6, 18.4);
    ty = ty + rand(-noise, noise) * 0.25;
    if (b.y < NET_Y) ty = clamp(ty, NET_Y + 5.2, 42.2);
    else ty = clamp(ty, 1.8, NET_Y - 5.2);

    const z0 = Math.max(b.z, 1.15);
    const dinkish = style === "dink" || style === "drop" || style === "lob";
    const tMin = style === "lob" ? 1.5 : style === "drop" || style === "serve" ? 1.2 : dinkish ? 1.05 : 1.0;
    t = clamp(t, tMin, 2.25);
    const need = style === "lob" ? 6.2 : dinkish || style === "serve" ? 4.7 : 4.15;
    let vx = 0,
      vy = 0,
      vz = 0;
    for (let i = 0; i < 16; i++) {
      vx = (tx - b.x) / t;
      vy = (ty - b.y) / t;
      vz = 0.5 * G * t - z0 / t;
      if (this.heightAtNet(b.y, z0, vy, vz) >= need) break;
      t = Math.min(2.25, t + 0.1);
      if (i > 5) {
        if (b.y > NET_Y) ty = Math.max(1.8, ty - 0.5);
        else ty = Math.min(42.2, ty + 0.5);
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

    for (const p of [this.near, this.far]) {
      if (p.charging) p.charge = clamp(p.charge + dt * 0.82, 0, 1);
      if (p.swinging) {
        p.swing += dt * 2.55;
        if (p.swing >= 1) {
          p.swinging = false;
          p.swing = 0;
        }
      }
      const spd = Math.hypot(p.vx, p.vy);
      p.walk += spd * dt * 2.4;
      const punch = p.swinging ? Math.sin(Math.min(p.swing, 1) * Math.PI) : 0;
      const wantCrouch = 0.34 + (p.charging ? p.charge * 0.28 : 0) + punch * 0.22 + (spd > 1 ? 0.08 : 0);
      p.crouch = lerp(p.crouch ?? 0.34, wantCrouch, 0.2);
      const wantTwist = (p.hand || 1) * (0.14 + (p.charging ? p.charge * 0.35 : 0) + punch * 0.55);
      p.twist = lerp(p.twist ?? 0.1, wantTwist, 0.22);
      if (p.side === "near") {
        p.x = clamp(p.x, -2.5, CW + 2.5);
        p.y = clamp(p.y, -3.2, NET_Y - 0.35);
      } else {
        p.x = clamp(p.x, -2.5, CW + 2.5);
        p.y = clamp(p.y, NET_Y + 0.35, CL + 3.2);
      }
      if (p.lastVolley > this.time - 0.4 && playerInKitchen(p) && this.phase === "rally" && this.ball.live) {
        this.flash("KITCHEN", 1.15);
        this.sfx.fault();
        this.endRally("kitchen", p.side);
        return;
      }
    }
  }

  steer(p, dt, isNear) {
    let ax = 0,
      ay = 0;
    const arrowsForP1 = isNear && this.mode !== "p2";
    if (isNear) {
      if (this.keys.has("KeyA") || (arrowsForP1 && this.keys.has("ArrowLeft"))) ax -= 1;
      if (this.keys.has("KeyD") || (arrowsForP1 && this.keys.has("ArrowRight"))) ax += 1;
      if (this.keys.has("KeyW") || (arrowsForP1 && this.keys.has("ArrowUp"))) ay += 1;
      if (this.keys.has("KeyS") || (arrowsForP1 && this.keys.has("ArrowDown"))) ay -= 1;
      if (this.stick.active) {
        ax += this.stick.dx;
        ay -= this.stick.dy;
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
    if (Math.abs(ax) < 0.08) ax = 0;
    if (Math.abs(ay) < 0.08) ay = 0;
    if (ax === 0 && ay === 0) {
      p.vx = 0;
      p.vy = 0;
      return;
    }
    const mag = Math.hypot(ax, ay);
    p.vx = (ax / mag) * p.speed;
    p.vy = (ay / mag) * p.speed;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  incoming(p) {
    if (!this.ball.live) return false;
    return p.side === "near" ? this.ball.vy < 0 : this.ball.vy > 0;
  }

  ai(dt) {
    const bots = [];
    if (this.demo || this.screen === "menu") bots.push(this.near, this.far);
    else if (this.mode === "cpu") bots.push(this.far);
    for (const p of bots) this.runAI(p, dt);
  }

  runAI(p, dt) {
    const d = DIFF[this.demo ? "normal" : this.diff];
    p.speed = d.speed;
    if (this.phase === "serve") {
      if (p === this.serverPlayer()) {
        this.serveT += dt;
        const delay = this.demo ? 0.7 : p.side === "far" ? 1.05 : 99;
        if (this.serveT > delay) {
          this.doServe(p, rand(0.45, 0.72));
        }
      } else {
        const even = this.evenScore();
        const tx = p.side === "far" ? (even ? 5 : 15) : even ? 15 : 5;
        const ty = p.side === "far" ? 39.2 : 4.8;
        this.moveTo(p, tx, ty, dt);
      }
      return;
    }
    if (this.phase !== "rally" || !this.ball.live) {
      const homeY = this.twoBounceDone() ? (p.side === "near" ? 15.4 : 28.6) : p.side === "near" ? 4 : 40;
      this.moveTo(p, 10, homeY, dt);
      return;
    }

    const incoming = this.incoming(p);
    const land = this.predictLanding(this.ball);
    if (incoming) {
      const ty = land.y + (p.side === "near" ? -1.15 : 1.15);
      this.moveTo(p, land.x + rand(-d.err, d.err) * 0.25, ty, dt);
      const reach = 3.55;
      const close = dist(p.x, p.y, this.ball.x, this.ball.y) < reach + 0.55;
      const zone = this.ball.z < 6.4 && this.ball.z > 0.45;
      const mustLetBounce =
        (p.side !== this.match.server && !this.match.serveBounced) ||
        (p.side === this.match.server && !this.match.returnBounced);
      const bouncedHere = this.ball.lastBounceSide === p.side;
      const volley = this.ball.z > 0.28 && !bouncedHere;
      if (mustLetBounce && !bouncedHere) {
        /* wait for the two-bounce rule */
      } else if (volley && playerInKitchen(p)) {
        /* never volley in the kitchen */
      } else if (close && zone && !p.swinging) {
        p.charge = this.chooseAIShot(p);
        this.doSwing(p, p.charge);
        p.charge = 0;
      }
    } else {
      const homeY = this.twoBounceDone() ? (p.side === "near" ? 15.35 : 28.65) : p.side === "near" ? 5.5 : 38.5;
      const homeX = lerp(p.x, this.ball.x, 0.18);
      this.moveTo(p, clamp(homeX, 3, 17), homeY, dt);
    }
  }

  chooseAIShot(p) {
    const hard = this.diff === "hard" && !this.demo;
    const atK = Math.abs(p.y - (p.side === "near" ? 15 : 29)) < 3.2;
    const third = this.match.serveBounced && !this.match.returnBounced && p.side === this.match.server;
    if (this.ball.z > 5.4 && Math.abs(p.y - NET_Y) < 11) return 0.88;
    if (third) return 0.18;
    if (atK) return hard && Math.random() < 0.1 ? 0.62 : 0.16;
    if (Math.random() < 0.72) return 0.2;
    return rand(0.22, 0.38);
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
          this.toast("Net cord — play on");
        }
      }

      if (b.z <= 0) {
        b.z = 0;
        const speed = Math.hypot(b.vx, b.vy);
        const e = lerp(0.16, 0.34, clamp(speed / 28, 0, 1));
        b.vz = Math.abs(b.vz) * e;
        b.vx *= 0.72;
        b.vy *= 0.72;
        if (b.vz < 0.95) b.vz = 0;
        this.onBounce();
        if (this.phase !== "rally") return;
        this.sfx.bounce();
      }
    }

    if (!Number.isFinite(b.x) || b.y < -12 || b.y > 58 || b.z > 28 || b.z < -1) {
      this.flash("OUT", 1);
      this.endRally("out", b.lastHit);
      return;
    }

    b.trail.push({ x: b.x, y: b.y, z: b.z });
    if (b.trail.length > 10) b.trail.shift();

    if (b.z === 0 && Math.hypot(b.vx, b.vy) < 1.4 && b.vz === 0) {
      const side = b.y < NET_Y ? "near" : "far";
      this.flash("NOT UP", 1.1);
      this.endRally("not-up", side);
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
      return;
    }

    if (out) {
      this.flash("OUT", 1.05);
      this.sfx.fault();
      this.endRally("out", b.lastHit);
      return;
    }

    if (b.lastBounceSide === side) {
      b.bouncesSide += 1;
      if (b.bouncesSide >= 2) {
        this.flash("DOUBLE BOUNCE", 1.15);
        this.sfx.fault();
        this.endRally("double", side);
        return;
      }
    } else {
      b.lastBounceSide = side;
      b.bouncesSide = 1;
      if (!this.match.returnBounced && side === this.match.server) {
        this.match.returnBounced = true;
        this.syncHud();
      }
    }
  }

  endRally(reason, faulter) {
    if (this.phase === "dead") return;
    this.phase = "dead";
    this.deadT = this.demo ? 0.55 : 1.25;
    this.ball.live = false;
    this.highlightBox = null;
    if (this.demo || this.screen === "menu") return;

    const server = this.match.server;
    if (faulter === server) {
      this.match.server = server === "near" ? "far" : "near";
      this.toast("Side out");
    } else {
      this.match[server] += 1;
      this.sfx.point();
      this.toast("Point");
    }
    this.syncHud();
    this.checkWin();
  }

  checkWin() {
    const a = this.match.near;
    const b = this.match.far;
    if ((a >= 11 || b >= 11) && Math.abs(a - b) >= 2) {
      this.screen = "over";
      this.phase = "dead";
      this.deadT = 999;
      $("over").hidden = false;
      $("over-title").textContent = a > b ? "You win" : this.mode === "p2" ? "Player 2 wins" : "CPU wins";
      $("over-sub").textContent = `${a} – ${b}`;
      $("over-kicker").textContent = "Game to 11 · win by 2";
      this.sfx.whistle();
    }
  }

  syncHud() {
    $("pts-near").textContent = String(this.match.near);
    $("pts-far").textContent = String(this.match.far);
    $("score-call").textContent = `${this.match.near} – ${this.match.far}`;
    const who = this.match.server === "near" ? "YOU" : this.mode === "p2" ? "P2" : "CPU";
    const court = this.evenScore() ? "right / even" : "left / odd";
    $("serve-tag").textContent = `${who} serving · ${court}`;
    $("chip-serve").classList.toggle("on", this.match.serveBounced);
    $("chip-return").classList.toggle("on", this.match.returnBounced);
    $("chip-rally").textContent = `Rally ${this.rallyLen}`;
  }

  flash(text, t) {
    if (this.demo) return;
    this.banner.text = text;
    this.banner.t = t;
    $("banner").textContent = text;
    $("banner").classList.add("show");
  }

  toast(text) {
    if (this.demo) return;
    $("toast").textContent = text;
    $("toast").classList.add("show");
    this.toastT = 1.4;
  }

  loop(now) {
    if (!this._last) this._last = now;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.05);
    if (!this.paused && this.screen !== "over") this.update(dt);
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

    if (this.phase === "serve" && this.screen === "play" && this.match.server === "near") {
      this.toastT = Math.max(this.toastT, 0.2);
      if (!$("toast").classList.contains("show")) this.toast("Hold SPACE / click to serve underhand");
    }
  }

  draw() {
    const ctx = this.ctx;
    const { w, h } = this;
    ctx.clearRect(0, 0, w, h);
    this.drawSky(ctx);
    this.drawGround(ctx);
    this.drawCourt(ctx);
    if (this.highlightBox) this.drawServeTarget(ctx);
    if (this.ball.live) this.drawLanding(ctx);
    this.drawShadow(ctx);

    const sprites = [
      { y: this.far.y, draw: () => this.drawPlayer(ctx, this.far) },
      { y: this.near.y, draw: () => this.drawPlayer(ctx, this.near) },
      { y: NET_Y, draw: () => this.drawNet(ctx) },
      { y: this.ball.y, draw: () => this.drawBall(ctx) },
    ];
    sprites.sort((a, b) => b.y - a.y);
    for (const s of sprites) s.draw();

    if (this.near.charging && this.screen === "play") this.drawCharge(ctx, this.near);
    if (this.far.charging && this.mode === "p2" && this.screen === "play") this.drawCharge(ctx, this.far);
  }

  drawSky(ctx) {
    const { w, h } = this;
    const g = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    g.addColorStop(0, "#7ec8e8");
    g.addColorStop(0.55, "#c7e7f5");
    g.addColorStop(1, "#e7f3ea");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(w * 0.18, h * 0.1, 90, 28, 0, 0, TAU);
    ctx.ellipse(w * 0.22, h * 0.11, 60, 22, 0, 0, TAU);
    ctx.ellipse(w * 0.78, h * 0.08, 110, 30, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#f7e3a1";
    ctx.beginPath();
    ctx.arc(w * 0.86, h * 0.08, 34, 0, TAU);
    ctx.fill();
  }

  drawGround(ctx) {
    const { w, h } = this;
    const g = ctx.createLinearGradient(0, h * 0.28, 0, h);
    g.addColorStop(0, "#4f8a46");
    g.addColorStop(1, "#2f5c32");
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.28, w, h);
    const fl = this.project(-8, 50, 0);
    const fr = this.project(28, 50, 0);
    ctx.fillStyle = "#8aa7b8";
    ctx.fillRect(0, 0, w, fl.sy);
    ctx.strokeStyle = "rgba(20,40,30,0.18)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const x = lerp(80, w - 80, i / 17);
      ctx.beginPath();
      ctx.moveTo(x, fl.sy - 70);
      ctx.lineTo(x, fl.sy);
      ctx.stroke();
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

    const runoff = [P(-4, -4), P(24, -4), P(24, 48), P(-4, 48)];
    poly(runoff);
    ctx.fillStyle = "#cfc6b4";
    ctx.fill();

    const court = [P(0, 0), P(20, 0), P(20, 44), P(0, 44)];
    poly(court);
    const cg = ctx.createLinearGradient(0, P(10, 44).sy, 0, P(10, 0).sy);
    cg.addColorStop(0, "#1a6fb4");
    cg.addColorStop(1, "#2b8ad0");
    ctx.fillStyle = cg;
    ctx.fill();

    const kn = [P(0, 15), P(20, 15), P(20, 29), P(0, 29)];
    poly(kn);
    ctx.fillStyle = "rgba(10, 50, 90, 0.22)";
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
      ctx.strokeStyle = "#f7f4ea";
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

    ctx.fillStyle = "rgba(244,241,232,0.55)";
    ctx.font = "600 11px Outfit, sans-serif";
    ctx.textAlign = "center";
    const k1 = P(10, 17.2);
    const k2 = P(10, 26.8);
    ctx.fillText("KITCHEN", k1.sx, k1.sy);
    ctx.fillText("KITCHEN", k2.sx, k2.sy);
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
  }

  drawLanding(ctx) {
    const land = this.predictLanding(this.ball);
    const p = this.project(land.x, land.y, 0);
    const ok = inCourt(land.x, land.y);
    ctx.save();
    ctx.translate(p.sx, p.sy);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, 16 * p.s, 0, TAU);
    ctx.fillStyle = ok ? "rgba(212,225,87,0.28)" : "rgba(228,90,67,0.3)";
    ctx.fill();
    ctx.strokeStyle = ok ? "rgba(212,225,87,0.9)" : "rgba(228,90,67,0.9)";
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
    ctx.arc(0, 0, (9 + b.z * 0.35) * p.s, 0, TAU);
    ctx.fillStyle = `rgba(0,0,0,${0.28 + Math.min(b.z, 8) * 0.02})`;
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
    const punch = p.swinging ? Math.sin(Math.min(p.swing, 1) * Math.PI) : 0;
    const charge = p.charging ? p.charge : 0;
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
    const kL = { x: (-9 + twist * 2) * s, y: hipY + (13 - crouch * 1.5) * s };
    const kR = { x: (9 + twist * 3) * s, y: hipY + (13 - crouch * 1.5) * s };
    const fL = { x: (-12 + twist) * s, y: 3 * s };
    const fR = { x: (11 + twist * 2) * s, y: 3 * s };

    const cap = (a, b, w, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    };

    ctx.fillStyle = "#efe6d8";
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
    ctx.rotate(-0.1 - punch * 0.1 + twist * 0.08);
    ctx.fillStyle = p.shirt;
    roundRect(ctx, -13 * s, -28 * s, 26 * s, 30 * s, 9 * s);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = p.skin;
    ctx.beginPath();
    ctx.arc(shX, headY, 11.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = p.visor;
    if (back) {
      roundRect(ctx, shX - 12 * s, headY - 9 * s, 24 * s, 6 * s, 2 * s);
      ctx.fill();
    } else {
      roundRect(ctx, shX - 12 * s, headY - 10 * s, 24 * s, 6 * s, 2 * s);
      ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(shX - 4 * s, headY, 1.5 * s, 0, TAU);
      ctx.arc(shX + 4 * s, headY, 1.5 * s, 0, TAU);
      ctx.fill();
    }

    const offHand = {
      x: shX - hand * (14 + punch * 3) * s,
      y: shY + (12 + punch * 2) * s,
    };
    cap({ x: shX - hand * 7 * s, y: shY + 3 * s }, offHand, 5.2 * s, p.skin);

    const poke = dink ? 11 : 18;
    const wind = charge * 12;
    const ax = shX + hand * (6 + wind - punch * 2) * s;
    const ay = shY + (10 - punch * poke + charge * 5) * s;
    cap({ x: shX + hand * 8 * s, y: shY + 3 * s }, { x: ax, y: ay }, 5.4 * s, p.skin);

    ctx.save();
    ctx.translate(ax + hand * 7 * s, ay - 5 * s);
    ctx.rotate(hand * (0.55 - punch * 0.95 - charge * 0.2));
    ctx.fillStyle = "#222";
    roundRect(ctx, -2 * s, 7 * s, 4 * s, 10 * s, 1.4 * s);
    ctx.fill();
    ctx.fillStyle = p.paddle;
    ctx.beginPath();
    ctx.ellipse(0, -1 * s, 11.5 * s, 14.5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 1.3 * s;
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  drawCharge(ctx, p) {
    const pr = this.project(p.x, p.y, 6.2);
    const w = 46 * pr.s;
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(pr.sx - w / 2, pr.sy, w, 6);
    ctx.fillStyle = p.charge < 0.28 ? "#d4e157" : p.charge < 0.7 ? "#f0c14a" : "#e45a43";
    ctx.fillRect(pr.sx - w / 2, pr.sy, w * p.charge, 6);
  }
}

const game = new Game();
window.game = game;
