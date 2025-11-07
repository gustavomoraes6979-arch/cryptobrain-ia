// services/coingecko.js
import axios from "axios";

export async function getCryptoData({ per_page = 50 } = {}) {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page,
        page: 1,
        price_change_percentage: "24h"
      },
    });
    return response.data;
  } catch (error) {
    console.error("Erro ao buscar dados da CoinGecko:", error.message);
    return [];
  }
}
