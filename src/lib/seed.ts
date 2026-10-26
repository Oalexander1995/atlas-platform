import { query } from './db';
import { hashPassword, UserRole, AccountState } from './auth';
import { depositDemoMoney, getOrCreateUserWallet, getWalletBalancePence } from './ledger';
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
      initialBalancePence: 12500, // £125.00
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
  }
}

/**
 * Seeds 12 vetted UK small businesses across 4 risk tiers (Section 6 & Section 11)
 */
export async function ensureOpportunitiesSeeded(): Promise<void> {
  const existingCount = await query<{ count: string }>('SELECT COUNT(*) FROM opportunities');
  if (Number(existingCount.rows[0].count) >= 12) {
    return;
  }

  const now = await ClockService.now();

  const seedPartners = [
    {
      name: 'The Daily Loaf Bakery Ltd',
      description: 'Family-run organic sourdough bakery supplying local shops and farmers markets.',
      founded_year: 2018,
      sector: 'Food & Drink',
      location: 'Bath, Somerset',
      track_record: { repaid_on_time: 2, previous_loans: 2 },
    },
    {
      name: 'Meadowbrook Community Healthcare',
      description: 'Independent family dental practice established over two decades.',
      founded_year: 2004,
      sector: 'Healthcare',
      location: 'Harrogate, North Yorkshire',
      track_record: { repaid_on_time: 3, previous_loans: 3 },
    },
    {
      name: 'Cumbria Timber Crafts',
      description: 'Locally sourced sustainable timber workshop crafting handmade furniture.',
      founded_year: 2015,
      sector: 'Trades',
      location: 'Kendal, Cumbria',
      track_record: { repaid_on_time: 1, previous_loans: 1 },
    },
    {
      name: 'Bramble & Bean Coffee Co',
      description: 'Independent specialty coffee shop opening a second neighbourhood cafe.',
      founded_year: 2021,
      sector: 'Food & Drink',
      location: 'Bristol',
      track_record: { repaid_on_time: 1, previous_loans: 1 },
    },
    {
      name: 'Pennine Eco Cleaners',
      description: 'Eco-friendly community laundrette powered by ground-source heat pumps.',
      founded_year: 2022,
      sector: 'Clean Services',
      location: 'Hebden Bridge, West Yorkshire',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Coastline Organic Grocers',
      description: 'Zero-waste local food co-op expanding home delivery routes.',
      founded_year: 2020,
      sector: 'Local Retail',
      location: 'Exeter, Devon',
      track_record: { repaid_on_time: 1, previous_loans: 1 },
    },
    {
      name: 'Spoke & Sprocket E-Bikes',
      description: 'Fast-growing urban cargo bike and e-bike sales and servicing centre.',
      founded_year: 2024,
      sector: 'Transport',
      location: 'Sheffield, South Yorkshire',
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
      name: 'Apex Aerial Inspections',
      description: 'Drone surveying team inspecting roofs, solar panels, and wind turbines.',
      founded_year: 2023,
      sector: 'Tech & Trades',
      location: 'Newcastle upon Tyne',
      track_record: { repaid_on_time: 0, previous_loans: 1 },
    },
    {
      name: 'Wharfedale Community Energy Co-op',
      description: 'Locally owned clean energy cooperative installing community solar arrays.',
      founded_year: 2025,
      sector: 'Community Energy',
      location: 'Ilkley, West Yorkshire',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Urban Mycology Farm Project',
      description: 'Circular agriculture initiative growing gourmet mushrooms on spent coffee grounds.',
      founded_year: 2025,
      sector: 'Urban Agriculture',
      location: 'Leeds, West Yorkshire',
      track_record: { repaid_on_time: 0, previous_loans: 0 },
    },
    {
      name: 'Dartmouth Micro-Hydro Pilot',
      description: 'Experimental river water turbine generating power for rural workshops.',
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
      partnerName: 'The Daily Loaf Bakery Ltd',
      title: 'The Daily Loaf — Stone Hearth Oven Upgrade',
      summary: 'Energy-saving electric stone oven to increase bread production for morning delivery routes.',
      description: 'The Daily Loaf has supplied fresh sourdough in Bath for over 8 years. This loan helps buy a modern deck oven that cuts energy bills and allows baking 150 more loaves every morning. Secured against commercial bakery equipment.',
      risk_tier: 'low',
      sector: 'Food & Drink',
      target_pence: 1500000, // £15,000
      raised_pence: 950000,  // £9,500
      expected_return_min_bps: 350, // 3.5%
      expected_return_max_bps: 500, // 5.0%
      term_months: 12,
      status: 'open',
      key_risks: [
        'Bakery equipment breakdown could briefly delay baking output.',
        'Electricity price spikes could increase operating expenses.',
        'Local competition could reduce wholesale shop orders.',
      ],
    },
    {
      partnerName: 'Meadowbrook Community Healthcare',
      title: 'Meadowbrook Clinic — Digital Imaging Suite',
      summary: 'Low-radiation digital 3D dental scanner to modernise patient treatment rooms.',
      description: 'Established healthcare clinic upgrading practice equipment to replace older machinery. Steady patient list and consistent local NHS and private service history.',
      risk_tier: 'low',
      sector: 'Healthcare',
      target_pence: 2500000, // £25,000
      raised_pence: 2500000, // £25,000 (Funded)
      expected_return_min_bps: 400, // 4.0%
      expected_return_max_bps: 500, // 5.0%
      term_months: 18,
      status: 'funded',
      key_risks: [
        'Healthcare regulatory changes could require extra software updates.',
        'Staff shortage could slow patient appointment throughput.',
        'Supplier shipping delays for specialized dental equipment.',
      ],
    },
    {
      partnerName: 'Cumbria Timber Crafts',
      title: 'Cumbria Timber — Joinery Workshop Tooling',
      summary: 'Precision timber cutting machinery and dust extraction for local apprenticeship training.',
      description: 'Local woodcraft business expanding furniture orders. Full loan repayments completed on time and in full over 24 months.',
      risk_tier: 'low',
      sector: 'Trades',
      target_pence: 2000000, // £20,000
      raised_pence: 2000000, // £20,000 (Completed)
      expected_return_min_bps: 300, // 3.0%
      expected_return_max_bps: 400, // 4.0%
      term_months: 24,
      status: 'completed',
      key_risks: [
        'Raw hardwood timber prices fluctuate with seasonal weather.',
        'Delivery transport delays across mountain passes during winter.',
        'Slow commercial client payment terms on large custom furniture.',
      ],
    },

    // Medium Tier (3 items)
    {
      partnerName: 'Bramble & Bean Coffee Co',
      title: 'Bramble & Bean — Second Cafe Site Fit-Out',
      summary: 'Fitting out an empty corner shop with espresso machines, tables, and counter seating.',
      description: 'Popular neighbourhood cafe opening a second location in central Bristol. Borrowing funds for plumbing, kitchen fit-out, and initial ingredients inventory.',
      risk_tier: 'medium',
      sector: 'Food & Drink',
      target_pence: 3500000, // £35,000
      raised_pence: 2100000, // £21,000
      expected_return_min_bps: 600, // 6.0%
      expected_return_max_bps: 800, // 8.0%
      term_months: 18,
      status: 'open',
      key_risks: [
        'New location may take longer to attract regular daily coffee drinkers.',
        'High street footfall changes or local streetworks could slow customer visits.',
        'Delays in shop refit could postpone the planned opening date.',
      ],
    },
    {
      partnerName: 'Pennine Eco Cleaners',
      title: 'Pennine Eco — Water Recirculation Laundrette',
      summary: 'Water-saving commercial washing machines and smart coinless payment readers.',
      description: 'Eco-conscious laundrette in Hebden Bridge. Installing recycled heat exchangers to reduce gas usage and cut laundry bills for local residents.',
      risk_tier: 'medium',
      sector: 'Clean Services',
      target_pence: 1800000, // £18,000
      raised_pence: 800000,  // £8,000
      expected_return_min_bps: 550, // 5.5%
      expected_return_max_bps: 750, // 7.5%
      term_months: 24,
      status: 'open',
      key_risks: [
        'Machine maintenance parts may take several weeks to import.',
        'Flooding risks in Calder Valley during extreme rainfall.',
        'Competition from domestic washer-dryer sales in the area.',
      ],
    },
    {
      partnerName: 'Coastline Organic Grocers',
      title: 'Coastline Grocers — Electric Delivery Van Fleet',
      summary: 'Two chilled electric cargo vans for weekly veggie box deliveries across Devon.',
      description: 'Expanding doorstep organic grocery box deliveries. Loan is actively repaying month-by-month on schedule.',
      risk_tier: 'medium',
      sector: 'Local Retail',
      target_pence: 3000000, // £30,000
      raised_pence: 3000000, // £30,000 (Repaying)
      expected_return_min_bps: 650, // 6.5%
      expected_return_max_bps: 800, // 8.0%
      term_months: 36,
      status: 'repaying',
      key_risks: [
        'Farm harvest shortages due to unseasonal rain or drought.',
        'Electric vehicle battery wear requiring unexpected repair.',
        'Customer subscription cancellations during cost-of-living pinches.',
      ],
    },

    // High Tier (3 items)
    {
      partnerName: 'Spoke & Sprocket E-Bikes',
      title: 'Spoke & Sprocket — Rapid Cargo Bike Workshop',
      summary: 'Expansion of commercial bike repair bays for local postal and parcel delivery couriers.',
      description: 'Rapidly growing two-year-old electric bike shop. Borrowing for hydraulic workstands, diagnostics computers, and spare motor parts inventory.',
      risk_tier: 'high',
      sector: 'Transport',
      target_pence: 2200000, // £22,000
      raised_pence: 1400000, // £14,000
      expected_return_min_bps: 900,  // 9.0%
      expected_return_max_bps: 1200, // 12.0%
      term_months: 24,
      status: 'open',
      key_risks: [
        'Business is young with less than 2 years of financial accounts.',
        'Courier firms might switch delivery contracts to competitor garages.',
        'Higher loss risk: unsecured business loan without fixed property collateral.',
      ],
    },
    {
      partnerName: 'Highland Wool Millers',
      title: 'Highland Wool — Plant Dye Steam Vats',
      summary: 'Stainless steel temperature-controlled dye vats to scale naturally dyed wool production.',
      description: 'Artisan cooperative processing wool from local crofts. Seeking funds to fulfill wholesale orders from European knitwear designers.',
      risk_tier: 'high',
      sector: 'Community Crafts',
      target_pence: 1600000, // £16,000
      raised_pence: 700000,  // £7,000
      expected_return_min_bps: 850,  // 8.5%
      expected_return_max_bps: 1150, // 11.5%
      term_months: 18,
      status: 'open',
      key_risks: [
        'Wholesale clothing design orders can be volatile and seasonal.',
        'Transport costs from remote Highlands to mainland hubs are significant.',
        'Artisan dye recipe consistency requires strict quality controls.',
      ],
    },
    {
      partnerName: 'Apex Aerial Inspections',
      title: 'Apex Surveys — Thermal Inspection Drones',
      summary: 'Night-vision thermal cameras to inspect insulation loss on public housing roofs.',
      description: 'Early drone inspection startup. Borrower faced client cancellations and defaulted; currently in recovery.',
      risk_tier: 'high',
      sector: 'Tech & Trades',
      target_pence: 2800000, // £28,000
      raised_pence: 2800000, // £28,000 (Defaulted)
      expected_return_min_bps: 1000, // 10.0%
      expected_return_max_bps: 1300, // 13.0%
      term_months: 30,
      status: 'defaulted',
      key_risks: [
        'High chance of borrower default if council grant budgets freeze.',
        'Damage or loss of drone airframes in windy coastal weather.',
        'Unsecured loan without property asset guarantees.',
      ],
    },

    // Uncharted Tier (3 items - Capped at £100 per user)
    {
      partnerName: 'Wharfedale Community Energy Co-op',
      title: 'Wharfedale Solar — Community Rooftop Array',
      summary: 'First community-owned solar panel installation across 4 public school roofs.',
      description: 'Uncharted community energy project. Generates power sold back to the local grid. Early stage with novel cooperative governance model. Max £100 per user.',
      risk_tier: 'uncharted',
      sector: 'Community Energy',
      target_pence: 5000000, // £50,000
      raised_pence: 1800000, // £18,000
      expected_return_min_bps: 0,    // 0%
      expected_return_max_bps: 2000, // 20.0%+ (Highly uncertain)
      term_months: 36,
      status: 'open',
      key_risks: [
        'Novel pilot structure with no past commercial operating history.',
        'Weather dependence: electricity generation drops during cloudy seasons.',
        'Total capital loss possible; Provision Fund does not cover Uncharted tier.',
      ],
    },
    {
      partnerName: 'Urban Mycology Farm Project',
      title: 'Urban Mycology — Coffee Grounds Mushroom Farm',
      summary: 'Converting basement vaults into zero-waste oyster mushroom growing chambers.',
      description: 'Experimental urban farming project collecting waste coffee from 40 city cafes. Novel substrate recipe with high biological uncertainty. Max £100 per user.',
      risk_tier: 'uncharted',
      sector: 'Urban Agriculture',
      target_pence: 2500000, // £25,000
      raised_pence: 1100000, // £11,000
      expected_return_min_bps: 0,    // 0%
      expected_return_max_bps: 2200, // 22.0%+ (Highly uncertain)
      term_months: 24,
      status: 'open',
      key_risks: [
        'Biological contamination can wipe out entire crop cycles.',
        'Brand new market with unproven restaurant subscription demand.',
        'Treat as money you can afford to lose completely; no Provision Fund cover.',
      ],
    },
    {
      partnerName: 'Dartmouth Micro-Hydro Pilot',
      title: 'Dartmouth Hydro — River Turbine Pilot',
      summary: 'Pioneering submerged water wheel turbine generating clean power from river flow.',
      description: 'First-of-its-kind micro hydro prototype. Fully funded for experimental testing. Max £100 per user.',
      risk_tier: 'uncharted',
      sector: 'Experimental Energy',
      target_pence: 6000000, // £60,000
      raised_pence: 6000000, // £60,000 (Funded)
      expected_return_min_bps: 0,    // 0%
      expected_return_max_bps: 2500, // 25.0%+ (Highly uncertain)
      term_months: 48,
      status: 'funded',
      key_risks: [
        'Experimental mechanical prototype with unknown long-term durability.',
        'Environmental agency river permit reviews could halt operations.',
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
