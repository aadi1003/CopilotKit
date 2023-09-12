import { MinimalChatGPTMessage } from "./minimal-chat-gpt-message";

export type ChatlikeApiEndpointImpl = (
  abortSignal: AbortSignal,
  messages: MinimalChatGPTMessage[],
  forwardedProps?: { [key: string]: any }
) => Promise<string>;


export type StreamingChatlikeApiEndpointImpl = (
  abortSignal: AbortSignal,
  messages: MinimalChatGPTMessage[],
  forwardedProps?: { [key: string]: any }
) => Promise<ReadableStream<string>>;


export class ChatlikeApiEndpoint {
  public run: StreamingChatlikeApiEndpointImpl;

  constructor(run: StreamingChatlikeApiEndpointImpl) {
    this.run = run;
  }

  /**
   * Creates a new instance of ChatlikeApiEndpoint with the provided API endpoint.
   * @param apiEndpoint The URL of the OpenAI-compatible API endpoint.
   * @returns A new instance of ChatlikeApiEndpoint.
   */
  static standardOpenAIEndpoint(apiEndpoint: string): ChatlikeApiEndpoint {
    return new ChatlikeApiEndpoint(
      async (
        abortSignal: AbortSignal,
        messages: MinimalChatGPTMessage[],
        forwardedProps?: { [key: string]: any }
      ) => {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          body: JSON.stringify({
            ...forwardedProps,
            messages: messages,
          }),
          signal: abortSignal,
        });

        const bodySteram: ReadableStream<Uint8Array> | null = res.body;
        if (!bodySteram) {
          throw new Error("The response body is empty.");
        }

        const fullText = await res.text();

        // return a stream which emits the full text and then closes

        return new ReadableStream({
          start(controller) {
            controller.enqueue(fullText);
            controller.close();
          },
        });

        // return

        // // map the stream to a stream of strings
        // const stringStream = bodySteram.pipeThrough(
        //   new TextDecoderStream()
        // );

        // return stringStream;
      }
    );
  }

  /**
   * Creates a fully customized instance of ChatlikeApiEndpoint.
   * @param run - The implementation of the ChatlikeApiEndpointImpl interface.
   * @returns A new instance of ChatlikeApiEndpoint .
   */
  static custom(run: StreamingChatlikeApiEndpointImpl): ChatlikeApiEndpoint {
    return new ChatlikeApiEndpoint(run);
  }
}

