export class Constants {
    /** This module id */
    static readonly MODULE_ID = "swn-importer";
    /** i18n tables prefix */
    static readonly LOCALIZATION_NAMESPACE = "SWN-IMPORTER";

    /** Scene background color */
    static readonly BACKGROUND_COLOR = "#01162c";
    /** Scene grid color */
    static readonly GRID_COLOR = "#99caff";

    /** Hex horizontal radius */
    static readonly HEX_RADIUS = 100;
    /** Hex width */
    static readonly HEX_WIDTH = 2 * Constants.HEX_RADIUS;
    /** Hex height */
    static readonly HEX_HEIGHT = 2 * ((-1 * ((Constants.HEX_RADIUS / 2) ** 2 - Constants.HEX_RADIUS ** 2)) ** 0.5);
    /** Hex vertical radius */
    static readonly HEX_VERTICAL_RADIUS = Constants.HEX_HEIGHT / 2;

    /** Distance of notes from center of hex */
    static readonly ORBITING_DISTANCE = 0.55 * Constants.HEX_RADIUS;

    /** List of handlebars partials */
    static readonly PARTIALS = ["tag", "notes", "tagLinks", "imagePicker"];
}
