const navToggle = document.querySelector(".floating-nav__toggle");
const navLinks = document.querySelector(".floating-nav__links");
const scrollTopButton = document.querySelector(".scroll-top");
const sectionAnchors = document.querySelectorAll(".floating-nav__links a[href^='#']");

// Toggle navigation visibility on small screens
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

// Highlight active section link based on scroll position
const sections = [...sectionAnchors].map((anchor) => {
  const id = anchor.getAttribute("href")?.replace("#", "");
  return id ? document.getElementById(id) : null;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const targetIndex = sections.indexOf(entry.target);
      if (targetIndex === -1) {
        return;
      }

      const relatedLink = sectionAnchors[targetIndex];
      if (entry.isIntersecting) {
        sectionAnchors.forEach((link) => link.classList.remove("is-active"));
        relatedLink.classList.add("is-active");
      }
    });
  },
  {
    rootMargin: "-40% 0px -55% 0px",
    threshold: 0.2,
  }
);

sections.forEach((section) => {
  if (section) {
    observer.observe(section);
  }
});

// Scroll-to-top button
if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Close the navigation after selecting a link on mobile
sectionAnchors.forEach((anchor) => {
  anchor.addEventListener("click", () => {
    if (navLinks?.classList.contains("is-open")) {
      navLinks.classList.remove("is-open");
      navToggle?.setAttribute("aria-expanded", "false");
    }
  });
});

// Arcade: Raymond-powered mini games
const arcadeCanvases = document.querySelectorAll(".game-card canvas");
if (arcadeCanvases.length > 0) {
  const keyState = new Set();
  const keyQueue = [];
  window.addEventListener(
    "keydown",
    (event) => {
      const key = event.key.toLowerCase();
      if (key === " " || key.startsWith("arrow")) {
        event.preventDefault();
      }
      keyState.add(key);
      if (
        !event.repeat &&
        ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "."].includes(key)
      ) {
        keyQueue.push(key);
        if (keyQueue.length > 32) {
          keyQueue.shift();
        }
      }
    },
    { passive: false }
  );
  window.addEventListener("keyup", (event) => {
    keyState.delete(event.key.toLowerCase());
  });
  window.addEventListener("blur", () => keyState.clear());

  const raymondImage = new Image();
  raymondImage.src = "raymond.png";

  const tintedCache = new Map();
  const startedGames = new Set();
  const gameInitializers = {
    pong: startRaymondPong,
    stellar: startStellarZarak,
    cascade: startRaymondCascade,
    runner: startRaymondRunner,
    memory: startMemoryMosaic,
    rhythm: startRaymondRhythm,
    maze: startRaymondMaze,
    slider: startRaymondSlider,
    roguelike: startRaymondRoguelike,
    orbit: startOliversOrbit,
  };

  function whenRaymondReady(callback) {
    if (raymondImage.complete && raymondImage.naturalWidth > 0) {
      callback();
      return;
    }
    const handleLoad = () => {
      raymondImage.removeEventListener("load", handleLoad);
      callback();
    };
    raymondImage.addEventListener("load", handleLoad);
  }

  function setupGameLaunchers() {
    const gameButtons = document.querySelectorAll("[data-game-start]");
    gameButtons.forEach((button) => {
      const gameId = button.getAttribute("data-game-start");
      const initializer = gameId ? gameInitializers[gameId] : undefined;
      if (!initializer) {
        return;
      }
      const originalLabel = button.textContent?.trim() ?? "Play";
      button.addEventListener("click", () => {
        if (startedGames.has(gameId)) {
          return;
        }
        button.disabled = true;
        button.textContent = "Starting...";
        whenRaymondReady(() => {
          if (startedGames.has(gameId)) {
            return;
          }
          initializer();
          startedGames.add(gameId);
          button.textContent = originalLabel;
          button.classList.add("game-launcher--running");
          button.setAttribute("aria-hidden", "true");
          button.setAttribute("tabindex", "-1");
          button.blur();
        });
      });
    });
  }

  setupGameLaunchers();

  function enableHighQuality(ctx) {
    if (!ctx) {
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
  }

  function getRaymondSprite(color, width, height) {
    const safeWidth = Math.max(1, Math.floor(width));
    const safeHeight = Math.max(1, Math.floor(height));
    const key = `${color ?? "original"}-${safeWidth}x${safeHeight}`;

    if (tintedCache.has(key)) {
      return tintedCache.get(key);
    }

    const offscreen = document.createElement("canvas");
    offscreen.width = safeWidth;
    offscreen.height = safeHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) {
      return raymondImage;
    }
    enableHighQuality(ctx);

    ctx.drawImage(raymondImage, 0, 0, safeWidth, safeHeight);
    if (color) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, safeWidth, safeHeight);
      ctx.globalCompositeOperation = "source-over";
    }

    tintedCache.set(key, offscreen);
    return offscreen;
  }

  function createPattern(ctx, scale, tint) {
    const size = Math.max(12, Math.floor(scale));
    const tile = getRaymondSprite(tint, size, size);
    return ctx.createPattern(tile, "repeat");
  }

  function drawCircleSprite(ctx, sprite, x, y, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function drawTriangleSprite(ctx, sprite, size) {
    const half = size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -half);
    ctx.lineTo(half * 0.7, half);
    ctx.lineTo(-half * 0.7, half);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(sprite, -half, -half, size, size);
    ctx.restore();
  }

  function rotatePoint(point, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: point.x * cos - point.y * sin,
      y: point.x * sin + point.y * cos,
    };
  }

  function getShipVertices(ship, size) {
    const half = size / 2;
    const localPoints = [
      { x: 0, y: -half },
      { x: half * 0.7, y: half },
      { x: -half * 0.7, y: half },
    ];
    const angle = ship.angle + Math.PI / 2;
    return localPoints.map((point) => {
      const rotated = rotatePoint(point, angle);
      return {
        x: rotated.x + ship.x,
        y: rotated.y + ship.y,
      };
    });
  }

  function pointInTriangle(point, triangle) {
    const [a, b, c] = triangle;
    const v0 = { x: c.x - a.x, y: c.y - a.y };
    const v1 = { x: b.x - a.x, y: b.y - a.y };
    const v2 = { x: point.x - a.x, y: point.y - a.y };

    const dot00 = v0.x * v0.x + v0.y * v0.y;
    const dot01 = v0.x * v1.x + v0.y * v1.y;
    const dot02 = v0.x * v2.x + v0.y * v2.y;
    const dot11 = v1.x * v1.x + v1.y * v1.y;
    const dot12 = v1.x * v2.x + v1.y * v2.y;

    const denominator = dot00 * dot11 - dot01 * dot01;
    if (denominator === 0) {
      return false;
    }

    const u = (dot11 * dot02 - dot01 * dot12) / denominator;
    const v = (dot00 * dot12 - dot01 * dot02) / denominator;

    return u >= 0 && v >= 0 && u + v <= 1;
  }

  function distancePointToSegment(point, segStart, segEnd) {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) {
      return Math.hypot(point.x - segStart.x, point.y - segStart.y);
    }
    let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const projection = {
      x: segStart.x + t * dx,
      y: segStart.y + t * dy,
    };
    return Math.hypot(point.x - projection.x, point.y - projection.y);
  }

  function triangleCircleIntersect(triangle, circleCenter, radius) {
    if (pointInTriangle(circleCenter, triangle)) {
      return true;
    }

    for (let i = 0; i < triangle.length; i += 1) {
      const start = triangle[i];
      const end = triangle[(i + 1) % triangle.length];
      if (distancePointToSegment(circleCenter, start, end) <= radius) {
        return true;
      }
    }

    return triangle.some((vertex) => Math.hypot(vertex.x - circleCenter.x, vertex.y - circleCenter.y) <= radius);
  }

  function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function spriteToDataUrl(sprite) {
    if (sprite instanceof HTMLImageElement) {
      return sprite.src;
    }
    try {
      return sprite.toDataURL("image/png");
    } catch (error) {
      return "";
    }
  }

  // Raymond Pong
  function startRaymondPong() {
    const canvas = document.getElementById("pong-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const state = {
      width: canvas.width,
      height: canvas.height,
      paddleWidth: 110,
      paddleHeight: 30,
      playerX: canvas.width / 2 - 55,
      aiX: canvas.width / 2 - 55,
      ballX: canvas.width / 2,
      ballY: canvas.height / 2,
      ballSpeedX: 160,
      ballSpeedY: 160,
      ballSize: 36,
    };

    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      state.playerX = Math.max(0, Math.min(state.width - state.paddleWidth, x - state.paddleWidth / 2));
    });

    function update(dt) {
      if (keyState.has("arrowleft")) {
        state.playerX = Math.max(0, state.playerX - 300 * dt);
      }
      if (keyState.has("arrowright")) {
        state.playerX = Math.min(state.width - state.paddleWidth, state.playerX + 300 * dt);
      }

      state.ballX += state.ballSpeedX * dt;
      state.ballY += state.ballSpeedY * dt;

      if (state.ballX <= 0 || state.ballX + state.ballSize >= state.width) {
        state.ballSpeedX *= -1;
      }

      if (state.ballY + state.ballSize < 0) {
        state.ballX = state.width / 2;
        state.ballY = state.height / 2;
        state.ballSpeedY = 160;
        state.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 160;
      }

      if (state.ballY + state.ballSize >= state.height) {
        state.ballX = state.width / 2;
        state.ballY = state.height / 2;
        state.ballSpeedY = -160;
      }

      const paddleTop = state.height - state.paddleHeight - 12;
      if (
        state.ballY + state.ballSize >= paddleTop &&
        state.ballX + state.ballSize > state.playerX &&
        state.ballX < state.playerX + state.paddleWidth &&
        state.ballSpeedY > 0
      ) {
        state.ballSpeedY *= -1;
        const offset = state.ballX + state.ballSize / 2 - (state.playerX + state.paddleWidth / 2);
        state.ballSpeedX = offset * 4;
        state.ballY = paddleTop - state.ballSize;
      }

      const aiTarget = state.ballX - state.paddleWidth / 2 + state.ballSize / 2;
      if (aiTarget > state.aiX) {
        state.aiX = Math.min(state.width - state.paddleWidth, state.aiX + 180 * dt);
      } else {
        state.aiX = Math.max(0, state.aiX - 180 * dt);
      }

      if (
        state.ballY <= state.paddleHeight + 12 &&
        state.ballX + state.ballSize > state.aiX &&
        state.ballX < state.aiX + state.paddleWidth &&
        state.ballSpeedY < 0
      ) {
        state.ballSpeedY *= -1;
        state.ballY = state.paddleHeight + 12;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = createPattern(ctx, 42, "rgba(249,168,38,0.05)");
      ctx.fillRect(0, 0, state.width, state.height);

      const paddleSprite = getRaymondSprite("rgba(249,168,38,0.28)", state.paddleWidth, state.paddleHeight);
      const aiSprite = getRaymondSprite("rgba(58,80,107,0.32)", state.paddleWidth, state.paddleHeight);
      const ballSprite = getRaymondSprite("rgba(255,255,255,0.4)", state.ballSize, state.ballSize);

      ctx.drawImage(aiSprite, state.aiX, 12);
      ctx.drawImage(paddleSprite, state.playerX, state.height - state.paddleHeight - 12);
      ctx.drawImage(ballSprite, state.ballX, state.ballY);
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // Stellar Zarak (Asteroids-inspired)
  function startStellarZarak() {
    const canvas = document.getElementById("asteroids-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const shipSize = 52;
    const state = {
      width: canvas.width,
      height: canvas.height,
      ship: { x: canvas.width / 2, y: canvas.height / 2, angle: 0, velocityX: 0, velocityY: 0 },
      projectiles: [],
      asteroids: [],
      cooldown: 0,
    };

    function spawnAsteroid() {
      const size = Math.random() * 50 + 40;
      const speed = Math.random() * 40 + 30;
      const angle = Math.random() * Math.PI * 2;
      const edge = Math.floor(Math.random() * 4);
      let x = 0;
      let y = 0;

      if (edge === 0) {
        x = Math.random() * state.width;
      } else if (edge === 1) {
        x = state.width;
        y = Math.random() * state.height;
      } else if (edge === 2) {
        x = Math.random() * state.width;
        y = state.height;
      } else {
        x = 0;
        y = Math.random() * state.height;
      }

      state.asteroids.push({
        x,
        y,
        size,
        angle,
        rotation: (Math.random() - 0.5) * 0.8,
        speed,
      });
    }

    for (let i = 0; i < 6; i += 1) {
      spawnAsteroid();
    }

    function update(dt) {
      const { ship } = state;
      const rotationSpeed = 3.4;
      const thrust = 160;

      if (keyState.has("arrowleft")) {
        ship.angle -= rotationSpeed * dt;
      }
      if (keyState.has("arrowright")) {
        ship.angle += rotationSpeed * dt;
      }
      if (keyState.has("arrowup")) {
        ship.velocityX += Math.cos(ship.angle) * thrust * dt;
        ship.velocityY += Math.sin(ship.angle) * thrust * dt;
      }

      ship.velocityX *= 0.995;
      ship.velocityY *= 0.995;

      ship.x = (ship.x + ship.velocityX * dt + state.width) % state.width;
      ship.y = (ship.y + ship.velocityY * dt + state.height) % state.height;

      state.cooldown -= dt;
      if (keyState.has(" ") && state.cooldown <= 0) {
        state.cooldown = 0.3;
        state.projectiles.push({
          x: ship.x,
          y: ship.y,
          angle: ship.angle,
          speed: 280,
          life: 1.5,
        });
      }

      state.projectiles.forEach((projectile) => {
        projectile.x = (projectile.x + Math.cos(projectile.angle) * projectile.speed * dt + state.width) % state.width;
        projectile.y = (projectile.y + Math.sin(projectile.angle) * projectile.speed * dt + state.height) % state.height;
        projectile.life -= dt;
      });
      state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);

      state.asteroids.forEach((asteroid) => {
        asteroid.x = (asteroid.x + Math.cos(asteroid.angle) * asteroid.speed * dt + state.width) % state.width;
        asteroid.y = (asteroid.y + Math.sin(asteroid.angle) * asteroid.speed * dt + state.height) % state.height;
        asteroid.rotation += asteroid.speed * dt * 0.004;
      });

      state.projectiles.forEach((projectile) => {
        state.asteroids.forEach((asteroid) => {
          const dx = projectile.x - asteroid.x;
          const dy = projectile.y - asteroid.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < asteroid.size / 2) {
            projectile.life = 0;
            asteroid.size *= 0.6;
            asteroid.speed *= 1.1;
            if (asteroid.size < 28) {
              asteroid.size = 0;
            }
          }
        });
      });

      state.asteroids = state.asteroids.filter((asteroid) => asteroid.size > 0);
      if (state.asteroids.length < 6) {
        spawnAsteroid();
      }

      const shipVertices = getShipVertices(state.ship, shipSize);
      let collided = false;
      state.asteroids.forEach((asteroid) => {
        const collision = triangleCircleIntersect(
          shipVertices,
          { x: asteroid.x, y: asteroid.y },
          asteroid.size / 2
        );
        if (collision) {
          collided = true;
        }
      });

      if (collided) {
        ship.x = state.width / 2;
        ship.y = state.height / 2;
        ship.velocityX = 0;
        ship.velocityY = 0;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = createPattern(ctx, 32, "rgba(58,80,107,0.1)");
      ctx.fillRect(0, 0, state.width, state.height);

      const shipSprite = getRaymondSprite("rgba(249,168,38,0.3)", shipSize, shipSize);
      ctx.save();
      ctx.translate(state.ship.x, state.ship.y);
      ctx.rotate(state.ship.angle + Math.PI / 2);
      drawTriangleSprite(ctx, shipSprite, shipSize);
      ctx.restore();

      const projectileSprite = getRaymondSprite("rgba(255,255,255,0.32)", 22, 22);
      state.projectiles.forEach((projectile) => {
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(projectile.angle);
        ctx.drawImage(projectileSprite, -11, -11);
        ctx.restore();
      });

      state.asteroids.forEach((asteroid) => {
        const asteroidSprite = getRaymondSprite("rgba(120,149,203,0.32)", asteroid.size, asteroid.size);
        ctx.save();
        ctx.translate(asteroid.x, asteroid.y);
        ctx.rotate(asteroid.rotation);
        ctx.drawImage(asteroidSprite, -asteroid.size / 2, -asteroid.size / 2);
        ctx.restore();
      });
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // Raymond Cascade
  function startRaymondCascade() {
    const canvas = document.getElementById("cascade-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const scoreDisplay = document.querySelector("[data-cascade-score]");
    const missesDisplay = document.querySelector("[data-cascade-misses]");

    const state = {
      width: canvas.width,
      height: canvas.height,
      catcherWidth: 120,
      catcherHeight: 36,
      catcherX: canvas.width / 2 - 60,
      score: 0,
      misses: 0,
      drops: [],
      timer: 0,
    };

    function spawnDrop() {
      state.drops.push({
        x: Math.random() * (state.width - 36),
        y: -40,
        speed: Math.random() * 60 + 70,
        size: Math.random() * 32 + 32,
      });
    }

    function update(dt) {
      const speed = 280;
      if (keyState.has("arrowleft")) {
        state.catcherX = Math.max(0, state.catcherX - speed * dt);
      }
      if (keyState.has("arrowright")) {
        state.catcherX = Math.min(state.width - state.catcherWidth, state.catcherX + speed * dt);
      }

      state.timer += dt;
      if (state.timer > 0.6) {
        state.timer = 0;
        spawnDrop();
      }

      state.drops.forEach((drop) => {
        drop.y += drop.speed * dt;
      });

      state.drops.forEach((drop) => {
        const catcherTop = state.height - state.catcherHeight - 16;
        if (
          drop.y + drop.size >= catcherTop &&
          drop.x + drop.size > state.catcherX &&
          drop.x < state.catcherX + state.catcherWidth
        ) {
          state.score += 1;
          drop.caught = true;
        }
        if (drop.y > state.height + drop.size) {
          state.misses += 1;
          drop.caught = true;
        }
      });
      state.drops = state.drops.filter((drop) => !drop.caught);

      if (state.misses > 5) {
        state.score = 0;
        state.misses = 0;
        state.drops = [];
      }
    }

    function draw() {
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = createPattern(ctx, 36, "rgba(249,168,38,0.07)");
      ctx.fillRect(0, 0, state.width, state.height);

      const catcherSprite = getRaymondSprite("rgba(249,168,38,0.3)", state.catcherWidth, state.catcherHeight);
      ctx.drawImage(catcherSprite, state.catcherX, state.height - state.catcherHeight - 16);

      state.drops.forEach((drop) => {
        const dropSprite = getRaymondSprite("rgba(58,80,107,0.3)", drop.size, drop.size);
        ctx.drawImage(dropSprite, drop.x, drop.y);
      });

      if (scoreDisplay) {
        scoreDisplay.textContent = state.score;
      }
      if (missesDisplay) {
        missesDisplay.textContent = state.misses;
      }
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // Raymond Runner
  function startRaymondRunner() {
    const canvas = document.getElementById("runner-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const distanceDisplay = document.querySelector("[data-runner-distance]");
    const bestDisplay = document.querySelector("[data-runner-best]");

    const state = {
      width: canvas.width,
      height: canvas.height,
      groundHeight: 70,
      heroWidth: 64,
      heroHeight: 64,
      heroX: 90,
      heroY: 0,
      heroVelocityY: 0,
      grounded: false,
      gravity: 880,
      runSpeed: 260,
      obstacles: [],
      distance: 0,
      best: 0,
      nextSpawnDistance: 420,
    };

    const groundY = state.height - state.groundHeight;

    function resetRun() {
      state.best = Math.max(state.best, Math.floor(state.distance));
      state.distance = 0;
      state.obstacles = [];
      state.heroY = groundY - state.heroHeight;
      state.heroVelocityY = 0;
      state.grounded = true;
      state.nextSpawnDistance = 420 + Math.random() * 220;
    }

    resetRun();

    function spawnObstacle() {
      const width = 44 + Math.random() * 36;
      const height = 54 + Math.random() * 48;
      state.obstacles.push({
        x: state.width + width + 40,
        y: groundY - height,
        width,
        height,
      });
      state.nextSpawnDistance = 380 + Math.random() * 260;
    }

    function update(dt) {
      const wantsJump = keyState.has(" ") || keyState.has("arrowup") || keyState.has("w");
      if (wantsJump && state.grounded) {
        state.heroVelocityY = -520;
        state.grounded = false;
      }

      state.heroVelocityY += state.gravity * dt;
      state.heroY += state.heroVelocityY * dt;

      if (state.heroY >= groundY - state.heroHeight) {
        state.heroY = groundY - state.heroHeight;
        state.heroVelocityY = 0;
        state.grounded = true;
      }

      state.nextSpawnDistance -= state.runSpeed * dt;
      if (state.nextSpawnDistance <= 0) {
        spawnObstacle();
      }

      state.distance += state.runSpeed * dt * 0.25;

      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.runSpeed * dt;
      });
      state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -10);

      const heroRect = {
        x: state.heroX,
        y: state.heroY,
        width: state.heroWidth,
        height: state.heroHeight,
      };

      const collided = state.obstacles.some((obstacle) => {
        return !(
          heroRect.x + heroRect.width < obstacle.x ||
          heroRect.x > obstacle.x + obstacle.width ||
          heroRect.y + heroRect.height < obstacle.y ||
          heroRect.y > obstacle.y + obstacle.height
        );
      });

      if (collided) {
        resetRun();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, state.width, state.height);
      ctx.fillStyle = createPattern(ctx, 48, "rgba(249,168,38,0.05)");
      ctx.fillRect(0, 0, state.width, state.height);

      const groundSprite = getRaymondSprite("rgba(58,80,107,0.18)", state.width, state.groundHeight);
      ctx.drawImage(groundSprite, 0, groundY);

      const heroSprite = getRaymondSprite("rgba(249,168,38,0.32)", state.heroWidth, state.heroHeight);
      ctx.drawImage(heroSprite, state.heroX, state.heroY);

      state.obstacles.forEach((obstacle) => {
        const obstacleSprite = getRaymondSprite("rgba(58,80,107,0.28)", obstacle.width, obstacle.height);
        ctx.drawImage(obstacleSprite, obstacle.x, obstacle.y);
      });

      if (distanceDisplay) {
        distanceDisplay.textContent = Math.floor(state.distance);
      }
      if (bestDisplay) {
        bestDisplay.textContent = Math.floor(state.best);
      }
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  // Memory Mosaic
  function startMemoryMosaic() {
    const grid = document.querySelector("[data-memory-grid]");
    if (!grid) {
      return;
    }

    const matchesDisplay = document.querySelector("[data-memory-matches]");
    const movesDisplay = document.querySelector("[data-memory-moves]");
    const resetButton = document.querySelector("[data-memory-reset]");

    const cardColors = [
      "rgba(249,168,38,0.34)",
      "rgba(72,202,228,0.34)",
      "rgba(255,105,97,0.34)",
      "rgba(120,149,203,0.34)",
      "rgba(160,255,99,0.34)",
      "rgba(214,131,255,0.34)",
      "rgba(253,246,178,0.34)",
      "rgba(255,255,255,0.32)",
    ];

    let matches = 0;
    let moves = 0;
    let flipped = [];
    let isBusy = false;

    function updateScoreboard() {
      if (matchesDisplay) {
        matchesDisplay.textContent = matches;
      }
      if (movesDisplay) {
        movesDisplay.textContent = moves;
      }
    }

    function createCard(color, index) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-card";
      button.dataset.matchKey = `${color}-${index}`;

      const front = document.createElement("span");
      front.className = "memory-card__face memory-card__face--front";
      const sprite = getRaymondSprite(color, 140, 140);
      front.style.backgroundImage = `url(${spriteToDataUrl(sprite)})`;
      front.style.backgroundPosition = `${Math.random() * 60}% ${Math.random() * 60}%`;

      const back = document.createElement("span");
      back.className = "memory-card__face memory-card__face--back";
      const backSprite = getRaymondSprite("rgba(58,80,107,0.4)", 140, 140);
      back.style.backgroundImage = `url(${spriteToDataUrl(backSprite)})`;

      button.append(front, back);
      button.addEventListener("click", () => flipCard(button));
      return button;
    }

    function flipCard(card) {
      if (isBusy || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) {
        return;
      }

      card.classList.add("is-flipped");
      flipped.push(card);

      if (flipped.length === 2) {
        moves += 1;
        updateScoreboard();
        const [first, second] = flipped;
        if (first.dataset.matchKey === second.dataset.matchKey) {
          first.classList.add("is-matched");
          second.classList.add("is-matched");
          flipped = [];
          matches += 1;
          updateScoreboard();
        } else {
          isBusy = true;
          setTimeout(() => {
            first.classList.remove("is-flipped");
            second.classList.remove("is-flipped");
            flipped = [];
            isBusy = false;
          }, 700);
        }
      }
    }

    function resetBoard() {
      grid.innerHTML = "";
      matches = 0;
      moves = 0;
      flipped = [];
      isBusy = false;
      const pairs = [];
      cardColors.forEach((color, index) => {
        pairs.push(createCard(color, index));
        pairs.push(createCard(color, index));
      });
      pairs
        .sort(() => Math.random() - 0.5)
        .forEach((card) => {
          grid.append(card);
        });
      updateScoreboard();
    }

    resetButton?.addEventListener("click", resetBoard);
    resetBoard();
  }

  // Raymond Rhythm
  function startRaymondRhythm() {
    const canvas = document.getElementById("rhythm-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const scoreDisplay = document.querySelector("[data-rhythm-score]");
    const comboDisplay = document.querySelector("[data-rhythm-combo]");
    const resetButton = document.querySelector("[data-rhythm-reset]");

    const laneKeys = ["d", "f", "j", "k"];
    const notes = [];
    const laneWidth = canvas.width / laneKeys.length;
    const hitLine = canvas.height - 90;
    const hitWindow = 50;

    let spawnTimer = 0.6;
    let score = 0;
    let combo = 0;
    let maxCombo = 0;

    const pendingHits = [];

    function updateScoreboard() {
      if (scoreDisplay) {
        scoreDisplay.textContent = score;
      }
      if (comboDisplay) {
        comboDisplay.textContent = `${combo} (Max ${maxCombo})`;
      }
    }

    function queueHit(event) {
      const key = event.key.toLowerCase();
      const laneIndex = laneKeys.indexOf(key);
      if (laneIndex !== -1) {
        pendingHits.push({ lane: laneIndex });
      }
    }

    window.addEventListener("keydown", queueHit);

    function resetGame() {
      notes.length = 0;
      spawnTimer = 0.6;
      score = 0;
      combo = 0;
      maxCombo = 0;
      updateScoreboard();
    }

    function spawnNote() {
      notes.push({
        lane: Math.floor(Math.random() * laneKeys.length),
        y: -40,
        speed: 220 + Math.random() * 60,
        hit: false,
      });
    }

    function handlePendingHits() {
      while (pendingHits.length > 0) {
        const hit = pendingHits.shift();
        const laneNotes = notes
          .filter((note) => note.lane === hit.lane && !note.hit)
          .sort((a, b) => Math.abs(a.y - hitLine) - Math.abs(b.y - hitLine));
        const candidate = laneNotes.find((note) => Math.abs(note.y - hitLine) <= hitWindow);
        if (candidate) {
          candidate.hit = true;
          combo += 1;
          if (combo > maxCombo) {
            maxCombo = combo;
          }
          score += 100 + combo * 10;
          updateScoreboard();
        } else {
          combo = 0;
          updateScoreboard();
        }
      }
    }

    function update(dt) {
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnNote();
        spawnTimer = Math.max(0.35, 0.9 - score / 1500);
      }

      notes.forEach((note) => {
        note.y += note.speed * dt;
      });

      handlePendingHits();

      for (let i = notes.length - 1; i >= 0; i -= 1) {
        const note = notes[i];
        if (note.hit) {
          notes.splice(i, 1);
        } else if (note.y > canvas.height + 60) {
          notes.splice(i, 1);
          combo = 0;
          updateScoreboard();
        }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = createPattern(ctx, 28, "rgba(58,80,107,0.14)");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const laneSprite = getRaymondSprite("rgba(249,168,38,0.12)", laneWidth - 18, canvas.height);
      for (let i = 0; i < laneKeys.length; i += 1) {
        const x = i * laneWidth + 9;
        ctx.drawImage(laneSprite, x, 0);
        ctx.fillStyle = "rgba(249,168,38,0.35)";
        ctx.font = "16px Raleway, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(laneKeys[i].toUpperCase(), x + laneWidth / 2 - 9, canvas.height - 16);
      }

      ctx.fillStyle = "rgba(249,168,38,0.45)";
      ctx.fillRect(0, hitLine, canvas.width, 6);

      notes.forEach((note) => {
        const noteSprite = getRaymondSprite("rgba(255,255,255,0.32)", laneWidth - 36, 48);
        const x = note.lane * laneWidth + 18;
        ctx.drawImage(noteSprite, x, note.y);
      });
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    resetButton?.addEventListener("click", resetGame);
    resetGame();
    requestAnimationFrame(loop);
  }

  // Raymond Maze
  function startRaymondMaze() {
    const canvas = document.getElementById("maze-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const timeDisplay = document.querySelector("[data-maze-time]");
    const runDisplay = document.querySelector("[data-maze-runs]");
    const resetButton = document.querySelector("[data-maze-reset]");

    const gridSize = 15;
    const cellSize = Math.floor(canvas.width / gridSize);
    let maze = [];
    let player = { x: 1, y: 1 };
    let goal = { x: gridSize - 2, y: gridSize - 2 };
    let elapsed = 0;
    let runs = 1;
    let moveCooldown = 0;

    function updateScoreboard() {
      if (timeDisplay) {
        timeDisplay.textContent = `${elapsed.toFixed(1)}s`;
      }
      if (runDisplay) {
        runDisplay.textContent = runs;
      }
    }

    function generateMaze() {
      const data = Array.from({ length: gridSize }, () => Array(gridSize).fill(1));
      function carve(x, y) {
        const directions = [
          [0, -2],
          [2, 0],
          [0, 2],
          [-2, 0],
        ].sort(() => Math.random() - 0.5);

        directions.forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          if (nx > 0 && nx < gridSize - 1 && ny > 0 && ny < gridSize - 1 && data[ny][nx] === 1) {
            data[ny][nx] = 0;
            data[y + dy / 2][x + dx / 2] = 0;
            carve(nx, ny);
          }
        });
      }

      data[1][1] = 0;
      carve(1, 1);
      data[goal.y][goal.x] = 0;
      return data;
    }

    function resetMaze() {
      goal = { x: gridSize - 2, y: gridSize - 2 };
      maze = generateMaze();
      player = { x: 1, y: 1 };
      maze[goal.y][goal.x] = 0;
      elapsed = 0;
      moveCooldown = 0;
      updateScoreboard();
    }

    function tryMove(dx, dy) {
      const targetX = player.x + dx;
      const targetY = player.y + dy;
      if (maze[targetY]?.[targetX] === 0) {
        player.x = targetX;
        player.y = targetY;
        moveCooldown = 0.14;
        if (player.x === goal.x && player.y === goal.y) {
          runs += 1;
          resetMaze();
        }
      }
    }

    function update(dt) {
      elapsed += dt;
      if (moveCooldown > 0) {
        moveCooldown -= dt;
      }

      if (moveCooldown <= 0) {
        if (keyState.has("arrowup")) {
          tryMove(0, -1);
        } else if (keyState.has("arrowdown")) {
          tryMove(0, 1);
        } else if (keyState.has("arrowleft")) {
          tryMove(-1, 0);
        } else if (keyState.has("arrowright")) {
          tryMove(1, 0);
        }
      }

      updateScoreboard();
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = createPattern(ctx, cellSize, "rgba(58,80,107,0.16)");
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < gridSize; y += 1) {
        for (let x = 0; x < gridSize; x += 1) {
          const tileX = x * cellSize;
          const tileY = y * cellSize;
          if (maze[y][x] === 1) {
            const wallSprite = getRaymondSprite("rgba(12,18,44,0.7)", cellSize, cellSize);
            ctx.drawImage(wallSprite, tileX, tileY);
          } else {
            ctx.strokeStyle = "rgba(12,18,44,0.2)";
            ctx.strokeRect(tileX, tileY, cellSize, cellSize);
          }
        }
      }

      const goalSprite = getRaymondSprite("rgba(249,168,38,0.3)", cellSize, cellSize);
      ctx.drawImage(goalSprite, goal.x * cellSize, goal.y * cellSize);

      const playerSprite = getRaymondSprite("rgba(255,255,255,0.32)", cellSize, cellSize);
      ctx.drawImage(playerSprite, player.x * cellSize, player.y * cellSize);
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    resetButton?.addEventListener("click", () => {
      runs += 1;
      resetMaze();
    });

    resetMaze();
    requestAnimationFrame(loop);
  }

  // Raymond Slider Puzzle
  function startRaymondSlider() {
    const canvas = document.getElementById("slider-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const movesDisplay = document.querySelector("[data-slider-moves]");
    const resetButton = document.querySelector("[data-slider-reset]");

    const size = 3;
    const tileSize = canvas.width / size;
    let board = [];
    let empty = { x: size - 1, y: size - 1 };
    let moves = 0;
    let solved = false;

    function updateScoreboard() {
      if (movesDisplay) {
        movesDisplay.textContent = moves;
      }
    }

    function initBoard() {
      board = [];
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          board.push(y * size + x);
        }
      }
      empty = { x: size - 1, y: size - 1 };
      solved = true;
      moves = 0;
      updateScoreboard();
    }

    function coordsToIndex(x, y) {
      return y * size + x;
    }

    function shuffleBoard() {
      initBoard();
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
      for (let i = 0; i < 180; i += 1) {
        const options = directions
          .map((dir) => ({ x: empty.x + dir.x, y: empty.y + dir.y }))
          .filter((pos) => pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size);
        const choice = options[Math.floor(Math.random() * options.length)];
        slideTile(choice.x, choice.y, false);
      }
      moves = 0;
      solved = false;
      updateScoreboard();
    }

    function slideTile(x, y, countMove = true) {
      if (solved && countMove) {
        return;
      }
      if (Math.abs(x - empty.x) + Math.abs(y - empty.y) !== 1) {
        return;
      }
      const tileIndex = coordsToIndex(x, y);
      const emptyIndex = coordsToIndex(empty.x, empty.y);
      const temp = board[tileIndex];
      board[tileIndex] = board[emptyIndex];
      board[emptyIndex] = temp;
      empty = { x, y };
      if (countMove) {
        moves += 1;
        updateScoreboard();
        checkSolved();
      }
    }

    function checkSolved() {
      solved = board.every((value, index) => value === index);
    }

    function drawPuzzle() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const value = board[coordsToIndex(x, y)];
          const drawX = x * tileSize;
          const drawY = y * tileSize;
          if (value !== coordsToIndex(size - 1, size - 1)) {
            const sx = (value % size) * (raymondImage.width / size);
            const sy = Math.floor(value / size) * (raymondImage.height / size);
            ctx.save();
            drawRoundedRectPath(ctx, drawX + 4, drawY + 4, tileSize - 8, tileSize - 8, 12);
            ctx.clip();
            ctx.drawImage(
              raymondImage,
              sx,
              sy,
              raymondImage.width / size,
              raymondImage.height / size,
              drawX + 4,
              drawY + 4,
              tileSize - 8,
              tileSize - 8
            );
            ctx.restore();
            ctx.strokeStyle = "rgba(12,18,44,0.3)";
            ctx.strokeRect(drawX + 4, drawY + 4, tileSize - 8, tileSize - 8);
          } else {
            ctx.fillStyle = "rgba(58,80,107,0.12)";
            ctx.fillRect(drawX + 4, drawY + 4, tileSize - 8, tileSize - 8);
          }
        }
      }

      if (solved) {
        ctx.fillStyle = "rgba(12,18,44,0.55)";
        ctx.fillRect(0, canvas.height / 2 - 32, canvas.width, 64);
        ctx.fillStyle = "rgba(249,168,38,0.9)";
        ctx.font = "28px Playfair Display, serif";
        ctx.textAlign = "center";
        ctx.fillText("Brilliance Restored!", canvas.width / 2, canvas.height / 2 + 10);
      }
    }

    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      const col = Math.floor(x / tileSize);
      const row = Math.floor(y / tileSize);
      slideTile(col, row);
      drawPuzzle();
    });

    resetButton?.addEventListener("click", () => {
      shuffleBoard();
      drawPuzzle();
    });

    shuffleBoard();
    drawPuzzle();
  }

  // Raymond Roguelike
  function startRaymondRoguelike() {
    const canvas = document.getElementById("rogue-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const depthDisplay = document.querySelector("[data-rogue-depth]");
    const hpDisplay = document.querySelector("[data-rogue-hp]");
    const coinsDisplay = document.querySelector("[data-rogue-coins]");
    const messageDisplay = document.querySelector("[data-rogue-message]");
    const runDisplay = document.querySelector("[data-rogue-run]");

    const cols = 20;
    const rows = 20;
    const cellSize = canvas.width / cols;
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    const moveCommands = {
      arrowup: { dx: 0, dy: -1 },
      w: { dx: 0, dy: -1 },
      arrowdown: { dx: 0, dy: 1 },
      s: { dx: 0, dy: 1 },
      arrowleft: { dx: -1, dy: 0 },
      a: { dx: -1, dy: 0 },
      arrowright: { dx: 1, dy: 0 },
      d: { dx: 1, dy: 0 },
      ".": { dx: 0, dy: 0, wait: true },
    };

    const state = {
      cols,
      rows,
      grid: [],
      depth: 1,
      run: 1,
      player: {
        x: 0,
        y: 0,
        hp: 6,
        maxHp: 6,
        coins: 0,
      },
      enemies: [],
      pickups: [],
      exit: { x: 0, y: 0 },
      messages: ["Entering the radiant vault."],
      damageFlash: 0,
    };

    const wallSprite = getRaymondSprite("rgba(12,18,44,0.78)", cellSize, cellSize);
    const floorSprite = getRaymondSprite("rgba(249,168,38,0.08)", cellSize, cellSize);
    const exitSprite = getRaymondSprite("rgba(249,168,38,0.45)", cellSize, cellSize);
    const heartSprite = getRaymondSprite("rgba(255,105,97,0.48)", cellSize * 0.7, cellSize * 0.7);
    const coinSprite = getRaymondSprite("rgba(255,223,99,0.58)", cellSize * 0.6, cellSize * 0.6);
    const playerSprite = getRaymondSprite("rgba(255,255,255,0.85)", cellSize * 0.8, cellSize * 0.8);

    function enemySpriteForDepth() {
      const intensity = Math.min(0.75, 0.3 + state.depth * 0.05);
      return getRaymondSprite(`rgba(255,130,110,${intensity})`, cellSize * 0.76, cellSize * 0.76);
    }

    function pushMessage(text) {
      state.messages.push(text);
      if (state.messages.length > 4) {
        state.messages.shift();
      }
    }

    function updateScoreboard() {
      if (depthDisplay) {
        depthDisplay.textContent = state.depth.toString();
      }
      if (hpDisplay) {
        hpDisplay.textContent = `${state.player.hp}/${state.player.maxHp}`;
      }
      if (coinsDisplay) {
        coinsDisplay.textContent = state.player.coins.toString();
      }
      if (runDisplay) {
        runDisplay.textContent = state.run.toString();
      }
      if (messageDisplay) {
        const recent = state.messages.slice(-2).join(" • ");
        messageDisplay.textContent = recent || "Exploring...";
      }
    }

    function bfsDistances(start, grid) {
      const dist = Array.from({ length: rows }, () => Array(cols).fill(Infinity));
      const queue = [start];
      dist[start.y][start.x] = 0;
      while (queue.length > 0) {
        const current = queue.shift();
        directions.forEach(({ dx, dy }) => {
          const nx = current.x + dx;
          const ny = current.y + dy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) {
            return;
          }
          if (grid[ny][nx] !== "floor") {
            return;
          }
          if (dist[ny][nx] !== Infinity) {
            return;
          }
          dist[ny][nx] = dist[current.y][current.x] + 1;
          queue.push({ x: nx, y: ny });
        });
      }
      return dist;
    }

    function generateFloor(isNewRun = false) {
      let attempt = 0;
      let generated = false;
      while (!generated && attempt < 12) {
        attempt += 1;
        const grid = Array.from({ length: rows }, () => Array(cols).fill("wall"));
        let cx = Math.floor(cols / 2);
        let cy = Math.floor(rows / 2);
        grid[cy][cx] = "floor";
        const carveSteps = cols * rows * 4;
        for (let i = 0; i < carveSteps; i += 1) {
          const { dx, dy } = directions[Math.floor(Math.random() * directions.length)];
          cx = Math.max(1, Math.min(cols - 2, cx + dx));
          cy = Math.max(1, Math.min(rows - 2, cy + dy));
          grid[cy][cx] = "floor";
        }
        const floors = [];
        for (let y = 0; y < rows; y += 1) {
          for (let x = 0; x < cols; x += 1) {
            if (grid[y][x] === "floor") {
              floors.push({ x, y });
            }
          }
        }
        if (floors.length < cols * rows * 0.35) {
          continue;
        }
        const start = floors[Math.floor(Math.random() * floors.length)];
        const distances = bfsDistances(start, grid);
        let farthest = start;
        let maxDist = 0;
        floors.forEach((cell) => {
          const d = distances[cell.y][cell.x];
          if (Number.isFinite(d) && d > maxDist) {
            maxDist = d;
            farthest = cell;
          }
        });
        if (!Number.isFinite(maxDist) || maxDist < Math.floor(Math.min(cols, rows) / 2)) {
          continue;
        }
        generated = true;
        state.grid = grid;
        state.player.x = start.x;
        state.player.y = start.y;
        state.exit = { x: farthest.x, y: farthest.y };
        if (isNewRun) {
          state.player.hp = state.player.maxHp;
          state.player.coins = 0;
        } else {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
        }
        const used = new Set([`${start.x},${start.y}`, `${state.exit.x},${state.exit.y}`]);
        const pickups = [];
        const coinsToPlace = Math.min(10, 4 + state.depth);
        const heartsToPlace = Math.max(1, Math.floor(state.depth / 2));
        function placePickup(type) {
          for (let tries = 0; tries < 20; tries += 1) {
            const tile = floors[Math.floor(Math.random() * floors.length)];
            const key = `${tile.x},${tile.y}`;
            if (used.has(key)) {
              continue;
            }
            used.add(key);
            pickups.push({ x: tile.x, y: tile.y, type });
            return;
          }
        }
        for (let i = 0; i < coinsToPlace; i += 1) {
          placePickup("coin");
        }
        for (let i = 0; i < heartsToPlace; i += 1) {
          placePickup("heart");
        }
        state.pickups = pickups;
        const enemies = [];
        const enemyCount = Math.min(12, 3 + state.depth);
        for (let i = 0; i < enemyCount; i += 1) {
          for (let tries = 0; tries < 30; tries += 1) {
            const tile = floors[Math.floor(Math.random() * floors.length)];
            const key = `${tile.x},${tile.y}`;
            if (used.has(key)) {
              continue;
            }
            used.add(key);
            const baseHp = 1 + Math.floor(state.depth / 4);
            enemies.push({
              x: tile.x,
              y: tile.y,
              hp: baseHp,
              maxHp: baseHp,
              damage: 1 + Math.floor(state.depth / 6),
            });
            break;
          }
        }
        state.enemies = enemies;
        pushMessage(
          isNewRun
            ? "A fresh delve begins."
            : `Depth ${state.depth} unfolds—Oliver gains a moment of calm.`
        );
      }
      if (!generated) {
        const grid = Array.from({ length: rows }, () => Array(cols).fill("floor"));
        for (let x = 0; x < cols; x += 1) {
          grid[0][x] = "wall";
          grid[rows - 1][x] = "wall";
        }
        for (let y = 0; y < rows; y += 1) {
          grid[y][0] = "wall";
          grid[y][cols - 1] = "wall";
        }
        state.grid = grid;
        state.player.x = Math.floor(cols / 2);
        state.player.y = Math.floor(rows / 2);
        if (isNewRun) {
          state.player.hp = state.player.maxHp;
          state.player.coins = 0;
        } else {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
        }
        state.exit = { x: cols - 2, y: rows - 2 };
        state.pickups = [
          { x: 2, y: 2, type: "heart" },
          { x: cols - 3, y: 2, type: "coin" },
        ];
        state.enemies = [];
        pushMessage("The vault reluctantly reshapes itself into an open hall.");
      }
      updateScoreboard();
    }

    function tileBlocked(x, y) {
      if (x < 0 || x >= cols || y < 0 || y >= rows) {
        return true;
      }
      return state.grid[y][x] !== "floor";
    }

    function enemyAt(x, y) {
      return state.enemies.find((enemy) => enemy.x === x && enemy.y === y);
    }

    function pickupAt(x, y) {
      return state.pickups.find((item) => item.x === x && item.y === y);
    }

    function consumeInput() {
      while (keyQueue.length > 0) {
        const key = keyQueue.shift();
        if (moveCommands[key]) {
          return moveCommands[key];
        }
      }
      return null;
    }

    function handlePickup(item) {
      if (!item) {
        return;
      }
      if (item.type === "coin") {
        state.player.coins += 1;
        pushMessage("Radiant shard gathered.");
      } else if (item.type === "heart") {
        if (state.player.hp < state.player.maxHp) {
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
          pushMessage("Oliver's heart glows brighter.");
        } else {
          state.player.coins += 1;
          pushMessage("Spare warmth crystallises into treasure.");
        }
      }
      state.pickups = state.pickups.filter((it) => it !== item);
    }

    function handlePlayerTurn(command) {
      if (!command) {
        return false;
      }
      const { dx, dy, wait } = command;
      if (wait) {
        pushMessage("Oliver pauses to listen to the vault.");
        return true;
      }
      const targetX = state.player.x + dx;
      const targetY = state.player.y + dy;
      if (tileBlocked(targetX, targetY)) {
        pushMessage("A radiant wall blocks the way.");
        return false;
      }
      const foe = enemyAt(targetX, targetY);
      if (foe) {
        foe.hp -= 2;
        pushMessage("Oliver strikes with luminous resolve!");
        if (foe.hp <= 0) {
          state.enemies = state.enemies.filter((enemy) => enemy !== foe);
          state.player.coins += 2;
          pushMessage("The foe dissolves into stardust.");
        }
        return true;
      }
      state.player.x = targetX;
      state.player.y = targetY;
      const item = pickupAt(targetX, targetY);
      if (item) {
        handlePickup(item);
      }
      if (state.player.x === state.exit.x && state.player.y === state.exit.y) {
        state.depth += 1;
        generateFloor(false);
      }
      return true;
    }

    function moveEnemy(enemy) {
      const dx = state.player.x - enemy.x;
      const dy = state.player.y - enemy.y;
      const stepOptions = [];
      if (Math.abs(dx) > Math.abs(dy)) {
        stepOptions.push({ dx: Math.sign(dx), dy: 0 });
        stepOptions.push({ dx: 0, dy: Math.sign(dy) });
      } else {
        stepOptions.push({ dx: 0, dy: Math.sign(dy) });
        stepOptions.push({ dx: Math.sign(dx), dy: 0 });
      }
      stepOptions.push({ dx: -stepOptions[0].dx, dy: -stepOptions[0].dy });
      stepOptions.push({ dx: -stepOptions[1]?.dx ?? 0, dy: -stepOptions[1]?.dy ?? 0 });

      for (let i = 0; i < stepOptions.length; i += 1) {
        const option = stepOptions[i];
        const targetX = enemy.x + option.dx;
        const targetY = enemy.y + option.dy;
        if (targetX === state.player.x && targetY === state.player.y) {
          state.player.hp -= enemy.damage;
          state.damageFlash = 0.6;
          pushMessage("An echo lashes out! Oliver endures.");
          return;
        }
        if (tileBlocked(targetX, targetY)) {
          continue;
        }
        if (enemyAt(targetX, targetY)) {
          continue;
        }
        enemy.x = targetX;
        enemy.y = targetY;
        return;
      }
    }

    function enemiesAct() {
      state.enemies.forEach((enemy) => moveEnemy(enemy));
      if (state.player.hp <= 0) {
        pushMessage("Oliver's light fades... but hope reignites.");
        state.run += 1;
        state.depth = 1;
        state.player.hp = state.player.maxHp;
        state.player.coins = 0;
        generateFloor(true);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const px = x * cellSize;
          const py = y * cellSize;
          if (state.grid[y][x] === "floor") {
            ctx.drawImage(floorSprite, px, py, cellSize, cellSize);
          } else {
            ctx.drawImage(wallSprite, px, py, cellSize, cellSize);
          }
        }
      }

      ctx.drawImage(exitSprite, state.exit.x * cellSize, state.exit.y * cellSize, cellSize, cellSize);

      state.pickups.forEach((item) => {
        const px = item.x * cellSize + cellSize * 0.15;
        const py = item.y * cellSize + cellSize * 0.15;
        const sprite = item.type === "coin" ? coinSprite : heartSprite;
        ctx.drawImage(sprite, px, py);
      });

      const enemySprite = enemySpriteForDepth();
      state.enemies.forEach((enemy) => {
        const px = enemy.x * cellSize + cellSize * 0.12;
        const py = enemy.y * cellSize + cellSize * 0.12;
        ctx.drawImage(enemySprite, px, py);
      });

      const playerPx = state.player.x * cellSize + cellSize * 0.1;
      const playerPy = state.player.y * cellSize + cellSize * 0.1;
      if (state.damageFlash > 0) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.drawImage(getRaymondSprite("rgba(255,80,80,0.6)", cellSize * 0.9, cellSize * 0.9), playerPx, playerPy);
        ctx.restore();
      }
      ctx.drawImage(playerSprite, playerPx, playerPy);
    }

    function update(dt) {
      state.damageFlash = Math.max(0, state.damageFlash - dt);
      const command = consumeInput();
      if (command) {
        const acted = handlePlayerTurn(command);
        if (acted) {
          enemiesAct();
        }
        updateScoreboard();
      }
    }

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    generateFloor(true);
    updateScoreboard();
    requestAnimationFrame(loop);
  }

  // Oliver's Orbit
  function startOliversOrbit() {
    const canvas = document.getElementById("orbit-canvas");
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }
    enableHighQuality(ctx);

    const stageDisplay = document.querySelector("[data-orbit-stage]");
    const messageDisplay = document.querySelector("[data-orbit-message]");
    const stageSelect = document.querySelector("[data-orbit-stage-select]");
    const exportButton = document.querySelector("[data-orbit-export]");
    const importButton = document.querySelector("[data-orbit-import]");
    const importInput = document.querySelector("[data-orbit-import-input]");
    const ORBIT_STORAGE_KEY = "oliversOrbitProgress";

    const width = canvas.width;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    const height = canvas.height;
    const launchPoint = { x: 150, y: height / 2 };
    const COMET_RADIUS = 18;
    const MIN_PLANET_RADIUS = 24;
    const MAX_PLANET_RADIUS = 60;
    const GOAL_RADIUS = Math.max(6, COMET_RADIUS - 6);
    const GRAVITY_CONSTANT = 5200;
    const SOFTENING = 5200;
    const MIN_LAUNCH_SPEED = 120;
    const MAX_LAUNCH_SPEED = 520;
    const ANGLE_RATE = Math.PI * 0.9;
    const SPEED_RATE = 240;
    const MAX_COMET_SPEED = MAX_LAUNCH_SPEED * 3;
    let baseLaunchSpeed = 170;
    let launchAngle = 0;

    function clamp(value, min, max) {
      if (!Number.isFinite(value)) {
        return min;
      }
      return Math.min(max, Math.max(min, value));
    }

    function roundTo(value, decimals = 3) {
      if (!Number.isFinite(value)) {
        return 0;
      }
      const factor = 10 ** decimals;
      return Math.round(value * factor) / factor;
    }

    function normalizeAngle(angle) {
      if (!Number.isFinite(angle)) {
        return 0;
      }
      const twoPi = Math.PI * 2;
      return ((angle + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
    }

    const planetSprite = getRaymondSprite("rgba(249,168,38,0.35)", 120, 120);
    const cometSprite = getRaymondSprite("rgba(255,255,255,0.78)", COMET_RADIUS * 2.4, COMET_RADIUS * 2.4);
    const goalSprite = getRaymondSprite("rgba(255,255,255,0.82)", GOAL_RADIUS * 2.4, GOAL_RADIUS * 2.4);

    const planets = [];
    const goals = [];
    let originalGoals = [];

    let stageNumber = 1;
    let highestStageUnlocked = 1;
    let activePlanet = null;
    let dragOffset = { x: 0, y: 0 };
    let comet = null;
    let lastSpacePressed = false;
    let victoryOverlay = null;

    const storedProgress = (() => {
      try {
        const raw = localStorage.getItem(ORBIT_STORAGE_KEY);
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (!Number.isFinite(parsed.stage) || !Number.isFinite(parsed.highestStage)) {
          return null;
        }
        const stage = Math.max(1, Math.floor(parsed.stage));
        const highest = Math.max(1, Math.floor(parsed.highestStage));
        return {
          stage: Math.min(stage, highest),
          highest,
          launchSpeed: Number.isFinite(parsed.launchSpeed) ? clamp(parsed.launchSpeed, MIN_LAUNCH_SPEED, MAX_LAUNCH_SPEED) : null,
          launchAngle: Number.isFinite(parsed.launchAngle) ? parsed.launchAngle : null,
        };
      } catch (error) {
        return null;
      }
    })();

    if (storedProgress) {
      stageNumber = storedProgress.stage;
      highestStageUnlocked = Math.max(storedProgress.highest, stageNumber);
      if (storedProgress.launchSpeed !== null) {
        baseLaunchSpeed = storedProgress.launchSpeed;
      }
      if (storedProgress.launchAngle !== null) {
        launchAngle = storedProgress.launchAngle;
      }
    }
    baseLaunchSpeed = clamp(baseLaunchSpeed, MIN_LAUNCH_SPEED, MAX_LAUNCH_SPEED);
    launchAngle = normalizeAngle(launchAngle);

    syncStageSelect();

    if (stageSelect) {
      stageSelect.addEventListener("change", () => {
        const selectedStage = Number(stageSelect.value);
        if (!Number.isFinite(selectedStage) || selectedStage < 1) {
          stageSelect.value = String(stageNumber);
          return;
        }
        if (selectedStage === stageNumber) {
          return;
        }
        startStage(selectedStage);
        updateScoreboard(`Stage ${stageNumber}: restored from checkpoints.`);
      });
    }

    if (exportButton) {
      exportButton.addEventListener("click", () => {
        try {
          exportOrbitLayout();
          updateScoreboard("Current layout downloaded—share the constellation!");
        } catch (error) {
          updateScoreboard("Unable to download layout—please try again.");
        }
      });
    }

    if (importButton && importInput) {
      importButton.addEventListener("click", () => {
        importInput.click();
      });
      importInput.addEventListener("change", () => {
        const [file] = importInput.files ?? [];
        if (!file) {
          return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          try {
            const text = typeof reader.result === "string" ? reader.result : "";
            const parsed = JSON.parse(text);
            applyOrbitLayout(parsed);
          } catch (error) {
            updateScoreboard("Unable to load layout—check the file and try again.");
          } finally {
            importInput.value = "";
          }
        });
        reader.onerror = () => {
          updateScoreboard("Unable to read the selected file.");
          importInput.value = "";
        };
        reader.readAsText(file);
      });
    }

    function randomPlanetRadius() {
      return MIN_PLANET_RADIUS + Math.random() * (MAX_PLANET_RADIUS - MIN_PLANET_RADIUS);
    }

    function randomPlanetMass(radius) {
      return 900 + radius * 45;
    }

    function updateScoreboard(message) {
      if (stageDisplay) {
        stageDisplay.textContent = String(stageNumber);
      }
      if (message !== undefined && messageDisplay) {
        messageDisplay.textContent = message;
      }
    }

    function persistProgress() {
      try {
        const payload = JSON.stringify({
          stage: stageNumber,
          highestStage: highestStageUnlocked,
          launchSpeed: baseLaunchSpeed,
          launchAngle,
        });
        localStorage.setItem(ORBIT_STORAGE_KEY, payload);
      } catch (error) {
        // Ignore storage failures (private browsing, etc.)
      }
    }

    function ensureVictoryOverlay() {
      if (victoryOverlay) {
        return victoryOverlay;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "orbit-portal";
      wrapper.innerHTML = `
        <div class="orbit-portal__backdrop"></div>
        <div class="orbit-portal__dialog" role="dialog" aria-modal="true" aria-live="assertive">
          <h3 class="orbit-portal__title">Oliver’s radiance salutes your orbit!</h3>
          <p class="orbit-portal__message">
            You braided the comet through every beacon of devotion. Oliver’s constellation gleams brighter because of you.
          </p>
          <div class="orbit-portal__actions">
            <button type="button" class="arcade-button" data-orbit-portal-download>Download this layout</button>
            <button type="button" class="arcade-button arcade-button--primary" data-orbit-portal-next>Guide the comet onward</button>
          </div>
        </div>
      `;
      const downloadBtn = wrapper.querySelector("[data-orbit-portal-download]");
      const nextBtn = wrapper.querySelector("[data-orbit-portal-next]");
      if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
          try {
            exportOrbitLayout();
            updateScoreboard("Layout saved—Oliver treasures your trajectory.");
          } catch (error) {
            updateScoreboard("Unable to save this orbit—try again.");
          }
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          hideVictoryOverlay();
          advanceStage();
        });
      }
      victoryOverlay = wrapper;
      return wrapper;
    }

    function showVictoryOverlay() {
      const overlay = ensureVictoryOverlay();
      if (!overlay.parentElement) {
        canvas.parentElement?.appendChild(overlay);
      }
      overlay.classList.add("is-visible");
    }

    function hideVictoryOverlay() {
      if (victoryOverlay) {
        victoryOverlay.classList.remove("is-visible");
      }
    }

    function syncStageSelect() {
      if (!stageSelect) {
        return;
      }
      const targetHighest = Math.max(1, highestStageUnlocked);
      const fragment = document.createDocumentFragment();
      for (let optionStage = 1; optionStage <= targetHighest; optionStage += 1) {
        const option = document.createElement("option");
        option.value = String(optionStage);
        option.textContent = `Stage ${optionStage}`;
        fragment.appendChild(option);
      }
      stageSelect.innerHTML = "";
      stageSelect.appendChild(fragment);
      stageSelect.value = String(stageNumber);
      stageSelect.disabled = targetHighest <= 1;
    }

    function captureOrbitLayout() {
      const goalsSnapshot = (originalGoals.length ? originalGoals : goals).map((goal) => ({
        x: roundTo(goal.x),
        y: roundTo(goal.y),
        radius: roundTo(goal.radius),
      }));
      return {
        version: 1,
        stage: stageNumber,
        launchSpeed: roundTo(baseLaunchSpeed),
        launchAngle: roundTo(normalizeAngle(launchAngle), 4),
        planets: planets.map((planet) => ({
          x: roundTo(planet.x),
          y: roundTo(planet.y),
          radius: roundTo(planet.radius),
          mass: roundTo(planet.mass),
        })),
        goals: goalsSnapshot,
      };
    }

    function exportOrbitLayout() {
      const layout = captureOrbitLayout();
      const serialized = `${JSON.stringify(layout, null, 2)}\n`;
      const blob = new Blob([serialized], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `olivers-orbit-stage-${stageNumber}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }

    function applyOrbitLayout(layout) {
      if (!layout || !Array.isArray(layout.planets) || !Array.isArray(layout.goals)) {
        throw new Error("Invalid layout payload.");
      }

      const layoutStage = Math.max(1, Math.floor(Number(layout.stage) || stageNumber));
      const sanitizedPlanets = layout.planets.map((planet) => {
        const x = Number(planet.x);
        const y = Number(planet.y);
        const radius = Number(planet.radius);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) {
          throw new Error("Invalid planet data.");
        }
        const mass = Number(planet.mass);
        return {
          x,
          y,
          radius,
          mass: Number.isFinite(mass) && mass > 0 ? mass : randomPlanetMass(radius),
        };
      });

      const sanitizedGoals = layout.goals.map((goal) => {
        const x = Number(goal.x);
        const y = Number(goal.y);
        const radius = Number(goal.radius);
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) {
          throw new Error("Invalid goal data.");
        }
        return { x, y, radius };
      });

      const importedSpeed = Number(layout.launchSpeed);
      const resolvedSpeed = Number.isFinite(importedSpeed)
        ? clamp(importedSpeed, MIN_LAUNCH_SPEED, MAX_LAUNCH_SPEED)
        : baseLaunchSpeed;
      const importedAngle = Number(layout.launchAngle);
      const resolvedAngle = Number.isFinite(importedAngle)
        ? normalizeAngle(importedAngle)
        : launchAngle;

      stageNumber = layoutStage;
      highestStageUnlocked = Math.max(highestStageUnlocked, stageNumber);
      baseLaunchSpeed = resolvedSpeed;
      launchAngle = normalizeAngle(resolvedAngle);

      planets.length = 0;
      planets.push(...sanitizedPlanets);
      goals.length = 0;
      goals.push(...sanitizedGoals);
      originalGoals = goals.map((goal) => ({ ...goal }));
      resetComet();
      hideVictoryOverlay();
      syncStageSelect();
      persistProgress();
      updateScoreboard(`Stage ${stageNumber}: custom layout loaded.`);
    }

    function isPlanetPlacementValid(x, y, radius, ignorePlanet) {
      if (x - radius < 0 || x + radius > width || y - radius < 0 || y + radius > height) {
        return false;
      }
      if (Math.hypot(x - launchPoint.x, y - launchPoint.y) < radius + 60) {
        return false;
      }
      if (goals.some((goal) => Math.hypot(x - goal.x, y - goal.y) <= radius + goal.radius)) {
        return false;
      }
      return planets.every((planet) => {
        if (planet === ignorePlanet) {
          return true;
        }
        return Math.hypot(x - planet.x, y - planet.y) > planet.radius + radius;
      });
    }

    function findPlanetPlacement(radius) {
      for (let attempt = 0; attempt < 220; attempt += 1) {
        const candidateX = radius + 40 + Math.random() * (width - radius * 2 - 80);
        const candidateY = radius + 40 + Math.random() * (height - radius * 2 - 80);
        if (isPlanetPlacementValid(candidateX, candidateY, radius, null)) {
          return { x: candidateX, y: candidateY };
        }
      }
      return null;
    }

    function addPlanet(radius) {
      const placement = findPlanetPlacement(radius);
      if (!placement) {
        return false;
      }
      planets.push({ x: placement.x, y: placement.y, radius, mass: randomPlanetMass(radius) });
      return true;
    }

    function generatePlanets(count) {
      planets.length = 0;
      let attempts = count * 24;
      while (planets.length < count && attempts > 0) {
        attempts -= 1;
        const radius = randomPlanetRadius();
        if (!addPlanet(radius) && attempts % 4 === 0) {
          addPlanet(MIN_PLANET_RADIUS);
        }
      }
      while (planets.length < count) {
        if (!addPlanet(MIN_PLANET_RADIUS)) {
          break;
        }
      }
    }

    function spawnGoals() {
      goals.length = 0;
      const goalCount = Math.max(1, stageNumber);
      const margin = 140;
      let attempts = 0;
      while (goals.length < goalCount && attempts < goalCount * 200) {
        attempts += 1;
        const candidateX = margin + Math.random() * (width - margin * 2);
        const candidateY = margin + Math.random() * (height - margin * 2);
        if (Math.hypot(candidateX - launchPoint.x, candidateY - launchPoint.y) < COMET_RADIUS + 200) {
          continue;
        }
        if (
          planets.some((planet) => Math.hypot(candidateX - planet.x, candidateY - planet.y) <= planet.radius + GOAL_RADIUS)
        ) {
          continue;
        }
        if (goals.some((goal) => Math.hypot(candidateX - goal.x, candidateY - goal.y) <= goal.radius + GOAL_RADIUS)) {
          continue;
        }
        goals.push({ x: candidateX, y: candidateY, radius: GOAL_RADIUS });
      }
      originalGoals = goals.map((goal) => ({ ...goal }));
      updateScoreboard();
    }

    function restoreOriginalGoals() {
      goals.length = 0;
      goals.push(...originalGoals.map((goal) => ({ ...goal })));
      updateScoreboard();
    }

    function resetComet() {
      comet = {
        x: launchPoint.x,
        y: launchPoint.y,
        vx: 0,
        vy: 0,
        launched: false,
        trail: [],
      };
    }

    function resetRunPreserveGoals(message) {
      restoreOriginalGoals();
      resetComet();
      if (message) {
        updateScoreboard(message);
      }
    }

    function startStage(targetStage) {
      hideVictoryOverlay();
      stageNumber = Math.max(1, Math.floor(targetStage));
      highestStageUnlocked = Math.max(highestStageUnlocked, stageNumber);
      goals.length = 0;
      originalGoals = [];
      generatePlanets(stageNumber);
      spawnGoals();
      resetComet();
      updateScoreboard(`Stage ${stageNumber}: collect ${goals.length} goal${goals.length === 1 ? '' : 's'}.`);
      syncStageSelect();
      persistProgress();
    }

    function advanceStage() {
      startStage(stageNumber + 1);
      updateScoreboard(`Stage ${stageNumber}: new gravity wells deployed.`);
    }

    function handlePointerDown(event) {
      if (comet && comet.launched) {
        updateScoreboard("Static mode: relaunch (space) to adjust planets again.");
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      for (let i = planets.length - 1; i >= 0; i -= 1) {
        const planet = planets[i];
        const dx = x - planet.x;
        const dy = y - planet.y;
        if (Math.sqrt(dx * dx + dy * dy) <= planet.radius * 0.9) {
          activePlanet = planet;
          dragOffset = { x: dx, y: dy };
          canvas.style.cursor = "grabbing";
          break;
        }
      }
    }

    function handlePointerMove(event) {
      if (comet && comet.launched) {
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (event.clientX - rect.left) * scaleX;
      const y = (event.clientY - rect.top) * scaleY;
      if (activePlanet) {
        const candidateX = Math.max(
          activePlanet.radius,
          Math.min(width - activePlanet.radius, x - dragOffset.x)
        );
        const candidateY = Math.max(
          activePlanet.radius,
          Math.min(height - activePlanet.radius, y - dragOffset.y)
        );

        let finalX = candidateX;
        let finalY = candidateY;
        let settled = false;
        if (isPlanetPlacementValid(finalX, finalY, activePlanet.radius, activePlanet)) {
          settled = true;
        } else {
          for (const planet of planets) {
            if (planet === activePlanet) {
              continue;
            }
            const dx = finalX - planet.x;
            const dy = finalY - planet.y;
            const distance = Math.hypot(dx, dy);
            const minDistance = planet.radius + activePlanet.radius;
            if (distance === 0) {
              continue;
            }
            if (distance < minDistance) {
              const scale = minDistance / distance;
              finalX = planet.x + dx * scale;
              finalY = planet.y + dy * scale;
              finalX = Math.max(activePlanet.radius, Math.min(width - activePlanet.radius, finalX));
              finalY = Math.max(activePlanet.radius, Math.min(height - activePlanet.radius, finalY));
              if (isPlanetPlacementValid(finalX, finalY, activePlanet.radius, activePlanet)) {
                settled = true;
              }
              break;
            }
          }
        }

        if (!settled && isPlanetPlacementValid(finalX, finalY, activePlanet.radius, activePlanet)) {
          settled = true;
        }

        if (settled) {
          activePlanet.x = finalX;
          activePlanet.y = finalY;
        }
      } else {
        const hovering = planets.some((planet) => Math.hypot(x - planet.x, y - planet.y) <= planet.radius * 0.9);
        canvas.style.cursor = hovering ? "grab" : "default";
      }
    }

    function handlePointerUp() {
      activePlanet = null;
      canvas.style.cursor = "default";
    }

    canvas.addEventListener("mousedown", handlePointerDown);
    canvas.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);

    function launchComet() {
      if (!comet || comet.launched) {
        return;
      }
      const speedMultiplier = 1 + (stageNumber - 1) * 0.08;
      const speed = baseLaunchSpeed * speedMultiplier;
      comet.vx = Math.cos(launchAngle) * speed;
      comet.vy = -Math.sin(launchAngle) * speed;
      comet.launched = true;
      updateScoreboard();
    }

    function update(dt) {
      const spacePressed = keyState.has(" ");
      if (spacePressed && !lastSpacePressed) {
        if (comet && comet.launched) {
          resetRunPreserveGoals("Comet reset—goals restored.");
        } else {
          launchComet();
        }
      }
      lastSpacePressed = spacePressed;

      if (!comet) {
        resetComet();
      }

      if (comet && !comet.launched) {
        let vectorChanged = false;
        const angleDelta = ANGLE_RATE * dt;
        const speedDelta = SPEED_RATE * dt;

        const leftPressed = keyState.has("arrowleft") || keyState.has("a");
        const rightPressed = keyState.has("arrowright") || keyState.has("d");
        if (leftPressed !== rightPressed) {
          const nextAngle = normalizeAngle(launchAngle + (leftPressed ? angleDelta : -angleDelta));
          if (Math.abs(nextAngle - launchAngle) > 1e-4) {
            launchAngle = nextAngle;
            vectorChanged = true;
          }
        }

        const upPressed = keyState.has("arrowup") || keyState.has("w");
        const downPressed = keyState.has("arrowdown") || keyState.has("s");
        if (upPressed !== downPressed) {
          const nextSpeed = clamp(
            baseLaunchSpeed + (upPressed ? speedDelta : -speedDelta),
            MIN_LAUNCH_SPEED,
            MAX_LAUNCH_SPEED
          );
          if (Math.abs(nextSpeed - baseLaunchSpeed) > 1e-4) {
            baseLaunchSpeed = nextSpeed;
            vectorChanged = true;
          }
        }

        if (vectorChanged) {
          persistProgress();
        }
      }

      if (comet.launched) {
        const subSteps = Math.max(1, Math.ceil(dt / 0.01));
        const stepDt = dt / subSteps;

        for (let step = 0; step < subSteps; step += 1) {
          let ax = 0;
          let ay = 0;
          let collided = false;

          planets.forEach((planet) => {
            const dx = planet.x - comet.x;
            const dy = planet.y - comet.y;
            const distanceSq = dx * dx + dy * dy;
            const combinedRadius = planet.radius + COMET_RADIUS;
            if (distanceSq <= combinedRadius * combinedRadius) {
              collided = true;
              return;
            }

            const softened = distanceSq + SOFTENING;
            const distance = Math.sqrt(softened);
            const force = (planet.mass * GRAVITY_CONSTANT) / softened;
            ax += (force * dx) / distance;
            ay += (force * dy) / distance;
          });

          if (collided) {
            restoreOriginalGoals();
            resetRunPreserveGoals("The comet struck a planet—goals restored.");
            break;
          }

          comet.vx += ax * stepDt;
          comet.vy += ay * stepDt;

          comet.vx = Math.max(-MAX_COMET_SPEED, Math.min(MAX_COMET_SPEED, comet.vx));
          comet.vy = Math.max(-MAX_COMET_SPEED, Math.min(MAX_COMET_SPEED, comet.vy));

          comet.x += comet.vx * stepDt;
          comet.y += comet.vy * stepDt;

          comet.trail.push({ x: comet.x, y: comet.y });
          if (comet.trail.length > 220) {
            comet.trail.shift();
          }

          for (let g = goals.length - 1; g >= 0; g -= 1) {
            const goal = goals[g];
            if (Math.hypot(comet.x - goal.x, comet.y - goal.y) <= COMET_RADIUS + goal.radius) {
              goals.splice(g, 1);
              updateScoreboard(goals.length ? "Goal captured—keep going!" : "All goals cleared—deploying new targets.");
              if (goals.length === 0) {
                showVictoryOverlay();
              }
              break;
            }
          }

          if (
            comet.x < -180 ||
            comet.x > width + 180 ||
            comet.y < -180 ||
            comet.y > height + 180
          ) {
            resetRunPreserveGoals("The comet drifted away—recalibrate and relaunch.");
            break;
          }
        }
      } else {
        comet.x = launchPoint.x;
        comet.y = launchPoint.y;
        comet.trail = [];
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = createPattern(ctx, 56, "rgba(12,18,36,0.55)");
      ctx.fillRect(0, 0, width, height);

      goals.forEach((goal) => {
        drawCircleSprite(ctx, goalSprite, goal.x, goal.y, goal.radius);
      });

      planets.forEach((planet) => {
        drawCircleSprite(ctx, planetSprite, planet.x, planet.y, planet.radius);
      });

      ctx.strokeStyle = "rgba(249,168,38,0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(launchPoint.x, launchPoint.y, 24, 0, Math.PI * 2);
      ctx.stroke();

      if (comet && !comet.launched) {
        const normalizedPower =
          (baseLaunchSpeed - MIN_LAUNCH_SPEED) / Math.max(1, MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED);
        const indicatorLength = 80 + normalizedPower * 140;
        const dirX = Math.cos(launchAngle);
        const dirY = -Math.sin(launchAngle);
        const endX = launchPoint.x + dirX * indicatorLength;
        const endY = launchPoint.y + dirY * indicatorLength;

        ctx.save();
        ctx.strokeStyle = "rgba(249,168,38,0.85)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(launchPoint.x, launchPoint.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.save();
        ctx.translate(endX, endY);
        ctx.rotate(Math.atan2(dirY, dirX));
        ctx.fillStyle = "rgba(249,168,38,0.9)";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-16, 7);
        ctx.lineTo(-16, -7);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        ctx.restore();
      }

      if (comet && comet.trail.length > 1) {
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(comet.trail[0].x, comet.trail[0].y);
        for (let i = 1; i < comet.trail.length; i += 1) {
          ctx.lineTo(comet.trail[i].x, comet.trail[i].y);
        }
        ctx.stroke();
      }

      drawCircleSprite(ctx, cometSprite, comet.x, comet.y, COMET_RADIUS);
    }

    canvas.addEventListener("mouseleave", () => {
      if (!activePlanet) {
        canvas.style.cursor = "default";
      }
    });

    startStage(stageNumber);
    updateScoreboard("Planets lock after launch—position them, aim with A/D or ←/→, boost with W/S or ↑/↓, then press space.");

    let last = performance.now();
    function loop(timestamp) {
      const delta = (timestamp - last) / 1000;
      last = timestamp;
      update(delta);
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

}
