import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bc5d5);
scene.fog = new THREE.Fog(0x9bc5d5, 150, 620);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.querySelector('#game').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdceeff, 0x53634c, 2.1));
const sun = new THREE.DirectionalLight(0xffe4bd, 2.8);
sun.position.set(-80, 130, 60);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const material = (color, roughness = 0.82, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });
const mats = {
  grass: material(0x668b62), road: material(0x303943), line: material(0xe7e4cf),
  pavement: material(0xb7bfbd), glass: material(0x70b9cb, 0.22, 0.3),
  dark: material(0x253746), tree: material(0x397c4b), trunk: material(0x75513a)
};
function box(parent, x, y, z, w, h, d, mat) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Ground and a connected grid of wide city roads.
box(scene, 0, -0.7, 0, 700, 1, 700, mats.grass);
for (let i = -8; i <= 8; i++) {
  const p = i * 40;
  box(scene, p, 0.02, 0, 13, 0.12, 680, mats.road);
  box(scene, 0, 0.02, p, 680, 0.12, 13, mats.road);
  box(scene, p - 7.8, 0.08, 0, 2.5, 0.16, 680, mats.pavement);
  box(scene, p + 7.8, 0.08, 0, 2.5, 0.16, 680, mats.pavement);
  box(scene, 0, 0.08, p - 7.8, 680, 0.16, 2.5, mats.pavement);
  box(scene, 0, 0.08, p + 7.8, 680, 0.16, 2.5, mats.pavement);
  for (let k = -8; k <= 8; k++) {
    box(scene, p, 0.095, k * 40, 0.22, 0.025, 5, mats.line);
    box(scene, k * 40, 0.095, p, 5, 0.025, 0.22, mats.line);
  }
}

// A varied skyline. Every building is grouped correctly at its own location.
const buildingColors = [0xdce5e8, 0xc5d5df, 0xe0c9ad, 0x9eb8c8, 0xe7e2d5, 0xb9d1d0, 0xd3c5ac, 0x9eafc1];
const buildingNames = ['MARKET', 'HOTEL', 'RESTAURANT', 'OFFICES', 'HOSPITAL', 'MALL', 'APARTMENTS', 'CAFE'];
const destinations = [];
let buildingNumber = 0;
for (let gx = -8; gx < 8; gx++) {
  for (let gz = -8; gz < 8; gz++) {
    const x = gx * 40 + 20;
    const z = gz * 40 + 20;
    const width = 15 + (buildingNumber % 4) * 1.5;
    const depth = 15 + (buildingNumber % 3) * 2;
    const height = 13 + ((buildingNumber * 7) % 34);
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    scene.add(group);
    const color = material(buildingColors[buildingNumber % buildingColors.length]);
    box(group, 0, height / 2, 0, width, height, depth, color);
    box(group, 0, height + 0.18, 0, width + 0.5, 0.35, depth + 0.5, mats.dark);
    for (let y = 2.5; y < height - 1; y += 3.1) {
      for (let wx = -width / 2 + 1.7; wx < width / 2 - 0.5; wx += 2.8) {
        box(group, wx, y, depth / 2 + 0.035, 1.5, 1.65, 0.08, mats.glass);
        box(group, wx, y, -depth / 2 - 0.035, 1.5, 1.65, 0.08, mats.glass);
      }
    }
    box(group, 0, 1.45, depth / 2 + 0.12, 3, 2.9, 0.2, mats.dark);
    const sign = document.createElement('canvas');
    sign.width = 512; sign.height = 96;
    const ctx = sign.getContext('2d');
    ctx.fillStyle = '#102b38'; ctx.fillRect(0, 0, 512, 96);
    ctx.fillStyle = '#79f4dc'; ctx.font = 'bold 38px Arial'; ctx.textAlign = 'center';
    ctx.fillText(buildingNames[buildingNumber % buildingNames.length], 256, 62);
    const texture = new THREE.CanvasTexture(sign);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.scale.set(9, 1.7, 1);
    sprite.position.set(0, height + 2, depth / 2 + 0.2);
    group.add(sprite);
    destinations.push({ name: buildingNames[buildingNumber % buildingNames.length], x, z });
    buildingNumber++;
  }
}

// Small parks and roadside trees.
for (let i = 0; i < 260; i++) {
  const x = (Math.random() - 0.5) * 620;
  const z = (Math.random() - 0.5) * 620;
  if (Math.abs(x % 40) < 10 || Math.abs(z % 40) < 10) continue;
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  scene.add(tree);
  box(tree, 0, 1.2, 0, 0.55, 2.4, 0.55, mats.trunk);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.8, 9, 8), mats.tree);
  crown.position.y = 3.1;
  crown.castShadow = true;
  tree.add(crown);
}

// Player car: original low-poly city car with wheels, windows and lights.
const car = new THREE.Group();
scene.add(car);
const carPaint = material(0x167f9c, 0.32, 0.35);
const carBody = box(car, 0, 0.85, 0, 2.25, 0.75, 4.2, carPaint);
const carCabin = box(car, 0, 1.48, -0.35, 1.8, 0.85, 2.15, material(0x1d5368, 0.28, 0.2));
const sedanParts = [carBody, carCabin];
const tireMat = material(0x171b20, 0.9);
const rimMat = material(0xc5d1d4, 0.3, 0.65);
const wheelMeshes = [];

sedanParts.push(box(car, 0, 1.52, 0.78, 1.72, 0.68, 0.08, mats.glass));
sedanParts.push(box(car, 0, 1.52, -1.47, 1.72, 0.68, 0.08, mats.glass));
sedanParts.push(box(car, -0.94, 1.5, -0.35, 0.08, 0.7, 1.8, mats.glass));
sedanParts.push(box(car, 0.94, 1.5, -0.35, 0.08, 0.7, 1.8, mats.glass));
const headlightMat = material(0xfff1bf, 0.25, 0.1);
const tailMat = material(0xe63b37, 0.3);
sedanParts.push(box(car, -0.72, 0.88, 2.12, 0.38, 0.22, 0.08, headlightMat));
sedanParts.push(box(car, 0.72, 0.88, 2.12, 0.38, 0.22, 0.08, headlightMat));
sedanParts.push(box(car, -0.72, 0.9, -2.12, 0.38, 0.22, 0.08, tailMat));
sedanParts.push(box(car, 0.72, 0.9, -2.12, 0.38, 0.22, 0.08, tailMat));
for (const x of [-1.12, 1.12]) {
  for (const z of [-1.35, 1.35]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.28, 16), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.48, z);
    wheel.castShadow = true;
    car.add(wheel);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.set(x * 1.01, 0.48, z);
    car.add(rim);
    wheelMeshes.push(wheel, rim);
  }
}

// A low, angular Italian-inspired supercar body, separate from the sedan shell.
const lamboModel = new THREE.Group();
car.add(lamboModel);
const lamboPaint = material(0xc6a800, 0.25, 0.55);
const wedgeShape = new THREE.Shape();
wedgeShape.moveTo(-1.12, 0.05);
wedgeShape.lineTo(1.12, 0.05);
wedgeShape.lineTo(0.98, 0.42);
wedgeShape.lineTo(0.58, 0.72);
wedgeShape.lineTo(-0.58, 0.72);
wedgeShape.lineTo(-0.98, 0.42);
wedgeShape.close();
const wedgeGeometry = new THREE.ExtrudeGeometry(wedgeShape, { depth: 3.9, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.06, bevelThickness: 0.06 });
wedgeGeometry.translate(0, 0, -1.95);
const wedgeBody = new THREE.Mesh(wedgeGeometry, lamboPaint);
wedgeBody.position.y = 0.52;
wedgeBody.castShadow = true;
wedgeBody.receiveShadow = true;
lamboModel.add(wedgeBody);
const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.58, 1.65), material(0x183746, 0.2, 0.35));
canopy.position.set(0, 1.13, -0.28);
canopy.castShadow = true;
lamboModel.add(canopy);
const lamboGlass = material(0x72b8c8, 0.18, 0.35);
box(lamboModel, 0, 1.16, 0.58, 1.22, 0.38, 0.06, lamboGlass);
box(lamboModel, 0, 1.16, -1.12, 1.22, 0.38, 0.06, lamboGlass);
const splitter = box(lamboModel, 0, 0.48, 2.02, 2.2, 0.1, 0.32, material(0x171c22, 0.45, 0.2));
box(lamboModel, -0.88, 0.72, 1.65, 0.22, 0.1, 0.62, headlightMat);
box(lamboModel, 0.88, 0.72, 1.65, 0.22, 0.1, 0.62, headlightMat);
box(lamboModel, 0, 0.95, -1.92, 1.9, 0.12, 0.16, tailMat);
box(lamboModel, -0.9, 0.95, -1.68, 0.12, 0.42, 0.12, material(0x171c22));
box(lamboModel, 0.9, 0.95, -1.68, 0.12, 0.42, 0.12, material(0x171c22));
lamboModel.visible = false;

car.position.set(0, 0, 0);

let money = 50000;
const moneyEl = document.querySelector('#money');
moneyEl.textContent = '$' + money.toLocaleString('en-US');
const speedEl = document.querySelector('#speed');
const toast = document.querySelector('#toast');
let toastTimer;
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

const input = { forward: false, back: false, left: false, right: false, brake: false };
let velocity = 0;
let steering = 0;
let maxSpeed = 42;
let acceleration = 25;
const vehicleOptions = [
  { name: 'SEDAN', color: 0x167f9c, scale: [1, 1, 1], max: 42, accel: 25 },
  { name: 'SUV', color: 0x3c8056, scale: [1.12, 1.12, 1.04], max: 34, accel: 20 },
  { name: 'SPORT', color: 0xc34b39, scale: [0.98, 0.88, 1.08], max: 54, accel: 31 },
  { name: 'LAMBORGHINI', color: 0xc6a800, scale: [1, 1, 1], max: 66, accel: 38, model: 'lambo' }
];
let vehicleIndex = 0;
const vehicleButton = document.querySelector('#vehicleBtn');
vehicleButton.addEventListener('click', () => {
  vehicleIndex = (vehicleIndex + 1) % vehicleOptions.length;
  const option = vehicleOptions[vehicleIndex];
  carPaint.color.setHex(option.color);
  sedanParts.forEach(part => part.visible = option.model !== 'lambo');
  lamboModel.visible = option.model === 'lambo';
  car.scale.set(...option.scale);
  maxSpeed = option.max;
  acceleration = option.accel;
  velocity = 0;
  vehicleButton.textContent = 'CAR: ' + (option.name === 'LAMBORGHINI' ? 'LAMBO' : option.name);
  notify(option.name + ' selected');
});
const clock = new THREE.Clock();

function setKey(key, down) {
  if (key === 'w' || key === 'arrowup') input.forward = down;
  if (key === 's' || key === 'arrowdown') input.back = down;
  if (key === 'a' || key === 'arrowleft') input.left = down;
  if (key === 'd' || key === 'arrowright') input.right = down;
}
addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  setKey(key, true);
  if (key.startsWith('arrow') || key === ' ') e.preventDefault();
  if (key === ' ') input.brake = true;
  if (key === 'h') notify('Beep beep!');
});
addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  setKey(key, false);
  if (key === ' ') input.brake = false;
});
document.querySelectorAll('[data-move]').forEach(button => {
  const key = button.dataset.move;
  button.addEventListener('pointerdown', e => { e.preventDefault(); input[key] = true; });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(eventName =>
    button.addEventListener(eventName, () => input[key] = false)
  );
});
document.querySelector('#brakeBtn').addEventListener('pointerdown', () => input.brake = true);
['pointerup', 'pointerleave', 'pointercancel'].forEach(eventName =>
  document.querySelector('#brakeBtn').addEventListener(eventName, () => input.brake = false)
);
document.querySelector('#hornBtn').onclick = () => notify('Beep beep! Welcome to the city.');
document.querySelector('#startBtn').onclick = () => document.querySelector('#welcome').classList.add('hidden');

const mapPanel = document.querySelector('#mapPanel');
document.querySelector('#mapBtn').onclick = () => {
  mapPanel.classList.remove('hidden');
  document.querySelector('#mapList').innerHTML = destinations.slice(0, 32).map(place =>
    '<div class="mapPlace">' + place.name + ' · ' +
    Math.round(Math.hypot(place.x - car.position.x, place.z - car.position.z)) + 'm away</div>'
  ).join('');
};
document.querySelector('#closeMap').onclick = () => mapPanel.classList.add('hidden');

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.04);
  if (input.forward) velocity += acceleration * dt;
  if (input.back) velocity -= 20 * dt;
  if (!input.forward && !input.back) velocity *= Math.pow(0.985, dt * 60);
  if (input.brake) velocity *= Math.pow(0.88, dt * 60);
  velocity = THREE.MathUtils.clamp(velocity, -13, maxSpeed);

  const steeringInput = (input.left ? 1 : 0) - (input.right ? 1 : 0);
  steering = THREE.MathUtils.lerp(steering, steeringInput, Math.min(1, dt * 5));
  if (Math.abs(velocity) > 0.3) car.rotation.y += steering * dt * 1.35 * Math.sign(velocity) * Math.min(1, Math.abs(velocity) / 8);
  const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
  car.position.addScaledVector(forward, velocity * dt);
  car.position.x = THREE.MathUtils.clamp(car.position.x, -320, 320);
  car.position.z = THREE.MathUtils.clamp(car.position.z, -320, 320);
  wheelMeshes.forEach(wheel => wheel.rotation.x += velocity * dt / 0.43);

  const follow = new THREE.Vector3(
    car.position.x - Math.sin(car.rotation.y) * 10,
    6.2,
    car.position.z - Math.cos(car.rotation.y) * 10
  );
  camera.position.lerp(follow, 1 - Math.pow(0.001, dt));
  camera.lookAt(car.position.x, car.position.y + 1, car.position.z + 1);
  speedEl.textContent = Math.round(Math.abs(velocity) * 3.6) + ' KM/H';
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
