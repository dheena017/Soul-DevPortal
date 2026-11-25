import React from 'react';
import CodeSnippetGenerator from '../../../components/CodeSnippetGenerator';
import { PackageData } from '../../../types';

export interface PackagePlaygroundTabProps {
  pkgId: string;
  pkg?: PackageData;
}

export default function PackagePlaygroundTab({ pkgId, pkg }: PackagePlaygroundTabProps) {
  return (
    <section className="w-full flex flex-col gap-6 portal-stagger">
      <CodeSnippetGenerator pkgId={pkgId} pkg={pkg} />
    </section>
  );
}
