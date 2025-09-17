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
        global.setTimeout(resolve, 1);
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
  });
});
