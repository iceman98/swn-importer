import { DisplayList } from './display-list';

export interface DisplayTag {
    name: string;
    description: string;
    lists: DisplayList[];
    link: string | undefined;
}
