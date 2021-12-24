import { BaseEntity } from './base-entity';
import { PositionedEntity } from './positioned-entity';
import { Sector } from './sector';
import { Map } from './map';

export interface SectorData {
    asteroidBase: Map<string, BaseEntity>;
    asteroidBelt: Map<string, BaseEntity>;
    blackHole: Map<string, PositionedEntity>;
    deepSpaceStation: Map<string, BaseEntity>;
    gasGiantMine: Map<string, BaseEntity>;
    moon: Map<string, BaseEntity>;
    moonBase: Map<string, BaseEntity>;
    note: any;
    orbitalRuin: Map<string, BaseEntity>;
    planet: Map<string, BaseEntity>;
    refuelingStation: Map<string, BaseEntity>;
    researchBase: Map<string, BaseEntity>;
    sector: Map<string, Sector>;
    spaceStation: Map<string, BaseEntity>;
    system: Map<string, PositionedEntity>;
}
