/**
 * 企业级Fastify适配器
 *
 * @description 基于NestJS官方FastifyAdapter的企业级扩展实现
 *
 * 此实现在保持与NestJS官方适配器兼容的基础上，
 * 添加了企业级功能：健康检查、性能监控、多租户支持等
 *
 * ## 设计理念
 *
 * ### 原生Fastify优先
 * - 保持与NestJS官方FastifyAdapter的接口兼容
 * - 专注于原生Fastify插件和中间件
 * - 充分利用Fastify的性能优势，不引入Express兼容层
 *
 * ### 企业级增强
 * - 完整的健康检查和性能监控
 * - 多租户上下文管理
 * - 插件生命周期管理
 * - 智能中间件管理
 * - 审计日志和安全特性
 *
 * ## 业务规则
 *
 * ### 适配器生命周期
 * - 初始化时注册核心插件（middie、监控等）
 * - 启动时按优先级加载企业级组件
 * - 运行时提供健康检查和性能监控
 * - 关闭时优雅清理所有资源
 *
 * ### 插件管理规则
 * - 支持标准Fastify插件格式
 * - 企业级插件支持生命周期管理
 * - 插件依赖验证和错误恢复
 * - 插件性能监控和健康检查
 *
 * ### 中间件管理规则
 * - 专注于原生Fastify中间件格式
 * - 中间件按优先级和路径过滤执行
 * - 中间件性能监控和错误处理
 * - 多租户上下文在中间件间传递
 *
 * @example
 * ```typescript
 * const adapter = new EnterpriseFastifyAdapter({
 *   logger: true,
 *   enterprise: {
 *     enableHealthCheck: true,
 *     enablePerformanceMonitoring: true,
 *     enableMultiTenant: true,
 *     tenantHeader: 'X-Tenant-ID'
 *   }
 * });
 *
 * const app = await NestFactory.create<NestFastifyApplication>(
 *   AppModule,
 *   adapter
 * );
 * ```
 *
 * @since 1.0.0
 */

// 导入NestJS官方FastifyAdapter作为基类
import { FastifyAdapter } from '@nestjs/platform-fastify';
import {
  FastifyRequest,
  FastifyReply,
  FastifyServerOptions,
  RawServerBase,
  RawServerDefault,
} from 'fastify';
import {
  IFastifyConfiguration,
  IFastifyPlugin,
  IFastifyMiddleware,
  IFastifyHealthStatus,
  IFastifyPerformanceMetrics,
} from '../interfaces/fastify.interface';
import { CoreFastifyAdapter } from './core-fastify.adapter';
import { ILoggerService } from '../types';

/**
 * 企业级Fastify配置接口
 */
export interface IEnterpriseFastifyOptions extends FastifyServerOptions {
  /**
   * 企业级功能配置
   */
  enterprise?: {
    /**
     * 启用健康检查
     */
    enableHealthCheck?: boolean;

    /**
     * 启用性能监控
     */
    enablePerformanceMonitoring?: boolean;

    /**
     * 启用多租户支持
     */
    enableMultiTenant?: boolean;

    /**
     * 租户识别Header
     */
    tenantHeader?: string;

    /**
     * 租户识别Query参数
     */
    tenantQueryParam?: string;

    /**
     * 启用CORS支持
     */
    enableCors?: boolean;

    /**
     * CORS配置
     */
    corsOptions?: {
      origin?: boolean | string | string[] | RegExp;
      credentials?: boolean;
      methods?: string | string[];
      allowedHeaders?: string | string[];
      maxAge?: number;
    };

    /**
     * 自定义日志服务
     */
    logger?: ILoggerService;
  };
}

/**
 * 企业级Fastify适配器
 *
 * 继承NestJS官方FastifyAdapter，添加企业级功能
 */
export class EnterpriseFastifyAdapter<
  TServer extends RawServerBase = RawServerDefault,
> extends FastifyAdapter<TServer> {
  private readonly enterpriseCore: CoreFastifyAdapter;
  private readonly enterpriseConfig: IEnterpriseFastifyOptions['enterprise'];

  constructor(options?: IEnterpriseFastifyOptions) {
    // 调用父类构造函数，传入标准Fastify配置
    const { enterprise, ...fastifyOptions } = options || {};
    super(fastifyOptions as any);

    this.enterpriseConfig = enterprise || {};

    // 创建企业级核心适配器
    this.enterpriseCore = new CoreFastifyAdapter(
      this.createEnterpriseConfig(options),
      this.enterpriseConfig.logger || this.createDefaultLogger(),
    );

    // 初始化企业级功能
    this.initializeEnterpriseFeatures();
  }

  /**
   * 重写listen方法，添加企业级启动逻辑
   */
  override async listen(...args: any[]): Promise<TServer> {
    // 启动企业级核心功能
    if (
      this.enterpriseConfig?.enableHealthCheck ||
      this.enterpriseConfig?.enablePerformanceMonitoring
    ) {
      await this.startEnterpriseFeatures();
    }

    // 调用父类listen方法
    return (super.listen as any)(...args);
  }

  /**
   * 重写close方法，添加企业级清理逻辑
   */
  override async close(): Promise<undefined> {
    // 停止企业级功能
    await this.stopEnterpriseFeatures();

    // 调用父类close方法
    return super.close();
  }

  /**
   * 获取企业级健康状态
   */
  async getHealthStatus(): Promise<IFastifyHealthStatus> {
    return this.enterpriseCore.getHealthStatus();
  }

  /**
   * 获取企业级性能指标
   */
  async getPerformanceMetrics(): Promise<IFastifyPerformanceMetrics> {
    return this.enterpriseCore.getPerformanceMetrics();
  }

  /**
   * 注册企业级插件
   */
  async registerEnterprisePlugin(plugin: IFastifyPlugin): Promise<void> {
    return this.enterpriseCore.registerPlugin(plugin);
  }

  /**
   * 注册企业级中间件
   */
  async registerEnterpriseMiddleware(
    middleware: IFastifyMiddleware,
  ): Promise<void> {
    return this.enterpriseCore.registerMiddleware(middleware);
  }

  /**
   * 创建企业级配置
   */
  private createEnterpriseConfig(
    options?: IEnterpriseFastifyOptions,
  ): IFastifyConfiguration {
    const enterprise = options?.enterprise || {};

    return {
      server: {
        port: 3000, // 默认值，实际由listen方法参数决定
        host: '0.0.0.0',
      },
      plugins: enterprise.enableCors
        ? [
            {
              name: 'cors',
              enabled: true,
              priority: 1,
              options: enterprise.corsOptions || { origin: true },
            },
          ]
        : [],
      middleware: enterprise.enableMultiTenant
        ? [
            {
              name: 'tenant',
              enabled: true,
              priority: 1,
              options: {
                tenantHeader: enterprise.tenantHeader || 'X-Tenant-ID',
                tenantQueryParam: enterprise.tenantQueryParam || 'tenant',
              },
            },
          ]
        : [],
      routes: [],
      monitoring: {
        enableMetrics: enterprise.enablePerformanceMonitoring || false,
        enableHealthCheck: enterprise.enableHealthCheck || false,
        enablePerformanceMonitoring:
          enterprise.enablePerformanceMonitoring || false,
      },
      security: {
        enableHelmet: false,
        enableCORS: enterprise.enableCors || false,
        enableRateLimit: false,
      },
      logging: {
        level: 'info',
        prettyPrint: process.env.NODE_ENV !== 'production',
      },
      multiTenant: {
        enabled: enterprise.enableMultiTenant || false,
        tenantHeader: enterprise.tenantHeader || 'X-Tenant-ID',
        tenantQueryParam: enterprise.tenantQueryParam || 'tenant',
      },
    };
  }

  /**
   * 初始化企业级功能
   */
  private initializeEnterpriseFeatures(): void {
    // 注册企业级钩子到原生Fastify实例
    this.registerEnterpriseHooks();

    // 设置企业级错误处理
    this.setupEnterpriseErrorHandling();
  }

  /**
   * 注册企业级钩子
   */
  private registerEnterpriseHooks(): void {
    const fastifyInstance = (this as any).getInstance();

    // 性能监控钩子
    if (this.enterpriseConfig?.enablePerformanceMonitoring) {
      fastifyInstance.addHook('onRequest', async (request: FastifyRequest) => {
        (request as any).startTime = Date.now();
      });

      fastifyInstance.addHook(
        'onResponse',
        async (request: FastifyRequest, reply: FastifyReply) => {
          const startTime = (request as any).startTime;
          if (startTime) {
            const duration = Date.now() - startTime;
            // 记录性能指标
            this.recordPerformanceMetric(request, reply, duration);
          }
        },
      );
    }

    // 多租户钩子
    if (this.enterpriseConfig?.enableMultiTenant) {
      fastifyInstance.addHook(
        'preHandler',
        async (request: FastifyRequest, reply: FastifyReply) => {
          await this.handleTenantContext(request, reply);
        },
      );
    }
  }

  /**
   * 设置企业级错误处理
   */
  private setupEnterpriseErrorHandling(): void {
    const fastifyInstance = (this as any).getInstance();

    fastifyInstance.setErrorHandler(
      async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
        // 企业级错误处理逻辑
        await this.handleEnterpriseError(error, request, reply);

        // 返回标准错误响应
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: error.message,
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
        });
      },
    );
  }

  /**
   * 启动企业级功能
   */
  private async startEnterpriseFeatures(): Promise<void> {
    // 这里可以启动后台任务，如健康检查定时器等
    if (this.enterpriseConfig?.enableHealthCheck) {
      // 启动健康检查服务
      this.startHealthCheckService();
    }
  }

  /**
   * 停止企业级功能
   */
  private async stopEnterpriseFeatures(): Promise<void> {
    // 停止企业级核心功能
    await this.enterpriseCore.stop();
  }

  /**
   * 记录性能指标
   */
  private recordPerformanceMetric(
    request: FastifyRequest,
    reply: FastifyReply,
    duration: number,
  ): void {
    // 实现性能指标记录逻辑
    const metric = {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      timestamp: new Date(),
    };

    // 这里可以发送到监控系统
    this.enterpriseConfig?.logger?.debug('Performance metric recorded', metric);
  }

  /**
   * 处理租户上下文
   */
  private async handleTenantContext(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    const tenantHeader = this.enterpriseConfig?.tenantHeader || 'X-Tenant-ID';
    const tenantId = request.headers[tenantHeader.toLowerCase()] as string;

    if (tenantId) {
      // 设置租户上下文
      (request as any).tenantId = tenantId;

      this.enterpriseConfig?.logger?.debug('Tenant context set', {
        tenantId,
        method: request.method,
        url: request.url,
      });
    }
  }

  /**
   * 处理企业级错误
   */
  private async handleEnterpriseError(
    error: Error,
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    // 记录详细错误信息
    this.enterpriseConfig?.logger?.error('Enterprise error occurred', error, {
      method: request.method,
      url: request.url,
      tenantId: (request as any).tenantId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    });

    // 可以在这里添加错误通知、告警等逻辑
  }

  /**
   * 启动健康检查服务
   */
  private startHealthCheckService(): void {
    // 注册健康检查路由
    const fastifyInstance = (this as any).getInstance();

    fastifyInstance.get(
      '/health',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const healthStatus = await this.getHealthStatus();
          return reply.send(healthStatus);
        } catch (error) {
          return reply.status(503).send({
            status: 'unhealthy',
            error: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    );

    fastifyInstance.get(
      '/metrics',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          const metrics = await this.getPerformanceMetrics();
          return reply.send(metrics);
        } catch (error) {
          return reply.status(500).send({
            error: 'Failed to get metrics',
            message: (error as Error).message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    );
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 创建默认日志服务
   */
  private createDefaultLogger(): ILoggerService {
    return {
      info: (message: string, context?: unknown): void => {
        // eslint-disable-next-line no-console
        console.log(
          `[INFO] ${message}`,
          context ? JSON.stringify(context) : '',
        );
      },
      error: (message: string, error?: Error, context?: unknown): void => {
        // eslint-disable-next-line no-console
        console.error(
          `[ERROR] ${message}`,
          error?.message || '',
          context ? JSON.stringify(context) : '',
        );
      },
      warn: (message: string, context?: unknown): void => {
        // eslint-disable-next-line no-console
        console.warn(
          `[WARN] ${message}`,
          context ? JSON.stringify(context) : '',
        );
      },
      debug: (message: string, context?: unknown): void => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.debug(
            `[DEBUG] ${message}`,
            context ? JSON.stringify(context) : '',
          );
        }
      },
    };
  }
}
