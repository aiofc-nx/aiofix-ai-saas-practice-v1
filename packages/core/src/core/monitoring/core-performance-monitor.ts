/**
 * CorePerformanceMonitor - 核心性能监控实现
 *
 * 提供了完整的性能监控功能，包括性能指标收集、分析、
 * 报告、告警等企业级特性。
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
 * @description 核心性能监控实现类
 * @example
 * ```typescript
 * const performanceMonitor = new CorePerformanceMonitor(logger);
 * await performanceMonitor.start();
 *
 * // 记录性能指标
 * await performanceMonitor.recordMetric({
 *   id: 'metric-1',
 *   name: 'api.response_time',
 *   type: PerformanceMetricType.RESPONSE_TIME,
 *   value: 150,
 *   unit: 'ms',
 *   tags: { endpoint: '/api/users' },
 *   metadata: {},
 *   timestamp: new Date()
 * }).toPromise();
 *
 * // 获取性能报告
 * const report = await performanceMonitor.generatePerformanceReport(
 *   'API Performance Report',
 *   'api_performance',
 *   { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() }
 * ).toPromise();
 *
 * await performanceMonitor.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
// import { map, catchError, tap } from 'rxjs/operators';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { IAsyncContext } from '../context/async-context.interface';
import {
  IPerformanceMonitor,
  IPerformanceMetric,
  IPerformanceAggregation,
  IPerformanceReport,
  IPerformanceAlert,
  type IPerformanceMonitorConfiguration,
  IPerformanceMonitorStatistics,
  PerformanceMetricType,
  PerformanceAggregationType,
  PerformanceAlertLevel,
} from './performance-monitor.interface';

/**
 * 核心性能监控
 */
@Injectable()
export class CorePerformanceMonitor implements IPerformanceMonitor {
  private readonly metrics = new Map<string, IPerformanceMetric[]>();
  private readonly alerts = new Map<string, IPerformanceAlert[]>();
  private readonly reports = new Map<string, IPerformanceReport>();
  private readonly statistics: IPerformanceMonitorStatistics = {
    totalMetrics: 0,
    activeMetrics: 0,
    totalAlerts: 0,
    activeAlerts: 0,
    totalReports: 0,
    byMetricType: {} as Record<PerformanceMetricType, number>,
    byAlertLevel: {} as Record<PerformanceAlertLevel, number>,
    byTenant: {},
    byTime: {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      lastMonth: 0,
    },
    lastUpdatedAt: new Date(),
  };

  private _isStarted = false;
  private _monitoringTimer?: ReturnType<typeof globalThis.setInterval>;
  private _cleanupTimer?: ReturnType<typeof globalThis.setInterval>;
  private _reportTimer?: ReturnType<typeof globalThis.setInterval>;

  constructor(
    private readonly logger: ILoggerService,
    private readonly configuration: IPerformanceMonitorConfiguration = {
      enabled: true,
      monitoringInterval: 60000,
      dataRetentionDays: 30,
      enableRealTimeMonitoring: true,
      enableHistoricalStorage: true,
      enableAlerts: true,
      alertThresholds: {},
      enableAnalysis: true,
      analysisWindowSize: 5,
      enableReporting: true,
      reportGenerationInterval: 24,
      enableMultiTenant: true,
      enableCompression: false,
      enableEncryption: false,
    },
  ) {}

  /**
   * 记录性能指标
   */
  public recordMetric(
    metric: IPerformanceMetric,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    if (!this.configuration.enabled) {
      return of(false);
    }

    this.logger.debug(
      `Recording performance metric: ${metric.name}`,
      LogContext.SYSTEM,
      {
        metricId: metric.id,
        metricName: metric.name,
        metricType: metric.type,
        value: metric.value,
        unit: metric.unit,
        tags: metric.tags,
      },
    );

    try {
      // 存储指标
      const metricList = this.metrics.get(metric.name) || [];
      metricList.push(metric);
      this.metrics.set(metric.name, metricList);

      // 更新统计信息
      this.updateStatistics(metric);

      // 检查告警阈值
      if (this.configuration.enableAlerts) {
        this.checkAlertThresholds(metric);
      }

      this.logger.debug(
        `Performance metric recorded: ${metric.name}`,
        LogContext.SYSTEM,
        {
          metricId: metric.id,
          metricName: metric.name,
          value: metric.value,
        },
      );

      return of(true);
    } catch (error) {
      this.logger.error(
        `Failed to record performance metric: ${metric.name}`,
        LogContext.SYSTEM,
        {
          metricId: metric.id,
          metricName: metric.name,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 批量记录性能指标
   */
  public recordMetrics(
    metrics: IPerformanceMetric[],
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.info(
      `Recording ${metrics.length} performance metrics`,
      LogContext.SYSTEM,
      {
        metricCount: metrics.length,
        metricNames: metrics.map((m) => m.name),
      },
    );

    try {
      for (const metric of metrics) {
        const metricList = this.metrics.get(metric.name) || [];
        metricList.push(metric);
        this.metrics.set(metric.name, metricList);

        this.updateStatistics(metric);

        if (this.configuration.enableAlerts) {
          this.checkAlertThresholds(metric);
        }
      }

      this.logger.info(
        `Performance metrics recorded: ${metrics.length}`,
        LogContext.SYSTEM,
        { metricCount: metrics.length },
      );

      return of(true);
    } catch (error) {
      this.logger.error(
        `Failed to record performance metrics`,
        LogContext.SYSTEM,
        {
          metricCount: metrics.length,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 获取性能指标
   */
  public getMetrics(
    name: string,
    timeRange: { start: Date; end: Date },
    _context?: IAsyncContext,
  ): Observable<IPerformanceMetric[]> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.debug(
      `Getting performance metrics: ${name}`,
      LogContext.SYSTEM,
      {
        metricName: name,
        timeRange,
      },
    );

    try {
      const metricList = this.metrics.get(name) || [];
      const filteredMetrics = metricList.filter(
        (metric) =>
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end,
      );

      this.logger.debug(
        `Performance metrics retrieved: ${name}`,
        LogContext.SYSTEM,
        {
          metricName: name,
          metricCount: filteredMetrics.length,
        },
      );

      return of(filteredMetrics);
    } catch (error) {
      this.logger.error(
        `Failed to get performance metrics: ${name}`,
        LogContext.SYSTEM,
        {
          metricName: name,
          timeRange,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取性能指标聚合
   */
  public getMetricAggregation(
    name: string,
    aggregationType: PerformanceAggregationType,
    timeRange: { start: Date; end: Date },
    _context?: IAsyncContext,
  ): Observable<IPerformanceAggregation | null> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.debug(
      `Getting metric aggregation: ${name}`,
      LogContext.SYSTEM,
      {
        metricName: name,
        aggregationType,
        timeRange,
      },
    );

    try {
      const metricList = this.metrics.get(name) || [];
      const filteredMetrics = metricList.filter(
        (metric) =>
          metric.timestamp >= timeRange.start &&
          metric.timestamp <= timeRange.end,
      );

      if (filteredMetrics.length === 0) {
        return of(null);
      }

      const values = filteredMetrics.map((metric) => metric.value);
      const aggregation = this.calculateAggregation(
        values,
        aggregationType,
        timeRange,
        filteredMetrics[0].tags,
      );

      this.logger.debug(
        `Metric aggregation retrieved: ${name}`,
        LogContext.SYSTEM,
        {
          metricName: name,
          aggregationType,
          value: aggregation.value,
          sampleCount: aggregation.sampleCount,
        },
      );

      return of(aggregation);
    } catch (error) {
      this.logger.error(
        `Failed to get metric aggregation: ${name}`,
        LogContext.SYSTEM,
        {
          metricName: name,
          aggregationType,
          timeRange,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取性能报告
   */
  public getPerformanceReport(
    reportId: string,
    _context?: IAsyncContext,
  ): Observable<IPerformanceReport | null> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.debug(
      `Getting performance report: ${reportId}`,
      LogContext.SYSTEM,
      { reportId },
    );

    const report = this.reports.get(reportId) || null;
    return of(report);
  }

  /**
   * 生成性能报告
   */
  public generatePerformanceReport(
    name: string,
    type: string,
    timeRange: { start: Date; end: Date },
    context?: IAsyncContext,
  ): Observable<IPerformanceReport> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.info(
      `Generating performance report: ${name}`,
      LogContext.SYSTEM,
      {
        reportName: name,
        reportType: type,
        timeRange,
      },
    );

    try {
      const reportId = uuidv4();
      const report: IPerformanceReport = {
        id: reportId,
        name,
        type,
        timeRange,
        data: {
          metrics: [],
          aggregations: [],
          summary: {},
        },
        metadata: {
          generatedBy: 'core-performance-monitor',
          generatedAt: new Date(),
        },
        generatedAt: new Date(),
        tenantId: context?.getTenantId(),
      };

      // 收集所有指标
      for (const [, metricList] of this.metrics.entries()) {
        const filteredMetrics = metricList.filter(
          (metric) =>
            metric.timestamp >= timeRange.start &&
            metric.timestamp <= timeRange.end,
        );
        report.data.metrics.push(...filteredMetrics);
      }

      // 生成聚合数据
      for (const metricName of this.metrics.keys()) {
        const aggregation = this.getMetricAggregation(
          metricName,
          PerformanceAggregationType.AVERAGE,
          timeRange,
          context,
        );

        aggregation.subscribe((agg) => {
          if (agg) {
            report.data.aggregations.push(agg);
          }
        });
      }

      // 生成摘要
      report.data.summary = this.generateReportSummary(report.data.metrics);

      // 存储报告
      this.reports.set(reportId, report);

      this.logger.info(
        `Performance report generated: ${name}`,
        LogContext.SYSTEM,
        {
          reportId,
          reportName: name,
          metricCount: report.data.metrics.length,
          aggregationCount: report.data.aggregations.length,
        },
      );

      return of(report);
    } catch (error) {
      this.logger.error(
        `Failed to generate performance report: ${name}`,
        LogContext.SYSTEM,
        {
          reportName: name,
          reportType: type,
          timeRange,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取性能告警
   */
  public getAlerts(
    level?: PerformanceAlertLevel,
    status?: string,
    _context?: IAsyncContext,
  ): Observable<IPerformanceAlert[]> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.debug('Getting performance alerts', LogContext.SYSTEM, {
      level,
      status,
    });

    try {
      let allAlerts: IPerformanceAlert[] = [];
      for (const alertList of this.alerts.values()) {
        allAlerts = [...allAlerts, ...alertList];
      }

      let filteredAlerts = allAlerts;

      if (level) {
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.level === level,
        );
      }

      if (status) {
        filteredAlerts = filteredAlerts.filter(
          (alert) => alert.status === status,
        );
      }

      this.logger.debug('Performance alerts retrieved', LogContext.SYSTEM, {
        totalCount: allAlerts.length,
        filteredCount: filteredAlerts.length,
        level,
        status,
      });

      return of(filteredAlerts);
    } catch (error) {
      this.logger.error(
        'Failed to get performance alerts',
        LogContext.SYSTEM,
        {
          level,
          status,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 创建性能告警
   */
  public createAlert(
    alert: Omit<IPerformanceAlert, 'id' | 'timestamp'>,
    _context?: IAsyncContext,
  ): Observable<IPerformanceAlert> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.warn(
      `Creating performance alert: ${alert.name}`,
      LogContext.SYSTEM,
      {
        alertName: alert.name,
        alertLevel: alert.level,
        metricName: alert.metric.name,
        metricValue: alert.metric.value,
        threshold: alert.metric.threshold,
      },
    );

    try {
      const alertId = uuidv4();
      const newAlert: IPerformanceAlert = {
        ...alert,
        id: alertId,
        timestamp: new Date(),
      };

      // 存储告警
      const alertList = this.alerts.get(alert.metric.name) || [];
      alertList.push(newAlert);
      this.alerts.set(alert.metric.name, alertList);

      // 更新统计信息
      this.statistics.totalAlerts++;
      this.statistics.activeAlerts++;
      this.statistics.byAlertLevel[alert.level] =
        (this.statistics.byAlertLevel[alert.level] || 0) + 1;

      this.logger.warn(
        `Performance alert created: ${alert.name}`,
        LogContext.SYSTEM,
        {
          alertId,
          alertName: alert.name,
          alertLevel: alert.level,
        },
      );

      return of(newAlert);
    } catch (error) {
      this.logger.error(
        `Failed to create performance alert: ${alert.name}`,
        LogContext.SYSTEM,
        {
          alertName: alert.name,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 解决性能告警
   */
  public resolveAlert(
    alertId: string,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.info(
      `Resolving performance alert: ${alertId}`,
      LogContext.SYSTEM,
      { alertId },
    );

    try {
      for (const alertList of this.alerts.values()) {
        const alert = alertList.find((a) => a.id === alertId);
        if (alert) {
          alert.status = 'resolved';
          this.statistics.activeAlerts--;
          this.logger.info(
            `Performance alert resolved: ${alertId}`,
            LogContext.SYSTEM,
            { alertId },
          );
          return of(true);
        }
      }

      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to resolve performance alert: ${alertId}`,
        LogContext.SYSTEM,
        {
          alertId,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 抑制性能告警
   */
  public suppressAlert(
    alertId: string,
    duration: number,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.logger.info(
      `Suppressing performance alert: ${alertId}`,
      LogContext.SYSTEM,
      { alertId, duration },
    );

    try {
      for (const alertList of this.alerts.values()) {
        const alert = alertList.find((a) => a.id === alertId);
        if (alert) {
          alert.status = 'suppressed';
          this.statistics.activeAlerts--;
          this.logger.info(
            `Performance alert suppressed: ${alertId}`,
            LogContext.SYSTEM,
            { alertId, duration },
          );
          return of(true);
        }
      }

      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to suppress performance alert: ${alertId}`,
        LogContext.SYSTEM,
        {
          alertId,
          duration,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 获取性能监控统计信息
   */
  public getStatistics(
    _context?: IAsyncContext,
  ): Observable<IPerformanceMonitorStatistics> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    this.updateStatistics();
    return of({ ...this.statistics });
  }

  /**
   * 清理过期数据
   */
  public cleanupExpiredData(
    retentionDays: number,
    _context?: IAsyncContext,
  ): Observable<number> {
    if (!this._isStarted) {
      return throwError(() => new Error('Performance monitor is not started'));
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    let cleanedCount = 0;

    this.logger.info(
      `Cleaning up expired performance data older than ${retentionDays} days`,
      LogContext.SYSTEM,
      { retentionDays, cutoffDate },
    );

    try {
      // 清理过期指标
      for (const [metricName, metricList] of this.metrics.entries()) {
        const validMetrics = metricList.filter(
          (metric) => metric.timestamp >= cutoffDate,
        );
        const removedCount = metricList.length - validMetrics.length;
        cleanedCount += removedCount;
        this.metrics.set(metricName, validMetrics);
      }

      // 清理过期告警
      for (const [metricName, alertList] of this.alerts.entries()) {
        const validAlerts = alertList.filter(
          (alert) => alert.timestamp >= cutoffDate,
        );
        this.alerts.set(metricName, validAlerts);
      }

      // 清理过期报告
      for (const [reportId, report] of this.reports.entries()) {
        if (report.generatedAt < cutoffDate) {
          this.reports.delete(reportId);
          cleanedCount++;
        }
      }

      this.logger.info(
        `Expired performance data cleanup completed`,
        LogContext.SYSTEM,
        { cleanedCount, retentionDays },
      );

      return of(cleanedCount);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired performance data`,
        LogContext.SYSTEM,
        {
          retentionDays,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 健康检查
   */
  public healthCheck(_context?: IAsyncContext): Observable<boolean> {
    return of(this._isStarted);
  }

  /**
   * 启动监控
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      this.logger.warn(
        'Performance monitor is already started',
        LogContext.SYSTEM,
      );
      return;
    }

    this.logger.info('Starting performance monitor...', LogContext.SYSTEM);

    // 启动监控定时器
    this._monitoringTimer = globalThis.setInterval(() => {
      this.updateStatistics();
    }, this.configuration.monitoringInterval);

    // 启动清理定时器
    this._cleanupTimer = globalThis.setInterval(
      () => {
        this.cleanupExpiredData(
          this.configuration.dataRetentionDays,
        ).subscribe();
      },
      24 * 60 * 60 * 1000,
    ); // 每天清理一次

    // 启动报告定时器
    if (this.configuration.enableReporting) {
      this._reportTimer = globalThis.setInterval(
        () => {
          const now = new Date();
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          this.generatePerformanceReport('Daily Performance Report', 'daily', {
            start: yesterday,
            end: now,
          }).subscribe();
        },
        this.configuration.reportGenerationInterval * 60 * 60 * 1000,
      );
    }

    this._isStarted = true;
    this.logger.info(
      'Performance monitor started successfully',
      LogContext.SYSTEM,
    );
  }

  /**
   * 停止监控
   */
  public async stop(): Promise<void> {
    if (!this._isStarted) {
      this.logger.warn('Performance monitor is not started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Stopping performance monitor...', LogContext.SYSTEM);

    // 停止定时器
    if (this._monitoringTimer) {
      globalThis.clearInterval(this._monitoringTimer);
      this._monitoringTimer = undefined;
    }

    if (this._cleanupTimer) {
      globalThis.clearInterval(this._cleanupTimer);
      this._cleanupTimer = undefined;
    }

    if (this._reportTimer) {
      globalThis.clearInterval(this._reportTimer);
      this._reportTimer = undefined;
    }

    this._isStarted = false;
    this.logger.info(
      'Performance monitor stopped successfully',
      LogContext.SYSTEM,
    );
  }

  /**
   * 检查是否已启动
   */
  public isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(metric?: IPerformanceMetric): void {
    if (metric) {
      this.statistics.totalMetrics++;
      this.statistics.byMetricType[metric.type] =
        (this.statistics.byMetricType[metric.type] || 0) + 1;

      const tenantId = metric.tenantId || 'unknown';
      this.statistics.byTenant[tenantId] =
        (this.statistics.byTenant[tenantId] || 0) + 1;
    }

    // 更新活跃指标数量
    this.statistics.activeMetrics = Array.from(this.metrics.values()).reduce(
      (total, metricList) => total + metricList.length,
      0,
    );

    // 更新活跃告警数量
    this.statistics.activeAlerts = Array.from(this.alerts.values()).reduce(
      (total, alertList) =>
        total + alertList.filter((a) => a.status === 'active').length,
      0,
    );

    // 更新报告数量
    this.statistics.totalReports = this.reports.size;

    this.statistics.lastUpdatedAt = new Date();
  }

  /**
   * 检查告警阈值
   */
  private checkAlertThresholds(metric: IPerformanceMetric): void {
    const thresholds = this.configuration.alertThresholds[metric.name];
    if (!thresholds) return;

    let alertLevel: PerformanceAlertLevel | undefined;
    let threshold: number | undefined;

    if (metric.value >= thresholds.critical) {
      alertLevel = PerformanceAlertLevel.CRITICAL;
      threshold = thresholds.critical;
    } else if (metric.value >= thresholds.error) {
      alertLevel = PerformanceAlertLevel.ERROR;
      threshold = thresholds.error;
    } else if (metric.value >= thresholds.warning) {
      alertLevel = PerformanceAlertLevel.WARNING;
      threshold = thresholds.warning;
    }

    if (alertLevel && threshold) {
      this.createAlert({
        name: `${metric.name}_threshold_alert`,
        level: alertLevel,
        message: `Metric ${metric.name} exceeded threshold: ${metric.value} >= ${threshold}`,
        metric: {
          name: metric.name,
          type: metric.type,
          value: metric.value,
          threshold,
        },
        status: 'active',
        tags: metric.tags,
        metadata: metric.metadata,
        tenantId: metric.tenantId,
      }).subscribe();
    }
  }

  /**
   * 计算聚合
   */
  private calculateAggregation(
    values: number[],
    aggregationType: PerformanceAggregationType,
    timeRange: { start: Date; end: Date },
    tags: Record<string, string>,
  ): IPerformanceAggregation {
    let value: number;

    switch (aggregationType) {
      case PerformanceAggregationType.AVERAGE:
        value = values.reduce((sum, val) => sum + val, 0) / values.length;
        break;
      case PerformanceAggregationType.MIN:
        value = Math.min(...values);
        break;
      case PerformanceAggregationType.MAX:
        value = Math.max(...values);
        break;
      case PerformanceAggregationType.SUM:
        value = values.reduce((sum, val) => sum + val, 0);
        break;
      case PerformanceAggregationType.COUNT:
        value = values.length;
        break;
      case PerformanceAggregationType.MEDIAN: {
        const sorted = [...values].sort((a, b) => a - b);
        value =
          sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)];
        break;
      }
      default:
        value = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    return {
      aggregationType,
      value,
      timeRange,
      tags,
      sampleCount: values.length,
    };
  }

  /**
   * 生成报告摘要
   */
  private generateReportSummary(
    metrics: IPerformanceMetric[],
  ): Record<string, unknown> {
    const summary: Record<string, unknown> = {
      totalMetrics: metrics.length,
      metricTypes: {},
      averageValues: {},
      minValues: {},
      maxValues: {},
    };

    // 按类型分组
    const byType = metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.type]) {
          acc[metric.type] = [];
        }
        acc[metric.type].push(metric.value);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    // 计算统计信息
    for (const [type, values] of Object.entries(byType)) {
      (summary.metricTypes as Record<string, number>)[type] = values.length;
      (summary.averageValues as Record<string, number>)[type] =
        values.reduce((sum, val) => sum + val, 0) / values.length;
      (summary.minValues as Record<string, number>)[type] = Math.min(...values);
      (summary.maxValues as Record<string, number>)[type] = Math.max(...values);
    }

    return summary;
  }
}
