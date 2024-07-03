import { Color, Entity } from 'platfuse'

export default class Box extends Entity {
    elasticity = 0.3
    friction = 0.9
    angleDamping = 0.96
    color = new Color('#ff0000')

    collideWithObject(entity: Entity) {
        switch (entity.type) {
            case 'coin':
                return false
        }
        return true
    }

    collideWithTile(tileId: number) {
        if (tileId === 30) {
            return false
        }
        return tileId > 0
    }
}
