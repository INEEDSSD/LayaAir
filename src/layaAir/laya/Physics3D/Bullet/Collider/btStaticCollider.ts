import { Vector3 } from "../../../maths/Vector3";
import { IStaticCollider } from "../../interface/IStaticCollider";
import { Physics3DStatInfo } from "../../interface/Physics3DStatInfo";
import { EColliderCapable } from "../../physicsEnum/EColliderCapable";
import { EPhysicsStatisticsInfo } from "../../physicsEnum/EPhysicsStatisticsInfo";
import type { btPhysicsManager } from "../btPhysicsManager";
import { btStatics } from "../btStatics";
import { btCollider, btColliderType } from "./btCollider";
/**
 * @en The `btStaticCollider` class is used to create and manage static colliders.
 * @zh `btStaticCollider` 类用于创建和管理静态碰撞体。
 */
export class btStaticCollider extends btCollider implements IStaticCollider {
    /**@internal */
    static _staticCapableMap: Map<any, any>;
    /**@internal */
    componentEnable: boolean;
    /**
     * @internal
     */
    static __init__(): void {
        btStaticCollider.initCapable();
    }

    protected _initCollider() {
        let bt = btStatics.bt;
        var btColObj: number = bt.btCollisionObject_create();
        bt.btCollisionObject_setUserIndex(btColObj, this._id);
        bt.btCollisionObject_forceActivationState(btColObj, btStatics.ACTIVATIONSTATE_DISABLE_SIMULATION);//prevent simulation

        var flags: number = bt.btCollisionObject_getCollisionFlags(btColObj);
        if ((this.owner).isStatic) {//TODO:
            if ((flags & btStatics.COLLISIONFLAGS_KINEMATIC_OBJECT) > 0)
                flags = flags ^ btStatics.COLLISIONFLAGS_KINEMATIC_OBJECT;
            flags = flags | btStatics.COLLISIONFLAGS_STATIC_OBJECT;
        } else {
            if ((flags & btStatics.COLLISIONFLAGS_STATIC_OBJECT) > 0)
                flags = flags ^ btStatics.COLLISIONFLAGS_STATIC_OBJECT;
            flags = flags | btStatics.COLLISIONFLAGS_KINEMATIC_OBJECT;
        }
        bt.btCollisionObject_setCollisionFlags(btColObj, flags);
        this._btCollider = btColObj;
    }

    /**
     * @en Set whether the collider is a trigger.
     * @param value True if the collider should be a trigger, false otherwise.
     * @zh 设置碰撞体是否为触发器。
     * @param value 如果为true，则设置为触发器；否则为false。
     */
    setTrigger(value: boolean): void {
        this._isTrigger = value;
        let bt = btStatics.bt;
        if (this._btCollider) {
            var flags: number = bt.btCollisionObject_getCollisionFlags(this._btCollider);
            if (value) {
                if ((flags & btStatics.COLLISIONFLAGS_NO_CONTACT_RESPONSE) === 0)
                    bt.btCollisionObject_setCollisionFlags(this._btCollider, flags | btStatics.COLLISIONFLAGS_NO_CONTACT_RESPONSE);
            } else {
                if ((flags & btStatics.COLLISIONFLAGS_NO_CONTACT_RESPONSE) !== 0)
                    bt.btCollisionObject_setCollisionFlags(this._btCollider, flags ^ btStatics.COLLISIONFLAGS_NO_CONTACT_RESPONSE);
            }
        }
    }

    allowSleep(value: boolean): void {
        if (this._btCollider) {
            let bt = btStatics.bt;
            if (value) {
                bt.btCollisionObject_forceActivationState(this._btCollider, btStatics.ACTIVATIONSTATE_ISLAND_SLEEPING);
            } else {
                bt.btCollisionObject_forceActivationState(this._btCollider, btStatics.ACTIVATIONSTATE_DISABLE_SIMULATION);//prevent simulation
            }
        }
    }

    protected getColliderType(): btColliderType {
        return btColliderType.StaticCollider;
    }

    /**
     * @en Check if the collider has a specific capability.
     * @param value The capability to check.
     * @returns Whether the collider has the specified capability.
     * @zh 检查碰撞体是否具有特定能力。
     * @param value 要检查的能力。
     * @returns 碰撞体是否具有指定的能力。
     */
    getCapable(value: number): boolean {
        return btStaticCollider.getStaticColliderCapable(value);
    }

    /**
     * @ignore
     * @en Creates an instance of `btStaticCollider`.
     * @param physicsManager The physics manager.
     * @zh 创建一个 `btStaticCollider` 的实例。
     * @param physicsManager 物理管理器。
     */
    constructor(physicsManager: btPhysicsManager) {
        super(physicsManager);
        this._enableProcessCollisions = false;
        Physics3DStatInfo.addStatisticsInfo(EPhysicsStatisticsInfo.C_PhysicaStaticRigidBody, 1);
    }

    /**
     * @en Check if the static collider has a specific capability.
     * @param value The capability to check.
     * @returns Whether the static collider has the specified capability.
     * @zh 检查静态碰撞体是否具有特定能力。
     * @param value 要检查的能力。
     * @returns 静态碰撞体是否具有指定的能力。
     */
    static getStaticColliderCapable(value: EColliderCapable): boolean {
        return this._staticCapableMap.get(value);
    }

    /**
     * @en Initialize the capabilities of the static collider.
     * @zh 初始化静态碰撞体的能力。
     */
    static initCapable(): void {
        this._staticCapableMap = new Map();
        this._staticCapableMap.set(EColliderCapable.Collider_AllowTrigger, true);
        this._staticCapableMap.set(EColliderCapable.Collider_CollisionGroup, true);
        this._staticCapableMap.set(EColliderCapable.Collider_Friction, true);
        this._staticCapableMap.set(EColliderCapable.Collider_Restitution, true);
        this._staticCapableMap.set(EColliderCapable.Collider_RollingFriction, true);
        this._staticCapableMap.set(EColliderCapable.Collider_DynamicFriction, false);
        this._staticCapableMap.set(EColliderCapable.Collider_StaticFriction, false);
        this._staticCapableMap.set(EColliderCapable.Collider_BounceCombine, true);
        this._staticCapableMap.set(EColliderCapable.Collider_FrictionCombine, true);
        this._staticCapableMap.set(EColliderCapable.Collider_EventFilter, false);
        this._staticCapableMap.set(EColliderCapable.Collider_CollisionDetectionMode, false);
        this._staticCapableMap.set(EColliderCapable.RigidBody_AllowSleep, true);
    }

    /**
     * @en Set the world position of the static collider.
     * @param value The world position.
     * @zh 设置静态碰撞体的世界坐标位置。
     * @param value 坐标位置。
     */
    setWorldPosition(value: Vector3): void {
        var btColliderObject = this._btCollider;
        btStatics.bt.btRigidBody_setCenterOfMassPos(btColliderObject, value.x, value.y, value.z);
    }

    /**
     * @en Destroy Static Collider
     * @zh 销毁静态碰撞器
     */
    destroy(): void {
        this._btCollider = null;
        Physics3DStatInfo.addStatisticsInfo(EPhysicsStatisticsInfo.C_PhysicaStaticRigidBody, -1);
    }

}