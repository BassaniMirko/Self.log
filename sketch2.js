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

const scaleX = -1000; // Aumentato da -1500
const scaleY = -1000; // Aumentato da -1500
const scaleZ = -1000; // Aumentato da -1500
let offsetX = 0;
let offsetY = -100; // aumentato da -100
let offsetZ = -300; // Aumentato da -300 a -600

// Modifica le variabili globali di zoom
let zoom = 8000;  // Aumentato per compensare il FOV più stretto
const minZoom = 1000; // Aumentato il valore minimo
const maxZoom = 30000; // Aumentato il valore massimo
const zoomSpeed = 0.001; // Ridotta la velocità dello zoom per un controllo più preciso
const lerpFactor = 0.05; // interpolazione graduale

// Aggiungi queste variabili globali all'inizio del file
let targetX = 0;
let targetY = 0;
let targetZ = 0;
let currentX = 0;
let currentY = 0;
let currentZ = 0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCameraX = 0;
let dragStartCameraY = 0;

let objModel;
let isModelLoaded = false;
//let loadingProgress = 0;
let modelRotation = 0;
let fadeOut = 255;

let centroid = { x: 0, y: 0, z: 0 };
let showCentroid = true;

let centroidAnimation = {
    isAnimating: true,
    startZ: -3000,    // Posizione di partenza molto lontana
    targetZ: -600,    // Posizione finale (il tuo offsetZ attuale)
    progress: 1,
    duration: 3300    // Durata dell'animazione in millisecondi
};

let animationStartTime = 0;
let mode = "spatial"; // 'spatial' o 'temporal'

// Aggiungi queste variabili globali per la vista data/ora
let timeData = null;
let isTimeView = false;
let selectedHour = null;

function preload() {
  // Modifica il caricamento dell'atlas per gestire meglio gli errori
  atlasImg = loadImage('atlas_originali.jpg', 
    () => {
      atlasImg.loadPixels();
    },
    (err) => {
      console.error('Errore caricamento atlas:', err);
    }
  );

  // Modifica il caricamento del JSON per gestire il ReadableStream
  fetch('COSE/image_mapping_with_atlas_deduplicated.json')
    .then(response => response.json())
    .then(json => {
      data = json.mapping;
      computeCenter();
      allClasses = [...new Set(data.map(item => item.class))];
      populateClassSelector();
    })
    .catch(error => {
      console.error('Errore caricamento JSON:', error);
    });
}
function calculateGridTimePosition(dateString) {
  if (!dateString) return [0, 0, 0];

  const [year, month, day] = dateString.split('-').map(Number);

  const x = (month - 1) * 200;      // mesi → X (1–12)
  const y = (day - 1) * 100;        // giorni → Y (1–31)
  const z = (year - 2020) * 400;    // anni → Z (dal 2020 in poi)

  return [x, y, z];
}
function organizeDataByTime(timeData) {
  return timeData.map(item => ({
    ...item,
    position: calculateGridTimePosition(item.date),
    class: getTimeCategory(item.time)
  }));
}
function toggleGridTimeView() {
  const button = document.getElementById('gridTimeButton');
  isGridTimeView = !isGridTimeView;

  button.style.animation = 'blink 1s infinite';
  button.textContent = 'caricamento...';

  // Salva lo stato globalmente
  window.isGridTimeView = isGridTimeView;

  loadData(true).then(() => {
    button.style.animation = 'none';
    button.textContent = isGridTimeView ? 'vista normale' : 'Griglia temporale';

    // Assicurati che la griglia rimanga visibile
    if (isGridTimeView) {
      drawGridAxes();
    }

    resetView();
  });
}
function drawGridAxes() {
  push();
  stroke(255, 50);
  for (let i = 0; i < 12; i++) {
    line(i*200, 0, 0, i*200, 3000, 0); // mesi
  }
  for (let i = 0; i < 31; i++) {
    line(0, i*100, 0, 2400, i*100, 0); // giorni
  }
  for (let i = 0; i <= 5; i++) {
    line(0, 0, i*400, 2400, 0, i*400); // anni
  }
  pop();
}

function computeCenter() {
    let sx = 0, sy = 0, sz = 0;
    let count = 0;

    // Verifica che data sia un array non vuoto
    if (!Array.isArray(data) || data.length === 0) {
        console.warn('Nessun dato disponibile per calcolare il centroide');
        return;
    }

    data.forEach(item => {
        // Verifica che l'item abbia le proprietà position
        if (item && item.position && Array.isArray(item.position)) {
            sx += (item.position[0] || 0) * scaleX;
            sy += (item.position[1] || 0) * scaleY;
            sz += (item.position[2] || 0) * scaleZ;
            count++;
        }
    });

    if (count > 0) {
        centroid = {
            x: sx / count,
            y: sy / count,
            z: sz / count
        };
        
        console.log('Centroide calcolato:', {
            x: centroid.x.toFixed(2),
            y: centroid.y.toFixed(2),
            z: centroid.z.toFixed(2)
        });
    } else {
        console.warn('Nessun dato valido per calcolare il centroide');
    }
}

function setup() {
  // Crea il canvas nel container
  const container = document.getElementById('canvasContainer');
  const canvas = createCanvas(container.offsetWidth, container.offsetHeight, WEBGL);
  canvas.parent(container);
  
  // Crea la camera con un FOV più stretto (simile a una focale più lunga)
  camera = createCamera();
  perspective(PI/6, width/height, 100, 30000); // FOV di 30 gradi invece di 60
  camera.setPosition(0, 0, 8000);
  
  // Ora questo non darà più errore
  offsetZ = -1200; // Aumentato per compensare la camera più distante
  
  // Verifica che i dati siano caricati correttamente
  if (!data || !data.length) {
    console.error('Dati non caricati correttamente');
    return;
  }
  
  if (!atlasImg || !atlasImg.width) {
    console.error('Atlas non caricato correttamente');
    return;
  }
  
  animationStartTime = millis();
  centroidAnimation.isAnimating = true;
}

// Aggiorna anche windowResized
function windowResized() {
  const container = document.getElementById('canvasContainer');
  resizeCanvas(container.offsetWidth, container.offsetHeight);
}

function draw() {
  background(0);
  
  if (!data && !timeData) return;
  
  if (isTimeView) {
    drawTimeView();
  } else {
    drawSpatialView();
  }
}

function drawTimeView() {
  if (!timeData || !atlasImg) return;

  // Disegna griglia temporale
  drawTimeGrid();

  // Disegna le immagini
  timeData.forEach(item => {
    if (!item.time) return;
    if (selectedHour !== null) {
      const itemHour = parseInt(item.time.split(':')[0]);
      if (itemHour !== selectedHour) return;
    }

    const [hour, minute] = item.time.split(':').map(Number);
    const angle = (hour + minute/60) * (TWO_PI/24);
    const radius = 800;
    
    const x = cos(angle) * radius;
    const y = sin(angle) * radius * 0.5;
    
    push();
    translate(x, y, 0);
    
    // Billboard effect
    let rotation = atan2(camera.eyeX - x, camera.eyeZ);
    rotateY(rotation);
    
    // Disegna immagine dall'atlas
    texture(atlasImg);
    const size = selectedHour !== null ? 75 : 50;
    
    beginShape();
    vertex(-size/2, -size/2, 0, item.x/atlasImg.width, item.y/atlasImg.height);
    vertex(size/2, -size/2, 0, (item.x + item.width)/atlasImg.width, item.y/atlasImg.height);
    vertex(size/2, size/2, 0, (item.x + item.width)/atlasImg.width, (item.y + item.height)/atlasImg.height);
    vertex(-size/2, size/2, 0, item.x/atlasImg.width, (item.y + item.height)/atlasImg.height);
    endShape(CLOSE);
    
    pop();
  });
}

function drawTimeGrid() {
    stroke(255, 30);
    noFill();
    
    // Cerchi concentrici
    for (let r = 200; r <= 800; r += 200) {
        ellipse(0, 0, r*2, r);
    }
    
    // Linee delle ore
    for (let h = 0; h < 24; h++) {
        const angle = h * (TWO_PI/24);
        const x1 = cos(angle) * 200;
        const y1 = sin(angle) * 100;
        const x2 = cos(angle) * 800;
        const y2 = sin(angle) * 400;
        line(x1, y1, 0, x2, y2, 0);
    }
}

function drawSpatialView() {
  // Gestione animazione del centroide
  if (centroidAnimation.isAnimating) {
    let elapsed = millis() - animationStartTime;
    centroidAnimation.progress = elapsed / centroidAnimation.duration;
    
    if (centroidAnimation.progress >= 1) {
      centroidAnimation.progress = 1;
      centroidAnimation.isAnimating = false;
    }
    
    let easedProgress = easeInOutCubic(centroidAnimation.progress);
    offsetZ = lerp(centroidAnimation.startZ, centroidAnimation.targetZ, easedProgress);
  }

  // Interpola le posizioni correnti verso i target
  currentX = lerp(currentX, targetX, lerpFactor);
  currentY = lerp(currentY, targetY, lerpFactor);

  // Modifica il calcolo della posizione della camera per una vista statica
  const radius = zoom;
  const camX = centroid.x + currentX;
  const camZ = centroid.z - radius; // Vista frontale fissa
  const camY = centroid.y + currentY;
  
  camera.setPosition(camX, camY, camZ);
  camera.lookAt(
    centroid.x + currentX, 
    centroid.y + currentY, 
    centroid.z
  );
  
  if (!data || !atlasImg) return;

  // Verifica che la texture sia caricata correttamente
  if (!atlasImg || !atlasImg.width) {
    return;
  }

  const selectedClasses = getSelectedClasses();
  projectedData = [];

  for (let item of data) {
    if (selectedClasses.size > 0 && !selectedClasses.has(item.class)) continue;

    const px = (item.position[0] - center.x) * scaleX;
    const py = (item.position[1] - center.y) * scaleY;
    const pz = (item.position[2] - center.z) * scaleZ;

    const tx = px + offsetX;
    const ty = py + offsetY;
    const tz = pz + offsetZ;

    const size = calculatePlaneSize(item, selectedClasses.size > 0 && selectedClasses.has(item.class));
    
    push();
    translate(tx, ty, tz);
    billboard(tx, ty, tz);
    
    // Assicurati che la texture sia attiva
    textureMode(NORMAL);
    texture(atlasImg);
    noStroke();
    
    // Calcola le coordinate UV con maggiore precisione
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
    
    // Aggiungi l'immagine al projectedData per l'hover
    projectedData.push({
        modelPos: createVector(tx, ty, tz),
        imgName: item.image,
        class: item.class,
        x: item.x,
        y: item.y
    });
  }
  if (isGridTimeView) {
    drawGridAxes();
  }

  // Aggiungi questa parte per l'hover
  const label = document.getElementById('hoverLabel');
  let closest = null;
  let minDist = 50; // Aumenta questo valore se hai difficoltà a selezionare le immagini

  projectedData.forEach(p => {
    const sp = screenPosition(p.modelPos.x, p.modelPos.y, p.modelPos.z);
    const d = dist(mouseX, mouseY, sp.x, sp.y);
    if (d < minDist) {
      minDist = d;
      closest = p;
    }
  });

  if (showCentroid) {
    drawCentroid();
  }

  // Disegna le coordinate del centroide sullo schermo
  push();
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Centroide: 
    X: ${nf(centroid.x, 0, 2)}
    Y: ${nf(centroid.y, 0, 2)}
    Z: ${nf(centroid.z, 0, 2)}`, 10, 10);
  pop();
}

// Aggiungi questa funzione per l'interpolazione con easing
function easeInOutCubic(t) {
    return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function billboard(x, y, z) {
  const cam = createVector(camera.eyeX, camera.eyeY, camera.eyeZ);
  const obj = createVector(x, y, z);
  const dir = p5.Vector.sub(cam, obj);
  rotateY(atan2(dir.x, dir.z));
  rotateX(-atan2(dir.y, sqrt(dir.x * dir.x + dir.z * dir.z)));
}

function getSelectedClasses() {
    const selected = new Set();
    const opts = document.querySelectorAll('#classSelector .option.selected');
    opts.forEach(opt => selected.add(opt.dataset.class));
    return selected;
}

function populateClassSelector() {
    const sel = document.getElementById('classSelector');
    sel.innerHTML = '';
    
    // Ordina le classi alfabeticamente
    const sortedClasses = allClasses.sort((a, b) => a.localeCompare(b));
    
    // Dividi le classi in tre colonne
    const itemsPerColumn = Math.ceil(sortedClasses.length / 3);
    const columns = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
    ];

    columns.forEach(col => {
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
    });
    
    function addOptionWithDelay(option, column, index) {
        setTimeout(() => {
            const opt = document.createElement('div');
            opt.textContent = option;
            opt.dataset.class = option; // Aggiungi il data attribute
            opt.onclick = () => toggleSelection(option);
            opt.className = 'option';
            column.appendChild(opt);
            
            // Forza il reflow e aggiungi l'animazione
            void opt.offsetWidth;
            opt.classList.add('fade-in');
        }, index * 50);
    }
    
    // Popola le colonne
    sortedClasses.forEach((className, index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        if (columnIndex < 3) {
            addOptionWithDelay(className, columns[columnIndex], index);
        }
    });
    
    // Crea un container per le colonne
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    container.style.gap = '40px';
    
    // Aggiungi le colonne al container
    columns.forEach(col => container.appendChild(col));
    
    // Aggiungi il container al selettore
    sel.appendChild(container);
}

// Aggiungi questa funzione per gestire la selezione
function toggleSelection(className) {
    const opt = document.querySelector(`#classSelector .option[data-class="${className}"]`);
    if (opt) {
        opt.classList.toggle('selected');
    }
}

function startAutoCycle() {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
  }

  const options = document.querySelectorAll('#classSelector .option');

  // Deseleziona tutte le classi attive all'inizio
  options.forEach(opt => opt.classList.remove('selected'));

  currentClassIndex = 0;

  autoCycleInterval = setInterval(() => {
    // Deseleziona la classe attuale (se esiste)
    if (currentClassIndex > 0) {
      const prevIndex = (currentClassIndex - 1 + options.length) % options.length;
      const prevOpt = options[prevIndex];
      prevOpt.classList.remove('selected');
    } else if (currentClassIndex === 0) {
      const lastOpt = options[options.length - 1];
      lastOpt.classList.remove('selected');
    }

    // Seleziona la nuova classe
    const currentOpt = options[currentClassIndex];
    currentOpt.classList.add('selected');

    // Aggiorna l'indice
    currentClassIndex = (currentClassIndex + 1) % options.length;
  }, 1000);
}


function stopAutoCycle() {
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
        autoCycleInterval = null;
        
        // Deseleziona tutto alla fine
        const options = document.querySelectorAll('#classSelector .option');
        options.forEach(opt => {
            if (opt.classList.contains('selected')) {
                opt.classList.remove('selected');
                toggleSelection(opt.dataset.class);
            }
        });
        
        currentClassIndex = 0;
    }
}

function toggleAutoCycle() {
    const button = document.getElementById('cycleButton');
    
    if (!isAutoCycling) {
        startAutoCycle();
        button.textContent = 'ferma';
        button.classList.add('active'); // Aggiunge la classe che ferma l'animazione
    } else {
        stopAutoCycle();
        button.textContent = 'avvia';
        button.classList.remove('active'); // Rimuove la classe e riattiva l'animazione
    }
    isAutoCycling = !isAutoCycling;
}

// Aggiungi questa funzione dopo la funzione billboard()
function screenPosition(x, y, z) {
  // Creiamo un vettore con le coordinate 3D
  const pos = createVector(x, y, z);
  
  // Otteniamo la matrice di proiezione corrente
  const projection = ((window._renderer || {}).uMVMatrix || []);
  
  // Se non abbiamo una matrice di proiezione valida, restituiamo una posizione di default
  if (!projection.length) {
    return createVector(0, 0);
  }

  // Applichiamo la matrice di proiezione al punto
  const projected = screenXYZ(pos, projection);
  
  // Convertiamo le coordinate normalizzate in coordinate dello schermo
  return createVector(
    (projected.x + 1) * width/2,
    (projected.y + 1) * height/2
  );
}

function screenXYZ(pos, projection) {
  // Calcoliamo la proiezione del punto
  const x = pos.x * projection[0] + pos.y * projection[4] + pos.z * projection[8] + projection[12];
  const y = pos.x * projection[1] + pos.y * projection[5] + pos.z * projection[9] + projection[13];
  const w = pos.x * projection[3] + pos.y * projection[7] + pos.z * projection[11] + projection[15];

  // Normalizziamo le coordinate
  return createVector(x/w, y/w);
}

function mousePressed() {
  // Verifica che il mouse sia sul canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDragging = true;
    dragStartX = mouseX;
    dragStartY = mouseY;
    dragStartCameraX = currentX;
    dragStartCameraY = currentY;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseDragged() {
  if (isDragging) {
    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    const moveScale = map(zoom, minZoom, maxZoom, 1, 4);
    
    // Calcola gli offset massimi basati sullo zoom
    const maxOffset = zoom * 0.5;
    
    // Aggiorna sia la posizione verticale che laterale
    targetY = constrain(
      dragStartCameraY - dy * moveScale,
      -maxOffset,
      maxOffset
    );
    
    targetX = constrain(
      dragStartCameraX + dx * moveScale,
      -maxOffset,
      maxOffset
    );
    
    return false;
  }
}

// Modifica anche la funzione mouseWheel per zoomare verso il centroide
function mouseWheel(event) {
  event.preventDefault();
  
  const zoomAmount = event.delta * zoomSpeed;
  const oldZoom = zoom;
  
  // Applica lo zoom con smorzamento
  zoom = constrain(zoom * (1 + zoomAmount), minZoom, maxZoom);
  
  // Mantieni la proporzione dell'offset verticale durante lo zoom
  const zoomRatio = zoom / oldZoom;
  currentY *= zoomRatio;
  targetY *= zoomRatio;
  
  return false;
}
// const minPlaneSize = 30;
// const maxPlaneSize = 100;

// Aggiungi questa funzione per calcolare le dimensioni del piano
function calculatePlaneSize(item, isSelected) {
  // Ottieni le dimensioni originali dell'immagine
  const aspectRatio = item.width / item.height;
  // Dimensione massima consentita
  const MAX_SIZE = 64;
  const MIN_SIZE = 32;
  // Dimensione base in base alla selezione
  const baseSize = isSelected ? MAX_SIZE : MIN_SIZE;
  
  let width, height;
  
  if (aspectRatio > 1) {
    // Immagine più larga che alta
    width = baseSize;
    height = width / aspectRatio;
  } else {
    // Immagine più alta che larga
    height = baseSize;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

// Disegna il centroide
function drawCentroid() {
  push();
  translate(centroid.x + offsetX, centroid.y + offsetY, centroid.z + offsetZ);
  
  // Disegna una sfera rossa al centro
  stroke(255, 0, 0);
  fill(255, 0, 0);
  sphere(30);
  
  // Disegna gli assi X, Y, Z
  stroke(255, 0, 0); // Rosso per X
  line(0, 0, 0, 100, 0, 0);
  stroke(0, 255, 0); // Verde per Y
  line(0, 0, 0, 0, 100, 0);
  stroke(0, 0, 255); // Blu per Z
  line(0, 0, 0, 0, 0, 100);
  
  pop();
}

// Toggle per il centroide con il tasto 'c'
function keyPressed() {
  if (key === 'c' || key === 'C') {
    showCentroid = !showCentroid;
  }
}

// Modifica la funzione di caricamento per gestire entrambi i JSON
function loadData(isTimeViewMode = false) {
    isTimeView = isTimeViewMode;
    const jsonFile = isTimeView ? 
        'data_date_time_without_position.json' : 
        'image_mapping_with_atlas.json';

    return fetch(jsonFile)
        .then(response => response.json())
        .then(json => {
            if (isTimeView) {
                timeData = json;
                setupTimeControls();
            } else {
                data = json.mapping;
                setupSpatialControls();
            }
            computeCenter();
        })
        .catch(error => console.error('Errore caricamento JSON:', error));
}

// Aggiungi questa funzione per gestire i controlli temporali
function setupTimeControls() {
    const selector = document.getElementById('classSelector');
    selector.innerHTML = '';
    
    // Crea griglia per le ore
    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 5px;
        padding: 5px;
    `;
    
    // Crea i bottoni per ogni ora
    for (let i = 0; i < 24; i++) {
        const btn = document.createElement('button');
        btn.textContent = `${i.toString().padStart(2, '0')}:00`;
        btn.className = 'class-button';
        btn.onclick = () => filterByHour(i);
        grid.appendChild(btn);
    }
    
    selector.appendChild(grid);
}

function filterByHour(hour) {
    selectedHour = selectedHour === hour ? null : hour;
    
    // Aggiorna UI
    document.querySelectorAll('.class-button').forEach(btn => {
        const btnHour = parseInt(btn.textContent);
        btn.classList.toggle('selected', btnHour === selectedHour);
    });
}

// Modifica la funzione draw per gestire entrambe le viste
function draw() {
  background(0);
  
  if (!data && !timeData) return;
  
  if (isTimeView) {
    drawTimeView();
  } else {
    drawSpatialView();
  }
}

function drawTimeView() {
  if (!timeData || !atlasImg) return;

  // Disegna griglia temporale
  drawTimeGrid();

  // Disegna le immagini
  timeData.forEach(item => {
    if (!item.time) return;
    if (selectedHour !== null) {
      const itemHour = parseInt(item.time.split(':')[0]);
      if (itemHour !== selectedHour) return;
    }

    const [hour, minute] = item.time.split(':').map(Number);
    const angle = (hour + minute/60) * (TWO_PI/24);
    const radius = 800;
    
    const x = cos(angle) * radius;
    const y = sin(angle) * radius * 0.5;
    
    push();
    translate(x, y, 0);
    
    // Billboard effect
    let rotation = atan2(camera.eyeX - x, camera.eyeZ);
    rotateY(rotation);
    
    // Disegna immagine dall'atlas
    texture(atlasImg);
    const size = selectedHour !== null ? 75 : 50;
    
    beginShape();
    vertex(-size/2, -size/2, 0, item.x/atlasImg.width, item.y/atlasImg.height);
    vertex(size/2, -size/2, 0, (item.x + item.width)/atlasImg.width, item.y/atlasImg.height);
    vertex(size/2, size/2, 0, (item.x + item.width)/atlasImg.width, (item.y + item.height)/atlasImg.height);
    vertex(-size/2, size/2, 0, item.x/atlasImg.width, (item.y + item.height)/atlasImg.height);
    endShape(CLOSE);
    
    pop();
  });
}

function drawTimeGrid() {
    stroke(255, 30);
    noFill();
    
    // Cerchi concentrici
    for (let r = 200; r <= 800; r += 200) {
        ellipse(0, 0, r*2, r);
    }
    
    // Linee delle ore
    for (let h = 0; h < 24; h++) {
        const angle = h * (TWO_PI/24);
        const x1 = cos(angle) * 200;
        const y1 = sin(angle) * 100;
        const x2 = cos(angle) * 800;
        const y2 = sin(angle) * 400;
        line(x1, y1, 0, x2, y2, 0);
    }
}

function drawSpatialView() {
  // Gestione animazione del centroide
  if (centroidAnimation.isAnimating) {
    let elapsed = millis() - animationStartTime;
    centroidAnimation.progress = elapsed / centroidAnimation.duration;
    
    if (centroidAnimation.progress >= 1) {
      centroidAnimation.progress = 1;
      centroidAnimation.isAnimating = false;
    }
    
    let easedProgress = easeInOutCubic(centroidAnimation.progress);
    offsetZ = lerp(centroidAnimation.startZ, centroidAnimation.targetZ, easedProgress);
  }

  // Interpola le posizioni correnti verso i target
  currentX = lerp(currentX, targetX, lerpFactor);
  currentY = lerp(currentY, targetY, lerpFactor);

  // Modifica il calcolo della posizione della camera per una vista statica
  const radius = zoom;
  const camX = centroid.x + currentX;
  const camZ = centroid.z - radius; // Vista frontale fissa
  const camY = centroid.y + currentY;
  
  camera.setPosition(camX, camY, camZ);
  camera.lookAt(
    centroid.x + currentX, 
    centroid.y + currentY, 
    centroid.z
  );
  
  if (!data || !atlasImg) return;

  // Verifica che la texture sia caricata correttamente
  if (!atlasImg || !atlasImg.width) {
    return;
  }

  const selectedClasses = getSelectedClasses();
  projectedData = [];

  for (let item of data) {
    if (selectedClasses.size > 0 && !selectedClasses.has(item.class)) continue;

    const px = (item.position[0] - center.x) * scaleX;
    const py = (item.position[1] - center.y) * scaleY;
    const pz = (item.position[2] - center.z) * scaleZ;

    const tx = px + offsetX;
    const ty = py + offsetY;
    const tz = pz + offsetZ;

    const size = calculatePlaneSize(item, selectedClasses.size > 0 && selectedClasses.has(item.class));
    
    push();
    translate(tx, ty, tz);
    billboard(tx, ty, tz);
    
    // Assicurati che la texture sia attiva
    textureMode(NORMAL);
    texture(atlasImg);
    noStroke();
    
    // Calcola le coordinate UV con maggiore precisione
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
    
    // Aggiungi l'immagine al projectedData per l'hover
    projectedData.push({
        modelPos: createVector(tx, ty, tz),
        imgName: item.image,
        class: item.class,
        x: item.x,
        y: item.y
    });
  }
  if (isGridTimeView) {
    drawGridAxes();
  }

  // Aggiungi questa parte per l'hover
  const label = document.getElementById('hoverLabel');
  let closest = null;
  let minDist = 50; // Aumenta questo valore se hai difficoltà a selezionare le immagini

  projectedData.forEach(p => {
    const sp = screenPosition(p.modelPos.x, p.modelPos.y, p.modelPos.z);
    const d = dist(mouseX, mouseY, sp.x, sp.y);
    if (d < minDist) {
      minDist = d;
      closest = p;
    }
  });

  if (showCentroid) {
    drawCentroid();
  }

  // Disegna le coordinate del centroide sullo schermo
  push();
  fill(255);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text(`Centroide: 
    X: ${nf(centroid.x, 0, 2)}
    Y: ${nf(centroid.y, 0, 2)}
    Z: ${nf(centroid.z, 0, 2)}`, 10, 10);
  pop();
}

// Aggiungi questa funzione per l'interpolazione con easing
function easeInOutCubic(t) {
    return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function billboard(x, y, z) {
  const cam = createVector(camera.eyeX, camera.eyeY, camera.eyeZ);
  const obj = createVector(x, y, z);
  const dir = p5.Vector.sub(cam, obj);
  rotateY(atan2(dir.x, dir.z));
  rotateX(-atan2(dir.y, sqrt(dir.x * dir.x + dir.z * dir.z)));
}

function getSelectedClasses() {
    const selected = new Set();
    const opts = document.querySelectorAll('#classSelector .option.selected');
    opts.forEach(opt => selected.add(opt.dataset.class));
    return selected;
}

function populateClassSelector() {
    const sel = document.getElementById('classSelector');
    sel.innerHTML = '';
    
    // Ordina le classi alfabeticamente
    const sortedClasses = allClasses.sort((a, b) => a.localeCompare(b));
    
    // Dividi le classi in tre colonne
    const itemsPerColumn = Math.ceil(sortedClasses.length / 3);
    const columns = [
        document.createElement('div'),
        document.createElement('div'),
        document.createElement('div')
    ];

    columns.forEach(col => {
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
    });
    
    function addOptionWithDelay(option, column, index) {
        setTimeout(() => {
            const opt = document.createElement('div');
            opt.textContent = option;
            opt.dataset.class = option; // Aggiungi il data attribute
            opt.onclick = () => toggleSelection(option);
            opt.className = 'option';
            column.appendChild(opt);
            
            // Forza il reflow e aggiungi l'animazione
            void opt.offsetWidth;
            opt.classList.add('fade-in');
        }, index * 50);
    }
    
    // Popola le colonne
    sortedClasses.forEach((className, index) => {
        const columnIndex = Math.floor(index / itemsPerColumn);
        if (columnIndex < 3) {
            addOptionWithDelay(className, columns[columnIndex], index);
        }
    });
    
    // Crea un container per le colonne
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(3, 1fr)';
    container.style.gap = '40px';
    
    // Aggiungi le colonne al container
    columns.forEach(col => container.appendChild(col));
    
    // Aggiungi il container al selettore
    sel.appendChild(container);
}

// Aggiungi questa funzione per gestire la selezione
function toggleSelection(className) {
    const opt = document.querySelector(`#classSelector .option[data-class="${className}"]`);
    if (opt) {
        opt.classList.toggle('selected');
    }
}

function startAutoCycle() {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
  }

  const options = document.querySelectorAll('#classSelector .option');

  // Deseleziona tutte le classi attive all'inizio
  options.forEach(opt => opt.classList.remove('selected'));

  currentClassIndex = 0;

  autoCycleInterval = setInterval(() => {
    // Deseleziona la classe attuale (se esiste)
    if (currentClassIndex > 0) {
      const prevIndex = (currentClassIndex - 1 + options.length) % options.length;
      const prevOpt = options[prevIndex];
      prevOpt.classList.remove('selected');
    } else if (currentClassIndex === 0) {
      const lastOpt = options[options.length - 1];
      lastOpt.classList.remove('selected');
    }

    // Seleziona la nuova classe
    const currentOpt = options[currentClassIndex];
    currentOpt.classList.add('selected');

    // Aggiorna l'indice
    currentClassIndex = (currentClassIndex + 1) % options.length;
  }, 1000);
}


function stopAutoCycle() {
    if (autoCycleInterval) {
        clearInterval(autoCycleInterval);
        autoCycleInterval = null;
        
        // Deseleziona tutto alla fine
        const options = document.querySelectorAll('#classSelector .option');
        options.forEach(opt => {
            if (opt.classList.contains('selected')) {
                opt.classList.remove('selected');
                toggleSelection(opt.dataset.class);
            }
        });
        
        currentClassIndex = 0;
    }
}

function toggleAutoCycle() {
    const button = document.getElementById('cycleButton');
    
    if (!isAutoCycling) {
        startAutoCycle();
        button.textContent = 'ferma';
        button.classList.add('active'); // Aggiunge la classe che ferma l'animazione
    } else {
        stopAutoCycle();
        button.textContent = 'avvia';
        button.classList.remove('active'); // Rimuove la classe e riattiva l'animazione
    }
    isAutoCycling = !isAutoCycling;
}

// Aggiungi questa funzione dopo la funzione billboard()
function screenPosition(x, y, z) {
  // Creiamo un vettore con le coordinate 3D
  const pos = createVector(x, y, z);
  
  // Otteniamo la matrice di proiezione corrente
  const projection = ((window._renderer || {}).uMVMatrix || []);
  
  // Se non abbiamo una matrice di proiezione valida, restituiamo una posizione di default
  if (!projection.length) {
    return createVector(0, 0);
  }

  // Applichiamo la matrice di proiezione al punto
  const projected = screenXYZ(pos, projection);
  
  // Convertiamo le coordinate normalizzate in coordinate dello schermo
  return createVector(
    (projected.x + 1) * width/2,
    (projected.y + 1) * height/2
  );
}

function screenXYZ(pos, projection) {
  // Calcoliamo la proiezione del punto
  const x = pos.x * projection[0] + pos.y * projection[4] + pos.z * projection[8] + projection[12];
  const y = pos.x * projection[1] + pos.y * projection[5] + pos.z * projection[9] + projection[13];
  const w = pos.x * projection[3] + pos.y * projection[7] + pos.z * projection[11] + projection[15];

  // Normalizziamo le coordinate
  return createVector(x/w, y/w);
}

function mousePressed() {
  // Verifica che il mouse sia sul canvas
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
    isDragging = true;
    dragStartX = mouseX;
    dragStartY = mouseY;
    dragStartCameraX = currentX;
    dragStartCameraY = currentY;
  }
}

function mouseReleased() {
  isDragging = false;
}

function mouseDragged() {
  if (isDragging) {
    const dx = mouseX - dragStartX;
    const dy = mouseY - dragStartY;
    const moveScale = map(zoom, minZoom, maxZoom, 1, 4);
    
    // Calcola gli offset massimi basati sullo zoom
    const maxOffset = zoom * 0.5;
    
    // Aggiorna sia la posizione verticale che laterale
    targetY = constrain(
      dragStartCameraY - dy * moveScale,
      -maxOffset,
      maxOffset
    );
    
    targetX = constrain(
      dragStartCameraX + dx * moveScale,
      -maxOffset,
      maxOffset
    );
    
    return false;
  }
}

// Modifica anche la funzione mouseWheel per zoomare verso il centroide
function mouseWheel(event) {
  event.preventDefault();
  
  const zoomAmount = event.delta * zoomSpeed;
  const oldZoom = zoom;
  
  // Applica lo zoom con smorzamento
  zoom = constrain(zoom * (1 + zoomAmount), minZoom, maxZoom);
  
  // Mantieni la proporzione dell'offset verticale durante lo zoom
  const zoomRatio = zoom / oldZoom;
  currentY *= zoomRatio;
  targetY *= zoomRatio;
  
  return false;
}
// const minPlaneSize = 30;
// const maxPlaneSize = 100;

// Aggiungi questa funzione per calcolare le dimensioni del piano
function calculatePlaneSize(item, isSelected) {
  // Ottieni le dimensioni originali dell'immagine
  const aspectRatio = item.width / item.height;
  // Dimensione massima consentita
  const MAX_SIZE = 64;
  const MIN_SIZE = 32;
  // Dimensione base in base alla selezione
  const baseSize = isSelected ? MAX_SIZE : MIN_SIZE;
  
  let width, height;
  
  if (aspectRatio > 1) {
    // Immagine più larga che alta
    width = baseSize;
    height = width / aspectRatio;
  } else {
    // Immagine più alta che larga
    height = baseSize;
    width = height * aspectRatio;
  }
  
  return { width, height };
}

// Disegna il centroide
function drawCentroid() {
  push();
  translate(centroid.x + offsetX, centroid.y + offsetY, centroid.z + offsetZ);
  
  // Disegna una sfera rossa al centro
  stroke(255, 0, 0);
  fill(255, 0, 0);
  sphere(30);
  
  // Disegna gli assi X, Y, Z
  stroke(255, 0, 0); // Rosso per X
  line(0, 0, 0, 100, 0, 0);
  stroke(0, 255, 0); // Verde per Y
  line(0, 0, 0, 0, 100, 0);
  stroke(0, 0, 255); // Blu per Z
  line(0, 0, 0, 0, 0, 100);
  
  pop();
}

// Toggle per il centroide con il tasto 'c'
function keyPressed() {
  if (key === 'c' || key === 'C') {
    showCentroid = !showCentroid;
  }
}

// Modifica la funzione di caricamento per gestire entrambi i JSON
function loadData(isTimeViewMode = false) {
    isTimeView = isTimeViewMode;
    const jsonFile = isTimeView ? 
        'data_date_time_without_position.json' : 
        'image_mapping_with_atlas.json';

    return fetch(jsonFile)
        .then(response => response.json())
        .then(json => {
            if (isTimeView) {
                timeData = json;
                setupTimeControls();
            } else {
                data = json.mapping;
                setupSpatialControls();
            }
            computeCenter();
        })
        .catch(error => console.error('Errore caricamento JSON:', error));
}

// Aggiungi questa funzione per gestire i controlli temporali
function setupTimeControls() {
    const selector = document.getElementById('classSelector');
    selector.innerHTML = '';
    
    // Crea griglia per le ore
    const grid = document.createElement('div');
    grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 5px;
        padding: 5px;
    `;
    
    // Crea i bottoni per ogni ora
    for (let i = 0; i < 24; i++) {
        const btn = document.createElement('button');
        btn.textContent = `${i.toString().padStart(2, '0')}:00`;
        btn.className = 'class-button';
        btn.onclick = () => filterByHour(i);
        grid.appendChild(btn);
    }
    
    selector.appendChild(grid);
}

function filterByHour(hour) {
    selectedHour = selectedHour === hour ? null : hour;
    
    // Aggiorna UI
    document.querySelectorAll('.class-button').forEach(btn => {
        const btnHour = parseInt(btn.textContent);
        btn.classList.toggle('selected', btnHour === selectedHour);
    });
}