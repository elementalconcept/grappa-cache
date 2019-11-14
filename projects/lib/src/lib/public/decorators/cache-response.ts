import { Registry } from '@elemental-concept/grappa';

export function CacheResponse() {
  return (target: any, property: string) => {
    console.log(target);
    console.log(property);
  };
}
