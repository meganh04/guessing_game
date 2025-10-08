const msgEl = document.getElementById('msg');

// Generate random number
function getRandomNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

const randomNum = getRandomNumber();
console.log('Number:', randomNum);

// Feature detect SpeechRecognition
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

if (!window.SpeechRecognition) {
  console.warn('SpeechRecognition API not supported in this browser.');
  if (msgEl) msgEl.innerHTML = '<div class="error">Speech Recognition not supported in this browser.</div>';
} else {
  const recognition = new window.SpeechRecognition();
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  // Write what user speaks
  function writeMessage(msg) {
    if (!msgEl) return;
    // clear previous "You said" lines but keep feedback (optional)
    const container = document.createElement('div');
    container.innerHTML = `<div>You said: </div><span class="box">${msg}</span>`;
    msgEl.appendChild(container);
  }

  // Map common words to numbers
  const wordToNumber = {
    one: 1,
    won: 1,
    two: 2,
    to: 2,
    too: 2,
    three: 3,
    four: 4,
    for: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    ate: 8,
    nine: 9,
    ten: 10,
  };

  // Check spoken message against secret number
  function checkNumber(rawMsg) {
    if (!msgEl) return;
    let msg = String(rawMsg).trim().toLowerCase();

    if (wordToNumber[msg] !== undefined) {
      msg = String(wordToNumber[msg]);
    }

    const num = Number(msg);

    // Validate
    if (Number.isNaN(num)) {
      const div = document.createElement('div');
      div.textContent = 'That is not a valid number';
      msgEl.appendChild(div);
      return;
    }

    if (num < 1 || num > 100) {
      const div = document.createElement('div');
      div.textContent = 'Number must be between 1 and 100';
      msgEl.appendChild(div);
      return;
    }

    // Feedback
    if (num === randomNum) {
      const h2 = document.createElement('h2');
      h2.textContent = `Congrats! You have guessed the number! It was ${num}`;

      const button = document.createElement('button');
      button.classList.add('play-again');
      button.id = 'play-again';
      button.textContent = 'Play Again';
      button.addEventListener('click', () => window.location.reload());

      msgEl.appendChild(h2);
      msgEl.appendChild(button);
    } else if (num > randomNum) {
      const div = document.createElement('div');
      div.textContent = 'GO LOWER';
      msgEl.appendChild(div);
    } else {
      const div = document.createElement('div');
      div.textContent = 'GO HIGHER';
      msgEl.appendChild(div);
    }
  }

  // Handle recognition results
  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    console.log('Heard:', transcript);
    writeMessage(transcript);
    checkNumber(transcript);
  });

  recognition.addEventListener('error', (e) => {
    console.error('Speech recognition error:', e);
    if (msgEl) msgEl.innerHTML = `<div class="error">Speech error: ${e.error}</div>`;
  });

  recognition.addEventListener('end', () => {
    console.log('Recognition ended');
    // If the user has toggled listening on, restart so we keep listening continuously.
    if (isRecognizing) {
      try {
        recognition.start();
        console.log('Recognition restarted to continue listening');
      } catch (err) {
        console.warn('Could not restart recognition automatically:', err);
      }
    }
  });

  // Track recognition state so we don't double-start
  let isRecognizing = false;

  // Helper: ensure permission then start recognition
  async function ensurePermissionAndStart() {
    // If already started, do nothing
    if (isRecognizing) return;

    // Check Permissions API where available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' });
          console.log('Permissions API state for microphone:', status.state);
          if (status.state === 'granted') {
            recognition.start();
            isRecognizing = true;
            return;
          }
          if (status.state === 'denied') {
            console.warn('Microphone permission denied. Enable in browser settings.');
            if (msgEl) msgEl.innerHTML = '<div class="error">Microphone permission denied. Enable it in browser settings.</div>';
            return;
          }
        } catch (permErr) {
          console.debug('Permissions API check failed:', permErr);
        }
      }
    } catch (e) {
      console.debug('Permissions API not available or failed:', e);
    }

    // Request microphone access via getUserMedia (triggers prompt once for the origin)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      window._microphoneStream = stream; // keep reference for session
      recognition.start();
      isRecognizing = true;
      console.log('Recognition started after getUserMedia');
    } catch (err) {
      console.warn('Could not obtain microphone permission or start recognition:', err);
      throw err;
    }
  }

  // Wire the microphone image to start recognition on click (user gesture)
  const micImg = document.querySelector('img[alt*="mic"], img[alt*="Mic"], img[alt*="Microphone"], img');
  if (micImg) {
    micImg.style.cursor = 'pointer';
    micImg.title = 'Click to start/stop listening';
    micImg.addEventListener('click', async () => {
      // Toggle behavior: if currently recognizing, stop; otherwise start and keep listening
      if (isRecognizing) {
        // Stop listening
        try {
          recognition.stop();
        } catch (e) {
          console.warn('Error stopping recognition:', e);
        }
        isRecognizing = false;
        micImg.classList.remove('listening');
        // Stop and release microphone tracks if we have them
        if (window._microphoneStream) {
          try {
            window._microphoneStream.getTracks().forEach((t) => t.stop());
          } catch (e) {
            console.debug('Error stopping microphone tracks:', e);
          }
          window._microphoneStream = null;
        }
        console.log('Stopped listening');
        return;
      }

      // Start listening
      try {
        await ensurePermissionAndStart();
        // ensurePermissionAndStart sets isRecognizing to true when it starts
        if (isRecognizing === false) {
          // If ensurePermissionAndStart didn't set the flag (edge), set it now
          isRecognizing = true;
        }
        micImg.classList.add('listening');
        console.log('Started listening');
      } catch (e) {
        console.error('Failed to start recognition on mic click:', e);
      }
    });
  }

} // end of SpeechRecognition feature block

  