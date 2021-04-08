export interface EventProcessor<TConfig = any, TEvent = any, TContext = any, TOutput = any> {
  process: ProcessMethod<TConfig, TEvent, TContext, TOutput>
}

export type ProcessMethod<TConfig, TEvent, TContext, TOutput = any> =
  (config: TConfig, event: TEvent, context: TContext) => null | TOutput | Promise<TOutput>

export type HttpMethod =
| 'GET' | 'HEAD' | 'POST' | 'PUT' |'DELETE'
| 'CONNECT' | 'OPTIONS' | 'TRACE' | 'PATCH';
