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
  const compassOverlay = document.getElementById('compass-icon-overlay');
  const compassStatus = document.getElementById('compass-status');

  if (compassOverlay) {
    compassOverlay.style.transform = `rotate(${compassSpinCount * 360 + 135}deg)`;
  }

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
  const jarOverlay = document.getElementById('jar-icon-overlay');
  const jarStatus = document.getElementById('jar-status');

  if (jarOverlay) {
    jarOverlay.style.transform = 'scale(1.25)';
    setTimeout(() => { jarOverlay.style.transform = 'none'; }, 250);
  }

  if (jarShakes % 2 === 1) {
    jarStatus.innerHTML = '<span class="gold-text">"I\'ve got a jar of dirt! I\'ve got a jar of dirt! And guess what\'s inside it?"</span> 🎵';
  } else {
    jarStatus.innerText = "Davy Jones is terrified of this jar! Keep it safe, mate!";
  }
}

// Cotton's Parrot Interaction
const parrotQuotes = [
  "“Wind in your sails!”",
  "“Anchors aweigh!”",
  "“Dead men tell no tales!”",
  "“Parlay?”",
  "“Mum’s the word.”"
];
let parrotQuoteIndex = 0;

function squawkParrot() {
  const speechBubble = document.getElementById('parrot-speech');
  const parrotOverlay = document.getElementById('parrot-icon-overlay');

  // Cycle quote sequentially (current index updated first)
  if (speechBubble) {
    speechBubble.innerText = parrotQuotes[parrotQuoteIndex];
  }
  parrotQuoteIndex = (parrotQuoteIndex + 1) % parrotQuotes.length;

  // Bounce/tilt emoji animation
  if (parrotOverlay) {
    parrotOverlay.classList.remove('squawk-anim');
    // Force reflow
    void parrotOverlay.offsetWidth;
    parrotOverlay.classList.add('squawk-anim');
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

/* ==========================================================================
   Custom Pirate Hook Cursor Logic
   ========================================================================== */
function initCustomHookCursor() {
  const cursor = document.getElementById('custom-pirate-cursor');
  const spark = document.getElementById('hook-click-spark');
  if (!cursor) return;

  // Offset so tip of hook inside 48x63px image (x:5px, y:4px) matches mouse pointer precisely
  const tipOffsetX = 5;
  const tipOffsetY = 4;

  let mouseX = -100;
  let mouseY = -100;
  let isVisible = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isVisible) {
      isVisible = true;
      cursor.style.opacity = '1';
    }

    cursor.style.transform = `translate3d(${mouseX - tipOffsetX}px, ${mouseY - tipOffsetY}px, 0)`;

    // Check if target or parent is an interactive element for hover effect
    const target = e.target;
    if (target) {
      const isInteractive = target.closest('a, button, input, textarea, select, [role="button"], .aztec-coin, .trinket-card, .parrot-card, .contact-btn, .player-btn, .progress-bar-bg, .post-comment-btn');
      if (isInteractive) {
        cursor.classList.add('hovering');
      } else {
        cursor.classList.remove('hovering');
      }
    }
  });

  document.addEventListener('mouseleave', () => {
    isVisible = false;
    cursor.style.opacity = '0';
  });

  document.addEventListener('mouseenter', () => {
    isVisible = true;
    cursor.style.opacity = '1';
  });

  document.addEventListener('mousedown', () => {
    if (spark) {
      spark.classList.remove('spark-anim');
      void spark.offsetWidth; // Force reflow
      spark.classList.add('spark-anim');
    }
  });
}

/* ==========================================================================
   Ambient Background Floating Dust/Gold Particles Engine
   ========================================================================== */
function initAmbientParticles() {
  const canvas = document.getElementById('ambient-particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  const DENSITY_PER_VIEWPORT = 380; // 380 particles per 800px viewport height

  // Palette definition: ~80% warm bronze/gold, ~20% soft neutral dust
  const goldColors = [
    { r: 245, g: 200, b: 70 },   // Warm Aztec Gold
    { r: 255, g: 220, b: 110 },  // Soft Luminous Gold
    { r: 220, g: 165, b: 75 },   // Deep Bronze
    { r: 240, g: 175, b: 80 }    // Amber Bronze
  ];

  const dustColors = [
    { r: 200, g: 190, b: 175 },  // Muted Parchment Dust
    { r: 230, g: 220, b: 205 },  // Soft Luminous Dust
    { r: 205, g: 195, b: 180 }   // Pale Ash Dust
  ];

  const shapeTypes = ['circle', 'oval', 'polygon', 'speck'];

  function resizeCanvas() {
    // Measure full scrollable document height and viewport width
    width = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    height = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight,
      document.body.clientHeight,
      document.documentElement.clientHeight
    );

    canvas.width = width;
    canvas.height = height;
  }

  function createParticle(isInitial = false) {
    const isGold = Math.random() < 0.8; // 80% gold/bronze, 20% dust
    const colorList = isGold ? goldColors : dustColors;
    const color = colorList[Math.floor(Math.random() * colorList.length)];

    // Small, varied sizes: radius 1.0px - 3.2px (small specks & flakes)
    const radius = 1.0 + Math.random() * 2.2;

    // Noticeable yet atmospheric peak opacity between 0.45 and 0.75
    const maxOpacity = 0.45 + Math.random() * 0.30;

    // Irregular shapes: circle, oval, polygon, speck
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const rotation = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.01;

    // Generate irregular polygon vertices for polygon shape
    const points = [];
    if (shapeType === 'polygon') {
      const numPoints = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = radius * (0.6 + Math.random() * 0.8);
        points.push({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist });
      }
    }

    return {
      x: Math.random() * (width || window.innerWidth),
      y: isInitial ? Math.random() * (height || window.innerHeight) : (Math.random() < 0.5 ? -10 : height + 10),
      radius: radius,
      shapeType: shapeType,
      rotation: rotation,
      rotationSpeed: rotationSpeed,
      points: points,
      color: color,
      rgbString: `rgb(${color.r}, ${color.g}, ${color.b})`,
      maxOpacity: maxOpacity,
      // Independent sine wave fade in / out cycle
      fadePhase: Math.random() * Math.PI * 2,
      fadeSpeed: 0.005 + Math.random() * 0.008,
      // Slow drift movement (vertical float + subtle horizontal wave drift)
      vx: (Math.random() - 0.5) * 0.20,
      vy: -0.08 - Math.random() * 0.18, // Very slow upward ambient drift
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.008 + Math.random() * 0.012,
      wobbleAmp: 0.15 + Math.random() * 0.25
    };
  }

  function getTargetParticleCount() {
    const currentHeight = height || window.innerHeight || 800;
    // Calculate proportional count based on full document height vs standard 800px viewport height
    return Math.max(150, Math.round(DENSITY_PER_VIEWPORT * (currentHeight / 800)));
  }

  function initParticleList() {
    particles = [];
    const targetCount = getTargetParticleCount();
    for (let i = 0; i < targetCount; i++) {
      particles.push(createParticle(true));
    }
  }

  function adjustParticleCountOnResize() {
    const targetCount = getTargetParticleCount();
    while (particles.length < targetCount) {
      particles.push(createParticle(true));
    }
    if (particles.length > targetCount) {
      particles.length = targetCount;
    }
  }

  function renderParticleShape(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.shapeType !== 'circle') {
      ctx.rotate(p.rotation);
    }

    switch (p.shapeType) {
      case 'oval':
        ctx.beginPath();
        if (ctx.ellipse) {
          ctx.ellipse(0, 0, p.radius * 1.5, p.radius * 0.7, 0, 0, Math.PI * 2);
        } else {
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        }
        ctx.fill();
        break;

      case 'polygon':
        if (p.points && p.points.length > 0) {
          ctx.beginPath();
          for (let k = 0; k < p.points.length; k++) {
            const pt = p.points[k];
            if (k === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'speck':
        ctx.beginPath();
        ctx.rect(-p.radius * 0.7, -p.radius * 0.5, p.radius * 1.4, p.radius * 0.9);
        ctx.fill();
        break;

      case 'circle':
      default:
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  function updateAndDrawParticles() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Update positions and rotations
      p.wobblePhase += p.wobbleSpeed;
      p.fadePhase += p.fadeSpeed;
      p.rotation += p.rotationSpeed;

      p.x += p.vx + Math.sin(p.wobblePhase) * p.wobbleAmp;
      p.y += p.vy;

      // Calculate current opacity (smooth sine wave fade in and out)
      const alpha = Math.max(0, p.maxOpacity * (0.5 + 0.5 * Math.sin(p.fadePhase)));

      // Wrap around bounds seamlessly across full document canvas
      if (p.y < -15) {
        p.y = height + 10;
        p.x = Math.random() * width;
      } else if (p.y > height + 15) {
        p.y = -10;
        p.x = Math.random() * width;
      }

      if (p.x < -15) {
        p.x = width + 10;
      } else if (p.x > width + 15) {
        p.x = -10;
      }

      if (alpha > 0.01) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.rgbString;
        renderParticleShape(p);
      }
    }

    requestAnimationFrame(updateAndDrawParticles);
  }

  // Initialize canvas size and particle array
  resizeCanvas();
  initParticleList();

  // Listen for window resize and DOM height changes to keep canvas aligned
  window.addEventListener('resize', () => {
    resizeCanvas();
    adjustParticleCountOnResize();
  });

  // Observe page height changes (e.g. when comments are added)
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      adjustParticleCountOnResize();
    });
    resizeObserver.observe(document.body);
  }

  // Start animation loop
  requestAnimationFrame(updateAndDrawParticles);
}

/* ==========================================================================
   Break The Curse Mini-Game Logic
   ========================================================================== */
let collectedCoinsCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  initCustomHookCursor();
  initCurseMiniGame();
  initAmbientParticles();
});

function initCurseMiniGame() {
  const coins = document.querySelectorAll('.aztec-coin');
  coins.forEach(coin => {
    coin.addEventListener('click', (e) => handleCoinClick(coin, e));
    coin.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCoinClick(coin, e);
      }
    });
  });
}

function handleCoinClick(coin, event) {
  if (coin.classList.contains('collected') || coin.dataset.animating === 'true') {
    return;
  }

  coin.dataset.animating = 'true';

  const chestSvg = document.getElementById('treasure-chest-svg');
  const chestContainer = document.getElementById('treasure-chest-container');
  const countSpan = document.getElementById('curse-count');

  if (!chestSvg || !chestContainer) return;

  const coinRect = coin.getBoundingClientRect();
  const chestRect = chestSvg.getBoundingClientRect();

  // Scroll offset at the moment of calculation
  const scrollX = window.scrollX || window.pageXOffset || 0;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  // Absolute page coordinates for coin and chest center
  const coinPageLeft = coinRect.left + scrollX;
  const coinPageTop = coinRect.top + scrollY;

  const targetX = (chestRect.left + scrollX) + chestRect.width / 2 - coinRect.width / 2;
  const targetY = (chestRect.top + scrollY) + chestRect.height / 2 - coinRect.height / 2;

  // Create flying coin clone using absolute page positioning so scrolling won't affect destination
  const flyCoin = document.createElement('div');
  flyCoin.className = 'flying-aztec-coin';
  flyCoin.innerHTML = '<img src="assets/aztec-coin.png" alt="" />';
  flyCoin.style.width = `${coinRect.width}px`;
  flyCoin.style.height = `${coinRect.height}px`;
  flyCoin.style.left = `${coinPageLeft}px`;
  flyCoin.style.top = `${coinPageTop}px`;

  document.body.appendChild(flyCoin);

  // Hide original coin in page flow
  coin.classList.add('collected');

  const startX = coinPageLeft;
  const startY = coinPageTop;
  const endX = targetX;
  const endY = targetY;

  const flightDuration = 2400; // 2.4s slow, cinematic flight

  // Generate smooth, flowing wave keyframes (Bezier curve with subtle wave)
  const keyframes = [];
  const steps = 20;

  // Horizontal displacement direction for subtle wave curvature
  const waveAmp = (startX < endX ? 40 : -40);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Cubic Bezier path calculation for smooth curve
    // Control points lift upwards and create a flowing path toward the chest
    const p0X = startX;
    const p0Y = startY;

    const p1X = startX + (endX - startX) * 0.25 + waveAmp;
    const p1Y = startY - 120; // gentle upward float

    const p2X = startX + (endX - startX) * 0.75 - waveAmp * 0.5;
    const p2Y = Math.min(startY, endY) - 60;

    const p3X = endX;
    const p3Y = endY;

    // Bezier formula
    const currentX = Math.pow(1 - t, 3) * p0X +
                     3 * Math.pow(1 - t, 2) * t * p1X +
                     3 * (1 - t) * Math.pow(t, 2) * p2X +
                     Math.pow(t, 3) * p3X;

    const currentY = Math.pow(1 - t, 3) * p0Y +
                     3 * Math.pow(1 - t, 2) * t * p1Y +
                     3 * (1 - t) * Math.pow(t, 2) * p2Y +
                     Math.pow(t, 3) * p3Y;

    const dx = currentX - startX;
    const dy = currentY - startY;

    // Scale down smoothly as it approaches the chest (1.0 -> 0.3)
    const scale = 1 - t * 0.7;

    // Gentle rotation over time (0deg -> 480deg)
    const rotation = t * 480;

    // Opacity remains 1.0 until the very last 5% settling moment
    const opacity = t > 0.95 ? (1 - (t - 0.95) / 0.05) : 1;

    keyframes.push({
      transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${rotation.toFixed(1)}deg)`,
      opacity: opacity,
      offset: t
    });
  }

  // Smooth Web Animations API flight
  flyCoin.animate(keyframes, {
    duration: flightDuration,
    easing: 'cubic-bezier(0.42, 0, 0.58, 1)', // Smooth ease-in-out
    fill: 'forwards'
  });

  // Handle arrival at chest
  setTimeout(() => {
    flyCoin.remove();

    collectedCoinsCount++;
    if (countSpan) {
      countSpan.innerText = collectedCoinsCount;
    }

    // Play chest shake and glow animation
    chestContainer.classList.remove('shake');
    void chestContainer.offsetWidth; // Force reflow
    chestContainer.classList.add('shake');

    setTimeout(() => {
      chestContainer.classList.remove('shake');
    }, 450);

    // Check for victory condition (5/5 coins)
    if (collectedCoinsCount >= 5) {
      triggerCurseVictory(chestContainer);
    }
  }, flightDuration);
}

function triggerCurseVictory(chestContainer) {
  chestContainer.classList.add('victory');

  // Generate golden sparkle particles
  const sparklesContainer = document.getElementById('sparkles-container');
  if (sparklesContainer) {
    sparklesContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'gold-sparkle';
      sparkle.style.left = '45%';
      sparkle.style.top = '40%';

      const angle = Math.random() * Math.PI * 2;
      const dist = 35 + Math.random() * 55;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;

      sparkle.style.setProperty('--tx', `${tx}px`);
      sparkle.style.setProperty('--ty', `${ty}px`);
      sparkle.style.animationDelay = `${Math.random() * 0.3}s`;

      sparklesContainer.appendChild(sparkle);
    }
  }

  // Update status message with victory text
  const statusDiv = document.getElementById('curse-status');
  if (statusDiv) {
    statusDiv.innerHTML = `
      <div class="curse-victory-header">☠️ THE CURSE IS BROKEN</div>
      <div class="curse-victory-msg">"The gold has been returned. Savvy?"</div>
    `;
  }
}
