import { BaseEntity } from './base-entity';
import { PositionedEntity } from './positioned-entity';
import { Sector } from './sector';

export interface SectorData {
    asteroidBase: Record<string, BaseEntity>;
    asteroidBelt: Record<string, BaseEntity>;
    blackHole: Record<string, PositionedEntity>;
    deepSpaceStation: Record<string, BaseEntity>;
    gasGiantMine: Record<string, BaseEntity>;
    moon: Record<string, BaseEntity>;
    moonBase: Record<string, BaseEntity>;
    note: Record<string, BaseEntity>;
    orbitalRuin: Record<string, BaseEntity>;
    planet: Record<string, BaseEntity>;
    refuelingStation: Record<string, BaseEntity>;
    researchBase: Record<string, BaseEntity>;
    sector: Record<string, Sector>;
    spaceStation: Record<string, BaseEntity>;
    system: Record<string, PositionedEntity>;
}
