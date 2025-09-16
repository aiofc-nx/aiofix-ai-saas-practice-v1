/**
 * CoreSagaManager 测试
 *
 * @description 测试核心 Saga 管理器实现的功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CoreSagaManager } from './core-saga-manager';
import { TestSaga } from './core-saga.spec';
import { SagaStatus } from './saga.interface';

describe('CoreSagaManager', () => {
  let sagaManager: CoreSagaManager;
  let testSaga: TestSaga;

  beforeEach(async () => {
    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      trace: jest.fn(),
      performance: jest.fn(),
      business: jest.fn(),
      security: jest.fn(),
      child: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      updateConfig: jest.fn(),
      getConfig: jest.fn(),
      flush: jest.fn(),
      close: jest.fn(),
      getStats: jest.fn(),
      resetStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoreSagaManager,
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    sagaManager = module.get<CoreSagaManager>(CoreSagaManager);
    testSaga = new TestSaga();
  });

  describe('初始化', () => {
    it('应该正确初始化 Saga 管理器', () => {
      expect(sagaManager).toBeDefined();
      expect(sagaManager.isStarted()).toBe(false);
    });

    it('应该能够启动 Saga 管理器', async () => {
      await sagaManager.start();
      expect(sagaManager.isStarted()).toBe(true);
    });

    it('应该能够停止 Saga 管理器', async () => {
      await sagaManager.start();
      await sagaManager.stop();
      expect(sagaManager.isStarted()).toBe(false);
    });
  });

  describe('Saga 注册', () => {
    beforeEach(async () => {
      await sagaManager.start();
    });

    it('应该能够注册 Saga', () => {
      sagaManager.registerSaga(testSaga);
      const registeredSagas = sagaManager.getAllSagas();
      expect(registeredSagas).toContain(testSaga);
    });

    it('应该能够注销 Saga', () => {
      sagaManager.registerSaga(testSaga);
      sagaManager.unregisterSaga('TestSaga');
      const registeredSagas = sagaManager.getAllSagas();
      expect(registeredSagas).not.toContain(testSaga);
    });

    it('应该能够检查 Saga 是否已注册', () => {
      sagaManager.registerSaga(testSaga);
      expect(sagaManager.getSaga('TestSaga') !== undefined).toBe(true);
      expect(sagaManager.getSaga('NonExistentSaga') !== undefined).toBe(false);
    });
  });

  describe('Saga 执行', () => {
    beforeEach(async () => {
      await sagaManager.start();
      sagaManager.registerSaga(testSaga);
    });

    it('应该能够启动 Saga', async () => {
      const context = await sagaManager
        .startSaga('TestSaga', {
          testData: 'test-value',
        })
        .toPromise();

      expect(context).toBeDefined();
      expect(context!.sagaId).toBeDefined();
      expect(context!.sagaType).toBe('TestSaga');
      expect(context!.status).toBe(SagaStatus.RUNNING);
    });

    it('应该能够获取 Saga 状态', async () => {
      const context = await sagaManager
        .startSaga('TestSaga', {
          testData: 'test-value',
        })
        .toPromise();

      const status = sagaManager.getSagaStatus(context!.sagaId);
      expect(status).toBeDefined();
      expect(status!.sagaId).toBe(context!.sagaId);
      expect(status!.status).toBe(SagaStatus.RUNNING);
    });

    it('应该能够停止 Saga', async () => {
      const context = await sagaManager
        .startSaga('TestSaga', {
          testData: 'test-value',
        })
        .toPromise();

      await sagaManager.stopSaga(context!.sagaId);
      const status = sagaManager.getSagaStatus(context!.sagaId);
      expect(status!.status).toBe(SagaStatus.CANCELLED);
    });

    it('应该能够取消 Saga', async () => {
      const context = await sagaManager
        .startSaga('TestSaga', {
          testData: 'test-value',
        })
        .toPromise();

      await sagaManager.cancelSaga(context!.sagaId);
      const status = sagaManager.getSagaStatus(context!.sagaId);
      expect(status!.status).toBe(SagaStatus.CANCELLED);
    });
  });

  describe('统计信息', () => {
    beforeEach(async () => {
      await sagaManager.start();
      sagaManager.registerSaga(testSaga);
    });

    it('应该能够获取 Saga 统计信息', () => {
      const stats = sagaManager.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalSagas).toBe(0);
      expect(stats.byStatus[SagaStatus.RUNNING]).toBe(0);
      expect(stats.completedSagas).toBe(0);
      expect(stats.failedSagas).toBe(0);
    });

    it('应该能够获取健康状态', async () => {
      const health = await sagaManager.healthCheck();
      expect(health).toBe(true);
    });
  });

  describe('错误处理', () => {
    beforeEach(async () => {
      await sagaManager.start();
    });

    it('应该处理未注册的 Saga 启动请求', async () => {
      await expect(
        sagaManager.startSaga('NonExistentSaga', {}).toPromise(),
      ).rejects.toThrow();
    });

    it('应该处理无效的 Saga ID', () => {
      const status = sagaManager.getSagaStatus('invalid-id');
      expect(status).toBeUndefined();
    });
  });
});
