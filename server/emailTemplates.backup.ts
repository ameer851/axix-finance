// Welcome email template backup
// Basic template without custom template loading logic
function generateWelcomeEmailHTML(
  user: DrizzleUser,
  opts?: WelcomeEmailOptions
): string {
  const plainPassword =
    opts?.plainPassword || (user as any).initialPassword || null;
  return `
    <div style="${COMMON_STYLES.outerWrapper}">
      <div style="${COMMON_STYLES.container}">
        ${renderHeader()}
        <div style="${COMMON_STYLES.body}">
          <h2>Welcome to ${BRAND.name}!</h2>
          <p>Hello ${user.full_name || user.email},</p>
          <p>Thank you for joining ${BRAND.name}. Your account is now ready to use.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="${BRAND.welcomeImage}" 
                 alt="${BRAND.name}" 
                 style="${COMMON_STYLES.heroImage}" />
          </div>

          <div style="${COMMON_STYLES.infoBox}">
            <p style="margin:0;"><strong>Email:</strong> ${user.email}</p>
            ${
              plainPassword
                ? `<p style="margin:10px 0 0;"><strong>Password:</strong> <span style="font-family:monospace; background:#FFF4EA; padding:2px 6px; border-radius:4px; border:1px solid ${BRAND_COLORS.border};">${plainPassword}</span></p>`
                : `<p style="margin:12px 0 0 0; font-size:12px; color:${BRAND_COLORS.lightText};"><em>Password not included for security. Use the one you created during signup.</em></p>`
            }
          </div>

          <p style="margin-top:24px; text-align:center;">
            <a href="${BRAND.url}/login" style="${COMMON_STYLES.button}">
              Access Your Account
            </a>
          </p>
        </div>
        
        <div style="${COMMON_STYLES.footer}">
          <p>&copy; ${new Date().getFullYear()} ${BRAND.name}. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}
