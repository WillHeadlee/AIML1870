# Echoes of Blue

A 2D story-driven dolphin simulator about a captive dolphin who hates performing tricks but does them anyway — because for one brief moment in the air, eyes closed, they can almost remember the ocean they lost.

## Two Versions Available

### 🌐 Web Version (index.html)
- **Play instantly** in your browser
- No installation required
- Portable and shareable via URL
- Good for quick demos

**To play:** Open `index.html` in any modern web browser

### 🎮 Pygame Version (game.py)
- **Enhanced graphics** with smooth sprite rendering
- Better particle effects and water physics
- More polished animations
- Optimized performance
- Recommended for the full experience

**To play:** Follow installation instructions below

## Installation (Pygame Version)

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the game:
```bash
python game.py
```

## Controls

- **Arrow Keys**: Swim (when in water)
- **Space**: Jump (when in water)
- **While Airborne:**
  - ↑ Front Flip
  - ↓ Back Flip
  - ← Barrel Roll Left
  - → Barrel Roll Right

## Gameplay

1. Build speed by swimming around the tank
2. Jump out of the water (Space)
3. Perform tricks while airborne to score points
4. Chain multiple tricks for combo multipliers
5. Land cleanly (nose-first) for bonus points

## Scoring

- **Tricks**: 100-150 points base
- **Combo Multiplier**: Chain tricks without touching water
- **Landing Bonus**: Clean water entry gives +50 points per combo level
- **Height Bonus**: Higher jumps enable more tricks

## Features

### Web Version
- HTML5 Canvas rendering
- Fluid 2D physics
- Particle system for splashes
- Real-time scoring
- Combo system
- Atmospheric visuals

### Pygame Version
- Sprite-based dolphin with detailed rendering
- Advanced particle effects (30+ particles per splash)
- Gradient backgrounds (sky and water)
- Animated water surface with sine waves
- Swimming trails
- Smooth rotation and physics
- Enhanced visual feedback
- Better performance

## Project Structure

```
echoes-of-blue/
├── index.html          # Web version (browser-based)
├── game.py            # Pygame version (Python)
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## Development

Based on the full game design specification in `echoes-of-blue-spec.md`, this prototype implements:
- Core swimming and jumping mechanics
- Trick system with 4 basic tricks
- Tank environment
- Scoring and combo system
- Particle effects
- Emotional visual feedback

Future enhancements could include:
- Story progression (Act 1-3)
- Dream sequences
- Multiple environments
- Advanced tricks
- Sound and music
- Narrative choices

## Credits

Game design based on "Echoes of Blue" specification
- Theme: The longing for freedom and the difference between performing for others and living for yourself

---

*"For one brief moment in the air, eyes closed, they can almost remember the ocean they lost."*
