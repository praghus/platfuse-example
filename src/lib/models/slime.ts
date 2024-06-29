import { Entity, vec2 } from 'platfuse'

import ANIMATIONS from '../animations/slime'
import { DIRECTIONS } from '../../lib/constants'

export default class Slime extends Entity {
    image = 'slime.png'
    collisions = true
    animation = ANIMATIONS.BOUNCE
    facing = DIRECTIONS.RIGHT
    distance = 0
    damage = 20
    running = false

    init() {
        super.init()
        this.distance = this.size.y
        this.size = vec2(1)
    }
}
