import { ObserveOptions } from '@elemental-concept/grappa';

export interface RequestCacheRecord {
  baseUrl: string;
  endpoint: string;
  method: string;
  observe: ObserveOptions;
  headers: { [ header: string ]: string; };
  params?: { [ param: string ]: string; };
  args: any[];
  processed: boolean;
}
