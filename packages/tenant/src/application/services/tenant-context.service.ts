/**
 * 租户上下文服务
 *
 * @description 提供租户业务上下文的管理和验证服务
 * 这是业务层的实现，与Core模块的技术基础设施配合使用
 *
 * ## 业务规则
 *
 * ### 上下文创建规则
 * - 每个HTTP请求都必须有明确的租户上下文
 * - 租户上下文在请求开始时创建，请求结束时销毁
 * - 上下文信息来源于请求头、JWT令牌或域名解析
 * - 无效的租户信息会导致请求被拒绝
 *
 * ### 权限验证规则
 * - 所有业务操作都必须验证租户上下文
 * - 租户状态影响可执行的操作类型
 * - 租户配置决定功能的可用性
 * - 权限检查基于租户和用户的组合
 *
 * @example
 * ```typescript
 * // 注入服务
 * @Injectable()
 * class UserController {
 *   constructor(private readonly tenantContextService: TenantContextService) {}
 *
 *   @Get('/users')
 *   async getUsers(@Req() request: Request) {
 *     // 从请求创建租户上下文
 *     const tenantContext = await this.tenantContextService.fromRequest(request);
 *
 *     // 验证租户状态
 *     if (!tenantContext.canOperate()) {
 *       throw new TenantSuspendedException(tenantContext.tenantId);
 *     }
 *
 *     // 检查功能权限
 *     if (!tenantContext.isFeatureEnabled('user-management')) {
 *       throw new FeatureNotAvailableException('user-management');
 *     }
 *
 *     // 获取用户数据
 *     return this.userService.getUsers();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  TenantContextManager,
  ITenantContextData,
  DataIsolationContext,
  IsolationLevel,
  DataSensitivity,
} from '@aiofix/core';
import {
  Tenant,
  TenantType,
  TenantStatus,
  IsolationStrategy,
  ITenantConfiguration,
} from '../..';
import { EntityId } from '@aiofix/core';

/**
 * 业务租户上下文接口
 */
export interface IBusinessTenantContext {
  /** 租户ID */
  readonly tenantId: EntityId;
  /** 租户代码 */
  readonly tenantCode: string;
  /** 租户名称 */
  readonly tenantName: string;
  /** 租户域名 */
  readonly tenantDomain?: string;
  /** 租户类型 */
  readonly tenantType: TenantType;
  /** 租户状态 */
  readonly tenantStatus: TenantStatus;
  /** 隔离策略 */
  readonly isolationStrategy: IsolationStrategy;
  /** 租户配置 */
  readonly configuration: ITenantConfiguration;
  /** 当前用户ID */
  readonly currentUserId?: EntityId;
  /** 当前组织ID */
  readonly currentOrganizationId?: EntityId;
  /** 当前部门ID */
  readonly currentDepartmentId?: EntityId;
  /** 请求信息 */
  readonly requestInfo?: {
    requestId?: string;
    correlationId?: string;
    userIp?: string;
    userAgent?: string;
    requestSource?: string;
  };
}

/**
 * 租户上下文创建选项
 */
export interface ITenantContextOptions {
  tenantId: EntityId;
  tenantCode: string;
  tenantName: string;
  tenantDomain?: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  isolationStrategy: IsolationStrategy;
  configuration: ITenantConfiguration;
  currentUserId?: EntityId;
  currentOrganizationId?: EntityId;
  currentDepartmentId?: EntityId;
  requestId?: string;
  correlationId?: string;
  userIp?: string;
  userAgent?: string;
  requestSource?: string;
}

/**
 * 业务租户上下文类
 */
export class BusinessTenantContext implements IBusinessTenantContext {
  public readonly tenantId: EntityId;
  public readonly tenantCode: string;
  public readonly tenantName: string;
  public readonly tenantDomain?: string;
  public readonly tenantType: TenantType;
  public readonly tenantStatus: TenantStatus;
  public readonly isolationStrategy: IsolationStrategy;
  public readonly configuration: ITenantConfiguration;
  public readonly currentUserId?: EntityId;
  public readonly currentOrganizationId?: EntityId;
  public readonly currentDepartmentId?: EntityId;
  public readonly requestInfo?: {
    requestId?: string;
    correlationId?: string;
    userIp?: string;
    userAgent?: string;
    requestSource?: string;
  };

  constructor(options: ITenantContextOptions) {
    this.tenantId = options.tenantId;
    this.tenantCode = options.tenantCode;
    this.tenantName = options.tenantName;
    this.tenantDomain = options.tenantDomain;
    this.tenantType = options.tenantType;
    this.tenantStatus = options.tenantStatus;
    this.isolationStrategy = options.isolationStrategy;
    this.configuration = options.configuration;
    this.currentUserId = options.currentUserId;
    this.currentOrganizationId = options.currentOrganizationId;
    this.currentDepartmentId = options.currentDepartmentId;
    this.requestInfo = {
      requestId: options.requestId,
      correlationId: options.correlationId,
      userIp: options.userIp,
      userAgent: options.userAgent,
      requestSource: options.requestSource,
    };
  }

  // ==================== 状态检查方法 ====================

  /**
   * 检查租户是否可以操作
   */
  canOperate(): boolean {
    return (
      this.tenantStatus === TenantStatus.ACTIVE ||
      this.tenantStatus === TenantStatus.TRIAL
    );
  }

  /**
   * 检查租户是否活跃
   */
  isActive(): boolean {
    return this.tenantStatus === TenantStatus.ACTIVE;
  }

  /**
   * 检查租户是否被暂停
   */
  isSuspended(): boolean {
    return this.tenantStatus === TenantStatus.SUSPENDED;
  }

  /**
   * 检查租户是否在试用期
   */
  isTrial(): boolean {
    return this.tenantStatus === TenantStatus.TRIAL;
  }

  /**
   * 检查租户是否过期
   */
  isExpired(): boolean {
    return this.tenantStatus === TenantStatus.EXPIRED;
  }

  // ==================== 功能检查方法 ====================

  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(featureName: string): boolean {
    const enabledFeatures = this.configuration.enabledFeatures || [];
    return enabledFeatures.includes(featureName);
  }

  /**
   * 检查是否为企业级租户
   */
  isEnterpriseTenant(): boolean {
    return (
      this.tenantType === TenantType.ENTERPRISE ||
      this.tenantType === TenantType.CUSTOM
    );
  }

  /**
   * 检查是否为免费租户
   */
  isFreeTenant(): boolean {
    return this.tenantType === TenantType.FREE;
  }

  // ==================== 限制检查方法 ====================

  /**
   * 获取最大用户数限制
   */
  getMaxUsers(): number {
    if (this.configuration.maxUsers !== undefined) {
      return this.configuration.maxUsers;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 5,
      [TenantType.BASIC]: 50,
      [TenantType.PROFESSIONAL]: 500,
      [TenantType.ENTERPRISE]: 10000,
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this.tenantType] || 5;
  }

  /**
   * 获取最大存储空间限制
   */
  getMaxStorage(): number {
    if (this.configuration.maxStorage !== undefined) {
      return this.configuration.maxStorage;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 100, // 100MB
      [TenantType.BASIC]: 1000, // 1GB
      [TenantType.PROFESSIONAL]: 10000, // 10GB
      [TenantType.ENTERPRISE]: 100000, // 100GB
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this.tenantType] || 100;
  }

  /**
   * 获取API调用频率限制
   */
  getApiRateLimit(): number {
    if (this.configuration.apiRateLimit !== undefined) {
      return this.configuration.apiRateLimit;
    }

    const defaultLimits: Record<TenantType, number> = {
      [TenantType.FREE]: 100,
      [TenantType.BASIC]: 1000,
      [TenantType.PROFESSIONAL]: 5000,
      [TenantType.ENTERPRISE]: 20000,
      [TenantType.CUSTOM]: Number.MAX_SAFE_INTEGER,
    };

    return defaultLimits[this.tenantType] || 100;
  }

  // ==================== 隔离上下文创建方法 ====================

  /**
   * 创建数据隔离上下文
   */
  createIsolationContext(
    isolationLevel: IsolationLevel = IsolationLevel.TENANT,
    dataSensitivity: DataSensitivity = DataSensitivity.INTERNAL,
    accessPermissions: string[] = [],
  ): DataIsolationContext {
    return new DataIsolationContext({
      tenantId: this.tenantId,
      organizationId: this.currentOrganizationId,
      departmentId: this.currentDepartmentId,
      userId: this.currentUserId,
      isolationLevel,
      dataSensitivity,
      accessPermissions,
      customAttributes: {
        tenantCode: this.tenantCode,
        tenantType: this.tenantType,
        tenantStatus: this.tenantStatus,
        isolationStrategy: this.isolationStrategy,
        ...this.requestInfo,
      },
    });
  }

  /**
   * 创建用户级隔离上下文
   */
  createUserIsolationContext(
    dataSensitivity: DataSensitivity = DataSensitivity.INTERNAL,
  ): DataIsolationContext {
    if (!this.currentUserId) {
      throw new Error('创建用户隔离上下文需要当前用户ID');
    }

    return this.createIsolationContext(
      IsolationLevel.PERSONAL,
      dataSensitivity,
      ['read', 'write', 'delete'],
    );
  }

  /**
   * 创建部门级隔离上下文
   */
  createDepartmentIsolationContext(
    dataSensitivity: DataSensitivity = DataSensitivity.INTERNAL,
  ): DataIsolationContext {
    if (!this.currentDepartmentId) {
      throw new Error('创建部门隔离上下文需要当前部门ID');
    }

    return this.createIsolationContext(
      IsolationLevel.DEPARTMENT,
      dataSensitivity,
      ['read', 'write', 'share'],
    );
  }

  /**
   * 创建组织级隔离上下文
   */
  createOrganizationIsolationContext(
    dataSensitivity: DataSensitivity = DataSensitivity.INTERNAL,
  ): DataIsolationContext {
    if (!this.currentOrganizationId) {
      throw new Error('创建组织隔离上下文需要当前组织ID');
    }

    return this.createIsolationContext(
      IsolationLevel.ORGANIZATION,
      dataSensitivity,
      ['read', 'write', 'share', 'manage'],
    );
  }

  // ==================== 权限和限制检查 ====================

  /**
   * 检查用户数量限制
   */
  isUserLimitExceeded(currentUserCount: number): boolean {
    return currentUserCount >= this.getMaxUsers();
  }

  /**
   * 检查存储空间限制
   */
  isStorageLimitExceeded(currentStorageUsage: number): boolean {
    return currentStorageUsage >= this.getMaxStorage();
  }

  /**
   * 检查API调用频率限制
   */
  isApiRateLimitExceeded(
    currentApiCalls: number,
    timeWindowMinutes: number = 1,
  ): boolean {
    const rateLimit = this.getApiRateLimit();
    const adjustedLimit = rateLimit * timeWindowMinutes;
    return currentApiCalls >= adjustedLimit;
  }

  // ==================== 工具方法 ====================

  /**
   * 转换为字符串表示
   */
  toString(): string {
    return `BusinessTenantContext(id:${this.tenantId.toString()}, code:${this.tenantCode}, type:${this.tenantType}, status:${this.tenantStatus})`;
  }

  /**
   * 转换为日志对象
   */
  toLogObject(): Record<string, any> {
    return {
      tenantId: this.tenantId.toString(),
      tenantCode: this.tenantCode,
      tenantType: this.tenantType,
      tenantStatus: this.tenantStatus,
      isolationStrategy: this.isolationStrategy,
      currentUserId: this.currentUserId?.toString(),
      currentOrganizationId: this.currentOrganizationId?.toString(),
      currentDepartmentId: this.currentDepartmentId?.toString(),
      ...this.requestInfo,
    };
  }

  /**
   * 转换为JWT payload
   */
  toJwtPayload(): Record<string, any> {
    return {
      tenantId: this.tenantId.toString(),
      tenantCode: this.tenantCode,
      tenantName: this.tenantName,
      tenantType: this.tenantType,
      tenantStatus: this.tenantStatus,
      isolationStrategy: this.isolationStrategy,
      tenantConfiguration: this.configuration,
      userId: this.currentUserId?.toString(),
      organizationId: this.currentOrganizationId?.toString(),
      departmentId: this.currentDepartmentId?.toString(),
      correlationId: this.requestInfo?.correlationId,
    };
  }

  /**
   * 克隆租户上下文
   */
  clone(overrides: Partial<ITenantContextOptions> = {}): BusinessTenantContext {
    return new BusinessTenantContext({
      tenantId: overrides.tenantId || this.tenantId,
      tenantCode: overrides.tenantCode || this.tenantCode,
      tenantName: overrides.tenantName || this.tenantName,
      tenantDomain: overrides.tenantDomain || this.tenantDomain,
      tenantType: overrides.tenantType || this.tenantType,
      tenantStatus: overrides.tenantStatus || this.tenantStatus,
      isolationStrategy: overrides.isolationStrategy || this.isolationStrategy,
      configuration: overrides.configuration || { ...this.configuration },
      currentUserId: overrides.currentUserId || this.currentUserId,
      currentOrganizationId:
        overrides.currentOrganizationId || this.currentOrganizationId,
      currentDepartmentId:
        overrides.currentDepartmentId || this.currentDepartmentId,
      requestId: overrides.requestId || this.requestInfo?.requestId,
      correlationId: overrides.correlationId || this.requestInfo?.correlationId,
      userIp: overrides.userIp || this.requestInfo?.userIp,
      userAgent: overrides.userAgent || this.requestInfo?.userAgent,
      requestSource: overrides.requestSource || this.requestInfo?.requestSource,
    });
  }
}

/**
 * 租户上下文服务
 */
@Injectable()
export class TenantContextService {
  constructor() // 这里应该注入租户仓储或数据服务
  // private readonly tenantRepository: ITenantRepository,
  {}

  /**
   * 从HTTP请求创建租户上下文
   */
  async fromRequest(request: any): Promise<BusinessTenantContext> {
    // 从请求头获取租户信息
    const tenantCode =
      request.headers['x-tenant-code'] ||
      request.headers['x-tenant-id'] ||
      this.extractTenantFromDomain(request.headers.host);

    if (!tenantCode) {
      throw new Error('无法从请求中获取租户信息');
    }

    // 这里应该从数据库获取完整的租户信息
    // const tenant = await this.tenantRepository.findByCode(tenantCode);
    // 当前返回模拟数据
    return new BusinessTenantContext({
      tenantId: EntityId.generate(), // 应该从数据库获取
      tenantCode,
      tenantName: 'Mock Tenant', // 应该从数据库获取
      tenantType: TenantType.BASIC, // 应该从数据库获取
      tenantStatus: TenantStatus.ACTIVE, // 应该从数据库获取
      isolationStrategy: IsolationStrategy.ROW_LEVEL_SECURITY, // 应该从数据库获取
      configuration: {}, // 应该从数据库获取
      currentUserId: request.user?.id
        ? EntityId.fromString(request.user.id)
        : undefined,
      currentOrganizationId: request.user?.organizationId
        ? EntityId.fromString(request.user.organizationId)
        : undefined,
      currentDepartmentId: request.user?.departmentId
        ? EntityId.fromString(request.user.departmentId)
        : undefined,
      requestId: request.id,
      correlationId: request.headers['x-correlation-id'],
      userIp: request.ip,
      userAgent: request.headers['user-agent'],
      requestSource: request.headers['x-request-source'] || 'web',
    });
  }

  /**
   * 从JWT令牌创建租户上下文
   */
  async fromJwtPayload(payload: any): Promise<BusinessTenantContext> {
    if (!payload.tenantId) {
      throw new Error('JWT令牌中缺少租户信息');
    }

    // 这里应该从数据库或缓存中获取完整的租户信息
    return new BusinessTenantContext({
      tenantId: EntityId.fromString(payload.tenantId),
      tenantCode: payload.tenantCode,
      tenantName: payload.tenantName,
      tenantType: payload.tenantType,
      tenantStatus: payload.tenantStatus,
      isolationStrategy: payload.isolationStrategy,
      configuration: payload.tenantConfiguration || {},
      currentUserId: payload.userId
        ? EntityId.fromString(payload.userId)
        : undefined,
      currentOrganizationId: payload.organizationId
        ? EntityId.fromString(payload.organizationId)
        : undefined,
      currentDepartmentId: payload.departmentId
        ? EntityId.fromString(payload.departmentId)
        : undefined,
      correlationId: payload.correlationId,
    });
  }

  /**
   * 将业务上下文转换为技术上下文
   */
  toTechnicalContext(
    businessContext: BusinessTenantContext,
  ): ITenantContextData {
    return {
      tenantId: businessContext.tenantId.toString(),
      tenantCode: businessContext.tenantCode,
      isolationStrategy: businessContext.isolationStrategy,
      databaseConfig: this.getDatabaseConfig(businessContext),
      cachePrefix: `tenant:${businessContext.tenantId.toString()}`,
      createdAt: new Date(),
      userId: businessContext.currentUserId?.toString(),
      organizationId: businessContext.currentOrganizationId?.toString(),
      departmentId: businessContext.currentDepartmentId?.toString(),
      requestId: businessContext.requestInfo?.requestId,
      correlationId: businessContext.requestInfo?.correlationId,
      metadata: {
        tenantName: businessContext.tenantName,
        tenantType: businessContext.tenantType,
        tenantStatus: businessContext.tenantStatus,
        userIp: businessContext.requestInfo?.userIp,
        userAgent: businessContext.requestInfo?.userAgent,
        requestSource: businessContext.requestInfo?.requestSource,
      },
    };
  }

  /**
   * 在业务租户上下文中执行函数
   */
  async runInContext<T>(
    businessContext: BusinessTenantContext,
    fn: () => Promise<T>,
  ): Promise<T> {
    const technicalContext = this.toTechnicalContext(businessContext);
    return TenantContextManager.run(technicalContext, fn);
  }

  // ==================== 私有方法 ====================

  /**
   * 从域名提取租户代码
   */
  private extractTenantFromDomain(host: string): string | null {
    if (!host) return null;

    // 支持子域名模式：tenant-code.example.com
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }

    return null;
  }

  /**
   * 获取数据库配置
   */
  private getDatabaseConfig(
    context: BusinessTenantContext,
  ): ITenantContextData['databaseConfig'] {
    switch (context.isolationStrategy) {
      case IsolationStrategy.DATABASE_PER_TENANT:
        return {
          database: `tenant_${context.tenantCode}`,
          connectionString: `mongodb://localhost:27017/tenant_${context.tenantCode}`,
        };
      case IsolationStrategy.SCHEMA_PER_TENANT:
        return {
          database: 'multi_tenant',
          schema: context.tenantCode,
          connectionString: 'mongodb://localhost:27017/multi_tenant',
        };
      case IsolationStrategy.ROW_LEVEL_SECURITY:
      case IsolationStrategy.HYBRID:
      default:
        return {
          database: 'shared',
          connectionString: 'mongodb://localhost:27017/shared',
        };
    }
  }
}
