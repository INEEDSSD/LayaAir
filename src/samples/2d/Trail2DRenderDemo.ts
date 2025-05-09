/**
description
 二维拖尾渲染演示，加载猴子图片并创建带拖尾效果的精灵
 */
import { Laya } from "Laya";
import { Stage } from "laya/display/Stage";
import { Browser } from "laya/utils/Browser";
import { Stat } from "laya/utils/Stat";
import { Main } from "../Main";
import { Loader } from "laya/net/Loader";
import { Sprite } from "laya/display/Sprite";
import { WrapMode } from "laya/RenderEngine/RenderEnum/WrapMode";
import { BaseTexture } from "laya/resource/BaseTexture";
import { Texture } from "laya/resource/Texture";
import { Color } from "laya/maths/Color";
import { Trail2DRender } from "laya/trail/trail2D/Trail2DRender";

export class Trail2DRenderDemo {
    Main: typeof Main = null;
    private _lastX = 0;
    private trail2Drender: Trail2DRender = null;
    rotateSprite: Sprite;
    constructor(mainClass: typeof Main) {
        this.Main = mainClass;
        Laya.init(Browser.clientWidth, Browser.clientHeight).then(() => {
            Laya.stage.alignV = Stage.ALIGN_MIDDLE;
            Laya.stage.alignH = Stage.ALIGN_CENTER;
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.bgColor = "#232628";
            Stat.show();
            Laya.loader.load("res/apes/monkey2.png", Loader.IMAGE).then(() => {
                let image = Loader.getRes("res/apes/monkey2.png");
                this.showApe(image);
            });
        });
    }

    private showApe(img: Texture): void {
        let texture: BaseTexture = img.bitmap;
        texture.wrapModeV = WrapMode.Repeat;
        texture.wrapModeU = WrapMode.Repeat;
        var ape: Sprite = new Sprite();
        this.rotateSprite = ape;
        ape.texture = img;
        var ape2 = new Sprite();
        this.Main.box2D.addChild(ape);
        ape.addChild(ape2);
        ape2.texture = img;
        ape.pos(500, 500);
        ape2.pos(300, 300);

        this.trail2Drender = ape2.addComponent(Trail2DRender) as Trail2DRender;

        this.trail2Drender.widthMultiplier = 50;
        this.trail2Drender.time = 0.5;
        this.trail2Drender.minVertexDistance = 1;
        this.trail2Drender.texture = img.bitmap;
        this.trail2Drender.color = Color.WHITE;
        Laya.timer.frameLoop(1, this, () => {
            this.rotateSprite.rotation += 1;
        })

        // let trail2Drender = this._line2Drender = ape.addComponent(Line2DRender);
        // // line2Drender.color = new Color(1, 0.5, 0.5, 1);
        // line2Drender.lineWidth = 10;
        // // line2Drender.texture = texture;
        // line2Drender.tillOffset = new Vector4(0, 0, 0.01, 1);
        // line2Drender.color = new Color(1, 0, 0, 1);
        // // line2Drender.enableDashedMode = true;

        // let last = new Vector2(Math.random() * Browser.clientWidth, Math.random() * Browser.clientHeight);
        // for (let i = 0; i < 20; i++) {
        //     let x = Math.random() * Browser.clientWidth;
        //     let y = Math.random() * Browser.clientHeight;
        //     line2Drender.addPoint(last.x, last.y, x, y);
        //     last.setValue(x, y);
        // }
        // line2Drender.addPoint(0, 0, 100, 100);
        // line2Drender.addPoint(100, 100, 1000, 500);
        // ape.graphics.drawTexture(t, 0, 0);

    }
}