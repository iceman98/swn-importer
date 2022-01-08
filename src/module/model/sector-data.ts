import { BaseEntity } from './base-entity';
import { PositionedEntity } from './positioned-entity';
import { Sector } from './sector';

export interface SectorData {
    asteroidBase: { [k: string]: BaseEntity };
    asteroidBelt: { [k: string]: BaseEntity };
    blackHole: { [k: string]: PositionedEntity };
    deepSpaceStation: { [k: string]: BaseEntity };
    gasGiantMine: { [k: string]: BaseEntity };
    moon: { [k: string]: BaseEntity };
    moonBase: { [k: string]: BaseEntity };
    note: any;
    orbitalRuin: { [k: string]: BaseEntity };
    planet: { [k: string]: BaseEntity };
    refuelingStation: { [k: string]: BaseEntity };
    researchBase: { [k: string]: BaseEntity };
    sector: { [k: string]: Sector };
    spaceStation: { [k: string]: BaseEntity };
    system: { [k: string]: PositionedEntity };
}
