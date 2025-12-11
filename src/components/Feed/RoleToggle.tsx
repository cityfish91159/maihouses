import React from 'react';
import { UserCog, Users } from 'lucide-react';

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
            className={`fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 font-bold text-white shadow-lg transition-all active:scale-95 ${isAgent
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-200'
                    : 'bg-gradient-to-r from-brand-500 to-brand-600 shadow-brand-200'
                } ${className}`}
            title={isAgent ? '切換至消費者視角' : '切換至房仲視角'}
        >
            {isAgent ? <Users size={20} /> : <UserCog size={20} />}
            <span>{isAgent ? '房仲視角' : '住戶視角'}</span>
        </button>
    );
}
