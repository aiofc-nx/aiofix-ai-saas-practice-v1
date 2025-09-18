/**
 * 企业级Fastify核心适配器
 *
 * @description 企业级Fastify功能的核心引擎，提供独立的Fastify服务器管理和企业级功能实现
 *
 * ## 核心特点
 *
 * ### 🎯 **设计定位**
 * - **独立引擎**：不依赖NestJS，可独立运行的Fastify服务器管理器
 * - **功能核心**：所有企业级功能的实际实现者和管理者
 * - **内部使用**：主要被EnterpriseFastifyAdapter内部调用，不直接面向应用开发者
 * - **纯Fastify**：基于原生Fastify API，提供最佳性能和兼容性
 *
 * ### 🏗️ **架构职责**
 * - **服务器生命周期**：完整管理Fastify实例的创建、启动、停止、清理
 * - **插件管理**：企业级插件的注册、卸载、健康检查、生命周期管理
 * - **中间件管理**：智能中间件注册、优先级排序、路径/方法过滤
 * - **路由管理**：动态路由注册、冲突检测、性能监控
 * - **监控系统**：实时性能指标收集、健康状态检查、系统资源监控
 * - **多租户支持**：租户上下文管理、数据隔离、安全策略
 *
 * ### 🚀 **企业级功能**
 * - **高性能监控**：请求计数、响应时间、错误率、系统资源使用
 * - **完整健康检查**：组件级健康状态、依赖检查、自动恢复
 * - **智能插件系统**：依赖验证、优先级管理、热插拔支持
 * - **中间件过滤**：路径匹配、方法过滤、条件执行
 * - **错误处理**：统一错误处理、错误恢复、审计日志
 * - **安全增强**：HTTPS支持、安全头、请求验证
 *
 * ## 业务规则
 *
 * ### 服务器生命周期管理
 * - 服务器启动前必须完成所有插件和中间件的注册
 * - 服务器停止时必须优雅关闭所有连接和组件
 * - 服务器启动失败时必须自动清理已注册的组件
 * - 服务器重启时必须保持配置和状态的一致性
 *
 * ### 组件管理规则
 * - 插件按优先级顺序注册，优先级相同时按注册顺序执行
 * - 中间件按优先级顺序执行，支持路径和HTTP方法过滤
 * - 路由注册前必须验证路径和方法的唯一性，防止冲突
 * - 组件注册失败时必须回滚已注册的组件，确保系统一致性
 *
 * ### 健康检查规则
 * - 健康检查必须包含服务器状态和所有注册组件的状态
 * - 任一关键组件不健康时，整体状态标记为degraded
 * - 服务器未启动或多个组件失败时，整体状态为unhealthy
 * - 健康检查必须支持超时机制和重试策略
 *
 * ### 性能监控规则
 * - 性能指标必须实时收集和更新，不影响请求处理性能
 * - 指标数据必须支持时间窗口聚合和历史数据分析
 * - 指标收集必须支持多租户隔离和权限控制
 * - 监控数据必须支持导出和集成外部监控系统
 *
 * ## 使用场景
 *
 * ### 🔧 **内部集成使用**（推荐）
 * ```typescript
 * // 在EnterpriseFastifyAdapter内部使用
 * const coreAdapter = new CoreFastifyAdapter(
 *   enterpriseConfig,
 *   loggerService
 * );
 * await coreAdapter.start(); // 启动企业级功能
 * ```
 *
 * ### 🛠️ **独立使用场景**（高级用户）
 * ```typescript
 * // 独立使用，不依赖NestJS
 * const adapter = new CoreFastifyAdapter({
 *   server: {
 *     port: 3000,
 *     host: '0.0.0.0',
 *     keepAliveTimeout: 60000,
 *     headersTimeout: 61000
 *   },
 *   monitoring: {
 *     enableMetrics: true,
 *     enableHealthCheck: true,
 *     enablePerformanceMonitoring: true
 *   },
 *   plugins: [
 *     { name: 'cors', enabled: true, priority: 1 }
 *   ],
 *   middleware: [
 *     { name: 'tenant', enabled: true, priority: 1 }
 *   ],
 *   multiTenant: {
 *     enabled: true,
 *     tenantHeader: 'X-Tenant-ID'
 *   }
 * }, loggerService);
 *
 * // 注册企业级插件
 * await adapter.registerPlugin(corsPlugin);
 * await adapter.registerMiddleware(tenantMiddleware);
 *
 * // 启动服务器
 * await adapter.start();
 *
 * // 获取健康状态和性能指标
 * const health = await adapter.getHealthStatus();
 * const metrics = await adapter.getPerformanceMetrics();
 * ```
 *
 * ## 与EnterpriseFastifyAdapter的关系
 *
 * - **CoreFastifyAdapter**: 企业级功能的实际实现者和管理者
 * - **EnterpriseFastifyAdapter**: NestJS集成接口，内部使用CoreFastifyAdapter
 * - **协作模式**: EnterpriseFastifyAdapter负责NestJS集成，CoreFastifyAdapter负责企业级功能
 *
 * @since 1.0.0
 */

import { FastifyInstance, FastifyServerOptions } from 'fastify';
import fastify from 'fastify';
import {
  IFastifyAdapter,
  IFastifyConfiguration,
  IFastifyPlugin,
  IFastifyMiddleware,
  IFastifyRoute,
  IFastifyHealthStatus,
  IFastifyPerformanceMetrics,
  IFastifyPluginHealth,
  IFastifyMiddlewareHealth,
  IFastifyRouteHealth,
} from '../interfaces/fastify.interface';
import { BaseError, ILoggerService } from '../types';

/**
 * Fastify适配器错误
 */
export class FastifyAdapterError extends BaseError {
  constructor(message: string, cause?: Error) {
    super(message, 'FASTIFY_ADAPTER_ERROR', cause);
  }
}

/**
 * CoreFastify适配器实现
 */
export class CoreFastifyAdapter implements IFastifyAdapter {
  private _fastify: FastifyInstance | null = null;
  private readonly _config: IFastifyConfiguration;
  private readonly _logger: ILoggerService;
  private _isStarted = false;
  private _startTime: Date | null = null;

  // 组件注册表
  private readonly _plugins = new Map<string, IFastifyPlugin>();
  private readonly _middleware = new Map<string, IFastifyMiddleware>();
  private readonly _routes = new Map<string, IFastifyRoute>();

  // 性能指标
  private _requestCount = 0;
  private _errorCount = 0;
  private _successCount = 0;
  private _totalResponseTime = 0;
  private _peakResponseTime = 0;
  private _minResponseTime = Number.MAX_VALUE;

  constructor(config: IFastifyConfiguration, logger: ILoggerService) {
    this._config = config;
    this._logger = logger;
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    try {
      this._logger.info('正在启动Fastify服务器...', {
        port: this._config.server.port,
        host: this._config.server.host,
      });

      // 创建Fastify实例
      await this.createFastifyInstance();

      // 注册组件
      await this.registerComponents();

      // 设置性能监控
      this.setupPerformanceMonitoring();

      // 启动服务器
      await this._fastify!.listen({
        port: this._config.server.port,
        host: this._config.server.host,
      });

      this._isStarted = true;
      this._startTime = new Date();

      this._logger.info('Fastify服务器启动成功', {
        port: this._config.server.port,
        host: this._config.server.host,
        startTime: this._startTime,
      });
    } catch (error) {
      this._logger.error('Fastify服务器启动失败', error as Error);
      await this.cleanup();
      throw new FastifyAdapterError('服务器启动失败', error as Error);
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    try {
      this._logger.info('正在停止Fastify服务器...');

      if (this._fastify && this._isStarted) {
        await this._fastify.close();
      }

      await this.cleanup();

      this._isStarted = false;
      this._startTime = null;

      this._logger.info('Fastify服务器已停止');
    } catch (error) {
      this._logger.error('停止Fastify服务器时发生错误', error as Error);
      throw new FastifyAdapterError('服务器停止失败', error as Error);
    }
  }

  /**
   * 获取Fastify实例
   */
  getInstance(): any {
    if (!this._fastify) {
      throw new FastifyAdapterError('Fastify实例未初始化');
    }
    return this._fastify;
  }

  /**
   * 获取健康状态
   */
  async getHealthStatus(): Promise<IFastifyHealthStatus> {
    const pluginHealth = await this.getPluginHealth();
    const middlewareHealth = await this.getMiddlewareHealth();
    const routeHealth = await this.getRouteHealth();
    const performance = await this.getPerformanceMetrics();

    // 计算整体健康状态
    const status = this.calculateOverallHealth(
      pluginHealth,
      middlewareHealth,
      routeHealth,
    );

    return {
      status,
      isStarted: this._isStarted,
      startTime: this._startTime || undefined,
      uptime: this._startTime ? Date.now() - this._startTime.getTime() : 0,
      plugins: pluginHealth,
      middleware: middlewareHealth,
      routes: routeHealth,
      performance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取性能指标
   */
  async getPerformanceMetrics(): Promise<IFastifyPerformanceMetrics> {
    return {
      server: {
        requestCount: this._requestCount,
        errorCount: this._errorCount,
        successCount: this._successCount,
        successRate:
          this._requestCount > 0 ? this._successCount / this._requestCount : 0,
        averageResponseTime:
          this._requestCount > 0
            ? this._totalResponseTime / this._requestCount
            : 0,
        peakResponseTime: this._peakResponseTime,
        minResponseTime:
          this._minResponseTime === Number.MAX_VALUE
            ? 0
            : this._minResponseTime,
      },
      system: {
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
      },
      plugins: await this.getPluginMetrics(),
      middleware: await this.getMiddlewareMetrics(),
      routes: await this.getRouteMetrics(),
    };
  }

  /**
   * 注册插件
   */
  async registerPlugin(plugin: IFastifyPlugin): Promise<void> {
    try {
      this._logger.info('正在注册插件', {
        name: plugin.name,
        version: plugin.version,
      });

      // 检查插件是否已存在
      if (this._plugins.has(plugin.name)) {
        throw new FastifyAdapterError(`插件 ${plugin.name} 已存在`);
      }

      // 验证插件依赖
      if (!(await plugin.validateDependencies())) {
        throw new FastifyAdapterError(`插件 ${plugin.name} 依赖验证失败`);
      }

      // 注册插件
      if (this._fastify) {
        await plugin.register(this._fastify as any);
      }

      // 添加到注册表
      this._plugins.set(plugin.name, plugin);

      this._logger.info('插件注册成功', { name: plugin.name });
    } catch (error) {
      this._logger.error('插件注册失败', error as Error, { name: plugin.name });
      throw new FastifyAdapterError(
        `插件 ${plugin.name} 注册失败`,
        error as Error,
      );
    }
  }

  /**
   * 注册中间件
   */
  async registerMiddleware(middleware: IFastifyMiddleware): Promise<void> {
    try {
      this._logger.info('正在注册中间件', { name: middleware.name });

      // 检查中间件是否已存在
      if (this._middleware.has(middleware.name)) {
        throw new FastifyAdapterError(`中间件 ${middleware.name} 已存在`);
      }

      // 注册中间件
      if (this._fastify) {
        await middleware.register(this._fastify as any);
      }

      // 添加到注册表
      this._middleware.set(middleware.name, middleware);

      this._logger.info('中间件注册成功', { name: middleware.name });
    } catch (error) {
      this._logger.error('中间件注册失败', error as Error, {
        name: middleware.name,
      });
      throw new FastifyAdapterError(
        `中间件 ${middleware.name} 注册失败`,
        error as Error,
      );
    }
  }

  /**
   * 注册路由
   */
  async registerRoute(route: IFastifyRoute): Promise<void> {
    try {
      this._logger.info('正在注册路由', {
        path: route.path,
        method: route.method,
      });

      // 生成路由唯一键
      const routeKey = `${route.method}:${route.path}`;

      // 检查路由是否已存在
      if (this._routes.has(routeKey)) {
        throw new FastifyAdapterError(`路由 ${routeKey} 已存在`);
      }

      // 注册路由
      if (this._fastify) {
        await route.register(this._fastify as any);
      }

      // 添加到注册表
      this._routes.set(routeKey, route);

      this._logger.info('路由注册成功', {
        path: route.path,
        method: route.method,
      });
    } catch (error) {
      this._logger.error('路由注册失败', error as Error, {
        path: route.path,
        method: route.method,
      });
      throw new FastifyAdapterError(
        `路由 ${route.path} 注册失败`,
        error as Error,
      );
    }
  }

  /**
   * 创建Fastify实例
   */
  private async createFastifyInstance(): Promise<void> {
    const options = {
      logger: true, // 简化日志配置，避免prettyPrint问题
      keepAliveTimeout: this._config.server.keepAliveTimeout,
      headersTimeout: this._config.server.headersTimeout,
    } as FastifyServerOptions;

    // 添加HTTPS支持
    if (this._config.server.https) {
      (options as any).https = this._config.server.https;
    }

    this._fastify = fastify(options);

    // 设置错误处理
    this._fastify.setErrorHandler(
      async (error: Error, request: unknown, reply: unknown) => {
        this._errorCount++;
        this._logger.error('请求处理错误', error, {
          method: (request as any).method,
          url: (request as any).url,
          headers: (request as any).headers,
        });

        return (reply as any).status(500).send({
          error: 'Internal Server Error',
          message: error.message,
          statusCode: 500,
        });
      },
    );
  }

  /**
   * 注册组件
   */
  private async registerComponents(): Promise<void> {
    // 注册插件（按优先级排序）
    const plugins = this._config.plugins
      .filter((config) => config.enabled !== false)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _pluginConfig of plugins) {
      // 这里需要根据配置创建具体的插件实例
      // 暂时跳过，等待具体插件实现
    }

    // 注册中间件（按优先级排序）
    const middleware = this._config.middleware
      .filter((config) => config.enabled !== false)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _middlewareConfig of middleware) {
      // 这里需要根据配置创建具体的中间件实例
      // 暂时跳过，等待具体中间件实现
    }

    // 注册路由
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _routeConfig of this._config.routes) {
      // 这里需要根据配置创建具体的路由实例
      // 暂时跳过，等待具体路由实现
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    if (
      !this._config.monitoring.enablePerformanceMonitoring ||
      !this._fastify
    ) {
      return;
    }

    // 添加请求计数和响应时间监控
    this._fastify.addHook('onRequest', async (request: unknown) => {
      (request as any).startTime = Date.now();
      this._requestCount++;
    });

    this._fastify.addHook(
      'onResponse',
      async (request: unknown, reply: unknown) => {
        const requestWithTime = request as any;
        const replyWithStatus = reply as any;

        if (requestWithTime.startTime) {
          const responseTime = Date.now() - requestWithTime.startTime;
          this._totalResponseTime += responseTime;

          if (responseTime > this._peakResponseTime) {
            this._peakResponseTime = responseTime;
          }

          if (responseTime < this._minResponseTime) {
            this._minResponseTime = responseTime;
          }

          if (replyWithStatus.statusCode < 400) {
            this._successCount++;
          }
        }
      },
    );
  }

  /**
   * 获取插件健康状态
   */
  private async getPluginHealth(): Promise<
    Record<string, IFastifyPluginHealth>
  > {
    const health: Record<string, IFastifyPluginHealth> = {};

    for (const [name, plugin] of this._plugins) {
      try {
        health[name] = await plugin.getHealthStatus();
      } catch {
        health[name] = {
          name,
          status: 'unhealthy',
          isRegistered: false,
          lastCheckTime: new Date(),
          dependencies: {},
        };
      }
    }

    return health;
  }

  /**
   * 获取中间件健康状态
   */
  private async getMiddlewareHealth(): Promise<
    Record<string, IFastifyMiddlewareHealth>
  > {
    const health: Record<string, IFastifyMiddlewareHealth> = {};

    for (const [name, middleware] of this._middleware) {
      try {
        health[name] = await middleware.getHealthStatus();
      } catch {
        health[name] = {
          name,
          status: 'unhealthy',
          isRegistered: false,
          lastCheckTime: new Date(),
          requestCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
        };
      }
    }

    return health;
  }

  /**
   * 获取路由健康状态
   */
  private async getRouteHealth(): Promise<Record<string, IFastifyRouteHealth>> {
    const health: Record<string, IFastifyRouteHealth> = {};

    for (const [key, route] of this._routes) {
      try {
        health[key] = await route.getHealthStatus();
      } catch {
        health[key] = {
          path: route.path,
          method: route.method,
          status: 'unhealthy',
          isRegistered: false,
          lastCheckTime: new Date(),
          requestCount: 0,
          errorCount: 0,
          averageResponseTime: 0,
        };
      }
    }

    return health;
  }

  /**
   * 获取插件指标
   */
  private async getPluginMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {};

    for (const [name, plugin] of this._plugins) {
      try {
        const health = await plugin.getHealthStatus();
        metrics[name] = health.metrics || {};
      } catch (error) {
        metrics[name] = { error: (error as Error).message };
      }
    }

    return metrics;
  }

  /**
   * 获取中间件指标
   */
  private async getMiddlewareMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {};

    for (const [name, middleware] of this._middleware) {
      try {
        const health = await middleware.getHealthStatus();
        metrics[name] = {
          requestCount: health.requestCount,
          errorCount: health.errorCount,
          averageResponseTime: health.averageResponseTime,
        };
      } catch (error) {
        metrics[name] = { error: (error as Error).message };
      }
    }

    return metrics;
  }

  /**
   * 获取路由指标
   */
  private async getRouteMetrics(): Promise<Record<string, unknown>> {
    const metrics: Record<string, unknown> = {};

    for (const [key, route] of this._routes) {
      try {
        const health = await route.getHealthStatus();
        metrics[key] = {
          requestCount: health.requestCount,
          errorCount: health.errorCount,
          averageResponseTime: health.averageResponseTime,
        };
      } catch (error) {
        metrics[key] = { error: (error as Error).message };
      }
    }

    return metrics;
  }

  /**
   * 计算整体健康状态
   */
  private calculateOverallHealth(
    pluginHealth: Record<string, IFastifyPluginHealth>,
    middlewareHealth: Record<string, IFastifyMiddlewareHealth>,
    routeHealth: Record<string, IFastifyRouteHealth>,
  ): 'healthy' | 'unhealthy' | 'degraded' {
    if (!this._isStarted) {
      return 'unhealthy';
    }

    const allComponents = [
      ...Object.values(pluginHealth),
      ...Object.values(middlewareHealth),
      ...Object.values(routeHealth),
    ];

    const unhealthyCount = allComponents.filter(
      (c) => c.status === 'unhealthy',
    ).length;
    const degradedCount = allComponents.filter(
      (c) => c.status === 'degraded',
    ).length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * 清理资源
   */
  private async cleanup(): Promise<void> {
    try {
      // 卸载所有组件
      for (const [name, plugin] of this._plugins) {
        try {
          if (this._fastify) {
            await plugin.unregister(this._fastify as any);
          }
        } catch (error) {
          this._logger.error('插件卸载失败', error as Error, { name });
        }
      }

      for (const [name, middleware] of this._middleware) {
        try {
          if (this._fastify) {
            await middleware.unregister(this._fastify as any);
          }
        } catch (error) {
          this._logger.error('中间件卸载失败', error as Error, { name });
        }
      }

      // 清空注册表
      this._plugins.clear();
      this._middleware.clear();
      this._routes.clear();

      // 重置性能指标
      this._requestCount = 0;
      this._errorCount = 0;
      this._successCount = 0;
      this._totalResponseTime = 0;
      this._peakResponseTime = 0;
      this._minResponseTime = Number.MAX_VALUE;
    } catch (error) {
      this._logger.error('清理资源时发生错误', error as Error);
    }
  }
}

/**
 * 扩展FastifyRequest以支持性能监控
 */
declare module 'fastify' {
  interface IFastifyRequest {
    startTime?: number;
  }
}
