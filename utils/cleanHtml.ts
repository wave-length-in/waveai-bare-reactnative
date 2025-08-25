export function cleanHtml(htmlString: string): string {
  return htmlString.replace(/```html|```/g, "").trim();
}