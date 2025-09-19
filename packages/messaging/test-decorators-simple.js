/**
 * 简单的装饰器测试
 */

require('reflect-metadata');

const {
  MessageHandler,
  getHandlerMetadata,
  DecoratorRegistryUtils,
} = require('./dist/src/decorators/index.js');

console.log('🚀 简单装饰器测试开始...\n');

// 测试装饰器是否可以调用
console.log('MessageHandler 类型:', typeof MessageHandler);

try {
  // 创建装饰器
  const decorator = MessageHandler('test.message', {
    queue: 'test-queue',
    priority: 10,
    maxRetries: 3,
  });

  console.log('装饰器创建成功:', typeof decorator);

  // 创建类
  class TestHandler {
    async handle(message) {
      console.log('处理消息:', message);
    }
  }

  console.log('原始类:', TestHandler.name);

  // 应用装饰器
  const DecoratedClass = decorator(TestHandler);

  console.log('装饰后的类:', DecoratedClass);
  console.log('装饰后的类类型:', typeof DecoratedClass);
  console.log(
    '装饰后的类名称:',
    DecoratedClass ? DecoratedClass.name : 'undefined',
  );

  if (DecoratedClass) {
    // 测试元数据
    const metadata = getHandlerMetadata(DecoratedClass);
    console.log(
      '元数据:',
      metadata
        ? {
            handlerType: metadata.handlerType,
            target: metadata.target,
            className: metadata.handlerClass.name,
          }
        : '未找到',
    );

    // 测试注册表
    const summary = DecoratorRegistryUtils.getSummary();
    console.log('注册表摘要:', summary);
  }
} catch (error) {
  console.error('测试失败:', error.message);
  console.error('堆栈:', error.stack);
}

console.log('\n✅ 简单装饰器测试完成');
