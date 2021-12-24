export class Utils {
    static sqrt(number: number): number {
        return number ** 0.5;
    }

    static getMapWidth(hexes: number, width: number): number {
        return Math.floor(hexes * ((3 / 4) * width) + (1 / 4) * width);
    }

    static getMapHeight(hexes: number, height: number): number {
        return Math.floor((hexes + 1) * height);
    }
}
