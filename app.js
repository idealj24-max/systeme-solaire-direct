// 1. Initialisation de la scène Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 20, 35);
controls.update();

// 2. Éclairage (Le Soleil éclaire la scène)
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 500);
scene.add(sunLight);

// 3. Création des corps célestes (Échelles simplifiées pour le visuel)
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

// 4. Mettre à jour les positions astronomiques exactes
function updatePositions() {
  const now = new Date();
  document.getElementById('time-display').innerText = now.toUTCString();

  // Position géocentrique de la Lune (depuis la Terre)
  const moonVec = Astronomy.GeoVector('Moon', now, true);
  // Position héliocentrique de la Terre (depuis le Soleil)
  const earthVec = Astronomy.HelioVector('Earth', now);

  // Échelle visuelle (1 UA = 15 unités 3D)
  const scaleEarth = 15;
  earthMesh.position.set(earthVec.x * scaleEarth, earthVec.z * scaleEarth, earthVec.y * scaleEarth);

  // Position de la Lune relative à la Terre
  const scaleMoon = 0.00001; // Ajustement d'échelle pour visibilité
  moonMesh.position.set(
    earthMesh.position.x + (moonVec.x * scaleMoon),
    earthMesh.position.y + (moonVec.z * scaleMoon),
    earthMesh.position.z + (moonVec.y * scaleMoon)
  );

  // Calcul de la phase lunaire
  const phase = Astronomy.MoonPhase(now);
  document.getElementById('moon-phase').innerText = `${Math.round(phase)}°`;
}

// 5. Boucle de rendu 3D
function animate() {
  requestAnimationFrame(animate);
  updatePositions();
  controls.update();
  renderer.render(scene, camera);
}

// Redimensionnement de la fenêtre
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
