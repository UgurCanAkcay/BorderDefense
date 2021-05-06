function startGame () {
    const startGameButton = document.getElementById('startGame');
    startGameButton.parentNode.removeChild(startGameButton);
    const canvas = document.getElementById('canvas1');
    let ctx = canvas.getContext('2d')
    canvas.width = 900;
    canvas.height = 600;
    canvas.classList.remove("active");

// Genel Degiskenler
    let numberOfResources = 300;
    let enemiesInterval = 300;
    let bossesInterval = 2000;
    let frame = 0;
    let gameOver = false;
    let score = 0;
    let chosenDefender = 1;
    const cellSize = 100;
    const cellGap = 3;
    const winningScore = 50000;
    const enemies = [];
    const enemyPosition = [];
    const gameGrid = [];
    const defenders = [];
    const projectiles = [];
    const resources = [];
    const myStorage = window.localStorage;
    const lastHighScore = parseInt(localStorage.getItem("highScore"));
    const highScoreDisplay = document.getElementById("highScoreInfo");

    if (isNaN(lastHighScore)) {
        highScoreDisplay.innerHTML = "Daha önce oynayan olmadı.";
    } else {
        highScoreDisplay.innerHTML = `High Score:  ${lastHighScore}`;
    }

// Mouse trickleri
    const mouse = {
        x: 10,
        y: 10,
        width: 0.1,
        height: 0.1,
        clicked: false
    }
    canvas.addEventListener('mousedown', function () {
        mouse.clicked = true;
    });
    canvas.addEventListener('mouseup', function () {
        mouse.clicked = false;
    });

    let canvasPosition = canvas.getBoundingClientRect();
    canvas.addEventListener('mousemove', function (e) {
        mouse.x = e.x - canvasPosition.left;
        mouse.y = e.y - canvasPosition.top;
    });

    canvas.addEventListener('mouseleave', function () {
        mouse.x = undefined;
        mouse.y = undefined;
    })

// Game board
    const controlsBar = {
        width: canvas.width,
        height: cellSize
    }

    class Cell {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = cellSize;
            this.height = cellSize;
        }

        draw() {
            if (mouse.x && mouse.y && collision(this, mouse)) {
                ctx.strokeStyle = 'gold';
                ctx.strokeRect(this.x, this.y, this.width, this.height);
            }
        }
    }

    function createGrid() {
        for (let y = cellSize; y < canvas.height; y += cellSize) {
            for (let x = 0; x < canvas.width; x += cellSize) {
                gameGrid.push(new Cell(x, y));
            }
        }
    }
    createGrid();

    function handleGameGrid() {
        for (let i = 0; i < gameGrid.length; i++) {
            gameGrid[i].draw();
        }
    }

// Kursunlar
    const bullet1 = new Image();
    bullet1.src = 'Sprites/Projectiles/Bullets/bullet.png';
    const bullet2 = new Image();
    bullet2.src = 'Sprites/Projectiles/Bullets/bullet.png';
    const bullet3 = new Image();
    bullet3.src = 'Sprites/Projectiles/Bullets/bullet.png';

    class Projectiles {
        constructor(x, y, type,) {
            this.x = x;
            this.y = y;
            this.defenderType = type;
            this.width = 35;
            this.height = 45;
            this.power = 0;
            this.speed = 8;
            this.frameX = 0;
            this.frameY = 0;
            this.spriteWidth = 256;
            this.spriteHeight = 256;
            this.minFrame = 0;
            this.maxFrame = 6;
            this.audio = new Audio();

            if (this.defenderType === 1) {
                this.power = 25;
            } else if (this.defenderType === 2) {
                this.power = 45;
            } else if (this.defenderType === 3) {
                this.power = 60;
            }

            if (this.defenderType === 1) {
                this.projectile = bullet1;
            } else if (this.defenderType === 2) {
                this.projectile = bullet2;
            } else if (this.defenderType === 3) {
                this.projectile = bullet3;
            }

            if (this.defenderType === 1) {
                this.audio.src = 'Sprites/Audio/gunshot.mp3';
                this.audio.volume = 0.08
                this.audio.play();
            } else if (this.defenderType === 2) {
                this.audio.src = 'Sprites/Audio/lasergun.mp3';
                this.audio.volume = 0.16
                this.audio.play();
            } else if (this.defenderType === 3) {
                this.audio.src = 'Sprites/Audio/lasergun2.mp3';
                this.audio.volume = 0.12
                this.audio.play();
            }   
        }

        update() {
            this.x += this.speed;
        }

        draw() {
            ctx.beginPath();
            ctx.drawImage(
                this.projectile, this.frameX * this.spriteWidth + 10, this.frameY * this.spriteHeight + 10,
                this.spriteWidth + 10, this.spriteHeight + 10, this.x, this.y, this.width, this.height);
        }
    }

    function handleProjectiles() {
        for (let i = 0; i < projectiles.length; i++) {
            projectiles[i].update();
            projectiles[i].draw();
            for (let j = 0; j < enemies.length; j++) {
                if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                    enemies[j].health -= projectiles[i].power;
                    projectiles.splice(i, 1);
                    i--;
                }
            }
// Ekranda olmayan dusmana vurmayı engeller
            if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
                projectiles.splice(i, 1);
                i--;
            }
        }
    }

// Savunucular
    const defender1 = new Image();
    defender1.src = 'Sprites/Defender/soldiers.png';
    const defender2 = new Image();
    defender2.src = 'Sprites/Defender/redskulls.png';
    const defender3 = new Image();
    defender3.src = 'Sprites/Defender/starlords.png';

    class Defender {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.width = cellSize - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.shooting = false;
            this.timer = 0;
            this.frameX = 0;
            this.frameY = 0;
            this.spriteWidth = 140;
            this.spriteHeight = 140;
            this.minFrame = 0;
            this.maxFrame = 6;
            this.chosenDefender = chosenDefender;

            if (this.chosenDefender === 1) {
                this.maxFrame = 6;
                this.spriteWidth = 140;
                this.spriteHeight = 140;
                this.health = 100;
            } else if (this.chosenDefender === 2) {
                this.maxFrame = 6;
                this.spriteWidth = 130;
                this.spriteHeight = 130;
                this.health = 150;
            } else if (this.chosenDefender === 3) {
                this.maxFrame = 6;
                this.spriteWidth = 130;
                this.spriteHeight = 130;
                this.health = 200;
            }
        }
        
        draw() {
            ctx.fillStyle = 'limegreen';
            ctx.font = '20px orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 28, this.y + -5);
            if (this.chosenDefender === 1) {
                ctx.drawImage(
                    defender1,
                    this.frameX * this.spriteWidth,
                    0,
                    this.spriteWidth, this.spriteHeight,
                    this.x, this.y,
                    this.width, this.height
                );
            } else if (this.chosenDefender === 2) {
                ctx.drawImage(
                    defender2,
                    this.frameX * this.spriteWidth,
                    0,
                    this.spriteWidth, this.spriteHeight,
                    this.x, this.y,
                    this.width, this.height
                );
            } else if (this.chosenDefender === 3) {
                ctx.drawImage(
                    defender3,
                    this.frameX * this.spriteWidth,
                    0,
                    this.spriteWidth, this.spriteHeight,
                    this.x, this.y,
                    this.width, this.height
                );
            }
        }
//if shooting kısmı olayı, dusman gorunce vurma
        update() {
            if (frame % 10 === 0) {
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

    function handleDefenders() {
        for (let i = 0; i < defenders.length; i++) {
            defenders[i].draw();
            defenders[i].update();
            defenders[i].shooting = enemyPosition.indexOf(defenders[i].y) !== -1;
            for (let j = 0; j < enemies.length; j++) {
                if (defenders[i] && collision(defenders[i], enemies[j])) {
                    enemies[j].movement = 0;
                    defenders[i].health -= 0.2;
                }
                if (defenders[i] && defenders[i].health <= 0) {
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
    const card3 = {
        x: 170,
        y: 10,
        width: 70,
        height: 85
    }

    function chooseDefender() {
        let card1stroke = 'grey';
        let card2stroke = 'grey';
        let card3stroke = 'grey';
        if (collision(mouse, card1) && mouse.clicked) {
            chosenDefender = 1;
        } else if (collision(mouse, card2) && mouse.clicked) {
            chosenDefender = 2;
        } else if (collision(mouse, card3) && mouse.clicked) {
            chosenDefender = 3;
        }
        if (chosenDefender === 1) {
            card1stroke = 'gold';
            card2stroke = 'grey';
            card3stroke = 'grey';
        } else if (chosenDefender === 2) {
            card1stroke = 'grey';
            card2stroke = 'gold';
            card3stroke = 'grey';
        } else if (chosenDefender === 3) {
            card1stroke = 'grey';
            card2stroke = 'grey';
            card3stroke = 'gold';
        } else {
            card1stroke = 'grey';
            card2stroke = 'grey';
            card3stroke = 'grey';
        }

        ctx.lineWidth = 1;
        ctx.fillStyle = 'grey';

        ctx.fillRect(card1.x + 18, card1.y + 12, card1.width, card1.height);
        ctx.strokeStyle = card1stroke;
        ctx.strokeRect(card1.x + 18, card1.y + 12, card1.width, card1.height);
        ctx.drawImage(defender1, 0, 0, 150, 150, 0, 5, 871 / 6, 663 / 6);

        ctx.fillRect(card2.x + 25, card2.y + 14, card2.width, card2.height);
        ctx.strokeStyle = card2stroke;
        ctx.strokeRect(card2.x + 25, card2.y + 14, card2.width, card2.height);
        ctx.drawImage(defender2, 0, 0, 130, 130, 80, 5, 871 / 6, 663 / 6);

        ctx.fillRect(card3.x + 25, card3.y + 14, card3.width, card3.height);
        ctx.strokeStyle = card3stroke;
        ctx.strokeRect(card3.x + 25, card3.y + 14, card3.width, card3.height);
        ctx.drawImage(defender3, 0, 0, 128, 128, 160, 5, 871 / 6, 663 / 6);
    }

// Floating messages
    const floatingMessages = [];

    class floatingMessage {
        constructor(value, x, y, size, color) {
            this.value = value;
            this.x = x;
            this.y = y;
            this.size = size;
            this.lifeSpan = 0;
            this.color = color;
            this.opacity = 1;
        }

        update() {
            this.y -= 0.3;
            this.lifeSpan += 1;
            if (this.opacity > 0.05) this.opacity -= 0.05;
        }

        draw() {
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.font = this.size + 'px orbitron';
            ctx.fillText(this.value, this.x, this.y);
            ctx.globalAlpha = 1;
        }
    }

    function handleFloatingMessages() {
        for (let i = 0; i < floatingMessages.length; i++) {
            floatingMessages[i].update();
            floatingMessages[i].draw();
            if (floatingMessages[i].lifeSpan >= 50) {
                floatingMessages.splice(i, 1);
                i--;
            }
        }
    }

// Enemies
    const enemyTypes = [];
    const enemy1 = new Image();
    enemy1.src = 'Sprites/Aliens/enemy1.png';
    enemyTypes.push(enemy1);
    const enemy2 = new Image();
    enemy2.src = 'Sprites/Aliens/enemy2.png'
    enemyTypes.push(enemy2);
    const boss1 = new Image();
    boss1.src = 'Sprites/Aliens/alienboss1.png';
    enemyTypes.push(boss1);


    class Enemy {
        constructor(verticalPosition, type) {
            this.x = canvas.width;
            this.y = verticalPosition;
            this.width = cellSize - cellGap * 2;
            this.height = cellSize - cellGap * 2;
            this.speed = Math.random() * 0.4 + 0.8;
            this.movement = this.speed + (score*0.0005);
            this.health = 100;
            this.maxHealth = this.health;
            this.enemyType = enemyTypes[type];
            this.frameX = 0;
            this.frameY = 0;
            this.minFrame = 0;
            this.maxFrame = 4;
            this.spriteWidth = 575;
            this.spriteHeight = 817;
            this.audio = new Audio();
            this.audio2 = new Audio();

            if (this.enemyType === enemy1) {
                this.audio.src = 'Sprites/Audio/aw.mp3';
                this.maxFrame = 4;
                this.spriteWidth = 256;
                this.spriteHeight = 256;
                this.health = 50;
            } else if (this.enemyType === enemy2) {
                this.audio.src = 'Sprites/Audio/aw.mp3';
                this.maxFrame = 7;
                this.spriteWidth = 256;
                this.spriteHeight = 256;
                this.health = 75;
            } else if (this.enemyType === boss1) {
                this.audio.src = 'Sprites/Audio/monsterar.mp3'
                this.audio.loop = true;
                this.audio2.src = 'Sprites/Audio/screech1.mp3'
                this.maxFrame = 8;
                this.spriteWidth = 511;
                this.spriteHeight = 769;
                this.health = 200;
            }
            this.audio.volume = 0.08;
            this.audio.play();
            this.audio2.volume = 0.06;
            this.audio2.play();
            //
            for (let i = 0; i <= score; i++) {
                if (score > 0) {
                    this.health = this.health + (this.health * 0.0003);
                }
            }
        // bur aradaki sonradan ekleme cıkabilir
        }
// Animation speed
        update() {
            this.x -= this.movement;
            if (frame % 9 === 0) {
                if (this.frameX < this.maxFrame) this.frameX++;
                else this.frameX = this.minFrame;
            }
// puan hiz ayari
            if (score != 0) {
                this.movement = this.speed + (score*0.005);
            }
        }

        draw() {
            ctx.fillStyle = 'red';
            ctx.font = '20px orbitron';
            ctx.fillText(Math.floor(this.health), this.x + 28, this.y + -5);
            ctx.drawImage(this.enemyType, this.frameX * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height);
        }
// Dusman olunca sesi durdurma
        killAudio() {
            if (this.enemyType.health === 0){
                this.audio.stop();
                this.audio2.stop();
            }
        }
    }

    function handleEnemies() {
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].update();
            enemies[i].draw();
            if (enemies[i].x < 0) {
                gameOver = true;
            }
            if (enemies[i].health <= 0) {
                let gainedResources = enemies[i].maxHealth / 5; 
                floatingMessages.push(new floatingMessage('+' + gainedResources, enemies[i].x, enemies[i].y, 30, 'gold'));
                floatingMessages.push(new floatingMessage('+' + gainedResources, 565, 65, 30, 'gold'));
                numberOfResources += gainedResources;
                score += gainedResources;
                const findThisIndex = enemyPosition.indexOf(enemies[i].y);
                enemyPosition.splice(findThisIndex, 1);
                enemies.splice(i, 1);
                i--;
             }
        }
        if (frame % enemiesInterval === 1) {
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Enemy(verticalPosition, randomIndex(3)));
            enemyPosition.push(verticalPosition);
            if (enemiesInterval > 120) enemiesInterval -= 50;
        }
        if (frame % bossesInterval === 2 && score > 0) { // burayı 1 den 2 yaptık
            let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize + cellGap;
            enemies.push(new Enemy(verticalPosition, 3+randomIndex(2)));
            enemyPosition.push(verticalPosition);
        }

    }


// Kaynaklar
    const resource1 = new Image();
    resource1.src = 'Sprites/Resources/goldstar.png';
    const resource2 = new Image();
    resource2.src = 'Sprites/Resources/redstar.png';
    const resource3 = new Image();
    resource3.src = 'Sprites/Resources/goldcoin.png';

    const amounts = [20, 30, 50];


    class Resource {
        constructor() {
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
            this.audio.src = 'Sprites/Audio/collect.mp3';

            if (this.amount === 20) {
                this.spriteColor = resource1;
            } else if (this.amount === 30) {
                this.spriteColor = resource2;
            } else if (this.amount === 50){
                this.spriteColor = resource3;
                this.spriteWidth = 278;
                this.spriteHeight = 228;
                this.maxFrame = 14;
            }
        }

        draw() {
            ctx.fillStyle = 'lightblue';
            ctx.font = '20px orbitron';
            ctx.fillText(this.amount, this.x + 13, this.y + -10);
            ctx.drawImage(this.spriteColor, this.frameX * this.spriteWidth, this.frameY * this.spriteHeight, this.spriteWidth, this.spriteHeight,
                this.x, this.y, this.width, this.height);

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

    function handleResources() {
        if (frame % 500 === 0 && score < winningScore) { // burada %300 yaptım ama 500 de iyidir
            resources.push(new Resource());
        }
        for (let i = 0; i < resources.length; i++) {
            resources[i].update();
            resources[i].draw();
            if (resources[i] && mouse.x && mouse.y && collision(resources[i], mouse)) {
                resources[i].starAudio();
                numberOfResources += resources[i].amount;
                floatingMessages.push(new floatingMessage('+' + resources[i].amount,
                    resources[i].x, resources[i].y, 30, 'gold'));
                floatingMessages.push(new floatingMessage('+' + resources[i].amount,
                    580, 70, 30, 'gold'));
                resources.splice(i, 1);
                i--;
            }
        }
    }

//Utility kit

    function randomIndex(length) {
        return Math.floor(Math.random() * length);
    }

    function handleGameStatus() {
        ctx.fillStyle = 'gold';
        ctx.font = '30px orbitron';
        ctx.fillText('Skor: ' + score, 300, 40);
        ctx.fillText('Kaynak: ' + numberOfResources, 300, 80);
        if (gameOver) {
            if (score <= 10000) {
                let myGradient = ctx.createLinearGradient(0, 0, 1200, 0,)
                myGradient.addColorStop(0, 'orange');
                myGradient.addColorStop(0.4, 'red');
                myGradient.addColorStop(0.6, 'yellow');
                ctx.fillStyle = myGradient;
                ctx.font = '90px orbitron';
                ctx.fillText('Son Kale Devrildi!', 16, 350);
                updateHighScore(score);
                document.getElementById('canvas1')
                create(' Benim skorum: ' + score );     
            }
             else if (score > 10000 && score <= 30000) {
                let myGradient2 = ctx.createLinearGradient(0, 0, 1200, 0,)
                myGradient2.addColorStop(0, 'orange');
                myGradient2.addColorStop(0.4, 'red');
                myGradient2.addColorStop(0.6, 'yellow');
                ctx.fillStyle = myGradient2;
                ctx.font = '90px orbitron';
                ctx.fillText('You Suck!', 180, 250);
                ctx.fillText('Game Over', 150, 340);
                updateHighScore(score)
                create(' Benim skorum: ' + score ); 
        }  
    }
}
// tamamlayamadim
    function updateHighScore() {
        if (score > lastHighScore || isNaN(lastHighScore)) {
            localStorage.setItem('highScore', String(score));
            highScoreDisplay.innerHTML = `High Score:  ${lastHighScore}`;
        }
    }

    canvas.addEventListener('click', function () {
        const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
        const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
        if (gridPositionY < cellSize) return;
        for (let i = 0; i < defenders.length; i++) {
            if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
                return;
        }
        let defenderCost;
        if (chosenDefender === 1) {
            defenderCost = 75;
        } else if (chosenDefender === 2) {
            defenderCost = 125;
        } else if (chosenDefender === 3) {
            defenderCost = 175;
        }
        if (numberOfResources >= defenderCost) {
            defenders.push(new Defender(gridPositionX, gridPositionY));
            numberOfResources -= defenderCost;
        } else {
            floatingMessages.push(new floatingMessage("Yetersiz Kaynak", mouse.x, mouse.y,
                25, 'red'));
        }
    });

// Tekrar Eden Background
    const background = new Image();
    background.src = 'Sprites/Background/backgroundborderdefensee.png';

    function handleBackground() {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleBackground();
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
        handleGameGrid();
        handleDefenders();
        handleResources();
        handleProjectiles();
        handleEnemies();
        chooseDefender();
        handleGameStatus();
        handleFloatingMessages();
        frame++;
        if (!gameOver) requestAnimationFrame(animate);
    }

    animate();

    function collision(first, second) {
        if (!(first.x > second.x + second.width ||
            first.x + first.width < second.x ||
            first.y > second.y + second.height ||
            first.y + first.height < second.y)) {
            return true;
        }
    }

    window.addEventListener('resize', function () {
        canvasPosition = canvas.getBoundingClientRect();
    })
}