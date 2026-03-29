import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// NOTE: Set RESEND_API_KEY in Vercel dashboard (Environment Variables).
// The form will silently log without sending until the key is configured.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    if (!resend) {
      // Key not configured — log locally and return success so form UX works
      console.log('[WITIA Contact] RESEND_API_KEY not set. Enquiry received:', { name, email, message })
      return NextResponse.json({ success: true })
    }

    await resend.emails.send({
      from: 'WITIA Contact <contact@witia.ai>',
      to: 'team@witia.ai',
      replyTo: email,
      subject: `New enquiry from ${name}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
          <div style="border-bottom: 1px solid #e0e0e0; padding-bottom: 24px; margin-bottom: 32px;">
            <span style="font-family: Raleway, sans-serif; font-weight: 600; font-size: 16px; letter-spacing: 0.15em; color: #000;">WITIA</span>
          </div>
          <h2 style="font-family: Georgia, serif; font-weight: 400; font-size: 24px; margin: 0 0 24px;">New enquiry via witia.ai</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; width: 120px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; vertical-align: top; padding-right: 16px;">Name</td>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; font-size: 13px; color: #000;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; vertical-align: top; padding-right: 16px;">Email</td>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; font-size: 13px; color: #000;"><a href="mailto:${email}" style="color: #000;">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; vertical-align: top; padding-right: 16px;">Message</td>
              <td style="padding: 12px 0; border-top: 1px solid #e0e0e0; font-size: 13px; color: #000; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</td>
            </tr>
          </table>
          <p style="margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #e0e0e0; padding-top: 20px;">Sent via witia.ai contact form</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
