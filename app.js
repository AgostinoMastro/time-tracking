// Initialize variables
let shiftStartTime, shiftEndTime;
let breakStartTime, breakEndTime;
let lunchStartTime, lunchEndTime;
let totalBreakTime = 0;
let totalLunchTime = 0;
let timerInterval;
let elapsedTime = 0;
let geoData = [];

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

  // Start continuous location tracking
  Radar.startTrackingContinuous();

  // Handle location updates
  Radar.on('location', function(status, location, user) {
    if (status === Radar.STATUS.SUCCESS) {
      geoData.push({
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date().toISOString()
      });
    }
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
}

// Function to end a break
function endBreak() {
  breakEndTime = new Date();
  totalBreakTime += breakEndTime - breakStartTime;
  document.getElementById('takeBreak').disabled = false;
  document.getElementById('endBreak').disabled = true;
}

// Function to take lunch
function takeLunch() {
  lunchStartTime = new Date();
  document.getElementById('takeLunch').disabled = true;
  document.getElementById('endLunch').disabled = false;
}

// Function to end lunch
function endLunch() {
  lunchEndTime = new Date();
  totalLunchTime += lunchEndTime - lunchStartTime;
  document.getElementById('takeLunch').disabled = false;
  document.getElementById('endLunch').disabled = true;
}

// Function to end the shift
function endShift() {
  shiftEndTime = new Date();
  clearInterval(timerInterval);

  // Stop location tracking
  Radar.stopTracking();

  document.getElementById('endShift').disabled = true;
  document.getElementById('takeBreak').disabled = true;
  document.getElementById('endBreak').disabled = true;
  document.getElementById('takeLunch').disabled = true;
  document.getElementById('endLunch').disabled = true;

  // Prepare data payload
  const payload = {
    email: email,
    token: token,
    shiftStartTime: shiftStartTime.toISOString(),
    shiftEndTime: shiftEndTime.toISOString(),
    totalElapsedTime: elapsedTime,
    totalBreakTime: Math.floor(totalBreakTime / 1000),
    totalLunchTime: Math.floor(totalLunchTime / 1000),
    geoData: geoData
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
