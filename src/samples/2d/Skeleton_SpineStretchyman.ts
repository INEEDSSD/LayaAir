/**
description
 Spine骨骼动画播放与循环展示的管理类
 */
import { Laya } from "Laya";
import { Skeleton } from "laya/ani/bone/Skeleton";
import { Templet } from "laya/ani/bone/Templet";
import { Event } from "laya/events/Event";
import { Browser } from "laya/utils/Browser";
import { Stat } from "laya/utils/Stat";
import { Main } from "./../Main";

export class Skeleton_SpineStretchyman {

	private mAniPath: string;
	private mStartX: number = 200;
	private mStartY: number = 500;
	private mActionIndex: number = 0;
	private mCurrIndex: number = 0;
	private mArmature: Skeleton;
	private mCurrSkinIndex: number = 0;

	Main: typeof Main = null;
	constructor(maincls: typeof Main) {
		this.Main = maincls;

		Laya.init(Browser.width, Browser.height).then(() => {
			Laya.stage.bgColor = "#ffffff";
			Stat.show();

			Laya.loader.load("res/spine/spineRes4/stretchyman.sk").then((templet: Templet) => {
				//创建模式为1，可以启用换装
				this.mArmature = templet.buildArmature(1);
				this.mArmature.x = this.mStartX;
				this.mArmature.y = this.mStartY;
				//mArmature.scale(0.5, 0.5);
				this.Main.box2D.addChild(this.mArmature);
				this.mArmature.on(Event.STOPPED, this, this.completeHandler);
				this.play();
			});
		});
	}

	private completeHandler(): void {
		this.play();
	}

	private play(): void {
		this.mCurrIndex++;
		if (this.mCurrIndex >= this.mArmature.getAnimNum()) {
			this.mCurrIndex = 0;
		}
		this.mArmature.play(this.mCurrIndex, false);

	}

	dispose(): void {
		if (this.mArmature == null)
			return;
		this.mArmature.stop();
		this.mArmature.off(Event.STOPPED, this, this.completeHandler);
	}
}


