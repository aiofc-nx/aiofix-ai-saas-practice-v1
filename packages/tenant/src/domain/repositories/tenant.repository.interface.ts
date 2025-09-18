/**
 * 租户仓储接口
 *
 * @description 定义租户数据访问的抽象接口，遵循DDD的仓储模式
 * 提供租户聚合根的持久化和查询功能
 *
 * ## 业务规则
 *
 * ### 数据一致性规则
 * - 租户代码必须全局唯一
 * - 租户域名必须全局唯一
 * - 租户删除是软删除，保留历史记录
 * - 支持事务操作，确保数据一致性
 *
 * ### 查询优化规则
 * - 支持按租户代码、域名、状态等条件查询
 * - 支持分页查询，避免大量数据加载
 * - 支持缓存机制，提高查询性能
 * - 支持索引优化，提高查询效率
 *
 * ### 安全规则
 * - 所有操作都需要适当的权限验证
 * - 敏感信息（如配置）需要加密存储
 * - 审计所有的数据变更操作
 * - 支持数据备份和恢复
 *
 * @example
 * ```typescript
 * @Injectable()
 * class TenantService {
 *   constructor(private readonly tenantRepository: ITenantRepository) {}
 *
 *   async createTenant(command: CreateTenantCommand): Promise<Tenant> {
 *     // 检查租户代码唯一性
 *     const existing = await this.tenantRepository.findByCode(command.code);
 *     if (existing) {
 *       throw new TenantAlreadyExistsError(command.code);
 *     }
 *
 *     // 创建租户
 *     const tenant = new Tenant(
 *       EntityId.generate(),
 *       command.code,
 *       command.name,
 *       command.domain,
 *       command.type,
 *       command.isolationStrategy,
 *       TenantStatus.TRIAL,
 *       command.configuration,
 *       { createdBy: command.createdBy }
 *     );
 *
 *     // 保存租户
 *     await this.tenantRepository.save(tenant);
 *     return tenant;
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '@aiofix/core';
import {
  Tenant,
  TenantType,
  TenantStatus,
  IsolationStrategy,
} from '../entities/tenant.entity';

/**
 * 租户查询选项
 */
export interface ITenantQueryOptions {
  /** 租户状态过滤 */
  status?: TenantStatus[];
  /** 租户类型过滤 */
  type?: TenantType[];
  /** 隔离策略过滤 */
  isolationStrategy?: IsolationStrategy[];
  /** 创建时间范围 */
  createdAt?: {
    from?: Date;
    to?: Date;
  };
  /** 分页选项 */
  pagination?: {
    page: number;
    size: number;
  };
  /** 排序选项 */
  sort?: {
    field: 'code' | 'name' | 'createdAt' | 'updatedAt';
    order: 'asc' | 'desc';
  };
  /** 包含已删除的租户 */
  includeDeleted?: boolean;
}

/**
 * 租户查询结果
 */
export interface ITenantQueryResult {
  /** 租户列表 */
  tenants: Tenant[];
  /** 总数量 */
  total: number;
  /** 当前页 */
  page: number;
  /** 页大小 */
  size: number;
  /** 是否有下一页 */
  hasNext: boolean;
}

/**
 * 租户仓储接口
 */
export interface ITenantRepository {
  /**
   * 保存租户
   *
   * @param tenant 租户聚合根
   * @returns 保存结果
   */
  save(tenant: Tenant): Promise<Tenant>;

  /**
   * 根据ID查找租户
   *
   * @param id 租户ID
   * @returns 租户实体或null
   */
  findById(id: EntityId): Promise<Tenant | null>;

  /**
   * 根据代码查找租户
   *
   * @param code 租户代码
   * @returns 租户实体或null
   */
  findByCode(code: string): Promise<Tenant | null>;

  /**
   * 根据域名查找租户
   *
   * @param domain 租户域名
   * @returns 租户实体或null
   */
  findByDomain(domain: string): Promise<Tenant | null>;

  /**
   * 查询租户列表
   *
   * @param options 查询选项
   * @returns 查询结果
   */
  findMany(options: ITenantQueryOptions): Promise<ITenantQueryResult>;

  /**
   * 获取所有活跃租户
   *
   * @returns 活跃租户列表
   */
  findActiveTenants(): Promise<Tenant[]>;

  /**
   * 获取试用期租户
   *
   * @returns 试用期租户列表
   */
  findTrialTenants(): Promise<Tenant[]>;

  /**
   * 获取过期租户
   *
   * @returns 过期租户列表
   */
  findExpiredTenants(): Promise<Tenant[]>;

  /**
   * 检查租户代码是否存在
   *
   * @param code 租户代码
   * @returns 是否存在
   */
  existsByCode(code: string): Promise<boolean>;

  /**
   * 检查租户域名是否存在
   *
   * @param domain 租户域名
   * @returns 是否存在
   */
  existsByDomain(domain: string): Promise<boolean>;

  /**
   * 更新租户
   *
   * @param tenant 租户聚合根
   * @returns 更新结果
   */
  update(tenant: Tenant): Promise<Tenant>;

  /**
   * 删除租户（软删除）
   *
   * @param id 租户ID
   * @param deletedBy 删除者
   * @param reason 删除原因
   * @returns 删除结果
   */
  delete(id: EntityId, deletedBy: string, reason: string): Promise<boolean>;

  /**
   * 物理删除租户（危险操作）
   *
   * @param id 租户ID
   * @returns 删除结果
   */
  hardDelete(id: EntityId): Promise<boolean>;

  /**
   * 恢复已删除的租户
   *
   * @param id 租户ID
   * @param restoredBy 恢复者
   * @returns 恢复结果
   */
  restore(id: EntityId, restoredBy: string): Promise<Tenant | null>;

  /**
   * 获取租户统计信息
   *
   * @returns 统计信息
   */
  getStatistics(): Promise<{
    total: number;
    byStatus: Record<TenantStatus, number>;
    byType: Record<TenantType, number>;
    byIsolationStrategy: Record<IsolationStrategy, number>;
  }>;

  /**
   * 批量更新租户状态
   *
   * @param ids 租户ID列表
   * @param status 新状态
   * @param updatedBy 更新者
   * @param reason 更新原因
   * @returns 更新数量
   */
  batchUpdateStatus(
    ids: EntityId[],
    status: TenantStatus,
    updatedBy: string,
    reason: string,
  ): Promise<number>;

  /**
   * 清理过期的试用租户
   *
   * @param daysExpired 过期天数
   * @returns 清理数量
   */
  cleanupExpiredTrials(daysExpired: number): Promise<number>;
}
