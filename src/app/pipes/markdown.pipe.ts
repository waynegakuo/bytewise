import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

marked.setOptions({
  async: false,
  gfm: true,
  breaks: true
});

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return marked.parse(value, { async: false }) as string;
  }
}
