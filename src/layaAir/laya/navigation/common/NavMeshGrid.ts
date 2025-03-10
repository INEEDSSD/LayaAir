
import { Vector2 } from "../../maths/Vector2";
import { Vector3 } from "../../maths/Vector3";
import { NavTileData } from "./NavTileData";
import { RecastConfig } from "./RecastConfig";

/**
 * @en The NavMeshGrid class manages the grid division of the navigation mesh.
 * @zh NavMeshGrid 类用于管理导航网格的网格划分。
*/
export class NavMeshGrid {
    private _config: RecastConfig;
    private _min: Vector3;
    private _max: Vector3;
    private _tileSize: Vector2;
    private _cellSize: Vector2;
    private _bordWidth: number = 0;

    /**
     * @internal 
     * @en The width of a single tile.
     * @zh 单个瓦片的宽度。
    */
    get tileWidth() {
        return this._config.tileSize * this._config.cellSize;
    }

    /**
     * @internal
     * @en The bounding box of the navigation mesh.
     * @zh 导航网格的最小值。
    */
    get max(): Vector3 {
        return this._max;
    }

    /**
     * @internal
     * @en The bounding box of the navigation mesh.
     * @zh 导航网格的最大值。
    */
    get min(): Vector3 {
        return this._min;
    }


    /**
     * @internal
     * @en The configuration of the navigation mesh.
     * @zh 导航网格的配置。
     */
    get config(): RecastConfig {
        return this._config;
    }


    /**
     *@internal
    * @en Get the maximum number of tiles.
    * @zh 获取最大瓦片数量。
    */
    get maxtiles() {
        return this.maxXTileCount * this.maxZTileCount;
    }

    /**
     * @internal
     * @en Get the maximum number of tiles along the x-axis.
     * @zh 获取 x 轴方向的最大瓦片数量。
     */
    get maxXTileCount(): number {
        return this._tileSize.x;
    }

    /**
     * @internal
     * @en Get the maximum number of tiles along the z-axis.
     * @zh 获取 z 轴方向的最大瓦片数量。
     */
    get maxZTileCount(): number {
        return this._tileSize.y;
    }

    /**
     * <code>实例化一个NavMeshGrid组件<code>
     * @ignore
     */
    constructor(config: RecastConfig, min: Vector3, max: Vector3) {
        this._config = config;

        this._min = min;
        this._max = max;
        this._tileSize = new Vector2();
        this._cellSize = new Vector2();
        this._updateBound();
    }

    /**
     * @internal
     * @en Update the configuration and bounding box based on the given tile data.
     * @param tile The navigation tile data.
     * @zh 根据给定的瓦片数据更新配置和边界框。
     * @param tile 导航瓦片数据。
     */
    _refeashBound(tile: NavTileData) {
        tile._boundMin.cloneTo(this._min);
        tile._boundMax.cloneTo(this._max);
        this._updateBound();
    }

    /**
     * @internal
     * @en Get the tile indices that intersect with the given bounding box defined by minimum and maximum coordinates.
     * @param min The minimum coordinates of the bounding box.
     * @param max The maximum coordinates of the bounding box.
     * @param isbord Whether to include a border around the bounding box.
     * @returns An array of tile indices.
     * @zh 获取与由最小和最大坐标定义的给定边界框相交的瓦片索引。
     * @param min 边界框的最小坐标。
     * @param max 边界框的最大坐标。
     * @param isbord 是否在边界框周围包含边界。
     * @returns 瓦片索引数组。
     */
    getBoundTileIndex(min: Vector3, max: Vector3, isbord: boolean = false): number[] {
        //阔边
        let pMinx = min.x;
        let pMinz = min.z;
        let pMaxx = max.x;
        let pMaxz = max.z;
        if (isbord) {
            pMinx -= this._bordWidth;
            pMinz -= this._bordWidth;

            pMaxx += this._bordWidth;
            pMaxz += this._bordWidth;
        }
        let lists: number[] = [];
        let minIx = Math.max(0, this._getTileXIndex(pMinx));
        let maxIx = Math.min(this._tileSize.x - 1, this._getTileXIndex(pMaxx));
        let minIz = Math.max(0, this._getTileZIndex(pMinz));
        let maxIz = Math.min(this._tileSize.y - 1, this._getTileZIndex(pMaxz));

        for (var z = minIz; z <= maxIz; z++) {
            for (var x = minIx; x <= maxIx; x++) {
                lists.push(z * this._tileSize.x + x);
            }
        }

        return lists;
    }

    /**
     * @internal
    * get tile index of map by position
    * @param x  世界坐标x
    * @param z  世界坐标z
    */
    getTileIndexByPos(x: number, z: number): number {
        return this.getTileIndex(this._getTileXIndex(x), this._getTileZIndex(z));
    }

    /**
     * @internal
     * @en get tile index of map
     * @zh 获取地图的tile索引
     */
    getTileIndex(xIndex: number, zIndex: number): number {
        if (zIndex < 0 || zIndex >= this._tileSize.y) {
            return -1;
        }
        if (xIndex < 0 || xIndex >= this._tileSize.x) {
            return -1;
        }
        return zIndex * this._tileSize.x + xIndex;
    }

    /**
    * get tile x index
    */
    private _getTileXIndex(value: number) {
        return this._getLeftValue(value - this._min.x);
    }

    /**
    * get tile z index
    */
    private _getTileZIndex(value: number) {
        return this._getLeftValue(value - this._min.z);
    }

    /**
     * get tile index of map
     */
    private _getLeftValue(value: number): number {
        return Math.floor(value / this.tileWidth);
    }

    /**
     * update bound
     */
    private _updateBound() {
        this._bordWidth = this._config.cellSize * 3;
        const max = this._max;
        const min = this._min;
        const tileWidth = this._config.cellSize * this._config.tileSize;
        this._tileSize.x = Math.ceil((max.x - min.x) / tileWidth);
        this._tileSize.y = Math.ceil((max.z - min.z) / tileWidth);

        const cellSize = this._config.cellSize;
        this._cellSize.x = Math.ceil((max.x - min.x) / cellSize);
        this._cellSize.x = Math.ceil((max.z - min.z) / cellSize);
    }

}