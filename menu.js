const apiKey = "YOUR_API_KEY";
const searchInput = document.getElementById("ticker");
const suggestions = document.getElementById("suggestions");

searchInput.addEventListener("input", () => {
  const keyword = searchInput.value;
  if (keyword.length > 0) {
    fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keyword}&apikey=${apiKey}`)
      .then(response => response.json())
      .then(data => {
        const symbolList = data.bestMatches.map(match => `${match["1. symbol"]} - ${match["2. name"]}`);
        populateSuggestions(symbolList);
      })
      .catch(error => console.error(error));
  } else {
    suggestions.innerHTML = "";
  }
});

function populateSuggestions(symbolList) {
  suggestions.innerHTML = "";
  symbolList.forEach(symbol => {
    const suggestion = document.createElement("div");
    suggestion.textContent = symbol;
    suggestion.addEventListener("click", () => {
      searchInput.value = symbol.split(" - ")[0];
      suggestions.innerHTML = "";
    });
    suggestions.appendChild(suggestion);
  });
}

function clearSuggestions() {
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
  }
