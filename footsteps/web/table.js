"use strict";
const token = location.hash.slice(1);
const byId = id => document.getElementById(id);
const node = (tag, text) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
const point = p => "(" + p.join(", ") + ")";
const phases = {place: "Place a tile", discard: "Return a tile", propose: "Propose movement",
  move_vote: "Movement vote", nominate: "Nominate a player", eliminate_vote: "Elimination vote"};
let stamp, logLength = -1, sequence = 0, posting = false;
let choiceError = "", connectionError = "";

function showErrors() {
  const message = [choiceError, connectionError].filter(Boolean).join(" · ");
  if (byId("error").textContent !== message) byId("error").textContent = message;
}

function tile(value, center, classes = "") {
  const box = node("span");
  box.className = "face " + classes;
  const incoming = [], outgoing = [];
  ["n", "e", "s", "w"].forEach((side, d) => {
    const entry = value & (1 << d), exit = value & (16 << d);
    if (entry) incoming.push(side.toUpperCase());
    if (exit) outgoing.push(side.toUpperCase());
    const symbol = entry && exit ? "↕↔↕↔"[d] : entry ? "↓←↑→"[d] : exit ? "↑→↓←"[d] : "";
    const arrow = node("i", symbol);
    arrow.className = side;
    box.append(arrow);
  });
  box.append(node("b", center));
  box.title = center + " · In: " + (incoming.join("") || "none") + " · Out: " + (outgoing.join("") || "none");
  box.setAttribute("aria-label", box.title);
  return box;
}

function drawFloor(s, available) {
  const grid = byId("floor");
  grid.replaceChildren();
  const board = new Map(s.board.map(([p, v]) => [point(p), v]));
  const squares = s.board.map(([p]) => p).concat(available);
  const allowed = new Set(available.map(point));
  const xs = squares.map(p => p[0]), ys = squares.map(p => p[1]);
  const west = Math.min(...xs), east = Math.max(...xs);
  grid.style.gridTemplateColumns = "repeat(" + (east-west+1) + ",60px)";
  for (let y = Math.max(...ys); y >= Math.min(...ys); y--) {
    for (let x = west; x <= east; x++) {
      const cell = node("div"), at = point([x, y]);
      cell.className = "cell";
      if (board.has(at)) {
        const isExit = at === point(s.goal), marked = at === point(s.marker);
        const proposed = s.stage === "move_vote" && at === point(s.pending);
        const label = isExit ? "Exit" : at === point(s.start) ? "Start" : "";
        const face = tile(board.get(at), (marked ? "● " : "") + label,
          [isExit && "exit", marked && "marked", proposed && "pending"].filter(Boolean).join(" "));
        face.title = at + " · " + face.title;
        cell.append(face);
      } else if (allowed.has(at)) {
        const choose = node("button", at);
        choose.className = "square-choice";
        choose.title = "Place at " + at;
        choose.onclick = () => { const s = byId("square"); s.value = JSON.stringify([x,y]); s.dispatchEvent(new Event("change")); };
        cell.append(choose);
      }
      grid.append(cell);
    }
  }
}

function optionLabel(key, v, state) {
  if (v === null) return key === "to" ? "Stay" : "Pass";
  if (key === "can_step") return v ? "Open from origin to new tile" : "Blocked from origin to new tile";
  if (key === "marker_on_origin") return v ? "Marker is on the origin" : "Marker is elsewhere";
  if (key === "tile") return "Face " + v;
  if (key === "rotation") return (90*v) + "° clockwise";
  if (key === "target") return "P" + v;
  if (key === "vote" && state.stage === "move_vote")
    return v ? "Move marker to " + point(state.pending) : "Keep marker at " + point(state.marker);
  if (key === "vote") return (v ? "Remove P" : "Keep P") + state.pending + (v ? "" : " in play");
  return point(v);
}

function controls(d) {
  const area = byId("controls");
  area.replaceChildren();
  const form = node("form");
  area.append(form);
  if (d.phase === "lobby" && !d.ready) {
    form.append(node("button", "Ready to play"));
    form.onsubmit = e => { e.preventDefault(); send("/ready", {}); };
  } else if (d.can_speak) {
    const label = node("label", "One public remark before voting");
    const input = node("input");
    input.maxLength = 500;
    input.required = true;
    label.append(input);
    form.append(label, node("button", "Speak"));
    form.onsubmit = e => { e.preventDefault(); send("/say", {revision: d.revision, text: input.value}); };
  } else if (d.choices) {
    const names = {tile: "Tile", at: "Square", rotation: "Rotation", vote: "Ballot", to: "Propose marker step", target: "Nominee"};
    if (d.choices.origin) {
      form.append(node("p", "The marker stays at " + point(d.state.marker) + " during placement. Read the edge from the chosen origin to the new tile."));
    }
    Object.assign(names, {origin: "Existing neighbor (origin)", can_step: "Step from origin to new tile", marker_on_origin: "Marker location"});
    const selects = {};
    for (const [key, values] of Object.entries(d.choices)) {
      const label = node("label", names[key]), select = node("select");
      if (key === "at") select.id = "square";
      for (const value of values) select.add(new Option(optionLabel(key, value, d.state), JSON.stringify(value)));
      if (key === "can_step" || key === "marker_on_origin") {
        select.add(new Option("Choose an answer", ""), 0);
        select.value = "";
        select.required = true;
      }
      label.append(select);
      form.append(label);
      selects[key] = select;
    }
    if (selects.origin) {
      function origins() {
        const [x,y] = JSON.parse(selects.at.value);
        const previous = selects.origin.value;
        selects.origin.replaceChildren();
        for (const p of d.choices.origin) {
          if (Math.abs(p[0]-x) + Math.abs(p[1]-y) === 1)
            selects.origin.add(new Option(point(p), JSON.stringify(p)));
        }
        if (Array.from(selects.origin.options).some(o => o.value === previous))
          selects.origin.value = previous;
      }
      selects.at.onchange = origins;
      origins();
    }
    if (selects.rotation) {
      const preview = node("div");
      const refresh = () => {
        const f = Number(selects.tile.value), r = Number(selects.rotation.value);
        const spin = m => ((m << r) | (m >> (4-r))) & 15;
        preview.replaceChildren(tile(spin(f >> 4) * 16 + spin(f & 15), String(f)));
      };
      refresh();
      selects.tile.onchange = selects.rotation.onchange = refresh;
      form.append(preview);
    }
    form.append(node("button", d.choices.vote ? "Commit ballot" : phases[d.state.stage]));
    form.onsubmit = e => {
      e.preventDefault();
      const choice = Object.fromEntries(Object.entries(selects).map(([k, s]) => [k, JSON.parse(s.value)]));
      send("/choice", {revision: d.revision, choice});
    };
  } else if (d.phase !== "over") {
    area.append(node("p", d.voted ? "Ballot committed. Waiting for reveal." : "Waiting for the table."));
  }
}

function render(d) {
  const s = d.state;
  byId("clock").textContent = d.seconds_left === null ? "" :
    Math.ceil(d.seconds_left) + "s until " + (d.phase === "discussion" ? "voting opens" : "deadline");
  if (d.history.length !== logLength) {
    logLength = d.history.length;
    byId("log").replaceChildren(...d.history.slice().reverse().map(h => node("li", "Turn " + h.turn + " · " + h.text)));
  }
  const current = [d.revision, d.phase, d.ready, d.ready_count, d.voted, d.can_speak].join("/");
  if (current === stamp) return;
  stamp = current;
  const name = (role) => role[0].toUpperCase() + role.slice(1);
  byId("seat").textContent = "P" + d.seat;
  byId("status").textContent = d.phase === "lobby" ? "Waiting for seats" :
    s.winner ? name(s.winner) + " team wins" : "Turn " + s.turn + " · P" + s.actor + " builds";
  byId("facts").textContent = d.phase === "lobby" ? d.ready_count + " of " + s.player_count + " ready" :
    "Living seats: " + s.alive.map(i => "P" + i).join(", ") + " · Tiles in store: " + s.store_count;
  byId("positions").textContent = "Marker " + point(s.marker) + " · Exit " + point(s.goal);
  byId("identity").textContent = "Team: " + name(s.role) + " · " + s.red_count + " " + name("red") + " at setup" +
    (s.teammates?.length ? " · Teammates: " + s.teammates.map(i => "P" + i).join(", ") : "") +
    (!s.alive.includes(d.seat) ? " · Eliminated" : "");
  byId("hand").replaceChildren(...s.hand.map(f => tile(f, String(f))));
  drawFloor(s, d.choices?.at || []);
  const pending = s.stage === "move_vote" ? " · " + point(s.pending) :
    s.stage === "eliminate_vote" ? " · P" + s.pending :
    s.stage === "nominate" ? " · P" + s.nominator : "";
  byId("action-title").textContent = d.phase === "lobby" ? "Join game" :
    s.winner ? "Roles: " + s.roles.map((r, i) => "P" + i + " " + name(r)).join(", ") :
    (d.phase === "discussion" ? "Discuss: " : "") + phases[s.stage] + pending;
  controls(d);
}

async function request(path, body) {
  const id = ++sequence;
  const options = {headers: {Authorization: "Bearer " + token}};
  if (body) Object.assign(options, {method: "POST", body: JSON.stringify(body)});
  const res = await fetch(path, options);
  const data = await res.json();
  if (id !== sequence) return;
  if (!res.ok) throw Error(data.error);
  render(data);
}

async function send(path, body) {
  if (posting) return;
  posting = true;
  try {
    await request(path, body);
    choiceError = connectionError = "";
    showErrors();
  } catch (e) { choiceError = e.message; showErrors(); }
  finally { posting = false; }
}

async function poll() {
  try {
    if (!posting) {
      await request("/state");
      connectionError = "";
      showErrors();
    }
  } catch (e) { connectionError = e.message; showErrors(); }
  setTimeout(poll, 700);
}
if (token) poll();
else byId("status").textContent = "Open the private link printed for your seat.";
