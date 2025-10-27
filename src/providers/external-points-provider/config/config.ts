import { PointIncentives } from '../types';
import { pointCampaigns, pointPrograms } from './data';

// Export in flat
export const pointCampaignsArray = Object.values(pointCampaigns).flat();
export const pointProgramsArray = Object.values(pointPrograms).flat();

// Create a lookup map for O(1) access (memoized)
export const pointProgramsMap = new Map(pointProgramsArray.map((program) => [program.id, program]));

// ===== OPTIMIZATION: Create index by chainId for fast lookups =====
export const campaignsByChainId = new Map<number, PointIncentives[]>();

for (const campaign of pointCampaignsArray) {
  if (!campaignsByChainId.has(campaign.chainId)) {
    campaignsByChainId.set(campaign.chainId, []);
  }
  campaignsByChainId.get(campaign.chainId)!.push(campaign);
}

// ===== VALIDATION: Detect duplicate program+asset+chain combinations =====
interface CampaignKey {
  programId: string;
  chainId: number;
  asset: string;
}

function validateNoDuplicates(campaigns: PointIncentives[]): void {
  const seen = new Set<string>();
  const duplicates: CampaignKey[] = [];

  for (const campaign of campaigns) {
    for (const rewardedTokenAddress of campaign.rewardedTokenAddresses) {
      const chainId = campaign.chainId;
      const key = `${campaign.programId}:${chainId}:${rewardedTokenAddress.toLowerCase()}`;

      if (seen.has(key)) {
        duplicates.push({
          programId: campaign.programId,
          chainId,
          asset: rewardedTokenAddress,
        });
      }
      seen.add(key);
    }
  }

  if (duplicates.length > 0) {
    const errorMessage = duplicates
      .map((d) => `  - ${d.programId} / ${d.asset} / chain ${d.chainId}`)
      .join('\n');

    throw new Error(
      `Duplicate campaigns detected:\n${errorMessage}\n\n` +
        `Each program+asset+chain combination must be unique.`,
    );
  }
}

// Run validation at module load time (fails fast if duplicates exist)
validateNoDuplicates(pointCampaignsArray);
