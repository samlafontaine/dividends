const submitButton = document.getElementById("submit");
const tickerInput = document.getElementById("ticker");
const resultsDiv = document.getElementById("results");

tickerInput.addEventListener("keydown", (event) => {
  if (event.keyCode === 13) {
    event.preventDefault(); // Prevent the default action of submitting the form
    submitButton.click(); // Trigger the submit button click event
  }
});

submitButton.addEventListener("click", () => {
  const apiKey = "YOUR_API_KEY_HERE";
  const ticker = tickerInput.value;
  const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY_ADJUSTED&symbol=${ticker}&apikey=${apiKey}`;
  const table = document.createElement("table");

  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      // Parse the JSON response to extract the dividend history data
      const dividends = [];
      for (let date in data["Monthly Adjusted Time Series"]) {
        if (data["Monthly Adjusted Time Series"][date]["7. dividend amount"]) {
          dividends.push({
            date: date,
            dividend:
              data["Monthly Adjusted Time Series"][date]["7. dividend amount"]
          });
        }
      }

      // Group dividends by year
      const dividendsByYear = {};
      dividends.forEach((dividend) => {
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
        yearlyTotals[year] = yearlyDividends.reduce(
          (total, dividend) => total + parseFloat(dividend.dividend),
          0
        );

        if (index > 0) {
          const previousYear = years[index - 1];
          yearlyVariations[previousYear] =
            ((yearlyTotals[previousYear] - yearlyTotals[year]) /
              yearlyTotals[year]) *
            100;
        }
      });

      // Calculate the average variation for the previous n years
      function calculateAverageGrowthRate(years, yearlyTotals, n) {
        if (years.length < n + 1) return "Not enough data";

        const reversedYears = [...years].reverse(); // Create a reversed copy of the years array

        const endIndex = reversedYears.length - 2; // Exclude the current year
        const startIndex = Math.max(0, endIndex - n);
        const startYear = reversedYears[endIndex];
        const endYear = reversedYears[startIndex];
        const initialValue = yearlyTotals[endYear];
        const finalValue = yearlyTotals[startYear];
        const yearsBetween = parseInt(startYear) - parseInt(endYear);
        const avgGrowthRate =
          (((finalValue - initialValue) / initialValue) * 100) / n;

        return avgGrowthRate.toFixed(2) + "%";
      }

      // Calculate the average variation for the previous 3, 5, and 10 years
      const averageGrowthRates = {
        "3 years": calculateAverageGrowthRate(years, yearlyTotals, 3),
        "5 years": calculateAverageGrowthRate(years, yearlyTotals, 5),
        "10 years": calculateAverageGrowthRate(years, yearlyTotals, 10)
      };

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
      ${years
        .map(
          (year) => `
        <tr>
          <td>${year}</td>
          ${Array.from({ length: 12 })
            .map((_, i) => {
              const month = (i + 1).toString().padStart(2, "0");
              const dividend = dividendsByYear[year].find(
                (dividend) => dividend.date.substring(5, 7) === month
              );
              return `<td>${
                dividend && dividend.dividend !== "0.0000"
                  ? dividend.dividend
                  : "-"
              }</td>`;
            })
            .join("")}
          <td>${yearlyTotals[year].toFixed(4)}</td>
          <td>${
            yearlyVariations[year]
              ? yearlyVariations[year].toFixed(2) + "%"
              : "-"
          }</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  `;

      // Get the company name
      const companyInfoUrl = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${ticker}&apikey=${apiKey}`;
      fetch(companyInfoUrl)
        .then((infoResponse) => infoResponse.json())
        .then((infoData) => {
          const companyName =
            infoData.bestMatches && infoData.bestMatches.length > 0
              ? infoData.bestMatches[0]["2. name"]
              : "Company name not found";

          // Create a span with the company name
          const companyNameSpan = document.createElement("span");
          companyNameSpan.textContent = `${companyName}`;
          companyNameSpan.className = "companyName";

          // Create a string with the average variations for the previous 3, 5, and 10 years
          const averageGrowthRatesString = `Average annual growth rate previous 3 years: ${averageGrowthRates["3 years"]}, 
                                            Average annual growth rate previous 5 years: ${averageGrowthRates["5 years"]}, 
                                            Average annual growth rate previous 10 years: ${averageGrowthRates["10 years"]}`;

          // Create a span with the average variations
          const averageGrowthRatesSpan = document.createElement("span");
          averageGrowthRatesSpan.textContent = averageGrowthRatesString;

          // Display the company name above the table
          resultsDiv.innerHTML = "";
          resultsDiv.appendChild(companyNameSpan);
          resultsDiv.appendChild(table);
          resultsDiv.appendChild(document.createElement("br"));
          resultsDiv.appendChild(averageGrowthRatesSpan);
        })

        .catch((error) => {
          console.error(error);
          resultsDiv.textContent =
            "An error occurred while retrieving the company information";
        });
    })
    .catch((error) => {
      console.error(error);
      resultsDiv.textContent =
        "An error occurred while retrieving the dividend history data";
    });
});
