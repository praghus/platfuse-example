import { Entity } from 'platfuse'

export default class Coin extends Entity {
    mass = 0
    collideObjects = true
    collideTiles = true
    solid = true
}
