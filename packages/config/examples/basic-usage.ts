/**
 * 统一配置管理系统基础使用示例
 *
 * @description 演示统一配置管理系统的基本使用方法
 * 包括配置创建、获取、设置、监听等核心功能
 *
 * @example
 * ```bash
 * # 设置环境变量
 * export AIOFIX_SYSTEM__ENVIRONMENT=development
 * export AIOFIX_MESSAGING__GLOBAL__DEFAULT_TIMEOUT=45000
 * export AIOFIX_CORE__DATABASE__HOST=localhost
 * export AIOFIX_CORE__DATABASE__PASSWORD=secret123
 *
 * # 运行示例
 * cd packages/config
 * npx ts-node examples/basic-usage.ts
 * ```
 *
 * @since 1.0.0
 */

import {
  createConfigManager,
  createDevelopmentConfigManager,
  createConfigManagerFromPreset,
  validateConfig,
  ConfigFactory,
  Environment,
} from '../src';

/**
 * 基础配置使用演示
 */
async function demonstrateBasicUsage(): Promise<void> {
  console.log('🚀 统一配置管理系统基础使用演示\n');

  try {
    // 1. 创建默认配置管理器
    console.log('1️⃣ 创建默认配置管理器...');
    const configManager = await createConfigManager();

    // 2. 获取完整配置
    console.log('2️⃣ 获取完整配置...');
    const fullConfig = await configManager.getConfig();
    console.log('系统配置:', {
      name: fullConfig.system.name,
      version: fullConfig.system.version,
      environment: fullConfig.system.environment,
    });

    // 3. 获取特定配置项
    console.log('3️⃣ 获取特定配置项...');
    const dbHost = await configManager.get('core.database.host', 'localhost');
    const messagingTimeout = await configManager.get(
      'messaging.global.defaultTimeout',
    );
    const authEnabled = await configManager.get('auth.enabled');

    console.log('配置项:', {
      databaseHost: dbHost,
      messagingTimeout,
      authEnabled,
    });

    // 4. 获取模块配置
    console.log('4️⃣ 获取模块配置...');
    const messagingConfig = await configManager.getModuleConfig('messaging');
    console.log('消息传递模块配置:', {
      enabled: (messagingConfig as any).enabled,
      defaultTimeout: (messagingConfig as any).global.defaultTimeout,
      enableMetrics: (messagingConfig as any).global.enableMetrics,
    });

    // 5. 监听配置变化
    console.log('5️⃣ 设置配置变化监听...');
    configManager.onChange('messaging.global', (event) => {
      console.log('🔔 配置变更通知:', {
        path: event.path,
        oldValue: event.oldValue,
        newValue: event.newValue,
        timestamp: event.timestamp,
      });
    });

    // 6. 更新配置
    console.log('6️⃣ 更新配置项...');
    await configManager.set('messaging.global.defaultTimeout', 45000);

    const updatedTimeout = await configManager.get(
      'messaging.global.defaultTimeout',
    );
    console.log('更新后的超时时间:', updatedTimeout);

    // 7. 验证配置
    console.log('7️⃣ 验证配置...');
    const validationResult = await validateConfig(fullConfig);
    console.log('配置验证结果:', {
      valid: validationResult.valid,
      errorsCount: validationResult.errors.length,
      warningsCount: validationResult.warnings.length,
    });

    if (validationResult.warnings.length > 0) {
      console.log('配置警告:', validationResult.warnings.slice(0, 3));
    }

    // 8. 获取统计信息
    console.log('8️⃣ 获取统计信息...');
    const stats = configManager.getStatistics();
    console.log('配置管理器统计:', {
      totalAccess: stats.totalAccess,
      readAccess: stats.readAccess,
      writeAccess: stats.writeAccess,
      configCount: stats.configCount,
      providerCount: stats.providerCount,
      cacheHitRate: Math.round(stats.cacheHitRate * 100) + '%',
    });

    // 9. 清理资源
    console.log('9️⃣ 清理资源...');
    await configManager.destroy();

    console.log('✅ 基础使用演示完成！\n');
  } catch (error) {
    console.error('❌ 演示过程中发生错误:', error);
  }
}

/**
 * 预设配置使用演示
 */
async function demonstratePresetUsage(): Promise<void> {
  console.log('🎯 预设配置使用演示\n');

  try {
    // 1. 查看可用预设
    console.log('1️⃣ 查看可用预设...');
    const presets = ConfigFactory.getPresets();
    console.log(
      '可用预设:',
      presets.map((p) => ({
        name: p.name,
        description: p.description,
        tags: p.tags,
      })),
    );

    // 2. 创建开发环境配置管理器
    console.log('2️⃣ 创建开发环境配置管理器...');
    const devConfig = await createDevelopmentConfigManager();
    const devStats = devConfig.getStatistics();
    console.log('开发环境配置统计:', {
      configCount: devStats.configCount,
      providerCount: devStats.providerCount,
    });

    // 3. 使用高性能预设
    console.log('3️⃣ 使用高性能预设...');
    const highPerfConfig =
      await createConfigManagerFromPreset('high-performance');
    const highPerfStats = highPerfConfig.getStatistics();
    console.log('高性能配置统计:', {
      configCount: highPerfStats.configCount,
      providerCount: highPerfStats.providerCount,
    });

    // 4. 环境自动检测
    console.log('4️⃣ 环境自动检测...');
    const detectedEnv = ConfigFactory.detectEnvironment();
    console.log('检测到的环境:', detectedEnv);

    // 5. 获取推荐预设
    console.log('5️⃣ 获取推荐预设...');
    const recommendations = ConfigFactory.getRecommendedPresets(
      Environment.DEVELOPMENT,
      ['debug', 'verbose'],
    );
    console.log('推荐预设:', recommendations);

    // 清理资源
    await devConfig.destroy();
    await highPerfConfig.destroy();

    console.log('✅ 预设配置演示完成！\n');
  } catch (error) {
    console.error('❌ 预设演示过程中发生错误:', error);
  }
}

/**
 * 环境变量配置演示
 */
async function demonstrateEnvironmentConfig(): Promise<void> {
  console.log('🌍 环境变量配置演示\n');

  try {
    // 设置一些测试环境变量
    process.env.AIOFIX_DEMO__TEST_STRING = 'Hello World';
    process.env.AIOFIX_DEMO__TEST_NUMBER = '12345';
    process.env.AIOFIX_DEMO__TEST_BOOLEAN = 'true';
    process.env.AIOFIX_DEMO__TEST_JSON = '{"key": "value", "number": 42}';
    process.env.AIOFIX_DEMO__TEST_ARRAY = 'item1,item2,item3';

    // 创建配置管理器
    const configManager = await createConfigManager();

    // 测试类型转换
    console.log('1️⃣ 环境变量类型转换测试...');
    const stringValue = await configManager.get('demo.testString');
    const numberValue = await configManager.get('demo.testNumber');
    const booleanValue = await configManager.get('demo.testBoolean');
    const jsonValue = await configManager.get('demo.testJson');
    const arrayValue = await configManager.get('demo.testArray');

    console.log('类型转换结果:', {
      string: { value: stringValue, type: typeof stringValue },
      number: { value: numberValue, type: typeof numberValue },
      boolean: { value: booleanValue, type: typeof booleanValue },
      json: { value: jsonValue, type: typeof jsonValue },
      array: {
        value: arrayValue,
        type: typeof arrayValue,
        isArray: Array.isArray(arrayValue),
      },
    });

    // 清理测试环境变量
    delete process.env.AIOFIX_DEMO__TEST_STRING;
    delete process.env.AIOFIX_DEMO__TEST_NUMBER;
    delete process.env.AIOFIX_DEMO__TEST_BOOLEAN;
    delete process.env.AIOFIX_DEMO__TEST_JSON;
    delete process.env.AIOFIX_DEMO__TEST_ARRAY;

    await configManager.destroy();
    console.log('✅ 环境变量配置演示完成！\n');
  } catch (error) {
    console.error('❌ 环境变量演示过程中发生错误:', error);
  }
}

/**
 * 主演示函数
 */
async function main(): Promise<void> {
  console.log('🎉 AIOFix 统一配置管理系统演示\n');
  console.log('='.repeat(60));

  await demonstrateBasicUsage();
  await demonstratePresetUsage();
  await demonstrateEnvironmentConfig();

  console.log('='.repeat(60));
  console.log('🎊 所有演示完成！统一配置管理系统运行正常！');
}

// 运行演示
if (require.main === module) {
  main().catch(console.error);
}

export {
  demonstrateBasicUsage,
  demonstratePresetUsage,
  demonstrateEnvironmentConfig,
};
