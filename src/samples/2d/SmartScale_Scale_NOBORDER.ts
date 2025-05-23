/**
description
 无边界缩放模式，居中绘制灰色矩形，自适应舞台大小
 */
import { Laya } from "Laya";
import { Sprite } from "laya/display/Sprite";
import { Stage } from "laya/display/Stage";
import { Main } from "./../Main";

export class SmartScale_Scale_NOBORDER {
	private rect: Sprite;

	Main: typeof Main = null;
	constructor(maincls: typeof Main) {
		this.Main = maincls;

		Laya.init(550, 400).then(() => {
			Laya.stage.scaleMode = Stage.SCALE_NOBORDER;
			Laya.stage.bgColor = "#232628";
			this.createCantralRect();
		});
	}

	private createCantralRect(): void {
		this.rect = new Sprite();
		this.rect.graphics.drawRect(-100, -100, 200, 200, "gray");
		this.Main.box2D.addChild(this.rect);

		this.updateRectPos();
	}

	private updateRectPos(): void {
		this.rect.x = Laya.stage.width / 2;
		this.rect.y = Laya.stage.height / 2;
	}
}


