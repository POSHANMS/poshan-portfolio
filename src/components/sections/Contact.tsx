"use client";

import SectionShell from "./SectionShell";
import { PROFILE } from "@/utils/constants";
import { sendContactMessage } from "@/lib/contactDelivery";
import { useState } from "react";

export default function Contact() {
  const [emailCopied, setEmailCopied] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmissionStatus("Sending securely…");
    const form = event.currentTarget;
    try {
      const values = new FormData(form);
      await sendContactMessage({
        firstName: String(values.get("firstName") ?? ""),
        email: String(values.get("email") ?? ""),
        subject: String(values.get("subject") ?? ""),
        message: String(values.get("message") ?? ""),
        website: String(values.get("website") ?? ""),
      });
      setSubmissionStatus("Message sent. Thank you for reaching out.");
      form.reset();
    } catch (error) {
      setSubmissionStatus(error instanceof Error ? error.message : "The message could not be sent. Please try again.");
    }
  };

  return (
    <SectionShell id="contact" eyebrow="// CONTACT" title="Start A Signal">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-[rgba(0,212,255,0.2)] bg-[rgba(10,10,30,0.62)] p-7 backdrop-blur-xl">
          <p className="text-lg leading-8 text-white/75">
            I am available for work and freelance projects. Reach out for full-stack web apps, API work, dashboards, real-time features, deployment, and polished interactive interfaces.
          </p>
          <div className="mt-8 space-y-3 font-mono text-sm">
            <button type="button" onClick={() => { void navigator.clipboard.writeText(PROFILE.email).then(() => setEmailCopied(true)).catch(() => setEmailCopied(false)); }} className="block text-left text-[var(--electric-blue)]" aria-label="Copy email address">
              {emailCopied ? "Email copied" : PROFILE.email}
            </button>
            <a className="block text-white/70 hover:text-white" href={PROFILE.github} target="_blank" rel="noreferrer">github.com/POSHANMS</a>
            <a className="block text-white/70 hover:text-white" href={PROFILE.linkedin} target="_blank" rel="noreferrer">linkedin.com/in/poshanms/</a>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-4 border border-white/10 bg-[rgba(5,5,8,0.72)] p-7 backdrop-blur-xl">
          <label className="sr-only" aria-hidden="true">Leave this field blank<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Name
            <input name="firstName" required maxLength={60} autoComplete="name" className="border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Name" />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Email
            <input name="email" required maxLength={254} autoComplete="email" className="border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Email" type="email" />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Subject
            <input name="subject" required maxLength={120} className="border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Subject" />
          </label>
          <label className="grid gap-2 font-mono text-xs uppercase tracking-[0.22em] text-white/45">
            Message
            <textarea name="message" required maxLength={2400} className="min-h-36 border border-white/10 bg-white/[0.035] px-4 py-3 font-sans text-sm normal-case tracking-normal text-white outline-none focus:border-[var(--electric-blue)]" aria-label="Message" />
          </label>
          <p className="text-sm text-white/65" role="status" aria-live="polite">{submissionStatus}</p>
          <button type="submit" className="inline-flex justify-center border border-[var(--electric-blue)] px-5 py-3 font-mono text-xs uppercase tracking-[0.22em] text-[var(--electric-blue)] transition hover:bg-[var(--electric-blue)] hover:text-[#050508]">
            Send Message ↗
          </button>
        </form>
      </div>
    </SectionShell>
  );
}
