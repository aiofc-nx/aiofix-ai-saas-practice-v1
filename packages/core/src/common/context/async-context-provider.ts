/**
 * 异步上下文提供者实现
 *
 * 提供了多种异步上下文提供者，用于从不同的请求源中提取上下文信息。
 * 包括 HTTP 请求、GraphQL 请求、WebSocket 连接、CLI 命令等。
 *
 * @description 异步上下文提供者实现
 * @since 1.0.0
 */
import { Injectable, Inject } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { IAsyncContextProvider, IContextData } from './async-context.interface';

/**
 * HTTP 请求上下文提供者
 */
@Injectable()
export class HttpRequestContextProvider implements IAsyncContextProvider {
  public readonly name = 'HttpRequestContextProvider';
  public readonly priority = 100;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 从请求头中提取信息
    if (request.headers) {
      // 租户 ID
      if (request.headers['x-tenant-id']) {
        data.tenantId = request.headers['x-tenant-id'];
      }

      // 用户 ID
      if (request.headers['x-user-id']) {
        data.userId = request.headers['x-user-id'];
      }

      // 组织 ID
      if (request.headers['x-organization-id']) {
        data.organizationId = request.headers['x-organization-id'];
      }

      // 部门 ID
      if (request.headers['x-department-id']) {
        data.departmentId = request.headers['x-department-id'];
      }

      // 请求 ID
      if (request.headers['x-request-id']) {
        data.requestId = request.headers['x-request-id'];
      }

      // 关联 ID
      if (request.headers['x-correlation-id']) {
        data.correlationId = request.headers['x-correlation-id'];
      }

      // 原因 ID
      if (request.headers['x-causation-id']) {
        data.causationId = request.headers['x-causation-id'];
      }

      // 用户代理
      if (request.headers['user-agent']) {
        data.userAgent = request.headers['user-agent'];
      }

      // 语言设置
      if (request.headers['accept-language']) {
        data.locale = request.headers['accept-language'];
      }

      // 时区设置
      if (request.headers['x-timezone']) {
        data.timezone = request.headers['x-timezone'];
      }
    }

    // 从请求对象中提取信息
    if (request.ip) {
      data.ipAddress = request.ip;
    }

    if (request.connection && request.connection.remoteAddress) {
      data.ipAddress = request.connection.remoteAddress;
    }

    // 设置请求来源
    data.source = 'WEB';

    this.logger.debug(
      `Extracted HTTP context data: ${JSON.stringify(data)}`,
      LogContext.HTTP_REQUEST,
      { data },
    );
    return data;
  }

  /**
   * 检查是否支持此请求
   */
  public supports(request: any): boolean {
    return !!(request && (request.headers || request.ip || request.connection));
  }
}

/**
 * GraphQL 请求上下文提供者
 */
@Injectable()
export class GraphQLRequestContextProvider implements IAsyncContextProvider {
  public readonly name = 'GraphQLRequestContextProvider';
  public readonly priority = 90;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 从 GraphQL 上下文中提取信息
    if (request.context) {
      if (request.context.tenantId) {
        data.tenantId = request.context.tenantId;
      }

      if (request.context.userId) {
        data.userId = request.context.userId;
      }

      if (request.context.organizationId) {
        data.organizationId = request.context.organizationId;
      }

      if (request.context.departmentId) {
        data.departmentId = request.context.departmentId;
      }

      if (request.context.requestId) {
        data.requestId = request.context.requestId;
      }

      if (request.context.correlationId) {
        data.correlationId = request.context.correlationId;
      }

      if (request.context.causationId) {
        data.causationId = request.context.causationId;
      }

      if (request.context.userAgent) {
        data.userAgent = request.context.userAgent;
      }

      if (request.context.ipAddress) {
        data.ipAddress = request.context.ipAddress;
      }

      if (request.context.locale) {
        data.locale = request.context.locale;
      }

      if (request.context.timezone) {
        data.timezone = request.context.timezone;
      }
    }

    // 从请求头中提取信息（GraphQL 通常也使用 HTTP 头）
    if (request.headers) {
      if (request.headers['x-tenant-id'] && !data.tenantId) {
        data.tenantId = request.headers['x-tenant-id'];
      }

      if (request.headers['x-user-id'] && !data.userId) {
        data.userId = request.headers['x-user-id'];
      }

      if (request.headers['x-request-id'] && !data.requestId) {
        data.requestId = request.headers['x-request-id'];
      }
    }

    // 设置请求来源
    data.source = 'API';

    this.logger.debug(
      `Extracted GraphQL context data: ${JSON.stringify(data)}`,
      LogContext.HTTP_REQUEST,
      { data },
    );
    return data;
  }

  /**
   * 检查是否支持此请求
   */
  public supports(request: any): boolean {
    return !!(
      request &&
      (request.context || request.headers) &&
      (request.query || request.mutation || request.subscription)
    );
  }
}

/**
 * WebSocket 连接上下文提供者
 */
@Injectable()
export class WebSocketContextProvider implements IAsyncContextProvider {
  public readonly name = 'WebSocketContextProvider';
  public readonly priority = 80;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 从 WebSocket 连接中提取信息
    if (request.connection) {
      if (request.connection.tenantId) {
        data.tenantId = request.connection.tenantId;
      }

      if (request.connection.userId) {
        data.userId = request.connection.userId;
      }

      if (request.connection.organizationId) {
        data.organizationId = request.connection.organizationId;
      }

      if (request.connection.departmentId) {
        data.departmentId = request.connection.departmentId;
      }

      if (request.connection.requestId) {
        data.requestId = request.connection.requestId;
      }

      if (request.connection.correlationId) {
        data.correlationId = request.connection.correlationId;
      }

      if (request.connection.userAgent) {
        data.userAgent = request.connection.userAgent;
      }

      if (request.connection.ipAddress) {
        data.ipAddress = request.connection.ipAddress;
      }
    }

    // 从握手信息中提取
    if (request.handshake) {
      if (request.handshake.headers) {
        if (request.handshake.headers['x-tenant-id'] && !data.tenantId) {
          data.tenantId = request.handshake.headers['x-tenant-id'];
        }

        if (request.handshake.headers['x-user-id'] && !data.userId) {
          data.userId = request.handshake.headers['x-user-id'];
        }

        if (request.handshake.headers['user-agent'] && !data.userAgent) {
          data.userAgent = request.handshake.headers['user-agent'];
        }
      }

      if (request.handshake.address) {
        data.ipAddress = request.handshake.address;
      }
    }

    // 设置请求来源
    data.source = 'WEB';

    this.logger.debug(
      `Extracted WebSocket context data: ${JSON.stringify(data)}`,
      LogContext.HTTP_REQUEST,
      { data },
    );
    return data;
  }

  /**
   * 检查是否支持此请求
   */
  public supports(request: any): boolean {
    return !!(
      request &&
      (request.connection || request.handshake) &&
      request.type === 'websocket'
    );
  }
}

/**
 * CLI 命令上下文提供者
 */
@Injectable()
export class CliCommandContextProvider implements IAsyncContextProvider {
  public readonly name = 'CliCommandContextProvider';
  public readonly priority = 70;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 从 CLI 命令中提取信息
    if (request.command) {
      if (request.command.tenantId) {
        data.tenantId = request.command.tenantId;
      }

      if (request.command.userId) {
        data.userId = request.command.userId;
      }

      if (request.command.organizationId) {
        data.organizationId = request.command.organizationId;
      }

      if (request.command.departmentId) {
        data.departmentId = request.command.departmentId;
      }

      if (request.command.requestId) {
        data.requestId = request.command.requestId;
      }

      if (request.command.correlationId) {
        data.correlationId = request.command.correlationId;
      }
    }

    // 从环境变量中提取信息（仅作为后备）
    if (!data.tenantId && process.env.TENANT_ID) {
      data.tenantId = process.env.TENANT_ID;
    }

    if (!data.userId && process.env.USER_ID) {
      data.userId = process.env.USER_ID;
    }

    if (!data.organizationId && process.env.ORGANIZATION_ID) {
      data.organizationId = process.env.ORGANIZATION_ID;
    }

    if (!data.departmentId && process.env.DEPARTMENT_ID) {
      data.departmentId = process.env.DEPARTMENT_ID;
    }

    if (!data.requestId && process.env.REQUEST_ID) {
      data.requestId = process.env.REQUEST_ID;
    }

    if (!data.correlationId && process.env.CORRELATION_ID) {
      data.correlationId = process.env.CORRELATION_ID;
    }

    // 设置请求来源
    data.source = 'CLI';

    this.logger.debug(
      `Extracted CLI context data: ${JSON.stringify(data)}`,
      LogContext.SYSTEM,
      { data },
    );
    return data;
  }

  /**
   * 检查是否支持此请求
   */
  public supports(request: any): boolean {
    return !!(
      request &&
      (request.command || process.env.TENANT_ID || process.env.USER_ID) &&
      process.env.NODE_ENV !== 'production'
    );
  }
}

/**
 * 系统任务上下文提供者
 */
@Injectable()
export class SystemTaskContextProvider implements IAsyncContextProvider {
  public readonly name = 'SystemTaskContextProvider';
  public readonly priority = 60;

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 从系统任务中提取信息
    if (request.task) {
      if (request.task.tenantId) {
        data.tenantId = request.task.tenantId;
      }

      if (request.task.userId) {
        data.userId = request.task.userId;
      }

      if (request.task.organizationId) {
        data.organizationId = request.task.organizationId;
      }

      if (request.task.departmentId) {
        data.departmentId = request.task.departmentId;
      }

      if (request.task.requestId) {
        data.requestId = request.task.requestId;
      }

      if (request.task.correlationId) {
        data.correlationId = request.task.correlationId;
      }

      if (request.task.causationId) {
        data.causationId = request.task.causationId;
      }
    }

    // 从环境变量中提取信息（仅作为后备）
    if (!data.tenantId && process.env.SYSTEM_TENANT_ID) {
      data.tenantId = process.env.SYSTEM_TENANT_ID;
    }

    if (!data.userId && process.env.SYSTEM_USER_ID) {
      data.userId = process.env.SYSTEM_USER_ID;
    }

    // 设置请求来源
    data.source = 'SYSTEM';

    this.logger.debug(
      `Extracted system task context data: ${JSON.stringify(data)}`,
      LogContext.SYSTEM,
      { data },
    );
    return data;
  }

  /**
   * 检查是否支持此请求
   */
  public supports(request: any): boolean {
    return !!(
      request &&
      (request.task ||
        process.env.SYSTEM_TENANT_ID ||
        process.env.SYSTEM_USER_ID)
    );
  }
}

/**
 * 上下文提供者管理器
 */
@Injectable()
export class AsyncContextProviderManager {
  private readonly providers: IAsyncContextProvider[] = [];

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 添加提供者
   */
  public addProvider(provider: IAsyncContextProvider): void {
    this.providers.push(provider);
    // 按优先级排序
    this.providers.sort((a, b) => b.priority - a.priority);
    this.logger.debug(
      `Added context provider: ${provider.name}`,
      LogContext.SYSTEM,
      { providerName: provider.name },
    );
  }

  /**
   * 移除提供者
   */
  public removeProvider(name: string): boolean {
    const index = this.providers.findIndex((p) => p.name === name);
    if (index !== -1) {
      this.providers.splice(index, 1);
      this.logger.debug(
        `Removed context provider: ${name}`,
        LogContext.SYSTEM,
        { providerName: name },
      );
      return true;
    }
    return false;
  }

  /**
   * 获取所有提供者
   */
  public getProviders(): IAsyncContextProvider[] {
    return [...this.providers];
  }

  /**
   * 从请求中提取上下文数据
   */
  public extractContextData(request: any): Partial<IContextData> {
    const data: Partial<IContextData> = {};

    // 找到支持此请求的提供者
    const applicableProviders = this.providers.filter((provider) =>
      provider.supports(request),
    );

    this.logger.debug(
      `Found ${applicableProviders.length} applicable providers for request`,
      LogContext.SYSTEM,
      { providerCount: applicableProviders.length },
    );

    // 按优先级顺序提取数据
    for (const provider of applicableProviders) {
      try {
        const providerData = provider.extractContextData(request);
        Object.assign(data, providerData);
        this.logger.debug(
          `Extracted data from ${provider.name}: ${JSON.stringify(providerData)}`,
          LogContext.SYSTEM,
          { providerName: provider.name, providerData },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to extract data from ${provider.name}: ${(error as Error).message}`,
          LogContext.SYSTEM,
          { providerName: provider.name, error: (error as Error).message },
        );
      }
    }

    this.logger.debug(
      `Final extracted context data: ${JSON.stringify(data)}`,
      LogContext.SYSTEM,
      { data },
    );
    return data;
  }

  /**
   * 清除所有提供者
   */
  public clear(): void {
    this.providers.length = 0;
    this.logger.debug('Cleared all context providers', LogContext.SYSTEM);
  }

  /**
   * 获取提供者统计信息
   */
  public getStatistics(): {
    totalProviders: number;
    providerNames: string[];
    priorityRange: { min: number; max: number };
  } {
    const priorities = this.providers.map((p) => p.priority);
    return {
      totalProviders: this.providers.length,
      providerNames: this.providers.map((p) => p.name),
      priorityRange: {
        min: priorities.length > 0 ? Math.min(...priorities) : 0,
        max: priorities.length > 0 ? Math.max(...priorities) : 0,
      },
    };
  }
}
