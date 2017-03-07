let Canvas: any = require("canvas");

export default class HelperFont {
    public static getRenderedWidth(font: string, text: string): number {
        let canvas: HTMLCanvasElement = new Canvas(250, 250);
        let ctx = canvas.getContext("2d");
        ctx.font = "16pt Open Sans";
        return ctx.measureText(name).width;
    }
}
