// Basic setup for the guessing game
let secretNumber = randomNumber();
let guessesRemaining = 10;
let wins = 0;
let rounds = 0;
let soundOn = true;

// Grabbing the page elements once so the code stays cleaner
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const message = document.getElementById('message');
const guessesLeftText = document.getElementById('guessesLeft');
const winsCountText = document.getElementById('winsCount');
const roundCountText = document.getElementById('roundCount');
const clockText = document.getElementById('clock');
const soundToggle = document.getElementById('soundToggle');

// This makes a random whole number from 1 to 100
function randomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

// Keep the numbers on the screen updated
function updateStats() {
  guessesLeftText.textContent = guessesRemaining;
  winsCountText.textContent = wins;
  roundCountText.textContent = rounds;
}

// Show feedback to the player
function showMessage(text) {
  message.textContent = text;
}

// Reset the game for a new round
function startNewGame() {
  secretNumber = randomNumber();
  guessesRemaining = 10;
  rounds++;
  updateStats();
  guessInput.value = '';
  showMessage('New round started. Enter a guess between 1 and 100.');
}

// Very small beep sound so the game meets the sound requirement
function playBeep(frequency, duration) {
  if (!soundOn) {
    return;
  }

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}

// This handles one guess when the player clicks the button
function handleGuess() {
  const userGuess = Number(guessInput.value);

  // Range and input check first
  if (!guessInput.value || Number.isNaN(userGuess)) {
    showMessage('Please enter a number first.');
    playBeep(250, 0.15);
    return;
  }

  if (userGuess < 1 || userGuess > 100) {
    showMessage('Your guess has to be between 1 and 100.');
    playBeep(250, 0.15);
    return;
  }

  guessesRemaining--;

  if (userGuess === secretNumber) {
    wins++;
    updateStats();
    showMessage('Correct! You guessed the secret number. Starting a new game...');
    playBeep(700, 0.2);

    setTimeout(() => {
      startNewGame();
    }, 1200);
    return;
  }

  if (guessesRemaining === 0) {
    updateStats();
    showMessage(`Out of guesses. The secret number was ${secretNumber}. Starting a new game...`);
    playBeep(180, 0.3);

    setTimeout(() => {
      startNewGame();
    }, 1500);
    return;
  }

  if (userGuess > secretNumber) {
    showMessage(`Too high. You have ${guessesRemaining} guesses left.`);
    playBeep(350, 0.12);
  } else {
    showMessage(`Too low. You have ${guessesRemaining} guesses left.`);
    playBeep(450, 0.12);
  }

  updateStats();
  guessInput.value = '';
  guessInput.focus();
}

// Live clock for the top section
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  clockText.textContent = timeString;
}

// Let the player turn sound on and off
function toggleSound() {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? 'On' : 'Off';
}

// Event-driven setup
guessButton.addEventListener('click', handleGuess);
soundToggle.addEventListener('click', toggleSound);

guessInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    handleGuess();
  }
});

// Initial screen setup
updateStats();
updateClock();
setInterval(updateClock, 1000);
