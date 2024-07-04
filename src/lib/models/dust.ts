import { Entity, vec2 } from 'platfuse'
import { ENTITY_TYPES } from '../constants'
import ANIMATION from '../animations/dust'

export default class Dust extends Entity {
    image = 'dust.png'
    type = ENTITY_TYPES.DUST
    animation = ANIMATION.DUST
    size = vec2(0.5, 0.5)
    collideObjects = false
    collideTiles = false
    solid = false
    mass = 0
    ttl = 0.5

    // constructor(scene: Scene, obj: Record<string, any>) {
    //     super(scene, obj)
    //     console.info('Dust created', obj)
    //     // this.direction = obj.direction
    // }

    // update() {
    //     this.animate(ANIMATIONS.DUST, { H: this.direction === DIRECTIONS.LEFT }, (frame: number) => {
    //         if (frame === 8) this.kill()
    //     })
    // }
}
