/**
 * CoreEventStore 测试
 *
 * @description 测试核心事件存储实现的功能
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CoreEventStore } from './core-event-store';
import { ConcurrencyError } from './concurrency-error';
import type { IDatabase } from './core-event-store';
import { BaseDomainEvent } from '../../../domain/entities/base/base-domain-event';
import { EntityId } from '../../../domain/entities/value-objects/entity-id';
import { v4 as uuidv4 } from 'uuid';

/**
 * 测试领域事件
 */
class TestDomainEvent extends BaseDomainEvent {
  constructor(
    public readonly testData: string,
    aggregateId: string,
    tenantId: string = 'test-tenant',
  ) {
    super(EntityId.fromString(aggregateId), 1, tenantId);
  }

  get eventType(): string {
    return 'TestDomainEvent';
  }
}

/**
 * 模拟数据库实现
 */
class MockDatabase implements IDatabase {
  private events: any[] = [];
  private inTransaction = false;

  async beginTransaction(): Promise<void> {
    this.inTransaction = true;
  }

  async commitTransaction(): Promise<void> {
    this.inTransaction = false;
  }

  async rollbackTransaction(): Promise<void> {
    this.inTransaction = false;
  }

  async query(query: string, params?: any[]): Promise<{ rows: any[] }> {
    if (query.includes('INSERT INTO')) {
      const [
        eventId,
        aggregateId,
        eventType,
        eventData,
        version,
        timestamp,
        tenantId,
      ] = params!;
      this.events.push({
        event_id: eventId,
        aggregate_id: aggregateId,
        event_type: eventType,
        event_data: eventData,
        version,
        timestamp,
        tenant_id: tenantId,
      });
      return { rows: [] };
    }

    if (query.includes('SELECT MAX(version)')) {
      const aggregateId = params![0];
      const maxVersion = Math.max(
        0,
        ...this.events
          .filter((e) => e.aggregate_id === aggregateId)
          .map((e) => e.version),
      );
      return { rows: [{ version: maxVersion }] };
    }

    if (query.includes('SELECT 1 FROM')) {
      const aggregateId = params![0];
      const exists = this.events.some((e) => e.aggregate_id === aggregateId);
      return { rows: exists ? [{ 1: 1 }] : [] };
    }

    if (query.includes('DELETE FROM')) {
      const aggregateId = params![0];
      const deletedCount = this.events.filter(
        (e) => e.aggregate_id === aggregateId,
      ).length;
      this.events = this.events.filter((e) => e.aggregate_id !== aggregateId);
      return { rows: Array(deletedCount).fill({}) };
    }

    // 默认查询逻辑
    let filteredEvents = [...this.events];

    if (query.includes('WHERE aggregate_id = $1')) {
      const aggregateId = params![0];
      filteredEvents = filteredEvents.filter(
        (e) => e.aggregate_id === aggregateId,
      );
    }

    if (query.includes('AND version >= $2')) {
      const fromVersion = params![1];
      filteredEvents = filteredEvents.filter((e) => e.version >= fromVersion);
    }

    if (query.includes('WHERE event_type = $1')) {
      const eventType = params![0];
      filteredEvents = filteredEvents.filter((e) => e.event_type === eventType);
    }

    if (query.includes('AND timestamp >= $2')) {
      const fromDate = params![1];
      filteredEvents = filteredEvents.filter(
        (e) => new Date(e.timestamp) >= fromDate,
      );
    }

    if (query.includes('WHERE event_id > $1')) {
      const fromEventId = params![0];
      filteredEvents = filteredEvents.filter((e) => e.event_id > fromEventId);
    }

    if (query.includes('ORDER BY version ASC')) {
      filteredEvents.sort((a, b) => a.version - b.version);
    }

    if (query.includes('ORDER BY timestamp ASC')) {
      filteredEvents.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    }

    if (query.includes('ORDER BY event_id ASC')) {
      filteredEvents.sort((a, b) =>
        String(a.event_id).localeCompare(String(b.event_id)),
      );
    }

    if (query.includes('LIMIT')) {
      const limit = params![params!.length - 1];
      filteredEvents = filteredEvents.slice(0, limit);
    }

    return { rows: filteredEvents };
  }

  // 测试辅助方法
  getEvents(): any[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

describe('CoreEventStore', () => {
  let eventStore: CoreEventStore;
  let mockDatabase: MockDatabase;
  let mockLogger: any;

  beforeEach(async () => {
    mockDatabase = new MockDatabase();
    mockLogger = {
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
        CoreEventStore,
        {
          provide: 'IDatabase',
          useValue: mockDatabase,
        },
        {
          provide: 'ILoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    eventStore = module.get<CoreEventStore>(CoreEventStore);
  });

  afterEach(() => {
    mockDatabase.clear();
  });

  describe('保存事件', () => {
    it('应该能够保存单个事件', async () => {
      const aggregateId = uuidv4();
      const event = new TestDomainEvent('test-data', aggregateId);

      await eventStore.saveEvents(aggregateId, [event], 0);

      const events = await eventStore.getEvents(aggregateId);
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('TestDomainEvent');
    });

    it('应该能够保存多个事件', async () => {
      const aggregateId = uuidv4();
      const events = [
        new TestDomainEvent('data1', aggregateId),
        new TestDomainEvent('data2', aggregateId),
        new TestDomainEvent('data3', aggregateId),
      ];

      await eventStore.saveEvents(aggregateId, events, 0);

      const savedEvents = await eventStore.getEvents(aggregateId);
      expect(savedEvents).toHaveLength(3);
    });

    it('应该检查版本并发控制', async () => {
      const aggregateId = uuidv4();
      const event1 = new TestDomainEvent('data1', aggregateId);
      const event2 = new TestDomainEvent('data2', aggregateId);

      // 第一次保存
      await eventStore.saveEvents(aggregateId, [event1], 0);

      // 第二次保存应该成功（版本1）
      await eventStore.saveEvents(aggregateId, [event2], 1);

      const events = await eventStore.getEvents(aggregateId);
      expect(events).toHaveLength(2);
    });

    it('应该抛出并发错误当版本不匹配', async () => {
      const aggregateId = uuidv4();
      const event1 = new TestDomainEvent('data1', aggregateId);
      const event2 = new TestDomainEvent('data2', aggregateId);

      // 第一次保存
      await eventStore.saveEvents(aggregateId, [event1], 0);

      // 第二次保存应该失败（期望版本0，但实际版本是1）
      await expect(
        eventStore.saveEvents(aggregateId, [event2], 0),
      ).rejects.toThrow(ConcurrencyError);
    });

    it('应该处理空事件列表', async () => {
      const aggregateId = uuidv4();

      await eventStore.saveEvents(aggregateId, [], 0);

      const events = await eventStore.getEvents(aggregateId);
      expect(events).toHaveLength(0);
    });
  });

  describe('查询事件', () => {
    let queryAggregateId: string;

    beforeEach(async () => {
      queryAggregateId = uuidv4();
      const events = [
        new TestDomainEvent('data1', queryAggregateId),
        new TestDomainEvent('data2', queryAggregateId),
        new TestDomainEvent('data3', queryAggregateId),
      ];

      await eventStore.saveEvents(queryAggregateId, events, 0);
    });

    it('应该能够获取所有事件', async () => {
      const events = await eventStore.getEvents(queryAggregateId);
      expect(events).toHaveLength(3);
    });

    it('应该能够从指定版本获取事件', async () => {
      const events = await eventStore.getEvents(queryAggregateId, 2);
      expect(events).toHaveLength(2); // 版本2和3
    });

    it('应该能够根据事件类型查询', async () => {
      const events = await eventStore.getEventsByType('TestDomainEvent');
      expect(events).toHaveLength(3);
    });

    it('应该能够获取事件流', async () => {
      const result = await eventStore.getEventStream(undefined, 10);
      expect(result.events).toHaveLength(3);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('版本管理', () => {
    it('应该能够获取当前版本', async () => {
      const aggregateId = uuidv4();
      const event = new TestDomainEvent('data', aggregateId);

      expect(await eventStore.getCurrentVersion(aggregateId)).toBe(0);

      await eventStore.saveEvents(aggregateId, [event], 0);
      expect(await eventStore.getCurrentVersion(aggregateId)).toBe(1);
    });

    it('应该能够检查聚合根是否存在', async () => {
      const aggregateId = uuidv4();

      expect(await eventStore.exists(aggregateId)).toBe(false);

      const event = new TestDomainEvent('data', aggregateId);
      await eventStore.saveEvents(aggregateId, [event], 0);

      expect(await eventStore.exists(aggregateId)).toBe(true);
    });
  });

  describe('删除事件', () => {
    it('应该能够删除聚合根的所有事件', async () => {
      const aggregateId = uuidv4();
      const events = [
        new TestDomainEvent('data1', aggregateId),
        new TestDomainEvent('data2', aggregateId),
      ];

      await eventStore.saveEvents(aggregateId, events, 0);
      expect(await eventStore.exists(aggregateId)).toBe(true);

      await eventStore.deleteEvents(aggregateId);
      expect(await eventStore.exists(aggregateId)).toBe(false);
    });
  });
});
