// OPSM ルーレット（Three.js）
import * as THREE from 'three';
import { RoomEnvironment } from './lib/RoomEnvironment.js';

const SECTIONS = window.SECTIONS;
const N = SECTIONS.length;
const STEP = Math.PI * 2 / N;
const canvas = document.getElementById('wheel');
const stage = document.getElementById('stage');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#07070b');
scene.fog = new THREE.Fog('#07070b', 6, 13);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
camera.position.set(0, 3.7, 3.05);
camera.lookAt(0, -0.05, 0.12);

/* 光 */
scene.add(new THREE.HemisphereLight('#ffe8c8', '#1a0c08', 0.35));
const spot = new THREE.SpotLight('#ffe2b0', 60, 12, 0.55, 0.55, 1.6);
spot.position.set(0.6, 5.2, 1.2);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.bias = -0.0004;
scene.add(spot, spot.target);
const rim = new THREE.PointLight('#ff3048', 6, 6, 1.5); rim.position.set(-2.2, 0.8, -1.2); scene.add(rim);
const rim2 = new THREE.PointLight('#30c0ff', 3, 6, 1.5); rim2.position.set(2.4, 0.6, -1.6); scene.add(rim2);

/* テーブル（フェルト） */
const felt = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: '#0d3a27', roughness: 0.95 }));
felt.rotation.x = -Math.PI / 2; felt.position.y = -0.12; felt.receiveShadow = true; scene.add(felt);

/* 外側のボウル */
const gold = new THREE.MeshStandardMaterial({ color: '#e8b64a', metalness: 1, roughness: 0.22 });
const wood = new THREE.MeshStandardMaterial({ color: '#4a2412', roughness: 0.45, metalness: 0.05 });
const track = new THREE.MeshStandardMaterial({ color: '#2b160c', roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide });
const bowlPts = [[1.0, 0.0], [1.04, 0.07], [1.1, 0.11], [1.2, 0.13], [1.24, 0.17], [1.27, 0.2], [1.36, 0.19], [1.42, 0.1], [1.44, -0.12]].map(([r, y]) => new THREE.Vector2(r, y));
const bowl = new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 128), track);
bowl.receiveShadow = true; bowl.castShadow = true; scene.add(bowl);
const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.31, 0.035, 16, 160), wood);
rimRing.rotation.x = Math.PI / 2; rimRing.position.y = 0.2; scene.add(rimRing);
const goldRing = new THREE.Mesh(new THREE.TorusGeometry(1.245, 0.012, 10, 160), gold);
goldRing.rotation.x = Math.PI / 2; goldRing.position.y = 0.17; scene.add(goldRing);
// ディフレクター（ひし形）
for (let i = 0; i < 8; i++){
  const a = i / 8 * Math.PI * 2 + 0.2;
  const d = new THREE.Mesh(new THREE.OctahedronGeometry(0.035), gold);
  d.scale.set(1, 0.5, 1.8); d.position.set(Math.cos(a) * 1.07, 0.1, -Math.sin(a) * 1.07); d.rotation.y = a;
  d.castShadow = true; scene.add(d);
}

/* 回転盤（ローター） */
const rotor = new THREE.Group(); scene.add(rotor);
function hexA(h, a){ const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function makeDiscTexture(){
  const S = 2048, c = S / 2, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const P = (r, a) => [c + r * c * Math.cos(a), c - r * c * Math.sin(a)];
  const sector = (r0, r1, a0, a1, fill) => { g.beginPath(); g.arc(c, c, r1 * c, -a0, -a1, true); g.arc(c, c, r0 * c, -a1, -a0, false); g.closePath(); g.fillStyle = fill; g.fill(); };
  g.fillStyle = '#1a0d06'; g.fillRect(0, 0, S, S);
  SECTIONS.forEach((s, i) => {
    const a0 = i * STEP - STEP / 2, a1 = a0 + STEP;
    const base = i % 2 ? '#141418' : '#c8202f';
    sector(0.79, 0.985, a0, a1, base);                 // ラベルの帯
    sector(0.5, 0.79, a0, a1, i % 2 ? '#0c0c0f' : '#8f1420'); // ポケット
    // ポケットの内側の陰
    const gr = g.createRadialGradient(c, c, 0.5 * c, c, c, 0.79 * c); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(0.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)');
    sector(0.5, 0.79, a0, a1, gr);
    // ラベル
    const a = i * STEP, [x, y] = P(0.885, a);
    g.save(); g.translate(x, y); g.rotate(Math.PI / 2 - a);
    let fs = 70; g.font = `900 ${fs}px "Zen Kaku Gothic New", "Hiragino Sans", sans-serif`;
    const w = g.measureText(s.t).width, maxW = 0.48 * c; if (w > maxW){ fs = fs * maxW / w; g.font = `900 ${fs}px "Zen Kaku Gothic New", "Hiragino Sans", sans-serif`; }
    g.fillStyle = '#fff6e0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(s.t, 0, -14);
    g.font = '700 26px "Oswald", sans-serif'; g.fillStyle = hexA('#f2c14e', 0.95);
    g.fillText(s.en.split('').join(String.fromCharCode(8202)), 0, 46);
    g.restore();
    // ポケット番号
    const [nx, ny] = P(0.645, a);
    g.save(); g.translate(nx, ny); g.rotate(Math.PI / 2 - a);
    g.font = '700 64px "Oswald", sans-serif'; g.fillStyle = 'rgba(242,193,78,.85)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(i + 1).padStart(2, '0'), 0, 0); g.restore();
  });
  // 金の区切り線
  g.strokeStyle = '#e8b64a'; g.lineWidth = 7;
  for (let i = 0; i < N; i++){ const a = i * STEP - STEP / 2; const [x0, y0] = P(0.5, a), [x1, y1] = P(0.985, a); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  [0.5, 0.79, 0.985].forEach(r => { g.beginPath(); g.arc(c, c, r * c, 0, Math.PI * 2); g.lineWidth = r === 0.79 ? 9 : 7; g.stroke(); });
  // 中央（木）
  const cg = g.createRadialGradient(c, c, 0, c, c, 0.5 * c); cg.addColorStop(0, '#7a4425'); cg.addColorStop(1, '#3d1d0d');
  g.beginPath(); g.arc(c, c, 0.495 * c, 0, Math.PI * 2); g.fillStyle = cg; g.fill();
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return tex;
}
const discMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.08 });
const disc = new THREE.Mesh(new THREE.CircleGeometry(1.0, 128), discMat);
disc.rotation.x = -Math.PI / 2; disc.position.y = 0.0; disc.receiveShadow = true;
rotor.add(disc);
function refreshTexture(){ if (discMat.map) discMat.map.dispose(); discMat.map = makeDiscTexture(); discMat.needsUpdate = true; }
refreshTexture();
if (document.fonts) document.fonts.ready.then(refreshTexture);

// ポケットの仕切り（金）
for (let i = 0; i < N; i++){
  const a = i * STEP - STEP / 2;
  const f = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.05, 0.014), gold);
  f.position.set(Math.cos(a) * 0.645, 0.025, -Math.sin(a) * 0.645); f.rotation.y = a; f.castShadow = true;
  rotor.add(f);
}
const lip = new THREE.Mesh(new THREE.TorusGeometry(0.79, 0.012, 8, 160), gold); lip.rotation.x = Math.PI / 2; lip.position.y = 0.02; rotor.add(lip);
const lip2 = new THREE.Mesh(new THREE.TorusGeometry(0.995, 0.016, 8, 160), gold); lip2.rotation.x = Math.PI / 2; lip2.position.y = 0.012; rotor.add(lip2);
// 中央のコーンとタレット
const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.49, 0.16, 96, 1, true), wood);
cone.position.y = 0.08; cone.castShadow = true; cone.receiveShadow = true; rotor.add(cone);
const cap = new THREE.Mesh(new THREE.CircleGeometry(0.1, 48), wood); cap.rotation.x = -Math.PI / 2; cap.position.y = 0.16; rotor.add(cap);
const turret = new THREE.Group(); rotor.add(turret);
const post = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.06, 0.26, 32), gold); post.position.y = 0.28; turret.add(post);
const knob = new THREE.Mesh(new THREE.SphereGeometry(0.045, 32, 16), gold); knob.position.y = 0.43; turret.add(knob);
for (let i = 0; i < 4; i++){
  const a = i * Math.PI / 2;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.24, 12), gold);
  arm.rotation.z = Math.PI / 2; arm.position.set(Math.cos(a) * 0.12, 0.33, -Math.sin(a) * 0.12); arm.rotation.y = a; turret.add(arm);
  const end = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 12), gold); end.position.set(Math.cos(a) * 0.24, 0.33, -Math.sin(a) * 0.24); turret.add(end);
}
turret.traverse(o => { if (o.isMesh) o.castShadow = true; });

// 選ばれたポケットを光らせる
const hiMat = new THREE.MeshBasicMaterial({ color: '#ffd76a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const hi = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.985, 32, 1, -STEP / 2, STEP), hiMat);
hi.rotation.x = -Math.PI / 2; hi.position.y = 0.006; rotor.add(hi);
const hoverMat = hiMat.clone(); hoverMat.color.set('#ffffff');
const hover = new THREE.Mesh(hi.geometry, hoverMat); hover.rotation.x = -Math.PI / 2; hover.position.y = 0.005; rotor.add(hover);

/* ボール */
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.036, 32, 16), new THREE.MeshStandardMaterial({ color: '#fbfbf6', roughness: 0.12, metalness: 0.1 }));
ball.castShadow = true; scene.add(ball);
const TRACK_R = 1.17, POCKET_R = 0.665;
function trackY(r){ // ボウルの面の高さ（ボールの中心）
  if (r >= 1.1) return 0.11 + (r - 1.1) / 0.1 * 0.02 + 0.036;
  if (r >= 1.0) return (r - 1.0) / 0.1 * 0.11 + 0.036;
  return 0.02;
}
function placeBall(A, r, lift = 0){ ball.position.set(Math.cos(A) * r, (r > 0.99 ? trackY(r) : 0.045) + lift, -Math.sin(A) * r); }

/* 状態 */
let rotA = 0, rotV = 0.25;            // 盤の角度・速度（rad/s）
let ballA = Math.PI * 0.6, ballR = TRACK_R;
let mode = 'idle', spin = null, landed = -1, lastT = performance.now(), running = true, hoverI = -1;
const ease = t => 1 - Math.pow(1 - t, 3);

function spinTo(target){
  if (mode === 'spin') return Promise.resolve(-1);
  const idx = target == null ? Math.floor(Math.random() * N) : target;
  landed = -1; hiMat.opacity = 0;
  const T = 5.2, R0 = rotA, RV = 3.2;
  // 盤：減速しながら回る。rotA(t) = R0 + RV*(t - t^2/(2T)) + 0.25*t
  const rotAt = t => R0 + RV * (t - t * t / (2 * T)) + 0.25 * t;
  const finalRot = rotAt(T);
  const want = finalRot + idx * STEP;       // ボールが最後にいるべき世界角
  const B0 = ballA;
  let turns = -(Math.PI * 2) * 5;           // 逆回りに約5周
  let delta = want - (B0 + turns);
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI * 2; // 逆回りのまま合わせる
  const total = turns + delta;
  spin = { t0: performance.now() / 1000, T, rotAt, B0, total, idx };
  mode = 'spin';
  stage.classList.add('spinning');
  return new Promise(res => { spin.res = res; });
}

function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (!running) return;
  if (mode === 'spin'){
    const t = Math.min(spin.T, now / 1000 - spin.t0), u = t / spin.T;
    rotA = spin.rotAt(t);
    ballA = spin.B0 + spin.total * ease(u);
    // 外周を回って、後半で内側に落ちる。最後は少し跳ねる
    let lift = 0;
    if (u < 0.55) ballR = TRACK_R;
    else if (u < 0.75){ const k = (u - 0.55) / 0.2; ballR = TRACK_R + (POCKET_R - TRACK_R) * (k * k); lift = Math.sin(k * Math.PI) * 0.05; }
    else { ballR = POCKET_R; const k = (u - 0.75) / 0.25; lift = Math.abs(Math.sin(k * Math.PI * 3)) * 0.06 * (1 - k); }
    placeBall(ballA, ballR, lift);
    if (t >= spin.T){
      mode = 'landed'; landed = spin.idx; stage.classList.remove('spinning');
      spin.res(spin.idx);
    }
  } else {
    rotA += 0.25 * dt;
    if (mode === 'landed'){ ballA = rotA + landed * STEP; placeBall(ballA, POCKET_R); hiMat.opacity = 0.28 + Math.sin(now / 180) * 0.14; }
    else { ballA -= 1.1 * dt; placeBall(ballA, TRACK_R); }
  }
  rotor.rotation.y = rotA;
  hoverMat.opacity += ((hoverI >= 0 && mode !== 'spin' ? 0.16 : 0) - hoverMat.opacity) * 0.2;
  if (hoverI >= 0) hover.rotation.z = hoverI * STEP;
  hi.rotation.z = (landed >= 0 ? landed : 0) * STEP;
  renderer.render(scene, camera);
}

/* サイズ：PCは盤を右寄せ、スマホは上寄せ */
function resize(){
  const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const wide = w / h > 1.15;
  const k = wide ? 1 : Math.max(1, 1.08 / camera.aspect);
  camera.fov = 2 * Math.atan(Math.tan(17 * Math.PI / 180) * k) * 180 / Math.PI;
  if (wide) camera.setViewOffset(w, h, -w * 0.19, h * 0.03, w, h);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(canvas); resize();

/* マウス：コーナーにのせると光る、クリックでそのページへ */
const ray = new THREE.Raycaster(), mp = new THREE.Vector2();
function pickIndex(ev){
  const r = canvas.getBoundingClientRect();
  mp.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(mp, camera);
  const hit = ray.intersectObject(disc)[0]; if (!hit) return -1;
  const p = hit.point, rr = Math.hypot(p.x, p.z); if (rr < 0.5) return -1;
  let a = Math.atan2(-p.z, p.x) - rotA; a = ((a % (Math.PI * 2)) + Math.PI * 2 + STEP / 2) % (Math.PI * 2);
  return Math.floor(a / STEP) % N;
}
canvas.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; hoverI = mode === 'spin' ? -1 : pickIndex(ev); canvas.style.cursor = hoverI >= 0 ? 'pointer' : ''; window.dispatchEvent(new CustomEvent('wheel-hover', { detail: hoverI })); });
canvas.addEventListener('pointerleave', () => { hoverI = -1; window.dispatchEvent(new CustomEvent('wheel-hover', { detail: -1 })); });
canvas.addEventListener('click', ev => { if (mode === 'spin') return; const i = pickIndex(ev); if (i >= 0) window.dispatchEvent(new CustomEvent('wheel-pick', { detail: i })); });

window.OPSMWheel = { spin: spinTo, pause(){ running = false; }, resume(){ running = true; lastT = performance.now(); resize(); } };
window.dispatchEvent(new Event('wheel-ready'));
requestAnimationFrame(frame);
