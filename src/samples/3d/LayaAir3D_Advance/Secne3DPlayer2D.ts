/**
description
 3D场景中创建相机和二维精灵，通过投影计算精灵位置并动态展示
 */
import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Vector4 } from "laya/maths/Vector4";
import { Loader } from "laya/net/Loader";
import { Image } from "laya/ui/Image";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";

export class Secne3DPlayer2D {

    private _scene: Scene3D;
    private _camera: Camera;
    private _layaMonkey2D: Image;
    private _position: Vector3 = new Vector3();
    private _outPos: Vector4 = new Vector4();
    private _translate: Vector3 = new Vector3(0, 0.35, 1);
    private _rotation: Vector3 = new Vector3(-3.14 / 3, 0, 0);

    private scaleDelta: number = 0;

    constructor() {
        //初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            //显示性能面板
            Stat.show();
            //创建场景
            this._scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            //创建相机
            this._camera = (<Camera>this._scene.addChild(new Camera(0, 0.1, 100)));
            this._camera.transform.translate(this._translate);
            this._camera.transform.rotate(this._rotation, true, false);

            let directlightSprite = new Sprite3D();
            let dircom = directlightSprite.addComponent(DirectionLightCom);
            this._scene.addChild(directlightSprite);

            //创建平行光
            dircom.color = new Color(1, 1, 1, 1);
            directlightSprite.transform.rotate(this._rotation);
            //加载精灵
            Laya.loader.load("res/threeDimen/staticModel/grid/plane.lh", Handler.create(this, this.onComplete));
        });

    }

    onComplete(): void {
        //加载三维地面
        var grid: Sprite3D = (<Sprite3D>this._scene.addChild(Loader.createNodes("res/threeDimen/staticModel/grid/plane.lh")));
        //加载二维猴子
        this._layaMonkey2D = (<Image>Laya.stage.addChild(new Image("res/threeDimen/monkey.png")));
        //开启定时器循环
        Laya.timer.frameLoop(1, this, this.animate);
    }

    private animate(): void {
        //变换位置
        this._position.x = Math.sin(this.scaleDelta += 0.01);
        //计算位置
        var outPos: Vector4 = this._outPos;
        this._camera.viewport.project(this._position, this._camera.projectionViewMatrix, outPos);
        this._layaMonkey2D.pos(outPos.x / Laya.stage.clientScaleX, outPos.y / Laya.stage.clientScaleY);
    }

}

