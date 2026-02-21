import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MOCK_CONVERSATIONS, MOCK_CONVERSATION_IDS, MOCK_DB, MOCK_IDS } from '../mockData';

const UAG_STYLES_PATH = resolve(process.cwd(), 'src/pages/UAG/UAG.module.css');
const ACTION_PANEL_PATH = resolve(process.cwd(), 'src/pages/UAG/components/ActionPanel.tsx');
const ASSET_MONITOR_PATH = resolve(process.cwd(), 'src/pages/UAG/components/AssetMonitor.tsx');
const LISTING_FEED_PATH = resolve(process.cwd(), 'src/pages/UAG/components/ListingFeed.tsx');

describe('#9d regression checks', () => {
  it('U10: all purchased mock leads include conversation_id; A-6600 remains stable', () => {
    const purchasedLeads = MOCK_DB.leads.filter((item) => item.status === 'purchased');
    const a6600 = MOCK_DB.leads.find((item) => item.id === MOCK_IDS.leads.A6600);

    expect(purchasedLeads.length).toBeGreaterThan(0);
    expect(a6600?.status).toBe('purchased');
    expect(a6600?.conversation_id).toBe(MOCK_CONVERSATION_IDS.A6600);

    for (const lead of purchasedLeads) {
      expect(typeof lead.conversation_id).toBe('string');
      expect((lead.conversation_id ?? '').trim().length).toBeGreaterThan(0);
    }
  });

  it('U10: purchased lead conversation_id should map to MOCK_CONVERSATIONS keys', () => {
    const conversationKeys = new Set(Object.keys(MOCK_CONVERSATIONS));
    const purchasedLeads = MOCK_DB.leads.filter((item) => item.status === 'purchased');

    for (const lead of purchasedLeads) {
      expect(lead.conversation_id).toBeDefined();
      expect(conversationKeys.has(lead.conversation_id ?? '')).toBe(true);
    }
  });

  it('U12: desktop layout defines side-by-side ActionPanel and AssetMonitor at >=1280px', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');
    const desktopLayoutRule =
      /@media\s*\(min-width:\s*1280px\)\s*{[\s\S]*?\.uag-grid\s*>\s*#action-panel-container,\s*[\r\n\s]*\.uag-grid\s*>\s*#asset-monitor-container\s*{[\s\S]*?grid-column:\s*span\s*3;[\s\S]*?}\s*}/m;
    const wrongDesktopRule =
      /@media\s*\(min-width:\s*1025px\)\s*{[\s\S]*?\.uag-grid\s*>\s*#action-panel-container,\s*[\r\n\s]*\.uag-grid\s*>\s*#asset-monitor-container/m;

    expect(css).toMatch(desktopLayoutRule);
    expect(css).not.toMatch(wrongDesktopRule);
  });

  it('U12: desktop layout selectors are wired to component container ids', () => {
    const actionPanelSource = readFileSync(ACTION_PANEL_PATH, 'utf8');
    const assetMonitorSource = readFileSync(ASSET_MONITOR_PATH, 'utf8');

    expect(actionPanelSource).toContain('id="action-panel-container"');
    expect(assetMonitorSource).toContain('id="asset-monitor-container"');
  });

  it('U6: mobile listing thumbnail is upgraded to 80px touch size', () => {
    const css = readFileSync(UAG_STYLES_PATH, 'utf8');
    const mobileListingThumbRule =
      /@media\s*\(max-width:\s*768px\)\s*{[\s\S]*?\.listing-item\s*{[\s\S]*?grid-template-columns:\s*80px\s*1fr;[\s\S]*?}[\s\S]*?\.l-thumb\s*{[\s\S]*?width:\s*80px;[\s\S]*?height:\s*80px;[\s\S]*?}[\s\S]*?}/m;

    expect(css).toMatch(mobileListingThumbRule);
  });

  it('U6: listing markup still uses listing-item and l-thumb classes', () => {
    const listingFeedSource = readFileSync(LISTING_FEED_PATH, 'utf8');

    expect(listingFeedSource).toContain("styles['listing-item']");
    expect(listingFeedSource).toContain("styles['l-thumb']");
  });
});
