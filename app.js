// 1. Initialisation de la scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 60, 110);

// 2. Contrôles (OrbitControls + Gyroscope)
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

function enableGyro() {
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') {
          activateGyroControls();
        }
      })
      .catch(console.error);
  } else {
    activateGyroControls();
  }
}

function activateGyroControls() {
  if (controls) controls.dispose();
  controls = new THREE.DeviceOrientationControls(camera);
  const btn = document.getElementById('btn-gyro');
  if (btn) btn.style.display = 'none';
}

const gyroBtn = document.getElementById('btn-gyro');
if (gyroBtn) {
  gyroBtn.addEventListener('click', enableGyro);
}

// 3. Éclairage
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
scene.add(sunLight);

// 4. Soleil
const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

// 5. Configuration des Planètes
const SCALE_AU = 16;
const segments = 128;

const planetData = [
  { id: 'mercury', name: 'Mercury', radius: 0.5, color: 0x888888, distAU: 0.39 },
  { id: 'venus',   name: 'Venus',   radius: 0.9, color: 0xe3bb76, distAU: 0.72 },
  { id: 'earth',   name: 'Earth',   radius: 1.0, color: 0x2233ff, distAU: 1.00 },
  { id: 'mars',    name: 'Mars',    radius: 0.7, color: 0xc1440e, distAU: 1.52 },
  { id: 'jupiter', name: 'Jupiter', radius: 2.2, color: 0xb07f35, distAU: 2.80 },
  { id: 'saturn',  name: 'Saturn',  radius: 1.8, color: 0xd2b48c, distAU: 4.20 },
  { id: 'uranus',  name: 'Uranus',  radius: 1.4, color: 0x7df9ff, distAU: 5.60 },
  { id: 'neptune', name: 'Neptune', radius: 1.4, color: 0x4b70dd, distAU: 7.00 }
];

const planets = {};

function createOrbitLine(radius, color) {
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pos.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.25 });
  return new THREE.Line(geo, mat);
}

planetData.forEach(data => {
  const geo = new THREE.SphereGeometry(data.radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  const orbit = createOrbitLine(data.distAU * SCALE_AU, data.color);
  scene.add(orbit);

  planets[data.id] = {
    astronomyName: data.name,
    mesh: mesh,
    distAU: data.distAU
  };
});

// Anneaux de Saturne
if (planets.saturn) {
  const ringGeo = new THREE.RingGeometry(2.3, 3.6, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xead6b8, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = Math.PI / 2;
  planets.saturn.mesh.add(ringMesh);
}

// Lune
const moonGeo = new THREE.SphereGeometry(0.3, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

const moonOrbit = createOrbitLine(2.2, 0xffffff);
scene.add(moonOrbit);

// 6. Mise à jour des positions
function updatePositions() {
  if (typeof Astronomy === 'undefined') return;
  const now = new Date();
  
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) timeDisplay.innerText = now.toUTCString();

  Object.keys(planets).forEach(id => {
    const p = planets[id];
    const vec = Astronomy.HelioVector(p.astronomyName, now);
    p.mesh.position.set(vec.x * SCALE_AU, vec.z * SCALE_AU, vec.y * SCALE_AU);
  });

  if (planets.earth) {
    const earthMesh = planets.earth.mesh;
    const moonVec = Astronomy.GeoVector('Moon', now, true);
    const scaleMoon = 0.000008;

    moonMesh.position.set(
      earthMesh.position.x + (moonVec.x * scaleMoon),
      earthMesh.position.y + (moonVec.z * scaleMoon),
      earthMesh.position.z + (moonVec.y * scaleMoon)
    );

    moonOrbit.position.copy(earthMesh.position);
  }

  const phase = Astronomy.MoonPhase(now);
  const moonPhaseDisplay = document.getElementById('moon-phase');
  if (moonPhaseDisplay) moonPhaseDisplay.innerText = `${Math.round(phase)}°`;
}

// 7. Projection des étiquettes HTML 2D
function updateLabelPosition(mesh, labelId) {
  const label = document.getElementById(labelId);
  if (!label || !mesh) return;

  const vector = new THREE.Vector3();
  mesh.getWorldPosition(vector);
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
  const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

  if (vector.z < 1) {
    label.style.display = 'block';
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
  } else {
    label.style.display = 'none';
  }
}

function updateAllLabels() {
  updateLabelPosition(sunMesh, 'label-sun');
  updateLabelPosition(moonMesh, 'label-moon');

  Object.keys(planets).forEach(id => {
    if (planets[id]) {
      updateLabelPosition(planets[id].mesh, `label-${id}`);
    }
  });
}

// 8. Boucle d'animation principale
function animate() {
  requestAnimationFrame(animate);

  updatePositions();

  if (controls) controls.update();

  updateAllLabels();

  renderer.render(scene, camera);
}

// 9. Redimensionnement
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lancement
animate();
