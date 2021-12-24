import { Tag } from './tag';

export interface PlanetAttributes {
    atmosphere: string;
    biosphere: string;
    population: string;
    techLevel: string;
    temperature: string;
    tags: Tag[];
}
