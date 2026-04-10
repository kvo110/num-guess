// Basic setup values for the guessing game
// secretNumber changes every round
// guessesRemaining tracks the tries left
// wins tracks successful guesses
// rounds tracks how many rounds have started
// soundOn lets the player mute the beeps
let secretNumber = randomNumber();
let guessesRemaining = 10;
let wins = 0;
let rounds = 0;
let soundOn = true;

// Grab all page elements once at the top so the rest of the file stays cleaner
const guessInput = document.getElementById('guessInput');
const guessButton = document.getElementById('guessButton');
const message = document.getElementById('message');
const guessesLeftText = document.getElementById('guessesLeft');
const winsCountText = document.getElementById('winsCount');
const roundCountText = document.getElementById('roundCount');
const clockText = document.getElementById('clock');
const soundToggle = document.getElementById('soundToggle');

// Make a random whole number from 1 to 100
function randomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

// Update the stat boxes on the screen
function updateStats() {
  guessesLeftText.textContent = guessesRemaining;
  winsCountText.textContent = wins;
  roundCountText.textContent = rounds;
}

// Reusable helper for feedback text
function showMessage(text) {
  message.textContent = text;
}

// Reset the game after a win or loss
function startNewGame() {
  secretNumber = randomNumber();
  guessesRemaining = 10;
  rounds++;
  updateStats();
  guessInput.value = '';
  showMessage('New round started. Enter a guess between 1 and 100.');
}

// Small beep helper so the sound requirement is covered
// Different frequencies help the feedback sound a little different
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

// This runs every time the user submits a guess
function handleGuess() {
  const userGuess = Number(guessInput.value);

  // Make sure the user actually typed something valid
  if (!guessInput.value || Number.isNaN(userGuess)) {
    showMessage('Please enter a number first.');
    playBeep(250, 0.15);
    return;
  }

  // Keep guesses inside the allowed range
  if (userGuess < 1 || userGuess > 100) {
    showMessage('Your guess has to be between 1 and 100.');
    playBeep(250, 0.15);
    return;
  }

  // Count this as one attempt
  guessesRemaining--;

  // Correct guess branch
  if (userGuess === secretNumber) {
    wins++;
    updateStats();
    showMessage('Correct! You guessed the secret number. Starting a new game...');
    playBeep(700, 0.2);

    // Small delay so the player can read the message before reset
    setTimeout(() => {
      startNewGame();
    }, 1200);
    return;
  }

  // Out of guesses branch
  if (guessesRemaining === 0) {
    updateStats();
    showMessage(`Out of guesses. The secret number was ${secretNumber}. Starting a new game...`);
    playBeep(180, 0.3);

    setTimeout(() => {
      startNewGame();
    }, 1500);
    return;
  }

  // Too high or too low feedback
  if (userGuess > secretNumber) {
    showMessage(`Too high. You have ${guessesRemaining} guesses left.`);
    playBeep(350, 0.12);
  } else {
    showMessage(`Too low. You have ${guessesRemaining} guesses left.`);
    playBeep(450, 0.12);
  }

  // Refresh stats and clear the box for the next guess
  updateStats();
  guessInput.value = '';
  guessInput.focus();
}

// Live clock shown at the top of the guessing game
function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  clockText.textContent = timeString;
}

// Let the player turn sounds on or off
function toggleSound() {
  soundOn = !soundOn;
  soundToggle.textContent = soundOn ? 'On' : 'Off';
}

// Main click event for the guess button
guessButton.addEventListener('click', handleGuess);

// Click event for the sound toggle
soundToggle.addEventListener('click', toggleSound);

// Let the Enter key work too so the game feels smoother
guessInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    handleGuess();
  }
});

// First-time setup when the page loads
updateStats();
updateClock();
setInterval(updateClock, 1000);
