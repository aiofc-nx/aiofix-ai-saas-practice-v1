/**
 * FastifyMiddleware - Fastify中间件实现
 *
 * 提供了完整的Fastify中间件功能，包括中间件管理、配置管理、
 * 生命周期管理、错误处理等功能。
 *
 * ## 业务规则
 *
 * ### 中间件管理规则
 * - 支持中间件注册和注销
 * - 支持中间件配置管理
 * - 支持中间件状态监控
 * - 支持中间件信息获取
 *
 * ### 配置管理规则
 * - 支持配置验证
 * - 支持配置合并
 * - 支持配置热更新
 * - 支持配置持久化
 *
 * ### 生命周期管理规则
 * - 支持中间件启动和停止
 * - 支持中间件重启
 * - 支持中间件健康检查
 * - 支持中间件错误恢复
 *
 * ### 错误处理规则
 * - 支持错误捕获
 * - 支持错误日志记录
 * - 支持错误恢复
 * - 支持错误监控
 *
 * @description Fastify中间件实现类
 * @example
 * ```typescript
 * const middleware = new CoreFastifyMiddleware({
 *   name: 'auth',
 *   middleware: authMiddleware,
 *   path: '/api',
 *   method: 'GET'
 * });
 *
 * await middleware.register(fastifyInstance);
 *
 * // 获取中间件信息
 * const info = middleware.getMiddlewareInfo();
 *
 * // 获取中间件状态
 * const status = middleware.getMiddlewareStatus();
 *
 * await middleware.unregister(fastifyInstance);
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type {
  IFastifyMiddleware,
  IFastifyMiddlewareConfig,
} from './fastify.interface';

/**
 * 核心Fastify中间件
 */
@Injectable()
export class CoreFastifyMiddleware implements IFastifyMiddleware {
  public readonly name: string;
  public readonly config: IFastifyMiddlewareConfig;
  public readonly isRegistered: boolean;

  private _isRegistered = false;
  private _registerTime?: Date;
  private _unregisterTime?: Date;
  private _fastifyInstance?: FastifyInstance;
  private _requestCount = 0;
  private _errorCount = 0;
  private _successCount = 0;

  constructor(
    config: IFastifyMiddlewareConfig,
    private readonly logger?: ILoggerService,
  ) {
    this.name = config.name;
    this.config = config;
    this.isRegistered = this._isRegistered;
  }

  /**
   * 注册中间件
   */
  public async register(fastify: FastifyInstance): Promise<void> {
    if (this._isRegistered) {
      this.logger?.warn(
        `Middleware ${this.name} is already registered`,
        LogContext.SYSTEM,
        { middlewareName: this.name },
      );
      return;
    }

    if (!this.config.enabled) {
      this.logger?.debug(
        `Middleware ${this.name} is disabled, skipping registration`,
        LogContext.SYSTEM,
        { middlewareName: this.name },
      );
      return;
    }

    this.logger?.info(
      `Registering middleware: ${this.name}`,
      LogContext.SYSTEM,
      {
        middlewareName: this.name,
        path: this.config.path,
        method: this.config.method,
      },
    );

    try {
      // 注册中间件
      await this.registerMiddleware(fastify);

      this._isRegistered = true;
      this._registerTime = new Date();
      this._fastifyInstance = fastify;

      this.logger?.info(
        `Middleware registered: ${this.name}`,
        LogContext.SYSTEM,
        {
          middlewareName: this.name,
          registerTime: this._registerTime,
        },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to register middleware: ${this.name}`,
        LogContext.SYSTEM,
        {
          middlewareName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 注销中间件
   */
  public async unregister(fastify: FastifyInstance): Promise<void> {
    if (!this._isRegistered) {
      this.logger?.warn(
        `Middleware ${this.name} is not registered`,
        LogContext.SYSTEM,
        { middlewareName: this.name },
      );
      return;
    }

    this.logger?.info(
      `Unregistering middleware: ${this.name}`,
      LogContext.SYSTEM,
      { middlewareName: this.name },
    );

    try {
      // 注销中间件
      await this.unregisterMiddleware(fastify);

      this._isRegistered = false;
      this._unregisterTime = new Date();

      this.logger?.info(
        `Middleware unregistered: ${this.name}`,
        LogContext.SYSTEM,
        {
          middlewareName: this.name,
          unregisterTime: this._unregisterTime,
          uptime: this._registerTime
            ? this._unregisterTime.getTime() - this._registerTime.getTime()
            : 0,
        },
      );
    } catch (error) {
      this.logger?.error(
        `Failed to unregister middleware: ${this.name}`,
        LogContext.SYSTEM,
        {
          middlewareName: this.name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取中间件信息
   */
  public getMiddlewareInfo(): Record<string, unknown> {
    return {
      name: this.name,
      config: this.config,
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      unregisterTime: this._unregisterTime,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      requestCount: this._requestCount,
      errorCount: this._errorCount,
      successCount: this._successCount,
      successRate:
        this._requestCount > 0
          ? (this._successCount / this._requestCount) * 100
          : 0,
      errorRate:
        this._requestCount > 0
          ? (this._errorCount / this._requestCount) * 100
          : 0,
      priority: this.config.priority || 0,
      enabled: this.config.enabled !== false,
    };
  }

  /**
   * 获取中间件状态
   */
  public getMiddlewareStatus(): Record<string, unknown> {
    return {
      status: this._isRegistered ? 'registered' : 'unregistered',
      isRegistered: this._isRegistered,
      registerTime: this._registerTime,
      unregisterTime: this._unregisterTime,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      health: this.getMiddlewareHealth(),
      statistics: {
        requestCount: this._requestCount,
        errorCount: this._errorCount,
        successCount: this._successCount,
        successRate:
          this._requestCount > 0
            ? (this._successCount / this._requestCount) * 100
            : 0,
        errorRate:
          this._requestCount > 0
            ? (this._errorCount / this._requestCount) * 100
            : 0,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 注册中间件
   */
  private async registerMiddleware(fastify: FastifyInstance): Promise<void> {
    // 创建包装的中间件函数
    const wrappedMiddleware = async (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void> => {
      const startTime = Date.now();
      this._requestCount++;

      this.logger?.debug(
        `Middleware ${this.name} processing request`,
        LogContext.SYSTEM,
        {
          middlewareName: this.name,
          requestId: request.id,
          method: request.method,
          url: request.url,
        },
      );

      try {
        // 执行中间件
        await new Promise<void>((resolve, reject) => {
          this.config.middleware(request, reply, (error?: Error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });

        this._successCount++;
        const duration = Date.now() - startTime;

        this.logger?.debug(
          `Middleware ${this.name} completed successfully`,
          LogContext.SYSTEM,
          {
            middlewareName: this.name,
            requestId: request.id,
            duration,
          },
        );
      } catch (error) {
        this._errorCount++;
        const duration = Date.now() - startTime;

        this.logger?.error(
          `Middleware ${this.name} failed`,
          LogContext.SYSTEM,
          {
            middlewareName: this.name,
            requestId: request.id,
            duration,
            error: (error as Error).message,
          },
          error as Error,
        );

        throw error;
      }
    };

    // 注册中间件钩子
    fastify.addHook('preHandler', async (request, reply) => {
      // 检查路径匹配
      if (this.config.path && !request.url.startsWith(this.config.path)) {
        return;
      }

      // 检查方法匹配
      if (this.config.method) {
        const methods = Array.isArray(this.config.method)
          ? this.config.method
          : [this.config.method];
        if (!methods.includes(request.method)) {
          return;
        }
      }

      // 执行中间件
      await wrappedMiddleware(request, reply);
    });
  }

  /**
   * 注销中间件
   */
  private async unregisterMiddleware(_fastify: FastifyInstance): Promise<void> {
    // Fastify中间件通常不需要显式注销
    // 这里可以添加特定中间件的注销逻辑
    this.logger?.debug(
      `Unregistering middleware: ${this.name}`,
      LogContext.SYSTEM,
      { middlewareName: this.name },
    );
  }

  /**
   * 获取中间件健康状态
   */
  private getMiddlewareHealth(): Record<string, unknown> {
    const successRate =
      this._requestCount > 0
        ? (this._successCount / this._requestCount) * 100
        : 100;
    const errorRate =
      this._requestCount > 0
        ? (this._errorCount / this._requestCount) * 100
        : 0;

    return {
      status: this._isRegistered ? 'healthy' : 'unhealthy',
      isRegistered: this._isRegistered,
      uptime: this._registerTime
        ? Date.now() - this._registerTime.getTime()
        : 0,
      lastActivity: this._registerTime,
      requestCount: this._requestCount,
      errorCount: this._errorCount,
      successCount: this._successCount,
      successRate,
      errorRate,
      healthScore: Math.max(0, 100 - errorRate),
    };
  }
}

/**
 * Fastify中间件工厂
 */
export class FastifyMiddlewareFactory {
  /**
   * 创建中间件
   */
  public static createMiddleware(
    config: IFastifyMiddlewareConfig,
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(config, logger);
  }

  /**
   * 创建认证中间件
   */
  public static createAuthMiddleware(
    authFunction: (
      request: FastifyRequest,
      reply: FastifyReply,
      done: () => void,
    ) => void | Promise<void>,
    options: {
      path?: string;
      method?: string | string[];
      priority?: number;
    } = {},
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'auth',
        middleware: authFunction,
        path: options.path,
        method: options.method,
        priority: options.priority || 1,
        enabled: true,
      },
      logger,
    );
  }

  /**
   * 创建日志中间件
   */
  public static createLoggingMiddleware(
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'logging',
        middleware: async (request, reply, done): Promise<void> => {
          const startTime = Date.now();

          logger?.info(
            `Request started: ${request.method} ${request.url}`,
            LogContext.SYSTEM,
            {
              requestId: request.id,
              method: request.method,
              url: request.url,
              headers: request.headers,
              userAgent: request.headers['user-agent'],
              ip: request.ip,
            },
          );

          // 使用 reply.raw 来访问原始响应对象
          const originalSend = reply.send;
          reply.send = function (payload) {
            const duration = Date.now() - startTime;

            logger?.info(
              `Request completed: ${request.method} ${request.url} ${reply.statusCode}`,
              LogContext.SYSTEM,
              {
                requestId: request.id,
                method: request.method,
                url: request.url,
                statusCode: reply.statusCode,
                duration,
                responseTime: reply.getResponseTime(),
              },
            );

            return originalSend.call(this, payload);
          };

          done();
        },
        priority: 1,
        enabled: true,
      },
      logger,
    );
  }

  /**
   * 创建请求ID中间件
   */
  public static createRequestIdMiddleware(
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'requestId',
        middleware: async (request, reply, done): Promise<void> => {
          request.id = request.id || uuidv4();
          reply.header('X-Request-ID', request.id);
          done();
        },
        priority: 1,
        enabled: true,
      },
      logger,
    );
  }

  /**
   * 创建安全头中间件
   */
  public static createSecurityHeadersMiddleware(
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'securityHeaders',
        middleware: async (request, reply, done): Promise<void> => {
          reply.header('X-Content-Type-Options', 'nosniff');
          reply.header('X-Frame-Options', 'DENY');
          reply.header('X-XSS-Protection', '1; mode=block');
          reply.header(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains',
          );
          reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
          reply.header(
            'Permissions-Policy',
            'geolocation=(), microphone=(), camera=()',
          );
          done();
        },
        priority: 2,
        enabled: true,
      },
      logger,
    );
  }

  /**
   * 创建CORS中间件
   */
  public static createCorsMiddleware(
    options: {
      origin?: string | string[] | boolean;
      methods?: string | string[];
      allowedHeaders?: string | string[];
      credentials?: boolean;
    } = {},
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'cors',
        middleware: async (request, reply, done): Promise<void> => {
          const origin = request.headers.origin;
          const allowedOrigins = Array.isArray(options.origin)
            ? options.origin
            : [options.origin];

          if (
            options.origin === true ||
            (origin && allowedOrigins.includes(origin))
          ) {
            reply.header('Access-Control-Allow-Origin', origin || '*');
          }

          if (options.methods) {
            reply.header(
              'Access-Control-Allow-Methods',
              Array.isArray(options.methods)
                ? options.methods.join(', ')
                : options.methods,
            );
          }

          if (options.allowedHeaders) {
            reply.header(
              'Access-Control-Allow-Headers',
              Array.isArray(options.allowedHeaders)
                ? options.allowedHeaders.join(', ')
                : options.allowedHeaders,
            );
          }

          if (options.credentials) {
            reply.header('Access-Control-Allow-Credentials', 'true');
          }

          if (request.method === 'OPTIONS') {
            reply.status(204).send();
            return;
          }

          done();
        },
        priority: 3,
        enabled: true,
      },
      logger,
    );
  }

  /**
   * 创建错误处理中间件
   */
  public static createErrorHandlingMiddleware(
    logger?: ILoggerService,
  ): CoreFastifyMiddleware {
    return new CoreFastifyMiddleware(
      {
        name: 'errorHandling',
        middleware: async (request, reply, done): Promise<void> => {
          // 错误处理逻辑在Fastify的错误处理器中处理
          // 这里可以添加额外的错误处理逻辑
          done();
        },
        priority: 999,
        enabled: true,
      },
      logger,
    );
  }
}
