/* ==========================================================================
   Modern Cinematic MySpace - Captain Jack Sparrow Interactive Script
   ========================================================================== */

// Audio Player State & Web Audio API Engine
let audioCtx = null;
let isPlaying = false;
let startTime = 0;
let pauseOffset = 0;
let totalDuration = 32; // 32 seconds track duration
let progressTimer = null;
let activeOscillators = [];

// He's a Pirate (Hans Zimmer) Melody Sequence
// Note definitions with frequencies and durations (in seconds)
const pirateMelody = [
  // Intro pickup
  { freq: 293.66, dur: 0.2 }, { freq: 293.66, dur: 0.2 },
  // Phrase 1
  { freq: 293.66, dur: 0.2 }, { freq: 329.63, dur: 0.2 }, { freq: 349.23, dur: 0.4 },
  { freq: 349.23, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 329.63, dur: 0.4 },
  { freq: 329.63, dur: 0.2 }, { freq: 293.66, dur: 0.2 }, { freq: 261.63, dur: 0.2 }, { freq: 261.63, dur: 0.2 }, { freq: 293.66, dur: 0.6 },

  // Repeat motif 1
  { freq: 293.66, dur: 0.2 }, { freq: 293.66, dur: 0.2 },
  { freq: 293.66, dur: 0.2 }, { freq: 329.63, dur: 0.2 }, { freq: 349.23, dur: 0.4 },
  { freq: 349.23, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 329.63, dur: 0.4 },
  { freq: 329.63, dur: 0.2 }, { freq: 293.66, dur: 0.2 }, { freq: 261.63, dur: 0.2 }, { freq: 261.63, dur: 0.2 }, { freq: 293.66, dur: 0.6 },

  // Phrase 2 (Climax)
  { freq: 293.66, dur: 0.2 }, { freq: 293.66, dur: 0.2 },
  { freq: 293.66, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 392.00, dur: 0.4 },
  { freq: 392.00, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 466.16, dur: 0.4 },
  { freq: 466.16, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 392.00, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 293.66, dur: 0.6 },

  // Phrase 3
  { freq: 293.66, dur: 0.2 }, { freq: 349.23, dur: 0.2 },
  { freq: 392.00, dur: 0.4 }, { freq: 466.16, dur: 0.2 }, { freq: 440.00, dur: 0.4 },
  { freq: 392.00, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 293.66, dur: 0.2 }, { freq: 329.63, dur: 0.4 },
  { freq: 349.23, dur: 0.4 }, { freq: 329.63, dur: 0.4 }, { freq: 293.66, dur: 0.8 }
];

// Calculate actual duration of melody sequence
let calculatedDuration = pirateMelody.reduce((sum, n) => sum + n.dur, 0);
// Loop sequence 2 times to fill ~32s
totalDuration = Math.round(calculatedDuration * 2);

function initAudioContext() {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function stopAllNotes() {
  activeOscillators.forEach(node => {
    try {
      node.stop();
      node.disconnect();
    } catch (e) {
      // Ignore if already stopped
    }
  });
  activeOscillators = [];
}

function scheduleMelody(startOffsetSec) {
  stopAllNotes();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  let timeCursor = 0;

  // Loop melody twice
  const fullMelody = [...pirateMelody, ...pirateMelody];

  fullMelody.forEach((note) => {
    const noteStart = timeCursor;
    const noteEnd = timeCursor + note.dur;
    timeCursor = noteEnd;

    // Only schedule if the note starts after or straddles the startOffset
    if (noteEnd > startOffsetSec) {
      const scheduledStartTime = now + Math.max(0, noteStart - startOffsetSec);
      const duration = (noteStart < startOffsetSec) ? (noteEnd - startOffsetSec) : note.dur;

      // Lead synth oscillator
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.value = note.freq;

      // Warm low-pass filter
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;

      const volume = 0.08;
      gain.gain.setValueAtTime(volume, scheduledStartTime);
      gain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + duration - 0.02);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(scheduledStartTime);
      osc.stop(scheduledStartTime + duration);

      activeOscillators.push(osc);

      // Bass drone oscillator for depth
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = note.freq / 2;

      bassGain.gain.setValueAtTime(0.04, scheduledStartTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + duration - 0.02);

      bassOsc.connect(bassGain);
      bassGain.connect(audioCtx.destination);

      bassOsc.start(scheduledStartTime);
      bassOsc.stop(scheduledStartTime + duration);

      activeOscillators.push(bassOsc);
    }
  });
}

function toggleAudio() {
  initAudioContext();

  const playBtn = document.getElementById('play-btn');
  const eqVisualizer = document.querySelector('.equalizer-visualizer');

  if (!isPlaying) {
    // Start or Resume Playback
    isPlaying = true;
    playBtn.innerText = '⏸ PAUSE';
    eqVisualizer.classList.add('playing');

    // If reached end, restart from beginning
    if (pauseOffset >= totalDuration) {
      pauseOffset = 0;
    }

    startTime = Date.now() - (pauseOffset * 1000);
    scheduleMelody(pauseOffset);

    clearInterval(progressTimer);
    progressTimer = setInterval(updateProgress, 100);

  } else {
    // Pause Playback
    isPlaying = false;
    playBtn.innerText = '▶ PLAY';
    eqVisualizer.classList.remove('playing');

    pauseOffset = (Date.now() - startTime) / 1000;
    stopAllNotes();
    clearInterval(progressTimer);
  }
}

function updateProgress() {
  if (!isPlaying) return;

  const elapsed = (Date.now() - startTime) / 1000;
  pauseOffset = elapsed;

  const progressBar = document.getElementById('progress-bar-fill');
  const timeDisplay = document.getElementById('time-display');

  if (elapsed >= totalDuration) {
    // Track finished
    isPlaying = false;
    pauseOffset = 0;
    stopAllNotes();
    clearInterval(progressTimer);

    document.getElementById('play-btn').innerText = '▶ REPLAY';
    document.querySelector('.equalizer-visualizer').classList.remove('playing');
    if (progressBar) progressBar.style.width = '100%';
    if (timeDisplay) timeDisplay.innerText = formatTime(totalDuration) + ' / ' + formatTime(totalDuration);
    return;
  }

  const percent = (elapsed / totalDuration) * 100;
  if (progressBar) progressBar.style.width = percent + '%';
  if (timeDisplay) timeDisplay.innerText = formatTime(elapsed) + ' / ' + formatTime(totalDuration);
}

function seekAudio(event) {
  const progressBarBg = event.currentTarget;
  const rect = progressBarBg.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const percent = Math.max(0, Math.min(1, clickX / rect.width));

  pauseOffset = percent * totalDuration;
  startTime = Date.now() - (pauseOffset * 1000);

  const progressBar = document.getElementById('progress-bar-fill');
  const timeDisplay = document.getElementById('time-display');
  if (progressBar) progressBar.style.width = (percent * 100) + '%';
  if (timeDisplay) timeDisplay.innerText = formatTime(pauseOffset) + ' / ' + formatTime(totalDuration);

  if (isPlaying) {
    scheduleMelody(pauseOffset);
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Contact Buttons Functionality
function sendBottleMsg() {
  alert("🍾 Message in a bottle dispatched across the sea! Jack will respond as soon as he finishes his rum.");
}

function addFriend() {
  alert("⚔️ You are now in Captain Jack's Top Friends! Beware: He might borrow your boat without permission.");
}

function addToFavs() {
  alert("⭐ Profile saved to Favorites! Don't let the Royal Navy find this bookmark!");
}

function bottlePigeon() {
  alert("📜 Parley requested! According to the Pirate Code (which are more like guidelines anyway), you are now under protection.");
}

function blockUser() {
  alert("🚫 Block attempt failed: Captain Jack Sparrow cannot be blocked by mortal magic!");
}

function rankUser() {
  alert("🏴‍☠️ Profile rated 10/10 Rum Bottles! Savvy!");
}

// Interactive Trinkets
let compassSpinCount = 0;
function spinCompass() {
  compassSpinCount++;
  const compassIcon = document.getElementById('compass-icon');
  const compassStatus = document.getElementById('compass-status');

  compassIcon.style.transform = `rotate(${compassSpinCount * 360 + 135}deg)`;
  compassIcon.style.transition = 'transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)';

  const targets = [
    "The compass points toward... a full bottle of rum! 🍾",
    "The compass points toward... the Black Pearl! 🏴‍☠️",
    "The compass points toward... Isla de Muerta! 💀",
    "The compass points toward... Tortuga! 🍻",
    "The compass points toward... freedom, mate! 🌊"
  ];

  const target = targets[compassSpinCount % targets.length];
  compassStatus.innerText = target;
}

let jarShakes = 0;
function shakeJarOfDirt() {
  jarShakes++;
  const jarIcon = document.getElementById('jar-icon');
  const jarStatus = document.getElementById('jar-status');

  jarIcon.style.transform = 'scale(1.2) rotate(15deg)';
  setTimeout(() => { jarIcon.style.transform = 'none'; }, 300);

  if (jarShakes % 2 === 1) {
    jarStatus.innerHTML = '<span class="gold-text">"I\'ve got a jar of dirt! I\'ve got a jar of dirt! And guess what\'s inside it?"</span> 🎵';
  } else {
    jarStatus.innerText = "Davy Jones is terrified of this jar! Keep it safe, mate!";
  }
}

// Comments Interaction & Auto-Replies
let commentCount = 5;

const jackReplies = [
  "Savvy response, mate! But more importantly: do you happen to have any rum?",
  "Ah, a magnificent comment! I'll add that to my plan. A plan which is currently evolving...",
  "Are you offering me a ship? Because if not, I am technically borrowed-ship-adjacent right now.",
  "That sounds suspiciously like parley! I accept!",
  "Take what you can, give nothing back! Thanks for the comment, savvy?"
];

function postUserComment() {
  const nameInput = document.getElementById('user-name-input');
  const textInput = document.getElementById('comment-text-input');
  const commentList = document.getElementById('comment-list');
  const commentNumSpan = document.getElementById('comment-num');

  const author = nameInput.value.trim() || "Anonymous Scallywag";
  const body = textInput.value.trim();

  if (!body) {
    alert("Please write a message before posting, mate!");
    return;
  }

  // Create user comment element
  const newComment = document.createElement('div');
  newComment.className = 'comment-item';
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  newComment.innerHTML = `
    <div class="comment-author">
      <span class="author-name">${escapeHtml(author)}</span>
      <span class="comment-date">${nowStr}</span>
    </div>
    <div class="comment-body">
      ${escapeHtml(body)}
    </div>
  `;

  commentList.insertBefore(newComment, commentList.firstChild);
  commentCount++;
  commentNumSpan.innerText = commentCount;

  // Clear input
  textInput.value = '';

  // Simulate Jack Sparrow auto-reply after 1.2 seconds
  setTimeout(() => {
    const randomReply = jackReplies[Math.floor(Math.random() * jackReplies.length)];
    const replyComment = document.createElement('div');
    replyComment.className = 'comment-item';
    replyComment.style.borderLeft = '3px solid var(--text-gold)';
    replyComment.style.background = 'rgba(25, 18, 12, 0.9)';

    replyComment.innerHTML = `
      <div class="comment-author">
        <span class="author-name gold-text">CAPTAIN Jack Sparrow (Auto-Reply)</span>
        <span class="comment-date">Just now</span>
      </div>
      <div class="comment-body">
        <em>@${escapeHtml(author)}:</em> ${randomReply}
      </div>
    `;

    commentList.insertBefore(replyComment, commentList.firstChild);
    commentCount++;
    commentNumSpan.innerText = commentCount;
  }, 1200);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}
