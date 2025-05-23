import { BaseRenderNode2D } from "../../NodeRender2D/BaseRenderNode2D";
import { Color } from "../../maths/Color";
import { Spine2DRenderNode } from "../Spine2DRenderNode";
import { SpineAdapter } from "../SpineAdapter";
import { SpineTemplet } from "../SpineTemplet";
import { ISpineRender } from "../interface/ISpineRender";
import { SpineShaderInit } from "../material/SpineShaderInit";
import { TSpineBakeData } from "./SketonOptimise";
import { ISpineOptimizeRender } from "./interface/ISpineOptimizeRender";

/**
 * @en Class for normal Spine rendering implementation.
 * @zh 普通 Spine 渲染实现类。
 */
export class SpineNormalRender implements ISpineOptimizeRender {
    getSpineColor(): Color {
        return this._spineColor;
    }
    /**
     * @en Destroys the renderer.
     * @zh 销毁渲染器。
     */
    destroy(): void {
        this._renderer.destroy();
        this._renderer = null;
        this._owner._renderElements.length = 0;
    }
    /**
     * @en Initializes bake data.
     * @param obj The spine bake data.
     * @zh 初始化烘焙数据。
     * @param obj Spine 烘焙数据。
     */
    initBake(obj: TSpineBakeData): void {
        //throw new NotImplementedError();
    }
    /** @internal */
    _owner: Spine2DRenderNode;
    /** @internal */
    _renderer: ISpineRender;
    /** @internal */
    _skeleton: spine.Skeleton;
    /**@internal */
    _spineColor: Color
    /** @internal */
    _skinIndex: number = 0;
    /**
     * @en Initializes the renderer.
     * @param skeleton The spine skeleton.
     * @param templet The spine templet.
     * @param renderNode The Spine2DRenderNode.
     * @param state The spine animation state.
     * @zh 初始化渲染器。
     * @param skeleton Spine 骨骼。
     * @param templet Spine 模板。
     * @param renderNode Spine2DRenderNode。
     * @param state Spine 动画状态。
     */
    init(skeleton: spine.Skeleton, templet: SpineTemplet, renderNode: Spine2DRenderNode, state: spine.AnimationState): void {
        this._renderer = SpineAdapter.createNormalRender(templet);
        this._skeleton = skeleton;
        this._owner = renderNode;
        let scolor = skeleton.color;

        this._spineColor = new Color(scolor.r, scolor.g, scolor.b, scolor.a);
        let color = renderNode._spriteShaderData.getColor(BaseRenderNode2D.BASERENDER2DCOLOR) || new Color();
        color.setValue(scolor.r, scolor.g, scolor.b , scolor.a );
        if (renderNode._renderAlpha !== undefined) {
            color.a *= renderNode._renderAlpha;
        }else
            color.a *= renderNode.owner.alpha;
        renderNode._spriteShaderData.setColor(BaseRenderNode2D.BASERENDER2DCOLOR, color);

        renderNode._spriteShaderData.removeDefine(SpineShaderInit.SPINE_FAST);
        renderNode._spriteShaderData.removeDefine(SpineShaderInit.SPINE_RB);
        renderNode._spriteShaderData.addDefine(SpineShaderInit.SPINE_COLOR2);
    }

    /**
     * @en Plays the specified animation.
     * @param animationName The name of the animation to play.
     * @zh 播放指定的动画。
     * @param animationName 要播放的动画名称。
     */
    play(animationName: string): void {

    }
    /**
     * @en Sets the skin index.
     * @param index The index of the skin to set.
     * @zh 设置皮肤索引。
     * @param index 要设置的皮肤索引。
     */
    setSkinIndex(index: number): void {
        this._skinIndex = index;
    }


    /**
     * @en Changes the skeleton.
     * @param skeleton The new spine skeleton.
     * @zh 更改骨骼。
     * @param skeleton 新的 Spine 骨骼。
     */
    changeSkeleton(skeleton: spine.Skeleton) {
        this._skeleton = skeleton;
        //@ts-ignore
        skeleton.showSkinByIndex(this._skinIndex);
        this._skeleton.setSlotsToSetupPose();
    }

    /**
     * @en Renders the spine animation.
     * @param time The current time for rendering.
     * @zh 渲染 Spine 动画。
     * @param time 当前渲染时间。
     */
    render(time: number) {
        this._owner.clear();
        this._renderer.draw(this._skeleton, this._owner, -1, -1);
    }
}