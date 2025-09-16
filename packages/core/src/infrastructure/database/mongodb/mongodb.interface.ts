/**
 * MongoDB集成接口定义
 *
 * 定义了MongoDB集成的核心接口，包括适配器、模块、
 * 连接管理、集合管理、索引管理等功能。
 *
 * ## 业务规则
 *
 * ### MongoDB适配器规则
 * - 支持连接管理和池化
 * - 支持数据库操作
 * - 支持事务管理
 * - 支持索引管理
 *
 * ### MongoDB模块规则
 * - 支持模块配置
 * - 支持依赖注入
 * - 支持生命周期管理
 * - 支持健康检查
 *
 * ### 连接管理规则
 * - 支持连接池配置
 * - 支持连接重试
 * - 支持连接监控
 * - 支持连接清理
 *
 * ### 集合管理规则
 * - 支持集合创建和删除
 * - 支持集合配置
 * - 支持集合监控
 * - 支持集合优化
 *
 * @description MongoDB集成接口定义
 * @since 1.0.0
 */

import { ModuleMetadata } from '@nestjs/common';
import {
  MongoClient,
  Db,
  Collection,
  IndexSpecification,
  ClientSession,
  Document,
} from 'mongodb';

/**
 * MongoDB连接配置接口
 */
export interface IMongoDBConnectionConfig {
  /**
   * 连接URI
   */
  uri: string;

  /**
   * 数据库名称
   */
  database: string;

  /**
   * 连接选项
   */
  options?: {
    /**
     * 最大连接池大小
     */
    maxPoolSize?: number;

    /**
     * 最小连接池大小
     */
    minPoolSize?: number;

    /**
     * 连接超时时间（毫秒）
     */
    connectTimeoutMS?: number;

    /**
     * 服务器选择超时时间（毫秒）
     */
    serverSelectionTimeoutMS?: number;

    /**
     * 套接字超时时间（毫秒）
     */
    socketTimeoutMS?: number;

    /**
     * 是否启用SSL
     */
    ssl?: boolean;

    /**
     * 是否启用SSL验证
     */
    sslValidate?: boolean;

    /**
     * 认证数据库
     */
    authSource?: string;

    /**
     * 用户名
     */
    username?: string;

    /**
     * 密码
     */
    password?: string;

    /**
     * 是否启用压缩
     */
    compressors?: string[];

    /**
     * 是否启用重试写入
     */
    retryWrites?: boolean;

    /**
     * 是否启用重试读取
     */
    retryReads?: boolean;

    /**
     * 读取偏好
     */
    readPreference?: string;

    /**
     * 写入关注
     */
    writeConcern?: {
      w?: number | string;
      j?: boolean;
      wtimeout?: number;
    };

    /**
     * 读取关注
     */
    readConcern?: {
      level?: string;
    };

    /**
     * 最大空闲时间（毫秒）
     */
    maxIdleTimeMS?: number;

    /**
     * 心跳频率（毫秒）
     */
    heartbeatFrequencyMS?: number;

    /**
     * 其他选项
     */
    [key: string]: any;
  };
}

/**
 * MongoDB集合配置接口
 */
export interface IMongoDBCollectionConfig {
  /**
   * 集合名称
   */
  name: string;

  /**
   * 集合选项
   */
  options?: {
    /**
     * 是否启用验证
     */
    validator?: any;

    /**
     * 验证级别
     */
    validationLevel?: string;

    /**
     * 验证动作
     */
    validationAction?: string;

    /**
     * 是否启用分片
     */
    shardKey?: any;

    /**
     * 是否启用压缩
     */
    compression?: {
      algorithm?: string;
    };

    /**
     * 存储引擎
     */
    storageEngine?: any;

    /**
     * 其他选项
     */
    [key: string]: any;
  };

  /**
   * 索引配置
   */
  indexes?: IMongoDBIndexConfig[];

  /**
   * 是否启用时间序列
   */
  timeSeries?: {
    timeField: string;
    metaField?: string;
    granularity?: string;
  };

  /**
   * 是否启用变更流
   */
  changeStream?: boolean;

  /**
   * 是否启用全文搜索
   */
  textSearch?: boolean;
}

/**
 * MongoDB索引配置接口
 */
export interface IMongoDBIndexConfig {
  /**
   * 索引键
   */
  key: IndexSpecification;

  /**
   * 索引选项
   */
  options?: {
    /**
     * 索引名称
     */
    name?: string;

    /**
     * 是否唯一
     */
    unique?: boolean;

    /**
     * 是否稀疏
     */
    sparse?: boolean;

    /**
     * 是否部分索引
     */
    partialFilterExpression?: any;

    /**
     * 是否TTL索引
     */
    expireAfterSeconds?: number;

    /**
     * 是否文本索引
     */
    text?: boolean;

    /**
     * 是否地理空间索引
     */
    geo?: boolean;

    /**
     * 是否哈希索引
     */
    hash?: boolean;

    /**
     * 是否通配符索引
     */
    wildcard?: boolean;

    /**
     * 其他选项
     */
    [key: string]: any;
  };
}

/**
 * MongoDB配置接口
 */
export interface IMongoDBConfiguration {
  /**
   * 连接配置
   */
  connection: IMongoDBConnectionConfig;

  /**
   * 集合配置
   */
  collections: IMongoDBCollectionConfig[];

  /**
   * 是否启用连接池
   */
  enableConnectionPool?: boolean;

  /**
   * 连接池配置
   */
  connectionPool?: {
    /**
     * 最大连接数
     */
    maxConnections?: number;

    /**
     * 最小连接数
     */
    minConnections?: number;

    /**
     * 连接超时时间（毫秒）
     */
    connectionTimeout?: number;

    /**
     * 空闲超时时间（毫秒）
     */
    idleTimeout?: number;

    /**
     * 是否启用连接监控
     */
    enableMonitoring?: boolean;

    /**
     * 监控间隔（毫秒）
     */
    monitoringInterval?: number;
  };

  /**
   * 是否启用事务
   */
  enableTransactions?: boolean;

  /**
   * 事务配置
   */
  transactions?: {
    /**
     * 最大重试次数
     */
    maxRetries?: number;

    /**
     * 重试延迟（毫秒）
     */
    retryDelay?: number;

    /**
     * 事务超时时间（毫秒）
     */
    timeout?: number;

    /**
     * 是否启用自动重试
     */
    autoRetry?: boolean;
  };

  /**
   * 是否启用变更流
   */
  enableChangeStreams?: boolean;

  /**
   * 变更流配置
   */
  changeStreams?: {
    /**
     * 是否启用全文档
     */
    fullDocument?: boolean;

    /**
     * 是否启用更新查找
     */
    updateLookup?: boolean;

    /**
     * 是否启用恢复令牌
     */
    resumeAfter?: boolean;

    /**
     * 是否启用开始时间
     */
    startAtOperationTime?: boolean;

    /**
     * 批处理大小
     */
    batchSize?: number;

    /**
     * 最大等待时间（毫秒）
     */
    maxAwaitTimeMS?: number;
  };

  /**
   * 是否启用聚合管道
   */
  enableAggregation?: boolean;

  /**
   * 聚合配置
   */
  aggregation?: {
    /**
     * 是否启用解释
     */
    explain?: boolean;

    /**
     * 是否启用游标
     */
    cursor?: boolean;

    /**
     * 批处理大小
     */
    batchSize?: number;

    /**
     * 最大等待时间（毫秒）
     */
    maxAwaitTimeMS?: number;

    /**
     * 是否启用磁盘使用
     */
    allowDiskUse?: boolean;
  };

  /**
   * 是否启用索引管理
   */
  enableIndexManagement?: boolean;

  /**
   * 索引管理配置
   */
  indexManagement?: {
    /**
     * 是否启用自动创建
     */
    autoCreate?: boolean;

    /**
     * 是否启用自动删除
     */
    autoDelete?: boolean;

    /**
     * 是否启用索引监控
     */
    enableMonitoring?: boolean;

    /**
     * 监控间隔（毫秒）
     */
    monitoringInterval?: number;
  };

  /**
   * 是否启用性能监控
   */
  enablePerformanceMonitoring?: boolean;

  /**
   * 性能监控配置
   */
  performanceMonitoring?: {
    /**
     * 是否启用慢查询日志
     */
    slowQueryLog?: boolean;

    /**
     * 慢查询阈值（毫秒）
     */
    slowQueryThreshold?: number;

    /**
     * 是否启用查询分析
     */
    queryAnalysis?: boolean;

    /**
     * 是否启用索引使用统计
     */
    indexUsageStats?: boolean;

    /**
     * 是否启用连接统计
     */
    connectionStats?: boolean;
  };

  /**
   * 是否启用健康检查
   */
  enableHealthCheck?: boolean;

  /**
   * 健康检查配置
   */
  healthCheck?: {
    /**
     * 检查间隔（毫秒）
     */
    interval?: number;

    /**
     * 超时时间（毫秒）
     */
    timeout?: number;

    /**
     * 是否启用连接检查
     */
    connectionCheck?: boolean;

    /**
     * 是否启用数据库检查
     */
    databaseCheck?: boolean;

    /**
     * 是否启用集合检查
     */
    collectionCheck?: boolean;
  };
}

/**
 * MongoDB适配器接口
 */
export interface IMongoDBAdapter {
  /**
   * MongoDB客户端
   */
  readonly client: MongoClient;

  /**
   * 数据库实例
   */
  readonly database: Db;

  /**
   * 配置
   */
  readonly configuration: IMongoDBConfiguration;

  /**
   * 是否已连接
   */
  readonly isConnected: boolean;

  /**
   * 连接数据库
   */
  connect(): Promise<void>;

  /**
   * 断开数据库连接
   */
  disconnect(): Promise<void>;

  /**
   * 重新连接数据库
   */
  reconnect(): Promise<void>;

  /**
   * 获取集合
   */
  getCollection<T extends Document = Document>(name: string): Collection<T>;

  /**
   * 创建集合
   */
  createCollection<T extends Document = Document>(
    name: string,
    options?: Record<string, unknown>,
  ): Promise<Collection<T>>;

  /**
   * 删除集合
   */
  dropCollection(name: string): Promise<boolean>;

  /**
   * 列出所有集合
   */
  listCollections(): Promise<any[]>;

  /**
   * 创建索引
   */
  createIndex(
    collectionName: string,
    indexSpec: IndexSpecification,
    options?: any,
  ): Promise<string>;

  /**
   * 删除索引
   */
  dropIndex(collectionName: string, indexName: string): Promise<any>;

  /**
   * 列出索引
   */
  listIndexes(collectionName: string): Promise<any[]>;

  /**
   * 开始事务
   */
  startSession(): ClientSession;

  /**
   * 执行事务
   */
  withTransaction<T>(
    session: ClientSession,
    callback: (session: ClientSession) => Promise<T>,
  ): Promise<T>;

  /**
   * 获取连接信息
   */
  getConnectionInfo(): Record<string, unknown>;

  /**
   * 获取健康状态
   */
  getHealthStatus(): Record<string, unknown>;

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): Record<string, unknown>;
}

/**
 * MongoDB模块接口
 */
export interface IMongoDBModule {
  /**
   * 模块名称
   */
  readonly name: string;

  /**
   * 适配器
   */
  readonly adapter: IMongoDBAdapter;

  /**
   * 配置
   */
  readonly configuration: IMongoDBConfiguration;

  /**
   * 是否已初始化
   */
  readonly isInitialized: boolean;

  /**
   * 初始化模块
   */
  initialize(): Promise<void>;

  /**
   * 清理模块
   */
  cleanup(): Promise<void>;

  /**
   * 获取模块信息
   */
  getModuleInfo(): Record<string, unknown>;

  /**
   * 获取模块状态
   */
  getModuleStatus(): Record<string, unknown>;
}

/**
 * MongoDB操作结果接口
 */
export interface IMongoDBOperationResult<T = any> {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 结果数据
   */
  data?: T;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 操作时间（毫秒）
   */
  duration: number;

  /**
   * 操作类型
   */
  operation: string;

  /**
   * 集合名称
   */
  collection: string;

  /**
   * 文档数量
   */
  documentCount?: number;

  /**
   * 修改数量
   */
  modifiedCount?: number;

  /**
   * 删除数量
   */
  deletedCount?: number;

  /**
   * 插入数量
   */
  insertedCount?: number;

  /**
   * 匹配数量
   */
  matchedCount?: number;

  /**
   * 操作ID
   */
  operationId?: string;

  /**
   * 时间戳
   */
  timestamp: Date;
}

/**
 * MongoDB查询选项接口
 */
export interface IMongoDBQueryOptions {
  /**
   * 排序
   */
  sort?: any;

  /**
   * 限制数量
   */
  limit?: number;

  /**
   * 跳过数量
   */
  skip?: number;

  /**
   * 投影
   */
  projection?: any;

  /**
   * 是否启用解释
   */
  explain?: boolean;

  /**
   * 是否启用游标
   */
  cursor?: boolean;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用磁盘使用
   */
  allowDiskUse?: boolean;

  /**
   * 是否启用提示
   */
  hint?: any;

  /**
   * 是否启用注释
   */
  comment?: string;

  /**
   * 是否启用读取偏好
   */
  readPreference?: string;

  /**
   * 是否启用读取关注
   */
  readConcern?: any;

  /**
   * 是否启用写入关注
   */
  writeConcern?: any;

  /**
   * 是否启用会话
   */
  session?: ClientSession;

  /**
   * 其他选项
   */
  [key: string]: any;
}

/**
 * MongoDB聚合选项接口
 */
export interface IMongoDBAggregationOptions extends IMongoDBQueryOptions {
  /**
   * 聚合管道
   */
  pipeline: any[];

  /**
   * 是否启用解释
   */
  explain?: boolean;

  /**
   * 是否启用游标
   */
  cursor?: boolean;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用磁盘使用
   */
  allowDiskUse?: boolean;

  /**
   * 是否启用提示
   */
  hint?: any;

  /**
   * 是否启用注释
   */
  comment?: string;

  /**
   * 是否启用读取偏好
   */
  readPreference?: string;

  /**
   * 是否启用读取关注
   */
  readConcern?: any;

  /**
   * 是否启用会话
   */
  session?: ClientSession;
}

/**
 * MongoDB变更流选项接口
 */
export interface IMongoDBChangeStreamOptions {
  /**
   * 是否启用全文档
   */
  fullDocument?: boolean;

  /**
   * 是否启用更新查找
   */
  updateLookup?: boolean;

  /**
   * 是否启用恢复令牌
   */
  resumeAfter?: any;

  /**
   * 是否启用开始时间
   */
  startAtOperationTime?: any;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用会话
   */
  session?: ClientSession;

  /**
   * 其他选项
   */
  [key: string]: any;
}

/**
 * MongoDB模块元数据接口
 */
export interface IMongoDBModuleMetadata extends ModuleMetadata {
  /**
   * MongoDB配置
   */
  mongodbConfig?: IMongoDBConfiguration;

  /**
   * 是否启用MongoDB
   */
  enableMongoDB?: boolean;

  /**
   * MongoDB集合
   */
  mongodbCollections?: IMongoDBCollectionConfig[];

  /**
   * MongoDB索引
   */
  mongodbIndexes?: IMongoDBIndexConfig[];
}
