import { Entity, vec2 } from 'platfuse'
import { ENTITY_TYPES } from '../constants'
import ANIMATION from '../animations/dust'

export default class Dust extends Entity {
    image = 'dust.png'
    type = ENTITY_TYPES.DUST
    animation = ANIMATION.DUST
    size = vec2(1)
    collideObjects = false
    collideTiles = false
    solid = false
    mass = 0
    ttl = 0.5
}
