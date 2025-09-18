/**
 * Fastify模块
 *
 * @description Fastify Web框架集成模块
 * @since 1.0.0
 */

import { Module, DynamicModule } from '@nestjs/common';

/**
 * Fastify模块
 */
@Module({})
export class FastifyModule {
  /**
   * 创建动态模块
   */
  static forRoot(): DynamicModule {
    return {
      module: FastifyModule,
      providers: [],
      exports: [],
      global: true,
    };
  }

  /**
   * 创建异步动态模块
   */
  static forRootAsync(): DynamicModule {
    return {
      module: FastifyModule,
      providers: [],
      exports: [],
      global: true,
    };
  }
}
