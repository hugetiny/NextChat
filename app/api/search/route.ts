import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { getServerSideConfig } from "@/app/config/server";

// Fallback list if client fails to provide one
const DEFAULT_SEARCH_NODES = [
  "https://searx.be",
  "https://searx.work",
  "https://searx.aicamp.cn",
  "https://s.search.ch",
];

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { chatHistory, searchNode } = json;

    if (!chatHistory || chatHistory.length === 0) {
      return NextResponse.json(
        { error: "No chat history provided" },
        { status: 400 },
      );
    }

    const query = chatHistory[chatHistory.length - 1].content;

    let targetNode = searchNode;
    if (!targetNode) {
      targetNode =
        DEFAULT_SEARCH_NODES[
          Math.floor(Math.random() * DEFAULT_SEARCH_NODES.length)
        ];
    }

    if (targetNode.endsWith("/")) {
      targetNode = targetNode.slice(0, -1);
    }

    console.log(`[Search] Searching on ${targetNode} for: ${query}`);

    const searchUrl = new URL(`${targetNode}/search`);
    searchUrl.searchParams.append("q", query);
    searchUrl.searchParams.append("format", "json");

    let searchResults: any[] = [];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(searchUrl.toString(), {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        searchResults = data.results || [];
      } else {
        console.error(
          `[Search] Failed to fetch from ${targetNode}: ${res.status} ${res.statusText}`,
        );
      }
    } catch (e) {
      console.error(`[Search] Error fetching from ${targetNode}:`, e);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (searchResults.length > 0) {
          const sources = searchResults.slice(0, 5).map((r: any) => ({
            title: r.title,
            url: r.url,
            content: r.content,
          }));

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "sources",
                sources: sources,
              }) + "\n",
            ),
          );
        } else {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "message",
                content:
                  "I couldn't find any search results. I will try to answer based on my knowledge.\n\n",
              }) + "\n",
            ),
          );
        }

        try {
          const context = searchResults
            .slice(0, 5)
            .map(
              (r: any) =>
                `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`,
            )
            .join("\n\n");

          const systemPrompt = `You are a helpful assistant. 
                    User has asked a question: "${query}"
                    
                    Here are some search results that might help:
                    ${context}
                    
                    Please answer the user's question using the search results. 
                    Cite your sources using [1], [2] etc. where appropriate.
                    If the search results don't contain the answer, say so and use your own knowledge.`;

          if (process.env.OPENAI_API_KEY) {
            const { openai } = await import("@ai-sdk/openai");

            const result = await streamText({
              model: openai("gpt-4o-mini"),
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: query },
              ],
            });

            for await (const textPart of result.textStream) {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "message",
                    content: textPart,
                  }) + "\n",
                ),
              );
            }
          } else {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "message",
                  content:
                    "\n\n(Server-side RAG requires OPENAI_API_KEY env var. Showing search results only.)\n\n",
                }) + "\n",
              ),
            );

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "message",
                  content:
                    "### Search Summary\n" +
                    searchResults
                      .slice(0, 3)
                      .map((r: any) => `- **${r.title}**: ${r.content}`)
                      .join("\n"),
                }) + "\n",
              ),
            );
          }
        } catch (err: any) {
          console.error("[Search] RAG generation error:", err);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: "Failed to generate answer: " + err.message,
              }) + "\n",
            ),
          );
        }

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: true, message: e.message },
      { status: 500 },
    );
  }
}
