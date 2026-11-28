import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { LEETCODE_RESOURCES } from './portalHubConstants';

export default function PortalLeetCodeTab() {
  return (
    <PortalResourceSection
      eyebrow="ALGORITHMS · DATA STRUCTURES · INTERVIEWS"
      title="LeetCode & DSA Practice Hub"
      subtitle="Daily coding practice, curated interview study plans (LeetCode 75, Top 150, SQL 50), NeetCode roadmap, and Big-O complexity references."
      accent="amber"
      primaryUrl="https://leetcode.com/problemset/"
      primaryLabel="Open LeetCode"
      items={LEETCODE_RESOURCES}
    />
  );
}
