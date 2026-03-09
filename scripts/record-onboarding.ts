import { chromium } from 'playwright';
import path from 'path';

const SITE_URL = 'https://onboarding.freedom.world';
const OUTPUT_DIR = '/clawd/bd/freedom-onboarding/recordings';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('🎬 Starting onboarding flow recording...');
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1440, height: 900 }
    }
  });
  
  const page = await context.newPage();
  let stepNum = 1;
  
  const screenshot = async (name: string) => {
    const file = path.join(OUTPUT_DIR, `${String(stepNum).padStart(2, '0')}-${name}.png`);
    await page.screenshot({ path: file });
    console.log(`  📸 ${stepNum}: ${name}`);
    stepNum++;
  };

  try {
    // ── 1. Landing page ──────────────────────────────────────
    console.log('\n1️⃣  Loading landing page...');
    await page.goto(SITE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);
    await screenshot('landing-page');
    
    // ── 2. Navigate directly to onboarding (Get Started links here) ──
    console.log('\n2️⃣  Navigating to onboarding...');
    // Get the href from the button/link first
    const href = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent?.includes('Get Started') || link.textContent?.includes('Start')) {
          return link.href;
        }
      }
      // Check buttons with onclick
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        if (btn.textContent?.includes('Get Started')) {
          return btn.getAttribute('data-href') || '';
        }
      }
      return '';
    });
    console.log(`  Found href: ${href || '(none, trying direct nav)'}`);
    
    if (href && href !== SITE_URL && href !== `${SITE_URL}/`) {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } else {
      // Try clicking via JS dispatch
      await page.evaluate(() => {
        const btn = document.querySelector('button') as HTMLElement;
        if (btn) btn.click();
      });
      await sleep(1000);
      
      // If still on landing, try navigating to /onboarding or /chat directly
      const currentUrl = page.url();
      if (currentUrl === SITE_URL || currentUrl === `${SITE_URL}/`) {
        console.log('  Trying direct navigation to /onboarding...');
        await page.goto(`${SITE_URL}/onboarding`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        await sleep(2000);
        const url2 = page.url();
        if (url2.includes('onboarding')) {
          console.log('  ✓ Navigated to /onboarding');
        } else {
          console.log(`  Redirected to: ${url2}, trying /chat...`);
          await page.goto(`${SITE_URL}/chat`, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
        }
      }
    }
    await sleep(3000);
    await screenshot('onboarding-page');
    console.log(`  Current URL: ${page.url()}`);
    
    // ── 3. Select business type ──────────────────────────────
    console.log('\n3️⃣  Looking for business type selection...');
    await sleep(3000);
    
    // Debug: log all visible text on page
    const pageText = await page.evaluate(() => {
      return document.body.innerText.slice(0, 500);
    });
    console.log(`  Page text: ${pageText.slice(0, 200)}...`);
    
    // Try clicking restaurant/cafe template
    for (const label of ['Restaurant', 'Cafe', 'Retail', 'Salon', 'Bar', 'Other']) {
      const card = page.locator(`text=${label}`).first();
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.click({ force: true });
        console.log(`  Selected: ${label}`);
        await sleep(2000);
        break;
      }
    }
    await screenshot('business-type');
    
    // ── 4. Chat flow ─────────────────────────────────────────
    console.log('\n4️⃣  Entering chat flow...');
    await sleep(5000);
    await screenshot('chat-start');
    
    // Dump page state for debugging
    const bodyClasses = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea');
      const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean);
      return { inputCount: inputs.length, buttons: buttons.slice(0, 10) };
    });
    console.log(`  Inputs: ${bodyClasses.inputCount}, Buttons: ${JSON.stringify(bodyClasses.buttons)}`);
    
    // Try to interact with chat
    const chatInputSel = 'input[type="text"], textarea, [role="textbox"]';
    const chatInput = page.locator(chatInputSel).first();
    if (await chatInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  Found chat input!');
      
      // Type Google Maps link
      await chatInput.click();
      await chatInput.fill('https://maps.app.goo.gl/FKCJasXuFSaEH4ZP8');
      await sleep(500);
      await chatInput.press('Enter');
      console.log('  Sent Google Maps link');
      
      // Wait for scraping
      await sleep(12000);
      await screenshot('after-scrape');
      
      // Look for confirmation
      const allBtns = await page.locator('button').allTextContents();
      console.log(`  Available buttons: ${allBtns.filter(t => t.trim()).join(', ')}`);
      
      for (const label of ["That's me", "Yes, that's my place", "Confirm", "Yes", "correct", "Accept"]) {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await btn.click({ force: true });
          console.log(`  Clicked: ${label}`);
          await sleep(5000);
          break;
        }
      }
      await screenshot('after-confirm');
      
      // Continue through flow — click the LAST matching action button (most recent in chat)
      for (let i = 0; i < 15; i++) {
        await sleep(6000);
        
        // Check if page was navigated (signup redirect etc.)
        try {
          const currentUrl = page.url();
          if (currentUrl !== page.url()) break; // sanity
        } catch { 
          console.log('  Page closed/navigated');
          break;
        }
        
        try {
        // Scroll chat to bottom first
        await page.evaluate(() => {
          const chatContainers = document.querySelectorAll('[class*="overflow-y"], [class*="scroll"]');
          chatContainers.forEach(c => c.scrollTop = c.scrollHeight);
        });
        await sleep(500);
        
        // Get ALL visible buttons, pick the LAST action button (most recent in chat)
        const allButtons = page.locator('button');
        const count = await allButtons.count();
        
        let clicked = false;
        // Iterate from LAST to FIRST to find the most recent action button
        for (let j = count - 1; j >= 0; j--) {
          const btn = allButtons.nth(j);
          const text = (await btn.textContent().catch(() => '') || '').trim().toLowerCase();
          const isAction = [
            'yes, that\'s perfect', 'yes, that\'s my place', 'that\'s my place',
            'love these', 'perfect!', 'accept', 'looks good', 'use them', 
            'continue', 'next', 'looks great', 'love it',
            // Brand style options
            'clean & modern', 'warm & rustic', 'bold & vibrant', 'luxe & elegant', 'playful & colorful',
            // Other common quick replies
            'cozy', 'vibrant', 'elegant', 'modern', 'rustic',
          ].some(k => text.includes(k));
          // Skip if it's the old place-confirm card buttons
          const isOldCard = ['that\'s me', 'wrong place'].some(k => text.includes(k));
          
          if (isAction && !isOldCard && await btn.isVisible({ timeout: 300 }).catch(() => false)) {
            await btn.scrollIntoViewIfNeeded().catch(() => {});
            await btn.click({ force: true });
            console.log(`  Step ${i + 1}: clicked "${text.slice(0, 40)}"`);
            clicked = true;
            await sleep(2000);
            break;
          }
        }
        
        if (!clicked) {
          // Log what buttons ARE visible for debugging
          const visibleBtns: string[] = [];
          for (let j = 0; j < count; j++) {
            const btn2 = allButtons.nth(j);
            const t = (await btn2.textContent().catch(() => '') || '').trim();
            const vis = await btn2.isVisible({ timeout: 100 }).catch(() => false);
            if (t && vis) visibleBtns.push(t.slice(0, 40));
          }
          console.log(`  Step ${i + 1}: no action btn. Visible: [${visibleBtns.join('] [')}]`);
        }
        
        await screenshot(`step-${i + 1}`);
        
        // Check for signup wall
        if (await page.locator('input[type="email"]').isVisible({ timeout: 500 }).catch(() => false)) {
          console.log('  🔒 Signup wall detected!');
          await screenshot('signup-wall');
          break;
        }
        } catch (stepErr: any) {
          console.log(`  Step ${i + 1} error: ${stepErr.message?.slice(0, 80)}`);
          break;
        }
      }
    } else {
      console.log('  ⚠️ No chat input found');
      // Take diagnostic screenshot
      await screenshot('no-chat-input');
    }
    
    // Final state
    await sleep(2000);
    await screenshot('final');
    console.log('\n✅ Recording complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'error.png') }).catch(() => {});
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    
    const fs = await import('fs');
    const files = fs.readdirSync(OUTPUT_DIR).sort();
    console.log('\n📁 Output files:');
    for (const f of files) {
      const stat = fs.statSync(path.join(OUTPUT_DIR, f));
      const sizeKB = (stat.size / 1024).toFixed(0);
      console.log(`  ${f} (${sizeKB}KB)`);
    }
  }
}

main().catch(console.error);
