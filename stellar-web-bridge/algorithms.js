// Bridge generation algorithms
class BridgeAlgorithms {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.platforms = [];
        this.nodeIdCounter = 0;
        this.isGrowing = false;
        this.growthStep = 0;
        this.maxGrowthSteps = 200; // Increased to allow more time for bridge completion
        this.roadNodes = []; // Nodes that form the road on top
    }

    // Reset the bridge
    reset() {
        this.nodes = [];
        this.edges = [];
        this.platforms = [];
        this.nodeIdCounter = 0;
        this.isGrowing = false;
        this.growthStep = 0;
        this.roadNodes = [];
    }

    // Create platforms
    createPlatforms(canvas, platformDistance, heightDiff) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const platformWidth = 60;
        const platformHeight = 80;

        // Left platform
        const leftPlatform = new Platform(
            centerX - platformDistance / 2 - platformWidth,
            centerY - platformHeight / 2,
            platformWidth,
            platformHeight
        );

        // Right platform (with height difference)
        const rightPlatform = new Platform(
            centerX + platformDistance / 2,
            centerY - platformHeight / 2 + heightDiff,
            platformWidth,
            platformHeight
        );

        this.platforms = [leftPlatform, rightPlatform];
        return this.platforms;
    }

    // Create seed nodes on platforms
    createSeedNodes(params) {
        const leftPlatform = this.platforms[0];

        // Only left seed nodes (starting points for bridge growth)
        for (let i = 0; i < 3; i++) {
            const node = new Node(
                leftPlatform.x + leftPlatform.width,
                leftPlatform.y + leftPlatform.height * (i + 1) / 4,
                (Math.random() - 0.5) * params.structuralDepth * 0.5,
                this.nodeIdCounter++,
                0
            );
            // Mark as platform for visual distinction and to anchor them
            node.isPlatform = true;
            node.isFixed = true;
            this.nodes.push(node);
        }
    }

    // Update connections based on connectivity radius
    updateConnections(connectivityRadius) {
        // Clear existing edges
        this.edges = [];
        this.nodes.forEach(node => node.connections = []);

        // Create edges within connectivity radius
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const distance = this.nodes[i].distanceTo(this.nodes[j]);
                if (distance <= connectivityRadius) {
                    this.nodes[i].addConnection(this.nodes[j].id);
                    this.nodes[j].addConnection(this.nodes[i].id);
                    this.edges.push(new Edge(this.nodes[i], this.nodes[j]));
                }
            }
        }
    }

    // Apply edge forces for physics simulation
    applyEdgeForces(stiffness = 0.005) {
        this.edges.forEach(edge => {
            const dx = edge.nodeB.x - edge.nodeA.x;
            const dy = edge.nodeB.y - edge.nodeA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                const force = (distance - edge.length) * stiffness;
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                edge.nodeA.applyForce(fx, fy);
                edge.nodeB.applyForce(-fx, -fy);
            }
        });

        // Ensure platform/fixed nodes have zero velocity
        this.nodes.forEach(node => {
            if (node.isFixed || node.isPlatform) {
                node.vx = 0;
                node.vy = 0;
            }
        });
    }

    // ===== VINE/ROOT GROWTH ALGORITHM =====
    vineGrowthStep(params) {
        const targetNodeCount = params.nodeDensity;

        // Stop if we've reached target nodes or max steps
        if (this.nodes.length >= targetNodeCount || this.growthStep >= this.maxGrowthSteps) {
            this.isGrowing = false;
            return false;
        }

        const leftPlatform = this.platforms[0];
        const rightPlatform = this.platforms[1];

        // Target is always the right platform
        const targetX = rightPlatform.x;
        const targetY = rightPlatform.y + rightPlatform.height / 2;

        // Find growth tips - nodes at the growing front
        let growthTips = [];

        if (this.growthStep === 0) {
            // First step: grow from left platform/seed nodes only
            growthTips = this.nodes.filter(node => node.isPlatform);
        } else {
            // Find the rightmost nodes (growth front moving toward right)
            const activeNodes = this.nodes.filter(node => !node.isFixed);

            if (activeNodes.length > 0) {
                // Sort by x position (descending) and take the rightmost nodes
                activeNodes.sort((a, b) => b.x - a.x);
                growthTips = activeNodes.slice(0, 5); // Take top 5 rightmost nodes
            }

            // If no active nodes, use recent generation
            if (growthTips.length === 0) {
                growthTips = this.nodes.filter(node =>
                    node.generation >= this.growthStep - 2 && !node.isFixed
                ).slice(0, 5);
            }
        }

        // If still no tips, stop growing
        if (growthTips.length === 0) {
            this.isGrowing = false;
            return false;
        }

        // Grow from each tip toward the right
        const newNodes = [];
        growthTips.forEach(tip => {
            if (this.nodes.length + newNodes.length >= targetNodeCount) return;

            // Calculate direction toward right platform
            const dx = targetX - tip.x;
            const dy = targetY - tip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 30) return; // Already very close to target

            const nx = dx / dist;
            const ny = dy / dist;

            // Determine number of branches based on probability
            const shouldBranch = Math.random() * 100 < params.branchProbability;
            const branches = shouldBranch ? 2 : 1;

            for (let b = 0; b < branches; b++) {
                if (this.nodes.length + newNodes.length >= targetNodeCount) break;

                // Add chaos/randomness to angle
                const chaos = params.chaosFactor / 100;
                const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * Math.PI * chaos * 0.3;

                // Growth step length - adaptive based on distance remaining
                const baseLength = Math.min(60, dist * 0.25);
                const length = baseLength + Math.random() * 20;

                // New node position
                const newX = tip.x + Math.cos(angle) * length;
                const newY = tip.y + Math.sin(angle) * length + params.sagArc * 0.02;
                const newZ = tip.z + (Math.random() - 0.5) * 15;

                // Create new node
                const newNode = new Node(
                    newX,
                    newY,
                    newZ,
                    this.nodeIdCounter++,
                    this.growthStep + 1
                );

                newNodes.push(newNode);
            }
        });

        // Add all new nodes
        this.nodes.push(...newNodes);

        this.growthStep++;
        this.updateConnections(params.connectivityRadius);
        return true;
    }

    // Identify the top nodes that form the road surface
    identifyRoadNodes() {
        if (this.nodes.length === 0) return;

        // Find nodes that could be part of the road (top pathway nodes)
        const leftPlatform = this.platforms[0];
        const rightPlatform = this.platforms[1];

        // Find all non-platform nodes
        const bridgeNodes = this.nodes.filter(node => !node.isPlatform);

        if (bridgeNodes.length === 0) return;

        // Calculate average Y position to understand the bridge profile
        const avgY = bridgeNodes.reduce((sum, node) => sum + node.y, 0) / bridgeNodes.length;

        // Get the minimum Y value (top of bridge) in each X segment
        const segments = 30; // More segments for better road coverage
        const segmentWidth = (rightPlatform.x - leftPlatform.x - leftPlatform.width) / segments;

        const tempRoadNodes = [];

        for (let i = 0; i <= segments; i++) {
            const xStart = leftPlatform.x + leftPlatform.width + (i * segmentWidth);
            const xEnd = xStart + segmentWidth;

            // Find nodes in this segment
            const segmentNodes = bridgeNodes.filter(node =>
                node.x >= xStart && node.x < xEnd
            );

            if (segmentNodes.length > 0) {
                // Get nodes in top 30% of bridge (upper part only)
                const topCandidates = segmentNodes.filter(node => node.y < avgY);

                if (topCandidates.length > 0) {
                    // Get the topmost node (minimum y)
                    const topNode = topCandidates.reduce((top, node) =>
                        node.y < top.y ? node : top
                    );

                    // Mark as road node if it has connections
                    if (topNode.connections.length >= 1) {
                        tempRoadNodes.push(topNode);
                    }
                } else if (segmentNodes.length > 0) {
                    // Fallback to topmost in segment if no nodes above average
                    const topNode = segmentNodes.reduce((top, node) =>
                        node.y < top.y ? node : top
                    );
                    if (topNode.connections.length >= 1) {
                        tempRoadNodes.push(topNode);
                    }
                }
            }
        }

        // Remove duplicates and store IDs
        const uniqueNodes = Array.from(new Set(tempRoadNodes));
        this.roadNodes = uniqueNodes.map(node => node.id);
    }

}
