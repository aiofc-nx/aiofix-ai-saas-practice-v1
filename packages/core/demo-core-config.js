/**
 * Core模块配置集成演示
 *
 * 验证Core模块与统一配置管理系统的集成
 */

const { createConfigManager } = require('@aiofix/config');
const {
  CoreConfigService,
} = require('./dist/infrastructure/config/core-config.service.js');

console.log('🚀 开始Core模块配置集成演示...\n');

async function main() {
  try {
    // 创建统一配置管理器
    console.log('📋 创建统一配置管理器...');
    const configManager = await createConfigManager();
    console.log('✅ 统一配置管理器创建成功');

    // 创建Core配置服务
    console.log('\n📋 创建Core配置服务...');
    const coreConfigService = new CoreConfigService(configManager);
    await coreConfigService.initialize();
    console.log('✅ Core配置服务初始化成功');

    // 获取Core配置
    console.log('\n📋 获取Core模块配置...');
    const coreConfig = await coreConfigService.getConfig();
    console.log('✅ Core配置获取成功:', {
      enabled: coreConfig.enabled,
      multiTenant: {
        enabled: coreConfig.multiTenant.enabled,
        defaultIsolationLevel: coreConfig.multiTenant.defaultIsolationLevel,
      },
      monitoring: {
        enabled: coreConfig.monitoring.enabled,
        metricsInterval: coreConfig.monitoring.metricsInterval,
      },
      cqrs: {
        enabled: coreConfig.cqrs.enabled,
      },
    });

    // 测试专用配置获取
    console.log('\n📋 测试专用配置获取...');

    const multiTenantConfig = await coreConfigService.getMultiTenantConfig();
    console.log('✅ 多租户配置:', {
      enabled: multiTenantConfig.enabled,
      defaultIsolationLevel: multiTenantConfig.defaultIsolationLevel,
    });

    const monitoringConfig = await coreConfigService.getMonitoringConfig();
    console.log('✅ 监控配置:', {
      enabled: monitoringConfig.enabled,
      metricsInterval: monitoringConfig.metricsInterval,
    });

    const cqrsConfig = await coreConfigService.getCQRSConfig();
    console.log('✅ CQRS配置:', {
      enabled: cqrsConfig.enabled,
      commandBus: cqrsConfig.commandBus,
    });

    // 测试配置状态检查
    console.log('\n📋 测试配置状态检查...');

    const isEnabled = await coreConfigService.isEnabled();
    const isMultiTenantEnabled = await coreConfigService.isMultiTenantEnabled();
    const isMonitoringEnabled = await coreConfigService.isMonitoringEnabled();
    const isCQRSEnabled = await coreConfigService.isCQRSEnabled();

    console.log('✅ 功能启用状态:', {
      coreEnabled: isEnabled,
      multiTenantEnabled: isMultiTenantEnabled,
      monitoringEnabled: isMonitoringEnabled,
      cqrsEnabled: isCQRSEnabled,
    });

    // 获取服务状态
    console.log('\n📋 获取服务状态...');
    const status = coreConfigService.getStatus();
    console.log('✅ 服务状态:', status);

    // 清理
    await coreConfigService.destroy();
    console.log('\n✅ Core配置服务销毁完成');

    console.log('\n🎉 Core模块配置集成演示完成！');
    console.log('🚀 Core模块配置集成成功！');
  } catch (error) {
    console.error('❌ 演示失败:', error);
  }
}

main();
