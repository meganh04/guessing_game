const msgEl = document.getElementById('msg');

// Generate random number
function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

const randomNum = getRandomNumber();
console.log('Number:', randomNum);

// Feature detect SpeechRecognition
window.SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

if (!window.SpeechRecognition) {
  console.warn('SpeechRecognition API not supported in this browser.');
  if (msgEl) msgEl.innerHTML = '<div class="error">Speech Recognition not supported in this browser.</div>';
} else {
  let recognition = new window.SpeechRecognition();

  // Optional settings
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  // Capture user speak
  function onSpeak(event) {
    // event.results can contain multiple results; take the most recent
    const msg = event.results[0][0].transcript;
    writeMessage(msg);
  }

  // Write what user speaks
  function writeMessage(msg) {
    if (!msgEl) {
      console.error('No #msg element found in DOM');
      return;
    }
    msgEl.innerHTML = `\n      <div>You said: </div>\n      <span class="box">${msg}</span>\n    `;
  }

  // Error handling
  recognition.addEventListener('error', (e) => {
    console.error('Speech recognition error:', e);
    if (msgEl) msgEl.innerHTML = `<div class="error">Speech error: ${e.error}</div>`;
  });

  recognition.addEventListener('end', () => {
    console.log('Recognition ended');
    // Do not auto-restart here to avoid infinite prompts; restart on user action if desired
  });

  // Add result listener (must be in place before starting)
  recognition.addEventListener('result', onSpeak);

  // Start recognition only after a user gesture (some browsers require it).
  // We'll start when the user clicks the microphone image if present, otherwise try to start once.
  const mic = document.querySelector('img[alt*="Microphone"], img[alt*="microphone"], img');
  function startRecognition() {
    try {
      recognition.start();
      console.log('Recognition started');
    } catch (err) {
      console.error('Failed to start recognition:', err);
      if (msgEl) msgEl.innerHTML = `<div class="error">Could not start speech recognition: ${err.message}</div>`;
    }
  }

  if (mic) {
    mic.style.cursor = 'pointer';
    mic.title = 'Click to start listening';
    mic.addEventListener('click', startRecognition);
  } else {
    // Try to start automatically (may be blocked by browser)
    startRecognition();
  }
}