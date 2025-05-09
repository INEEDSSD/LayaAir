/**
description
 3D场景相机图层管理示例，展示多个猴子模型在不同图层的渲染
 */
import { Laya } from "Laya";
import { Camera } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Stage } from "laya/display/Stage";
import { Event } from "laya/events/Event";
import { Quaternion } from "laya/maths/Quaternion";
import { Vector3 } from "laya/maths/Vector3";
import { Loader } from "laya/net/Loader";
import { Button } from "laya/ui/Button";
import { Browser } from "laya/utils/Browser";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import Client from "../../Client";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { Mesh } from "laya/d3/resource/models/Mesh";
/**
 * 精灵图层示例
 * @author ...
 */
export class CameraLayer {
    private _scene: Scene3D;
    private layerIndex: number;
    private camera: Camera;
    private _translate: Vector3 = new Vector3(0, 0.7, 3);
    private _rotation: Vector3 = new Vector3(-15, 0, 0);
    private _rotation2: Vector3 = new Vector3(-3.14 / 3, 0, 0);
    private _rotation3: Quaternion = new Quaternion(0.7071068, 0, 0, -0.7071067);
    private _rotation4: Vector3 = new Vector3(0, 60, 0);
    private _position: Vector3 = new Vector3(0.0, 0, 0.5);

    /**实例类型*/
    private btype: any = "CameraLayer";
    /**场景内按钮类型*/
    private stype: any = 0;
    constructor() {
        //初始化引擎
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            //显示性能面板
            Stat.show();
            //创建场景
            this._scene = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            //添加相机
            this.camera = (<Camera>(this._scene.addChild(new Camera(0, 0.1, 100))));
            this.camera.transform.translate(this._translate);
            this.camera.transform.rotate(this._rotation, true, false);
            //相机添加视角控制组件(脚本)
            this.camera.addComponent(CameraMoveScript);

            //移除所有图层
            this.camera.removeAllLayers();
            //添加显示图层(为相机添加一个蒙版)
            this.camera.addLayer(5);

            //添加平行光
            var directionLight: Sprite3D = (<Sprite3D>this._scene.addChild(new Sprite3D()));
            var directionLightCom: DirectionLightCom = directionLight.addComponent(DirectionLightCom);
            directionLightCom.color.setValue(1, 1, 1, 1);
            directionLight.transform.rotate(this._rotation2);

            Laya.loader.load(["res/threeDimen/staticModel/grid/plane.lh",
                "res/threeDimen/skinModel/LayaMonkey/LayaMonkey.lh"], Handler.create(this, this.onComplete));
        });
    }
    private onComplete(): void {
        //添加地面
        var grid: Sprite3D = (<Sprite3D>this._scene.addChild(Loader.createNodes("res/threeDimen/staticModel/grid/plane.lh")));
        //地面接收阴影
        ((<Sprite3D>grid.getChildAt(0))).getComponent(MeshRenderer).receiveShadow = true;
        //设置该精灵的蒙版为5(所属图层)
        ((<Sprite3D>grid.getChildAt(0))).layer = 5;

        //添加静态猴子
        let monkeyMesh: Mesh = Loader.getRes("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/LayaMonkey-LayaMonkey.lm");
        var staticLayaMonkey: Sprite3D = new Sprite3D();
        let monkeyFilter = staticLayaMonkey.addComponent(MeshFilter);
        let monkeyMeshRender = staticLayaMonkey.addComponent(MeshRenderer);
        monkeyFilter.sharedMesh = monkeyMesh;
        this._scene.addChild(staticLayaMonkey);
        //设置静态猴子的材质
        staticLayaMonkey.getComponent(MeshRenderer).material = Loader.getRes("res/threeDimen/skinModel/LayaMonkey/Assets/LayaMonkey/Materials/T_Diffuse.lmat");
        //设置静态猴子的蒙版为1(所属图层)
        staticLayaMonkey.layer = 1;
        staticLayaMonkey.transform.position = new Vector3(0, 0, 0.5);
        staticLayaMonkey.transform.localScale = new Vector3(0.3, 0.3, 0.3);
        staticLayaMonkey.transform.rotation = this._rotation3;
        //产生阴影
        staticLayaMonkey.getComponent(MeshRenderer).castShadow = true;

        //克隆sprite3d
        var layaMonkey_clone1: Sprite3D = Sprite3D.instantiate(staticLayaMonkey, this._scene, false, this._position);
        var layaMonkey_clone2: Sprite3D = Sprite3D.instantiate(staticLayaMonkey, this._scene, false, this._position);
        var layaMonkey_clone3: Sprite3D = Sprite3D.instantiate(staticLayaMonkey, this._scene, false, this._position);

        //设置蒙版(所属图层)
        layaMonkey_clone1.layer = 2;
        layaMonkey_clone2.layer = 3;
        layaMonkey_clone3.layer = 0;
        //平移
        this._translate.setValue(1.5, 0, 0.0);
        layaMonkey_clone1.transform.translate(this._translate);
        this._translate.setValue(-1.5, 0, 0.0);
        layaMonkey_clone2.transform.translate(this._translate);
        this._translate.setValue(2.5, 0, 0.0);
        layaMonkey_clone3.transform.translate(this._translate);
        //旋转
        layaMonkey_clone2.transform.rotate(this._rotation4, false, false);
        //缩放
        layaMonkey_clone3.transform.localScale = new Vector3(0.1, 0.1, 0.1);

        //生成UI
        this.loadUI();
    }

    private loadUI(): void {
        this.layerIndex = 0;
        Laya.loader.load(["res/threeDimen/ui/button.png"], Handler.create(this, function (): void {
            this.changeActionButton = (<Button>Laya.stage.addChild(new Button("res/threeDimen/ui/button.png", "切换图层")));
            this.changeActionButton.size(160, 40);
            this.changeActionButton.labelBold = true;
            this.changeActionButton.labelSize = 30;
            this.changeActionButton.sizeGrid = "4,4,4,4";
            this.changeActionButton.scale(Browser.pixelRatio, Browser.pixelRatio);
            this.changeActionButton.pos(Laya.stage.width / 2 - this.changeActionButton.width * Browser.pixelRatio / 2, Laya.stage.height - 100 * Browser.pixelRatio);
            this.changeActionButton.on(Event.CLICK, this, this.stypeFun0);

        }));
    }

    stypeFun0(layerIndex: number = 0): void {
        this.camera.removeAllLayers();
        this.layerIndex++;
        this.camera.addLayer(this.layerIndex % 4);
        this.camera.addLayer(5);
        layerIndex = this.layerIndex;
        Client.instance.send({ type: "next", btype: this.btype, stype: 0, value: layerIndex });
    }

}


