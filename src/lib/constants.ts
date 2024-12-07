import { Color, Game } from 'platfuse'

export enum LAYERS {
    BACKGROUND = 1,
    MAIN = 2,
    OBJECTS = 5,
    SHADOWS = 4,
    DARKNESS = 10,
    CUSTOM_OVERLAY = 11
}

export enum DIRECTIONS {
    UP = 'up',
    RIGHT = 'right',
    DOWN = 'down',
    LEFT = 'left'
}

export enum ENTITY_TYPES {
    BOX = 'box',
    COIN = 'coin',
    DUST = 'dust',
    PARTICLE = 'particle',
    PLAYER = 'player',
    SLIME = 'slime',
    SPIKES = 'spikes',
    WATER = 'water'
}

export enum TILE_TYPES {
    LADDER = 30
}

export const DEFAULT_PARTICLE_SETTINGS = {
    angle: Math.PI,
    emitSize: 1,
    emitTime: 1,
    emitRate: 25,
    colorStart: new Color(255, 128, 0, 1),
    colorEnd: new Color(255, 0, 0, 0),
    ttl: 2.2,
    sizeStart: 0.15,
    sizeEnd: 0.2,
    speed: 0.1,
    angleSpeed: 0.1,
    damping: 1,
    angleDamping: 0.95,
    gravityScale: 0.5,
    fadeRate: 0.1,
    randomness: 0.5,
    collideTiles: true,
    collideObjects: true,
    renderOrder: 1,
    elasticity: 0.5,
    stretchScale: 0.5
}

export const tvShader = {
    uniforms: {
        iChannel0: { type: 'i', value: 0 },
        iTime: { value: (game: Game) => game.time },
        iResolution: { value: (game: Game) => [game.width, game.height, 1] }
    },
    vertexShader: `#version 300 es
            precision highp float;
            in vec2 p;
            void main(){
                gl_Position=vec4(p+p-1.,1,1);
            }`,
    fragmentShader: `#version 300 es
            precision highp float;
            uniform sampler2D iChannel0;
            uniform vec3 iResolution;
            uniform float iTime;
            out vec4 c;

            float hash(vec2 p){
                p=fract(p*.3197);
                return fract(1.+sin(51.*p.x+73.*p.y)*13753.3);
            }

            float noise(vec2 p){
                vec2 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
                return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);
            }

            void mainImage(out vec4 c, vec2 p){
                // put uv in texture pixel space
                p /= iResolution.xy;

                // apply fuzz as horizontal offset
                const float fuzz = .0005;
                const float fuzzScale = 800.;
                const float fuzzSpeed = 9.;
                p.x += fuzz*(noise(vec2(p.y*fuzzScale, iTime*fuzzSpeed))*2.-1.);

                // init output color
                c = texture(iChannel0, p);

                // chromatic aberration
                const float chromatic = .002;
                c.r = texture(iChannel0, p - vec2(chromatic,0)).r;
                c.b = texture(iChannel0, p + vec2(chromatic,0)).b;

                // tv static noise
                const float staticNoise = .1;
                c += staticNoise * hash(p + mod(iTime, 1e3));

                // scan lines
                const float scanlineScale = 1e3;
                const float scanlineAlpha = .1;
                c *= 1. + scanlineAlpha*sin(p.y*scanlineScale);

                // black vignette around edges
                const float vignette = 2.;
                const float vignettePow = 6.;
                float dx = 2.*p.x-1., dy = 2.*p.y-1.;
                c *= 1.-pow((dx*dx + dy*dy)/vignette, vignettePow);
            }

            void main(){
                mainImage(c,gl_FragCoord.xy);
                c.a=1.;
            }`
}
