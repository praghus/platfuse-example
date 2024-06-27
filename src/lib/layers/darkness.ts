import { Entity, Layer, Vector, vec2 } from 'platfuse'
import { ENTITY_TYPES, LAYERS, TILE_TYPES } from '../constants'
import { Player } from '../models'
// const g_shadows = {}
/**
 * Based on "Creating a Line-of-sight Map" by Francesco Cossu
 * https://francescocossu.medium.com/creating-a-line-of-sight-map-c63e44973c6f
 */
export default class Darkness extends Layer {
    id = LAYERS.DARKNESS
    center = new Vector(0, 0)
    rows = 0
    cols = 0
    range = 8
    tileWidth = 16
    tileHeight = 16
    tilesData: number[][] = []
    // shadowCastingLayer = LAYERS.MAIN

    // drawRect(pos: Vector, size: Vector, color: string, alpha: number) {
    //     const { ctx, draw } = this.game

    //     ctx.fillStyle = '#fff'
    //     // ctx.clearRect(Math.round(pos.x), Math.round(pos.y), Math.round(size.x * 16), Math.round(size.y * 16))
    //     // ctx.globalAlpha = alpha
    //     ctx.fillRect(Math.round(pos.x - 16), Math.round(pos.y), Math.round(size.x * 16), Math.round(size.y * 16))
    //     draw.fillText(`${alpha.toFixed(1)}`, Math.round(pos.x - 16), Math.round(pos.y), '#222')
    // }

    // renderFOW() {
    //     const scene = this.game.getCurrentScene()
    //     const player = scene.getObjectByType(ENTITY_TYPES.PLAYER) as Player

    //     const { camera, tileSize } = scene
    //     const { resolution } = camera
    //     // const theMap = scene.tileCollision //mapData[g_levelDef.map]

    //     const pos = vec2(0)

    //     for (let x = 0; x < 21; x++) {
    //         for (let y = 0; y < 15; y++) {
    //             const cx = x //- 0.5
    //             const cy = y //- 0.5
    //             // check if this tile is onscreen
    //             // if (
    //             // 	abs(cx - cameraPos.x) - 1 > overlayCanvas.width / (cameraScale * 2) ||
    //             // 	abs(cy - cameraPos.y) - 1 > overlayCanvas.height / (cameraScale * 2)
    //             // ) {
    //             // 	continue;
    //             // }

    //             let dVec = vec2(player.pos.x - cx, player.pos.y - cy)
    //             dVec = dVec.clampLength(Math.min(1.5, dVec.length()))
    //             pos.x = cx + dVec.x
    //             pos.y = cy + dVec.y
    //             const pos2 = scene.tileCollisionRaycast(player.pos, pos)
    //             // if collision and the collision is not this tile
    //             if (pos2 && !(pos2.x == cx && pos2.y == cy)) {
    //                 const shadow = g_shadows[x + '_' + y] || {
    //                     x: cx,
    //                     y: cy,
    //                     alpha: pos2.x
    //                 }
    //                 // shadow.alpha = Math.min(1, shadow.alpha + 0.1)

    //                 g_shadows[x + '_' + y] = shadow
    //                 //drawRect(pos, vec2(0.1), new Color(1, 0, 0));
    //             } else {
    //                 //drawRect(pos, vec2(0.1), new Color(0, 1, 0));
    //             }
    //         }

    //         const shadowSize = vec2(1)
    //         const color = '#ff0000'
    //         for (const key in g_shadows) {
    //             const shadow = g_shadows[key]
    //             // fade
    //             // shadow.alpha -= (0.01 * 60) / 60
    //             // console.info(shadow.alpha)
    //             if (shadow.alpha <= 0) {
    //                 delete g_shadows[key]
    //             } else {
    //                 pos.x = shadow.x * 16
    //                 pos.y = shadow.y * 16
    //                 this.drawRect(pos.add(camera.pos), shadowSize, color, shadow.alpha)
    //             }
    //         }
    //         // console.info(g_shadows)
    //     }
    // }

    #generateTilesData() {
        const scene = this.game.getCurrentScene()
        const { camera, tileSize } = scene
        const { resolution } = camera
        // const layer = scene.tileCollision

        let y = Math.floor(camera.pos.y % tileSize.y)
        let _y = Math.floor(-camera.pos.y / tileSize.y)

        const tiles = []

        while (y <= resolution.y + 1) {
            const c = []
            let x = Math.floor(camera.pos.x % tileSize.x)
            let _x = Math.floor(-camera.pos.x / tileSize.x)
            while (x <= resolution.x + 1) {
                const tileId = scene.getTileCollisionData(vec2(_x, _y))

                c.push(tileId && ![TILE_TYPES.LADDER].includes(tileId) ? 1 : 0)

                x += tileSize.x
                _x++
            }
            tiles.push(c)
            y += tileSize.y
            _y++
        }
        this.tilesData = tiles
        this.rows = tiles.length
        this.cols = tiles[0].length
    }

    #getRaytraceCollidingTilesVertically(y: number, dy: number, m: number, q: number): Array<Vector> {
        const losTiles = new Array<Vector>()
        const losPoint = new Vector(Math.round((y - q) / m), y)
        const losTile = this.getTileByPoint(losPoint)

        if (dy < 0) losTile.y--

        losTiles.push(losTile)
        if (losPoint.x / this.tileWidth === Math.floor(losPoint.x / this.tileWidth)) {
            losTiles.push(new Vector(losTile.x - 1, losTile.y))
        }
        return losTiles
    }

    #getRaytraceCollidingTilesHorizontally(x: number, dx: number, m: number, q: number): Array<Vector> {
        const losTiles = new Array<Vector>()
        const losPoint = new Vector(x, Math.round(m * x + q))
        const losTile = this.getTileByPoint(losPoint)

        if (dx < 0) losTile.x--

        losTiles.push(losTile)
        if (losPoint.y / this.tileHeight === Math.floor(losPoint.y / this.tileHeight)) {
            losTiles.push(new Vector(losTile.x, losTile.y - 1))
        }
        return losTiles
    }

    #getLOSDistanceFactor(point: Vector, dstPoint: Vector, range: number): number {
        const distance = this.#getPointsDistance(point, dstPoint) / this.tileWidth
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
        const vlength = this.tileWidth / 4

        return [
            dstPoint,
            new Vector(dstPoint.x + pvx * vlength, dstPoint.y + pvy * vlength),
            new Vector(dstPoint.x - pvx * vlength, dstPoint.y - pvy * vlength)
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
            if (dy > 0) for (let r = tile.y + 1; r < dstTile.y; r++) losTiles.push(new Vector(tile.x, r))
            else for (let r = tile.y - 1; r > dstTile.y; r--) losTiles.push(new Vector(tile.x, r))
        } else if (dy === 0) {
            if (dx > 0) for (let c = tile.x + 1; c < dstTile.x; c++) losTiles.push(new Vector(c, tile.y))
            else for (let c = tile.x - 1; c > dstTile.x; c--) losTiles.push(new Vector(c, tile.y))
        } else {
            const nextRowStart = Math.ceil(point.y / this.tileHeight) * this.tileHeight
            const currRowStart = Math.floor(point.y / this.tileHeight) * this.tileHeight
            const nextColStart = Math.ceil(point.x / this.tileWidth) * this.tileWidth
            const currColStart = Math.floor(point.x / this.tileWidth) * this.tileWidth

            const m = dy / dx
            const q = (dstPoint.x * point.y - point.x * dstPoint.y) / dx

            if (dy > 0)
                for (let y = nextRowStart; y < dstPoint.y; y += this.tileHeight)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesVertically(y, dy, m, q))
            else
                for (let y = currRowStart; y > dstPoint.y; y -= this.tileHeight)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesVertically(y, dy, m, q))

            if (dx > 0)
                for (let x = nextColStart; x < dstPoint.x; x += this.tileWidth)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesHorizontally(x, dx, m, q))
            else
                for (let x = currColStart; x > dstPoint.x; x -= this.tileWidth)
                    losTiles = losTiles.concat(this.#getRaytraceCollidingTilesHorizontally(x, dx, m, q))
        }

        for (let p = 0; p < losTiles.length; p++) {
            const losTile = losTiles[p]
            if (this.tilesData[losTile.y][losTile.x] === 1) return false
        }
        return true
    }

    #isValidTile(tile: Vector) {
        return tile.y >= 0 && tile.y < this.rows && tile.x >= 0 && tile.x < this.cols
    }

    getTileByPoint(point: Vector): Vector {
        return new Vector(Math.floor(point.x / this.tileWidth), Math.floor(point.y / this.tileHeight))
    }

    getPointByTile(tile: Vector): Vector {
        return new Vector((tile.x + 0.5) * this.tileWidth, (tile.y + 0.5) * this.tileHeight)
    }

    getLineOfSightGrid(tile: Vector): (number | null)[][] {
        const lineOfSightGrid = new Array<Array<number | null>>()
        for (let n = 0; n < this.rows; n++) {
            lineOfSightGrid.push(new Array<number | null>().fill(null))
        }

        const point = this.getPointByTile(tile)

        for (let r = tile.y - this.range; r <= tile.y + this.range; r++) {
            for (let c = tile.x - this.range; c <= tile.x + this.range; c++) {
                const dstTile = new Vector(c, r)
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

    getEntityRelativePos(entity: Entity) {
        const scene = this.game.getCurrentScene()
        const { pos } = entity.getTranslatedPositionRect()
        return new Vector(
            Math.floor((pos.x + 16 + scene.camera.pos.x) / this.tileWidth),
            Math.floor((pos.y + 16 + scene.camera.pos.y) / this.tileHeight)
        )
    }

    // update() {
    //     this.#generateTilesData()
    // }

    draw() {
        const shadows = this.game.getSetting('shadows')

        if (!shadows || !this.visible) return

        // this.renderFOW()

        this.#generateTilesData()

        const scene = this.game.getCurrentScene()
        const player = scene.getObjectByType(ENTITY_TYPES.PLAYER) as Player
        const shadowsData = this.getLineOfSightGrid(this.getEntityRelativePos(player))

        if (shadowsData.length) {
            const { ctx } = this.game
            const { camera } = scene
            const topLeft = new Vector(
                Math.floor(-camera.pos.x / this.tileWidth),
                Math.floor(-camera.pos.y / this.tileHeight)
            )
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    const data = shadowsData[y][x]
                    const posX = (topLeft.x + x) * this.tileWidth + Math.floor(camera.pos.x)
                    const posY = (topLeft.y + y) * this.tileHeight + Math.floor(camera.pos.y)

                    let clipX
                    if (!data) clipX = 0
                    else if (data <= 0.9) clipX = 16
                    else if (data <= 1.9) clipX = 32
                    else if (data <= 2.9) clipX = 48
                    else if (data <= 3.9) clipX = 64
                    else clipX = 80

                    ctx.drawImage(
                        this.game.getImage('dither.png'),
                        clipX,
                        (shadows - 1) * 16,
                        this.tileWidth,
                        this.tileHeight,
                        posX,
                        posY,
                        this.tileWidth,
                        this.tileHeight
                    )
                    // if (debug) {
                    //     draw.fillText(`${data?.toFixed(2) || '-'}`, posX + 2, posY + 10, '#222')
                    // }
                }
            }
        }
    }
}
