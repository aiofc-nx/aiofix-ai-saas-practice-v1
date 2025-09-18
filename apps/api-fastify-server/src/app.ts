/**
 * 最简化的Fastify API服务器
 *
 * @description 展示@aiofix/core和@aiofix/messaging模块的集成使用
 * @since 1.0.0
 */

import { NestFactory } from '@nestjs/core';
// 使用我们的企业级Fastify适配器替代官方适配器
// import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Module, Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// 导入我们的自定义模块
import {
  TenantContextManager,
  DataIsolationContext,
  IsolationLevel,
  DataSensitivity,
  EntityId,
  IFastifyConfiguration,
  EnterpriseFastifyAdapter,
} from '@aiofix/core';
// 导入消息传递模块
import {
  SimpleMessagingService,
  SimpleBullQueueAdapter,
} from '@aiofix/messaging';

/**
 * 演示控制器
 */
@ApiTags('demo')
@Controller('demo')
class DemoController {
  private messagingService: SimpleMessagingService;

  constructor() {
    // 创建消息传递服务
    const queueAdapter = new SimpleBullQueueAdapter({
      name: 'demo-queue',
      enableTenantIsolation: true,
    });

    this.messagingService = new SimpleMessagingService([queueAdapter]);
  }

  /**
   * 演示多租户功能
   */
  @Get('tenant-demo')
  @ApiOperation({ summary: '演示多租户功能' })
  async tenantDemo(): Promise<{
    message: string;
    tenantContext: any;
    isolationContext: any;
  }> {
    try {
      // 生成有效的租户ID（UUID v4格式）
      const demoTenantId = EntityId.generate();

      // 创建租户上下文
      const tenantContext = {
        tenantId: demoTenantId.toString(),
        tenantCode: 'demo',
        createdAt: new Date(),
      };

      // 在租户上下文中执行
      return TenantContextManager.run(tenantContext, () => {
        // 创建数据隔离上下文
        const isolationContext = new DataIsolationContext({
          tenantId: demoTenantId,
          isolationLevel: IsolationLevel.TENANT,
          dataSensitivity: DataSensitivity.INTERNAL,
          accessPermissions: ['read', 'write'],
        });

        return {
          message: '多租户功能演示成功',
          tenantContext: TenantContextManager.getCurrentTenant(),
          isolationContext: isolationContext.toJSON(),
        };
      });
    } catch (error) {
      // 添加错误处理
      return {
        message: '多租户功能演示失败',
        tenantContext: null,
        isolationContext: { error: (error as Error).message },
      };
    }
  }

  /**
   * 演示消息传递功能
   */
  @Get('messaging-demo')
  @ApiOperation({ summary: '演示消息传递功能' })
  async messagingDemo(): Promise<{
    message: string;
    eventPublished: boolean;
    queueStats: any;
  }> {
    try {
      // 启动消息服务
      const queueAdapter = Array.from(
        (this.messagingService as any).queues.values(),
      )[0] as SimpleBullQueueAdapter;
      await queueAdapter.start();

      // 发布演示事件
      await this.messagingService.publish('DemoEvent', {
        message: 'Hello from Fastify Server!',
        timestamp: new Date().toISOString(),
        demoData: { key: 'value' },
      });

      // 获取队列统计
      const stats = await queueAdapter.getStatistics();

      return {
        message: '消息传递功能演示成功',
        eventPublished: true,
        queueStats: stats,
      };
    } catch (error) {
      return {
        message: '消息传递功能演示失败',
        eventPublished: false,
        queueStats: { error: (error as Error).message },
      };
    }
  }

  /**
   * 健康检查 - 使用企业级Fastify集成
   */
  @Get('health')
  @ApiOperation({ summary: '企业级健康检查' })
  async health(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    coreModules: string[];
    fastifyIntegration: {
      enabled: boolean;
      features: string[];
      version: string;
    };
  }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      coreModules: [
        '@aiofix/core',
        '@aiofix/messaging',
        '@aiofix/logging',
        '@aiofix/config',
        '@aiofix/cache',
      ],
      fastifyIntegration: {
        enabled: true,
        features: [
          'CoreFastifyAdapter',
          'CorsPlugin',
          'TenantMiddleware',
          'PerformanceMonitoring',
          'HealthCheck',
          'MultiTenant',
        ],
        version: '1.0.0',
      },
    };
  }

  /**
   * 演示企业级Fastify功能
   */
  @Get('fastify-demo')
  @ApiOperation({ summary: '演示企业级Fastify功能' })
  async fastifyDemo(): Promise<{
    message: string;
    features: {
      corsPlugin: boolean;
      tenantMiddleware: boolean;
      performanceMonitoring: boolean;
      healthCheck: boolean;
    };
    configuration: any;
  }> {
    // 创建企业级Fastify配置演示
    const enterpriseConfig: IFastifyConfiguration = {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        {
          name: 'cors',
          enabled: true,
          priority: 1,
          options: { origin: true, credentials: true },
        },
      ],
      middleware: [
        {
          name: 'tenant',
          enabled: true,
          priority: 1,
          options: {
            tenantHeader: 'X-Tenant-ID',
            validateTenant: true,
          },
        },
      ],
      routes: [],
      monitoring: {
        enableMetrics: true,
        enableHealthCheck: true,
        enablePerformanceMonitoring: true,
      },
      security: {
        enableHelmet: true,
        enableCORS: true,
        enableRateLimit: false,
      },
      logging: {
        level: 'info',
        prettyPrint: true,
      },
      multiTenant: {
        enabled: true,
        tenantHeader: 'X-Tenant-ID',
        tenantQueryParam: 'tenant',
      },
    };

    return {
      message: '企业级Fastify集成功能演示成功',
      features: {
        corsPlugin: true,
        tenantMiddleware: true,
        performanceMonitoring: true,
        healthCheck: true,
      },
      configuration: enterpriseConfig,
    };
  }

  /**
   * 展示我们自定义适配器的企业级功能
   */
  @Get('adapter-status')
  @ApiOperation({ summary: '展示自定义适配器状态' })
  async adapterStatus(): Promise<{
    message: string;
    adapterType: string;
    isCustomAdapter: boolean;
    enterpriseFeatures: {
      healthCheck: boolean;
      performanceMonitoring: boolean;
      multiTenant: boolean;
    };
    comparison: {
      official: string[];
      ours: string[];
      advantages: string[];
    };
  }> {
    return {
      message: '🎉 正在使用我们的自定义企业级Fastify适配器！',
      adapterType: 'EnterpriseFastifyAdapter',
      isCustomAdapter: true,
      enterpriseFeatures: {
        healthCheck: true,
        performanceMonitoring: true,
        multiTenant: true,
      },
      comparison: {
        official: ['基础HTTP服务', '简单插件注册', 'Express兼容中间件'],
        ours: [
          '基础HTTP服务',
          '企业级插件生命周期管理',
          '智能中间件管理',
          '完整健康检查系统',
          '实时性能监控',
          '多租户原生支持',
          '审计日志功能',
          '安全特性增强',
        ],
        advantages: [
          '插件生命周期管理',
          '智能中间件过滤',
          '完整监控系统',
          '多租户架构',
          '企业级安全',
          '性能优化',
        ],
      },
    };
  }
}

/**
 * 演示应用模块
 */
@Module({
  controllers: [DemoController],
})
class DemoAppModule {}

/**
 * 启动演示应用
 */
async function bootstrap(): Promise<void> {
  try {
    // 创建企业级Fastify适配器（使用我们的自定义实现）
    const fastifyAdapter = new EnterpriseFastifyAdapter({
      logger: true,
      enterprise: {
        enableHealthCheck: true,
        enablePerformanceMonitoring: true,
        enableMultiTenant: true,
        tenantHeader: 'X-Tenant-ID',
        corsOptions: {
          origin: true,
          credentials: true,
        },
      },
    });

    // 创建NestJS应用
    const app = await NestFactory.create(DemoAppModule, fastifyAdapter);

    // 设置API前缀
    app.setGlobalPrefix('api/v1');

    // 配置Swagger文档
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Aiofix SaaS Platform Demo API')
      .setDescription('展示Core模块和Messaging模块集成的演示API')
      .setVersion('1.0.0')
      .addTag('demo', '功能演示')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    // 获取端口配置
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';

    // 启动服务器
    await app.listen(port, host);

    // eslint-disable-next-line no-console
    console.log(
      `🚀 企业级Fastify API服务器启动成功! (使用自定义EnterpriseFastifyAdapter)`,
    );
    // eslint-disable-next-line no-console
    console.log(`📖 API文档: http://localhost:${port}/api/docs`);
    // eslint-disable-next-line no-console
    console.log(`❤️ 健康检查: http://localhost:${port}/api/v1/demo/health`);
    // eslint-disable-next-line no-console
    console.log(
      `🏢 多租户演示: http://localhost:${port}/api/v1/demo/tenant-demo`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `📨 消息传递演示: http://localhost:${port}/api/v1/demo/messaging-demo`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `⚡ Fastify集成演示: http://localhost:${port}/api/v1/demo/fastify-demo`,
    );
    // eslint-disable-next-line no-console
    console.log(
      `🔧 适配器状态: http://localhost:${port}/api/v1/demo/adapter-status`,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

// 启动应用
bootstrap();
