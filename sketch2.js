let rawData, data = [];
let atlasImg;
let center = { x: 0, y: 0, z: 0 };
let camera, angle = 0;
let isAutoCycling = false;
let currentClassIndex = 0;
let autoCycleInterval = null;
let allClasses = [];
let projectedData = [];

const scaleX = -1000, scaleY = -1000, scaleZ = -1000;
const offsetX = 0, offsetY = -100, offsetZ = -200;

let zoom = 800;  // valore iniziale dello zoom
const minZoom = 40;  // zoom massimo (più vicino) aumentato per evitare zoom eccessivo
const maxZoom = 2000; // zoom minimo (più lontano)
const zoomSpeed = 0.02; // velocità dello zoom ridotta significativamente
const lerpFactor = 0.05; // interpolazione graduale

// Aggiungi queste variabili globali all'inizio del file
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;

let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCameraX = 0;
let dragStartCameraY = 0;

let objModel;
let isModelLoaded = false;
let loadingProgress = 0;
let modelRotation = 0;
let fadeOut = 255;


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

function computeCenter() {
  let sx = 0, sy = 0, sz = 0;
  data.forEach(i => {
    sx += i.position[0];
    sy += i.position[1];
    sz += i.position[2];
  });
  center = { x: sx / data.length, y: sy / data.length, z: sz / data.length };
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  camera = createCamera();
  camera.setPosition(0, 0, 800);
  
  // Verifica che i dati siano caricati correttamente
  if (!data || !data.length) {
    console.error('Dati non caricati correttamente');
    return;
  }
  
  if (!atlasImg || !atlasImg.width) {
    console.error('Atlas non caricato correttamente');
    return;
  }
}

function draw() {
  background(0);

  angle += 0.003;

  // Interpola la posizione corrente verso il target
  currentX = lerp(currentX, targetX, lerpFactor);
  currentY = lerp(currentY, targetY, lerpFactor);

  // Calcola la posizione della camera con movimento smorzato
  const camX = zoom * cos(angle) + currentX;
  const camZ = zoom * sin(angle) + currentY;
  const camY = currentY;

  camera.setPosition(camX, camY, camZ);
  camera.lookAt(currentX, currentY, 0);

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
  if (mouseButton === LEFT) {
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
    // Usa solo il movimento verticale (dy)
    const dy = mouseY - dragStartY;
    
    // Movimento più sensibile quando si è zoomati
    const moveScale = map(zoom, minZoom, maxZoom, 0.5, 2);
    
    // Aggiorna solo la coordinata Y, mantieni X invariata
    targetY = dragStartCameraY - dy * moveScale;
    
    return false;
  }
}

// Modifica anche la funzione mouseWheel per mantenere solo il movimento verticale
function mouseWheel(event) {
  const oldZoom = zoom;
  const zoomAmount = event.delta * zoomSpeed;
  zoom = constrain(zoom * (1 + zoomAmount), minZoom, maxZoom);
  
  const zoomRatio = zoom / oldZoom;
  
  // Aggiorna solo la coordinata Y durante lo zoom
  targetY = currentY * zoomRatio;
  currentY *= zoomRatio;
  
  // Mantieni X a 0
  targetX = 0;
  currentX = 0;
  
  return false;
}

// Rimuovi le costanti per le dimensioni fisse
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
