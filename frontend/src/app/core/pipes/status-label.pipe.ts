import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/_/g, ' ');
  }
}
