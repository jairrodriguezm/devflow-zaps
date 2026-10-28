/**
 * Pure template interpolation function for DevFlow Zaps.
 * Replaces tokens in double curly braces, e.g. {{pr.author}}, {{ pr.title }}, {{pr.number}}.
 * Supports both dot-notated keys (e.g. "pr.author") and nested objects ({ pr: { author: '...' } }).
 */
export function interpolateTemplate(
  template: string,
  context: Record<string, any>
): string {
  if (!template) {
    return '';
  }

  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, token: string) => {
    // 1. Direct key match (e.g., context['pr.author'])
    if (Object.prototype.hasOwnProperty.call(context, token) && context[token] !== undefined && context[token] !== null) {
      return String(context[token]);
    }

    // 2. Nested path resolution (e.g., context.pr.author)
    const parts = token.split('.');
    let current: any = context;
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        current = undefined;
        break;
      }
      current = current[part];
    }

    if (current !== undefined && current !== null) {
      return String(current);
    }

    // If unresolved, retain original placeholder or empty string
    return '';
  });
}
