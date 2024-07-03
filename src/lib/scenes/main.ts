import { Scene } from 'platfuse'
import tiledMap from '../../assets/map/tiledmap.tmx'
import Player from '../models/player'
// import Darkness from '../layers/darkness'

export default class MainScene extends Scene {
    player?: Player
    debug = true
    gravity = 0.05

    async init() {
        const { game } = this

        await super.init(tiledMap)
        this.setScale(4)
        // this.addLayer(Darkness)
        this.setTileCollisionLayer(2)
        game.setSettings({ shadows: 1 })

        console.log('Main Scene initialized', this)

        if (game.debug && game.gui) {
            game.gui
                .add(game.settings, 'shadows', {
                    disabled: 0,
                    dither: 1,
                    alpha: 2
                })
                .name('Shadows')
        }
    }
}
