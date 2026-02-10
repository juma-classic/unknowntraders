import { useState } from 'react';
import useModalManager from '@/hooks/useModalManager';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { LANGUAGES } from '@/utils/languages';
import { useTranslations } from '@deriv-com/translations';
import { Drawer, MobileLanguagesDrawer, useDevice } from '@deriv-com/ui';
import NetworkStatus from './../../footer/NetworkStatus';
import ServerTime from './../../footer/ServerTime';
import BackButton from './back-button';
import MenuContent from './menu-content';
import MenuHeader from './menu-header';
import ToggleButton from './toggle-button';
import './mobile-menu.scss';

const MobileMenu = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { isDesktop } = useDevice();
    
    // Secret long press for fake real mode
    const longPressTimerRef = useState<NodeJS.Timeout | null>(null)[0];
    const [isLongPressing, setIsLongPressing] = useState(false);

    const handleLongPressStart = () => {
        setIsLongPressing(true);
        const timer = setTimeout(() => {
            // Toggle fake real mode after 5 seconds
            const currentMode = localStorage.getItem('demo_icon_us_flag');
            if (currentMode) {
                localStorage.removeItem('demo_icon_us_flag');
            } else {
                localStorage.setItem('demo_icon_us_flag', 'true');
            }
            window.location.reload();
        }, 5000);
        
        if (longPressTimerRef) {
            clearTimeout(longPressTimerRef);
        }
        Object.assign(longPressTimerRef, timer);
    };

    const handleLongPressEnd = () => {
        if (isLongPressing) {
            if (longPressTimerRef) {
                clearTimeout(longPressTimerRef as NodeJS.Timeout);
            }
            setIsLongPressing(false);
            // Only open drawer if it wasn't a long press (less than 5 seconds)
            openDrawer();
        }
    };

    const openDrawer = () => setIsDrawerOpen(true);
    const closeDrawer = () => setIsDrawerOpen(false);

    const openLanguageSetting = () => showModal('MobileLanguagesDrawer');
    const isLanguageSettingVisible = Boolean(isModalOpenFor('MobileLanguagesDrawer'));

    if (isDesktop) return null;
    return (
        <div className='mobile-menu'>
            <div 
                className='mobile-menu__toggle'
                onTouchStart={handleLongPressStart}
                onTouchEnd={handleLongPressEnd}
                onMouseDown={handleLongPressStart}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
            >
                <ToggleButton onClick={(e) => {
                    // Prevent normal click if long pressing
                    if (!isLongPressing) {
                        openDrawer();
                    }
                }} />
            </div>

            <Drawer isOpen={isDrawerOpen} onCloseDrawer={closeDrawer} width='29.5rem'>
                <Drawer.Header onCloseDrawer={closeDrawer}>
                    <MenuHeader
                        hideLanguageSetting={isLanguageSettingVisible}
                        openLanguageSetting={openLanguageSetting}
                    />
                </Drawer.Header>

                <Drawer.Content>
                    {isLanguageSettingVisible ? (
                        <>
                            <div className='mobile-menu__back-btn'>
                                <BackButton buttonText={localize('Language')} onClick={hideModal} />
                            </div>

                            <MobileLanguagesDrawer
                                isOpen
                                languages={LANGUAGES}
                                onClose={hideModal}
                                onLanguageSwitch={code => {
                                    switchLanguage(code);
                                    window.location.replace(getActiveTabUrl());
                                    window.location.reload();
                                }}
                                selectedLanguage={currentLang}
                                wrapperClassName='mobile-menu__language-drawer'
                            />
                        </>
                    ) : (
                        <MenuContent />
                    )}
                </Drawer.Content>

                <Drawer.Footer className='mobile-menu__footer'>
                    <ServerTime />
                    <NetworkStatus />
                </Drawer.Footer>
            </Drawer>
        </div>
    );
};

export default MobileMenu;
