import { auth } from "@/app/(auth)/auth";
import { insertChunks } from "@/app/db";
import { getPdfContentFromUrl, getTextContentFromUrl, getHtmlContentFromUrl } from "@/utils/pdf";
import { openai } from "@ai-sdk/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { put } from "@vercel/blob";
import { embedMany } from "ai";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");
  const fileType = filename?.split('.').pop()?.toLowerCase();

  let session = await auth();

  if (!session) {
    return Response.redirect("/login");
  }

  const { user } = session;

  if (!user) {
    return Response.redirect("/login");
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  const { downloadUrl } = await put(`${user.email}/${filename}`, request.body, {
    access: "public",
  });

  let content;
  switch (fileType) {
    case 'pdf':
      content = await getPdfContentFromUrl(downloadUrl);
      break;
    case 'txt':
      content = await getTextContentFromUrl(downloadUrl);
      break;
    case 'html':
      content = await getHtmlContentFromUrl(downloadUrl);
      break;
    default:
      return new Response("Unsupported file type", { status: 400 });
  }

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
  });
  const chunkedContent = await textSplitter.createDocuments([content]);

  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: chunkedContent.map((chunk) => chunk.pageContent),
  });

  await insertChunks({
    chunks: chunkedContent.map((chunk, i) => ({
      id: `${user.email}/${filename}/${i}`,
      filePath: `${user.email}/${filename}`,
      content: chunk.pageContent,
      embedding: embeddings[i],
    })),
  });

  return Response.json({});
}
