/**
 * Fastify集成类型定义
 *
 * @description 为避免外部依赖问题，这里定义基础类型
 * @since 1.0.0
 */

// 基础错误类型
export class BaseError extends Error {
  public readonly code: string;
  public readonly context?: unknown;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (cause) {
      this.stack = cause.stack;
    }
  }
}

// 日志服务接口
export interface ILoggerService {
  info(message: string, context?: unknown): void;
  error(message: string, error?: Error, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  debug(message: string, context?: unknown): void;
}

// 实体ID类型
export class EntityId {
  constructor(private readonly value: string) {}

  toString(): string {
    return this.value;
  }

  static fromString(value: string): EntityId {
    return new EntityId(value);
  }

  static generate(): EntityId {
    return new EntityId(
      `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    );
  }
}

// 租户上下文管理器
export class TenantContextManager {
  private static currentTenant: any = null;

  static setCurrentTenant(tenant: any): void {
    this.currentTenant = tenant;
  }

  static getCurrentTenant(): any {
    return this.currentTenant;
  }

  static run<T>(tenant: any, fn: () => T): T {
    const previousTenant = this.currentTenant;
    this.setCurrentTenant(tenant);
    try {
      return fn();
    } finally {
      this.setCurrentTenant(previousTenant);
    }
  }
}

// Fastify基础类型（兼容官方实现）
export interface IFastifyInstance {
  register(plugin: any, options?: any): Promise<IFastifyInstance>;
  listen(options: { port: number; host: string }): Promise<void>;
  close(): Promise<void>;
  addHook(name: string, handler: any): IFastifyInstance;
  setErrorHandler(handler: any): IFastifyInstance;
  // 兼容官方FastifyInstance的核心方法
  ready(): Promise<void>;
  after(): Promise<void>;
  // 路由注册方法
  get(path: string, handler: any): IFastifyInstance;
  post(path: string, handler: any): IFastifyInstance;
  put(path: string, handler: any): IFastifyInstance;
  delete(path: string, handler: any): IFastifyInstance;
  patch(path: string, handler: any): IFastifyInstance;
  head(path: string, handler: any): IFastifyInstance;
  options(path: string, handler: any): IFastifyInstance;
}

export interface IFastifyRequest {
  method: string;
  url: string;
  headers: Record<string, any>;
  query: Record<string, any>;
  body?: any;
  ip: string;
  startTime?: number;
  tenantId?: EntityId;
  tenantContext?: any;
  userId?: EntityId;
  auditLog?: any;
}

export interface IFastifyReply {
  status(code: number): IFastifyReply;
  send(payload: any): IFastifyReply;
  header(name: string, value: string): IFastifyReply;
  statusCode: number;
}

export interface IFastifyPluginOptions {
  [key: string]: any;
}

export type PreHandlerHookHandler = (
  request: IFastifyRequest,
  reply: IFastifyReply,
) => Promise<void> | void;

// 导出类型别名
export type FastifyInstance = IFastifyInstance;
export type FastifyRequest = IFastifyRequest;
export type FastifyReply = IFastifyReply;
export type FastifyPluginOptions = IFastifyPluginOptions;
export type preHandlerHookHandler = PreHandlerHookHandler;
export type FastifyServerOptions = any;
