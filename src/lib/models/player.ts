import { clamp, Entity, vec2, Timer, Scene, Emitter, Vector } from 'platfuse'
import { DIRECTIONS, DEFAULT_PARTICLE_SETTINGS, TILE_TYPES, ENTITY_TYPES } from '../constants'
import ANIMATIONS from '../animations/player'
import Dust from './dust'

const { LEFT, RIGHT } = DIRECTIONS

export default class Player extends Entity {
    image = 'monster2.png'
    animation = ANIMATIONS.IDLE
    facing = RIGHT
    energy = [100, 100]
    renderOrder = 10
    damping = 0.88
    friction = 0.9
    maxSpeed = 0.5
    startPos = vec2()
    // input
    moveInput = vec2()
    // flags
    pushing = false
    holdingJump = false
    wasHoldingJump = false
    onLadder = false
    climbingLadder = false
    climbingWall = false
    invincible = false
    isDying = false
    isHurting = false
    // timers
    deadTimer: Timer
    groundTimer: Timer
    hurtTimer: Timer
    jumpPressedTimer: Timer
    jumpTimer: Timer

    constructor(scene: Scene, obj: Record<string, any>) {
        super(scene, obj)
        this.deadTimer = scene.game.timer()
        this.groundTimer = scene.game.timer()
        this.hurtTimer = scene.game.timer()
        this.jumpPressedTimer = scene.game.timer()
        this.jumpTimer = scene.game.timer()
        this.startPos = this.pos.clone()
        scene.camera.follow(this)
        scene.camera.setSpeed(0.1)
    }

    setImage(image: string) {
        this.image = image
        this.createSprite()
    }

    collideWithObject(entity: Entity) {
        const { camera } = this.scene
        switch (entity.type) {
            case ENTITY_TYPES.COIN:
                entity.destroy()
                this.scene.game.playSound('powerup.mp3')
                return false
            case ENTITY_TYPES.BOX:
                this.pushing = Math.abs(this.moveInput.x) > 0 && this.pos.y + 0.5 >= entity.pos.y
                return true
            case ENTITY_TYPES.SPIKES:
                if (!this.isDying) {
                    this.isDying = true
                    this.deadTimer.set(1)
                    camera.shake(0.5, vec2(0.003))
                }
                return true
            case ENTITY_TYPES.SLIME:
                if (!this.isHurting) {
                    this.isHurting = true
                    this.hurtTimer.set(0.3)
                    this.applyForce(entity.force.scale(0.1))
                    camera.shake(0.5, vec2(0.003))
                }
                return true
        }
        return true
    }

    collideWithTile(tileId: number) {
        if (tileId === TILE_TYPES.LADDER) {
            return false
        }
        return tileId > 0
    }

    collideWithTileRaycast(tileId: number, pos: Vector): boolean {
        if (tileId === TILE_TYPES.LADDER) {
            return false
        }
        return tileId > 0
    }

    handleInput() {
        const { game } = this.scene
        const { input } = game

        this.holdingJump = !!input.keyIsDown('ArrowUp')
        this.moveInput = vec2(
            input.keyIsDown('ArrowRight') - input.keyIsDown('ArrowLeft'),
            input.keyIsDown('ArrowUp') - input.keyIsDown('ArrowDown')
        )
        // if (input.keyIsDown('Space')) {
        //     camera.shake(0.5, vec2(0.02))
        // }
        if (input.mouseWasPressed(0)) {
            console.info('Mouse pressed', this.scene.getPointerRelativeGridPos())
            const emitter = new Emitter(this.scene, {
                ...DEFAULT_PARTICLE_SETTINGS,
                pos: this.scene.getPointerRelativeGridPos()
            })
            this.scene.addObject(emitter, 5)
        }
        this.facing = this.moveInput.x === 1 ? RIGHT : this.moveInput.x === -1 ? LEFT : this.facing
    }

    update() {
        if (this.deadTimer.isDone()) {
            this.deadTimer.unset()
            this.pos = this.startPos.clone()
            this.isDying = false
        }
        if (this.hurtTimer.isDone()) {
            this.hurtTimer.unset()
            this.isHurting = false
        }

        if (this.isDying) return super.update()

        this.handleInput()

        const moveInput = this.moveInput.clone()
        const { gravity } = this.scene

        this.climbingWall = false
        this.onLadder = false

        if (!this.holdingJump) this.jumpPressedTimer.unset()
        else if (!this.wasHoldingJump || this.climbingWall) this.jumpPressedTimer.set(0.3)
        this.wasHoldingJump = this.holdingJump

        if (moveInput.x && !this.force.x && this.force.y > 0) {
            this.force.y *= 0.8
            this.climbingWall = true
        }

        // Ladders -----------------------------------------------------------
        // eslint-disable-next-line space-in-parens
        for (let y = 2; y--; ) {
            const testPos = this.pos.add(vec2(0, y + 0.1 * moveInput.y - this.size.y / 2))
            const collisionData = this.scene.getTileCollisionData(testPos)
            this.onLadder ||= collisionData === TILE_TYPES.LADDER
        }
        if (!this.onLadder) this.climbingLadder = false
        else if (moveInput.y) this.climbingLadder = true

        if (this.climbingLadder) {
            const delta = (this.pos.x | 0) + 0.5 - this.pos.x
            this.climbingWall = false
            this.onGround = false
            this.jumpTimer.unset()
            this.groundTimer.unset()
            this.force = this.force.multiply(vec2(0.85)).add(vec2(0, -0.02 * moveInput.y))
            this.force.x += 0.22 * delta * Math.abs(moveInput.x ? 0 : moveInput.y)
            moveInput.x *= 0.2
            this.climbingLadder =
                moveInput.y !== 0 || this.scene.getTileCollisionData(this.pos.subtract(vec2(0, 1))) <= 0
        } else if (this.onGround || this.climbingWall) {
            this.groundTimer.set(0.1)
        }
        this.gravityScale = this.onLadder ? 0 : 1
        // Jump --------------------------------------------------------------
        if (this.groundTimer.isActive()) {
            if (this.jumpPressedTimer.isActive() && !this.jumpTimer.isActive()) {
                if (this.climbingWall) this.force.y = -0.25
                else {
                    this.force.y = -0.15
                    this.jumpTimer.set(0.5)
                }
            }
        }

        if (this.jumpTimer.isActive() && !this.climbingWall) {
            this.groundTimer.unset()
            if (this.holdingJump && this.force.y < 0 && this.jumpTimer.isActive()) this.force.y -= 0.07
        }
        // Air control -------------------------------------------------------
        if (!this.onGround) {
            // moving in same direction
            if (Math.sign(moveInput.x) === Math.sign(this.force.x)) moveInput.x *= 0.4
            // moving against force
            else moveInput.x *= 0.8
            // add gravity when falling down
            if (this.force.y > 0 && !this.climbingLadder) {
                this.force.y -= gravity * 0.2
            }
        }
        // Ground control -----------------------------------------------------
        // emit dust when changing direction or suddenly stopping
        if (
            !this.onLadder &&
            !this.climbingLadder &&
            Math.sign(this.moveInput.x) !== Math.sign(this.force.x) &&
            Math.abs(this.force.x) > 0.1
        ) {
            this.dust()
        }

        this.force.x = clamp(this.force.x + moveInput.x * 0.032, -this.maxSpeed, this.maxSpeed)
        this.lastPos = this.pos.clone()

        super.update()

        let animation = ANIMATIONS.IDLE
        if (this.isDying) animation = ANIMATIONS.DEAD
        else if (this.isHurting) animation = ANIMATIONS.HURT
        else if (this.climbingLadder) animation = !moveInput.y ? ANIMATIONS.ON_LADDER : ANIMATIONS.CLIMB
        else if (this.jumpTimer.isActive() && !this.onGround)
            animation = this.force.y <= 0 ? ANIMATIONS.JUMP : ANIMATIONS.FALL
        else if (this.pushing) animation = ANIMATIONS.PUSH
        else if (moveInput.x && Math.abs(this.force.x) > 0.01 && Math.abs(this.force.x) < 0.12)
            animation = ANIMATIONS.WALK
        else if (moveInput.x && Math.abs(this.force.x) >= 0.12) animation = ANIMATIONS.RUN
        this.setAnimation(animation, this.facing === LEFT || this.climbingLadder)

        this.pushing = false
    }

    dust(side: (typeof DIRECTIONS)[keyof typeof DIRECTIONS] = this.facing) {
        const pos = side === LEFT ? vec2(-1.2, 0.15) : vec2(0.85, 0.15)
        const dust = new Dust(this.scene, { pos: this.pos.add(pos), flipH: side === RIGHT })
        this.scene.addObject(dust, 5)
    }
}
