let objModel;
let isModelLoaded = false;
let loadingProgress = 0;
let modelRotation = 0;
let startTime;

function preload() {
  try {
    console.log('Inizio caricamento OBJ...');
    // Semplifichiamo la chiamata loadModel
    objModel = loadModel('U/Users/mirkobassani/Supsi/interaction-design/locale/00_point_cloud/Untitled_Scan_17_07_49/textured_output.obj', 
      // Success callback
      () => {
        console.log('Modello OBJ caricato con successo');
        isModelLoaded = true;
        loadingProgress = 100;
      },
      // Error callback
      (err) => {
        console.error('Errore nel caricamento:', err);
        errorLoading = true;
      },
      // Progress callback
      (prog) => {
        loadingProgress = prog * 100;
      }
    );
  } catch (e) {
    console.error('Errore:', e);
    errorLoading = true;
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  camera = createCamera();
  
  // Modifica più estrema della posizione della camera
  camera.setPosition(0, -800, 800); // Aumentato i valori per una vista più alta e inclinata
  camera.lookAt(0, 0, 0);
  
  // Aggiungi questa riga per inclinare ulteriormente la camera
  camera.tilt(PI * 0.25);
  
  startTime = millis();
}

function draw() {
  background(0);
  
  // Calcola il progresso basato sul tempo
  loadingProgress = constrain(((millis() - startTime) / 3000) * 100000, 0, 100);
  
  push();
  translate(-width/2, -height/2);
  
  // Testo di caricamento
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Caricamento: ' + floor(loadingProgress) + '%', width/2, height/2);
  
  // Animazione con forme multiple
  push();
  translate(width/2, height/2, -200); // Aggiunto offset negativo su Z per abbassare il modello
  
  // Modifica le rotazioni per una vista più inclinata
  rotateX(PI * 0.35); // Aumentato l'angolo di inclinazione
  rotateY(modelRotation);
  rotateZ(0);
  
  if (isModelLoaded && objModel) {
    scale(2.5); // Aumentato leggermente la scala
    translate(0, 50, 0); // Sposta leggermente il modello verso il basso
    model(objModel);
  }
  
  pop();
  
  // Rallenta ulteriormente la rotazione
  modelRotation += 0.005; // Ridotto da 0.01 a 0.005
  
  // Reindirizzamento automatico
  if (loadingProgress >= 100) {
    setTimeout(() => {
      window.location.href = 'gallery.html';
    }, 500);
  }
  
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}