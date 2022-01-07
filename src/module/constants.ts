export class Constants {
    static readonly MODULE_ID = "swn-importer";
    static readonly LOCALIZATION_NAMESPACE = "SWN-IMPORTER";

    static readonly BACKGROUND_COLOR = "#01162c";
    static readonly GRID_COLOR = "#99caff";

    static readonly HEX_RADIUS = 100;
    static readonly HEX_WIDTH = 2 * Constants.HEX_RADIUS;
    static readonly HEX_HEIGHT = 2 * ((-1 * ((Constants.HEX_RADIUS / 2) ** 2 - Constants.HEX_RADIUS ** 2)) ** 0.5);
    static readonly HEX_VERTICAL_RADIUS = Constants.HEX_HEIGHT / 2;
    static readonly ORBITING_DISTANCE = 0.55 * Constants.HEX_RADIUS;
}
