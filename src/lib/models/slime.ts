import { clamp, Entity, Scene, vec2, DefaultColors } from 'platfuse'

import ANIMATIONS from '../animations/slime'
import { DIRECTIONS } from '../../lib/constants'

export default class Slime extends Entity {
    image = 'slime.png'
    animation = ANIMATIONS.BOUNCE
    direction = DIRECTIONS.LEFT
    distance = 0
    damage = 20
    running = false
    initialPos = vec2()

    constructor(scene: Scene, obj: Record<string, any>) {
        super(scene, obj)
        this.distance = this.size.y
        this.initialPos = this.pos.clone().subtract(this.size.divide(2))
        this.size = vec2(0.8, 0.6)
        // console.info('Slime created', this.pos, this.initialPos)
    }

    update() {
        // if (this.running) {

        // }
        // if (this.pos.x + 32 > this.initialPos.x + this.distance || this.pos.x + 16 < this.initialPos.x) {
        //     //this.bounce()
        //     console.info('bounce')
        //     this.direction = this.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT
        // }
        // if (this.pos.x <= this.initialPos.x) {
        //     //this.bounce()
        //     console.info('bounce')
        //     this.direction = this.direction === DIRECTIONS.RIGHT ? DIRECTIONS.LEFT : DIRECTIONS.RIGHT
        // }
        // this.force.x = clamp(
        //     this.force.x + this.direction === DIRECTIONS.RIGHT ? 0.012 : -0.012,
        //     -this.maxSpeed,
        //     this.maxSpeed
        // )

        this.setAnimation(this.running ? ANIMATIONS.RUN_RIGHT : ANIMATIONS.BOUNCE)
        super.update()
    }

    displayDebug(): void {
        // super.displayDebug()
        const { draw } = this.scene.game
        const rect = this.getTranslatedBoundingRect().move(this.scene.camera.pos)
        const {
            pos: { x, y },
            size
        } = rect
        draw.outline(rect, DefaultColors.Cyan, 1)
        draw.text(`Slime ${this.running ? 'running' : 'idle'}`, x, y)
    }
}
