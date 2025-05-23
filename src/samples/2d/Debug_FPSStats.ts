/**
description
 初始化Laya引擎并在屏幕中心显示性能统计信息
 */
import { Laya } from "Laya";
import { Browser } from "laya/utils/Browser";
import { Stat } from "laya/utils/Stat";

export class Debug_FPSStats {

	constructor() {
		Laya.init(Browser.clientWidth, Browser.clientHeight).then(() => {
			Stat.show(Browser.clientWidth - 120 >> 1, Browser.clientHeight - 100 >> 1);
		});
	}
}

