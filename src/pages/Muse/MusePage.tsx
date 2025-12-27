import React from 'react';
import NightMode from './NightMode';

export default function MusePage() {
    // User requested removal of "Day Mode". 
    // The Muse persona is now the default and only experience.
    return <NightMode />;
}
