# Stellar Web Bridge Builder

A procedural bridge generator that uses particle/node systems to create dynamic, animated bridges between two platforms. Built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Features

### 5 Bridge Generation Algorithms

1. **Vine/Root Growth** - Organic, tendril-like growth from both platforms toward the middle
2. **Particle Swarm Construction** - Nodes seek the middle and settle when they find stable connections
3. **Cable/Suspension Style** - Mathematical arc with vertical suspenders, engineering-accurate
4. **Truss Generation** - Structural truss patterns with upper chord, lower chord, and web members
5. **Crystalline Growth** - Grid-based growth that spreads like frost or crystal formation
6. **Random/Hybrid** - Randomly selects one of the above algorithms

### Control Parameters

#### Structure Parameters
- **Platform Distance** (200-800px) - Horizontal gap to span
- **Height Difference** (-200 to +200px) - Elevation change between platforms
- **Node Density** (10-200) - How many structural nodes
- **Connectivity Radius** (20-150px) - How far nodes reach to connect
- **Structural Depth** (20-150px) - Vertical thickness of bridge
- **Sag/Arc Amount** (-100 to +100px) - Suspension droop or arch height

#### Growth Parameters
- **Growth Speed** (1-10) - Animation speed of construction
- **Chaos Factor** (0-100%) - Randomness (0 = geometric, 100 = organic)
- **Branch Probability** (0-100%) - How often growth splits into multiple paths

#### Visual Parameters
- **Edge Thickness** (1-8px) - Line width for connections
- **Edge Opacity** (10-100%) - Transparency of connections
- **Node Size** (2-15px) - Radius of each node

### Color Themes

- **Night City** - Dark with orange/yellow glowing nodes
- **Blueprint** - Classic engineering blueprint style
- **Organic** - Forest green and brown natural tones
- **Neon** - Cyberpunk cyan and magenta
- **Minimal** - Clean black and white
- **Sunset** - Warm orange gradient

### Interactive Features

- **Generate Button** - Creates a new bridge with current settings
- **Reset Button** - Clears canvas and returns sliders to defaults
- **Hover Highlighting** - Mouse over nodes to highlight their connections
- **Manual Node Placement** - Click on canvas to add reinforcement nodes
- **Real-time Statistics** - Track nodes, edges, span length, progress, build time, and average connections

### Statistics Panel

Displays real-time metrics:
- Total Nodes
- Total Edges
- Span Length
- Construction Progress
- Build Time
- Average Connections per Node

## How to Use

1. Open `index.html` in a web browser
2. Select a bridge type from the dropdown
3. Adjust parameters using the sliders
4. Click "Generate Bridge" to watch it grow
5. Hover over nodes to see their connections
6. Click on the canvas to manually add reinforcement nodes

## Technical Implementation

### Architecture

- **nodes.js** - Node, Edge, and Platform classes
- **algorithms.js** - All bridge generation algorithms
- **main.js** - Main application logic, animation loop, and UI controls
- **style.css** - Dark theme UI styling
- **index.html** - HTML structure

### Key Classes

- `Node` - Represents a structural point with position, connections, and physics properties
- `Edge` - Represents connections between nodes with visual properties
- `Platform` - The structures the bridge connects
- `BridgeAlgorithms` - Contains all generation algorithms
- `BridgeBuilder` - Main application controller

### Animation Loop

- Uses `requestAnimationFrame` for smooth 60fps rendering
- Growth steps triggered at intervals based on speed slider
- Edge connections recalculated dynamically within connectivity radius
- Real-time statistics updates during construction

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript (classes, arrow functions)
- CSS Grid and Flexbox

## Performance

- Optimized for up to 200 nodes
- Dynamic connection radius reduces unnecessary calculations
- Efficient canvas rendering with minimal redraws

## Future Enhancements

- Physics mode with gravity simulation
- Save/Load bridge designs as JSON
- Gallery of preset configurations
- Multi-span bridges with intermediate pillars
- Sound effects during construction
- Export as image or video

## Credits

Created as a creative interpretation of a particle system assignment. Inspired by procedural generation, force-directed graphs, and real bridge engineering.

## License

Free to use and modify for educational purposes.
