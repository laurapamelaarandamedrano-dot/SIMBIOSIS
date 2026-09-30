// Escena 3D del hero: una red de nodos luminosos que se organiza lentamente
// en la silueta de columnas clasicas, con paralaje suave al mover el mouse
// o hacer scroll. Se detiene fuera de pantalla, con la pestana oculta, o si
// el usuario prefiere movimiento reducido / no hay WebGL disponible.

type ThreeModule = typeof import('three');

function showFallback(canvas: HTMLCanvasElement | null, fallback: HTMLElement | null): void {
  if (canvas) canvas.style.display = 'none';
  if (fallback) fallback.style.display = 'block';
}

function hasWebGL(testCanvas: HTMLCanvasElement): boolean {
  try {
    const ctx = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    return Boolean(ctx);
  } catch {
    return false;
  }
}

async function init(): Promise<void> {
  const heroSection = document.querySelector<HTMLElement>('[data-hero3d]');
  const canvas = heroSection?.querySelector<HTMLCanvasElement>('.hero3d__canvas') ?? null;
  const fallback = heroSection?.querySelector<HTMLElement>('.hero3d__fallback') ?? null;

  if (!heroSection || !canvas) return;
  if (heroSection.dataset.hero3dReady === 'true') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // En pantallas angostas (moviles) se evita cargar three.js: el costo de
  // compilar shaders de WebGL es desproporcionado en CPUs limitadas, y la
  // silueta estatica en SVG transmite la misma idea sin ese costo.
  const isNarrowViewport = window.matchMedia('(max-width: 46rem)').matches;

  if (reducedMotion || isNarrowViewport || !hasWebGL(canvas)) {
    showFallback(canvas, fallback);
    return;
  }

  heroSection.dataset.hero3dReady = 'true';

  // Se difiere la carga de three.js y la inicializacion del renderer (trabajo
  // pesado de compilacion de shaders) hasta que el hilo principal esta libre,
  // para no bloquear la pintura inicial de la pagina.
  const schedule =
    'requestIdleCallback' in window
      ? (cb: () => void) => requestIdleCallback(cb, { timeout: 1500 })
      : (cb: () => void) => setTimeout(cb, 200);

  schedule(() => {
    import('three').then((THREE) => {
      if (heroSection.isConnected) {
        runScene(THREE, heroSection, canvas);
      }
    });
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function buildTargets(): { positions: Float32Array; colors: Float32Array; count: number } {
  const points: { x: number; y: number; z: number; c: number }[] = [];
  const columnXs = [-4, -2.4, -0.8, 0.8, 2.4, 4];

  // Columnas
  for (const cx of columnXs) {
    const steps = 7;
    for (let i = 0; i < steps; i++) {
      const y = -1.8 + (i / (steps - 1)) * 4.2;
      points.push({
        x: cx + (Math.random() - 0.5) * 0.18,
        y,
        z: (Math.random() - 0.5) * 0.6,
        c: 0.25 + i / steps / 2,
      });
    }
  }

  // Base (estilobato)
  const baseSteps = 10;
  for (let i = 0; i < baseSteps; i++) {
    const x = -4.6 + (i / (baseSteps - 1)) * 9.2;
    points.push({ x, y: -2.05, z: (Math.random() - 0.5) * 0.5, c: 0.1 });
  }

  // Arquitrabe (linea sobre columnas)
  const archSteps = 10;
  for (let i = 0; i < archSteps; i++) {
    const x = -4.6 + (i / (archSteps - 1)) * 9.2;
    points.push({ x, y: 2.5, z: (Math.random() - 0.5) * 0.5, c: 0.55 });
  }

  // Fronton triangular
  const slopeSteps = 6;
  for (let i = 0; i < slopeSteps; i++) {
    const t = i / (slopeSteps - 1);
    points.push({ x: -4.6 + t * 4.6, y: 2.5 + t * 0.9, z: (Math.random() - 0.5) * 0.4, c: 0.75 });
    points.push({ x: 4.6 - t * 4.6, y: 2.5 + t * 0.9, z: (Math.random() - 0.5) * 0.4, c: 0.75 });
  }

  // Nodos ambientales alrededor de la estructura
  const ambientCount = 42;
  for (let i = 0; i < ambientCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 4.5 + Math.random() * 3.2;
    points.push({
      x: Math.cos(angle) * radius * 0.9,
      y: Math.sin(angle) * radius * 0.55,
      z: (Math.random() - 0.5) * 3.5,
      c: Math.random(),
    });
  }

  const count = points.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const cDeep = { r: 0x0f / 255, g: 0x3b / 255, b: 0x6e / 255 };
  const cSky = { r: 0x3d / 255, g: 0x8f / 255, b: 0xd6 / 255 };
  const cTurq = { r: 0x14 / 255, g: 0xb8 / 255, b: 0xa6 / 255 };
  const cAmber = { r: 0xf5 / 255, g: 0xa5 / 255, b: 0x24 / 255 };

  points.forEach((p, i) => {
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;

    let r: number, g: number, b: number;
    if (p.c < 0.33) {
      const t = p.c / 0.33;
      r = cDeep.r + (cSky.r - cDeep.r) * t;
      g = cDeep.g + (cSky.g - cDeep.g) * t;
      b = cDeep.b + (cSky.b - cDeep.b) * t;
    } else if (p.c < 0.66) {
      const t = (p.c - 0.33) / 0.33;
      r = cSky.r + (cTurq.r - cSky.r) * t;
      g = cSky.g + (cTurq.g - cSky.g) * t;
      b = cSky.b + (cTurq.b - cSky.b) * t;
    } else {
      const t = (p.c - 0.66) / 0.34;
      r = cTurq.r + (cAmber.r - cTurq.r) * t * 0.5;
      g = cTurq.g + (cAmber.g - cTurq.g) * t * 0.5;
      b = cTurq.b + (cAmber.b - cTurq.b) * t * 0.5;
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  });

  return { positions, colors, count };
}

function buildEdges(positions: Float32Array, count: number, maxDist: number, maxPerNode: number): Uint16Array {
  const edges: number[] = [];
  const degree = new Array<number>(count).fill(0);

  for (let i = 0; i < count; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const dx = positions[i * 3] - positions[j * 3];
      const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
      const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < maxDist) dists.push({ j, d });
    }
    dists.sort((a, b) => a.d - b.d);
    let added = 0;
    for (const { j } of dists) {
      if (added >= maxPerNode || degree[i] >= maxPerNode) break;
      if (degree[j] >= maxPerNode + 2) continue;
      const key = i < j ? i * 100000 + j : j * 100000 + i;
      if (edges.includes(key)) continue;
      edges.push(key);
      degree[i]++;
      degree[j]++;
      added++;
    }
  }

  const indexPairs = new Uint16Array(edges.length * 2);
  edges.forEach((key, idx) => {
    const a = Math.floor(key / 100000);
    const b = key % 100000;
    indexPairs[idx * 2] = a;
    indexPairs[idx * 2 + 1] = b;
  });

  return indexPairs;
}

function makeGlowSprite(THREE: ThreeModule): InstanceType<ThreeModule['CanvasTexture']> {
  const size = 64;
  const canvasEl = document.createElement('canvas');
  canvasEl.width = size;
  canvasEl.height = size;
  const ctx = canvasEl.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvasEl);
  return texture;
}

function runScene(THREE: ThreeModule, section: HTMLElement, canvasEl: HTMLCanvasElement): void {
  const { positions: targetPositions, colors, count } = buildTargets();
  const edgeIndex = buildEdges(targetPositions, count, 1.9, 3);

  const startPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 6 + Math.random() * 5;
    startPositions[i * 3] = Math.cos(angle) * radius;
    startPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    startPositions[i * 3 + 2] = Math.sin(angle) * radius - 2;
  }

  const currentPositions = new Float32Array(startPositions);

  const pointsGeometry = new THREE.BufferGeometry();
  pointsGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
  pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const sprite = makeGlowSprite(THREE);
  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.16,
    map: sprite,
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);

  const linePositions = new Float32Array(edgeIndex.length * 3);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(0x3d8fd6),
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
  });
  const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);

  const group = new THREE.Group();
  group.add(lineSegments);
  group.add(pointCloud);

  const scene = new THREE.Scene();
  scene.add(group);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  function resize(): void {
    const rect = section.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  resize();

  let resizeObserver: ResizeObserver | null = null;
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);
  } else {
    window.addEventListener('resize', resize);
  }

  let pointerX = 0;
  let pointerY = 0;
  let targetRotX = 0;
  let targetRotY = 0;

  function onPointerMove(event: PointerEvent): void {
    const rect = section.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointerY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    targetRotY = pointerX * 0.18;
    targetRotX = pointerY * -0.1;
  }
  section.addEventListener('pointermove', onPointerMove);

  let scrollFactor = 0;
  function onScroll(): void {
    const rect = section.getBoundingClientRect();
    const viewportH = window.innerHeight || 1;
    scrollFactor = Math.max(-1, Math.min(1, 1 - rect.top / viewportH));
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  let paused = false;
  let rafId = 0;
  const startTime = performance.now();
  const assembleDuration = 5200;

  function frame(now: number): void {
    rafId = requestAnimationFrame(frame);
    if (paused) return;

    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / assembleDuration);
    const eased = easeOutCubic(t);
    const idle = elapsed / 1000;

    const posAttr = pointsGeometry.getAttribute('position') as InstanceType<ThreeModule['BufferAttribute']>;
    for (let i = 0; i < count; i++) {
      const bx = startPositions[i * 3] + (targetPositions[i * 3] - startPositions[i * 3]) * eased;
      const by = startPositions[i * 3 + 1] + (targetPositions[i * 3 + 1] - startPositions[i * 3 + 1]) * eased;
      const bz = startPositions[i * 3 + 2] + (targetPositions[i * 3 + 2] - startPositions[i * 3 + 2]) * eased;
      const wobble = t >= 1 ? Math.sin(idle * 0.6 + i) * 0.035 : 0;
      currentPositions[i * 3] = bx;
      currentPositions[i * 3 + 1] = by + wobble;
      currentPositions[i * 3 + 2] = bz;
    }
    posAttr.needsUpdate = true;

    const linePosAttr = lineGeometry.getAttribute('position') as InstanceType<ThreeModule['BufferAttribute']>;
    for (let e = 0; e < edgeIndex.length / 2; e++) {
      const a = edgeIndex[e * 2];
      const b = edgeIndex[e * 2 + 1];
      linePosAttr.array[e * 6] = currentPositions[a * 3];
      linePosAttr.array[e * 6 + 1] = currentPositions[a * 3 + 1];
      linePosAttr.array[e * 6 + 2] = currentPositions[a * 3 + 2];
      linePosAttr.array[e * 6 + 3] = currentPositions[b * 3];
      linePosAttr.array[e * 6 + 4] = currentPositions[b * 3 + 1];
      linePosAttr.array[e * 6 + 5] = currentPositions[b * 3 + 2];
    }
    linePosAttr.needsUpdate = true;

    group.rotation.x += (targetRotX - group.rotation.x) * 0.04;
    group.rotation.y += (targetRotY + 0.05 - group.rotation.y) * 0.04;
    group.position.y += (scrollFactor * -0.6 - group.position.y) * 0.05;

    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(frame);

  function onVisibility(): void {
    paused = document.hidden;
  }
  document.addEventListener('visibilitychange', onVisibility);

  let intersectionObserver: IntersectionObserver | null = null;
  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          paused = !entry.isIntersecting || document.hidden;
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(section);
  }

  function cleanup(): void {
    cancelAnimationFrame(rafId);
    delete section.dataset.hero3dReady;
    document.removeEventListener('visibilitychange', onVisibility);
    section.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', resize);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    pointsGeometry.dispose();
    lineGeometry.dispose();
    pointsMaterial.dispose();
    lineMaterial.dispose();
    sprite.dispose();
    renderer.dispose();
    document.removeEventListener('astro:before-swap', cleanup);
  }
  document.addEventListener('astro:before-swap', cleanup, { once: true });
}

document.addEventListener('astro:page-load', init);
