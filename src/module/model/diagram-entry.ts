import { DisplayTag } from './display-tag';

export interface DiagramEntry {
    indentation: string[];
    image: string;
    link: string | undefined;
    type: string | undefined;
    tags: DisplayTag[] | undefined;
}