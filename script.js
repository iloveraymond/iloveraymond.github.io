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
  window.addEventListener(
    "keydown",
    (event) => {
      const key = event.key.toLowerCase();
      if (key === " " || key.startsWith("arrow")) {
        event.preventDefault();
      }
      keyState.add(key);
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
  let gamesStarted = false;
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

  function startGames() {
    if (gamesStarted) {
      return;
    }
    gamesStarted = true;
    startRaymondPong();
    startStellarZarak();
    startRaymondCascade();
  }

  raymondImage.addEventListener("load", startGames);
  if (raymondImage.complete) {
    startGames();
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
        projectile.x =
          (projectile.x + Math.cos(projectile.angle) * projectile.speed * dt + state.width) % state.width;
        projectile.y =
          (projectile.y + Math.sin(projectile.angle) * projectile.speed * dt + state.height) % state.height;
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
}
