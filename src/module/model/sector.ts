import { BaseEntity } from './base-entity';

export interface Sector extends BaseEntity {
    columns: number;
    layers: Map<string, boolean>;
    mapLocked: boolean;
    rows: number;
    attributes: any;
}
