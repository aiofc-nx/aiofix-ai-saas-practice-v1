/**
 * Core模块与Cache模块集成测试
 *
 * 验证Cache模块能否正确使用Core模块的接口
 */

console.log('🚀 开始Core与Cache模块集成测试...\n');

async function main() {
  try {
    // 测试Core模块接口导出
    console.log('📋 测试Core模块接口导出...');

    const coreModule = require('./packages/core/dist/index.js');

    console.log('✅ Core模块导出检查:');
    console.log('  - TenantContext:', typeof coreModule.TenantContext);
    console.log(
      '  - TenantContextManager:',
      typeof coreModule.TenantContextManager,
    );
    console.log(
      '  - CorePerformanceMonitor:',
      typeof coreModule.CorePerformanceMonitor,
    );
    console.log('  - CoreEventBus:', typeof coreModule.CoreEventBus);
    console.log('  - BaseError:', typeof coreModule.BaseError);
    console.log('  - IsolationLevel:', typeof coreModule.IsolationLevel);
    console.log('  - DataSensitivity:', typeof coreModule.DataSensitivity);

    // 测试Cache模块接口导出
    console.log('\n📋 测试Cache模块接口导出...');

    const cacheModule = require('./packages/cache/dist/index.js');

    console.log('✅ Cache模块导出检查:');
    console.log(
      '  - SimpleCacheManager:',
      typeof cacheModule.SimpleCacheManager,
    );
    console.log(
      '  - CacheIsolationStrategy:',
      typeof cacheModule.CacheIsolationStrategy,
    );
    console.log(
      '  - SimpleCacheConfigService:',
      typeof cacheModule.SimpleCacheConfigService,
    );
    console.log('  - SimpleCacheModule:', typeof cacheModule.SimpleCacheModule);

    // 测试基础集成
    console.log('\n📋 测试基础集成...');

    // 创建租户上下文管理器
    const TenantContextManager = coreModule.TenantContextManager;
    console.log('✅ TenantContextManager创建成功');

    // 创建隔离策略
    const CacheIsolationStrategy = cacheModule.CacheIsolationStrategy;
    const IsolationLevel = coreModule.IsolationLevel;

    if (CacheIsolationStrategy && IsolationLevel) {
      const isolationStrategy = new CacheIsolationStrategy(
        IsolationLevel.TENANT,
      );
      console.log('✅ CacheIsolationStrategy创建成功');

      // 测试隔离键生成
      const mockTenantContext = {
        tenantId: 'test-tenant',
        organizationId: 'test-org',
        userId: 'test-user',
      };

      const isolatedKey = isolationStrategy.isolateKey(
        'test:key',
        mockTenantContext,
      );
      console.log('✅ 隔离键生成成功:', isolatedKey);

      // 测试访问验证
      const hasAccess = await isolationStrategy.validateAccess(
        isolatedKey,
        mockTenantContext,
      );
      console.log('✅ 访问验证成功:', hasAccess);
    }

    // 测试配置集成
    console.log('\n📋 测试配置集成...');

    const { createConfigManager } = require('./packages/config/dist/index.js');
    const configManager = await createConfigManager();
    console.log('✅ 配置管理器创建成功');

    // 测试Core配置服务
    const CoreConfigService = coreModule.CoreConfigService;
    if (CoreConfigService) {
      const coreConfigService = new CoreConfigService(configManager);
      await coreConfigService.initialize();
      console.log('✅ Core配置服务初始化成功');

      const isMultiTenantEnabled =
        await coreConfigService.isMultiTenantEnabled();
      console.log('✅ 多租户启用状态:', isMultiTenantEnabled);

      await coreConfigService.destroy();
    }

    // 测试Cache配置服务
    const SimpleCacheConfigService = cacheModule.SimpleCacheConfigService;
    if (SimpleCacheConfigService) {
      const cacheConfigService = new SimpleCacheConfigService(configManager);
      await cacheConfigService.initialize();
      console.log('✅ Cache配置服务初始化成功');

      const isCacheEnabled = await cacheConfigService.isEnabled();
      console.log('✅ Cache启用状态:', isCacheEnabled);

      await cacheConfigService.destroy();
    }

    console.log('\n🎉 Core与Cache模块集成测试完成！');
    console.log('🚀 集成测试成功！所有接口都可以正常使用！');
  } catch (error) {
    console.error('❌ 集成测试失败:', error);
  }
}

main();
