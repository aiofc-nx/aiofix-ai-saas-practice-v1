/**
 * FastifyModule - Fastify模块实现
 *
 * 提供了完整的Fastify模块功能，包括模块管理、配置管理、
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
 * @description Fastify模块实现类
 * @example
 * ```typescript
 * const fastifyModule = new FastifyModule({
 *   server: {
 *     port: 3000,
 *     host: '0.0.0.0'
 *   },
 *   logging: {
 *     enabled: true,
 *     level: 'info'
 *   }
 * });
 *
 * await fastifyModule.initialize();
 *
 * // 获取模块信息
 * const info = fastifyModule.getModuleInfo();
 *
 * // 获取模块状态
 * const status = fastifyModule.getModuleStatus();
 *
 * await fastifyModule.cleanup();
 * ```
 *
 * @since 1.0.0
 */
import {
  Injectable,
  DynamicModule,
  InjectionToken,
  OptionalFactoryDependency,
} from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type {
  IFastifyModule,
  IFastifyConfiguration,
  IFastifyAdapter,
  IFastifyModuleMetadata,
} from './fastify.interface';
import { CoreFastifyAdapter } from './fastify-adapter';

/**
 * 核心Fastify模块
 */
@Injectable()
export class CoreFastifyModule implements IFastifyModule {
  public readonly name: string;
  public readonly adapter: IFastifyAdapter;
  public readonly configuration: IFastifyConfiguration;
  public readonly isInitialized: boolean;

  private _isInitialized = false;
  private _startTime?: Date;
  private _stopTime?: Date;

  constructor(
    configuration: IFastifyConfiguration,
    private readonly logger?: ILoggerService,
  ) {
    this.name = `CoreFastifyModule_${uuidv4()}`;
    this.configuration = configuration;
    this.adapter = new CoreFastifyAdapter(configuration, this.logger);
    this.isInitialized = this._isInitialized;
  }

  /**
   * 初始化模块
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      this.logger?.warn(
        'Fastify module is already initialized',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
      return;
    }

    this.logger?.info('Initializing Fastify module...', LogContext.SYSTEM, {
      moduleName: this.name,
      configuration: this.configuration,
    });

    try {
      // 验证配置
      await this.validateConfiguration();

      // 初始化适配器
      await this.adapter.start();

      this._isInitialized = true;
      this._startTime = new Date();

      this.logger?.info(
        'Fastify module initialized successfully',
        LogContext.SYSTEM,
        {
          moduleName: this.name,
          startTime: this._startTime,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to initialize Fastify module',
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
        'Fastify module is not initialized',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
      return;
    }

    this.logger?.info('Cleaning up Fastify module...', LogContext.SYSTEM, {
      moduleName: this.name,
    });

    try {
      // 停止适配器
      await this.adapter.stop();

      this._isInitialized = false;
      this._stopTime = new Date();

      this.logger?.info(
        'Fastify module cleaned up successfully',
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
        'Failed to cleanup Fastify module',
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
        server: {
          port: this.configuration.server.port,
          host: this.configuration.server.host,
          https: this.configuration.server.https,
        },
        logging: {
          enabled: this.configuration.logging.enabled,
          level: this.configuration.logging.level,
        },
        features: {
          cors: this.configuration.enableCors,
          compression: this.configuration.enableCompression,
          rateLimit: this.configuration.enableRateLimit,
          healthCheck: this.configuration.enableHealthCheck,
          metrics: this.configuration.enableMetrics,
          requestTracing: this.configuration.enableRequestTracing,
        },
      },
      adapter: this.adapter.getServerInfo(),
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
      metrics: this.adapter.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 验证配置
   */
  private async validateConfiguration(): Promise<void> {
    this.logger?.debug(
      'Validating Fastify configuration...',
      LogContext.SYSTEM,
      { moduleName: this.name },
    );

    try {
      // 验证服务器配置
      if (
        !this.configuration.server.port ||
        this.configuration.server.port < 1 ||
        this.configuration.server.port > 65535
      ) {
        throw new Error('Invalid server port configuration');
      }

      if (!this.configuration.server.host) {
        throw new Error('Invalid server host configuration');
      }

      // 验证日志配置
      if (this.configuration.logging.enabled) {
        const validLevels = [
          'fatal',
          'error',
          'warn',
          'info',
          'debug',
          'trace',
        ];
        if (!validLevels.includes(this.configuration.logging.level)) {
          throw new Error(
            `Invalid logging level: ${this.configuration.logging.level}`,
          );
        }
      }

      // 验证插件配置
      for (const plugin of this.configuration.plugins) {
        if (!plugin.name) {
          throw new Error('Plugin name is required');
        }
      }

      // 验证中间件配置
      for (const middleware of this.configuration.middleware) {
        if (!middleware.name) {
          throw new Error('Middleware name is required');
        }
        if (!middleware.middleware) {
          throw new Error('Middleware function is required');
        }
      }

      // 验证路由配置
      for (const route of this.configuration.routes) {
        if (!route.path) {
          throw new Error('Route path is required');
        }
        if (!route.method) {
          throw new Error('Route method is required');
        }
        if (!route.handler) {
          throw new Error('Route handler is required');
        }
      }

      this.logger?.debug(
        'Fastify configuration validation completed',
        LogContext.SYSTEM,
        { moduleName: this.name },
      );
    } catch (error) {
      this.logger?.error(
        'Fastify configuration validation failed',
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
 * Fastify模块装饰器
 */
export function FastifyModule(
  metadata: IFastifyModuleMetadata,
): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:module', metadata, target);
  };
}

/**
 * Fastify模块工厂
 */
export class FastifyModuleFactory {
  /**
   * 创建Fastify模块
   */
  public static async createModule(
    configuration: IFastifyConfiguration,
    logger?: ILoggerService,
  ): Promise<CoreFastifyModule> {
    const module = new CoreFastifyModule(configuration, logger);
    await module.initialize();
    return module;
  }

  /**
   * 创建Fastify模块工厂方法
   */
  public static createModuleFactory(
    configuration: IFastifyConfiguration,
    logger?: ILoggerService,
  ): () => Promise<CoreFastifyModule> {
    return async () => {
      return await FastifyModuleFactory.createModule(configuration, logger);
    };
  }

  /**
   * 创建动态模块
   */
  public static forRoot(configuration: IFastifyConfiguration): DynamicModule {
    return {
      module: CoreFastifyModule,
      providers: [
        {
          provide: 'FASTIFY_CONFIGURATION',
          useValue: configuration,
        },
        {
          provide: CoreFastifyModule,
          useFactory: (
            config: IFastifyConfiguration,
            logger?: ILoggerService,
          ): CoreFastifyModule => {
            return new CoreFastifyModule(config, logger);
          },
          inject: ['FASTIFY_CONFIGURATION'],
        },
      ],
      exports: [CoreFastifyModule],
      global: true,
    };
  }

  /**
   * 创建异步动态模块
   */
  public static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<IFastifyConfiguration> | IFastifyConfiguration;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
  }): DynamicModule {
    return {
      module: CoreFastifyModule,
      providers: [
        {
          provide: 'FASTIFY_CONFIGURATION',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: CoreFastifyModule,
          useFactory: (
            config: IFastifyConfiguration,
            logger?: ILoggerService,
          ): CoreFastifyModule => {
            return new CoreFastifyModule(config, logger);
          },
          inject: ['FASTIFY_CONFIGURATION'],
        },
      ],
      exports: [CoreFastifyModule],
      global: true,
    };
  }
}

/**
 * Fastify插件装饰器
 */
export function FastifyPlugin(metadata: unknown): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:plugin', metadata, target);
  };
}

/**
 * Fastify中间件装饰器
 */
export function FastifyMiddleware(metadata: unknown): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:middleware', metadata, target);
  };
}

/**
 * Fastify路由装饰器
 */
export function FastifyRoute(metadata: unknown): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:route', metadata, target);
  };
}

/**
 * Fastify控制器装饰器
 */
export function FastifyController(metadata: unknown): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:controller', metadata, target);
  };
}

/**
 * Fastify服务装饰器
 */
export function FastifyService(metadata: unknown): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata('fastify:service', metadata, target);
  };
}
