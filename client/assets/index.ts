import hunterIdle from './hero/hunterIdle.png'
import hunterMove from './hero/hunterMove.png'
import mageIdle from './hero/volhvIdle.png'
import mageMove from './hero/volhvMove.png'
import warriorIdle from './hero/warriorIdle.png'
import warriorMove from './hero/warriorMove.png'
import lizardIdle from './enemy/lizardIdle.png'
import lizardMove from './enemy/lizardMove.png'

import coin from './loot/coin.png';
import potionRed from './loot/potion_red.png';
import potionBlue from './loot/potion_blue.png';
import potionGreen from './loot/potion_green.png';
import potionYellow from './loot/potion_yellow.png';
import battleAxe from './weapon/axe.png';
import ironSword from './weapon/sword.png';
import fireStaff from './weapon/fire_staff.png';
import iceStaff from './weapon/ice_staff.png';
import lightningStaff from './weapon/lightning_staff.png'
import hunterBow from './weapon/hunter_bow.png'

import chest from './chest.png';
import chestOpen from './chest-open.png';
import stone from './environment/stoneTile.png';
import caveTile1 from './environment/caveTile1.png';
import caveTile2 from './environment/caveTile2.png';
import caveTile3 from './environment/caveTile3.png';
import caveTile4 from './environment/caveTile4.png';
import F1 from './F1.png'

import swordSlash from './weapon/swordSlash.png'
import axeSlash from './weapon/axeSlash.png'
import arrow from './weapon/arrow.png'
import lightning from './weapon/lightning.png'
import fireball from './weapon/fireball.png'
import iceball from './weapon/iceball.png'

export const ASSETS = {
    hero: { warriorIdle, warriorMove, mageIdle, mageMove, hunterIdle, hunterMove },
    enemy: { lizardIdle, lizardMove },
    loot: { coin, potionRed, potionBlue, potionGreen, potionYellow },
    weapon: { battleAxe, ironSword, fireStaff, iceStaff, lightningStaff, hunterBow },
    env: { chest, chestOpen, stone, caveTile1, caveTile2, caveTile3, caveTile4},
    bubble: { F1 },
    particle: { swordSlash, axeSlash, arrow, lightning, fireball, iceball }
};

import envMusic from './sound/env.mp3' 

export const SOUNDS = {
    env: {envMusic}
}