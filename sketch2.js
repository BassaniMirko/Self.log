// === Variabili globali ===
let rawData, data = [];
let atlasImg;
let center = { x: 0, y: 0, z: 0 };
let camera, angle = 0;
let isAutoCycling = false;
let currentClassIndex = 0;
let autoCycleInterval = null;
let allClasses = [];
let projectedData = [];
let isGridTimeView = false;
let isModelLoaded = false;
let modelRotation = 0;
let fadeOut = 255;
let centroid = { x: 0, y: 0, z: 0 };
let showCentroid = true;
let animationStartTime = 0;
let mode = "spatial";
let timeData = null;
let isTimeView = false;
let selectedHour = null;
let rotationAngle = 0;

const scaleX = -1000;
const scaleY = -1000;
const scaleZ = -1000;
let offsetX = 0;
let offsetY = -100;
let offsetZ = -300;

let zoom = 8000;
let targetZoom = 8000;
const minZoom = 1000;
const maxZoom = 30000;
const zoomSpeed = 0.001;
const lerpFactor = 0.05;
const zoomLerpFactor = 0.1;

let targetX = 0, targetY = 0, targetZ = 0;
let currentX = 0, currentY = 0, currentZ = 0;
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartCameraX = 0, dragStartCameraY = 0;

let centroidAnimation = {
    isAnimating: true,
    startZ: -3000,
    targetZ: -600,
    progress: 1,
    duration: 3300
};

function getSelectedClasses() {
  const selected = new Set();
  document.querySelectorAll('#classSelector .option.selected')
    .forEach(opt => selected.add(opt.dataset.class));
  return selected;
}

function populateClassSelector() {
  const sel = document.getElementById('classSelector');
  sel.innerHTML = '';
  const sortedClasses = allClasses.sort((a, b) => a.localeCompare(b));
  const itemsPerColumn = Math.ceil(sortedClasses.length / 3);
  const columns = [0,1,2].map(() => {
    const col = document.createElement('div');
    col.style.display = 'flex';
    col.style.flexDirection = 'column';
    return col;
  });
  sortedClasses.forEach((cls, i) => {
    const opt = document.createElement('div');
    opt.textContent = cls;
    opt.dataset.class = cls;
    opt.onclick = () => toggleSelection(cls);
    opt.className = 'option';
    setTimeout(() => {
      columns[Math.floor(i / itemsPerColumn)].appendChild(opt);
      void opt.offsetWidth;
      opt.classList.add('fade-in');
    }, i * 50);
  });
  const container = document.createElement('div');
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(3, 1fr)';
  container.style.gap = '40px';
  columns.forEach(col => container.appendChild(col));
  sel.appendChild(container);
}

function toggleSelection(className) {
  const opt = document.querySelector(`#classSelector .option[data-class="${className}"]`);
  if (opt) opt.classList.toggle('selected');
}

function startAutoCycle() {
  if (autoCycleInterval) clearInterval(autoCycleInterval);
  const options = document.querySelectorAll('#classSelector .option');
  options.forEach(opt => opt.classList.remove('selected'));
  currentClassIndex = 0;
  autoCycleInterval = setInterval(() => {
    if (currentClassIndex > 0) options[(currentClassIndex - 1 + options.length) % options.length].classList.remove('selected');
    else options[options.length - 1].classList.remove('selected');
    options[currentClassIndex].classList.add('selected');
    currentClassIndex = (currentClassIndex + 1) % options.length;
  }, 1000);
}

function stopAutoCycle() {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
    autoCycleInterval = null;
    document.querySelectorAll('#classSelector .option').forEach(opt => opt.classList.remove('selected'));
    currentClassIndex = 0;
  }
}

function toggleAutoCycle() {
  const button = document.getElementById('cycleButton');
  if (!isAutoCycling) {
    startAutoCycle();
    button.textContent = 'ferma';
    button.classList.add('active');
  } else {
    stopAutoCycle();
    button.textContent = 'avvia';
    button.classList.remove('active');
  }
  isAutoCycling = !isAutoCycling;
}

function preload() {
  atlasImg = loadImage('atlas_originali.jpg', () => atlasImg.loadPixels(), err => console.error('Errore caricamento atlas:', err));
  fetch('COSE/image_mapping_with_atlas_deduplicated.json')
    .then(response => response.json())
    .then(json => {
      data = json.mapping;
      computeCenter();
      allClasses = [...new Set(data.map(item => item.class))];
      populateClassSelector();
    })
    .catch(error => console.error('Errore caricamento JSON:', error));
}

function computeCenter() {
  let sx = 0, sy = 0, sz = 0, count = 0;
  if (!Array.isArray(data) || data.length === 0) return;
  data.forEach(item => {
    if (item && item.position && Array.isArray(item.position)) {
      sx += (item.position[0] || 0) * scaleX;
      sy += (item.position[1] || 0) * scaleY;
      sz += (item.position[2] || 0) * scaleZ;
      count++;
    }
  });
  if (count > 0) centroid = { x: sx / count, y: sy / count, z: sz / count };
}

function setup() {
  const container = document.getElementById('canvasContainer');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight, WEBGL);
  canvas.parent(container);
  camera = createCamera();
  perspective(PI / 6, width / height, 100, 30000);
  camera.setPosition(0, 0, 8000);
  offsetZ = -1200;
  setupTouchControls(canvas.elt);
  if (!data || !data.length || !atlasImg || !atlasImg.width) return;
  animationStartTime = millis();
  centroidAnimation.isAnimating = true;
}

function draw() {
  background(0);
  if (!data && !timeData) return;
  isTimeView ? drawTimeView() : drawSpatialView();
}

function drawSpatialView() {
  if (centroidAnimation.isAnimating) {
    let elapsed = millis() - animationStartTime;
    centroidAnimation.progress = elapsed / centroidAnimation.duration;
    if (centroidAnimation.progress >= 1) {
      centroidAnimation.progress = 1;
      centroidAnimation.isAnimating = false;
    }
    offsetZ = lerp(centroidAnimation.startZ, centroidAnimation.targetZ, easeInOutCubic(centroidAnimation.progress));
  }

  currentX = lerp(currentX, targetX, lerpFactor);
  currentY = lerp(currentY, targetY, lerpFactor);
  zoom = lerp(zoom, targetZoom, zoomLerpFactor);

  const camX = centroid.x + currentX;
  const camY = centroid.y + currentY;
  const camZ = centroid.z - zoom;
  camera.setPosition(camX, camY, camZ);
  camera.lookAt(camX, camY, centroid.z);

  if (!data || !atlasImg || !atlasImg.width) return;

  const selectedClasses = getSelectedClasses();
  projectedData = [];

  const rotationAngle = millis() * 0.0003;

  for (let item of data) {
    if (selectedClasses.size > 0 && !selectedClasses.has(item.class)) continue;

    const px = (item.position[0] - center.x) * scaleX;
    const py = (item.position[1] - center.y) * scaleY;
    const pz = (item.position[2] - center.z) * scaleZ;

    const dx = px - centroid.x;
    const dz = pz - centroid.z;

    const rotatedX = centroid.x + dx * Math.cos(rotationAngle) - dz * Math.sin(rotationAngle);
    const rotatedZ = centroid.z + dx * Math.sin(rotationAngle) + dz * Math.cos(rotationAngle);

    const tx = rotatedX + offsetX;
    const ty = py + offsetY;
    const tz = rotatedZ + offsetZ;

    const size = calculatePlaneSize(item, selectedClasses.has(item.class));

    push();
    translate(tx, ty, tz);
    billboard(tx, ty, tz);
    textureMode(NORMAL);
    texture(atlasImg);
    noStroke();
    const u0 = item.x / atlasImg.width;
    const v0 = item.y / atlasImg.height;
    const u1 = (item.x + item.width) / atlasImg.width;
    const v1 = (item.y + item.height) / atlasImg.height;
    beginShape();
    vertex(-size.width/2, -size.height/2, 0, u0, v0);
    vertex(size.width/2, -size.height/2, 0, u1, v0);
    vertex(size.width/2, size.height/2, 0, u1, v1);
    vertex(-size.width/2, size.height/2, 0, u0, v1);
    endShape(CLOSE);
    pop();
  }

  push();
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Centroide:\nX: ${nf(centroid.x, 0, 2)}\nY: ${nf(centroid.y, 0, 2)}\nZ: ${nf(centroid.z, 0, 2)}`, 10, 10);
  pop();
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function calculatePlaneSize(item, isSelected) {
  const aspectRatio = item.width / item.height;
  const baseSize = isSelected ? 64 : 32;
  let width = baseSize, height = baseSize;
  if (aspectRatio > 1) height = width / aspectRatio;
  else width = height * aspectRatio;
  return { width, height };
}

function billboard(x, y, z) {
  const cam = createVector(camera.eyeX, camera.eyeY, camera.eyeZ);
  const obj = createVector(x, y, z);
  const dir = p5.Vector.sub(cam, obj);
  rotateY(atan2(dir.x, dir.z));
  rotateX(-atan2(dir.y, sqrt(dir.x * dir.x + dir.z * dir.z)));
}

function mousePressed(event) {
  // Il touch è gestito interamente dai listener custom in capture phase (vedi sotto):
  // qui ignoriamo gli eventi pointerType==='touch' per non impostare isDragging anche
  // quando il dito tocca un bottone/filtro (p5 invoca questo callback per OGNI pointerdown
  // della pagina, bubbled fino a window, non solo quelli sul canvas).
  if (event && event.pointerType === 'touch') return;
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDragging = true;
    dragStartX = mouseX;
    dragStartY = mouseY;
    dragStartCameraX = currentX;
    dragStartCameraY = currentY;
  }
}

function mouseReleased(event) {
  if (event && event.pointerType === 'touch') return;
  isDragging = false;
}

function mouseDragged(event) {
  if (event && event.pointerType === 'touch') return;
  if (isDragging) {
    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    const moveScale = map(zoom, minZoom, maxZoom, 1, 4);
    const maxOffset = zoom * 0.5;
    targetY = constrain(dragStartCameraY - dy * moveScale, -maxOffset, maxOffset);
    targetX = constrain(dragStartCameraX + dx * moveScale, -maxOffset, maxOffset);
    return false;
  }
}

function mouseWheel(event) {
  event.preventDefault();
  const zoomAmount = event.delta * zoomSpeed;
  const oldZoom = targetZoom;
  targetZoom = constrain(targetZoom * (1 + zoomAmount), minZoom, maxZoom);
  const zoomRatio = targetZoom / oldZoom;
  currentY *= zoomRatio;
  targetY *= zoomRatio;
  return false;
}

// === Controlli touch mobile: 1 dito = pan, 2 dita = pinch-to-zoom ===
// Riusa le stesse variabili/limiti dello zoom desktop (targetZoom, minZoom, maxZoom)
// con lo stesso easing in draw(). I listener sono registrati su `window` in CAPTURE
// phase (non solo sul canvas): questo permette di rilevare il SECONDO dito anche se
// parte sopra #classSelector/.container, necessario per riconoscere il pinch anche
// quando la UI copre parte dello schermo. Per il tap singolo su UI NON chiamiamo mai
// preventDefault(), quindi il click nativo prosegue invariato. Nessun callback p5
// touchStarted/touchMoved/touchEnded viene definito (bloccherebbe i click a livello globale).
const activeTouchPointers = new Map();
let isTouchPanning = false;
let touchPanPointerId = null;
let touchPanStartX = 0, touchPanStartY = 0;
let touchPanStartCameraX = 0, touchPanStartCameraY = 0;
let pinchStartDist = 0;
let pinchStartZoom = 8000;

const UI_SELECTOR = '#filter, #classSelector, button, input, a, .container, .footer';

function isUITarget(target) {
  return !!(target && target.closest && target.closest(UI_SELECTOR));
}

function setupTouchControls(canvasElt) {
  // Blocca i gesti nativi (pinch/scroll del browser) solo sul canvas; la UI resta
  // scrollabile/tappabile normalmente (nessun touch-action:none sulla UI).
  canvasElt.style.touchAction = 'none';

  window.addEventListener('pointerdown', onTouchPointerDown, { passive: false, capture: true });
  window.addEventListener('pointermove', onTouchPointerMove, { passive: false, capture: true });
  window.addEventListener('pointerup', onTouchPointerUp, { passive: false, capture: true });
  window.addEventListener('pointercancel', onTouchPointerUp, { passive: false, capture: true });
}

function startTouchPan(pointerId) {
  const p = activeTouchPointers.get(pointerId);
  isTouchPanning = true;
  touchPanPointerId = pointerId;
  touchPanStartX = p.x;
  touchPanStartY = p.y;
  touchPanStartCameraX = currentX;
  touchPanStartCameraY = currentY;
}

function onTouchPointerDown(e) {
  if (e.pointerType !== 'touch') return; // non interferire con mouse/pen desktop

  activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activeTouchPointers.size === 1) {
    // Primo dito: se è sulla UI, nessun preventDefault, resta un tap/click normale.
    if (isUITarget(e.target)) {
      isTouchPanning = false;
      touchPanPointerId = null;
      return;
    }
    e.preventDefault();
    startTouchPan(e.pointerId);
  } else if (activeTouchPointers.size === 2) {
    // Secondo dito: entra SEMPRE in pinch, anche se uno dei due tocchi è iniziato
    // sopra #classSelector/.container, così la UI non "ruba" un touch al pinch.
    e.preventDefault();
    isTouchPanning = false;
    touchPanPointerId = null;
    const pts = Array.from(activeTouchPointers.values());
    pinchStartDist = dist(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
    pinchStartZoom = targetZoom;
  }
}

function onTouchPointerMove(e) {
  if (e.pointerType !== 'touch') return;
  if (!activeTouchPointers.has(e.pointerId)) return;
  activeTouchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (activeTouchPointers.size === 2 && pinchStartDist > 0) {
    e.preventDefault();
    const pts = Array.from(activeTouchPointers.values());
    const newDist = dist(pts[0].x, pts[0].y, pts[1].x, pts[1].y);
    const ratio = pinchStartDist / newDist;
    targetZoom = constrain(pinchStartZoom * ratio, minZoom, maxZoom);
  } else if (activeTouchPointers.size === 1 && isTouchPanning && e.pointerId === touchPanPointerId) {
    e.preventDefault();
    const p = activeTouchPointers.get(e.pointerId);
    const dx = p.x - touchPanStartX;
    const dy = p.y - touchPanStartY;
    const moveScale = map(zoom, minZoom, maxZoom, 1, 4);
    const maxOffset = zoom * 0.5;
    targetY = constrain(touchPanStartCameraY - dy * moveScale, -maxOffset, maxOffset);
    targetX = constrain(touchPanStartCameraX + dx * moveScale, -maxOffset, maxOffset);
  }
}

function onTouchPointerUp(e) {
  if (e.pointerType !== 'touch') return;
  if (!activeTouchPointers.has(e.pointerId)) return;
  activeTouchPointers.delete(e.pointerId);

  if (activeTouchPointers.size === 1) {
    // Resta un dito dopo un pinch: riparte il pan dalla posizione corrente.
    pinchStartDist = 0;
    const [remainingId] = activeTouchPointers.keys();
    startTouchPan(remainingId);
  } else {
    isTouchPanning = false;
    touchPanPointerId = null;
    pinchStartDist = 0;
  }
}

function setupFilters() {
    // ...existing code...
    
    // Per ogni bottone filtro
    const btn = createDiv(label);
    btn.class('option');
    btn.mousePressed(() => {
        // Toggle della classe selected
        btn.toggleClass('selected');
        
        // Aggiorna lo stato del filtro
        const isSelected = btn.hasClass('selected');
        updateFilter(label, isSelected);
        
        // Aggiorna la visualizzazione
        redraw();
    });
    
    // ...existing code...
}

