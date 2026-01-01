import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface DigestPost {
  title: string;
  journal: string;
  year: number;
  impactFactor?: number;
  url: string;
  authors: string;
}

export interface DigestData {
  searchName: string;
  query: string;
  newPostsCount: number;
  topPosts: DigestPost[];
  userEmail: string;
  userName: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // For development, use a test SMTP service or log emails
    // In production, configure with SendGrid, AWS SES, etc.
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER || 'test',
        pass: process.env.SMTP_PASS || 'test',
      },
    });
  }

  async sendWeeklyDigest(digestData: DigestData): Promise<void> {
    const htmlContent = this.generateDigestHTML(digestData);
    const textContent = this.generateDigestText(digestData);

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SciSocial" <digest@scisocial.com>',
        to: digestData.userEmail,
        subject: `Your Weekly Digest: ${digestData.newPostsCount} new posts matching "${digestData.searchName}"`,
        text: textContent,
        html: htmlContent,
      });
      console.log(`Digest email sent to ${digestData.userEmail}`);
    } catch (error) {
      console.error(`Failed to send digest email to ${digestData.userEmail}:`, error);
      throw error;
    }
  }

  private generateDigestHTML(data: DigestData): string {
    const postsHTML = data.topPosts
      .map(
        (post) => `
        <tr>
          <td style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 600; color: #111827;">
              <a href="${post.url}" style="color: #2563eb; text-decoration: none;">${post.title}</a>
            </h3>
            <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">
              ${post.authors}
            </p>
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">
              <strong>${post.journal}</strong> (${post.year})${post.impactFactor ? ` • Impact Factor: ${post.impactFactor}` : ''}
            </p>
          </td>
        </tr>
      `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">SciSocial Weekly Digest</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">New research matching your interests</p>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">Hello ${data.userName}!</h2>
              <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">
                We found <strong>${data.newPostsCount} new ${data.newPostsCount === 1 ? 'post' : 'posts'}</strong> matching your saved search:
                <strong>"${data.searchName}"</strong> (${data.query})
              </p>
            </td>
          </tr>

          <!-- Top Posts -->
          <tr>
            <td style="padding: 0 30px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #111827; font-weight: 600;">Top Posts This Week</h3>
            </td>
          </tr>

          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${postsHTML}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 30px; text-align: center;">
              <a href="http://localhost:3000/search?q=${encodeURIComponent(data.query)}"
                 style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View All Results
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; text-align: center;">
                You're receiving this because you have notifications enabled for this saved search.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="http://localhost:3000/settings/notifications" style="color: #2563eb; text-decoration: none;">Manage preferences</a> •
                <a href="http://localhost:3000/saved-searches" style="color: #2563eb; text-decoration: none;">View saved searches</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private generateDigestText(data: DigestData): string {
    const postsText = data.topPosts
      .map(
        (post, index) => `
${index + 1}. ${post.title}
   ${post.authors}
   ${post.journal} (${post.year})${post.impactFactor ? ` • Impact Factor: ${post.impactFactor}` : ''}
   ${post.url}
      `,
      )
      .join('\n');

    return `
SciSocial Weekly Digest
=======================

Hello ${data.userName}!

We found ${data.newPostsCount} new ${data.newPostsCount === 1 ? 'post' : 'posts'} matching your saved search:
"${data.searchName}" (${data.query})

TOP POSTS THIS WEEK
-------------------
${postsText}

View all results: http://localhost:3000/search?q=${encodeURIComponent(data.query)}

---

You're receiving this because you have notifications enabled for this saved search.
Manage preferences: http://localhost:3000/settings/notifications
View saved searches: http://localhost:3000/saved-searches
    `;
  }
}
