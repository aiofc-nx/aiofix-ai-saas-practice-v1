/**
 * MongoDBModule - MongoDB模块实现
 *
 * 提供了完整的MongoDB模块功能，包括模块管理、配置管理、
 * 生命周期管理、依赖注入等功能。
 *
 * ## 业务规则
 *
 * ### 模块管理规则
 * - 支持模块初始化和清理
 * - 支持模块配置管理
 * - 支持模块状态监控
 * - 支持模块信息获取
 *
 * ### 配置管理规则
 * - 支持配置验证
 * - 支持配置合并
 * - 支持配置热更新
 * - 支持配置持久化
 *
 * ### 生命周期管理规则
 * - 支持模块启动和停止
 * - 支持模块重启
 * - 支持模块健康检查
 * - 支持模块错误恢复
 *
 * ### 依赖注入规则
 * - 支持服务注入
 * - 支持配置注入
 * - 支持事件注入
 * - 支持中间件注入
 *
 * @description MongoDB模块实现类
 * @example
 * ```typescript
 * const mongodbModule = new CoreMongoDBModule({
 *   connection: {
 *     uri: 'mongodb://localhost:27017',
 *     database: 'test_db'
 *   },
 *   collections: [
 *     {
 *       name: 'users',
 *       indexes: [
 *         { key: { email: 1 }, options: { unique: true } }
 *       ]
 *     }
 *   ]
 * });
 *
 * await mongodbModule.initialize();
 *
 * // 获取模块信息
 * const info = mongodbModule.getModuleInfo();
 *
 * // 获取模块状态
 * const status = mongodbModule.getModuleStatus();
 *
 * await mongodbModule.cleanup();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable, DynamicModule } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type {
  IMongoDBModule,
  IMongoDBConfiguration,
  IMongoDBAdapter,
  IMongoDBModuleMetadata,
} from './mongodb.interface';
import { CoreMongoDBAdapter } from './mongodb-adapter';

/**
 * 核心MongoDB模块
 */
@Injectable()
export class CoreMongoDBModule implements IMongoDBModule {
  public readonly name: string;
  public readonly adapter: IMongoDBAdapter;
  public readonly configuration: IMongoDBConfiguration;
  public readonly isInitialized: boolean;

  private _isInitialized = false;
  private _startTime?: Date;
  private _stopTime?: Date;

  constructor(
    configuration: IMongoDBConfiguration,
    private readonly logger?: ILoggerService,
  ) {
    this.name = `CoreMongoDBModule_${uuidv4()}`;
    this.configuration = configuration;
    this.adapter = new CoreMongoDBAdapter(configuration, this.logger);
    this.isInitialized = this._isInitialized;
  }

  /**
   * 初始化模块
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger?.warn(
        'MongoDB module is already initialized',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
      return;
    }

    this.logger?.info('Initializing MongoDB module...', LogContext.SYSTEM, {
      moduleName: this.name,
      configuration: this.configuration,
    });

    try {
      // 验证配置
      await this.validateConfiguration();

      // 初始化适配器
      await this.adapter.connect();

      this._isInitialized = true;
      this._startTime = new Date();

      this.logger?.info(
        'MongoDB module initialized successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          startTime: this._startTime,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to initialize MongoDB module',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 清理模块
   */
  public async cleanup(): Promise<void> {
    if (!this._isInitialized) {
      this.logger?.warn(
        'MongoDB module is not initialized',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
      return;
    }

    this.logger?.info('Cleaning up MongoDB module...', LogContext.SYSTEM, {
      moduleName: this.name,
    });

    try {
      // 停止适配器
      await this.adapter.disconnect();

      this._isInitialized = false;
      this._stopTime = new Date();

      this.logger?.info(
        'MongoDB module cleaned up successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          stopTime: this._stopTime,
          uptime: this._startTime
            ? this._stopTime.getTime() - this._startTime.getTime()
            : 0,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to cleanup MongoDB module',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取模块信息
   */
  public getModuleInfo(): Record<string, unknown> {
    return {
      name: this.name,
      isInitialized: this._isInitialized,
      startTime: this._startTime,
      stopTime: this._stopTime,
      uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
      configuration: {
        connection: {
          uri: this.configuration.connection.uri,
          database: this.configuration.connection.database,
        },
        collections: this.configuration.collections.map((col) => ({
          name: col.name,
          indexes: col.indexes?.length || 0,
        })),
        features: {
          connectionPool: this.configuration.enableConnectionPool,
          transactions: this.configuration.enableTransactions,
          changeStreams: this.configuration.enableChangeStreams,
          aggregation: this.configuration.enableAggregation,
          indexManagement: this.configuration.enableIndexManagement,
          performanceMonitoring: this.configuration.enablePerformanceMonitoring,
          healthCheck: this.configuration.enableHealthCheck,
        },
      },
      adapter: this.adapter.getConnectionInfo(),
    };
  }

  /**
   * 获取模块状态
   */
  public getModuleStatus(): Record<string, unknown> {
    return {
      status: this._isInitialized ? 'running' : 'stopped',
      isInitialized: this._isInitialized,
      startTime: this._startTime,
      stopTime: this._stopTime,
      uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
      health: this.adapter.getHealthStatus(),
      metrics: this.adapter.getPerformanceMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 验证配置
   */
  private async validateConfiguration(): Promise<void> {
    this.logger?.debug(
      'Validating MongoDB configuration...',
      LogContext.SYSTEM,
      { moduleName: this.name },
    );

    try {
      // 验证连接配置
      if (!this.configuration.connection.uri) {
        throw new Error('MongoDB connection URI is required');
      }

      if (!this.configuration.connection.database) {
        throw new Error('MongoDB database name is required');
      }

      // 验证URI格式
      if (
        !this.configuration.connection.uri.startsWith('mongodb://') &&
        !this.configuration.connection.uri.startsWith('mongodb+srv://')
      ) {
        throw new Error('Invalid MongoDB connection URI format');
      }

      // 验证集合配置
      for (const collection of this.configuration.collections) {
        if (!collection.name) {
          throw new Error('Collection name is required');
        }

        // 验证集合名称格式
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(collection.name)) {
          throw new Error(`Invalid collection name: ${collection.name}`);
        }

        // 验证索引配置
        if (collection.indexes) {
          for (const index of collection.indexes) {
            if (!index.key) {
              throw new Error(
                `Index key is required for collection: ${collection.name}`,
              );
            }
          }
        }
      }

      // 验证连接池配置
      if (
        this.configuration.enableConnectionPool &&
        this.configuration.connectionPool
      ) {
        if (
          this.configuration.connectionPool.maxConnections &&
          this.configuration.connectionPool.maxConnections < 1
        ) {
          throw new Error('Maximum connections must be greater than 0');
        }

        if (
          this.configuration.connectionPool.minConnections &&
          this.configuration.connectionPool.minConnections < 0
        ) {
          throw new Error(
            'Minimum connections must be greater than or equal to 0',
          );
        }

        if (
          this.configuration.connectionPool.maxConnections &&
          this.configuration.connectionPool.minConnections &&
          this.configuration.connectionPool.maxConnections <
            this.configuration.connectionPool.minConnections
        ) {
          throw new Error(
            'Maximum connections must be greater than or equal to minimum connections',
          );
        }
      }

      // 验证事务配置
      if (
        this.configuration.enableTransactions &&
        this.configuration.transactions
      ) {
        if (
          this.configuration.transactions.maxRetries &&
          this.configuration.transactions.maxRetries < 0
        ) {
          throw new Error('Maximum retries must be greater than or equal to 0');
        }

        if (
          this.configuration.transactions.retryDelay &&
          this.configuration.transactions.retryDelay < 0
        ) {
          throw new Error('Retry delay must be greater than or equal to 0');
        }

        if (
          this.configuration.transactions.timeout &&
          this.configuration.transactions.timeout < 0
        ) {
          throw new Error(
            'Transaction timeout must be greater than or equal to 0',
          );
        }
      }

      // 验证健康检查配置
      if (
        this.configuration.enableHealthCheck &&
        this.configuration.healthCheck
      ) {
        if (
          this.configuration.healthCheck.interval &&
          this.configuration.healthCheck.interval < 1000
        ) {
          throw new Error('Health check interval must be at least 1000ms');
        }

        if (
          this.configuration.healthCheck.timeout &&
          this.configuration.healthCheck.timeout < 100
        ) {
          throw new Error('Health check timeout must be at least 100ms');
        }
      }

      this.logger?.debug(
        'MongoDB configuration validation completed',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
    } catch (error) {
      this.logger?.error(
        'MongoDB configuration validation failed',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }
}

/**
 * MongoDB模块装饰器
 */
export function MongoDBModule(
  metadata: IMongoDBModuleMetadata,
): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:module', metadata, target);
  };
}

/**
 * MongoDB模块工厂
 */
export class MongoDBModuleFactory {
  /**
   * 创建MongoDB模块
   */
  public static async createModule(
    configuration: IMongoDBConfiguration,
    logger?: ILoggerService,
  ): Promise<CoreMongoDBModule> {
    const module = new CoreMongoDBModule(configuration, logger);
    await module.initialize();
    return module;
  }

  /**
   * 创建MongoDB模块工厂方法
   */
  public static createModuleFactory(
    configuration: IMongoDBConfiguration,
    logger?: ILoggerService,
  ): () => Promise<CoreMongoDBModule> {
    return async () => {
      return await MongoDBModuleFactory.createModule(configuration, logger);
    };
  }

  /**
   * 创建动态模块
   */
  public static forRoot(configuration: IMongoDBConfiguration): DynamicModule {
    return {
      module: CoreMongoDBModule,
      providers: [
        {
          provide: 'MONGODB_CONFIGURATION',
          useValue: configuration,
        },
        {
          provide: CoreMongoDBModule,
          useFactory: (
            config: IMongoDBConfiguration,
            logger?: ILoggerService,
          ) => {
            return new CoreMongoDBModule(config, logger);
          },
          inject: ['MONGODB_CONFIGURATION'],
        },
      ],
      exports: [CoreMongoDBModule],
      global: true,
    };
  }

  /**
   * 创建异步动态模块
   */
  public static forRootAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<IMongoDBConfiguration> | IMongoDBConfiguration;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CoreMongoDBModule,
      providers: [
        {
          provide: 'MONGODB_CONFIGURATION',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: CoreMongoDBModule,
          useFactory: (
            config: IMongoDBConfiguration,
            logger?: ILoggerService,
          ) => {
            return new CoreMongoDBModule(config, logger);
          },
          inject: ['MONGODB_CONFIGURATION'],
        },
      ],
      exports: [CoreMongoDBModule],
      global: true,
    };
  }
}

/**
 * MongoDB集合装饰器
 */
export function MongoDBCollection(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:collection', metadata, target);
  };
}

/**
 * MongoDB索引装饰器
 */
export function MongoDBIndex(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:index', metadata, target);
  };
}

/**
 * MongoDB文档装饰器
 */
export function MongoDBDocument(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:document', metadata, target);
  };
}

/**
 * MongoDB字段装饰器
 */
export function MongoDBField(metadata: any): PropertyDecorator {
  return (target: any, propertyKey: string | symbol) => {
    Reflect.defineMetadata('mongodb:field', metadata, target, propertyKey);
  };
}

/**
 * MongoDB服务装饰器
 */
export function MongoDBService(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:service', metadata, target);
  };
}

/**
 * MongoDB仓库装饰器
 */
export function MongoDBRepository(metadata: any): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata('mongodb:repository', metadata, target);
  };
}
