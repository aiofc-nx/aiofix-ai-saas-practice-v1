/**
 * Cache模块演示脚本
 *
 * 演示重构后的Cache模块基础功能
 */

const {
  SimpleCacheManager,
  CacheIsolationStrategy,
  CacheIsolationLevel,
} = require('./dist/index.js');

console.log('🚀 开始Cache模块演示...\n');

async function main() {
  try {
    // Mock配置管理器
    const mockConfigManager = {
      getModuleConfig: () =>
        Promise.resolve({
          enabled: true,
          defaultStrategy: 'memory',
          memory: {
            maxSize: 100,
            ttl: 300000,
            checkPeriod: 60000,
          },
          redis: {
            host: 'localhost',
            port: 6379,
            db: 0,
            keyPrefix: 'demo:',
            ttl: 3600,
          },
          strategies: {},
        }),
      onChange: () => {},
    };

    // 创建缓存管理器
    const cacheManager = new SimpleCacheManager(mockConfigManager);
    await cacheManager.initialize();
    console.log('✅ 缓存管理器初始化完成');

    // 基础操作演示
    console.log('\n📋 基础操作演示:');

    await cacheManager.set('user:123', { name: '张三', role: 'admin' });
    console.log('✅ 设置用户缓存');

    const user = await cacheManager.get('user:123');
    console.log('✅ 获取用户缓存:', user);

    const exists = await cacheManager.exists('user:123');
    console.log('✅ 检查缓存存在:', exists);

    // TTL演示
    console.log('\n⏰ TTL功能演示:');

    await cacheManager.set('temp:data', 'temporary data', { ttl: 2000 });
    console.log('✅ 设置临时缓存（2秒TTL）');

    console.log('等待3秒...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const tempData = await cacheManager.get('temp:data');
    console.log('✅ 3秒后获取临时缓存:', tempData); // 应该为null

    // 统计信息
    console.log('\n📊 统计信息演示:');

    const stats = await cacheManager.getStats();
    console.log('✅ 缓存统计:', {
      currentSize: stats.currentSize,
      hitRate: stats.hitRate,
      memoryUsage: stats.memoryUsage,
    });

    const health = await cacheManager.getHealth();
    console.log('✅ 健康状态:', health.overall);

    // 多租户隔离演示
    console.log('\n🔒 多租户隔离演示:');

    const isolationStrategy = new CacheIsolationStrategy(
      CacheIsolationLevel.TENANT,
    );

    const tenantA = { tenantId: 'tenant-a' };
    const tenantB = { tenantId: 'tenant-b' };

    const keyA = isolationStrategy.isolateKey('user:profile', tenantA);
    const keyB = isolationStrategy.isolateKey('user:profile', tenantB);

    console.log('✅ 租户A缓存键:', keyA);
    console.log('✅ 租户B缓存键:', keyB);
    console.log('✅ 键隔离验证:', keyA !== keyB ? '成功' : '失败');

    // 清理
    await cacheManager.destroy();
    console.log('\n✅ 缓存管理器销毁完成');

    console.log('\n🎉 Cache模块演示完成！');
    console.log('🚀 Cache模块重构第一阶段成功！');
  } catch (error) {
    console.error('❌ 演示失败:', error);
  }
}

main();
