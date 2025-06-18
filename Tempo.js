let data;
let immagini = [];

let zoom = 1;
let dragX = 0;
let dragY = 0;

let oraCorrente = 0;
let playing = false;
let intervalloAnimazione;
let rotY = 0;
let cella = 100;

const MESI = 12;
const GIORNI = 31; // Modificato da 7 a 31 per mostrare tutti i giorni del mese
let ANNI;

let slider, oraDisplay; // rimosso playButton
let mostraTutto = false; // Aggiungi questa variabile all'inizio del file con le altre variabili globali

// Aggiungi una variabile per tracciare se il filtro temporale è attivo
let filtroTemporaleAttivo = false;

function preload() {
  data = loadJSON('data_date_time.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  const anni = new Set();

  Object.keys(data).forEach(k => {
    const item = data[k];
    const baseName = item.filename.replace(/^.*[\\\/]/, '').replace(/\.(jpg|jpeg)$/i, '');
    const dateObj = new Date(item.date);
    anni.add(dateObj.getFullYear());

    const pathJPG = `assets/images.copia/${baseName}.jpg`;
    const pathJPEG = `crops_64/${baseName}.jpeg`;

    function caricaImmagine(path, fallbackPath) {
      loadImage(path, img => {
        const i = new ImmagineSingola(
          `${baseName}.jpg`,
          img,
          img.width,
          img.height,
          item.date,
          item.time,
          getMese(item.date),
          getGiorno(item.date),
          getAnno(item.date)
        );
        immagini.push(i);
      }, () => {
        if (fallbackPath) {
          caricaImmagine(fallbackPath, null);
        } else {
          console.error("Immagine non trovata:", path);
        }
      });
    }

    caricaImmagine(pathJPG, pathJPEG);
  });

  ANNI = anni.size;

  document.body.style.cursor = 'grab';

  // Modifica lo stile dei controlli
  const controlsStyle = `
      position: fixed;
      top: 250px;
      left: 170px;
      transform: translateX(-50%);
      width: calc(100% - 10px);
      max-width: 300px;
      
      padding: 1px;
      border-radius: 4px;
      backdrop-filter: blur(8px);
      z-index: 1000;
      margin-top: 5px;
  `;

  // Aggiorna il container dei controlli
  const controls = createDiv('');
  controls.style(controlsStyle);
  controls.parent('filter'); // Aggiungi i controlli al div filter

  // Stile per lo slider
  slider = createSlider(0, 23, 0, 1);
  slider.style('width', '100%');
  slider.style('margin', '5px 0');
  slider.style('-webkit-appearance', 'none');
  slider.style('background', 'rgba(255,255,255,0.1)');
  slider.style('height', '2px');
  slider.style('outline', 'none');
  slider.parent(controls);
  
  // Stile per il display dell'ora
  oraDisplay = createDiv('');
  oraDisplay.style('color', '#ffffff');
  oraDisplay.style('font-family', 'monospace');
  oraDisplay.style('font-size', '12px');
  oraDisplay.style('text-align', 'left');
  oraDisplay.style('margin', '5px 0');
  oraDisplay.style('display', 'flex');
  oraDisplay.style('justify-content', 'space-between');
  oraDisplay.parent(controls);

  // Aggiungi l'event listener al bottone Avvia esistente
  const avviaButton = document.querySelector('#avviaButton'); // assumi che il bottone abbia questo id
  if (avviaButton) {
      avviaButton.addEventListener('click', togglePlay);
  }

  // Personalizza lo stile dello slider
  const sliderStyles = `
      input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
      }
      input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
      }
  `;

  const styleSheet = document.createElement('style');
  styleSheet.textContent = sliderStyles;
  document.head.appendChild(styleSheet);

  // Aggiorna anche l'event listener dello slider
  slider.input(() => {
    filtroTemporaleAttivo = true; // Attiva il filtro quando si usa lo slider
    oraCorrente = parseInt(slider.value());
    updateOraDisplay();
  });
}

// Modifica la funzione togglePlay per usare il bottone Avvia
function togglePlay() {
    playing = !playing;
    filtroTemporaleAttivo = playing; // Attiva il filtro quando parte l'animazione
    const avviaButton = document.querySelector('#avviaButton');
    
    if (playing) {
        intervalloAnimazione = setInterval(() => {
            oraCorrente = (oraCorrente + 1) % 24;
            slider.value(oraCorrente);
            updateOraDisplay();
        }, 500);
        if (avviaButton) avviaButton.textContent = "Pausa";
    } else {
        clearInterval(intervalloAnimazione);
        if (avviaButton) avviaButton.textContent = "Avvia";
    }
}

// Aggiungi questa funzione per contare le immagini attive
function contaImmaginiAttive(ora) {
    return immagini.filter(img => img.ora === ora).length;
}

// Modifica la funzione updateOraDisplay
function updateOraDisplay() {
    const numeroImmagini = contaImmaginiAttive(oraCorrente);
    oraDisplay.html(`${oraCorrente.toString().padStart(2, '0')}:00 | ${numeroImmagini} immagini`);
}

function draw() {
  background(0);
  scale(zoom);
  translate(dragX, dragY, 0);

  rotY += 0.002;
  rotateY(rotY);

  const cellaX = cella;
  const cellaY = cella * 0.5; // Riduci la spaziatura verticale per accomodare più giorni
  const cellaZ = cella;

  const offsX = -MESI * cellaX / 2;
  const offsY = -GIORNI * cellaY / 2; // Usa il nuovo valore GIORNI
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
  return new Date(data).getDate(); // Usa getDate() invece di getDay()
}

function getAnno(data) {
  return new Date(data).getFullYear();
}

function getOra(timeString) {
  return parseInt(timeString.split(':')[0]);
}

class ImmagineSingola {
  constructor(filename, img, w, h, date, time, mese, giorno, anno) {
    this.filename = filename;
    this.img = img;
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

    // Mostra l'immagine se:
    // - il filtro temporale non è attivo (mostra tutte), OPPURE
    // - l'immagine è attiva per l'ora corrente, OPPURE
    // - mostraTutto è attivo
    if (!filtroTemporaleAttivo || attiva || mostraTutto) {
      push();
      translate(x, y, z);
      rotateY(-rotY);
      texture(this.img);
      plane(this.w, this.h);
      pop();
    }
  }
}

// Aggiungi questa funzione per il toggle di mostraTutto
function toggleMostraTutto() {
    mostraTutto = !mostraTutto;
    const mostraTuttoButton = document.querySelector('#mostraTuttoButton');
    if (mostraTuttoButton) {
        mostraTuttoButton.classList.toggle('active');
        mostraTuttoButton.textContent = mostraTutto ? "Nascondi" : "Mostra tutto";
    }
}
