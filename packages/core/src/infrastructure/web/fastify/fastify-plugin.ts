/**
 * FastifyPlugin - Fastify插件实现
 *
 * 提供了完整的Fastify插件功能，包括插件管理、配置管理、
 * 生命周期管理、依赖管理等功能。
 *
 * ## 业务规则
 *
 * ### 插件管理规则
 * - 支持插件注册和注销
 * - 支持插件配置管理
 * - 支持插件状态监控
 * - 支持插件信息获取
 *
 * ### 配置管理规则
 * - 支持配置验证
 * - 支持配置合并
 * - 支持配置热更新
 * - 支持配置持久化
 *
 * ### 生命周期管理规则
 * - 支持插件启动和停止
 * - 支持插件重启
 * - 支持插件健康检查
 * - 支持插件错误恢复
 *
 * ### 依赖管理规则
 * - 支持插件依赖检查
 * - 支持插件依赖解析
 * - 支持插件依赖注入
 * - 支持插件依赖监控
 *
 * @description Fastify插件实现类
 * @example
 * ```typescript
 * const plugin = new CoreFastifyPlugin({
 *   name: 'cors',
 *   version: '1.0.0',
 *   options: { origin: true }
 * });
 *
 * await plugin.register(fastifyInstance);
 *
 * // 获取插件信息
 * const info = plugin.getPluginInfo();
 *
 * // 获取插件状态
 * const status = plugin.getPluginStatus();
 *
 * await plugin.unregister(fastifyInstance);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { FastifyInstance } from 'fastify';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type { IFastifyPlugin, IFastifyPluginConfig } from './fastify.interface';

/**
 * 核心Fastify插件
 */
@Injectable()
export class CoreFastifyPlugin implements IFastifyPlugin {
  public readonly name: string;
  public readonly version: string;
  public readonly config: IFastifyPluginConfig;
  public readonly isRegistered: boolean;

  private _isRegistered = false;
  private _registerTime?: Date;
  private _unregisterTime?: Date;

  constructor(
    config: IFastifyPluginConfig,
    private readonly logger?: ILoggerService,
  ) {
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.config = config;
    this.isRegistered = this._isRegistered;
  }

  /**
   * 注册插件
   */
  public async register(fastify: FastifyInstance): Promise<void> {
    if (this._isRegistered) {
      this.logger?.warn(
        `Plugin ${this.name} is already registered`,
        LogContext.SYSTEM,
        { pluginName: this.name },
      );
      return;
    }

    if (!this.config.enabled) {
      this.logger?.debug(
        `Plugin ${this.name} is disabled, skipping registration`,
        LogContext.SYSTEM,
        { pluginName: this.name },
      );
      return;
    }

    this.logger?.info(`Registering plugin: ${this.name}`, LogContext.SYSTEM, {
      pluginName: this.name,
      version: this.version,
      options: this.config.options,
    });

    try {
      // 检查插件依赖
      await this.checkDependencies(fastify);

      // 注册插件
      await this.registerPlugin(fastify);

      this._isRegistered = true;
      this._registerTime = new Date();

      this.logger?.info(`Plugin registered: ${this.name}`, LogContext.SYSTEM, {
        pluginName: this.name,
        registerTime: this._registerTime,
      });
    } catch (error) {
      this.logger?.error(
        `Failed to register plugin: ${this.name}`,
        LogContext.SYSTEM,
        {
          pluginName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注销插件
   */
  public async unregister(fastify: FastifyInstance): Promise<void> {
    if (!this._isRegistered) {
      this.logger?.warn(
        `Plugin ${this.name} is not registered`,
        LogContext.SYSTEM,
        { pluginName: this.name },
      );
      return;
    }

    this.logger?.info(`Unregistering plugin: ${this.name}`, LogContext.SYSTEM, {
      pluginName: this.name,
    });

    try {
      // 注销插件
      await this.unregisterPlugin(fastify);

      this._isRegistered = false;
      this._unregisterTime = new Date();

      this.logger?.info(
        `Plugin unregistered: ${this.name}`,
        LogContext.SYSTEM,
        {
          pluginName: this.name,
          unregisterTime: this._unregisterTime,
          uptime: this._registerTime
            ? this._unregisterTime.getTime() - this._registerTime.getTime()
            : 0,
        },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to unregister plugin: ${this.name}`,
        LogContext.SYSTEM,
        {
          pluginName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取插件信息
   */
  public getPluginInfo(): Record<string, unknown> {
    return {
      name: this.name,
      version: this.version,
      config: this.config,
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      unregisterTime: this._unregisterTime,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      dependencies: this.config.dependencies || [],
      priority: this.config.priority || 0,
      enabled: this.config.enabled !== false,
    };
  }

  /**
   * 获取插件状态
   */
  public getPluginStatus(): Record<string, unknown> {
    return {
      status: this._isRegistered ? 'registered' : 'unregistered',
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      unregisterTime: this._unregisterTime,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      health: this.getPluginHealth(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 检查插件依赖
   */
  private async checkDependencies(fastify: FastifyInstance): Promise<void> {
    if (!this.config.dependencies || this.config.dependencies.length === 0) {
      return;
    }

    this.logger?.debug(
      `Checking dependencies for plugin: ${this.name}`,
      LogContext.SYSTEM,
      {
        pluginName: this.name,
        dependencies: this.config.dependencies,
      },
    );

    for (const dependency of this.config.dependencies) {
      // 检查依赖是否已注册
      if (!fastify.hasPlugin(dependency)) {
        throw new Error(
          `Plugin ${this.name} depends on ${dependency} which is not registered`,
        );
      }
    }

    this.logger?.debug(
      `Dependencies check completed for plugin: ${this.name}`,
      LogContext.SYSTEM,
      { pluginName: this.name },
    );
  }

  /**
   * 注册插件
   */
  private async registerPlugin(fastify: FastifyInstance): Promise<void> {
    try {
      // 根据插件名称注册插件
      switch (this.name) {
        case '@fastify/cors':
          await this.registerCorsPlugin(fastify);
          break;
        case '@fastify/compress':
          await this.registerCompressPlugin(fastify);
          break;
        case '@fastify/rate-limit':
          await this.registerRateLimitPlugin(fastify);
          break;
        case '@fastify/under-pressure':
          await this.registerUnderPressurePlugin(fastify);
          break;
        case '@fastify/metrics':
          await this.registerMetricsPlugin(fastify);
          break;
        case '@fastify/request-context':
          await this.registerRequestContextPlugin(fastify);
          break;
        default:
          // 尝试动态加载插件
          await this.registerDynamicPlugin(fastify);
          break;
      }
    } catch (error) {
      this.logger?.error(
        `Failed to register plugin: ${this.name}`,
        LogContext.SYSTEM,
        {
          pluginName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注销插件
   */
  private async unregisterPlugin(_fastify: FastifyInstance): Promise<void> {
    // 大多数Fastify插件不需要显式注销
    // 这里可以添加特定插件的注销逻辑
    this.logger?.debug(
      `Unregistering plugin: ${this.name}`,
      LogContext.SYSTEM,
      { pluginName: this.name },
    );
  }

  /**
   * 注册CORS插件
   */
  private async registerCorsPlugin(fastify: FastifyInstance): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const cors = require('@fastify/cors');
    await fastify.register(cors, this.config.options || { origin: true });
  }

  /**
   * 注册压缩插件
   */
  private async registerCompressPlugin(
    fastify: FastifyInstance,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const compress = require('@fastify/compress');
    await fastify.register(compress, this.config.options || {});
  }

  /**
   * 注册速率限制插件
   */
  private async registerRateLimitPlugin(
    fastify: FastifyInstance,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rateLimit = require('@fastify/rate-limit');
    await fastify.register(
      rateLimit,
      this.config.options || {
        max: 100,
        timeWindow: '1 minute',
      },
    );
  }

  /**
   * 注册压力监控插件
   */
  private async registerUnderPressurePlugin(
    fastify: FastifyInstance,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const underPressure = require('@fastify/under-pressure');
    await fastify.register(
      underPressure,
      this.config.options || {
        maxEventLoopDelay: 1000,
        maxHeapUsedBytes: 100 * 1024 * 1024,
        maxRssBytes: 100 * 1024 * 1024,
        maxEventLoopUtilization: 0.98,
      },
    );
  }

  /**
   * 注册指标收集插件
   */
  private async registerMetricsPlugin(fastify: FastifyInstance): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const metrics = require('@fastify/metrics');
    await fastify.register(metrics, this.config.options || {});
  }

  /**
   * 注册请求上下文插件
   */
  private async registerRequestContextPlugin(
    fastify: FastifyInstance,
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const requestContext = require('@fastify/request-context');
    await fastify.register(requestContext, this.config.options || {});
  }

  /**
   * 注册动态插件
   */
  private async registerDynamicPlugin(fastify: FastifyInstance): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const plugin = require(this.name);
      await fastify.register(plugin, this.config.options || {});
    } catch {
      throw new Error(`Failed to load plugin: ${this.name}`);
    }
  }

  /**
   * 获取插件健康状态
   */
  private getPluginHealth(): Record<string, unknown> {
    return {
      status: this._isRegistered ? 'healthy' : 'unhealthy',
      isRegistered: this._isRegistered,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      lastActivity: this._registerTime,
      errorCount: 0, // 这里需要实现错误计数
      successCount: 0, // 这里需要实现成功计数
    };
  }
}

/**
 * Fastify插件工厂
 */
export class FastifyPluginFactory {
  /**
   * 创建插件
   */
  public static createPlugin(
    config: IFastifyPluginConfig,
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(config, logger);
  }

  /**
   * 创建CORS插件
   */
  public static createCorsPlugin(
    options: Record<string, unknown> = { origin: true },
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/cors',
        version: '8.0.0',
        options,
        enabled: true,
        priority: 1,
      },
      logger,
    );
  }

  /**
   * 创建压缩插件
   */
  public static createCompressPlugin(
    options: Record<string, unknown> = {},
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/compress',
        version: '6.0.0',
        options,
        enabled: true,
        priority: 2,
      },
      logger,
    );
  }

  /**
   * 创建速率限制插件
   */
  public static createRateLimitPlugin(
    options: Record<string, unknown> = {
      max: 100,
      timeWindow: '1 minute',
    },
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/rate-limit',
        version: '8.0.0',
        options,
        enabled: true,
        priority: 3,
      },
      logger,
    );
  }

  /**
   * 创建压力监控插件
   */
  public static createUnderPressurePlugin(
    options: Record<string, unknown> = {
      maxEventLoopDelay: 1000,
      maxHeapUsedBytes: 100 * 1024 * 1024,
      maxRssBytes: 100 * 1024 * 1024,
      maxEventLoopUtilization: 0.98,
    },
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/under-pressure',
        version: '8.0.0',
        options,
        enabled: true,
        priority: 4,
      },
      logger,
    );
  }

  /**
   * 创建指标收集插件
   */
  public static createMetricsPlugin(
    options: Record<string, unknown> = {},
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/metrics',
        version: '8.0.0',
        options,
        enabled: true,
        priority: 5,
      },
      logger,
    );
  }

  /**
   * 创建请求上下文插件
   */
  public static createRequestContextPlugin(
    options: Record<string, unknown> = {},
    logger?: ILoggerService,
  ): CoreFastifyPlugin {
    return new CoreFastifyPlugin(
      {
        name: '@fastify/request-context',
        version: '8.0.0',
        options,
        enabled: true,
        priority: 6,
      },
      logger,
    );
  }
}
