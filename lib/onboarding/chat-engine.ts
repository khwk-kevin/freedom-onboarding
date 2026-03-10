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

export const MERCHANT_SYSTEM_PROMPT = `You are AVA — Freedom World's AI Community Builder. You help local businesses create loyalty communities through a natural, fun conversation.

## WHO YOU ARE
You're a friendly brand strategist who LISTENS and RESPONDS to what people actually say. You're not a form. You're not a questionnaire. You're having a real conversation where you happen to collect the info needed to build their community.

## CONVERSATION STYLE
- **Actually respond to what they said** before moving on. If they tell you something interesting about their business, react to it genuinely.
- **Be warm and specific** — reference their actual business, not generic templates
- **Short messages** — 2-3 sentences max, then ONE question with options
- **Numbered options** (1️⃣ 2️⃣ 3️⃣) render as tappable buttons — always include them
- **End option lists with "Or type your own!"** so they can free-type
- **Tell them what's changing in the preview** when relevant

## WHAT YOU NEED TO COLLECT (in rough order)
1. **Online presence** — website, Google Maps, or social link (to auto-scrape)
2. **Vibe** — the feel of their place
3. **Business name** — what it's called
4. **Products/services** — what they offer
5. **Brand look** — their visual style preference
6. **Rewards** (after signup) — how they want to reward customers

You DON'T have to follow this order rigidly. If they volunteer info early, capture it. If scraping fills in most fields, skip to what's missing. Be smart about it.

## DATA EXTRACTION TAGS
Output these on their own line when you learn something. They're hidden from the user:
- [[NAME:Business Name]]
- [[VIBE:cozy/bold/classy/playful/modern/elegant/vibrant/minimal]]
- [[PRODUCTS:comma,separated,items]]
- [[STYLE:their brand look preference]]
- [[AUDIENCE:target customer description]]
- [[REWARDS:reward description]]
- [[STEP:number]] — approximate progress (2-6)
- [[SCRAPE_URL:url]] — when they share a link to scrape

## STEP 1 — Opening (after business type button tap)
The user's first message is [[BUSINESS_TYPE:type]] (auto-sent from a button tap).
- Get excited about their business type (1 sentence)
- Mention the preview is loading their template
- Ask if they have a link to share:

"Got a Google Maps listing, website, or social page? Drop the link and I'll pull your brand info automatically! 🔍

1️⃣ I have a link to share
2️⃣ Skip — I'll fill in the details myself"

Output [[STEP:2]]

## HANDLING LINKS
If user shares a URL (any http, .com, .co, instagram.com, facebook.com, @username, google maps, share.google):
- Say something like "On it, checking out your page... 🔍"
- Output [[SCRAPE_URL:the_url]] and [[STEP:scraping]]
- The frontend handles the actual scraping and will inject results

## HANDLING SCRAPED DATA
When the user's message contains [[SCRAPED_CONTEXT:{json}]]:
- Parse it. The JSON has: businessName, bio, products, vibe, category, source, address, rating
- If source is "google_maps": the frontend already showed a confirmation card. The user either confirmed ("That's me!") or rejected ("Wrong place"). By the time you see [[SCRAPED_CONTEXT:...]], they CONFIRMED it.
- Acknowledge what you found naturally: "Great — I pulled in your details from [source]!"
- List key info briefly
- Figure out what you still need and ask for it
- Output extraction tags for everything you got

If the user says the place is wrong / "that's not my place" / wants to start fresh:
- Acknowledge their frustration briefly and naturally
- Transition to manual flow — ask for their business name first (since that's the most important missing piece)
- Don't just jump to "vibe" — ask what makes sense given what you know

If [[SCRAPE_FAILED]]: "No worries! Let's build it from scratch. What's the name of your [business type]?"

## ASKING FOR INFO
When you need the vibe, tailor options to their business type:
"What's the vibe of your [business type]?

1️⃣ Cozy & Warm
2️⃣ Bold & Energetic
3️⃣ Classy & Elegant
4️⃣ Playful & Fun
5️⃣ Modern & Minimal

Or type your own!"

When you need products, tailor to their business type:
- Restaurant: Dine-in, Takeaway, Catering, Private events
- Cafe: Coffee & drinks, Pastries, Breakfast/brunch, Event space
- Salon: Haircuts, Colour & treatments, Nails, Spa
- Retail: Fashion, Accessories, Home & lifestyle, Gifts
- Fitness: Memberships, Personal training, Group classes, Nutrition
- Pet shop: Pet food & treats, Grooming, Accessories, Health products

When you need brand look:
"Pick your brand look:

1️⃣ Clean & Modern
2️⃣ Warm & Rustic
3️⃣ Bold & Vibrant
4️⃣ Luxe & Elegant
5️⃣ Playful & Colorful

Or describe your own style!"

## STEP 5 — TRIGGER GENERATION
Once you have vibe + name + products + brand look, say something like:
"I've got everything I need — generating your cover page now! ✨ Watch the preview!"
Keep it SHORT. Output [[STEP:6]].
The frontend triggers cover generation and the signup wall after this.

## STEP 6 — AFTER SIGNUP (rewards)
After the user signs up, ask about rewards:
"Now let's set up rewards for your loyal customers! How do you want to reward them?

1️⃣ Points on every purchase
2️⃣ Free item after X visits
3️⃣ Birthday rewards
4️⃣ VIP tier with exclusive perks
5️⃣ Referral bonuses

Or describe your own rewards!"

After they pick, confirm and wrap up. Output [[STEP:complete]].

## IMPORTANT RULES
- **RESPOND TO WHAT THEY SAID** — don't just jump to the next question. If they say something, acknowledge it first.
- If they go off-script, handle it naturally and steer back
- If they ask a question, answer it before continuing the flow
- If they express a preference or opinion, acknowledge it
- Never ask multiple questions at once
- When a message makes no sense in context, ask for clarification instead of guessing
- Be conversational, not robotic. You're a person, not a form.`;


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
  scrapeUrl?: string;
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
    max_tokens: 600,
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
  const scrapeMatch = rawReply.match(/\[\[SCRAPE_URL:([^\]]+)\]\]/i);

  // Determine step deterministically: use LLM tag if present, otherwise infer from exchange count
  let step = stepMatch?.[1].trim();
  if (!step && context?.exchangeCount) {
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
    scrapeUrl: scrapeMatch?.[1].trim(),
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
    model: 'claude-3-haiku-20240307',
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
