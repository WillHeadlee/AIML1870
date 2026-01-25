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
        this.draggedNode = null;
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

        // Theme selector
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.switchTheme(e.target.value);
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

        this.canvas.addEventListener('mousedown', (e) => {
            this.handleMouseDown(e);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            this.handleMouseUp(e);
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
        skyGradient.addColorStop(0, this.colors.background);
        skyGradient.addColorStop(1, this.colors.background + 'CC'); // Slightly lighter
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);

        // Draw grass ground
        const grassGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.7, 0, this.canvas.height);
        grassGradient.addColorStop(0, this.colors.grassGreen || '#5FAD56');
        grassGradient.addColorStop(1, this.colors.darkGreen || '#4A7C59');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);

        // Draw grass texture (small vertical lines)
        const grassColor = this.colors.darkGreen || '#4A7C59';
        this.ctx.strokeStyle = grassColor + '4D'; // 30% opacity
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
            const road = new Road(
                this.algorithms.roadNodes,
                this.algorithms.nodes,
                this.algorithms.platforms
            );
            const roadHeight = this.params.nodeSize * 3;
            road.draw(this.ctx, roadHeight);
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

    switchTheme(theme) {
        // Remove existing theme classes
        document.body.classList.remove('theme-night', 'theme-blueprint');

        // Apply new theme
        if (theme === 'night') {
            document.body.classList.add('theme-night');
            this.updateCanvasColors('#0F172A', '#1E3A2F', '#152920');
        } else if (theme === 'blueprint') {
            document.body.classList.add('theme-blueprint');
            this.updateCanvasColors('#1E3A8A', '#1E3A5F', '#172B4D');
        } else {
            // Default theme
            this.updateCanvasColors('#87CEEB', '#5FAD56', '#4A7C59');
        }

        // Redraw canvas with new colors
        this.draw();
    }

    updateCanvasColors(skyColor, grassColor, darkGrassColor) {
        this.colors.background = skyColor;
        this.colors.grassGreen = grassColor;
        this.colors.darkGreen = darkGrassColor;
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // If dragging a node, update its position
        if (this.draggedNode) {
            // Update node position
            this.draggedNode.x = x;
            this.draggedNode.y = y;

            // Zero out velocity while being dragged
            this.draggedNode.vx = 0;
            this.draggedNode.vy = 0;

            // Update edge lengths for connected edges
            this.algorithms.edges.forEach(edge => {
                if (edge.nodeA.id === this.draggedNode.id || edge.nodeB.id === this.draggedNode.id) {
                    edge.update();
                }
            });

            // Don't animate while dragging - draw immediately
            if (!this.isAnimating) {
                this.draw();
                this.updateStats();
            }
            return;
        }

        // Find hovered node
        this.hoveredNode = null;
        const hoverRadius = this.params.nodeSize + 5;

        for (let node of this.algorithms.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= hoverRadius) {
                this.hoveredNode = node;
                this.canvas.style.cursor = node.isPlatform || node.isFixed ? 'not-allowed' : 'grab';
                if (!this.isAnimating) {
                    this.draw();
                }
                return;
            }
        }

        this.canvas.style.cursor = 'default';
        if (!this.isAnimating) {
            this.draw();
        }
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on a node
        const hoverRadius = this.params.nodeSize + 5;

        for (let node of this.algorithms.nodes) {
            const dx = node.x - x;
            const dy = node.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= hoverRadius) {
                // Don't allow dragging platform/fixed nodes
                if (!node.isPlatform && !node.isFixed) {
                    this.draggedNode = node;
                    this.canvas.style.cursor = 'grabbing';
                    e.preventDefault();
                }
                return;
            }
        }
    }

    handleMouseUp(e) {
        if (this.draggedNode) {
            this.draggedNode = null;
            this.canvas.style.cursor = 'default';

            // Redraw to update hover state
            if (!this.isAnimating) {
                this.draw();
                this.updateStats();
            }
        }
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
        this.draggedNode = null;

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
