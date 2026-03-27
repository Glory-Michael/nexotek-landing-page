import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

async function saveToSupabase(email: string): Promise<{ duplicate: boolean }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables');
    return { duplicate: false };
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ email }),
  });

  if (res.status === 409) {
    return { duplicate: true };
  }

  if (!res.ok) {
    const errorText = await res.text();
    if (errorText.includes('duplicate') || errorText.includes('unique')) {
      return { duplicate: true };
    }
    console.error('Supabase insert error:', errorText);
  }

  return { duplicate: false };
}

async function saveToPayload(email: string) {
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: 'waitlist',
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return { duplicate: true };
  }

  await payload.create({
    collection: 'waitlist',
    data: { email, status: 'subscribed' },
  });

  return { duplicate: false };
}

async function sendConfirmationEmail(email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Missing RESEND_API_KEY — skipping confirmation email');
    return;
  }

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    to: email,
    subject: "You're on the NexoTek waitlist!",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Welcome to NexoTek</h1>
        <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
          Thanks for joining our waitlist. We're building the future of spatial risk intelligence
          and you'll be among the first to know when we launch.
        </p>
        <p style="color: #555; line-height: 1.6;">
          We'll be in touch soon with updates.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #999; font-size: 12px;">NexoTek — Spatial Risk Intelligence, Redefined</p>
      </div>
    `,
  });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Save to Supabase (primary — always reliable)
    const supabaseResult = await saveToSupabase(email);

    if (supabaseResult?.duplicate) {
      return NextResponse.json(
        { message: 'This email is already on the waitlist.' },
        { status: 200 }
      );
    }

    // Mirror to Payload and send confirmation email in parallel (non-blocking)
    await Promise.allSettled([
      saveToPayload(email).catch((err) =>
        console.error('Payload mirror failed:', err)
      ),
      sendConfirmationEmail(email),
    ]);

    return NextResponse.json(
      { message: 'Successfully joined the waitlist!' },
      { status: 201 }
    );
  } catch {
    console.error('Waitlist API error');
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
