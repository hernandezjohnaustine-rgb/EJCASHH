/**
 * Simple utility to shorten URLs using the is.gd API.
 * This is a public, no-key-required API.
 */
export async function shortenUrl(url: string): Promise<string> {
  try {
    const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const shortUrl = await response.text();
      return shortUrl.trim();
    }
    return url;
  } catch (error) {
    console.warn("URL shortening failed, using original link:", error);
    return url;
  }
}
