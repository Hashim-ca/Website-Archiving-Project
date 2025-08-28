export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  
  // Add protocol if missing
  const withProtocol = trimmed.includes('://') 
    ? trimmed 
    : `https://${trimmed}`;
    
  try {
    const url = new URL(withProtocol);
    
    // Remove www. prefix and return lowercase hostname
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    // If URL parsing fails, do basic cleanup
    return trimmed
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .toLowerCase();
  }
}

export function extractPath(input: string): string {
  const trimmed = input.trim();
  
  // Add protocol if missing for URL parsing
  const withProtocol = trimmed.includes('://') 
    ? trimmed 
    : `https://${trimmed}`;
    
  try {
    const url = new URL(withProtocol);
    return url.pathname === '' ? '/' : url.pathname;
  } catch {
    // If URL parsing fails, extract path manually
    const pathMatch = trimmed.match(/^[^/]*(.*)$/);
    return pathMatch?.[1] || '/';
  }
}