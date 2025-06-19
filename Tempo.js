// === Variabili globali ===
let data;
let immagini = [];

let zoom = 1;
let dragX = 0;
let dragY = 0;

let oraCorrente = 0;
let meseCorrente = 0;
let giornoCorrente = 0;
let annoCorrente = 0;
let playing = false;
let intervalloAnimazione;
let rotY = 0;
let cella = 100;

const MESI = 12;
const GIORNI = 31;
let ANNI;

let slider, oraDisplay;
let mostraTutto = false;
let filtroTemporaleAttivo = false;

let filtriMese = Array(12).fill(true);
let filtriGiornoSettimana = Array(7).fill(true);
let filtriAnno = {};

let categoriaAttiva = 'ore';

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

    const pathJPG = `assets/images_copia/${baseName}.jpg`;
    const pathJPEG = `assets/images_copia/${baseName}.jpeg`;

    function caricaImmagine(path, fallbackPath) {
      loadImage(path, img => {
        immagini.push(new ImmagineSingola(
          `${baseName}.jpg`, img, img.width, img.height, item.date,
          item.time, getMese(item.date), getGiorno(item.date), getAnno(item.date)
        ));
      }, () => {
        if (fallbackPath) caricaImmagine(fallbackPath, null);
        else console.error("Immagine non trovata:", path);
      });
    }
    caricaImmagine(pathJPG, pathJPEG);
  });

  ANNI = anni.size;
  anni.forEach(a => filtriAnno[a] = true);

  document.body.style.cursor = 'grab';

  const controls = createDiv('').parent('filter');
  slider = createSlider(0, 23, 0, 1).style('width', '100%').parent(controls);
  oraDisplay = createDiv('').style('color', '#fff').parent(controls);

  const avviaButton = document.querySelector('#avviaButton');
  if (avviaButton) avviaButton.addEventListener('click', () => {
    playing = !playing;
    if (playing) {
      clearInterval(intervalloAnimazione);
      let maxVal = 23;
      let updateFn = () => { oraCorrente = step; slider.value(step); updateOraDisplay(); };

      if (categoriaAttiva === 'mesi') {
        maxVal = 11;
        updateFn = () => { meseCorrente = step; oraDisplay.html(`mese: ${meseCorrente}`); };
      } else if (categoriaAttiva === 'giorni') {
        maxVal = 6;
        updateFn = () => { giornoCorrente = step; oraDisplay.html(`giorno: ${giornoCorrente}`); };
      } else if (categoriaAttiva === 'anni') {
        maxVal = Object.keys(filtriAnno).length - 1;
        const anniArray = Object.keys(filtriAnno);
        updateFn = () => { annoCorrente = anniArray[step]; oraDisplay.html(`anno: ${annoCorrente}`); };
      }

      let step = 0;
      intervalloAnimazione = setInterval(() => {
        updateFn();
        step = (step + 1) % (maxVal + 1);
      }, 1000);
    } else {
      clearInterval(intervalloAnimazione);
    }
  });

  slider.input(() => {
    filtroTemporaleAttivo = true;
    oraCorrente = parseInt(slider.value());
    updateOraDisplay();
  });

  const filtroWrapper = createDiv('').parent('filter').style('display', 'flex').style('flex-direction', 'column');

  // [anni]
  const labelAnni = createDiv('[anni]').parent(filtroWrapper).style('color', '#fff').style('cursor', 'pointer');
  labelAnni.mousePressed(() => categoriaAttiva = 'anni');
  const rigaAnni = createDiv('').parent(filtroWrapper).style('display', 'flex').style('flex-wrap', 'wrap').style('flex-direction', 'row').style('gap', '0');
  let index = 0;
  Object.keys(filtriAnno).forEach((anno, i) => {
    const btn = createDiv(anno);
    btn.class('option');
    btn.mousePressed(() => {
      filtriAnno[anno] = !filtriAnno[anno];
      btn.classList.toggle('selected');
    });
    setTimeout(() => {
      rigaAnni.child(btn);
      void btn.elt.offsetWidth;
      btn.addClass('fade-in');
    }, i * 100);
  });

  const filtroContainer = createDiv('').parent(filtroWrapper).style('display', 'flex').style('gap', '40px');

  // [ore]
  const labelOre = createDiv('[ore]').parent(filtroContainer).style('color', '#fff').style('cursor', 'pointer');
  labelOre.mousePressed(() => categoriaAttiva = 'ore');
  creaFiltroColonna(Array.from({length: 24}, (_, i) => i), filtroContainer, (val, btn) => {
    filtroTemporaleAttivo = true;
    oraCorrente = val;
    slider.value(val);
    updateOraDisplay();
  }, 2);

  // [mesi]
  const labelMesi = createDiv('[mesi]').parent(filtroContainer).style('color', '#fff').style('cursor', 'pointer');
  labelMesi.mousePressed(() => categoriaAttiva = 'mesi');
  creaFiltroColonna([
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
  ], filtroContainer, (nome, btn) => {
    const index = [
      "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
      "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    ].indexOf(nome);
    filtriMese[index] = !filtriMese[index];
    btn.classList.toggle('selected');
  }, 1);

  // [giorni]
  const labelGiorni = createDiv('[giorni]').parent(filtroContainer).style('color', '#fff').style('cursor', 'pointer');
  labelGiorni.mousePressed(() => categoriaAttiva = 'giorni');
  creaFiltroColonna([
    "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"
  ], filtroContainer, (nome, btn) => {
    const index = [
      "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"
    ].indexOf(nome);
    filtriGiornoSettimana[index] = !filtriGiornoSettimana[index];
    btn.classList.toggle('selected');
  }, 1);
}

function creaFiltroColonna(valori, container, onClickFn, colonne = 1) {
  const itemsPerCol = Math.ceil(valori.length / colonne);
  const cols = [];
  for (let c = 0; c < colonne; c++) {
    const col = createDiv('').style('display', 'flex').style('flex-direction', 'column').style('gap', '2px').parent(container);
    cols.push(col);
  }
  valori.forEach((val, i) => {
    const btn = createDiv(val.toString());
    btn.class('option');
    btn.mousePressed(() => onClickFn(val, btn));
    setTimeout(() => {
      cols[Math.floor(i / itemsPerCol)].child(btn);
      void btn.elt.offsetWidth;
      btn.addClass('fade-in');
    }, i * 100);
  });
}

function updateOraDisplay() {
  oraDisplay.html(`ora: ${oraCorrente}`);
}


function creaFiltroColonna(valori, container, onClickFn, colonne = 1) {
  const itemsPerCol = Math.ceil(valori.length / colonne);
  const cols = [];
  for (let c = 0; c < colonne; c++) {
    const col = createDiv('').style('display', 'flex').style('flex-direction', 'column').style('gap', '2px').parent(container);
    cols.push(col);
  }
  valori.forEach((val, i) => {
    const btn = createDiv(val.toString());
    btn.class('option');
    btn.mousePressed(() => onClickFn(val, btn));
    setTimeout(() => {
      cols[Math.floor(i / itemsPerCol)].child(btn);
      void btn.elt.offsetWidth;
      btn.addClass('fade-in');
    }, i * 100);
  });
}

function togglePlay() {
  playing = !playing;
  filtroTemporaleAttivo = playing;
  const avviaButton = document.querySelector('#avviaButton');
  if (playing) {
    intervalloAnimazione = setInterval(() => {
      oraCorrente = (oraCorrente + 1) % 24;
      slider.value(oraCorrente);
      updateOraDisplay();
    }, 1000);
    if (avviaButton) {
      avviaButton.textContent = "Pausa";
      avviaButton.classList.add('active');
    }
  } else {
    clearInterval(intervalloAnimazione);
    if (avviaButton) {
      avviaButton.textContent = "Avvia";
      avviaButton.classList.remove('active');
    }
  }
}

function contaImmaginiAttive(ora) {
  return immagini.filter(img => img.ora === ora).length;
}

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
  const cellaY = cella * 0.5;
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
  zoom += event.deltaY * 0.01;
  zoom = constrain(zoom, 0.1, 10);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === '+') cella += 10;
  if (key === '-') cella = max(10, cella - 10);
}

function getMese(data) {
  return new Date(data).getMonth();
}

function getGiorno(data) {
  return new Date(data).getDate();
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
    const giornoSettimana = new Date(this.date).getDay();
    const giornoSettimanaIndex = (giornoSettimana + 6) % 7;
    if (
      (!filtroTemporaleAttivo || attiva || mostraTutto) &&
      filtriMese[this.mese] &&
      filtriGiornoSettimana[giornoSettimanaIndex] &&
      filtriAnno[this.anno]
    ) {
      push();
      translate(x, y, z);
      rotateY(-rotY);
      texture(this.img);
      plane(this.w, this.h);
      pop();
    }
  }
}
