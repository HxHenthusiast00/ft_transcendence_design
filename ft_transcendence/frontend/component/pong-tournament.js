class PongTournament extends HTMLElement {
    constructor() {
        super();
        this.players = [];
        this.brackets = [];
        this.currentRound = 0;
        this.currentMatch = null;
    }

    connectedCallback() {
        if (this.loadTournamentState()) {
            this.showCurrentState();
        } else {
            this.showParticipantCountForm();
        }
    }

    showParticipantCountForm() {
        this.innerHTML = `
            <h2>Pong Tournament Setup</h2>
            <form id="participantCountForm">
                <label for="participantCount">Number of Participants:</label>
                <input type="number" id="participantCount" min="2" max="16" required>
                <button type="submit">Next</button>
            </form>
        `;
        this.querySelector('#participantCountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const count = parseInt(this.querySelector('#participantCount').value);
            this.showRegistrationForm(count);
        });
    }

    showRegistrationForm(count) {
        let inputs = '';
        for (let i = 1; i <= count; i++) {
            inputs += `<input type="text" id="player${i}" placeholder="Player ${i} Name" required><br>`;
        }
        this.innerHTML = `
            <h2>Player Registration</h2>
            <form id="registrationForm">
                ${inputs}
                <button type="submit">Start Tournament</button>
            </form>
        `;
        this.querySelector('#registrationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.players = Array.from({ length: count }, (_, i) => this.querySelector(`#player${i+1}`).value.trim());
            this.startTournament();
        });
    }

    startTournament() {
        this.brackets = [this.createInitialBracket(this.players)];
        this.currentRound = 0;
        this.saveTournamentState();
        this.playNextMatch();
        console.log('Tournament State:', JSON.stringify({
            players: this.players,
            brackets: this.brackets,
            currentRound: this.currentRound,
            currentMatch: this.currentMatch
          }, null, 2));
    }

    createInitialBracket(players) {
        const shuffled = players.sort(() => 0.5 - Math.random());
        const bracket = [];
        for (let i = 0; i < shuffled.length; i += 2) {
            if (i + 1 < shuffled.length) {
                bracket.push([shuffled[i], shuffled[i + 1]]);
            } else {
                bracket.push([shuffled[i]]); // Single player advances automatically
            }
        }
        return bracket;
    }

    playNextMatch() {
        if (this.brackets[this.currentRound].every(match => match.length === 1)) {
          // All matches in this round are complete
          if (this.brackets[this.currentRound].length === 1) {
            // Tournament is over
            this.declareTournamentWinner(this.brackets[this.currentRound][0][0]);
            return;
          }
          // Prepare next round
          this.currentRound++;
          this.brackets[this.currentRound] = this.createNextRoundBracket(this.brackets[this.currentRound - 1]);
        }
      
        // Find next match to play
        this.currentMatch = this.brackets[this.currentRound].find(match => match.length === 2);
        if (this.currentMatch) {
          this.showMatchmaking(this.currentMatch[0], this.currentMatch[1]);
        } else {
          // No more matches in this round, should move to next round
          this.playNextMatch();
        }
      }
      
      createNextRoundBracket(previousRound) {
        return previousRound.filter(match => match.length === 1).map(match => match[0]);
      }

    createNextRoundBracket(winners) {
        const nextRound = [];
        for (let i = 0; i < winners.length; i += 2) {
            if (i + 1 < winners.length) {
                nextRound.push([winners[i][0], winners[i + 1][0]]);
            } else {
                nextRound.push([winners[i][0]]); // Odd player out
            }
        }
        return nextRound;
    }

    showMatchmaking(player1, player2) {
        this.innerHTML = `
            <h2>Next Match</h2>
            <p>${player1} vs ${player2}</p>
            <button id="startMatch">Start Match</button>
        `;
        this.querySelector('#startMatch').addEventListener('click', () => this.startMatch(player1, player2));
    }

    startMatch(player1, player2) {
        localStorage.setItem('pongPlayer1Name', player1);
        localStorage.setItem('pongPlayer2Name', player2);
        localStorage.setItem('pongTournamentMode', 'true');
        window.location.hash = '#pong';

        // Listen for the game end event
        window.addEventListener('pongGameEnd', this.onMatchEnd.bind(this), { once: true });
    }

    onMatchEnd(event) {
        const winner = event.detail;
        // Update the current bracket with the winner
        this.brackets[this.currentRound] = this.brackets[this.currentRound].map(match => 
          match.includes(this.currentMatch[0]) || match.includes(this.currentMatch[1]) ? [winner] : match
        );
        this.currentMatch = null; // Clear the current match
        this.saveTournamentState();
        this.showMatchResult(winner);
      }

    showMatchResult(winner) {
        this.innerHTML = `
            <h2>Match Result</h2>
            <p>${winner} wins the match!</p>
            <button id="nextMatch">Next Match</button>
        `;
        this.querySelector('#nextMatch').addEventListener('click', () => this.playNextMatch());
    }

    declareTournamentWinner(winner) {
        this.innerHTML = `
          <h2>Tournament Ended</h2>
          <p>${winner} is the tournament champion!</p>
          <button id="newTournament">Start New Tournament</button>
          <button id="returnToDashboard">Return to Dashboard</button>
        `;
        this.querySelector('#newTournament').addEventListener('click', () => {
          this.clearTournamentState();
          this.showParticipantCountForm();
        });
        this.querySelector('#returnToDashboard').addEventListener('click', () => {
          this.clearTournamentState();
          window.location.hash = '#dashboard';
        });
      }

    saveTournamentState() {
        const state = {
            players: this.players,
            brackets: this.brackets,
            currentRound: this.currentRound,
            currentMatch: this.currentMatch
        };
        localStorage.setItem('pongTournamentState', JSON.stringify(state));
        console.log("Saved tournament state:", state);
    }

    loadTournamentState() {
        const savedState = localStorage.getItem('pongTournamentState');
        if (savedState) {
            const state = JSON.parse(savedState);
            Object.assign(this, state);
            console.log("Loaded tournament state:", state);
            return true;
        }
        return false;
        console.log('Tournament State:', JSON.stringify({
            players: this.players,
            brackets: this.brackets,
            currentRound: this.currentRound,
            currentMatch: this.currentMatch
          }, null, 2));
    }

    clearTournamentState() {
        localStorage.removeItem('pongTournamentState');
        localStorage.removeItem('pongTournamentMode');
        localStorage.removeItem('pongPlayer1Name');
        localStorage.removeItem('pongPlayer2Name');
        console.log("Cleared tournament state");
    }

    showCurrentState() {
        if (this.currentMatch) {
            this.showMatchmaking(this.currentMatch[0], this.currentMatch[1]);
        } else {
            this.playNextMatch();
        }
    }
}

    

customElements.define('pong-tournament', PongTournament);