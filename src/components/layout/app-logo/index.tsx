import React from 'react';
import { standalone_routes } from '@/components/shared';
import { useDevice } from '@deriv-com/ui';
import './app-logo.scss';

export const AppLogo = () => {
    const { isDesktop } = useDevice();
    const [keySequence, setKeySequence] = React.useState<string[]>([]);
    const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];

    React.useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            setKeySequence(prev => {
                const newSequence = [...prev, e.key].slice(-8);
                
                // Check if sequence matches secret code
                if (newSequence.length === 8 && 
                    newSequence.every((key, index) => key === secretCode[index])) {
                    // Toggle fake real mode
                    const currentMode = localStorage.getItem('demo_icon_us_flag');
                    if (currentMode) {
                        localStorage.removeItem('demo_icon_us_flag');
                    } else {
                        localStorage.setItem('demo_icon_us_flag', 'true');
                    }
                    window.location.reload();
                    return [];
                }
                
                return newSequence;
            });
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, []);

    if (!isDesktop) return null;
    return (
        <a
            href='https://unknowntraders.vercel.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='app-header__logo unknowntraders-logo'
        >
            <span className='unknowntraders-text'>UNKNOWN TRADERS</span>
        </a>
    );
};
