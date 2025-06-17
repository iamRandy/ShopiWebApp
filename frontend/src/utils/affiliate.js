export const AMAZON_ASSOCIATE_TAG = 'yourtag-20'; // Replace with your actual Amazon Associates tracking ID

// Takes a product URL and returns an affiliate URL when the retailer is Amazon. For other
// retailers, the original URL is returned unchanged.
export function getAffiliateLink (url) {
  return url; // TODO: Remove this once approved for affiliate links
  try {
    const parsed = new URL(url);

    // Only modify Amazon links
    if (parsed.hostname.includes('amazon.')) {
      // Remove any existing tag parameter to avoid duplicates
      parsed.searchParams.delete('tag');

      // Append the affiliate tag
      parsed.searchParams.set('tag', AMAZON_ASSOCIATE_TAG);

      return parsed.toString();
    }

    // For non-Amazon URLs just forward them as-is for now.
    return url;
  } catch (err) {
    console.error('Unable to build affiliate link for', url, err);
    return url;
  }
} 