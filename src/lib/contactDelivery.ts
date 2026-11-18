type ContactFields = {
  firstName: string;
  lastName?: string;
  email: string;
  subject: string;
  message: string;
  website?: string;
};

type Web3FormsResponse = {
  success?: boolean;
  message?: string;
  body?: { message?: string };
};

/** Sends contact form data directly from the browser, as Web3Forms recommends. */
export async function sendContactMessage(fields: ContactFields, signal?: AbortSignal) {
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    throw new Error("Email delivery is not configured yet. Please use the email link instead.");
  }
  if (fields.website?.trim()) {
    throw new Error("The message could not be validated. Please try again.");
  }

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      name: [fields.firstName.trim(), fields.lastName?.trim()].filter(Boolean).join(" "),
      email: fields.email.trim(),
      subject: fields.subject.trim(),
      topic: fields.subject.trim(),
      message: fields.message.trim(),
    }),
    signal,
  });

  const responseText = await response.text();
  let result: Web3FormsResponse;
  try {
    result = JSON.parse(responseText) as Web3FormsResponse;
  } catch {
    throw new Error("The email service returned an unexpected response. Please use the email link instead.");
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message ?? result.body?.message ?? "The message could not be sent. Please try again.");
  }
}
