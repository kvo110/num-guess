// These are the possible symbols used for the memory cards
// I kept them as text labels so the game stays simple and easy to read
const memorySymbols = [
  'Lion', 'Zebra', 'Tiger', 'Panda', 'Koala', 'Whale',
  'Shark', 'Eagle', 'Fox', 'Bear', 'Wolf', 'Frog'
];

// Extra feature badge rules
// Each badge has a key title description and a condition to unlock it
const achievementRules = [
  {
    key: 'firstWin',
    title: 'First Win',
    description: 'Finish one memory game.',
    check: function(stats) {
      return stats.completedGame;
    }
  },
  {
    key: 'perfectMemory',
    title: 'Perfect Memory',
    description: 'Finish a game with 0 wrong attempts.',
    check: function(stats) {
      return stats.completedGame && stats.wrongAttempts === 0;
    }
  },
  {
    key: 'speedRunner',
    title: 'Speed Runner',
    description: 'Finish with at least half of the timer left.',
    check: function(stats) {
      return stats.completedGame && stats.timeLeft >= Math.floor(stats.roundTimeLimit / 2);
    }
  },
  {
    key: 'cardMaster',
    title: 'Card Master',
    description: 'Finish the 12-pair game mode.',
    check: function(stats) {
      return stats.completedGame && stats.totalPairs === 12;
    }
  }
];

// Grab all memory game page elements once here
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
const achievementList = document.getElementById('achievementList');

// These values change while the player is in a round
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
let overtimeSeconds = 0;

// Start game button begins a new round
startMemoryGameButton.addEventListener('click', startMemoryGame);

// Load saved leaderboard and achievement data right away
renderLeaderboard();
renderAchievements();

// Start a brand new memory game round
function startMemoryGame() {
  // Clear any old timer first so rounds do not overlap
  clearInterval(gameTimer);

  // Read current settings from the dropdowns
  totalPairs = Number(pairSelect.value);
  memorizationSeconds = Number(difficultySelect.value);

  // Reset all round values
  matchesFound = 0;
  wrongAttempts = 0;
  currentScore = 0;
  overtimeSeconds = 0;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  canFlipCards = false;

  // Set the round time based on pair count
  roundTimeLimit = getGameTime(totalPairs);
  timeLeft = roundTimeLimit;

  // Update everything shown on the screen
  matchCountText.textContent = matchesFound;
  wrongAttemptsText.textContent = wrongAttempts;
  memoryScoreText.textContent = currentScore;
  updateTimerDisplay();

  // Build and show the deck face-up for memorization time
  buildDeck();
  renderBoard(true);
  showMemoryMessage(`Memorize the cards. They will hide in ${memorizationSeconds} seconds.`);

  // After the chosen memorize time, hide all cards and start the real round
  setTimeout(function() {
    hideAllCards();
    canFlipCards = true;
    startRoundTimer();
    showMemoryMessage('Cards are now hidden. Start matching.');
  }, memorizationSeconds * 1000);
}

// Time limit changes depending on how many pairs were picked
function getGameTime(pairCount) {
  if (pairCount === 8) {
    return 120;
  }

  if (pairCount === 10) {
    return 150;
  }

  return 180;
}

// Build the deck by duplicating each chosen symbol
function buildDeck() {
  const chosenSymbols = memorySymbols.slice(0, totalPairs);
  const doubledCards = [];

  for (let i = 0; i < chosenSymbols.length; i++) {
    doubledCards.push(chosenSymbols[i]);
    doubledCards.push(chosenSymbols[i]);
  }

  // Shuffle the cards and then assign card ids
  memoryCards = shuffleArray(doubledCards).map(function(symbol, index) {
    return {
      id: index + 1,
      symbol: symbol,
      revealed: true,
      matched: false
    };
  });
}

// Basic shuffle so the cards are random each round
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

// Draw the board from scratch based on current card data
function renderBoard(showFaceUp) {
  memoryBoard.innerHTML = '';

  // Change number of columns depending on total deck size
  if (totalPairs === 8) {
    memoryBoard.style.gridTemplateColumns = 'repeat(4, 1fr)';
  } else if (totalPairs === 10) {
    memoryBoard.style.gridTemplateColumns = 'repeat(5, 1fr)';
  } else {
    memoryBoard.style.gridTemplateColumns = 'repeat(6, 1fr)';
  }

  // Create one button per card
  for (let i = 0; i < memoryCards.length; i++) {
    const card = memoryCards[i];
    const cardButton = document.createElement('button');

    cardButton.type = 'button';
    cardButton.className = 'memory-card';
    cardButton.dataset.id = card.id;

    // Show symbol during memorize phase or when card is revealed/matched
    const shouldShowFace = showFaceUp || card.revealed || card.matched;

    if (shouldShowFace) {
      cardButton.textContent = card.symbol;
      cardButton.classList.add(card.matched ? 'matched' : 'revealed');
    } else {
      // Hidden cards just show their id number
      cardButton.textContent = card.id;
    }

    // A matched card should no longer be clickable
    if (card.matched) {
      cardButton.disabled = true;
    }

    // Each card gets its own click event
    cardButton.addEventListener('click', handleCardClick);
    memoryBoard.appendChild(cardButton);
  }
}

// Turn all cards face-down after memorization time ends
function hideAllCards() {
  for (let i = 0; i < memoryCards.length; i++) {
    memoryCards[i].revealed = false;
  }

  renderBoard(false);
}

// Timer countdown while the real round is active
// Important change here:
// once the timer goes below 0, the player can still keep playing,
// but the score loses 1 point every second in overtime
function startRoundTimer() {
  gameTimer = setInterval(function() {
    timeLeft--;

    if (timeLeft < 0) {
      overtimeSeconds++;
      currentScore--;
      memoryScoreText.textContent = currentScore;
    }

    updateTimerDisplay();

    // Only update the message once overtime actually starts
    if (timeLeft === -1) {
      showMemoryMessage('Time limit passed. You can still finish, but you lose 1 point every extra second.');
    }
  }, 1000);
}

// This keeps the timer text readable on the page
// Positive time shows normal seconds left
// Negative time shows overtime clearly
function updateTimerDisplay() {
  if (timeLeft >= 0) {
    memoryTimerText.textContent = timeLeft;
  } else {
    memoryTimerText.textContent = `OT ${Math.abs(timeLeft)}`;
  }
}

// Main click logic for every card
function handleCardClick(event) {
  // Ignore clicks if the board is locked or the round is not active
  if (!canFlipCards || lockBoard) {
    return;
  }

  const clickedId = Number(event.target.dataset.id);
  const clickedCard = findCardById(clickedId);

  // Ignore invalid clicks repeated clicks or already matched cards
  if (!clickedCard || clickedCard.revealed || clickedCard.matched) {
    return;
  }

  // Reveal the chosen card and redraw the board
  clickedCard.revealed = true;
  renderBoard(false);

  // First pick of the turn
  if (!firstCard) {
    firstCard = clickedCard;
    return;
  }

  // Second pick of the turn
  secondCard = clickedCard;
  lockBoard = true;

  // Matching branch
  if (firstCard.symbol === secondCard.symbol) {
    firstCard.matched = true;
    secondCard.matched = true;
    matchesFound++;
    currentScore += 10;

    matchCountText.textContent = matchesFound;
    memoryScoreText.textContent = currentScore;
    showMatchMessage();

    resetTurnState();
    renderBoard(false);

    // If all pairs are found the round is over
    if (matchesFound === totalPairs) {
      finishGame();
    }
  } else {
    // Wrong match branch
    wrongAttempts++;
    currentScore -= 5;

    wrongAttemptsText.textContent = wrongAttempts;
    memoryScoreText.textContent = currentScore;
    showMismatchMessage();

    // Give the player a short moment to see the wrong pair before hiding them again
    setTimeout(function() {
      firstCard.revealed = false;
      secondCard.revealed = false;
      resetTurnState();
      renderBoard(false);
    }, 900);
  }
}

// Separate helpers so overtime messages are still clear
function showMatchMessage() {
  if (timeLeft < 0) {
    showMemoryMessage(`Nice, that is a match. +10 points. Overtime penalty is still active.`);
  } else {
    showMemoryMessage('Nice, that is a match. +10 points.');
  }
}

function showMismatchMessage() {
  if (timeLeft < 0) {
    showMemoryMessage('Not a match. -5 points, and overtime is still subtracting 1 point each second.');
  } else {
    showMemoryMessage('Not a match. -5 points. Try to remember those spots.');
  }
}

// Final steps when the player wins the round
function finishGame() {
  clearInterval(gameTimer);
  canFlipCards = false;

  // At this point, overtime penalty has already been applied live each second,
  // so there is nothing extra to subtract here
  memoryScoreText.textContent = currentScore;

  if (overtimeSeconds > 0) {
    showMemoryMessage(`You matched every card. Final score: ${currentScore}. Overtime used: ${overtimeSeconds} seconds.`);
  } else {
    showMemoryMessage(`You matched every card. Final score: ${currentScore}.`);
  }

  // Check achievement progress before asking for leaderboard name
  unlockAchievements({
    completedGame: true,
    wrongAttempts: wrongAttempts,
    timeLeft: timeLeft,
    roundTimeLimit: roundTimeLimit,
    totalPairs: totalPairs
  });

  saveScorePrompt();
}

// Ask the player for a name before saving leaderboard data
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
    wrongAttempts: wrongAttempts,
    overtimeSeconds: overtimeSeconds
  });

  renderLeaderboard();
}

// Save score list in localStorage and keep only top five
function saveLeaderboardScore(entry) {
  const savedScores = getLeaderboardScores();

  savedScores.push(entry);
  savedScores.sort(function(a, b) {
    return b.score - a.score;
  });

  const topFive = savedScores.slice(0, 5);
  localStorage.setItem('memoryLeaderboard', JSON.stringify(topFive));
}

// Read saved leaderboard data
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

// Draw leaderboard entries onto the page
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

    // Show a little more info now that overtime can happen
    if (entry.overtimeSeconds && entry.overtimeSeconds > 0) {
      details.textContent = `${entry.pairs} pairs | ${entry.wrongAttempts} misses | OT ${entry.overtimeSeconds}s`;
    } else {
      details.textContent = `${entry.pairs} pairs | ${entry.wrongAttempts} misses`;
    }

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);
    row.appendChild(details);

    leaderboardList.appendChild(row);
  }
}

// Check whether any achievement rules were earned this round
function unlockAchievements(stats) {
  const savedAchievements = getUnlockedAchievements();
  let unlockedSomethingNew = false;

  for (let i = 0; i < achievementRules.length; i++) {
    const rule = achievementRules[i];

    if (rule.check(stats) && !savedAchievements.includes(rule.key)) {
      savedAchievements.push(rule.key);
      unlockedSomethingNew = true;
    }
  }

  localStorage.setItem('memoryAchievements', JSON.stringify(savedAchievements));
  renderAchievements();

  if (unlockedSomethingNew) {
    if (overtimeSeconds > 0) {
      showMemoryMessage(`You matched every card. Final score: ${currentScore}. New achievement unlocked. Overtime used: ${overtimeSeconds} seconds.`);
    } else {
      showMemoryMessage(`You matched every card. Final score: ${currentScore}. New achievement unlocked.`);
    }
  }
}

// Read saved achievement keys from localStorage
function getUnlockedAchievements() {
  const rawAchievements = localStorage.getItem('memoryAchievements');

  if (!rawAchievements) {
    return [];
  }

  try {
    return JSON.parse(rawAchievements);
  } catch (error) {
    return [];
  }
}

// Draw the achievement cards and show whether they are locked or unlocked
function renderAchievements() {
  const unlockedKeys = getUnlockedAchievements();
  achievementList.innerHTML = '';

  for (let i = 0; i < achievementRules.length; i++) {
    const achievement = achievementRules[i];
    const card = document.createElement('div');
    const isUnlocked = unlockedKeys.includes(achievement.key);

    card.className = 'achievement-card';

    if (isUnlocked) {
      card.classList.add('unlocked');
    }

    const title = document.createElement('div');
    title.className = 'achievement-title';
    title.textContent = achievement.title;

    const description = document.createElement('div');
    description.className = 'achievement-desc';
    description.textContent = achievement.description;

    const status = document.createElement('div');
    status.className = 'achievement-status';
    status.textContent = isUnlocked ? 'Unlocked' : 'Locked';

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(status);

    achievementList.appendChild(card);
  }
}

// Find a card object by matching its id
function findCardById(id) {
  for (let i = 0; i < memoryCards.length; i++) {
    if (memoryCards[i].id === id) {
      return memoryCards[i];
    }
  }

  return null;
}

// Reset the turn after a match or mismatch is handled
function resetTurnState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

// Reusable helper for memory game messages
function showMemoryMessage(text) {
  memoryMessage.textContent = text;
}
