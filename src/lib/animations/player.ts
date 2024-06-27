export default {
    IDLE: {
        strip: { x: 0, y: 32 * 5, frames: 4, duration: 200 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: true
    },
    WALK: {
        strip: { x: 0, y: 32, frames: 6, duration: 80 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: true
    },
    RUN: {
        strip: { x: 0, y: 64, frames: 6, duration: 80 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: true
    },
    JUMP: {
        strip: { x: 32 * 7, y: 32, frames: 8, duration: 100 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: false
    },
    FALL: {
        strip: { x: 320, y: 32, frames: 1, duration: 0 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: false
    },
    CLIMB: {
        strip: { x: 0, y: 128, frames: 4, duration: 80 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: true
    },
    PUSH: {
        strip: { x: 0, y: 32 * 6, frames: 6, duration: 200 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: true
    },
    ON_LADDER: {
        strip: { x: 0, y: 128, frames: 1, duration: 0 },
        width: 32,
        height: 32,
        offset: [8, 4, 15, 24],
        loop: false
    },
    HURT: {
        strip: { x: 32 * 7, y: 96, frames: 4, duration: 80 },
        width: 32,
        height: 32,
        offset: [8, 4, 16, 28],
        loop: true
    },
    DEAD: {
        strip: { x: 32 * 7, y: 128, frames: 9, duration: 80 },
        width: 32,
        height: 32,
        offset: [8, 4, 16, 28],
        loop: false
    }
}
