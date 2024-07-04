import { clamp, Entity, vec2, Timer, Scene, Emitter } from 'platfuse'
import { DIRECTIONS, DEFAULT_PARTICLE_SETTINGS, TILE_TYPES } from '../constants'
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
    // timers
    groundTimer: Timer
    jumpTimer: Timer
    jumpPressedTimer: Timer

    constructor(scene: Scene, obj: Record<string, any>) {
        super(scene, obj)
        this.groundTimer = scene.game.timer()
        this.jumpTimer = scene.game.timer()
        this.jumpPressedTimer = scene.game.timer()
        scene.camera.follow(this)
    }

    setImage(image: string) {
        this.image = image
        this.createSprite()
    }

    handleInput() {
        const { game, camera } = this.scene
        const { input } = game

        this.holdingJump = !!input.keyIsDown('ArrowUp')
        this.moveInput = vec2(
            input.keyIsDown('ArrowRight') - input.keyIsDown('ArrowLeft'),
            input.keyIsDown('ArrowUp') - input.keyIsDown('ArrowDown')
        )
        if (input.keyIsDown('Space')) {
            camera.shake(500, vec2(0.02))
        }
        if (input.mouseWasPressed(0)) {
            console.info('Mouse pressed', this.scene.getPointerRelativeGridPos())
            const emitter = new Emitter(this.scene, {
                ...DEFAULT_PARTICLE_SETTINGS,
                pos: this.scene.getPointerRelativeGridPos()
            })
            this.scene.addObject(emitter, 5)
            const dust1 = new Dust(this.scene, { pos: this.pos.clone().add(vec2(-1.2, 0.15)) })
            const dust2 = new Dust(this.scene, { pos: this.pos.clone().add(vec2(0.85, 0.15)), flipH: true })
            this.scene.addObject(dust1, 5)
            this.scene.addObject(dust2, 5)
        }

        this.facing = this.moveInput.x === 1 ? RIGHT : this.moveInput.x === -1 ? LEFT : this.facing
    }

    update() {
        if (this.dead) return super.update()

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

        // eslint-disable-next-line space-in-parens
        for (let y = 2; y--; ) {
            const testPos = this.pos.add(vec2(0, y + 0.1 * moveInput.y - this.size.y / 2))
            const collisionData = this.scene.getTileCollisionData(testPos)
            this.onLadder ||= collisionData === TILE_TYPES.LADDER
        }
        if (!this.onLadder) this.climbingLadder = false
        else if (moveInput.y) this.climbingLadder = true

        this.gravityScale = this.onLadder ? 0 : 1

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

        if (!this.onGround) {
            // moving in same direction
            if (Math.sign(moveInput.x) === Math.sign(this.force.x)) moveInput.x *= 0.4
            // moving against force
            else moveInput.x *= 0.8
            // add gravity when falling down
            if (this.force.y > 0) this.force.y -= gravity * 0.2
        }
        // }

        this.force.x = clamp(this.force.x + moveInput.x * 0.032, -this.maxSpeed, this.maxSpeed)
        this.lastPos = this.pos.clone()

        super.update()

        let animation = ANIMATIONS.IDLE
        // if (this.isDead) animation = ANIMATIONS.DEAD
        // else if (this.isHurt) animation = ANIMATIONS.HURT
        if (this.climbingLadder) animation = !moveInput.y ? ANIMATIONS.ON_LADDER : ANIMATIONS.CLIMB
        else if (this.jumpTimer.isActive() && !this.onGround)
            animation = this.force.y <= 0 ? ANIMATIONS.JUMP : ANIMATIONS.FALL
        else if (this.pushing) animation = ANIMATIONS.PUSH
        else if (moveInput.x && Math.abs(this.force.x) > 0.01 && Math.abs(this.force.x) < 0.12)
            animation = ANIMATIONS.WALK
        else if (moveInput.x && Math.abs(this.force.x) >= 0.12) animation = ANIMATIONS.RUN
        this.setAnimation(animation, this.facing === LEFT || this.climbingLadder)

        this.pushing = false
    }

    collideWithObject(entity: Entity) {
        switch (entity.type) {
            case 'coin':
                entity.destroy()
                this.scene.game.playSound('powerup.mp3')
                return false
            case 'box':
                this.pushing = Math.abs(this.moveInput.x) > 0 && this.pos.y + 0.5 >= entity.pos.y
            // entity.applyForce(this.force.scale(0.1))
        }
        return true
    }

    collideWithTile(tileId: number) {
        if (tileId === TILE_TYPES.LADDER) {
            return false
        }
        return tileId > 0
    }
}
