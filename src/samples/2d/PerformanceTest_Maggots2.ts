/**
description
 性能测试：模拟大量虫子动态移动和渲染的Laya引擎示例
 */
import { Laya } from "Laya";
import { Sprite } from "laya/display/Sprite";
import { Rectangle } from "laya/maths/Rectangle";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Main } from "./../Main";

export class PerformanceTest_Maggots2 {
	private texturePath: string = "res/tinyMaggot.png";

	private padding: number = 100;
	private maggotAmount: number = 0;

	private tick: number = 0;
	private maggots: any[] = [];
	private wrapBounds: Rectangle;
	private maggotTexture: any;

	Main: typeof Main = null;
	constructor(maincls: typeof Main) {
		this.Main = maincls;

		Laya.init(Browser.width, Browser.height).then(() => {
			Laya.stage.bgColor = "#000001";
			Stat.show(0, 0);

			this.wrapBounds = new Rectangle(-this.padding, -this.padding, Laya.stage.width + this.padding * 2, Laya.stage.height + this.padding * 2);

			Laya.loader.load(this.texturePath, Handler.create(this, this.onTextureLoaded2));
		});
	}

	private _isClear: boolean;
	private nowTime: number;
	private maggotContainer: Sprite;
	private onTextureLoaded2(): void {
		this.maggotContainer = this.createNewContainer();
		this.maggotTexture = Laya.loader.getRes(this.texturePath);
		Laya.timer.frameLoop(1, this, this.animate);
		Laya.timer.loop(2000, this, this.initMaggots);
	}

	private onTextureLoaded(e: any = null): void {
		this.maggotTexture = Laya.loader.getRes(this.texturePath);
		this.initMaggots();
		Laya.timer.frameLoop(1, this, this.animate);
	}

	/**
	 * @param num
	 */
	private initMaggots(num: number = 1000): void {
		this.nowTime = Browser.now();
		this.maggotAmount += num;
		for (var i: number = 0; i < num; i++) {
			var maggot: Maggot = this.newMaggot();
			this.maggotContainer.addChild(maggot);
			this.maggots.push(maggot);
		}
	}

	private createNewContainer(): Sprite {
		var container: Sprite = new Sprite();
		container.size(Laya.stage.width, Laya.stage.height);
		// 此处cacheAsBitmap主要是为了创建新画布
		// 解除IBQuadrangle数量限制
		// 在显示虫子数量超过16383时需要打开下面一行
		// container.cacheAsBitmap = true;
		this.Main.box2D.addChild(container);
		return container;
	}

	private newMaggot(): Maggot {
		var maggot: Maggot = new Maggot();
		maggot.graphics.drawTexture(this.maggotTexture, 0, 0);

		maggot.pivot(16.5, 35);

		var rndScale: number = 0.8 + Math.random() * 0.3;
		maggot.scale(rndScale, rndScale);
		maggot.rotation = 0.1;
		maggot.x = Math.random() * Laya.stage.width;
		maggot.y = Math.random() * Laya.stage.height;

		maggot.direction = Math.random() * Math.PI;
		maggot.turningSpeed = Math.random() - 0.8;
		maggot.speed = (2 + Math.random() * 2) * 0.2;
		maggot.offset = Math.random() * 100;

		return maggot;
	}

	private animate(): void {
		var maggot: any;
		var wb: Rectangle = this.wrapBounds;
		var angleUnit: number = 180 / Math.PI;
		var dir: any, x: number = 0.0, y: number = 0.0;
		for (var i: number = 0; i < this.maggotAmount; i++) {
			maggot = this.maggots[i];

			maggot.scaleY = 0.90 + Math.sin(this.tick + maggot.offset) * 0.1;

			maggot.direction += maggot.turningSpeed * 0.01;
			dir = maggot.direction;
			x = maggot.x;
			y = maggot.y;

			x += Math.sin(dir) * (maggot.speed * maggot.scaleY);
			y += Math.cos(dir) * (maggot.speed * maggot.scaleY);

			maggot.rotation = (-dir + Math.PI) * angleUnit;

			if (x < wb.x)
				x += wb.width;
			else if (x > wb.x + wb.width)
				x -= wb.width;
			if (y < wb.y)
				y += wb.height;
			else if (y > wb.y + wb.height)
				y -= wb.height;

			maggot.pos(x, y);
		}

		this.tick += 0.1;

		var currentTime: number = Browser.now();
		var chazhi: number = currentTime - this.nowTime;
		console.log("------------chazhi:" + chazhi);
		if (Stat.FPS < 50 && (chazhi > 4990) && !this._isClear) {
			this._isClear = true;
			console.log("---------clear---------");
			Laya.timer.clear(this, this.initMaggots);
		}
	}

	dispose(): void {
		Laya.timer.clear(this, this.animate);
		Laya.timer.clear(this, this.initMaggots);
	}
}




class Maggot extends Sprite {
	direction: number;
	turningSpeed: number;
	speed: number;
	offset: number;
}
