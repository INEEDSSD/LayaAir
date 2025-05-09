import lightAndShadowGen2D_vs from './lightAndShadowGen2D.vs';
import lightAndShadowGen2D_ps from './lightAndShadowGen2D.fs';
import { ShaderDataType } from '../../../RenderDriver/DriverDesign/RenderDevice/ShaderData';
import { Shader3D, ShaderFeatureType } from '../../../RenderEngine/RenderShader/Shader3D';
import { UniformMapType, SubShader } from '../../../RenderEngine/RenderShader/SubShader';

/**
 * 用于生成光影图
 */
export class LightAndShadowGenShader2D {
    static renderShader: Shader3D;

    static readonly RenderUniform: UniformMapType = {
        'u_LightColor': ShaderDataType.Color,
        'u_LightRotation': ShaderDataType.Float,
        'u_LightIntensity': ShaderDataType.Float,
        'u_LightScale': ShaderDataType.Vector2,
        'u_LightTextureSize': ShaderDataType.Vector2,
        'u_PCFIntensity': ShaderDataType.Float,
    }

    static readonly RenderAttribute: { [name: string]: [number, ShaderDataType] } = {
        'a_position': [0, ShaderDataType.Vector4],
        'a_uv': [2, ShaderDataType.Vector2],
    }

    static __init__(): void {
        this.renderShader = Shader3D.add('LightAndShadowGen2D', false, false);
        this.renderShader.shaderType = ShaderFeatureType.DEFAULT;
        const subShader = new SubShader(this.RenderAttribute, this.RenderUniform, {});
        this.renderShader.addSubShader(subShader);
        subShader.addShaderPass(lightAndShadowGen2D_vs, lightAndShadowGen2D_ps);
    }
}