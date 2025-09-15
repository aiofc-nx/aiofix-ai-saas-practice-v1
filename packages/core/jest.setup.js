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

// 模拟 Reflect.metadata
global.Reflect = {
  ...global.Reflect,
  metadata: jest.fn(() => (target, propertyKey, descriptor) => descriptor),
  getMetadata: jest.fn(() => undefined),
  defineMetadata: jest.fn(),
  hasMetadata: jest.fn(() => false),
};

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
