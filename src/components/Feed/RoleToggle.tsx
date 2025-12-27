import React from 'react';
import { UserCog, Users } from 'lucide-react';
import { STRINGS } from '../../constants/strings';

interface RoleToggleProps {
    currentRole: 'agent' | 'member';
    onToggle: () => void;
    className?: string;
}

export function RoleToggle({ currentRole, onToggle, className = '' }: RoleToggleProps) {
    const isAgent = currentRole === 'agent';

    return (
        <button
            onClick={onToggle}
            className={`fixed bottom-24 right-4 z-[9999] flex items-center gap-2 rounded-full px-4 py-3 font-bold text-white shadow-lg transition-all active:scale-95 ${isAgent
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-200'
                : 'shadow-brand-200 bg-gradient-to-r from-brand-500 to-brand-600'
                } ${className}`}
            title={isAgent ? STRINGS.AGENT.OOS.SWITCH_TO_CONSUMER : STRINGS.AGENT.OOS.SWITCH_TO_AGENT}
        >
            {isAgent ? <Users size={20} /> : <UserCog size={20} />}
            <span>{isAgent ? STRINGS.AGENT.ROLE.AGENT : STRINGS.AGENT.ROLE.CONSUMER}</span>
        </button>
    );
}
