import { Color } from 'platfuse'

export enum LAYERS {
    BACKGROUND = 1,
    MAIN = 2,
    OBJECTS = 5,
    SHADOWS = 4,
    DARKNESS = 8,
    CUSTOM_OVERLAY = 9
}

export enum DIRECTIONS {
    UP = 'up',
    RIGHT = 'right',
    DOWN = 'down',
    LEFT = 'left'
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

export const DEFAULT_PARTICLE_SETTINGS = {
    angle: Math.PI,
    emitSize: 1,
    emitTime: 1,
    emitRate: 25,
    colorStart: new Color(255, 128, 0, 1),
    colorEnd: new Color(255, 0, 0, 0),
    ttl: 2.2,
    sizeStart: 0.15,
    sizeEnd: 0.2,
    speed: 0.1,
    angleSpeed: 0.1,
    damping: 1,
    angleDamping: 0.95,
    gravityScale: 0.5,
    fadeRate: 0.1,
    randomness: 0.5,
    collideTiles: true,
    collideObjects: true,
    renderOrder: 1,
    elasticity: 0.5,
    stretchScale: 0.5
}
