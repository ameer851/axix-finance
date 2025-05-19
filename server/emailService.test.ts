// ... existing code ...
describe('Email Service', () => {
  it('should send test email via Brevo in production', async () => {
    process.env.NODE_ENV = 'production';
    const testUser = { email: 'test@caraxfinance.com' } as User;
    
    await expect(sendVerificationEmail(testUser, 'test-token'))
      .resolves.not.toThrow();
  });
});
// ... existing code ...