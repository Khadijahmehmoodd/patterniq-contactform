// Vercel Serverless Function
// File location: /api/contact-form.js

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body:", req.body);

    const { fname, surname, email, phone, message } = req.body || {};

    // Validation
    if (!fname || !surname || !email || !message) {
      return res.status(400).json({
        error: "Missing required fields: fname, surname, email, message",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    const fullName = `${fname} ${surname}`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "PatternIQ <noreply@patterniq.co.uk>",
        to: ["operations@patterniq.co.uk"],
        reply_to: email,
        subject: `New Website Enquiry - ${fullName}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:700px;margin:auto;color:#333;line-height:1.5;">

            <h2 style="color:#1F4A7C;margin-bottom:25px;">
              New Contact Form Submission
            </h2>

            <table style="width:100%;border-collapse:collapse;font-size:14px;">

              <tr>
                <td style="padding:6px 0;width:180px;font-weight:bold;">First Name</td>
                <td style="padding:6px 0;">${escapeHtml(fname)}</td>
              </tr>

              <tr>
                <td style="padding:6px 0;font-weight:bold;">Last Name</td>
                <td style="padding:6px 0;">${escapeHtml(surname)}</td>
              </tr>

              <tr>
                <td style="padding:6px 0;font-weight:bold;">Email</td>
                <td style="padding:6px 0;">${escapeHtml(email)}</td>
              </tr>

              ${
                phone
                  ? `
              <tr>
                <td style="padding:6px 0;font-weight:bold;">Phone</td>
                <td style="padding:6px 0;">${escapeHtml(phone)}</td>
              </tr>
              `
                  : ""
              }

              // <tr>
              //   <td style="padding:6px 0;font-weight:bold;vertical-align:top;">Message</td>
              //   <td style="padding:6px 0;">
              //     ${escapeHtml(message).replace(/\n/g, "<br>")}
              //   </td>
              // </tr>
              // <tr>
                <td
                   style="width:180px;padding:6px 0;font-weight:bold;vertical-align:top;white-space:nowrap;"
                  >
                  Message
               </td>

               <td style="padding:6px 0;vertical-align:top;word-break:break-word;">
                ${escapeHtml(message).replace(/\n/g, "<br>")}
               </td>
              </tr>
            </table>

            <hr style="margin:24px 0;border:none;border-top:1px solid #ddd;">

            <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>

                <td style="vertical-align:middle;padding-right:10px;">
                  <a
                    href="https://www.patterniq.co.uk"
                    target="_blank"
                    style="text-decoration:none;"
                  >
                    <img
                      src="https://patterniq-contactform.vercel.app/patterniq.svg"
                      alt="PatternIQ"
                      width="25"
                      style="display:block;border:0;"
                    />
                  </a>
                </td>

                <td style="vertical-align:middle;font-size:12px;color:#777;">
                  This message was sent from the contact form on
                  <a
                    href="https://www.patterniq.co.uk"
                    target="_blank"
                    style="color:#777;text-decoration:none;"
                  >
                    www.patterniq.co.uk
                  </a>
                </td>

              </tr>
            </table>

          </div>
        `,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend Error:", data);

      return res.status(502).json({
        error: "Failed to send email",
        details: data,
      });
    }

    return res.status(200).json({
      success: true,
      id: data.id,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

// Prevent HTML injection
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}