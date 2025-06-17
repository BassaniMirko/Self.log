let timeData;
let myFont;
let atlasImg;
let imagePositions = [];

function preload() {
    // Carica il font
    myFont = loadFont('assets/fonts/SpaceMono-Regular.ttf');
    
    // Carica l'atlas
    atlasImg = loadImage('atlas_originali.jpg', () => {
        console.log('Atlas caricato correttamente');
    });
    
    // Carica il JSON con le posizioni delle immagini
    loadJSON('data_date_time_without_position.json', (data) => {
        timeData = data;
        console.log('Dati JSON caricati');
        processImageData();
    });
}

function processImageData() {
    if (!timeData || !atlasImg) return;
    
    timeData.forEach((item, index) => {
        if (item.time) {
            const hour = parseInt(item.time.split(':')[0]);
            const angle = (hour / 24) * TWO_PI;
            const radius = 300;
            
            imagePositions.push({
                x: cos(angle) * radius,
                y: sin(angle) * radius,
                time: item.time,
                atlasX: item.x || 0,
                atlasY: item.y || 0,
                width: item.width || 50,
                height: item.height || 50
            });
        }
    });
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    textFont(myFont);
    textSize(12);
    textAlign(CENTER, CENTER);
    imageMode(CENTER);
}

function draw() {
    background(0);
    orbitControl();
    
    if (!atlasImg || !timeData) return;
    
    imagePositions.forEach(pos => {
        push();
        translate(pos.x, pos.y, 0);
        
        // Disegna una porzione dell'atlas
        texture(atlasImg);
        beginShape();
        vertex(-25, -25, 0, pos.atlasX/atlasImg.width, pos.atlasY/atlasImg.height);
        vertex(25, -25, 0, (pos.atlasX + pos.width)/atlasImg.width, pos.atlasY/atlasImg.height);
        vertex(25, 25, 0, (pos.atlasX + pos.width)/atlasImg.width, (pos.atlasY + pos.height)/atlasImg.height);
        vertex(-25, 25, 0, pos.atlasX/atlasImg.width, (pos.atlasY + pos.height)/atlasImg.height);
        endShape(CLOSE);
        
        // Mostra l'ora al passaggio del mouse
        if (mouseX > pos.x + width/2 - 25 && mouseX < pos.x + width/2 + 25 &&
            mouseY > pos.y + height/2 - 25 && mouseY < pos.y + height/2 + 25) {
            fill(255);
            text(pos.time, 0, -35);
        }
        pop();
    });
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
