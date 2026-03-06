export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  utm_vertical?: string
  referrer?: string
  landing_page?: string
  gclid?: string
  fbclid?: string
}

export function extractUTMParams(searchParams: URLSearchParams): UTMParams {
  return {
    utm_source: searchParams.get('utm_source') || undefined,
    utm_medium: searchParams.get('utm_medium') || undefined,
    utm_campaign: searchParams.get('utm_campaign') || undefined,
    utm_content: searchParams.get('utm_content') || undefined,
    utm_term: searchParams.get('utm_term') || undefined,
    utm_vertical: searchParams.get('utm_vertical') || undefined,
    gclid: searchParams.get('gclid') || undefined,
    fbclid: searchParams.get('fbclid') || undefined,
  }
}

export function extractUTMFromURL(url: string): UTMParams {
  try {
    const parsed = new URL(url)
    return extractUTMParams(parsed.searchParams)
  } catch {
    return {}
  }
}

export function mergeWithStoredUTM(current: UTMParams): UTMParams {
  // In browser: check sessionStorage for UTM captured on first landing page
  if (typeof window === 'undefined') return current

  try {
    const stored = sessionStorage.getItem('utm_params')
    if (!stored) return current
    const storedParams: UTMParams = JSON.parse(stored)
    // Current params take precedence over stored
    return { ...storedParams, ...current }
  } catch {
    return current
  }
}

export function storeUTMParams(params: UTMParams): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem('utm_params', JSON.stringify(params))
  } catch {
    // sessionStorage not available
  }
}
