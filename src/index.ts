import { Game } from 'platfuse'

import { ENTITY_TYPES, tvShader } from './lib/constants'
import * as Models from './lib/models'
import assets from './lib/assets'
import MainScene from './lib/scenes/main'

import './style.css'

const game = new Game(
    {
        // pixelPerfect: true,
        // fixedSize: [1280, 720],
        backgroundColor: '#140C1C',
        // postProcessShader: tvShader,
        entities: {
            [ENTITY_TYPES.BOX]: Models.Box,
            [ENTITY_TYPES.COIN]: Models.Coin,
            [ENTITY_TYPES.PLAYER]: Models.Player,
            [ENTITY_TYPES.SLIME]: Models.Slime,
            [ENTITY_TYPES.SPIKES]: Models.Spikes
        },
        scenes: {
            MainScene
        },
        debug: true,
        global: true
    },
    assets
)

async function start() {
    await game.start('MainScene')
    game.setAudioVolume(0.1)
}

start()
