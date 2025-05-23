import { Shader3D } from "../../../RenderEngine/RenderShader/Shader3D";
import { CommandUniformMap, UniformProperty } from "../../DriverDesign/RenderDevice/CommandUniformMap";
import { ShaderDataType } from "../../DriverDesign/RenderDevice/ShaderData";

export class WebGLCommandUniformMap extends CommandUniformMap {

    /**@internal */
    _idata: Map<number, UniformProperty> = new Map<number, UniformProperty>();

    _stateName: string;
    _stateID: number;
    constructor(stateName: string) {
        super(stateName);
        this._stateName = stateName;
        this._stateID = Shader3D.propertyNameToID(stateName);
    }

    hasPtrID(propertyID: number): boolean {
        return this._stateID == propertyID || this._idata.has(propertyID);
    }

    /**
     * 增加一个Uniform参数，如果Uniform属性是Array，请使用addShaderUniformArray
     * @internal
     * @param propertyID 
     * @param propertyKey 
     */
    addShaderUniform(propertyID: number, propertyKey: string, uniformtype: ShaderDataType): void {
        this._idata.set(propertyID, { id: propertyID, uniformtype: uniformtype, propertyName: propertyKey, arrayLength: 0 });
    }

    /**
     * 增加一个UniformArray参数
     * @internal
     * @param propertyID 
     * @param propertyName 
     */
    addShaderUniformArray(propertyID: number, propertyName: string, uniformtype: ShaderDataType, arrayLength: number, block: string = ""): void {
        this._idata.set(propertyID, { id: propertyID, uniformtype: uniformtype, propertyName: propertyName, arrayLength: arrayLength });
    }
}