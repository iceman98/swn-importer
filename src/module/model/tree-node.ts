import { BaseEntity } from './base-entity';
import { SectorData } from './sector-data';

export interface TreeNode {
    id: string;
    folder: Folder | undefined;
    journal: JournalEntry | undefined;
    entity: BaseEntity;
    coordinates: string | undefined;
    type: keyof SectorData;
    children: TreeNode[];
    parent: TreeNode | undefined;
}
