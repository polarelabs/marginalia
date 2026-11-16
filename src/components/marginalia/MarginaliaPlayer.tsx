'use client';

import { createPlayer } from '@videojs/react';
import { videoFeatures } from '@videojs/react/video';
import { MuxVideo } from '@videojs/react/media/mux-video';
import { MarginaliaSkin } from './MarginaliaSkin';

const PLAYBACK_ID = '8gi016wF2YOjW8Z02aFvb73jIwwiXJ8vWe015l02GFlUUUk';

const { Player } = createPlayer({ features: videoFeatures });

export function MarginaliaPlayer() {
  return (
    <Player>
      <MarginaliaSkin>
        <MuxVideo source={{ playbackId: PLAYBACK_ID }} playsInline preload="metadata" />
      </MarginaliaSkin>
    </Player>
  );
}