# Stellar Web: The Game — Design Document

## Overview

Stellar Web is a semi-idle incremental game where players strategically place nodes in a cosmic environment. Nodes drift through space, bouncing off walls and forming connections with nearby nodes — both actions generating income. Players spend money on upgrades and eventually prestige to reset with permanent bonuses, unlocking new node types and multipliers along the way.

**Target Experience:**
- Semi-idle gameplay — set up, watch, occasionally optimize
- Quick 2–5 minute sessions
- Full completion in 1–2 hours
- Replayable via prestige system

---

## Visual Theme

### Color Palette

| Element | Color |
|---------|-------|
| Background | Dark navy (#0d1b2a) |
| Basic nodes | White/soft blue with glow |
| Magnet nodes | Purple with attraction aura |
| Golden nodes | Gold/yellow with shimmer |
| Edges | White when close, fading to transparent with distance |
| Most connected node | Brighter glow highlight |
| Dark Matter UI | Deep purple accents |

### Aesthetic Direction

- Classic deep space atmosphere
- Clean, minimal, relaxing feel
- Nodes glow brighter when they have more connections
- Edge opacity determined by distance (closer = more visible)
- Subtle floating "+$X" text for all income events

---

## 3D Depth Effects

### Depth Behavior

- **Intensity:** Moderate — noticeable but not overwhelming
- **Size scaling:** Nodes closer to viewer appear larger
- **Opacity:** Distant nodes are dimmer but remain visible

### Parallax Camera

- Mouse movement subtly shifts perspective
- Smooth and gentle, not jarring

---

## Motion & Animation

### Node Movement

- Speed controlled by upgrades
- Nodes drift organically through space
- Calm and fluid movement

### Collision

- Nodes bounce off walls (generates income)
- Nodes bounce off each other (adds chaos and more bounces)

### Edge Transitions

- Edges fade in smoothly when connections form
- Edges fade out smoothly when connections break

### Special Motion Effects

| Effect | Description |
|--------|-------------|
| **Trails** | Nodes leave subtle fading trails as they move |
| **Breathing pulse** | Entire system gently pulses with a slow rhythm |
| **Shooting stars** | Occasional node moves faster, streaking across |

---

## Core Game Loop

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐        │
│    │  Place   │───▶│  Nodes   │───▶│  Earn    │        │
│    │  Nodes   │    │  Move    │    │  Money   │        │
│    └──────────┘    └──────────┘    └──────────┘        │
│         ▲                               │              │
│         │                               ▼              │
│    ┌──────────┐                   ┌──────────┐        │
│    │  Buy     │◀──────────────────│  Spend   │        │
│    │ Upgrades │                   │  Money   │        │
│    └──────────┘                   └──────────┘        │
│         │                                              │
│         ▼                                              │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│    │  Hit     │───▶│ Prestige │───▶│  Earn    │       │
│    │ Ceiling  │    │  Reset   │    │  Dark    │       │
│    └──────────┘    └──────────┘    │  Matter  │       │
│                                     └──────────┘       │
│                                          │             │
│                          ┌───────────────┘             │
│                          ▼                             │
│                    ┌──────────┐                        │
│                    │ Permanent│                        │
│                    │ Bonuses  │───▶ New Run            │
│                    └──────────┘                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Income Generation

### Wall Bounces

- Every time a node hits a wall, player earns money
- Base value increased through upgrades
- More nodes + faster speed = more bounces

### Edge Connections (Proximity)

- Nodes within connectivity radius form edges
- Connected nodes generate passive income per second
- More edges = more passive income
- Edge income and bounce income are roughly equal in importance

### Income Display

- Floating "+$X" text appears for ALL income events
- Bounces, edge ticks, bonuses — everything shows feedback
- Money counter updates smoothly in UI

---

## Node System

### Basic Properties

- **Placement:** Click to place at cursor position
- **Permanence:** Once placed, nodes stay forever
- **Limit:** Maximum nodes determined by upgrades
- **Repositioning:** Not allowed — choose placement wisely

### Node Types

| Type | Behavior | Unlock Method |
|------|----------|---------------|
| **Basic** | Standard movement, bouncing, connections | Starting node |
| **Magnet** | Attracts nearby nodes toward it, creating clusters | Dark Matter purchase |
| **Golden** | 2x income from all its sources (bounces + edges) | Dark Matter purchase |

### Node Collision

- Nodes bounce off each other
- Creates more chaotic movement
- Results in more wall bounces
- Makes placement strategy matter

---

## Upgrade System

### Money Upgrades (Exponential Scaling)

| Upgrade | Effect | Notes |
|---------|--------|-------|
| **Node Limit** | +1 maximum nodes | Core progression |
| **Bounce Value** | Increase money per wall hit | Scales exponentially |
| **Edge Value** | Increase money per edge per second | Scales exponentially |
| **Node Speed** | Faster movement | More bounces, harder to maintain edges |
| **Connectivity Radius** | Easier to form connections | More passive income |
| **Node Size** | Larger nodes | Visual + easier connections |

### Upgrade Strategy

- **Bounce build:** Focus on speed + bounce value
- **Edge build:** Focus on radius + edge value + node limit
- **Balanced:** Mix of both for steady income
- Player can specialize or balance — both viable

---

## Prestige System

### Dark Matter

- Prestige currency earned by resetting
- Amount based on total money earned in run
- Formula displays potential gain before restige

### Prestige Loop

- **Frequency:** Every 10–15 minutes
- **Trigger:** Button always visible, shows potential Dark Matter
- **Reset:** Clears all nodes, money, and money upgrades
- **Keeps:** Dark Matter, permanent bonuses, unlocked node types

### Dark Matter Purchases

| Purchase | Effect | Cost Scaling |
|----------|--------|--------------|
| **Income Multiplier** | +X% to all income permanently | Exponential |
| **Starting Nodes** | +1 node limit at start of each run | Exponential |
| **Magnet Node** | Unlock magnet node type | One-time |
| **Golden Node** | Unlock golden node type | One-time |

---

## Achievements

Achievements provide rewards and guide player progression.

### Milestone Achievements

| Achievement | Requirement | Reward |
|-------------|-------------|--------|
| **First Contact** | Form your first edge | +$100 |
| **Bouncy** | 100 total wall bounces | +$500 |
| **Web Weaver** | Have 10 simultaneous edges | +$1,000 |
| **Network** | Have 25 simultaneous edges | +1 Dark Matter |
| **Millionaire** | Earn $1,000,000 total | +5 Dark Matter |
| **Dark Collector** | Earn 10 Dark Matter total | Income +10% permanent |
| **Prestige Master** | Prestige 5 times | Starting nodes +1 |
| **Full House** | Place maximum nodes | +$10,000 |
| **Golden Age** | Have 3 Golden nodes active | +10 Dark Matter |

### Achievement Display

- Notification popup when earned
- Achievement list viewable in menu
- Shows locked achievements as hints

---

## User Interface

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  $12,450                              [?]  [◈ 5]  [⛶] │
│  +$24/s                                                 │
│                                                         │
│                                                         │
│                      GAME CANVAS                        │
│                   (node placement area)                 │
│                                                         │
│                                                         │
│  [Nodes: 5/8]                                    [⚙️]  │
├─────────────────────────────────────────────────────────┤
│  [Upgrades]  [Nodes]  [Prestige]  [Achievements]       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Node Limit      [Lvl 3]           $500  [BUY]  │   │
│  │  Bounce Value    [Lvl 5]         $1,200  [BUY]  │   │
│  │  Edge Value      [Lvl 4]           $800  [BUY]  │   │
│  │  Node Speed      [Lvl 2]           $300  [BUY]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│            [▶️ Pause]    [↺ Reset Run]                  │
└─────────────────────────────────────────────────────────┘
```

### UI Elements

| Element | Location | Function |
|---------|----------|----------|
| **Money counter** | Top-left | Shows current money + income/sec |
| **Dark Matter** | Top-right | Shows current Dark Matter (◈) |
| **Node counter** | Bottom-left | Shows placed/maximum nodes |
| **Help icon** | Top-right | Opens tutorial/tips |
| **Fullscreen** | Top-right | Expands to full browser |
| **Gear icon** | Bottom-right | Opens upgrade drawer |
| **Drawer tabs** | Bottom | Upgrades, Nodes, Prestige, Achievements |
| **Pause button** | Bottom-center | Freezes game |
| **Reset button** | Bottom-center | Resets current run (no prestige) |

### Drawer Tabs

**Upgrades Tab**
- List of money upgrades
- Shows current level, cost, buy button

**Nodes Tab**
- Shows unlocked node types
- Select which type to place next
- Locked nodes show Dark Matter cost

**Prestige Tab**
- Shows potential Dark Matter gain
- Prestige button with confirmation
- List of Dark Matter purchases

**Achievements Tab**
- List of all achievements
- Completed vs locked status
- Rewards displayed

---

## Tutorial

### First-Time Experience

Guided tutorial that walks players through:

1. **Welcome** — "Welcome to Stellar Web!"
2. **Placing nodes** — "Click anywhere to place your first node"
3. **Wall bounces** — "Watch your node bounce — each hit earns money!"
4. **Connections** — "Place another node nearby to form a connection"
5. **Edge income** — "Connected nodes earn passive income"
6. **Upgrades** — "Open the upgrade menu to spend your money"
7. **Goal** — "Keep upgrading until you can prestige for Dark Matter!"

### Tutorial Skip

- Option to skip for returning players
- Tutorial state saved locally

---

## Audio

### Ambient Music

- Soft, atmospheric background audio
- Loops seamlessly
- Enhances meditative quality

### Sound Effects

| Event | Sound |
|-------|-------|
| Node placed | Soft placement tone |
| Wall bounce | Gentle thud/ping |
| Edge formed | Subtle chime |
| Money collected | Soft coin sound |
| Upgrade purchased | Satisfying ding |
| Achievement unlocked | Celebratory chime |
| Prestige | Grand reset whoosh |

### Audio Controls

- Mute/unmute toggle
- Separate music and SFX volume (optional)

---

## Game Balance

### Early Game (0–5 minutes)

- Start with 3 node limit
- Place nodes, earn from bounces
- First upgrades are cheap
- Goal: reach first prestige threshold

### Mid Game (5–15 minutes)

- Node limit around 5–8
- Edge income becomes significant
- Exponential costs slow progress
- Goal: optimize for prestige

### Prestige Loop (15+ minutes)

- Reset for Dark Matter
- Permanent multipliers speed up next run
- Unlock Magnet and Golden nodes
- Each run faster than the last

### End Game (1–2 hours total)

- High Dark Matter multipliers
- All node types unlocked
- Runs complete in 2–3 minutes
- Final achievements unlocked

---

## Technical Notes

### Performance

- Limit maximum nodes to prevent lag
- Efficient collision detection
- Smooth 60fps target

### Saving

- Auto-save every 30 seconds
- Save on prestige
- Save on tab close
- Local storage (no server needed)

### No Offline Progress

- Game only earns while actively playing
- Encourages active engagement

---

## Summary of Features

### Core Mechanics
1. Click to place permanent nodes
2. Nodes bounce off walls and each other
3. Nearby nodes form income-generating edges
4. Spend money on upgrades
5. Prestige for Dark Matter and permanent bonuses

### Unique Elements
1. **Strategic placement** — position matters somewhat
2. **Dual income** — bounces vs edges, balanced importance
3. **Unlockable node types** — Magnet and Golden add variety
4. **Quick prestige loop** — satisfying 10–15 minute cycles
5. **Clean, relaxing visuals** — deep space aesthetic

### Player Agency
- Choose where to place nodes
- Choose upgrade path (bounces vs edges vs balanced)
- Choose when to prestige
- Choose which node types to unlock first

---

## File Information

- **Project:** Stellar Web: The Game
- **Genre:** Semi-idle Incremental
- **Platform:** Web browser
- **Session Length:** 2–5 minutes
- **Total Playtime:** 1–2 hours
- **Based On:** Stellar Web visualization (Code Quest assignment)
