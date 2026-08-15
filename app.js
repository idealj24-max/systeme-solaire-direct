// 1. Initialisation de la scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

camera.position.set(0, 30, 50);

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

// Vénus
const venusGeo = new THREE.SphereGeometry(1.0, 32, 32);
const venusMat = new THREE.MeshStandardMaterial({ color: 0xe3bb76, roughness: 0.5 });
const venusMesh = new THREE.Mesh(venusGeo, venusMat);
scene.add(venusMesh);

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

// Mars
const marsGeo = new THREE.SphereGeometry(0.8, 32, 32);
const marsMat = new THREE.MeshStandardMaterial({ color: 0xc1440e, roughness: 0.7 });
const marsMesh = new THREE.Mesh(marsGeo, marsMat);
scene.add(marsMesh);

// Jupiter
const jupiterGeo = new THREE.SphereGeometry(2.5, 32, 32);
const jupiterMat = new THREE.MeshStandardMaterial({ color: 0xb07f35, roughness: 0.6 });
const jupiterMesh = new THREE.Mesh(jupiterGeo, jupiterMat);
scene.add(jupiterMesh);

// 5. Tracé des Orbites
const segments = 128;

function createOrbit(radius, color, opacity = 0.4) {
  const geo = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    pos.push(Math.cos(theta) * radius, 0, Math.sin(theta) * radius);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity });
  return new THREE.Line(geo, mat);
}

// Rayons visuels des orbites (échelle visuelle 1 UA = 15 unités 3D)
const SCALE_AU = 15;

const venusOrbit = createOrbit(0.72 * SCALE_AU, 0xe3bb76);
const earthOrbit = createOrbit(1.0 * SCALE_AU, 0x4da6ff);
const marsOrbit = createOrbit(1.52 * SCALE_AU, 0xc1440e);
const jupiterOrbit = createOrbit(2.8 * SCALE_AU, 0xb07f35); // Échelle ajustée pour lisibilité

scene.add(venusOrbit);
scene.add(earthOrbit);
scene.add(marsOrbit);
scene.add(jupiterOrbit);

// Orbite Lune (relative à la Terre)
const moonOrbit = createOrbit(2.5, 0xffffff, 0.3);
scene.add(moonOrbit);

// 6. Positions Astronomiques Temps Réel
function updatePositions() {
  const now = new Date();
  const timeDisplay = document.getElementById('time-display');
  if (timeDisplay) timeDisplay.innerText = now.toUTCString();

  // Vecteurs héliocentriques depuis Astronomy Engine
  const venusVec = Astronomy.HelioVector('Venus', now);
  const earthVec = Astronomy.HelioVector('Earth', now);
  const marsVec = Astronomy.HelioVector('Mars', now);
  const jupiterVec = Astronomy.HelioVector('Jupiter', now);
  const moonVec = Astronomy.GeoVector('Moon', now, true);

  // Positionnement dans la scène 3D (X, Z, Y pour repère 3D)
  venusMesh.position.set(venusVec.x * SCALE_AU, venusVec.z * SCALE_AU, venusVec.y * SCALE_AU);
  earthMesh.position.set(earthVec.x * SCALE_AU, earthVec.z * SCALE_AU, earthVec.y * SCALE_AU);
  marsMesh.position.set(marsVec.x * SCALE_AU, marsVec.z * SCALE_AU, marsVec.y * SCALE_AU);
  
  // Échelle compressée pour Jupiter afin de la garder visible à l'écran
  const jupiterScale = SCALE_AU * 0.54; 
  jupiterMesh.position.set(jupiterVec.x * jupiterScale, jupiterVec.z * jupiterScale, jupiterVec.y * jupiterScale);

  // Lune
  const scaleMoon = 0.00001;
  moonMesh.position.set(
    earthMesh.position.x + (moonVec.x * scaleMoon),
    earthMesh.position.y + (moonVec.z * scaleMoon),
    earthMesh.position.z + (moonVec.y * scaleMoon)
  );

  moonOrbit.position.copy(earthMesh.position);

  const phase = Astronomy.MoonPhase(now);
  const moonPhaseDisplay = document.getElementById('moon-phase');
  if (moonPhaseDisplay) moonPhaseDisplay.innerText = `${Math.round(phase)}°`;
}

// 7. Déclaration de la fonction de mise à jour des Étiquettes 2D
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

// 8. Boucle d'Animation (60 FPS)
function animate() {
  requestAnimationFrame(animate);
  
  updatePositions();

  if (controls) controls.update();
  
  // Mise à jour de toutes les étiquettes
  updateLabelPosition(sunMesh, 'label-sun');
  updateLabelPosition(venusMesh, 'label-venus');
  updateLabelPosition(earthMesh, 'label-earth');
  updateLabelPosition(moonMesh, 'label-moon');
  updateLabelPosition(marsMesh, 'label-mars');
  updateLabelPosition(jupiterMesh, 'label-jupiter');
  
  renderer.render(scene, camera);
}

// 9. Gestion du Redimensionnement
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lancement
animate();
