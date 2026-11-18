type ContactPayload = {
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
  website?: unknown;
};

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  let payload: ContactPayload;
  try {
    payload = await request.json() as ContactPayload;
  } catch {
    return Response.json({ error: "The message could not be read. Please try again." }, { status: 400 });
  }

  // A hidden honeypot filters simple automated submissions without affecting
  // the visible form or asking a genuine visitor to solve a challenge.
  if (clean(payload.website, 200)) {
    return Response.json({ error: "The message could not be validated." }, { status: 400 });
  }

  const firstName = clean(payload.firstName, 60);
  const lastName = clean(payload.lastName, 60);
  const email = clean(payload.email, 254);
  const subject = clean(payload.subject, 120);
  const message = clean(payload.message, 2400);
  if (!firstName || !subject || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please check the name, email, subject, and message fields." }, { status: 400 });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return Response.json({ error: "Message delivery is not configured yet. Use the Email control to copy the address." }, { status: 503 });
  }

  try {
    const providerResponse = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        name: `${firstName} ${lastName}`,
        email,
        subject,
        message,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const result = await providerResponse.json() as { success?: boolean; message?: string };
    if (!providerResponse.ok || !result.success) {
      return Response.json({ error: "The message service could not accept your message. Please try again shortly." }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "The message service could not be reached. Please try again shortly." }, { status: 502 });
  }
}
