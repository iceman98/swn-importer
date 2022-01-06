import { Attributes } from './attributes';
import { ParentEntityType } from './parent-entity-type';
import { PlanetAttributes } from './planet-attributes';

export interface BaseEntity {
    attributes: Attributes | PlanetAttributes;
    created: string;
    creator: string;
    isHidden: boolean;
    name: string;
    parent: string;
    parentEntity: ParentEntityType;
    updated: string;
}
