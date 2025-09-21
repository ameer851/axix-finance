// Shared branded email templates for use in Node scripts (ESM)
// Mirrors the server/emailTemplates.ts increment/completion templates.

const BRAND_COLORS = {
  primary: "#4A2F1D",
  secondary: "#2C1810",
  success: "#2C1810",
  warning: "#8C5A3C",
  danger: "#8B1E1E",
  background: "#4A2F1D",
  card: "#FFFFFF",
  text: "#1A1A1A",
  lightText: "#6B4C33",
  border: "#E5DED7",
  accent: "#C28A55",
};

const WEBSITE_NAME = process.env.WEBSITE_NAME || "AxixFinance";
const WEBSITE_URL =
  process.env.FRONTEND_URL ||
  process.env.PRODUCTION_URL ||
  "https://axixfinance.com";
const FAVICON_URL =
  process.env.FAVICON_URL ||
  "https://res.cloudinary.com/dtgipp43e/image/upload/v1754455551/Minimalist_Bank_Icon_Design_eogehs.png";
const WELCOME_IMAGE_URL =
  process.env.WELCOME_IMAGE_URL ||
  "https://res.cloudinary.com/dtgipp43e/image/upload/v1753823823/ChatGPT_Image_Jul_23_2025_05_18_19_PM_sfaaml.png";

export const BRAND = {
  name: WEBSITE_NAME,
  url: WEBSITE_URL,
  favicon: FAVICON_URL,
  welcomeImage: WELCOME_IMAGE_URL,
};

const COMMON_STYLES = {
  outerWrapper: `background-color:${BRAND_COLORS.background}; padding:32px 0; font-family:Arial, sans-serif;`,
  container: `max-width:640px; margin:0 auto; background:${BRAND_COLORS.card}; border-radius:12px; overflow:hidden; box-shadow:0 4px 14px rgba(0,0,0,0.12); border:1px solid ${BRAND_COLORS.border};`,
  header: `background: linear-gradient(90deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.secondary}); padding:28px 24px; text-align:left;`,
  headerText:
    "color:#ffffff; margin:0; font-size:26px; font-weight:600; letter-spacing:.5px;",
  body: `padding:28px 28px 8px 28px; color:${BRAND_COLORS.text}; line-height:1.55; font-size:15px;`,
  infoBox: `background-color:#F9F7F5; padding:16px 18px; border-radius:8px; margin:24px 0; border:1px solid ${BRAND_COLORS.border};`,
  button: `background-color:${BRAND_COLORS.primary}; color:#ffffff; padding:14px 28px; text-decoration:none; border-radius:6px; font-weight:600; font-size:14px; display:inline-block; letter-spacing:.3px;`,
  footer: `background:${BRAND_COLORS.card}; padding:28px 24px 32px 24px; text-align:center; font-size:12px; color:${BRAND_COLORS.lightText};`,
  link: `color:${BRAND_COLORS.primary}; text-decoration:none;`,
  heroImage: `max-width:480px; width:100%; height:auto; border-radius:12px; border:1px solid ${BRAND_COLORS.border}; box-shadow:0 2px 6px rgba(0,0,0,0.12);`,
  logoImg:
    "width:48px; height:48px; vertical-align:middle; margin-right:12px; border-radius:8px; border:2px solid rgba(255,255,255,0.4); background:#FFFFFF; object-fit:cover;",
};

function renderHeader() {
  return `
    <div style="${COMMON_STYLES.header}">
      <h1 style="${COMMON_STYLES.headerText}">
        <img src="${BRAND.favicon}"
             alt="${BRAND.name} Icon"
             style="${COMMON_STYLES.logoImg}" />
        <a href="${BRAND.url}" style="color:#fff; text-decoration:none;">${BRAND.name}</a>
      </h1>
    </div>
  `;
}

export function investmentIncrementSubject(planName) {
  return `${BRAND.name} - Daily Increment Applied (${planName || "Investment"})`;
}

export function investmentCompletedSubject(planName) {
  return `${BRAND.name} - Plan Completed (${planName || "Investment"})`;
}

export function generateInvestmentIncrementEmailHTML(user, opts) {
  const {
    planName,
    day,
    duration,
    dailyAmount,
    totalEarned,
    principal,
    nextAccrualUtc,
  } = opts;
  const displayName =
    user?.firstName || user?.username || user?.email || "Investor";
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        ${renderHeader()}
        <div style="${COMMON_STYLES.body}">
          <h2>Daily Increment Applied</h2>
          <p>Hello ${displayName},</p>
          <p>Your investment just earned today's return.</p>

          <div style="text-align:center; margin: 22px 0;">
            <img src="${BRAND.welcomeImage}" alt="${BRAND.name}" style="${COMMON_STYLES.heroImage}" />
          </div>

          <div style="${COMMON_STYLES.infoBox}">
            <p style="margin:0"><strong>Plan:</strong> ${planName}</p>
            <p style="margin:10px 0 0 0"><strong>Day:</strong> ${day} / ${duration}</p>
            <p style="margin:10px 0 0 0"><strong>Today's Return:</strong> $${Number(dailyAmount).toFixed(2)}</p>
            <p style="margin:10px 0 0 0"><strong>Total Earned:</strong> $${Number(totalEarned).toFixed(2)}</p>
            <p style="margin:10px 0 0 0"><strong>Principal:</strong> $${Number(principal).toFixed(2)}</p>
            ${
              opts && nextAccrualUtc
                ? `<p style="margin:10px 0 0 0"><strong>Next Accrual (UTC):</strong> ${new Date(nextAccrualUtc).toUTCString()}</p>`
                : ""
            }
          </div>
          <p style="margin-top:22px">Track your progress anytime from your dashboard.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${BRAND.url}/dashboard" style="${COMMON_STYLES.button}">Open Dashboard</a>
          </div>
          <p>Best regards,<br/>The ${BRAND.name} Team</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
          <p>&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export function generateInvestmentCompletedEmailHTML(user, opts) {
  const { planName, duration, totalEarned, principal, endDateUtc } = opts;
  const totalPayout = Number(principal) + Number(totalEarned);
  const displayName =
    user?.firstName || user?.username || user?.email || "Investor";
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        ${renderHeader()}
        <div style="${COMMON_STYLES.body}">
          <h2>Plan Completed</h2>
          <p>Hello ${displayName},</p>
          <p>Congratulations! Your investment plan has finished.</p>

          <div style="text-align:center; margin: 22px 0;">
            <img src="${BRAND.welcomeImage}" alt="${BRAND.name}" style="${COMMON_STYLES.heroImage}" />
          </div>

          <div style="${COMMON_STYLES.infoBox}">
            <p style="margin:0"><strong>Plan:</strong> ${planName}</p>
            <p style="margin:10px 0 0 0"><strong>Duration:</strong> ${duration} days</p>
            <p style="margin:10px 0 0 0"><strong>Total Earned:</strong> $${Number(totalEarned).toFixed(2)}</p>
            <p style="margin:10px 0 0 0"><strong>Principal:</strong> $${Number(principal).toFixed(2)}</p>
            <p style="margin:10px 0 0 0"><strong>Total Payout:</strong> $${totalPayout.toFixed(2)}</p>
            ${
              endDateUtc
                ? `<p style="margin:10px 0 0 0"><strong>Completed (UTC):</strong> ${new Date(endDateUtc).toUTCString()}</p>`
                : ""
            }
          </div>
          <p style="margin-top:22px">Your account balance has been updated accordingly. You can reinvest or withdraw from your dashboard.</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${BRAND.url}/dashboard" style="${COMMON_STYLES.button}">View Investments</a>
          </div>
          <p>Thank you for investing with ${BRAND.name}.</p>
        </div>
        <div style="${COMMON_STYLES.footer}">
          <p>&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}
