const submitButton = document.getElementById('submit');
const tickerInput = document.getElementById('ticker');
const resultsDiv = document.getElementById('results');

tickerInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault(); // Prevent the default action of submitting the form
        submitButton.click(); // Trigger the submit button click event
    }
});


submitButton.addEventListener('click', () => {
    const apiKey = 'YOUR_API_KEY_HERE';
    const ticker = tickerInput.value;
    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`;
    const table = document.createElement('table');

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            // Parse the JSON response to extract the dividend history data
            const dividends = [];
            for (let date in data['Monthly Adjusted Time Series']) {
                if (data['Monthly Adjusted Time Series'][date]['7. dividend amount']) {
                    dividends.push({
                        date: date,
                        dividend: data['Monthly Adjusted Time Series'][date]['7. dividend amount'],
                    });
                }
            }

            // Group dividends by year
            const dividendsByYear = {};
            dividends.forEach(dividend => {
                const year = dividend.date.substring(0, 4);
                if (!dividendsByYear[year]) {
                    dividendsByYear[year] = [];
                }
                dividendsByYear[year].push(dividend);
            });

            // Sort the years in descending order
            const years = Object.keys(dividendsByYear).sort((a, b) => b - a);

            // Calculate the total dividends and variation for each year
            const yearlyTotals = {};
            const yearlyVariations = {};
            years.forEach((year, index) => {
                const yearlyDividends = dividendsByYear[year];
                yearlyTotals[year] = yearlyDividends.reduce((total, dividend) => total + parseFloat(dividend.dividend), 0);

                if (index > 0) {
                    const previousYear = years[index - 1];
                    yearlyVariations[previousYear] = ((yearlyTotals[previousYear] - yearlyTotals[year]) / yearlyTotals[year]) * 100;
                }
            });

            // Create the table
            table.innerHTML = `
    <thead>
      <tr>
        <th>Year</th>
        <th>Jan</th>
        <th>Feb</th>
        <th>Mar</th>
        <th>Apr</th>
        <th>May</th>
        <th>Jun</th>
        <th>Jul</th>
        <th>Aug</th>
        <th>Sep</th>
        <th>Oct</th>
        <th>Nov</th>
        <th>Dec</th>
        <th>Total</th>
        <th>Variation</th>
      </tr>
    </thead>
    <tbody>
      ${years.map(year => `
        <tr>
          <td>${year}</td>
          ${Array.from({ length: 12 }).map((_, i) => {
            const month = (i + 1).toString().padStart(2, '0');
            const dividend = dividendsByYear[year].find(dividend => dividend.date.substring(5, 7) === month);
            return `<td>${dividend && dividend.dividend !== '0.0000' ? dividend.dividend : '-'}</td>`;
        }).join('')
} <
td > $ {
    yearlyTotals[year].toFixed(4)
} < /td> <
td > $ {
    yearlyVariations[year] ? yearlyVariations[year].toFixed(2) + '%' : '-'
} < /td> <
/tr>
`).join('')}
    </tbody>
  `;

// Display the table in the results div
resultsDiv.innerHTML = ''; resultsDiv.appendChild(table);
})
.catch(error => {
console.error(error);
resultsDiv.textContent = 'An error occurred while retrieving the dividend history data';
});
});