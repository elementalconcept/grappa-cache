export interface RequestCacheRecord {
  baseUrl: string;
  endpoint: string;
  method: string;
  headers: { [ header: string ]: string; };
  params?: { [ param: string ]: string; };
  args: any[];
  processed: boolean;
}
