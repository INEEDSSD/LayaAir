/**
description
 创建一个可多行输入的文本框，设置提示文字和样式，居中显示
 */
import { Laya } from "Laya";
import { Input } from "laya/display/Input";
import { Stage } from "laya/display/Stage";
import { Browser } from "laya/utils/Browser";
import { Main } from "./../Main";

export class Text_InputMultiline {

	Main: typeof Main = null;
	constructor(maincls: typeof Main) {
		this.Main = maincls;
		Laya.init(Browser.clientWidth, Browser.clientHeight).then(() => {
			Laya.stage.alignV = Stage.ALIGN_MIDDLE;
			Laya.stage.alignH = Stage.ALIGN_CENTER;

			Laya.stage.scaleMode = "showall";
			Laya.stage.bgColor = "#232628";

			this.createInput();
		});

	}

	private createInput(): void {
		var inputText: Input = new Input();

		// 移动端输入提示符
		inputText.prompt = "Type some word...";

		//多行输入
		inputText.multiline = true;
		inputText.wordWrap = true;

		inputText.size(350, 100);
		inputText.x = Laya.stage.width - inputText.width >> 1;
		inputText.y = Laya.stage.height - inputText.height >> 1;
		inputText.padding = [2, 2, 2, 2];

		inputText.bgColor = "#666666";
		inputText.color = "#ffffff";
		inputText.fontSize = 20;

		this.Main.box2D.addChild(inputText);
	}
}


