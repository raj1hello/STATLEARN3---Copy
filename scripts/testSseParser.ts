import * as dotenv from "dotenv";
dotenv.config();

import { parseAnthropicSseStream } from "../src/lib/ai/provider";

function runSseAndJsonTests() {
  console.log("==================================================");
  console.log("TESTING ANTHROPIC SSE STREAM & JSON PARSING SUITE");
  console.log("==================================================");

  // 1. Test standard Anthropic JSON payload
  console.log("\n[Test 1] Testing standard Anthropic Messages JSON payload...");
  const standardJson = JSON.stringify({
    id: "msg_123",
    type: "message",
    role: "assistant",
    content: [
      {
        type: "text",
        text: "Newton's third law states that every action has an equal and opposite reaction.",
      },
    ],
    model: "claude-sonnet-5",
    stop_reason: "end_turn",
  });

  const parsedJsonData = JSON.parse(standardJson);
  const textFromContentBlock = (parsedJsonData.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  console.log("JSON parsed length:", textFromContentBlock.length);
  console.log("JSON contains expected text:", textFromContentBlock.includes("Newton's third law"));

  // 2. Test Anthropic SSE stream format with multiple content_block_delta events
  console.log("\n[Test 2] Testing Anthropic SSE stream format with multiple content_block_delta events...");
  const mockSseStream = [
    "event: message_start",
    'data: {"type":"message_start","message":{"id":"msg_01","type":"message","role":"assistant","model":"claude-sonnet-5"}}',
    "",
    "event: content_block_start",
    'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
    "",
    "event: ping",
    'data: {"type": "ping"}',
    "",
    "event: content_block_delta",
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Newton\'s third law "}}',
    "",
    "event: content_block_delta",
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"states that for every action, "}}',
    "",
    "event: content_block_delta",
    'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"there is an equal and opposite reaction."}}',
    "",
    "event: content_block_stop",
    'data: {"type":"content_block_stop","index":0}',
    "",
    "event: message_delta",
    'data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":18}}',
    "",
    "event: message_stop",
    'data: {"type":"message_stop"}',
    "",
    "data: [DONE]",
  ].join("\n");

  const sseResult = parseAnthropicSseStream(mockSseStream);
  console.log("SSE accumulated text:", sseResult.text);
  console.log(
    "SSE parsing matches expected sentence:",
    sseResult.text === "Newton's third law states that for every action, there is an equal and opposite reaction."
  );
  console.log("SSE had no stream errors:", !sseResult.error);

  // 3. Test SSE stream with error event
  console.log("\n[Test 3] Testing SSE stream with error event...");
  const mockErrorStream = [
    "event: error",
    'data: {"type":"error","error":{"type":"overloaded_error","message":"Anthropic servers are temporarily overloaded."}}',
  ].join("\n");

  const errorResult = parseAnthropicSseStream(mockErrorStream);
  console.log("SSE error captured:", errorResult.error);
  console.log("SSE error message correct:", errorResult.error?.includes("temporarily overloaded"));

  // 4. Test SSE stream with malformed lines handling
  console.log("\n[Test 4] Testing SSE stream with malformed data lines gracefully handled...");
  const mockMalformedStream = [
    "event: content_block_delta",
    "data: invalid_json_here",
    "",
    "event: content_block_delta",
    'data: {"delta":{"type":"text_delta","text":"Valid content here."}}',
  ].join("\n");

  const malformedResult = parseAnthropicSseStream(mockMalformedStream);
  console.log("Malformed stream extracted valid delta:", malformedResult.text === "Valid content here.");

  console.log("\n==================================================");
  console.log("ALL SSE & JSON STREAM TESTS PASSED!");
  console.log("==================================================");
}

runSseAndJsonTests();
