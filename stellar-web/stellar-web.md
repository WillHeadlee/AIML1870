# Stellar Web — Design Specification

## Overview

Stellar Web is an interactive particle-based network visualization that demonstrates emergent behavior through proximity-based connections. Nodes drift through 3D space while edges dynamically form between particles that are close enough, creating an ever-shifting constellation of relationships.

---

## Visual Theme

### Color Palette

| Element | Color |
|---------|-------|
| Background | Dark navy (#0d1b2a) |
| Nodes | White/soft blue with glow |
| Edges | White when close, fading to transparent with distance |
| Highlighted node | Brighter glow to indicate most-connected |

### Aesthetic Direction

- Classic deep space atmosphere
- Nodes should glow brighter when they have more connections
- Edge opacity determined by distance between connected nodes (closer = more visible)
- Clean, minimal feel with depth and emergence

---

## 3D Depth Effects

### Depth Behavior

- **Intensity:** Moderate — noticeable but not overwhelming
- **Size scaling:** Nodes closer to the viewer appear larger
- **Opacity:** Distant nodes are dimmer but remain visible
- **No fog effect** — maintain visibility across all depths

### Parallax Camera

- Mouse movement subtly shifts the perspective
- Creates an immersive sense of looking into 3D space
- Movement should be smooth and gentle, not jarring

---

## Motion & Animation

### Node Movement

- Speed controlled by user via slider
- Nodes drift organically through space
- Movement should feel calm and fluid

### Edge Transitions

- Edges fade in smoothly when connections form
- Edges fade out smoothly when connections break
- No instant appear/disappear — always animated

### Special Motion Effects

| Effect | Description |
|--------|-------------|
| **Trails** | Nodes leave subtle fading trails as they move |
| **Breathing pulse** | Entire system gently pulses with a slow rhythm |
| **Shooting stars** | Occasional node moves faster, streaking across the canvas |

---

## User Interaction

### Cursor Behavior

- Cursor acts as a gravity well
- Nearby nodes are attracted toward the mouse position
- Strength of attraction controlled by slider

### Click Actions

- Clicking spawns a new node at cursor position
- Display a brief prompt or visual confirmation when node is created
- New nodes immediately participate in the network

### Hover Behavior

- Hovering over a node highlights all of its current connections
- Connected edges and neighbor nodes should visually stand out
- Effect clears when cursor moves away

---

## Control Panel

### Layout

- **Access point:** Gear icon in bottom-right corner
- **Panel type:** Bottom drawer that slides up
- **Default state:** Visible when page loads
- **Organization:** Two tabs — "Controls" and "Stats"

### Sliders (Controls Tab)

| Slider | Function | Suggested Range |
|--------|----------|-----------------|
| Node Count | Total number of particles | 20–200 |
| Connectivity Radius | Distance threshold for edge formation | 50–300 |
| Node Speed | Velocity of particle movement | 0.1–3.0 |
| Node Size | Radius of each particle | 2–10 |
| Trail Length | Duration before trails fade | 0–100 |
| Mouse Gravity Strength | Force of cursor attraction | 0–5 |

---

## Network Statistics (Stats Tab)

Display real-time metrics that update as the network evolves:

| Metric | Description |
|--------|-------------|
| **Total Edges** | Current count of all connections |
| **Avg Connections** | Mean number of edges per node |
| **Most Connected** | Node with highest edge count (highlight this node visually on canvas) |
| **Network Density** | Percentage of possible connections that exist |
| **Node Count** | Current total nodes (changes when user spawns new ones) |
| **FPS** | Frames per second performance indicator |

---

## Special Features

### Pause Button

- Freezes all node movement
- Edges remain visible in frozen state
- Allows user to admire current network structure
- Toggle to resume movement

### Audio

- **Ambient music:** Soft, atmospheric background audio
- **Connection chime:** Subtle sound plays when new edges form
- Audio should enhance the meditative quality without being intrusive
- Consider adding a mute/volume control

### Reset Button

- Clears all nodes from the canvas
- Regenerates initial node population
- Resets statistics to zero
- Does not reset slider values

### Fullscreen Mode

- Expands canvas to fill entire browser window
- Controls remain accessible
- Press escape or click button to exit

---

## Page Structure

### Title

**Stellar Web**

### Help System

- Small help icon (question mark or "?" symbol)
- Clicking reveals tooltip or modal with usage tips
- Tips should cover:
  - How sliders affect the visualization
  - Click to spawn nodes
  - Hover to see connections
  - Cursor attracts nearby nodes
  - Keyboard shortcuts (if any)

### Suggested Layout

```
┌─────────────────────────────────────────────────┐
│                                          [?] [⛶]│
│                                                 │
│                                                 │
│                  CANVAS                         │
│              (fullscreen area)                  │
│                                                 │
│                                                 │
│                                          [⚙️]   │
├─────────────────────────────────────────────────┤
│  [Controls] [Stats]                    [▶️] [↺] │
│                                                 │
│  ○───────────── Node Count ─────────────○      │
│  ○───────────── Connectivity ───────────○      │
│  ○───────────── Speed ──────────────────○      │
│                    ...                          │
└─────────────────────────────────────────────────┘
```

Legend:
- `[?]` — Help icon
- `[⛶]` — Fullscreen toggle
- `[⚙️]` — Gear icon (drawer toggle)
- `[▶️]` — Pause/play button
- `[↺]` — Reset button

---

## Technical Notes

### Performance Considerations

- Limit maximum node count to prevent lag
- Use efficient distance calculations (consider spatial partitioning for large node counts)
- Trail effect should use fading opacity, not stored positions
- Monitor FPS and provide feedback to user

### Edge Rendering

- Calculate distance between all node pairs each frame
- Draw edge only if distance < connectivity radius
- Edge opacity = 1 - (distance / connectivity radius)
- Edge color: white with calculated opacity

### 3D Projection

- Each node has x, y, z coordinates
- Z affects rendered size and opacity
- Parallax shifts x, y based on mouse offset from center

---

## Summary of Unique Features

1. **Emergent network behavior** from simple proximity rules
2. **Dynamic 3D depth** with parallax camera movement
3. **Living motion** — trails, breathing pulse, shooting stars
4. **Gravitational cursor** that attracts nodes
5. **Interactive spawning** with click-to-create
6. **Hover highlighting** to explore connections
7. **Real-time statistics** with visual indicators
8. **Ambient soundscape** with connection chimes
9. **Clean, collapsible UI** that doesn't obstruct the view

---

## File Information

- **Project:** Stellar Web
- **Type:** Interactive Web Visualization
- **Assignment:** Particles to Networks — Code Quest
