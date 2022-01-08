import { Attributes } from './attributes';
import { SectorData } from './sector-data';

export interface BaseEntity {
    attributes: Attributes;
    created: string;
    creator: string;
    isHidden: boolean;
    name: string;
    parent: string;
    parentEntity: keyof SectorData;
    updated: string;
}
