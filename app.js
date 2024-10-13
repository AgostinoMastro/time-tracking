// Initialize variables
let shiftStartTime, shiftEndTime;
let breakStartTime, breakEndTime;
let lunchStartTime, lunchEndTime;
let totalBreakTime = 0;
let totalLunchTime = 0;
let timerInterval;
let elapsedTime = 0;
let tripId;

// Retrieve query parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
const token = urlParams.get('token');

// Display user email
document.getElementById('userName').innerText = `Welcome, ${email}`;

// Initialize Radar with your publishable API key
Radar.initialize('your_publishable_key'); // Replace with your Radar publishable API key

// Request location permissions
Radar.requestPermissions(true);

// Event listeners for buttons
document.getElementById('startShift').addEventListener('click', startShift);
document.getElementById('takeBreak').addEventListener('click', takeBreak);
document.getElementById('endBreak').addEventListener('click', endBreak);
document.getElementById('takeLunch').addEventListener('click', takeLunch);
document.getElementById('endLunch').addEventListener('click', endLunch);
document.getElementById('endShift').addEventListener('click', endShift);

// Function to start the shift
function startShift() {
  shiftStartTime = new Date();
  document.getElementById('startShift').disabled = true;
  document.getElementById('takeBreak').disabled = false;
  document.getElementById('takeLunch').disabled = false;
  document.getElementById('endShift').disabled = false;

  // Start the timer
  timerInterval = setInterval(updateTimeKeeper, 1000);

  // Start Radar trip tracking
  const tripOptions = {
    externalId: `${email}_${shiftStartTime.getTime()}`,
    metadata: {
      email: email,
      shiftStartTime: shiftStartTime.toISOString()
    },
    mode: 'car', // Change to appropriate mode: 'car', 'truck', 'motorbike', 'bicycle', 'foot'
    destinationGeofenceTag: '', // Optional
    destinationGeofenceExternalId: '' // Optional
  };

  Radar.startTrip(tripOptions, (status, trip, events) => {
    if (status === Radar.STATUS.SUCCESS) {
      tripId = trip._id;
      console.log('Trip started:', tripId);
    } else {
      console.error('Error starting trip:', status);
    }
  });

  // Start foreground tracking
  Radar.startTracking({
    priority: 'responsiveness', // 'efficiency', 'responsiveness', or 'continuous'
    offline: 'replayOff', // 'replayOff' or 'replay'
    sync: 'all', // 'all', 'possibleStateChanges', 'none'
    showBlueBar: true // iOS only
  });
}

// Function to update the timekeeper display
function updateTimeKeeper() {
  elapsedTime = Math.floor((new Date() - shiftStartTime - totalBreakTime - totalLunchTime) / 1000);
  const hours = String(Math.floor(elapsedTime / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0');
  const seconds = String(elapsedTime % 60).padStart(2, '0');
  document.getElementById('timeKeeper').innerText = `${hours}:${minutes}:${seconds}`;
}

// Function to take a break
function takeBreak() {
  breakStartTime = new Date();
  document.getElementById('takeBreak').disabled = true;
  document.getElementById('endBreak').disabled = false;

  // Pause tracking during break
  Radar.stopTracking();
}

// Function to end a break
function endBreak() {
  breakEndTime = new Date();
  totalBreakTime += breakEndTime - breakStartTime;
  document.getElementById('takeBreak').disabled = false;
  document.getElementById('endBreak').disabled = true;

  // Resume tracking after break
  Radar.startTracking({
    priority: 'responsiveness',
    offline: 'replayOff',
    sync: 'all',
    showBlueBar: true
  });
}

// Function to take lunch
function takeLunch() {
  lunchStartTime = new Date();
  document.getElementById('takeLunch').disabled = true;
  document.getElementById('endLunch').disabled = false;

  // Pause tracking during lunch
  Radar.stopTracking();
}

// Function to end lunch
function endLunch() {
  lunchEndTime = new Date();
  totalLunchTime += lunchEndTime - lunchStartTime;
  document.getElementById('takeLunch').disabled = false;
  document.getElementById('endLunch').disabled = true;

  // Resume tracking after lunch
  Radar.startTracking({
    priority: 'responsiveness',
    offline: 'replayOff',
    sync: 'all',
    showBlueBar: true
  });
}

// Function to end the shift
function endShift() {
  shiftEndTime = new Date();
  clearInterval(timerInterval);

  document.getElementById('endShift').disabled = true;
  document.getElementById('takeBreak').disabled = true;
  document.getElementById('endBreak').disabled = true;
  document.getElementById('takeLunch').disabled = true;
  document.getElementById('endLunch').disabled = true;

  // Complete the Radar trip
  Radar.completeTrip();

  // Stop tracking
  Radar.stopTracking();

  // Prepare data payload
  const payload = {
    email: email,
    token: token,
    shiftStartTime: shiftStartTime.toISOString(),
    shiftEndTime: shiftEndTime.toISOString(),
    totalElapsedTime: elapsedTime,
    totalBreakTime: Math.floor(totalBreakTime / 1000),
    totalLunchTime: Math.floor(totalLunchTime / 1000),
    tripId: tripId // Include the trip ID
  };

  // Send data to make.com webhook
  fetch('https://hook.make.com/your-webhook-url', { // Replace with your make.com webhook URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (response.ok) {
      alert('Shift data submitted successfully.');
      // Optionally, redirect or close the window
      window.location.href = 'https://your-glide-app-url'; // Replace with your Glide app URL
    } else {
      alert('Error submitting shift data.');
    }
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error submitting shift data.');
  });
}
