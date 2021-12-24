import { Attributes } from './attributes';
import { ParentEntityType } from './parent-entity-type';
import { PlanetAttributes } from './planet-attributes';
import { SectorData } from './sector-data';

export interface BaseEntity {
    id: string;
    attributes: Attributes | PlanetAttributes;
    created: string;
    creator: string;
    isHidden: boolean;
    name: string;
    parent: string;
    parentEntity: ParentEntityType;
    updated: string;
    type: keyof SectorData;
}
