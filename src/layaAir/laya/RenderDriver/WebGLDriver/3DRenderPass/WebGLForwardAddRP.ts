import { CommandBuffer } from "../../../d3/core/render/command/CommandBuffer";
import { IForwardAddRP } from "../../DriverDesign/3DRenderPass/I3DRenderPass";
import { WebGLDirectLightShadowRP } from "./WebGLDirectLightShadowRP";
import { WebGLForwardAddClusterRP } from "./WebGLForwardAddClusterRP";
import { WebGLSpotLightShadowRP } from "./WebGLSpotLightShadowRP";


export class WebGLForwardAddRP implements IForwardAddRP {
    constructor() {
        this.directLightShadowPass = new WebGLDirectLightShadowRP();
        this.spotLightShadowPass = new WebGLSpotLightShadowRP();
        this.renderpass = new WebGLForwardAddClusterRP();
    }

    setBeforeImageEffect(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._beforeImageEffectCMDS = value;
            value.forEach(element => {
                element._apply(false);
            });
        }
    }

    setAfterEventCmd(value: CommandBuffer[]): void {
        if (value && value.length > 0) {
            this._afterAllRenderCMDS = value;
            value.forEach(element => {
                element._apply(false);
            });
        }
    }
    /**是否开启阴影 */
    shadowCastPass: boolean = false;

    /**directlight shadow */
    directLightShadowPass: WebGLDirectLightShadowRP;

    /**enable directlight */
    enableDirectLightShadow: boolean = false;

    /**spot shadow */
    spotLightShadowPass: WebGLSpotLightShadowRP;

    /**enable spot */
    enableSpotLightShadowPass: boolean = false;

    /**Render end commanbuffer */
    /**@internal */
    _afterAllRenderCMDS: Array<CommandBuffer>;
    /**@internal */
    _beforeImageEffectCMDS: Array<CommandBuffer>;
    //postProcess TODO
    /**main pass */
    renderpass: WebGLForwardAddClusterRP;
}