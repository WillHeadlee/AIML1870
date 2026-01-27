import pygame
import math
import random
from dataclasses import dataclass
from typing import List, Tuple

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1400
SCREEN_HEIGHT = 800
FPS = 60
WATER_LEVEL = SCREEN_HEIGHT * 0.55

# Colors - Modern palette
SKY_TOP = (158, 212, 238)
SKY_BOTTOM = (100, 170, 200)
WATER_DARK = (30, 70, 100)
WATER_LIGHT = (80, 150, 180)
WATER_SURFACE = (120, 200, 230, 180)
DOLPHIN_BLUE = (85, 140, 185)
DOLPHIN_LIGHT = (145, 190, 220)
DOLPHIN_DARK = (60, 110, 150)
DOLPHIN_ACCENT = (70, 125, 165)
PARTICLE_BLUE = (135, 206, 235)
PARTICLE_WHITE = (240, 248, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
YELLOW = (255, 220, 80)
ORANGE = (255, 160, 60)
TANK_GRAY = (80, 80, 90)
PLATFORM_WOOD = (120, 80, 50)
UI_BG = (20, 30, 40)

@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    size: float
    alpha: int
    color: Tuple[int, int, int]
    life: int
    max_life: int
    glow: bool = False

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.vy += 0.15  # Gravity
        self.vx *= 0.98
        self.life -= 1
        self.alpha = int(255 * (self.life / self.max_life) ** 0.5)

    def draw(self, surface):
        if self.life > 0 and self.alpha > 0:
            s = pygame.Surface((int(self.size * 4), int(self.size * 4)), pygame.SRCALPHA)

            # Glow effect for special particles
            if self.glow:
                glow_alpha = int(self.alpha * 0.3)
                pygame.draw.circle(s, (*self.color, glow_alpha),
                                 (int(self.size * 2), int(self.size * 2)), int(self.size * 2))

            # Main particle
            pygame.draw.circle(s, (*self.color, self.alpha),
                             (int(self.size * 2), int(self.size * 2)), int(self.size))
            surface.blit(s, (int(self.x - self.size * 2), int(self.y - self.size * 2)))

class Dolphin:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.vx = 0
        self.vy = 0
        self.angle = 0
        self.angular_velocity = 0
        self.width = 90
        self.height = 40
        self.in_water = True
        self.can_jump = True
        self.total_rotation = 0
        self.last_angle = 0
        self.tricks_completed = []
        self.current_trick = None
        self.trick_timer = 0
        self.tail_wave = 0
        self.animation_frame = 0

    def jump(self):
        if self.in_water and self.can_jump:
            # Jump strength based on speed
            speed = math.sqrt(self.vx**2 + self.vy**2)
            self.vy = -16 - speed * 0.4
            self.in_water = False
            self.can_jump = False
            self.tricks_completed = []
            self.total_rotation = 0
            self.last_angle = self.angle
            return True
        return False

    def update(self, keys):
        # Swimming controls with 360° rotation
        if self.in_water:
            thrust_power = 0.4
            turn_speed = 0.04  # Reduced from 0.08

            # Rotation controls
            if keys[pygame.K_LEFT]:
                self.angular_velocity -= turn_speed
            if keys[pygame.K_RIGHT]:
                self.angular_velocity += turn_speed

            # Forward/backward thrust in direction dolphin is facing
            if keys[pygame.K_UP]:
                # Thrust forward
                self.vx += math.cos(self.angle) * thrust_power
                self.vy += math.sin(self.angle) * thrust_power
            if keys[pygame.K_DOWN]:
                # Thrust backward
                self.vx -= math.cos(self.angle) * thrust_power * 0.5
                self.vy -= math.sin(self.angle) * thrust_power * 0.5

            # Apply angular velocity
            self.angular_velocity *= 0.85
            self.angle += self.angular_velocity

            # Water resistance
            self.vx *= 0.96
            self.vy *= 0.96

            # Speed limits in water
            speed = math.sqrt(self.vx**2 + self.vy**2)
            max_speed = 10
            if speed > max_speed:
                self.vx = (self.vx / speed) * max_speed
                self.vy = (self.vy / speed) * max_speed

            # Reset jump when stable
            if abs(self.vy) < 0.5 and self.y > WATER_LEVEL + 20:
                self.can_jump = True

        else:
            # Air controls - slower rotation
            if keys[pygame.K_LEFT]:
                self.angular_velocity -= 0.08  # Reduced from 0.12
            if keys[pygame.K_RIGHT]:
                self.angular_velocity += 0.08  # Reduced from 0.12
            if keys[pygame.K_UP]:
                self.angular_velocity += 0.10  # Reduced from 0.15 - Front flip
            if keys[pygame.K_DOWN]:
                self.angular_velocity -= 0.10  # Reduced from 0.15 - Back flip

            # Apply angular velocity in air
            self.angular_velocity *= 0.96
            self.angle += self.angular_velocity

            # Track total rotation
            angle_diff = self.angle - self.last_angle
            # Normalize angle difference
            while angle_diff > math.pi:
                angle_diff -= 2 * math.pi
            while angle_diff < -math.pi:
                angle_diff += 2 * math.pi

            self.total_rotation += angle_diff
            self.last_angle = self.angle

            # Check for completed tricks
            full_rotations = abs(self.total_rotation) // (2 * math.pi)
            if full_rotations > len(self.tricks_completed):
                if self.total_rotation > 0:
                    trick_name = f"Front Flip x{int(full_rotations)}"
                else:
                    trick_name = f"Back Flip x{int(full_rotations)}"

                self.tricks_completed.append(trick_name)
                self.current_trick = trick_name
                self.trick_timer = 40
                return 'trick_complete', trick_name

            # Gravity
            self.vy += 0.35
            self.vx *= 0.99

        # Apply velocity
        self.x += self.vx
        self.y += self.vy

        # Animation
        self.animation_frame += 1
        if self.in_water:
            speed = math.sqrt(self.vx**2 + self.vy**2)
            self.tail_wave = math.sin(self.animation_frame * 0.15 * max(1, speed * 0.2)) * 0.15

        # Check water entry
        if not self.in_water and self.y > WATER_LEVEL:
            self.in_water = True
            entry_angle = abs(self.angle % (2 * math.pi))
            # Normalize to 0-2π
            if entry_angle > math.pi:
                entry_angle = 2 * math.pi - entry_angle

            # Check for clean entry (pointing down)
            clean_entry = entry_angle < 0.5 or entry_angle > (math.pi * 2 - 0.5) or abs(entry_angle - math.pi) < 0.5

            self.vy *= 0.4
            self.vx *= 0.8
            self.angular_velocity = 0
            return 'splash', clean_entry

        # Check water exit
        if self.in_water and self.y < WATER_LEVEL - 20:
            self.in_water = False
            self.total_rotation = 0
            self.last_angle = self.angle

        # Boundaries
        self.x = max(60, min(SCREEN_WIDTH - 60, self.x))
        if self.y > SCREEN_HEIGHT - 60:
            self.y = SCREEN_HEIGHT - 60
            self.vy = -abs(self.vy) * 0.6

        # Update trick timer
        if self.trick_timer > 0:
            self.trick_timer -= 1
            if self.trick_timer == 0:
                self.current_trick = None

        return None

    def draw(self, surface):
        # Create larger surface for better quality
        surf_size = int(self.width * 3)
        dolphin_surf = pygame.Surface((surf_size, surf_size), pygame.SRCALPHA)
        center_x = surf_size // 2
        center_y = surf_size // 2

        # Tail animation
        tail_angle = self.tail_wave if self.in_water else 0

        # Body segments for smooth curves
        body_length = self.width
        body_height = self.height

        # Main body - gradient effect
        body_segments = 20
        for i in range(body_segments):
            ratio = i / body_segments
            segment_x = center_x - body_length//2 + body_length * ratio
            segment_width = body_height * (1 - abs(ratio - 0.5) * 2) ** 0.5

            # Color gradient
            if ratio < 0.5:
                color = DOLPHIN_BLUE
            else:
                blend = (ratio - 0.5) * 2
                color = tuple(int(DOLPHIN_BLUE[j] + (DOLPHIN_DARK[j] - DOLPHIN_BLUE[j]) * blend) for j in range(3))

            pygame.draw.ellipse(dolphin_surf, color,
                              (segment_x - 5, center_y - segment_width//2,
                               10, segment_width))

        # Lighter belly
        belly_points = []
        for i in range(15):
            ratio = i / 14
            x = center_x - body_length//3 + body_length * 0.6 * ratio
            width = body_height * 0.6 * (1 - abs(ratio - 0.5) * 2) ** 0.5
            belly_points.append((x, center_y + width//2))
        for i in range(14, -1, -1):
            ratio = i / 14
            x = center_x - body_length//3 + body_length * 0.6 * ratio
            width = body_height * 0.6 * (1 - abs(ratio - 0.5) * 2) ** 0.5
            belly_points.append((x, center_y - width//2))

        if len(belly_points) > 2:
            pygame.draw.polygon(dolphin_surf, DOLPHIN_LIGHT, belly_points)

        # Dorsal fin with curve
        fin_base_x = center_x - 5
        fin_base_y = center_y - body_height//2
        fin_points = [
            (fin_base_x, fin_base_y),
            (fin_base_x + 3, fin_base_y - 20),
            (fin_base_x + 8, fin_base_y - 18),
            (fin_base_x + 10, fin_base_y)
        ]
        pygame.draw.polygon(dolphin_surf, DOLPHIN_ACCENT, fin_points)
        pygame.draw.polygon(dolphin_surf, DOLPHIN_DARK, fin_points, 2)

        # Tail flukes with animation
        tail_base_x = center_x - body_length//2 - 8
        tail_offset = math.sin(tail_angle) * 8

        # Upper fluke
        upper_fluke = [
            (tail_base_x, center_y - 4),
            (tail_base_x - 20, center_y - 16 + tail_offset),
            (tail_base_x - 18, center_y - 8 + tail_offset),
            (tail_base_x - 5, center_y - 2)
        ]
        pygame.draw.polygon(dolphin_surf, DOLPHIN_DARK, upper_fluke)

        # Lower fluke
        lower_fluke = [
            (tail_base_x, center_y + 4),
            (tail_base_x - 20, center_y + 16 + tail_offset),
            (tail_base_x - 18, center_y + 8 + tail_offset),
            (tail_base_x - 5, center_y + 2)
        ]
        pygame.draw.polygon(dolphin_surf, DOLPHIN_DARK, lower_fluke)

        # Pectoral fin
        pec_fin = [
            (center_x + 5, center_y + 5),
            (center_x + 25, center_y + 12),
            (center_x + 28, center_y + 8),
            (center_x + 12, center_y + 2)
        ]
        pygame.draw.polygon(dolphin_surf, DOLPHIN_ACCENT, pec_fin)
        pygame.draw.polygon(dolphin_surf, DOLPHIN_DARK, pec_fin, 1)

        # Head details - rostrum (beak)
        rostrum_length = 15
        pygame.draw.ellipse(dolphin_surf, DOLPHIN_BLUE,
                          (center_x + body_length//2 - 8, center_y - 8, rostrum_length, 16))

        # Eye with highlight
        eye_x = center_x + body_length//3
        eye_y = center_y - 10
        pygame.draw.circle(dolphin_surf, BLACK, (eye_x, eye_y), 5)
        pygame.draw.circle(dolphin_surf, WHITE, (eye_x + 1, eye_y - 1), 2)

        # Smile line
        smile_start = (center_x + body_length//3 + 5, center_y + 2)
        smile_end = (center_x + body_length//2 + 8, center_y + 1)
        pygame.draw.line(dolphin_surf, DOLPHIN_DARK, smile_start, smile_end, 2)

        # Add subtle outline for polish
        outline_surf = pygame.Surface((surf_size, surf_size), pygame.SRCALPHA)
        # (Skip complex outline for performance)

        # Rotate and blit
        rotated = pygame.transform.rotozoom(dolphin_surf, -math.degrees(self.angle), 1.0)
        rect = rotated.get_rect(center=(int(self.x), int(self.y)))
        surface.blit(rotated, rect)

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Echoes of Blue")
        self.clock = pygame.time.Clock()
        self.font_large = pygame.font.Font(None, 72)
        self.font_medium = pygame.font.Font(None, 48)
        self.font_small = pygame.font.Font(None, 32)
        self.running = True
        self.game_started = False

        self.dolphin = Dolphin(SCREEN_WIDTH // 2, WATER_LEVEL + 100)
        self.particles: List[Particle] = []
        self.score = 0
        self.combo = 0
        self.combo_timer = 0
        self.trick_popup = None
        self.trick_popup_timer = 0

        self.wave_offset = 0

    def create_splash(self, x, y, intensity=1.0):
        num_particles = int(40 * intensity)
        for _ in range(num_particles):
            angle = random.uniform(-math.pi/2 - math.pi/3, -math.pi/2 + math.pi/3)
            speed = random.uniform(3, 9) * intensity
            size = random.uniform(2, 7)
            life = random.randint(35, 70)

            # Mix of blue and white particles
            color = PARTICLE_BLUE if random.random() > 0.3 else PARTICLE_WHITE
            glow = random.random() > 0.6

            particle = Particle(
                x=x,
                y=y,
                vx=math.cos(angle) * speed,
                vy=math.sin(angle) * speed,
                size=size,
                alpha=255,
                color=color,
                life=life,
                max_life=life,
                glow=glow
            )
            self.particles.append(particle)

    def show_trick_popup(self, trick, points):
        self.trick_popup = f"{trick} +{points}"
        self.trick_popup_timer = 70

    def handle_trick_complete(self, trick_name):
        # Calculate points based on trick complexity
        points = 200  # Base for single flip
        if 'x2' in trick_name:
            points = 400
        elif 'x3' in trick_name:
            points = 700
        elif 'x4' in trick_name or int(trick_name.split('x')[-1]) >= 4:
            multiplier = int(trick_name.split('x')[-1])
            points = 200 * multiplier

        self.combo += 1
        total_points = points * self.combo
        self.score += total_points
        self.combo_timer = 150
        self.show_trick_popup(trick_name, total_points)

    def draw_background(self):
        # Sky gradient with smooth transition
        for y in range(int(WATER_LEVEL)):
            ratio = abs(y / WATER_LEVEL) ** 0.8
            color = (
                int(SKY_TOP[0] + (SKY_BOTTOM[0] - SKY_TOP[0]) * ratio),
                int(SKY_TOP[1] + (SKY_BOTTOM[1] - SKY_TOP[1]) * ratio),
                int(SKY_TOP[2] + (SKY_BOTTOM[2] - SKY_TOP[2]) * ratio)
            )
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))

        # Sun/light source
        sun_x = SCREEN_WIDTH - 200
        sun_y = 80
        for i in range(15, 0, -1):
            alpha = int(30 * (i / 15))
            s = pygame.Surface((i * 20, i * 20), pygame.SRCALPHA)
            pygame.draw.circle(s, (255, 255, 200, alpha), (i * 10, i * 10), i * 10)
            self.screen.blit(s, (sun_x - i * 10, sun_y - i * 10))

        # Tank walls with depth
        wall_thickness = 15
        # Outer shadow
        pygame.draw.rect(self.screen, (50, 50, 60), (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), wall_thickness + 5)
        # Main wall
        pygame.draw.rect(self.screen, TANK_GRAY, (0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), wall_thickness)
        # Inner highlight
        pygame.draw.rect(self.screen, (120, 120, 130), (5, 5, SCREEN_WIDTH - 10, SCREEN_HEIGHT - 10), 3)

        # Platform with wood texture
        platform_x = SCREEN_WIDTH//2 - 140
        platform_y = 50
        platform_w = 280
        platform_h = 30
        # Shadow
        pygame.draw.rect(self.screen, (60, 40, 25), (platform_x + 5, platform_y + 5, platform_w, platform_h), border_radius=8)
        # Main platform
        pygame.draw.rect(self.screen, PLATFORM_WOOD, (platform_x, platform_y, platform_w, platform_h), border_radius=8)
        # Highlights
        pygame.draw.rect(self.screen, (150, 100, 60), (platform_x, platform_y, platform_w, platform_h // 3), border_radius=8)

    def draw_water(self):
        # Water body with depth gradient
        for y in range(int(WATER_LEVEL), SCREEN_HEIGHT):
            ratio = (y - WATER_LEVEL) / (SCREEN_HEIGHT - WATER_LEVEL)
            ratio = abs(ratio) ** 0.7  # Ensure positive before power
            color = (
                int(WATER_LIGHT[0] + (WATER_DARK[0] - WATER_LIGHT[0]) * ratio),
                int(WATER_LIGHT[1] + (WATER_DARK[1] - WATER_LIGHT[1]) * ratio),
                int(WATER_LIGHT[2] + (WATER_DARK[2] - WATER_LIGHT[2]) * ratio)
            )
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))

        # Caustic light effects (underwater)
        for i in range(5):
            offset = self.wave_offset * 0.5 + i * 1.2
            for x in range(0, SCREEN_WIDTH, 40):
                y_base = WATER_LEVEL + 100 + i * 80
                caustic_y = y_base + math.sin(x * 0.03 + offset) * 20
                caustic_x = x + math.cos(caustic_y * 0.02 + offset) * 15
                alpha = int(40 - i * 5)
                s = pygame.Surface((30, 30), pygame.SRCALPHA)
                pygame.draw.circle(s, (200, 230, 255, alpha), (15, 15), 15)
                self.screen.blit(s, (caustic_x - 15, caustic_y - 15))

        # Water surface with multiple wave layers
        self.wave_offset += 0.04
        # Main surface
        surface_points = [(0, WATER_LEVEL)]
        for x in range(0, SCREEN_WIDTH + 1, 8):
            wave1 = math.sin(x * 0.015 + self.wave_offset) * 4
            wave2 = math.sin(x * 0.025 + self.wave_offset * 1.5) * 2
            surface_points.append((x, WATER_LEVEL + wave1 + wave2))
        surface_points.append((SCREEN_WIDTH, WATER_LEVEL))

        # Draw surface with transparency
        s = pygame.Surface((SCREEN_WIDTH, 20), pygame.SRCALPHA)
        pygame.draw.polygon(s, (150, 210, 240, 120), [(p[0], p[1] - WATER_LEVEL + 10) for p in surface_points])
        self.screen.blit(s, (0, WATER_LEVEL - 10))

        # Surface line
        if len(surface_points) > 1:
            pygame.draw.lines(self.screen, (180, 230, 255), False, surface_points, 2)

    def draw_hud(self):
        # HUD background panel
        hud_bg = pygame.Surface((350, 120), pygame.SRCALPHA)
        pygame.draw.rect(hud_bg, (*UI_BG, 180), (0, 0, 350, 120), border_radius=15)
        pygame.draw.rect(hud_bg, (100, 150, 180, 100), (0, 0, 350, 120), border_radius=15, width=2)
        self.screen.blit(hud_bg, (15, 15))

        # Score with better styling
        score_text = self.font_medium.render(f"{self.score:,}", True, WHITE)
        score_label = self.font_small.render("SCORE", True, (150, 180, 200))
        self.screen.blit(score_label, (30, 25))
        self.screen.blit(score_text, (30, 50))

        # Combo with glow effect if active
        if self.combo > 0:
            combo_color = ORANGE if self.combo > 2 else YELLOW
            # Glow
            combo_glow = self.font_medium.render(f"{self.combo}x", True, combo_color)
            combo_glow.set_alpha(100)
            for offset in [(0, 2), (2, 0), (0, -2), (-2, 0)]:
                self.screen.blit(combo_glow, (230 + offset[0], 50 + offset[1]))
            # Main text
            combo_text = self.font_medium.render(f"{self.combo}x", True, combo_color)
        else:
            combo_color = (120, 140, 160)
            combo_text = self.font_medium.render(f"{self.combo}x", True, combo_color)

        combo_label = self.font_small.render("COMBO", True, (150, 180, 200))
        self.screen.blit(combo_label, (230, 25))
        self.screen.blit(combo_text, (230, 50))

        # Combo timer bar
        if self.combo_timer > 0:
            bar_width = 180
            bar_height = 6
            bar_fill = (self.combo_timer / 150) * bar_width
            pygame.draw.rect(self.screen, (40, 50, 60), (30, 110, bar_width, bar_height), border_radius=3)
            if bar_fill > 0:
                combo_color = ORANGE if self.combo > 2 else YELLOW
                pygame.draw.rect(self.screen, combo_color, (30, 110, bar_fill, bar_height), border_radius=3)

        # Instructions with modern styling
        inst_bg = pygame.Surface((700, 50), pygame.SRCALPHA)
        pygame.draw.rect(inst_bg, (*UI_BG, 150), (0, 0, 700, 50), border_radius=10)
        self.screen.blit(inst_bg, (SCREEN_WIDTH//2 - 350, SCREEN_HEIGHT - 65))

        inst_text = self.font_small.render("Arrows: Steer & Thrust | Space: Jump | Air: Arrows to Flip", True, (200, 220, 240))
        inst_rect = inst_text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT - 40))
        self.screen.blit(inst_text, inst_rect)

        # Trick popup with effects
        if self.trick_popup_timer > 0:
            # Scale effect
            scale = 1.0 + (70 - self.trick_popup_timer) * 0.02 if self.trick_popup_timer > 50 else 1.0 + (self.trick_popup_timer / 50) * 0.4

            # Glow background
            glow_size = int(300 * scale)
            glow_surf = pygame.Surface((glow_size, glow_size), pygame.SRCALPHA)
            alpha = min(100, self.trick_popup_timer * 2)
            for i in range(5, 0, -1):
                pygame.draw.circle(glow_surf, (*YELLOW, alpha // i), (glow_size // 2, glow_size // 2), glow_size // 2 // i)
            self.screen.blit(glow_surf, (SCREEN_WIDTH // 2 - glow_size // 2, 180 - glow_size // 2))

            # Trick text
            popup_surf = self.font_medium.render(self.trick_popup, True, YELLOW)
            popup_surf = pygame.transform.scale(popup_surf,
                                               (int(popup_surf.get_width() * scale),
                                                int(popup_surf.get_height() * scale)))
            alpha = min(255, self.trick_popup_timer * 4)
            popup_surf.set_alpha(alpha)
            popup_rect = popup_surf.get_rect(center=(SCREEN_WIDTH // 2, 180))
            self.screen.blit(popup_surf, popup_rect)

            self.trick_popup_timer -= 1

    def draw_title_screen(self):
        # Gradient background
        for y in range(SCREEN_HEIGHT):
            ratio = y / SCREEN_HEIGHT
            color = (
                int(20 + 60 * ratio),
                int(30 + 100 * ratio),
                int(50 + 100 * ratio)
            )
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))

        # Animated water effect in background
        wave_y = SCREEN_HEIGHT * 0.6
        for y in range(int(wave_y), SCREEN_HEIGHT):
            ratio = (y - wave_y) / (SCREEN_HEIGHT - wave_y)
            color = (
                int(50 + 30 * ratio),
                int(90 + 40 * ratio),
                int(120 + 50 * ratio)
            )
            pygame.draw.line(self.screen, color, (0, y), (SCREEN_WIDTH, y))

        # Title with glow
        title_text = "Echoes of Blue"
        title_font = pygame.font.Font(None, 96)

        # Glow layers
        for i in range(3):
            glow = title_font.render(title_text, True, (100, 180, 220))
            glow.set_alpha(60 - i * 20)
            glow_rect = glow.get_rect(center=(SCREEN_WIDTH//2 + i, SCREEN_HEIGHT//2 - 120 + i))
            self.screen.blit(glow, glow_rect)

        # Main title
        title = title_font.render(title_text, True, WHITE)
        title_rect = title.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 - 120))
        self.screen.blit(title, title_rect)

        # Subtitle with italic style
        subtitle = self.font_medium.render("A story of longing and freedom", True, (180, 200, 220))
        subtitle_rect = subtitle.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2 - 50))
        self.screen.blit(subtitle, subtitle_rect)

        # Animated start button
        pulse = abs(math.sin(pygame.time.get_ticks() * 0.003))
        button_y = SCREEN_HEIGHT//2 + 80

        # Button background
        button_width = 300
        button_height = 60
        button_rect = pygame.Rect(SCREEN_WIDTH//2 - button_width//2, button_y - button_height//2,
                                  button_width, button_height)

        # Glow effect
        glow_alpha = int(100 * pulse)
        glow_surf = pygame.Surface((button_width + 20, button_height + 20), pygame.SRCALPHA)
        pygame.draw.rect(glow_surf, (100, 180, 220, glow_alpha), (0, 0, button_width + 20, button_height + 20),
                        border_radius=15)
        self.screen.blit(glow_surf, (SCREEN_WIDTH//2 - button_width//2 - 10, button_y - button_height//2 - 10))

        # Button
        pygame.draw.rect(self.screen, (60, 120, 160), button_rect, border_radius=12)
        pygame.draw.rect(self.screen, (120, 180, 220), button_rect, border_radius=12, width=3)

        # Button text
        start = self.font_medium.render("Press SPACE to Begin", True, WHITE)
        start_rect = start.get_rect(center=button_rect.center)
        self.screen.blit(start, start_rect)

    def run(self):
        while self.running:
            keys = pygame.key.get_pressed()

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.running = False

                if event.type == pygame.KEYDOWN:
                    if not self.game_started:
                        if event.key == pygame.K_SPACE:
                            self.game_started = True
                    else:
                        if event.key == pygame.K_SPACE:
                            if self.dolphin.jump():
                                self.create_splash(self.dolphin.x, WATER_LEVEL, 1.2)
                                # Reset combo when jumping (fresh start)
                                if len(self.dolphin.tricks_completed) == 0:
                                    self.combo = 0

            # Update
            if self.game_started:
                result = self.dolphin.update(keys)

                # Handle events from dolphin
                if result:
                    if isinstance(result, tuple):
                        event_type = result[0]

                        if event_type == 'splash':
                            clean_entry = result[1]
                            intensity = 1.5 if clean_entry else 1.0
                            self.create_splash(self.dolphin.x, WATER_LEVEL, intensity)

                            # Landing bonus for clean entry
                            if clean_entry and len(self.dolphin.tricks_completed) > 0:
                                bonus = 100 * max(1, self.combo)
                                self.score += bonus
                                self.show_trick_popup("Clean Entry!", bonus)

                            # Reset combo if no tricks were performed
                            if len(self.dolphin.tricks_completed) == 0:
                                self.combo = 0

                        elif event_type == 'trick_complete':
                            trick_name = result[1]
                            self.handle_trick_complete(trick_name)

                # Update particles
                self.particles = [p for p in self.particles if p.life > 0]
                for particle in self.particles:
                    particle.update()

                # Swimming trail with bubbles
                if self.dolphin.in_water:
                    speed = math.sqrt(self.dolphin.vx**2 + self.dolphin.vy**2)
                    if speed > 2:
                        for i in range(int(speed * 0.4)):
                            life = random.randint(20, 40)
                            particle = Particle(
                                x=self.dolphin.x - self.dolphin.vx * random.uniform(0.5, 1.5),
                                y=self.dolphin.y + random.uniform(-15, 15),
                                vx=random.uniform(-0.5, 0.5),
                                vy=random.uniform(-1.5, -0.5),  # Bubbles float up
                                size=random.uniform(1, 5),
                                alpha=255,
                                color=PARTICLE_WHITE if random.random() > 0.5 else PARTICLE_BLUE,
                                life=life,
                                max_life=life,
                                glow=random.random() > 0.7
                            )
                            self.particles.append(particle)

                # Combo timer
                if self.combo_timer > 0:
                    self.combo_timer -= 1
                    if self.combo_timer == 0:
                        self.combo = 0

            # Draw
            if not self.game_started:
                self.draw_title_screen()
            else:
                self.draw_background()
                self.draw_water()

                # Draw particles
                for particle in self.particles:
                    particle.draw(self.screen)

                self.dolphin.draw(self.screen)
                self.draw_hud()

            pygame.display.flip()
            self.clock.tick(FPS)

        pygame.quit()

if __name__ == "__main__":
    game = Game()
    game.run()
