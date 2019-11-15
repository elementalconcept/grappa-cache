import { Registry } from '@elemental-concept/grappa';

import { MethodOptions } from '../../internal/method-options';
import { CustomMetadataKey } from '../../internal/constants';

export function CacheResponse() {
  return (target: any, property: string) => {
    Registry.putCustomMetadata(
      target,
      property,
      CustomMetadataKey,
      { cacheMode: 'response' } as MethodOptions);
  };
}
