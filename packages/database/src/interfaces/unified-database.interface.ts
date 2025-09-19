/**
 * 统一数据库管理系统接口定义
 *
 * @description 定义统一数据库管理系统的核心接口和类型
 * 为整个 AIOFix SAAS 平台提供统一的数据库管理能力
 *
 * ## 设计原则
 *
 * ### 🎯 统一性原则
 * - 所有数据库操作都通过统一的接口管理
 * - 提供一致的连接管理和事务处理机制
 * - 统一的错误处理和性能监控
 *
 * ### 🔒 多租户原则
 * - 原生支持多租户数据隔离
 * - 基于Core模块的租户上下文管理
 * - 支持多种隔离策略（数据库、模式、行级）
 *
 * ### 🚀 性能原则
 * - 智能连接池管理
 * - 查询缓存和优化
 * - 读写分离和负载均衡
 *
 * ### 🔄 CQRS原则
 * - 支持命令查询职责分离
 * - 事件溯源数据库支持
 * - 领域事件持久化
 *
 * @since 1.0.0
 */

// 导入Core模块类型
// 临时类型定义，避免循环依赖
export interface TenantContext {
  tenantId: string;
  tenantCode?: string;
  organizationId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  [key: string]: unknown; // 允许扩展属性
}

/**
 * 数据库连接接口
 */
export interface IDatabaseConnection<T = any> {
  /** 连接名称 */
  readonly name: string;
  /** 连接类型 */
  readonly type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
  /** 是否已连接 */
  readonly isConnected: boolean;
  /** 租户上下文 */
  readonly tenantContext?: TenantContext;

  /**
   * 执行查询
   */
  query<R = T>(sql: string, params?: any[]): Promise<R[]>;

  /**
   * 执行命令
   */
  execute(sql: string, params?: any[]): Promise<IExecuteResult>;

  /**
   * 开始事务
   */
  beginTransaction(): Promise<ITransaction>;

  /**
   * 获取原始连接对象
   */
  getRawConnection(): T;

  /**
   * 关闭连接
   */
  close(): Promise<void>;
}

/**
 * 事务接口
 */
export interface ITransaction {
  /** 事务ID */
  readonly transactionId: string;
  /** 是否活跃 */
  readonly isActive: boolean;
  /** 租户上下文 */
  readonly tenantContext?: TenantContext;

  /**
   * 执行查询
   */
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * 执行命令
   */
  execute(sql: string, params?: any[]): Promise<IExecuteResult>;

  /**
   * 提交事务
   */
  commit(): Promise<void>;

  /**
   * 回滚事务
   */
  rollback(): Promise<void>;

  /**
   * 设置保存点
   */
  savepoint(name: string): Promise<void>;

  /**
   * 回滚到保存点
   */
  rollbackToSavepoint(name: string): Promise<void>;
}

/**
 * 执行结果接口
 */
export interface IExecuteResult {
  /** 影响的行数 */
  affectedRows: number;
  /** 插入的ID（如果适用） */
  insertId?: string | number;
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 是否成功 */
  success: boolean;
}

/**
 * 数据库服务接口
 */
export interface IDatabaseService {
  /**
   * 执行查询
   */
  query<T>(sql: string, params?: any[], options?: QueryOptions): Promise<T[]>;

  /**
   * 执行命令
   */
  execute(
    sql: string,
    params?: any[],
    options?: ExecuteOptions,
  ): Promise<IExecuteResult>;

  /**
   * 获取连接
   */
  getConnection(connectionName?: string): Promise<IDatabaseConnection>;

  /**
   * 执行事务
   */
  executeTransaction<T>(
    operation: (trx: ITransaction) => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T>;

  /**
   * 获取仓储
   */
  getRepository<T>(entityClass: new () => T): Promise<IRepository<T>>;
}

/**
 * 租户感知数据库服务接口
 */
export interface ITenantAwareDatabaseService extends IDatabaseService {
  /**
   * 执行租户隔离的查询
   */
  queryByTenant<T>(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<T[]>;

  /**
   * 执行租户隔离的命令
   */
  executeByTenant(
    sql: string,
    params?: any[],
    tenantContext?: TenantContext,
  ): Promise<IExecuteResult>;

  /**
   * 获取租户感知的仓储
   */
  getTenantRepository<T>(
    entityClass: new () => T,
  ): Promise<ITenantAwareRepository<T>>;

  /**
   * 清理租户数据
   */
  cleanupTenantData(tenantId: string): Promise<ICleanupResult>;
}

/**
 * 仓储接口
 */
export interface IRepository<T> {
  /**
   * 根据ID查找实体
   */
  findById(id: string): Promise<T | null>;

  /**
   * 查找所有实体
   */
  findAll(options?: QueryOptions): Promise<T[]>;

  /**
   * 根据条件查找实体
   */
  findBy(criteria: QueryCriteria, options?: QueryOptions): Promise<T[]>;

  /**
   * 保存实体
   */
  save(entity: T): Promise<void>;

  /**
   * 删除实体
   */
  delete(id: string): Promise<boolean>;

  /**
   * 批量保存
   */
  saveBatch(entities: T[]): Promise<void>;

  /**
   * 计数
   */
  count(criteria?: QueryCriteria): Promise<number>;
}

/**
 * 租户感知仓储接口
 */
export interface ITenantAwareRepository<T> extends IRepository<T> {
  /**
   * 根据租户查找实体
   */
  findByTenant(criteria?: QueryCriteria, options?: QueryOptions): Promise<T[]>;

  /**
   * 保存租户实体
   */
  saveTenant(entity: T, tenantContext?: TenantContext): Promise<void>;

  /**
   * 删除租户实体
   */
  deleteTenant(id: string, tenantContext?: TenantContext): Promise<boolean>;

  /**
   * 租户实体计数
   */
  countByTenant(criteria?: QueryCriteria): Promise<number>;
}

/**
 * 查询选项接口
 */
export interface QueryOptions {
  /** 排序 */
  orderBy?: Record<string, 'ASC' | 'DESC'>;
  /** 限制条数 */
  limit?: number;
  /** 偏移量 */
  offset?: number;
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存TTL */
  cacheTTL?: number;
  /** 超时时间 */
  timeout?: number;
}

/**
 * 执行选项接口
 */
export interface ExecuteOptions {
  /** 超时时间 */
  timeout?: number;
  /** 是否返回详细结果 */
  returnDetails?: boolean;
}

/**
 * 事务选项接口
 */
export interface TransactionOptions {
  /** 隔离级别 */
  isolationLevel?:
    | 'READ_UNCOMMITTED'
    | 'READ_COMMITTED'
    | 'REPEATABLE_READ'
    | 'SERIALIZABLE';
  /** 超时时间 */
  timeout?: number;
  /** 连接名称 */
  connectionName?: string;
  /** 是否只读 */
  readOnly?: boolean;
}

/**
 * 查询条件接口
 */
export interface QueryCriteria {
  /** 字段条件 */
  [field: string]: any;
}

/**
 * 清理结果接口
 */
export interface ICleanupResult {
  /** 总记录数 */
  totalRecords: number;
  /** 删除的记录数 */
  deletedRecords: number;
  /** 失败的记录数 */
  failedRecords: number;
  /** 清理耗时（毫秒） */
  duration: number;
  /** 错误列表 */
  errors?: string[];
}

/**
 * 数据库隔离级别枚举
 */
export enum DatabaseIsolationLevel {
  /** 无隔离 */
  NONE = 'none',
  /** 行级隔离 */
  ROW = 'row',
  /** 模式隔离 */
  SCHEMA = 'schema',
  /** 数据库隔离 */
  DATABASE = 'database',
}

/**
 * 数据库隔离策略接口
 */
export interface IDatabaseIsolationStrategy {
  /**
   * 隔离SQL查询
   */
  isolateQuery(sql: string, context: TenantContext): string;

  /**
   * 隔离查询参数
   */
  isolateParams(params: any[], context: TenantContext): any[];

  /**
   * 获取租户数据库连接配置
   */
  getTenantConnectionConfig(baseConfig: any, context: TenantContext): any;

  /**
   * 验证租户数据访问权限
   */
  validateTenantAccess(sql: string, context: TenantContext): Promise<boolean>;

  /**
   * 清理租户数据
   */
  cleanupTenantData(tenantId: string): Promise<ICleanupResult>;
}

/**
 * 数据库错误类型
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly context: any,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'connection', context, originalError);
    this.name = 'DatabaseConnectionError';
  }
}

export class DatabaseTransactionError extends DatabaseError {
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'transaction', context, originalError);
    this.name = 'DatabaseTransactionError';
  }
}

export class DatabaseQueryError extends DatabaseError {
  constructor(message: string, context: any, originalError?: Error) {
    super(message, 'query', context, originalError);
    this.name = 'DatabaseQueryError';
  }
}

/**
 * 数据库统计信息接口
 */
export interface IDatabaseStats {
  /** 连接数 */
  connections: {
    active: number;
    idle: number;
    total: number;
  };
  /** 查询统计 */
  queries: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
  };
  /** 事务统计 */
  transactions: {
    active: number;
    committed: number;
    rolledBack: number;
    averageTime: number;
  };
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 数据库健康状态接口
 */
export interface IDatabaseHealth {
  /** 整体状态 */
  overall: 'healthy' | 'degraded' | 'unhealthy';
  /** 连接状态 */
  connections: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    errorRate: number;
  }>;
  /** 建议 */
  recommendations: string[];
  /** 检查时间 */
  lastChecked: Date;
}
