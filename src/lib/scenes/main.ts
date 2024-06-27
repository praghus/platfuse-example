import { Scene } from 'platfuse'

import tiledMap from '../../assets/map/tiledmap.tmx'
import Player from '../models/player'
import Darkness from '../layers/darkness'
// import Overlay from '../layers/overlay'

export default class MainScene extends Scene {
    player?: Player
    debug = true
    gravity = 0.05

    async init() {
        const { game } = this

        await super.init(tiledMap)
        this.setScale(3)
        this.addLayer(Darkness)
        this.setTileCollisionLayer(1)
        game.setSettings({ shadows: 1 })

        console.log('Main Scene initialized', this)

        if (game.debug && game.gui) {
            const f1 = game.gui.addFolder('Scene')
            const f2 = f1.addFolder('Layers')
            this.layers.map(layer => {
                f2.add(layer, 'visible').name(layer.name || `Layer#${layer.id}`)
            })

            f1.add(this, 'gravity').name('Gravity').step(0.01).min(0).max(1)
            f1.add(game.settings, 'shadows', {
                disabled: 0,
                dither: 1,
                alpha: 2
            }).name('Shadows')
        }
    }
}
