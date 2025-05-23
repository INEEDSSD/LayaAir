/**
description
 使用WebGPU渲染引擎创建3D场景,加载纹理并创建多个几何体
 */
import { Laya } from "Laya";
import { Camera, CameraClearFlags } from "laya/d3/core/Camera";
import { Scene3D } from "laya/d3/core/scene/Scene3D";
import { Stage } from "laya/display/Stage";
import { Handler } from "laya/utils/Handler";
import { CameraMoveScript } from "../common/CameraMoveScript";
import { Laya3DRender } from "laya/d3/RenderObjs/Laya3DRender";
import { WebUnitRenderModuleDataFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/WebUnitRenderModuleDataFactory"
import { Web3DRenderModuleFactory } from "laya/RenderDriver/RenderModuleData/WebModuleData/3D/Web3DRenderModuleFactory"
import { WebGL3DRenderPassFactory } from "laya/RenderDriver/WebGLDriver/3DRenderPass/WebGL3DRenderPassFactory"
import { WebGLRenderDeviceFactory } from "laya/RenderDriver/WebGLDriver/RenderDevice/WebGLRenderDeviceFactory"
import { LengencyRenderEngine3DFactory } from "laya/RenderDriver/DriverDesign/3DRenderPass/LengencyRenderEngine3DFactory"
import { LayaGL } from "laya/layagl/LayaGL";
import { WebGPURenderDeviceFactory } from "laya/RenderDriver/WebGPUDriver/RenderDevice/WebGPURenderDeviceFactory";
import { WebGPU3DRenderPassFactory } from "laya/RenderDriver/WebGPUDriver/3DRenderPass/WebGPU3DRenderPassFactory";
import { Sprite3D } from "laya/d3/core/Sprite3D";
import { DirectionLightCom } from "laya/d3/core/light/DirectionLightCom";
import { BlinnPhongMaterial } from "laya/d3/core/material/BlinnPhongMaterial";
import { PrimitiveMesh } from "laya/d3/resource/models/PrimitiveMesh";
import { Vector3 } from "laya/maths/Vector3";
import { MeshFilter } from "laya/d3/core/MeshFilter";
import { MeshRenderer } from "laya/d3/core/MeshRenderer";
import { Color } from "laya/maths/Color";
import { Config3D } from "Config3D";
import { Loader } from "laya/net/Loader";
import { WebGLRender2DProcess } from "laya/RenderDriver/WebGLDriver/2DRenderPass/WebGLRender2DProcess";
import { WebGPURender2DProcess } from "laya/RenderDriver/WebGPUDriver/2DRenderPass/WebGPURender2DProcess";
import { PBRStandardMaterial } from "laya/d3/core/material/PBRStandardMaterial";
import { PostProcess } from "laya/d3/core/render/postProcessBase/PostProcess";
import { BloomEffect } from "laya/d3/postProcessEffect/BloomEffect";

export class WebGPUTest {
    useWebGPU: boolean = true;

    constructor() {
        LayaGL.unitRenderModuleDataFactory = new WebUnitRenderModuleDataFactory();
        Laya3DRender.renderOBJCreate = new LengencyRenderEngine3DFactory();
        Laya3DRender.Render3DModuleDataFactory = new Web3DRenderModuleFactory();

        if (this.useWebGPU) {
            LayaGL.renderDeviceFactory = new WebGPURenderDeviceFactory();
            LayaGL.render2DRenderPassFactory = new WebGPURender2DProcess();
            Laya3DRender.Render3DPassFactory = new WebGPU3DRenderPassFactory();
        } else {
            LayaGL.renderDeviceFactory = new WebGLRenderDeviceFactory();
            LayaGL.render2DRenderPassFactory = new WebGLRender2DProcess();
            Laya3DRender.Render3DPassFactory = new WebGL3DRenderPassFactory();
        }

        Laya.init(0, 0).then(async () => {
            Laya.stage.scaleMode = Stage.SCALE_FULL;
            Laya.stage.screenMode = Stage.SCREEN_NONE;
            Config3D.enableDynamicBatch = false;
            //Stat.show();

            const scene: Scene3D = (<Scene3D>Laya.stage.addChild(new Scene3D()));

            const camera: Camera = (<Camera>(scene.addChild(new Camera(0, 0.1, 300))));
            camera.transform.translate(new Vector3(0, 0.5, 5));
            camera.transform.rotate(new Vector3(-15, 0, 0), true, false);
            camera.clearColor = Color.BLACK;
            camera.clearFlag = CameraClearFlags.SolidColor;
            camera.addComponent(CameraMoveScript);

            const directLight = new Sprite3D();
            const dirCom = directLight.addComponent(DirectionLightCom);
            scene.addChild(directLight);
            dirCom.color.setValue(0.8, 0.8, 0.8, 1);

            //打开后处理
            if (true) {
                const postProcess = new PostProcess();
                const bloom = new BloomEffect();
                postProcess.addEffect(bloom);
                camera.postProcess = postProcess;
                camera.enableHDR = true;

                //设置泛光参数
                bloom.intensity = 5;
                bloom.threshold = 0.9;
                bloom.softKnee = 0.5;
                bloom.clamp = 65472;
                bloom.diffusion = 5;
                bloom.anamorphicRatio = 0.0;
                bloom.color = new Color(1, 1, 1, 1);
                bloom.fastMode = true;
            }

            const boxMesh1 = PrimitiveMesh.createBox(0.2, 0.2, 0.2);
            const coneMesh1 = PrimitiveMesh.createCone(0.1, 0.3, 64);
            const sphereMesh1 = PrimitiveMesh.createSphere(0.25, 64, 64);

            const material1 = new BlinnPhongMaterial();
            const material2 = new BlinnPhongMaterial();
            const material3 = new PBRStandardMaterial();

            const boxS3D = [];
            const sphereS3D = [];
            const coneS3D_static = [];

            const res = [
                { url: "res/threeDimen/texture/earth.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/brick.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/grass.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/normal.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/earthMap.jpg", type: Loader.TEXTURE2D },
                { url: "res/threeDimen/texture/九宫格512.jpg", type: Loader.TEXTURE2D },
            ];
            Laya.loader.load(res, Handler.create(this, () => {
                material1.albedoTexture = Laya.loader.getRes("res/threeDimen/texture/九宫格512.jpg", Loader.TEXTURE2D);
                material2.albedoTexture = Laya.loader.getRes("res/threeDimen/texture/earthMap.jpg", Loader.TEXTURE2D);
                material3.albedoTexture = Laya.loader.getRes("res/threeDimen/texture/grass.jpg", Loader.TEXTURE2D);
                material3.normalTexture = Laya.loader.getRes("res/threeDimen/texture/normal.jpg", Loader.TEXTURE2D);
                material3.metallicGlossTexture = Laya.loader.getRes("res/threeDimen/texture/normal.jpg", Loader.TEXTURE2D);
            }));

            const n = 10;
            const m = 10;
            const l = 10;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        const bs3d = scene.addChild(new Sprite3D());
                        boxS3D.push(bs3d);
                        bs3d.transform.position = new Vector3(i - n * 0.5, j - m * 0.5, k - l * 0.5);
                        bs3d.addComponent(MeshFilter).sharedMesh = boxMesh1;
                        bs3d.addComponent(MeshRenderer).material = material1;
                        //@ts-ignore
                        bs3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
                    }
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        const sp3d = scene.addChild(new Sprite3D());
                        sphereS3D.push(sp3d);
                        sp3d.transform.position = new Vector3(i - n * 0.5 - 0.5, j - m * 0.5, k - l * 0.5);
                        sp3d.addComponent(MeshFilter).sharedMesh = sphereMesh1;
                        sp3d.addComponent(MeshRenderer).material = material2;
                        //@ts-ignore
                        sp3d.rotate = new Vector3((Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02, (Math.random() - 0.5) * 0.02);
                    }
                }
            }
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < m; j++) {
                    for (let k = 0; k < l; k++) {
                        const co3d = scene.addChild(new Sprite3D('cone' + i + j + k, true));
                        coneS3D_static.push(co3d);
                        co3d.transform.position = new Vector3(i - n * 0.5, j - m * 0.5 - 0.5, k - l * 0.5);
                        co3d.addComponent(MeshFilter).sharedMesh = coneMesh1;
                        co3d.addComponent(MeshRenderer).material = material3;
                    }
                }
            }

            Laya.timer.frameLoop(1, this, () => {
                for (let i = boxS3D.length - 1; i > -1; i--)
                    boxS3D[i].transform.rotate(boxS3D[i].rotate, false);
                for (let i = sphereS3D.length - 1; i > -1; i--)
                    sphereS3D[i].transform.rotate(sphereS3D[i].rotate, false);
            });

            // const earth1 = scene.addChild(new Sprite3D());
            // earth1.transform.position = new Vector3(0, 0, 0);
            // const meshFilter1 = earth1.addComponent(MeshFilter);
            // const meshRenderer1 = earth1.addComponent(MeshRenderer);
            // meshFilter1.sharedMesh = boxMesh1;
            // meshRenderer1.castShadow = false;
            // meshRenderer1.receiveShadow = false;

            // const earth2 = scene.addChild(new Sprite3D());
            // earth2.transform.position = new Vector3(0.5, 0, 0);
            // const meshFilter2 = earth2.addComponent(MeshFilter);
            // const meshRenderer2 = earth2.addComponent(MeshRenderer);
            // meshFilter2.sharedMesh = sphereMesh1;
            // meshRenderer2.castShadow = false;
            // meshRenderer2.receiveShadow = false;

            // if (this.useWebGPU) {
            //     Laya.timer.loop(3000, this, () => { WebGPUStatis.printFrameStatis(); });
            //     Laya.timer.once(5000, this, () => {
            //         WebGPUStatis.printStatisticsAsTable();
            //         WebGPUStatis.printTotalStatis();
            //         WebGPUStatis.printTextureStatis();
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('scene3D'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('camera'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('material'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('sprite3D'));
            //         console.log(WebGPURenderEngine._instance.gpuBufferMgr.namedBuffers.get('sprite3D_static'));
            //     });
            // }
        });
    }
}