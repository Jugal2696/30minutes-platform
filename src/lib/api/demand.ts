export interface SearchResult {
  id: string;
  type: 'OOH' | 'INFLUENCER' | 'GUERRILLA';
  name: string;
  relevanceScore: number;
  availability: boolean;
  price: number;
  location: string;
}

export interface RTBOpportunity {
  id: string;
  slot_name: string;
  impression_forecast: number;
  current_bid: number;
  expires_at: string;
  trending_signal: 'HIGH_FOOTFALL' | 'VIRAL_SPIKE';
}

export interface CampaignBundle {
  id: string;
  name: string;
  type: 'DOMINATION' | 'DIGITAL_BLITZ' | 'CUSTOM';
  assets: {
    billboards: number;
    influencers: number;
    guerilla_teams: number;
  };
  est_reach: number;
  price: number;
  roi_projection: number;
}

export async function semantic_search(query: string): Promise<SearchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    {
      id: 'ooh-101',
      type: 'OOH',
      name: 'Downtown Digital Billboard #4',
      relevanceScore: 0.98,
      availability: true,
      price: 1200,
      location: 'City Center'
    },
    {
      id: 'inf-55',
      type: 'INFLUENCER',
      name: 'Local Foodie (Micro)',
      relevanceScore: 0.92,
      availability: true,
      price: 450,
      location: 'Regional'
    },
    {
      id: 'gue-12',
      type: 'GUERRILLA',
      name: 'Coffee Sleeve Distro Team',
      relevanceScore: 0.85,
      availability: true,
      price: 300,
      location: 'Metro Stations'
    }
  ];
}

export async function rtb_opportunities(): Promise<RTBOpportunity[]> {
  return [
    {
      id: 'rtb-nyc-1',
      slot_name: 'Times Square Digital 15s',
      impression_forecast: 15000,
      current_bid: 450,
      expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
      trending_signal: 'HIGH_FOOTFALL'
    },
    {
      id: 'rtb-ldn-2',
      slot_name: 'Piccadilly Circus Banner',
      impression_forecast: 8000,
      current_bid: 320,
      expires_at: new Date(Date.now() + 2 * 60000).toISOString(),
      trending_signal: 'VIRAL_SPIKE'
    },
    {
      id: 'rtb-mum-3',
      slot_name: 'Airport Arrival Hall LED',
      impression_forecast: 12000,
      current_bid: 150,
      expires_at: new Date(Date.now() + 10 * 60000).toISOString(),
      trending_signal: 'HIGH_FOOTFALL'
    }
  ];
}

export async function campaign_bundles(): Promise<CampaignBundle[]> {
  return [
    {
      id: 'bun-1',
      name: 'City Domination (Rajkot)',
      type: 'DOMINATION',
      assets: { billboards: 10, influencers: 5, guerilla_teams: 0 },
      est_reach: 2400000,
      price: 12000,
      roi_projection: 3.2
    },
    {
      id: 'bun-2',
      name: 'Digital Blitz (Global)',
      type: 'DIGITAL_BLITZ',
      assets: { billboards: 0, influencers: 50, guerilla_teams: 0 },
      est_reach: 850000,
      price: 5000,
      roi_projection: 2.1
    },
    {
      id: 'bun-3',
      name: 'Launch Party Mix',
      type: 'CUSTOM',
      assets: { billboards: 2, influencers: 10, guerilla_teams: 2 },
      est_reach: 120000,
      price: 3500,
      roi_projection: 1.8
    }
  ];
}
