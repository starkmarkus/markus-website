const DEFAULT_FROM_EMAIL = "MarkOS Contact <onboarding@resend.dev>";
const DEFAULT_CONTACT_ERROR_MESSAGE = "Message could not be sent right now. Please try again shortly.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 320;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;

export class ContactSubmissionError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "ContactSubmissionError";
    this.status = status;
  }
}

export function normalizeContactPayload(payload = {}) {
  return {
    name: normalizeInlineValue(payload.name),
    email: normalizeInlineValue(payload.email).toLowerCase(),
    message: normalizeMessageValue(payload.message),
    company: normalizeInlineValue(payload.company),
  };
}

export function validateContactPayload(payload = {}) {
  const data = normalizeContactPayload(payload);
  const errors = {};

  if (data.company) {
    return { ok: true, spam: true, data, errors };
  }

  if (!data.name) {
    errors.name = "Please enter your name.";
  } else if (data.name.length > MAX_NAME_LENGTH) {
    errors.name = "Please keep your name under 120 characters.";
  }

  if (!data.email) {
    errors.email = "Please enter your email address.";
  } else if (data.email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(data.email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!data.message) {
    errors.message = "Please enter a message.";
  } else if (data.message.length < MIN_MESSAGE_LENGTH) {
    errors.message = "Please write at least 10 characters.";
  } else if (data.message.length > MAX_MESSAGE_LENGTH) {
    errors.message = "Please keep your message under 5000 characters.";
  }

  return {
    ok: Object.keys(errors).length === 0,
    spam: false,
    data,
    errors,
  };
}

export async function processContactSubmission(payload, options = {}) {
  const validation = validateContactPayload(payload);

  if (validation.spam) {
    return {
      status: 200,
      body: {
        ok: true,
        message: "Message sent. Markus will get back to you soon.",
      },
    };
  }

  if (!validation.ok) {
    return {
      status: 400,
      body: {
        ok: false,
        error: Object.values(validation.errors)[0],
        fieldErrors: validation.errors,
      },
    };
  }

  try {
    await sendContactEmail(validation.data, options);

    return {
      status: 200,
      body: {
        ok: true,
        message: "Message sent. Markus will get back to you soon.",
      },
    };
  } catch (error) {
    if (error instanceof ContactSubmissionError) {
      return {
        status: error.status,
        body: {
          ok: false,
          error: error.message,
        },
      };
    }

    throw error;
  }
}

export async function sendContactEmail(submission, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const env = options.env || process.env;
  const logger = options.logger || console;
  const apiKey = env.RESEND_API_KEY;
  const to = env.CONTACT_TO_EMAIL;
  const from = env.CONTACT_FROM_EMAIL || DEFAULT_FROM_EMAIL;

  if (!apiKey || !to) {
    throw new ContactSubmissionError("Contact form is not configured yet.", 500);
  }

  const email = buildContactEmail(submission);

  let response;
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "markos-website-contact/1.0",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: submission.email,
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
  } catch (error) {
    logger.error("Contact email request failed", error);
    throw new ContactSubmissionError(DEFAULT_CONTACT_ERROR_MESSAGE, 502);
  }

  const responseBody = await parseResponseBody(response);

  if (!response.ok) {
    logger.error("Contact email failed", {
      status: response.status,
      body: responseBody,
    });

    throw new ContactSubmissionError(DEFAULT_CONTACT_ERROR_MESSAGE, response.status >= 500 ? 502 : 500);
  }

  return responseBody;
}

function normalizeInlineValue(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeMessageValue(value) {
  return typeof value === "string" ? value.replace(/\r\n?/g, "\n").trim() : "";
}

function buildContactEmail(submission) {
  const submittedAt = new Date().toISOString();
  const safeName = escapeHtml(submission.name);
  const safeEmail = escapeHtml(submission.email);
  const safeMessage = escapeHtml(submission.message).replace(/\n/g, "<br />");

  return {
    subject: `New MarkOS message from ${submission.name}`,
    text: [
      `Name: ${submission.name}`,
      `Reply to: ${submission.email}`,
      `Submitted: ${submittedAt}`,
      "",
      submission.message,
    ].join("\n"),
    html: [
      "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#1f1a14;\">",
      "<h1 style=\"font-size:20px;margin:0 0 16px;\">New MarkOS contact message</h1>",
      `<p><strong>Name:</strong> ${safeName}</p>`,
      `<p><strong>Email:</strong> ${safeEmail}</p>`,
      `<p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>`,
      `<p><strong>Message:</strong></p><p>${safeMessage}</p>`,
      "</div>",
    ].join(""),
  };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function parseResponseBody(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
