import { AttributeEntry } from './attribute-entry';
import { DiagramEntry } from './diagram-entry';
import { DisplayChild } from './display-child';
import { DisplayTag } from './display-tag';

export interface DisplayEntity {
    name: string;
    diagram: DiagramEntry[];
    attributes: AttributeEntry[];
    description: string | undefined;
    notes: AttributeEntry[];
    image: string;
    tags: DisplayTag[] | undefined;
    showType: boolean;
    type: string;
    location: string | undefined;
    parentLink: string | undefined;
    parentType: string | undefined;
    parentTags: DisplayTag[] | undefined;
    systemLink: string | undefined;
    systemType: string | undefined;
    systemTags: DisplayTag[] | undefined;
    children: DisplayChild[];
    coordinates: string | undefined;
}