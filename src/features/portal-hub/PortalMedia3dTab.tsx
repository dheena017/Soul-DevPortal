import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { MEDIA_3D_RESOURCES } from './portalHubConstants';

export default function PortalMedia3dTab() {
  return (
    <PortalResourceSection
      eyebrow="THREE.JS · FFMPEG · BLENDER · WEBGPU"
      title="Media, Video & 3D Studio Docs"
      subtitle="Core graphics, video processing, and GPU compute references powering Soul-DevPortal-Packages."
      accent="emerald"
      primaryUrl="https://threejs.org/docs/"
      primaryLabel="Open Three.js"
      items={MEDIA_3D_RESOURCES}
    />
  );
}
