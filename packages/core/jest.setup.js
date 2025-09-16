// Jest 测试环境设置
require('reflect-metadata');

// 全局测试配置
global.console = {
  ...console,
  // 在测试中禁用 console.log，但保留 error 和 warn
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// 设置测试超时
jest.setTimeout(10000);

// 注意：我们不在这里模拟 UUID，让测试使用真实的 uuid 库

// 确保 Reflect 对象正确设置
if (!global.Reflect) {
  global.Reflect = {};
}

// 添加必要的 Reflect 方法
if (!global.Reflect.getOwnMetadataKeys) {
  global.Reflect.getOwnMetadataKeys = jest.fn(() => []);
}

// 测试工具函数
global.createMockEntity = (overrides = {}) => ({
  id: 'test-id',
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantId: 'test-tenant',
  ...overrides,
});

global.createMockAuditInfo = (overrides = {}) => ({
  createdBy: 'test-user',
  updatedBy: 'test-user',
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantId: 'test-tenant',
  version: 1,
  ...overrides,
});

// 清理函数
afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});
