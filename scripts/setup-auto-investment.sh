#!/bin/bash

# Automatic Investment System Setup Script
# This script sets up cron jobs for automatic daily returns processing

echo "🚀 Axix Finance - Automatic Investment System Setup"
echo "=================================================="

# Check if running on Linux/Unix system
if [[ "$OSTYPE" != "linux-gnu"* && "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This setup script is designed for Linux/Unix systems."
    echo "   For Windows, please set up Task Scheduler manually:"
    echo "   1. Open Task Scheduler"
    echo "   2. Create a new task"
    echo "   3. Set trigger to daily at 2:00 AM"
    echo "   4. Set action to run: node scripts/auto-investment-processor.js"
    echo "   5. Set working directory to your project root"
    exit 1
fi

# Get the absolute path of the project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROCESSOR_SCRIPT="$PROJECT_DIR/scripts/auto-investment-processor.js"

# Check if the processor script exists
if [[ ! -f "$PROCESSOR_SCRIPT" ]]; then
    echo "❌ Auto investment processor script not found at: $PROCESSOR_SCRIPT"
    echo "   Please ensure the script exists before setting up cron jobs."
    exit 1
fi

echo "📍 Project directory: $PROJECT_DIR"
echo "📍 Processor script: $PROCESSOR_SCRIPT"

# Create cron job entry
CRON_JOB="0 2 * * * cd $PROJECT_DIR && /usr/bin/node $PROCESSOR_SCRIPT >> $PROJECT_DIR/logs/auto-investment.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "auto-investment-processor"; then
    echo "⚠️  Cron job for auto investment processor already exists."
    echo "   Use 'crontab -e' to view or modify existing cron jobs."
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

    if [[ $? -eq 0 ]]; then
        echo "✅ Cron job added successfully!"
        echo "   📅 Schedule: Daily at 2:00 AM"
        echo "   📝 Logs: $PROJECT_DIR/logs/auto-investment.log"
    else
        echo "❌ Failed to add cron job. You may need to run 'crontab -e' manually."
        echo "   Add this line to your crontab:"
        echo "   $CRON_JOB"
    fi
fi

# Create logs directory if it doesn't exist
if [[ ! -d "$PROJECT_DIR/logs" ]]; then
    mkdir -p "$PROJECT_DIR/logs"
    echo "📁 Created logs directory: $PROJECT_DIR/logs"
fi

# Test the processor script
echo ""
echo "🧪 Testing the auto investment processor..."
cd "$PROJECT_DIR"
node "$PROCESSOR_SCRIPT" --dry-run

if [[ $? -eq 0 ]]; then
    echo "✅ Processor test completed successfully!"
else
    echo "⚠️  Processor test encountered issues. Check the logs for details."
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo "Your automatic investment system is now configured:"
echo "• ✅ Daily returns will be processed automatically at 2:00 AM"
echo "• ✅ Investment deposits are processed instantly"
echo "• ✅ No admin intervention required"
echo "• ✅ Logs available at: $PROJECT_DIR/logs/auto-investment.log"
echo ""
echo "To view your cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To test manually: node scripts/auto-investment-processor.js --dry-run"
