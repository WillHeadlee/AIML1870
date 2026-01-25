// Main application
class BridgeBuilder {
    constructor() {
        this.canvas = document.getElementById('bridge-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.algorithms = new BridgeAlgorithms();

        this.params = {
            platformDistance: 500,
            heightDiff: 0,
            nodeDensity: 80,
            connectivityRadius: 100,
            structuralDepth: 60,
            sagArc: 0,
            growthSpeed: 5,
            chaosFactor: 30,
            branchProbability: 25,
            edgeThickness: 3,
            edgeOpacity: 0.7,
            nodeSize: 6,
            nodeColor: '#FFA726',
            bridgeType: 'vine'
        };

        // Cartoonish color scheme
        this.colors = {
            background: '#87CEEB',
            edges: '#808080',
            platform: '#8B4513'
        };

        this.animationFrameId = null;
        this.isAnimating = false;
        this.growthTimer = 0;
        this.startTime = 0;
        this.buildTime = 0;

        this.hoveredNode = null;
        this.stressVisualization = false;

        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.updateAllSliderValues();
        // Create initial platforms
        this.algorithms.createPlatforms(
            this.canvas,
            this.params.platformDistance,
            this.params.heightDiff
        );
        this.draw();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width - 40;
        this.canvas.height = Math.max(600, rect.height - 40);
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // Recreate platforms with new canvas size
            this.algorithms.createPlatforms(
                this.canvas,
                this.params.platformDistance,
                this.params.heightDiff
            );
            this.draw();
        });

        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateBridge();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // Node color picker
        document.getElementById('node-color').addEventListener('input', (e) => {
            this.params.nodeColor = e.target.value;
            this.draw();
        });

        // Stress visualization checkbox
        document.getElementById('stress-viz').addEventListener('change', (e) => {
            this.stressVisualization = e.target.checked;
            this.draw();
        });

        // Platform sliders (update platforms in real-time)
        const platformSliders = ['platform-distance', 'height-diff'];
        platformSliders.forEach(id => {
            const slider = document.getElementById(id);
            slider.addEventListener('input', (e) => {
                const paramName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.params[paramName] = parseFloat(e.target.value);
                this.updateSliderValue(id, e.target.value);
                // Update platforms in real-time
                this.algorithms.createPlatforms(
                    this.canvas,
                    this.params.platformDistance,
                    this.params.heightDiff
                );
                this.draw();
            });
        });

        // Sliders that require regeneration
        const regenerationSliders = [
            'node-density',
            'connectivity-radius',
            'structural-depth',
            'sag-arc',
            'growth-speed',
            'chaos-factor',
            'branch-probability'
        ];

        regenerationSliders.forEach(id => {
            const slider = document.getElementById(id);
            slider.addEventListener('input', (e) => {
                const paramName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.params[paramName] = parseFloat(e.target.value);
                this.updateSliderValue(id, e.target.value);
            });
        });

        // Real-time sliders (visual only)
        const realtimeSliders = ['edge-thickness', 'edge-opacity', 'node-size'];

        realtimeSliders.forEach(id => {
            const slider = document.getElementById(id);
            slider.addEventListener('input', (e) => {
                const paramName = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                if (paramName === 'edgeOpacity') {
                    this.params[paramName] = parseFloat(e.target.value) / 100;
                } else {
                    this.params[paramName] = parseFloat(e.target.value);
                }
                this.updateSliderValue(id, e.target.value);
                this.draw();
            });
        });

        // Mouse interaction
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    updateSliderValue(sliderId, value) {
        const valueSpan = document.getElementById(`${sliderId}-value`);
        if (valueSpan) {
            if (sliderId.includes('opacity') || sliderId.includes('probability') || sliderId.includes('chaos')) {
                valueSpan.textContent = Math.round(value);
            } else {
                valueSpan.textContent = Math.round(value);
            }
        }
    }

    updateAllSliderValues() {
        Object.keys(this.params).forEach(key => {
            const sliderId = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const slider = document.getElementById(sliderId);
            if (slider) {
                let value = this.params[key];
                if (sliderId.includes('opacity')) {
                    value = value * 100;
                }
                this.updateSliderValue(sliderId, value);
            }
        });
    }

    generateBridge() {
        // Stop any existing animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Reset
        this.algorithms.reset();
        this.startTime = Date.now();
        this.buildTime = 0;

        // Create platforms
        this.algorithms.createPlatforms(
            this.canvas,
            this.params.platformDistance,
            this.params.heightDiff
        );

        // Create seed nodes based on algorithm type
        const needsSeeds = ['vine', 'crystalline'];
        if (needsSeeds.includes(this.params.bridgeType)) {
            this.algorithms.createSeedNodes(this.params);
        }

        // Start growth animation
        this.algorithms.isGrowing = true;
        this.isAnimating = true;
        this.growthTimer = 0;

        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;

        this.animationFrameId = requestAnimationFrame(() => this.animate());

        // Growth step timing based on speed
        this.growthTimer++;
        const stepsPerFrame = Math.ceil(this.params.growthSpeed / 2);

        if (this.growthTimer % Math.max(1, 6 - Math.floor(this.params.growthSpeed / 2)) === 0) {
            let continueGrowing = false;

            for (let i = 0; i < stepsPerFrame; i++) {
                // Use vine/root growth algorithm
                continueGrowing = this.algorithms.vineGrowthStep(this.params);

                if (!continueGrowing) {
                    this.algorithms.isGrowing = false;
                    break;
                }
            }

            if (!this.algorithms.isGrowing) {
                this.isAnimating = false;
                this.buildTime = (Date.now() - this.startTime) / 1000;
                // Identify road nodes when bridge is complete
                this.algorithms.identifyRoadNodes();
            }
        }

        // Update edges
        this.algorithms.edges.forEach(edge => edge.update());

        // Apply edge forces to counteract gravity and maintain structure
        // Stronger forces when animation is running to build structure
        const stiffness = this.algorithms.isGrowing ? 0.02 : 0.015;
        this.algorithms.applyEdgeForces(stiffness);

        // Check for broken edges (only when not growing)
        if (!this.algorithms.isGrowing) {
            const broken = this.algorithms.checkEdgeBreaking(1.6);
            if (broken > 0) {
                console.log(`${broken} edges broke!`);
            }
        }

        // Update nodes (for physics-based algorithms) with gravity
        this.algorithms.nodes.forEach(node => {
            node.update(0.9, 3, 0.12); // damping, maxVelocity, gravity

            // Boundary constraints - keep nodes within canvas with padding
            if (!node.isFixed && !node.isPlatform) {
                const margin = 50;
                if (node.x < margin) {
                    node.x = margin;
                    node.vx = 0;
                }
                if (node.x > this.canvas.width - margin) {
                    node.x = this.canvas.width - margin;
                    node.vx = 0;
                }
                if (node.y < margin) {
                    node.y = margin;
                    node.vy = 0;
                }
                if (node.y > this.canvas.height - margin) {
                    node.y = this.canvas.height - margin;
                    node.vy = 0;
                }
            }
        });


        this.draw();
        this.updateStats();
    }

    draw() {
        // Draw sky gradient
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.7);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);

        // Draw grass ground
        const grassGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.7, 0, this.canvas.height);
        grassGradient.addColorStop(0, '#5FAD56');
        grassGradient.addColorStop(1, '#4A7C59');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);

        // Draw grass texture (small vertical lines)
        this.ctx.strokeStyle = 'rgba(74, 124, 89, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 10) {
            const grassHeight = Math.random() * 10 + 5;
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.canvas.height * 0.7);
            this.ctx.lineTo(i, this.canvas.height * 0.7 + grassHeight);
            this.ctx.stroke();
        }

        // Draw platforms (dirt/stone pillars)
        this.algorithms.platforms.forEach(platform => {
            platform.draw(this.ctx, this.colors.platform);
        });

        // Draw edges
        this.algorithms.edges.forEach(edge => {
            edge.draw(
                this.ctx,
                this.params.edgeThickness,
                this.params.edgeOpacity,
                this.colors.edges,
                this.stressVisualization
            );
        });

        // Draw continuous road surface first (below nodes)
        if (this.algorithms.roadNodes.length > 0) {
            // Sort road nodes by x position for proper connection
            const roadNodeObjects = this.algorithms.roadNodes
                .map(id => this.algorithms.nodes.find(n => n.id === id))
                .filter(n => n !== undefined)
                .sort((a, b) => a.x - b.x);

            // Add platform edge points to road
            const leftPlatform = this.algorithms.platforms[0];
            const rightPlatform = this.algorithms.platforms[1];

            const leftEdgeNode = { x: leftPlatform.x + leftPlatform.width, y: roadNodeObjects.length > 0 ? roadNodeObjects[0].y : leftPlatform.y + leftPlatform.height * 0.4 };
            const rightEdgeNode = { x: rightPlatform.x, y: roadNodeObjects.length > 0 ? roadNodeObjects[roadNodeObjects.length - 1].y : rightPlatform.y + rightPlatform.height * 0.4 };

            const fullRoadPath = [leftEdgeNode, ...roadNodeObjects, rightEdgeNode];

            if (fullRoadPath.length > 1) {
                const roadHeight = this.params.nodeSize * 3;

                // Draw road base with smooth curves
                this.ctx.fillStyle = '#696969';
                this.ctx.beginPath();

                // Top edge - smooth curve through points
                this.ctx.moveTo(fullRoadPath[0].x, fullRoadPath[0].y - roadHeight/2);
                for (let i = 1; i < fullRoadPath.length; i++) {
                    const xc = (fullRoadPath[i].x + fullRoadPath[i - 1].x) / 2;
                    const yc = (fullRoadPath[i].y + fullRoadPath[i - 1].y) / 2 - roadHeight/2;
                    this.ctx.quadraticCurveTo(
                        fullRoadPath[i - 1].x, fullRoadPath[i - 1].y - roadHeight/2,
                        xc, yc
                    );
                }
                this.ctx.lineTo(
                    fullRoadPath[fullRoadPath.length - 1].x,
                    fullRoadPath[fullRoadPath.length - 1].y - roadHeight/2
                );

                // Bottom edge
                this.ctx.lineTo(
                    fullRoadPath[fullRoadPath.length - 1].x,
                    fullRoadPath[fullRoadPath.length - 1].y + roadHeight/2
                );
                for (let i = fullRoadPath.length - 2; i >= 0; i--) {
                    const xc = (fullRoadPath[i].x + fullRoadPath[i + 1].x) / 2;
                    const yc = (fullRoadPath[i].y + fullRoadPath[i + 1].y) / 2 + roadHeight/2;
                    this.ctx.quadraticCurveTo(
                        fullRoadPath[i + 1].x, fullRoadPath[i + 1].y + roadHeight/2,
                        xc, yc
                    );
                }
                this.ctx.lineTo(fullRoadPath[0].x, fullRoadPath[0].y + roadHeight/2);

                this.ctx.closePath();
                this.ctx.fill();

                // Road border
                this.ctx.strokeStyle = '#4A4A4A';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();

                // Yellow center line (smooth)
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([15, 10]);
                this.ctx.beginPath();
                this.ctx.moveTo(fullRoadPath[0].x, fullRoadPath[0].y);
                for (let i = 1; i < fullRoadPath.length; i++) {
                    const xc = (fullRoadPath[i].x + fullRoadPath[i - 1].x) / 2;
                    const yc = (fullRoadPath[i].y + fullRoadPath[i - 1].y) / 2;
                    this.ctx.quadraticCurveTo(
                        fullRoadPath[i - 1].x, fullRoadPath[i - 1].y,
                        xc, yc
                    );
                }
                this.ctx.lineTo(
                    fullRoadPath[fullRoadPath.length - 1].x,
                    fullRoadPath[fullRoadPath.length - 1].y
                );
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }

        // Draw nodes (all as nails now)
        this.algorithms.nodes.forEach(node => {
            const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;
            const nodeColor = isHovered ? this.colors.platform : this.params.nodeColor;
            node.draw(this.ctx, this.params.nodeSize, nodeColor, true, false);
        });

        // Draw hover connections
        if (this.hoveredNode) {
            this.ctx.strokeStyle = this.colors.platform;
            this.ctx.lineWidth = this.params.edgeThickness + 1;
            this.ctx.globalAlpha = 0.8;

            this.hoveredNode.connections.forEach(connId => {
                const connectedNode = this.algorithms.nodes.find(n => n.id === connId);
                if (connectedNode) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.hoveredNode.x, this.hoveredNode.y);
                    this.ctx.lineTo(connectedNode.x, connectedNode.y);
                    this.ctx.stroke();
                }
            });

            this.ctx.globalAlpha = 1;
        }
    }

    updateStats() {
        const nodes = this.algorithms.nodes.length;
        const edges = this.algorithms.edges.length;

        document.getElementById('stat-nodes').textContent = nodes;
        document.getElementById('stat-edges').textContent = edges;
        document.getElementById('stat-span').textContent = Math.round(this.params.platformDistance) + 'px';

        // Progress calculation
        const targetNodes = this.params.nodeDensity;
        const progress = Math.min(100, Math.round((nodes / targetNodes) * 100));
        document.getElementById('stat-progress').textContent = progress + '%';

        // Build time
        const time = this.isAnimating ? (Date.now() - this.startTime) / 1000 : this.buildTime;
        document.getElementById('stat-time').textContent = time.toFixed(1) + 's';

        // Average connections
        const totalConnections = this.algorithms.nodes.reduce((sum, node) => sum + node.connections.length, 0);
        const avgConnections = nodes > 0 ? (totalConnections / nodes).toFixed(1) : 0;
        document.getElementById('stat-avg-conn').textContent = avgConnections;

        // Structural integrity
        const integrity = this.algorithms.checkStructuralIntegrity();
        const integrityText = integrity.hasPath ? `${Math.round(integrity.percentage)}%` : 'NONE';
        const integrityElement = document.getElementById('stat-integrity');
        integrityElement.textContent = integrityText;
        integrityElement.style.color = integrity.hasPath ?
            (integrity.percentage > 50 ? '#2E7D32' : '#FF9800') : '#F44336';
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Find hovered node
        this.hoveredNode = null;
        const hoverRadius = this.params.nodeSize + 5;

        for (let node of this.algorithms.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= hoverRadius) {
                this.hoveredNode = node;
                this.canvas.style.cursor = 'pointer';
                this.draw();
                return;
            }
        }

        this.canvas.style.cursor = 'default';
        this.draw();
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add manual reinforcement node
        if (!this.isAnimating) {
            const newNode = new Node(
                x,
                y,
                (Math.random() - 0.5) * this.params.structuralDepth,
                this.algorithms.nodeIdCounter++,
                999
            );
            this.algorithms.nodes.push(newNode);
            this.algorithms.updateConnections(this.params.connectivityRadius);
            this.draw();
            this.updateStats();
        }
    }

    reset() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.algorithms.reset();
        this.isAnimating = false;
        this.hoveredNode = null;

        // Reset sliders to defaults
        this.params = {
            platformDistance: 500,
            heightDiff: 0,
            nodeDensity: 80,
            connectivityRadius: 100,
            structuralDepth: 60,
            sagArc: 0,
            growthSpeed: 5,
            chaosFactor: 30,
            branchProbability: 25,
            edgeThickness: 3,
            edgeOpacity: 0.7,
            nodeSize: 6,
            nodeColor: '#FFA726',
            bridgeType: 'vine'
        };

        // Update UI
        Object.keys(this.params).forEach(key => {
            const sliderId = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const element = document.getElementById(sliderId);
            if (element) {
                let value = this.params[key];
                if (sliderId.includes('opacity')) {
                    value = value * 100;
                }
                element.value = value;
                this.updateSliderValue(sliderId, value);
            }
        });

        document.getElementById('node-color').value = '#FFA726';

        // Recreate platforms
        this.algorithms.createPlatforms(
            this.canvas,
            this.params.platformDistance,
            this.params.heightDiff
        );

        this.draw();
        this.updateStats();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new BridgeBuilder();
    window.bridgeBuilder = app; // For debugging
});
