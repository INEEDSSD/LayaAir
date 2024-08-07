import { BufferTargetType, BufferUsage } from "../../../RenderEngine/RenderEnum/BufferTargetType";
import { DrawType } from "../../../RenderEngine/RenderEnum/DrawType";
import { VertexMesh } from "../../../RenderEngine/RenderShader/VertexMesh";
import { MeshSprite3DShaderDeclaration } from "../../../d3/core/MeshSprite3DShaderDeclaration";
import { RenderableSprite3D } from "../../../d3/core/RenderableSprite3D";
import { SimpleSkinnedMeshSprite3D } from "../../../d3/core/SimpleSkinnedMeshSprite3D";
import { SingletonList } from "../../../utils/SingletonList";
import { IInstanceRenderElement3D, IRenderElement3D } from "../../DriverDesign/3DRenderPass/I3DRenderPass";
import { BaseRenderType } from "../../RenderModuleData/Design/3D/I3DRenderModuleData";
import { WebDefineDatas } from "../../RenderModuleData/WebModuleData/WebDefineDatas";
import { WebGPUBufferState } from "../RenderDevice/WebGPUBufferState";
import { WebGPURenderBundle } from "../RenderDevice/WebGPUBundle/WebGPURenderBundle";
import { WebGPUInternalRT } from "../RenderDevice/WebGPUInternalRT";
import { WebGPURenderCommandEncoder } from "../RenderDevice/WebGPURenderCommandEncoder";
import { WebGPURenderGeometry } from "../RenderDevice/WebGPURenderGeometry";
import { WebGPUShaderInstance } from "../RenderDevice/WebGPUShaderInstance";
import { WebGPUVertexBuffer } from "../RenderDevice/WebGPUVertexBuffer";
import { WebGPURenderContext3D } from "./WebGPURenderContext3D";
import { WebGPURenderElement3D } from "./WebGPURenderElement3D";

export interface WebGPUInstanceStateInfo {
    state: WebGPUBufferState;
    worldInstanceVB?: WebGPUVertexBuffer;
    simpleAnimatorVB?: WebGPUVertexBuffer;
    lightmapScaleOffsetVB?: WebGPUVertexBuffer;
}

export class WebGPUInstanceRenderElement3D extends WebGPURenderElement3D implements IInstanceRenderElement3D {
    static getInstanceBufferState(stateinfo: WebGPUInstanceStateInfo, geometry: WebGPURenderGeometry, renderType: number, spriteDefine: WebDefineDatas) {
        const _initStateInfo = (stateinfo: WebGPUInstanceStateInfo) => {
            const oriBufferState = geometry.bufferState;
            const vertexArray = oriBufferState._vertexBuffers.slice();
            let worldMatVertex = stateinfo.worldInstanceVB;
            const size = this.MaxInstanceCount * 16 * 4;
            if (!worldMatVertex || worldMatVertex.source._size < size) {
                if (worldMatVertex) {
                    worldMatVertex.destroy();
                    worldMatVertex.source._source.destroy();
                }
                stateinfo.worldInstanceVB = worldMatVertex = new WebGPUVertexBuffer(BufferTargetType.ARRAY_BUFFER, BufferUsage.Dynamic);
                worldMatVertex.setDataLength(this.MaxInstanceCount * 16 * 4);
                worldMatVertex.vertexDeclaration = VertexMesh.instanceWorldMatrixDeclaration;
                worldMatVertex.instanceBuffer = true;
            }
            vertexArray.push(worldMatVertex);
            switch (renderType) {
                case BaseRenderType.MeshRender:
                    if (spriteDefine.has(MeshSprite3DShaderDeclaration.SHADERDEFINE_UV1)) {
                        let instanceLightMapVertexBuffer = stateinfo.lightmapScaleOffsetVB;
                        const size = this.MaxInstanceCount * 4 * 4;
                        if (!instanceLightMapVertexBuffer || instanceLightMapVertexBuffer.source._size < size) {
                            if (instanceLightMapVertexBuffer) {
                                instanceLightMapVertexBuffer.destroy();
                                instanceLightMapVertexBuffer.source._source.destroy();
                            }
                            stateinfo.lightmapScaleOffsetVB = instanceLightMapVertexBuffer = new WebGPUVertexBuffer(BufferTargetType.ARRAY_BUFFER, BufferUsage.Dynamic);
                            instanceLightMapVertexBuffer.setDataLength(this.MaxInstanceCount * 4 * 4);
                            instanceLightMapVertexBuffer.vertexDeclaration = VertexMesh.instanceLightMapScaleOffsetDeclaration;
                            instanceLightMapVertexBuffer.instanceBuffer = true;
                        }
                        vertexArray.push(instanceLightMapVertexBuffer);
                    }
                    break;
                case BaseRenderType.SimpleSkinRender:
                    let instanceSimpleAnimatorBuffer = stateinfo.simpleAnimatorVB;
                    const size = this.MaxInstanceCount * 4 * 4;
                    if (!instanceSimpleAnimatorBuffer || instanceSimpleAnimatorBuffer.source._size < size) {
                        if (instanceSimpleAnimatorBuffer) {
                            instanceSimpleAnimatorBuffer.destroy();
                            instanceSimpleAnimatorBuffer.source._source.destroy();
                        }
                        stateinfo.simpleAnimatorVB = instanceSimpleAnimatorBuffer = new WebGPUVertexBuffer(BufferTargetType.ARRAY_BUFFER, BufferUsage.Dynamic);
                        instanceSimpleAnimatorBuffer.setDataLength(this.MaxInstanceCount * 4 * 4);
                        instanceSimpleAnimatorBuffer.vertexDeclaration = VertexMesh.instanceSimpleAnimatorDeclaration;
                        instanceSimpleAnimatorBuffer.instanceBuffer = true;
                    }
                    vertexArray.push(instanceSimpleAnimatorBuffer);
                    break;
            }
            stateinfo.state.applyState(vertexArray, geometry.bufferState._bindedIndexBuffer);
        };

        if (!stateinfo)
            stateinfo = { state: new WebGPUBufferState() };
        _initStateInfo(stateinfo);
        return stateinfo;
    }

    static MaxInstanceCount: number = 1024;

    private static _pool: WebGPUInstanceRenderElement3D[] = [];
    static create(): WebGPUInstanceRenderElement3D {
        return this._pool.pop() ?? new WebGPUInstanceRenderElement3D();
    }

    private static _bufferPool: Map<number, Float32Array[]> = new Map();
    static _instanceBufferCreate(length: number): Float32Array {
        let array = this._bufferPool.get(length);
        if (!array) {
            this._bufferPool.set(length, []);
            array = this._bufferPool.get(length);
        }
        return array.pop() ?? new Float32Array(length);
    }

    instanceElementList: SingletonList<IRenderElement3D>;

    private _vertexBuffers: Array<WebGPUVertexBuffer> = [];
    private _updateData: Array<Float32Array> = [];
    private _updateDataNum: Array<number> = [];
    private _instanceStateInfo: WebGPUInstanceStateInfo;
    drawCount: number;
    updateNums: number;

    constructor() {
        super();
        this.objectName = 'WebGPUInstanceRenderElement3D';
        this.instanceElementList = new SingletonList();
        this.drawCount = 0;
        this.updateNums = 0;
        this.isRender = true;
    }

    addUpdateBuffer(vb: WebGPUVertexBuffer, length: number) {
        this._vertexBuffers[this.updateNums] = vb;
        this._updateDataNum[this.updateNums] = length;
        this.updateNums++;
    }

    getUpdateData(index: number, length: number): Float32Array {
        this._updateData[index] = WebGPUInstanceRenderElement3D._instanceBufferCreate(length);
        return this._updateData[index];
    }

    /**
     * 计算状态值
     * @param shaderInstance 
     * @param dest 
     * @param context 
     */
    protected _calcStateKey(shaderInstance: WebGPUShaderInstance, dest: WebGPUInternalRT, context: WebGPURenderContext3D) {
        let stateKey = '';
        stateKey += dest.formatId + '_';
        stateKey += shaderInstance._id + '_';
        stateKey += this.materialShaderData.stateKey;
        return stateKey;
    }

    /**
     * 着色器数据是否改变
     * @param context
     */
    protected _isShaderDataChange(context: WebGPURenderContext3D) {
        return true;
    }

    protected _compileShader(context: WebGPURenderContext3D) {
        //将场景或全局配置定义准备好
        const compileDefine = WebGPURenderElement3D._compileDefine;
        if (this._sceneData)
            this._sceneData._defineDatas.cloneTo(compileDefine);
        else if (context.globalConfigShaderData)
            context.globalConfigShaderData.cloneTo(compileDefine);

        //添加相机数据定义
        if (this._cameraData)
            compileDefine.addDefineDatas(this._cameraData._defineDatas);

        //编译着色器，创建uniform缓冲区
        if (this.renderShaderData)
            compileDefine.addDefineDatas(this.renderShaderData.getDefineData());
        if (this.materialShaderData)
            compileDefine.addDefineDatas(this.materialShaderData._defineDatas);

        compileDefine.add(MeshSprite3DShaderDeclaration.SHADERDEFINE_GPU_INSTANCE);
        this._updateInstanceData();

        //查找着色器对象缓存
        for (let i = 0; i < this._passNum; i++) {
            if (!this._shaderPass[i].moduleData.getCacheShader(compileDefine.clone())) {
                const { uniformMap, arrayMap } = this._collectUniform(compileDefine); //@ts-ignore
                this._shaderPass[i].uniformMap = uniformMap; //@ts-ignore
                this._shaderPass[i].arrayMap = arrayMap;
            }

            //获取着色器实例，先查找缓存，如果没有则创建
            const shaderInstance = this._shaderPass[i].withCompile(compileDefine.clone()) as WebGPUShaderInstance;
            this._shaderInstance[i] = this._shaderInstances[this._passIndex[i]] = shaderInstance;

            //创建uniform缓冲区
            if (i === 0) {
                this._sceneData?.createUniformBuffer(shaderInstance.uniformInfo[0], true);
                this._cameraData?.createUniformBuffer(shaderInstance.uniformInfo[1], true);
                this.renderShaderData?.createUniformBuffer(shaderInstance.uniformInfo[2]);
                this.materialShaderData?.createUniformBuffer(shaderInstance.uniformInfo[3]);
            }
        }

        //重编译着色器后，清理绑定组缓存
        this.renderShaderData?.clearBindGroup();
        this.materialShaderData?.clearBindGroup();
    }

    private _updateInstanceData() {
        if (this.updateNums != 0)
            this.clearRenderData(); //?
        switch (this.owner.renderNodeType) {
            case BaseRenderType.MeshRender:
                {
                    const worldMatrixData = this.getUpdateData(0, 16 * WebGPUInstanceRenderElement3D.MaxInstanceCount);
                    this.addUpdateBuffer(this._instanceStateInfo.worldInstanceVB, 16);
                    const insBatches = this.instanceElementList;
                    const elements = insBatches.elements;
                    const count = insBatches.length;
                    this.drawCount = count;
                    this.geometry.instanceCount = this.drawCount;
                    for (let i = 0; i < count; i++)
                        worldMatrixData.set(elements[i].transform.worldMatrix.elements, i * 16);

                    const haveLightMap = this.renderShaderData.hasDefine(RenderableSprite3D.SAHDERDEFINE_LIGHTMAP) && this.renderShaderData.hasDefine(MeshSprite3DShaderDeclaration.SHADERDEFINE_UV1);
                    if (haveLightMap) {
                        const lightMapData = this.getUpdateData(1, 4 * WebGPUInstanceRenderElement3D.MaxInstanceCount);
                        for (let i = 0; i < count; i++) { //@ts-ignore
                            const lightmapScaleOffset = elements[i].owner.lightmapScaleOffset;
                            const offset = i * 4;
                            lightMapData[offset] = lightmapScaleOffset.x;
                            lightMapData[offset + 1] = lightmapScaleOffset.y;
                            lightMapData[offset + 2] = lightmapScaleOffset.z;
                            lightMapData[offset + 3] = lightmapScaleOffset.w;
                        }
                        this.addUpdateBuffer(this._instanceStateInfo.lightmapScaleOffsetVB, 4);
                    }
                    break;
                }
            case BaseRenderType.SimpleSkinRender:
                {
                    const worldMatrixData = this.getUpdateData(0, 16 * WebGPUInstanceRenderElement3D.MaxInstanceCount);
                    this.addUpdateBuffer(this._instanceStateInfo.worldInstanceVB, 16);
                    const insBatches = this.instanceElementList;
                    const elements = insBatches.elements;
                    const count = insBatches.length;
                    this.drawCount = count;
                    this.geometry.instanceCount = this.drawCount;
                    for (let i = 0; i < count; i++)
                        worldMatrixData.set(elements[i].transform.worldMatrix.elements, i * 16);

                    const simpleAnimatorData = this.getUpdateData(1, 4 * WebGPUInstanceRenderElement3D.MaxInstanceCount);
                    for (let i = 0; i < count; i++) {
                        const simpleAnimatorParams = elements[i].renderShaderData.getVector(SimpleSkinnedMeshSprite3D.SIMPLE_SIMPLEANIMATORPARAMS);
                        const offset = i * 4;
                        simpleAnimatorData[offset] = simpleAnimatorParams.x;
                        simpleAnimatorData[offset + 1] = simpleAnimatorParams.y;
                        simpleAnimatorData[offset + 2] = simpleAnimatorParams.z;
                        simpleAnimatorData[offset + 3] = simpleAnimatorParams.w;
                    }
                    this.addUpdateBuffer(this._instanceStateInfo.simpleAnimatorVB, 4);
                    break;
                }
        }
    }

    /**
     * 设置几何对象
     * @param geometry 
     */
    setGeometry(geometry: WebGPURenderGeometry) {
        if (!this.geometry)
            this.geometry = new WebGPURenderGeometry(geometry.mode, geometry.drawType);
        geometry.cloneTo(this.geometry);
        this.geometry.drawType = DrawType.DrawElementInstance;
        this._instanceStateInfo = WebGPUInstanceRenderElement3D.getInstanceBufferState(this._instanceStateInfo, geometry, this.owner.renderNodeType, this.renderShaderData._defineDatas);
        this.geometry.bufferState = this._instanceStateInfo.state;
        this.geometry.checkDataFormat = this.geometry.bufferState.isNeedChangeFormat() ? false : true;
    }

    /**
     * 上传几何数据
     * @param command 
     * @param bundle 
     */
    protected _uploadGeometry(command: WebGPURenderCommandEncoder, bundle: WebGPURenderBundle) {
        for (let i = 0; i < this.updateNums; i++)
            this._vertexBuffers[i]?.setData(this._updateData[i].buffer, 0, 0, this.drawCount * this._updateDataNum[i] * 4);
        return super._uploadGeometry(command, bundle);
    }

    /**
     * 清理单次渲染生成的数据
     */
    clearRenderData(): void {
        this.drawCount = 0;
        this.updateNums = 0;
        this._vertexBuffers.length = 0;
        this._updateData.forEach(data => {
            WebGPUInstanceRenderElement3D._bufferPool.get(data.length).push(data);
        });
        this._updateData.length = 0;
        this._updateDataNum.length = 0;
    }

    // /**
    //  * 清理单次渲染生成的数据（延迟回收内存）
    //  */
    // clearRenderDataAndRecover(resRecover: WebGPUResourceRecover): void {
    //     this.drawCount = 0;
    //     this.updateNums = 0;
    //     this._vertexBuffers.length = 0;
    //     this._updateData.forEach(data => {
    //         WebGPUInstanceRenderElement3D._bufferPool.get(data.length).push(data);
    //     });
    //     this._updateData.length = 0;
    //     this._updateDataNum.length = 0;
    //     if (this._instanceStateInfo) {
    //         if (this._instanceStateInfo.worldInstanceVB) {
    //             this._instanceStateInfo.worldInstanceVB.destroy();
    //             resRecover.needRecover(this._instanceStateInfo.worldInstanceVB.source);
    //         }
    //         if (this._instanceStateInfo.simpleAnimatorVB) {
    //             this._instanceStateInfo.simpleAnimatorVB.destroy();
    //             resRecover.needRecover(this._instanceStateInfo.simpleAnimatorVB.source);
    //         }
    //         if (this._instanceStateInfo.lightmapScaleOffsetVB) {
    //             this._instanceStateInfo.lightmapScaleOffsetVB.destroy();
    //             resRecover.needRecover(this._instanceStateInfo.lightmapScaleOffsetVB.source);
    //         }
    //         this._instanceStateInfo.worldInstanceVB = null;
    //         this._instanceStateInfo.simpleAnimatorVB = null;
    //         this._instanceStateInfo.lightmapScaleOffsetVB = null;
    //     }
    // }

    /**
     * 回收
     */
    recover() {
        this.instanceElementList.clear();
        WebGPUInstanceRenderElement3D._pool.push(this);
    }

    /**
     * 销毁
     */
    destroy(): void {
        super.destroy();
    }
}