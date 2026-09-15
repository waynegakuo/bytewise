import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns an empty string for blank input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('renders headings, lists, and emphasis from markdown', () => {
    const html = pipe.transform(`## In stock

- **Laptop Pro** for heavy work
- Wireless Headphones

Ask me for *prices*.`);

    expect(html).toContain('<h2>');
    expect(html).toContain('In stock');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
    expect(html).toContain('<strong>Laptop Pro</strong>');
    expect(html).toContain('<em>prices</em>');
  });
});
