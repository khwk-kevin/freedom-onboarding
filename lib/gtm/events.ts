declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

function pushEvent(event: string, data: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...data })
}

// Conversion events → GA4 → Google Ads
export function gtmGenerateLead(merchantId: string, source: string) {
  pushEvent('generate_lead', {
    merchant_id: merchantId,
    lead_source: source,
    currency: 'THB',
    value: 0,
  })
}

export function gtmConversionOnboard(merchantId: string, businessType: string) {
  pushEvent('conversion_onboard', {
    merchant_id: merchantId,
    business_type: businessType,
    currency: 'THB',
    value: 0,
  })
}

export function gtmConversionFirstSale(merchantId: string, amount: number) {
  pushEvent('conversion_first_sale', {
    merchant_id: merchantId,
    currency: 'THB',
    value: amount,
  })
}

export function gtmPageView(path: string, title: string) {
  pushEvent('page_view', { page_path: path, page_title: title })
}
