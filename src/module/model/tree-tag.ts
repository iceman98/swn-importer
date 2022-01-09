import { DisplayTag } from './display-tag';
import { Tag } from './tag';

export interface TreeTag {
    id: string;
    tag: Tag;
    displayTag: DisplayTag;
    journal: JournalEntry | undefined;
}
