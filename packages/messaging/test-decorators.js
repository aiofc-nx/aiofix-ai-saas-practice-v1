/**
 * 装饰器系统测试脚本
 *
 * 简单的Node.js脚本来测试装饰器功能
 */

require('reflect-metadata');

// 导入编译后的装饰器
const {
  MessageHandler,
  EventHandler,
  QueueProcessor,
  Saga,
  Subscribe,
  DecoratorRegistryUtils,
  getHandlerMetadata,
  isMessageHandler,
  MessagePriority,
} = require('./dist/decorators/index.js');

console.log('🚀 开始测试装饰器系统...\n');

// 测试装饰器导入
console.log('✅ 装饰器导入成功');
console.log('MessageHandler:', typeof MessageHandler);
console.log('EventHandler:', typeof EventHandler);
console.log('QueueProcessor:', typeof QueueProcessor);
console.log('Saga:', typeof Saga);
console.log('Subscribe:', typeof Subscribe);
console.log();

// 测试装饰器注册表
console.log('✅ 装饰器注册表功能:');
if (
  DecoratorRegistryUtils &&
  typeof DecoratorRegistryUtils.getSummary === 'function'
) {
  const summary = DecoratorRegistryUtils.getSummary();
  console.log('注册表摘要:', summary);
} else {
  console.log('❌ DecoratorRegistryUtils 不可用');
}
console.log();

// 测试工具函数
console.log('✅ 工具函数测试:');
console.log('getHandlerMetadata:', typeof getHandlerMetadata);
console.log('isMessageHandler:', typeof isMessageHandler);
console.log();

console.log('🎉 装饰器系统基础功能测试完成！');
