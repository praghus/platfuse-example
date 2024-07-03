import { clamp, Entity, Vector, vec2, Timer, Scene, Emitter } from 'platfuse'
import { DIRECTIONS, DEFAULT_PARTICLE_SETTINGS } from '../constants'
import ANIMATIONS from '../animations/player'
import MainScene from '../scenes/main'

const { LEFT, RIGHT } = DIRECTIONS

const LADDER = 30

export default class Player extends Entity {
    image = 'monster2.png'
    animation = ANIMATIONS.IDLE
    facing = RIGHT
    energy = [100, 100]
    renderOrder = 10
    friction = 0.98
    maxSpeed = 0.24
    moveInput = new Vector(0, 0)
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
    pressedJumpTimer: Timer

    constructor(scene: Scene, obj: Record<string, any>) {
        super(scene, obj)
        this.groundTimer = scene.game.timer()
        this.jumpTimer = scene.game.timer()
        this.pressedJumpTimer = scene.game.timer()

        const { game } = scene
        scene.camera.follow(this)

        if (game.debug && game.gui) {
            const f1 = game.gui.addFolder('Player')
            f1.add(this.pos, 'x').listen()
            f1.add(this.pos, 'y').listen()
            f1.add(this, 'gravityScale').listen()
            f1.add(this.energy, '0').name('Energy').step(1).min(1).max(100).listen()
            f1.add(this, 'image', {
                'Owlet monster': 'monster1.png',
                'Pink monster': 'monster2.png',
                'Dude monster': 'monster3.png'
            })
                .name('Sprite')
                .onChange(image => this?.setImage(image))
            f1.add(this, 'invincible').name('God mode').listen()
        }
    }

    setImage(image: string) {
        this.image = image
        const scene = this.scene as MainScene
        const sprite = scene.createSprite(this.image, this.size)
        sprite && this.addSprite(sprite)
    }

    handleInput() {
        const { game, camera } = this.scene
        const { input } = game

        if (input.mouseWasPressed(0)) {
            console.info('Mouse pressed', this.scene.getPointerRelativeGridPos())

            const emitter = new Emitter(this.scene, {
                ...DEFAULT_PARTICLE_SETTINGS,
                pos: this.scene.getPointerRelativeGridPos()
            })
            this.scene.objects.push(emitter)
        }

        this.moveInput = vec2(
            input.keyIsDown('ArrowRight') - input.keyIsDown('ArrowLeft'),
            input.keyIsDown('ArrowUp') - input.keyIsDown('ArrowDown')
        )
        this.holdingJump = !!input.keyIsDown('ArrowUp')

        if (input.keyIsDown('Space')) {
            camera.shake(500, new Vector(0.02, 0.02))
        }
        this.facing = this.moveInput.x === 1 ? RIGHT : this.moveInput.x === -1 ? LEFT : this.facing
    }

    update() {
        const { gravity } = this.scene

        if (this.dead) return super.update()

        this.handleInput()

        const moveInput = this.moveInput.clone()

        this.climbingWall = false
        this.onLadder = false

        if (!this.holdingJump) this.pressedJumpTimer.unset()
        else if (!this.wasHoldingJump || this.climbingWall) this.pressedJumpTimer.set(0.3)
        this.wasHoldingJump = this.holdingJump

        if (moveInput.x && !this.force.x && this.force.y > 0) {
            this.force.y *= 0.8
            this.climbingWall = true
        }

        // eslint-disable-next-line space-in-parens
        for (let y = 2; y--; ) {
            const testPos = this.pos.add(vec2(0, y + 0.1 * moveInput.y - this.size.y / 2))
            const collisionData = this.scene.getTileCollisionData(testPos)
            this.onLadder ||= collisionData === LADDER
        }
        if (!this.onLadder) this.climbingLadder = false
        else if (moveInput.y) this.climbingLadder = true

        this.gravityScale = this.onLadder ? 0 : 1

        if (this.climbingLadder) {
            const delta = (this.pos.x | 0) + 0.5 - this.pos.x
            this.climbingWall = false
            this.groundObject = false
            this.jumpTimer.unset()
            this.groundTimer.unset()
            this.force = this.force.multiply(vec2(0.85)).add(vec2(0, -0.02 * moveInput.y))
            this.force.x += 0.22 * delta * Math.abs(moveInput.x ? 0 : moveInput.y)
            moveInput.x *= 0.2
            this.climbingLadder =
                moveInput.y !== 0 || this.scene.getTileCollisionData(this.pos.subtract(vec2(0, 1))) <= 0
        } else if (this.groundObject || this.climbingWall) {
            this.groundTimer.set(0.1)
        }

        if (this.groundTimer.isActive()) {
            if (this.pressedJumpTimer.isActive() && !this.jumpTimer.isActive()) {
                if (this.climbingWall) this.force.y = -0.25
                else {
                    this.force.y = -0.15
                    this.jumpTimer.set(0.5)
                }
            }
        }

        if (this.jumpTimer.isActive() && !this.climbingWall) {
            this.groundTimer.unset()
            if (this.holdingJump && this.force.y < 0 && this.jumpTimer.isActive()) this.force.y -= 0.17
        }

        if (!this.groundObject) {
            // moving in same direction
            if (Math.sign(moveInput.x) === Math.sign(this.force.x)) moveInput.x *= 0.4
            // moving against force
            else moveInput.x *= 0.8
            // add gravity when falling down
            if (this.force.y > 0) this.force.y -= gravity * 0.2
        }
        // }

        this.force.x = clamp(this.force.x + moveInput.x * 0.022, -this.maxSpeed, this.maxSpeed)
        this.lastPos = this.pos.clone()

        super.update()

        let animation = ANIMATIONS.IDLE
        // if (this.isDead) animation = ANIMATIONS.DEAD
        // else if (this.isHurt) animation = ANIMATIONS.HURT
        if (this.climbingLadder) animation = !moveInput.y ? ANIMATIONS.ON_LADDER : ANIMATIONS.CLIMB
        else if (this.jumpTimer.isActive() && !this.groundObject)
            animation = this.force.y <= 0 ? ANIMATIONS.JUMP : ANIMATIONS.FALL
        else if (this.pushing) animation = ANIMATIONS.PUSH
        else if (Math.abs(this.force.x) > 0.01 && Math.abs(this.force.x) < 0.12) animation = ANIMATIONS.WALK
        else if (Math.abs(this.force.x) >= 0.12) animation = ANIMATIONS.RUN
        this.setAnimation(animation, this.facing === LEFT)

        this.pushing = false
    }

    collideWithObject(entity: Entity) {
        switch (entity.type) {
            case 'coin':
                entity.destroy()
                return false
            case 'box':
                this.pushing = Math.abs(this.moveInput.x) > 0 && this.pos.y + 0.5 >= entity.pos.y
            // entity.applyForce(this.force.scale(0.1))
        }
        return true
    }

    collideWithTile(tileId: number) {
        if (tileId === LADDER) {
            return false
        }
        return tileId > 0
    }
}
