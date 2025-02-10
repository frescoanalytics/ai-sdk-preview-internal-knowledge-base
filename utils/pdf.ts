import pdf from "pdf-parse";

export async function getPdfContentFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const data = await pdf(buffer);
  return data.text;
}

export async function getTextContentFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const text = await response.text();
  return text;
}

export async function getHtmlContentFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const html = await response.text();
  // Strip HTML tags and decode HTML entities
  const text = html
    .replace(/<style[^>]*>.*<\/style>/gm, '') // Remove style tags and their content
    .replace(/<script[^>]*>.*<\/script>/gm, '') // Remove script tags and their content
    .replace(/<[^>]+>/g, ' ') // Remove remaining HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  return text;
}
