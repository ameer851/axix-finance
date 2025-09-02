# 🚀 Automatic Investment System

The Axix Finance platform now features a **fully automatic investment system** that processes deposits instantly and applies daily returns without requiring admin intervention.

## ✨ Key Features

- **⚡ Instant Deposits**: Investment deposits are processed immediately with instant balance crediting
- **🔄 Automatic Returns**: Daily investment returns are applied automatically via scheduled tasks
- **🎯 No Admin Required**: Entire investment lifecycle runs without manual approval
- **📊 Real-time Tracking**: Users can monitor their investments and returns in real-time
- **🔔 Email Notifications**: Automatic confirmation emails for deposits and returns

## 📋 Available Investment Plans

| Plan        | Min Amount | Max Amount | Daily Return | Duration | Total Return |
| ----------- | ---------- | ---------- | ------------ | -------- | ------------ |
| **Starter** | $50        | $999       | 2%           | 3 days   | 106%         |
| **Premium** | $1,000     | $4,999     | 3.5%         | 7 days   | 124.5%       |
| **Delux**   | $5,000     | $19,999    | 5%           | 10 days  | 150%         |
| **Luxury**  | $20,000    | Unlimited  | 7.5%         | 30 days  | 325%         |

## 🔧 Setup Instructions

### 1. Automatic Returns Processing

The system includes an automatic processor that runs daily to apply investment returns.

#### Option A: Fly.io Cron Jobs (Recommended for your setup)

Since you're running on Fly.io, use their built-in cron scheduling:

**For Windows (PowerShell):**

```powershell
# Run the PowerShell setup script
.\scripts\setup-fly-cron.ps1
```

**For Linux/Mac:**

```bash
# Run the bash setup script
chmod +x scripts/setup-fly-cron.sh
./scripts/setup-fly-cron.sh
```

#### Option B: Manual Fly.io Cron Setup

**Windows (PowerShell):**

```powershell
fly machines run `
  --app "axix-finance" `
  --schedule "0 2 * * *" `
  --name "daily-investment-returns" `
  --env NODE_ENV=production `
  --command "node scripts/auto-investment-processor.js" `
  --detach
```

**Linux/Mac:**

```bash
fly machines run \
  --app "axix-finance" \
  --schedule "0 2 * * *" \
  --name "daily-investment-returns" \
  --env NODE_ENV=production \
  --command "node scripts/auto-investment-processor.js" \
  --detach
```

#### Option C: Manual Cron Setup (Linux/Unix)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2:00 AM)
0 2 * * * cd /path/to/your/project && node scripts/auto-investment-processor.js >> logs/auto-investment.log 2>&1
```

#### Option D: Windows (Not applicable for Fly.io)

**Note**: Since you're on Fly.io, you cannot use Windows Task Scheduler. Use Fly.io cron jobs instead.

#### Option B: Manual Cron Setup (Linux/Unix)

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2:00 AM)
0 2 * * * cd /path/to/your/project && node scripts/auto-investment-processor.js >> logs/auto-investment.log 2>&1
```

#### Option C: Windows (Not applicable for Fly.io)

**Note**: Since you're on Fly.io, you cannot use Windows Task Scheduler. Use Fly.io cron jobs instead.

### 2. Testing the System

Test the processor without making changes:

```bash
node scripts/auto-investment-processor.js --dry-run
```

## 💻 Usage

### Creating Investment Deposits

#### Frontend Integration

```typescript
import { AutoInvestmentService } from "@/services/autoInvestmentService";

// Create an investment deposit
const result = await AutoInvestmentService.createInvestmentDeposit({
  amount: 1000,
  planName: "Premium Plan",
  transactionHash: "optional_tx_hash",
  method: "bank_transfer",
});

if (result.success) {
  console.log("Investment created:", result.transaction);
  console.log("Daily return:", result.dailyReturn);
  console.log("Total return:", result.totalReturn);
}
```

#### API Endpoint

```bash
curl -X POST /api/transactions/investment-deposit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "planName": "Premium Plan",
    "transactionHash": "optional_tx_hash",
    "method": "bank_transfer"
  }'
```

### Monitoring Investments

Users can view their investments through the existing dashboard:

- Active investments with progress tracking
- Daily returns history
- Investment completion status
- Total earnings summary

## 🔄 How It Works

### 1. Instant Deposit Processing

1. User submits investment deposit via `/transactions/investment-deposit`
2. System validates amount and plan
3. **Admin Approval Required** - Deposit status remains "pending"
4. **Admin Approves** - Balance is credited and investment is created
5. **Investment Starts** - Daily returns begin automatically
6. Confirmation email is sent

### 2. Automatic Daily Returns

1. Scheduled processor runs daily at 2:00 AM
2. Identifies active investments that haven't received today's return
3. Calculates daily return based on plan
4. Credits return amount to user's balance
5. Updates investment progress
6. Marks investments as complete when duration ends

### 3. Investment Lifecycle

```
User Deposit → Admin Approval → Balance Credited → Investment Created → Daily Returns → Completion
     ↓              ↓                  ↓                      ↓                      ↓              ↓
  Pending       Manual Review      Immediate               Auto-created         Auto-applied     Auto-closed
  Status        Required           Credit                  Record               Returns         Investment
```

## 📊 Monitoring & Logs

### Log Files

- `logs/auto-investment.log` - Daily processing logs
- Console output during processing
- Investment creation and return records in database

### Monitoring Commands

```bash
# View recent processing logs
tail -f logs/auto-investment.log

# Check active investments
# (Query your database for investments with status = 'active')

# Test processing manually
node scripts/auto-investment-processor.js --dry-run
```

## 🛠️ Configuration

### Environment Variables

No additional environment variables are required. The system uses existing Supabase configuration.

### Customization Options

#### Investment Plans

Edit `server/investmentService.ts` to modify available plans:

```typescript
export const INVESTMENT_PLANS = [
  {
    id: "custom",
    name: "Custom Plan",
    minAmount: 100,
    maxAmount: 1000,
    dailyProfit: 2.5, // Daily return percentage
    duration: 5, // Investment duration in days
    totalReturn: 112.5, // Total return percentage
  },
  // ... more plans
];
```

#### Processing Schedule

Modify the cron job timing:

```bash
# Every 6 hours instead of daily
0 */6 * * * cd /path/to/project && node scripts/auto-investment-processor.js
```

## 🚨 Troubleshooting

### Common Issues

#### Processor Not Running

```bash
# Check cron jobs
crontab -l

# Test processor manually
node scripts/auto-investment-processor.js

# Check file permissions
ls -la scripts/auto-investment-processor.js
```

#### Database Connection Issues

- Verify Supabase credentials in `.env`
- Check database connectivity
- Review processor logs for specific errors

#### Investment Not Created

- Verify plan name matches exactly
- Check amount is within plan limits
- Review API response for validation errors

### Debug Mode

Run with verbose logging:

```bash
NODE_ENV=development node scripts/auto-investment-processor.js
```

## 📈 Benefits

### For Users

- **Instant Gratification**: Deposits processed immediately
- **Passive Income**: Automatic daily returns
- **No Waiting**: No admin approval delays
- **Transparent**: Real-time progress tracking

### For Platform

- **Scalable**: Handles high volume automatically
- **Cost Effective**: No manual processing required
- **Reliable**: Scheduled processing ensures consistency
- **Maintainable**: Automated system reduces errors

## 🔮 Future Enhancements

- [ ] Email notifications for daily returns
- [ ] Investment analytics dashboard
- [ ] Mobile app push notifications
- [ ] Advanced investment strategies
- [ ] Referral bonus integration
- [ ] Multi-currency support

---

## 🎯 Summary

The automatic investment system transforms Axix Finance into a **controlled investment platform** where:

✅ **Deposits require admin approval** - You maintain control over investments
✅ **Returns are automatic** - Daily processing via cron jobs on Fly.io
✅ **Admin oversight** - You can review and approve each deposit
✅ **Users get real-time updates** - Progress tracking and notifications

**Ready to deploy!** 🚀</content>
<parameter name="filePath">c:\Users\BABA\Documents\AxixFinance\AUTOMATIC_INVESTMENT_README.md
