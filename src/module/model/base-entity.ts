import { Attributes } from './attributes';
import { ParentEntityType } from './parent-entity-type';

export interface BaseEntity {
    attributes: Attributes;
    created: string;
    creator: string;
    isHidden: boolean;
    name: string;
    parent: string;
    parentEntity: ParentEntityType;
    updated: string;
}
