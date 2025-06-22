# Self.log()

[Link al sito](https://bassanimirko.github.io/Self.log/)

**Self.log()** è un archivio visivo generato a partire dalle mie fotografie, interpretate attraverso lo sguardo della macchina.

---

## Introduzione e tema

*Self.log()* nasce dall’analisi di **1054 immagini** provenienti dalla mia galleria personale. Il nome richiama la funzione `console.log()` di JavaScript: un’istruzione che restituisce informazioni su ciò che accade nel sistema. In questo caso, restituisce una visione automatica di me stesso.

Attraverso processi di visione artificiale, la macchina interpreta, scompone e ricompone la mia memoria visiva, generando **due visualizzazioni principali**:
1. Una basata sui **ritagli automatici** degli oggetti riconosciuti (oltre 4160 crop), classificati in base a ciò che la macchina ha “visto” all’interno delle foto.
2. Una seconda visualizzazione organizzata **per orario di scatto**, che consente una lettura temporale dell’archivio.

---

## Visualizzazioni

1. **Ritagli per soggetto (YOLO)**  
   Usando il modello YOLO, ho ottenuto **4160 crop**: porzioni d’immagine ritagliate automaticamente in base agli oggetti rilevati (persone, auto, animali, ecc.). Questi elementi sono stati catalogati e distribuiti nello spazio visivo per rappresentare ciò che l’algoritmo ha identificato nelle immagini.

2. **Mappa temporale degli scatti**  
   La seconda visualizzazione organizza le immagini secondo il **momento dello scatto** (ore, giorni, mesi, anni), rivelando pattern ritmici e abitudini nella produzione visiva quotidiana.

---

## Riferimenti progettuali

Il progetto si colloca tra data-art, archiviazione visiva e percezione algoritmica. Si ispira a:

- **[sp.eriksiemund.com](https://sp.eriksiemund.com/)** – archivio esplorabile in 3D che sfrutta metadati visivi per navigare immagini personali in uno spazio immersivo.
- **[Uncertain Archive – Olafur Eliasson](https://olafureliasson.net/uncertain/)** – sistema visuale generativo che disordina l’archivio fotografico dell’artista rendendolo paesaggio.
- **Estetica da prompt AI** – immagini disposte in modo astratto, interpretate e riclassificate da un sistema autonomo, con griglie fluide e clustering visivo non umano.
- **Ritrattistica algoritmica** – autorappresentazioni basate su pattern invisibili, emersi da dati visivi e inferenze, anziché da volontà narrativa.

---

## Design dell’interfaccia e modalità di interazione

L’interfaccia si presenta come un ambiente 3D esplorabile, generato in tempo reale da dati visivi e metadati. L’utente può:
- muoversi liberamente nello spazio tridimensionale,
- filtrare le immagini per anno, mese, giorno e ora,
- osservare come la macchina raggruppa elementi simili, non per coerenza semantica, ma per affinità algoritmica.

Ogni interazione costruisce una nuova versione del log: nessuna narrazione è imposta, nessun ordine prestabilito.

---

## Target e contesto d’uso

*Self.log()* è pensato per:
- chi è interessato a esplorare il rapporto tra identità e machine vision,
- chi lavora su archivi, fotografia computazionale o data visualization,
- installazioni, mostre accademiche e progetti editoriali sperimentali.

È uno strumento critico per interrogarsi su cosa viene visto, registrato e rappresentato quando a farlo è una macchina.

---

## Tecnologie usate

*Self.log()* è stato sviluppato utilizzando un set di tecnologie front-end mirate alla creazione di un'interfaccia leggera, reattiva e visualmente immersiva. La struttura del sito è costruita in **HTML**, mentre **CSS** definisce l’estetica ispirata ai terminali testuali, con animazioni minimali e griglie modulari. La logica interattiva è gestita in **JavaScript**, che coordina la navigazione tra le visualizzazioni, l’interpretazione dei comandi digitati, l’attivazione dei filtri temporali (anno, mese, giorno, ora) e la selezione dinamica delle immagini.

Per la visualizzazione tridimensionale ho utilizzato **p5.js in modalità WebGL**, che consente di mappare le immagini in uno spazio interattivo e navigabile, generando strutture come griglie, cilindri e mappe temporali. Il posizionamento spaziale è animato in tempo reale in base ai metadati delle immagini.

L’analisi visiva si basa sull’uso del modello **YOLO (You Only Look Once)**, che ha permesso di generare oltre **4160 crop** a partire da **1054 fotografie**. Questi ritagli, corrispondenti agli oggetti riconosciuti, sono stati catalogati e salvati in **file JSON**, poi utilizzati per costruire la prima visualizzazione. Le coordinate spaziali sono state anche esportate in **formato `.ply`**, per eventuali estensioni tridimensionali.

Infine, la visualizzazione delle immagini è ottimizzata grazie a un sistema di **atlas canvas rendering**, che carica tutte le immagini da un’unica texture, migliorando le performance grafiche e garantendo fluidità anche su dataset complessi.

---

## Struttura del progetto

| File | Descrizione |
|------|-------------|
| `images_copia` | Immagini originali analizzate |
| `image_mapping_with_atlas_deduplicated.json` | Coordinate spaziali e classificazione delle immagini |
| `data_date_time_without_position.json` | Dati temporali per la visualizzazione interattiva |

---

## Media di progetto

<img src="COSE/output2.gif" width="800" alt="user experience" />
<p align="center"><i>Esplorazione dell'archivio attraverso la visualizzazione algoritmica</i></p>

---

## Credits

Progetto di **Mirko Bassani**  
SUPSI 2025 – Corso d’Interaction Design, CV428.01  
Docenti: Andreas Gysin, Giovanni Profeta
