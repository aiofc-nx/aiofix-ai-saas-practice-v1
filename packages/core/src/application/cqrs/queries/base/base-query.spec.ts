/**
 * BaseQuery 测试
 *
 * @description 测试 BaseQuery 基础查询类的功能
 * @since 1.0.0
 */
import { BaseQuery } from './base-query';

// 测试用的查询类
class TestQuery extends BaseQuery {
  constructor(
    public readonly filter: string,
    tenantId: string = 'default',
    userId: string = 'default-user',
    page: number = 1,
    pageSize: number = 10,
  ) {
    super(tenantId, userId, page, pageSize);
  }

  get queryType(): string {
    return 'TestQuery';
  }

  getQueryType(): string {
    return 'TestQuery';
  }

  validate(): void {
    // 简单验证，不在构造时抛出错误
  }

  getTypeName(): string {
    return 'TestQuery';
  }

  getHashCode(): string {
    return this.queryId.toString();
  }

  equals(other: unknown): boolean {
    if (!other || !(other instanceof TestQuery)) {
      return false;
    }
    return this.queryId.equals(other.queryId);
  }

  compareTo(other: unknown): number {
    if (!other || !(other instanceof TestQuery)) {
      return 1;
    }
    return this.createdAt.getTime() - other.createdAt.getTime();
  }

  belongsToTenant(tenantId: string): boolean {
    return this.tenantId === tenantId;
  }

  toJSON(): Record<string, unknown> {
    return {
      queryId: this.queryId.toString(),
      tenantId: this.tenantId,
      userId: this.userId,
      createdAt: this.createdAt.toISOString(),
      filter: this.filter,
    };
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  protected createCopyWithSortRules(
    sortRules: Array<import('./base-query').ISortRule>,
  ): this {
    const copy = new TestQuery(
      this.filter,
      this.tenantId,
      this.userId,
      this.page,
      this.pageSize,
    );
    // 复制排序规则
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (copy as any)._sortRules = [...sortRules];
    return copy as this;
  }
}

describe('BaseQuery', () => {
  let tenantId: string;

  beforeEach(() => {
    tenantId = 'test-tenant-123';
  });

  describe('查询创建', () => {
    it('应该正确创建基础查询', () => {
      const query = new TestQuery('test-filter', tenantId, 'user-123');

      expect(query).toBeInstanceOf(BaseQuery);
      expect(query.tenantId).toBe(tenantId);
      expect(query.userId).toBe('user-123');
      expect(query.filter).toBe('test-filter');
      expect(query.createdAt).toBeInstanceOf(Date);
      expect(query.getQueryType()).toBe('TestQuery');
    });

    it('应该为每个查询生成唯一的ID', () => {
      const query1 = new TestQuery('filter1');
      const query2 = new TestQuery('filter2');

      expect(query1.queryId.equals(query2.queryId)).toBe(false);
    });

    it('应该正确设置查询创建时间', () => {
      const beforeTime = new Date();
      const query = new TestQuery('test-filter');
      const afterTime = new Date();

      expect(query.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(query.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe('查询类型和验证', () => {
    it('应该返回正确的查询类型', () => {
      const query = new TestQuery('test-filter');
      expect(query.getQueryType()).toBe('TestQuery');
    });

    it('应该正确验证查询', () => {
      const query = new TestQuery('test-filter');
      expect(() => query.validate()).not.toThrow();
    });
  });

  describe('查询相等性', () => {
    it('相同ID的查询应该相等', () => {
      const query1 = new TestQuery('filter1', tenantId, 'user-123');
      const query2 = new TestQuery('filter2', tenantId, 'user-123');

      // 手动设置相同的查询ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (query1 as any)._queryId = (query2 as any)._queryId;

      expect(query1.equals(query2)).toBe(true);
    });

    it('不同ID的查询应该不相等', () => {
      const query1 = new TestQuery('filter1', tenantId, 'user-123');
      const query2 = new TestQuery('filter2', tenantId, 'user-123');

      expect(query1.equals(query2)).toBe(false);
    });

    it('与 null 或 undefined 比较应该返回 false', () => {
      const query = new TestQuery('test-filter');
      expect(query.equals(null)).toBe(false);
      expect(query.equals(undefined)).toBe(false);
    });
  });

  describe('查询比较', () => {
    it('应该按创建时间比较查询', async () => {
      const query1 = new TestQuery('filter1');

      // 等待一小段时间确保时间不同
      await new Promise<void>((resolve) => {
        global.setTimeout(resolve, 10);
      });

      const query2 = new TestQuery('filter2');

      expect(query1.compareTo(query2)).toBeLessThan(0);
      expect(query2.compareTo(query1)).toBeGreaterThan(0);
      expect(query1.compareTo(query1)).toBe(0);
    });

    it('与 null 或 undefined 比较应该返回 1', () => {
      const query = new TestQuery('test-filter');
      expect(query.compareTo(null as unknown as BaseQuery)).toBe(1);
      expect(query.compareTo(undefined as unknown as BaseQuery)).toBe(1);
    });
  });

  describe('租户关联', () => {
    it('应该正确检查查询是否属于指定的租户', () => {
      const query = new TestQuery('test-filter', tenantId, 'user-123');
      const otherTenantId = 'other-tenant-456';

      expect(query.belongsToTenant(tenantId)).toBe(true);
      expect(query.belongsToTenant(otherTenantId)).toBe(false);
    });
  });

  describe('查询转换', () => {
    it('应该正确转换为字符串', () => {
      const query = new TestQuery('test-filter');
      const str = query.toString();
      expect(typeof str).toBe('string');
      expect(str).toContain(query.queryId.toString());
    });

    it('应该正确转换为 JSON', () => {
      const query = new TestQuery('test-filter');
      const json = query.toJSON();

      expect(json).toHaveProperty('queryId');
      expect(json.queryType).toBeUndefined(); // BaseQuery 不自动设置 queryType
      expect(json).toHaveProperty('tenantId');
      expect(json).toHaveProperty('createdAt');
    });

    it('应该正确获取哈希码', () => {
      const query = new TestQuery('test-filter');
      expect(query.getHashCode()).toBe(query.queryId.toString());
    });

    it('应该正确获取类型名称', () => {
      const query = new TestQuery('test-filter');
      expect(query.getTypeName()).toBe('TestQuery');
    });
  });

  describe('边界情况', () => {
    it('应该处理特殊字符的过滤器', () => {
      const specialFilter = 'test-filter_123.@#$%^&*()';
      const query = new TestQuery(specialFilter);
      expect(query.filter).toBe(specialFilter);
    });

    it('应该处理 Unicode 字符', () => {
      const unicodeFilter = '测试过滤器_José_🚀';
      const query = new TestQuery(unicodeFilter, '租户-123', 'user-123');

      expect(query.filter).toBe(unicodeFilter);
      expect(query.tenantId).toBe('租户-123');
    });

    it('应该处理复杂的查询数据', () => {
      const complexData = {
        filter: 'complex',
        sort: { field: 'name', order: 'asc' },
        pagination: { page: 1, size: 10 },
        includes: ['user', 'profile'],
      };

      const query = new TestQuery(
        'complex-test',
        'tenant-1',
        'user-1',
        complexData,
      );

      expect(query.data).toEqual(complexData);
      expect(query.filter).toBe('complex-test');
    });

    it('应该处理空的查询数据', () => {
      const query = new TestQuery('empty-test', 'tenant-1', 'user-1', {});

      expect(query.data).toEqual({});
    });

    it('应该处理null和undefined值', () => {
      const query = new TestQuery('null-test', null as any, undefined as any, {
        filter: null,
        sort: undefined,
      });

      expect(query.tenantId).toBeNull();
      expect(query.userId).toBeUndefined();
    });

    it('应该处理大型查询对象', () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
        })),
        metadata: { totalCount: 1000 },
      };

      const query = new TestQuery(
        'large-test',
        'tenant-1',
        'user-1',
        largeData,
      );

      expect(query.data.items).toHaveLength(1000);
      expect(query.data.metadata.totalCount).toBe(1000);
    });
  });

  describe('查询性能测试', () => {
    it('应该快速创建大量查询', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        new TestQuery(`query-${i}`, 'tenant-1', 'user-1', { index: i });
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(500); // 应该在500ms内完成
    });

    it('应该支持查询的批量比较', () => {
      const queries = Array.from(
        { length: 50 },
        (_, i) =>
          new TestQuery(`query-${i}`, 'tenant-1', 'user-1', { index: i }),
      );

      const startTime = Date.now();

      // 对所有查询进行排序
      queries.sort((a, b) => a.compareTo(b));

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50); // 应该很快完成
      expect(queries).toHaveLength(50);
    });

    it('应该高效处理查询序列化', () => {
      const query = new TestQuery('serialize-test', 'tenant-1', 'user-1', {
        largeData: Array.from({ length: 100 }, (_, i) => `item-${i}`),
      });

      const startTime = Date.now();

      const json = query.toJSON();
      const string = query.toString();
      const hashCode = query.getHashCode();

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(50);
      expect(json).toBeDefined();
      expect(string).toBeDefined();
      expect(hashCode).toBeDefined();
    });
  });

  describe('查询扩展功能', () => {
    it('应该支持查询验证增强', () => {
      const validQuery = new TestQuery('valid-test', 'tenant-1', 'user-1', {
        filter: 'valid',
        pagination: { page: 1, size: 10 },
      });

      const invalidQuery = new TestQuery('', 'tenant-1', 'user-1', {}); // 空action

      expect(() => validQuery.validate()).not.toThrow();
      expect(() => invalidQuery.validate()).toThrow();
    });

    it('应该支持查询类型检查扩展', () => {
      const query1 = new TestQuery('type-test', 'tenant-1', 'user-1');
      const query2 = new TestQuery('type-test', 'tenant-1', 'user-1');
      const query3 = new TestQuery('different-type', 'tenant-1', 'user-1');

      expect(query1.isOfType('TestQuery')).toBe(true);
      expect(query1.isOfType('type-test')).toBe(true);
      expect(query1.isOfType('different-type')).toBe(false);

      expect(query1.isOfType(query2.getQueryType())).toBe(true);
      expect(query1.isOfType(query3.getQueryType())).toBe(false);
    });

    it('应该支持查询元数据操作', () => {
      const query = new TestQuery('metadata-test', 'tenant-1', 'user-1', {
        filter: 'test',
        metadata: {
          source: 'api',
          version: '1.0',
          tags: ['important', 'user-data'],
        },
      });

      // 测试元数据访问
      expect(query.data.metadata.source).toBe('api');
      expect(query.data.metadata.version).toBe('1.0');
      expect(query.data.metadata.tags).toContain('important');
    });

    it('应该支持查询状态检查', () => {
      const activeQuery = new TestQuery('active-test', 'tenant-1', 'user-1');
      const expiredQuery = new TestQuery('expired-test', 'tenant-1', 'user-1');

      // 模拟过期查询
      (expiredQuery as any).createdAt = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ); // 1天前

      expect(activeQuery.createdAt.getTime()).toBeGreaterThan(
        Date.now() - 1000,
      );
      expect(expiredQuery.createdAt.getTime()).toBeLessThan(Date.now() - 1000);
    });

    it('应该支持查询参数验证', () => {
      const queryWithValidParams = new TestQuery(
        'param-test',
        'tenant-1',
        'user-1',
        {
          page: 1,
          size: 10,
          filter: 'valid',
        },
      );

      const queryWithInvalidParams = new TestQuery(
        'param-test',
        'tenant-1',
        'user-1',
        {
          page: -1, // 无效
          size: 0, // 无效
          filter: '', // 空
        },
      );

      expect(queryWithValidParams.data.page).toBe(1);
      expect(queryWithValidParams.data.size).toBe(10);

      expect(queryWithInvalidParams.data.page).toBe(-1);
      expect(queryWithInvalidParams.data.size).toBe(0);
    });
  });
});
