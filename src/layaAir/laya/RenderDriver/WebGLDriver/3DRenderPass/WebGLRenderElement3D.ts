
import { Config } from "../../../../Config";
import { ShaderPass } from "../../../RenderEngine/RenderShader/ShaderPass";
import { SubShader } from "../../../RenderEngine/RenderShader/SubShader";
import { Transform3D } from "../../../d3/core/Transform3D";
import { LayaGL } from "../../../layagl/LayaGL";
import { FastSinglelist } from "../../../utils/SingletonList";
import { IRenderElement3D } from "../../DriverDesign/3DRenderPass/I3DRenderPass";
import { WebBaseRenderNode } from "../../RenderModuleData/WebModuleData/3D/WebBaseRenderNode";
import { WebDefineDatas } from "../../RenderModuleData/WebModuleData/WebDefineDatas";
import { WebGLShaderData } from "../../RenderModuleData/WebModuleData/WebGLShaderData";
import { WebShaderPass } from "../../RenderModuleData/WebModuleData/WebShaderPass";
import { WebGLCommandUniformMap } from "../RenderDevice/WebGLCommandUniformMap";
import { WebGLEngine } from "../RenderDevice/WebGLEngine";
import { WebGLRenderGeometryElement } from "../RenderDevice/WebGLRenderGeometryElement";
import { WebGLShaderInstance } from "../RenderDevice/WebGLShaderInstance";
import { WebGLRenderContext3D } from "./WebGLRenderContext3D";

export class WebGLRenderElement3D implements IRenderElement3D {
    /** @internal */
    static _compileDefine: WebDefineDatas = new WebDefineDatas();

    protected _shaderInstances: FastSinglelist<WebGLShaderInstance>;

    geometry: WebGLRenderGeometryElement;

    subShader: SubShader;

    materialId: number;

    canDynamicBatch: boolean;

    materialShaderData: WebGLShaderData;

    materialRenderQueue: number;

    renderShaderData: WebGLShaderData;

    transform: Transform3D;

    isRender: boolean;

    owner: WebBaseRenderNode;//GLESRenderNode

    protected _invertFront: boolean;

    constructor() {
        this._shaderInstances = new FastSinglelist();
    }

    _addShaderInstance(shader: WebGLShaderInstance) {
        this._shaderInstances.add(shader);
    }

    _clearShaderInstance() {
        this._shaderInstances.length = 0;
    }

    _preUpdatePre(context: WebGLRenderContext3D) {
        this._compileShader(context);
        // material ubo
        if (this.materialShaderData && Config.matUseUBO) {
            let subShader = this.subShader;
            let materialData = this.materialShaderData;
            let matSubBuffer = materialData.createSubUniformBuffer("Material", subShader._owner.name, subShader._uniformMap);
            if (matSubBuffer && matSubBuffer.needUpload) {
                matSubBuffer.bufferBlock.needUpload();
            }
        }

        //Sprite ubo Update
        if (this.owner && Config._uniformBlock) {
            for (let [key, value] of this.owner.additionShaderData) {
                let shaderData = <WebGLShaderData>value;
                let unifomrMap = <WebGLCommandUniformMap>LayaGL.renderDeviceFactory.createGlobalUniformMap(key);
                let uniformBuffer = shaderData.createSubUniformBuffer(key, key, unifomrMap._idata);
                if (uniformBuffer && uniformBuffer.needUpload) {
                    uniformBuffer.bufferBlock.needUpload();
                }
            }
        }

        this._invertFront = this._getInvertFront();
    }

    protected _getInvertFront(): boolean {
        let transform = this.owner?.transform;
        return transform ? transform._isFrontFaceInvert : false;
    }

    /**
     * render RenderElement
     * context:GLESRenderContext3D
     * @param context 
     */
    _render(context: WebGLRenderContext3D): void {
        let forceInvertFace: boolean = context.invertY;
        let updateMark: number = context.cameraUpdateMask;
        let sceneShaderData = context.sceneData as WebGLShaderData;
        let cameraShaderData = context.cameraData as WebGLShaderData;
        if (this.isRender) {
            let passes: WebGLShaderInstance[] = this._shaderInstances.elements;
            for (let j: number = 0, m: number = this._shaderInstances.length; j < m; j++) {
                const shaderIns: WebGLShaderInstance = passes[j];
                if (!shaderIns.complete)
                    continue;
                let switchShader: boolean = shaderIns.bind();
                let switchUpdateMark: boolean = (updateMark !== shaderIns._uploadMark);
                let uploadScene: boolean = (shaderIns._uploadScene !== sceneShaderData) || switchUpdateMark;
                //Scene
                if (uploadScene || switchShader) {
                    if (sceneShaderData) {
                        shaderIns.uploadUniforms(shaderIns._sceneUniformParamsMap, sceneShaderData, uploadScene);
                    }

                    shaderIns._uploadScene = sceneShaderData;
                }
                //render
                if (this.renderShaderData) {
                    let uploadSprite3D: boolean = (shaderIns._uploadRender !== this.renderShaderData) || switchUpdateMark;
                    if (uploadSprite3D || switchShader) {
                        shaderIns.uploadUniforms(shaderIns._spriteUniformParamsMap, this.renderShaderData, uploadSprite3D);
                        shaderIns._uploadRender = this.renderShaderData;
                    }
                }

                //additionShaderData
                if (this.owner) {
                    let additionShaderData = this.owner.additionShaderData;

                    for (let [key, encoder] of shaderIns._additionUniformParamsMaps) {
                        let additionData = additionShaderData.get(key);
                        if (additionData) {
                            let needUpload = shaderIns._additionShaderData.get(key) !== additionData || switchUpdateMark;

                            if (needUpload || switchShader) {
                                shaderIns.uploadUniforms(encoder, <WebGLShaderData>additionData, needUpload);
                                shaderIns._additionShaderData.set(key, additionData);
                            }
                        }
                    }
                }

                //camera
                let uploadCamera: boolean = shaderIns._uploadCameraShaderValue !== cameraShaderData || switchUpdateMark;
                if (uploadCamera || switchShader) {
                    cameraShaderData && shaderIns.uploadUniforms(shaderIns._cameraUniformParamsMap, cameraShaderData, uploadCamera);
                    shaderIns._uploadCameraShaderValue = cameraShaderData;
                }
                //material
                let uploadMaterial: boolean = (shaderIns._uploadMaterial !== this.materialShaderData) || switchUpdateMark;
                if (uploadMaterial || switchShader) {
                    shaderIns.uploadUniforms(shaderIns._materialUniformParamsMap, this.materialShaderData, uploadMaterial);
                    shaderIns._uploadMaterial = this.materialShaderData;
                }
                //renderData update
                //TODO：Renderstate as a Object to less upload
                shaderIns.uploadRenderStateBlendDepth(this.materialShaderData);
                shaderIns.uploadRenderStateFrontFace(this.materialShaderData, forceInvertFace, this._invertFront);
                this.drawGeometry(shaderIns);
            }
        }
    }

    protected _getShaderInstanceDefines(context: WebGLRenderContext3D) {
        let comDef = WebGLRenderElement3D._compileDefine;

        const globalShaderDefines = context._getContextShaderDefines();

        globalShaderDefines.cloneTo(comDef);

        if (this.renderShaderData) {
            comDef.addDefineDatas(this.renderShaderData.getDefineData());
        }

        if (this.materialShaderData) {
            comDef.addDefineDatas(this.materialShaderData._defineDatas);
        }

        if (this.owner) {
            let additionShaderData = this.owner.additionShaderData;
            if (additionShaderData.size > 0) {
                for (let [key, value] of additionShaderData.entries()) {
                    comDef.addDefineDatas(value.getDefineData());
                }
            }
        }


        return comDef;
    }

    protected _compileShader(context: WebGLRenderContext3D) {
        this._clearShaderInstance();

        let comDef = this._getShaderInstanceDefines(context);

        var passes: ShaderPass[] = this.subShader._passes;
        for (var j: number = 0, m: number = passes.length; j < m; j++) {
            let pass = passes[j];
            let passdata = <WebShaderPass>pass.moduleData;
            if (passdata.pipelineMode !== context.pipelineMode)
                continue;

            if (this.renderShaderData) {
                passdata.nodeCommonMap = this.owner._commonUniformMap;
            } else {
                passdata.nodeCommonMap = null;
            }

            passdata.additionShaderData = null;
            if (this.owner) {
                passdata.additionShaderData = this.owner._additionShaderDataKeys;
            }
            var shaderIns = pass.withCompile(comDef) as WebGLShaderInstance;

            this._addShaderInstance(shaderIns);
        }
    }

    drawGeometry(shaderIns: WebGLShaderInstance) {
        WebGLEngine.instance.getDrawContext().drawGeometryElement(this.geometry);
    }

    destroy() {
        this.geometry = null;
        this._shaderInstances = null;
        this.materialShaderData = null;
        this.renderShaderData = null;
        this.transform = null;
        this.isRender = null;
    }
}