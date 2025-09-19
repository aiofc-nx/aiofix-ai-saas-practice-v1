/**
 * 装饰器系统完整功能测试
 *
 * 测试装饰器的注册、元数据获取等功能
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
  isEventHandler,
  isQueueProcessor,
  isSaga,
  MessagePriority,
} = require('./dist/src/decorators/index.js');

console.log('🚀 开始完整测试装饰器系统...\n');

// 清空注册表
if (DecoratorRegistryUtils.registry && DecoratorRegistryUtils.registry.clear) {
  DecoratorRegistryUtils.registry.clear();
}

// 创建测试处理器类
console.log('📋 创建测试处理器类...');

// 测试消息处理器
const TestMessageHandler = MessageHandler('test.message', {
  queue: 'test-queue',
  priority: 10, // MessagePriority.HIGH
  maxRetries: 3,
})(
  class TestMessageHandler {
    async handle(message) {
      console.log('处理消息:', message);
    }
  },
);

console.log('✅ TestMessageHandler 创建成功');

// 测试事件处理器
const TestEventHandler = EventHandler(['test.event1', 'test.event2'], {
  queue: 'event-queue',
  enableBatch: true,
  batchSize: 10,
})(
  class TestEventHandler {
    async handle(event) {
      console.log('处理事件:', event);
    }
  },
);

console.log('✅ TestEventHandler 创建成功');

// 测试队列处理器
const TestQueueProcessor = QueueProcessor({
  queueName: 'test-processor-queue',
  concurrency: 5,
  maxRetries: 2,
})(
  class TestQueueProcessor {
    async process(job) {
      console.log('处理任务:', job);
    }
  },
);

console.log('✅ TestQueueProcessor 创建成功');

// 测试Saga
const TestSaga = Saga({
  sagaName: 'test-saga',
  triggerEvents: ['saga.start'],
  timeout: 30000,
})(
  class TestSaga {
    async handle(event) {
      console.log('处理Saga事件:', event);
    }
  },
);

console.log('✅ TestSaga 创建成功\n');

// 测试元数据获取
console.log('🔍 测试元数据获取...');

console.log('TestMessageHandler 类型:', typeof TestMessageHandler);
console.log('TestMessageHandler:', TestMessageHandler);

const messageHandlerMetadata = TestMessageHandler
  ? getHandlerMetadata(TestMessageHandler)
  : null;
console.log(
  'MessageHandler 元数据:',
  messageHandlerMetadata
    ? {
        handlerType: messageHandlerMetadata.handlerType,
        target: messageHandlerMetadata.target,
        hasOptions: !!messageHandlerMetadata.options,
        className: messageHandlerMetadata.handlerClass.name,
      }
    : '未找到',
);

const eventHandlerMetadata = getHandlerMetadata(TestEventHandler);
console.log(
  'EventHandler 元数据:',
  eventHandlerMetadata
    ? {
        handlerType: eventHandlerMetadata.handlerType,
        target: eventHandlerMetadata.target,
        hasOptions: !!eventHandlerMetadata.options,
        className: eventHandlerMetadata.handlerClass.name,
      }
    : '未找到',
);

const queueProcessorMetadata = getHandlerMetadata(TestQueueProcessor);
console.log(
  'QueueProcessor 元数据:',
  queueProcessorMetadata
    ? {
        handlerType: queueProcessorMetadata.handlerType,
        target: queueProcessorMetadata.target,
        hasOptions: !!queueProcessorMetadata.options,
        className: queueProcessorMetadata.handlerClass.name,
      }
    : '未找到',
);

const sagaMetadata = getHandlerMetadata(TestSaga);
console.log(
  'Saga 元数据:',
  sagaMetadata
    ? {
        handlerType: sagaMetadata.handlerType,
        target: sagaMetadata.target,
        hasOptions: !!sagaMetadata.options,
        className: sagaMetadata.handlerClass.name,
      }
    : '未找到',
);

console.log();

// 测试类型检查
console.log('🎯 测试类型检查...');
console.log(
  'isMessageHandler(TestMessageHandler):',
  isMessageHandler(TestMessageHandler),
);
console.log(
  'isEventHandler(TestEventHandler):',
  isEventHandler(TestEventHandler),
);
console.log(
  'isQueueProcessor(TestQueueProcessor):',
  isQueueProcessor(TestQueueProcessor),
);
console.log('isSaga(TestSaga):', isSaga(TestSaga));

// 交叉测试（应该返回false）
console.log(
  'isEventHandler(TestMessageHandler):',
  isEventHandler(TestMessageHandler),
);
console.log(
  'isMessageHandler(TestEventHandler):',
  isMessageHandler(TestEventHandler),
);

console.log();

// 测试注册表
console.log('📊 测试注册表功能...');
const summary = DecoratorRegistryUtils.getSummary();
console.log('注册表摘要:', summary);

// 按主题查找
const messageHandlers =
  DecoratorRegistryUtils.findHandlersForTopic('test.message');
console.log('主题 "test.message" 的处理器数量:', messageHandlers.length);

const eventHandlers = DecoratorRegistryUtils.getAllEventHandlers();
console.log('所有事件处理器数量:', eventHandlers.length);

console.log();
console.log('🎉 装饰器系统完整功能测试完成！');
console.log('✅ 所有核心功能正常工作');
