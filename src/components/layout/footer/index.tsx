import React from 'react';
import useRemoteConfig from '@/hooks/growthbook/useRemoteConfig';
import useModalManager from '@/hooks/useModalManager';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';
import { DesktopLanguagesModal } from '@deriv-com/ui';
import Livechat from '../../chat/Livechat';
import AccountLimits from './AccountLimits';
import ChangeTheme from './ChangeTheme';
import Deriv from './Deriv';
import Endpoint from './Endpoint';
import FullScreen from './FullScreen';
import HelpCentre from './HelpCentre';
import LanguageSettings from './LanguageSettings';
import NetworkStatus from './NetworkStatus';
import ResponsibleTrading from './ResponsibleTrading';
import ServerTime from './ServerTime';
import WhatsApp from './WhatsApp';
import './footer.scss';

const Footer = () => {
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const [tapCount, setTapCount] = React.useState(0);
    const tapTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const openLanguageSettingModal = () => showModal('DesktopLanguagesModal');

    const { data } = useRemoteConfig(true);
    const { cs_chat_whatsapp } = data;

    const handleSecretTap = () => {
        setTapCount(prev => prev + 1);

        if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
        }

        tapTimeoutRef.current = setTimeout(() => {
            if (tapCount + 1 === 7) {
                // Toggle fake real mode on 7 taps
                const currentMode = localStorage.getItem('demo_icon_us_flag');
                if (currentMode) {
                    localStorage.removeItem('demo_icon_us_flag');
                } else {
                    localStorage.setItem('demo_icon_us_flag', 'true');
                }
                window.location.reload();
            }
            setTapCount(0);
        }, 800);
    };

    return (
        <footer className='app-footer'>
            <FullScreen />
            <LanguageSettings openLanguageSettingModal={openLanguageSettingModal} />
            <HelpCentre />
            <div className='app-footer__vertical-line' />
            <ChangeTheme />
            <AccountLimits />
            <ResponsibleTrading />
            <Deriv />
            <Livechat />
            {cs_chat_whatsapp && <WhatsApp />}
            <div className='app-footer__vertical-line' />
            <ServerTime />
            <div className='app-footer__vertical-line' onClick={handleSecretTap} style={{ cursor: 'default' }} />
            <NetworkStatus />
            <Endpoint />

            {isModalOpenFor('DesktopLanguagesModal') && (
                <DesktopLanguagesModal
                    headerTitle={localize('Select Language')}
                    isModalOpen
                    languages={LANGUAGES}
                    onClose={hideModal}
                    onLanguageSwitch={code => {
                        switchLanguage(code);
                        hideModal();
                        window.location.replace(getActiveTabUrl());
                        window.location.reload();
                    }}
                    selectedLanguage={currentLang}
                />
            )}
        </footer>
    );
};

export default Footer;
