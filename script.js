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
  width: 32,
  height: 48,
  speed: 4.8,
  invulnerableTimer: 0
};

let keyState = {
  left: false,
  right: false,
  space: false
};

let cannonballs = [];
let enemyShips = [];
let rocks = [];
let barrels = [];
let islands = [];
let seagulls = [];
let explosions = [];
let rockShatters = [];

// Animated Wave / Sea Mesh State
let oceanTime = 0;

let lastCannonTime = 0;
let cannonCooldown = 260; // ms between shots

let spawnTimerRocks = 0;
let spawnTimerEnemies = 0;
let spawnTimerBarrels = 0;
let spawnTimerIslands = 0;
let spawnTimerSeagulls = 0;

function initSeaBattle() {
  seaCanvas = document.getElementById('sea-battle-canvas');
  if (!seaCanvas) return;
  seaCtx = seaCanvas.getContext('2d');

  // Load high score from localStorage if available
  try {
    const saved = localStorage.getItem('jack_sea_battle_highscore');
    if (saved) seaHighScore = parseInt(saved, 10) || 0;
  } catch (e) {}

  // Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      keyState.left = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      keyState.right = true;
      if (seaGameActive) e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      keyState.space = true;
      if (seaGameActive) e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keyState.left = false;
    else if (e.key === 'ArrowRight') keyState.right = false;
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
  playerShip.y = seaCanvas.height - 65;
  playerShip.invulnerableTimer = 0;

  cannonballs = [];
  enemyShips = [];
  rocks = [];
  barrels = [];
  islands = [];
  seagulls = [];
  explosions = [];
  rockShatters = [];

  spawnTimerRocks = 0;
  spawnTimerEnemies = 0;
  spawnTimerBarrels = 0;
  spawnTimerIslands = 0;
  spawnTimerSeagulls = 0;

  updateSeaHUD();

  const overlay = document.getElementById('sea-battle-overlay');
  if (overlay) overlay.classList.add('hidden');

  requestAnimationFrame(seaGameLoop);
}

function updateSeaHUD() {
  const scoreSpan = document.getElementById('sea-score');
  const livesSpan = document.getElementById('sea-lives');

  if (scoreSpan) scoreSpan.innerText = seaScore;
  if (livesSpan) {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += (i < seaLives) ? '❤️ ' : '🖤 ';
    }
    livesSpan.innerText = hearts.trim();
  }
}

function fireCannonball() {
  const now = Date.now();
  if (now - lastCannonTime < cannonCooldown) return;
  lastCannonTime = now;

  // Fire cannonball from center bow of Black Pearl
  cannonballs.push({
    x: playerShip.x + playerShip.width / 2,
    y: playerShip.y,
    radius: 4,
    speed: 7.5
  });
}

/**
 * Scattered Rocks Generator:
 * Spawns individual rocks scattered irregularly across the open sea with varied sizes,
 * positions, and occasional small clusters, leaving wide open water for clear navigation.
 */
function spawnScatteredRock() {
  const baseSpeed = 2.0 + Math.min(1.8, seaScore * 0.07);
  const rockW = 18 + Math.random() * 18; // 18px - 36px wide
  const rockH = 16 + Math.random() * 16; // 16px - 32px tall

  // Pick a random X position on canvas
  let x = 15 + Math.random() * (seaCanvas.width - rockW - 30);

  // Avoid placing directly over an existing top rock
  const topRocks = rocks.filter(r => r.y < 40);
  for (let r of topRocks) {
    if (Math.abs((x + rockW / 2) - (r.x + r.width / 2)) < 55) {
      x = (r.x + r.width + 60) % (seaCanvas.width - rockW - 30);
      if (x < 15) x = 15;
    }
  }

  rocks.push({
    x: x,
    y: -rockH,
    width: rockW,
    height: rockH,
    speed: baseSpeed
  });

  // 25% chance to spawn a small adjacent companion rock (small cluster)
  if (Math.random() < 0.25) {
    const companionW = 14 + Math.random() * 12;
    const companionH = 14 + Math.random() * 12;
    const offsetX = Math.random() < 0.5 ? (rockW - 4) : (-companionW + 4);
    const companionX = Math.max(10, Math.min(seaCanvas.width - companionW - 10, x + offsetX));

    rocks.push({
      x: companionX,
      y: -rockH + (Math.random() * 6 - 3),
      width: companionW,
      height: companionH,
      speed: baseSpeed
    });
  }
}

/**
 * Reachable Enemy Ship Generator:
 * Spawns enemy ships at random open-water positions across the sea.
 */
function spawnEnemyShip() {
  const enemyWidth = 28;
  const enemyHeight = 42;

  let x = 20 + Math.random() * (seaCanvas.width - enemyWidth - 40);

  // Ensure ship doesn't spawn directly on top of a rock at top of screen
  const topRocks = rocks.filter(r => r.y < 50);
  for (let r of topRocks) {
    if (x < r.x + r.width + 10 && x + enemyWidth > r.x - 10) {
      x = (r.x + r.width + 25) % (seaCanvas.width - enemyWidth - 20);
      if (x < 15) x = 15;
    }
  }

  const baseSpeed = 1.8 + Math.min(2.2, seaScore * 0.07);

  enemyShips.push({
    x: x,
    y: -enemyHeight,
    width: enemyWidth,
    height: enemyHeight,
    speed: baseSpeed
  });
}

/**
 * Environmental Details Generators (Decorative Only)
 */
function spawnFloatingBarrel() {
  const w = 12 + Math.random() * 4;
  const h = 16 + Math.random() * 4;
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
  const w = 55 + Math.random() * 20;
  const h = 40 + Math.random() * 15;
  islands.push({
    x: 10 + Math.random() * (seaCanvas.width - w - 20),
    y: -h - 20,
    width: w,
    height: h,
    speed: 1.1 + Math.random() * 0.3
  });
}

function spawnSeagull() {
  const fromLeft = Math.random() < 0.5;
  seagulls.push({
    x: fromLeft ? -20 : seaCanvas.width + 20,
    y: 30 + Math.random() * (seaCanvas.height * 0.6),
    vx: fromLeft ? (1.2 + Math.random() * 1.0) : (-1.2 - Math.random() * 1.0),
    vy: (Math.random() - 0.5) * 0.4,
    size: 10 + Math.random() * 5
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

  // 1. Update Player Movement & Firing
  if (keyState.left) {
    playerShip.x -= playerShip.speed;
    if (playerShip.x < 5) playerShip.x = 5;
  }
  if (keyState.right) {
    playerShip.x += playerShip.speed;
    if (playerShip.x > seaCanvas.width - playerShip.width - 5) {
      playerShip.x = seaCanvas.width - playerShip.width - 5;
    }
  }
  if (keyState.space) {
    fireCannonball();
  }

  if (playerShip.invulnerableTimer > 0) {
    playerShip.invulnerableTimer--;
  }

  // 2. Progressive Spawning Timers & Environmental Elements
  const rockSpawnInterval = Math.max(45, 70 - Math.floor(seaScore * 0.6));
  const enemySpawnInterval = Math.max(70, 105 - Math.floor(seaScore * 1.0));

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
    islands[i].y += islands[i].speed;
    if (islands[i].y > seaCanvas.height + 80) islands.splice(i, 1);
  }

  for (let i = seagulls.length - 1; i >= 0; i--) {
    seagulls[i].x += seagulls[i].vx;
    seagulls[i].y += seagulls[i].vy;
    if (seagulls[i].x < -40 || seagulls[i].x > seaCanvas.width + 40) {
      seagulls.splice(i, 1);
    }
  }

  // 3. Update Cannonballs & Collision with Rocks / Enemy Ships
  for (let i = cannonballs.length - 1; i >= 0; i--) {
    const cb = cannonballs[i];
    cb.y -= cb.speed;

    let cbHit = false;

    // Check collision with Rocks (Rocks BLOCK cannonballs)
    for (let rIdx = 0; rIdx < rocks.length; rIdx++) {
      const r = rocks[rIdx];
      if (checkPointInAABB(cb.x, cb.y, r)) {
        createRockShatterEffect(cb.x, cb.y);
        cannonballs.splice(i, 1);
        cbHit = true;
        break;
      }
    }

    if (cbHit) continue;

    // Check collision with Enemy Ships (+1 Point)
    for (let eIdx = enemyShips.length - 1; eIdx >= 0; eIdx--) {
      const e = enemyShips[eIdx];
      if (checkPointInAABB(cb.x, cb.y, e)) {
        createExplosion(e.x + e.width / 2, e.y + e.height / 2);
        cannonballs.splice(i, 1);
        enemyShips.splice(eIdx, 1);
        seaScore += 1;
        updateSeaHUD();
        cbHit = true;
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

  // 5. Update Enemy Ships & Escaped Ship Penalty
  for (let i = enemyShips.length - 1; i >= 0; i--) {
    const e = enemyShips[i];
    e.y += e.speed;

    // Check if enemy ship reaches the player's ship level / reaches bottom -> Lose 1 Life
    if (e.y >= playerShip.y - 10) {
      seaLives--;
      updateSeaHUD();
      createExplosion(e.x + e.width / 2, e.y + e.height / 2);
      enemyShips.splice(i, 1);

      if (seaLives <= 0) {
        triggerSeaGameOver("An enemy ship breached your defenses!");
        return;
      }
      continue;
    }

    // Check direct collision with player
    if (playerShip.invulnerableTimer === 0 && checkAABBCollision(playerShip, e)) {
      seaLives--;
      updateSeaHUD();
      playerShip.invulnerableTimer = 60;
      createExplosion(e.x + e.width / 2, e.y + e.height / 2);
      enemyShips.splice(i, 1);

      if (seaLives <= 0) {
        triggerSeaGameOver("Collided with an enemy flagship!");
        return;
      }
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

  // 2. Draw Small Tropical Islands with Refined Palm Tree
  islands.forEach(isl => {
    const cx = isl.x + isl.width / 2;
    const cy = isl.y + isl.height / 2;

    // Sandy Shore
    seaCtx.fillStyle = '#d9b46e';
    seaCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    seaCtx.lineWidth = 1.5;
    seaCtx.beginPath();
    seaCtx.ellipse(cx, cy, isl.width / 2, isl.height / 2, 0, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.stroke();

    // Inner Lush Grass Base
    seaCtx.fillStyle = '#2d6a33';
    seaCtx.beginPath();
    seaCtx.ellipse(cx - 2, cy + 1, isl.width * 0.32, isl.height * 0.28, 0, 0, Math.PI * 2);
    seaCtx.fill();

    // Natural Curved Palm Trunk with Bark Ridges
    const trunkBaseX = cx - 2;
    const trunkBaseY = cy + 4;
    const topX = cx - 5;
    const topY = cy - 14;

    seaCtx.strokeStyle = '#5a3d1e';
    seaCtx.lineWidth = 3.2;
    seaCtx.lineCap = 'round';
    seaCtx.beginPath();
    seaCtx.moveTo(trunkBaseX, trunkBaseY);
    seaCtx.quadraticCurveTo(cx - 10, cy - 4, topX, topY);
    seaCtx.stroke();

    // Trunk Bark Ridges
    seaCtx.strokeStyle = '#3e2812';
    seaCtx.lineWidth = 1.2;
    seaCtx.beginPath();
    seaCtx.moveTo(cx - 4, cy + 1);
    seaCtx.lineTo(cx - 2, cy + 2);
    seaCtx.moveTo(cx - 6, cy - 3);
    seaCtx.lineTo(cx - 4, cy - 2);
    seaCtx.moveTo(cx - 7, cy - 8);
    seaCtx.lineTo(cx - 5, cy - 7);
    seaCtx.stroke();

    // Arching Natural Palm Leaves (Feathery Fan Fronds)
    const fronds = [
      { endX: topX - 14, endY: topY - 2, ctrlX: topX - 8, ctrlY: topY - 10 },
      { endX: topX - 10, endY: topY - 12, ctrlX: topX - 6, ctrlY: topY - 14 },
      { endX: topX, endY: topY - 15, ctrlX: topX, ctrlY: topY - 16 },
      { endX: topX + 11, endY: topY - 10, ctrlX: topX + 7, ctrlY: topY - 14 },
      { endX: topX + 15, endY: topY - 1, ctrlX: topX + 9, ctrlY: topY - 8 },
      { endX: topX + 10, endY: topY + 6, ctrlX: topX + 7, ctrlY: topY + 2 }
    ];

    fronds.forEach(f => {
      // Leaf Stem
      seaCtx.strokeStyle = '#1b5e20';
      seaCtx.lineWidth = 1.6;
      seaCtx.beginPath();
      seaCtx.moveTo(topX, topY);
      seaCtx.quadraticCurveTo(f.ctrlX, f.ctrlY, f.endX, f.endY);
      seaCtx.stroke();

      // Leaf Blade / Frond Fill
      seaCtx.fillStyle = '#2e7d32';
      seaCtx.beginPath();
      seaCtx.moveTo(topX, topY);
      seaCtx.quadraticCurveTo(f.ctrlX - 1, f.ctrlY - 2, f.endX, f.endY);
      seaCtx.quadraticCurveTo(f.ctrlX + 1, f.ctrlY + 2, topX, topY);
      seaCtx.fill();
    });

    // Coconuts at Crown
    seaCtx.fillStyle = '#3e2723';
    seaCtx.beginPath();
    seaCtx.arc(topX - 1, topY + 2, 2.0, 0, Math.PI * 2);
    seaCtx.arc(topX + 2, topY + 1, 1.8, 0, Math.PI * 2);
    seaCtx.arc(topX, topY + 3, 1.6, 0, Math.PI * 2);
    seaCtx.fill();
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

  // 4. Draw Scattered Individual Rock Boulders
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

    // Water Foam Base
    seaCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    seaCtx.lineWidth = 1.5;
    seaCtx.strokeRect(r.x - 2, r.y + r.height - 2, r.width + 4, 3);
  });

  // 3. Draw Enemy Ships (Red Sails)
  enemyShips.forEach(e => {
    // Ship Hull
    seaCtx.fillStyle = '#3a2010';
    seaCtx.strokeStyle = '#201005';
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

    // Red Sails
    seaCtx.fillStyle = '#b91c1c';
    seaCtx.fillRect(e.x + 3, e.y + e.height * 0.25, e.width - 6, e.height * 0.35);

    // Mast
    seaCtx.fillStyle = '#f59e0b';
    seaCtx.fillRect(e.x + e.width / 2 - 1, e.y + 2, 2, e.height * 0.7);
  });

  // 4. Draw Cannonballs
  cannonballs.forEach(cb => {
    seaCtx.fillStyle = '#ffd700';
    seaCtx.shadowColor = '#ffaa00';
    seaCtx.shadowBlur = 8;
    seaCtx.beginPath();
    seaCtx.arc(cb.x, cb.y, cb.radius, 0, Math.PI * 2);
    seaCtx.fill();
    seaCtx.shadowBlur = 0;
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
    seaCtx.font = '10px sans-serif';
    seaCtx.textAlign = 'center';
    seaCtx.fillText('☠️', p.x + p.width / 2, p.y + p.height * 0.5);

    // Bowsprit
    seaCtx.fillStyle = '#d4af37';
    seaCtx.fillRect(p.x + p.width / 2 - 1, p.y - 6, 2, 8);
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
