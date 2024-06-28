import { Entity, vec2 } from 'platfuse'
import ANIMATIONS from '../animations/slime'

import { DIRECTIONS } from '../../lib/constants'
// import Player from './player'

export default class Slime extends Entity {
    image = 'slime.png'
    collisions = true
    animation = ANIMATIONS.BOUNCE
    facing = DIRECTIONS.RIGHT
    distance = 0
    damage = 20
    running = false
    activated = true

    init() {
        super.init()
        this.distance = this.size.y
        this.size = vec2(1)
    }

    update() {
        super.update()
        if (this.onScreen()) {
            const scene = this.scene
            if (this.onScreen()) {
                this.activated = true
            }
            if (this.activated) {
                // this.game.wait(
                //     `wait_${this.id}`,
                //     () => {
                //         this.running = true
                //     },
                //     2000
                // )

                this.force.y += scene.gravity
                // this.force.x = this.running
                //     ? approach(this.force.x, this.facing === DIRECTIONS.RIGHT ? 2 : -2, 0.18)
                //     : 0

                // if (this.pos.x + 32 > this.initialPos.x + this.distance || this.pos.x + 16 < this.initialPos.x) {
                //     this.bounce()
                // }
                if (this.facing === DIRECTIONS.RIGHT) {
                    this.setAnimation(this.running ? ANIMATIONS.RUN_RIGHT : ANIMATIONS.BOUNCE)
                } else {
                    this.setAnimation(this.running ? ANIMATIONS.RUN_LEFT : ANIMATIONS.BOUNCE)
                }
                // this.move()
            }
        }
    }
}
