import { Registry } from '@elemental-concept/grappa';

import { CustomMetadataKey } from '../../internal/constants';
import { MethodOptions } from '../../internal/method-options';

export function CacheRequest(replyWith: any = null) {
  return (target: any, property: string) => {
    Registry.putCustomMetadata(
      target,
      property,
      CustomMetadataKey,
      { cacheMode: 'replayRequest', replyWith } as MethodOptions);
  };
}
