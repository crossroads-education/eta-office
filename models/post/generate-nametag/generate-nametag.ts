import * as eta from "eta-lib";

import * as express from "express";

import HelperFont from "../../../lib/helpers/HelperFont";
let Jimp: any = require("jimp");

export class Model implements eta.Model {
    public render(req: express.Request, res: express.Response, callback: (env: { [key: string]: any }) => void): void {
        let firstName: string = req.body.name.split(" ")[0];
        let imageDir: string = eta.server.modules["office"].baseDir + "lib/nametag/";
        Promise.all<any>([
            Jimp.loadFont(Jimp.FONT_SANS_16_WHITE),
            Jimp.loadFont(Jimp.FONT_SANS_32_WHITE),
            Jimp.read(imageDir + "horizontal.jpg"),
            Jimp.read(imageDir + "vertical.jpg")
        ]).then((results: any[]) => {
            let smallFont: any = results[0];
            let largeFont: any = results[1];
            let horizontalImage: any = results[2];
            let verticalImage: any = results[3];
            // horizontal
            horizontalImage.print(largeFont, 11, 9, firstName);
            // vertical
            let textWidth: number = HelperFont.getRenderedWidth("16pt Open Sans", firstName);
            let startPos: number = (verticalImage.bitmap.width - textWidth) / 2;
            verticalImage.print(smallFont, startPos, 150, firstName);
        }).catch((reason: string) => {
            eta.logger.warn("Failed to generate nametag: " + reason);
            return callback({errcode: eta.http.InternalError});
        });
        // Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then(function (smallFont: any) {
        //     // (<any>image).print(font, startPos, 150, firstName);
        //     // image.write(eta.server.modules["office"].baseDir + "lib/nametag/verticalwithname.jpg");
        //     callback({});
        // });
        // Jimp.read(eta.server.modules["office"].baseDir + "lib/nametag/horizontal.jpg", function (err: any, image: any) {
        //     if (err) {
        //         eta.logger.error(err);
        //         return callback({errcode: eta.http.InternalError});
        //     }
        //         image.print(font, 11, 9, firstName);
        //         image.rotate(270, true);
        //         image.resize(144, 253);
        //         image.write(eta.server.modules["office"].baseDir + "lib/nametag/horizontal-" + req.body.name + ".jpg");
        //         let ctx = canvas.getContext("2d");
        //         ctx.font = "16pt Open Sans";
        //         let textWidth = ctx.measureText(name).width;
        //         Jimp.read(eta.server.modules["office"].baseDir + "lib/nametag/vertical.jpg", function (err: Error, image: any) {
        //             if (err) {
        //                 eta.logger.error(err);
        //                 return callback({errcode: eta.http.InternalError});
        //             }
        //             let startPos = (image.bitmap.width - textWidth) / 2;
        //         });
        //     });
        // });
    }
}
