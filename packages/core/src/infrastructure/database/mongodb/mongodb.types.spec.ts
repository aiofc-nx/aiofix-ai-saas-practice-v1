/**
 * MongoDB类型定义测试
 *
 * @description 测试MongoDB类型定义的正确性
 * @since 1.0.0
 */
import { ObjectId, Timestamp } from 'mongodb';
import {
  IMongoDBDocument,
  IMongoDBTenantDocument,
  IMongoDBAuditDocument,
  IMongoDBSoftDeleteDocument,
  IMongoDBTimeSeriesDocument,
  IMongoDBGeospatialDocument,
  IMongoDBTextSearchDocument,
  MongoDBQueryFilter,
  MongoDBQueryOptions,
  MongoDBAggregationStage,
  MongoDBAggregationPipeline,
  MongoDBAggregationOptions,
  MongoDBChangeStreamEvent,
  MongoDBChangeStreamOptions,
  MongoDBIndexSpec,
  MongoDBOperationResult,
  MongoDBPaginatedResult,
  MongoDBStats,
} from './mongodb.types';

describe('MongoDB类型定义', () => {
  describe('IMongoDBDocument 接口', () => {
    it('应该定义基础文档结构', () => {
      const document: IMongoDBDocument = {
        _id: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 1,
      };

      expect(document._id).toBeInstanceOf(ObjectId);
      expect(document.createdAt).toBeInstanceOf(Date);
      expect(document.updatedAt).toBeInstanceOf(Date);
      expect(document.__v).toBe(1);
    });

    it('应该支持可选属性', () => {
      const minimalDocument: IMongoDBDocument = {};

      expect(minimalDocument._id).toBeUndefined();
      expect(minimalDocument.createdAt).toBeUndefined();
      expect(minimalDocument.updatedAt).toBeUndefined();
      expect(minimalDocument.__v).toBeUndefined();
    });
  });

  describe('IMongoDBTenantDocument 接口', () => {
    it('应该定义租户文档结构', () => {
      const document: IMongoDBTenantDocument = {
        _id: new ObjectId(),
        tenantId: 'tenant-123',
        organizationId: 'org-456',
        departmentId: 'dept-789',
        userId: 'user-101',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(document.tenantId).toBe('tenant-123');
      expect(document.organizationId).toBe('org-456');
      expect(document.departmentId).toBe('dept-789');
      expect(document.userId).toBe('user-101');
    });

    it('应该支持最小租户文档', () => {
      const document: IMongoDBTenantDocument = {
        tenantId: 'tenant-123',
      };

      expect(document.tenantId).toBe('tenant-123');
      expect(document.organizationId).toBeUndefined();
    });
  });

  describe('IMongoDBAuditDocument 接口', () => {
    it('应该定义审计文档结构', () => {
      const document: IMongoDBAuditDocument = {
        _id: new ObjectId(),
        createdBy: 'user-123',
        createdByName: '张三',
        updatedBy: 'user-456',
        updatedByName: '李四',
        deletedBy: 'user-789',
        deletedByName: '王五',
        deletedAt: new Date(),
        isDeleted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(document.createdBy).toBe('user-123');
      expect(document.createdByName).toBe('张三');
      expect(document.updatedBy).toBe('user-456');
      expect(document.isDeleted).toBe(true);
      expect(document.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('IMongoDBSoftDeleteDocument 接口', () => {
    it('应该定义软删除文档结构', () => {
      const document: IMongoDBSoftDeleteDocument = {
        _id: new ObjectId(),
        isDeleted: false,
        createdAt: new Date(),
      };

      expect(document.isDeleted).toBe(false);
      expect(document.deletedAt).toBeUndefined();
    });

    it('应该支持已删除的文档', () => {
      const document: IMongoDBSoftDeleteDocument = {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: 'user-123',
      };

      expect(document.isDeleted).toBe(true);
      expect(document.deletedAt).toBeInstanceOf(Date);
      expect(document.deletedBy).toBe('user-123');
    });
  });

  describe('IMongoDBTimeSeriesDocument 接口', () => {
    it('应该定义时间序列文档结构', () => {
      const document: IMongoDBTimeSeriesDocument = {
        _id: new ObjectId(),
        timestamp: new Date(),
        metadata: {
          sensor: 'temperature',
          location: 'room-1',
        },
        measurements: {
          temperature: 25.5,
          humidity: 60,
          pressure: 1013.25,
        },
      };

      expect(document.timestamp).toBeInstanceOf(Date);
      expect(document.metadata?.sensor).toBe('temperature');
      expect(document.measurements.temperature).toBe(25.5);
    });
  });

  describe('IMongoDBGeospatialDocument 接口', () => {
    it('应该定义地理空间文档结构', () => {
      const document: IMongoDBGeospatialDocument = {
        _id: new ObjectId(),
        location: {
          type: 'Point',
          coordinates: [116.3974, 39.9093], // 北京坐标
        },
        geoTag: 'beijing',
        geoDescription: '北京市',
      };

      expect(document.location.type).toBe('Point');
      expect(document.location.coordinates).toEqual([116.3974, 39.9093]);
      expect(document.geoTag).toBe('beijing');
    });

    it('应该支持多边形地理位置', () => {
      const document: IMongoDBGeospatialDocument = {
        location: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ],
          ],
        },
      };

      expect(document.location.type).toBe('Polygon');
      expect(Array.isArray(document.location.coordinates)).toBe(true);
    });
  });

  describe('IMongoDBTextSearchDocument 接口', () => {
    it('应该定义全文搜索文档结构', () => {
      const document: IMongoDBTextSearchDocument = {
        _id: new ObjectId(),
        text: '这是一个测试文档，包含中文和English内容',
        searchTags: ['test', 'document', '测试'],
        searchWeight: 1.5,
      };

      expect(document.text).toContain('测试文档');
      expect(document.searchTags).toContain('test');
      expect(document.searchWeight).toBe(1.5);
    });
  });

  describe('MongoDBQueryFilter 类型', () => {
    it('应该支持基本查询操作符', () => {
      const filter: MongoDBQueryFilter<{ age: number; name: string }> = {
        age: { $gte: 18, $lt: 65 },
        name: { $regex: '^张', $options: 'i' },
      };

      expect(filter.age?.$gte).toBe(18);
      expect(filter.age?.$lt).toBe(65);
      expect(filter.name?.$regex).toBe('^张');
    });

    it('应该支持逻辑操作符', () => {
      const filter: MongoDBQueryFilter<{ status: string; age: number }> = {
        $and: [{ status: 'active' }, { age: { $gte: 18 } }],
        $or: [{ status: 'pending' }, { status: 'approved' }],
      };

      expect(filter.$and).toHaveLength(2);
      expect(filter.$or).toHaveLength(2);
    });

    it('应该支持文本搜索', () => {
      const filter: MongoDBQueryFilter<{ content: string }> = {
        $text: {
          $search: '测试 搜索',
          $language: 'zh',
          $caseSensitive: false,
        },
      };

      expect(filter.$text?.$search).toBe('测试 搜索');
      expect(filter.$text?.$language).toBe('zh');
    });
  });

  describe('MongoDBQueryOptions 接口', () => {
    it('应该定义查询选项结构', () => {
      const options: MongoDBQueryOptions = {
        sort: { createdAt: -1, name: 1 },
        limit: 10,
        skip: 20,
        projection: { name: 1, email: 1, _id: 0 },
        explain: true,
        readPreference: 'secondaryPreferred',
        readConcern: 'majority',
      };

      expect(options.sort?.createdAt).toBe(-1);
      expect(options.limit).toBe(10);
      expect(options.skip).toBe(20);
      expect(options.projection?.name).toBe(1);
      expect(options.readPreference).toBe('secondaryPreferred');
    });
  });

  describe('MongoDBAggregationStage 类型', () => {
    it('应该支持常用聚合阶段', () => {
      const stages: MongoDBAggregationStage[] = [
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { category: '$_id', count: 1, _id: 0 } },
      ];

      expect(stages).toHaveLength(5);
      expect('$match' in stages[0]).toBe(true);
      expect('$group' in stages[1]).toBe(true);
      expect('$sort' in stages[2]).toBe(true);
    });

    it('应该支持复杂聚合阶段', () => {
      const stage: MongoDBAggregationStage = {
        $facet: {
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        },
      };

      expect('$facet' in stage).toBe(true);
    });
  });

  describe('MongoDBChangeStreamEvent 接口', () => {
    it('应该定义变更流事件结构', () => {
      const event: MongoDBChangeStreamEvent<IMongoDBDocument> = {
        _id: { _data: 'some-resume-token' },
        operationType: 'insert',
        fullDocument: {
          _id: new ObjectId(),
          createdAt: new Date(),
        },
        documentKey: { _id: new ObjectId() },
        clusterTime: new Timestamp({ t: Math.floor(Date.now() / 1000), i: 1 }),
        ns: {
          db: 'testdb',
          coll: 'testcoll',
        },
      };

      expect(event.operationType).toBe('insert');
      expect(event.fullDocument?._id).toBeInstanceOf(ObjectId);
      expect(event.ns.db).toBe('testdb');
      expect(event.ns.coll).toBe('testcoll');
    });

    it('应该支持更新事件', () => {
      const event: MongoDBChangeStreamEvent = {
        _id: { _data: 'update-token' },
        operationType: 'update',
        documentKey: { _id: new ObjectId() },
        updateDescription: {
          updatedFields: { name: '新名称', updatedAt: new Date() },
          removedFields: ['oldField'],
        },
        clusterTime: new Timestamp({ t: Math.floor(Date.now() / 1000), i: 1 }),
        ns: { db: 'testdb', coll: 'users' },
      };

      expect(event.operationType).toBe('update');
      expect(event.updateDescription?.updatedFields.name).toBe('新名称');
      expect(event.updateDescription?.removedFields).toContain('oldField');
    });
  });

  describe('MongoDBIndexSpec 接口', () => {
    it('应该定义索引规范结构', () => {
      const indexSpec: MongoDBIndexSpec = {
        key: { email: 1, tenantId: 1 },
        options: {
          name: 'email_tenant_idx',
          unique: true,
          sparse: false,
          partialFilterExpression: { email: { $exists: true } },
        },
      };

      expect(indexSpec.key.email).toBe(1);
      expect(indexSpec.key.tenantId).toBe(1);
      expect(indexSpec.options?.unique).toBe(true);
      expect(indexSpec.options?.name).toBe('email_tenant_idx');
    });

    it('应该支持文本索引', () => {
      const textIndex: MongoDBIndexSpec = {
        key: { title: 'text', content: 'text' },
        options: {
          name: 'text_search_idx',
          text: true,
        },
      };

      expect(textIndex.key.title).toBe('text');
      expect(textIndex.key.content).toBe('text');
      expect(textIndex.options?.text).toBe(true);
    });

    it('应该支持地理空间索引', () => {
      const geoIndex: MongoDBIndexSpec = {
        key: { location: '2dsphere' },
        options: {
          name: 'location_2dsphere_idx',
          geo: true,
        },
      };

      expect(geoIndex.key.location).toBe('2dsphere');
      expect(geoIndex.options?.geo).toBe(true);
    });
  });

  describe('MongoDBOperationResult 接口', () => {
    it('应该定义操作结果结构', () => {
      const result: MongoDBOperationResult<IMongoDBDocument> = {
        success: true,
        data: {
          _id: new ObjectId(),
          createdAt: new Date(),
        },
        duration: 150,
        operation: 'insert',
        collection: 'users',
        insertedCount: 1,
        timestamp: new Date(),
      };

      expect(result.success).toBe(true);
      expect(result.data?._id).toBeInstanceOf(ObjectId);
      expect(result.operation).toBe('insert');
      expect(result.insertedCount).toBe(1);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('应该支持错误结果', () => {
      const result: MongoDBOperationResult = {
        success: false,
        error: 'Duplicate key error',
        duration: 50,
        operation: 'insert',
        collection: 'users',
        timestamp: new Date(),
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Duplicate key error');
      expect(result.data).toBeUndefined();
    });
  });

  describe('MongoDBPaginatedResult 接口', () => {
    it('应该定义分页结果结构', () => {
      const result: MongoDBPaginatedResult<{ name: string }> = {
        data: [{ name: '张三' }, { name: '李四' }],
        total: 100,
        page: 1,
        limit: 10,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
        nextPage: 2,
      };

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(100);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('应该支持空分页结果', () => {
      const result: MongoDBPaginatedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasNext).toBe(false);
    });
  });

  describe('MongoDBStats 接口', () => {
    it('应该定义统计信息结构', () => {
      const stats: MongoDBStats = {
        collections: 10,
        documents: 50000,
        indexes: 25,
        storageSize: 1024 * 1024 * 100, // 100MB
        indexSize: 1024 * 1024 * 10, // 10MB
        totalSize: 1024 * 1024 * 110, // 110MB
        avgObjSize: 2048,
        dataSize: 1024 * 1024 * 90, // 90MB
        sharded: false,
        compressed: true,
        compressionRatio: 0.75,
      };

      expect(stats.collections).toBe(10);
      expect(stats.documents).toBe(50000);
      expect(stats.indexes).toBe(25);
      expect(stats.sharded).toBe(false);
      expect(stats.compressed).toBe(true);
      expect(stats.compressionRatio).toBe(0.75);
    });
  });

  describe('边界情况', () => {
    it('应该处理极值', () => {
      const document: IMongoDBDocument = {
        _id: new ObjectId(),
        __v: Number.MAX_SAFE_INTEGER,
        createdAt: new Date(0), // Unix epoch
        updatedAt: new Date('2099-12-31T23:59:59.999Z'),
      };

      expect(document.__v).toBe(Number.MAX_SAFE_INTEGER);
      expect(document.createdAt?.getTime()).toBe(0);
    });

    it('应该处理特殊字符', () => {
      const document: IMongoDBTenantDocument = {
        tenantId: 'tenant_José_🚀_123',
        organizationId: 'org_测试_456',
        userId: 'user_special!@#$%',
      };

      expect(document.tenantId).toBe('tenant_José_🚀_123');
      expect(document.organizationId).toBe('org_测试_456');
      expect(document.userId).toBe('user_special!@#$%');
    });

    it('应该处理复杂的查询过滤器', () => {
      const filter: MongoDBQueryFilter<{
        tags: string[];
        metadata: Record<string, any>;
      }> = {
        tags: { $all: ['important', 'urgent'] },
        metadata: {
          $elemMatch: {
            key: 'priority',
            value: { $gte: 5 },
          },
        },
      };

      expect(filter.tags?.$all).toEqual(['important', 'urgent']);
      expect(filter.metadata?.$elemMatch).toBeDefined();
    });

    it('应该处理大数值统计', () => {
      const stats: MongoDBStats = {
        collections: 1000,
        documents: Number.MAX_SAFE_INTEGER,
        indexes: 5000,
        storageSize: Number.MAX_SAFE_INTEGER,
        indexSize: 1024 * 1024 * 1024 * 100, // 100GB
        totalSize: Number.MAX_SAFE_INTEGER,
        avgObjSize: 1024 * 1024, // 1MB
        dataSize: Number.MAX_SAFE_INTEGER - 1000,
        sharded: true,
        compressed: true,
        compressionRatio: 0.9,
      };

      expect(stats.documents).toBe(Number.MAX_SAFE_INTEGER);
      expect(stats.sharded).toBe(true);
      expect(stats.compressionRatio).toBe(0.9);
    });
  });
});
