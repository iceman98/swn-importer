import { Tag } from './tag';

export interface Attributes {
    occupation: string;
    situation: string;
    atmosphere: string;
    biosphere: string;
    population: string;
    techLevel: string;
    temperature: string;
    description: string;
    tags: Tag[];
}
