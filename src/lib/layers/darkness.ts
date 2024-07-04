import { Layer, Vector, vec2 } from 'platfuse'
import { ENTITY_TYPES, LAYERS, TILE_TYPES } from '../constants'
import { Player } from '../models'

export default class Darkness extends Layer {
    id = LAYERS.DARKNESS
    name = 'Darkness'
    g_shadows: Record<string, { x: number; y: number; alpha: number }> = {}

    drawRect(pos: Vector, size: Vector) {
        const { ctx, backgroundColor } = this.scene.game
        ctx.fillStyle = backgroundColor.setAlpha(0.8).toString()
        ctx.fillRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
        // draw.text(`${alpha.toFixed(2)}`, Math.round(pos.x), Math.round(pos.y))
    }

    draw() {
        const scene = this.scene
        const player = scene.getObjectByType(ENTITY_TYPES.PLAYER) as Player

        const { camera, tileSize } = scene
        const { scale } = camera

        const pos = vec2(0)
        const shadowSize = tileSize.scale(scale)
        const playerPos = player.getTranslatedBoundingRect().pos

        // @todo: reduce only to visible part of the screen
        for (let x = 0; x < scene.size.x; x++) {
            for (let y = 0; y < scene.size.y; y++) {
                const c = vec2(x, y)
                const dVec = playerPos.clampLength(Math.min(0.5, playerPos.length())).add(c)

                pos.x = dVec.x
                pos.y = dVec.y

                const pos2 = scene.raycastTileCollision(player.pos, pos, undefined, [TILE_TYPES.LADDER])
                if (pos2 && !(pos2.x === c.x && pos2.y === c.y)) {
                    this.g_shadows[x + '_' + y] = this.g_shadows[x + '_' + y] || {
                        x: c.x,
                        y: c.y,
                        alpha: pos.distance(player.pos)
                    }
                }
            }

            for (const key in this.g_shadows) {
                const shadow = this.g_shadows[key]
                if (shadow.alpha <= 0) {
                    delete this.g_shadows[key]
                } else {
                    pos.x = shadow.x * tileSize.y * scale
                    pos.y = shadow.y * tileSize.y * scale
                    this.drawRect(pos.add(camera.pos).subtract(vec2(camera.scale)), shadowSize)
                }
            }
            this.g_shadows = {}
        }
    }
}
