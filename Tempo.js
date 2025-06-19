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
let intervalloAnimazione = null;
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

// Aggiungi queste variabili globali all'inizio del file
let isAutoCycling = false;
let categoriaCycleInterval = null;
let immaginiFiltrate = [];

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

  // Crea i bottoni se non esistono
  if (!select('#avviaButton')) {
      const playBtn = createButton('Avvia');
      playBtn.id('avviaButton');
      playBtn.mousePressed(togglePlay);
  }
  
  if (!select('#toggleCycleBtn')) {
      const cycleBtn = createButton('Ciclo Automatico');
      cycleBtn.id('toggleCycleBtn');
      cycleBtn.mousePressed(toggleAutoCycle);
  }

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

  setupFilters();
}

function setupFilters() {
    const filterDiv = select('#filter');
    if (!filterDiv) {
        console.error('Elemento #filter non trovato');
        return;
    }

    const filterContainer = createDiv('');
    filterContainer.class('filter-container');
    filterContainer.parent(filterDiv);

    // Ordine: Anni -> Mesi -> Giorni -> Ore
    
    // Setup Anni
    const anniGroup = createFilterGroup('anni', Object.keys(filtriAnno).sort());
    anniGroup.parent(filterContainer);
    
    // Setup Mesi
    const mesiGroup = createFilterGroup('mesi', [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 
        'Maggio', 'Giugno', 'Luglio', 'Agosto',
        'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ]);
    mesiGroup.parent(filterContainer);
    
    // Setup Giorni
    const giorniGroup = createFilterGroup('giorni', [
        'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 
        'Venerdì', 'Sabato', 'Domenica'
    ]);
    giorniGroup.parent(filterContainer);
    
    // Setup Ore
    const oreArray = Array.from({length: 24}, (_, i) => 
        i.toString().padStart(2, '0') + ':00'
    );
    const oreGroup = createFilterGroup('ore', oreArray);
    oreGroup.parent(filterContainer);

    // Aggiungi i titoli delle sezioni
    const titles = ['[anni]', '[mesi]', '[giorni]', '[ore]'];
    selectAll('.filter-group').forEach((group, i) => {
        const title = createDiv(titles[i]);
        title.class('category-title');
        title.parent(group);
        title.style('margin-bottom', '10px');
    });
}

function togglePlay() {
    playing = !playing;
    
    const playButton = select('#avviaButton');
    if (playButton) {
        playButton.html(playing ? 'Pausa' : 'Avvia');
    }
    
    if (playing) {
        clearInterval(intervalloAnimazione);
        
        switch(categoriaAttiva) {
            case 'ore':
                intervalloAnimazione = setInterval(() => {
                    oraCorrente = (oraCorrente + 1) % 24;
                    updateVisualizzazione();
                }, 1000);
                break;
                
            case 'giorni':
                intervalloAnimazione = setInterval(() => {
                    filtriGiornoSettimana.fill(false);
                    giornoCorrente = (giornoCorrente + 1) % 7;
                    filtriGiornoSettimana[giornoCorrente] = true;
                    updateVisualizzazione();
                }, 1000);
                break;
                
            case 'mesi':
                intervalloAnimazione = setInterval(() => {
                    filtriMese.fill(false);
                    meseCorrente = (meseCorrente + 1) % 12;
                    filtriMese[meseCorrente] = true;
                    updateVisualizzazione();
                }, 1000);
                break;
                
            case 'anni':
                const anni = Object.keys(filtriAnno).sort();
                let annoIndex = anni.indexOf(annoCorrente.toString());
                if (annoIndex === -1) annoIndex = 0;
                
                intervalloAnimazione = setInterval(() => {
                    Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
                    annoIndex = (annoIndex + 1) % anni.length;
                    annoCorrente = parseInt(anni[annoIndex]);
                    filtriAnno[anni[annoIndex]] = true;
                    updateVisualizzazione();
                }, 1000);
                break;
        }
    } else {
        clearInterval(intervalloAnimazione);
    }
}

function toggleAutoCycle() {
    isAutoCycling = !isAutoCycling;
    const cycleButton = select('#toggleCycleBtn');
    
    if (isAutoCycling) {
        cycleButton.html('Ferma Ciclo');
        
        // Modifica l'array delle categorie per l'ordine corretto
        const categorie = ['anni', 'mesi', 'giorni', 'ore'];
        let indiceCategoriaAttuale = categorie.indexOf(categoriaAttiva);
        if (indiceCategoriaAttuale === -1) indiceCategoriaAttuale = 0;
        
        function cambiaCategoriaEAvvia() {
            if (playing) {
                togglePlay();
            }
            
            categoriaAttiva = categorie[indiceCategoriaAttuale];
            
            selectAll('.filter-title').forEach(t => t.removeClass('active'));
            select(`#title-${categoriaAttiva}`).addClass('active');
            
            resetFiltri(categoriaAttiva);
            
            if (!playing) {
                togglePlay();
            }
            
            indiceCategoriaAttuale = (indiceCategoriaAttuale + 1) % categorie.length;
        }
        
        cambiaCategoriaEAvvia();
        categoriaCycleInterval = setInterval(cambiaCategoriaEAvvia, 10000);
        
    } else {
        cycleButton.html('Ciclo Automatico');
        clearInterval(categoriaCycleInterval);
        
        if (playing) {
            togglePlay();
        }
    }
}

// Funzione di supporto per resettare i filtri
function resetFiltri(categoria) {
    switch(categoria) {
        case 'ore':
            oraCorrente = 0;
            break;
        case 'giorni':
            filtriGiornoSettimana.fill(false);
            giornoCorrente = 0;
            filtriGiornoSettimana[giornoCorrente] = true;
            break;
        case 'mesi':
            filtriMese.fill(false);
            meseCorrente = 0;
            filtriMese[meseCorrente] = true;
            break;
        case 'anni':
            const anni = Object.keys(filtriAnno).sort();
            Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
            filtriAnno[anni[0]] = true;
            break;
    }
    updateVisualizzazione();
}

function aggiornaFiltriGiorni() {
    // Resetta tutti i filtri giorni
    filtriGiornoSettimana.fill(false);
    // Attiva solo il giorno corrente
    filtriGiornoSettimana[giornoCorrente] = true;
    
    // Aggiorna visivamente i bottoni
    const giorniGroup = select('#giorni-group');
    if (giorniGroup) {
        giorniGroup.selectAll('.filter-option').forEach((btn, index) => {
            btn.toggleClass('selected', index === giornoCorrente);
        });
    }
    
    updateVisualizzazione();
}

function aggiornaFiltriMesi() {
    // Resetta tutti i filtri mesi
    filtriMese.fill(false);
    // Attiva solo il mese corrente
    filtriMese[meseCorrente] = true;
    
    // Aggiorna visivamente i bottoni
    const mesiGroup = select('#mesi-group');
    if (mesiGroup) {
        mesiGroup.selectAll('.filter-option').forEach((btn, index) => {
            btn.toggleClass('selected', index === meseCorrente);
        });
    }
    
    updateVisualizzazione();
}

function updateFiltriOre(ora) {
    // Reset tutti i filtri ore
    select('.filter-options').selectAll('.filter-option').forEach(btn => {
        btn.removeClass('selected');
    });
    // Seleziona l'ora corrente
    select(`.filter-option[data-value="${ora}"]`).addClass('selected');
    updateVisualizzazione();
}

function updateFiltriGiorni(giorno) {
    filtriGiornoSettimana.fill(false);
    filtriGiornoSettimana[giorno] = true;
    updateFiltriVisual('giorni', giorno);
    updateVisualizzazione();
}

function updateFiltriMesi(mese) {
    filtriMese.fill(false);
    filtriMese[mese] = true;
    updateFiltriVisual('mesi', mese);
    updateVisualizzazione();
}

function updateFiltriAnni(anno) {
    Object.keys(filtriAnno).forEach(a => filtriAnno[a] = (parseInt(a) === anno));
    updateFiltriVisual('anni', anno);
    updateVisualizzazione();
}

function updateFiltriVisual(categoria, valore) {
    // Aggiorna l'aspetto visivo dei filtri
    select(`#${categoria}-group`).selectAll('.filter-option').forEach(btn => {
        const val = btn.attribute('data-value');
        btn.toggleClass('selected', val == valore);
    });
}

function createFilterGroup(name, options) {
    const group = createDiv('');
    group.class('filter-group');
    group.id(`${name}-group`);

    // Titolo categoria come bottone
    const title = createButton(`[${name}]`);
    title.class('filter-title');
    title.id(`title-${name}`);
    if (categoriaAttiva === name) {
        title.addClass('active');
    }
    
    title.mousePressed(() => {
        categoriaAttiva = name;
        
        // Aggiorna lo stato visivo dei titoli
        selectAll('.filter-title').forEach(t => {
            t.removeClass('active');
        });
        title.addClass('active');
        
        // Reset animazione se in corso
        if (playing) {
            togglePlay();
        }
        
        updateVisualizzazione();
    });
    title.parent(group);

    // Contenitore opzioni
    const optionsDiv = createDiv('');
    optionsDiv.class('filter-options');
    optionsDiv.parent(group);

    options.forEach((option, index) => {
        const btn = createDiv(option);
        btn.class('filter-option');
        btn.attribute('data-value', option);
        
        btn.parent(optionsDiv);
        btn.mousePressed(() => {
            if (!playing) {
                switch(name) {
                    case 'ore':
                        // Aggiorna oraCorrente e forza l'aggiornamento
                        oraCorrente = index;
                        selectAll('#ore-group .filter-option').forEach(b => {
                            b.removeClass('selected');
                        });
                        btn.addClass('selected');
                        break;
                    // ... altri casi invariati ...
                }
                updateVisualizzazione();
            }
        });
    });

    return group;
}

function createFilterUI() {
    const filterContainer = createDiv('');
    filterContainer.class('filter-container');

    // Anni
    const anniOptions = Object.keys(filtriAnno).sort();
    const anniGroup = createFilterGroup('anni', anniOptions);
    anniGroup.parent(filterContainer);

    // Mesi
    const mesiOptions = [
        'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
        'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];
    const mesiGroup = createFilterGroup('mesi', mesiOptions);
    mesiGroup.parent(filterContainer);

    // Giorni
    const giorniOptions = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const giorniGroup = createFilterGroup('giorni', giorniOptions);
    giorniGroup.parent(filterContainer);

    // Ore
    const oreOptions = Array.from({length: 24}, (_, i) => 
        i.toString().padStart(2, '0') + ':00'
    );
    const oreGroup = createFilterGroup('ore', oreOptions);
    oreGroup.parent(filterContainer);

    return filterContainer;
}

// Aggiungi questa funzione per gestire lo stato visivo dei bottoni
function aggiornaStatoVisivoPulsanti() {
    // Resetta tutti i titoli delle categorie
    selectAll('.filter-title').forEach(t => {
        t.style('background', 'transparent');
        t.style('color', '#fff');
    });

    // Evidenzia il titolo della categoria attiva
    const titoloAttivo = select(`#title-${categoriaAttiva}`);
    if (titoloAttivo) {
        titoloAttivo.style('background', '#fff');
        titoloAttivo.style('color', '#000');
    }

    // Aggiorna lo stato visivo dei pulsanti in base alla categoria
    switch(categoriaAttiva) {
        case 'ore':
            selectAll('#ore-group .filter-option').forEach((btn, i) => {
                btn.style('background', i === oraCorrente ? '#fff' : 'transparent');
                btn.style('color', i === oraCorrente ? '#000' : '#fff');
            });
            break;

        case 'giorni':
            selectAll('#giorni-group .filter-option').forEach((btn, i) => {
                btn.style('background', filtriGiornoSettimana[i] ? '#fff' : 'transparent');
                btn.style('color', filtriGiornoSettimana[i] ? '#000' : '#fff');
            });
            break;

        case 'mesi':
            selectAll('#mesi-group .filter-option').forEach((btn, i) => {
                btn.style('background', filtriMese[i] ? '#fff' : 'transparent');
                btn.style('color', filtriMese[i] ? '#000' : '#fff');
            });
            break;

        case 'anni':
            selectAll('#anni-group .filter-option').forEach(btn => {
                const anno = btn.html();
                btn.style('background', filtriAnno[anno] ? '#fff' : 'transparent');
                btn.style('color', filtriAnno[anno] ? '#000' : '#fff');
            });
            break;
    }
}

// Aggiungi questa funzione per aggiornare il display dell'ora
function updateOraDisplay() {
    selectAll('#ore-group .filter-option').forEach((btn, i) => {
        btn.toggleClass('selected', i === oraCorrente);
    });
    updateVisualizzazione();
}

// Aggiungi questa funzione per filtrare le immagini
function filtraImmagini() {
    // Filtra le immagini in base alla categoria attiva
    immaginiFiltrate = immagini.filter(img => shouldShowImage(img));
    
    // Aggiorna il contatore
    const contatoreElement = select('#contatore');
    if (contatoreElement) {
        let testo = '';
        switch (categoriaAttiva) {
            case 'ore':
                testo = `${oraCorrente.toString().padStart(2, '0')}:00`;
                break;
            case 'giorni':
                const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
                const giorniAttivi = giorni.filter((_, i) => filtriGiornoSettimana[i]);
                testo = giorniAttivi.join(', ') || 'Tutti i giorni';
                break;
            case 'mesi':
                const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                const mesiAttivi = mesi.filter((_, i) => filtriMese[i]);
                testo = mesiAttivi.join(', ') || 'Tutti i mesi';
                break;
            case 'anni':
                const anniAttivi = Object.keys(filtriAnno).filter(anno => filtriAnno[anno]);
                testo = anniAttivi.join(', ') || 'Tutti gli anni';
                break;
        }
        contatoreElement.html(`${testo} | ${immaginiFiltrate.length} immagini`);
    }
    
    // Forza il ridisegno
    redraw();
}

// Modifica la funzione updateVisualizzazione per usare filtraImmagini
function updateVisualizzazione() {
    // Prima filtra le immagini
    filtraImmagini();
    // Poi aggiorna lo stato visivo dei pulsanti
    aggiornaStatoVisivoPulsanti();
    // Forza il ridisegno
    redraw();
}

// Modifica la funzione draw per usare immaginiFiltrate
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

    // Usa immaginiFiltrate invece di filtrare qui
    immaginiFiltrate.forEach(img => {
        if (!img.img || !img.img.width) return;

        const x = img.mese * cellaX + offsX;
        const y = img.giorno * cellaY + offsY;
        const z = (img.anno - getAnno(immagini[0].date)) * cellaZ + offsZ;
        
        img.emetti(x, y, z, true);
    });

    // Se non ci sono immagini visibili, mostra un messaggio
    if (immagini.filter(img => shouldShowImage(img)).length === 0) {
      push();
      translate(0, 0, 0);
      rotateY(-rotY);
      fill(255);
      textSize(24);
      textAlign(CENTER, CENTER);
      text("Nessuna immagine corrisponde ai filtri selezionati", 0, 0);
      pop();
    }
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

  emetti(x, y, z, attiva = falsAe) {
    if (!this.img || !this.img.width) return;
    
    // Rimuovi la logica di filtro da qui poiché ora la gestisce shouldShowImage
    push();
    translate(x, y, z);
    rotateY(-rotY);
    texture(this.img);
    plane(this.w, this.h);
    pop();
  }
}

// Modifica la funzione shouldShowImage
function shouldShowImage(img) {
    if (!img.date || !img.time) return false;
    
    const hour = parseInt(img.time.split(':')[0]);
    const date = new Date(img.date);
    const giornoSettimana = date.getDay();
    const giornoIndice = (giornoSettimana + 6) % 7;
    
    switch(categoriaAttiva) {
        case 'ore':
            // Controlla solo se l'ora corrisponde
            // Non usare più il controllo dei bottoni selezionati
            return hour === oraCorrente;
            
        case 'giorni':
            if (filtriGiornoSettimana.every(f => !f)) {
                return true;
            }
            return filtriGiornoSettimana[giornoIndice];
            
        case 'mesi':
            if (filtriMese.every(f => !f)) {
                return true;
            }
            return filtriMese[date.getMonth()];
            
        case 'anni':
            if (Object.values(filtriAnno).every(f => !f)) {
                return true;
            }
            return filtriAnno[date.getFullYear().toString()];
            
        default:
            return true;
    }
}