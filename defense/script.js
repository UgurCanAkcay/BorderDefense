

    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 600;
    canvas.classList.remove("active");

    // Genel Degiskenler
    let numberOfResources = 300;
    let enemiesInterval = 600;
    let frame = 0;
    let gameOver = false;
    let score = 0;
    const cellSize = 100;
    const cellGap = 3;
    const winningScore = 50000;
    const gameGrid = [];
    const defenders = [];
    const enemies = [];
    const enemyPositions = [];
    const projectiles = [];
    const resources = [];

    // Mouse trickleri
    const mouse = {
        x: 10,
        y: 10,
        width: 0.1,
        height: 0.1,
        clicked: false
    }
    canvas.addEventListener('mousedown', function(){
        mouse.clicked = true;
    });
    canvas.addEventListener('mouseup', function(){
        mouse.clicked = false;
    });
    let canvasPosition = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', function(e){
        mouse.x = e.x - canvasPosition.left;
        mouse.y = e.y - canvasPosition.top;
    });
    canvas.addEventListener('mouseleave', function(){
        mouse.y = undefined;
        mouse.y = undefined;
    });

    // game board
    const controlsBar = {
        width: canvas.width,
        height: cellSize,
    }
    class Cell {
        constructor(x, y){
            this.x = x;
            this.y = y;
            this.width = cellSize;
            this.height = cellSize;
        }
        draw(){
            if (mouse.x && mouse.y && collision(this, mouse)){
                ctx.strokeStyle = 'black'; //bu farklı
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }
    }
    function createGrid(){
        for (let y = cellSize; y < canvas.height; y += cellSize){
            for (let x = 0; x < canvas.width; x += cellSize){
                gameGrid.push(new Cell(x, y));
            }
        }
    }
    createGrid();
    function handleGameGrid(){
        for (let i = 0; i < gameGrid.length; i++){
            gameGrid[i].draw();
        }
    }
    // Kursunlar
    const bullet1 = new Image();
    bullet1.src = 'Projectiles/projectile1.png';
    const bullet2 = new Image();
    bullet2.src = 'Projectiles/projectile2.png';

    class Projectiles {
        constructor(x, y, type){
            this.x = x;
            this.y = y;
            this.defenderType = type;
            this.width = 10;
            this.height = 10;
            this.power = 20;
            this.speed = 5;
            this.frameX = 0;
            this.frameY = 0;
            this.spriteWidth = 3322;
            this.spriteHeight = 2919;
            this.minFrame = 0;
            this.maxFrame = 6;
            this.audio = new Audio();

            if (this.defenderType === 1) {
                this.power = 25;
            } else if (this.defenderType === 2) {
                this.power = 35;
            }

            if (this.defenderType === 1) {
                this.projectile = bullet3;
            } else if (this.defenderType === 2) {
                this.projectile = bullet1;
            }

            if (this.defenderType === 1) {
                this.audio.src = 'Sprites/Audio/zapsplatsingle001.mp3';
            } else if (this.defenderType === 2) {
                this.audio.src = 'Sprites/Audio/laser002.mp3';
            }
            this.audio.volume = 0.1
            this.audio.play();
        }

        update(){
            this.x += this.speed;
        }
        draw(){
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function handleProjectiles(){
        for (let i = 0; i < projectiles.length; i++){
            projectiles[i].update();
            projectiles[i].draw();

            for (let j = 0; j < enemies.length; j++){
                if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])){
                    enemies[j].health -= projectiles[i].power;
                    projectiles.splice(i, 1);
                    i--;
                }
            }
            if (projectiles[i] && projectiles[i].x > canvas.width - cellSize){
                projectiles.splice(i, 1);
                i--;
            }
        }
    }

    // Savunucular
    const defender1= new Image();
    defender1.src = 'defender1.png';
    const defender2= new Image();
    defender2.src = 'defender2.png';

    class Defender {
        constructor(x, y){
            this.x = x;
            this.y = y;
            this.width = cellSize - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.shooting = false;
            this.health = 100;  // bu farklı
            this.projectiles = []; // bu farklı
            this.timer = 0;
            this.frameX = 0;
            this.frameY = 0;
            this.spriteWidth =  194;
            this.spriteHeight = 194;
            this.minFrame = 0;
            this.maxFrame = 16;
            this.chosenDefender = chosenDefender;
        }
        draw(){
            ctx.fillStyle = 'blue';
            //ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.font = '30px Orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
            if (this.chosenDefender === 1){
                ctx.drawImage(defender1, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);

            }else if (this.chosenDefender === 2){
                ctx.drawImage(defender2, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
            }
        }
        update(){
            if (frame % 10 === 0){
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }
            if (this.shooting) {
                this.timer++;
                if (this.timer % 100 === 0) {
                    projectiles.push(new Projectiles(this.x + 70, this.y + 25, this.chosenDefender));
                }
            } else {
                this.timer = 0;
            }
        }
    }

    function handleDefenders(){
        for (let i = 0; i < defenders.length; i++){
            defenders[i].draw();
            defenders[i].update();
            if (enemyPositions.indexOf(defenders[i].y) !== -1){ //
                defenders[i].shooting = true;
            } else {
                defenders[i].shooting = false;
            }
            for (let j = 0; j < enemies.length; j++){
                if (defenders[i] && collision(defenders[i], enemies[j])){
                    enemies[j].movement = 0;
                    defenders[i].health -= 1;
                }
                if (defenders[i] && defenders[i].health <= 0){
                    defenders.splice(i, 1);
                    i--;
                    enemies[j].movement = enemies[j].speed;
                }
            }
        }
    }
    const card1 = {
        x: 10,
        y: 10,
        width: 70, 
        height: 85
    }
    const card2 = {
        x: 90,
        y: 10,
        width: 70, 
        height: 85

    }
    function chooseDefender (){
        let card1stroke = 'black';
        let card2stroke = 'black';
        if(collision(mouse, card1)){
            chosenDefender = 1;
        }else if (collision(mouse, card2) && mouse.clicked){
            chosenDefender = 2;
        }
        if(chosenDefender === 1){
            card1stroke = 'gold';
            card2stroke = 'black';
        }else if (chosenDefender === 2){
            card1stroke = 'black';
            card2stroke = 'gold';
        }else {
            card1stroke = 'black';
            card2stroke = 'black';
        }

        ctx.lineWidth = 1;
        ctx.fillStyle= 'black'; // böyleydi ctx.fillStyle= 'rgba(0,0,0,0.2)';
        ctx.fillRect(card1.x, card1.y,card1.width, card1.height);
        ctx.strokeStyle = card1stroke;
        ctx.fillRect(card1.x, card1.y, card1.width, card1.height);
        ctx.drawImage(defender1, 0 , 0, 194, 194 , 0, 5 , 194/2, 194/2);
        ctx.fillRect(card2.x, card2.y, card2.width, card2.height);
        ctx.drawImage(defender2, 0 , 0, 194, 194 , 80, 5 , 194/2, 194/2);
        ctx.strokeStyle = card2stroke;
        ctx.strokeRect(card2.x, card2.y,card2.width, card2.height);
    }
    //Floating Messages
    const floatingMessages = [];
    class floatingMessage {
        constructor(value, x, y, size, color){
            this.value = value;
            this.x = x;
            this.y = y;
            this.size = size;
            this.lifeSpan= 0;
            this.color = color;
            this.opacity = 1;
        }
        update(){
            this.y -= 0.3;
            this.lifeSpan += 1;
            if(this.opacity > 0.03) this.opacity -=0.03;
        }
        draw(){
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.font = this.size + 'px Orbitron';
            ctx.fillText(this.value, this.x, this.y);
            ctx.globalAlpha = 1;
        }
    }
    function handleFloatingMessages(){
        for (let i = 0; i < floatingMessages.length; i++){
            floatingMessages[i].update();
            floatingMessages[i].draw();
            if (floatingMessages[i].lifespan >= 50){
                floatingMessages.splice(i, 1);
                i--;
            }
        }
    }
    // Dusmanlar
    const enemyTypes =[];
    const enemy1 = new Image();
    enemy1.src ='enemy1.png';
    enemyTypes.push(enemy1);
    const enemy2 = new Image();
    enemy2.src = 'enemy2.png';
    enemyTypes.push(enemy2);


    class Enemy {
        constructor(verticalPosition, type){
            this.x = canvas.width;
            this.y = verticalPosition;
            this.width = cellSize - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.speed = Math.random() * 0.2 + 0.4;
            this.movement = this.speed + (score*0.0005);
            this.health = 100;
            this.maxHealth = this.health;
            this.enemyType = enemyTypes[type];
            this.frameX = 0;
            this.frameY = 0;
            this.maxFrame= 4;
            this.minFrame = 0;
            this.spriteWidth = 256;
            this.spriteHeight = 256;
            this.audio = new Audio();
            this.audio2 = new Audio();
            
            if (this.enemyType === enemy1) {
                this.audio.src = 'Audio/hover.mp3';
                this.health = 100;
            } else if (this.enemyType === enemy2) {
                this.audio.src = 'Audio/hover.mp3';
                this.health = 100;
            } else if (this.enemyType) {
                this.audio.src = 'Audio/flap.mp3'
                this.audio.loop = true;
                this.audio2.src = 'Audio/screech2.mp3'
                this.maxFrame = 8;
                this.spriteWidth = 511;
                this.spriteHeight = 769;
                this.health = 100;
            }
            this.audio.volume = 0.05;
            this.audio.play();
            this.audio2.volume = 0.04
            this.audio2.play();

            var audio = new Audio('audio_file.mp3');
            audio.play();

            this.audio = new Audio;
            this.audio.src = 'Audio/collect.mp3';




            /*
            if ( this.enemyType === enemy1){
                this.maxFrame = 4;
            }else if (this.enemyType === enemy2){
                this.maxFrame = 7;
            }
            */            
        }
// animasyon hızı
        update(){
            this.x -= this.movement;
            if(frame % 9=== 0){
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }
        }
        draw(){
            //ctx.fillStyle = 'red';
            //ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.font = '30px Orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
            //ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
    }
    function handleEnemies(){
        for (let i = 0; i < enemies.length; i++){
            enemies[i].update();
            enemies[i].draw();
            if (enemies[i].x < 0){
                gameOver = true;
            }
            if (enemies[i].health <= 0){
                let gainedResources = enemies[i].maxHealth/10;
                floatingMessages.push(new floatingMessages('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'black'));
                floatingMessages.push(new floatingMessage('+' + gainedResources, 470, 85, 30, 'gold'));
                numberOfResources += gainedResources;
                score += gainedResources;
                const findThisIndex = enemyPositions.indexOf(enemies[i].y);
                enemyPositions.splice(findThisIndex, 1);
                enemies.splice(i, 1);
                i--;
            }
        }
        if (frame % enemiesInterval === 0 && score < winningScore){
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Enemy(verticalPosition));
            enemyPositions.push(verticalPosition);
            if (enemiesInterval > 120) enemiesInterval -= 50;
        }
    }

    // Savunucu Kaynagi

    const resource1 = new Image();
    resource1.src = 'Collectables/greenStar.png';
    const resource2 = new Image();
    resource2.src = 'Collectables/redStar.png';
    const resource3 = new Image();
    resource3.src = 'Collectables/goldStar.png';

    const amounts = [20, 30, 40];
    class Resource {
        constructor(){
            this.x = Math.random() * (canvas.width - cellSize);
            this.y = (Math.floor(Math.random() * 5) + 1) * cellSize + 25;
            this.width = cellSize * 0.6;
            this.height = cellSize * 0.6;
            this.amount = amounts[Math.floor(Math.random() * amounts.length)];
            this.speed = Math.random() * 0.4 + 0.8;
            this.frameX = 0;
            this.frameY = 0;
            this.frame = 0;
            this.spriteWidth = 318;
            this.spriteHeight = 307;
            this.minFrame = 0;
            this.maxFrame = 5;
            this.audio = new Audio;
            this.audio.src = 'Audio/collect.mp3';

            if (this.amount === 20) {
                this.spriteColor = resource1;
            } else if (this.amount === 30) {
                this.spriteColor = resource2;
            } else {
                this.spriteColor = resource3;
            }
        }
        draw(){
            //ctx.fillStyle = 'yellow';
            //ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'yellow';
            ctx.font = '20px Orbitron';
            ctx.fillText(this.amount, this.x + 15, this.y + 25);
            ctx.drawImage(this.spriteColor, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight, this.x, this.y, this.width, this.height);
        }
        update() {
            if (frame % 10 === 0) {
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }
        }
        starAudio() {
            this.audio.play();
        }
    }
    function handleResources(){
        if (frame % 500 === 0 && score < winningScore){
            resources.push(new Resource());
        }
        for (let i = 0; i < resources.length; i++){
            resources[i].update();
            resources[i].draw();
            if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)){
                numberOfResources += resources[i].amount;
                floatingMessages.push(new floatingMessage('+' + resources[i].amount, resources[i].x, resources[i].y, 30, 'black'));
                floatingMessages.push(new floatingMessage('+' + resources[i].amount, 470, 85, 30, 'gold'));
                resources.splice(i, 1);
                i--;
            }
        }
    }

    // utilities
    
    function handleGameStatus(){
        ctx.fillStyle = 'gold';
        ctx.font = '30px Orbitron';
        ctx.fillText('Yerli ve Millilik : ' + score, 180, 40);
        ctx.fillText('Yerli Kaynaklar: ' + numberOfResources, 180, 80);
        if (gameOver){
            ctx.fillStyle = 'black';
            ctx.font = '90px Orbitron';
            ctx.fillText('Dıs Gucler Kazandi!', 100, 300);
        }
        if (score >= winningScore && enemies.length === 0){
            ctx.fillStyle = 'black';
            ctx.font = '60px Orbitron';
            ctx.fillText('LEVEL COMPLETE', 130, 300);
            ctx.font = '30px Orbitron';
            ctx.fillText('You win with ' + score + ' points!', 134, 340);
        }
    }
    canvas.addEventListener('click', function(){
        const gridPositionX = mouse.x  - (mouse.x % cellSize) + cellGap;
        const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
        if (gridPositionY < cellSize) return;
        for (let i = 0; i < defenders.length; i++){
            if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) 
            return;
        }
        let defenderCost = 100;

        if (chosenDefender === 1) {
            defenderCost = 100;
        } else if (chosenDefender === 2) {
            defenderCost = 100;
        }
        if (numberOfResources >= defenderCost){
            defenders.push(new Defender(gridPositionX, gridPositionY));
            numberOfResources -= defenderCost;
        }
        else{
            floatingMessages.push(new floatingMessage("Yetersiz Kaynak!", mouse.x, mouse.y, 20,'blue'));
        }
    });
//background
    const background = new Image();
    background.src = 'Background/space.jpg';

    function handleBackground() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }
    function animate(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
        handleGameGrid();
        handleDefenders();
        handleResources();
        handleProjectiles();
        chooseDefender();
        function handleEnemies()
        handleFloatingMessages();
        frame++;
        if (!gameOver) requestAnimationFrame(animate);
    }
    animate();

    function collision(first, second){
        if (    !(  first.x > second.x + second.width ||
                    first.x + first.width < second.x ||
                    first.y > second.y + second.height ||
                    first.y + first.height < second.y)
        ) {
            return true;
        };
    };

    window.addEventListener('resize', function(){
        canvasPosition = canvas.getBoundingClientRect();
    })
