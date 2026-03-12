/**
 * vault-writer.test.ts — Sprint 2.1 acceptance tests
 *
 * Run with:  npx tsx lib/app-builder/vault-writer.test.ts
 *
 * Tests three scenarios from the sprint spec:
 *  1. Thai restaurant, warm mood (full spec)
 *  2. English idea app, minimal mood
 *  3. Incomplete spec (pre-Q3 — no mood)
 */

import {
  generateVaultFiles,
  generateBrandMd,
  generateBusinessMd,
  generateAudienceMd,
  generateThemeJson,
  generateMoodDecisionMd,
  generateActiveSkillMd,
  generateDecisionIndex,
  lightenColor,
  darkenColor,
  detectFontForLanguage,
} from './vault-writer';
import type { MerchantAppSpec } from './types';

// ─── helpers ──────────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    fail++;
  }
}

function fileContent(files: ReturnType<typeof generateVaultFiles>, path: string): string | undefined {
  return files.find((f) => f.path === path)?.content;
}

function hasFile(files: ReturnType<typeof generateVaultFiles>, path: string): boolean {
  return files.some((f) => f.path === path);
}

// ─── Mock specs ───────────────────────────────────────────────────────────────

const thaiRestaurantSpec: Partial<MerchantAppSpec> = {
  businessName: 'ร้านข้าวแม่จิ๋ว',
  businessType: 'restaurant',
  category: 'restaurant-food',
  primaryLanguage: 'th',
  mood: 'warm',
  moodKeywords: ['อบอุ่น', 'เป็นกันเอง'],
  primaryColor: '#e85d04',
  products: [
    { name: 'ข้าวมันไก่', price: 50, currency: '฿', category: 'จานหลัก' },
    { name: 'ข้าวหมูแดง', price: 55, currency: '฿', category: 'จานหลัก' },
  ],
  appPriorities: ['menu', 'gallery', 'contact'],
  antiPreferences: ['ไม่ต้องการสีเข้ม', 'ไม่ต้องการดูเป็นทางการ'],
  audienceDescription: 'คนทำงานในย่านนี้ อายุ 25-40 ปี',
  scrapedData: {
    name: 'ร้านข้าวแม่จิ๋ว',
    address: '123 ถนนสุขุมวิท กรุงเทพ',
    phone: '02-xxx-xxxx',
    photos: ['https://photo1.jpg', 'https://photo2.jpg', 'https://photo3.jpg'],
  },
  tokenBalance: 10000,
  tokenUsed: 0,
  status: 'interviewing',
  id: 'test-merchant-th-001',
  slug: 'maejiew-rice',
  region: 'ap-southeast-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const englishIdeaSpec: Partial<MerchantAppSpec> = {
  businessName: 'Street Art Collective',
  businessType: 'community',
  category: 'idea-community',
  primaryLanguage: 'en',
  mood: 'minimal',
  moodKeywords: ['clean', 'modern', 'focused'],
  primaryColor: '#1a1a2e',
  audienceDescription: 'Independent artists and art lovers worldwide',
  appPriorities: ['gallery', 'community', 'events'],
  antiPreferences: ['no clutter', 'no corporate'],
  tokenBalance: 10000,
  tokenUsed: 0,
  status: 'interviewing',
  id: 'test-merchant-en-001',
  slug: 'street-art-collective',
  region: 'us-west-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const incompleteSpec: Partial<MerchantAppSpec> = {
  primaryLanguage: 'en',
  businessType: 'restaurant',
  // No mood, no products, no name, no priorities
  tokenBalance: 10000,
  tokenUsed: 0,
  status: 'interviewing',
  id: 'test-merchant-incomplete',
  slug: 'pending',
  region: 'us-west-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ─── TEST 1: Thai restaurant, warm mood ───────────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log('TEST 1: Thai restaurant — warm mood');
console.log('══════════════════════════════════════════');

const thaiFiles = generateVaultFiles(thaiRestaurantSpec);

// Files exist
assert(hasFile(thaiFiles, 'context/brand.md'), 'brand.md generated');
assert(hasFile(thaiFiles, 'context/business.md'), 'business.md generated');
assert(hasFile(thaiFiles, 'context/audience.md'), 'audience.md generated');
assert(hasFile(thaiFiles, 'design/theme.json'), 'theme.json generated');
assert(hasFile(thaiFiles, 'skills/_active.md'), 'skills/_active.md generated');
assert(hasFile(thaiFiles, 'context/decisions/001-visual-mood.md'), '001-visual-mood.md generated');
assert(hasFile(thaiFiles, 'context/decisions/_index.md'), 'decisions/_index.md generated');

// brand.md — Thai content
const brandMd = fileContent(thaiFiles, 'context/brand.md')!;
assert(brandMd.includes('ไม่ต้องการสีเข้ม'), 'brand.md contains Thai anti-preferences');
assert(brandMd.includes('warm'), 'brand.md contains mood');
assert(brandMd.includes('อบอุ่น'), 'brand.md contains Thai mood keywords');
assert(brandMd.includes('อัตลักษณ์แบรนด์'), 'brand.md uses Thai section headers');
assert(brandMd.includes('Noto Sans Thai'), 'brand.md references Thai font');

// business.md — Thai content
const businessMd = fileContent(thaiFiles, 'context/business.md')!;
assert(businessMd.includes('ร้านข้าวแม่จิ๋ว'), 'business.md contains Thai business name');
assert(businessMd.includes('ข้าวมันไก่'), 'business.md contains Thai product name');
assert(businessMd.includes('menu'), 'business.md contains priorities');
assert(businessMd.includes('[[skills/_active.md]]'), 'business.md has wikilink to skills');

// audience.md — Thai content
const audienceMd = fileContent(thaiFiles, 'context/audience.md')!;
assert(audienceMd.includes('คนทำงานในย่านนี้'), 'audience.md contains Thai audience description');

// theme.json — warm mood variants
const themeRaw = fileContent(thaiFiles, 'design/theme.json')!;
const theme = JSON.parse(themeRaw);
assert(theme.variants.hero === 'soft', 'theme.json: warm → heroVariant=soft');
assert(theme.variants.productCard === 'rounded', 'theme.json: warm → productCardVariant=rounded');
assert(theme.variants.navigation === 'bottom-tabs', 'theme.json: warm → navVariant=bottom-tabs');
assert(theme.borderRadius === '0.75rem', 'theme.json: warm → borderRadius=0.75rem');
assert(theme.shadowStyle === 'soft', 'theme.json: warm → shadowStyle=soft');
assert(theme.fonts.heading === 'Noto Sans Thai', 'theme.json: th → font=Noto Sans Thai');
assert(theme.colors.primary === '#e85d04', 'theme.json: primary color correct');
assert(theme.mood === 'warm', 'theme.json: mood recorded');

// decisions/001-visual-mood.md — exists and has Thai section headers
const moodDecision = fileContent(thaiFiles, 'context/decisions/001-visual-mood.md')!;
assert(moodDecision.includes('warm'), 'mood decision references warm mood');
assert(moodDecision.includes('soft'), 'mood decision references heroVariant=soft');
assert(moodDecision.includes('[[design/theme.json]]'), 'mood decision has wikilink to theme.json');

// _index.md — references the mood decision
const decisionIndex = fileContent(thaiFiles, 'context/decisions/_index.md')!;
assert(decisionIndex.includes('[[001-visual-mood.md]]'), 'decision index has wikilink to 001-visual-mood.md');

// _active.md — points to restaurant-food
const activeSkill = fileContent(thaiFiles, 'skills/_active.md')!;
assert(activeSkill.includes('restaurant-food'), '_active.md points to correct category');
assert(activeSkill.includes('[[context/brand.md]]'), '_active.md has wikilink to brand.md');

// ─── TEST 2: English idea app, minimal mood ───────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log('TEST 2: English idea app — minimal mood');
console.log('══════════════════════════════════════════');

const engFiles = generateVaultFiles(englishIdeaSpec);

const engBrand = fileContent(engFiles, 'context/brand.md')!;
const engThemeRaw = fileContent(engFiles, 'design/theme.json')!;
const engTheme = JSON.parse(engThemeRaw);

assert(engBrand.includes('Brand Identity'), 'brand.md uses English section headers');
assert(engBrand.includes('Plus Jakarta Sans'), 'brand.md: en → font=Plus Jakarta Sans');

assert(engTheme.variants.hero === 'minimal', 'theme.json: minimal → heroVariant=minimal');
assert(engTheme.variants.productCard === 'minimal', 'theme.json: minimal → productCardVariant=minimal');
assert(engTheme.variants.navigation === 'top-bar', 'theme.json: minimal → navVariant=top-bar');
assert(engTheme.borderRadius === '0rem', 'theme.json: minimal → borderRadius=0rem');
assert(engTheme.shadowStyle === 'none', 'theme.json: minimal → shadowStyle=none');
assert(engTheme.fonts.heading === 'Plus Jakarta Sans', 'theme.json: en → font=Plus Jakarta Sans');

const engActiveSkill = fileContent(engFiles, 'skills/_active.md')!;
assert(engActiveSkill.includes('idea-community'), '_active.md points to idea-community category');

// ─── TEST 3: Incomplete spec (pre-Q3) ─────────────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log('TEST 3: Incomplete spec (pre-Q3, no mood)');
console.log('══════════════════════════════════════════');

let noThrow = true;
let incompleteFiles: ReturnType<typeof generateVaultFiles> = [];
try {
  incompleteFiles = generateVaultFiles(incompleteSpec);
} catch (e) {
  noThrow = false;
  console.error('  Exception thrown:', e);
}
assert(noThrow, 'generateVaultFiles does not throw on incomplete spec');

// Core files should still exist
assert(hasFile(incompleteFiles, 'context/brand.md'), 'brand.md generated for incomplete spec');
assert(hasFile(incompleteFiles, 'context/business.md'), 'business.md generated for incomplete spec');
assert(hasFile(incompleteFiles, 'context/audience.md'), 'audience.md generated for incomplete spec');
assert(hasFile(incompleteFiles, 'design/theme.json'), 'theme.json generated for incomplete spec');
assert(hasFile(incompleteFiles, 'skills/_active.md'), '_active.md generated for incomplete spec');

// Mood-gated files should NOT be generated (no mood set)
assert(!hasFile(incompleteFiles, 'context/decisions/001-visual-mood.md'), 'mood decision NOT generated without mood');
assert(!hasFile(incompleteFiles, 'context/decisions/_index.md'), 'decision index NOT generated without mood');

// theme.json should use defaults and not crash
const incompleteTheme = JSON.parse(fileContent(incompleteFiles, 'design/theme.json')!);
assert(incompleteTheme.mood === 'warm', 'incomplete spec defaults to warm mood in theme.json');
assert(typeof incompleteTheme.colors.primary === 'string', 'theme.json has a primary color');

// Pending placeholders present
const incompleteBrand = fileContent(incompleteFiles, 'context/brand.md')!;
assert(incompleteBrand.includes('(pending)') || incompleteBrand.includes('not set'), 'brand.md has pending placeholder');

// ─── Utility function tests ────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log('Utility function tests');
console.log('══════════════════════════════════════════');

// lightenColor
assert(lightenColor('#000000', 1) === '#ffffff', 'lightenColor: black → white at factor 1');
assert(lightenColor('#ffffff', 0) === '#ffffff', 'lightenColor: white unchanged at factor 0');
assert(lightenColor('#ff0000', 0.5) === '#ff8080', 'lightenColor: red 50%');
assert(lightenColor('invalid', 0.5) === '#808080', 'lightenColor: invalid hex → graceful result');

// darkenColor
assert(darkenColor('#ffffff', 1) === '#000000', 'darkenColor: white → black at factor 1');
assert(darkenColor('#ff0000', 0) === '#ff0000', 'darkenColor: red unchanged at factor 0');
assert(darkenColor('#ff0000', 0.5) === '#800000', 'darkenColor: red 50%');

// detectFontForLanguage
const thFonts = detectFontForLanguage('th');
assert(thFonts.heading === 'Noto Sans Thai', 'detectFontForLanguage: th → Noto Sans Thai');
const jaFonts = detectFontForLanguage('ja');
assert(jaFonts.heading === 'Noto Sans JP', 'detectFontForLanguage: ja → Noto Sans JP');
const enFonts = detectFontForLanguage('en');
assert(enFonts.heading === 'Plus Jakarta Sans', 'detectFontForLanguage: en → Plus Jakarta Sans');
const zhFonts = detectFontForLanguage('zh');
assert(zhFonts.heading === 'Noto Sans SC', 'detectFontForLanguage: zh → Noto Sans SC');
const koFonts = detectFontForLanguage('ko');
assert(koFonts.heading === 'Noto Sans KR', 'detectFontForLanguage: ko → Noto Sans KR');
const unknownFonts = detectFontForLanguage('xx');
assert(unknownFonts.heading === 'Plus Jakarta Sans', 'detectFontForLanguage: unknown → Plus Jakarta Sans');

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════');
console.log(`Results: ${pass} passed, ${fail} failed`);
console.log('══════════════════════════════════════════\n');

if (fail > 0) {
  process.exit(1);
}
