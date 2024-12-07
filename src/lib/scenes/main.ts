import { GUI } from 'dat.gui'

import { Scene } from 'platfuse'
import Player from '../models/player'
import Darkness from '../layers/darkness'

export default class MainScene extends Scene {
    gui?: GUI
    debug = false
    gravity = 0.05
    tmxMap = 'tiledmap.tmx'

    init() {
        const { game } = this

        this.setScale(6)
        this.addLayer(Darkness, 1)
        this.setTileCollisionLayer(2)

        console.log('Main Scene initialized', this)

        this.gui = new GUI()

        const player = this.getObjectByType('player') as Player
        const f1 = this.gui.addFolder('Scene')
        const f2 = f1.addFolder('Layers')
        const f3 = f1.addFolder('Player')

        this.gui.add(game, 'debug').listen()
        // this.gui.add(game, 'avgFPS').listen()
        f1.add(this, 'gravity').step(0.01).min(0.01).max(1)
        f1.add(this.camera, 'scale').step(0.1).min(1).max(10).listen()
        f1.add(this.camera, 'scrolling').name('camera scroll').listen()
        this.layers
            .sort((a, b) => a.renderOrder - b.renderOrder)
            .map(layer => f2.add(layer, 'visible').name(layer.name || `Layer#${layer.id}`))

        f3.add(player, 'gravityScale').listen()
        f3.add(player, 'image', {
            'Owlet monster': 'monster1.png',
            'Pink monster': 'monster2.png',
            'Dude monster': 'monster3.png'
        })
            .name('Sprite')
            .onChange(image => player?.setImage(image))
        f3.add(player, 'invincible').name('God mode').listen()
        // f1.add(game.settings, 'shadows', {
        //     disabled: 0,
        //     dither: 1,
        //     alpha: 2
        // }).name('Shadows')
    }
}
