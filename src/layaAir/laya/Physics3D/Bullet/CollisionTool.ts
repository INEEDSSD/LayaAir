import { Collision } from "../../d3/physics/Collision";
import { ContactPoint } from "../../d3/physics/ContactPoint";
import { HitResult } from "../../d3/physics/HitResult";
import { btCollider } from "./Collider/btCollider";


/**
 * @internal
 * <code>CollisionMap</code> 类用于实现碰撞组合实例图。
 */
export class CollisionTool {
    /**@internal	*/
    private _hitResultsPoolIndex: number = 0;
    /**@internal	*/
    private _hitResultsPool: HitResult[] = [];
    /**@internal	*/
    private _contactPonintsPoolIndex: number = 0;
    /**@internal	*/
    private _contactPointsPool: ContactPoint[] = [];
    /**@internal */
    private _collisionsPool: Collision[] = [];

    /**@internal */
    private _collisions: any = {};

    /**
     * 创建一个 <code>CollisionMap</code> 实例。
     */
    constructor() {

    }

    /**
     * @internal
     */
    getHitResult(): HitResult {
        var hitResult: HitResult = this._hitResultsPool[this._hitResultsPoolIndex++];
        if (!hitResult) {
            hitResult = new HitResult();
            this._hitResultsPool.push(hitResult);
        }
        return hitResult;
    }

    /**
     * @internal
     */
    recoverAllHitResultsPool(): void {
        this._hitResultsPoolIndex = 0;
    }

    /**
     * @internal
     */
    getContactPoints(): ContactPoint {
        var contactPoint: ContactPoint = this._contactPointsPool[this._contactPonintsPoolIndex++];
        if (!contactPoint) {
            contactPoint = new ContactPoint();
            this._contactPointsPool.push(contactPoint);
        }
        return contactPoint;
    }

    /**
     * @internal
     */
    recoverAllContactPointsPool(): void {
        this._contactPonintsPoolIndex = 0;
    }

    /**
     * @internal
     */
    getCollision(physicComponentA: btCollider, physicComponentB: btCollider): Collision {
        var collision: Collision;
        var idA = physicComponentA._id;
        var idB = physicComponentB._id;
        var subCollisionFirst: any = this._collisions[idA];
        if (subCollisionFirst)
            collision = subCollisionFirst[idB];
        if (!collision) {
            if (!subCollisionFirst) {
                subCollisionFirst = {};
                this._collisions[idA] = subCollisionFirst;
            }
            collision = this._collisionsPool.length === 0 ? new Collision() : this._collisionsPool.pop();
            collision._colliderA = physicComponentA;
            collision._colliderB = physicComponentB;
            subCollisionFirst[idB] = collision;
        }
        return collision;
    }

    /**
     * @internal
     */
    recoverCollision(collision: Collision): void {
        var idA = (collision._colliderA as btCollider)._id;
        var idB = (collision._colliderB as btCollider)._id;
        this._collisions[idA][idB] = null;
        this._collisionsPool.push(collision);
    }

    /**
     * @internal
     */
    garbageCollection(): void {//TODO:哪里调用
        this._hitResultsPoolIndex = 0;
        this._hitResultsPool.length = 0;

        this._contactPonintsPoolIndex = 0;
        this._contactPointsPool.length = 0;

        this._collisionsPool.length = 0;
        for (var subCollisionsKey in this._collisionsPool) {
            var subCollisions: any = this._collisionsPool[subCollisionsKey];
            var wholeDelete: boolean = true;
            for (var collisionKey in subCollisions) {
                if (subCollisions[collisionKey])
                    wholeDelete = false;
                else
                    delete subCollisions[collisionKey];
            }
            if (wholeDelete)
                delete this._collisionsPool[subCollisionsKey];
        }
    }
}


