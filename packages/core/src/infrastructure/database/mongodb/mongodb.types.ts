/**
 * MongoDB类型定义
 *
 * 定义了MongoDB集成的类型定义，包括文档类型、查询类型、
 * 聚合类型、变更流类型等。
 *
 * ## 业务规则
 *
 * ### 文档类型规则
 * - 支持基础文档类型
 * - 支持嵌套文档类型
 * - 支持数组文档类型
 * - 支持联合文档类型
 *
 * ### 查询类型规则
 * - 支持查询过滤器
 * - 支持查询选项
 * - 支持查询投影
 * - 支持查询排序
 *
 * ### 聚合类型规则
 * - 支持聚合管道
 * - 支持聚合阶段
 * - 支持聚合选项
 * - 支持聚合结果
 *
 * ### 变更流类型规则
 * - 支持变更事件
 * - 支持变更类型
 * - 支持变更选项
 * - 支持变更结果
 *
 * @description MongoDB类型定义
 * @since 1.0.0
 */

import { ObjectId, Timestamp } from 'mongodb';

/**
 * MongoDB基础文档接口
 */
export interface IMongoDBDocument {
  /**
   * 文档ID
   */
  _id?: ObjectId;

  /**
   * 创建时间
   */
  createdAt?: Date;

  /**
   * 更新时间
   */
  updatedAt?: Date;

  /**
   * 版本号
   */
  __v?: number;
}

/**
 * MongoDB租户文档接口
 */
export interface IMongoDBTenantDocument extends IMongoDBDocument {
  /**
   * 租户ID
   */
  tenantId: string;

  /**
   * 组织ID
   */
  organizationId?: string;

  /**
   * 部门ID
   */
  departmentId?: string;

  /**
   * 用户ID
   */
  userId?: string;
}

/**
 * MongoDB审计文档接口
 */
export interface IMongoDBAuditDocument extends IMongoDBDocument {
  /**
   * 创建者ID
   */
  createdBy?: string;

  /**
   * 创建者名称
   */
  createdByName?: string;

  /**
   * 更新者ID
   */
  updatedBy?: string;

  /**
   * 更新者名称
   */
  updatedByName?: string;

  /**
   * 删除者ID
   */
  deletedBy?: string;

  /**
   * 删除者名称
   */
  deletedByName?: string;

  /**
   * 删除时间
   */
  deletedAt?: Date;

  /**
   * 是否已删除
   */
  isDeleted?: boolean;
}

/**
 * MongoDB软删除文档接口
 */
export interface IMongoDBSoftDeleteDocument extends IMongoDBDocument {
  /**
   * 是否已删除
   */
  isDeleted: boolean;

  /**
   * 删除时间
   */
  deletedAt?: Date;

  /**
   * 删除者ID
   */
  deletedBy?: string;
}

/**
 * MongoDB时间序列文档接口
 */
export interface IMongoDBTimeSeriesDocument extends IMongoDBDocument {
  /**
   * 时间字段
   */
  timestamp: Date;

  /**
   * 元数据字段
   */
  metadata?: Record<string, any>;

  /**
   * 测量值
   */
  measurements: Record<string, any>;
}

/**
 * MongoDB地理空间文档接口
 */
export interface IMongoDBGeospatialDocument extends IMongoDBDocument {
  /**
   * 地理位置
   */
  location: {
    type:
      | 'Point'
      | 'LineString'
      | 'Polygon'
      | 'MultiPoint'
      | 'MultiLineString'
      | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][];
  };

  /**
   * 地理标签
   */
  geoTag?: string;

  /**
   * 地理描述
   */
  geoDescription?: string;
}

/**
 * MongoDB全文搜索文档接口
 */
export interface IMongoDBTextSearchDocument extends IMongoDBDocument {
  /**
   * 全文搜索字段
   */
  text?: string;

  /**
   * 搜索标签
   */
  searchTags?: string[];

  /**
   * 搜索权重
   */
  searchWeight?: number;
}

/**
 * MongoDB查询过滤器类型
 */
export type MongoDBQueryFilter<T = any> = {
  [K in keyof T]?:
    | T[K]
    | {
        $eq?: T[K];
        $ne?: T[K];
        $gt?: T[K];
        $gte?: T[K];
        $lt?: T[K];
        $lte?: T[K];
        $in?: T[K][];
        $nin?: T[K][];
        $exists?: boolean;
        $type?: string | number;
        $regex?: string;
        $options?: string;
        $all?: T[K][];
        $elemMatch?: MongoDBQueryFilter<T[K]>;
        $size?: number;
        $mod?: [number, number];
        $where?: string;
        $geoWithin?: any;
        $geoIntersects?: any;
        $near?: any;
        $nearSphere?: any;
        $text?: {
          $search: string;
          $language?: string;
          $caseSensitive?: boolean;
          $diacriticSensitive?: boolean;
        };
      };
} & {
  $and?: MongoDBQueryFilter<T>[];
  $or?: MongoDBQueryFilter<T>[];
  $nor?: MongoDBQueryFilter<T>[];
  $not?: MongoDBQueryFilter<T>;
};

/**
 * MongoDB查询选项类型
 */
export interface MongoDBQueryOptions {
  /**
   * 排序
   */
  sort?: Record<string, 1 | -1>;

  /**
   * 限制数量
   */
  limit?: number;

  /**
   * 跳过数量
   */
  skip?: number;

  /**
   * 投影
   */
  projection?: Record<string, 0 | 1>;

  /**
   * 是否启用解释
   */
  explain?: boolean;

  /**
   * 是否启用游标
   */
  cursor?: boolean;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用磁盘使用
   */
  allowDiskUse?: boolean;

  /**
   * 是否启用提示
   */
  hint?: string | Record<string, 1 | -1>;

  /**
   * 是否启用注释
   */
  comment?: string;

  /**
   * 是否启用读取偏好
   */
  readPreference?:
    | 'primary'
    | 'primaryPreferred'
    | 'secondary'
    | 'secondaryPreferred'
    | 'nearest';

  /**
   * 是否启用读取关注
   */
  readConcern?:
    | 'local'
    | 'available'
    | 'majority'
    | 'linearizable'
    | 'snapshot';

  /**
   * 是否启用写入关注
   */
  writeConcern?: {
    w?: number | string;
    j?: boolean;
    wtimeout?: number;
  };
}

/**
 * MongoDB聚合阶段类型
 */
export type MongoDBAggregationStage =
  | { $addFields: Record<string, any> }
  | { $bucket: any }
  | { $bucketAuto: any }
  | { $collStats: any }
  | { $count: string }
  | { $currentOp: any }
  | { $densify: any }
  | { $documents: any }
  | { $facet: Record<string, MongoDBAggregationStage[]> }
  | { $fill: any }
  | { $geoNear: any }
  | { $graphLookup: any }
  | { $group: any }
  | { $indexStats: any }
  | { $limit: number }
  | { $listLocalSessions: any }
  | { $listSessions: any }
  | { $lookup: any }
  | { $match: MongoDBQueryFilter }
  | { $merge: any }
  | { $out: string | { db: string; coll: string } }
  | { $planCacheStats: any }
  | { $project: Record<string, 0 | 1 | any> }
  | { $redact: any }
  | { $replaceRoot: any }
  | { $replaceWith: any }
  | { $sample: { size: number } }
  | { $search: any }
  | { $searchMeta: any }
  | { $set: Record<string, any> }
  | { $setWindowFields: any }
  | { $skip: number }
  | { $sort: Record<string, 1 | -1> }
  | { $sortByCount: any }
  | { $unionWith: any }
  | { $unset: string | string[] }
  | {
      $unwind:
        | string
        | {
            path: string;
            includeArrayIndex?: string;
            preserveNullAndEmptyArrays?: boolean;
          };
    };

/**
 * MongoDB聚合管道类型
 */
export type MongoDBAggregationPipeline = MongoDBAggregationStage[];

/**
 * MongoDB聚合选项类型
 */
export interface MongoDBAggregationOptions extends MongoDBQueryOptions {
  /**
   * 聚合管道
   */
  pipeline: MongoDBAggregationPipeline;

  /**
   * 是否启用解释
   */
  explain?: boolean;

  /**
   * 是否启用游标
   */
  cursor?: boolean;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用磁盘使用
   */
  allowDiskUse?: boolean;

  /**
   * 是否启用提示
   */
  hint?: string | Record<string, 1 | -1>;

  /**
   * 是否启用注释
   */
  comment?: string;

  /**
   * 是否启用读取偏好
   */
  readPreference?:
    | 'primary'
    | 'primaryPreferred'
    | 'secondary'
    | 'secondaryPreferred'
    | 'nearest';

  /**
   * 是否启用读取关注
   */
  readConcern?:
    | 'local'
    | 'available'
    | 'majority'
    | 'linearizable'
    | 'snapshot';
}

/**
 * MongoDB变更流事件类型
 */
export interface MongoDBChangeStreamEvent<T = any> {
  /**
   * 事件ID
   */
  _id: any;

  /**
   * 操作类型
   */
  operationType:
    | 'insert'
    | 'update'
    | 'replace'
    | 'delete'
    | 'invalidate'
    | 'drop'
    | 'dropDatabase'
    | 'rename';

  /**
   * 完整文档
   */
  fullDocument?: T;

  /**
   * 文档键
   */
  documentKey: { _id: ObjectId };

  /**
   * 更新描述
   */
  updateDescription?: {
    updatedFields: Record<string, any>;
    removedFields: string[];
    truncatedArrays?: Array<{ field: string; newSize: number }>;
  };

  /**
   * 集群时间
   */
  clusterTime: Timestamp;

  /**
   * 事务信息
   */
  txnNumber?: number;

  /**
   * 会话信息
   */
  lsid?: any;

  /**
   * 命名空间
   */
  ns: {
    db: string;
    coll: string;
  };

  /**
   * 恢复令牌
   */
  resumeToken?: any;
}

/**
 * MongoDB变更流选项类型
 */
export interface MongoDBChangeStreamOptions {
  /**
   * 是否启用全文档
   */
  fullDocument?: boolean;

  /**
   * 是否启用更新查找
   */
  updateLookup?: boolean;

  /**
   * 是否启用恢复令牌
   */
  resumeAfter?: any;

  /**
   * 是否启用开始时间
   */
  startAtOperationTime?: Timestamp;

  /**
   * 批处理大小
   */
  batchSize?: number;

  /**
   * 最大等待时间（毫秒）
   */
  maxAwaitTimeMS?: number;

  /**
   * 是否启用读取偏好
   */
  readPreference?:
    | 'primary'
    | 'primaryPreferred'
    | 'secondary'
    | 'secondaryPreferred'
    | 'nearest';

  /**
   * 是否启用读取关注
   */
  readConcern?:
    | 'local'
    | 'available'
    | 'majority'
    | 'linearizable'
    | 'snapshot';
}

/**
 * MongoDB索引规范类型
 */
export interface MongoDBIndexSpec {
  /**
   * 索引键
   */
  key: Record<
    string,
    1 | -1 | 'text' | '2dsphere' | '2d' | 'geoHaystack' | 'hashed'
  >;

  /**
   * 索引选项
   */
  options?: {
    /**
     * 索引名称
     */
    name?: string;

    /**
     * 是否唯一
     */
    unique?: boolean;

    /**
     * 是否稀疏
     */
    sparse?: boolean;

    /**
     * 是否部分索引
     */
    partialFilterExpression?: MongoDBQueryFilter;

    /**
     * 是否TTL索引
     */
    expireAfterSeconds?: number;

    /**
     * 是否文本索引
     */
    text?: boolean;

    /**
     * 是否地理空间索引
     */
    geo?: boolean;

    /**
     * 是否哈希索引
     */
    hash?: boolean;

    /**
     * 是否通配符索引
     */
    wildcard?: boolean;

    /**
     * 是否隐藏索引
     */
    hidden?: boolean;

    /**
     * 是否后台构建
     */
    background?: boolean;

    /**
     * 其他选项
     */
    [key: string]: any;
  };
}

/**
 * MongoDB操作结果类型
 */
export interface MongoDBOperationResult<T = any> {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 结果数据
   */
  data?: T;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 操作时间（毫秒）
   */
  duration: number;

  /**
   * 操作类型
   */
  operation: string;

  /**
   * 集合名称
   */
  collection: string;

  /**
   * 文档数量
   */
  documentCount?: number;

  /**
   * 修改数量
   */
  modifiedCount?: number;

  /**
   * 删除数量
   */
  deletedCount?: number;

  /**
   * 插入数量
   */
  insertedCount?: number;

  /**
   * 匹配数量
   */
  matchedCount?: number;

  /**
   * 操作ID
   */
  operationId?: string;

  /**
   * 时间戳
   */
  timestamp: Date;
}

/**
 * MongoDB分页结果类型
 */
export interface MongoDBPaginatedResult<T = any> {
  /**
   * 数据列表
   */
  data: T[];

  /**
   * 总数量
   */
  total: number;

  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页数量
   */
  limit: number;

  /**
   * 总页数
   */
  totalPages: number;

  /**
   * 是否有下一页
   */
  hasNext: boolean;

  /**
   * 是否有上一页
   */
  hasPrev: boolean;

  /**
   * 下一页页码
   */
  nextPage?: number;

  /**
   * 上一页页码
   */
  prevPage?: number;
}

/**
 * MongoDB统计信息类型
 */
export interface MongoDBStats {
  /**
   * 集合数量
   */
  collections: number;

  /**
   * 文档数量
   */
  documents: number;

  /**
   * 索引数量
   */
  indexes: number;

  /**
   * 存储大小（字节）
   */
  storageSize: number;

  /**
   * 索引大小（字节）
   */
  indexSize: number;

  /**
   * 总大小（字节）
   */
  totalSize: number;

  /**
   * 平均文档大小（字节）
   */
  avgObjSize: number;

  /**
   * 数据大小（字节）
   */
  dataSize: number;

  /**
   * 是否已分片
   */
  sharded: boolean;

  /**
   * 是否已压缩
   */
  compressed: boolean;

  /**
   * 压缩比例
   */
  compressionRatio: number;
}
