/**
 * 性能监控接口定义
 *
 * 定义了性能监控系统的核心接口，包括性能指标收集、
 * 性能分析、性能报告、性能告警等功能。
 *
 * ## 业务规则
 *
 * ### 性能指标收集规则
 * - 支持多种性能指标类型（响应时间、吞吐量、错误率等）
 * - 支持自定义性能指标
 * - 支持性能指标聚合和统计
 * - 支持性能指标历史数据存储
 *
 * ### 性能分析规则
 * - 支持性能趋势分析
 * - 支持性能瓶颈识别
 * - 支持性能对比分析
 * - 支持性能预测分析
 *
 * ### 性能报告规则
 * - 支持实时性能报告
 * - 支持历史性能报告
 * - 支持自定义报告格式
 * - 支持报告导出功能
 *
 * ### 性能告警规则
 * - 支持性能阈值告警
 * - 支持性能异常告警
 * - 支持告警通知机制
 * - 支持告警抑制和恢复
 *
 * @description 性能监控接口定义
 * @since 1.0.0
 */

import { Observable } from 'rxjs';
import type { IAsyncContext } from '../context/async-context.interface';

/**
 * 性能指标类型枚举
 */
export enum PerformanceMetricType {
  /**
   * 响应时间
   */
  RESPONSE_TIME = 'response_time',

  /**
   * 吞吐量
   */
  THROUGHPUT = 'throughput',

  /**
   * 错误率
   */
  ERROR_RATE = 'error_rate',

  /**
   * CPU 使用率
   */
  CPU_USAGE = 'cpu_usage',

  /**
   * 内存使用率
   */
  MEMORY_USAGE = 'memory_usage',

  /**
   * 磁盘使用率
   */
  DISK_USAGE = 'disk_usage',

  /**
   * 网络使用率
   */
  NETWORK_USAGE = 'network_usage',

  /**
   * 数据库连接数
   */
  DATABASE_CONNECTIONS = 'database_connections',

  /**
   * 缓存命中率
   */
  CACHE_HIT_RATE = 'cache_hit_rate',

  /**
   * 队列长度
   */
  QUEUE_LENGTH = 'queue_length',

  /**
   * 自定义指标
   */
  CUSTOM = 'custom',
}

/**
 * 性能指标聚合类型枚举
 */
export enum PerformanceAggregationType {
  /**
   * 平均值
   */
  AVERAGE = 'average',

  /**
   * 最小值
   */
  MIN = 'min',

  /**
   * 最大值
   */
  MAX = 'max',

  /**
   * 总和
   */
  SUM = 'sum',

  /**
   * 计数
   */
  COUNT = 'count',

  /**
   * 百分位数
   */
  PERCENTILE = 'percentile',

  /**
   * 中位数
   */
  MEDIAN = 'median',

  /**
   * 标准差
   */
  STANDARD_DEVIATION = 'standard_deviation',
}

/**
 * 性能告警级别枚举
 */
export enum PerformanceAlertLevel {
  /**
   * 信息
   */
  INFO = 'info',

  /**
   * 警告
   */
  WARNING = 'warning',

  /**
   * 错误
   */
  ERROR = 'error',

  /**
   * 严重
   */
  CRITICAL = 'critical',
}

/**
 * 性能指标接口
 */
export interface IPerformanceMetric {
  /**
   * 指标ID
   */
  id: string;

  /**
   * 指标名称
   */
  name: string;

  /**
   * 指标类型
   */
  type: PerformanceMetricType;

  /**
   * 指标值
   */
  value: number;

  /**
   * 指标单位
   */
  unit: string;

  /**
   * 指标标签
   */
  tags: Record<string, string>;

  /**
   * 指标元数据
   */
  metadata: Record<string, unknown>;

  /**
   * 时间戳
   */
  timestamp: Date;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 用户ID
   */
  userId?: string;

  /**
   * 组织ID
   */
  organizationId?: string;

  /**
   * 部门ID
   */
  departmentId?: string;

  /**
   * 请求ID
   */
  requestId?: string;

  /**
   * 关联ID
   */
  correlationId?: string;
}

/**
 * 性能指标聚合结果接口
 */
export interface IPerformanceAggregation {
  /**
   * 聚合类型
   */
  aggregationType: PerformanceAggregationType;

  /**
   * 聚合值
   */
  value: number;

  /**
   * 聚合时间范围
   */
  timeRange: {
    start: Date;
    end: Date;
  };

  /**
   * 聚合标签
   */
  tags: Record<string, string>;

  /**
   * 样本数量
   */
  sampleCount: number;

  /**
   * 百分位数（仅当聚合类型为 PERCENTILE 时）
   */
  percentile?: number;
}

/**
 * 性能报告接口
 */
export interface IPerformanceReport {
  /**
   * 报告ID
   */
  id: string;

  /**
   * 报告名称
   */
  name: string;

  /**
   * 报告类型
   */
  type: string;

  /**
   * 报告时间范围
   */
  timeRange: {
    start: Date;
    end: Date;
  };

  /**
   * 报告数据
   */
  data: {
    metrics: IPerformanceMetric[];
    aggregations: IPerformanceAggregation[];
    summary: Record<string, unknown>;
  };

  /**
   * 报告元数据
   */
  metadata: Record<string, unknown>;

  /**
   * 生成时间
   */
  generatedAt: Date;

  /**
   * 租户ID
   */
  tenantId?: string;
}

/**
 * 性能告警接口
 */
export interface IPerformanceAlert {
  /**
   * 告警ID
   */
  id: string;

  /**
   * 告警名称
   */
  name: string;

  /**
   * 告警级别
   */
  level: PerformanceAlertLevel;

  /**
   * 告警消息
   */
  message: string;

  /**
   * 告警指标
   */
  metric: {
    name: string;
    type: PerformanceMetricType;
    value: number;
    threshold: number;
  };

  /**
   * 告警时间
   */
  timestamp: Date;

  /**
   * 告警状态
   */
  status: 'active' | 'resolved' | 'suppressed';

  /**
   * 告警标签
   */
  tags: Record<string, string>;

  /**
   * 告警元数据
   */
  metadata: Record<string, unknown>;

  /**
   * 租户ID
   */
  tenantId?: string;
}

/**
 * 性能监控配置接口
 */
export interface IPerformanceMonitorConfiguration {
  /**
   * 是否启用监控
   */
  enabled: boolean;

  /**
   * 监控间隔（毫秒）
   */
  monitoringInterval: number;

  /**
   * 数据保留时间（天）
   */
  dataRetentionDays: number;

  /**
   * 是否启用实时监控
   */
  enableRealTimeMonitoring: boolean;

  /**
   * 是否启用历史数据存储
   */
  enableHistoricalStorage: boolean;

  /**
   * 是否启用告警
   */
  enableAlerts: boolean;

  /**
   * 告警阈值配置
   */
  alertThresholds: Record<
    string,
    {
      warning: number;
      error: number;
      critical: number;
    }
  >;

  /**
   * 是否启用性能分析
   */
  enableAnalysis: boolean;

  /**
   * 分析窗口大小（分钟）
   */
  analysisWindowSize: number;

  /**
   * 是否启用报告生成
   */
  enableReporting: boolean;

  /**
   * 报告生成间隔（小时）
   */
  reportGenerationInterval: number;

  /**
   * 是否启用多租户
   */
  enableMultiTenant: boolean;

  /**
   * 是否启用压缩
   */
  enableCompression: boolean;

  /**
   * 是否启用加密
   */
  enableEncryption: boolean;
}

/**
 * 性能监控统计信息接口
 */
export interface IPerformanceMonitorStatistics {
  /**
   * 总指标数量
   */
  totalMetrics: number;

  /**
   * 活跃指标数量
   */
  activeMetrics: number;

  /**
   * 总告警数量
   */
  totalAlerts: number;

  /**
   * 活跃告警数量
   */
  activeAlerts: number;

  /**
   * 总报告数量
   */
  totalReports: number;

  /**
   * 按类型统计
   */
  byMetricType: Record<PerformanceMetricType, number>;

  /**
   * 按告警级别统计
   */
  byAlertLevel: Record<PerformanceAlertLevel, number>;

  /**
   * 按租户统计
   */
  byTenant: Record<string, number>;

  /**
   * 按时间统计
   */
  byTime: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };

  /**
   * 最后更新时间
   */
  lastUpdatedAt: Date;
}

/**
 * 性能监控接口
 */
export interface IPerformanceMonitor {
  /**
   * 记录性能指标
   */
  recordMetric(
    metric: IPerformanceMetric,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 批量记录性能指标
   */
  recordMetrics(
    metrics: IPerformanceMetric[],
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 获取性能指标
   */
  getMetrics(
    name: string,
    timeRange: { start: Date; end: Date },
    context?: IAsyncContext,
  ): Observable<IPerformanceMetric[]>;

  /**
   * 获取性能指标聚合
   */
  getMetricAggregation(
    name: string,
    aggregationType: PerformanceAggregationType,
    timeRange: { start: Date; end: Date },
    context?: IAsyncContext,
  ): Observable<IPerformanceAggregation | null>;

  /**
   * 获取性能报告
   */
  getPerformanceReport(
    reportId: string,
    context?: IAsyncContext,
  ): Observable<IPerformanceReport | null>;

  /**
   * 生成性能报告
   */
  generatePerformanceReport(
    name: string,
    type: string,
    timeRange: { start: Date; end: Date },
    context?: IAsyncContext,
  ): Observable<IPerformanceReport>;

  /**
   * 获取性能告警
   */
  getAlerts(
    level?: PerformanceAlertLevel,
    status?: string,
    context?: IAsyncContext,
  ): Observable<IPerformanceAlert[]>;

  /**
   * 创建性能告警
   */
  createAlert(
    alert: Omit<IPerformanceAlert, 'id' | 'timestamp'>,
    context?: IAsyncContext,
  ): Observable<IPerformanceAlert>;

  /**
   * 解决性能告警
   */
  resolveAlert(alertId: string, context?: IAsyncContext): Observable<boolean>;

  /**
   * 抑制性能告警
   */
  suppressAlert(
    alertId: string,
    duration: number,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 获取性能监控统计信息
   */
  getStatistics(
    context?: IAsyncContext,
  ): Observable<IPerformanceMonitorStatistics>;

  /**
   * 清理过期数据
   */
  cleanupExpiredData(
    retentionDays: number,
    context?: IAsyncContext,
  ): Observable<number>;

  /**
   * 健康检查
   */
  healthCheck(context?: IAsyncContext): Observable<boolean>;

  /**
   * 启动监控
   */
  start(): Promise<void>;

  /**
   * 停止监控
   */
  stop(): Promise<void>;

  /**
   * 检查是否已启动
   */
  isStarted(): boolean;
}
