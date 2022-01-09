import { DisplayTag } from './display-tag';

export interface DisplayChild {
    link: string;
    type: string;
    coordinates: string;
    tags: DisplayTag[];
}
