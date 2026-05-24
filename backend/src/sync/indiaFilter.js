const INDIA_CITY_RE =
  /\b(bengaluru|bangalore|mumbai|bombay|hyderabad|secunderabad|chennai|madras|pune|gurgaon|gurugram|noida|delhi|new\s+delhi|ncr|kolkata|calcutta|ahmedabad|jaipur|kochi|cochin|coimbatore|chandigarh|mohali|visakhapatnam|vizag|indore|lucknow|nagpur|thiruvananthapuram|trivandrum|mysore|mysuru|hosur|vadodara|baroda|surat|bhubaneswar|bhopal|patna|ranchi|guwahati|jamshedpur|nashik|nasik|aurangabad|raipur|rajkot|ludhiana|panchkula|panvel|kanpur|allahabad|prayagraj|varanasi|dehradun|faridabad|ghaziabad|thane|navi\s+mumbai)\b/i;

const INDIA_COUNTRY_RE = /\bindia\b/i;

const INDIA_COUNTRY_CODE_RE = /(^|[\s,(\-|/])ind?\b(?!\.)/i;

const US_INDIANA_CITY_RE =
  /\b(indianapolis|bloomington|evansville|fort\s+wayne|south\s+bend|carmel|fishers|noblesville|greenwood|lafayette|muncie|terre\s+haute|kokomo|columbus|anderson|elkhart|hammond|gary|valparaiso|jeffersonville)\b/i;

export function isIndiaLocation(text) {
  if (!text || typeof text !== "string") return false;
  const t = text.toLowerCase();

  const hasIndiaCity = INDIA_CITY_RE.test(t);
  const hasIndiaCountry = INDIA_COUNTRY_RE.test(t);

  if (hasIndiaCity) return true;
  if (hasIndiaCountry && !/\bindiana\b/.test(t)) return true;

  if (US_INDIANA_CITY_RE.test(t)) return false;
  if (/\bindiana\b/.test(t)) return false;

  if (INDIA_COUNTRY_CODE_RE.test(t)) return true;

  return false;
}
