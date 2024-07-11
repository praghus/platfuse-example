import { Color, Entity, Layer, Vector, vec2 } from 'platfuse'
import { ENTITY_TYPES, LAYERS, TILE_TYPES } from '../constants'
import { Player } from '../models'

/**
 * Based on "Creating a Line-of-sight Map" by Francesco Cossu
 * https://francescocossu.medium.com/creating-a-line-of-sight-map-c63e44973c6f
 */
export default class Darkness extends Layer {
    id = LAYERS.DARKNESS
    center = vec2(0, 0)
    rows = 0
    cols = 0
    range = 12
    generated = false
    tilesData: number[][] = []
    shadowCastingLayer = LAYERS.MAIN
    g_shadows: Record<string, { x: number; y: number; alpha: number }> = {}

    drawRect(pos: Vector, size: Vector, alpha: number) {
        const { ctx, draw, backgroundColor } = this.scene.game
        ctx.save()
        ctx.fillStyle = backgroundColor.toString()
        // ctx.fillStyle = color
        // ctx.clearRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
        ctx.globalAlpha = 0.95 //alpha
        ctx.fillRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x), Math.round(size.y))
        // draw.text(`${alpha.toFixed(2)}`, Math.round(pos.x), Math.round(pos.y), new Color())
        ctx.restore()
    }

    renderFOW() {
        const scene = this.scene
        const player = scene.getObjectByType(ENTITY_TYPES.PLAYER) as Player

        const { camera, tileSize } = scene
        const { scale } = camera
        // const theMap = scene.tileCollision //mapData[g_levelDef.map]

        const pos = vec2(0)
        const shadowSize = vec2(1 * tileSize.x * scale)

        for (let x = 0; x < scene.size.x; x++) {
            for (let y = 0; y < scene.size.y; y++) {
                const cx = x //- 0.5
                const cy = y //- 0.5

                let dVec = player.getTranslatedBoundingRect().pos
                dVec = dVec.clampLength(Math.min(0.5, dVec.length()))
                pos.x = cx + dVec.x
                pos.y = cy + dVec.y
                const pos2 = scene.raycastTileCollision(player.pos, pos, undefined)
                // if collision and the collision is not this tile
                if (pos2 && !(pos2.x === cx && pos2.y === cy)) {
                    this.g_shadows[x + '_' + y] = this.g_shadows[x + '_' + y] || {
                        x: cx,
                        y: cy,
                        alpha: player.pos.distance(pos2)
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
                    this.drawRect(pos.add(camera.pos).subtract(vec2(camera.scale)), shadowSize, shadow.alpha)
                }
            }
            this.g_shadows = {}
        }
    }

    #generateTilesData() {
        const { camera, tileSize } = this.scene
        const { scale } = camera

        const tiles = []
        const start = this.scene
            .getGridPos(vec2(Math.min(camera.pos.x, 0), Math.min(camera.pos.y, 0)))
            .divide(scale)
            .floor()
        const clip = vec2(
            Math.min(camera.size.x / scale / tileSize.x, this.scene.size.x) + 1,
            Math.min(camera.size.y / scale / tileSize.y, this.scene.size.y) + 1
        )
        for (let y = -start.y; y < -start.y + clip.y; y++) {
            const c = []
            for (let x = -start.x; x < -start.x + clip.x; x++) {
                const tileId = this.scene.getTileCollisionData(vec2(x, y))
                c.push(tileId && ![TILE_TYPES.LADDER].includes(tileId) ? 1 : 0)
            }
            tiles.push(c)
        }

        this.tilesData = tiles
        this.rows = tiles.length
        this.cols = tiles[0].length

        if (!this.generated) {
            console.info(start, clip, this.tilesData.toString())
            this.generated = true
            setTimeout(() => {
                this.generated = false
            }, 500)
        }
    }

    #getRaytraceCollidingTilesVertically(y: number, dy: number, m: number, q: number): Array<Vector> {
        const losTiles = new Array<Vector>()
        const losPoint = vec2(Math.round((y - q) / m), y)
        const losTile = this.getTileByPoint(losPoint)

        if (dy < 0) losTile.y--

        losTiles.push(losTile)
        if (losPoint.x / this.scene.tileSize.x === Math.floor(losPoint.x / this.scene.tileSize.x)) {
            losTiles.push(vec2(losTile.x - 1, losTile.y))
        }
        return losTiles
    }

    #getRaytraceCollidingTilesHorizontally(x: number, dx: number, m: number, q: number): Array<Vector> {
        const losTiles = new Array<Vector>()
        const losPoint = vec2(x, Math.round(m * x + q))
        const losTile = this.getTileByPoint(losPoint)

        if (dx < 0) losTile.x--

        losTiles.push(losTile)
        if (losPoint.y / this.scene.tileSize.y === Math.floor(losPoint.y / this.scene.tileSize.y)) {
            losTiles.push(vec2(losTile.x, losTile.y - 1))
        }
        return losTiles
    }

    #getLOSDistanceFactor(point: Vector, dstPoint: Vector, range: number): number {
        const distance = this.#getPointsDistance(point, dstPoint) / this.scene.tileSize.x
        return distance - range <= 0 ? -(distance - range) : 0
    }

    #getPointsDistance(point: Vector, dstPoint: Vector): number {
        const dx = dstPoint.x - point.x
        const dy = dstPoint.y - point.y
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
    }

    #getLOSVisibilityCheckPoints(point: Vector, dstPoint: Vector): Array<Vector> {
        const distance = this.#getPointsDistance(point, dstPoint)
        const vx = (dstPoint.x - point.x) / distance
        const vy = (dstPoint.y - point.y) / distance
        const pvx = vy
        const pvy = -vx
        const vlength = this.scene.tileSize.x / 4

        return [
            dstPoint,
            vec2(dstPoint.x + pvx * vlength, dstPoint.y + pvy * vlength),
            vec2(dstPoint.x - pvx * vlength, dstPoint.y - pvy * vlength)
        ]
    }

    #getLOSVisibilityFactor(tile: Vector, point: Vector, dstTile: Vector, dstPoint: Vector): number {
        let visibility = this.#getLOSVisibilityCheckPoints(point, dstPoint)
            .map((checkPoint): number => (this.#raytrace(tile, point, dstTile, checkPoint) ? 0.33 : 0))
            .reduce((prev, curr) => prev + curr)
        if (visibility === 0.99) visibility = 1
        return visibility
    }

    #raytrace(tile: Vector, point: Vector, dstTile: Vector, dstPoint: Vector) {
        const dx = dstPoint.x - point.x
        const dy = dstPoint.y - point.y
        let losTiles = new Array<Vector>()

        if (dx === 0) {
            if (dy > 0) for (let r = tile.y + 1; r < dstTile.y; r++) losTiles.push(vec2(tile.x, r))
            else for (let r = tile.y - 1; r > dstTile.y; r--) losTiles.push(vec2(tile.x, r))
        } else if (dy === 0) {
            if (dx > 0) for (let c = tile.x + 1; c < dstTile.x; c++) losTiles.push(vec2(c, tile.y))
            else for (let c = tile.x - 1; c > dstTile.x; c--) losTiles.push(vec2(c, tile.y))
        } else {
            const nextRowStart = Math.ceil(point.y / this.scene.tileSize.y) * this.scene.tileSize.y
            const currRowStart = Math.floor(point.y / this.scene.tileSize.y) * this.scene.tileSize.y
            const nextColStart = Math.ceil(point.x / this.scene.tileSize.x) * this.scene.tileSize.x
            const currColStart = Math.floor(point.x / this.scene.tileSize.x) * this.scene.tileSize.x

            const m = dy / dx
            const q = (dstPoint.x * point.y - point.x * dstPoint.y) / dx

            if (dy > 0)
                for (let y = nextRowStart; y < dstPoint.y; y += this.scene.tileSize.y)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesVertically(y, dy, m, q))
            else
                for (let y = currRowStart; y > dstPoint.y; y -= this.scene.tileSize.y)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesVertically(y, dy, m, q))

            if (dx > 0)
                for (let x = nextColStart; x < dstPoint.x; x += this.scene.tileSize.x)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesHorizontally(x, dx, m, q))
            else
                for (let x = currColStart; x > dstPoint.x; x -= this.scene.tileSize.x)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesHorizontally(x, dx, m, q))
        }

        for (let p = 0; p < losTiles.length; p++) {
            const losTile = losTiles[p]
            if (losTile.x < 0 || losTile.x >= this.cols || losTile.y < 0 || losTile.y >= this.rows) return false
            if (this.tilesData[losTile.y][losTile.x] === 1) return false
        }
        return true
    }

    #isValidTile(tile: Vector) {
        return tile.y >= 0 && tile.y < this.rows && tile.x >= 0 && tile.x < this.cols
    }

    getTileByPoint(point: Vector): Vector {
        return vec2(Math.floor(point.x / this.scene.tileSize.x), Math.floor(point.y / this.scene.tileSize.y))
    }

    getPointByTile(tile: Vector): Vector {
        return vec2((tile.x + 0.5) * this.scene.tileSize.x, (tile.y + 0.5) * this.scene.tileSize.y)
    }

    getLineOfSightGrid(tile: Vector): (number | null)[][] {
        const lineOfSightGrid = new Array<Array<number | null>>()
        for (let n = 0; n < this.rows; n++) {
            lineOfSightGrid.push(new Array<number | null>().fill(null))
        }

        const point = this.getPointByTile(tile)

        for (let r = tile.y - this.range; r <= tile.y + this.range; r++) {
            for (let c = tile.x - this.range; c <= tile.x + this.range; c++) {
                if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) continue
                const dstTile = vec2(c, r)
                if (dstTile.x === tile.x && (dstTile.y === tile.y || dstTile.y === tile.y + 1)) {
                    lineOfSightGrid[dstTile.y][dstTile.x] = this.range
                } else if (this.#isValidTile(dstTile)) {
                    const dstPoint = this.getPointByTile(dstTile)
                    const distanceFactor = this.#getLOSDistanceFactor(point, dstPoint, this.range)
                    if (distanceFactor > 0 && this.tilesData[dstTile.y][dstTile.x] === 0) {
                        const visibilityFactor = this.#getLOSVisibilityFactor(tile, point, dstTile, dstPoint)
                        if (visibilityFactor > 0) {
                            lineOfSightGrid[dstTile.y][dstTile.x] = distanceFactor * visibilityFactor
                        }
                    } else if (distanceFactor > 0) {
                        lineOfSightGrid[dstTile.y][dstTile.x] = distanceFactor
                    }
                }
            }
        }
        return lineOfSightGrid
    }

    // getEntityRelativePos(entity: Entity) {
    //     const { camera } = this.scene
    //     const { pos } = entity.getTranslatedBoundingRect()

    //     return vec2(
    //         Math.floor((pos.x + 8 + camera.pos.x) / this.scene.tileSize.x),
    //         Math.floor((pos.y + 8 + camera.pos.y) / this.scene.tileSize.y)
    //     )
    // }

    // update() {
    //     this.#generateTilesData()
    // }

    draw() {
        const shadows = this.scene.game.getSetting('shadows')

        if (!shadows || !this.visible) return

        this.renderFOW()

        /** /

        this.#generateTilesData()
        const scene = this.scene
        const { camera } = scene
        const { ctx } = scene.game
        // const player = scene.getObjectByType(ENTITY_TYPES.PLAYER) as Player
        const shadowsData = this.getLineOfSightGrid(this.scene.getPointerRelativeGridPos().floor())
        //this.getEntityRelativePos(player))

        if (shadowsData.length) {
            // const topLeft = vec2(
            //     Math.floor(-camera.pos.x / this.scene.tileSize.x),
            //     Math.floor(-camera.pos.y / this.scene.tileSize.y)
            // )

            const topLeft = camera.pos.clone().invert().divide(this.scene.tileSize).floor()

            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    const data = shadowsData[y][x]
                    const pos = vec2(x, y)
                        .add(topLeft)
                        .multiply(this.scene.tileSize)
                        .scale(camera.scale)
                        .subtract(vec2(camera.scale))
                        .add(camera.pos)
                    // const posX = (topLeft.x + x) * this.scene.tileSize.x + camera.pos.x
                    // const posY = (topLeft.y + y) * this.scene.tileSize.y + camera.pos.y

                    let clipX
                    if (!data) clipX = 0
                    else if (data <= 0.9) clipX = 16
                    else if (data <= 1.9) clipX = 32
                    else if (data <= 2.9) clipX = 48
                    else if (data <= 3.9) clipX = 64
                    else clipX = 80

                    ctx.drawImage(
                        this.scene.game.getImage('dither.png'),
                        clipX,
                        (shadows - 1) * 16,
                        16,
                        16,
                        pos.x,
                        pos.y,
                        this.scene.tileSize.x * camera.scale,
                        this.scene.tileSize.y * camera.scale
                    )
                    // if (debug) {
                    //     draw.fillText(`${data?.toFixed(2) || '-'}`, posX + 2, posY + 10, '#222')
                    // }
                }
            }
        }
        /**/
    }
}
