import { Sprite } from "./Sprite";
import { Widget } from "../components/Widget";
import { Event } from "../events/Event"
import { Resource } from "../resource/Resource"
import { Handler } from "../utils/Handler"
import { Timer } from "../utils/Timer"
import { ILaya } from "../../ILaya";
import { Prefab } from "../resource/HierarchyResource";
import { Context } from "../renders/Context";
import { CommandUniformMap } from "../RenderDriver/DriverDesign/RenderDevice/CommandUniformMap";
import { Scene2DSpecialManager } from "./Scene2DSpecial/Scene2DSpecialManager";
import { Render2DSimple } from "../renders/Render2D";
import { BaseRenderNode2D } from "../NodeRender2D/BaseRenderNode2D";
import { TransformKind } from "./SpriteConst";
import { Area2D } from "./Area2D";
import { Camera2D } from "./Scene2DSpecial/Camera2D";
import { LayaEnv } from "../../LayaEnv";
import { IElementComponentManager } from "../components/IScenceComponentManager";
import { ShaderData } from "../RenderDriver/DriverDesign/RenderDevice/ShaderData";

export interface ILight2DManager {
    preRenderUpdate(context: Context): void;
    addRender(node: BaseRenderNode2D): void;
    removeRender(node: BaseRenderNode2D): void;
    _getLayerUpdateMark(layer: number): number;
    _updateShaderDataByLayer(layer: number, shaderData: any): void;
}

/**
 * @en Scene class, responsible for scene creation, loading, destruction and other functions.
 * After the scene is removed from the node, it will not be automatically recycled by the garbage mechanism. If you want to recycle it, please call the destroy interface. 
 * You can view the list of scenes that have not been destroyed through the unDestroyedScenes property.
 * @zh 场景类，负责场景创建、加载、销毁等功能。
 * 场景被从节点移除后，并不会被自动垃圾机制回收。如果想回收，请调用 destroy 接口。
 * 可以通过 unDestroyedScenes 属性查看还未被销毁的场景列表。
 */
export class Scene extends Sprite {
    static scene2DUniformMap: CommandUniformMap;
    /**创建后，还未被销毁的场景列表，方便查看还未被销毁的场景列表，方便内存管理，本属性只读，请不要直接修改*/
    /**
     * @en List of scenes that have been created but not yet destroyed. This property is read-only, please do not modify it directly.
     * @zh 创建后还未被销毁的场景列表。此属性只读，请不要直接修改。用于方便查看未销毁的场景列表，便于内存管理。
     */
    static readonly unDestroyedScenes: Set<Scene> = new Set();
    /**
     * @en Get the root node
     * @zh 获取根节点
     * */
    private static _root: Sprite;
    private static _loadPage: Sprite;

    /**@private 场景组件管理表 */
    private static componentManagerMap: Map<string, any> = new Map();

    /**
     * 注册场景内的管理器
     * @param type 管理器类型
     * @param cla 实例
     */
    static regManager(type: string, cla: any) {
        Scene.componentManagerMap.set(type, cla);
    }

    /**
     * @en Whether to automatically destroy (destroy nodes and used resources) after the scene is closed, default is false
     * @zh 场景被关闭后，是否自动销毁（销毁节点和使用到的资源），默认为 false
     */
    autoDestroyAtClosed: boolean = false;
    /**@internal */
    _idMap?: any;
    /**
     * @internal
     */
    _scene3D: any;

    /**
     * @internal
     */
    _area2Ds: Area2D[] = [];

    /**
     * @en relative layout component
     * @zh 相对布局组件
     */
    protected _widget: Widget;

    /**
     * @en The scene clock
     * @zh 场景时钟
     */
    private _timer: Timer;

    /** @internal */
    _componentElementDatasMap: any = {};
    _specialManager: Scene2DSpecialManager;
    _light2DManager: ILight2DManager;
    _curCamera: Camera2D;

    constructor() {
        super();
        this._specialManager = new Scene2DSpecialManager();
        this._timer = ILaya.timer;
        this._widget = Widget.EMPTY;

        this._scene = this;
        Scene.componentManagerMap.forEach((val, key) => {
            this._specialManager.componentElementMap.set(key, new val(this));
        });
    }

    /**
     * @internal
     */
    set componentElementDatasMap(value: any) {
        this._componentElementDatasMap = value;
        this._specialManager.componentElementMap.forEach((value, key) => {
            this._componentElementDatasMap[key] && value.Init(this._componentElementDatasMap[key])
        });
    }

    get componentElementDatasMap(): any {
        return this._componentElementDatasMap;
    }

    _update() {
        var delta: number = ILaya.timer.delta * 0.001;
        this._specialManager.componentElementMap.forEach((value) => {
            value.update(delta);
        });
    }

    /**
     * 获得某个组件的管理器
     * @param type 组件管理类
     */
    getComponentElementManager(type: string): IElementComponentManager {
        return this._specialManager.componentElementMap.get(type);
    }

    /**
     * @en Get the node instance based on the node ID in the IDE.
     * @param id The node ID.
     * @zh 根据IDE内的节点id，获得节点实例。
     * @param id 节点ID。
     */
    getNodeByID(id: number): any {
        if (this._idMap) return this._idMap[id];
        return null;
    }

    /**
     * @en Open the scene. Note: If the closed scene has not set autoDestroyAtRemoved=true, resources may not be reclaimed and need to be manually reclaimed.
     * @param closeOther Whether to close other scenes, default is true (optional).
     * @param param Parameters for opening the page, will be passed to the onOpened method (optional).
     * @zh 打开场景。注意：被关闭的场景，如果没有设置autoDestroyAtRemoved=true，则资源可能不能被回收，需要自己手动回收。
     * @param closeOther 是否关闭其他场景，默认为true（可选）。
     * @param param 打开页面的参数，会传递给onOpened方法（可选）。
     */
    open(closeOther: boolean = true, param: any = null): void {
        if (closeOther) Scene.closeAll();
        Scene.root.addChild(this);
        if (this._scene3D)
            ILaya.stage.addChildAt(this._scene3D, 0);
        this.onOpened(param);
    }

    /**
     * @en Called after the scene is opened (if there is a pop-up animation, it will be executed after the animation is completed).
     * @param param Parameters.
     * @zh 场景打开完成后调用此方法（如果有弹出动画，则在动画完成后执行）。
     * @param param 参数。
     */
    onOpened(param: any): void {
    }

    /**
     * @en Close the scene. Note: If the closed scene has not set autoDestroyAtRemoved=true, resources may not be reclaimed and need to be manually reclaimed.
     * @param type The reason for closing, which will be passed to the onClosed function.
     * @zh 关闭场景。注意：被关闭的场景，如果没有设置autoDestroyAtRemoved=true，则资源可能不能被回收，需要自己手动回收。
     * @param type 关闭的原因，会传递给onClosed函数。
     */
    close(type: string = null): void {
        this.onClosed(type);
        if (this.autoDestroyAtClosed) {
            this.destroy();
            if (this._scene3D)
                this._scene3D.destroy();
        }
        else {
            this.removeSelf();
            if (this._scene3D)
                this._scene3D.removeSelf();
        }
    }

    /**
     * @en Called after the scene is closed (if there is a closing animation, it will be executed after the animation is completed).
     * @param type If triggered by clicking the default close button, pass the name of the close button, otherwise null.
     * @zh 关闭完成后调用此方法（如果有关闭动画，则在动画完成后执行）。
     * @param type 如果是点击默认关闭按钮触发，则传入关闭按钮的名字(name)，否则为null。
     */
    onClosed(type: string = null): void {
        //trace("onClosed");
    }

    /**
     * @en Destroy the scene.
     * @param destroyChild Whether to delete child nodes.
     * @zh 场景销毁。
     * @param destroyChild 是否删除子节点。
     */
    destroy(destroyChild: boolean = true): void {
        super.destroy(destroyChild);
        if (this._scene3D) {
            this._scene3D.destroy();
            this._scene3D = null;
        }

        this._idMap = null;
        Scene.unDestroyedScenes.delete(this);

        this._specialManager.componentElementMap.forEach(element => {
            element.destroy();
        });
    }



    /**
     * @en Scene clock
     * @zh 场景时钟
     */
    get timer(): Timer {
        return this._timer;
    }

    set timer(value: Timer) {
        this._timer = value;
    }

    /**
     * @en 3D scene instances included in the scene
     * @zh 场景包含的3D场景实例
     */
    get scene3D() {
        return this._scene3D;
    }

    /**
     * @en The vertical distance (in pixels) between the top edge of the component and the top edge of its content area.
     * @zh 从组件顶边到其内容区域顶边之间的垂直距离（以像素为单位）。
     */
    get top(): number {
        return this._widget.top;
    }

    set top(value: number) {
        if (value != this._widget.top) {
            this._getWidget().top = value;
        }
    }

    /**
     * @en The vertical distance (in pixels) between the bottom edge of the component and the bottom edge of its content area.
     * @zh 从组件底边到其内容区域底边之间的垂直距离（以像素为单位）。
     */
    get bottom(): number {
        return this._widget.bottom;
    }

    set bottom(value: number) {
        if (value != this._widget.bottom) {
            this._getWidget().bottom = value;
        }
    }

    /**
     * @en The horizontal distance (in pixels) between the left edge of the component and the left edge of its content area.
     * @zh 从组件左边到其内容区域左边之间的水平距离（以像素为单位）。
     */
    get left(): number {
        return this._widget.left;
    }

    set left(value: number) {
        if (value != this._widget.left) {
            this._getWidget().left = value;
        }
    }

    /**
     * @en The horizontal distance (in pixels) between the right edge of the component and the right edge of its content area.
     * @zh 从组件右边到其内容区域右边之间的水平距离（以像素为单位）。
     */
    get right(): number {
        return this._widget.right;
    }

    set right(value: number) {
        if (value != this._widget.right) {
            this._getWidget().right = value;
        }
    }

    /**
     * @en The distance (in pixels) between the horizontal axis of this object and the horizontal center line of its parent container.
     * @zh 在父容器中，此对象的水平方向中轴线与父容器的水平方向中心线的距离（以像素为单位）。
     */
    get centerX(): number {
        return this._widget.centerX;
    }

    set centerX(value: number) {
        if (value != this._widget.centerX) {
            this._getWidget().centerX = value;
        }
    }

    /**
     * @en The distance (in pixels) between the vertical axis of this object and the vertical center line of its parent container.
     * @zh 在父容器中，此对象的垂直方向中轴线与父容器的垂直方向中心线的距离（以像素为单位）。
     */
    get centerY(): number {
        return this._widget.centerY;
    }

    set centerY(value: number) {
        if (value != this._widget.centerY) {
            this._getWidget().centerY = value;
        }
    }

    /**
     * @internal
     * @param ctx 
     * @param x 
     * @param y 
     */
    render(ctx: Context, x: number, y: number): void {
        this._preRenderUpdate(ctx, x, y)
        super.render(ctx, x, y);

        this._recoverRenderSceneState(ctx);
    }

    /**
     * @en Gets shader data from scene's manager
     * @zh 获取场景的着色器数据
     */
    get sceneShaderData(): ShaderData {
        return this._specialManager._shaderData;
    }

    /**
     * @internal
     * @param ctx 
     * @param x 
     * @param y 
     */
    _preRenderUpdate(ctx: Context, x: number, y: number) {
        //更新2DScene场景数据    
        Render2DSimple.rendercontext2D.sceneData = this._specialManager._shaderData;
        if (this._light2DManager)
            this._light2DManager.preRenderUpdate(ctx);
    }

    /**
     * @internal
     * @param ctx 
     */
    _recoverRenderSceneState(ctx: Context) {
        ctx.drawLeftData();
        Render2DSimple.rendercontext2D.sceneData = null;
    }

    /**
     * @ignore
     */
    protected _transChanged(kind: TransformKind): void {
        super._transChanged(kind);

        if ((kind & TransformKind.Layout) != 0)
            this.callLater(this._sizeChanged);
    }

    protected _sizeChanged(): void {
        this.event(Event.RESIZE);
        if (this._widget !== Widget.EMPTY) this._widget.resetLayout();
    }

    protected _onAdded(): void {
        super._onAdded();
        if (LayaEnv.isPlaying)
            ILaya.stage._scene2Ds.push(this);
    }

    protected _onRemoved(): void {
        super._onRemoved();
        if (LayaEnv.isPlaying) {
            let index = ILaya.stage._scene2Ds.indexOf(this);
            ILaya.stage._scene2Ds.splice(index, 1);
        }
    }

    /**
     * @en Repositioning
     * @zh 重新排版
     */
    freshLayout() {
        if (this._widget != Widget.EMPTY) {
            this._widget.resetLayout();
        }
    }

    /**
     * @en Get the layout style of the object. Please do not directly modify this object
     * @zh 获取对象的布局样式。请不要直接修改此对象
     */
    private _getWidget(): Widget {
        this._widget === Widget.EMPTY && (this._widget = this.addComponent(Widget));
        return this._widget;
    }
    //////////////////////////////////////静态方法//////////////////////////////////////////

    /**
     * @en Get the root container of the scene.
     * @zh 获取场景根容器
     */
    static get root(): Sprite {
        let root = Scene._root;
        if (!root) {
            root = Scene._root = ILaya.stage.addChild(new Sprite());
            root.name = "root";
            root.mouseThrough = true;
            ILaya.stage.on("resize", null, () => {
                root.size(ILaya.stage.width, ILaya.stage.height);
                root.event(Event.RESIZE);
            });
            root.size(ILaya.stage.width, ILaya.stage.height);
            root.event(Event.RESIZE);
        }
        return root;
    }

    /**
     * @deprecated 请使用Loader.load(url:string, type: ILaya.Loader.HIERARCHY)
     * @en Load the scene and resources used by the scene.
     * @param url The scene address.
     * @param complete Callback function when loading is complete, returns the scene instance (optional).
     * @param progress Callback function for loading progress (optional).
     * @zh 加载场景及场景使用到的资源。
     * @param url 场景地址。
     * @param complete 加载完成回调，返回场景实例（可选）。
     * @param progress 加载进度回调（可选）。
     */
    static load(url: string, complete: Handler = null, progress: Handler = null): Promise<Scene> {
        return ILaya.loader.load(url, null, value => {
            if (Scene._loadPage) Scene._loadPage.event("progress", value);
            progress && progress.runWith(value);
        }).then((content: Prefab) => {
            if (!content) throw "Can not find scene:" + url;

            let scene: Scene;
            let errors: Array<any> = [];
            let ret = content.create(null, errors);
            if (errors.length > 0)
                console.warn(`Error loading ${url}: \n${errors.join("\n")}`);

            if (ret instanceof Scene)
                scene = ret;
            else if (ret._nodeType === 1) {
                scene = new Scene();
                scene.left = scene.right = scene.top = scene.bottom = 0;
                scene._scene3D = ret;
            }
            else
                throw "Not a scene:" + url;

            if (scene._scene3D)
                scene._scene3D._scene2D = scene;
            Scene.unDestroyedScenes.add(scene);
            Scene.hideLoadingPage();
            complete && complete.runWith(scene);

            return scene;
        });
    }

    /**
     * @en Load and open the scene.
     * @param url The scene address.
     * @param closeOther Whether to close other scenes, default is true (optional). Note: If the closed scene has not set autoDestroyAtRemoved=true, resources may not be reclaimed and need to be manually reclaimed.
     * @param param Parameters for opening the page, will be passed to the onOpened method (optional).
     * @param complete Callback function when opening is complete, returns the scene instance (optional).
     * @param progress Callback function for loading progress (optional).
     * @zh 加载并打开场景。
     * @param url 场景地址。
     * @param closeOther 是否关闭其他场景，默认为true（可选）。注意：被关闭的场景，如果没有设置autoDestroyAtRemoved=true，则资源可能不能被回收，需要自己手动回收。
     * @param param 打开页面的参数，会传递给onOpened方法（可选）。
     * @param complete 打开完成回调，返回场景实例（可选）。
     * @param progress 加载进度回调（可选）。
     */
    static open(url: string, closeOther: boolean = true, param: any = null, complete: Handler = null, progress: Handler = null): Promise<Scene> {
        //兼容处理
        if (param instanceof Handler) {
            var temp: any = complete;
            complete = param;
            param = temp;
        }
        Scene.showLoadingPage();
        return Scene.load(url, Handler.create(null, this._onSceneLoaded, [closeOther, complete, param]), progress);
    }

    private static _onSceneLoaded(closeOther: boolean, complete: Handler, param: any, scene: Scene): void {
        scene.open(closeOther, param);
        if (complete) complete.runWith(scene);
    }

    /**
     * @en Close the scene (including dialog) based on the address.
     * @param url The scene address.
     * @param name If name is not empty, it must match to close the scene.
     * @returns Returns whether the closure was successful. If the url is not found, it will not be successful.
     * @zh 根据地址，关闭场景（包括对话框）。
     * @param url 场景地址。
     * @param name 如果name不为空，name必须相同才能关闭。
     * @returns 返回是否关闭成功，如果url找不到，则不成功。
     */
    static close(url: string, name?: string): boolean {
        let flag: boolean = false;
        for (let scene of Scene.unDestroyedScenes) {
            if (scene && scene.parent && scene.url === url && (name == null || scene.name == name)) {
                scene.close();
                flag = true;
                break;
            }
        }
        return flag;
    }

    /**
     * @en Close all scenes, not including dialogs. To close dialogs, please use Dialog.closeAll().
     * Note: If the closed scene has not set autoDestroyAtRemoved=true, resources may not be reclaimed and need to be manually reclaimed.
     * @zh 关闭所有场景，不包括对话框。如果要关闭对话框，请使用Dialog.closeAll()。
     * 注意：被关闭的场景，如果没有设置autoDestroyAtRemoved=true，则资源可能不能被回收，需要自己手动回收。
     */
    static closeAll(): void {
        let root: Sprite = Scene.root;
        for (let i = 0, n = root.numChildren; i < n; i++) {
            var scene = root.getChildAt(0);
            if (scene instanceof Scene)
                scene.close();
            else
                scene.removeSelf();
        }
    }

    /**
     * @en Destroy the scene (including dialog) based on the address.
     * @param url The scene address.
     * @param name If name is not empty, it must match to destroy the scene.
     * @returns Returns whether the destruction was successful. If the url is not found, it will not be successful.
     * @zh 根据地址，销毁场景（包括对话框）。
     * @param url 场景地址。
     * @param name 如果name不为空，name必须相同才能销毁。
     * @returns 返回是否销毁成功，如果url找不到，则不成功。
     */
    static destroy(url: string, name?: string): boolean {
        let flag: boolean = false;
        for (let scene of Scene.unDestroyedScenes) {
            if (scene.url === url && (name == null || scene.name == name) && !scene._destroyed) {
                scene.destroy();
                flag = true;
                break;
            }
        }
        return flag;
    }

    /**
     * @en Destroy currently unused resources. This function will ignore resources with lock=true.
     * @zh 销毁当前没有被使用的资源，该函数会忽略lock=true的资源。
     */
    static gc(): void {
        Resource.destroyUnusedResources();
    }

    /**
     * @en Set the loading interface. The engine will delay opening the loading interface after calling the open method, and close the loading interface after the page is added to the stage.
     * @param loadPage The loading page instance.
     * @zh 设置loading界面，引擎会在调用open方法后，延迟打开loading界面，在页面添加到舞台之后，关闭loading界面。
     * @param loadPage load界面实例。
     */
    static setLoadingPage(loadPage: Sprite): void {
        Scene._loadPage = loadPage;
    }

    /**
     * @en Display the loading interface.
     * @param param Opening parameters. If it's a scene, it will be passed to the onOpened method.
     * @param delay Delay opening time, default is 500 milliseconds.
     * @zh 显示loading界面。
     * @param param 打开参数，如果是scene，则会传递给onOpened方法。
     * @param delay 延迟打开时间，默认500毫秒。
     */
    static showLoadingPage(param: any = null, delay: number = 500): void {
        if (Scene._loadPage) {
            ILaya.systemTimer.clear(null, Scene._showLoading);
            ILaya.systemTimer.clear(null, Scene._hideLoading);
            ILaya.systemTimer.once(delay, null, Scene._showLoading, [param], false);
        }
    }

    private static _showLoading(param: any): void {
        ILaya.stage.addChild(Scene._loadPage);
        if (Scene._loadPage instanceof Scene)
            Scene._loadPage.onOpened(param);
    }

    private static _hideLoading(): void {
        if (Scene._loadPage instanceof Scene)
            Scene._loadPage.close();
        else
            Scene._loadPage.removeSelf();
    }

    /**
     * @en Hide the loading interface.
     * @param delay Delay closing time, default is 500 milliseconds.
     * @zh 隐藏loading界面。
     * @param delay 延迟关闭时间，默认500毫秒。
     */
    static hideLoadingPage(delay: number = 500): void {
        if (Scene._loadPage) {
            ILaya.systemTimer.clear(null, Scene._showLoading);
            ILaya.systemTimer.clear(null, Scene._hideLoading);
            ILaya.systemTimer.once(delay, null, Scene._hideLoading);
        }
    }
}