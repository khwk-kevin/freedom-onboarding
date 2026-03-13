export interface ABTestConfig {
  name: string;
  variants: readonly string[];
  defaultVariant: string;
}

export const AB_TESTS = {
  landing_style: {
    name: 'landing_page_style',
    variants: ['current', 'minimal', 'bold'] as const,
    defaultVariant: 'current',
  },
  interview_tone: {
    name: 'interview_tone',
    variants: ['friendly', 'professional', 'playful'] as const,
    defaultVariant: 'friendly',
  },
} as const satisfies Record<string, ABTestConfig>;
