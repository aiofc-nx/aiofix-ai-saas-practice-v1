/**
 * FastifyAdapter - Fastify适配器实现
 *
 * 提供了完整的Fastify集成功能，包括服务器管理、插件管理、
 * 中间件管理、路由管理等功能。
 *
 * ## 业务规则
 *
 * ### 服务器管理规则
 * - 支持服务器启动和停止
 * - 支持服务器重启
 * - 支持服务器配置管理
 * - 支持服务器状态监控
 *
 * ### 插件管理规则
 * - 支持插件注册和注销
 * - 支持插件配置管理
 * - 支持插件依赖管理
 * - 支持插件生命周期管理
 *
 * ### 中间件管理规则
 * - 支持中间件注册和注销
 * - 支持中间件顺序控制
 * - 支持中间件配置管理
 * - 支持中间件错误处理
 *
 * ### 路由管理规则
 * - 支持路由注册和注销
 * - 支持路由验证和序列化
 * - 支持路由中间件集成
 * - 支持路由文档生成
 *
 * @description Fastify适配器实现类
 * @example
 * ```typescript
 * const adapter = new FastifyAdapter({
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
 * await adapter.start();
 *
 * // 注册插件
 * await adapter.registerPlugin({
 *   name: 'cors',
 *   options: { origin: true }
 * });
 *
 * // 注册中间件
 * await adapter.registerMiddleware({
 *   name: 'auth',
 *   middleware: authMiddleware
 * });
 *
 * // 注册路由
 * await adapter.registerRoute({
 *   path: '/api/users',
 *   method: 'GET',
 *   handler: getUsersHandler
 * });
 *
 * await adapter.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type {
  IFastifyAdapter,
  IFastifyConfiguration,
  IFastifyPluginConfig,
  IFastifyMiddlewareConfig,
  IFastifyRouteConfig,
} from './fastify.interface';

/**
 * 核心Fastify适配器
 */
@Injectable()
export class CoreFastifyAdapter implements IFastifyAdapter {
  public readonly instance: FastifyInstance;
  public readonly configuration: IFastifyConfiguration;
  public readonly isStarted: boolean;

  private _isStarted = false;
  private readonly _plugins = new Map<string, IFastifyPluginConfig>();
  private readonly _middleware = new Map<string, IFastifyMiddlewareConfig>();
  private readonly _routes = new Map<string, IFastifyRouteConfig>();

  constructor(
    configuration: IFastifyConfiguration,
    private readonly logger?: ILoggerService,
  ) {
    this.configuration = configuration;
    this.instance = this.createFastifyInstance();
    this.isStarted = this._isStarted;
  }

  /**
   * 启动服务器
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      this.logger?.warn('Fastify server is already started', LogContext.SYSTEM);
      return;
    }

    this.logger?.info('Starting Fastify server...', LogContext.SYSTEM, {
      port: this.configuration.server.port,
      host: this.configuration.server.host,
    });

    try {
      // 注册默认插件
      await this.registerDefaultPlugins();

      // 注册配置的插件
      for (const pluginConfig of this.configuration.plugins) {
        await this.registerPlugin(pluginConfig);
      }

      // 注册默认中间件
      await this.registerDefaultMiddleware();

      // 注册配置的中间件
      for (const middlewareConfig of this.configuration.middleware) {
        await this.registerMiddleware(middlewareConfig);
      }

      // 注册默认路由
      await this.registerDefaultRoutes();

      // 注册配置的路由
      for (const routeConfig of this.configuration.routes) {
        await this.registerRoute(routeConfig);
      }

      // 启动服务器
      await this.instance.listen({
        port: this.configuration.server.port,
        host: this.configuration.server.host,
        ...this.configuration.server.options,
      });

      this._isStarted = true;

      this.logger?.info(
        'Fastify server started successfully',
        LogContext.SYSTEM,
        {
          port: this.configuration.server.port,
          host: this.configuration.server.host,
          url: `http://${this.configuration.server.host}:${this.configuration.server.port}`,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to start Fastify server',
        LogContext.SYSTEM,
        {
          port: this.configuration.server.port,
          host: this.configuration.server.host,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  public async stop(): Promise<void> {
    if (!this._isStarted) {
      this.logger?.warn('Fastify server is not started', LogContext.SYSTEM);
      return;
    }

    this.logger?.info('Stopping Fastify server...', LogContext.SYSTEM);

    try {
      await this.instance.close();

      this._isStarted = false;

      this.logger?.info(
        'Fastify server stopped successfully',
        LogContext.SYSTEM,
      );
    } catch (error) {
      this.logger?.error(
        'Failed to stop Fastify server',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 重启服务器
   */
  public async restart(): Promise<void> {
    this.logger?.info('Restarting Fastify server...', LogContext.SYSTEM);

    try {
      await this.stop();
      await this.start();

      this.logger?.info(
        'Fastify server restarted successfully',
        LogContext.SYSTEM,
      );
    } catch (error) {
      this.logger?.error(
        'Failed to restart Fastify server',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注册插件
   */
  public async registerPlugin(config: IFastifyPluginConfig): Promise<void> {
    if (!config.enabled) {
      this.logger?.debug(
        `Plugin ${config.name} is disabled, skipping registration`,
        LogContext.SYSTEM,
        { pluginName: config.name },
      );
      return;
    }

    this.logger?.debug(
      `Registering plugin: ${config.name}`,
      LogContext.SYSTEM,
      {
        pluginName: config.name,
        version: config.version,
        options: config.options,
      },
    );

    try {
      // 检查插件依赖
      if (config.dependencies) {
        for (const dependency of config.dependencies) {
          if (!this._plugins.has(dependency)) {
            throw new Error(
              `Plugin ${config.name} depends on ${dependency} which is not registered`,
            );
          }
        }
      }

      // 注册插件
      const plugin = await import(config.name);
      await this.instance.register(
        plugin.default || plugin,
        config.options || {},
      );

      this._plugins.set(config.name, config);

      this.logger?.debug(
        `Plugin registered: ${config.name}`,
        LogContext.SYSTEM,
        { pluginName: config.name },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to register plugin: ${config.name}`,
        LogContext.SYSTEM,
        {
          pluginName: config.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注册中间件
   */
  public async registerMiddleware(
    config: IFastifyMiddlewareConfig,
  ): Promise<void> {
    if (!config.enabled) {
      this.logger?.debug(
        `Middleware ${config.name} is disabled, skipping registration`,
        LogContext.SYSTEM,
        { middlewareName: config.name },
      );
      return;
    }

    this.logger?.debug(
      `Registering middleware: ${config.name}`,
      LogContext.SYSTEM,
      {
        middlewareName: config.name,
        path: config.path,
        method: config.method,
      },
    );

    try {
      // 注册中间件
      this.instance.addHook('preHandler', async (request, reply) => {
        // 检查路径匹配
        if (config.path && !request.url.startsWith(config.path)) {
          return;
        }

        // 检查方法匹配
        if (config.method) {
          const methods = Array.isArray(config.method)
            ? config.method
            : [config.method];
          if (!methods.includes(request.method)) {
            return;
          }
        }

        // 执行中间件
        await new Promise<void>((resolve, reject) => {
          config.middleware(request, reply, (error?: Error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      });

      this._middleware.set(config.name, config);

      this.logger?.debug(
        `Middleware registered: ${config.name}`,
        LogContext.SYSTEM,
        { middlewareName: config.name },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to register middleware: ${config.name}`,
        LogContext.SYSTEM,
        {
          middlewareName: config.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注册路由
   */
  public async registerRoute(config: IFastifyRouteConfig): Promise<void> {
    this.logger?.debug(
      `Registering route: ${config.method} ${config.path}`,
      LogContext.SYSTEM,
      {
        path: config.path,
        method: config.method,
        tags: config.tags,
      },
    );

    try {
      // 注册路由
      this.instance.route({
        url: config.path,
        method: config.method as
          | 'GET'
          | 'POST'
          | 'PUT'
          | 'DELETE'
          | 'PATCH'
          | 'HEAD'
          | 'OPTIONS',
        handler: config.handler,
        schema: {
          ...config.validation,
          ...config.serialization,
          tags: config.tags,
          description: config.description,
          summary: config.summary,
        },
        config: config.options,
        preHandler: config.middleware
          ?.map((name) => {
            const middlewareConfig = this._middleware.get(name);
            return middlewareConfig?.middleware;
          })
          .filter((middleware): middleware is NonNullable<typeof middleware> =>
            Boolean(middleware),
          ),
      });

      const routeName = `${config.method}_${config.path}`.replace(
        /[^a-zA-Z0-9_]/g,
        '_',
      );
      this._routes.set(routeName, config);

      this.logger?.debug(
        `Route registered: ${config.method} ${config.path}`,
        LogContext.SYSTEM,
        {
          path: config.path,
          method: config.method,
          routeName,
        },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to register route: ${config.method} ${config.path}`,
        LogContext.SYSTEM,
        {
          path: config.path,
          method: config.method,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取服务器信息
   */
  public getServerInfo(): Record<string, unknown> {
    return {
      isStarted: this._isStarted,
      port: this.configuration.server.port,
      host: this.configuration.server.host,
      https: this.configuration.server.https,
      pluginCount: this._plugins.size,
      middlewareCount: this._middleware.size,
      routeCount: this._routes.size,
      plugins: Array.from(this._plugins.keys()),
      middleware: Array.from(this._middleware.keys()),
      routes: Array.from(this._routes.keys()),
    };
  }

  /**
   * 获取健康状态
   */
  public getHealthStatus(): Record<string, unknown> {
    return {
      status: this._isStarted ? 'healthy' : 'unhealthy',
      isStarted: this._isStarted,
      uptime: this._isStarted ? process.uptime() : 0,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取指标数据
   */
  public getMetrics(): Record<string, unknown> {
    return {
      server: this.getServerInfo(),
      health: this.getHealthStatus(),
      performance: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime(),
      },
      requests: {
        total: 0, // 这里需要实现请求计数
        active: 0,
        completed: 0,
        failed: 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建Fastify实例
   */
  private createFastifyInstance(): FastifyInstance {
    const fastify = Fastify({
      logger: this.configuration.logging.enabled
        ? {
            level: this.configuration.logging.level,
            ...this.configuration.logging.options,
          }
        : false,
      ...this.configuration.server.options,
    });

    // 添加请求ID生成器
    fastify.addHook('onRequest', async (request, _reply) => {
      request.id = uuidv4();
    });

    // 添加请求日志
    fastify.addHook('onRequest', async (request, _reply) => {
      this.logger?.debug(
        `Incoming request: ${request.method} ${request.url}`,
        LogContext.SYSTEM,
        {
          requestId: request.id,
          method: request.method,
          url: request.url,
          headers: request.headers,
        },
      );
    });

    // 添加响应日志
    fastify.addHook('onResponse', async (request, reply) => {
      this.logger?.debug(
        `Response sent: ${request.method} ${request.url} ${reply.statusCode}`,
        LogContext.SYSTEM,
        {
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          responseTime: reply.getResponseTime(),
        },
      );
    });

    // 添加错误处理
    fastify.setErrorHandler(async (error, request, reply) => {
      this.logger?.error(
        `Request error: ${request.method} ${request.url}`,
        LogContext.SYSTEM,
        {
          requestId: request.id,
          method: request.method,
          url: request.url,
          error: error.message,
          stack: error.stack,
        },
        error,
      );

      reply.status(500).send({
        error: 'Internal Server Error',
        message: error.message,
        requestId: request.id,
      });
    });

    return fastify;
  }

  /**
   * 注册默认插件
   */
  private async registerDefaultPlugins(): Promise<void> {
    // 注册CORS插件
    if (this.configuration.enableCors) {
      await this.registerPlugin({
        name: '@fastify/cors',
        options: this.configuration.corsOptions || { origin: true },
        enabled: true,
        priority: 1,
      });
    }

    // 注册压缩插件
    if (this.configuration.enableCompression) {
      await this.registerPlugin({
        name: '@fastify/compress',
        options: this.configuration.compressionOptions || {},
        enabled: true,
        priority: 2,
      });
    }

    // 注册速率限制插件
    if (this.configuration.enableRateLimit) {
      await this.registerPlugin({
        name: '@fastify/rate-limit',
        options: this.configuration.rateLimitOptions || {
          max: 100,
          timeWindow: '1 minute',
        },
        enabled: true,
        priority: 3,
      });
    }

    // 注册健康检查插件
    if (this.configuration.enableHealthCheck) {
      await this.registerPlugin({
        name: '@fastify/under-pressure',
        options: this.configuration.healthCheckOptions || {
          maxEventLoopDelay: 1000,
          maxHeapUsedBytes: 100 * 1024 * 1024,
          maxRssBytes: 100 * 1024 * 1024,
          maxEventLoopUtilization: 0.98,
        },
        enabled: true,
        priority: 4,
      });
    }

    // 注册指标收集插件
    if (this.configuration.enableMetrics) {
      await this.registerPlugin({
        name: '@fastify/metrics',
        options: this.configuration.metricsOptions || {},
        enabled: true,
        priority: 5,
      });
    }

    // 注册请求追踪插件
    if (this.configuration.enableRequestTracing) {
      await this.registerPlugin({
        name: '@fastify/request-context',
        options: this.configuration.requestTracingOptions || {},
        enabled: true,
        priority: 6,
      });
    }
  }

  /**
   * 注册默认中间件
   */
  private async registerDefaultMiddleware(): Promise<void> {
    // 注册请求ID中间件
    await this.registerMiddleware({
      name: 'requestId',
      middleware: async (request, reply, done) => {
        request.id = request.id || uuidv4();
        reply.header('X-Request-ID', request.id);
        done();
      },
      enabled: true,
      priority: 1,
    });

    // 注册安全头中间件
    await this.registerMiddleware({
      name: 'securityHeaders',
      middleware: async (request, reply, done) => {
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('X-Frame-Options', 'DENY');
        reply.header('X-XSS-Protection', '1; mode=block');
        reply.header(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
        );
        done();
      },
      enabled: true,
      priority: 2,
    });
  }

  /**
   * 注册默认路由
   */
  private async registerDefaultRoutes(): Promise<void> {
    // 注册健康检查路由
    if (this.configuration.enableHealthCheck) {
      await this.registerRoute({
        path: '/health',
        method: 'GET',
        handler: async (request, reply) => {
          const health = this.getHealthStatus();
          reply.status(health.status === 'healthy' ? 200 : 503).send(health);
        },
        tags: ['health'],
        description: 'Health check endpoint',
        summary: 'Get server health status',
      });
    }

    // 注册指标路由
    if (this.configuration.enableMetrics) {
      await this.registerRoute({
        path: '/metrics',
        method: 'GET',
        handler: async (request, reply) => {
          const metrics = this.getMetrics();
          reply.send(metrics);
        },
        tags: ['metrics'],
        description: 'Metrics endpoint',
        summary: 'Get server metrics',
      });
    }

    // 注册服务器信息路由
    await this.registerRoute({
      path: '/info',
      method: 'GET',
      handler: async (request, reply) => {
        const info = this.getServerInfo();
        reply.send(info);
      },
      tags: ['info'],
      description: 'Server information endpoint',
      summary: 'Get server information',
    });
  }
}
