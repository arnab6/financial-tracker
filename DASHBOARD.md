# Financial Tracker Dashboard

## 🎯 Features

### 1. **Key Metrics**
- **Total Spent**: Aggregate of all expenses
- **Average Expense**: Mean spending per transaction
- **Total Transactions**: Count of all expense entries
- **Date Range**: Current analysis period

### 2. **Advanced Filtering System**
Filter expenses by:
- **Date Range**: From and To date selectors
- **Category**: Food, Transport, Shopping, Bills, Health, Entertainment, Other
- **Payment Method**: Cash, UPI, Credit Card, Debit Card, Net Banking
- **Amount Range**: Min and Max amount filters
- **Search**: Text search on descriptions
- **Reset Button**: Clear all filters at once

### 3. **Visualizations (Charts)**

#### Pie Chart - Spending by Category
- Shows proportion of spending across categories
- Color-coded for easy distinction
- Hover tooltip with amounts

#### Bar Chart - Amount by Category
- Horizontal bars showing total per category
- Sorted by highest spending first
- Interactive tooltips

#### Line Chart - Daily Spending Trend
- Tracks daily spending over the last 30 days
- Shows spending patterns and spikes
- Smooth line chart for trend analysis

#### Bar Chart - Payment Methods
- Breakdown of spending by payment method
- Identifies preferred payment channels
- Useful for expense tracking verification

### 4. **Expense Table**
- Displays filtered expenses in a clean table format
- Columns: Date, Description, Category, Amount, Payment Method
- **Pagination**: 10 items per page with Next/Previous navigation
- Alternating row colors for better readability
- Category badges for visual categorization

### 5. **Data Aggregation**
Backend API (`/api/analytics`) provides:
- Calculation of total, average, and count of expenses
- Category-wise breakdown with percentages
- Daily spending aggregation
- Payment method distribution
- Automatic handling of missing/null values

## 📊 How to Use

### Access the Dashboard
1. Go to `http://localhost:3000`
2. Click the **📊 Dashboard** button in the header
3. Or navigate directly to `http://localhost:3000/dashboard`

### Filter Expenses
1. Use the **Filters** section to narrow down expenses
2. Multiple filters can be combined
3. Results update in real-time
4. Click **Reset Filters** to clear all selections

### Interpret Charts
- **Pie Chart**: Quick visual of spending distribution
- **Bar Charts**: Compare absolute amounts across categories
- **Line Chart**: Identify spending trends and patterns

### View Details
- Scroll through the expense table to see individual transactions
- Use pagination to browse all expenses
- Search for specific transactions using the description field

## 🔧 Technical Details

### Frontend
- **File**: `/app/dashboard/page.tsx`
- **Libraries**: Recharts for visualizations, React for UI
- **Styling**: Tailwind CSS with dark theme
- **State Management**: React hooks (useState, useEffect)

### Backend
- **File**: `/app/api/analytics/route.ts`
- **Database**: MongoDB aggregation for category/method breakdown
- **Processing**: Real-time calculation of metrics
- **Response**: JSON with all necessary data for frontend

### Data Flow
```
Frontend (Dashboard) 
    ↓
API Request (/api/analytics)
    ↓
MongoDB Query
    ↓
Data Processing & Aggregation
    ↓
JSON Response
    ↓
Chart Rendering & Table Display
```

## 💡 Tips

1. **Date Range Filtering**: Set both "From Date" and "To Date" for precise date-range analysis
2. **Category Focus**: Select a category to analyze spending patterns within that area
3. **Payment Method Tracking**: Filter by payment method to verify transaction records
4. **Pagination**: Use pagination to avoid overwhelming the table with all data
5. **Combined Filters**: Combine multiple filters for detailed insights (e.g., "Shopping" category + date range)

## 🚀 Future Enhancements

Potential features to add:
- Export to PDF/CSV
- Budget vs. actual comparison
- Year-over-year trends
- Monthly recurring expenses
- Spending alerts/notifications
- Budget goals tracking
- Multi-user support with categories per user
- Advanced forecasting
