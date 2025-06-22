# Self.log()

[Link al sito](https://bassanimirko.github.io/Self.log/)

**Self.log()** è un archivio visivo generato a partire dalle mie fotografie, interpretate attraverso lo sguardo della macchina.

---

## Introduzione e tema

*Self.log()* nasce dall’analisi di **1054 immagini** provenienti dalla mia galleria personale. Il nome richiama la funzione `console.log()` di JavaScript: un’istruzione che restituisce informazioni su ciò che accade nel sistema. In questo caso, restituisce una visione automatica di me stesso.

Attraverso processi di visione artificiale, la macchina interpreta e ricompone la mia memoria visiva, generando **due visualizzazioni principali**:
1. Una basata sui **ritagli automatici** degli oggetti riconosciuti (oltre 4160 crop), classificati in base a ciò che la macchina ha “visto”.
2. Una visualizzazione temporale che organizza le immagini in base all’**orario di scatto**, rivelando ritmi, abitudini e pattern invisibili.

---

## Visualizzazioni

1. **Ritagli per soggetto (YOLO)**  
   Utilizzando il modello YOLO, la macchina ha identificato e ritagliato **4160 oggetti** dalle immagini originali, classificandoli per tipo. Il risultato è una mappa visiva costruita non sulla base del soggetto fotografato, ma su ciò che la macchina ha riconosciuto.

2. **Mappa temporale degli scatti**  
   Le immagini vengono distribuite nello spazio in base a dati temporali (anno, mese, giorno, ora), offrendo una visualizzazione ritmica e comportamentale della mia produzione visiva.

---

## Riferimenti progettuali

Il progetto si ispira a pratiche di archiviazione generativa e visualizzazione non lineare:

- **[sp.eriksiemund.com](https://sp.eriksiemund.com/)** – archivio personale esplorabile in 3D, basato su clustering visivo e metadati.
- **[Uncertain Archive – Olafur Eliasson](https://olafureliasson.net/uncertain/)** – paesaggio fotografico in continua riorganizzazione, non ordinato cronologicamente.
- **Estetica da prompt AI** – immagini astratte, riconfigurazioni automatiche, distribuzioni visive indipendenti dalla semantica umana.
- **Autorappresentazione algoritmica** – narrazione emergente dai dati, non dal controllo dell’autore.

---

## Design dell’interfaccia e modalità di interazione

L’interfaccia è pensata come uno spazio esplorabile generato da logiche non umane. L’utente può:
- navigare liberamente nello spazio 3D,
- filtrare le immagini per ora, giorno, mese, anno,
- osservare le aggregazioni costruite dalla macchina in base a somiglianze formali o temporali.

Ogni accesso produce una diversa lettura dell’archivio: nessuna sequenza è imposta, nessuna interpretazione è definitiva.

---

## Target e contesto d’uso

*Self.log()* si rivolge a chi è interessato a:
- esplorare il rapporto tra identità, memoria e intelligenza artificiale,
- lavorare su archivi visivi, dataset personali e data visualization,
- creare installazioni interattive, mostre o esperienze online narrative e sperimentali.

È uno strumento per riflettere su cosa viene “visto” e restituito da una macchina.

---

## Tecnologie usate

- **HTML**  
  Struttura del sito e markup della pagina.

- **CSS**  
  Stile minimale ispirato all’interfaccia da terminale, con griglie, animazioni testuali e pulsanti interattivi.

- **JavaScript**  
  Gestione della logica interattiva: comandi digitabili, filtri temporali (anno, mese, giorno, ora), transizioni tra visualizzazioni, selezione dinamica delle immagini.

- **p5.js (WebGL)**  
  Visualizzazione tridimensionale delle immagini nello spazio 3D.
  
- **YOLO EXTRACT + COLOR EXTRACT**  
  Riconoscimento automatico degli oggetti all’interno delle immagini. Sono stati generati:
  - 4160 crop da 1054 fotografie
  - i dataset `data_yolo.json` e `color_extract.json`

- **3D SCAN APP**
  - Applicazione per iphone per eseguire scansioni 3d
  - Output: Poincloud `.ply` e `.obj`

- **Atlas Canvas Rendering**  
  Tecnica di ottimizzazione grafica che impagina tutte le immagini in un’unica texture per migliorare le prestazioni.

Questi strumenti mi hanno permesso di fondere i json creando delle combinazioni di dati partendo da semplici immagini:

-`images_copia` | Immagini originali analizzate |
`image_mapping_with_atlas_deduplicated.json` | Coordinate spaziali e classificazione delle immagini |
`data_date_time_without_position.json` | Dati temporali per la visualizzazione interattiva |

---

**Un frammento del file** `image_mapping_with_atlas_deduplicated.json`:

```json
{
  "file": "frame_0889.png",
  "x": -21.36,
  "y": 13.58,
  "z": -12.75,
  "classe": "person",
  "atlasX": 4,
  "atlasY": 5
}
Ogni voce contiene:

file: nome del crop

x, y, z: posizione 3D nel canvas

classe: oggetto riconosciuto

atlasX, atlasY: posizione nell’atlas canvas condiviso

## Media di progetto

<img src="COSE/output2.gif" width="800" alt="user experience" />
<p align="center"><i>Esplorazione dell'archivio attraverso la visualizzazione algoritmica</i></p>

---

## Credits

Progetto di **Mirko Bassani**  
SUPSI 2025 – Corso d’Interaction Design, CV428.01  
Docenti: Andreas Gysin, Giovanni Profeta
