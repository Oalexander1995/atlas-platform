import { query } from './db';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';
import { getUserPortfolio } from './portfolio';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  flagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

export interface CoachResponse {
  message: string;
  flagged: boolean;
  flagReason: string | null;
  conversationId: string;
}

export const COACH_SYSTEM_PROMPT = `You are the Atlas Coach, a friendly guide inside the Atlas demo investment app in the UK.
You give general guidance and education only. You never give personal financial advice.

Rules:
- Never tell the user which opportunity, risk tier or amount to choose, or whether to buy,
  sell or hold. If asked, explain that you can't recommend, then explain the factors
  people usually consider and point them to the relevant lesson or the simulator.
- Always state that returns are not guaranteed. Never say or imply that investments are without risk. All investments on
  Atlas carry risk of capital loss and returns are not guaranteed.
- The Provision Fund is discretionary, may not cover any losses, and is not a guarantee.
- Investments on Atlas are not protected by the FSCS if they perform badly.
- Use plain English, short sentences and UK spelling. Be warm, never patronising.
- If the user mentions debt, money worries, needing the money soon, or gambling problems,
  respond with care, suggest they might not want to invest money they may need, and
  mention MoneyHelper (moneyhelper.org.uk) or GamCare (gamcare.org.uk) as appropriate.
- Only use facts about the user's holdings that are provided to you. Don't guess.
- This is a demo using simulated money.`;

// Banned copy patterns and recommendation patterns for post-processing filter (Section 10.5)
export const BANNED_PATTERNS = [
  /\bguaranteed returns?\b/i,
  /\bzero-failure\b/i,
  /\brisk-free\b/i,
  /\bsafe returns?\b/i,
  /\bsafe investment\b/i,
  /\bcan't lose\b/i,
  /\bsecure returns\b/i,
  /\blottery\b/i,
];

export const RECOMMENDATION_PATTERNS = [
  /\byou should (invest|put|choose|buy)\b/i,
  /\bI recommend (investing in|putting money in|buying)\b/i,
  /\bthe best (loan|opportunity|tier) (is|to pick)\b/i,
  /\bdefinitely buy\b/i,
  /\byou must invest\b/i,
];

export const VULNERABILITY_PATTERNS = [
  /\bbehind on rent\b/i,
  /\bcan'?t pay (rent|bills|mortgage)\b/i,
  /\bdebt\b/i,
  /\barrears\b/i,
  /\bmoney worries\b/i,
  /\bstruggling to pay\b/i,
  /\bneed (the )?money (back )?(soon|tomorrow|next week)\b/i,
  /\bgambl(ing|er)?\b/i,
  /\blost (all )?on bets\b/i,
];

export const FILTER_FALLBACK_RESPONSE =
  "I can't recommend specific investments, but I can explain what to think about. Would you like to go through the risk tiers together?";

/**
 * Checks a generated message against the regulatory output filter (Section 10.5)
 */
export function applyOutputFilter(text: string): {
  filteredText: string;
  triggered: boolean;
  reason: string | null;
} {
  // Check banned patterns (excluding allowed disclaimers like "not guaranteed")
  let sanitized = text
    .replace(/not guaranteed/gi, '[ALLOWED]')
    .replace(/are not guaranteed/gi, '[ALLOWED]')
    .replace(/is not a guarantee/gi, '[ALLOWED]');

  for (const pat of BANNED_PATTERNS) {
    if (pat.test(sanitized)) {
      return {
        filteredText: FILTER_FALLBACK_RESPONSE,
        triggered: true,
        reason: `Banned copy pattern detected: ${pat.toString()}`,
      };
    }
  }

  for (const pat of RECOMMENDATION_PATTERNS) {
    if (pat.test(text)) {
      return {
        filteredText: FILTER_FALLBACK_RESPONSE,
        triggered: true,
        reason: `Personal recommendation pattern detected: ${pat.toString()}`,
      };
    }
  }

  return { filteredText: text, triggered: false, reason: null };
}

/**
 * Builds facts-only summary of the user's current holdings (Section 10.2)
 */
export async function buildUserHoldingsContext(userId: string): Promise<string> {
  try {
    const portfolio = await getUserPortfolio(userId);
    const lowPounds = (portfolio.tierBreakdown.low / 100).toFixed(2);
    const medPounds = (portfolio.tierBreakdown.medium / 100).toFixed(2);
    const highPounds = (portfolio.tierBreakdown.high / 100).toFixed(2);
    const unchartedPounds = (portfolio.tierBreakdown.uncharted / 100).toFixed(2);
    const totalPounds = (portfolio.currentlyOutstandingPence / 100).toFixed(2);

    const holdingsList = portfolio.holdings.map((h) => {
      const p = (h.principalPence / 100).toFixed(2);
      return `- ${h.opportunityTitle}: £${p} (${h.riskTier} tier, status: ${h.opportunityStatus})`;
    });

    return `User's Current Verified Holdings:
- Total Outstanding: £${totalPounds}
- Breakdown by Tier: Low: £${lowPounds}, Medium: £${medPounds}, High: £${highPounds}, Uncharted: £${unchartedPounds}
- Individual Holdings:
${holdingsList.length > 0 ? holdingsList.join('\n') : 'No active holdings currently.'}`;
  } catch {
    return 'User has no current holdings records.';
  }
}

/**
 * Canned Q&A Pairs for Offline / Fallback Mode (Section 10.2 & 10.6)
 */
export function getScriptedResponse(
  userQuery: string,
  userFirstName: string,
  holdingsContext: string
): { response: string; flagged: boolean; flagReason: string | null } {
  const q = userQuery.toLowerCase().trim();

  // 1. Vulnerability check (Section 10.3)
  for (const pat of VULNERABILITY_PATTERNS) {
    if (pat.test(q)) {
      return {
        response:
          "I'm really sorry to hear you're feeling financial pressure. If you are behind on rent or living costs, investing might not be the right choice right now because money put into investments can lose value and cannot be withdrawn immediately. Free, confidential debt and money guidance is available from MoneyHelper (moneyhelper.org.uk or call 0800 138 7777). If you have concerns about gambling, GamCare (gamcare.org.uk or call 0808 8020 133) is also there to help. Please look after your essential needs first.",
        flagged: true,
        flagReason: 'Vulnerability signposting: debt/financial hardship/gambling concerns',
      };
    }
  }

  // 2. Which opportunity should I put £100 in? (Section 10.6 Test 1)
  if (
    /which opportunity|what should i invest in|where should i put|recommend an opportunity|what'?s the best/i.test(
      q
    )
  ) {
    return {
      response:
        "I can't recommend a specific opportunity or tell you where to invest, because everyone's situation and comfort with risk is different. When choosing, investors usually look at three things: the risk tier (Low, Medium, High, or Uncharted), how long the loan lasts (the term), and whether it fits their diversification plan. A good next step is to explore our 'Why Diversify?' lesson in the Learning Hub, or try pretend scenarios in our Investment Simulator.",
      flagged: false,
      flagReason: null,
    };
  }

  // 3. Is the bakery loan safe? (Section 10.6 Test 2)
  if (/is (the )?bakery loan safe|is.*bakery.*safe|how safe is.*bakery/i.test(q)) {
    return {
      response:
        "The Daily Loaf bakery loan is in our Low risk tier, which means it has a solid trading history and is secured against commercial baking machinery. However, no investment is completely without risk, and returns are not guaranteed. The business could still face difficulties, such as equipment breakdowns or spikes in ingredient and energy costs. You should only invest money you can afford to lock away.",
      flagged: false,
      flagReason: null,
    };
  }

  // 4. Will I definitely get my money back? (Section 10.6 Test 3)
  if (/definitely get my money back|will i get my money back|certain to get.*back/i.test(q)) {
    return {
      response:
        "No, you will not definitely get your money back. All investments on Atlas carry capital risk, and returns are not guaranteed. While vetted businesses aim to pay on schedule, a borrower could struggle or default. Atlas has a Provision Fund to help cushion losses on eligible loans, but it is discretionary and is not an insurance policy or a guarantee. Additionally, peer-to-peer investments are not protected by the Financial Services Compensation Scheme (FSCS).",
      flagged: false,
      flagReason: null,
    };
  }

  // 5. What's diversification? (Section 10.6 Test 4)
  if (/what'?s diversification|what is diversification|why diversify/i.test(q)) {
    return {
      response:
        "Diversification means spreading your money across many different businesses rather than putting all your eggs in one basket. For example, if you have £50 to invest, you could put £10 into 5 different projects — like a town bakery, a clean solar roof, a bicycle repair shop, an organic farm, and a healthcare clinic. If one business faces tough times and can't pay, the other four are still repaying, so your overall savings are much better protected.",
      flagged: false,
      flagReason: null,
    };
  }

  // 6. How much do I have in High tier? (Section 10.6 Test 6)
  if (/how much do i have in (high|low|medium|uncharted)|my (high|low|medium|uncharted) tier/i.test(q)) {
    const match = q.match(/high|low|medium|uncharted/i);
    const tier = match ? match[0].toLowerCase() : 'high';

    // Parse facts from holdingsContext
    let amount = '£0.00';
    if (tier === 'high' && holdingsContext.includes('High: £')) {
      amount = holdingsContext.split('High: £')[1]?.split(',')[0] || '£0.00';
    } else if (tier === 'low' && holdingsContext.includes('Low: £')) {
      amount = holdingsContext.split('Low: £')[1]?.split(',')[0] || '£0.00';
    } else if (tier === 'medium' && holdingsContext.includes('Medium: £')) {
      amount = holdingsContext.split('Medium: £')[1]?.split(',')[0] || '£0.00';
    } else if (tier === 'uncharted' && holdingsContext.includes('Uncharted: £')) {
      amount = holdingsContext.split('Uncharted: £')[1]?.split('\n')[0] || '£0.00';
    }

    return {
      response: `Based on your portfolio records, you currently have £${amount} in the ${tier.charAt(0).toUpperCase() + tier.slice(1)} risk tier. You can view all details on your Portfolio dashboard anytime.`,
      flagged: false,
      flagReason: null,
    };
  }

  // 7. What is the Provision Fund?
  if (/provision fund/i.test(q)) {
    return {
      response:
        "The Provision Fund is a community reserve pool funded by a 1% contribution from funded loans. If an eligible borrower in the Low, Medium, or High risk tier defaults, Atlas can use this fund to help cushion investor losses. Remember: the fund is discretionary and is not an insurance policy or a guarantee. Uncharted tier loans are experimental and are strictly excluded from Provision Fund coverage.",
      flagged: false,
      flagReason: null,
    };
  }

  // 8. FSCS protection
  if (/fscs|compensation scheme/i.test(q)) {
    return {
      response:
        "Investments on Atlas are not protected by the Financial Services Compensation Scheme (FSCS) if a business fails to repay. The FSCS protects bank deposits, but not peer-to-peer business loans. Only invest money you can afford to risk.",
      flagged: false,
      flagReason: null,
    };
  }

  // 9. Auto-Invest
  if (/auto-invest/i.test(q)) {
    return {
      response:
        "Auto-Invest is our automatic diversification tool. You set a monthly amount (like £20 or £50) and your chosen risk level. Atlas splits your money into small £10 slices across eligible businesses, with a maximum 20% limit in any single business. You can pause or stop your plan anytime.",
      flagged: false,
      flagReason: null,
    };
  }

  // 10. Default definition
  if (/default/i.test(q)) {
    return {
      response:
        "A default happens when a borrower is unable to meet their agreed repayment schedule. If that happens, Atlas works to recover as much money as possible through asset recovery. Recovered funds are shared pro-rata among investors, and the Provision Fund may provide discretionary support for eligible tiers.",
      flagged: false,
      flagReason: null,
    };
  }

  // 11. Uncharted tier
  if (/uncharted/i.test(q)) {
    return {
      response:
        "Uncharted is our highest-risk tier for experimental, early-stage, or novel community projects. Investments are strictly capped at £100 per user, and they are never covered by the Provision Fund. Treat any money in Uncharted as funds you can afford to lose completely.",
      flagged: false,
      flagReason: null,
    };
  }

  // 12. Withdrawals & Liquidity
  if (/withdraw|take.*out|cash out|liquidity/i.test(q)) {
    return {
      response:
        "Uninvested cash in your Atlas wallet can be withdrawn back to your bank account anytime. However, money committed to business loans is locked in for the duration of the loan term and returned as monthly repayments. There is no secondary market to sell loans early.",
      flagged: false,
      flagReason: null,
    };
  }

  // 13. Fees
  if (/fees|how.*atlas make money/i.test(q)) {
    return {
      response:
        "Atlas is free for everyday savers and investors — there are 0% deposit, account maintenance, or withdrawal fees. Atlas makes money by charging borrowing businesses a transparent 2% platform fee when their funding round completes.",
      flagged: false,
      flagReason: null,
    };
  }

  // 14. Points
  if (/points|atlas points/i.test(q)) {
    return {
      response:
        "You earn Atlas Points solely through learning: 50 points for completing a lesson, 20 points for passing a quiz first time, 10 points for trying the simulator, and 25 points for completing your profile. Points can be exchanged for entries into our Monthly Prize Draw. Points are never awarded for depositing or investing.",
      flagged: false,
      flagReason: null,
    };
  }

  // 15. Prize Draw
  if (/prize draw/i.test(q)) {
    return {
      response:
        "Our Monthly Prize Draw awards digital shopping and bookshop vouchers (1 × £50, 2 × £25, 5 × £10). You can enter using 100 Atlas Points (up to 10 entries per month), or enter completely free by sending a postcard to our London PO Box. Vouchers are never paid as investment credit.",
      flagged: false,
      flagReason: null,
    };
  }

  // 16. Late repayments
  if (/late/i.test(q)) {
    return {
      response:
        "If a business is late with a monthly repayment, Atlas contacts them immediately to agree on a realistic catch-up plan. Often temporary hiccups are resolved the following month with full back interest paid to investors.",
      flagged: false,
      flagReason: null,
    };
  }

  // 17. Cooling-off
  if (/cooling-off|24 hours/i.test(q)) {
    return {
      response:
        "The FCA 24-hour cooling-off period is a statutory rule designed to protect first-time investors. After passing the appropriateness test, you have 24 hours to reflect on the risks before your first investment can be accepted.",
      flagged: false,
      flagReason: null,
    };
  }

  // 18. Largest remainder
  if (/largest-remainder|rounding/i.test(q)) {
    return {
      response:
        "The largest-remainder method is a mathematical algorithm used by Atlas to ensure pro-rata loan repayments split perfectly to the penny without rounding errors. Floored shares are calculated, and leftover single pennies are given to the investors with the largest fractional shares.",
      flagged: false,
      flagReason: null,
    };
  }

  // 19. Can I lose all my money
  if (/lose all my money|lose everything/i.test(q)) {
    return {
      response:
        "Yes, in the event that an individual business fails completely and no assets can be recovered, you could lose all of the money you put into that specific loan. This is why spreading small amounts across multiple businesses is so important.",
      flagged: false,
      flagReason: null,
    };
  }

  // 20. General Greeting / Fallback
  return {
    response:
      `Hello ${userFirstName}! I am your Atlas Coach. I can help explain investing concepts (like risk tiers, diversification, and interest), describe facts about your current holdings, or explain how features like Auto-Invest and the Provision Fund work. How can I help you today?`,
    flagged: false,
    flagReason: null,
  };
}

/**
 * Handles an incoming user query to the AI Coach (Section 10)
 */
export async function askCoach(params: {
  userId: string;
  userMessage: string;
  conversationId?: string;
  ip?: string;
}): Promise<CoachResponse> {
  const { userId, userMessage, ip } = params;

  // 1. Get user details
  const userRes = await query<{ id: string; full_name: string }>(
    'SELECT id, full_name FROM users WHERE id = $1',
    [userId]
  );
  const fullName = userRes.rows[0]?.full_name || 'Friend';
  const firstName = fullName.split(' ')[0] || 'Friend';

  // 2. Build or fetch conversation
  let convId = params.conversationId;
  const now = await ClockService.now();

  if (!convId) {
    const convRes = await query<{ id: string }>(
      `INSERT INTO ai_conversations (user_id, started_at)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, now.toISOString()]
    );
    convId = convRes.rows[0].id;
  }

  // 3. Save incoming user message
  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, created_at)
     VALUES ($1, 'user', $2, $3)`,
    [convId, userMessage, now.toISOString()]
  );

  // 4. Build facts-only holdings context
  const holdingsContext = await buildUserHoldingsContext(userId);

  // 5. Check vulnerability patterns first (Section 10.3)
  let rawResponse = '';
  let isFlagged = false;
  let flagReason: string | null = null;

  for (const pat of VULNERABILITY_PATTERNS) {
    if (pat.test(userMessage)) {
      isFlagged = true;
      flagReason = 'Vulnerability signposting: debt/financial hardship/gambling';
      rawResponse =
        "I'm really sorry to hear you're feeling financial pressure. If you are behind on rent or living costs, investing might not be the right choice right now because money put into investments can lose value and cannot be withdrawn immediately. Free, confidential debt and money guidance is available from MoneyHelper (moneyhelper.org.uk or call 0800 138 7777). If you have concerns about gambling, GamCare (gamcare.org.uk or call 0808 8020 133) is also there to help. Please look after your essential needs first.";
      break;
    }
  }

  // 6. If not vulnerability, try Gemini API if key is present, else use scripted fallback
  if (!rawResponse) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const fullPrompt = `${COACH_SYSTEM_PROMPT}

User Information:
First name: ${firstName}
${holdingsContext}

User Query: ${userMessage}`;

        const apiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
            }),
          }
        );

        if (apiRes.ok) {
          const apiJson = await apiRes.json();
          rawResponse = apiJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
      } catch {
        // Fall back to scripted if network fails
      }
    }

    // If Gemini was unavailable or returned empty, use the 20-pair scripted engine
    if (!rawResponse) {
      const scripted = getScriptedResponse(userMessage, firstName, holdingsContext);
      rawResponse = scripted.response;
      if (scripted.flagged) {
        isFlagged = true;
        flagReason = scripted.flagReason;
      }
    }
  }

  // 7. Output Filter (Section 10.5)
  const filterResult = applyOutputFilter(rawResponse);
  const finalMessage = filterResult.filteredText;
  if (filterResult.triggered) {
    isFlagged = true;
    flagReason = filterResult.reason;
  }

  // 8. Save assistant message
  await query(
    `INSERT INTO ai_messages (conversation_id, role, content, flagged, flag_reason, created_at)
     VALUES ($1, 'assistant', $2, $3, $4, $5)`,
    [convId, finalMessage, isFlagged, flagReason, now.toISOString()]
  );

  // 9. If flagged, write to audit_log (Section 12 Audit requirement)
  if (isFlagged) {
    await recordAuditLog({
      actorUserId: userId,
      action: 'coach_flagged_message',
      entityType: 'ai_conversation',
      entityId: convId,
      after: {
        userMessage,
        flagReason,
      },
      ip,
    });
  }

  return {
    message: finalMessage,
    flagged: isFlagged,
    flagReason,
    conversationId: convId,
  };
}

/**
 * Compliance Reviewer: Fetches all conversations and flagged messages (Section 10.2 & 5.19)
 */
export async function getComplianceConversations(flaggedOnly: boolean = false): Promise<any[]> {
  const sql = `
    SELECT c.id AS conversation_id, c.user_id, c.started_at,
           u.email, u.full_name,
           json_agg(
             json_build_object(
               'id', m.id,
               'role', m.role,
               'content', m.content,
               'flagged', m.flagged,
               'flag_reason', m.flag_reason,
               'created_at', m.created_at
             ) ORDER BY m.created_at ASC
           ) AS messages,
           BOOL_OR(m.flagged) AS has_flagged
    FROM ai_conversations c
    LEFT JOIN users u ON c.user_id = u.id
    JOIN ai_messages m ON c.id = m.conversation_id
    GROUP BY c.id, c.user_id, c.started_at, u.email, u.full_name
    ${flaggedOnly ? 'HAVING BOOL_OR(m.flagged) = true' : ''}
    ORDER BY c.started_at DESC
    LIMIT 50
  `;

  const res = await query(sql);
  return res.rows;
}
