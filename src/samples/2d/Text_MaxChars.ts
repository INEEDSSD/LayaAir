/**
description
 文本输入框最大字符限制为5个字符的Laya引擎示例代码
 */
import { Laya } from "Laya";
import { Input } from "laya/display/Input";
import { Stage } from "laya/display/Stage";
import { Browser } from "laya/utils/Browser";
import { Main } from "./../Main";

export class Text_MaxChars {

	Main: typeof Main = null;
	constructor(maincls: typeof Main) {
		this.Main = maincls;

		Laya.init(Browser.clientWidth, Browser.clientHeight).then(() => {
			Laya.stage.alignV = Stage.ALIGN_MIDDLE;
			Laya.stage.alignH = Stage.ALIGN_CENTER;

			Laya.stage.scaleMode = Stage.SCALE_SHOWALL;
			Laya.stage.bgColor = "#232628";

			this.createInput();
		});
	}

	private createInput(): void {
		var inputText: Input = new Input();

		inputText.size(350, 100);
		inputText.x = Laya.stage.width - inputText.width >> 1;
		inputText.y = Laya.stage.height - inputText.height >> 1;

		// 设置字体样式
		inputText.bold = true;
		inputText.bgColor = "#666666";
		inputText.color = "#ffffff";
		inputText.fontSize = 20;

		inputText.maxChars = 5;

		this.Main.box2D.addChild(inputText);
	}
}

