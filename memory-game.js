
// Basic card choices for the memory game
const memorySymbols = [
  'Lion', 'Zebra', 'Tiger', 'Panda', 'Koala', 'Whale',
  'Shark', 'Eagle', 'Fox', 'Bear', 'Wolf', 'Frog'
];

// Page elements for the memory game
const difficultySelect = document.getElementById('difficultySelect');
const pairSelect = document.getElementById('pairSelect');
const startMemoryGameButton = document.getElementById('startMemoryGame');
const memoryTimerText = document.getElementById('memoryTimer');
const matchCountText = document.getElementById('matchCount');
const memoryScoreText = document.getElementById('memoryScore');
const wrongAttemptsText = document.getElementById('wrongAttempts');
const memoryMessage = document.getElementById('memoryMessage');
const memoryBoard = document.getElementById('memoryBoard');
const leaderboardList = document.getElementById('leaderboardList');

// State values that change while the game runs
let memoryCards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matchesFound = 0;
let wrongAttempts = 0;
let totalPairs = 8;
let timeLeft = 0;
let memorizationSeconds = 3;
let gameTimer = null;
let canFlipCards = false;
let currentScore = 0;
let roundTimeLimit = 0;
let finishPenalty = 0;

// Start button runs the whole setup
startMemoryGameButton.addEventListener('click', startMemoryGame);

// Show saved scores right when the page loads
renderLeaderboard();

// This starts a brand new memory round
function startMemoryGame() {
  clearInterval(gameTimer);

  totalPairs = Number(pairSelect.value);
  memorizationSeconds = Number(difficultySelect.value);
  matchesFound = 0;
  wrongAttempts = 0;
  currentScore = 0;
  finishPenalty = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  canFlipCards = false;

  roundTimeLimit = getGameTime(totalPairs);
  timeLeft = roundTimeLimit;

  matchCountText.textContent = matchesFound;
  wrongAttemptsText.textContent = wrongAttempts;
  memoryScoreText.textContent = currentScore;
  memoryTimerText.textContent = timeLeft;

  buildDeck();
  renderBoard(true);
  showMemoryMessage(`Memorize the cards. They will hide in ${memorizationSeconds} seconds.`);

  setTimeout(function() {
    hideAllCards();
    canFlipCards = true;
    startRoundTimer();
    showMemoryMessage('Cards are now hidden. Start matching.');
  }, memorizationSeconds * 1000);
}

// Time depends on how many pairs the player picked
function getGameTime(pairCount) {
  if (pairCount === 8) {
    return 120;
  }

  if (pairCount === 10) {
    return 150;
  }

  return 180;
}

// This builds two of each symbol, then mixes them
function buildDeck() {
  const chosenSymbols = memorySymbols.slice(0, totalPairs);
  const doubledCards = [];

  for (let i = 0; i < chosenSymbols.length; i++) {
    doubledCards.push(chosenSymbols[i]);
    doubledCards.push(chosenSymbols[i]);
  }

  memoryCards = shuffleArray(doubledCards).map(function(symbol, index) {
    return {
      id: index + 1,
      symbol: symbol,
      revealed: true,
      matched: false
    };
  });
}

// Simple shuffle so the board is different every round
function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[randomIndex];
    copy[randomIndex] = temp;
  }

  return copy;
}

// Draw the current card state onto the page
function renderBoard(showFaceUp) {
  memoryBoard.innerHTML = '';

  if (totalPairs === 8) {
    memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
  } else if (totalPairs === 10) {
    memoryBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
  } else {
    memoryBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
  }

  for (let i = 0; i < memoryCards.length; i++) {
    const card = memoryCards[i];
    const cardButton = document.createElement('button');

    cardButton.type = 'button';
    cardButton.className = 'memory-card';
    cardButton.dataset.id = card.id;

    const shouldShowFace = showFaceUp || card.revealed || card.matched;

    if (shouldShowFace) {
      cardButton.textContent = card.symbol;
      cardButton.classList.add(card.matched ? 'matched' : 'revealed');
    } else {
      cardButton.textContent = card.id;
    }

    if (card.matched) {
      cardButton.disabled = true;
    }

    cardButton.addEventListener('click', handleCardClick);
    memoryBoard.appendChild(cardButton);
  }
}

// After memorization time is over, cards show numbers instead
function hideAllCards() {
  for (let i = 0; i < memoryCards.length; i++) {
    memoryCards[i].revealed = false;
  }

  renderBoard(false);
}

// Countdown for the round
function startRoundTimer() {
  gameTimer = setInterval(function() {
    timeLeft--;
    memoryTimerText.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(gameTimer);
      timeLeft = 0;
      memoryTimerText.textContent = timeLeft;
      lockBoard = true;
      canFlipCards = false;
      showMemoryMessage('Time is up. Your score was not saved. Start a new game to try again.');
      disableAllUnmatchedCards();
    }
  }, 1000);
}

// Handles one click on a card
function handleCardClick(event) {
  if (!canFlipCards || lockBoard) {
    return;
  }

  const clickedId = Number(event.target.dataset.id);
  const clickedCard = findCardById(clickedId);

  if (!clickedCard || clickedCard.revealed || clickedCard.matched) {
    return;
  }

  clickedCard.revealed = true;
  renderBoard(false);

  if (!firstCard) {
    firstCard = clickedCard;
    return;
  }

  secondCard = clickedCard;
  lockBoard = true;

  if (firstCard.symbol === secondCard.symbol) {
    firstCard.matched = true;
    secondCard.matched = true;
    matchesFound++;
    currentScore += 10;

    matchCountText.textContent = matchesFound;
    memoryScoreText.textContent = currentScore;
    showMemoryMessage('Nice, that is a match. +10 points.');

    resetTurnState();
    renderBoard(false);

    if (matchesFound === totalPairs) {
      finishGame();
    }
  } else {
    wrongAttempts++;
    currentScore -= 5;

    wrongAttemptsText.textContent = wrongAttempts;
    memoryScoreText.textContent = currentScore;
    showMemoryMessage('Not a match. -5 points. Try to remember those spots.');

    setTimeout(function() {
      firstCard.revealed = false;
      secondCard.revealed = false;
      resetTurnState();
      renderBoard(false);
    }, 900);
  }
}

// Runs the ending steps for a successful round
function finishGame() {
  clearInterval(gameTimer);
  canFlipCards = false;

  // This keeps the scoring rule in place if you ever let time run below target in a future version
  finishPenalty = Math.max(0, 0 - timeLeft);
  currentScore -= finishPenalty;
  memoryScoreText.textContent = currentScore;

  showMemoryMessage(`You matched every card. Final score: ${currentScore}.`);

  saveScorePrompt();
}

// Ask for a player name and save the result
function saveScorePrompt() {
  let playerName = prompt('Enter your name for the leaderboard:', '');

  if (playerName === null) {
    playerName = 'Anonymous';
  }

  playerName = playerName.trim();

  if (playerName === '') {
    playerName = 'Anonymous';
  }

  saveLeaderboardScore({
    name: playerName,
    score: currentScore,
    pairs: totalPairs,
    wrongAttempts: wrongAttempts
  });

  renderLeaderboard();
}

// Save top 5 scores in localStorage
function saveLeaderboardScore(entry) {
  const savedScores = getLeaderboardScores();

  savedScores.push(entry);
  savedScores.sort(function(a, b) {
    return b.score - a.score;
  });

  const topFive = savedScores.slice(0, 5);
  localStorage.setItem('memoryLeaderboard', JSON.stringify(topFive));
}

// Read scores from localStorage
function getLeaderboardScores() {
  const rawScores = localStorage.getItem('memoryLeaderboard');

  if (!rawScores) {
    return [];
  }

  try {
    return JSON.parse(rawScores);
  } catch (error) {
    return [];
  }
}

// Draw leaderboard onto the page
function renderLeaderboard() {
  const savedScores = getLeaderboardScores();
  leaderboardList.innerHTML = '';

  if (savedScores.length === 0) {
    leaderboardList.innerHTML = '<div class="leaderboard-empty">No scores saved yet.</div>';
    return;
  }

  for (let i = 0; i < savedScores.length; i++) {
    const entry = savedScores[i];
    const row = document.createElement('div');
    row.className = 'leaderboard-row';

    const rank = document.createElement('div');
    rank.className = 'leaderboard-rank';
    rank.textContent = `#${i + 1}`;

    const name = document.createElement('div');
    name.className = 'leaderboard-name';
    name.textContent = entry.name;

    const score = document.createElement('div');
    score.className = 'leaderboard-score';
    score.textContent = `${entry.score} pts`;

    const details = document.createElement('div');
    details.className = 'leaderboard-details';
    details.textContent = `${entry.pairs} pairs | ${entry.wrongAttempts} misses`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);
    row.appendChild(details);

    leaderboardList.appendChild(row);
  }
}

// Find the card object from the id saved on the button
function findCardById(id) {
  for (let i = 0; i < memoryCards.length; i++) {
    if (memoryCards[i].id === id) {
      return memoryCards[i];
    }
  }

  return null;
}

// Reset only the current turn values
function resetTurnState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

// If time runs out, unmatched cards should no longer be clickable
function disableAllUnmatchedCards() {
  const allCardButtons = document.querySelectorAll('.memory-card');

  allCardButtons.forEach(function(button) {
    button.disabled = true;
  });
}

// Message helper so the code is easier to read
function showMemoryMessage(text) {
  memoryMessage.textContent = text;
}
