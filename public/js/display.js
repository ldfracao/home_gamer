let blindsDuration;
let clock = document.getElementById("clock");
let round = document.getElementById("round_number");
let current_level = document.getElementById("current_level");
let next_level = document.getElementById("next_level");
let small;
let big;
let clock_status = false; //tracks whether the clock is paused or not
let minutes;
let seconds;
let rounds_counter = 0;
let interval;
const start_button = document.getElementById("start_button");

// Create a promise that resolves when blindsDuration is available
const fetchTournamentSettings = new Promise((resolve, reject) => {
  console.log("DOM CONTENT LOADED");
  // Fetch the tournament duration from the server
  fetch('/tournament-settings')
    .then(response => response.text())
    .then(html => {
      // Create a temporary container element to parse the HTML
      var tempContainer = document.createElement('div');
      tempContainer.innerHTML = html;
      // Find the tournament duration input
      blindsDuration = tempContainer.getElementsByClassName('time');
      small = tempContainer.getElementsByClassName("small_blind");
      big = tempContainer.getElementsByClassName("big_blind");
      console.log("Fetched blindsDuration:", blindsDuration); // Log for debugging
      // Resolve the promise with the blindsDuration
      resolve({ blindsDuration, small, big });
    })
    .catch(error => {
      console.error('Error fetching tournament settings:', error);
      reject(error);
    });
});

fetchTournamentSettings.then(() => {
  for (let index = 0; index < blindsDuration.length; index++) {
    blindsDuration[index].value *= 60;
  }
  !localStorage.getItem('timerState') ? initializeClock() :
    loadTimerState();
}).catch(error => {
  console.error('Error fetching tournament settings:', error);
});

// Function to initialize the clock and timer based on tournament settings
function initializeClock() {
  if (blindsDuration && blindsDuration.length > 0) {
    minutes = parseInt(blindsDuration[rounds_counter].value / 60, 10);
    seconds = parseInt(blindsDuration[rounds_counter].value % 60, 10);
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    clock.innerHTML = minutes + ":" + seconds;
    current_level.innerHTML = small[0].value + "/" + big[0].value;
    next_level.innerHTML = small[1].value + "/" + big[1].value;

  } else {
    console.warn("Tournament duration input not yet available");
  }
}

function start_stop() {
  console.log("start stop invoked")
  if (!clock_status) {
    interval = setInterval(update_timer, 1000);
    start_button.innerHTML = "Stop";
    clock_status = true;
  } else {
    // Clear the interval to stop the timer
    clearInterval(interval);
    start_button.innerHTML = "Start";
    clock_status = false;
  }
}

function update_timer() {
  console.log("update timer invoked")
  if (blindsDuration[rounds_counter].value == 0) {
    // Play sound or perform other actions when time runs out
    // ...
    update_blinds();
  }
  minutes = parseInt(blindsDuration[rounds_counter].value / 60, 10);
  seconds = parseInt(blindsDuration[rounds_counter].value % 60, 10);
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;
  clock.innerHTML = minutes + ":" + seconds;
  blindsDuration[rounds_counter].value--;
  console.log(minutes);
  console.log(seconds);
  console.log(blindsDuration[rounds_counter].value);
}

function update_blinds() {
  rounds_counter++;
  round.innerHTML = "Round " + (rounds_counter + 1);
  current_level.innerHTML =
    small[rounds_counter].value + " / " + big[rounds_counter].value;
  next_level.innerHTML =
    small[rounds_counter + 1].value + " / " + big[rounds_counter + 1].value;
}

// Function to save timer state to localStorage
function saveTimerState() {
  console.log("SAVE TIMER INVOKED");
  localStorage.setItem('timerState', JSON.stringify({
    minutes: minutes,
    seconds: seconds,
    roundsCounter: rounds_counter,
    remainingTime: blindsDuration[rounds_counter].value,
    clockStatus: clock_status
  }));
  console.log(localStorage.getItem('timerState'));
}

// Function to load timer state from localStorage
function loadTimerState() {
  console.log("LOAD TIMER INVOKED")
  const timerState = JSON.parse(localStorage.getItem('timerState'));
  if (timerState) {
    rounds_counter = timerState.roundsCounter;
    blindsDuration[rounds_counter].value = timerState.remainingTime;
    minutes = parseInt(blindsDuration[rounds_counter].value / 60, 10);
    seconds = parseInt(blindsDuration[rounds_counter].value % 60, 10);
    clock_status = timerState.clockStatus;
    clock.innerHTML = minutes + ":" + seconds;
    if (clock_status) {
      interval = setInterval(update_timer, 1000);
      start_button.innerHTML = "Stop";
    } else {
      start_button.innerHTML = "Start";
    }
  }
}
start_button.onclick = start_stop;
window.addEventListener('beforeunload', saveTimerState);

//localStorage.removeItem('timerState');