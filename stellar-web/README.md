# Stellar Web

An interactive particle-based network visualization that demonstrates emergent behavior through proximity-based connections. Nodes drift through 3D space while edges dynamically form between particles that are close enough, creating an ever-shifting constellation of relationships.

## Features

### Visual Effects
- **3D Depth Rendering**: Nodes exist in 3D space with depth-based size and opacity
- **Parallax Camera**: Mouse movement creates an immersive 3D perspective
- **Dynamic Connections**: Edges form and fade based on proximity
- **Breathing Pulse**: Gentle pulsing animation across the entire system
- **Trail Effects**: Nodes leave subtle fading trails as they move
- **Shooting Stars**: Occasional nodes streak across the canvas at high speed

### Interactivity
- **Mouse Gravity**: Cursor acts as a gravity well, attracting nearby nodes
- **Click to Spawn**: Create new nodes by clicking anywhere on the canvas
- **Hover Highlighting**: Hover over nodes to highlight all their connections
- **Fullscreen Mode**: Expand to fill the entire browser window

### Controls
- **Node Count**: Adjust the total number of particles (20-200)
- **Connectivity Radius**: Control the distance threshold for edge formation (50-300)
- **Node Speed**: Set the velocity of particle movement (0.1-3.0)
- **Node Size**: Change the radius of each particle (2-10)
- **Trail Length**: Adjust the duration before trails fade (0-100)
- **Mouse Gravity**: Control the force of cursor attraction (0-5)

### Real-Time Statistics
- **Total Edges**: Current count of all connections
- **Average Connections**: Mean number of edges per node
- **Most Connected**: Node with highest edge count (highlighted in blue)
- **Network Density**: Percentage of possible connections that exist
- **Node Count**: Current total nodes (updates when you spawn new ones)
- **FPS**: Real-time performance indicator

## Performance Optimizations

- **Spatial Partitioning**: Efficient distance calculations for large node counts
- **Optimized Rendering**: Trail effects use fading opacity rather than stored positions
- **Smart Edge Drawing**: Only calculates distances for nearby nodes

## How to Use

1. Open `index.html` in a modern web browser
2. Use the control panel (gear icon) to adjust parameters
3. Click anywhere to spawn new nodes
4. Hover over nodes to see their connections
5. Move your mouse to attract nearby nodes
6. Press the pause button (▶️) to freeze motion
7. Press the reset button (↺) to regenerate the network

## Technical Implementation

- **Pure JavaScript**: No external dependencies
- **Canvas API**: High-performance 2D rendering
- **3D Projection**: Each node has x, y, z coordinates
- **Emergent Behavior**: Complex network patterns from simple proximity rules

## Files

- `index.html` - Main HTML structure and UI elements
- `main.js` - Core visualization logic and Node class
- `style.css` - Styling for the UI and control panel
- `README.md` - This file

## Browser Compatibility

Works best in modern browsers with full Canvas API support:
- Chrome/Edge (recommended)
- Firefox
- Safari

Enjoy exploring the emergent patterns of the Stellar Web!
