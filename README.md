# Eva Guru Frontend Task

This project is a simple Vue 3 app for the Eva Guru frontend case study.

## What does it do?
- Lets you log in with the given credentials
- Shows your seller and marketplace info after login
- Displays a sales chart (with Highcharts) for 7, 14, 30, or 60 days
- You can click up to two days on the chart to compare them
- Shows a table of SKU sales for the selected day(s), with refund rates
- Table has pagination (10 items per page)
- **Bonus:** If you try to access the dashboard without logging in, you are automatically redirected to the login page

## Main components
- `LoginPanel`: Login form
- `SalesChart`: The bar chart for daily sales
- `SalesTable`: The table for SKU sales and refund rates
- `Dashboard`: Puts everything together after login

## How to run
1. Install dependencies: `yarn install`
2. Start the app: `yarn dev`

---

All main features are based on the requirements in the task description. See the code for details.
