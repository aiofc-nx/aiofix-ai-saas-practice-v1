/**
 * 租户领域事件
 *
 * @description 定义租户相关的领域事件，用于租户生命周期管理和状态变更通知
 * @since 1.0.0
 */

import { BaseDomainEvent } from '@aiofix/core';
import { EntityId } from '@aiofix/core';
import {
  TenantType,
  TenantStatus,
  IsolationStrategy,
  ITenantConfiguration,
} from '../entities/tenant.entity';

/**
 * 租户创建事件
 *
 * @description 当新租户被创建时发布的领域事件
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    tenantId: EntityId,
    public readonly tenantCode: string,
    public readonly tenantName: string,
    public readonly tenantType: TenantType,
    public readonly isolationStrategy: IsolationStrategy,
    tenantIdString: string,
  ) {
    super(tenantId, 1, tenantIdString);
  }

  get eventType(): string {
    return 'TenantCreated';
  }
}

/**
 * 租户配置更新事件
 *
 * @description 当租户配置被更新时发布的领域事件
 */
export class TenantConfigurationUpdatedEvent extends BaseDomainEvent {
  constructor(
    tenantId: EntityId,
    public readonly oldConfiguration: ITenantConfiguration,
    public readonly newConfiguration: ITenantConfiguration,
    tenantIdString: string,
  ) {
    super(tenantId, 1, tenantIdString);
  }

  get eventType(): string {
    return 'TenantConfigurationUpdated';
  }
}

/**
 * 租户状态变更事件
 *
 * @description 当租户状态发生变更时发布的领域事件
 */
export class TenantStatusChangedEvent extends BaseDomainEvent {
  constructor(
    tenantId: EntityId,
    public readonly oldStatus: TenantStatus | string,
    public readonly newStatus: TenantStatus | string,
    public readonly reason: string,
    tenantIdString: string,
  ) {
    super(tenantId, 1, tenantIdString);
  }

  get eventType(): string {
    return 'TenantStatusChanged';
  }
}
