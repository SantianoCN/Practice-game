import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import { Room } from '../entities/Room';

export type GenerateIdFn = (prefix: string) => string;

// тип функций для NPC
export type ActionFn = (
    enemy: Enemy,
    target: Player,
    generateId: GenerateIdFn
) => boolean;

export const engage: ActionFn = () => {
    console.log('engage');
    return true;
}

export const kite: ActionFn = () => {
    console.log('kite');
    return true;
}

export const flank: ActionFn = () => {
    console.log('flank');
    return true;
}

export const retreat: ActionFn = () => {
    console.log('retreat');
    return true;
}

export const wait: ActionFn = () => {
    console.log('wait');
    return true;
}