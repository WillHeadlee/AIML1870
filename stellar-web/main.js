// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fill window
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Configuration (for non-gameplay visuals)
const config = {
    nodeCount: 0,
    trailLength: 50,
    nodeHue: 200, // Blue hue for basic nodes (0-360)
    paused: false
};

// Game State
const gameState = {
    money: 100,
    moneyPerSecond: 0,
    darkMatter: 0,
    totalMoneyEarned: 0,
    totalBounces: 0,
    totalPrestiges: 0,
    maxSimultaneousEdges: 0,

    // Upgrades (levels)
    upgrades: {
        nodeLimit: 3,          // Starting with 3 node limit
        bounceValue: 1,        // Level 1 = $5 per bounce
        edgeValue: 1,          // Level 1 = $1 per edge per second
        speed: 1,              // Level 1 = 1.0x speed
        connectivity: 1,       // Level 1 = 150 radius
        nodeSize: 1            // Level 1 = 4 size
    },

    // Dark Matter purchases
    darkMatterUpgrades: {
        incomeMultiplier: 0,   // 10% per level
        startingNodes: 0,      // +1 node limit at start
        magnetNodeUnlocked: false,
        goldenNodeUnlocked: false
    },

    // Achievements
    achievements: {
        firstContact: false,
        bouncy: false,
        webWeaver: false,
        network: false,
        millionaire: false,
        darkCollector: false,
        prestigeMaster: false,
        fullHouse: false,
        goldenAge: false
    },

    // UI state
    selectedNodeType: 'basic',  // 'basic', 'magnet', 'golden'

    // For tracking
    currentEdgeCount: 0,
    lastEdgeIncomeTime: Date.now()
};

// Upgrade costs and formulas (rebalanced for faster progression)
const upgradeFormulas = {
    nodeLimit: (level) => Math.floor(30 * Math.pow(1.35, level - 3)),
    bounceValue: (level) => Math.floor(20 * Math.pow(1.5, level - 1)),
    edgeValue: (level) => Math.floor(25 * Math.pow(1.5, level - 1)),
    speed: (level) => Math.floor(15 * Math.pow(1.4, level - 1)),
    connectivity: (level) => Math.floor(20 * Math.pow(1.4, level - 1)),
    nodeSize: (level) => Math.floor(18 * Math.pow(1.35, level - 1))
};

// Get actual values from upgrade levels
function getBounceIncome() {
    const base = gameState.upgrades.bounceValue * 10; // $10 per level
    const multiplier = 1 + (gameState.darkMatterUpgrades.incomeMultiplier * 0.1);
    return Math.round(base * multiplier);
}

function getEdgeIncomePerSecond() {
    const base = gameState.upgrades.edgeValue * 3.0; // $3 per edge per second per level
    const multiplier = 1 + (gameState.darkMatterUpgrades.incomeMultiplier * 0.1);
    return base * multiplier;
}

function getNodeLimit() {
    return gameState.upgrades.nodeLimit + gameState.darkMatterUpgrades.startingNodes;
}

function getConnectivity() {
    return 150 + (gameState.upgrades.connectivity - 1) * 25;
}

function getNodeSize() {
    return 4 + (gameState.upgrades.nodeSize - 1) * 1;
}

function getSpeed() {
    return 1.0 + (gameState.upgrades.speed - 1) * 0.3;
}

// Income popups
const incomePopups = [];

class IncomePopup {
    constructor(x, y, amount, type = 'normal') {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.type = type; // 'normal', 'golden'
        this.alpha = 1.0;
        this.lifetime = 60; // frames
        this.age = 0;
    }

    update() {
        this.age++;
        this.y -= 1;
        this.alpha = 1 - (this.age / this.lifetime);
        return this.age < this.lifetime;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.type === 'golden' ? '#ffd700' : '#4da6ff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+$${this.amount}`, this.x, this.y);
        ctx.restore();
    }
}

// Mouse state
const mouse = {
    x: 0,
    y: 0,
    active: false
};

// Track mouse position
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
});

canvas.addEventListener('mouseleave', () => {
    mouse.active = false;
});

// Helper function to draw a star
function drawStar(ctx, x, y, radius, points = 5, innerRadius = null) {
    if (innerRadius === null) {
        innerRadius = radius * 0.4;
    }

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? radius : innerRadius;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
}

// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    h = h / 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h * 6) % 2 - 1));
    const m = l - c / 2;

    let r, g, b;
    if (h < 1/6) {
        r = c; g = x; b = 0;
    } else if (h < 2/6) {
        r = x; g = c; b = 0;
    } else if (h < 3/6) {
        r = 0; g = c; b = x;
    } else if (h < 4/6) {
        r = 0; g = x; b = c;
    } else if (h < 5/6) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255)
    ];
}

// Node class
class Node {
    constructor(x, y, z, type = 'basic') {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.z = z || Math.random() * 200 - 100; // -100 to 100
        this.type = type; // 'basic', 'magnet', 'golden'

        // Velocity
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.vz = (Math.random() - 0.5) * 0.5;

        // For tracking connections
        this.connections = [];
        this.id = Node.idCounter++;

        // For shooting star effect
        this.isShootingStar = false;
        this.shootingStarTimer = 0;

        // For trail effect
        this.trail = [];

        // For tracking bounces (to prevent double-counting)
        this.justBouncedX = false;
        this.justBouncedY = false;
        this.justBouncedZ = false;
        this.hasCollidedThisFrame = false;
    }

    update() {
        if (config.paused) return;

        // Reset collision flag
        this.hasCollidedThisFrame = false;

        // Update shooting star state
        if (this.isShootingStar) {
            this.shootingStarTimer--;
            if (this.shootingStarTimer <= 0) {
                this.isShootingStar = false;
            }
        } else {
            // Random chance to become a shooting star (very rare)
            if (Math.random() < 0.0005) {
                this.isShootingStar = true;
                this.shootingStarTimer = 60;
            }
        }

        // Speed multiplier
        const speedMultiplier = this.isShootingStar ? 5 : getSpeed();

        // Magnet node attraction
        if (this.type !== 'magnet') {
            nodes.forEach(other => {
                if (other.type === 'magnet' && other !== this) {
                    const dx = other.x - this.x;
                    const dy = other.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 200 && dist > 0) {
                        const force = 0.05 / (dist + 1);
                        this.vx += dx * force;
                        this.vy += dy * force;
                    }
                }
            });
        }

        // Update position
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;
        this.z += this.vz * speedMultiplier;

        // Reset bounce flags
        this.justBouncedX = false;
        this.justBouncedY = false;
        this.justBouncedZ = false;

        // Bounce off edges (with income generation)
        let bounced = false;
        if (this.x <= 0) {
            this.x = 0;
            this.vx = Math.abs(this.vx);
            bounced = true;
        }
        if (this.x >= canvas.width) {
            this.x = canvas.width;
            this.vx = -Math.abs(this.vx);
            bounced = true;
        }
        if (this.y <= 0) {
            this.y = 0;
            this.vy = Math.abs(this.vy);
            bounced = true;
        }
        if (this.y >= canvas.height) {
            this.y = canvas.height;
            this.vy = -Math.abs(this.vy);
            bounced = true;
        }
        if (this.z <= -100) {
            this.z = -100;
            this.vz = Math.abs(this.vz);
        }
        if (this.z >= 100) {
            this.z = 100;
            this.vz = -Math.abs(this.vz);
        }

        // Generate income from bounce
        if (bounced) {
            const bounceIncome = getBounceIncome() * (this.type === 'golden' ? 2 : 1);
            earnMoney(bounceIncome, this.x, this.y, this.type === 'golden');
            gameState.totalBounces++;
        }

        // Node-to-node collision detection
        nodes.forEach(other => {
            if (other === this) return;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = getNodeSize() * 2;

            if (dist < minDist && dist > 0) {
                // Collision detected - bounce nodes apart
                const angle = Math.atan2(dy, dx);
                const targetX = this.x + Math.cos(angle) * minDist;
                const targetY = this.y + Math.sin(angle) * minDist;

                const ax = (targetX - other.x) * 0.1;
                const ay = (targetY - other.y) * 0.1;

                this.vx -= ax;
                this.vy -= ay;
                other.vx += ax;
                other.vy += ay;

                // Generate small income from node collision
                if (!this.hasCollidedThisFrame && !other.hasCollidedThisFrame) {
                    const collisionIncome = Math.floor(getBounceIncome() * 0.5) * (this.type === 'golden' ? 2 : 1);
                    if (collisionIncome > 0) {
                        earnMoney(collisionIncome, (this.x + other.x) / 2, (this.y + other.y) / 2, this.type === 'golden');
                    }
                    this.hasCollidedThisFrame = true;
                }
            }
        });

        // Apply slight damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        this.vz *= 0.99;

        // Add random motion
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
        this.vz += (Math.random() - 0.5) * 0.02;

        // Update trail
        if (config.trailLength > 0) {
            this.trail.push({ x: this.x, y: this.y, z: this.z });
            const maxTrailLength = Math.floor(config.trailLength / 5);
            if (this.trail.length > maxTrailLength) {
                this.trail.shift();
            }
        } else {
            this.trail = [];
        }
    }

    draw(breathingPhase, hoveredNode) {
        // Calculate depth-based size and opacity
        const depthScale = 1 + (this.z / 200); // 0.5 to 1.5
        const size = getNodeSize() * depthScale;
        const baseOpacity = 0.4 + (this.z + 100) / 400; // 0.4 to 0.9

        // Node type colors
        let nodeColor, glowColor;
        switch (this.type) {
            case 'magnet':
                nodeColor = [160, 80, 255]; // Purple
                glowColor = [160, 80, 255];
                break;
            case 'golden':
                nodeColor = [255, 215, 0]; // Gold
                glowColor = [255, 215, 0];
                break;
            default:
                // Use HSL color from config for basic nodes
                const hue = config.nodeHue;
                const hslColor = `hsl(${hue}, 80%, 70%)`;
                const hslGlow = `hsl(${hue}, 60%, 80%)`;
                // Convert to RGB for compatibility with existing code
                nodeColor = hslToRgb(hue, 0.8, 0.7);
                glowColor = hslToRgb(hue, 0.6, 0.8);
        }

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = `rgba(${nodeColor[0]}, ${nodeColor[1]}, ${nodeColor[2]}, 0.1)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.1;
                ctx.strokeStyle = `rgba(${nodeColor[0]}, ${nodeColor[1]}, ${nodeColor[2]}, ${alpha})`;
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
            }
            ctx.stroke();
        }

        // Calculate glow intensity based on connections and breathing
        const connectionGlow = Math.min(this.connections.length / 10, 1);
        const breathingGlow = 0.5 + Math.sin(breathingPhase) * 0.3;
        const glowIntensity = (connectionGlow * 0.7 + 0.3) * breathingGlow;

        // Highlight if this is the most connected node
        const isMostConnected = hoveredNode === null && this === mostConnectedNode;
        const isHovered = hoveredNode === this;

        // Draw glow
        const glowSize = size * (2 + glowIntensity);
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);

        if (isMostConnected) {
            gradient.addColorStop(0, `rgba(77, 166, 255, ${baseOpacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(77, 166, 255, ${baseOpacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(77, 166, 255, 0)');
        } else if (isHovered) {
            gradient.addColorStop(0, `rgba(255, 255, 100, ${baseOpacity * 0.8})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 100, ${baseOpacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
        } else {
            gradient.addColorStop(0, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${baseOpacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${baseOpacity * 0.2})`);
            gradient.addColorStop(1, `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, 0)`);
        }

        ctx.fillStyle = gradient;
        drawStar(ctx, this.x, this.y, glowSize);
        ctx.fill();

        // Draw core node star
        ctx.fillStyle = isMostConnected
            ? `rgba(77, 166, 255, ${baseOpacity})`
            : isHovered
            ? `rgba(255, 255, 100, ${baseOpacity})`
            : `rgba(${nodeColor[0]}, ${nodeColor[1]}, ${nodeColor[2]}, ${baseOpacity})`;
        drawStar(ctx, this.x, this.y, size);
        ctx.fill();

        // Shooting star trail
        if (this.isShootingStar) {
            ctx.strokeStyle = `rgba(${nodeColor[0]}, ${nodeColor[1]}, ${nodeColor[2]}, 0.3)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - this.vx * 10, this.y - this.vy * 10);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
        }
    }
}

Node.idCounter = 0;

// Initialize nodes
let nodes = [];
let mostConnectedNode = null;

function initNodes() {
    nodes = [];
    Node.idCounter = 0;
    for (let i = 0; i < config.nodeCount; i++) {
        nodes.push(new Node());
    }
}

initNodes();

// Game Functions

function earnMoney(amount, x, y, isGolden = false) {
    gameState.money += amount;
    gameState.totalMoneyEarned += amount;
    incomePopups.push(new IncomePopup(x, y, Math.round(amount), isGolden ? 'golden' : 'normal'));
    checkAchievements();
}

function canAffordUpgrade(upgradeName) {
    const level = gameState.upgrades[upgradeName];
    const cost = upgradeFormulas[upgradeName](level + 1);
    return gameState.money >= cost;
}

function buyUpgrade(upgradeName) {
    if (!canAffordUpgrade(upgradeName)) return false;

    const level = gameState.upgrades[upgradeName];
    const cost = upgradeFormulas[upgradeName](level + 1);

    gameState.money -= cost;
    gameState.upgrades[upgradeName]++;

    // Apply upgrade effects immediately
    if (upgradeName === 'connectivity') {
        config.connectivity = getConnectivity();
    }

    updateUpgradeDisplay();
    saveGame();
    return true;
}

function calculateDarkMatterGain() {
    // Formula: sqrt(totalMoneyEarned / 100000)
    return Math.floor(Math.sqrt(gameState.totalMoneyEarned / 100000));
}

function prestige() {
    const dmGain = calculateDarkMatterGain();
    if (dmGain <= 0) return false;

    gameState.darkMatter += dmGain;
    gameState.totalPrestiges++;

    // Reset run-specific progress
    gameState.money = 100;
    gameState.totalMoneyEarned = 0;
    gameState.totalBounces = 0;
    gameState.upgrades = {
        nodeLimit: 3 + gameState.darkMatterUpgrades.startingNodes,
        bounceValue: 1,
        edgeValue: 1,
        speed: 1,
        connectivity: 1,
        nodeSize: 1
    };

    // Clear all nodes
    nodes = [];
    Node.idCounter = 0;
    config.nodeCount = 0;

    saveGame();
    updateAllDisplays();
    showNotification(`Prestige! Gained ${dmGain} Dark Matter ◈`);
    checkAchievements();
    return true;
}

function buyDarkMatterUpgrade(upgradeName) {
    let cost = 0;
    let canBuy = false;

    switch (upgradeName) {
        case 'incomeMultiplier':
            cost = Math.floor(5 * Math.pow(1.5, gameState.darkMatterUpgrades.incomeMultiplier));
            canBuy = gameState.darkMatter >= cost;
            if (canBuy) {
                gameState.darkMatter -= cost;
                gameState.darkMatterUpgrades.incomeMultiplier++;
            }
            break;
        case 'startingNodes':
            cost = Math.floor(10 * Math.pow(2, gameState.darkMatterUpgrades.startingNodes));
            canBuy = gameState.darkMatter >= cost;
            if (canBuy) {
                gameState.darkMatter -= cost;
                gameState.darkMatterUpgrades.startingNodes++;
                gameState.upgrades.nodeLimit++;
            }
            break;
        case 'magnetNode':
            cost = 20;
            canBuy = !gameState.darkMatterUpgrades.magnetNodeUnlocked && gameState.darkMatter >= cost;
            if (canBuy) {
                gameState.darkMatter -= cost;
                gameState.darkMatterUpgrades.magnetNodeUnlocked = true;
                showNotification('Magnet Nodes Unlocked!');
            }
            break;
        case 'goldenNode':
            cost = 50;
            canBuy = !gameState.darkMatterUpgrades.goldenNodeUnlocked && gameState.darkMatter >= cost;
            if (canBuy) {
                gameState.darkMatter -= cost;
                gameState.darkMatterUpgrades.goldenNodeUnlocked = true;
                showNotification('Golden Nodes Unlocked!');
            }
            break;
    }

    if (canBuy) {
        saveGame();
        updateAllDisplays();
    }
    return canBuy;
}

// Achievement checking
function checkAchievements() {
    const a = gameState.achievements;

    if (!a.firstContact && gameState.currentEdgeCount >= 1) {
        a.firstContact = true;
        earnMoney(100, canvas.width / 2, canvas.height / 2);
        showNotification('Achievement: First Contact! +$100');
    }

    if (!a.bouncy && gameState.totalBounces >= 100) {
        a.bouncy = true;
        earnMoney(500, canvas.width / 2, canvas.height / 2);
        showNotification('Achievement: Bouncy! +$500');
    }

    if (!a.webWeaver && gameState.currentEdgeCount >= 10) {
        a.webWeaver = true;
        earnMoney(1000, canvas.width / 2, canvas.height / 2);
        showNotification('Achievement: Web Weaver! +$1,000');
    }

    if (!a.network && gameState.maxSimultaneousEdges >= 25) {
        a.network = true;
        gameState.darkMatter += 1;
        showNotification('Achievement: Network! +1 Dark Matter');
    }

    if (!a.millionaire && gameState.totalMoneyEarned >= 1000000) {
        a.millionaire = true;
        gameState.darkMatter += 5;
        showNotification('Achievement: Millionaire! +5 Dark Matter');
    }

    if (!a.darkCollector && gameState.darkMatter >= 10) {
        a.darkCollector = true;
        gameState.darkMatterUpgrades.incomeMultiplier++;
        showNotification('Achievement: Dark Collector! +10% Income');
    }

    if (!a.prestigeMaster && gameState.totalPrestiges >= 5) {
        a.prestigeMaster = true;
        gameState.darkMatterUpgrades.startingNodes++;
        gameState.upgrades.nodeLimit++;
        showNotification('Achievement: Prestige Master! +1 Starting Node');
    }

    if (!a.fullHouse && nodes.length >= getNodeLimit()) {
        a.fullHouse = true;
        earnMoney(10000, canvas.width / 2, canvas.height / 2);
        showNotification('Achievement: Full House! +$10,000');
    }

    if (!a.goldenAge) {
        const goldenCount = nodes.filter(n => n.type === 'golden').length;
        if (goldenCount >= 3) {
            a.goldenAge = true;
            gameState.darkMatter += 10;
            showNotification('Achievement: Golden Age! +10 Dark Matter');
        }
    }

    saveGame();
}

function showNotification(message) {
    // Simple notification display
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(77, 166, 255, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        animation: slideDown 0.3s ease, fadeOut 0.3s ease 2.7s;
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
}

// Save/Load
function saveGame() {
    localStorage.setItem('stellarWebGame', JSON.stringify(gameState));
}

function loadGame() {
    const saved = localStorage.getItem('stellarWebGame');
    if (saved) {
        const loaded = JSON.parse(saved);
        Object.assign(gameState, loaded);
        config.connectivity = getConnectivity();
    }
}

// Spatial partitioning for performance optimization
class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    getCellKey(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return `${cellX},${cellY}`;
    }

    insert(node) {
        const key = this.getCellKey(node.x, node.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(node);
    }

    getNearby(node, radius) {
        const nearby = [];
        const cellRadius = Math.ceil(radius / this.cellSize);
        const centerX = Math.floor(node.x / this.cellSize);
        const centerY = Math.floor(node.y / this.cellSize);

        for (let dx = -cellRadius; dx <= cellRadius; dx++) {
            for (let dy = -cellRadius; dy <= cellRadius; dy++) {
                const key = `${centerX + dx},${centerY + dy}`;
                if (this.grid.has(key)) {
                    nearby.push(...this.grid.get(key));
                }
            }
        }

        return nearby;
    }
}

const spatialGrid = new SpatialGrid(150);

// Find hovered node
function getHoveredNode() {
    if (!mouse.active) return null;

    for (let node of nodes) {
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < getNodeSize() * 3) {
            return node;
        }
    }

    return null;
}

// Draw edges with optimized distance calculation and income generation
function drawEdges(hoveredNode) {
    // Build spatial grid
    spatialGrid.clear();
    nodes.forEach(node => {
        node.connections = [];
        spatialGrid.insert(node);
    });

    const highlightConnections = new Set();
    if (hoveredNode) {
        highlightConnections.add(hoveredNode);
    }

    let edgeCount = 0;

    // Draw edges using spatial partitioning
    for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const nearby = spatialGrid.getNearby(nodeA, getConnectivity());

        for (let nodeB of nearby) {
            if (nodeA === nodeB) continue;
            if (nodeA.id > nodeB.id) continue; // Avoid drawing twice

            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dz = nodeB.z - nodeA.z;
            const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.5);

            if (dist3D < getConnectivity()) {
                // Track connections
                nodeA.connections.push(nodeB);
                nodeB.connections.push(nodeA);
                edgeCount++;

                // Check if this edge should be highlighted
                const shouldHighlight = hoveredNode &&
                    (nodeA === hoveredNode || nodeB === hoveredNode);

                if (shouldHighlight) {
                    highlightConnections.add(nodeA);
                    highlightConnections.add(nodeB);
                }

                // Calculate opacity based on distance
                const opacity = (1 - (dist3D / getConnectivity())) * 0.5;

                if (shouldHighlight) {
                    ctx.strokeStyle = `rgba(255, 255, 100, ${opacity * 1.5})`;
                    ctx.lineWidth = 2;
                } else {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.lineWidth = 1;
                }

                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeB.x, nodeB.y);
                ctx.stroke();
            }
        }
    }

    gameState.currentEdgeCount = edgeCount;
    if (edgeCount > gameState.maxSimultaneousEdges) {
        gameState.maxSimultaneousEdges = edgeCount;
        checkAchievements();
    }

    // Generate edge income (once per second)
    const now = Date.now();
    const timeSinceLastEdgeIncome = now - gameState.lastEdgeIncomeTime;
    if (timeSinceLastEdgeIncome >= 1000 && edgeCount > 0) {
        const edgeIncomePerEdge = getEdgeIncomePerSecond();

        // Calculate income with golden multipliers
        // Each edge generates base income, golden nodes multiply their edges by 2x
        let totalIncome = 0;
        let goldenIncome = 0;

        // Count edges and apply golden multiplier correctly
        const processedEdges = new Set();
        nodes.forEach(nodeA => {
            nodeA.connections.forEach(nodeB => {
                // Avoid counting the same edge twice
                const edgeKey = nodeA.id < nodeB.id ? `${nodeA.id}-${nodeB.id}` : `${nodeB.id}-${nodeA.id}`;
                if (processedEdges.has(edgeKey)) return;
                processedEdges.add(edgeKey);

                // Base income for this edge
                let edgeIncome = edgeIncomePerEdge;

                // Apply golden multiplier (2x if either node is golden)
                const isGoldenEdge = nodeA.type === 'golden' || nodeB.type === 'golden';
                if (isGoldenEdge) {
                    edgeIncome *= 2;
                    goldenIncome += edgeIncomePerEdge; // Track golden portion
                } else {
                    totalIncome += edgeIncomePerEdge;
                }
            });
        });

        // Display income with appropriate popup
        if (totalIncome > 0) {
            earnMoney(totalIncome, canvas.width / 2, 50, false);
        }
        if (goldenIncome > 0) {
            // Show golden income separately for visual feedback
            earnMoney(goldenIncome, canvas.width / 2, 50, true);
        }

        gameState.lastEdgeIncomeTime = now;
    }

    // Calculate money per second for display
    const edgeIncomePerEdge = getEdgeIncomePerSecond();
    let totalMPS = 0;

    // Count edges with golden multiplier
    const processedEdges = new Set();
    nodes.forEach(nodeA => {
        nodeA.connections.forEach(nodeB => {
            const edgeKey = nodeA.id < nodeB.id ? `${nodeA.id}-${nodeB.id}` : `${nodeB.id}-${nodeA.id}`;
            if (processedEdges.has(edgeKey)) return;
            processedEdges.add(edgeKey);

            const isGoldenEdge = nodeA.type === 'golden' || nodeB.type === 'golden';
            totalMPS += edgeIncomePerEdge * (isGoldenEdge ? 2 : 1);
        });
    });

    gameState.moneyPerSecond = totalMPS;

    return highlightConnections;
}

// Calculate statistics
function calculateStats() {
    let totalEdges = 0;
    let maxConnections = 0;
    mostConnectedNode = null;

    nodes.forEach(node => {
        totalEdges += node.connections.length;
        if (node.connections.length > maxConnections) {
            maxConnections = node.connections.length;
            mostConnectedNode = node;
        }
    });

    totalEdges = totalEdges / 2; // Each edge counted twice
    const avgConnections = nodes.length > 0 ? (totalEdges * 2) / nodes.length : 0;
    const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
    const density = maxPossibleEdges > 0 ? (totalEdges / maxPossibleEdges) * 100 : 0;

    return {
        totalEdges: Math.round(totalEdges),
        avgConnections: avgConnections.toFixed(1),
        mostConnected: mostConnectedNode ? `Node ${mostConnectedNode.id}` : 'None',
        density: density.toFixed(1),
        nodeCount: nodes.length
    };
}

// Animation
let lastTime = 0;
let fps = 60;
let breathingPhase = 0;

function animate(currentTime) {
    requestAnimationFrame(animate);

    // Calculate FPS
    const deltaTime = currentTime - lastTime;
    if (deltaTime > 0) {
        fps = Math.round(1000 / deltaTime);
    }
    lastTime = currentTime;

    // Breathing phase for pulsing effect
    breathingPhase += 0.02;

    // Clear canvas (fully opaque to prevent background lightening)
    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update nodes
    nodes.forEach(node => node.update());

    // Check for hovered node
    const hoveredNode = getHoveredNode();

    // Draw edges
    const highlightSet = drawEdges(hoveredNode);

    // Draw nodes
    nodes.forEach(node => node.draw(breathingPhase, hoveredNode));

    // Update and draw income popups
    for (let i = incomePopups.length - 1; i >= 0; i--) {
        if (!incomePopups[i].update()) {
            incomePopups.splice(i, 1);
        } else {
            incomePopups[i].draw(ctx);
        }
    }

    // Update stats and UI
    if (Math.floor(currentTime / 100) % 2 === 0) { // Update every 200ms for more responsive UI
        updateStatsDisplay();
        updateMoneyDisplay();
        updateUpgradeDisplay();
    }

    // Auto-save every 30 seconds
    if (Math.floor(currentTime / 1000) % 30 === 0 && Math.floor(currentTime / 100) % 10 === 0) {
        saveGame();
    }
}

function updateStatsDisplay() {
    const stats = calculateStats();
    document.getElementById('totalEdges').textContent = stats.totalEdges;
    document.getElementById('avgConnections').textContent = stats.avgConnections;
    document.getElementById('mostConnected').textContent = stats.mostConnected;
    document.getElementById('networkDensity').textContent = stats.density + '%';
    document.getElementById('currentNodes').textContent = stats.nodeCount;
    document.getElementById('fps').textContent = fps;
}

function updateMoneyDisplay() {
    const moneyDisplay = document.getElementById('moneyDisplay');
    const mpsDisplay = document.getElementById('mpsDisplay');
    const dmDisplay = document.getElementById('dmDisplay');
    const nodeCountDisplay = document.getElementById('nodeCountDisplay');

    if (moneyDisplay) {
        moneyDisplay.textContent = formatNumber(Math.floor(gameState.money));
    }
    if (mpsDisplay) {
        mpsDisplay.textContent = `+$${formatNumber(gameState.moneyPerSecond.toFixed(1))}/s`;
    }
    if (dmDisplay) {
        dmDisplay.textContent = `◈ ${gameState.darkMatter}`;
    }
    if (nodeCountDisplay) {
        nodeCountDisplay.textContent = `Nodes: ${nodes.length}/${getNodeLimit()}`;
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function updateUpgradeDisplay() {
    const upgrades = [
        { name: 'nodeLimit', prefix: 'NodeLimit' },
        { name: 'bounceValue', prefix: 'BounceValue' },
        { name: 'edgeValue', prefix: 'EdgeValue' },
        { name: 'speed', prefix: 'Speed' },
        { name: 'connectivity', prefix: 'Connectivity' },
        { name: 'nodeSize', prefix: 'NodeSize' }
    ];

    upgrades.forEach(({ name, prefix }) => {
        const level = gameState.upgrades[name];
        const cost = upgradeFormulas[name](level + 1);
        const canAfford = gameState.money >= cost;

        const levelEl = document.getElementById('upg' + prefix);
        const costEl = document.getElementById('cost' + prefix);
        const btnEl = document.getElementById('buy' + prefix);

        if (levelEl) levelEl.textContent = level;
        if (costEl) costEl.textContent = formatNumber(cost);
        if (btnEl) {
            btnEl.disabled = !canAfford;
            btnEl.style.opacity = canAfford ? '1' : '0.5';
        }
    });

    // Update Dark Matter upgrades
    const dmIncomeLevel = gameState.darkMatterUpgrades.incomeMultiplier;
    const dmIncomeCost = Math.floor(5 * Math.pow(1.5, dmIncomeLevel));
    const dmIncomeEl = document.getElementById('dmIncomeLevel');
    const dmIncomeCostEl = document.getElementById('costDmIncome');
    const dmIncomeBtnEl = document.getElementById('buyDmIncome');
    if (dmIncomeEl) dmIncomeEl.textContent = dmIncomeLevel;
    if (dmIncomeCostEl) dmIncomeCostEl.textContent = dmIncomeCost;
    if (dmIncomeBtnEl) {
        dmIncomeBtnEl.disabled = gameState.darkMatter < dmIncomeCost;
        dmIncomeBtnEl.style.opacity = gameState.darkMatter >= dmIncomeCost ? '1' : '0.5';
    }

    const dmStartingLevel = gameState.darkMatterUpgrades.startingNodes;
    const dmStartingCost = Math.floor(10 * Math.pow(2, dmStartingLevel));
    const dmStartingEl = document.getElementById('dmStartingLevel');
    const dmStartingCostEl = document.getElementById('costDmStarting');
    const dmStartingBtnEl = document.getElementById('buyDmStarting');
    if (dmStartingEl) dmStartingEl.textContent = dmStartingLevel;
    if (dmStartingCostEl) dmStartingCostEl.textContent = dmStartingCost;
    if (dmStartingBtnEl) {
        dmStartingBtnEl.disabled = gameState.darkMatter < dmStartingCost;
        dmStartingBtnEl.style.opacity = gameState.darkMatter >= dmStartingCost ? '1' : '0.5';
    }

    // Update prestige button
    const prestigeGain = calculateDarkMatterGain();
    const prestigeGainEl = document.getElementById('prestigeGain');
    const prestigeBtnEl = document.getElementById('prestigeBtn');
    if (prestigeGainEl) prestigeGainEl.textContent = `${prestigeGain} ◈`;
    if (prestigeBtnEl) {
        prestigeBtnEl.disabled = prestigeGain <= 0;
        prestigeBtnEl.style.opacity = prestigeGain > 0 ? '1' : '0.5';
    }

    // Update achievement display
    updateAchievementDisplay();

    // Update node type selection
    updateNodeTypeSelection();
}

function updateAchievementDisplay() {
    const achievements = [
        { id: 'firstContact', name: 'First Contact' },
        { id: 'bouncy', name: 'Bouncy' },
        { id: 'webWeaver', name: 'Web Weaver' },
        { id: 'network', name: 'Network' },
        { id: 'millionaire', name: 'Millionaire' },
        { id: 'darkCollector', name: 'Dark Collector' },
        { id: 'prestigeMaster', name: 'Prestige Master' },
        { id: 'fullHouse', name: 'Full House' },
        { id: 'goldenAge', name: 'Golden Age' }
    ];

    achievements.forEach(({ id, name }) => {
        const el = document.getElementById('ach' + id.charAt(0).toUpperCase() + id.slice(1));
        if (el && gameState.achievements[id]) {
            el.classList.remove('locked');
            el.classList.add('unlocked');
        }
    });
}

function updateNodeTypeSelection() {
    const selectBasic = document.getElementById('selectBasic');
    const selectMagnet = document.getElementById('selectMagnet');
    const selectGolden = document.getElementById('selectGolden');

    if (selectBasic) {
        selectBasic.textContent = gameState.selectedNodeType === 'basic' ? '✓ SELECTED' : 'SELECT';
        selectBasic.className = gameState.selectedNodeType === 'basic' ? 'node-type-selected' : 'node-type-select';
    }

    if (selectMagnet) {
        if (gameState.darkMatterUpgrades.magnetNodeUnlocked) {
            selectMagnet.textContent = gameState.selectedNodeType === 'magnet' ? '✓ SELECTED' : 'SELECT';
            selectMagnet.className = gameState.selectedNodeType === 'magnet' ? 'node-type-selected' : 'node-type-select';
        } else {
            const canAfford = gameState.darkMatter >= 20;
            selectMagnet.textContent = canAfford ? 'UNLOCK 20 ◈' : '🔒 20 ◈';
            selectMagnet.className = 'node-type-locked';
            selectMagnet.style.opacity = canAfford ? '1' : '0.5';
        }
    }

    if (selectGolden) {
        if (gameState.darkMatterUpgrades.goldenNodeUnlocked) {
            selectGolden.textContent = gameState.selectedNodeType === 'golden' ? '✓ SELECTED' : 'SELECT';
            selectGolden.className = gameState.selectedNodeType === 'golden' ? 'node-type-selected' : 'node-type-select';
        } else {
            const canAfford = gameState.darkMatter >= 50;
            selectGolden.textContent = canAfford ? 'UNLOCK 50 ◈' : '🔒 50 ◈';
            selectGolden.className = 'node-type-locked';
            selectGolden.style.opacity = canAfford ? '1' : '0.5';
        }
    }
}

function updateAllDisplays() {
    updateStatsDisplay();
    updateMoneyDisplay();
    updateUpgradeDisplay();
}

// Make functions globally accessible for onclick handlers
window.buyUpgrade = buyUpgrade;
window.buyDarkMatterUpgrade = buyDarkMatterUpgrade;
window.prestige = prestige;
window.updateNodeTypeSelection = updateNodeTypeSelection;

// UI Controls

// Welcome modal
const welcomeModal = document.getElementById('welcomeModal');
const startBtn = document.getElementById('startBtn');

startBtn.onclick = () => {
    welcomeModal.style.display = 'none';
};

// Help modal
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpBtn');
const closeBtn = document.getElementsByClassName('close')[0];

helpBtn.onclick = () => helpModal.style.display = 'block';
closeBtn.onclick = () => helpModal.style.display = 'none';
window.onclick = (e) => {
    if (e.target === helpModal) {
        helpModal.style.display = 'none';
    }
    if (e.target === welcomeModal) {
        welcomeModal.style.display = 'none';
    }
};

// Fullscreen
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

// Control panel toggle
const togglePanel = document.getElementById('togglePanel');
const controlPanel = document.getElementById('controlPanel');

togglePanel.onclick = () => {
    controlPanel.classList.toggle('open');
};

// Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.onclick = () => {
        const targetTab = btn.dataset.tab;

        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(targetTab + 'Tab').classList.add('active');
    };
});

// Sliders (visual only, don't affect gameplay)
const sliders = [
    { id: 'trail', config: 'trailLength', value: 'trailValue' }
];

sliders.forEach(slider => {
    const element = document.getElementById(slider.id);
    const valueDisplay = document.getElementById(slider.value);

    if (element && valueDisplay) {
        element.oninput = () => {
            const value = parseFloat(element.value);
            config[slider.config] = value;
            valueDisplay.textContent = value;

            if (slider.onChange) {
                slider.onChange(value);
            }
        };
    }
});

// Color slider (special handler)
const colorSlider = document.getElementById('nodeColor');
const colorValue = document.getElementById('colorValue');
if (colorSlider && colorValue) {
    const getColorName = (hue) => {
        if (hue < 30) return 'Red';
        if (hue < 60) return 'Orange';
        if (hue < 90) return 'Yellow';
        if (hue < 150) return 'Green';
        if (hue < 210) return 'Cyan';
        if (hue < 270) return 'Blue';
        if (hue < 330) return 'Purple';
        return 'Red';
    };

    colorSlider.oninput = () => {
        const hue = parseInt(colorSlider.value);
        config.nodeHue = hue;
        colorValue.textContent = getColorName(hue);
        colorValue.style.color = `hsl(${hue}, 80%, 70%)`;
    };

    // Set initial color
    colorValue.style.color = `hsl(${config.nodeHue}, 80%, 70%)`;
}

// Pause button
const pauseBtn = document.getElementById('pauseBtn');
pauseBtn.onclick = () => {
    config.paused = !config.paused;
    pauseBtn.textContent = config.paused ? 'Resume' : 'Pause';
};

// Reset button
const resetBtn = document.getElementById('resetBtn');
resetBtn.onclick = () => {
    initNodes();
};

// Click to spawn node
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check node limit
    if (nodes.length >= getNodeLimit()) {
        showNotification('Node limit reached! Upgrade "Node Limit" to place more.');
        return;
    }

    // Check if node type is unlocked
    if (gameState.selectedNodeType === 'magnet' && !gameState.darkMatterUpgrades.magnetNodeUnlocked) {
        showNotification('Magnet nodes not unlocked yet!');
        return;
    }
    if (gameState.selectedNodeType === 'golden' && !gameState.darkMatterUpgrades.goldenNodeUnlocked) {
        showNotification('Golden nodes not unlocked yet!');
        return;
    }

    // Create node
    nodes.push(new Node(x, y, 0, gameState.selectedNodeType));
    config.nodeCount = nodes.length;

    // Update slider if it exists
    const slider = document.getElementById('nodeCount');
    if (slider) {
        slider.value = nodes.length;
        document.getElementById('nodeCountValue').textContent = nodes.length;
    }

    // Visual feedback based on node type
    let color;
    switch (gameState.selectedNodeType) {
        case 'magnet':
            color = 'rgba(160, 80, 255, 0.8)';
            break;
        case 'golden':
            color = 'rgba(255, 215, 0, 0.8)';
            break;
        default:
            color = 'rgba(77, 166, 255, 0.8)';
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();

    checkAchievements();
    updateMoneyDisplay();
    saveGame();
});

// Load saved game
loadGame();

// Start animation
animate(0);

// Initial display update
updateAllDisplays();

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
