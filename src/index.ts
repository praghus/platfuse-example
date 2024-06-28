import { Color, Game, vec2 } from 'platfuse'

import { COLORS, ENTITY_TYPES, SCENES } from './lib/constants'
import * as Models from './lib/models'
import assets from './lib/assets'
import MainScene from './lib/scenes/main'

import './style.css'

const game = new Game(
    {
        fixedSize: vec2(1280, 720),
        backgroundColor: new Color(COLORS.BACKGROUND),
        scenes: { [SCENES.MAIN]: MainScene },
        entities: {
            [ENTITY_TYPES.BOX]: Models.Box,
            [ENTITY_TYPES.COIN]: Models.Coin,
            [ENTITY_TYPES.DUST]: Models.Dust,
            // [ENTITY_TYPES.PARTICLE]: Models.Particle,
            [ENTITY_TYPES.PLAYER]: Models.Player,
            [ENTITY_TYPES.SLIME]: Models.Slime,
            // [ENTITY_TYPES.SPIKES]: Models.Spikes,
            [ENTITY_TYPES.WATER]: Models.Water
        },
        debug: true,
        global: true
    },
    assets
)

async function start() {
    await game.init()
    game.playScene(SCENES.MAIN)
}

start()
