/**
 * 简化版企业级Fastify适配器
 *
 * @description 基于NestJS官方FastifyAdapter的简化企业级扩展
 * 专注于核心功能，避免复杂的类型问题
 *
 * @since 1.0.0
 */

import { FastifyAdapter } from '@nestjs/platform-fastify';
import { CoreFastifyAdapter } from './core-fastify.adapter';
import { ILoggerService } from '../types';

/**
 * 简化版企业级Fastify选项
 */
export interface ISimpleEnterpriseFastifyOptions {
  logger?: boolean;
  trustProxy?: boolean;
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableMultiTenant?: boolean;
    tenantHeader?: string;
    corsOptions?: {
      origin?: boolean | string | string[];
      credentials?: boolean;
    };
    logger?: ILoggerService;
  };
}

/**
 * 简化版企业级Fastify适配器
 *
 * 继承NestJS官方FastifyAdapter，添加核心企业级功能
 */
export class SimpleEnterpriseFastifyAdapter extends FastifyAdapter {
  private readonly enterpriseCore?: CoreFastifyAdapter;
  private readonly enterpriseConfig: NonNullable<
    ISimpleEnterpriseFastifyOptions['enterprise']
  >;

  constructor(options?: ISimpleEnterpriseFastifyOptions) {
    // 提取企业级配置，传递标准配置给父类
    const { enterprise, ...fastifyOptions } = options || {};
    super(fastifyOptions);

    this.enterpriseConfig = enterprise || {};

    // 如果启用了企业级功能，创建核心适配器
    if (this.isEnterpriseEnabled()) {
      try {
        this.enterpriseCore = new CoreFastifyAdapter(
          this.createEnterpriseConfig(),
          this.enterpriseConfig.logger || this.createDefaultLogger(),
        );
      } catch (error) {
        console.warn(
          '企业级功能初始化失败，使用标准模式:',
          (error as Error).message,
        );
      }
    }
  }

  /**
   * 检查是否启用了企业级功能
   */
  private isEnterpriseEnabled(): boolean {
    return !!(
      this.enterpriseConfig.enableHealthCheck ||
      this.enterpriseConfig.enablePerformanceMonitoring ||
      this.enterpriseConfig.enableMultiTenant
    );
  }

  /**
   * 创建企业级配置
   */
  private createEnterpriseConfig() {
    return {
      server: {
        port: 3000, // 默认端口，实际由listen方法覆盖
        host: '0.0.0.0',
      },
      plugins: this.enterpriseConfig.corsOptions
        ? [
            {
              name: 'cors',
              enabled: true,
              priority: 1,
              options: this.enterpriseConfig.corsOptions,
            },
          ]
        : [],
      middleware: this.enterpriseConfig.enableMultiTenant
        ? [
            {
              name: 'tenant',
              enabled: true,
              priority: 1,
              options: {
                tenantHeader:
                  this.enterpriseConfig.tenantHeader || 'X-Tenant-ID',
                validateTenant: true,
              },
            },
          ]
        : [],
      routes: [],
      monitoring: {
        enableMetrics:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
        enableHealthCheck: this.enterpriseConfig.enableHealthCheck || false,
        enablePerformanceMonitoring:
          this.enterpriseConfig.enablePerformanceMonitoring || false,
      },
      security: {
        enableHelmet: false,
        enableCORS: !!this.enterpriseConfig.corsOptions,
        enableRateLimit: false,
      },
      logging: {
        level: 'info' as const,
        prettyPrint: true,
      },
      multiTenant: {
        enabled: this.enterpriseConfig.enableMultiTenant || false,
        tenantHeader: this.enterpriseConfig.tenantHeader || 'X-Tenant-ID',
        tenantQueryParam: 'tenant',
      },
    };
  }

  /**
   * 创建默认日志服务
   */
  private createDefaultLogger(): ILoggerService {
    return {
      info: (message: string) => console.log(`[INFO] ${message}`),
      error: (message: string, error?: Error) =>
        console.error(`[ERROR] ${message}`, error),
      warn: (message: string) => console.warn(`[WARN] ${message}`),
      debug: (message: string) => console.debug(`[DEBUG] ${message}`),
    };
  }

  /**
   * 重写listen方法，添加企业级启动逻辑
   */
  override async listen(port: string | number, ...args: any[]): Promise<any> {
    // 启动企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.start();
        console.log('✅ 企业级Fastify功能已启动');
      } catch (error) {
        console.warn(
          '企业级功能启动失败，继续使用标准模式:',
          (error as Error).message,
        );
      }
    }

    // 调用父类listen方法
    return super.listen(port, ...args);
  }

  /**
   * 重写close方法，添加企业级清理逻辑
   */
  override async close(): Promise<any> {
    // 停止企业级功能
    if (this.enterpriseCore) {
      try {
        await this.enterpriseCore.stop();
        console.log('✅ 企业级Fastify功能已停止');
      } catch (error) {
        console.warn('企业级功能停止失败:', (error as Error).message);
      }
    }

    // 调用父类close方法
    return super.close();
  }

  /**
   * 获取企业级健康状态
   */
  async getEnterpriseHealthStatus(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getHealthStatus()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }

  /**
   * 获取企业级性能指标
   */
  async getEnterprisePerformanceMetrics(): Promise<Record<string, unknown>> {
    if (this.enterpriseCore) {
      try {
        return (await this.enterpriseCore.getPerformanceMetrics()) as unknown as Record<
          string,
          unknown
        >;
      } catch (error) {
        return {
          status: 'error',
          message: (error as Error).message,
        };
      }
    }

    return {
      status: 'standard',
      message: '企业级功能未启用',
    };
  }
}
