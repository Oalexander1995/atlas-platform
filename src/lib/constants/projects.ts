export interface CanonicalProject {
  id: string;
  partnerName: string;
  partnerDesc: string;
  partnerLocation: string;
  partnerFoundedYear: number;
  title: string;
  summary: string;
  description: string;
  sector: string;
  riskTier: 'low' | 'medium' | 'high'; // Rendered as Lower, Medium, Higher
  targetPence: number;
  raisedPence: number;
  coInvestorsCount: number;
  expectedReturnMinBps: number;
  expectedReturnMaxBps: number;
  termMonths: number;
  status: 'open' | 'funded' | 'repaying' | 'completed' | 'defaulted';
  keyRisks: string[];
  vettingChecklist: Array<{ item: string; verified_date: string; status: string }>;
  updates: Array<{ date: string; title: string; content: string }>;
}

export const CANONICAL_PROJECTS: CanonicalProject[] = [
  // 1. Manchester Canal-Side Residential Modernisation (Flagship Open)
  {
    id: '11111111-1111-4111-8111-111111111111',
    partnerName: 'Marcus Vance (Property Renovator)',
    partnerDesc: 'Experienced property renovator modernising residential Victorian properties for long-term rental income.',
    partnerLocation: 'Manchester, UK',
    partnerFoundedYear: 2018,
    title: 'Manchester Canal-Side Victorian Residential Modernisation (8 Apartments)',
    summary: 'Refurbishing a Victorian property into 8 energy-efficient apartments for long-term rental income.',
    description: 'Marcus has completed 4 residential renovations in Greater Manchester. This loan funds modern heating, brand new kitchens, insulation and interior fit-out for 8 residential apartments. Rental yields from vetted tenants repay investors their capital plus interest monthly.',
    sector: 'Property & Real Estate',
    riskTier: 'low', // Displayed as "Lower Risk"
    targetPence: 100000000, // £1,000,000
    raisedPence: 68500000,  // £685,000 (68.5% funded)
    coInvestorsCount: 214,
    expectedReturnMinBps: 550, // 5.5%
    expectedReturnMaxBps: 650, // 6.5%
    termMonths: 18,
    status: 'open',
    keyRisks: [
      'Property renovation work could uncover unforeseen plumbing or wiring repairs.',
      'Material price fluctuations could increase building supply costs.',
      'Rental vacancy periods between tenancies could temporarily delay cash flow.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & director check', verified_date: '2026-09-15', status: 'verified' },
      { item: 'Bank account and chartered accountant cash-flow stress test', verified_date: '2026-09-18', status: 'verified' },
      { item: 'RICS chartered physical site survey and building valuation', verified_date: '2026-09-22', status: 'verified' },
      { item: 'First legal charge & debenture registered at Companies House', verified_date: '2026-09-25', status: 'verified' },
    ],
    updates: [
      { date: '2026-10-01', title: 'Opportunity published on Atlas', content: 'Vetting checklist completed and opportunity opened for co-investors.' },
      { date: '2026-10-15', title: '60% funding milestone reached', content: 'Over 200 everyday investors have backed this residential modernisation project.' },
    ],
  },

  // 2. Somerset Logistics Park Solar Array (Funded)
  {
    id: '22222222-2222-4222-8222-222222222222',
    partnerName: 'Elena Rostova (Clean Infrastructure)',
    partnerDesc: 'Renewable engineering specialist deploying rooftop commercial solar arrays and storage batteries.',
    partnerLocation: 'Bristol, UK',
    partnerFoundedYear: 2016,
    title: 'Somerset Logistics Park — Commercial Solar Array & Battery Farm',
    summary: 'Commercial solar panels and industrial lithium battery storage deployed on a major logistics hub.',
    description: 'Elena is an infrastructure engineer deploying rooftop clean energy. Fixed 15-year power purchase agreements with warehouse tenants repay 312 co-investors their capital plus interest monthly.',
    sector: 'Clean Energy & Storage',
    riskTier: 'low',
    targetPence: 100000000, // £1,000,000
    raisedPence: 100000000, // £1,000,000 (100% funded)
    coInvestorsCount: 312,
    expectedReturnMinBps: 500, // 5.0%
    expectedReturnMaxBps: 600, // 6.0%
    termMonths: 18,
    status: 'funded',
    keyRisks: [
      'Prolonged periods of overcast weather could temporarily reduce peak solar generation.',
      'Component shipping delays for specialized high-capacity battery inverters.',
      'Warehouse tenant business relocation could require renegotiating power contracts.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & director check', verified_date: '2026-08-10', status: 'verified' },
      { item: 'Grid connection agreement and structural roof engineering audit', verified_date: '2026-08-14', status: 'verified' },
      { item: 'Independent 15-year Power Purchase Agreement (PPA) legal review', verified_date: '2026-08-19', status: 'verified' },
      { item: 'First-ranking equipment charge registered at Companies House', verified_date: '2026-08-25', status: 'verified' },
    ],
    updates: [
      { date: '2026-09-01', title: '100% funded by 312 co-investors', content: 'Target reached. Installation contractor scheduled to commence milestone 1.' },
    ],
  },

  // 3. Regional Diagnostic Clinic (Completed)
  {
    id: '33333333-3333-4333-8333-333333333333',
    partnerName: 'Dr. Richard Thorne (Clinical Director)',
    partnerDesc: 'Medical clinic leader co-funding digital diagnostic scanners for regional diagnostic hubs.',
    partnerLocation: 'Harrogate, North Yorkshire',
    partnerFoundedYear: 2012,
    title: 'Regional Diagnostic Clinic — Imaging Scanner Equipment Lease',
    summary: 'State-of-the-art ultrasound imaging equipment leased to an NHS partner diagnostic clinic.',
    description: 'Established healthcare clinic co-funding medical diagnostic machinery. 185 co-investors pooled £500,000. Full loan repayments completed on time and in full over 24 months.',
    sector: 'Healthcare & MedTech',
    riskTier: 'low',
    targetPence: 50000000, // £500,000
    raisedPence: 50000000, // £500,000 (100% completed)
    coInvestorsCount: 185,
    expectedReturnMinBps: 450, // 4.5%
    expectedReturnMaxBps: 550, // 5.5%
    termMonths: 24,
    status: 'completed',
    keyRisks: [
      'Healthcare equipment maintenance downtime could temporarily slow patient scans.',
      'Regulatory medical device compliance changes requiring software upgrades.',
      'Manufacturer part delivery delays for specialized calibration tools.',
    ],
    vettingChecklist: [
      { item: 'CQC healthcare registration and clinical compliance audit', verified_date: '2024-09-02', status: 'verified' },
      { item: 'NHS partner diagnostic servicing contract review', verified_date: '2024-09-08', status: 'verified' },
      { item: 'Asset serialisation and commercial equipment debenture', verified_date: '2024-09-15', status: 'verified' },
      { item: 'Direct debit escrow mandate confirmed with clearing bank', verified_date: '2024-09-20', status: 'verified' },
    ],
    updates: [
      { date: '2026-09-30', title: 'Loan fully repaid on time', content: 'All 185 co-investors received 100% of their capital and interest as scheduled.' },
    ],
  },

  // 4. EV Fast-Charger Installation – Retail Park, Bristol (Replacing Micro-Algae)
  {
    id: '44444444-4444-4444-8444-444444444444',
    partnerName: 'Liam Gallagher (Logistics Operator)',
    partnerDesc: 'Commercial transport specialist deploying rapid EV charging infrastructure across UK retail and freight hubs.',
    partnerLocation: 'Bristol, UK',
    partnerFoundedYear: 2021,
    title: 'EV Fast-Charger Installation – Retail Park, Bristol',
    summary: 'Deploying 8 ultra-fast rapid EV charging bays across a busy Bristol commercial retail park.',
    description: 'Liam operates clean fleet infrastructure. This syndicate funds the groundworks and hardware for 8 rapid 150kW commercial EV chargers. Repaid from driver charging revenue under a signed 10-year site agreement with the retail park operator.',
    sector: 'Clean Infrastructure',
    riskTier: 'medium', // Displayed as "Medium Risk"
    targetPence: 25000000, // £250,000
    raisedPence: 12000000,  // £120,000 (48% funded)
    coInvestorsCount: 96,
    expectedReturnMinBps: 650, // 6.5%
    expectedReturnMaxBps: 800, // 8.0%
    termMonths: 24,
    status: 'open',
    keyRisks: [
      'Local grid connection energisation delays by the regional distribution network operator.',
      'Wholesale electricity tariff volatility affecting operating margins before adjustment.',
      'Component warranty servicing call-outs for high-voltage DC power converter modules.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & director check', verified_date: '2026-09-10', status: 'verified' },
      { item: '10-year retail park lease and site access contract review', verified_date: '2026-09-14', status: 'verified' },
      { item: 'Distribution Network Operator (DNO) grid capacity sign-off', verified_date: '2026-09-20', status: 'verified' },
      { item: 'Hardware asset charge registered at Companies House', verified_date: '2026-09-26', status: 'verified' },
    ],
    updates: [
      { date: '2026-10-10', title: 'Syndicate opened for funding', content: 'Open to everyday co-investors with target return 6.5%–8.0% / yr.' },
    ],
  },

  // 5. Vertical Hydroponic Supermarket Farm Automation
  {
    id: '55555555-5555-4555-8555-555555555555',
    partnerName: 'Dr. Maya Patel (AgriTech Specialist)',
    partnerDesc: 'Urban agricultural scientist building automated vertical hydroponic herb towers for supermarkets.',
    partnerLocation: 'Leeds, West Yorkshire',
    partnerFoundedYear: 2022,
    title: 'Vertical Hydroponic Supermarket Farm Automation',
    summary: 'Automated LED lighting and nutrient sensors for an indoor farm supplying supermarket herbs.',
    description: 'Smart agriculture venture scaling fresh basil and mint output in Leeds. Supermarket purchase orders fund loan repayments over 24 months.',
    sector: 'Smart Agriculture',
    riskTier: 'medium',
    targetPence: 35000000, // £350,000
    raisedPence: 18000000,  // £180,000 (51.4% funded)
    coInvestorsCount: 142,
    expectedReturnMinBps: 600, // 6.0%
    expectedReturnMaxBps: 750, // 7.5%
    termMonths: 24,
    status: 'open',
    keyRisks: [
      'Sensor hardware replacements may take several weeks to import.',
      'Electricity rate changes could affect indoor climate control operating costs.',
      'Competition from traditional outdoor summer herb farms during harvest peaks.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & director check', verified_date: '2026-08-20', status: 'verified' },
      { item: 'Supermarket purchase agreement verification', verified_date: '2026-08-25', status: 'verified' },
      { item: 'Agricultural facility physical audit in Leeds', verified_date: '2026-09-01', status: 'verified' },
      { item: 'Debenture on climate automation machinery', verified_date: '2026-09-05', status: 'verified' },
    ],
    updates: [
      { date: '2026-09-20', title: '50% funded milestone reached', content: '142 co-investors have joined this vertical agritech syndicate.' },
    ],
  },

  // 6. Eco-Apparel Q4 Bulk Seasonal Inventory Financing (Repaying)
  {
    id: '66666666-6666-4666-8666-666666666666',
    partnerName: 'Chloe & Sam Davis (Brand Founders)',
    partnerDesc: 'Eco-apparel brand founders funding bulk seasonal yarn inventory purchases to fulfill pre-orders.',
    partnerLocation: 'Exeter, Devon',
    partnerFoundedYear: 2020,
    title: 'Eco-Apparel Q4 Bulk Seasonal Inventory Financing',
    summary: 'Financing bulk raw bamboo yarn purchase to manufacture autumn/winter collection.',
    description: 'Established sustainable clothing brand with 12,000 customers. Loan is actively repaying month-by-month on schedule from seasonal retail sales.',
    sector: 'Consumer Goods & Trade',
    riskTier: 'medium',
    targetPence: 25000000, // £250,000
    raisedPence: 25000000, // £250,000 (100% funded)
    coInvestorsCount: 168,
    expectedReturnMinBps: 650, // 6.5%
    expectedReturnMaxBps: 750, // 7.5%
    termMonths: 36,
    status: 'repaying',
    keyRisks: [
      'Textile mill shipping delays could compress holiday retail selling window.',
      'Consumer fashion spending shifts during general economic downturns.',
      'Raw material import tariffs could affect final wholesale margins.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & director check', verified_date: '2025-10-02', status: 'verified' },
      { item: 'Audited accounts and past 24-month trading history', verified_date: '2025-10-08', status: 'verified' },
      { item: 'Supplier inventory purchase invoices & warehouse inspection', verified_date: '2025-10-15', status: 'verified' },
      { item: 'Floating debenture over stock and receivables', verified_date: '2025-10-22', status: 'verified' },
    ],
    updates: [
      { date: '2026-06-15', title: 'Repayment #8 distributed on time', content: 'Monthly capital and interest paid directly to all 168 co-investors.' },
    ],
  },

  // 7. Indie Studio Game Console Port (Higher Risk Open)
  {
    id: '77777777-7777-4777-8777-777777777777',
    partnerName: 'Sophie Bennett (Game Director)',
    partnerDesc: 'Indie game studio lead porting an acclaimed PC game to consoles and manufacturing physical editions.',
    partnerLocation: 'Sheffield, UK',
    partnerFoundedYear: 2023,
    title: 'Indie Studio Game Console Port & Physical Editions',
    summary: 'Porting a viral PC indie game to Nintendo Switch and manufacturing physical collector cartridges.',
    description: 'Award-winning Sheffield studio expanding to console markets. Pre-order game sales directly repay investors over 24 months.',
    sector: 'Gaming & Digital Media',
    riskTier: 'high', // Displayed as "Higher Risk"
    targetPence: 50000000, // £500,000
    raisedPence: 32000000,  // £320,000 (64% funded)
    coInvestorsCount: 175,
    expectedReturnMinBps: 850, // 8.5%
    expectedReturnMaxBps: 1050, // 10.5%
    termMonths: 24,
    status: 'open',
    keyRisks: [
      'Console platform certification reviews could delay target launch window.',
      'Physical cartridge manufacturing minimum runs require substantial upfront cash.',
      'Higher loss risk: creative media sales can be hit-driven and unpredictable.',
    ],
    vettingChecklist: [
      { item: 'Companies House identity & studio ownership verification', verified_date: '2026-09-01', status: 'verified' },
      { item: 'Verified Steam platform digital sales reports and player analytics', verified_date: '2026-09-06', status: 'verified' },
      { item: 'Console platform developer licensing agreements confirmed', verified_date: '2026-09-12', status: 'verified' },
      { item: 'Intellectual property and digital publishing revenue charge', verified_date: '2026-09-18', status: 'verified' },
    ],
    updates: [
      { date: '2026-10-05', title: 'Beta console build approved', content: 'First milestone completed; certification underway.' },
    ],
  },

  // 8. Highland Clean Tech Dye Production Facility (Higher Risk Open)
  {
    id: '88888888-8888-4888-8888-888888888888',
    partnerName: 'Highland Wool Millers',
    partnerDesc: 'Artisan textile cooperative creating natural plant-dyed wool yarns in the Scottish Highlands.',
    partnerLocation: 'Fort William, Highlands',
    partnerFoundedYear: 2023,
    title: 'Highland Clean Tech Dye Production Facility',
    summary: 'Stainless steel temperature-controlled dye vats to scale naturally dyed wool production.',
    description: 'Artisan cooperative processing wool from local crofts. Seeking funding to fulfill wholesale orders from European knitwear designers.',
    sector: 'Community Crafts',
    riskTier: 'high',
    targetPence: 30000000, // £300,000
    raisedPence: 14000000,  // £140,000 (46.7% funded)
    coInvestorsCount: 89,
    expectedReturnMinBps: 800, // 8.0%
    expectedReturnMaxBps: 1000, // 10.0%
    termMonths: 18,
    status: 'open',
    keyRisks: [
      'Wholesale clothing design orders can be volatile and seasonal.',
      'Transport costs from remote Highlands to mainland hubs are significant.',
      'Artisan dye recipe consistency requires strict quality controls.',
    ],
    vettingChecklist: [
      { item: 'Cooperative articles of association and governance review', verified_date: '2026-08-15', status: 'verified' },
      { item: 'European export commercial purchase order audit', verified_date: '2026-08-22', status: 'verified' },
      { item: 'Highland facility on-site equipment inspection', verified_date: '2026-08-28', status: 'verified' },
      { item: 'Charge over plant machinery and finished inventory', verified_date: '2026-09-02', status: 'verified' },
    ],
    updates: [
      { date: '2026-09-15', title: 'Dye equipment ordered', content: 'Cooperative has reserved stainless vats pending final raise completion.' },
    ],
  },

  // 9. Commercial Drone Offshore Turbine Inspection Fleet (Defaulted)
  {
    id: '99999999-9999-4999-8999-999999999999',
    partnerName: 'Nathan Ross (Commercial Drone Pilot)',
    partnerDesc: 'Specialist UAV survey team inspecting infrastructure, wind turbines, and industrial bridges.',
    partnerLocation: 'Newcastle upon Tyne',
    partnerFoundedYear: 2023,
    title: 'Commercial Drone Offshore Turbine Inspection Fleet',
    summary: 'Thermal-imaging inspection drones for industrial wind turbine and bridge surveys.',
    description: 'Specialist drone inspection team. Borrower faced offshore client contract cancellations and defaulted; currently in recovery with Provision Fund assistance.',
    sector: 'Tech & Field Services',
    riskTier: 'high',
    targetPence: 40000000, // £400,000
    raisedPence: 40000000, // £400,000 (100% funded)
    coInvestorsCount: 210,
    expectedReturnMinBps: 950, // 9.5%
    expectedReturnMaxBps: 1200, // 12.0%
    termMonths: 30,
    status: 'defaulted',
    keyRisks: [
      'High chance of borrower default if industrial inspection contracts pause.',
      'Loss or damage of specialized drone equipment in extreme maritime weather.',
      'Higher risk loan subject to asset recovery procedures upon default.',
    ],
    vettingChecklist: [
      { item: 'Civil Aviation Authority (CAA) commercial operator permissions', verified_date: '2025-01-10', status: 'verified' },
      { item: 'Offshore wind farm survey trial evaluation', verified_date: '2025-01-18', status: 'verified' },
      { item: 'Asset serialisation of thermal inspection drone hardware', verified_date: '2025-01-25', status: 'verified' },
      { item: 'Companies House debenture on UAV fleet equipment', verified_date: '2025-02-01', status: 'verified' },
    ],
    updates: [
      { date: '2026-08-10', title: 'Default notice & recovery initiated', content: 'Borrower missed scheduled payments; chartered recovery proceedings underway and Provision Fund notified.' },
    ],
  },
];

export const TOTAL_SYNDICATED_PENCE = CANONICAL_PROJECTS.reduce((sum, p) => sum + p.raisedPence, 0); // 359,500,000 pence = £3,595,000
export const TOTAL_CO_INVESTORS_COUNT = CANONICAL_PROJECTS.reduce((sum, p) => sum + p.coInvestorsCount, 0); // 1,591 co-investors
export const PROVISION_FUND_BALANCE_PENCE = Math.round(TOTAL_SYNDICATED_PENCE * 0.01); // 1% of total raised = £35,950 (3,595,000 pence)

export function findCanonicalProject(idOrTitle?: string | null): CanonicalProject | undefined {
  if (!idOrTitle) return undefined;
  const clean = idOrTitle.toLowerCase().trim();
  return CANONICAL_PROJECTS.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.id.toLowerCase().startsWith(clean) ||
      clean.startsWith(p.id.toLowerCase().slice(0, 8)) ||
      p.title.toLowerCase().includes(clean) ||
      clean.includes(p.title.toLowerCase().slice(0, 15))
  );
}

