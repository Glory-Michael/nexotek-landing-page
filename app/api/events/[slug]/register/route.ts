import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { Resend } from 'resend';
import { validateEmail, validatePhone } from '@/lib/validation';

async function saveToNotion(
  eventTitle: string,
  name: string,
  organization: string,
  phone: string,
  email: string,
) {
  const token = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_SALES_DATABASE_ID;

  if (!token || !databaseId) {
    console.warn('Missing NOTION_API_KEY or NOTION_SALES_DATABASE_ID — skipping Notion sync');
    return;
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: {
        Name: { title: [{ text: { content: name } }] },
        Email: { email },
        Organization: { rich_text: [{ text: { content: organization } }] },
        Phone: { phone_number: phone },
        Event: { select: { name: eventTitle } },
        'Submitted At': { date: { start: new Date().toISOString() } },
        Source: { select: { name: 'Event Lead' } },
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Notion page creation failed:', error);
  }
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

async function saveToSupabase(
  eventSlug: string,
  name: string,
  organization: string,
  phone: string,
  email: string,
): Promise<{ duplicate: boolean }> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase environment variables');
    return { duplicate: false };
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/event_leads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ event_slug: eventSlug, name, organization, phone, email }),
  });

  if (res.status === 409) {
    return { duplicate: true };
  }

  if (!res.ok) {
    const errorText = await res.text();
    if (errorText.includes('duplicate') || errorText.includes('unique')) {
      return { duplicate: true };
    }
    console.error('Supabase event_leads insert error:', errorText);
  }

  return { duplicate: false };
}

async function sendConfirmationEmail(name: string, email: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('Missing RESEND_API_KEY — skipping confirmation email');
    return;
  }

  const subject = "We'll be in touch — Nexotek";
  const fromName = process.env.RESEND_FROM_NAME || 'Nexotek';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const result = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Hi ${name},</h1>
          <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
            Thanks for reaching out — we'll be in touch soon to connect.
          </p>
          <p style="color: #555; line-height: 1.6;">
            In the meantime, feel free to explore what we're building at nexotek.ai.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #999; font-size: 12px;">Nexotek — Spatial Intelligence Risk Platform</p>
        </div>
      `,
    });

    const payload = await getPayload({ config });
    await payload.create({
      collection: 'email-log',
      data: {
        to: email,
        subject,
        status: result.data?.id ? 'sent' : 'failed',
        resendId: result.data?.id || '',
        error: result.error ? JSON.stringify(result.error) : undefined,
      },
    });
  } catch (err) {
    try {
      const payload = await getPayload({ config });
      await payload.create({
        collection: 'email-log',
        data: {
          to: email,
          subject,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    } catch {
      // Logging failed — don't block the request
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventDoc = Record<string, any>;

async function getNotificationRecipients(event: EventDoc): Promise<string[]> {
  const payload = await getPayload({ config });

  // Layer 1 — global: users with notifyOnEventLead OR admin role
  const globalResult = await payload.find({
    collection: 'users',
    where: { notifyOnEventLead: { equals: true } },
    limit: 100,
  });
  const globalEmails = globalResult.docs.map((u) => u.email as string).filter(Boolean);

  // Layer 2 — per-event: selected users (relationship may be populated IDs or objects)
  const nr = event.notificationRecipients as {
    users?: Array<string | { email?: string }>;
    additionalEmails?: Array<{ email?: string }>;
  } | undefined;

  const perEventUserEmails: string[] = [];
  if (nr?.users?.length) {
    const userIds = nr.users.map((u) => (typeof u === 'string' ? u : (u as { id?: string }).id)).filter(Boolean) as string[];
    if (userIds.length) {
      const userResult = await payload.find({
        collection: 'users',
        where: { id: { in: userIds } },
        limit: 100,
      });
      perEventUserEmails.push(...userResult.docs.map((u) => u.email as string).filter(Boolean));
    }
  }

  // Layer 3 — per-event: freeform additional emails
  const additionalEmails = (nr?.additionalEmails ?? [])
    .map((e) => e.email)
    .filter((e): e is string => Boolean(e));

  const all = [...globalEmails, ...perEventUserEmails, ...additionalEmails];
  const unique = [...new Set(all)];

  if (unique.length === 0 && process.env.RESEND_ADMIN_EMAIL) {
    return [process.env.RESEND_ADMIN_EMAIL];
  }
  return unique;
}

async function sendAdminNotification(
  event: EventDoc,
  name: string,
  organization: string,
  phone: string,
  email: string,
) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) return;

  const recipients = await getNotificationRecipients(event);
  if (recipients.length === 0) return;

  const eventTitle = event.title as string;

  const subject = `New event lead: ${name} (${organization}) — ${eventTitle}`;
  const fromName = process.env.RESEND_FROM_NAME || 'Nexotek';
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  try {
    const result = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: recipients,
      subject,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">New Event Lead</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Event</td><td style="padding: 8px 0; font-weight: 500;">${eventTitle}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Name</td><td style="padding: 8px 0;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Organization</td><td style="padding: 8px 0;">${organization}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Phone</td><td style="padding: 8px 0;">${phone}</td></tr>
            <tr><td style="padding: 8px 0; color: #999; font-size: 13px;">Email</td><td style="padding: 8px 0;">${email}</td></tr>
          </table>
        </div>
      `,
    });

    const payload = await getPayload({ config });
    await payload.create({
      collection: 'email-log',
      data: {
        to: recipients.join(', '),
        subject,
        status: result.data?.id ? 'sent' : 'failed',
        resendId: result.data?.id || '',
        error: result.error ? JSON.stringify(result.error) : undefined,
      },
    });
  } catch (err) {
    console.error('Admin notification failed:', err);
  }
}

type FieldReq = { name: boolean; organization: boolean; phone: boolean; email: boolean };
type BodyFields = { name?: string; organization?: string; phone?: string; email?: string };

function validateFields(body: BodyFields, req: FieldReq): string | null {
  if (req.name && !body.name?.trim()) return 'Name is required.';
  if (req.organization && !body.organization?.trim()) return 'Organization is required.';
  if (body.phone?.trim()) {
    const err = validatePhone(body.phone);
    if (err) return err;
  } else if (req.phone) {
    return 'Phone number is required.';
  }
  if (body.email?.trim()) {
    const err = validateEmail(body.email);
    if (err) return err;
  } else if (req.email) {
    return 'A valid email address is required.';
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const { name, organization, phone, email } = (await request.json()) as BodyFields;

    // Look up the event first so fieldConfig drives validation
    const payload = await getPayload({ config });
    const eventResult = await payload.find({
      collection: 'events',
      where: { slug: { equals: slug } },
      limit: 1,
    });

    if (eventResult.docs.length === 0) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    const event = eventResult.docs[0];

    if (!event.isOpen) {
      return NextResponse.json(
        { error: 'This event is no longer accepting connections.' },
        { status: 400 },
      );
    }

    // Per-event required field config (all default to true)
    const fc = event.fieldConfig as Record<string, boolean> | undefined;
    const req: FieldReq = {
      name:         fc?.requireName         ?? true,
      organization: fc?.requireOrganization ?? true,
      phone:        fc?.requirePhone        ?? true,
      email:        fc?.requireEmail        ?? true,
    };

    const validationError = validateFields({ name, organization, phone, email }, req);
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const cleanName  = name?.trim()                   ?? '';
    const cleanOrg   = organization?.trim()           ?? '';
    const cleanPhone = phone?.trim()                  ?? '';
    const cleanEmail = email?.trim().toLowerCase()    ?? '';

    // Check duplicate in Payload (only if email is present)
    if (cleanEmail) {
      const existing = await payload.find({
        collection: 'event-leads',
        where: {
          and: [
            { email: { equals: cleanEmail } },
            { event: { equals: event.id } },
          ],
        },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        return NextResponse.json(
          { message: "You're already registered for this event." },
          { status: 409 },
        );
      }
    }

    // Save to Supabase (primary)
    const supabaseResult = await saveToSupabase(slug, cleanName, cleanOrg, cleanPhone, cleanEmail);
    if (supabaseResult.duplicate) {
      return NextResponse.json(
        { message: "You're already registered for this event." },
        { status: 409 },
      );
    }

    // Save to Payload, Notion, and send emails in parallel
    await Promise.allSettled([
      payload.create({
        collection: 'event-leads',
        data: {
          event: event.id,
          name: cleanName,
          organization: cleanOrg,
          phone: cleanPhone,
          email: cleanEmail,
          submittedAt: new Date().toISOString(),
        },
      }).catch((err) => console.error('Payload event-lead create failed:', err)),
      saveToNotion(event.title as string, cleanName, cleanOrg, cleanPhone, cleanEmail),
      cleanEmail ? sendConfirmationEmail(cleanName, cleanEmail) : Promise.resolve(),
      sendAdminNotification(event, cleanName, cleanOrg, cleanPhone, cleanEmail),
    ]);

    return NextResponse.json(
      { message: "We'll be in touch. See you there." },
      { status: 201 },
    );
  } catch {
    console.error('Event registration error');
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }
}
