/* ==========================================================================
   2000s MySpace - Captain Jack Sparrow Interactive Script
   ========================================================================== */

// Audio Player Simulation
let isPlaying = false;
let progressInterval = null;
let currentProgress = 0;

function toggleAudio() {
  const playBtn = document.getElementById('play-btn');
  const eqVisualizer = document.querySelector('.equalizer-visualizer');
  const progressBar = document.getElementById('progress-bar-fill');

  if (!isPlaying) {
    isPlaying = true;
    playBtn.innerText = '⏸ PAUSE';
    eqVisualizer.classList.add('playing');

    // Simulate audio playback progress bar
    progressInterval = setInterval(() => {
      currentProgress += 1;
      if (currentProgress > 100) {
        currentProgress = 0;
      }
      progressBar.style.width = currentProgress + '%';
    }, 300);

    // Play synthesized theme melody via Web Audio API if browser permits
    playPirateTune();

  } else {
    isPlaying = false;
    playBtn.innerText = '▶ PLAY';
    eqVisualizer.classList.remove('playing');
    clearInterval(progressInterval);
  }
}

// Web Audio API Retro Chiptune Pirates Melody
let audioCtx = null;
function playPirateTune() {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Quick 8-bit motif: D - F - G - G - G - A - A# - A# - A# - C - A - A - D - E - F - F - G - E - F - D
  const notes = [
    { freq: 293.66, dur: 0.2 }, { freq: 349.23, dur: 0.2 }, { freq: 392.00, dur: 0.4 },
    { freq: 392.00, dur: 0.2 }, { freq: 440.00, dur: 0.2 }, { freq: 466.16, dur: 0.4 },
    { freq: 466.16, dur: 0.2 }, { freq: 523.25, dur: 0.2 }, { freq: 440.00, dur: 0.4 },
    { freq: 349.23, dur: 0.2 }, { freq: 392.00, dur: 0.4 }
  ];

  let now = audioCtx.currentTime;
  notes.forEach((note) => {
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.dur - 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + note.dur);
    now += note.dur;
  });
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
  compassIcon.style.transition = 'transform 1s ease-out';

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

  jarIcon.style.transform = 'shake 0.5s';
  setTimeout(() => { jarIcon.style.transform = 'none'; }, 500);

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
    replyComment.style.borderLeft = '3px solid #ffd700';
    replyComment.style.background = '#28170c';

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

// Metallic Hook Click Spark / Glint Effect
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.className = 'click-spark-container';
  document.body.appendChild(container);

  window.addEventListener('click', (e) => {
    const x = e.clientX;
    const y = e.clientY;

    // Generate 6-8 small metallic sparks
    const numSparks = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numSparks; i++) {
      const spark = document.createElement('div');
      spark.className = 'click-spark-particle';

      const angle = (i / numSparks) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const distance = 14 + Math.random() * 18;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      const size = 3 + Math.random() * 3;
      const isGoldSpark = Math.random() > 0.5;

      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.background = isGoldSpark
        ? 'radial-gradient(circle, #fff 0%, #f5d77f 60%, #d4af37 100%)'
        : 'radial-gradient(circle, #fff 0%, #cfd8dc 60%, #90a4ae 100%)';
      spark.style.boxShadow = isGoldSpark
        ? '0 0 6px #f5d77f'
        : '0 0 5px #ffffff';
      spark.style.setProperty('--dx', `${dx}px`);
      spark.style.setProperty('--dy', `${dy}px`);

      container.appendChild(spark);

      setTimeout(() => {
        spark.remove();
      }, 400);
    }
  });
});
