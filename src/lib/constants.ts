import { Color } from 'platfuse'

export enum LAYERS {
    BACKGROUND = 1,
    MAIN = 2,
    OBJECTS = 5,
    LADDERS = 6,
    SHADOWS = 4,
    FOREGROUND = 7,
    DARKNESS = 8,
    CUSTOM_OVERLAY = 9
}

export enum DIRECTIONS {
    UP = 'up',
    RIGHT = 'right',
    DOWN = 'down',
    LEFT = 'left'
}

export enum ENTITY_FAMILY {
    ENEMIES = 'enemies',
    PARTICLES = 'particles',
    TRAPS = 'traps'
}

export enum ENTITY_TYPES {
    BOX = 'box',
    COIN = 'coin',
    DUST = 'dust',
    PARTICLE = 'particle',
    PLAYER = 'player',
    SLIME = 'slime',
    SPIKES = 'spikes',
    WATER = 'water'
}

export enum TILE_TYPES {
    LADDER = 30
}

export enum SCENES {
    MAIN = 'main'
}

export const DEFAULT_PARTICLE_SETTINGS = {
    angle: Math.PI,
    emitSize: 1,
    emitTime: 1,
    emitRate: 20,
    emitCone: 0,
    colorStart: new Color(255, 0, 0, 1),
    colorEnd: new Color(0, 255, 0, 0),
    ttl: 1.2,
    sizeStart: 0.2,
    sizeEnd: 0.2,
    speed: 0.1,
    angleSpeed: 0.1,
    damping: 1,
    angleDamping: 1,
    gravityScale: 0.5,
    fadeRate: 0.1,
    randomness: 0.5,
    collideTiles: true,
    renderOrder: 1,
    elasticity: 0.3,
    stretchScale: 1
}
