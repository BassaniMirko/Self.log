# Self.log()

[🔗 Vai al sito](https://bassanimirko.github.io/Self.log/)

**Self.log()** è un archivio visivo generato a partire dalle mie fotografie, interpretate attraverso lo sguardo della macchina.

---

## 📌 Introduzione e tema

*Self.log()* nasce dall’analisi di **1054 immagini** provenienti dalla mia galleria personale. Il nome richiama la funzione `console.log()` di JavaScript: un’istruzione che restituisce informazioni su ciò che accade nel sistema. In questo caso, restituisce una visione automatica di me stesso.

La macchina, attraverso processi di visione artificiale, ha interpretato, analizzato e ricomposto la mia memoria visiva generando **due visualizzazioni principali**:

1. **Crop generati da riconoscimento visivo (YOLO)** – oltre 4160 oggetti ritagliati automaticamente.
2. **Visualizzazione temporale** – le immagini vengono organizzate per orario di scatto, rivelando pattern invisibili.

---

## 🧭 Visualizzazioni

### 1. Ritagli per soggetto (YOLO)

Attraverso YOLO, ogni immagine è stata analizzata e segmentata in oggetti riconosciuti. Il risultato è una mappa visiva composta da oltre **4160 crop**, che riflette ciò che la macchina “vede” nei miei scatti.

### 2. Mappa temporale

Una seconda modalità di navigazione distribuisce le immagini in uno spazio 3D secondo il **tempo di scatto** (ora, giorno, mese, anno), offrendo una visualizzazione ritmica e comportamentale.

---

## 🧪 Riferimenti progettuali

Il progetto si colloca tra archiviazione algoritmica e rappresentazione identitaria attraverso la visione artificiale. Si ispira a:

* [`sp.eriksiemund.com`](https://sp.eriksiemund.com/): archivio 3D esplorabile basato su clustering visivo e metadati.
* [`Uncertain Archive – Olafur Eliasson`](https://olafureliasson.net/uncertain/): paesaggio fotografico riordinato continuamente dall'algoritmo.
* **Estetica da prompt AI**: immagini astratte, riconfigurazioni automatiche, griglie fluide e clustering non umano.
* **Autorappresentazione algoritmica**: ritratti generati da inferenze, anziché da scelte narrative consapevoli.

---

## 🖱️ Design e interazione

* Navigazione libera nello **spazio 3D**
* Filtri per **anno**, **mese**, **giorno** e **ora**
* Aggregazioni generate secondo **criteri formali** o **temporali**, non narrativi
* Esperienza generativa: ogni esplorazione è una nuova interpretazione

---

## 🎯 Target e contesto

Progetto destinato a:

* Designer e ricercatori interessati a **identità, AI e archivi visivi**
* Contesti di **data visualization artistica**
* **Installazioni interattive**, mostre accademiche e sperimentazioni online

---

## 🛠️ Tecnologie usate

* **HTML**
  Struttura del sito e markup della pagina.

* **CSS**
  Stile minimale ispirato all’interfaccia da terminale, con griglie, animazioni testuali e pulsanti interattivi.

* **JavaScript**
  Gestione della logica interattiva: comandi digitabili, filtri temporali (anno, mese, giorno, ora), transizioni tra visualizzazioni, selezione dinamica delle immagini.

* **p5.js (WebGL)**
  Visualizzazione tridimensionale delle immagini nello spazio 3D, con navigazione libera e animazioni fluide.

* **YOLO Extract + Color Extract**
  Riconoscimento automatico degli oggetti. Sono stati generati:

  * 4160 crop da 1054 fotografie
  * `data_yolo.json` e `color_extract.json`

* **3D Scan App**
  Utilizzata tramite iPhone per ottenere scansioni 3D. Output in formato `.ply` e `.obj`.

* **Atlas Canvas Rendering**
  Impaginazione di tutte le immagini in un’unica texture per ottimizzazione grafica.

Questi strumenti mi hanno permesso di fondere i dati JSON per generare strutture spaziali a partire da immagini personali.

### 📂 File principali

| File                                         | Descrizione                                          |
| -------------------------------------------- | ---------------------------------------------------- |
| `images_copia`                               | Immagini originali analizzate                        |
| `image_mapping_with_atlas_deduplicated.json` | Coordinate spaziali e classificazione delle immagini |
| `data_date_time_without_position.json`       | Dati temporali per la visualizzazione interattiva    |

### 📄 Esempio JSON

Un frammento del file `image_mapping_with_atlas_deduplicated.json`:

```json
{
      "position": [
        -0.16811677813529968,
        0.2480773776769638,
        0.03110112063586712
      ],
      "image": "0E995B33-BF27-45BD-80AC-4B4095DFCBE1_0.jpg",
      "class": "person",
      "x": 3136,
      "y": 4032,
      "width": 35,
      "height": 64
},
```

* `file`: nome del crop
* `x`, `y`, `z`: coordinate 3D
* `classe`: oggetto riconosciuto
* `atlasX`, `atlasY`: posizione nella texture condivisa (atlas canvas)
* `width`, `height`: dimesione della porzione dell'immagine (atlas canvas)
---

## 🎞️ Media

<img src="COSE/output2.gif" width="800" alt="user experience" />
<p align="center"><i>Esplorazione dell'archivio attraverso la visualizzazione algoritmica</i></p>

---

## 👤 Credits

Progetto di **Mirko Bassani**
SUPSI 2025 – Corso d’Interaction Design, CV428.01
Docenti: *Andreas Gysin*, *Giovanni Profeta*
