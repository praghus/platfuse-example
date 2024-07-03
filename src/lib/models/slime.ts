import { Entity, Scene, vec2 } from 'platfuse'

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

    constructor(scene: Scene, obj: Record<string, any>) {
        super(scene, obj)
        this.distance = this.size.y
        this.size = vec2(0.8, 0.6)
    }
}
