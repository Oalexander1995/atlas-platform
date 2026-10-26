import { query } from './db';
import { hashPassword, UserRole, AccountState } from './auth';
import { depositDemoMoney, getOrCreateUserWallet, getWalletBalancePence, getOrCreateOpportunityEscrow, getOrCreateSystemAccount } from './ledger';
import { ClockService } from './clock';

export async function ensureDemoUsersSeeded(): Promise<void> {
  const defaultPassword = 'AtlasDemo!2026';
  const passwordHash = await hashPassword(defaultPassword);
  const now = await ClockService.now();

  const demoUsers: Array<{
    email: string;
    fullName: string;
    role: UserRole;
    accountState: AccountState;
    initialBalancePence?: number;
  }> = [
    {
      email: 'admin@atlas.demo',
      fullName: 'Atlas Admin',
      role: 'admin',
      accountState: 'verified',
    },
    {
      email: 'compliance@atlas.demo',
      fullName: 'Atlas Compliance Officer',
      role: 'compliance',
      accountState: 'verified',
    },
    {
      email: 'ready@atlas.demo',
      fullName: 'Ready Investor',
      role: 'investor',
      accountState: 'verified',
      initialBalancePence: 50000, // £500.00
    },
    {
      email: 'active@atlas.demo',
      fullName: 'Active Investor (Dani)',
      role: 'investor',
      accountState: 'verified',
      initialBalancePence: 25000, // £250.00
    },
    {
      email: 'new@atlas.demo',
      fullName: 'New Investor',
      role: 'investor',
      accountState: 'pending_kyc',
    },
  ];

  for (const user of demoUsers) {
    const res = await query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, date_of_birth, postcode, role, account_state, created_at)
       VALUES ($1, $2, $3, '1990-01-01', 'SW1A 1AA', $4, $5, $6)
       ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name
       RETURNING id`,
      [user.email, passwordHash, user.fullName, user.role, user.accountState, now.toISOString()]
    );
    const userId = res.rows[0].id;

    // Ensure wallet exists
    await getOrCreateUserWallet(userId);

    // If initial balance is specified and wallet is empty, deposit it via ledger
    if (user.initialBalancePence && user.initialBalancePence > 0) {
      const currentBal = await getWalletBalancePence(userId);
      if (currentBal === 0) {
        await depositDemoMoney({
          userId,
          amountPence: user.initialBalancePence,
          idempotencyKey: `seed_deposit_${userId}`,
          description: 'Initial demo balance',
        });
      }
    }

    // Auto-complete onboarding for ready@ and active@
    if (user.email === 'ready@atlas.demo' || user.email === 'active@atlas.demo') {
      await query(
        `INSERT INTO investor_classifications (user_id, category, declaration_text, declared_at)
         VALUES ($1, 'restricted', 'Restricted investor declaration', $2)
         ON CONFLICT DO NOTHING`,
        [userId, now.toISOString()]
      );

      await query(
        `INSERT INTO appropriateness_attempts (user_id, question_ids, answers, score, passed, attempted_at)
         VALUES ($1, ARRAY[1,4,7,10,13], '{}', 5, true, $2)
         ON CONFLICT DO NOTHING`,
        [userId, now.toISOString()]
      );
    }
  }

  // Ensure active@atlas.demo has 8 holdings seeded (Section 11)
  const activeUserRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['active@atlas.demo']);
  if (activeUserRes.rows.length > 0) {
    const activeUserId = activeUserRes.rows[0].id;
    const existingHoldings = await query<{ count: string }>('SELECT COUNT(*) FROM holdings WHERE user_id = $1', [activeUserId]);

    if (Number(existingHoldings.rows[0].count) === 0) {
      const oppsRes = await query<{ id: string; status: string }>('SELECT id, status FROM opportunities LIMIT 8');
      if (oppsRes.rows.length >= 8) {
        for (let i = 0; i < oppsRes.rows.length; i++) {
          const opp = oppsRes.rows[i];
          const principal = (i + 1) * 1500; // £15 to £120

          const hRes = await query<{ id: string }>(
            `INSERT INTO holdings (user_id, opportunity_id, principal_pence, source, status, created_at)
             VALUES ($1, $2, $3, 'manual', $4, $5)
             RETURNING id`,
            [
              activeUserId,
              opp.id,
              principal,
              opp.status === 'defaulted' ? 'defaulted' : 'active',
              now.toISOString(),
            ]
          );

          if (opp.status === 'defaulted') {
            await query(
              `INSERT INTO holding_losses (holding_id, user_id, opportunity_id, amount_pence, provision_payout_pence, payout_reason, created_at)
               VALUES ($1, $2, $3, $4, $5, 'Discretionary Provision Fund payout (50% loss cover)', $6)`,
              [hRes.rows[0].id, activeUserId, opp.id, principal, Math.floor(principal * 0.5), now.toISOString()]
            );
          }
        }
      }
    }
  }
}

/**
 * Seeds 12 vetted UK small businesses across 4 risk tiers (Section 6 & Section 11)
 */
export async function ensureOpportunitiesSeeded(): Promise<void> {
  const existingCount = await query<{ count: string }>('SELECT COUNT(*) FROM opportunities');
  if (Number(existingCount.rows[0].count) >= 12) {
    // Check if legacy bakery titles exist and update in-place to new investment opportunities
    const legacyCheck = await query<{ count: string }>(
      "SELECT COUNT(*) FROM opportunities WHERE title ILIKE '%Daily Loaf%'"
    );
    if (Number(legacyCheck.rows[0].count) > 0) {
      await updateLegacyToInvestmentOpportunities();
    }
    await ensureHighTicketSyndicates();
    return;
  }

  const now = await ClockService.now();

  const seedPartners = [
    {
      name: 'Marcus Vance (Property Renovator)',
      description: 'Experienced property renovator modernising residential Victorian houses for long-term rental income.',
      founded_year: 2018,
      sector: 'Property & Real Estate',
      location: 'Manchester, UK',
      track_record: { repaid_on_time: 4, previous_loans: 4 },
    },
    {
      name: 'Elena Rostova (Clean Infrastructure)',
      description: 'Renewable engineering specialist deploying rooftop commercial solar arrays and storage batteries.',
      founded_year: 2016,
      sector: 'Clean Energy & Storage',
      location: 'Bristol, UK',
      track_record: { repaid_on_time: 3, previous_loans: 3 },
    },
    {
      name: 'Dr. Richard Thorne (Clinical Director)',
      description: 'Medical clinic leader co-funding digital diagnostic scanners for regional diagnostic hubs.',
      founded_year: 2012,
      sector: 'Healthcare & MedTech',
      location: 'Harrogate, North Yorkshire',
      track_record: { repaid_on_time: 2, previous_loans: 2 },
    },
    {
      name: 'Liam Gallagher (Logistics Operator)',
      description: 'Commercial fleet operator expanding electric refrigerated delivery vans for zero-emission logistics.',
      founded_year: 2021,
      sector: 'Transport & Fleet',
      location: 'Birmingham, UK',
      track_record: { repaid_on_time: 1, previous_loans: 1 },
    },
    {
      name: 'Dr. Maya Patel (AgriTech Specialist)',
      description: 'Urban agricultural scientist building automated vertical hydroponic herb towers for supermarkets.',
      founded_year: 2022,
      sector: 'Smart Agriculture',
      location: 'Leeds, West Yorkshire',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Chloe & Sam Davis (Brand Founders)',
      description: 'Eco-apparel brand founders funding bulk seasonal yarn inventory purchases to fulfill pre-orders.',
      founded_year: 2020,
      sector: 'Consumer Goods & Trade',
      location: 'Exeter, Devon',
      track_record: { repaid_on_time: 1, previous_loans: 1 },
    },
    {
      name: 'Sophie Bennett (Game Director)',
      description: 'Indie game studio lead porting a viral PC game to Nintendo Switch and manufacturing physical editions.',
      founded_year: 2023,
      sector: 'Gaming & Digital Media',
      location: 'Sheffield, UK',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Highland Wool Millers',
      description: 'Artisan textile cooperative creating natural plant-dyed wool yarns.',
      founded_year: 2023,
      sector: 'Community Crafts',
      location: 'Fort William, Highlands',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Nathan Ross (Commercial Drone Pilot)',
      description: 'Specialist UAV survey team inspecting infrastructure, wind turbines, and industrial bridges.',
      founded_year: 2023,
      sector: 'Tech & Field Services',
      location: 'Newcastle upon Tyne',
      track_record: { repaid_on_time: 0, previous_loans: 1 },
    },
    {
      name: 'Tariq Al-Mansoor (Aerospace Engineer)',
      description: 'Satellite ground station network receiving low-Earth orbit weather and Earth-observation data.',
      founded_year: 2024,
      sector: 'Aerospace & Telecom',
      location: 'Ilkley, West Yorkshire',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Dr. Aris Vance (Bio-Energy Researcher)',
      description: 'Experimental tubular photo-bioreactor testing algae oil yield for sustainable aviation fuel.',
      founded_year: 2025,
      sector: 'Frontier CleanTech',
      location: 'Cambridge, UK',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Calum MacLeod (Hydro Specialist)',
      description: 'Experimental submerged river turbine prototype generating 24/7 continuous baseload electricity.',
      founded_year: 2025,
      sector: 'Experimental Energy',
      location: 'Dartmouth, Devon',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
  ];

  const partnerIdMap = new Map<string, string>();

  for (const p of seedPartners) {
    const res = await query<{ id: string }>(
      `INSERT INTO partners (name, description, founded_year, sector, location, track_record)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [p.name, p.description, p.founded_year, p.sector, p.location, JSON.stringify(p.track_record)]
    );
    partnerIdMap.set(p.name, res.rows[0].id);
  }

  const seedOpportunities = [
    // Low Tier (3 items)
    {
      partnerName: 'Marcus Vance (Property Renovator)',
      title: 'Manchester Canal-Side Victorian Residential Modernisation (8 Apartments)',
      summary: 'Refurbishing a Victorian property into 8 energy-efficient apartments for long-term rental income.',
      description: 'Marcus has completed 4 house renovations in Greater Manchester. This loan funds modern heating, brand new kitchens, and insulation for 8 units. 1,000 investors pool £1,000 each (or start from £10). Monthly rental yields from vetted tenants repay investors their capital plus interest.',
      risk_tier: 'low',
      sector: 'Property & Real Estate',
      target_pence: 100000000,
      raised_pence: 67500000,
      expected_return_min_bps: 350,
      expected_return_max_bps: 500,
      term_months: 12,
      status: 'open',
      key_risks: [
        'Property renovation work could uncover unforeseen plumbing or wiring repairs.',
        'Material price fluctuations could increase building supply costs.',
        'Rental vacancy periods between tenancies could temporarily delay cash flow.',
      ],
    },
    {
      partnerName: 'Elena Rostova (Clean Infrastructure)',
      title: 'Somerset Logistics Park — Commercial Solar Array & Battery Farm',
      summary: 'Commercial solar panels and industrial lithium battery storage deployed on a major logistics hub.',
      description: 'Elena is an infrastructure engineer deploying rooftop clean energy. Fixed 15-year power purchase agreements with warehouse tenants repay 1,000 co-investors their capital plus interest.',
      risk_tier: 'low',
      sector: 'Clean Energy & Storage',
      target_pence: 100000000,
      raised_pence: 100000000,
      expected_return_min_bps: 400,
      expected_return_max_bps: 500,
      term_months: 18,
      status: 'funded',
      key_risks: [
        'Prolonged periods of overcast weather could temporarily reduce peak solar generation.',
        'Component shipping delays for specialized high-capacity battery inverters.',
        'Warehouse tenant business relocation could require renegotiating power contracts.',
      ],
    },
    {
      partnerName: 'Dr. Richard Thorne (Clinical Director)',
      title: 'Regional Diagnostic Clinic — Imaging Scanner Equipment Lease',
      summary: 'State-of-the-art ultrasound imaging equipment leased to an NHS partner diagnostic clinic.',
      description: 'Established healthcare clinic co-funding medical diagnostic machinery. 500 co-investors pooled to fund £500,000. Full loan repayments completed on time and in full over 24 months.',
      risk_tier: 'low',
      sector: 'Healthcare & MedTech',
      target_pence: 50000000,
      raised_pence: 50000000,
      expected_return_min_bps: 300,
      expected_return_max_bps: 400,
      term_months: 24,
      status: 'completed',
      key_risks: [
        'Healthcare equipment maintenance downtime could temporarily slow patient scans.',
        'Regulatory medical device compliance changes requiring software upgrades.',
        'Manufacturer part delivery delays for specialized calibration tools.',
      ],
    },

    // Medium Tier (3 items)
    {
      partnerName: 'Liam Gallagher (Logistics Operator)',
      title: 'National Commercial EV Fast-Charging Highway Hub Network (6 Sites)',
      summary: 'Deploying 12 rapid commercial EV charging bays across 6 high-demand motorway freight corridors.',
      description: 'Liam operates commercial transport hubs. 750 co-investors pooling to raise £750,000. Contracted fleet haulage charging fees repay investors every month.',
      risk_tier: 'medium',
      sector: 'Transport & Fleet',
      target_pence: 75000000,
      raised_pence: 49500000,
      expected_return_min_bps: 600,
      expected_return_max_bps: 800,
      term_months: 18,
      status: 'open',
      key_risks: [
        'Electric vehicle charging infrastructure outages could delay delivery runs.',
        'Commercial fleet insurance premiums could rise across urban operating zones.',
        'Client contract renegotiations after initial 12-month period.',
      ],
    },
    {
      partnerName: 'Dr. Maya Patel (AgriTech Specialist)',
      title: 'Vertical Hydroponic Supermarket Farm Automation',
      summary: 'Automated LED lighting and nutrient sensors for an indoor farm supplying supermarket herbs.',
      description: 'Smart agriculture venture scaling fresh basil and mint output in Leeds. Supermarket pre-orders fund the loan repayments over 24 months.',
      risk_tier: 'medium',
      sector: 'Smart Agriculture',
      target_pence: 35000000,
      raised_pence: 18000000,
      expected_return_min_bps: 550,
      expected_return_max_bps: 750,
      term_months: 24,
      status: 'open',
      key_risks: [
        'Sensor hardware replacements may take several weeks to import.',
        'Electricity rate changes could affect indoor climate control operating costs.',
        'Competition from traditional outdoor summer herb farms during harvest peaks.',
      ],
    },
    {
      partnerName: 'Chloe & Sam Davis (Brand Founders)',
      title: 'Eco-Apparel Q4 Bulk Seasonal Inventory Financing',
      summary: 'Financing bulk raw bamboo yarn purchase to manufacture autumn/winter collection.',
      description: 'Established sustainable clothing brand with 12,000 customers. Loan is actively repaying month-by-month on schedule from seasonal retail sales.',
      risk_tier: 'medium',
      sector: 'Consumer Goods & Trade',
      target_pence: 25000000,
      raised_pence: 25000000,
      expected_return_min_bps: 650,
      expected_return_max_bps: 800,
      term_months: 36,
      status: 'repaying',
      key_risks: [
        'Textile mill shipping delays could compress holiday retail selling window.',
        'Consumer fashion spending shifts during general economic downturns.',
        'Raw material import tariffs could affect final wholesale margins.',
      ],
    },

    // High Tier (3 items)
    {
      partnerName: 'Sophie Bennett (Game Director)',
      title: 'Indie Studio Game Console Port & Physical Editions',
      summary: 'Porting a viral PC indie game to Nintendo Switch and manufacturing physical collector cartridges.',
      description: 'Award-winning game studio expanding to consoles. Pre-order game sales directly repay investors over 24 months.',
      risk_tier: 'high',
      sector: 'Gaming & Digital Media',
      target_pence: 50000000,
      raised_pence: 32000000,
      expected_return_min_bps: 900,
      expected_return_max_bps: 1200,
      term_months: 24,
      status: 'open',
      key_risks: [
        'Console platform certification reviews could delay target launch window.',
        'Physical cartridge manufacturing minimum runs require substantial upfront cash.',
        'Higher loss risk: creative media sales can be hit-driven and unpredictable.',
      ],
    },
    {
      partnerName: 'Highland Wool Millers',
      title: 'Highland Clean Tech Dye Production Facility',
      summary: 'Stainless steel temperature-controlled dye vats to scale naturally dyed wool production.',
      description: 'Artisan cooperative processing wool from local crofts. Seeking funds to fulfill wholesale orders from European knitwear designers.',
      risk_tier: 'high',
      sector: 'Community Crafts',
      target_pence: 30000000,
      raised_pence: 14000000,
      expected_return_min_bps: 850,
      expected_return_max_bps: 1150,
      term_months: 18,
      status: 'open',
      key_risks: [
        'Wholesale clothing design orders can be volatile and seasonal.',
        'Transport costs from remote Highlands to mainland hubs are significant.',
        'Artisan dye recipe consistency requires strict quality controls.',
      ],
    },
    {
      partnerName: 'Nathan Ross (Commercial Drone Pilot)',
      title: 'Commercial Drone Offshore Turbine Inspection Fleet',
      summary: 'Thermal-imaging inspection drones for industrial wind turbine and bridge surveys.',
      description: 'Early stage drone inspection startup. Borrower faced offshore client contract cancellations and defaulted; currently in recovery.',
      risk_tier: 'high',
      sector: 'Tech & Field Services',
      target_pence: 40000000,
      raised_pence: 40000000,
      expected_return_min_bps: 1000,
      expected_return_max_bps: 1300,
      term_months: 30,
      status: 'defaulted',
      key_risks: [
        'High chance of borrower default if industrial inspection contracts pause.',
        'Loss or damage of specialized drone equipment in extreme maritime weather.',
        'Unsecured loan without property asset guarantees.',
      ],
    },

    // Uncharted Tier (3 items - Capped at £100 per user)
    {
      partnerName: 'Tariq Al-Mansoor (Aerospace Engineer)',
      title: 'Low-Orbit Satellite Earth Observation Receiving Station',
      summary: 'Automated satellite tracking dish in Yorkshire receiving weather and Earth-observation data.',
      description: 'Ground station capturing data sold to universities and climate researchers. Early stage with innovative data sales model. Strictly capped at £100 per investor.',
      risk_tier: 'uncharted',
      sector: 'Aerospace & Telecom',
      target_pence: 25000000,
      raised_pence: 11000000,
      expected_return_min_bps: 0,
      expected_return_max_bps: 2000,
      term_months: 36,
      status: 'open',
      key_risks: [
        'Novel pilot ground station with no past commercial operating history.',
        'Satellite downlink spectrum licensing subject to regulatory approval.',
        'Total capital loss possible; Provision Fund does not cover Uncharted tier.',
      ],
    },
    {
      partnerName: 'Dr. Aris Vance (Bio-Energy Researcher)',
      title: 'Next-Gen Micro-Algae Biofuel Experimental Production Facility',
      summary: 'Experimental tubular bioreactor extracting green lipids from micro-algae for aviation fuel.',
      description: 'Breakthrough university spinout testing algae lipid yields. High risk scientific venture. Strictly capped at £100 per user.',
      risk_tier: 'uncharted',
      sector: 'Frontier CleanTech',
      target_pence: 35000000,
      raised_pence: 16000000,
      expected_return_min_bps: 0,
      expected_return_max_bps: 2200,
      term_months: 24,
      status: 'open',
      key_risks: [
        'Biological culture contamination can wipe out experimental batch cycles.',
        'Aviation fuel certification timeline remains long and uncertain.',
        'Treat as money you can afford to lose completely; no Provision Fund cover.',
      ],
    },
    {
      partnerName: 'Calum MacLeod (Hydro Specialist)',
      title: 'River Kinetic Micro-Hydro Turbine Generation Station',
      summary: 'Submerged non-dam river turbine generating 24/7 continuous electrical power from river flow.',
      description: 'Highland renewable power pilot rig. Fully funded by early community testers. Strictly capped at £100 per user.',
      risk_tier: 'uncharted',
      sector: 'Experimental Energy',
      target_pence: 50000000,
      raised_pence: 50000000,
      expected_return_min_bps: 0,
      expected_return_max_bps: 2500,
      term_months: 48,
      status: 'funded',
      key_risks: [
        'Experimental mechanical prototype with unknown underwater debris wear.',
        'River environmental agency testing permits subject to annual review.',
        'Highest risk tier: treat as speculative; no Provision Fund protection.',
      ],
    },
  ];

  for (const opp of seedOpportunities) {
    const partnerId = partnerIdMap.get(opp.partnerName);
    if (!partnerId) continue;

    const perUserCap = opp.risk_tier === 'uncharted' ? 10000 : 100000;
    const closesAt = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

    const vettingChecklist = [
      { item: 'Companies House identity & director check', verified_date: '2026-09-15', status: 'verified' },
      { item: 'Bank account and financial statement review', verified_date: '2026-09-18', status: 'verified' },
      { item: 'Physical site visit and equipment inspection', verified_date: '2026-09-22', status: 'verified' },
      { item: 'Credit check and past borrowing history review', verified_date: '2026-09-25', status: 'verified' },
    ];

    const updates = [
      { date: '2026-10-01', title: 'Opportunity published on Atlas', content: 'Vetting checklist completed and opportunity opened for funding.' },
    ];

    const oppRes = await query<{ id: string }>(
      `INSERT INTO opportunities (
         partner_id, title, summary, description, risk_tier, sector,
         target_pence, raised_pence, expected_return_min_bps, expected_return_max_bps,
         term_months, status, per_user_cap_pence, key_risks, vetting_checklist,
         updates, opens_at, closes_at, created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING id`,
      [
        partnerId,
        opp.title,
        opp.summary,
        opp.description,
        opp.risk_tier,
        opp.sector,
        opp.target_pence,
        opp.raised_pence,
        opp.expected_return_min_bps,
        opp.expected_return_max_bps,
        opp.term_months,
        opp.status,
        perUserCap,
        JSON.stringify(opp.key_risks),
        JSON.stringify(vettingChecklist),
        JSON.stringify(updates),
        now.toISOString(),
        closesAt.toISOString(),
        now.toISOString(),
      ]
    );

    const opportunityId = oppRes.rows[0].id;

    // Seed simple monthly repayment schedule
    const monthlyPrincipal = Math.floor(opp.target_pence / opp.term_months);
    const monthlyInterest = Math.floor(
      (opp.target_pence * (opp.expected_return_min_bps / 10000)) / 12
    );

    for (let m = 1; m <= Math.min(opp.term_months, 6); m++) {
      const dueDate = new Date(now.getTime() + m * 30 * 24 * 60 * 60 * 1000);
      await query(
        `INSERT INTO repayment_schedules (opportunity_id, due_date, capital_pence, interest_pence, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          opportunityId,
          dueDate.toISOString().split('T')[0],
          monthlyPrincipal,
          monthlyInterest,
          opp.status === 'completed' ? 'paid' : opp.status === 'defaulted' && m > 2 ? 'defaulted' : 'pending',
        ]
      );
    }
  }
}

async function updateLegacyToInvestmentOpportunities(): Promise<void> {
  const opps = await query<{ id: string; title: string; risk_tier: string }>(
    'SELECT id, title, risk_tier FROM opportunities ORDER BY created_at ASC'
  );

  const updates = [
    {
      partnerName: 'Marcus Vance (Property Renovator)',
      partnerDesc: 'Experienced property renovator modernising residential Victorian houses for long-term rental income.',
      title: 'Manchester Victorian House — 2-Flat Refurbishment & Modernisation',
      summary: 'Refurbishing a Victorian property into two energy-efficient apartments for long-term rental income.',
      description: 'Marcus has completed 4 house renovations in Greater Manchester. This loan funds modern heating, brand new kitchens, and insulation. Monthly rental yields from vetted tenants repay investors their capital plus interest.',
      sector: 'Property & Real Estate',
      risks: [
        'Property renovation work could uncover unforeseen plumbing or wiring repairs.',
        'Material price fluctuations could increase building supply costs.',
        'Rental vacancy periods between tenancies could temporarily delay cash flow.',
      ],
    },
    {
      partnerName: 'Elena Rostova (Clean Infrastructure)',
      partnerDesc: 'Renewable engineering specialist deploying rooftop commercial solar arrays and storage batteries.',
      title: 'Somerset Logistics Park — Solar Roof Array & Battery Storage',
      summary: 'Commercial solar panels and industrial lithium battery storage deployed on a logistics hub.',
      description: 'Elena is an infrastructure engineer deploying rooftop clean energy. Fixed 15-year power purchase agreements with warehouse tenants repay investors their capital plus interest.',
      sector: 'Clean Energy & Storage',
      risks: [
        'Prolonged periods of overcast weather could temporarily reduce peak solar generation.',
        'Component shipping delays for specialized high-capacity battery inverters.',
        'Warehouse tenant business relocation could require renegotiating power contracts.',
      ],
    },
    {
      partnerName: 'Dr. Richard Thorne (Clinical Director)',
      partnerDesc: 'Medical clinic leader co-funding digital diagnostic scanners for regional diagnostic hubs.',
      title: 'Regional Diagnostic Clinic — Imaging Scanner Equipment Lease',
      summary: 'State-of-the-art ultrasound imaging equipment leased to an NHS partner diagnostic clinic.',
      description: 'Established healthcare clinic co-funding medical diagnostic machinery. Full loan repayments completed on time and in full over 24 months.',
      sector: 'Healthcare & MedTech',
      risks: [
        'Healthcare equipment maintenance downtime could temporarily slow patient scans.',
        'Regulatory medical device compliance changes requiring software upgrades.',
        'Manufacturer part delivery delays for specialized calibration tools.',
      ],
    },
    {
      partnerName: 'Liam Gallagher (Logistics Operator)',
      partnerDesc: 'Commercial fleet operator expanding electric refrigerated delivery vans for zero-emission logistics.',
      title: 'Urban Electric Delivery Van Fleet (3 Chilled Vans)',
      summary: 'Purchasing three zero-emission electric refrigerated vans to fulfill contracted food logistics routes.',
      description: 'Liam operates a fast-growing commercial courier fleet in Birmingham. Locked delivery contracts with regional supermarket suppliers generate the cash flow to repay investors over 18 months.',
      sector: 'Transport & Fleet',
      risks: [
        'Electric vehicle charging infrastructure outages could delay delivery runs.',
        'Commercial fleet insurance premiums could rise across urban operating zones.',
        'Client contract renegotiations after initial 12-month period.',
      ],
    },
    {
      partnerName: 'Dr. Maya Patel (AgriTech Specialist)',
      partnerDesc: 'Urban agricultural scientist building automated vertical hydroponic herb towers for supermarkets.',
      title: 'Vertical Hydroponic Herb Farm Automation',
      summary: 'Automated LED lighting and nutrient sensors for an indoor farm supplying supermarket herbs.',
      description: 'Smart agriculture venture scaling fresh basil and mint output in Leeds. Supermarket pre-orders fund the loan repayments over 24 months.',
      sector: 'Smart Agriculture',
      risks: [
        'Sensor hardware replacements may take several weeks to import.',
        'Electricity rate changes could affect indoor climate control operating costs.',
        'Competition from traditional outdoor summer herb farms during harvest peaks.',
      ],
    },
    {
      partnerName: 'Chloe & Sam Davis (Brand Founders)',
      partnerDesc: 'Eco-apparel brand founders funding bulk seasonal yarn inventory purchases to fulfill pre-orders.',
      title: 'Eco-Apparel Q4 Bulk Seasonal Inventory Financing',
      summary: 'Financing bulk raw bamboo yarn purchase to manufacture autumn/winter collection.',
      description: 'Established sustainable clothing brand with 12,000 customers. Loan is actively repaying month-by-month on schedule from seasonal retail sales.',
      sector: 'Consumer Goods & Trade',
      risks: [
        'Textile mill shipping delays could compress holiday retail selling window.',
        'Consumer fashion spending shifts during general economic downturns.',
        'Raw material import tariffs could affect final wholesale margins.',
      ],
    },
    {
      partnerName: 'Sophie Bennett (Game Director)',
      partnerDesc: 'Indie game studio lead porting a viral PC game to Nintendo Switch and manufacturing physical editions.',
      title: 'Indie Studio Game Console Port & Physical Editions',
      summary: 'Porting a viral PC indie game to Nintendo Switch and manufacturing physical collector cartridges.',
      description: 'Award-winning game studio expanding to consoles. Pre-order game sales directly repay investors over 24 months.',
      sector: 'Gaming & Digital Media',
      risks: [
        'Console platform certification reviews could delay target launch window.',
        'Physical cartridge manufacturing minimum runs require substantial upfront cash.',
        'Higher loss risk: creative media sales can be hit-driven and unpredictable.',
      ],
    },
    {
      partnerName: 'James & Hannah Kelly (Property Renovators)',
      partnerDesc: 'Architectural renovators converting a historic stone agricultural barn into eco-tourism holiday lets.',
      title: 'Derbyshire Stone Barn Eco-Tourism Conversion',
      summary: 'Converting a historic stone barn into two luxury eco-friendly holiday cottages.',
      description: 'Full architectural conversion with high rental potential in the Peak District. Repaid from summer guest bookings.',
      sector: 'Property & Tourism',
      risks: [
        'Structural repairs on historic stone masonry can take longer than budgeted.',
        'Tourism season booking fluctuations during cold and wet summers.',
        'Council planning condition sign-offs for heritage conservation.',
      ],
    },
    {
      partnerName: 'Nathan Ross (Commercial Drone Pilot)',
      partnerDesc: 'Specialist UAV survey team inspecting infrastructure, wind turbines, and industrial bridges.',
      title: 'Commercial Drone Offshore Turbine Inspection Fleet',
      summary: 'Thermal-imaging inspection drones for industrial wind turbine and bridge surveys.',
      description: 'Early stage drone inspection startup. Borrower faced offshore client contract cancellations and defaulted; currently in recovery.',
      sector: 'Tech & Field Services',
      risks: [
        'High chance of borrower default if industrial inspection contracts pause.',
        'Loss or damage of specialized drone equipment in extreme maritime weather.',
        'Unsecured loan without property asset guarantees.',
      ],
    },
    {
      partnerName: 'Tariq Al-Mansoor (Aerospace Engineer)',
      partnerDesc: 'Satellite ground station network receiving low-Earth orbit weather and Earth-observation data.',
      title: 'Low-Orbit Satellite Community Ground Station Dish',
      summary: 'Automated satellite tracking dish in Yorkshire receiving weather and Earth-observation data.',
      description: 'Ground station capturing data sold to universities and climate researchers. Early stage with innovative data sales model. Strictly capped at £100 per investor.',
      sector: 'Aerospace & Telecom',
      risks: [
        'Novel pilot ground station with no past commercial operating history.',
        'Satellite downlink spectrum licensing subject to regulatory approval.',
        'Total capital loss possible; Provision Fund does not cover Uncharted tier.',
      ],
    },
    {
      partnerName: 'Dr. Aris Vance (Bio-Energy Researcher)',
      partnerDesc: 'Experimental tubular photo-bioreactor testing algae oil yield for sustainable aviation fuel.',
      title: 'Next-Gen Micro-Algae Biofuel Experimental Rig',
      summary: 'Experimental tubular bioreactor extracting green lipids from micro-algae for aviation fuel.',
      description: 'Breakthrough university spinout testing algae lipid yields. High risk scientific venture. Strictly capped at £100 per user.',
      sector: 'Frontier CleanTech',
      risks: [
        'Biological culture contamination can wipe out experimental batch cycles.',
        'Aviation fuel certification timeline remains long and uncertain.',
        'Treat as money you can afford to lose completely; no Provision Fund cover.',
      ],
    },
    {
      partnerName: 'Calum MacLeod (Hydro Specialist)',
      partnerDesc: 'Experimental submerged river turbine prototype generating 24/7 continuous baseload electricity.',
      title: 'River Kinetic Micro-Hydro Turbine Prototype',
      summary: 'Submerged non-dam river turbine generating 24/7 continuous electrical power from river flow.',
      description: 'Highland renewable power pilot rig. Fully funded by early community testers. Strictly capped at £100 per user.',
      sector: 'Experimental Energy',
      risks: [
        'Experimental mechanical prototype with unknown underwater debris wear.',
        'River environmental agency testing permits subject to annual review.',
        'Highest risk tier: treat as speculative; no Provision Fund protection.',
      ],
    },
  ];

  for (let i = 0; i < Math.min(opps.rows.length, updates.length); i++) {
    const opp = opps.rows[i];
    const u = updates[i];

    const oppRow = await query<{ partner_id: string }>('SELECT partner_id FROM opportunities WHERE id = $1', [opp.id]);
    const partnerId = oppRow.rows[0]?.partner_id;

    if (partnerId) {
      await query(
        'UPDATE partners SET name = $1, description = $2, sector = $3 WHERE id = $4',
        [u.partnerName, u.partnerDesc, u.sector, partnerId]
      );
    }

    await query(
      `UPDATE opportunities
       SET title = $1, summary = $2, description = $3, sector = $4, key_risks = $5
       WHERE id = $6`,
      [u.title, u.summary, u.description, u.sector, JSON.stringify(u.risks), opp.id]
    );
  }
}

export async function ensureHighTicketSyndicates(): Promise<void> {
  const check = await query<{ count: string }>(
    'SELECT COUNT(*) FROM opportunities WHERE target_pence < 10000000'
  );
  if (Number(check.rows[0].count) === 0) {
    return;
  }

  const updates = [
    {
      matchTitle: '%Victorian House%',
      title: 'Manchester Canal-Side Victorian Residential Modernisation (8 Apartments)',
      summary: 'Refurbishing a Victorian property into 8 energy-efficient apartments for long-term rental income.',
      description: 'Marcus has completed 4 house renovations in Greater Manchester. This loan funds modern heating, brand new kitchens, and insulation for 8 units. 1,000 investors pool £1,000 each (or start from £10). Monthly rental yields from vetted tenants repay investors their capital plus interest.',
      target_pence: 100000000, // £1,000,000
      raised_pence: 67500000,  // £675,000 (67.5% funded)
    },
    {
      matchTitle: '%Logistics Park%',
      title: 'Somerset Logistics Park — Commercial Solar Array & Battery Farm',
      summary: 'Commercial solar panels and industrial lithium battery storage deployed on a major logistics hub.',
      description: 'Elena is an infrastructure engineer deploying rooftop clean energy. Fixed 15-year power purchase agreements with warehouse tenants repay 1,000 co-investors their capital plus interest.',
      target_pence: 100000000, // £1,000,000
      raised_pence: 100000000, // £1,000,000 (100% funded)
    },
    {
      matchTitle: '%Diagnostic Clinic%',
      title: 'Regional Diagnostic Clinic — Imaging Scanner Equipment Lease',
      summary: 'State-of-the-art ultrasound imaging equipment leased to an NHS partner diagnostic clinic.',
      description: 'Established healthcare clinic co-funding medical diagnostic machinery. 500 co-investors pooled to fund £500,000. Full loan repayments completed on time and in full over 24 months.',
      target_pence: 50000000, // £500,000
      raised_pence: 50000000, // £500,000 (100% completed)
    },
    {
      matchTitle: '%Delivery Van%',
      title: 'National Commercial EV Fast-Charging Highway Hub Network (6 Sites)',
      summary: 'Deploying 12 rapid commercial EV charging bays across 6 high-demand motorway freight corridors.',
      description: 'Liam operates commercial transport hubs. 750 co-investors pooling to raise £750,000. Contracted fleet haulage charging fees repay investors every month.',
      target_pence: 75000000, // £750,000
      raised_pence: 49500000, // £495,000 (66% funded)
    },
    {
      matchTitle: '%Hydroponic%',
      title: 'Vertical Hydroponic Supermarket Farm Automation',
      summary: 'Automated LED lighting and nutrient sensors for an indoor farm supplying supermarket herbs.',
      description: 'Smart agriculture venture scaling fresh basil and mint output in Leeds. Supermarket pre-orders fund the loan repayments over 24 months.',
      target_pence: 35000000, // £350,000
      raised_pence: 18000000, // £180,000 (51.4% funded)
    },
    {
      matchTitle: '%Eco-Apparel%',
      title: 'Eco-Apparel Q4 Bulk Seasonal Inventory Financing',
      summary: 'Financing bulk raw bamboo yarn purchase to manufacture autumn/winter collection.',
      description: 'Established sustainable clothing brand with 12,000 customers. Loan is actively repaying month-by-month on schedule from seasonal retail sales.',
      target_pence: 25000000, // £250,000
      raised_pence: 25000000, // £250,000 (repaying)
    },
    {
      matchTitle: '%Indie Studio%',
      title: 'Indie Studio Game Console Port & Physical Editions',
      summary: 'Porting a viral PC indie game to Nintendo Switch and manufacturing physical collector cartridges.',
      description: 'Award-winning game studio expanding to consoles. Pre-order game sales directly repay investors over 24 months.',
      target_pence: 50000000, // £500,000
      raised_pence: 32000000, // £320,000 (64% funded)
    },
    {
      matchTitle: '%Highland Wool%',
      title: 'Highland Clean Tech Dye Production Facility',
      summary: 'Stainless steel temperature-controlled dye vats to scale naturally dyed wool production.',
      description: 'Artisan cooperative processing wool from local crofts. Seeking funds to fulfill wholesale orders from European knitwear designers.',
      target_pence: 30000000, // £300,000
      raised_pence: 14000000, // £140,000
    },
    {
      matchTitle: '%Commercial Drone%',
      title: 'Commercial Drone Offshore Turbine Inspection Fleet',
      summary: 'Thermal-imaging inspection drones for industrial wind turbine and bridge surveys.',
      description: 'Early stage drone inspection startup. Borrower faced offshore client contract cancellations and defaulted; currently in recovery.',
      target_pence: 40000000, // £400,000
      raised_pence: 40000000, // £400,000 (defaulted)
    },
    {
      matchTitle: '%Satellite%',
      title: 'Low-Orbit Satellite Earth Observation Receiving Station',
      summary: 'Automated satellite tracking dish in Yorkshire receiving weather and Earth-observation data.',
      description: 'Ground station capturing data sold to universities and climate researchers. Early stage with innovative data sales model. Strictly capped at £100 per investor.',
      target_pence: 25000000, // £250,000
      raised_pence: 11000000, // £110,000
    },
    {
      matchTitle: '%Biofuel%',
      title: 'Next-Gen Micro-Algae Biofuel Experimental Production Facility',
      summary: 'Experimental tubular bioreactor extracting green lipids from micro-algae for aviation fuel.',
      description: 'Breakthrough university spinout testing algae lipid yields. High risk scientific venture. Strictly capped at £100 per user.',
      target_pence: 35000000, // £350,000
      raised_pence: 16000000, // £160,000
    },
    {
      matchTitle: '%Hydro Turbine%',
      title: 'River Kinetic Micro-Hydro Turbine Generation Station',
      summary: 'Submerged non-dam river turbine generating 24/7 continuous electrical power from river flow.',
      description: 'Highland renewable power pilot rig. Fully funded by early community testers. Strictly capped at £100 per user.',
      target_pence: 50000000, // £500,000
      raised_pence: 50000000, // £500,000 (funded)
    },
  ];

  for (const u of updates) {
    await query(
      `UPDATE opportunities
       SET title = $1, summary = $2, description = $3, target_pence = $4, raised_pence = $5
       WHERE title ILIKE $6`,
      [u.title, u.summary, u.description, u.target_pence, u.raised_pence, u.matchTitle]
    );
  }
}
