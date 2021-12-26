import { SectorData } from './sector-data';

export interface Sector {
    id: string;
    columns: number;
    created: string;
    creator: string;
    layers: Map<string, boolean>;
    mapLocked: boolean;
    name: string;
    rows: number;
    updated: string;
    attributes: any;
    type: keyof SectorData;
}
