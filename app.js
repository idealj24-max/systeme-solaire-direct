// 1. Initialisation de la scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 20, 35);

// 2. Gestion des Contrôles (OrbitControls + Gyroscope)
let controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();

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

const sunLight = new THREE.PointLight(0xffffff, 2, 500);
scene.add(sunLight);

// 4. Corps Célestes
// Soleil
const sunGeo = new THREE.SphereGeometry(3, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

// Terre
const earthGeo = new THREE.SphereGeometry(1.2, 32, 32);
const earthMat = new THREE.MeshStandardMaterial({ color: 0x2233ff, roughness: 0.6 });
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
scene.add(earthMesh);

// Lune
const moonGeo = new THREE.SphereGeometry(0.4, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.8 });
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

// 5. Tracé des Orbites
const segments = 128;

// Orbite Terre
const earthOrbitRadius = 15;
const earthOrbitGeo = new THREE.BufferGeometry();
const earthOrbitPos = [];
for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  earthOrbitPos.push(Math.cos(theta) * earthOrbitRadius, 0, Math.sin(theta) * earthOrbitRadius);
}
earthOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(earthOrbitPos, 3));
const earthOrbitMat = new THREE.LineBasicMaterial({ color: 0x4da6ff, transparent: true, opacity: 0.4 });
const earthOrbit = new THREE.Line(earthOrbitGeo, earthOrbitMat);
scene.add(earthOrbit);

// Orbite Lune
const moonOrbitRadius = 2.5;
const moonOrbitGeo = new THREE.BufferGeometry();
const moonOrbitPos = [];
for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  moonOrbitPos.push(Math.cos(theta) * moonOrbitRadius, 0, Math.sin(theta) * moonOrbitRadius);
}
moonOrbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(moonOrbitPos, 3));
const moonOrbitMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
const moonOrbit = new THREE.Line(moonOrbitGeo, moonOrbitMat);
scene.add(moonOrbit);

// 6. Positions Astronomiques
function updatePositions() {
  const now = new Date();
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) timeDisplay.innerText = now.toUTCString();

  const moonVec = Astronomy.GeoVector('Moon', now, true);
  const earthVec = Astronomy.HelioVector('Earth', now);

  const scaleEarth = 15;
  earthMesh.position.set(earthVec.x * scaleEarth, earthVec.z * scaleEarth, earthVec.y * scaleEarth);

  const scaleMoon = 0.00001;
  moonMesh.position.set(
    earthMesh.position.x + (moonVec.x * scaleMoon),
    earthMesh.position.y + (moonVec.z * scaleMoon),
    earthMesh.position.z + (moonVec.y * scaleMoon)
  );

  // L'orbite de la Lune suit la Terre
  moonOrbit.position.copy(earthMesh.position);

  const phase = Astronomy.MoonPhase(now);
  const moonPhaseDisplay = document.getElementById('moon-phase');
  if (moonPhaseDisplay) moonPhaseDisplay.innerText = `${Math.round(phase)}°`;
}

// 7. Mise à jour des Étiquettes 2D
function updateLabelPosition(mesh, labelId) {
  const label = document.getElementById(labelId);
  if (!label) return;

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

// 8. Boucle d'Animation
function animate() {
  requestAnimationFrame(animate);
  
  updatePositions();
  if (controls) controls.update();
  
  updateLabelPosition(sunMesh, 'label-sun');
  updateLabelPosition(earthMesh, 'label-earth');
  updateLabelPosition(moonMesh, 'label-moon');
  
  renderer.render(scene, camera);
}

// Redimensionnement
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
