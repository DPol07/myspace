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

  // Polyphonic Orchestral Arrangement: Lead Brass, Horn Harmony, Cello/Bass Ostinato & Timpani Percussion
  const fullMelody = [...pirateMelody, ...pirateMelody];

  fullMelody.forEach((note) => {
    const noteStart = timeCursor;
    const noteEnd = timeCursor + note.dur;
    timeCursor = noteEnd;

    if (noteEnd > startOffsetSec) {
      const scheduledStartTime = now + Math.max(0, noteStart - startOffsetSec);
      const duration = (noteStart < startOffsetSec) ? (noteEnd - startOffsetSec) : note.dur;

      // 1. Lead Orchestral Brass / Strings (Sawtooth + Warm Low-Pass Filter)
      const leadOsc = audioCtx.createOscillator();
      const leadGain = audioCtx.createGain();
      const leadFilter = audioCtx.createBiquadFilter();

      leadOsc.type = 'sawtooth';
      leadOsc.frequency.value = note.freq;

      leadFilter.type = 'lowpass';
      leadFilter.frequency.setValueAtTime(1600, scheduledStartTime);
      leadFilter.frequency.exponentialRampToValueAtTime(800, scheduledStartTime + duration);

      leadGain.gain.setValueAtTime(0.09, scheduledStartTime);
      leadGain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + duration - 0.015);

      leadOsc.connect(leadFilter);
      leadFilter.connect(leadGain);
      leadGain.connect(audioCtx.destination);

      leadOsc.start(scheduledStartTime);
      leadOsc.stop(scheduledStartTime + duration);
      activeOscillators.push(leadOsc);

      // 2. French Horn Harmony (Harmonic Major 3rd / Minor 3rd Transposition)
      const hornOsc = audioCtx.createOscillator();
      const hornGain = audioCtx.createGain();
      const hornFilter = audioCtx.createBiquadFilter();

      hornOsc.type = 'triangle';
      hornOsc.frequency.value = note.freq * 1.25; // Transposed 3rd harmony

      hornFilter.type = 'lowpass';
      hornFilter.frequency.value = 1100;

      hornGain.gain.setValueAtTime(0.045, scheduledStartTime);
      hornGain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + duration - 0.015);

      hornOsc.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(audioCtx.destination);

      hornOsc.start(scheduledStartTime);
      hornOsc.stop(scheduledStartTime + duration);
      activeOscillators.push(hornOsc);

      // 3. Deep Cello / Double Bass Low End (Sub 1 Octave Down)
      const bassOsc = audioCtx.createOscillator();
      const bassGain = audioCtx.createGain();
      const bassFilter = audioCtx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = note.freq / 2;

      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 450;

      bassGain.gain.setValueAtTime(0.07, scheduledStartTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + duration - 0.015);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(audioCtx.destination);

      bassOsc.start(scheduledStartTime);
      bassOsc.stop(scheduledStartTime + duration);
      activeOscillators.push(bassOsc);

      // 4. Orchestral Timpani / Snare Accent on beat starts
      if (note.dur >= 0.4) {
        const timpaniOsc = audioCtx.createOscillator();
        const timpaniGain = audioCtx.createGain();

        timpaniOsc.type = 'sine';
        timpaniOsc.frequency.setValueAtTime(95, scheduledStartTime);
        timpaniOsc.frequency.exponentialRampToValueAtTime(35, scheduledStartTime + 0.18);

        timpaniGain.gain.setValueAtTime(0.12, scheduledStartTime);
        timpaniGain.gain.exponentialRampToValueAtTime(0.001, scheduledStartTime + 0.18);

        timpaniOsc.connect(timpaniGain);
        timpaniGain.connect(audioCtx.destination);

        timpaniOsc.start(scheduledStartTime);
        timpaniOsc.stop(scheduledStartTime + 0.18);
        activeOscillators.push(timpaniOsc);
      }
    }
  });
}

/* ==========================================================================
   Sea Battle Sound Effects Engine (Web Audio API Synthesizer)
   ========================================================================== */
function playSeaSFX(type) {
  if (!audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) audioCtx = new AudioCtx();
  }
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  try {
    switch (type) {
      case 'cannon': {
        // Refined, short, subtle, authentic cannon firing sound
        // Deep low body drop (Sub pitch drop from 110Hz to 25Hz over 0.12s)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.12);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);

        // Gunpowder explosion noise burst (Short, low-pass filtered, non-intrusive)
        const bufferSize = audioCtx.sampleRate * 0.10; // 100ms short burst
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.10);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.16, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(now);
        break;
      }

      default:
        // All other sound effects deleted / disabled per user request
        break;
    }
  } catch (e) {
    // Graceful fallback if Web Audio is unavailable
  }
}

/* ==========================================================================
   Sea Battle Mini-Game Logic
   ========================================================================== */
let seaCanvas = null;
let seaCtx = null;

let seaGameActive = false;
let seaScore = 0;
let seaLives = 3;
let seaHighScore = 0;

let playerShip = {
  x: 150,
  y: 350,
  width: 38,
  height: 56,
  speed: 9.6,
  vx: 0,
  vy: 0,
  maxSpeed: 9.8,
  accel: 1.4,
  friction: 0.75,
  invulnerableTimer: 0,
  dashCharges: 3,
  maxDashCharges: 3,
  dashCooldownTimer: 0,
  dashBurstTimer: 0
};

let keyState = {
  left: false,
  right: false,
  up: false,
  down: false,
  shift: false,
  space: false
};

let cannonballs = [];
let enemyShips = [];
let flippingShips = [];
let enemyProjectiles = [];
let rocks = [];
let barrels = [];
let islands = [];
let seagulls = [];
let fallingSeagulls = [];
let splashEffects = [];
let explosions = [];
let rockShatters = [];
let scorePopups = [];
let dashWakes = [];
let dashRechargeTimers = [];

// Animated Wave / Sea Mesh State
let oceanTime = 0;

let lastCannonTime = 0;
let cannonCooldown = 260; // ms between shots

let spawnTimerRocks = 0;
let spawnTimerEnemies = 0;
let spawnTimerBarrels = 0;
let spawnTimerIslands = 0;
let spawnTimerSeagulls = 0;

function resizeSeaCanvas() {
  if (!seaCanvas) return;
  const parent = seaCanvas.parentElement;
  if (parent && parent.clientWidth > 0) {
    seaCanvas.width = parent.clientWidth;
  }
}

function initSeaBattle() {
  seaCanvas = document.getElementById('sea-battle-canvas');
  if (!seaCanvas) return;
  seaCtx = seaCanvas.getContext('2d');

  resizeSeaCanvas();
  window.addEventListener('resize', () => {
    resizeSeaCanvas();
    if (!seaGameActive) {
      drawSeaBattleFrame();
    }
  });

  // Load high score from localStorage if available
  try {
    const saved = localStorage.getItem('jack_sea_battle_highscore');
    if (saved) seaHighScore = parseInt(saved, 10) || 0;
  } catch (e) {}

  // Keyboard Event Listeners (Arrow Keys, WASD, Shift & Spacebar Support)
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || k === 'a') {
      keyState.left = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === 'ArrowRight' || k === 'd') {
      keyState.right = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === 'ArrowUp' || k === 'w') {
      keyState.up = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === 'ArrowDown' || k === 's') {
      keyState.down = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === 'Shift') {
      keyState.shift = true;
      if (seaGameActive) {
        e.preventDefault();
        triggerPlayerDash();
      }
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      keyState.space = true;
      if (seaGameActive) e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (e.key === 'ArrowLeft' || k === 'a') keyState.left = false;
    else if (e.key === 'ArrowRight' || k === 'd') keyState.right = false;
    else if (e.key === 'ArrowUp' || k === 'w') keyState.up = false;
    else if (e.key === 'ArrowDown' || k === 's') keyState.down = false;
    else if (e.key === 'Shift') keyState.shift = false;
    else if (e.key === ' ' || e.key === 'Spacebar') keyState.space = false;
  });

  // Render initial static frame on canvas
  drawSeaBattleFrame();
}

function startSeaBattle() {
  seaGameActive = true;
  seaScore = 0;
  seaLives = 3;

  playerShip.x = seaCanvas.width / 2 - playerShip.width / 2;
  playerShip.y = seaCanvas.height - 82;
  playerShip.vx = 0;
  playerShip.vy = 0;
  playerShip.invulnerableTimer = 0;
  playerShip.dashCharges = 3;
  playerShip.dashCooldownTimer = 0;
  playerShip.dashBurstTimer = 0;

  cannonballs = [];
  enemyShips = [];
  flippingShips = [];
  enemyProjectiles = [];
  rocks = [];
  barrels = [];
  islands = [];
  seagulls = [];
  fallingSeagulls = [];
  splashEffects = [];
  explosions = [];
  rockShatters = [];
  scorePopups = [];
  dashWakes = [];
  dashRechargeTimers = [];

  spawnTimerRocks = 0;
  spawnTimerEnemies = 0;
  spawnTimerBarrels = 0;
  spawnTimerIslands = 0;
  spawnTimerSeagulls = 0;

  updateSeaHUD();

  const overlay = document.getElementById('sea-battle-overlay');
  if (overlay) overlay.classList.add('hidden');

  // Move custom hook cursor outside the game panel so it doesn't obscure gameplay
  const customCursor = document.getElementById('custom-pirate-cursor');
  if (customCursor) {
    const tipOffsetX = 5;
    const tipOffsetY = 4;
    customCursor.style.transform = `translate3d(${20 - tipOffsetX}px, ${20 - tipOffsetY}px, 0)`;
  }

  requestAnimationFrame(seaGameLoop);
}

function updateSeaHUD() {
  const scoreSpan = document.getElementById('sea-score');
  const livesSpan = document.getElementById('sea-lives');
  const dashSpan = document.getElementById('sea-dash');

  if (scoreSpan) scoreSpan.innerText = seaScore;
  if (livesSpan) {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += (i < seaLives) ? '❤️ ' : '🖤 ';
    }
    livesSpan.innerText = hearts.trim();
  }
  if (dashSpan) {
    let dashes = [];
    for (let i = 0; i < playerShip.maxDashCharges; i++) {
      if (i < playerShip.dashCharges) {
        dashes.push('💨');
      } else {
        const rechargeIdx = i - playerShip.dashCharges;
        if (rechargeIdx === 0 && dashRechargeTimers.length > 0) {
          const secs = Math.max(1, Math.ceil(dashRechargeTimers[0] / 60));
          dashes.push(`⏳${secs}s`);
        } else {
          dashes.push('⚪');
        }
      }
    }
    dashSpan.innerText = dashes.join(' ');
  }
}

function triggerPlayerDash() {
  if (!seaGameActive) return;
  if (playerShip.dashCharges <= 0 || playerShip.dashCooldownTimer > 0) return;

  playerShip.dashCharges--;
  playerShip.dashCooldownTimer = 18; // Short internal cooldown before next dash
  playerShip.dashBurstTimer = 10;     // Active burst duration

  // Directional unit vectors
  let dirX = 0;
  let dirY = 0;

  if (keyState.left) dirX -= 1;
  if (keyState.right) dirX += 1;
  if (keyState.up) dirY -= 1;
  if (keyState.down) dirY += 1;

  // Default to forward/upward dash burst if stationary
  if (dirX === 0 && dirY === 0) {
    dirY = -1;
  }

  // Normalize directional vector
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  dirX /= len;
  dirY /= len;

  const dashForce = 26.0;
  playerShip.vx = dirX * dashForce;
  playerShip.vy = dirY * dashForce;

  // Queue a 15-second (900 frames at 60fps) recharge timer for this charge
  dashRechargeTimers.push(900);

  // Spawn initial water wake burst trail behind the Black Pearl
  const px = playerShip.x + playerShip.width / 2;
  const py = playerShip.y + playerShip.height / 2;

  for (let i = 0; i < 14; i++) {
    dashWakes.push({
      x: px + (Math.random() - 0.5) * 24,
      y: py + (Math.random() - 0.5) * 24,
      vx: -dirX * (1.5 + Math.random() * 2.5) + (Math.random() - 0.5) * 1.5,
      vy: -dirY * (1.5 + Math.random() * 2.5) + (Math.random() - 0.5) * 1.5,
      radius: 3 + Math.random() * 5,
      life: 1.0,
      decay: 0.04 + Math.random() * 0.03
    });
  }

  updateSeaHUD();
}

function fireCannonball() {
  const now = Date.now();
  if (now - lastCannonTime < cannonCooldown) return;
  lastCannonTime = now;

  playSeaSFX('cannon');

  // Fire cannonball from center bow of Black Pearl
  cannonballs.push({
    x: playerShip.x + playerShip.width / 2,
    y: playerShip.y,
    radius: 5.5,
    speed: 10.5
  });
}

/**
 * Scattered Rocks Generator:
 * Spawns individual rocks scattered irregularly across the open sea, starting gently
 * and guaranteeing a clear, navigable passage for the Black Pearl at all times.
 */
function spawnScatteredRock() {
  // Fair, progressive speed scaling starting slow (1.2px/frame)
  const baseSpeed = 1.2 + Math.min(2.0, seaScore * 0.02);
  const rockW = 26 + Math.random() * 24;
  const rockH = 24 + Math.random() * 22;

  // Ensure there is always a guaranteed safe gap (> 80px wide) across all obstacles at the top level
  let x = 20 + Math.random() * (seaCanvas.width - rockW - 40);

  // Check top obstacles (rocks, islands, barrels) to prevent walling off the player
  const topObstacles = [
    ...rocks.filter(r => r.y < 90),
    ...islands.filter(i => i.y < 120),
    ...barrels.filter(b => b.y < 80)
  ];

  let attempts = 0;
  while (attempts < 15) {
    let createsTotalBlockade = false;
    const testLeft = x;
    const testRight = x + rockW;

    for (let obs of topObstacles) {
      const obsLeft = obs.x;
      const obsRight = obs.x + obs.width;
      // If gap between new rock and existing top obstacle is too narrow for Black Pearl (player ship width ~44px)
      const gap = Math.max(0, Math.max(testLeft - obsRight, obsLeft - testRight));
      if (gap > 0 && gap < 75) {
        createsTotalBlockade = true;
        break;
      }
    }

    if (!createsTotalBlockade) break;
    x = 20 + Math.random() * (seaCanvas.width - rockW - 40);
    attempts++;
  }

  rocks.push({
    x: x,
    y: -rockH,
    width: rockW,
    height: rockH,
    speed: baseSpeed,
    hits: 0
  });

  // Only spawn companion rock if game progressed past 2 points and space allows
  if (seaScore >= 2 && Math.random() < 0.20) {
    const companionW = 18 + Math.random() * 14;
    const companionH = 18 + Math.random() * 14;
    const offsetX = Math.random() < 0.5 ? (rockW + 6) : (-companionW - 6);
    const companionX = x + offsetX;

    if (companionX >= 15 && companionX <= seaCanvas.width - companionW - 15) {
      rocks.push({
        x: companionX,
        y: -rockH + (Math.random() * 6 - 3),
        width: companionW,
        height: companionH,
        speed: baseSpeed,
        hits: 0
      });
    }
  }
}

function createWaterSplashEffect(x, y) {
  // Splash ring
  splashEffects.push({
    x: x,
    y: y,
    radius: 2,
    maxRadius: 14 + Math.random() * 6,
    life: 1.0,
    decay: 0.04,
    color: 'rgba(180, 235, 255, 0.8)'
  });

  // Upward water droplets
  for (let i = 0; i < 8; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
    const speed = 1.2 + Math.random() * 2.5;
    splashEffects.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.15,
      radius: 1.2 + Math.random() * 1.5,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.03,
      color: Math.random() < 0.5 ? '#e0f7fa' : '#80deea'
    });
  }
}

/**
 * Reachable Royal Navy Ship Generator:
 * Spawns enemy warships (normal, armored, or artillery) at positions across the sea
 * that are NOT blocked by islands or completely obscured in line-of-sight by rocks.
 */
function spawnEnemyShip() {
  // Determine ship variant: normal (standard), armored (3 hits, slower, larger), artillery (fires mortar shots, same speed, smaller)
  let variant = 'normal';
  const rand = Math.random();
  if (seaScore >= 3 && rand < 0.10) {
    variant = 'armored';
  } else if (seaScore >= 2 && rand < 0.20) {
    variant = 'artillery';
  }

  let enemyWidth = 38;
  let enemyHeight = 56;
  let hp = 1;

  if (variant === 'armored') {
    enemyWidth = 46;
    enemyHeight = 66;
    hp = 3;
  } else if (variant === 'artillery') {
    enemyWidth = 32;
    enemyHeight = 48;
    hp = 1;
  }

  // Speed variations based on variant (declared before reaches-bottom solver check)
  let baseSpeed = 1.1 + Math.min(2.0, seaScore * 0.02);
  if (variant === 'armored') baseSpeed *= 0.72; // Slower heavy warship
  if (variant === 'artillery') baseSpeed *= 1.0; // Same speed as regular Royal Navy ships

  // Find all rocks and islands currently on screen
  const blockingRocks = rocks.filter(r => r.y >= -20 && r.y < playerShip.y - 30);
  const activeIslands = islands.filter(isl => isl.y >= -100 && isl.y < seaCanvas.height);

  // Helper to test if an enemy at candidate X is impossible to reach/attack or overlaps an island
  function isInvalidSpawn(candidateX) {
    const eLeft = candidateX;
    const eRight = candidateX + enemyWidth;

    // 1. Check island overlap/intersection
    for (let isl of activeIslands) {
      const islLeft = isl.x - 12;
      const islRight = isl.x + isl.width + 12;
      if (eLeft < islRight && eRight > islLeft) {
        return true; // Overlaps or sails through island
      }
    }

    // 2. Check complete rock coverage in line of fire
    for (let r of blockingRocks) {
      const rLeft = r.x;
      const rRight = r.x + r.width;
      if (rLeft <= eLeft + 4 && rRight >= eRight - 4) {
        return true;
      }
    }

    // 3. Ensure candidate enemy X leaves a navigable, solvable path from current player position
    // Calculate player travel time to reach enemy column vs enemy travel time to reach bottom
    const distToEnemyX = Math.abs((playerShip.x + playerShip.width / 2) - (candidateX + enemyWidth / 2));
    const timeToEnemyX = distToEnemyX / playerShip.maxSpeed;
    const timeToReachBottom = (seaCanvas.height + enemyHeight) / baseSpeed;

    // If player cannot physically reach or align with enemy ship before it reaches bottom canvas
    if (timeToEnemyX > timeToReachBottom * 0.75) {
      return true;
    }

    return false;
  }

  let x = 20 + Math.random() * (seaCanvas.width - enemyWidth - 40);
  let attempts = 0;

  while (isInvalidSpawn(x) && attempts < 25) {
    x = 20 + Math.random() * (seaCanvas.width - enemyWidth - 40);
    attempts++;
  }

  enemyShips.push({
    x: x,
    y: -enemyHeight,
    width: enemyWidth,
    height: enemyHeight,
    speed: baseSpeed,
    variant: variant,
    hp: hp,
    maxHp: hp,
    fireTimer: Math.floor(Math.random() * 60) // Initial delay for artillery firing
  });
}

/**
 * Environmental Details Generators (Decorative Only)
 */
function spawnFloatingBarrel() {
  const w = 18 + Math.random() * 6;
  const h = 24 + Math.random() * 6;
  barrels.push({
    x: 15 + Math.random() * (seaCanvas.width - w - 30),
    y: -h,
    width: w,
    height: h,
    speed: 1.8 + Math.random() * 0.5,
    rotation: (Math.random() - 0.5) * 0.4
  });
}

function spawnSmallIsland() {
  const w = 80 + Math.random() * 28;
  const h = 56 + Math.random() * 20;
  islands.push({
    x: 20 + Math.random() * (seaCanvas.width - w - 40),
    y: -h - 20,
    width: w,
    height: h,
    speed: 1.1 + Math.random() * 0.3,
    isBroken: false,
    breakAngle: 0,
    breakDir: Math.random() < 0.5 ? 1 : -1
  });
}

function spawnSeagull() {
  const fromLeft = Math.random() < 0.5;
  seagulls.push({
    x: fromLeft ? -30 : seaCanvas.width + 30,
    y: 30 + Math.random() * (seaCanvas.height * 0.6),
    vx: fromLeft ? (1.4 + Math.random() * 1.2) : (-1.4 - Math.random() * 1.2),
    vy: (Math.random() - 0.5) * 0.4,
    size: 15 + Math.random() * 7
  });
}

function createExplosion(x, y) {
  // 1. Brief Burst of Fire & Sparks (Immediate impact flash)
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;
    explosions.push({
      type: 'spark',
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.5 + Math.random() * 2,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.04,
      color: Math.random() < 0.5 ? '#ffe066' : '#ff7700'
    });
  }

  // 2. Wooden Debris / Splinters (Flying ship hull fragments)
  for (let i = 0; i < 7; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.8 + Math.random() * 2.8;
    explosions.push({
      type: 'debris',
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.3,
      w: 2 + Math.random() * 2,
      h: 4 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.3,
      life: 1.0,
      decay: 0.03 + Math.random() * 0.02,
      color: Math.random() < 0.6 ? '#6e4722' : '#3d240f'
    });
  }

  // 3. Subtle Rising Smoke Clouds (Soft grey lingering smoke)
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 1.0;
    explosions.push({
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: -0.4 - Math.random() * 0.5,
      radius: 3 + Math.random() * 2,
      grow: 0.12 + Math.random() * 0.08,
      life: 1.0,
      decay: 0.02 + Math.random() * 0.015,
      color: Math.random() < 0.5 ? 'rgba(45, 45, 50, 0.7)' : 'rgba(80, 80, 85, 0.6)'
    });
  }
}

function createRockShatterEffect(x, y) {
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    rockShatters.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.5 + Math.random() * 2.5,
      life: 1.0,
      decay: 0.05 + Math.random() * 0.04,
      color: Math.random() < 0.5 ? '#8c7865' : (Math.random() < 0.5 ? '#d4af37' : '#ffffff')
    });
  }
}

function seaGameLoop() {
  if (!seaGameActive) return;

  oceanTime += 0.05;

  // 1. Update Player Movement & Firing (Omnidirectional 4-Way Arrow Key Controls)
  if (keyState.left) {
    playerShip.vx -= playerShip.accel;
  }
  if (keyState.right) {
    playerShip.vx += playerShip.accel;
  }
  if (!keyState.left && !keyState.right) {
    playerShip.vx *= playerShip.friction;
  } else {
    playerShip.vx *= 0.88;
  }

  if (keyState.up) {
    playerShip.vy -= playerShip.accel;
  }
  if (keyState.down) {
    playerShip.vy += playerShip.accel;
  }
  if (!keyState.up && !keyState.down) {
    playerShip.vy *= playerShip.friction;
  } else {
    playerShip.vy *= 0.88;
  }

  // Clamp velocity to max responsive speed
  if (playerShip.vx > playerShip.maxSpeed) playerShip.vx = playerShip.maxSpeed;
  if (playerShip.vx < -playerShip.maxSpeed) playerShip.vx = -playerShip.maxSpeed;
  if (playerShip.vy > playerShip.maxSpeed) playerShip.vy = playerShip.maxSpeed;
  if (playerShip.vy < -playerShip.maxSpeed) playerShip.vy = -playerShip.maxSpeed;

  if (Math.abs(playerShip.vx) < 0.05) playerShip.vx = 0;
  if (Math.abs(playerShip.vy) < 0.05) playerShip.vy = 0;

  playerShip.x += playerShip.vx;
  playerShip.y += playerShip.vy;

  // Boundary clamping to keep Black Pearl inside the sea canvas playfield
  if (playerShip.x < 5) {
    playerShip.x = 5;
    playerShip.vx = 0;
  }
  if (playerShip.x > seaCanvas.width - playerShip.width - 5) {
    playerShip.x = seaCanvas.width - playerShip.width - 5;
    playerShip.vx = 0;
  }
  if (playerShip.y < 15) {
    playerShip.y = 15;
    playerShip.vy = 0;
  }
  if (playerShip.y > seaCanvas.height - playerShip.height - 10) {
    playerShip.y = seaCanvas.height - playerShip.height - 10;
    playerShip.vy = 0;
  }
  if (keyState.space) {
    fireCannonball();
  }

  if (playerShip.invulnerableTimer > 0) {
    playerShip.invulnerableTimer--;
  }

  if (playerShip.dashCooldownTimer > 0) {
    playerShip.dashCooldownTimer--;
  }

  if (playerShip.dashBurstTimer > 0) {
    playerShip.dashBurstTimer--;
    // Continuous water foam particles during active dash burst
    const px = playerShip.x + playerShip.width / 2;
    const py = playerShip.y + playerShip.height / 2;
    dashWakes.push({
      x: px + (Math.random() - 0.5) * 16,
      y: py + (Math.random() - 0.5) * 16,
      vx: -playerShip.vx * 0.2 + (Math.random() - 0.5) * 1,
      vy: -playerShip.vy * 0.2 + (Math.random() - 0.5) * 1,
      radius: 2.5 + Math.random() * 4,
      life: 1.0,
      decay: 0.05
    });
  }

  // Update Dash Wake Trail Particles
  for (let i = dashWakes.length - 1; i >= 0; i--) {
    const dw = dashWakes[i];
    dw.x += dw.vx;
    dw.y += dw.vy;
    dw.radius += 0.3;
    dw.life -= dw.decay;
    if (dw.life <= 0) dashWakes.splice(i, 1);
  }

  // Update Dash Recharges (15s per charge)
  if (dashRechargeTimers.length > 0) {
    dashRechargeTimers[0]--;
    if (dashRechargeTimers[0] <= 0) {
      dashRechargeTimers.shift();
      playerShip.dashCharges = Math.min(playerShip.maxDashCharges, playerShip.dashCharges + 1);
    }
  }

  updateSeaHUD();

  // 2. Progressive Spawning Timers starting noticeably relaxed early on
  const rockSpawnInterval = Math.max(60, 120 - Math.floor(seaScore * 1.2));
  const enemySpawnInterval = Math.max(90, 160 - Math.floor(seaScore * 1.5));

  spawnTimerRocks++;
  if (spawnTimerRocks >= rockSpawnInterval) {
    spawnScatteredRock();
    spawnTimerRocks = 0;
  }

  spawnTimerEnemies++;
  if (spawnTimerEnemies >= enemySpawnInterval) {
    spawnEnemyShip();
    spawnTimerEnemies = 0;
  }

  // Decorative Environmental Spawns
  spawnTimerBarrels++;
  if (spawnTimerBarrels >= 110) {
    spawnFloatingBarrel();
    spawnTimerBarrels = 0;
  }

  spawnTimerIslands++;
  if (spawnTimerIslands >= 420) {
    spawnSmallIsland();
    spawnTimerIslands = 0;
  }

  spawnTimerSeagulls++;
  if (spawnTimerSeagulls >= 280) {
    spawnSeagull();
    spawnTimerSeagulls = 0;
  }

  // Update Environmental Decorative Elements
  for (let i = barrels.length - 1; i >= 0; i--) {
    barrels[i].y += barrels[i].speed;
    if (barrels[i].y > seaCanvas.height + 30) barrels.splice(i, 1);
  }

  for (let i = islands.length - 1; i >= 0; i--) {
      const isl = islands[i];
      isl.y += isl.speed;

      // Animate palm tree falling angle if broken
      if (isl.isBroken && isl.breakAngle < 1.2) {
        isl.breakAngle = Math.min(1.2, isl.breakAngle + 0.08);
      }

      if (isl.y > seaCanvas.height + 80) islands.splice(i, 1);
  }

  for (let i = seagulls.length - 1; i >= 0; i--) {
    seagulls[i].x += seagulls[i].vx;
    seagulls[i].y += seagulls[i].vy;
    if (seagulls[i].x < -40 || seagulls[i].x > seaCanvas.width + 40) {
      seagulls.splice(i, 1);
    }
  }

  // Update Falling Seagulls (Gravitational fall to water + Splash)
  for (let i = fallingSeagulls.length - 1; i >= 0; i--) {
    const fg = fallingSeagulls[i];
    fg.x += fg.vx;
    fg.vy += fg.gravity;
    fg.y += fg.vy;
    fg.rotation += fg.vRot;

    // Check if reached water level or canvas bottom
    if (fg.y >= fg.waterTargetY || fg.y >= seaCanvas.height - 20) {
      createWaterSplashEffect(fg.x, fg.y);
      playSeaSFX('seagullSplash');
      fallingSeagulls.splice(i, 1);
    }
  }

  // Update Splash Effects (Ripples & Water Droplets)
  for (let i = splashEffects.length - 1; i >= 0; i--) {
    const s = splashEffects[i];
    if (s.maxRadius) {
      // Ripple ring
      s.radius += 0.6;
      s.life -= s.decay;
    } else {
      // Droplet
      s.x += s.vx;
      s.vy += s.gravity;
      s.y += s.vy;
      s.life -= s.decay;
    }
    if (s.life <= 0) splashEffects.splice(i, 1);
  }

  // 3. Update Cannonballs & Collision with Rocks / Enemy Ships
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    const cb = cannonballs[i];
    cb.y -= cb.speed;

    let cbHit = false;

    // Check collision with Rocks (2 Hits to Destroy, 0 Points)
    for (let rIdx = rocks.length - 1; rIdx >= 0; rIdx--) {
      const r = rocks[rIdx];
      if (checkPointInAABB(cb.x, cb.y, r)) {
        r.hits = (r.hits || 0) + 1;

        if (r.hits === 1) {
          // 1st Hit: Cracks appear + stone chip particles + rock hit sound
          createRockShatterEffect(cb.x, cb.y);
          playSeaSFX('rockHit');
        } else {
          // 2nd Hit: Rock breaks apart, collapses and sinks into the sea + heavy collapse sound
          playSeaSFX('rockCollapse');
          createWaterSplashEffect(r.x + r.width / 2, r.y + r.height / 2);

          // Flying rock chunks debris
          for (let sp = 0; sp < 16; sp++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 3.8;
            rockShatters.push({
              x: r.x + r.width / 2,
              y: r.y + r.height / 2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 0.5,
              radius: 1.8 + Math.random() * 3.2,
              life: 1.0,
              decay: 0.03 + Math.random() * 0.03,
              color: Math.random() < 0.5 ? '#2d251e' : (Math.random() < 0.5 ? '#4a3d32' : '#8c7865')
            });
          }

          // Small rising underwater dust cloud
          for (let sm = 0; sm < 4; sm++) {
            explosions.push({
              type: 'smoke',
              x: r.x + r.width / 2 + (Math.random() - 0.5) * 10,
              y: r.y + r.height / 2,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.2 - Math.random() * 0.3,
              radius: 4 + Math.random() * 3,
              grow: 0.1,
              life: 0.8,
              decay: 0.03,
              color: 'rgba(120, 110, 100, 0.5)'
            });
          }

          // Remove destroyed rock from playfield (0 points awarded)
          rocks.splice(rIdx, 1);
        }

        cannonballs.splice(i, 1);
        cbHit = true;
        break;
      }
    }

    if (cbHit) continue;

    // Check collision with Palm Trees on Islands (Snaps palm tree)
    for (let islIdx = 0; islIdx < islands.length; islIdx++) {
      const isl = islands[islIdx];
      if (!isl.isBroken) {
        const palmBox = {
          x: isl.x + isl.width / 2 - 20,
          y: isl.y + isl.height / 2 - 42,
          width: 40,
          height: 48
        };
        if (checkPointInAABB(cb.x, cb.y, palmBox)) {
          isl.isBroken = true;
          playSeaSFX('palmBreak');
          // Spawn wood splinters and leaf particles
          for (let sp = 0; sp < 10; sp++) {
            rockShatters.push({
              x: cb.x,
              y: cb.y,
              vx: (Math.random() - 0.5) * 3.5,
              vy: (Math.random() - 0.5) * 3.5,
              radius: 1.5 + Math.random() * 2.2,
              life: 0.9,
              decay: 0.04,
              color: Math.random() < 0.6 ? '#5a3d1e' : '#2e7d32'
            });
          }
          cannonballs.splice(i, 1);
          cbHit = true;
          break;
        }
      }
    }

    if (cbHit) continue;

    // Check collision with Wooden Barrels (Barrels EXPLODE when shot)
    for (let bIdx = barrels.length - 1; bIdx >= 0; bIdx--) {
      const b = barrels[bIdx];
      if (checkPointInAABB(cb.x, cb.y, b)) {
        createExplosion(b.x + b.width / 2, b.y + b.height / 2);
        playSeaSFX('barrelExplosion');
        cannonballs.splice(i, 1);
        barrels.splice(bIdx, 1);
        cbHit = true;
        break;
      }
    }

    if (cbHit) continue;

    // Check collision with Seagulls (Knock seagull out of the sky)
    for (let gIdx = seagulls.length - 1; gIdx >= 0; gIdx--) {
      const g = seagulls[gIdx];
      const gBox = { x: g.x - g.size, y: g.y - g.size, width: g.size * 2, height: g.size * 2 };
      if (checkPointInAABB(cb.x, cb.y, gBox)) {
        playSeaSFX('seagullCry');
        // Convert seagull to falling seagull
        fallingSeagulls.push({
          x: g.x,
          y: g.y,
          vx: g.vx * 0.4,
          vy: -1.5, // Initial small upward pop from impact
          gravity: 0.22,
          rotation: 0,
          vRot: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.1),
          size: g.size,
          waterTargetY: g.y + 40 + Math.random() * 60 // Water splash level relative to fall
        });

        // Small puff of feathers / sparks on impact
        for (let fp = 0; fp < 5; fp++) {
          rockShatters.push({
            x: g.x,
            y: g.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 1.2 + Math.random() * 1.5,
            life: 0.8,
            decay: 0.05,
            color: '#ffffff'
          });
        }

        cannonballs.splice(i, 1);
        seagulls.splice(gIdx, 1);
        cbHit = true;
        break;
      }
    }

    if (cbHit) continue;

    // Check collision with Enemy Ships (Normal: 1 hit, Armored: 3 hits, Artillery: 1 hit)
    for (let eIdx = enemyShips.length - 1; eIdx >= 0; eIdx--) {
      const e = enemyShips[eIdx];
      if (checkPointInAABB(cb.x, cb.y, e)) {
        e.hp -= 1;
        cannonballs.splice(i, 1);
        cbHit = true;

        if (e.hp <= 0) {
          const destroyX = e.x + e.width / 2;
          const destroyY = e.y + e.height / 2;
          const pointsAwarded = (e.variant === 'armored') ? 2 : 1;

          // Heavier explosion effect for Armored Warships
          if (e.variant === 'armored') {
            createExplosion(destroyX, destroyY);
            createExplosion(destroyX + 10, destroyY - 10);
            createExplosion(destroyX - 10, destroyY + 10);
          } else {
            createExplosion(destroyX, destroyY);
          }

          // Spawn floating score popup feedback
          scorePopups.push({
            x: destroyX,
            y: destroyY - 8,
            vy: -1.2,
            life: 1.0,
            decay: 0.025,
            text: '+' + pointsAwarded
          });

          enemyShips.splice(eIdx, 1);
          seaScore += pointsAwarded;
          updateSeaHUD();
        } else {
          // Armored ship hit effect (sparks + armor hit sound)
          for (let sp = 0; sp < 6; sp++) {
            rockShatters.push({
              x: cb.x,
              y: cb.y,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              radius: 1.5 + Math.random() * 2,
              life: 0.7,
              decay: 0.05,
              color: '#d4af37'
            });
          }
        }
        break;
      }
    }

    if (!cbHit && cb.y < -10) {
      cannonballs.splice(i, 1);
    }
  }

  // 4. Update Rocks, Barrels & Islands Collision with Player
  for (let i = rocks.length - 1; i >= 0; i--) {
    const r = rocks[i];
    r.y += r.speed;

    // Player collision with rock costs 1 life
    if (playerShip.invulnerableTimer === 0 && checkAABBCollision(playerShip, r)) {
      seaLives--;
      updateSeaHUD();
      playerShip.invulnerableTimer = 60; // ~1s invulnerability flash
      playSeaSFX('playerHit');
      createExplosion(playerShip.x + playerShip.width / 2, playerShip.y + playerShip.height / 2);

      if (seaLives <= 0) {
        triggerSeaGameOver("Your ship was destroyed by the jagged rocks!");
        return;
      }
    }

    if (r.y > seaCanvas.height + 30) {
      rocks.splice(i, 1);
    }
  }

  // Barrels Collision (Obstacles costing 1 life)
  for (let i = barrels.length - 1; i >= 0; i--) {
    const b = barrels[i];
    if (playerShip.invulnerableTimer === 0 && checkAABBCollision(playerShip, b)) {
      seaLives--;
      updateSeaHUD();
      playerShip.invulnerableTimer = 60;
      createExplosion(b.x + b.width / 2, b.y + b.height / 2);
      barrels.splice(i, 1);

      if (seaLives <= 0) {
        triggerSeaGameOver("Collided with floating explosive wreckage!");
        return;
      }
      continue;
    }
  }

  // Islands Collision (Obstacles costing 1 life)
  for (let i = islands.length - 1; i >= 0; i--) {
    const isl = islands[i];
    if (playerShip.invulnerableTimer === 0 && checkAABBCollision(playerShip, isl)) {
      seaLives--;
      updateSeaHUD();
      playerShip.invulnerableTimer = 60;
      createExplosion(playerShip.x + playerShip.width / 2, playerShip.y + playerShip.height / 2);

      if (seaLives <= 0) {
        triggerSeaGameOver("Ran aground on a tropical island!");
        return;
      }
    }
  }

  // 5. Update Enemy Ships, Artillery Mortar Firing & Escaped Ship Penalty
  for (let i = enemyShips.length - 1; i >= 0; i--) {
    const e = enemyShips[i];
    e.y += e.speed;

    // Artillery Ship Mortar Firing Logic (Fires slow, readable red-hot mortar projectiles at player)
    if (e.variant === 'artillery') {
      e.fireTimer = (e.fireTimer || 0) + 1;
      if (e.fireTimer >= 140 && e.y > 0 && e.y < seaCanvas.height - 100) {
        e.fireTimer = 0;
        const ex = e.x + e.width / 2;
        const ey = e.y + e.height;
        const px = playerShip.x + playerShip.width / 2;
        const py = playerShip.y + playerShip.height / 2;

        const dx = px - ex;
        const dy = py - ey;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const projSpeed = 3.2; // Slow, easily readable and dodgeable mortar ball

        enemyProjectiles.push({
          x: ex,
          y: ey,
          vx: (dx / dist) * projSpeed,
          vy: (dy / dist) * projSpeed,
          radius: 4.5
        });
      }
    }

    // Check if enemy ship completely leaves the bottom edge of playable sea canvas -> Lose 1 Life
    if (e.y >= seaCanvas.height) {
      seaLives--;
      updateSeaHUD();

      // 1. Subtle border pulse feedback on playfield wrapper
      const wrapper = document.getElementById('sea-battle-wrapper');
      if (wrapper) {
        wrapper.classList.remove('border-pulse');
        void wrapper.offsetWidth; // Force reflow
        wrapper.classList.add('border-pulse');
        setTimeout(() => wrapper.classList.remove('border-pulse'), 400);
      }

      // 2. Lost heart flicker feedback in HUD
      const livesSpan = document.getElementById('sea-lives');
      if (livesSpan) {
        livesSpan.classList.remove('heart-flicker');
        void livesSpan.offsetWidth; // Force reflow
        livesSpan.classList.add('heart-flicker');
        setTimeout(() => livesSpan.classList.remove('heart-flicker'), 400);
      }

      // 3. Small "SHIP MISSED" indicator near bottom of game area fading out smoothly
      scorePopups.push({
        x: Math.max(70, Math.min(seaCanvas.width - 70, e.x + e.width / 2)),
        y: seaCanvas.height - 30,
        vy: -0.8,
        life: 1.0,
        decay: 0.025,
        text: 'SHIP MISSED',
        color: '#f87171'
      });

      enemyShips.splice(i, 1);

      if (seaLives <= 0) {
        triggerSeaGameOver("An enemy ship breached your defenses!");
        return;
      }
      continue;
    }

    // Check direct collision with player (Side Ramming vs Head-on Damage)
    if (checkAABBCollision(playerShip, e)) {
      const pCenter = playerShip.x + playerShip.width / 2;
      const eCenter = e.x + e.width / 2;

      // Calculate horizontal overlap and vertical overlap between Black Pearl and Enemy Ship
      const overlapX = Math.min(playerShip.x + playerShip.width, e.x + e.width) - Math.max(playerShip.x, e.x);
      const overlapY = Math.min(playerShip.y + playerShip.height, e.y + e.height) - Math.max(playerShip.y, e.y);

      // Require a substantial predominantly side-to-side collision (significant lateral offset & side velocity or side overlap dominance)
      const horizontalOffset = Math.abs(pCenter - eCenter);
      const isSideCollision = (horizontalOffset > e.width * 0.22 || Math.abs(playerShip.vx) > 1.2) && (overlapY > overlapX * 0.5);

      if (isSideCollision) {
        // Substantial side collision -> Flip the ship!
        // Hit right side of enemy ship (pCenter > eCenter) -> flip left (-1). Hit left side -> flip right (+1)
        const flipDir = pCenter >= eCenter ? -1 : 1;

        // Trigger side-impact physical ship flip
        flippingShips.push({
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          width: e.width,
          height: e.height,
          rotation: 0,
          flipDir: flipDir,
          rollSpeed: flipDir * 0.14,
          vx: flipDir * 2.8,
          vy: -1.2,
          scale: 1.0,
          life: 1.0,
          decay: 0.035
        });

        // Spawn water splash & wood splinter debris
        createWaterSplashEffect(e.x + e.width / 2, e.y + e.height / 2);
        for (let sp = 0; sp < 8; sp++) {
          rockShatters.push({
            x: e.x + e.width / 2,
            y: e.y + e.height / 2,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            radius: 1.5 + Math.random() * 2,
            life: 0.8,
            decay: 0.04,
            color: '#3a2010'
          });
        }

        const pointsAwarded = (e.variant === 'armored') ? 2 : 1;

        // Floating Score Feedback
        scorePopups.push({
          x: e.x + e.width / 2,
          y: e.y - 10,
          vy: -1.2,
          life: 1.0,
          decay: 0.025,
          text: '+' + pointsAwarded
        });

        // Award Score
        seaScore += pointsAwarded;
        updateSeaHUD();

        // Remove enemy ship without taking damage
        enemyShips.splice(i, 1);
        continue;
      } else {
        // Mostly head-on collision -> Costs 1 Life
        if (playerShip.invulnerableTimer === 0) {
          seaLives--;
          updateSeaHUD();
          playerShip.invulnerableTimer = 60;
          createExplosion(e.x + e.width / 2, e.y + e.height / 2);
          enemyShips.splice(i, 1);

          if (seaLives <= 0) {
            triggerSeaGameOver("Collided head-on with an enemy flagship!");
            return;
          }
        }
      }
    }
  }

  // Update Enemy Mortar Projectiles & Collision with Black Pearl
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = enemyProjectiles[i];
    ep.x += ep.vx;
    ep.y += ep.vy;

    // Check collision with Player
    if (playerShip.invulnerableTimer === 0 && checkPointInAABB(ep.x, ep.y, playerShip)) {
      seaLives--;
      updateSeaHUD();
      playerShip.invulnerableTimer = 60;
      createExplosion(ep.x, ep.y);
      enemyProjectiles.splice(i, 1);

      if (seaLives <= 0) {
        triggerSeaGameOver("Hit by Royal Navy mortar artillery!");
        return;
      }
      continue;
    }

    if (ep.x < -20 || ep.x > seaCanvas.width + 20 || ep.y < -20 || ep.y > seaCanvas.height + 20) {
      enemyProjectiles.splice(i, 1);
    }
  }

  // Update Flipping Ships Animation Physics
  for (let i = flippingShips.length - 1; i >= 0; i--) {
    const fs = flippingShips[i];
    fs.x += fs.vx;
    fs.y += fs.vy;
    fs.rotation += fs.rollSpeed;
    fs.scale = Math.max(0.2, fs.scale - 0.02);
    fs.life -= fs.decay;

    if (fs.life <= 0) {
      createWaterSplashEffect(fs.x, fs.y);
      flippingShips.splice(i, 1);
    }
  }

  // 6. Update Explosions & Rock Shatter Particles
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.type === 'debris' && p.vRot) {
      p.rotation += p.vRot;
    }
    if (p.type === 'smoke' && p.grow) {
      p.radius += p.grow;
    }
    if (p.life <= 0) explosions.splice(i, 1);
  }

  for (let i = rockShatters.length - 1; i >= 0; i--) {
    const p = rockShatters[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0) rockShatters.splice(i, 1);
  }

  // Floating Score Popup Text Updates
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    const pop = scorePopups[i];
    pop.y += pop.vy;
    pop.life -= pop.decay;
    if (pop.life <= 0) scorePopups.splice(i, 1);
  }

  // 7. Render Complete Frame
  drawSeaBattleFrame();

  requestAnimationFrame(seaGameLoop);
}

function checkAABBCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

function checkPointInAABB(px, py, box) {
  return px >= box.x && px <= box.x + box.width &&
         py >= box.y && py <= box.y + box.height;
}

function triggerSeaGameOver(reasonText = "Your ship was destroyed!") {
  seaGameActive = false;

  if (seaScore > seaHighScore) {
    seaHighScore = seaScore;
    try {
      localStorage.setItem('jack_sea_battle_highscore', seaHighScore.toString());
    } catch (e) {}
  }

  const overlay = document.getElementById('sea-battle-overlay');
  const title = document.getElementById('sea-overlay-title');
  const subtitle = document.getElementById('sea-overlay-subtitle');
  const btn = document.getElementById('sea-start-btn');

  if (title) title.innerText = '💀 SHIPWRECKED!';
  if (subtitle) {
    subtitle.innerHTML = `${reasonText}<br>Final Score: <strong class="gold-text">${seaScore}</strong> | High Score: <strong class="gold-text">${seaHighScore}</strong>`;
  }
  if (btn) btn.innerText = 'RESTART BATTLE';

  if (overlay) overlay.classList.remove('hidden');

  drawSeaBattleFrame();
}

/**
 * Animated Ocean Renderer:
 * Renders multi-layered undulating sine-wave ocean currents, water ripples, foam highlights,
 * and deep Caribbean water gradients for a realistic animated sea feel.
 */
function drawOceanBackground(w, h) {
  // Deep Ocean Base Gradient
  const gradient = seaCtx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, '#061a2e');
  gradient.addColorStop(0.5, '#0a2642');
  gradient.addColorStop(1, '#041220');
  seaCtx.fillStyle = gradient;
  seaCtx.fillRect(0, 0, w, h);

  // Layer 1: Deep Slow Wave Waves (Dark Cyan Wave Mesh)
  seaCtx.strokeStyle = 'rgba(14, 85, 120, 0.25)';
  seaCtx.lineWidth = 3;
  for (let y = 15; y < h + 20; y += 28) {
    seaCtx.beginPath();
    for (let x = 0; x <= w; x += 10) {
      const waveY = y + Math.sin((x * 0.02) + oceanTime * 0.8 + (y * 0.05)) * 4;
      if (x === 0) seaCtx.moveTo(x, waveY);
      else seaCtx.lineTo(x, waveY);
    }
    seaCtx.stroke();
  }

  // Layer 2: Luminous Ocean Surface Crests & Ripples (Glinting Highlights)
  seaCtx.strokeStyle = 'rgba(80, 190, 230, 0.35)';
  seaCtx.lineWidth = 1.5;
  for (let y = 8; y < h + 20; y += 36) {
    seaCtx.beginPath();
    for (let x = 0; x <= w; x += 12) {
      const waveY = y + Math.cos((x * 0.035) - oceanTime * 1.2 + (y * 0.08)) * 3;
      if (x === 0) seaCtx.moveTo(x, waveY);
      else seaCtx.lineTo(x, waveY);
    }
    seaCtx.stroke();
  }

  // Layer 3: Foam Sparkle Highlights drifting downward with current
  seaCtx.fillStyle = 'rgba(200, 240, 255, 0.4)';
  for (let i = 0; i < 18; i++) {
    const fx = (Math.sin(i * 123 + oceanTime * 0.5) * 0.5 + 0.5) * w;
    const fy = ((i * 24 + oceanTime * 15) % (h + 20)) - 10;
    seaCtx.beginPath();
    seaCtx.arc(fx, fy, 1.2, 0, Math.PI * 2);
    seaCtx.fill();
  }
}

function drawSeaBattleFrame() {
  if (!seaCtx) return;

  const w = seaCanvas.width;
  const h = seaCanvas.height;

  // 1. Animated Ocean Sea Background
  drawOceanBackground(w, h);

  // 2. Draw Small Tropical Islands with Polished Animated Palm Trees
  islands.forEach(isl => {
    const cx = isl.x + isl.width / 2;
    const cy = isl.y + isl.height / 2;

    // Sandy Shore with Shoreline Wave Foam
    seaCtx.fillStyle = '#d9b46e';
    seaCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    seaCtx.lineWidth = 1.5;
    seaCtx.beginPath();
    seaCtx.ellipse(cx, cy, isl.width / 2, isl.height / 2, 0, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.stroke();

    // Inner Lush Tropical Island Hill/Grass Base
    const islandGrassGrad = seaCtx.createRadialGradient(cx - 2, cy - 2, 2, cx, cy, isl.width * 0.35);
    islandGrassGrad.addColorStop(0, '#43a047');
    islandGrassGrad.addColorStop(0.7, '#2e7d32');
    islandGrassGrad.addColorStop(1, '#1b5e20');
    seaCtx.fillStyle = islandGrassGrad;
    seaCtx.beginPath();
    seaCtx.ellipse(cx - 2, cy + 1, isl.width * 0.33, isl.height * 0.29, 0, 0, Math.PI * 2);
    seaCtx.fill();

    // Natural Wind Sway Motion
    const windSway = Math.sin(oceanTime * 2.2 + isl.x * 0.1) * 2.5;

    const trunkBaseX = cx - 2;
    const trunkBaseY = cy + 4;

    // Helper function to draw lush, multi-layered palm fronds
    function drawPolishedPalmCrown(topX, topY, isFallen = false) {
      // Frond Definitions with Curvature & Wind Influence
      const frondData = [
        { angle: -2.3, length: 24, curve: -0.35, width: 6.5, color: '#1b5e20', tipColor: '#4caf50' },
        { angle: -1.7, length: 27, curve: -0.2,  width: 7.0, color: '#2e7d32', tipColor: '#66bb6a' },
        { angle: -1.1, length: 28, curve: 0.1,   width: 7.2, color: '#388e3c', tipColor: '#81c784' },
        { angle: -0.4, length: 26, curve: 0.3,   width: 6.8, color: '#2e7d32', tipColor: '#66bb6a' },
        { angle: 0.2,  length: 23, curve: 0.4,   width: 6.0, color: '#1b5e20', tipColor: '#4caf50' },
        { angle: 2.6,  length: 22, curve: -0.4,  width: 5.8, color: '#1b5e20', tipColor: '#388e3c' },
        { angle: 3.0,  length: 24, curve: -0.25, width: 6.2, color: '#2e7d32', tipColor: '#4caf50' }
      ];

      frondData.forEach(fd => {
        seaCtx.save();
        seaCtx.translate(topX, topY);

        const currentAngle = fd.angle + (isFallen ? 0 : (windSway * 0.025));
        seaCtx.rotate(currentAngle);

        const tipX = fd.length;
        const tipY = fd.curve * fd.length;
        const ctrlX = fd.length * 0.5;
        const ctrlY = fd.curve * fd.length * 0.8 - (fd.width * 0.5);

        // Under-shadow leaf blade
        seaCtx.fillStyle = 'rgba(10, 35, 12, 0.4)';
        seaCtx.beginPath();
        seaCtx.moveTo(0, 0);
        seaCtx.quadraticCurveTo(ctrlX, ctrlY + 2, tipX, tipY);
        seaCtx.quadraticCurveTo(ctrlX, ctrlY + fd.width + 1, 0, 0);
        seaCtx.fill();

        // Main Leaf Body Gradient
        const frondGrad = seaCtx.createLinearGradient(0, 0, tipX, tipY);
        frondGrad.addColorStop(0, fd.color);
        frondGrad.addColorStop(0.7, fd.color);
        frondGrad.addColorStop(1, fd.tipColor);

        seaCtx.fillStyle = frondGrad;
        seaCtx.beginPath();
        seaCtx.moveTo(0, 0);
        seaCtx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
        seaCtx.quadraticCurveTo(ctrlX, ctrlY + fd.width, 0, 0);
        seaCtx.fill();

        // Central Spine Highlight Line
        seaCtx.strokeStyle = '#a5d6a7';
        seaCtx.lineWidth = 1.0;
        seaCtx.beginPath();
        seaCtx.moveTo(0, 0);
        seaCtx.quadraticCurveTo(ctrlX, ctrlY + fd.width * 0.4, tipX, tipY);
        seaCtx.stroke();

        seaCtx.restore();
      });

      // Cluster of 3D Coconuts at Crown Core
      const coconuts = [
        { dx: -3, dy: 2, r: 3.2 },
        { dx: 3,  dy: 3, r: 2.8 },
        { dx: 0,  dy: 5, r: 2.6 }
      ];

      coconuts.forEach(c => {
        const cocoGrad = seaCtx.createRadialGradient(
          topX + c.dx - 1, topY + c.dy - 1, 0.5,
          topX + c.dx, topY + c.dy, c.r
        );
        cocoGrad.addColorStop(0, '#8d6e63');
        cocoGrad.addColorStop(0.5, '#4e342e');
        cocoGrad.addColorStop(1, '#261208');

        seaCtx.fillStyle = cocoGrad;
        seaCtx.beginPath();
        seaCtx.arc(topX + c.dx, topY + c.dy, c.r, 0, Math.PI * 2);
        seaCtx.fill();
      });
    }

    if (isl.isBroken) {
      // 1. Splintered Stump Base
      const stumpGrad = seaCtx.createLinearGradient(trunkBaseX - 6, trunkBaseY, trunkBaseX + 2, cy - 4);
      stumpGrad.addColorStop(0, '#3e2723');
      stumpGrad.addColorStop(0.5, '#5d4037');
      stumpGrad.addColorStop(1, '#8d6e63');

      seaCtx.fillStyle = stumpGrad;
      seaCtx.beginPath();
      seaCtx.moveTo(trunkBaseX - 4, trunkBaseY);
      seaCtx.lineTo(trunkBaseX + 3, trunkBaseY);
      seaCtx.lineTo(trunkBaseX + 1, cy - 3);
      seaCtx.lineTo(trunkBaseX - 5, cy - 3);
      seaCtx.closePath();
      seaCtx.fill();

      // Jagged Wooden Splinters Tip
      seaCtx.fillStyle = '#d7ccc8';
      seaCtx.beginPath();
      seaCtx.moveTo(trunkBaseX - 5, cy - 3);
      seaCtx.lineTo(trunkBaseX - 3, cy - 8);
      seaCtx.lineTo(trunkBaseX - 1, cy - 3);
      seaCtx.lineTo(trunkBaseX + 1, cy - 7);
      seaCtx.lineTo(trunkBaseX + 2, cy - 3);
      seaCtx.fill();

      // 2. Fallen Palm Tree (Rotated on island)
      seaCtx.save();
      seaCtx.translate(trunkBaseX - 3, cy - 4);
      seaCtx.rotate(isl.breakDir * (isl.breakAngle || 1.2));

      const topX = 0;
      const topY = -22;

      // Fallen Curved Trunk
      seaCtx.strokeStyle = '#4e342e';
      seaCtx.lineWidth = 5.0;
      seaCtx.lineCap = 'round';
      seaCtx.beginPath();
      seaCtx.moveTo(0, 0);
      seaCtx.lineTo(topX, topY);
      seaCtx.stroke();

      drawPolishedPalmCrown(topX, topY, true);

      seaCtx.restore();

    } else {
      // Natural Curved Trunk with Tapering & Bark Ring Overlays
      const topX = cx - 9 + windSway * 0.6;
      const topY = cy - 26;
      const ctrlX = cx - 16;
      const ctrlY = cy - 10;

      // Outer Smooth Trunk Shadow/Outline
      seaCtx.strokeStyle = '#261208';
      seaCtx.lineWidth = 6.2;
      seaCtx.lineCap = 'round';
      seaCtx.beginPath();
      seaCtx.moveTo(trunkBaseX, trunkBaseY);
      seaCtx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
      seaCtx.stroke();

      // Core Warm Wooden Trunk Gradient Line
      seaCtx.strokeStyle = '#6d4c41';
      seaCtx.lineWidth = 4.6;
      seaCtx.beginPath();
      seaCtx.moveTo(trunkBaseX, trunkBaseY);
      seaCtx.quadraticCurveTo(ctrlX, ctrlY, topX, topY);
      seaCtx.stroke();

      // Textured Bark Segment Rings
      seaCtx.strokeStyle = '#3e2723';
      seaCtx.lineWidth = 1.8;
      const ringSteps = 5;
      for (let r = 1; r < ringSteps; r++) {
        const t = r / ringSteps;
        const rx = (1 - t) * (1 - t) * trunkBaseX + 2 * (1 - t) * t * ctrlX + t * t * topX;
        const ry = (1 - t) * (1 - t) * trunkBaseY + 2 * (1 - t) * t * ctrlY + t * t * topY;
        seaCtx.beginPath();
        seaCtx.moveTo(rx - 2.5, ry - 1);
        seaCtx.lineTo(rx + 2.5, ry + 1);
        seaCtx.stroke();
      }

      // Draw Polished Lush Animated Frond Crown
      drawPolishedPalmCrown(topX, topY, false);
    }
  });

  // 3. Draw Decorative Floating Barrels
  barrels.forEach(b => {
    seaCtx.save();
    seaCtx.translate(b.x + b.width / 2, b.y + b.height / 2);
    seaCtx.rotate(b.rotation);

    // Wooden Barrel Body
    seaCtx.fillStyle = '#8b5a2b';
    seaCtx.strokeStyle = '#4a2c11';
    seaCtx.lineWidth = 1;
    seaCtx.beginPath();
    seaCtx.ellipse(0, 0, b.width / 2, b.height / 2, 0, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.stroke();

    // Iron Hoops
    seaCtx.strokeStyle = '#2b231d';
    seaCtx.lineWidth = 1.5;
    seaCtx.beginPath();
    seaCtx.moveTo(-b.width * 0.4, -b.height * 0.25);
    seaCtx.lineTo(b.width * 0.4, -b.height * 0.25);
    seaCtx.moveTo(-b.width * 0.4, b.height * 0.25);
    seaCtx.lineTo(b.width * 0.4, b.height * 0.25);
    seaCtx.stroke();

    seaCtx.restore();
  });

  // 4. Draw Scattered Individual Rock Boulders with Visible Crack Damage States
  rocks.forEach(r => {
    seaCtx.fillStyle = '#2d251e';
    seaCtx.strokeStyle = '#18120d';
    seaCtx.lineWidth = 2;

    // Polygon Jagged Boulder Shape
    seaCtx.beginPath();
    seaCtx.moveTo(r.x + r.width * 0.2, r.y);
    seaCtx.lineTo(r.x + r.width * 0.85, r.y + r.height * 0.15);
    seaCtx.lineTo(r.x + r.width, r.y + r.height * 0.65);
    seaCtx.lineTo(r.x + r.width * 0.75, r.y + r.height);
    seaCtx.lineTo(r.x + r.width * 0.15, r.y + r.height * 0.85);
    seaCtx.lineTo(r.x, r.y + r.height * 0.35);
    seaCtx.closePath();
    seaCtx.fill();
    seaCtx.stroke();

    // Boulder Highlights
    seaCtx.fillStyle = '#4a3d32';
    seaCtx.beginPath();
    seaCtx.arc(r.x + r.width * 0.4, r.y + r.height * 0.4, Math.max(2.5, r.width * 0.2), 0, Math.PI * 2);
    seaCtx.fill();

    // Crack overlays on Hit 1 (Fine dark fracture lines + stone edge highlight)
    if (r.hits >= 1) {
      seaCtx.strokeStyle = '#0d0906';
      seaCtx.lineWidth = 1.8;
      seaCtx.beginPath();
      // Main crack line
      seaCtx.moveTo(r.x + r.width * 0.3, r.y + r.height * 0.2);
      seaCtx.lineTo(r.x + r.width * 0.5, r.y + r.height * 0.5);
      seaCtx.lineTo(r.x + r.width * 0.45, r.y + r.height * 0.8);
      // Side branch
      seaCtx.moveTo(r.x + r.width * 0.5, r.y + r.height * 0.5);
      seaCtx.lineTo(r.x + r.width * 0.75, r.y + r.height * 0.45);
      seaCtx.stroke();

      // Highlight line alongside crack
      seaCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      seaCtx.lineWidth = 1.0;
      seaCtx.beginPath();
      seaCtx.moveTo(r.x + r.width * 0.32, r.y + r.height * 0.2);
      seaCtx.lineTo(r.x + r.width * 0.52, r.y + r.height * 0.5);
      seaCtx.stroke();
    }

    // Water Foam Base
    seaCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    seaCtx.lineWidth = 1.5;
    seaCtx.strokeRect(r.x - 2, r.y + r.height - 2, r.width + 4, 3);
  });

  // 3. Draw Enemy Ships (Royal Navy Warship Variants: Normal, Armored, Artillery)
  enemyShips.forEach(e => {
    if (e.variant === 'armored') {
      // Heavy Armored Warship (Larger, Dark Ironclad Plating, Gold Trim & Double Gunports)
      seaCtx.fillStyle = '#020617';
      seaCtx.strokeStyle = '#eab308';
      seaCtx.lineWidth = 2.0;

      seaCtx.beginPath();
      seaCtx.moveTo(e.x + e.width / 2, e.y + e.height);
      seaCtx.lineTo(e.x + e.width, e.y + e.height * 0.25);
      seaCtx.lineTo(e.x + e.width * 0.82, e.y);
      seaCtx.lineTo(e.x + e.width * 0.18, e.y);
      seaCtx.lineTo(e.x, e.y + e.height * 0.25);
      seaCtx.closePath();
      seaCtx.fill();
      seaCtx.stroke();

      // Iron Armor Banding
      seaCtx.fillStyle = '#475569';
      seaCtx.fillRect(e.x + 3, e.y + e.height * 0.45, e.width - 6, 4);
      seaCtx.fillRect(e.x + 3, e.y + e.height * 0.65, e.width - 6, 4);

      // White Sails with Red Royal Emblem Stripe
      seaCtx.fillStyle = '#f1f5f9';
      seaCtx.fillRect(e.x + 4, e.y + e.height * 0.18, e.width - 8, e.height * 0.25);
      seaCtx.fillStyle = '#dc2626';
      seaCtx.fillRect(e.x + e.width / 2 - 2, e.y + e.height * 0.18, 4, e.height * 0.25);

      // Flag
      seaCtx.fillStyle = '#ffffff';
      seaCtx.fillRect(e.x + e.width / 2 + 1, e.y + 2, 11, 7);
      seaCtx.fillStyle = '#dc2626';
      seaCtx.fillRect(e.x + e.width / 2 + 5, e.y + 2, 3, 7);
      seaCtx.fillRect(e.x + e.width / 2 + 1, e.y + 4, 11, 3);

    } else if (e.variant === 'artillery') {
      // Light Artillery Mortar Galley (Smaller, Dark Blue Hull, Brass Mortar Cannon, Gold Pennant)
      seaCtx.fillStyle = '#1e293b';
      seaCtx.strokeStyle = '#38bdf8';
      seaCtx.lineWidth = 1.5;

      seaCtx.beginPath();
      seaCtx.moveTo(e.x + e.width / 2, e.y + e.height);
      seaCtx.lineTo(e.x + e.width, e.y + e.height * 0.3);
      seaCtx.lineTo(e.x + e.width * 0.75, e.y);
      seaCtx.lineTo(e.x + e.width * 0.25, e.y);
      seaCtx.lineTo(e.x, e.y + e.height * 0.3);
      seaCtx.closePath();
      seaCtx.fill();
      seaCtx.stroke();

      // Brass Mortar Cannon at Bow
      seaCtx.fillStyle = '#d4af37';
      seaCtx.beginPath();
      seaCtx.arc(e.x + e.width / 2, e.y + e.height * 0.7, 4.5, 0, Math.PI * 2);
      seaCtx.fill();

      // Sails
      seaCtx.fillStyle = '#f8fafc';
      seaCtx.fillRect(e.x + 3, e.y + e.height * 0.2, e.width - 6, e.height * 0.28);

      // Gold Triangular Pennant
      seaCtx.fillStyle = '#eab308';
      seaCtx.beginPath();
      seaCtx.moveTo(e.x + e.width / 2, e.y + 2);
      seaCtx.lineTo(e.x + e.width / 2 + 10, e.y + 5);
      seaCtx.lineTo(e.x + e.width / 2, e.y + 8);
      seaCtx.closePath();
      seaCtx.fill();

    } else {
      // Standard Royal Navy Warship
      seaCtx.fillStyle = '#0f172a';
      seaCtx.strokeStyle = '#d4af37';
      seaCtx.lineWidth = 1.5;

      seaCtx.beginPath();
      seaCtx.moveTo(e.x + e.width / 2, e.y + e.height);
      seaCtx.lineTo(e.x + e.width, e.y + e.height * 0.3);
      seaCtx.lineTo(e.x + e.width * 0.8, e.y);
      seaCtx.lineTo(e.x + e.width * 0.2, e.y);
      seaCtx.lineTo(e.x, e.y + e.height * 0.3);
      seaCtx.closePath();
      seaCtx.fill();
      seaCtx.stroke();

      // Golden Navy Stripe
      seaCtx.fillStyle = '#f59e0b';
      seaCtx.fillRect(e.x + 2, e.y + e.height * 0.55, e.width - 4, 3);

      // Gunports
      seaCtx.fillStyle = '#020617';
      for (let gp = 0; gp < 3; gp++) {
        seaCtx.fillRect(e.x + 4 + gp * 10, e.y + e.height * 0.62, 4, 3);
      }

      // White Canvas Sails
      seaCtx.fillStyle = '#f8fafc';
      seaCtx.strokeStyle = '#64748b';
      seaCtx.lineWidth = 1;
      seaCtx.fillRect(e.x + 3, e.y + e.height * 0.22, e.width - 6, e.height * 0.32);
      seaCtx.strokeRect(e.x + 3, e.y + e.height * 0.22, e.width - 6, e.height * 0.32);

      // Flag
      seaCtx.fillStyle = '#ffffff';
      seaCtx.fillRect(e.x + e.width / 2 + 1, e.y + 2, 10, 6);
      seaCtx.fillStyle = '#1e3a8a';
      seaCtx.fillRect(e.x + e.width / 2 + 1, e.y + 2, 4, 3);
      seaCtx.fillStyle = '#dc2626';
      seaCtx.fillRect(e.x + e.width / 2 + 5, e.y + 2, 2, 6);
      seaCtx.fillRect(e.x + e.width / 2 + 1, e.y + 4, 10, 2);
    }
  });

  // Draw Royal Navy Mortar Cannonball Projectiles
  enemyProjectiles.forEach(ep => {
    seaCtx.save();
    seaCtx.fillStyle = '#ef4444';
    seaCtx.shadowColor = '#f59e0b';
    seaCtx.shadowBlur = 8;
    seaCtx.beginPath();
    seaCtx.arc(ep.x, ep.y, ep.radius, 0, Math.PI * 2);
    seaCtx.fill();

    // Hot glowing core
    seaCtx.fillStyle = '#fef08a';
    seaCtx.beginPath();
    seaCtx.arc(ep.x - 1, ep.y - 1, ep.radius * 0.4, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.restore();
  });

  // Draw Flipping Enemy Ships (Royal Navy Capsizing Hull Animation)
  flippingShips.forEach(fs => {
    seaCtx.save();
    seaCtx.globalAlpha = Math.max(0, fs.life);
    seaCtx.translate(fs.x, fs.y);
    seaCtx.rotate(fs.rotation);
    seaCtx.scale(fs.scale, fs.scale * Math.cos(fs.rotation * 0.8));

    // Capsized Royal Navy Hull
    seaCtx.fillStyle = '#020617';
    seaCtx.strokeStyle = '#f59e0b';
    seaCtx.lineWidth = 1.5;

    seaCtx.beginPath();
    seaCtx.moveTo(0, fs.height / 2);
    seaCtx.lineTo(fs.width / 2, -fs.height * 0.2);
    seaCtx.lineTo(fs.width * 0.3, -fs.height / 2);
    seaCtx.lineTo(-fs.width * 0.3, -fs.height / 2);
    seaCtx.lineTo(-fs.width / 2, -fs.height * 0.2);
    seaCtx.closePath();
    seaCtx.fill();
    seaCtx.stroke();

    // Water Splash Ring around capsizing ship
    seaCtx.strokeStyle = 'rgba(180, 235, 255, 0.6)';
    seaCtx.lineWidth = 1.2;
    seaCtx.beginPath();
    seaCtx.ellipse(0, fs.height * 0.2, fs.width * 0.8, fs.height * 0.3, 0, 0, Math.PI * 2);
    seaCtx.stroke();

    seaCtx.restore();
  });

  // 4. Draw Cast-Iron Spherical Cannonballs
  cannonballs.forEach(cb => {
    // 3D Metallic Cast-Iron Radial Gradient
    const grad = seaCtx.createRadialGradient(
      cb.x - cb.radius * 0.35, cb.y - cb.radius * 0.35, cb.radius * 0.1,
      cb.x, cb.y, cb.radius
    );
    grad.addColorStop(0, '#a0a7ad');    // Specular highlight spot
    grad.addColorStop(0.35, '#4a5157'); // Metallic iron body
    grad.addColorStop(0.8, '#1e2225');  // Dark cast iron
    grad.addColorStop(1, '#0c0e10');    // Edge shadow

    // Faint atmospheric trail shadow
    seaCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    seaCtx.beginPath();
    seaCtx.ellipse(cb.x, cb.y + cb.radius * 0.5, cb.radius * 0.8, cb.radius * 0.4, 0, 0, Math.PI * 2);
    seaCtx.fill();

    // Main Spherical Iron Cannonball
    seaCtx.fillStyle = grad;
    seaCtx.strokeStyle = '#080a0b';
    seaCtx.lineWidth = 1;
    seaCtx.beginPath();
    seaCtx.arc(cb.x, cb.y, cb.radius, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.stroke();

    // Bright Specular Reflection Glint
    seaCtx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    seaCtx.beginPath();
    seaCtx.arc(cb.x - cb.radius * 0.35, cb.y - cb.radius * 0.35, cb.radius * 0.2, 0, Math.PI * 2);
    seaCtx.fill();
  });

  // 5. Draw Black Pearl Player Ship
  if (!seaGameActive || playerShip.invulnerableTimer % 6 < 3) {
    const p = playerShip;

    // Ship Hull
    seaCtx.fillStyle = '#1c1917';
    seaCtx.strokeStyle = '#d4af37';
    seaCtx.lineWidth = 1.5;

    seaCtx.beginPath();
    seaCtx.moveTo(p.x + p.width / 2, p.y); // Bow
    seaCtx.lineTo(p.x + p.width, p.y + p.height * 0.7);
    seaCtx.lineTo(p.x + p.width * 0.8, p.y + p.height);
    seaCtx.lineTo(p.x + p.width * 0.2, p.y + p.height);
    seaCtx.lineTo(p.x, p.y + p.height * 0.7);
    seaCtx.closePath();
    seaCtx.fill();
    seaCtx.stroke();

    // Black Sails
    seaCtx.fillStyle = '#09090b';
    seaCtx.strokeStyle = '#44403c';
    seaCtx.lineWidth = 1;

    seaCtx.fillRect(p.x + 3, p.y + p.height * 0.25, p.width - 6, p.height * 0.35);
    seaCtx.strokeRect(p.x + 3, p.y + p.height * 0.25, p.width - 6, p.height * 0.35);

    // Skull/Crossbones emblem
    seaCtx.fillStyle = '#d4af37';
    seaCtx.font = '13px sans-serif';
    seaCtx.textAlign = 'center';
    seaCtx.fillText('☠️', p.x + p.width / 2, p.y + p.height * 0.5);

    // Bowsprit
    seaCtx.fillStyle = '#d4af37';
    seaCtx.fillRect(p.x + p.width / 2 - 1, p.y - 8, 2, 10);
  }

  // 6. Draw Explosions & Impact Effects
  explosions.forEach(exp => {
    seaCtx.globalAlpha = Math.max(0, exp.life);
    if (exp.type === 'debris') {
      seaCtx.save();
      seaCtx.translate(exp.x, exp.y);
      seaCtx.rotate(exp.rotation);
      seaCtx.fillStyle = exp.color;
      seaCtx.fillRect(-exp.w / 2, -exp.h / 2, exp.w, exp.h);
      seaCtx.restore();
    } else {
      seaCtx.fillStyle = exp.color;
      seaCtx.beginPath();
      seaCtx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
      seaCtx.fill();
    }
    seaCtx.globalAlpha = 1.0;
  });

  // 11. Draw Floating Score Popup Text (+1 or SHIP MISSED)
  scorePopups.forEach(pop => {
    seaCtx.save();
    seaCtx.globalAlpha = Math.max(0, pop.life);
    seaCtx.fillStyle = pop.color || '#f59e0b';
    seaCtx.shadowColor = '#000000';
    seaCtx.shadowBlur = 4;
    seaCtx.font = 'bold 15px "Trebuchet MS", Arial, sans-serif';
    seaCtx.textAlign = 'center';
    seaCtx.fillText(pop.text, pop.x, pop.y);
    seaCtx.restore();
  });

  // 7. Draw Rock Shatter Particles
  rockShatters.forEach(sp => {
    seaCtx.fillStyle = sp.color;
    seaCtx.globalAlpha = Math.max(0, sp.life);
    seaCtx.beginPath();
    seaCtx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.globalAlpha = 1.0;
  });

  // 8. Draw Decorative Flying Seagulls
  seagulls.forEach(g => {
    seaCtx.strokeStyle = '#ffffff';
    seaCtx.lineWidth = 1.8;
    seaCtx.beginPath();

    const wingFlap = Math.sin(oceanTime * 8) * 4;
    seaCtx.moveTo(g.x - g.size, g.y + wingFlap);
    seaCtx.quadraticCurveTo(g.x - g.size / 2, g.y - g.size / 2, g.x, g.y);
    seaCtx.quadraticCurveTo(g.x + g.size / 2, g.y - g.size / 2, g.x + g.size, g.y + wingFlap);
    seaCtx.stroke();
  });

  // 9. Draw Falling Seagulls
  fallingSeagulls.forEach(fg => {
    seaCtx.save();
    seaCtx.translate(fg.x, fg.y);
    seaCtx.rotate(fg.rotation);
    seaCtx.strokeStyle = '#e0e0e0';
    seaCtx.lineWidth = 1.8;
    seaCtx.beginPath();
    seaCtx.moveTo(-fg.size * 0.8, -fg.size * 0.4);
    seaCtx.lineTo(0, 0);
    seaCtx.lineTo(fg.size * 0.8, -fg.size * 0.4);
    seaCtx.stroke();
    seaCtx.restore();
  });

  // Draw Dash Water/Wake Foam Trails
  dashWakes.forEach(dw => {
    seaCtx.save();
    seaCtx.globalAlpha = Math.max(0, dw.life);
    seaCtx.fillStyle = 'rgba(224, 247, 250, 0.75)';
    seaCtx.beginPath();
    seaCtx.ellipse(dw.x, dw.y, dw.radius * 1.4, dw.radius * 0.7, 0, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.restore();
  });

  // 10. Draw Water Splash Effects
  splashEffects.forEach(s => {
    seaCtx.globalAlpha = Math.max(0, s.life);
    if (s.maxRadius) {
      // Ring ripple
      seaCtx.strokeStyle = s.color;
      seaCtx.lineWidth = 1.5;
      seaCtx.beginPath();
      seaCtx.ellipse(s.x, s.y, s.radius, s.radius * 0.4, 0, 0, Math.PI * 2);
      seaCtx.stroke();
    } else {
      // Water droplet
      seaCtx.fillStyle = s.color;
      seaCtx.beginPath();
      seaCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      seaCtx.fill();
    }
    seaCtx.globalAlpha = 1.0;
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
  const DENSITY_PER_VIEWPORT = 190; // 190 particles per 800px viewport height (original subtle density)

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
    // Canvas is fixed to the viewport window height so particles float seamlessly across full screen regardless of scrolling
    width = window.innerWidth || document.documentElement.clientWidth || 0;
    height = window.innerHeight || document.documentElement.clientHeight || 0;

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
  initSeaBattle();
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
