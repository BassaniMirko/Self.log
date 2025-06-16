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
  camera.setPosition(0, 0, 800);
  startTime = millis();
}

function draw() {
  background(0);
  
  // Calcola il progresso basato sul tempo
  loadingProgress = constrain(((millis() - startTime) / 3000) * 100, 0, 100);
  
  push();
  translate(-width/2, -height/2);
  
  // Testo di caricamento
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text('Caricamento: ' + floor(loadingProgress) + '%', width/2, height/2);
  
  // Animazione con forme multiple
  push();
  translate(width/2, height/2, 0);
  rotateY(modelRotation);
  stroke(255);
  noFill();
  
  // Sfera centrale
  sphere(50);
  
  // Anelli orbitali
  rotateX(modelRotation * 0.5);
  torus(70, 2);
  rotateX(modelRotation * -1);
  torus(90, 2);
  
  pop();
  
  modelRotation += 0.02;
  
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