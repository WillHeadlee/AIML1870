// Node class represents a structural point in the bridge
class Node {
    constructor(x, y, z = 0, id, generation = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z; // For depth/3D effect
        this.vx = 0; // Velocity for physics-based algorithms
        this.vy = 0;
        this.connections = []; // Array of connected node IDs
        this.isFixed = false; // Platform nodes don't move
        this.generation = generation; // Which growth wave created it
        this.age = 0; // For animation effects
        this.isActive = true; // For growth animation
        this.targetX = x; // For swarm behavior
        this.targetY = y;
        this.isPlatform = false; // Mark platform nodes
    }

    // Add connection to another node
    addConnection(nodeId) {
        if (!this.connections.includes(nodeId)) {
            this.connections.push(nodeId);
        }
    }

    // Calculate distance to another node
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dz = this.z - other.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // Update position (for physics-based algorithms)
    update(damping = 0.95, maxVelocity = 5, gravity = 0.15) {
        if (!this.isFixed) {
            // Apply gravity (downward force)
            this.vy += gravity;

            // Apply damping
            this.vx *= damping;
            this.vy *= damping;

            // Cap velocity to prevent instability
            const velocityMagnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (velocityMagnitude > maxVelocity) {
                this.vx = (this.vx / velocityMagnitude) * maxVelocity;
                this.vy = (this.vy / velocityMagnitude) * maxVelocity;
            }

            this.x += this.vx;
            this.y += this.vy;
        }
        this.age++;
    }

    // Apply force (for physics-based algorithms)
    applyForce(fx, fy) {
        if (!this.isFixed) {
            this.vx += fx;
            this.vy += fy;
        }
    }

    // Draw the node on canvas
    draw(ctx, nodeSize, color, glow = false, isRoadPiece = false) {
        // Z-depth affects size and opacity
        const depthScale = 1 + (this.z * 0.002);
        const size = nodeSize * depthScale;
        const alpha = 0.9 + (this.z * 0.002);

        ctx.save();
        ctx.globalAlpha = alpha;

        if (isRoadPiece) {
            // Draw road piece (flat rectangle with stripes)
            const roadWidth = size * 4;
            const roadHeight = size * 2;

            // Road base
            ctx.fillStyle = '#696969';
            ctx.fillRect(this.x - roadWidth/2, this.y - roadHeight/2, roadWidth, roadHeight);

            // Road border
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x - roadWidth/2, this.y - roadHeight/2, roadWidth, roadHeight);

            // Yellow road stripe
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x - roadWidth/2 + roadWidth * 0.45, this.y - roadHeight/2, roadWidth * 0.1, roadHeight);
        } else {
            // Draw nail (metal nail head with shading)
            // Nail head gradient for metallic 3D look
            const nailGradient = ctx.createRadialGradient(
                this.x - size/3, this.y - size/3, 0,
                this.x, this.y, size * 1.2
            );
            nailGradient.addColorStop(0, '#E0E0E0');
            nailGradient.addColorStop(0.4, '#A0A0A0');
            nailGradient.addColorStop(0.7, '#707070');
            nailGradient.addColorStop(1, '#505050');

            // Draw nail head circle
            ctx.fillStyle = nailGradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.fill();

            // Dark edge for nail head
            ctx.strokeStyle = '#404040';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
            ctx.stroke();

            // Highlight shine on nail
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(this.x - size/3, this.y - size/3, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Cross indent on nail head for realism
            ctx.strokeStyle = '#505050';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x - size * 0.5, this.y);
            ctx.lineTo(this.x + size * 0.5, this.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - size * 0.5);
            ctx.lineTo(this.x, this.y + size * 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// Edge class represents a connection between two nodes
class Edge {
    constructor(nodeA, nodeB) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.length = nodeA.distanceTo(nodeB);
        this.age = 0;
    }

    // Update edge properties
    update() {
        this.length = this.nodeA.distanceTo(this.nodeB);
        this.age++;
    }

    // Draw the edge on canvas
    draw(ctx, thickness, opacity, color, stressVisualization = false) {
        // Z-depth affects opacity
        const avgZ = (this.nodeA.z + this.nodeB.z) / 2;
        const depthAlpha = 0.8 + (avgZ * 0.002);
        const finalAlpha = Math.min(opacity, depthAlpha);

        ctx.save();
        ctx.globalAlpha = finalAlpha;

        // Calculate stress/strain
        const currentLength = this.nodeA.distanceTo(this.nodeB);
        const strain = (currentLength - this.length) / this.length;

        // Determine color based on stress if visualization is enabled
        let baseColor1, baseColor2, baseColor3;

        if (stressVisualization) {
            if (strain > 0.15) {
                // High tension (stretched) - red
                const intensity = Math.min(strain * 2, 1);
                baseColor1 = `rgb(${150 + intensity * 105}, ${50 * (1 - intensity)}, ${50 * (1 - intensity)})`;
                baseColor2 = `rgb(${200 + intensity * 55}, ${80 * (1 - intensity)}, ${80 * (1 - intensity)})`;
                baseColor3 = baseColor1;
            } else if (strain < -0.05) {
                // Compression - blue
                const intensity = Math.min(Math.abs(strain) * 4, 1);
                baseColor1 = `rgb(${50 * (1 - intensity)}, ${100 * (1 - intensity)}, ${150 + intensity * 105})`;
                baseColor2 = `rgb(${80 * (1 - intensity)}, ${130 * (1 - intensity)}, ${200 + intensity * 55})`;
                baseColor3 = baseColor1;
            } else {
                // Normal stress - green
                baseColor1 = '#2E7D32';
                baseColor2 = '#4CAF50';
                baseColor3 = '#2E7D32';
            }
        } else {
            // Default wood colors
            baseColor1 = '#654321';
            baseColor2 = '#8B4513';
            baseColor3 = '#654321';
        }

        // Draw wooden beam with 3D effect
        const dx = this.nodeB.x - this.nodeA.x;
        const dy = this.nodeB.y - this.nodeA.y;
        const angle = Math.atan2(dy, dx);

        // Wood beam gradient (from light to dark for 3D effect)
        const gradient = ctx.createLinearGradient(
            this.nodeA.x - Math.sin(angle) * thickness,
            this.nodeA.y + Math.cos(angle) * thickness,
            this.nodeA.x + Math.sin(angle) * thickness,
            this.nodeA.y - Math.cos(angle) * thickness
        );

        gradient.addColorStop(0, baseColor1);
        gradient.addColorStop(0.5, baseColor2);
        gradient.addColorStop(1, baseColor3);

        ctx.lineWidth = thickness * 2;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';

        // Draw main wooden beam
        ctx.beginPath();
        ctx.moveTo(this.nodeA.x, this.nodeA.y);
        ctx.lineTo(this.nodeB.x, this.nodeB.y);
        ctx.stroke();

        // Draw highlight edge for wood grain (unless stress viz is on)
        if (!stressVisualization) {
            ctx.lineWidth = thickness * 0.6;
            ctx.strokeStyle = 'rgba(205, 133, 63, 0.4)';
            ctx.beginPath();
            ctx.moveTo(this.nodeA.x, this.nodeA.y);
            ctx.lineTo(this.nodeB.x, this.nodeB.y);
            ctx.stroke();
        }

        ctx.restore();
    }

    // Draw with gradient effect
    drawGradient(ctx, thickness, opacity, colorA, colorB) {
        const gradient = ctx.createLinearGradient(
            this.nodeA.x, this.nodeA.y,
            this.nodeB.x, this.nodeB.y
        );
        gradient.addColorStop(0, colorA);
        gradient.addColorStop(1, colorB);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.lineWidth = thickness;
        ctx.strokeStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(this.nodeA.x, this.nodeA.y);
        ctx.lineTo(this.nodeB.x, this.nodeB.y);
        ctx.stroke();

        ctx.restore();
    }
}

// Platform class represents the structures the bridge connects
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    draw(ctx, color) {
        // Draw stone/dirt platform with texture
        const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y);
        gradient.addColorStop(0, '#8B7355');
        gradient.addColorStop(0.5, '#A0826D');
        gradient.addColorStop(1, '#8B7355');

        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Stone texture (random rectangles)
        ctx.fillStyle = 'rgba(101, 67, 33, 0.2)';
        for (let i = 0; i < 5; i++) {
            const stoneX = this.x + Math.random() * this.width;
            const stoneY = this.y + Math.random() * this.height;
            const stoneW = 10 + Math.random() * 15;
            const stoneH = 8 + Math.random() * 12;
            ctx.fillRect(stoneX, stoneY, stoneW, stoneH);
        }

        // Platform border
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 4;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Top grass on platform
        ctx.fillStyle = '#5FAD56';
        ctx.fillRect(this.x, this.y - 5, this.width, 5);
    }
}
