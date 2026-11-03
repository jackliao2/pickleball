// Online play: pairs two browsers through the room service at /rooms/<CODE>
// (a Cloudflare Worker, see cloudflare/rooms), then moves them onto a direct
// WebRTC data channel. If the direct connection cannot be made (strict NATs,
// some mobile carriers) the room keeps relaying messages instead.
//
// Loaded on demand by game.js, so single-player visitors never download it.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ICE = [{ urls: "stun:stun.cloudflare.com:3478" }, { urls: "stun:stun.l.google.com:19302" }];
// Long enough for a TURN relay over TCP/TLS to come up on a slow mobile link.
const DIRECT_TIMEOUT_MS = 9000;
const SILENCE_MS = 6000;

export function newRoomCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function cleanRoomCode(s) {
  const code = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^[A-HJ-NP-Z2-9]{5}$/.test(code) ? code : null;
}

function signalBase() {
  const local = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (local) return `ws://${location.hostname}:8787/rooms`;
  return `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/rooms`;
}

/**
 * events: onStatus(state, detail) where state is one of
 *   "waiting"  host is in the room, nobody has joined yet
 *   "joining"  both are in, connecting
 *   "ready"    messages flow; detail is "direct" or "relay"
 *   "closed"   session over; detail says why (peer-left, no-host, full, lost, error)
 * onMessage(msg) for every game message from the other player.
 */
export class NetSession {
  constructor({ code, role, onStatus, onMessage }) {
    this.code = code;
    this.role = role;
    this.onStatus = onStatus;
    this.onMessage = onMessage;
    this.state = "connecting";
    this.transport = null;
    this.pc = null;
    this.fast = null;
    this.sure = null;
    this.ws = null;
    this.pendingIce = [];
    this.lastHeard = 0;
    this.timers = [];
    this.rtt = 0;
    this.ice = null;
    // How the two games ended up connected: "direct", "turn" (Cloudflare's UDP
    // relay) or "server" (messages through the room). Plus where, for the report.
    this.route = "";
    this.where = { room: "", edges: {} };
  }

  start() {
    let ws;
    try {
      ws = new WebSocket(`${signalBase()}/${this.code}?role=${this.role}`);
    } catch {
      this.finish("error");
      return;
    }
    this.ws = ws;
    ws.onmessage = (e) => this.onSignal(e.data);
    ws.onclose = () => {
      this.ws = null;
      // Once the direct channel is up the room is no longer needed.
      if (this.transport !== "direct") this.finish(this.state === "connecting" ? "error" : "lost");
    };
    ws.onerror = () => {};
  }

  onSignal(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    switch (msg.type) {
      case "waiting":
        this.setState("waiting");
        break;
      case "peer-joined":
        if (Array.isArray(msg.ice) && msg.ice.length) this.ice = msg.ice;
        this.where = { room: String(msg.room || ""), edges: msg.edges || {} };
        this.setState("joining");
        this.openPeer();
        break;
      case "peer-left":
        if (this.transport !== "direct") this.finish("peer-left");
        break;
      case "no-host":
      case "full":
      case "taken":
        this.finish(msg.type);
        break;
      case "rtc":
        this.onRtc(msg);
        break;
      case "game":
        // The other side has given up on a direct link; follow it.
        if (!this.transport) this.useRelay();
        if (this.transport === "relay") this.receive(msg.d);
        break;
      case "relay-on":
        this.useRelay();
        break;
    }
  }

  signal(msg) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  openPeer() {
    if (this.pc) return;
    if (typeof RTCPeerConnection !== "function") {
      this.signal({ type: "relay-on" });
      this.useRelay();
      return;
    }
    const pc = new RTCPeerConnection({ iceServers: this.ice || ICE });
    this.pc = pc;
    pc.onicecandidate = (e) => {
      if (e.candidate) this.signal({ type: "rtc", ice: e.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" && this.transport !== "relay") {
        if (this.transport === "direct") this.finish("lost");
        else this.useRelay();
      }
    };
    if (this.role === "host") {
      this.bindChannel(pc.createDataChannel("fast", { ordered: false, maxRetransmits: 0 }));
      this.bindChannel(pc.createDataChannel("sure", { ordered: true }));
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => this.signal({ type: "rtc", sdp: pc.localDescription.toJSON() }))
        .catch(() => this.useRelay());
    } else {
      pc.ondatachannel = (e) => this.bindChannel(e.channel);
    }
    // Give the direct route a few seconds; the relay always works.
    this.later(() => {
      if (!this.transport) {
        this.signal({ type: "relay-on" });
        this.useRelay();
      }
    }, DIRECT_TIMEOUT_MS);
  }

  async onRtc(msg) {
    if (!this.pc) this.openPeer();
    const pc = this.pc;
    if (!pc) return;
    try {
      if (msg.sdp) {
        await pc.setRemoteDescription(msg.sdp);
        for (const c of this.pendingIce.splice(0)) await pc.addIceCandidate(c);
        if (msg.sdp.type === "offer") {
          await pc.setLocalDescription(await pc.createAnswer());
          this.signal({ type: "rtc", sdp: pc.localDescription.toJSON() });
        }
      } else if (msg.ice) {
        if (pc.remoteDescription) await pc.addIceCandidate(msg.ice);
        else this.pendingIce.push(msg.ice);
      }
    } catch {
      /* a bad candidate is not fatal; the timeout falls back to relay */
    }
  }

  bindChannel(ch) {
    if (ch.label === "fast") this.fast = ch;
    else this.sure = ch;
    ch.onmessage = (e) => {
      if (this.transport === "direct") this.receive(e.data);
    };
    ch.onopen = () => {
      if (this.fast?.readyState === "open" && this.sure?.readyState === "open" && !this.transport) {
        this.transport = "direct";
        this.route = "direct";
        this.ready();
        this.later(() => this.checkRoute(), 1500);
        // The room has done its job; closing it lets the Durable Object sleep.
        this.later(() => this.ws?.close(1000, "direct"), 1500);
      }
    };
    ch.onclose = () => {
      if (this.transport === "direct") this.finish("peer-left");
    };
  }

  /** Was the WebRTC link direct, or through the TURN relay? */
  async checkRoute() {
    const pc = this.pc;
    if (!pc) return;
    try {
      const stats = await pc.getStats();
      let pair = null;
      stats.forEach((r) => {
        if (r.type === "transport" && r.selectedCandidatePairId) pair = stats.get(r.selectedCandidatePairId);
      });
      if (!pair) stats.forEach((r) => {
        if (r.type === "candidate-pair" && r.nominated && r.state === "succeeded") pair = r;
      });
      if (!pair) return;
      const local = stats.get(pair.localCandidateId);
      const remote = stats.get(pair.remoteCandidateId);
      this.route = local?.candidateType === "relay" || remote?.candidateType === "relay" ? "turn" : "direct";
    } catch {
      /* stats are a report, not a requirement */
    }
  }

  useRelay() {
    if (this.transport || this.state === "closed") return;
    this.transport = "relay";
    this.route = "server";
    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }
    this.pc = null;
    this.ready();
  }

  ready() {
    this.lastHeard = performance.now();
    this.setState("ready", this.transport);
    this.every(() => {
      this.send({ t: "ping", at: performance.now() }, true);
      if (performance.now() - this.lastHeard > SILENCE_MS) this.finish("lost");
    }, 1000);
  }

  receive(raw) {
    let msg;
    try {
      msg = typeof raw === "string" ? JSON.parse(raw) : null;
    } catch {
      return;
    }
    if (!msg) return;
    this.lastHeard = performance.now();
    if (msg.t === "ping") {
      this.send({ t: "pong", at: msg.at }, true);
      return;
    }
    if (msg.t === "pong") {
      this.rtt = lerpRtt(this.rtt, performance.now() - msg.at);
      return;
    }
    if (msg.t === "bye") {
      this.finish("peer-left");
      return;
    }
    this.onMessage(msg);
  }

  /** reliable: true for events that must arrive (serve, score, swing); false for
   *  frequent state that the next update replaces anyway. */
  send(msg, reliable = false) {
    if (this.state !== "ready") return;
    const raw = JSON.stringify(msg);
    if (this.transport === "direct") {
      const ch = reliable ? this.sure : this.fast;
      if (ch?.readyState === "open") {
        // Drop frequent updates rather than queue them behind a slow link.
        if (!reliable && ch.bufferedAmount > 64 * 1024) return;
        ch.send(raw);
      }
    } else if (this.transport === "relay") {
      this.signal({ type: "game", d: raw });
    }
  }

  setState(state, detail) {
    if (this.state === "closed") return;
    this.state = state;
    this.onStatus(state, detail);
  }

  finish(reason) {
    if (this.state === "closed") return;
    this.state = "closed";
    for (const t of this.timers) clearTimeout(t), clearInterval(t);
    this.timers = [];
    try {
      this.pc?.close();
    } catch {
      /* ignore */
    }
    try {
      this.ws?.close(1000, "bye");
    } catch {
      /* ignore */
    }
    this.pc = this.ws = null;
    this.onStatus("closed", reason);
  }

  leave() {
    if (this.state === "ready") {
      const raw = JSON.stringify({ t: "bye" });
      if (this.transport === "direct" && this.sure?.readyState === "open") this.sure.send(raw);
      else this.signal({ type: "game", d: raw });
    }
    this.finish("left");
  }

  later(fn, ms) {
    this.timers.push(setTimeout(fn, ms));
  }

  every(fn, ms) {
    this.timers.push(setInterval(fn, ms));
  }
}

function lerpRtt(prev, sample) {
  return prev ? prev * 0.8 + sample * 0.2 : sample;
}
