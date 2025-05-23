/**
description
 展示Laya3D引擎中不同材质的球体渲染，包括BlinnPhong和Unlit材质
 */
import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { UnlitMaterial } from "laya/d3/core/material/UnlitMaterial";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Vector3 } from "laya/maths/Vector3";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";
import { Color } from "laya/maths/Color";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { MeshFilter } from "laya/d3/core/MeshFilter";
/**
 * ...
 * @author ...
 */
export class UnlitMaterialDemo {
    private rotation: Vector3 = new Vector3(0, 0.01, 0);

    constructor() {
        Laya.init(0, 0).then(() => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            Stat.show();
            var scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            var camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 100))));
            camera.transform.translate(new Vector3(0, 0.5, 1.5));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.clearFlag = CameraClearFlags.Sky;

            var directionLight: Sprite3D = (<Sprite3D>scene.addChild(new Sprite3D()));
            var directionLightCom: DirectionLightCom = (<DirectionLightCom>directionLight.addComponent(DirectionLightCom));
            directionLightCom.color.setValue(1, 1, 1, 1);

            //创建一个公用的sphereMesh
            var sphereMesh: Mesh = PrimitiveMesh.createSphere();
            var earth1: Sprite3D = new Sprite3D();
            let earth1Meshrender: MeshRenderer = earth1.addComponent(MeshRenderer);
            let earth1Meshfilter: MeshFilter = earth1.addComponent(MeshFilter);
            earth1Meshfilter.sharedMesh = sphereMesh;
            scene.addChild(earth1);
            earth1.transform.position = new Vector3(-0.6, 0, 0);

            var earth2: Sprite3D = new Sprite3D();
            let earth2Meshrender: MeshRenderer = earth2.addComponent(MeshRenderer);
            let earth2Meshfilter: MeshFilter = earth2.addComponent(MeshFilter);
            earth2Meshfilter.sharedMesh = sphereMesh;
            scene.addChild(earth2);
            earth2.transform.position = new Vector3(0.6, 0, 0);

            //创建BlinnPhongMaterial材质
            var material: BlinnPhongMaterial = new BlinnPhongMaterial();
            Texture2D.load("res/threeDimen/texture/earth.png", Handler.create(this, function (texture: Texture2D): void {
                //设置反照率贴图
                material.albedoTexture = texture;
                //设置反照率强度
                material.albedoIntensity = 1;
            }));
            earth1Meshrender.material = material;

            //创建Unlit材质
            var material2: UnlitMaterial = new UnlitMaterial();
            Texture2D.load("res/threeDimen/texture/earth.png", Handler.create(this, function (texture: Texture2D): void {
                //设置反照率贴图
                material2.albedoTexture = texture;
                //设置反照率强度
                material2.albedoIntensity = 1;
                //设置材质颜色
                material2.albedoColor = new Color(1, 1, 1, 1);
            }));
            earth2Meshrender.material = material2;

            Laya.timer.frameLoop(1, this, () => {
                earth1.transform.rotate(this.rotation, false);
                earth2.transform.rotate(this.rotation, false);
            });
        });

    }
}


