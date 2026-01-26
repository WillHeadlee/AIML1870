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

// Configuration
const config = {
    nodeCount: 0,
    connectivity: 150,
    speed: 1.0,
    nodeSize: 4,
    trailLength: 0,
    mouseGravity: 0.5,
    paused: false
};

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

// Node class
class Node {
    constructor(x, y, z) {
        this.x = x || Math.random() * canvas.width;
        this.y = y || Math.random() * canvas.height;
        this.z = z || Math.random() * 200 - 100; // -100 to 100

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
    }

    update() {
        if (config.paused) return;

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
        const speedMultiplier = this.isShootingStar ? 5 : config.speed;

        // Mouse gravity
        if (mouse.active && config.mouseGravity > 0) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 300) {
                const force = (config.mouseGravity * 0.1) / (dist + 1);
                this.vx += dx * force;
                this.vy += dy * force;
            }
        }

        // Update position
        this.x += this.vx * speedMultiplier;
        this.y += this.vy * speedMultiplier;
        this.z += this.vz * speedMultiplier;

        // Bounce off edges
        if (this.x < 0) {
            this.x = 0;
            this.vx = Math.abs(this.vx);
        }
        if (this.x > canvas.width) {
            this.x = canvas.width;
            this.vx = -Math.abs(this.vx);
        }
        if (this.y < 0) {
            this.y = 0;
            this.vy = Math.abs(this.vy);
        }
        if (this.y > canvas.height) {
            this.y = canvas.height;
            this.vy = -Math.abs(this.vy);
        }
        if (this.z < -100) {
            this.z = -100;
            this.vz = Math.abs(this.vz);
        }
        if (this.z > 100) {
            this.z = 100;
            this.vz = -Math.abs(this.vz);
        }

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
        const size = config.nodeSize * depthScale;
        const baseOpacity = 0.4 + (this.z + 100) / 400; // 0.4 to 0.9

        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                const alpha = (i / this.trail.length) * 0.1;
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
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
            gradient.addColorStop(0, `rgba(200, 220, 255, ${baseOpacity * 0.6})`);
            gradient.addColorStop(0.5, `rgba(200, 220, 255, ${baseOpacity * 0.2})`);
            gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
        }

        ctx.fillStyle = gradient;
        drawStar(ctx, this.x, this.y, glowSize);
        ctx.fill();

        // Draw core node star
        ctx.fillStyle = isMostConnected
            ? `rgba(77, 166, 255, ${baseOpacity})`
            : isHovered
            ? `rgba(255, 255, 100, ${baseOpacity})`
            : `rgba(255, 255, 255, ${baseOpacity})`;
        drawStar(ctx, this.x, this.y, size);
        ctx.fill();

        // Shooting star trail
        if (this.isShootingStar) {
            ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
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

        if (dist < config.nodeSize * 3) {
            return node;
        }
    }

    return null;
}

// Draw edges with optimized distance calculation
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

    // Draw edges using spatial partitioning
    for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        const nearby = spatialGrid.getNearby(nodeA, config.connectivity);

        for (let nodeB of nearby) {
            if (nodeA === nodeB) continue;
            if (nodeA.id > nodeB.id) continue; // Avoid drawing twice

            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dz = nodeB.z - nodeA.z;
            const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.5);

            if (dist3D < config.connectivity) {
                // Track connections
                nodeA.connections.push(nodeB);
                nodeB.connections.push(nodeA);

                // Check if this edge should be highlighted
                const shouldHighlight = hoveredNode &&
                    (nodeA === hoveredNode || nodeB === hoveredNode);

                if (shouldHighlight) {
                    highlightConnections.add(nodeA);
                    highlightConnections.add(nodeB);
                }

                // Calculate opacity based on distance
                const opacity = (1 - (dist3D / config.connectivity)) * 0.5;

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

    // Update stats
    if (Math.floor(currentTime / 100) % 5 === 0) { // Update every 500ms
        updateStatsDisplay();
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

// Sliders
const sliders = [
    { id: 'nodeCount', config: 'nodeCount', value: 'nodeCountValue', onChange: adjustNodeCount },
    { id: 'connectivity', config: 'connectivity', value: 'connectivityValue' },
    { id: 'speed', config: 'speed', value: 'speedValue' },
    { id: 'size', config: 'nodeSize', value: 'sizeValue' },
    { id: 'trail', config: 'trailLength', value: 'trailValue' },
    { id: 'gravity', config: 'mouseGravity', value: 'gravityValue' }
];

sliders.forEach(slider => {
    const element = document.getElementById(slider.id);
    const valueDisplay = document.getElementById(slider.value);

    element.oninput = () => {
        const value = parseFloat(element.value);
        config[slider.config] = value;
        valueDisplay.textContent = value;

        if (slider.onChange) {
            slider.onChange(value);
        }
    };
});

function adjustNodeCount(newCount) {
    const currentCount = nodes.length;

    if (newCount > currentCount) {
        // Add nodes
        for (let i = 0; i < newCount - currentCount; i++) {
            nodes.push(new Node());
        }
    } else if (newCount < currentCount) {
        // Remove nodes
        nodes.splice(newCount);
    }
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

    nodes.push(new Node(x, y, 0));
    config.nodeCount = nodes.length;
    document.getElementById('nodeCount').value = nodes.length;
    document.getElementById('nodeCountValue').textContent = nodes.length;

    // Visual feedback
    ctx.strokeStyle = 'rgba(77, 166, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
});

// Start animation
animate(0);
