/**
description
 创建3D场景，加载地球纹理，应用特效材质并实现地球旋转动画
 */
import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { EffectMaterial } from "laya/d3/core/material/EffectMaterial";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { Mesh } from "laya/d3/resource/models/Mesh";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Stage } from "laya/display/Stage";
import { Color } from "laya/maths/Color";
import { Vector3 } from "laya/maths/Vector3";
import { Texture2D } from "laya/resource/Texture2D";
import { Handler } from "laya/utils/Handler";
import { Stat } from "laya/utils/Stat";


/**
 * ...
 * @author ...
 */
export class EffectMaterialDemo {
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

            let directionLight = new Sprite3D();
            let dircom = directionLight.addComponent(DirectionLightCom);
            scene.addChild(directionLight);
            dircom.color.setValue(1, 1, 1, 1);

            let mesh: Mesh = PrimitiveMesh.createSphere();
            var earth: Sprite3D = new Sprite3D();
            let earthMeshrender: MeshRenderer = earth.addComponent(MeshRenderer);
            let earthFilter: MeshFilter = earth.addComponent(MeshFilter);
            earthFilter.sharedMesh = mesh;
            scene.addChild(earth);
            earth.transform.position = new Vector3(0, 0, 0);
            //创建EffectMaterial材质
            var material: EffectMaterial = new EffectMaterial();
            Texture2D.load("res/threeDimen/texture/earth.png", Handler.create(this, (texture: Texture2D) => {
                //设置纹理
                material.texture = texture;
                //设置材质颜色
                material.color = new Color(0.6, 0.6, 0.6, 1);
            }));
            earthMeshrender.material = material;

            Laya.timer.frameLoop(1, this, () => {
                earth.transform.rotate(this.rotation, false);
            });
        });
    }

}


