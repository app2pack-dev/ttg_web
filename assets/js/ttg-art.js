// TTG art for the web: the game's star field (shaders/starfield.frag, ported
// to WebGL 1), its planets (classic sprites + the themed skins from
// lib/presentation/galaxy/planet_skins.dart, ported to canvas 2D) and the
// galaxies. Shared by every landing page sample.
(function () {
  'use strict';
  var TAU = Math.PI * 2;
  var IMG = (document.currentScript && document.currentScript.dataset.img) || 'img/';

  // ------------------------------------------------------------ galaxies
  var GALAXIES = [
    { id: 'space', title: 'DEEP SPACE', accent: '#8C9EFF', sky: ['#462855', '#1d134d'], skins: ['classic'], start: 0,
      colors: ['#f4e8dc', '#ff00f4', '#bd4fda', '#ff6061', '#afff00', '#fddd13', '#fdb979', '#03ffb9', '#1cd15c', '#00d2ff'] },
    { id: 'candy', title: 'SUGAR NEBULA', accent: '#FF6FB5', sky: ['#5B1D50', '#26103F'], skins: ['donut', 'cookie', 'swirl'], start: 100,
      colors: ['#FF6FB5', '#FF4F6D', '#FFE066', '#C59CFF', '#7FF0C8', '#6FD3FF'] },
    { id: 'ice', title: 'FROST BELT', accent: '#7FE3FF', sky: ['#0F4057', '#0A1A3A'], skins: ['glacier', 'crystal'], start: 300,
      colors: ['#E0F7FF', '#9BE7FF', '#6FC8FF', '#B3F0FF', '#C7D8FF', '#8FF5E6'] },
    { id: 'neon', title: 'NEON RIFT', accent: '#FF3DF2', sky: ['#3A0B4F', '#07051A'], skins: ['grid', 'pulsar'], start: 500,
      colors: ['#FF3DF2', '#3DF5FF', '#B6FF3D', '#FF9F3D', '#A86BFF', '#FFF03D'] }
  ];
  // How the rocket orbits each skin (1 normal, -1 backwards).
  var SPIN = { classic: 1, donut: -1, cookie: 1, swirl: 1, glacier: 0.8, crystal: 1.2, grid: 1, pulsar: 1 };

  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hexRgb(c) {
    var n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(c, a) { var r = hexRgb(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; }
  function mix(a, b, t) {
    var x = hexRgb(a), y = hexRgb(b);
    return '#' + [0, 1, 2].map(function (i) {
      return Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0');
    }).join('');
  }

  // --------------------------------------------------------------- images
  var images = {};
  function img(name) {
    if (!images[name]) {
      var im = new Image();
      im.src = IMG + name;
      images[name] = im;
    }
    return images[name];
  }
  function ready(im) { return im.complete && im.naturalWidth > 0; }
  for (var i = 1; i <= 9; i++) img('planet/shade1-' + i + '.png');
  img('planet/shade2.png');

  // ---------------------------------------------------------- planet art
  function radial(path, fn, steps) {
    steps = steps || 72;
    for (var i = 0; i <= steps; i++) {
      var a = i / steps * TAU, r = fn(a);
      if (i === 0) path.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else path.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    path.closePath();
    return path;
  }
  function circle(path, r, x, y) {
    x = x || 0; y = y || 0;
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, TAU);
    return path;
  }

  function buildSkin(skin, color, seed) {
    var R = rng(seed * 7919 + 13);
    function rand(a, b) { return a + R() * (b - a); }
    var layers = [], sparkles = [];
    function fill(p, c, rule) { layers.push({ p: p, fill: c, rule: rule }); }
    function stroke(p, c, w) { layers.push({ p: p, stroke: c, w: w }); }
    function blob(path, x, y, r) {
      var b0 = rand(0, TAU), b1 = rand(0, TAU);
      for (var i = 0; i <= 14; i++) {
        var a = i / 14 * TAU, rr = r * (1 + 0.16 * Math.sin(3 * a + b0) + 0.08 * Math.sin(5 * a + b1));
        if (i === 0) path.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        else path.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      path.closePath();
    }
    function scatter(n, maxR, gap, minR) {
      minR = minR || 0;
      var pts = [];
      for (var t = 0; pts.length < n && t < n * 40; t++) {
        var r = Math.sqrt(rand(minR * minR / (maxR * maxR), 1)) * maxR, a = rand(0, TAU);
        var p = [Math.cos(a) * r, Math.sin(a) * r];
        if (pts.every(function (q) { return Math.hypot(q[0] - p[0], q[1] - p[1]) >= gap; })) pts.push(p);
      }
      return pts;
    }
    var unit = circle(new Path2D(), 1);
    if (skin === 'donut') {
      var hole = 0.34, dough = circle(circle(new Path2D(), 1), hole);
      fill(dough, '#E7A862', 'evenodd');
      stroke(circle(new Path2D(), 0.955), '#B8732F', 0.07);
      var p1 = rand(0, TAU), p2 = rand(0, TAU), p3 = rand(0, TAU), icing = new Path2D();
      radial(icing, function (a) { return 0.82 + 0.07 * Math.sin(6 * a + p1) + 0.03 * Math.sin(11 * a + p2); });
      radial(icing, function (a) { return 0.45 + 0.03 * Math.sin(5 * a + p3); });
      fill(icing, color, 'evenodd');
      stroke(circle(new Path2D(), hole + 0.02), mix('#B8732F', '#000000', 0.2), 0.05);
      var sc = ['#FFFFFF', '#FFE066', '#6FE7FF', '#B388FF', '#FF8FB1', '#9CFF6F'].filter(function (c) { return c.toLowerCase() !== color.toLowerCase(); });
      var sp = sc.map(function () { return new Path2D(); });
      scatter(18, 0.69, 0.13, 0.56).forEach(function (p) {
        var a = rand(0, Math.PI), dx = Math.cos(a) * 0.065, dy = Math.sin(a) * 0.065, k = Math.floor(R() * sc.length);
        sp[k].moveTo(p[0] - dx, p[1] - dy); sp[k].lineTo(p[0] + dx, p[1] + dy);
      });
      sp.forEach(function (p, k) { stroke(p, sc[k], 0.06); });
    } else if (skin === 'cookie') {
      var b0 = rand(0, TAU), b1 = rand(0, TAU);
      var body = radial(new Path2D(), function (a) { return 0.975 + 0.018 * Math.sin(7 * a + b0) + 0.012 * Math.sin(13 * a + b1); });
      fill(body, '#DDA25C'); stroke(body, '#B77634', 0.08);
      var spots = new Path2D();
      scatter(5, 0.7, 0.3).forEach(function (p) { blob(spots, p[0], p[1], rand(0.12, 0.2)); });
      fill(spots, 'rgba(183,118,52,0.13)');
      var choc = new Path2D(), candy = new Path2D();
      scatter(9, 0.72, 0.28).forEach(function (p, i) { blob(i % 3 === 0 ? candy : choc, p[0], p[1], rand(0.09, 0.13)); });
      fill(choc, '#4E2C1A'); fill(candy, color);
      var crumbs = new Path2D();
      scatter(10, 0.85, 0.12).forEach(function (p) { circle(crumbs, 0.025, p[0], p[1]); });
      fill(crumbs, '#F3CB8E');
    } else if (skin === 'swirl') {
      fill(unit, '#FFF4F8');
      var stripes = new Path2D(), arms = 5, twist = 2.4, width = 0.62;
      for (var k = 0; k < arms; k++) {
        var a0 = k * TAU / arms, st = 24, i2;
        for (i2 = 0; i2 <= st; i2++) {
          var t = i2 / st, an = a0 + twist * t;
          if (i2 === 0) stripes.moveTo(Math.cos(an) * t, Math.sin(an) * t); else stripes.lineTo(Math.cos(an) * t, Math.sin(an) * t);
        }
        stripes.arc(0, 0, 1, a0 + twist, a0 + twist + width);
        for (i2 = st; i2 >= 0; i2--) {
          var t2 = i2 / st, an2 = a0 + width + twist * t2;
          stripes.lineTo(Math.cos(an2) * t2, Math.sin(an2) * t2);
        }
        stripes.closePath();
      }
      fill(stripes, color);
      stroke(circle(new Path2D(), 0.96), rgba(mix(color, '#000000', 0.15), 0.5), 0.07);
      fill(circle(new Path2D(), 0.1), '#FFFFFF');
    } else if (skin === 'glacier') {
      fill(unit, color);
      var deep = new Path2D();
      scatter(4, 0.6, 0.45).forEach(function (p) { blob(deep, p[0], p[1], rand(0.16, 0.24)); });
      fill(deep, mix(color, '#1A4F8A', 0.22));
      var snow = new Path2D();
      scatter(5, 0.72, 0.38).forEach(function (p) { blob(snow, p[0], p[1], rand(0.12, 0.2)); });
      fill(snow, 'rgba(255,255,255,0.9)');
      var cracks = new Path2D(), s0 = rand(0, TAU);
      for (var c = 0; c < 3; c++) {
        var ang = s0 + c * TAU / 3 + rand(-0.3, 0.3), r = rand(0.08, 0.2);
        cracks.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        while (r < 0.85) {
          r += rand(0.12, 0.2); ang += rand(-0.35, 0.35);
          cracks.lineTo(Math.cos(ang) * Math.min(r, 0.9), Math.sin(ang) * Math.min(r, 0.9));
        }
      }
      stroke(cracks, 'rgba(255,255,255,0.65)', 0.04);
      stroke(circle(new Path2D(), 0.965), 'rgba(255,255,255,0.4)', 0.07);
    } else if (skin === 'crystal') {
      fill(unit, color);
      var sides = 6, off = rand(0, TAU);
      var inner = function (i) { var a = off + i * TAU / sides; return [Math.cos(a) * 0.48, Math.sin(a) * 0.48]; };
      var light = new Path2D(), dark = new Path2D(), edges = new Path2D(), table = new Path2D();
      for (var f = 0; f < sides; f++) {
        var fa = off + f * TAU / sides, P = f % 2 === 0 ? light : dark, q0 = inner(f), q1 = inner(f + 1);
        P.moveTo(q0[0], q0[1]); P.arc(0, 0, 1, fa, fa + TAU / sides); P.lineTo(q1[0], q1[1]); P.closePath();
        edges.moveTo(q0[0], q0[1]); edges.lineTo(Math.cos(fa), Math.sin(fa));
        edges.moveTo(q0[0], q0[1]); edges.lineTo(q1[0], q1[1]);
        if (f === 0) table.moveTo(q0[0], q0[1]); else table.lineTo(q0[0], q0[1]);
      }
      table.closePath();
      fill(light, 'rgba(255,255,255,0.2)'); fill(dark, 'rgba(0,32,80,0.15)');
      fill(table, 'rgba(255,255,255,0.28)'); stroke(edges, 'rgba(255,255,255,0.6)', 0.03);
      sparkles.push([-0.42, -0.5, 0.2, rand(0, TAU)], [0.5, 0.25, 0.15, rand(0, TAU)], [-0.1, 0.55, 0.12, rand(0, TAU)]);
    } else if (skin === 'grid') {
      fill(unit, '#120A2A');
      var lines = new Path2D();
      for (var m = 1; m < 6; m++) {
        var rx = Math.abs(Math.cos(m * Math.PI / 6));
        if (rx < 0.05) { lines.moveTo(0, -1); lines.lineTo(0, 1); } else { lines.moveTo(rx, 0); lines.ellipse(0, 0, rx, 1, 0, 0, TAU); }
      }
      [-0.75, -0.4, 0, 0.4, 0.75].forEach(function (y) { var h = Math.sqrt(1 - y * y); lines.moveTo(-h, y); lines.lineTo(h, y); });
      stroke(lines, rgba(color, 0.85), 0.045);
      stroke(circle(new Path2D(), 0.97), mix(color, '#FFFFFF', 0.5), 0.07);
    } else if (skin === 'pulsar') {
      fill(unit, '#120A2A');
      var rings = new Path2D();
      [0.45, 0.68, 0.88].forEach(function (r) { circle(rings, r); });
      stroke(rings, rgba(color, 0.55), 0.04);
      var jets = new Path2D(), ja = rand(0, Math.PI);
      [0, Math.PI].forEach(function (side) {
        var b = ja + side;
        jets.moveTo(Math.cos(b - 0.32) * 0.18, Math.sin(b - 0.32) * 0.18);
        jets.lineTo(Math.cos(b) * 0.96, Math.sin(b) * 0.96);
        jets.lineTo(Math.cos(b + 0.32) * 0.18, Math.sin(b + 0.32) * 0.18);
        jets.closePath();
      });
      fill(jets, rgba(mix(color, '#FFFFFF', 0.3), 0.75));
      stroke(circle(new Path2D(), 0.97), mix(color, '#FFFFFF', 0.5), 0.07);
    }
    return { layers: layers, sparkles: sparkles };
  }

  function star(ctx, x, y, s) {
    var th = s * 0.22;
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.lineTo(x + th, y - th); ctx.lineTo(x + s, y); ctx.lineTo(x + th, y + th);
    ctx.lineTo(x, y + s); ctx.lineTo(x - th, y + th); ctx.lineTo(x - s, y); ctx.lineTo(x - th, y - th);
    ctx.closePath(); ctx.fill();
  }

  // A planet: { skin, color, seed, shade } -> drawn at (x, y) with radius r.
  // rotation turns themed bodies; beat (-1..1) drives the pulsar.
  function Planet(spec) {
    this.skin = spec.skin || 'classic';
    this.color = spec.color;
    this.seed = spec.seed || 1;
    this.shade = spec.shade || (1 + (this.seed % 9));
    this.spin = SPIN[this.skin] || 1;
    this.pulse = this.skin === 'pulsar' ? 0.35 : 0;
    this.art = this.skin === 'classic' || this.skin === 'earth' ? null : buildSkin(this.skin, this.color, this.seed);
  }
  Planet.prototype.beat = function (time) { return this.pulse ? Math.sin(time * TAU / 1.8) : 0; };
  Planet.prototype.spinAt = function (time) { return this.spin * (1 + this.pulse * this.beat(time)); };
  Planet.prototype.draw = function (ctx, x, y, r, time, rotation) {
    ctx.save();
    ctx.translate(x, y);
    if (!this.art) {
      if (this.skin === 'earth') {
        var e = img('planet/earth.png');
        if (ready(e)) ctx.drawImage(e, -r, -r, 2 * r, 2 * r);
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        var s1 = img('planet/shade1-' + this.shade + '.png'), s2 = img('planet/shade2.png'), S = r * 1.27;
        if (ready(s1)) ctx.drawImage(s1, -S, -S, 2 * S, 2 * S);
        if (ready(s2)) ctx.drawImage(s2, -S, -S, 2 * S, 2 * S);
      }
      ctx.restore();
      return;
    }
    var beat = this.beat(time || 0);
    ctx.scale(r, r);
    if (this.skin === 'grid' || this.skin === 'pulsar') {
      var strength = this.skin === 'pulsar' ? 0.55 + 0.45 * beat : 0.6;
      var g = ctx.createRadialGradient(0, 0, 0.8, 0, 0, 1.25 + 0.15 * strength);
      g.addColorStop(0, rgba(this.color, 0));
      g.addColorStop(0.3, rgba(this.color, 0.75 * strength + 0.2));
      g.addColorStop(1, rgba(this.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 1.45, 0, TAU); ctx.fill();
    }
    ctx.save();
    ctx.rotate(rotation || 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var i = 0; i < this.art.layers.length; i++) {
      var L = this.art.layers[i];
      if (L.fill) { ctx.fillStyle = L.fill; ctx.fill(L.p, L.rule || 'nonzero'); }
      else { ctx.strokeStyle = L.stroke; ctx.lineWidth = L.w; ctx.stroke(L.p); }
    }
    ctx.restore();
    if (this.skin === 'pulsar') {
      var st = 0.5 + 0.5 * beat, core = mix(this.color, '#FFFFFF', 0.4), cr = 0.22 + 0.16 * st;
      var cg = ctx.createRadialGradient(0, 0, 0, 0, 0, cr * 1.9);
      cg.addColorStop(0, rgba(core, 0.5 + 0.5 * st)); cg.addColorStop(0.45, rgba(core, 0.4 + 0.4 * st)); cg.addColorStop(1, rgba(core, 0));
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, cr * 1.9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, 0.1 + 0.05 * st, 0, TAU); ctx.fill();
    }
    for (var k = 0; k < this.art.sparkles.length; k++) {
      var s = this.art.sparkles[k], str = Math.pow(Math.max(0, Math.sin((time || 0) * 2.4 + s[3])), 3);
      if (str < 0.02) continue;
      ctx.fillStyle = 'rgba(255,255,255,' + str + ')';
      star(ctx, s[0], s[1], s[2] * (0.6 + 0.4 * str));
    }
    ctx.restore();
  };

  // A random planet of a galaxy (never the same skin twice in a row).
  function randomPlanet(galaxy, R, prevSkin) {
    var g = typeof galaxy === 'number' ? GALAXIES[galaxy] : galaxy;
    var skins = g.skins.length > 1 ? g.skins.filter(function (s) { return s !== prevSkin; }) : g.skins;
    return new Planet({
      skin: skins[Math.floor(R() * skins.length)],
      color: g.colors[Math.floor(R() * g.colors.length)],
      seed: Math.floor(R() * 1e6) + 1,
      shade: 1 + Math.floor(R() * 9)
    });
  }

  // ------------------------------------------------------------ the rocket
  // Draws the rocket at (x, y), nose along `angle` (0 = up, clockwise).
  function drawRocket(ctx, which, x, y, size, angle, alpha) {
    var im = img('rocket/rocket' + (which || 1) + '.webp');
    if (!ready(im)) return;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(im, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  // Exhaust and sparks: a small pooled particle system drawn with 'lighter'.
  function Particles() { this.list = []; }
  Particles.prototype.emit = function (x, y, vx, vy, life, size, color) {
    if (this.list.length > 400) this.list.shift();
    this.list.push({ x: x, y: y, vx: vx, vy: vy, life: life, age: 0, size: size, color: color });
  };
  Particles.prototype.burst = function (x, y, n, speed, color, size) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * TAU, s = speed * (0.35 + Math.random() * 0.65);
      this.emit(x, y, Math.cos(a) * s, Math.sin(a) * s, 0.5 + Math.random() * 0.5, (size || 3) * (0.5 + Math.random()), color);
    }
  };
  Particles.prototype.update = function (dt) {
    for (var i = this.list.length - 1; i >= 0; i--) {
      var p = this.list[i];
      p.age += dt;
      if (p.age >= p.life) { this.list.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 1 - 2.2 * dt; p.vy *= 1 - 2.2 * dt;
    }
  };
  Particles.prototype.draw = function (ctx, ox, oy) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.list.length; i++) {
      var p = this.list[i], k = 1 - p.age / p.life;
      ctx.fillStyle = rgba(p.color, k * 0.9);
      ctx.beginPath(); ctx.arc(p.x - (ox || 0), p.y - (oy || 0), p.size * (0.4 + 0.6 * k), 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------- the sky
  // A vertical gradient (the galaxy's colors) under the game's 3 star
  // layers, with motion streaks when the world moves and a rare slow
  // shooting star.
  var SKY_FRAG = [
    'precision highp float;',
    'uniform float uTime; uniform float uDpr; uniform vec2 uRes;',
    'uniform vec3 uTop; uniform vec3 uBottom; uniform vec2 uScroll; uniform vec2 uTrail;',
    'uniform float uFlash; uniform vec4 uShoot; uniform vec3 uShootState;',
    'const float TAU = 6.2831853;',
    'vec3 hash32(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yxz + 33.33); return fract((p3.xxy + p3.yzz) * p3.zyx); }',
    'vec3 starColor(float k) { if (k < 0.56) return vec3(1.0); if (k < 0.73) return vec3(1.0, 0.90, 0.68); if (k < 0.89) return vec3(0.62, 0.88, 1.0); return vec3(0.87, 0.72, 1.0); }',
    'vec4 starLayer(vec2 frag, float parallax, float cell, float density, float radius, float twinkle, float sparkles, float glow, float seed) {',
    '  vec2 p = frag + uScroll * parallax;',
    '  vec2 gv = p / cell; vec2 id = floor(gv); vec2 cellId = mod(id, 1024.0);',
    '  vec3 h = hash32(cellId + seed);',
    '  if (h.x > density) return vec4(0.0);',
    '  float rnd = h.x / density;',
    '  vec2 center = 0.2 + h.yz * 0.6;',
    '  vec2 d = (gv - id - center) * cell;',
    '  float r = radius * (0.55 + 0.9 * rnd * rnd);',
    '  vec2 roomLow = center * cell; vec2 roomHigh = (1.0 - center) * cell;',
    '  vec2 trail = -uTrail * parallax * 8.0; float len = length(trail); vec2 dd = d; float energy = 1.0;',
    '  if (len > 0.35) {',
    '    vec2 dir = trail / len; vec2 room = mix(roomLow, roomHigh, step(0.0, dir));',
    '    vec2 edge = room / max(abs(dir), vec2(0.001));',
    '    len = min(len, max(min(edge.x, edge.y) - r * 2.5, 0.0));',
    '    vec2 seg = dir * len; float t = clamp(dot(d, seg) / max(dot(seg, seg), 0.0001), 0.0, 1.0);',
    '    dd = d - seg * t; energy = mix(1.0, (2.0 * r + 1.0) / (2.0 * r + 1.0 + len), 0.5) * (1.0 - 0.65 * t);',
    '  }',
    '  float dist = length(dd);',
    '  float reach = r * (sparkles > 0.0 ? 12.0 : 7.0);',
    '  if (dist > reach && length(d) > reach) return vec4(0.0);',
    '  vec3 h2 = hash32(cellId.yx + seed * 1.7 + 19.19);',
    '  float tw = 0.5 + 0.5 * sin(uTime * (0.45 + 2.6 * h2.x) + h2.y * TAU);',
    '  float bright = (0.28 + 0.72 * rnd) * mix(1.0, 0.25 + 1.1 * tw * tw, twinkle);',
    '  float core = clamp((r - dist) * uDpr + 0.5, 0.0, 1.0);',
    '  float halo = glow * (1.0 + 2.0 * uFlash) * r * r / (dist * dist + r * r);',
    '  halo *= clamp(1.0 - dist / (r * 7.0), 0.0, 1.0);',
    '  float a = (core + halo) * bright * energy;',
    '  if (h2.z < sparkles && rnd > 0.35) {',
    '    float maxSize = min(min(roomLow.x, roomLow.y), min(roomHigh.x, roomHigh.y));',
    '    float size = min(r * (3.0 + 3.5 * tw) * (1.0 + 0.8 * uFlash), maxSize);',
    '    vec2 q = abs(d) / size;',
    '    if (q.x < 1.0 && q.y < 1.0) { float shape = 1.0 - (sqrt(q.x) + sqrt(q.y)); a += clamp(shape * size * uDpr * 0.45, 0.0, 1.0) * (0.35 + 0.65 * tw) * energy; }',
    '  }',
    '  vec3 color = mix(starColor(fract(h2.x * 13.7 + h2.y * 7.1)), vec3(1.0), uFlash * 0.4);',
    '  a = min(a, 1.0); return vec4(color * a, a);',
    '}',
    'vec4 shootingStar(vec2 frag) {',
    '  float progress = uShootState.x; if (progress < 0.0) return vec4(0.0);',
    '  vec2 head = uShoot.xy; vec2 dir = uShoot.zw; vec2 normal = vec2(dir.y, -dir.x);',
    '  float tail = uShootState.y; float seed = uShootState.z;',
    '  vec2 rel = frag - head; float behind = -dot(rel, dir); float side = dot(rel, normal);',
    '  if (behind < -30.0 || behind > tail + 30.0 || abs(side) > 32.0) return vec4(0.0);',
    '  float life = smoothstep(0.0, 0.1, progress) * (1.0 - smoothstep(0.6, 0.95, progress));',
    '  vec3 tint = seed < 0.5 ? vec3(1.0, 0.78, 0.46) : (seed < 0.8 ? vec3(0.56, 0.86, 1.0) : vec3(0.96, 0.62, 1.0));',
    '  vec4 c = vec4(0.0);',
    '  if (behind > 0.0 && behind < tail) {',
    '    float t = behind / tail; float sd = abs(side);',
    '    float core = clamp((mix(1.15, 0.25, t) - sd) * uDpr + 0.5, 0.0, 1.0) * pow(1.0 - t, 1.4);',
    '    float gw = mix(3.5, 1.1, t); float glow = 0.5 * exp(-sd * sd / (gw * gw)) * (1.0 - t) * (1.0 - t);',
    '    float a = (core + glow) * life; c += vec4(mix(vec3(1.0, 0.98, 0.94), tint, smoothstep(0.0, 0.55, t)) * a, a);',
    '  }',
    '  float hd = length(rel);',
    '  if (hd < 22.0) {',
    '    float pulse = 0.8 + 0.2 * sin(uTime * 13.0 + seed * TAU);',
    '    float core = clamp((1.35 - hd) * uDpr + 0.5, 0.0, 1.0);',
    '    float halo = 10.0 / (hd * hd + 10.0) * clamp(1.0 - hd / 22.0, 0.0, 1.0) * pulse;',
    '    float size = 10.0 * pulse; vec2 q = abs(rel) / size; float flare = 0.0;',
    '    if (q.x < 1.0 && q.y < 1.0) flare = clamp((1.0 - (sqrt(q.x) + sqrt(q.y))) * size * uDpr * 0.4, 0.0, 1.0);',
    '    float a = (core + flare) * life; float hh = halo * life;',
    '    c += vec4(vec3(1.0) * a + mix(vec3(1.0), tint, 0.45) * hh, a + hh);',
    '  }',
    '  return vec4(c.rgb, min(c.a, 1.0));',
    '}',
    'void main() {',
    '  vec2 frag = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;',
    '  float v = frag.y / (uRes.y / uDpr);',
    '  vec3 bg = mix(uTop, uBottom, v);',
    '  bg += uFlash * 0.08;',
    '  vec4 c = starLayer(frag, 0.03, 22.0, 0.50, 0.45, 0.35, 0.00, 0.00, 3.1);',
    '  c += starLayer(frag, 0.06, 42.0, 0.42, 0.75, 0.65, 0.05, 0.30, 11.7);',
    '  c += starLayer(frag, 0.12, 88.0, 0.40, 1.05, 0.85, 0.30, 0.50, 27.3);',
    '  c += shootingStar(frag);',
    '  gl_FragColor = vec4(bg * (1.0 - min(c.a, 1.0)) + min(c.rgb, vec3(1.0)), 1.0);',
    '}'
  ].join('\n');

  function Sky(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.top = hexRgb(opts.top || GALAXIES[0].sky[1]).map(function (v) { return v / 255; });
    this.bottom = hexRgb(opts.bottom || GALAXIES[0].sky[0]).map(function (v) { return v / 255; });
    this.targetTop = this.top.slice(); this.targetBottom = this.bottom.slice();
    this.scroll = [0, 0]; this.trail = [0, 0]; this.flash = 0;
    this.shoot = null; this.shootWait = opts.firstShoot != null ? opts.firstShoot : 6 + Math.random() * 8;
    this.shootEvery = opts.shootEvery || [14, 26];
    var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl');
    this.gl = gl;
    if (!gl) { canvas.style.background = 'linear-gradient(' + (opts.top || '#1d134d') + ',' + (opts.bottom || '#462855') + ')'; return; }
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, SKY_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.u = {};
    var self = this;
    ['uTime', 'uDpr', 'uRes', 'uTop', 'uBottom', 'uScroll', 'uTrail', 'uFlash', 'uShoot', 'uShootState'].forEach(function (n) { self.u[n] = gl.getUniformLocation(prog, n); });
  }
  Sky.prototype.setGalaxy = function (g, instant) {
    var gg = typeof g === 'number' ? GALAXIES[g] : g;
    this.setColors(gg.sky[1], gg.sky[0], instant);
  };
  Sky.prototype.setColors = function (top, bottom, instant) {
    this.targetTop = hexRgb(top).map(function (v) { return v / 255; });
    this.targetBottom = hexRgb(bottom).map(function (v) { return v / 255; });
    if (instant) { this.top = this.targetTop.slice(); this.bottom = this.targetBottom.slice(); }
  };
  Sky.prototype.render = function (time, dt) {
    var gl = this.gl, c = this.canvas;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(c.clientWidth * dpr), h = Math.round(c.clientHeight * dpr);
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    var k = 1 - Math.exp(-dt * 2.5);
    for (var i = 0; i < 3; i++) {
      this.top[i] += (this.targetTop[i] - this.top[i]) * k;
      this.bottom[i] += (this.targetBottom[i] - this.bottom[i]) * k;
    }
    this.flash = Math.max(0, this.flash - dt * 1.8);
    // A rare, slow shooting star.
    var W = c.clientWidth, H = c.clientHeight;
    if (!this.shoot) {
      this.shootWait -= dt;
      if (this.shootWait <= 0 && !reduced()) {
        var a = (Math.random() < 0.5 ? 0.3 : Math.PI - 0.3) + (Math.random() - 0.5) * 0.4;
        var dx = Math.cos(a), dy = Math.sin(a);
        this.shoot = { x: dx > 0 ? -20 + Math.random() * W * 0.4 : W * (0.6 + Math.random() * 0.4) + 20, y: Math.random() * H * 0.45, dx: dx, dy: dy, age: 0, life: 2.6, speed: Math.max(W, 500) * 0.32, seed: Math.random() };
      }
    } else {
      var s = this.shoot;
      s.age += dt; s.x += s.dx * s.speed * dt; s.y += s.dy * s.speed * dt;
      if (s.age > s.life) { this.shoot = null; this.shootWait = this.shootEvery[0] + Math.random() * (this.shootEvery[1] - this.shootEvery[0]); }
    }
    if (!gl) return;
    gl.viewport(0, 0, w, h);
    gl.uniform1f(this.u.uTime, time);
    gl.uniform1f(this.u.uDpr, dpr);
    gl.uniform2f(this.u.uRes, w, h);
    gl.uniform3fv(this.u.uTop, this.top);
    gl.uniform3fv(this.u.uBottom, this.bottom);
    gl.uniform2f(this.u.uScroll, this.scroll[0] % 22528, this.scroll[1] % 22528);
    gl.uniform2f(this.u.uTrail, this.trail[0], this.trail[1]);
    gl.uniform1f(this.u.uFlash, this.flash);
    var sh = this.shoot;
    gl.uniform4f(this.u.uShoot, sh ? sh.x : 0, sh ? sh.y : 0, sh ? sh.dx : 1, sh ? sh.dy : 0);
    gl.uniform3f(this.u.uShootState, sh ? sh.age / sh.life : -1, sh ? Math.min(220, sh.age * sh.speed) : 0, sh ? sh.seed : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  function reduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // A requestAnimationFrame loop with dt in seconds (capped), paused when
  // the tab is hidden.
  function loop(fn) {
    var last = performance.now(), t = 0;
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      fn(t, dt);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.TTG = {
    GALAXIES: GALAXIES, SPIN: SPIN, Planet: Planet, randomPlanet: randomPlanet, rng: rng, mix: mix, rgba: rgba,
    drawRocket: drawRocket, Particles: Particles, Sky: Sky, loop: loop, reduced: reduced, img: img, ready: ready,
    STORES: {
      play: 'https://play.google.com/store/apps/details?id=dev.app2pack.ttg',
      apple: 'https://apps.apple.com/app/ttg-through-the-galaxy/id6444870791'
    }
  };
})();
