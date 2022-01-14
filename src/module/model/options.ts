import { Utils } from '../utils';

export class Options {
    generateSectorCoordinates = true;
    generateNotesForAllEntities = false;
    onlyGMJournals = true;
    addTypeToEntityJournal = true;
    generateHexName = true;
    prefixSystemFoldersWithCoordinates = true;

    asteroidBasePath = Utils.getImagePath("asteroidBase.png");
    asteroidBeltPath = Utils.getImagePath("asteroidBelt.png");
    blackHolePath = Utils.getImagePath("blackHole.png");
    deepSpaceStationPath = Utils.getImagePath("deepSpaceStation.png");
    gasGiantMinePath = Utils.getImagePath("gasGiantMine.png");
    moonPath = Utils.getImagePath("moon.png");
    moonBasePath = Utils.getImagePath("moonBase.png");
    orbitalRuinPath = Utils.getImagePath("orbitalRuin.png");
    planetPath = Utils.getImagePath("planet.png");
    refuelingStationPath = Utils.getImagePath("refuelingStation.png");
    researchBasePath = Utils.getImagePath("researchBase.png");
    spaceStationPath = Utils.getImagePath("spaceStation.png");
    systemPath = Utils.getImagePath("system.png");

    backgroundPath = Utils.getImagePath("starField.png");
}