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

        const platformWidth = 80;
        const platformHeight = canvas.height * 0.6; // Tall canyon edges

        // Left platform (canyon edge)
        const leftPlatform = new Platform(
            centerX - platformDistance / 2 - platformWidth,
            canvas.height * 0.7 - platformHeight,
            platformWidth,
            platformHeight
        );

        // Right platform (canyon edge with height difference)
        const rightPlatform = new Platform(
            centerX + platformDistance / 2,
            canvas.height * 0.7 - platformHeight + heightDiff,
            platformWidth,
            platformHeight
        );

        this.platforms = [leftPlatform, rightPlatform];
        return this.platforms;
    }

    // Create seed nodes on platforms
    createSeedNodes(params) {
        const leftPlatform = this.platforms[0];
        const rightPlatform = this.platforms[1];

        // Left seed nodes - starting points on left platform
        for (let i = 0; i < 3; i++) {
            const node = new Node(
                leftPlatform.x + leftPlatform.width,
                leftPlatform.y + leftPlatform.height * 0.35 + (i * leftPlatform.height * 0.3 / 2),
                0,
                this.nodeIdCounter++,
                0
            );
            node.isPlatform = true;
            node.isFixed = true;
            this.nodes.push(node);
        }

        // Right seed nodes - starting points on right platform
        for (let i = 0; i < 3; i++) {
            const node = new Node(
                rightPlatform.x,
                rightPlatform.y + rightPlatform.height * 0.35 + (i * rightPlatform.height * 0.3 / 2),
                0,
                this.nodeIdCounter++,
                0
            );
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

    // Check for overstretched edges and break them
    checkEdgeBreaking(breakThreshold = 1.5) {
        const edgesToRemove = [];

        for (let i = this.edges.length - 1; i >= 0; i--) {
            const edge = this.edges[i];
            const currentLength = edge.nodeA.distanceTo(edge.nodeB);

            // If edge is stretched beyond threshold, mark for removal
            if (currentLength > edge.length * breakThreshold) {
                edgesToRemove.push(i);

                // Remove connections from nodes
                const idxA = edge.nodeA.connections.indexOf(edge.nodeB.id);
                if (idxA !== -1) edge.nodeA.connections.splice(idxA, 1);

                const idxB = edge.nodeB.connections.indexOf(edge.nodeA.id);
                if (idxB !== -1) edge.nodeB.connections.splice(idxB, 1);
            }
        }

        // Remove broken edges
        edgesToRemove.forEach(idx => {
            this.edges.splice(idx, 1);
        });

        return edgesToRemove.length;
    }

    // ===== VINE/ROOT GROWTH ALGORITHM =====
    vineGrowthStep(params) {
        const targetNodeCount = params.nodeDensity;
        const leftPlatform = this.platforms[0];
        const rightPlatform = this.platforms[1];

        // Center point of the gap
        const centerX = (leftPlatform.x + leftPlatform.width + rightPlatform.x) / 2;
        const centerY = (leftPlatform.y + rightPlatform.y + leftPlatform.height + rightPlatform.height) / 4;

        // Stop if we have enough nodes or hit max steps
        if (this.nodes.length >= targetNodeCount || this.growthStep >= this.maxGrowthSteps) {
            this.isGrowing = false;
            return false;
        }

        // Find growth tips from BOTH sides
        let leftTips = [];
        let rightTips = [];

        if (this.growthStep === 0) {
            // First step: grow from both platform seed nodes
            leftTips = this.nodes.filter(node => node.isPlatform && node.x < centerX);
            rightTips = this.nodes.filter(node => node.isPlatform && node.x > centerX);
        } else {
            // Get all non-fixed nodes
            const activeNodes = this.nodes.filter(node => !node.isFixed && !node.isPlatform);

            // Separate into left side (growing right) and right side (growing left)
            const leftSideNodes = activeNodes.filter(n => n.x < centerX);
            const rightSideNodes = activeNodes.filter(n => n.x > centerX);

            // Get rightmost nodes from left side
            if (leftSideNodes.length > 0) {
                leftSideNodes.sort((a, b) => b.x - a.x);
                leftTips = leftSideNodes.slice(0, 3);
            }

            // Get leftmost nodes from right side
            if (rightSideNodes.length > 0) {
                rightSideNodes.sort((a, b) => a.x - b.x);
                rightTips = rightSideNodes.slice(0, 3);
            }
        }

        // Grow from both sides
        const newNodes = [];

        // Grow from left side toward center
        leftTips.forEach(tip => {
            if (this.nodes.length + newNodes.length >= targetNodeCount) return;

            const dx = centerX - tip.x;
            const dy = centerY - tip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) return; // Close enough to center

            // Direction toward center with chaos
            const chaos = params.chaosFactor / 100;
            const baseAngle = Math.atan2(dy, dx);
            const angle = baseAngle + (Math.random() - 0.5) * Math.PI * chaos * 0.3;

            // Step size - 50% of connectivity radius for reliable connection
            const stepSize = params.connectivityRadius * 0.5;

            const newX = tip.x + Math.cos(angle) * stepSize;
            const newY = tip.y + Math.sin(angle) * stepSize + params.sagArc * 0.02 + (Math.random() - 0.5) * 20;
            const newZ = tip.z + (Math.random() - 0.5) * params.structuralDepth * 0.3;

            newNodes.push(new Node(newX, newY, newZ, this.nodeIdCounter++, this.growthStep + 1));
        });

        // Grow from right side toward center
        rightTips.forEach(tip => {
            if (this.nodes.length + newNodes.length >= targetNodeCount) return;

            const dx = centerX - tip.x;
            const dy = centerY - tip.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) return; // Close enough to center

            // Direction toward center with chaos
            const chaos = params.chaosFactor / 100;
            const baseAngle = Math.atan2(dy, dx);
            const angle = baseAngle + (Math.random() - 0.5) * Math.PI * chaos * 0.3;

            // Step size - 50% of connectivity radius for reliable connection
            const stepSize = params.connectivityRadius * 0.5;

            const newX = tip.x + Math.cos(angle) * stepSize;
            const newY = tip.y + Math.sin(angle) * stepSize + params.sagArc * 0.02 + (Math.random() - 0.5) * 20;
            const newZ = tip.z + (Math.random() - 0.5) * params.structuralDepth * 0.3;

            newNodes.push(new Node(newX, newY, newZ, this.nodeIdCounter++, this.growthStep + 1));
        });

        // Add all new nodes
        this.nodes.push(...newNodes);

        this.growthStep++;
        this.updateConnections(params.connectivityRadius);
        return true;
    }

    // Check structural integrity - BFS to see if left platform connects to right platform
    checkStructuralIntegrity() {
        if (this.nodes.length === 0) return { hasPath: false, percentage: 0 };

        const leftPlatform = this.platforms[0];
        const rightPlatform = this.platforms[1];

        // Get left and right platform nodes
        const leftNodes = this.nodes.filter(n => n.isPlatform && n.x < leftPlatform.x + leftPlatform.width + 10);
        const rightNodes = this.nodes.filter(n => n.isPlatform && n.x > rightPlatform.x - 10);

        if (leftNodes.length === 0 || rightNodes.length === 0) {
            return { hasPath: false, percentage: 0 };
        }

        // BFS from left platform nodes to right platform nodes
        const visited = new Set();
        const queue = [];

        // Start from all left platform nodes
        leftNodes.forEach(node => {
            queue.push(node.id);
            visited.add(node.id);
        });

        let foundConnection = false;

        while (queue.length > 0) {
            const currentId = queue.shift();
            const currentNode = this.nodes.find(n => n.id === currentId);

            if (!currentNode) continue;

            // Check if we reached right platform
            if (rightNodes.some(n => n.id === currentId)) {
                foundConnection = true;
                break;
            }

            // Add connected nodes to queue
            for (const connId of currentNode.connections) {
                if (!visited.has(connId)) {
                    visited.add(connId);
                    queue.push(connId);
                }
            }
        }

        // Calculate integrity percentage based on connection density
        const totalPossibleEdges = this.nodes.length * (this.nodes.length - 1) / 2;
        const actualEdges = this.edges.length;
        const densityPercentage = Math.min(100, (actualEdges / Math.max(1, totalPossibleEdges * 0.1)) * 100);

        return {
            hasPath: foundConnection,
            percentage: foundConnection ? densityPercentage : 0
        };
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
