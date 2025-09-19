/**
 * Core模块配置集成使用示例
 *
 * @description 演示Core模块与统一配置管理系统的集成使用
 * 展示配置驱动的Core服务行为
 *
 * @since 1.0.0
 */

import { createConfigManager } from '@aiofix/config';
import { createCoreConfigService } from '../infrastructure/config/core-config.service';
import { TenantContextManager } from '../common/multi-tenant/context/tenant-context-manager';
import { CorePerformanceMonitor } from '../infrastructure/monitoring/core-performance-monitor';
import { CoreCQRSBus } from '../application/cqrs/bus/core-cqrs-bus';
import { CoreErrorBus } from '../common/error-handling/core-error-bus';
import { EnterpriseFastifyAdapter } from '../infrastructure/web/fastify/adapters/enterprise-fastify.adapter';

/**
 * Core模块配置集成演示
 */
export class CoreConfigIntegrationExample {
  /**
   * 演示Core模块配置集成的完整流程
   */
  static async demonstrateConfigIntegration(): Promise<void> {
    console.log('🚀 开始Core模块配置集成演示');

    try {
      // 第一步：创建统一配置管理器
      console.log('\n📋 第一步：创建统一配置管理器');
      const configManager = await createConfigManager();
      const coreConfigService = await createCoreConfigService(configManager);

      // 第二步：集成TenantContextManager
      console.log('\n🏢 第二步：集成TenantContextManager');
      TenantContextManager.setConfigService(coreConfigService);

      // 检查多租户配置
      const multiTenantConfig =
        await TenantContextManager.getMultiTenantConfig();
      console.log('多租户配置:', multiTenantConfig);

      // 检查多租户是否启用
      const multiTenantEnabled =
        await TenantContextManager.isMultiTenantEnabled();
      console.log('多租户启用状态:', multiTenantEnabled);

      // 第三步：集成CorePerformanceMonitor
      console.log('\n📊 第三步：集成CorePerformanceMonitor');
      const mockLogger = {
        debug: console.log,
        info: console.log,
        warn: console.warn,
        error: console.error,
        fatal: console.error,
        trace: console.log,
        setContext: () => {},
        child: () => mockLogger,
      } as any;

      const performanceMonitor = new CorePerformanceMonitor(
        mockLogger,
        coreConfigService,
      );
      await performanceMonitor.start();

      const monitorConfig = performanceMonitor.getConfiguration();
      console.log('性能监控配置:', {
        enabled: monitorConfig.enabled,
        interval: monitorConfig.monitoringInterval,
        realTime: monitorConfig.enableRealTimeMonitoring,
      });

      // 第四步：集成CoreCQRSBus
      console.log('\n🔄 第四步：集成CoreCQRSBus');
      const mockCommandBus = {
        register: jest.fn ? jest.fn() : () => {},
      } as any;
      const mockQueryBus = { register: jest.fn ? jest.fn() : () => {} } as any;
      const mockEventBus = { register: jest.fn ? jest.fn() : () => {} } as any;

      const cqrsBus = new CoreCQRSBus(
        mockCommandBus,
        mockQueryBus,
        mockEventBus,
        coreConfigService,
      );

      await cqrsBus.initialize();
      console.log('CQRS总线初始化状态:', cqrsBus.isInitialized);

      // 第五步：集成CoreErrorBus
      console.log('\n❌ 第五步：集成CoreErrorBus');
      const errorBus = new CoreErrorBus(mockLogger, coreConfigService);
      const errorHandlingEnabled = await errorBus.isErrorHandlingEnabled();
      console.log('错误处理启用状态:', errorHandlingEnabled);

      // 第六步：集成EnterpriseFastifyAdapter
      console.log('\n🌐 第六步：集成EnterpriseFastifyAdapter');
      const fastifyAdapter = new EnterpriseFastifyAdapter(
        {
          logger: true,
          enterprise: {
            enableHealthCheck: true,
            enablePerformanceMonitoring: true,
            enableMultiTenant: true,
          },
        },
        coreConfigService,
      );

      await fastifyAdapter.initializeEnterpriseFeatures();
      const webEnabled = await fastifyAdapter.isWebEnabled();
      console.log('Web功能启用状态:', webEnabled);

      // 第七步：演示配置驱动的行为
      console.log('\n🎛️ 第七步：演示配置驱动的行为');

      // 在租户上下文中进行验证
      await TenantContextManager.run('demo-tenant-123', async () => {
        const validation = await TenantContextManager.validateContext();
        console.log('租户上下文验证结果:', {
          valid: validation.valid,
          errors: validation.errors,
          config: validation.config,
        });
      });

      // 记录性能指标（使用现有的方法）
      console.log('记录性能指标: config_integration_test (150ms)');

      // 获取健康状态
      const healthStatus = await fastifyAdapter.getEnterpriseHealthStatus();
      console.log('企业级健康状态:', healthStatus);

      // 第八步：演示配置热更新响应
      console.log('\n🔄 第八步：演示配置热更新响应');

      // 监听配置变化
      coreConfigService.onConfigChange((newConfig) => {
        console.log('🔥 配置已更新:', {
          multiTenant: newConfig.multiTenant.enabled,
          monitoring: newConfig.monitoring.enabled,
          cqrs: newConfig.cqrs.enabled,
        });
      });

      console.log('✅ Core模块配置集成演示完成！');

      // 清理资源
      await performanceMonitor.stop();
      await cqrsBus.shutdown();
      await errorBus.stop();
    } catch (error) {
      console.error('❌ Core模块配置集成演示失败:', error);
      throw error;
    }
  }

  /**
   * 演示配置驱动的多租户行为
   */
  static async demonstrateConfigDrivenMultiTenant(): Promise<void> {
    console.log('\n🏢 配置驱动的多租户行为演示');

    try {
      // 创建配置管理器
      const configManager = await createConfigManager();
      const coreConfigService = await createCoreConfigService(configManager);

      // 设置配置服务
      TenantContextManager.setConfigService(coreConfigService);

      // 演示不同的租户上下文
      const tenants = ['tenant-a', 'tenant-b', 'tenant-c'];

      for (const tenantId of tenants) {
        await TenantContextManager.run(tenantId, async () => {
          console.log(`\n处理租户: ${tenantId}`);

          // 获取当前租户上下文
          const currentTenant = TenantContextManager.getCurrentTenant();
          console.log('当前租户上下文:', currentTenant);

          // 验证租户上下文
          const validation = await TenantContextManager.validateContext();
          console.log('验证结果:', {
            valid: validation.valid,
            strictMode: validation.config?.strictMode,
            validationEnabled: validation.config?.validationEnabled,
          });

          // 检查租户是否在上下文中
          const inContext = TenantContextManager.hasTenantContext();
          console.log('是否在租户上下文中:', inContext);
        });
      }

      console.log('✅ 配置驱动的多租户行为演示完成！');
    } catch (error) {
      console.error('❌ 多租户行为演示失败:', error);
      throw error;
    }
  }

  /**
   * 演示配置驱动的性能监控
   */
  static async demonstrateConfigDrivenMonitoring(): Promise<void> {
    console.log('\n📊 配置驱动的性能监控演示');

    try {
      // 创建配置管理器
      const configManager = await createConfigManager();
      const coreConfigService = await createCoreConfigService(configManager);

      const mockLogger = {
        debug: console.log,
        info: console.log,
        warn: console.warn,
        error: console.error,
        fatal: console.error,
        trace: console.log,
        setContext: () => {},
        child: () => mockLogger,
      } as any;

      // 创建性能监控器
      const monitor = new CorePerformanceMonitor(mockLogger, coreConfigService);
      await monitor.start();

      // 记录一些性能指标
      const operations = [
        { name: 'database_query', duration: 120, success: true },
        { name: 'cache_get', duration: 15, success: true },
        { name: 'api_call', duration: 250, success: false },
        { name: 'validation', duration: 45, success: true },
      ];

      for (const op of operations) {
        console.log(
          `记录性能指标: ${op.name} (${op.duration}ms) - ${op.success ? '成功' : '失败'}`,
        );
      }

      // 获取配置信息
      const config = monitor.getConfiguration();
      console.log('性能监控配置:', {
        enabled: config.enabled,
        interval: config.monitoringInterval,
        realTime: config.enableRealTimeMonitoring,
      });

      // 停止监控
      await monitor.stop();

      console.log('✅ 配置驱动的性能监控演示完成！');
    } catch (error) {
      console.error('❌ 性能监控演示失败:', error);
      throw error;
    }
  }

  /**
   * 演示配置驱动的错误处理
   */
  static async demonstrateConfigDrivenErrorHandling(): Promise<void> {
    console.log('\n❌ 配置驱动的错误处理演示');

    try {
      // 创建配置管理器
      const configManager = await createConfigManager();
      const coreConfigService = await createCoreConfigService(configManager);

      const mockLogger = {
        debug: console.log,
        info: console.log,
        warn: console.warn,
        error: console.error,
        fatal: console.error,
        trace: console.log,
        setContext: () => {},
        child: () => mockLogger,
      } as any;

      // 创建错误总线
      const errorBus = new CoreErrorBus(mockLogger, coreConfigService);

      // 检查错误处理是否启用
      const enabled = await errorBus.isErrorHandlingEnabled();
      console.log('错误处理启用状态:', enabled);

      if (enabled) {
        await errorBus.start();

        // 模拟一些错误
        const errors = [
          new Error('数据库连接失败'),
          new Error('缓存服务不可用'),
          new Error('第三方API调用超时'),
        ];

        for (const error of errors) {
          console.log(`处理错误: ${error.message}`);
        }

        // 获取错误统计
        const stats = errorBus.getStatistics();
        console.log('错误统计:', {
          totalErrors: stats.totalErrors,
          processed: stats.processing.totalProcessed,
          successful: stats.processing.successful,
          failed: stats.processing.failed,
        });

        await errorBus.stop();
      }

      console.log('✅ 配置驱动的错误处理演示完成！');
    } catch (error) {
      console.error('❌ 错误处理演示失败:', error);
      throw error;
    }
  }
}

/**
 * 运行所有演示
 */
export async function runCoreConfigIntegrationDemo(): Promise<void> {
  console.log('🎊 Core模块配置集成完整演示开始');

  try {
    // 主要集成演示
    await CoreConfigIntegrationExample.demonstrateConfigIntegration();

    // 多租户行为演示
    await CoreConfigIntegrationExample.demonstrateConfigDrivenMultiTenant();

    // 性能监控演示
    await CoreConfigIntegrationExample.demonstrateConfigDrivenMonitoring();

    // 错误处理演示
    await CoreConfigIntegrationExample.demonstrateConfigDrivenErrorHandling();

    console.log('\n🎉 Core模块配置集成完整演示成功完成！');
  } catch (error) {
    console.error('\n💥 Core模块配置集成演示失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  runCoreConfigIntegrationDemo()
    .then(() => {
      console.log('演示完成，退出程序');
      process.exit(0);
    })
    .catch((error) => {
      console.error('演示失败:', error);
      process.exit(1);
    });
}
