import { Tag } from './tag';

export interface Attributes {
    content: string;
    description: string;

    occupation: string;
    situation: string;

    atmosphere: string;
    biosphere: string;
    population: string;
    techLevel: string;
    temperature: string;
    tags: Tag[];
}
