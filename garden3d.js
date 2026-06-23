const mount = document.querySelector("#garden-canvas");
const loading = document.querySelector(".world-loading");
const stage = document.querySelector(".world-stage-3d");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0xdfe6ca, 0.025);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(13.5, 9, 16);
camera.lookAt(0, 0.8, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
mount.appendChild(renderer.domElement);

const world = new THREE.Group();
world.rotation.y = -0.38;
scene.add(world);

const palette = {
  grass: 0x789b55,
  grassLight: 0x9cbd6b,
  soil: 0x594537,
  soilDark: 0x2c332b,
  trunk: 0x684a31,
  leaf: 0x456f49,
  leafLight: 0x729a58,
  water: 0x79c8c5,
  path: 0xd8c98b,
  snow: 0xf0f0dc,
  rock: 0x647b77,
  pink: 0xf39baa,
  lime: 0xd9ff59,
};

const mat = (color, roughness = 0.85, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const hemi = new THREE.HemisphereLight(0xf6f3d9, 0x283b31, 2.4);
scene.add(hemi);

const sunLight = new THREE.DirectionalLight(0xfff2c2, 4.8);
sunLight.position.set(-8, 14, 9);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.camera.left = -12;
sunLight.shadow.camera.right = 12;
sunLight.shadow.camera.top = 12;
sunLight.shadow.camera.bottom = -12;
sunLight.shadow.bias = -0.0004;
scene.add(sunLight);

const rim = new THREE.DirectionalLight(0xbce1cf, 2.2);
rim.position.set(9, 5, -10);
scene.add(rim);

// Floating rock body
const cliffGeometry = new THREE.CylinderGeometry(6.9, 3.15, 3.4, 11, 4);
const cliffPositions = cliffGeometry.attributes.position;
for (let i = 0; i < cliffPositions.count; i += 1) {
  const y = cliffPositions.getY(i);
  const x = cliffPositions.getX(i);
  const z = cliffPositions.getZ(i);
  const wobble = 1 + Math.sin(x * 1.3 + z * 1.7) * 0.035;
  cliffPositions.setX(i, x * wobble);
  cliffPositions.setZ(i, z * wobble);
  if (y < -1.5) {
    cliffPositions.setX(i, x * 0.88);
    cliffPositions.setZ(i, z * 0.88);
  }
}
cliffGeometry.computeVertexNormals();
const cliff = shadow(new THREE.Mesh(
  cliffGeometry,
  new THREE.MeshStandardMaterial({
    color: palette.soil,
    roughness: 1,
    flatShading: true,
    vertexColors: false,
  }),
));
cliff.position.y = -1.55;
world.add(cliff);

// Darker lower stone to add geological depth
const lowerRock = shadow(new THREE.Mesh(
  new THREE.ConeGeometry(3.35, 4.3, 9),
  new THREE.MeshStandardMaterial({ color: palette.soilDark, roughness: 1, flatShading: true }),
));
lowerRock.position.y = -4.75;
lowerRock.rotation.y = 0.23;
world.add(lowerRock);

// Layer seams around the cliff
for (let i = 0; i < 3; i += 1) {
  const seam = new THREE.Mesh(
    new THREE.TorusGeometry(4.7 - i * 0.45, 0.035, 5, 11),
    mat(0xa48660, 1),
  );
  seam.scale.z = 0.82;
  seam.position.y = -1.8 - i * 0.75;
  seam.rotation.x = Math.PI / 2 + 0.08 * i;
  seam.rotation.z = 0.12 * i;
  world.add(seam);
}

// Top terrain, deliberately lumpy instead of a flat disk
const ground = shadow(new THREE.Mesh(
  new THREE.CylinderGeometry(7.1, 6.85, 0.72, 48, 2),
  mat(palette.grass, 0.96),
));
ground.position.y = 0.35;
world.add(ground);

[
  [-2.7, 0.72, -1.8, 3.4, 0.45, 2.6],
  [2.4, 0.75, 1.5, 3.8, 0.52, 2.8],
  [0.2, 0.7, -3.2, 3.2, 0.35, 2.0],
].forEach(([x, y, z, sx, sy, sz], index) => {
  const hill = shadow(new THREE.Mesh(
    new THREE.SphereGeometry(1, 28, 18),
    mat(index === 1 ? palette.grassLight : palette.grass, 1),
  ));
  hill.position.set(x, y, z);
  hill.scale.set(sx, sy, sz);
  world.add(hill);
});

// Curved path
const pathCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-4.6, 0.79, 2.7),
  new THREE.Vector3(-2.2, 0.84, 1.5),
  new THREE.Vector3(0.2, 0.86, 1.3),
  new THREE.Vector3(2.9, 0.88, 0.2),
  new THREE.Vector3(4.4, 0.85, -1.7),
]);
const path = shadow(new THREE.Mesh(
  new THREE.TubeGeometry(pathCurve, 80, 0.34, 12, false),
  mat(palette.path, 1),
));
world.add(path);

// Lake with a stone rim
const lakeRim = shadow(new THREE.Mesh(
  new THREE.CylinderGeometry(2.15, 2.15, 0.15, 48),
  mat(0xc8d6ad, 1),
));
lakeRim.scale.z = 0.68;
lakeRim.position.set(-3.25, 0.87, 0.1);
world.add(lakeRim);

const lakeMaterial = new THREE.MeshPhysicalMaterial({
  color: palette.water,
  roughness: 0.12,
  metalness: 0.05,
  transmission: 0.18,
  transparent: true,
  opacity: 0.9,
  clearcoat: 1,
});
const lake = new THREE.Mesh(new THREE.CylinderGeometry(1.98, 1.98, 0.12, 64), lakeMaterial);
lake.scale.z = 0.68;
lake.position.set(-3.25, 0.98, 0.1);
world.add(lake);

function createTree(x, z, scale = 1, autumn = false) {
  const group = new THREE.Group();
  const trunk = shadow(new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.34, 2.4, 9),
    mat(palette.trunk, 1),
  ));
  trunk.position.y = 1.65;
  group.add(trunk);

  const colors = autumn ? [0xe2a464, 0xdb7f62, 0xf0bd72] : [palette.leaf, palette.leafLight, 0x5f8c52];
  const crownData = [
    [0, 3.15, 0, 1.25],
    [-0.82, 2.9, 0.05, 0.95],
    [0.77, 2.82, 0.12, 1.05],
    [0.15, 3.1, -0.65, 0.88],
  ];
  crownData.forEach(([cx, cy, cz, size], i) => {
    const crown = shadow(new THREE.Mesh(
      new THREE.IcosahedronGeometry(size, 2),
      mat(colors[i % colors.length], 0.95),
    ));
    crown.position.set(cx, cy, cz);
    crown.scale.y = 0.88;
    group.add(crown);
  });
  group.position.set(x, 0.7, z);
  group.scale.setScalar(scale);
  world.add(group);
  return group;
}

createTree(0.55, -0.15, 1.08);
createTree(3.25, 2.0, 0.63);
createTree(4.35, 1.25, 0.48);
createTree(-0.3, 3.4, 0.5, true);
createTree(-1.35, 3.1, 0.42, true);

// Greenhouse with visible volume
const greenhouse = new THREE.Group();
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xbfe4cf,
  transparent: true,
  opacity: 0.38,
  roughness: 0.12,
  transmission: 0.45,
  side: THREE.DoubleSide,
});
const houseBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.45, 1.75), glassMaterial);
houseBody.position.y = 1.45;
greenhouse.add(houseBody);
const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 1.78, 3), glassMaterial);
roof.rotation.z = Math.PI / 2;
roof.rotation.y = Math.PI / 2;
roof.position.y = 2.3;
greenhouse.add(roof);
const frameMaterial = mat(0x416654, 0.75);
const edges = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(2.38, 1.48, 1.78)),
  new THREE.LineBasicMaterial({ color: 0x416654, transparent: true, opacity: 0.8 }),
);
edges.position.y = 1.45;
greenhouse.add(edges);
const door = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.2, 0.06), frameMaterial);
door.position.set(0, 1.31, 0.91);
greenhouse.add(door);
greenhouse.position.set(3.55, 0.55, -1.65);
greenhouse.rotation.y = -0.22;
world.add(greenhouse);

function createMountain(x, z, height, radius, color = palette.rock) {
  const group = new THREE.Group();
  const mountain = shadow(new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 7),
    new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }),
  ));
  mountain.position.y = height / 2;
  group.add(mountain);
  const cap = new THREE.Mesh(
    new THREE.ConeGeometry(radius * 0.43, height * 0.36, 7),
    new THREE.MeshStandardMaterial({ color: palette.snow, roughness: 0.9, flatShading: true }),
  );
  cap.position.y = height * 0.82;
  group.add(cap);
  group.position.set(x, 0.65, z);
  world.add(group);
}

createMountain(4.75, -3.05, 3.55, 1.45);
createMountain(2.95, -3.9, 2.6, 1.05, 0x718983);

function createFlower(x, z, color = palette.pink, scale = 1) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.035, 0.55, 6),
    mat(0x3e7548, 1),
  );
  stem.position.y = 0.28;
  group.add(stem);
  for (let i = 0; i < 5; i += 1) {
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 9, 7),
      mat(color, 0.75),
    );
    const a = (i / 5) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.14, 0.62, Math.sin(a) * 0.14);
    petal.scale.set(1.3, 0.55, 0.85);
    group.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat(0xf8d86d, 0.8));
  center.position.y = 0.64;
  group.add(center);
  group.position.set(x, 0.72, z);
  group.scale.setScalar(scale);
  world.add(group);
  return group;
}

const flowerPatches = [
  [-4.5, -1.8], [-4.1, -2.1], [-3.75, -1.65], [-4.75, -2.4],
  [1.85, 2.85], [2.25, 3.15], [2.62, 2.7], [1.45, 3.4],
  [-1.7, -3.85], [-1.25, -3.6], [-2.15, -3.35],
];
flowerPatches.forEach(([x, z], i) => createFlower(x, z, i % 3 === 0 ? 0xf5c85f : palette.pink, 0.8));

// Benches and tiny life details
const bench = new THREE.Group();
const benchMat = mat(0x805b3e, 1);
for (const y of [0.55, 0.85]) {
  const plank = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.18), benchMat));
  plank.position.y = y;
  bench.add(plank);
}
for (const x of [-0.48, 0.48]) {
  const leg = shadow(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), benchMat));
  leg.position.set(x, 0.28, 0);
  bench.add(leg);
}
bench.position.set(-1.15, 0.68, 1.75);
bench.rotation.y = 0.4;
world.add(bench);

// Fireflies / floating seeds
const seedCount = 75;
const seedPositions = new Float32Array(seedCount * 3);
for (let i = 0; i < seedCount; i += 1) {
  seedPositions[i * 3] = (Math.random() - 0.5) * 14;
  seedPositions[i * 3 + 1] = 1.2 + Math.random() * 5.5;
  seedPositions[i * 3 + 2] = (Math.random() - 0.5) * 11;
}
const seedGeo = new THREE.BufferGeometry();
seedGeo.setAttribute("position", new THREE.BufferAttribute(seedPositions, 3));
const seeds = new THREE.Points(
  seedGeo,
  new THREE.PointsMaterial({
    color: palette.lime,
    size: 0.055,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  }),
);
world.add(seeds);

// Clouds behind the island
function cloud(x, y, z, scale) {
  const group = new THREE.Group();
  [[0, 0, 0, 1], [0.8, 0.05, 0, .75], [-.7, -.02, .05, .65]].forEach(([px, py, pz, s]) => {
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(1, 18, 12),
      new THREE.MeshStandardMaterial({ color: 0xf2f2db, transparent: true, opacity: .38, roughness: 1 }),
    );
    puff.position.set(px, py, pz);
    puff.scale.set(1.4 * s, .6 * s, .65 * s);
    group.add(puff);
  });
  group.position.set(x, y, z);
  group.scale.setScalar(scale);
  scene.add(group);
  return group;
}
const clouds = [cloud(-7, 5.2, -6, 1.4), cloud(8, 3.4, -8, 1), cloud(4, 7, -12, 1.6)];

let targetRotationY = world.rotation.y;
let targetRotationX = -0.03;
let dragging = false;
let previous = { x: 0, y: 0 };
let cameraDistance = 1;
let userActiveUntil = 0;

stage.addEventListener("pointerdown", (event) => {
  dragging = true;
  previous = { x: event.clientX, y: event.clientY };
  stage.setPointerCapture(event.pointerId);
  userActiveUntil = performance.now() + 5000;
});

stage.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  targetRotationY += (event.clientX - previous.x) * 0.008;
  targetRotationX += (event.clientY - previous.y) * 0.004;
  targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.22, 0.28);
  previous = { x: event.clientX, y: event.clientY };
  userActiveUntil = performance.now() + 5000;
});

stage.addEventListener("pointerup", (event) => {
  dragging = false;
  stage.releasePointerCapture(event.pointerId);
});

stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  cameraDistance = THREE.MathUtils.clamp(cameraDistance + event.deltaY * 0.0006, 0.76, 1.25);
  userActiveUntil = performance.now() + 5000;
}, { passive: false });

window.addEventListener("garden:grow", () => {
  for (let i = 0; i < 8; i += 1) {
    const flower = createFlower(
      0.2 + (Math.random() - 0.5) * 1.3,
      -2.7 + (Math.random() - 0.5) * 0.8,
      i % 2 ? 0xf7edf2 : 0xbccde8,
      0.001,
    );
    flower.userData.birth = performance.now() + i * 110;
    flower.userData.targetScale = 0.85 + Math.random() * 0.45;
  }
  targetRotationY = 0.15;
  userActiveUntil = performance.now() + 6000;
});

function resize() {
  const width = mount.clientWidth;
  const height = mount.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();
function animate(now) {
  const elapsed = clock.getElapsedTime();
  if (!dragging && now > userActiveUntil) targetRotationY += 0.00065;
  world.rotation.y += (targetRotationY - world.rotation.y) * 0.055;
  world.rotation.x += (targetRotationX - world.rotation.x) * 0.05;
  world.position.y = Math.sin(elapsed * 0.62) * 0.11;
  seeds.rotation.y = elapsed * 0.018;
  seeds.position.y = Math.sin(elapsed * 0.7) * 0.08;
  lake.material.roughness = 0.12 + Math.sin(elapsed * 1.4) * 0.035;

  clouds[0].position.x += 0.0015;
  clouds[1].position.x -= 0.001;
  clouds[2].position.x += 0.0008;

  world.traverse((child) => {
    if (!child.userData.birth) return;
    const progress = THREE.MathUtils.clamp((now - child.userData.birth) / 900, 0.001, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    child.scale.setScalar(eased * child.userData.targetScale);
    if (progress === 1) delete child.userData.birth;
  });

  camera.position.set(13.5 * cameraDistance, 9 * cameraDistance, 16 * cameraDistance);
  camera.lookAt(0, 0.25, 0);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

setTimeout(() => loading.classList.add("ready"), 550);
