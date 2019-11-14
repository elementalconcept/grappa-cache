import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function sha256(value: string): Observable<string> {
  return from(crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
    .pipe(
      map(buffer => Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')));
}
