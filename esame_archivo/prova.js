let data;
let immagini = [];

let zoom = 1;
let dragX = 0;
let dragY = 0;

let sequenzaPerOra = Array.from({ length: 24 }, () => []);
let oraCorrente = 0;
let playing = false;
let intervalloAnimazione;
let rotY = 0;
let cella = 100;

// Cubo 10x10xN
const nX = 10;
const nY = 10;
let nZ;

const MESI = 12;
const GIORNI = 7;
let ANNI;  // sarà calcolato in base ai dati

let slider, playButton, oraDisplay;

function preload() {
  data = loadJSON('data_date_time.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  // Tieni traccia degli anni unici
  const anni = new Set();

  // Caricamento immagini
  Object.keys(data).forEach(k => {
    const item = data[k];
    const baseName = item.filename.replace(/\.(jpg|jpeg)$/i, '');
    // Cambio il nome della variabile da 'data' a 'dateObj'
    const dateObj = new Date(item.date);
    anni.add(dateObj.getFullYear());

    const pathJPG = `crops_64/${baseName}.jpg`;
    const pathJPEG = `crops_64/${baseName}.jpeg`;

    loadImage(
      pathJPG,
      img => {
        const i = new ImmagineSingola(
          `${baseName}.jpg`, 
          img, 
          img.width,  // passa la larghezza originale
          img.height, // passa l'altezza originale
          item.date, 
          item.time,
          getMese(item.date),
          getGiorno(item.date),
          getAnno(item.date)
        );
        immagini.push(i);
      },
      () => {
        loadImage(
          pathJPEG,
          img => {
            const i = new ImmagineSingola(
              `${baseName}.jpeg`, 
              img, 
              64, 
              64, 
              item.date, 
              item.time,
              getMese(item.date),
              getGiorno(item.date),
              getAnno(item.date)
            );
            immagini.push(i);
          },
          () => console.error("Immagine non trovata:", pathJPG, "né", pathJPEG)
        );
      }
    );
  });

  ANNI = anni.size;

  document.body.style.cursor = 'grab';

  // Slider
  slider = createSlider(0, 23, 0, 1);
  slider.position(20, 100);
  slider.style('width', '200px');
  slider.input(() => {
    oraCorrente = slider.value();
    updateOraDisplay();
  });

  // Display ora
  oraDisplay = createDiv(`Ora attuale: ${oraCorrente.toString().padStart(2, '0')}:00`);
  oraDisplay.id("oraDisplay");
  oraDisplay.style("color", "white");
  oraDisplay.position(20, 60);

  // Pulsante play
  playButton = createButton("Avvia riproduzione");
  playButton.position(240, 100);
  playButton.mousePressed(togglePlay);
}

function togglePlay() {
  playing = !playing;
  if (playing) {
    intervalloAnimazione = setInterval(() => {
      oraCorrente = (oraCorrente + 1) % 24;
      slider.value(oraCorrente);
      updateOraDisplay();
    }, 500);
    playButton.html("Pausa");
  } else {
    clearInterval(intervalloAnimazione);
    playButton.html("Avvia riproduzione");
  }
}

function updateOraDisplay() {
  oraDisplay.html(`Ora attuale: ${oraCorrente.toString().padStart(2, '0')}:00`);
}

function draw() {
  background(0);
  scale(zoom);
  translate(dragX, dragY, 0);

  rotY += 0.002;
  rotateY(rotY);

  const cellaX = cella;
  const cellaY = cella;
  const cellaZ = cella;

  const offsX = -MESI * cellaX / 2;
  const offsY = -GIORNI * cellaY / 2;
  const offsZ = -ANNI * cellaZ / 2;

  immagini.forEach(img => {
    if (!img.img || !img.img.width) return;

    const x = img.mese * cellaX + offsX;
    const y = img.giorno * cellaY + offsY;
    const z = (img.anno - getAnno(immagini[0].date)) * cellaZ + offsZ;

    img.emetti(x, y, z, img.ora === oraCorrente);
  });
}

function mousePressed() {
  document.body.style.cursor = 'grabbing';
}

function mouseReleased() {
  document.body.style.cursor = 'grab';
}

function mouseDragged() {
  dragX += (mouseX - pmouseX) / zoom;
  dragY += (mouseY - pmouseY) / zoom;
}

function mouseWheel(event) {
  const worldX = (mouseX - width / 2) / zoom - dragX;
  const worldY = (mouseY - height / 2) / zoom - dragY;

  zoom += event.deltaY * 0.01;
  zoom = constrain(zoom, 0.1, 10);

  const newWorldX = (mouseX - width / 2) / zoom - dragX;
  const newWorldY = (mouseY - height / 2) / zoom - dragY;

  dragX += newWorldX - worldX;
  dragY += newWorldY - worldY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === '+') {
    cella += 10;
    console.log("Distanza aumentata:", cella);
  }
  if (key === '-') {
    cella = max(10, cella - 10);
    console.log("Distanza diminuita:", cella);
  }
}

function getMese(data) {
  return new Date(data).getMonth();
}

function getGiorno(data) {
  return new Date(data).getDay();
}

function getAnno(data) {
  return new Date(data).getFullYear();
}

// Aggiungi questa funzione helper per estrarre l'ora
function getOra(timeString) {
  return parseInt(timeString.split(':')[0]);
}

class ImmagineSingola {
  constructor(filename, img, w, h, date, time, mese, giorno, anno) {
    this.filename = filename;
    this.img = img;
    // Calcola l'aspect ratio corretto
    const aspectRatio = img.width / img.height;
    const baseSize = 64;
    this.w = baseSize * aspectRatio;
    this.h = baseSize;
    this.date = date;
    this.time = time;
    this.mese = mese;
    this.giorno = giorno;
    this.anno = anno;
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.ora = getOra(time);
  }

  emetti(x, y, z, attiva = false) {
    if (!this.img || !this.img.width) return;
    this.x = x;
    this.y = y;
    this.z = z;

    if (this.ora === oraCorrente) {
      push();
      translate(x, y, z);
      rotateY(-rotY);
      texture(this.img);
      // Usa le dimensioni calcolate che mantengono l'aspect ratio
      plane(this.w, this.h);
      pop();
    }
  }
}
