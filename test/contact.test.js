import test from "node:test";
import assert from "node:assert/strict";

import {
  processContactSubmission,
  validateContactPayload,
} from "../lib/contact.js";

test("rejects invalid contact payloads", () => {
  const result = validateContactPayload({
    name: "",
    email: "invalid",
    message: "short",
  });

  assert.equal(result.ok, false);
  assert.equal(result.errors.name, "Please enter your name.");
  assert.equal(result.errors.email, "Please enter a valid email address.");
  assert.equal(result.errors.message, "Please write at least 10 characters.");
});

test("honeypot submissions succeed without sending mail", async () => {
  let fetchCalled = false;
  const result = await processContactSubmission(
    {
      name: "Bot",
      email: "bot@example.com",
      company: "Spam Inc",
      message: "This looks legitimate but it is not.",
    },
    {
      fetchImpl: async () => {
        fetchCalled = true;
        return { ok: true, json: async () => ({ id: "ignored" }) };
      },
      env: {
        RESEND_API_KEY: "re_test",
        CONTACT_TO_EMAIL: "owner@example.com",
      },
    },
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(fetchCalled, false);
});

test("sends validated contact submissions through Resend", async () => {
  let capturedRequest = null;
  const result = await processContactSubmission(
    {
      name: "Markus",
      email: "markus@example.com",
      message: "This is a proper test message for the contact form.",
    },
    {
      fetchImpl: async (url, options) => {
        capturedRequest = { url, options };
        return {
          ok: true,
          status: 200,
          json: async () => ({ id: "email_123" }),
        };
      },
      env: {
        RESEND_API_KEY: "re_test",
        CONTACT_TO_EMAIL: "owner@example.com",
        CONTACT_FROM_EMAIL: "MarkOS Contact <hello@example.com>",
      },
    },
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.ok, true);
  assert.equal(capturedRequest.url, "https://api.resend.com/emails");

  const payload = JSON.parse(capturedRequest.options.body);
  assert.deepEqual(payload.to, ["owner@example.com"]);
  assert.equal(payload.reply_to, "markus@example.com");
  assert.equal(payload.from, "MarkOS Contact <hello@example.com>");
  assert.match(payload.subject, /New MarkOS message from Markus/);
});
