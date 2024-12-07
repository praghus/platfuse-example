import { Color, Entity } from 'platfuse'
import { ENTITY_TYPES, TILE_TYPES } from '../constants'

export default class Box extends Entity {
    collideObjects = true
    collideTiles = true
    mass = 1
    solid = true
    elasticity = 0.3
    friction = 0.9
    angleDamping = 0.96
    color = new Color('#ff0000')

    collideWithObject(entity: Entity) {
        switch (entity.type) {
            case ENTITY_TYPES.COIN:
                return false
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
