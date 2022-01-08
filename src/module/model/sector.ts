import { BaseEntity } from './base-entity';

export interface Sector extends BaseEntity {
    columns: number;
    layers: { [k: string]: boolean };
    mapLocked: boolean;
    rows: number;
    attributes: any;
}
