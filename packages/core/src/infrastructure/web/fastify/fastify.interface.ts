/**
 * Fastify集成接口定义
 *
 * 定义了Fastify集成的核心接口，包括适配器、模块、
 * 插件、中间件、路由等功能。
 *
 * ## 业务规则
 *
 * ### Fastify适配器规则
 * - 支持NestJS到Fastify的适配
 * - 支持请求/响应转换
 * - 支持中间件集成
 * - 支持插件管理
 *
 * ### Fastify模块规则
 * - 支持模块配置
 * - 支持依赖注入
 * - 支持生命周期管理
 * - 支持健康检查
 *
 * ### Fastify插件规则
 * - 支持插件注册
 * - 支持插件配置
 * - 支持插件生命周期
 * - 支持插件依赖管理
 *
 * ### Fastify中间件规则
 * - 支持中间件注册
 * - 支持中间件顺序控制
 * - 支持中间件配置
 * - 支持中间件错误处理
 *
 * @description Fastify集成接口定义
 * @since 1.0.0
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ModuleMetadata } from '@nestjs/common';
import type { IAsyncContext } from '../../../core/context/async-context.interface';

/**
 * Fastify插件配置接口
 */
export interface IFastifyPluginConfig {
  /**
   * 插件名称
   */
  name: string;

  /**
   * 插件版本
   */
  version?: string;

  /**
   * 插件选项
   */
  options?: Record<string, unknown>;

  /**
   * 插件依赖
   */
  dependencies?: string[];

  /**
   * 是否启用插件
   */
  enabled?: boolean;

  /**
   * 插件优先级
   */
  priority?: number;
}

/**
 * Fastify中间件配置接口
 */
export interface IFastifyMiddlewareConfig {
  /**
   * 中间件名称
   */
  name: string;

  /**
   * 中间件函数
   */
  middleware: (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ) => void | Promise<void>;

  /**
   * 中间件选项
   */
  options?: Record<string, unknown>;

  /**
   * 中间件路径
   */
  path?: string;

  /**
   * 中间件方法
   */
  method?: string | string[];

  /**
   * 是否启用中间件
   */
  enabled?: boolean;

  /**
   * 中间件优先级
   */
  priority?: number;
}

/**
 * Fastify路由配置接口
 */
export interface IFastifyRouteConfig {
  /**
   * 路由路径
   */
  path: string;

  /**
   * 路由方法
   */
  method: string | string[];

  /**
   * 路由处理器
   */
  handler: (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void | Promise<void>;

  /**
   * 路由选项
   */
  options?: Record<string, unknown>;

  /**
   * 路由中间件
   */
  middleware?: string[];

  /**
   * 路由验证
   */
  validation?: {
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
  };

  /**
   * 路由序列化
   */
  serialization?: {
    response?: any;
  };

  /**
   * 路由标签
   */
  tags?: string[];

  /**
   * 路由描述
   */
  description?: string;

  /**
   * 路由摘要
   */
  summary?: string;
}

/**
 * Fastify配置接口
 */
export interface IFastifyConfiguration {
  /**
   * 服务器配置
   */
  server: {
    /**
     * 服务器端口
     */
    port: number;

    /**
     * 服务器主机
     */
    host: string;

    /**
     * 是否启用HTTPS
     */
    https?: boolean;

    /**
     * HTTPS证书配置
     */
    httpsOptions?: {
      key: string;
      cert: string;
      ca?: string;
    };

    /**
     * 服务器选项
     */
    options?: Record<string, unknown>;
  };

  /**
   * 日志配置
   */
  logging: {
    /**
     * 是否启用日志
     */
    enabled: boolean;

    /**
     * 日志级别
     */
    level: string;

    /**
     * 日志格式
     */
    format?: string;

    /**
     * 日志选项
     */
    options?: Record<string, unknown>;
  };

  /**
   * 插件配置
   */
  plugins: IFastifyPluginConfig[];

  /**
   * 中间件配置
   */
  middleware: IFastifyMiddlewareConfig[];

  /**
   * 路由配置
   */
  routes: IFastifyRouteConfig[];

  /**
   * 是否启用CORS
   */
  enableCors?: boolean;

  /**
   * CORS配置
   */
  corsOptions?: Record<string, unknown>;

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean;

  /**
   * 压缩配置
   */
  compressionOptions?: Record<string, unknown>;

  /**
   * 是否启用速率限制
   */
  enableRateLimit?: boolean;

  /**
   * 速率限制配置
   */
  rateLimitOptions?: Record<string, unknown>;

  /**
   * 是否启用健康检查
   */
  enableHealthCheck?: boolean;

  /**
   * 健康检查配置
   */
  healthCheckOptions?: Record<string, unknown>;

  /**
   * 是否启用指标收集
   */
  enableMetrics?: boolean;

  /**
   * 指标收集配置
   */
  metricsOptions?: Record<string, unknown>;

  /**
   * 是否启用请求追踪
   */
  enableRequestTracing?: boolean;

  /**
   * 请求追踪配置
   */
  requestTracingOptions?: Record<string, unknown>;
}

/**
 * Fastify适配器接口
 */
export interface IFastifyAdapter {
  /**
   * Fastify实例
   */
  readonly instance: FastifyInstance;

  /**
   * 配置
   */
  readonly configuration: IFastifyConfiguration;

  /**
   * 是否已启动
   */
  readonly isStarted: boolean;

  /**
   * 启动服务器
   */
  start(): Promise<void>;

  /**
   * 停止服务器
   */
  stop(): Promise<void>;

  /**
   * 重启服务器
   */
  restart(): Promise<void>;

  /**
   * 注册插件
   */
  registerPlugin(config: IFastifyPluginConfig): Promise<void>;

  /**
   * 注册中间件
   */
  registerMiddleware(config: IFastifyMiddlewareConfig): Promise<void>;

  /**
   * 注册路由
   */
  registerRoute(config: IFastifyRouteConfig): Promise<void>;

  /**
   * 获取服务器信息
   */
  getServerInfo(): Record<string, unknown>;

  /**
   * 获取健康状态
   */
  getHealthStatus(): Record<string, unknown>;

  /**
   * 获取指标数据
   */
  getMetrics(): Record<string, unknown>;
}

/**
 * Fastify模块接口
 */
export interface IFastifyModule {
  /**
   * 模块名称
   */
  readonly name: string;

  /**
   * 适配器
   */
  readonly adapter: IFastifyAdapter;

  /**
   * 配置
   */
  readonly configuration: IFastifyConfiguration;

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
 * Fastify插件接口
 */
export interface IFastifyPlugin {
  /**
   * 插件名称
   */
  readonly name: string;

  /**
   * 插件版本
   */
  readonly version: string;

  /**
   * 插件配置
   */
  readonly config: IFastifyPluginConfig;

  /**
   * 是否已注册
   */
  readonly isRegistered: boolean;

  /**
   * 注册插件
   */
  register(fastify: FastifyInstance): Promise<void>;

  /**
   * 注销插件
   */
  unregister(fastify: FastifyInstance): Promise<void>;

  /**
   * 获取插件信息
   */
  getPluginInfo(): Record<string, unknown>;

  /**
   * 获取插件状态
   */
  getPluginStatus(): Record<string, unknown>;
}

/**
 * Fastify中间件接口
 */
export interface IFastifyMiddleware {
  /**
   * 中间件名称
   */
  readonly name: string;

  /**
   * 中间件配置
   */
  readonly config: IFastifyMiddlewareConfig;

  /**
   * 是否已注册
   */
  readonly isRegistered: boolean;

  /**
   * 注册中间件
   */
  register(fastify: FastifyInstance): Promise<void>;

  /**
   * 注销中间件
   */
  unregister(fastify: FastifyInstance): Promise<void>;

  /**
   * 获取中间件信息
   */
  getMiddlewareInfo(): Record<string, unknown>;

  /**
   * 获取中间件状态
   */
  getMiddlewareStatus(): Record<string, unknown>;
}

/**
 * Fastify路由接口
 */
export interface IFastifyRoute {
  /**
   * 路由名称
   */
  readonly name: string;

  /**
   * 路由配置
   */
  readonly config: IFastifyRouteConfig;

  /**
   * 是否已注册
   */
  readonly isRegistered: boolean;

  /**
   * 注册路由
   */
  register(fastify: FastifyInstance): Promise<void>;

  /**
   * 注销路由
   */
  unregister(fastify: FastifyInstance): Promise<void>;

  /**
   * 获取路由信息
   */
  getRouteInfo(): Record<string, unknown>;

  /**
   * 获取路由状态
   */
  getRouteStatus(): Record<string, unknown>;
}

/**
 * Fastify请求上下文接口
 */
export interface IFastifyRequestContext extends IAsyncContext {
  /**
   * Fastify请求对象
   */
  readonly request: FastifyRequest;

  /**
   * Fastify响应对象
   */
  readonly reply: FastifyReply;

  /**
   * 请求ID
   */
  readonly requestId: string;

  /**
   * 请求开始时间
   */
  readonly startTime: Date;

  /**
   * 请求结束时间
   */
  readonly endTime?: Date;

  /**
   * 请求持续时间
   */
  readonly duration?: number;

  /**
   * 请求路径
   */
  readonly path: string;

  /**
   * 请求方法
   */
  readonly method: string;

  /**
   * 请求头
   */
  readonly headers: Record<string, string>;

  /**
   * 请求参数
   */
  readonly params: Record<string, string>;

  /**
   * 查询参数
   */
  readonly query: Record<string, string>;

  /**
   * 请求体
   */
  readonly body: any;

  /**
   * 响应状态码
   */
  readonly statusCode?: number;

  /**
   * 响应头
   */
  readonly responseHeaders?: Record<string, string>;

  /**
   * 响应体
   */
  readonly responseBody?: any;

  /**
   * 错误信息
   */
  readonly error?: Error;

  /**
   * 是否成功
   */
  readonly isSuccess: boolean;

  /**
   * 获取请求信息
   */
  getRequestInfo(): Record<string, unknown>;

  /**
   * 获取响应信息
   */
  getResponseInfo(): Record<string, unknown>;

  /**
   * 获取完整上下文信息
   */
  getFullContext(): Record<string, unknown>;
}

/**
 * Fastify模块元数据接口
 */
export interface IFastifyModuleMetadata extends ModuleMetadata {
  /**
   * Fastify配置
   */
  fastifyConfig?: IFastifyConfiguration;

  /**
   * 是否启用Fastify
   */
  enableFastify?: boolean;

  /**
   * Fastify插件
   */
  fastifyPlugins?: IFastifyPluginConfig[];

  /**
   * Fastify中间件
   */
  fastifyMiddleware?: IFastifyMiddlewareConfig[];

  /**
   * Fastify路由
   */
  fastifyRoutes?: IFastifyRouteConfig[];
}
