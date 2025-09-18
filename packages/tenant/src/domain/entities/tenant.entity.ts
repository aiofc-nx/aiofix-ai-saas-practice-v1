/**
 * 租户实体
 *
 * @description 租户是多租户架构的核心概念，代表一个独立的业务实体。
 * 每个租户拥有独立的数据空间、配置和用户群体。
 *
 * @since 1.0.0
 */

import { BaseAggregateRoot } from '@aiofix/core';
import { EntityId } from '@aiofix/core';
import type { IAuditInfo } from '@aiofix/core';
import {
  TenantCreatedEvent,
  TenantConfigurationUpdatedEvent,
  TenantStatusChangedEvent,
} from '../events/tenant.events';

/**
 * 租户类型枚举
 */
export enum TenantType {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom',
}

/**
 * 租户状态枚举
 */
export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

/**
 * 数据隔离策略枚举
 */
export enum IsolationStrategy {
  DATABASE_PER_TENANT = 'database_per_tenant',
  SCHEMA_PER_TENANT = 'schema_per_tenant',
  ROW_LEVEL_SECURITY = 'row_level_security',
  HYBRID = 'hybrid',
}

/**
 * 租户配置接口
 */
export interface ITenantConfiguration {
  readonly maxUsers?: number;
  readonly maxStorage?: number;
  readonly enabledFeatures?: string[];
  readonly apiRateLimit?: number;
  readonly dataRetentionDays?: number;
  readonly customSettings?: Record<string, unknown>;
}

/**
 * 租户实体类
 */
export class Tenant extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private readonly _code: string,
    private readonly _name: string,
    private readonly _domain: string,
    private readonly _type: TenantType,
    private readonly _isolationStrategy: IsolationStrategy,
    private _status: TenantStatus = TenantStatus.TRIAL,
    private _configuration: ITenantConfiguration = {},
    auditInfo: Partial<IAuditInfo>,
  ) {
    super(id, auditInfo);

    // 验证租户代码格式
    this.validateTenantCode(_code);

    // 验证租户域名格式
    this.validateDomain(_domain);

    // 发布租户创建事件
    this.addDomainEvent(
      new TenantCreatedEvent(
        this.id,
        _code,
        _name,
        _type,
        _isolationStrategy,
        auditInfo.tenantId || 'system',
      ),
    );
  }

  // ==================== 访问器 ====================

  get code(): string {
    return this._code;
  }

  get name(): string {
    return this._name;
  }

  get domain(): string {
    return this._domain;
  }

  get type(): TenantType {
    return this._type;
  }

  get isolationStrategy(): IsolationStrategy {
    return this._isolationStrategy;
  }

  get status(): TenantStatus {
    return this._status;
  }

  get configuration(): Readonly<ITenantConfiguration> {
    return { ...this._configuration };
  }

  // ==================== 状态检查 ====================

  get isActive(): boolean {
    return this._status === TenantStatus.ACTIVE;
  }

  get isSuspended(): boolean {
    return this._status === TenantStatus.SUSPENDED;
  }

  get isTrial(): boolean {
    return this._status === TenantStatus.TRIAL;
  }

  get isExpired(): boolean {
    return this._status === TenantStatus.EXPIRED;
  }

  get canOperate(): boolean {
    return (
      this._status === TenantStatus.ACTIVE ||
      this._status === TenantStatus.TRIAL
    );
  }

  // ==================== 业务方法 ====================

  /**
   * 激活租户
   */
  activate(reason: string = '租户激活'): void {
    if (this._status === TenantStatus.ACTIVE) {
      return;
    }

    if (this._status === TenantStatus.DELETED) {
      throw new Error('无法激活已删除的租户');
    }

    const oldStatus = this._status;
    this._status = TenantStatus.ACTIVE;

    this.addDomainEvent(
      new TenantStatusChangedEvent(
        this.id,
        oldStatus,
        TenantStatus.ACTIVE,
        reason,
        this.tenantId,
      ),
    );
  }

  /**
   * 暂停租户
   */
  suspend(reason: string): void {
    if (this._status === TenantStatus.SUSPENDED) {
      return;
    }

    if (this._status === TenantStatus.DELETED) {
      throw new Error('无法暂停已删除的租户');
    }

    const oldStatus = this._status;
    this._status = TenantStatus.SUSPENDED;

    this.addDomainEvent(
      new TenantStatusChangedEvent(
        this.id,
        oldStatus,
        TenantStatus.SUSPENDED,
        reason,
        this.tenantId,
      ),
    );
  }

  /**
   * 更新租户配置
   */
  updateConfiguration(newConfiguration: Partial<ITenantConfiguration>): void {
    const oldConfiguration = { ...this._configuration };
    this._configuration = {
      ...this._configuration,
      ...newConfiguration,
    };

    this.addDomainEvent(
      new TenantConfigurationUpdatedEvent(
        this.id,
        oldConfiguration,
        this._configuration,
        this.tenantId,
      ),
    );
  }

  // ==================== 配置查询方法 ====================

  getMaxUsers(): number {
    if (this._configuration.maxUsers !== undefined) {
      return this._configuration.maxUsers;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 5,
      [TenantType.BASIC]: 50,
      [TenantType.PROFESSIONAL]: 500,
      [TenantType.ENTERPRISE]: 10000,
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this._type] || 5;
  }

  getMaxStorage(): number {
    if (this._configuration.maxStorage !== undefined) {
      return this._configuration.maxStorage;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 100,
      [TenantType.BASIC]: 1000,
      [TenantType.PROFESSIONAL]: 10000,
      [TenantType.ENTERPRISE]: 100000,
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this._type] || 100;
  }

  isFeatureEnabled(featureName: string): boolean {
    const enabledFeatures = this._configuration.enabledFeatures || [];
    return enabledFeatures.includes(featureName);
  }

  getApiRateLimit(): number {
    if (this._configuration.apiRateLimit !== undefined) {
      return this._configuration.apiRateLimit;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 100,
      [TenantType.BASIC]: 1000,
      [TenantType.PROFESSIONAL]: 5000,
      [TenantType.ENTERPRISE]: 20000,
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this._type] || 100;
  }

  // ==================== 验证方法 ====================

  /**
   * 验证租户代码格式
   */
  private validateTenantCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('租户代码不能为空');
    }

    if (code.length < 3 || code.length > 20) {
      throw new Error('租户代码长度必须在3-20个字符之间');
    }

    const codeRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_]*[a-zA-Z0-9]$/;
    if (!codeRegex.test(code)) {
      throw new Error(
        '租户代码只能包含字母、数字、连字符和下划线，且不能以连字符或下划线开头结尾',
      );
    }
  }

  /**
   * 验证域名格式
   */
  private validateDomain(domain: string): void {
    if (!domain || typeof domain !== 'string') {
      throw new Error('租户域名不能为空');
    }

    const domainRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}\.)*[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      throw new Error('租户域名格式无效');
    }
  }
}
