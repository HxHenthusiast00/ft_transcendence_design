class PongGame extends HTMLElement {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.ball = { x: 400, y: 200, radius: 10, dx: 5, dy: 5 };
        this.paddle1 = { x: 10, y: 150, width: 10, height: 100 };
        this.paddle2 = { x: 780, y: 150, width: 10, height: 100 };
        this.keys = {};
        this.score1 = 0;
        this.score2 = 0;
        this.player1Name = '';
        this.player2Name = '';
        this.gameStarted = false;
        this.tournamentMode = false;
    }

    connectedCallback() {
        this.tournamentMode = localStorage.getItem('pongTournamentMode') === 'true';
        console.log("Tournament mode:", this.tournamentMode);
        
        if (this.tournamentMode) {
            this.player1Name = localStorage.getItem('pongPlayer1Name');
            this.player2Name = localStorage.getItem('pongPlayer2Name');
            console.log("Tournament players:", this.player1Name, this.player2Name);
            this.startGame();
        } else if (this.loadGameState()) {
            this.startGame();
        } else {
            this.showRegistrationPopup();
        }
    }
    saveGameState() {
        const gameState = {
            ball: this.ball,
            paddle1: this.paddle1,
            paddle2: this.paddle2,
            score1: this.score1,
            score2: this.score2,
            player1Name: this.player1Name,
            player2Name: this.player2Name,
            gameStarted: this.gameStarted
        };
        localStorage.setItem('pongGameState', JSON.stringify(gameState));
    }

    loadGameState() {
        const savedState = localStorage.getItem('pongGameState');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            Object.assign(this, gameState);
            return true;
        }
        return false;
    }

    clearGameState() {
        localStorage.removeItem('pongGameState');
    }
    

    showRegistrationPopup() {
        this.innerHTML = `
            <div class="login-container">
                <h2>Player Registration</h2>
                <div class="form-group">
                <input type="text" id="player1Name" placeholder="Player 1 Name">
                <input type="text" id="player2Name" placeholder="Player 2 Name">
                </div>
                <button id="registerPlayers">Register</button>
            </div>
        `;
        this.querySelector('#registerPlayers').addEventListener('click', this.registerPlayers.bind(this));
    }

    registerPlayers() {
        const player1Input = this.querySelector('#player1Name');
        const player2Input = this.querySelector('#player2Name');
        
        if (player1Input.value.trim() === '' || player2Input.value.trim() === '') {
            alert('Both players must enter a name.');
            return;
        }

        this.player1Name = player1Input.value.trim();
        this.player2Name = player2Input.value.trim();
        localStorage.setItem('pongPlayer1Name', this.player1Name);
        localStorage.setItem('pongPlayer2Name', this.player2Name);

        this.showMatchmakingWindow();
    }

    showMatchmakingWindow() {
        this.innerHTML = `
            <div class="popup">
                <h2>Matchmaking</h2>
                <p>Player 1: ${this.player1Name}</p>
                <p>Player 2: ${this.player2Name}</p>
                <button id="startGame">Start Game</button>
            </div>
        `;
        this.querySelector('#startGame').addEventListener('click', this.startGame.bind(this));
    }

    startGame() {
        console.log('Game State:', JSON.stringify({
            player1Name: this.player1Name,
            player2Name: this.player2Name,
            score1: this.score1,
            score2: this.score2,
            tournamentMode: this.tournamentMode
          }, null, 2));
        this.innerHTML = `
            <div id="gameArea">
                <div id="scoreBoard">
                    <span id="player1Score">${this.player1Name}: ${this.score1}</span> - <span id="player2Score">${this.player2Name}: ${this.score2}</span>
                </div>
                <canvas id="pongCanvas" width="800" height="400"></canvas>
            </div>
        `;

        this.canvas = this.querySelector('#pongCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        this.gameStarted = true;
        this.gameLoop();
    }

    handleKeyDown(e) {
        this.keys[e.key] = true;
    }

    handleKeyUp(e) {
        this.keys[e.key] = false;
    }

    update() {
        // Move paddles
        if (this.keys['w'] && this.paddle1.y > 0) this.paddle1.y -= 5;
        if (this.keys['s'] && this.paddle1.y < this.canvas.height - this.paddle1.height) this.paddle1.y += 5;
        if (this.keys['ArrowUp'] && this.paddle2.y > 0) this.paddle2.y -= 5;
        if (this.keys['ArrowDown'] && this.paddle2.y < this.canvas.height - this.paddle2.height) this.paddle2.y += 5;

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with top and bottom
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy *= -1;
        }

        // Ball collision with paddles
        if (
            (this.ball.x - this.ball.radius < this.paddle1.x + this.paddle1.width &&
             this.ball.y > this.paddle1.y && 
             this.ball.y < this.paddle1.y + this.paddle1.height) ||
            (this.ball.x + this.ball.radius > this.paddle2.x &&
             this.ball.y > this.paddle2.y && 
             this.ball.y < this.paddle2.y + this.paddle2.height)
        ) {
            this.ball.dx *= -1;
        }

        // Ball out of bounds
        if (this.ball.x < 0) {
            this.score2++;
            this.resetBall();
        } else if (this.ball.x > this.canvas.width) {
            this.score1++;
            this.resetBall();
        }

        this.updateScoreDisplay();
        this.saveGameState();
        // Check for winner
        if (this.score1 >= 3 || this.score2 >= 3) {
            this.showWinnerPopup();
        }
        console.log('Game State:', JSON.stringify({
            player1Name: this.player1Name,
            player2Name: this.player2Name,
            score1: this.score1,
            score2: this.score2,
            tournamentMode: this.tournamentMode
          }, null, 2));
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = -this.ball.dx;
    }

    updateScoreDisplay() {
        this.querySelector('#player1Score').textContent = `${this.player1Name}: ${this.score1}`;
        this.querySelector('#player2Score').textContent = `${this.player2Name}: ${this.score2}`;
    }

    draw() {
        // Clear the canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw center line
        this.ctx.strokeStyle = 'white';
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2, 0);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height);
        this.ctx.stroke();

        // Draw paddles
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.paddle1.x, this.paddle1.y, this.paddle1.width, this.paddle1.height);
        this.ctx.fillRect(this.paddle2.x, this.paddle2.y, this.paddle2.width, this.paddle2.height);

        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    gameLoop() {
        if (!this.gameStarted) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    showWinnerPopup() {
        this.gameStarted = false;
        const winner = this.score1 >= 3 ? this.player1Name : this.player2Name;
        console.log("Game ended. Winner:", winner);
        
        if (this.tournamentMode) {
            this.clearGameState();
            window.dispatchEvent(new CustomEvent('pongGameEnd', { detail: winner }));
            console.log("Dispatched pongGameEnd event");
            window.location.hash = '#tournament';
        } else {
            this.innerHTML += `
                <div class="popup">
                    <h2>Game Over</h2>
                    <p>${winner} wins!</p>
                    <button id="restartGame">Play Again</button>
                    <button id="returnToDashboard">Return to Dashboard</button>
                </div>
            `;
            this.querySelector('#restartGame').addEventListener('click', () => {
                this.clearGameState();
                this.score1 = 0;
                this.score2 = 0;
                this.showMatchmakingWindow();
            });
            this.querySelector('#returnToDashboard').addEventListener('click', () => {
                this.clearGameState();
                window.location.hash = '#dashboard';
            });
        }
    }

    clearGameState() {
        localStorage.removeItem('pongGameState');
        if (!this.tournamentMode) {
            localStorage.removeItem('pongTournamentMode');
            localStorage.removeItem('pongPlayer1Name');
            localStorage.removeItem('pongPlayer2Name');
        }
        console.log("Cleared game state");
    }
}

customElements.define('pong-game', PongGame);