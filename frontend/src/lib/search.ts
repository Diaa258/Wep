// Replace with your actual Google API key and Custom Search Engine ID
const GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"; // Get from https://console.cloud.google.com/
const GOOGLE_CX = "YOUR_CUSTOM_SEARCH_ENGINE_ID"; // Get from https://cse.google.com/

async function searchGoogle(query: string) {
  if (GOOGLE_API_KEY === "YOUR_GOOGLE_API_KEY" || GOOGLE_CX === "YOUR_CUSTOM_SEARCH_ENGINE_ID") {
    return null; // Skip Google search if not configured
  }
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&num=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    description: item.snippet?.replace(/\s+/g, " ").trim() || "",
    image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.cse_thumbnail?.[0]?.src || "",
    link: item.link || ""
  };
}

export async function searchGameInfo(name: string) {
  let description = "";
  let image = "";
  let wiki = "";

  // Try multiple query variations for better results
  const queries = [
    name,
    name.replace(/video game/gi, ""), // Remove "video game" if present
    name.split(" ").slice(0, 2).join(" "), // First two words only
    name.split(" ")[0] // First word only
  ];

  for (const query of queries) {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const ddgRes = await fetch(ddgUrl);
    if (ddgRes.ok) {
      const d = await ddgRes.json();
      if (d.Abstract?.trim()) {
        description = d.Abstract.trim();
        // Convert relative image path to full URL
        const imgPath = d.Image?.trim() || "";
        image = imgPath ? (imgPath.startsWith("http") ? imgPath : `https://duckduckgo.com${imgPath}`) : "";
        wiki = d.AbstractURL?.trim() || "";
        break; // Stop if we found something
      }
    }
  }

  // If no description found, provide a generic one
  if (!description) {
    description = `${name} is an exciting video game that offers immersive gameplay and memorable experiences. Perfect for both casual players and dedicated gamers looking for their next adventure. No image found for this game.`;
  }

  return { description, image, wiki };
}
