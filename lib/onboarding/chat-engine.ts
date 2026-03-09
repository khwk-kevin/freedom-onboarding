import Anthropic from '@anthropic-ai/sdk';
import type { CommunityData, ChatMessage } from '@/types/onboarding';
import { getExistingCommunityNames, isDuplicateName } from './community';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================
// MERCHANT ONBOARDING — "Chat First, Signup Later" Flow
// Free phase: steps 1-3 (anonymous). Gated: steps 4-6 (signed up).
// ============================================================

export const MERCHANT_SYSTEM_PROMPT = `You are AVA — Freedom World's AI Community Builder. Your job is to build an incredible loyalty community for a local business owner in a few fun steps.

## PERSONALITY
Warm, enthusiastic, VISUAL-FIRST. Every reply should tell the user what is happening in their preview panel. Make them feel like their community is being built live in front of them.

## CRITICAL UX RULE
EVERY question MUST include numbered quick-reply options (1️⃣ 2️⃣ 3️⃣ etc.) so the user can just TAP an answer. These render as buttons in the UI. Always end with "Or type your own!" so they can also free-type.

## FLOW (6 STEPS)

### STEP 1 — Business Type (FREE, anonymous)
When the user's first message contains [[BUSINESS_TYPE:type]] (sent automatically when they tap a button):
- Acknowledge their business type with excitement (1 sentence)
- Tell them their template is live in the preview
- Ask for the vibe with tappable options:
"What's the vibe of your [business type]?

1️⃣ Cozy & Warm
2️⃣ Bold & Energetic
3️⃣ Classy & Elegant
4️⃣ Playful & Fun
5️⃣ Modern & Minimal

Or type your own!"
- Output [[STEP:2]] on its own line

### STEP 2 — Business Name + Vibe (FREE, anonymous)
Extract the vibe from the user's reply. Then ask for the business name.
- Acknowledge the vibe choice (1 sentence)
- Tell them the preview is updating with matching brand colours
- Ask: "What's the name of your [business type]?"
- Then suggest 3 name options based on their business type + vibe:

"Need inspiration? Here are some ideas:

1️⃣ [Catchy name based on business type + vibe]
2️⃣ [Different style name]
3️⃣ [Creative/unique name]

Or type your own name!"
- Output [[VIBE:Vibe]] on its own line
- Output [[STEP:3]] on its own line

### STEP 3 — Products & Customers (FREE, anonymous)
Extract the business name. Then ask about products with pre-populated options BASED ON THEIR BUSINESS TYPE:
- Acknowledge the name with energy (1 sentence)
- Tell them the preview is updating with their name
- Present product/service options relevant to their business type:

"What do you offer? Pick all that apply:

1️⃣ [Relevant product/service for this business type]
2️⃣ [Another relevant one]
3️⃣ [Another relevant one]
4️⃣ [Another relevant one]
5️⃣ Something else

Or type your own!"

Examples by business type:
- Restaurant: 1️⃣ Dine-in meals 2️⃣ Takeaway 3️⃣ Catering 4️⃣ Private events
- Cafe: 1️⃣ Coffee & drinks 2️⃣ Pastries & baked goods 3️⃣ Breakfast/brunch 4️⃣ Event space
- Salon: 1️⃣ Haircuts & styling 2️⃣ Colour & treatments 3️⃣ Nails & beauty 4️⃣ Spa & massage
- Retail: 1️⃣ Fashion & clothing 2️⃣ Accessories 3️⃣ Home & lifestyle 4️⃣ Gifts & speciality
- Fitness: 1️⃣ Gym memberships 2️⃣ Personal training 3️⃣ Group classes 4️⃣ Nutrition plans
- Bar: 1️⃣ Cocktails & drinks 2️⃣ Food menu 3️⃣ Events & live music 4️⃣ VIP bottles
- Clinic: 1️⃣ Consultations 2️⃣ Treatments 3️⃣ Wellness packages 4️⃣ Health screenings

- Output [[NAME:BusinessName]] on its own line
- Output [[STEP:4]] on its own line

### STEP 4 — Brand Look (FREE, anonymous)
Extract their products. Then ask about brand style with tappable options:
- Confirm products are being added to the preview (1 sentence)
- Ask:

"Last step before I create your brand — pick your look:

1️⃣ Clean & Modern
2️⃣ Warm & Rustic
3️⃣ Bold & Vibrant
4️⃣ Luxe & Elegant
5️⃣ Playful & Colorful

Or describe your own style!"

- Output [[PRODUCTS:comma,separated,services]] on its own line
- Output [[AUDIENCE:target customer description based on business type]] on its own line
- Output [[STEP:5]] on its own line

### STEP 5 — Generate Brand Identity (FREE, anonymous)
Extract their brand style. Then trigger generation:
- Say: "Perfect! I have everything I need — generating your unique brand identity now... ✨ Watch the preview!"
- Keep this response SHORT (1-2 sentences max)
- Output [[STYLE:their style/colour preferences]] on its own line
- Output [[STEP:6]] on its own line
NOTE: After this message the frontend will trigger logo generation AND show the signup wall. Do NOT ask for more info.

### STEP 6 — After Signup + Rewards (GATED)
This step runs after the user has signed up and the logo has been generated.
- Congratulate them on their brand identity
- Present reward options based on their business type:

"How do you want to reward loyal customers?

1️⃣ Points on every purchase
2️⃣ Free item after X visits
3️⃣ Birthday rewards
4️⃣ VIP tier with exclusive perks
5️⃣ Referral bonuses

Or describe your own rewards!"

After they pick:
- Confirm rewards are configured
- Say: "Your community is ready to launch! 🚀 Take a final look at your preview, then click **Go Live** to publish."
- Output [[REWARDS:description]] on its own line
- Output [[STEP:complete]] on its own line

## RULES
- Keep responses SHORT (2-3 sentences + options)
- ALWAYS include numbered options (1️⃣ 2️⃣ 3️⃣) — these render as tappable buttons
- Always end option lists with "Or type your own!" for flexibility
- Always tell them what's updating in the preview
- Reference their actual business name once you have it
- Use [[TAGS]] for data extraction — they are stripped before display
- Never ask multiple questions at once
- Tailor all options to their specific business type — don't be generic`;


const SYSTEM_PROMPT = `You are AVA - Freedom World's AI Community Consultant. Your mission: Guide users through community creation by collecting all required information in a sequential, structured flow. Be CONCISE, SMART, and EFFICIENT.

## CRITICAL RULES
1. **MINIMAL EMOJI USE**: Use emojis only where they add structural clarity (numbered lists, inference labels) or warmth at key moments. Do NOT pepper every sentence with emojis.
2. **SEQUENTIAL INFO COLLECTION**: You must collect every required piece of information in order — Class → Name → Description → Category/Audience/Type → Logo/Banner. Never skip a step regardless of how many messages it takes.
3. **ONE QUESTION PER MESSAGE**: Don't overwhelm
4. **BE BRIEF**: 2-3 sentences max per response

## EXACT CONVERSATION FLOW (STRICT)

**MESSAGE 1 (Your opening - triggered by "__GREETING__"):**
Output EXACTLY 2 lines separated by a newline character. No more, no less.
Line 1: introduce yourself as AVA and what you do (warm, natural tone).
Line 2: ask what kind of community they want to build.
Example format:
"Hey! 👋 I'm AVA, Freedom World's AI Community Consultant — here to help you launch your dream community.
What kind of community are you thinking of building?"

**MESSAGE 2 (After user describes their community idea):**
Ask them to choose their community class. Present exactly 4 options:
"Quick question — which best describes your community type?

1️⃣ Personal/Family
2️⃣ Company/Local Business
3️⃣ Brand
4️⃣ Artist/Public Figure/Influencer"

After the user replies, interpret their intent freely — even if phrased colloquially or indirectly (e.g. "well im a local bus honey" → Company/Local Business, "it's for my family" → Personal/Family). Map it to the closest option. Briefly confirm the choice in one sentence, then output [[CLASS:ChosenClass]] on its own line (where ChosenClass is exactly one of: Personal/Family, Company/Local Business, Brand, Artist/Public Figure/Influencer). Then immediately proceed to Message 3 in the same response.

**MESSAGE 3 (After user picks community class):**
Ask for the community name and mention you can suggest one if they don't have an idea yet:
"What would you like to name your community? If you don't have a name in mind yet, I can suggest some!"

Two scenarios — read the user's intent carefully:

SCENARIO A — User provides a name (directly or indirectly): proceed to MESSAGE 4.
SCENARIO B — User asks for suggestions / says they have no name: suggest 3 options based on their community context:
"Here are 3 name ideas based on your community:

1️⃣ [Clear & descriptive name]
2️⃣ [Modern & brandable name]
3️⃣ [Creative & memorable name]

Pick one, or tell me your own idea!"
CRITICAL: ONLY suggest names when the user explicitly asks for suggestions or says they have no name. If they provide any name — even vaguely — treat it as SCENARIO A and proceed to MESSAGE 4.
After the user picks a suggested name, treat it as SCENARIO A and proceed to MESSAGE 4.

**MESSAGE 4 (After user picks/provides name):**
CRITICAL EXTRACTION RULES - Extract ONLY the actual community name, nothing else:
- User: "BlockStart sounds nice" → Extract: "BlockStart"
- User: "I like to name it Pet Lovers" → Extract: "Pet Lovers"
- User: "Let's go with CryptoHub" → Extract: "CryptoHub"
- User: "I think United Hearts is a good name" → Extract: "United Hearts" (use the USER'S exact phrasing/spacing, not your suggestion)
- User: "option 2" → Extract the name from option 2 in your previous message
- User: "2" → Extract the name from option 2 in your previous message
- IMPORTANT: If user modifies a suggested name (spacing, capitalization, wording), always use THEIR version

REMOVE these words/phrases from extraction: "I like", "I think", "to name it", "let's go with", "how about", "I want", "sounds", "looks", "seems", "good", "nice", "perfect", "a good name", "is a"

Then respond with a VARIED, natural acknowledgment (never use the same opener twice). Give one sentence on why the name fits. Then present 3 descriptions. ALWAYS end your response with [[NAME:ExtractedName]] on a new line.

Vary your openers — examples: "That name is magnetic!", "Absolutely love it!", "Perfect choice!", "That resonates deeply!", "Brilliant — it captures it perfectly!"

Format:
"[Dynamic varied praise]! [One sentence why the name fits the community].

Here are 3 descriptions that capture your vision. Pick one or write your own:

1️⃣ [description]
2️⃣ [description]
3️⃣ [description]

Which resonates with you, or would you like to write your own?
[[NAME:ExtractedName]]"

**MESSAGE 5 (After description choice):**
CRITICAL EXTRACTION RULES - Extract the actual description text:
- User: "option 1" or "1" → Extract the FULL description text from option 1 in your previous message
- User: "I like option 2" → Extract the FULL description from option 2
- User: custom text → Extract their custom description as-is
- User: asks to combine/mix/merge options (e.g. "combine 1 and 2", "mix option 1 and 3") → Generate a NEW description that blends the requested options. Use it as the extracted description.
- User: asks to modify/rewrite/shorten a description → Generate the updated description. Use it as the extracted description.

REMOVE these phrases: "I like", "I choose", "option", numbers, "sounds good"

MANDATORY: No matter what the user does in this step — whether they pick an option, write their own, ask to combine options, or request any modification — you MUST ALWAYS:
1. Produce a final description (extracted or newly generated)
2. Output [[DESC:ExtractedDescription]] on a new line
3. Show the category/audience/type inferences immediately after
4. Ask "Sound good? Any changes?"
NEVER skip the inferences and NEVER jump to Message 6 from Message 5.

Then respond with a VARIED natural acknowledgment (never repeat the same opener). Present inferences. ALWAYS end with [[DESC:ExtractedDescription]] on a new line.

Vary your openers — examples: "That paints a clear picture!", "This captures it beautifully!", "Spot on!", "That says it all!"

Format:
"[Dynamic varied praise]! Here's what I'm seeing:
📁 Category: [Your inference]
👥 Audience: [Your inference]
🌍 Type: [Public/Private - your inference]

Sound good? Any changes?
[[DESC:ExtractedDescription]]"

**MESSAGE 6 (After user confirms/adjusts inferences):**
CRITICAL: NEVER ask "Sound good? Any changes?" again in Message 6 or beyond — that question is ONLY for Message 5's initial inference presentation. After Message 5, always move forward.
- If user CONFIRMS (says yes, looks good, sounds right, etc.): Go directly to logo/banner step below.
- If user requests a CHANGE to inferences (e.g., "make it private", "change category to Gaming", "audience should be beginners"): Apply the correction(s), re-display ALL inferences with updated values using the same emoji format, then immediately ask about logo/banner in the SAME message — do NOT ask "Sound good? Any changes?" again:

"Got it! Updated:
📁 Category: [Corrected/unchanged]
👥 Audience: [Corrected/unchanged]
🌍 Type: [Corrected/unchanged]

Last step — your logo and banner:

1️⃣ Generate with AI — I'll create custom visuals based on your community
2️⃣ Upload manually — use the preview panel on the right to upload your own

Which do you prefer?"

- If user requests a CHANGE to the DESCRIPTION (e.g., "change the description", "make it shorter", "use a different description", "rewrite it"): Generate a new description based on their request or the community context. Output the new description on its own line as [[DESC:NewDescriptionText]], then immediately ask about logo/banner:

"Done! Here's your updated description:
[[DESC:NewDescriptionText]]

Last step — your logo and banner:

1️⃣ Generate with AI — I'll create custom visuals based on your community
2️⃣ Upload manually — use the preview panel on the right to upload your own

Which do you prefer?"

- If no changes needed:
"Last step — your logo and banner:

1️⃣ Generate with AI — I'll create custom visuals based on your community
2️⃣ Upload manually — use the preview panel on the right to upload your own

Which do you prefer?"

**MESSAGE 7 (After user chooses logo/banner option):**
SCENARIO A — User picks "Generate with AI" (option 1 or says "generate"/"AI"):
Respond with ONLY: "On it! Generating your visuals now. ✨"
Do NOT say anything else. The frontend will trigger image generation automatically.

SCENARIO B — User picks "Upload manually" (option 2 or says "upload"/"manual"):
Respond: "No problem! Use the preview panel on the right to upload your logo and banner. Click the image areas to upload files."

**For subsequent messages after image choice:**
If the user has uploaded or generated both logo and banner: Congratulate them and tell them they can click "Create Community" in the preview panel.
If they request regeneration: Acknowledge briefly — "On it! Regenerating your [logo/banner/both] now." — nothing else.`;

// Extracts structured data from user messages
function extractDataFromUserMessage(
  userMessage: string,
  existingData?: Partial<CommunityData>,
  previousAIMessage?: string
): Partial<CommunityData> {
  const data: Partial<CommunityData> = { ...existingData };

  if (userMessage.length > 50 && previousAIMessage) {
    const hasDescriptionSuggestions =
      previousAIMessage.includes('1️⃣') &&
      previousAIMessage.includes('2️⃣') &&
      previousAIMessage.includes('3️⃣') &&
      /(?:description|resonates|write your own)/i.test(previousAIMessage);

    if (hasDescriptionSuggestions) {
      if (/we\s+bring\s+together|join\s+our\s+community|we\s+are|we\s+help|our\s+community/i.test(userMessage)) {
        data.description = userMessage.trim().substring(0, 400);
      }
    }
  }

  return data;
}

// Extracts structured data from AI response using [[TAG:value]] format
function extractDataFromConversation(
  aiResponse: string,
  existingData?: Partial<CommunityData>
): Partial<CommunityData> {
  const data: Partial<CommunityData> = { ...existingData };

  const classMatch = aiResponse.match(/\[\[CLASS:([^\]]+)\]\]/i);
  if (classMatch) {
    data.communityClass = classMatch[1].trim() as CommunityData['communityClass'];
  }

  const nameMatch = aiResponse.match(/\[\[NAME:([^\]]+)\]\]/i);
  if (nameMatch) {
    data.name = nameMatch[1].trim();
  }

  const descriptionMatch = aiResponse.match(/\[\[DESC:([^\]]+)\]\]/i);
  if (descriptionMatch) {
    data.description = descriptionMatch[1].trim().substring(0, 400);
  }

  const categoryMatch = aiResponse.match(/📁\s*category[:\s]+([^,.\n]+)/i);
  if (categoryMatch) {
    data.category = categoryMatch[1].trim() as CommunityData['category'];
  }

  const typeMatch = aiResponse.match(/🌍\s*type[:\s]+([^,.\n]+)/i);
  if (typeMatch) {
    const typeText = typeMatch[1].trim().toLowerCase();
    if (typeText.includes('public')) data.type = 'Public';
    else if (typeText.includes('private')) data.type = 'Private';
  }

  const audienceMatch = aiResponse.match(/👥\s*audience[:\s]+([^,.\n]+)/i);
  if (audienceMatch) {
    data.targetAudience = audienceMatch[1].trim().substring(0, 150);
  }

  return data;
}

export interface ChatEngineResult {
  reply: string;
  updatedData: Partial<CommunityData>;
}

export async function processMessage(
  messages: ChatMessage[],
  extractedData?: Partial<CommunityData>
): Promise<ChatEngineResult> {
  try {
    let systemContent = SYSTEM_PROMPT;

    // Inject context about existing community names for duplicate detection
    if (extractedData?.name && isDuplicateName(extractedData.name)) {
      systemContent += `\n\n## CRITICAL: NAME ALREADY TAKEN\nThe name "${extractedData.name}" is already taken (names are case-insensitive — any capitalization variant is also unavailable). Do NOT show category/audience/type inferences. Instead:\n1. Tell the user this name is unavailable (one brief sentence)\n2. Suggest 3 alternative names based on the community context\n3. Ask them to pick one or provide a new name\nWhen they choose, output [[NAME:NewName]] and continue the flow normally.`;
    }

    if (extractedData?.logo && extractedData?.banner) {
      systemContent += '\n\n## CURRENT STATE\nLogo and banner have already been generated. Do NOT proactively offer or ask about image generation. However, if the user explicitly requests regeneration of the logo, banner, or both, respond with a brief acknowledgment only — e.g., "On it! Regenerating your [logo/banner/both] now." — nothing else.';
    } else if (extractedData?.logo) {
      systemContent += '\n\n## CURRENT STATE\nThe community logo has already been generated. Do NOT proactively ask about logo generation. If the user explicitly requests logo or both visuals to be regenerated, acknowledge briefly — e.g., "On it! Regenerating your logo now."';
    } else if (extractedData?.banner) {
      systemContent += '\n\n## CURRENT STATE\nThe community banner has already been generated. Do NOT proactively ask about banner generation. If the user explicitly requests banner or both visuals to be regenerated, acknowledge briefly — e.g., "On it! Regenerating your banner now."';
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemContent,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const rawReply =
      response.content[0]?.type === 'text'
        ? response.content[0].text
        : 'I apologize, I encountered an issue. Could you please repeat that?';

    // Strip hidden extraction tags before displaying to user
    const reply = rawReply
      .replace(/\[\[CLASS:[^\]]*\]\]/g, '')
      .replace(/\[\[NAME:[^\]]*\]\]/g, '')
      .replace(/\[\[DESC:[^\]]*\]\]/g, '')
      .trim();

    const latestUserMessage = messages.filter((m) => m.role === 'user').pop()?.content || '';
    const previousAIMessage = messages.filter((m) => m.role === 'assistant').pop()?.content || '';

    let updatedData = { ...extractedData };
    updatedData = extractDataFromUserMessage(latestUserMessage, updatedData, previousAIMessage);
    updatedData = extractDataFromConversation(rawReply, updatedData);

    return { reply, updatedData };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Anthropic API Error:', err.message);
    throw new Error('Failed to process message with AI');
  }
}

export async function generateGreeting(): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 150,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: '__GREETING__' }],
  });

  const raw =
    response.content[0]?.type === 'text'
      ? response.content[0].text.trim()
      : "Hey! 👋 I'm AVA, Freedom World's AI Community Consultant — here to help you launch your dream community.\nWhat kind of community are you thinking of building?";

  if (!raw.includes('\n')) {
    return raw.replace(/([.!])\s+((?:What|So|Tell|Who|How)\b)/, '$1\n$2');
  }

  return raw;
}

export async function moderateContent(content: string): Promise<boolean> {
  // Anthropic has built-in safety — skip external moderation
  // Return false (not flagged) by default
  const prohibited = /\b(spam|scam|fraud|phishing|malware|terrorism|violence)\b/i;
  return prohibited.test(content);
}

// ============================================================
// Merchant message processor (chat-first / anonymous flow)
// ============================================================

export interface MerchantExtractions {
  businessName?: string;
  vibe?: string;
  products?: string[];
  rewards?: string;
  step?: string;
  style?: string;
  audience?: string;
}

export interface MerchantChatResult {
  reply: string;
  extractions: MerchantExtractions;
}

export async function processMerchantMessage(
  messages: ChatMessage[],
  context?: {
    businessType?: string;
    businessName?: string;
    isAnonymous?: boolean;
    exchangeCount?: number;
  }
): Promise<MerchantChatResult> {
  let system = MERCHANT_SYSTEM_PROMPT;

  if (context?.businessName) {
    system += `\n\n## CURRENT STATE\nBusiness name: "${context.businessName}"`;
  }
  if (context?.businessType) {
    system += `\nBusiness type: ${context.businessType}`;
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const rawReply =
    response.content[0]?.type === 'text'
      ? response.content[0].text
      : "I'm having a little trouble — could you repeat that? 😊";

  // Extract tags from LLM response
  const nameMatch = rawReply.match(/\[\[NAME:([^\]]+)\]\]/i);
  const vibeMatch = rawReply.match(/\[\[VIBE:([^\]]+)\]\]/i);
  const productsMatch = rawReply.match(/\[\[PRODUCTS:([^\]]+)\]\]/i);
  const rewardsMatch = rawReply.match(/\[\[REWARDS:([^\]]+)\]\]/i);
  const styleMatch = rawReply.match(/\[\[STYLE:([^\]]+)\]\]/i);
  const stepMatch = rawReply.match(/\[\[STEP:([^\]]+)\]\]/i);
  const audienceMatch = rawReply.match(/\[\[AUDIENCE:([^\]]+)\]\]/i);

  // Determine step deterministically: use LLM tag if present, otherwise infer from exchange count
  // Exchange 1 = after business type (step 2), 2 = after vibe (step 3), etc.
  let step = stepMatch?.[1].trim();
  if (!step && context?.exchangeCount) {
    // Fallback: exchange count maps to step number
    // exchange 1 → step 2, exchange 2 → step 3, etc.
    step = String(Math.min(context.exchangeCount + 1, 6));
  }

  const extractions: MerchantExtractions = {
    businessName: nameMatch?.[1].trim(),
    vibe: vibeMatch?.[1].trim(),
    products: productsMatch?.[1].trim().split(',').map((s) => s.trim()).filter(Boolean),
    rewards: rewardsMatch?.[1].trim(),
    step,
    style: styleMatch?.[1].trim(),
    audience: audienceMatch?.[1].trim(),
  };

  // Strip all [[TAGS]] before display
  const reply = rawReply
    .replace(/\[\[[A-Z_]+:[^\]]*\]\]/g, '')
    .trim();

  return { reply, extractions };
}

export async function generateMerchantGreeting(businessType?: string): Promise<string> {
  if (!businessType) {
    return "Hey! 👋 I'm AVA — your AI community builder. Tap your business type below to get started — I'll build your community live as we chat! ✨";
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-20250514',
    max_tokens: 150,
    system: MERCHANT_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `[[BUSINESS_TYPE:${businessType}]]` },
    ],
  });

  const raw =
    response.content[0]?.type === 'text'
      ? response.content[0].text.replace(/\[\[[A-Z_]+:[^\]]*\]\]/g, '').trim()
      : `Love it — a ${businessType}! 🎉 Your template is live in the preview. What's the name of your ${businessType}? And in one word, what's the vibe — cozy, bold, classy, playful?`;

  return raw;
}
