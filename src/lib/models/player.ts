import { clamp, Entity, Vector, vec2, Timer, Scene } from 'platfuse'
import { DIRECTIONS } from '../constants'
import ANIMATIONS from '../animations/player'
import MainScene from '../scenes/main'

const { LEFT, RIGHT } = DIRECTIONS

export default class Player extends Entity {
    image = 'monster2.png'
    animation = ANIMATIONS.IDLE
    facing = RIGHT
    energy = [100, 100]
    points = 0
    renderOrder = 10
    friction = 0.98
    maxSpeed = 0.24

    invincible = false
    isJumping = false
    isHurt = false
    isDead = false
    onLadder = false
    climbing = false
    pushing = false

    // timers
    groundTimer: Timer
    jumpTimer: Timer
    pressedJumpTimer: Timer

    // gravityScale = 0

    holdingJump = 0
    wasHoldingJump = 0
    climbingWall = 0
    climbingLadder = 0
    moveInput = new Vector(0, 0)

    c: Vector[] = []

    constructor(obj: Record<string, any>, scene: Scene) {
        super(obj, scene)

        this.groundTimer = scene.game.timer()
        this.jumpTimer = scene.game.timer()
        this.pressedJumpTimer = scene.game.timer()
    }

    init() {
        const { scene } = this
        const { game } = scene
        super.init()
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

    collideWithObject(entity: Entity) {
        switch (entity.type) {
            case 'coin':
                entity.destroy()
                return 0
            case 'box':
                this.pushing = Math.abs(this.moveInput.x) > 0 && this.pos.y + 0.5 >= entity.pos.y
            // entity.applyForce(this.force.scale(0.1))
        }
        return 1
    }

    collideWithTile(tileId: number) {
        if (tileId === 30) {
            return false
        }
        return tileId > 0
    }

    handleInput() {
        const { game, camera } = this.scene
        const { input } = game
        this.moveInput = vec2(
            input.keyIsDown('ArrowRight') - input.keyIsDown('ArrowLeft'),
            input.keyIsDown('ArrowUp') - input.keyIsDown('ArrowDown')
        )
        this.holdingJump = input.keyIsDown('ArrowUp')

        if (input.keyIsDown('Space')) {
            camera.shake(500, new Vector(0.02, 0.02))
        }
        this.facing = this.moveInput.x === 1 ? RIGHT : this.moveInput.x === -1 ? LEFT : this.facing
    }

    update() {
        const { gravity } = this.scene

        if (this.dead) return super.update()

        this.handleInput()

        this.gravityScale = 1 // reset to default gravity
        // console.info(this.pos)

        const moveInput = this.moveInput.copy()

        // jump
        if (!this.holdingJump) this.pressedJumpTimer.unset()
        else if (!this.wasHoldingJump || this.climbingWall) this.pressedJumpTimer.set(0.3)
        this.wasHoldingJump = this.holdingJump

        // wall climb
        this.climbingWall = 0
        if (moveInput.x && !this.force.x && this.force.y > 0) {
            this.force.y *= 0.8
            this.climbingWall = 1
        }

        // if (moveInput.x && !this.force.x) {
        //     console.info('push')
        //     this.pushing = true
        // }

        // if (this.dodgeTimer.isActive())
        // {
        //     // update roll
        //     this.angle = this.getMirrorSign() * 2 * PI * this.dodgeTimer.getPercent()
        //     if (this.groundObject)
        //         this.force.x += this.getMirrorSign() * .1
        // }
        // else
        // {
        // not rolling
        // this.angle = 0
        // if (this.pressedDodge && !this.dodgeRechargeTimer.isActive())
        // {
        //     // start dodge
        //     this.dodgeTimer.set(.4)
        //     this.dodgeRechargeTimer.set(2)
        //     this.jumpTimer.unset()
        //     sound_dodge.play(this.pos)

        //     if (!this.groundObject && this.getAliveTime() > .2)
        //         this.force.y += .2
        // }
        // if (this.pressingThrow && !this.wasPressingThrow && !this.grendeThrowTimer.isActive())
        // {
        //     // throw greande
        //     const grenade = new Grenade(this.pos)
        //     grenade.force = this.force.add(vec2(this.getMirrorSign(), rand(.8, .7)).normalize(.2 + rand(.02)))
        //     grenade.angleVelocity = this.getMirrorSign() * rand(.8, .5)
        //     sound_jump.play(this.pos)
        //     this.grendeThrowTimer.set(1)
        // }
        // this.wasPressingThrow = this.pressingThrow
        // }

        // allow grabbing ladder at head or feet
        // let touchingLadder = 0
        // for (let y = 2; y--; ) {
        // const testPos = this.pos.add(vec2(0, y + 0.1 * moveInput.y - this.size.y / 2))
        // const collisionData = getTileCollisionData(testPos)
        // touchingLadder ||= collisionData == tileType_ladder
        // }
        // if (!touchingLadder) this.climbingLadder = 0
        // else if (moveInput.y) this.climbingLadder = 1

        // if (this.weapon)
        //     // update weapon trigger
        //     this.weapon.triggerIsDown = this.holdingShoot && !this.dodgeTimer.isActive()

        // update ladder
        // if (this.climbingLadder) {
        //     this.gravityScale = this.climbingWall = this.groundObject = 0
        //     this.jumpTimer.unset()
        //     this.groundTimer.unset()
        //     this.force = this.force.multiply(vec2(0.85)).add(vec2(0, 0.02 * moveInput.y))

        //     // pull towards ladder
        //     const delta = (this.pos.x | 0) + 0.5 - this.pos.x
        //     this.force.x += 0.02 * delta * abs(moveInput.x ? 0 : moveInput.y)
        //     moveInput.x *= 0.2

        //     // exit ladder if ground is below
        //     this.climbingLadder = moveInput.y >= 0 || getTileCollisionData(this.pos.subtract(vec2(0, 1))) <= 0
        // } else {
        // update jumping and ground check
        if (this.groundObject || this.climbingWall) {
            // if (!this.groundTimer.isSet())
            //     sound_walk.play(this.pos) // land sound

            this.groundTimer.set(0.1)
        }

        if (this.groundTimer.isActive() /*&& !this.dodgeTimer.isActive()*/) {
            // is on ground
            if (this.pressedJumpTimer.isActive() && !this.jumpTimer.isActive()) {
                // start jump
                if (this.climbingWall) this.force.y = -0.25
                else {
                    this.force.y = -0.15
                    this.jumpTimer.set(0.5)
                }
                // sound_jump.play(this.pos)
            }
        }

        if (this.jumpTimer.isActive() && !this.climbingWall) {
            // update variable height jump
            this.groundTimer.unset()
            if (this.holdingJump && this.force.y < 0 && this.jumpTimer.isActive()) this.force.y -= 0.17
        }

        if (!this.groundObject) {
            // air control
            if (Math.sign(moveInput.x) === Math.sign(this.force.x))
                moveInput.x *= 0.2 // moving with force
            else moveInput.x *= 0.4 // moving against force (stopping)
            // slight extra gravity when moving down
            if (this.force.y > 0) this.force.y -= gravity * 0.2
        }
        // }

        // apply movement acceleration and clamp

        this.force.x = clamp(this.force.x + moveInput.x * 0.022, -this.maxSpeed, this.maxSpeed)

        // track last pos for ladder collision code
        this.lastPos = this.pos.copy()

        super.update()

        let animation = ANIMATIONS.IDLE
        // if (this.isDead) animation = ANIMATIONS.DEAD
        // else if (this.isHurt) animation = ANIMATIONS.HURT
        // else if (this.climbing) animation = this.force.y === 0 ? ANIMATIONS.ON_LADDER : ANIMATIONS.CLIMB
        if (this.jumpTimer.isActive() && !this.groundObject)
            animation = this.force.y <= 0 ? ANIMATIONS.JUMP : ANIMATIONS.FALL
        else if (this.pushing) animation = ANIMATIONS.PUSH
        else if (Math.abs(this.force.x) > 0.01 && Math.abs(this.force.x) < 0.12) animation = ANIMATIONS.WALK
        else if (Math.abs(this.force.x) >= 0.12) animation = ANIMATIONS.RUN
        this.setAnimation(animation, { H: this.facing === LEFT })

        this.pushing = false
        // }
    }

    alignWithGrid() {
        // this.pos.x = this.posOnGrid.x * 16 + 8 - 16
    }
}
