import { BaseEntity } from './base-entity';

export interface PositionedEntity extends BaseEntity {
    x: number;
    y: number;
}
