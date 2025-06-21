// === Variabili globali ===
let data;
let immagini = [];

let zoom = 1;
let targetZoom = 1;  // Zoom obiettivo a cui arrivare gradualmente
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

// Aggiungi questa variabile mancante
let filtriAttivati = false;

// All'inizio del file, dopo le variabili globali
let immaginiCaricate = 0;
let totaleImmagini = 0;

// Aggiungi queste variabili globali all'inizio del file
let cicloCategorieAttivo = false;
let categorieDaCiclare = ['anni', 'mesi', 'giorni', 'ore'];
let indiceCategoriaCorrente = 0;

// Estrae il mese da una stringa data (0-11)
function getMese(dateString) {
    const date = new Date(dateString);
    return date.getMonth(); // 0-11 (gennaio-dicembre)
}

// Estrae il giorno della settimana da una stringa data (0-6, dove 0 è lunedì)
function getGiorno(dateString) {
    const date = new Date(dateString);
    return date.getDate() - 1; // Restituisce 0-30 per i giorni del mese (1-31)
}

// Estrae l'anno da una stringa data
function getAnno(dateString) {
    const date = new Date(dateString);
    return date.getFullYear();
}

// Estrae l'ora da una stringa orario
function getOra(timeString) {
    if (!timeString) return 0;
    return parseInt(timeString.split(':')[0]);
}

function preload() {
  data = loadJSON('data_date_time.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  textureMode(NORMAL);
  noStroke();

  const anni = new Set();
  
  console.log("Inizio caricamento immagini...");
  totaleImmagini = Object.keys(data).length;
  
  Object.keys(data).forEach(k => {
    const item = data[k];
    // Estrai il nome del file senza estensione
    const baseName = item.filename.replace(/^.*[\\\/]/, '').replace(/\.(jpg|jpeg|JPG|JPEG)$/i, '');
    const dateObj = new Date(item.date);
    anni.add(dateObj.getFullYear());

    // Usa SOLO estensione .jpg
    const pathJPG = `assets/images_copia/${baseName}.jpg`;
    
    console.log(`Tentativo caricamento: ${pathJPG}`);
    
    // Carica direttamente senza fallback
    loadImage(pathJPG, img => {
      immagini.push(new ImmagineSingola(
        baseName, img, img.width, img.height, item.date,
        item.time, getMese(item.date), getGiorno(item.date), getAnno(item.date)
      ));
      immaginiCaricate++;
      
      if (immaginiCaricate % 20 === 0 || immaginiCaricate === totaleImmagini) {
        console.log(`Progresso: ${immaginiCaricate}/${totaleImmagini}`);
      }
    }, () => {
      console.error(`Errore caricamento: ${pathJPG}`);
      immaginiCaricate++; // Incrementa comunque per evitare blocchi
    });
  });

  ANNI = anni.size;
  anni.forEach(a => filtriAnno[a] = true);

  document.body.style.cursor = 'grab';

  // Rimuovi la parte che ricrea lo slider, è una fonte di problemi:
  const controls = createDiv('').parent('filter');
  controls.class('slider-controls');
  controls.id('slider-container');
  controls.style('z-index', '10000'); // Aggiungi z-index elevato
  
  // Crea lo slider standard HTML e aggiungi stile inline
  const sliderEl = document.createElement('input');
  sliderEl.type = 'range';
  sliderEl.min = '0';
  sliderEl.max = '23';
  sliderEl.value = '0';
  sliderEl.step = '1';
  sliderEl.className = 'categoria-slider';
  sliderEl.style.zIndex = '10001'; // Aggiungi z-index elevato
  sliderEl.style.position = 'relative';
  sliderEl.style.pointerEvents = 'auto'; // Forza gli eventi del mouse
  
  // Aggiungi il nuovo slider
  document.getElementById('slider-container').appendChild(sliderEl);
  
  // Crea un wrapper per p5
  slider = {
    elt: sliderEl,
    value: function(val) {
      if (val === undefined) return parseInt(sliderEl.value);
      sliderEl.value = val;
      return this;
    },
    attribute: function(attr, val) {
      if (val === undefined) return sliderEl.getAttribute(attr);
      sliderEl.setAttribute(attr, val);
      return this;
    }
  };

  // Aggiungi l'event listener direttamente all'elemento DOM
  sliderEl.addEventListener('input', function(e) {
    // Previeni la propagazione dell'evento
    e.stopPropagation();
    
    const valore = parseInt(this.value);
    console.log("Slider spostato a:", valore);
    
    // Attiva i filtri
    filtriAttivati = true;
    
    // Interrompi la riproduzione se attiva
    if (playing) {
      clearInterval(intervalloAnimazione);
      playing = false;
      cicloCategorieAttivo = false;
      const avviaButton = document.getElementById('avviaButton');
      if (avviaButton) {
        avviaButton.textContent = 'AVVIA';
        avviaButton.classList.remove('active');
      }
    }
    
    // Aggiorna in base alla categoria
    switch(categoriaAttiva) {
      case 'ore':
        oraCorrente = valore;
        break;
      case 'giorni':
        filtriGiornoSettimana.fill(false);
        giornoCorrente = valore;
        filtriGiornoSettimana[valore] = true;
        break;
      case 'mesi':
        filtriMese.fill(false);
        meseCorrente = valore;
        filtriMese[valore] = true;
        break;
      case 'anni':
        const anniArray = Object.keys(filtriAnno).sort();
        if (valore >= 0 && valore < anniArray.length) {
          Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
          annoCorrente = parseInt(anniArray[valore]);
          filtriAnno[anniArray[valore]] = true;
        }
        break;
    }
    
    // Aggiorna l'interfaccia e la visualizzazione
    aggiornaStatoFiltri();
    aggiornaDisplayCategoria();
    updateVisualizzazione();
  });
  
  // Display per i valori e contatore immagini
  oraDisplay = createDiv('').parent(controls);
  oraDisplay.class('categoria-display');

  const avviaButton = document.querySelector('#avviaButton');
  if (avviaButton) {
    avviaButton.addEventListener('click', togglePlay);
  }

  setupFilters();
  aggiornaRangeSlider(); // Configura il range iniziale in base alla categoria attiva
  updateVisualizzazione();
  
  // Assicurati che lo stato iniziale sia corretto
  aggiornaStatoFiltri();
  aggiornaDisplayCategoria();
}

// Modifica aggiornaRangeSlider per usare il nuovo slider
function aggiornaRangeSlider() {
  let min = 0;
  let max = 0;
  let valoreCorrente = 0;
  
  switch(categoriaAttiva) {
    case 'ore':
      min = 0;
      max = 23;
      valoreCorrente = oraCorrente;
      break;
    case 'giorni':
      min = 0;
      max = 6;
      valoreCorrente = giornoCorrente;
      break;
    case 'mesi':
      min = 0;
      max = 11;
      valoreCorrente = meseCorrente;
      break;
    case 'anni':
      const anniArray = Object.keys(filtriAnno).sort();
      min = 0;
      max = anniArray.length - 1;
      valoreCorrente = anniArray.indexOf(annoCorrente.toString());
      if (valoreCorrente < 0) valoreCorrente = 0;
      break;
  }
  
  // Accedi direttamente all'elemento DOM
  const sliderEl = document.querySelector('.categoria-slider');
  if (!sliderEl) return;
  
  console.log(`Aggiornamento slider: min=${min}, max=${max}, valore=${valoreCorrente}`);
  
  // Aggiorna prima il valore poi min e max per evitare problemi di validazione
  sliderEl.value = valoreCorrente;
  sliderEl.min = min;
  sliderEl.max = max;
  
  // Aggiorna il colore dello slider
  sliderEl.style.accentColor = filtriAttivati ? '#ff5722' : '#666';
  
  // Aggiorna il display
  aggiornaDisplayCategoria();
}

// Funzione per aggiornare la categoria in base al valore dello slider
function aggiornaCategoriaDaSlider(valore) {
  // Attiva sempre i filtri quando si usa lo slider
  filtriAttivati = true;
  
  switch(categoriaAttiva) {
    case 'ore':
      oraCorrente = valore;
      // Non dobbiamo fare altro per le ore
      break;
    case 'giorni':
      giornoCorrente = valore;
      // Reset dei filtri giorno e attivazione solo di quello selezionato
      filtriGiornoSettimana.fill(false);
      filtriGiornoSettimana[valore] = true;
      break;
    case 'mesi':
      meseCorrente = valore;
      // Reset dei filtri mese e attivazione solo di quello selezionato
      filtriMese.fill(false);
      filtriMese[valore] = true;
      break;
    case 'anni':
      const anniArray = Object.keys(filtriAnno).sort();
      annoCorrente = parseInt(anniArray[valore]);
      // Reset dei filtri anno e attivazione solo di quello selezionato
      Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
      filtriAnno[anniArray[valore]] = true;
      break;
  }
  
  // Aggiorna l'aspetto visivo dei bottoni
  aggiornaStatoFiltri();
  
  // Aggiorna il display
  aggiornaDisplayCategoria();
  
  // Aggiorna la visualizzazione (importante)
  updateVisualizzazione();
  
  // Debug
  console.log(`Slider aggiornato: categoria=${categoriaAttiva}, valore=${valore}`);
}

// Modifica la funzione createFilterGroup per aggiungere le classi fade-in
function createFilterGroup(name, options) {
    const group = createDiv('');
    group.class('filter-group');
    group.id(`${name}-group`);

    // Titolo categoria
    const title = createDiv(`[${name}]`);
    title.class('filter-title');
    title.id(`title-${name}`);
    if (categoriaAttiva === name) {
        title.addClass('active');
    }
    title.parent(group);
    
    // Aggiungi animazione al titolo con ritardo
    setTimeout(() => {
        title.addClass('fade-in');
    }, 100);

    // Contenitore opzioni
    const optionsDiv = createDiv('');
    optionsDiv.class('filter-options');
    optionsDiv.parent(group);
    
    // Modifica specifica per le ore: due colonne
    if (name === 'ore') {
        // Crea due div distinti per le colonne
        const oreContainer = createDiv('');
        oreContainer.class('ore-container');
        oreContainer.parent(optionsDiv);
        
        // Prima colonna (01-12)
        const colonna1 = createDiv('');
        colonna1.class('ore-colonna');
        colonna1.parent(oreContainer);
        
        // Seconda colonna (13-00)
        const colonna2 = createDiv('');
        colonna2.class('ore-colonna');
        colonna2.parent(oreContainer);
        
        // Popola la prima colonna con le ore da 01 a 12
        for (let i = 1; i <= 12; i++) {
            const ora = i;
            const oraStr = ora.toString().padStart(2, '0');
            
            const btn = createDiv(oraStr);
            btn.class('filter-option');
            btn.attribute('data-value', ora);
            btn.parent(colonna1);
            
            // Fade-in con ritardo progressivo
            setTimeout(() => {
                btn.addClass('fade-in');
            }, 150 + i * 30);
            
            // Handler del click
            btn.mousePressed(() => {
                if (!playing) {
                    if (categoriaAttiva !== name) {
                        categoriaAttiva = name;
                        document.querySelectorAll('.filter-title').forEach(t => t.classList.remove('active'));
                        title.addClass('active');
                        aggiornaRangeSlider();
                    }
                    
                    const isAlreadySelected = oraCorrente === ora && filtriAttivati;
                    
                    if (isAlreadySelected) {
                        filtriAttivati = false;
                        oraDisplay.html(`Tutte le immagini | ${immagini.length} immagini`);
                    } else {
                        filtriAttivati = true;
                        oraCorrente = ora;
                        slider.value(ora);
                    }
                    
                    aggiornaStatoFiltri();
                    aggiornaDisplayCategoria();
                    updateVisualizzazione();
                }
            });
        }
        
        // Popola la seconda colonna con le ore da 13 a 00
        for (let i = 13; i <= 24; i++) {
            const ora = i % 24;
            const oraStr = ora.toString().padStart(2, '0');
            
            const btn = createDiv(oraStr);
            btn.class('filter-option');
            btn.attribute('data-value', ora);
            btn.parent(colonna2);
            
            // Fade-in con ritardo progressivo 
            setTimeout(() => {
                btn.addClass('fade-in');
            }, 150 + i * 30);
            
            // Handler del click
            btn.mousePressed(() => {
                if (!playing) {
                    if (categoriaAttiva !== name) {
                        categoriaAttiva = name;
                        document.querySelectorAll('.filter-title').forEach(t => t.classList.remove('active'));
                        title.addClass('active');
                        aggiornaRangeSlider();
                    }
                    
                    const isAlreadySelected = oraCorrente === ora && filtriAttivati;
                    
                    if (isAlreadySelected) {
                        filtriAttivati = false;
                        oraDisplay.html(`Tutte le immagini | ${immagini.length} immagini`);
                    } else {
                        filtriAttivati = true;
                        oraCorrente = ora;
                        slider.value(ora);
                    }
                    
                    aggiornaStatoFiltri();
                    aggiornaDisplayCategoria();
                    updateVisualizzazione();
                }
            });
        }
    } else {
        // Per gli altri filtri (non ore), aggiungi la funzionalità di fade-in
        options.forEach((option, index) => {
            const btn = createDiv(option);
            btn.class('filter-option');
            
            if (name === 'ore') {
                btn.attribute('data-value', index);
            } else {
                btn.attribute('data-value', option);
            }
            
            btn.parent(optionsDiv);
            
            // Aggiungi fade-in con ritardo progressivo
            setTimeout(() => {
                btn.addClass('fade-in');
            }, 150 + index * 30);
            
            // Handler del click (stesso codice di prima)
            btn.mousePressed(() => {
                if (!playing) {
                    if (categoriaAttiva !== name) {
                        categoriaAttiva = name;
                        document.querySelectorAll('.filter-title').forEach(t => t.classList.remove('active'));
                        title.addClass('active');
                        
                        // Aggiorna il range dello slider per la nuova categoria
                        aggiornaRangeSlider();
                    }
                    
                    const isAlreadySelected = (name === 'giorni' && filtriGiornoSettimana[index] && filtriAttivati) ||
                                            (name === 'mesi' && filtriMese[index] && filtriAttivati) ||
                                            (name === 'anni' && filtriAnno[option] && filtriAttivati);
                    
                    if (isAlreadySelected) {
                        filtriAttivati = false;
                        oraDisplay.html(`Tutte le immagini | ${immagini.length} immagini`);
                    } else {
                        filtriAttivati = true;
                        
                        switch(name) {
                            case 'giorni':
                                filtriGiornoSettimana.fill(false);
                                filtriGiornoSettimana[index] = true;
                                giornoCorrente = index;
                                slider.value(index);
                                break;
                            case 'mesi':
                                filtriMese.fill(false);
                                filtriMese[index] = true;
                                meseCorrente = index;
                                slider.value(index);
                                break;
                            case 'anni':
                                Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
                                filtriAnno[option] = true;
                                annoCorrente = parseInt(option);
                                const anniArray = Object.keys(filtriAnno).sort();
                                slider.value(anniArray.indexOf(option));
                                break;
                        }
                    }
                    
                    // Aggiorna stato visivo bottoni
                    aggiornaStatoFiltri();
                    
                    // Aggiorna display
                    aggiornaDisplayCategoria();
                    
                    // Aggiorna visualizzazione
                    updateVisualizzazione();
                }
            });
        });
    }
    
    return group;
}

// Funzione per aggiornare il display in base alla categoria attiva
function aggiornaDisplayCategoria() {
  // Se nessun filtro è attivo, mostra un messaggio che indica che vengono visualizzate tutte le immagini
  if (!filtriAttivati) {
    oraDisplay.html(`Tutte le immagini | ${immagini.length} immagini`);
    return;
  }
  
  let testo = '';
  let numeroImmagini = 0;
  
  switch(categoriaAttiva) {
    case 'ore':
      testo = `${oraCorrente.toString().padStart(2, '0')}:00`;
      numeroImmagini = immagini.filter(img => img.ora === oraCorrente).length;
      break;
    case 'giorni':
      const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
      testo = giorni[giornoCorrente];
      numeroImmagini = immagini.filter(img => {
        const date = new Date(img.date);
        const dayOfWeek = date.getDay();
        const dayIndex = (dayOfWeek + 6) % 7;
        return dayIndex === giornoCorrente;
      }).length;
      break;
    case 'mesi':
      const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                   'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      testo = mesi[meseCorrente];
      numeroImmagini = immagini.filter(img => getMese(img.date) === meseCorrente).length;
      break;
    case 'anni':
      testo = annoCorrente.toString();
      numeroImmagini = immagini.filter(img => getAnno(img.date) === annoCorrente).length;
      break;
  }
  
  oraDisplay.html(`${testo} | ${numeroImmagini} immagini`);
}

function setupFilters() {
    // Verifica che l'elemento filter esista
    const filterDiv = select('#filter');
    if (!filterDiv) {
        console.error('Elemento #filter non trovato');
        return;
    }

    // Crea il container principale
    const filterContainer = createDiv('');
    filterContainer.class('filter-container');
    filterContainer.parent(filterDiv); // Usa l'elemento filter come parent

    // NUOVO ORDINE: ANNI, MESI, GIORNI, ORE
    
    // 1. Setup Anni
    const anniGroup = createFilterGroup('anni', Object.keys(filtriAnno));
    anniGroup.parent(filterContainer);
    
    // 2. Setup Mesi
    const mesiGroup = createFilterGroup('mesi', ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']);
    mesiGroup.parent(filterContainer);
    
    // 3. Setup Giorni
    const giorniGroup = createFilterGroup('giorni', ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']);
    giorniGroup.parent(filterContainer);
    
    // 4. Setup Ore
    // Nota: adesso partiamo da 01 e arriviamo a 12 per entrambe AM e PM
    const oreArray = [
        // Prima colonna (AM)
        '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12',
        // Seconda colonna (PM)
        '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '00'
    ];
    const oreGroup = createFilterGroup('ore', oreArray);
    oreGroup.parent(filterContainer);
}

// All'inizio del setup, verifica se alcune immagini di test sono caricabili
function verificaImmagineTest() {
  const nomeTest = 'IMG_0224'; // Un nome file di esempio
  
  fetch(`assets/images_copia/${nomeTest}.jpg`)
    .then(response => {
      if (response.ok) {
        console.log("✅ Estensione .jpg confermata");
        // Continua con caricamento normale
        caricaImmagini();
      } else {
        console.warn("⚠️ File .jpg non trovato, provo .jpeg");
        
        fetch(`assets/images_copia/${nomeTest}.jpeg`)
          .then(response => {
            if (response.ok) {
              console.log("✅ Estensione .jpeg confermata");
              // Usa .jpeg per tutte le immagini
              caricaImmagini(true);
            } else {
              console.error("❌ Nessuna estensione valida trovata");
              caricaImmagini(); // Prova comunque con .jpg
            }
          });
      }
    });
}

// Sostituisci la funzione togglePlay con questa versione migliorata
function togglePlay() {
    playing = !playing;
    cicloCategorieAttivo = playing; // Attiva anche il ciclo tra categorie
    const avviaButton = document.getElementById('avviaButton');
    
    if (playing) {
        // Inizia il ciclo a partire dalla categoria attiva
        indiceCategoriaCorrente = categorieDaCiclare.indexOf(categoriaAttiva);
        if (indiceCategoriaCorrente === -1) indiceCategoriaCorrente = 0;
        
        avviaCicloCategoria();
        
        if (avviaButton) {
            avviaButton.textContent = 'ferma';
            avviaButton.classList.add('active');
        }
    } else {
        // Interrompi il ciclo
        clearInterval(intervalloAnimazione);
        if (avviaButton) {
            avviaButton.textContent = 'avvia';
            avviaButton.classList.remove('active');
        }
    }
}

// Funzione che avvia il ciclo per la categoria corrente
function avviaCicloCategoria() {
    clearInterval(intervalloAnimazione); // Pulisci intervalli precedenti
    
    // Imposta la categoria corrente come attiva
    categoriaAttiva = categorieDaCiclare[indiceCategoriaCorrente];
    filtriAttivati = true; // Assicurati che i filtri siano attivi
    
    // Aggiorna lo stato dei titoli
    document.querySelectorAll('.filter-title').forEach(t => t.classList.remove('active'));
    const titleElement = document.querySelector(`#title-${categoriaAttiva}`);
    if (titleElement) titleElement.classList.add('active');
    
    // Reset dei filtri della categoria corrente
    switch(categoriaAttiva) {
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
            const anniArray = Object.keys(filtriAnno).sort();
            Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
            if (anniArray.length > 0) {
                annoCorrente = parseInt(anniArray[0]);
                filtriAnno[anniArray[0]] = true;
            }
            break;
    }
    
    // Aggiorna prima lo slider
    aggiornaRangeSlider();
    
    console.log(`Avvio ciclo per categoria: ${categoriaAttiva}`);
    
    // Configurazione dell'intervallo basata sulla categoria
    switch(categoriaAttiva) {
        case 'ore':
            intervalloAnimazione = setInterval(() => {
                oraCorrente = (oraCorrente + 1) % 24;
                // Aggiorna il valore dello slider
                const sliderEl = document.querySelector('.categoria-slider');
                if (sliderEl) sliderEl.value = oraCorrente;
                
                // Aggiorna l'evidenziazione visiva
                aggiornaStatoFiltri();
                aggiornaDisplayCategoria();
                updateVisualizzazione();
                
                if (oraCorrente === 0 && cicloCategorieAttivo) {
                    passaAllaCategoriaSuccessiva();
                }
            }, 1000);
            break;
            
        case 'giorni':
            intervalloAnimazione = setInterval(() => {
                filtriGiornoSettimana[giornoCorrente] = false;
                giornoCorrente = (giornoCorrente + 1) % 7;
                filtriGiornoSettimana[giornoCorrente] = true;
                
                // Aggiorna il valore dello slider
                const sliderEl = document.querySelector('.categoria-slider');
                if (sliderEl) sliderEl.value = giornoCorrente;
                
                // Aggiorna l'evidenziazione visiva
                aggiornaStatoFiltri();
                aggiornaDisplayCategoria();
                updateVisualizzazione();
                
                if (giornoCorrente === 0 && cicloCategorieAttivo) {
                    passaAllaCategoriaSuccessiva();
                }
            }, 1000);
            break;
            
        case 'mesi':
            intervalloAnimazione = setInterval(() => {
                filtriMese[meseCorrente] = false;
                meseCorrente = (meseCorrente + 1) % 12;
                filtriMese[meseCorrente] = true;
                
                // Aggiorna il valore dello slider
                const sliderEl = document.querySelector('.categoria-slider');
                if (sliderEl) sliderEl.value = meseCorrente;
                
                // Aggiorna l'evidenziazione visiva
                aggiornaStatoFiltri();
                aggiornaDisplayCategoria();
                updateVisualizzazione();
                
                if (meseCorrente === 0 && cicloCategorieAttivo) {
                    passaAllaCategoriaSuccessiva();
                }
            }, 1000);
            break;
            
        case 'anni':
            const anniArray = Object.keys(filtriAnno).sort();
            let annoIndex = 0;
            
            intervalloAnimazione = setInterval(() => {
                Object.keys(filtriAnno).forEach(a => filtriAnno[a] = false);
                annoIndex = (annoIndex + 1) % anniArray.length;
                annoCorrente = parseInt(anniArray[annoIndex]);
                filtriAnno[anniArray[annoIndex]] = true;
                
                // Aggiorna il valore dello slider
                const sliderEl = document.querySelector('.categoria-slider');
                if (sliderEl) sliderEl.value = annoIndex;
                
                // Aggiorna l'evidenziazione visiva
                aggiornaStatoFiltri();
                aggiornaDisplayCategoria();
                updateVisualizzazione();
                
                if (annoIndex === 0 && cicloCategorieAttivo) {
                    passaAllaCategoriaSuccessiva();
                }
            }, 1000);
            break;
    }
    
    // Aggiorna stato visivo e display
    aggiornaStatoFiltri();
    aggiornaDisplayCategoria();
    
    // Forza un aggiornamento immediato
    updateVisualizzazione();
}

// Funzione per passare alla categoria successiva
function passaAllaCategoriaSuccessiva() {
    // Passa alla categoria successiva
    indiceCategoriaCorrente = (indiceCategoriaCorrente + 1) % categorieDaCiclare.length;
    
    console.log(`Passaggio alla categoria successiva: ${categorieDaCiclare[indiceCategoriaCorrente]}`);
    
    // Avvia il ciclo per la nuova categoria
    avviaCicloCategoria();
}

// Definisci la funzione draw per visualizzare le immagini in 3D
function draw() {
  background(0);
  
  // Animazione fluida dello zoom
  zoom = lerp(zoom, targetZoom, 0.1);
  
  // Posizionamento della camera con rotazione
  rotY += 0.002; // Incrementa la rotazione
  
  push();
  translate(dragX, dragY, -200 * zoom);
  rotateY(rotY);
  
  // Definisci le dimensioni della griglia 3D
  const cellaX = cella;
  const cellaY = cella * 0.5;
  const cellaZ = cella;

  // Calcola gli offset per centrare la griglia
  const offsX = -MESI * cellaX / 2;
  const offsY = -GIORNI * cellaY / 2;
  const offsZ = -ANNI * cellaZ / 2;
  
  // Filtra le immagini da visualizzare
  const immaginiVisibili = mostraTutto ? 
    immagini : 
    immagini.filter(img => shouldShowImage(img));
  
  // Debug info - numero immagini visibili
  console.log(`Immagini totali: ${immagini.length}`);
  console.log(`Immagini visibili dopo filtro: ${immaginiVisibili.length}`);
  
  // Se non ci sono immagini visibili, mostra un messaggio
  if (immaginiVisibili.length === 0) {
    push();
    rotateY(-rotY); // Compensa la rotazione per il testo
    translate(-100, 0, 0);
    fill(255);
    textSize(24);
    text("Nessuna immagine per questo filtro", 0, 0);
    pop();
  } else {
    // Visualizza le immagini in posizione 3D basata su mese, giorno e anno
    immaginiVisibili.forEach(img => {
      if (!img.img || !img.img.width) return;

      // Posiziona in base al mese (0-11)
      const x = img.mese * cellaX + offsX;
      
      // Posiziona in base al giorno del mese (0-30)
      const y = img.giorno * cellaY + offsY;
      
      // Calcola z basato sull'anno relativo alla prima immagine
      let baseAnno = 0;
      if (immagini.length > 0) {
        baseAnno = getAnno(immagini[0].date);
      }
      const z = (img.anno - baseAnno) * cellaZ + offsZ;

      img.emetti(x, y, z, img.ora === oraCorrente);
    });
  }
  
  pop();
}

// Aggiungi questa classe dopo le variabili globali ma prima della funzione preload()
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
    this.ora = getOra(time);
  }

  emetti(x, y, z, attiva = false) {
    if (!this.img || !this.img.width) return;
    
    push();
    translate(x, y, z);
    rotateY(-rotY);
    texture(this.img);
    plane(this.w, this.h);
    pop();
  }
}

// Correzione della funzione aggiornaStatoFiltri per gestire correttamente l'evidenziazione
function aggiornaStatoFiltri() {
    // Prima rimuovi la classe 'selected' da tutti i bottoni di filtro
    document.querySelectorAll('.filter-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Non aggiungere la classe 'selected' se i filtri non sono attivi
    if (!filtriAttivati) {
        return;
    }
    
    // Poi applica la classe 'selected' solo ai filtri attivi
    switch(categoriaAttiva) {
        case 'ore':
            // Per le ore, usa l'attributo data-value per trovare il bottone corretto
            const bottoneOra = document.querySelector(`#ore-group .filter-option[data-value="${oraCorrente}"]`);
            if (bottoneOra) {
                bottoneOra.classList.add('selected');
                console.log(`Evidenziato bottone ora: ${oraCorrente}. Testo bottone: ${bottoneOra.textContent}`);
            } else {
                console.warn(`Bottone ora non trovato con data-value="${oraCorrente}"`);
                // Fallback: cerca per testo content
                const testoOra = oraCorrente === 0 ? "00" : oraCorrente.toString().padStart(2, '0');
                const bottoneOraAlt = Array.from(
                    document.querySelectorAll('#ore-group .filter-option')
                ).find(btn => btn.textContent === testoOra);
                
                if (bottoneOraAlt) {
                    console.log(`Trovato bottone alternativo per ora ${oraCorrente}: ${testoOra}`);
                    bottoneOraAlt.classList.add('selected');
                }
            }
            break;
            
        case 'giorni':
            // Per i giorni, scorri tutti i bottoni e controlla l'indice
            const bottoniGiorni = document.querySelectorAll('#giorni-group .filter-option');
            bottoniGiorni.forEach((btn, index) => {
                if (filtriGiornoSettimana[index]) {
                    btn.classList.add('selected');
                    console.log("Evidenziato bottone giorno:", index);
                }
            });
            break;
            
        case 'mesi':
            // Per i mesi, scorri tutti i bottoni e controlla l'indice
            const bottoniMesi = document.querySelectorAll('#mesi-group .filter-option');
            bottoniMesi.forEach((btn, index) => {
                if (filtriMese[index]) {
                    btn.classList.add('selected');
                    console.log("Evidenziato bottone mese:", index);
                }
            });
            break;
            
        case 'anni':
            // Per gli anni, confronta il testo del bottone con l'anno corrente
            const bottoniAnni = document.querySelectorAll('#anni-group .filter-option');
            bottoniAnni.forEach(btn => {
                const anno = btn.textContent;
                if (filtriAnno[anno]) {
                    btn.classList.add('selected');
                    console.log("Evidenziato bottone anno:", anno);
                }
            });
            break;
    }
    
    // Aggiorna anche il titolo attivo
    document.querySelectorAll('.filter-title').forEach(title => {
        title.classList.remove('active');
    });
    
    const titoloAttivo = document.querySelector(`#title-${categoriaAttiva}`);
    if (titoloAttivo) {
        titoloAttivo.classList.add('active');
    }
}

// Definisci la funzione updateVisualizzazione
function updateVisualizzazione() {
    console.log("Aggiornamento visualizzazione, categoria attiva:", categoriaAttiva);
    // Forza il ridisegno
    redraw();
}

// Definisci la funzione shouldShowImage
function shouldShowImage(img) {
    if (!img.date || !img.time) return false;
    if (mostraTutto) return true;
    
    // Controlla se ci sono filtri attivi
    if (!filtriAttivati) return true;
    
    const hour = parseInt(img.time.split(':')[0]);
    const date = new Date(img.date);
    const dayOfWeek = date.getDay();
    const dayIndex = (dayOfWeek + 6) % 7; // Converte da 0=Domenica a 0=Lunedì
    const dayOfMonth = date.getDate() - 1; // 0-30
    const month = date.getMonth();
    const year = date.getFullYear();
    
    switch(categoriaAttiva) {
        case 'ore':
            // Gestione speciale per l'ora 0 (mezzanotte)
            if (oraCorrente === 0) {
                // Controlla sia se l'ora è 0 che se è 24 (per compatibilità con formati diversi)
                return hour === 0 || hour === 24;
            }
            return hour === oraCorrente;
        case 'giorni':
            return dayIndex === giornoCorrente;
        case 'mesi':
            return month === meseCorrente;
        case 'anni':
            return filtriAnno[year];
        default:
            return true;
    }
}

// Funzioni per gestire l'interazione con il mouse
function mousePressed(e) {
  // Ottieni lo slider e il suo contenitore
  const sliderContainer = document.getElementById('slider-container');
  const sliderEl = document.querySelector('.categoria-slider');
  
  // Verifica se l'evento del mouse è sul slider
  if (e && e.target && (
      e.target === sliderEl || 
      e.target === sliderContainer ||
      sliderContainer.contains(e.target))) {
    console.log("Click intercettato su slider");
    return true; // Permetti l'evento predefinito
  }
  
  // Verifica se siamo nell'area dell'UI
  const isOverUI = (
    mouseY < 200 && 
    mouseX < 400
  );
  
  if (isOverUI) {
    return true;
  }
  
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    document.body.style.cursor = 'grabbing';
    return false;
  }
}

function mouseReleased() {
  document.body.style.cursor = 'grab';
}

function mouseDragged(e) {
  const sliderContainer = document.getElementById('slider-container');
  const sliderEl = document.querySelector('.categoria-slider');
  
  if (e && e.target && (
      e.target === sliderEl || 
      e.target === sliderContainer ||
      sliderContainer.contains(e.target))) {
    return true;
  }
  
  const isOverUI = (
    mouseY < 200 && 
    mouseX < 400
  );
  
  if (isOverUI) {
    return true;
  }
  
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    dragX += (mouseX - pmouseX) / zoom;
    dragY += (mouseY - pmouseY) / zoom;
    return false;
  }
}

function mouseWheel(event) {
  const isOverUI = (
    mouseY < 200 && 
    mouseX < 400
  );
  
  if (isOverUI) {
    return true; // Non prevenire eventi di default
  }
  
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    // Calcola lo zoom target usando un fattore più piccolo per movimenti più precisi
    targetZoom -= event.delta * 0.05;
    targetZoom = constrain(targetZoom, 0.1, 10);
    return false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (key === '+') cella += 10;
  if (key === '-') cella = max(10, cella - 10);
}

// Aggiungi questa funzione dopo setupFilters()
function disattivaFiltri() {
    filtriAttivati = false;
    
    // Disattiva visualmente tutti i filtri
    document.querySelectorAll('.filter-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Aggiorna la visualizzazione per mostrare tutte le immagini
    updateVisualizzazione();
    
    // Aggiorna il display
    oraDisplay.html(`Tutte le immagini | ${immagini.length} immagini`);
}
