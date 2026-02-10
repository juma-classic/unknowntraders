import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import AnalysisTool from '@/components/analysis-tool/AnalysisTool';
import ChunkLoader from '@/components/loader/chunk-loader';
import DesktopWrapper from '@/components/shared_ui/desktop-wrapper';
import Dialog from '@/components/shared_ui/dialog';
import MobileWrapper from '@/components/shared_ui/mobile-wrapper';
import Tabs from '@/components/shared_ui/tabs/tabs';
import { ProtectedSignalsCenter } from '@/components/signals/ProtectedSignalsCenter';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { api_base, updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { Localize, localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import { BotLoadingErrorHandler, withBotLoadingErrorHandling } from '@/utils/bot-loading-error-handler';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import RunStrategy from '../dashboard/run-strategy';

const Chart = lazy(() => import('../chart'));
const Tutorial = lazy(() => import('../tutorials'));

const DashboardIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='dashGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <filter id='dashGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        {/* Connection lines */}
        <path d='M7 7h4M15 7h4M7 11v6M19 11v6' stroke='url(#dashGrad)' strokeWidth='1.5' opacity='0.6' />
        
        {/* Top left node - green/yellow square */}
        <rect x='3' y='3' width='8' height='8' rx='2' fill='url(#dashGrad)' filter='url(#dashGlow)' opacity='0.9' />
        <circle cx='7' cy='7' r='1.5' fill='#ffffff' />
        
        {/* Top right node - gray square with green dot */}
        <rect x='15' y='3' width='8' height='8' rx='2' fill='#9ca3af' opacity='0.7' />
        <circle cx='19' cy='7' r='1.2' fill='url(#dashGrad)' filter='url(#dashGlow)' />
        <text x='20' y='9' fontSize='6' fontWeight='bold' fill='#ffffff'>F</text>
        
        {/* Bottom left node - gray square with green dot */}
        <rect x='3' y='13' width='8' height='8' rx='2' fill='#9ca3af' opacity='0.7' />
        <circle cx='7' cy='17' r='1.2' fill='url(#dashGrad)' filter='url(#dashGlow)' />
        
        {/* Bottom right node - large green/yellow square */}
        <rect x='15' y='13' width='8' height='8' rx='2' fill='url(#dashGrad)' filter='url(#dashGlow)' opacity='0.9' />
        <circle cx='19' cy='17' r='1.5' fill='#ffffff' />
        
        <style>
            {`
                @keyframes dashPulse {
                    0%, 100% { opacity: 0.9; }
                    50% { opacity: 0.6; }
                }
                @keyframes linePulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1; }
                }
            `}
        </style>
    </svg>
);

const BotBuilderIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='bot-builder-nav-icon'>
        <defs>
            <linearGradient id='botGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#fbbf24' />
                <stop offset='100%' stopColor='#f59e0b' />
            </linearGradient>
            <radialGradient id='botRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
            </radialGradient>
            <filter id='botGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Central processor core */}
        <circle cx='12' cy='12' r='4' fill='url(#botRadial)' stroke='url(#botGrad)' strokeWidth='1.5' filter='url(#botGlow)' />
        
        {/* Inner rotating gear */}
        <path d='M12 9L13 10.5L12 12L11 10.5Z' fill='#fbbf24' />
        <path d='M15 12L13.5 13L12 12L13.5 11Z' fill='#fbbf24' />
        <path d='M12 15L11 13.5L12 12L13 13.5Z' fill='#fbbf24' />
        <path d='M9 12L10.5 11L12 12L10.5 13Z' fill='#fbbf24' />
        
        {/* Central AI core */}
        <circle cx='12' cy='12' r='1.5' fill='#fbbf24' filter='url(#botGlow)' />
        
        {/* Outer rotating ring with nodes */}
        <circle cx='12' cy='12' r='7' stroke='url(#botGrad)' strokeWidth='1.5' fill='none' opacity='0.6' strokeDasharray='2 3' />
        
        {/* Circuit nodes at cardinal points */}
        <circle cx='12' cy='5' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='19' cy='12' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='12' cy='19' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        <circle cx='5' cy='12' r='1.2' fill='#fbbf24' filter='url(#botGlow)' />
        
        {/* Connecting circuit lines */}
        <line x1='12' y1='5' x2='12' y2='8' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='19' y1='12' x2='16' y2='12' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='12' y1='19' x2='12' y2='16' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        <line x1='5' y1='12' x2='8' y2='12' stroke='url(#botGrad)' strokeWidth='1' opacity='0.5' />
        
        {/* Corner processors */}
        <rect x='2' y='2' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='19' y='2' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='2' y='19' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        <rect x='19' y='19' width='3' height='3' rx='0.5' fill='url(#botGrad)' opacity='0.7' />
        
        {/* Corner processor indicators */}
        <circle cx='3.5' cy='3.5' r='0.6' fill='#fbbf24' />
        <circle cx='20.5' cy='3.5' r='0.6' fill='#fbbf24' />
        <circle cx='3.5' cy='20.5' r='0.6' fill='#fbbf24' />
        <circle cx='20.5' cy='20.5' r='0.6' fill='#fbbf24' />
        
        {/* Diagonal connection lines */}
        <line x1='5' y1='5' x2='8' y2='8' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='19' y1='5' x2='16' y2='8' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='5' y1='19' x2='8' y2='16' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        <line x1='19' y1='19' x2='16' y2='16' stroke='url(#botGrad)' strokeWidth='0.5' opacity='0.4' strokeDasharray='1 1' />
        
        {/* Orbiting data particles */}
        <circle cx='12' cy='7' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='15' cy='9' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='15' cy='15' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='9' cy='15' r='0.8' fill='#ffffff' opacity='0.9' />
        
        <style>
            {`
                @keyframes botCoreRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes botRingRotate {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes botNodePulse {
                    0%, 100% { r: 1.2; opacity: 1; }
                    50% { r: 1.5; opacity: 0.6; }
                }
                @keyframes botCorePulse {
                    0%, 100% { r: 1.5; opacity: 1; }
                    50% { r: 1.8; opacity: 0.7; }
                }
                @keyframes botLinePulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                @keyframes botProcessorBlink {
                    0%, 90%, 100% { opacity: 0.7; }
                    95% { opacity: 1; }
                }
                @keyframes botIndicatorPulse {
                    0%, 100% { r: 0.6; opacity: 1; }
                    50% { r: 0.8; opacity: 0.5; }
                }
                @keyframes botOrbitRotate {
                    0% { transform: rotate(0deg) translateX(0); }
                    100% { transform: rotate(360deg) translateX(0); }
                }
                @keyframes botDashFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 10; }
                }
                
                /* Always animate - scoped to bot builder icon */
                .bot-builder-nav-icon path:nth-of-type(1),
                .bot-builder-nav-icon path:nth-of-type(2),
                .bot-builder-nav-icon path:nth-of-type(3),
                .bot-builder-nav-icon path:nth-of-type(4) { 
                    animation: botCoreRotate 4s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .bot-builder-nav-icon circle:nth-of-type(2) { 
                    animation: botRingRotate 8s linear infinite, botDashFlow 2s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .bot-builder-nav-icon circle:nth-of-type(3),
                .bot-builder-nav-icon circle:nth-of-type(4),
                .bot-builder-nav-icon circle:nth-of-type(5),
                .bot-builder-nav-icon circle:nth-of-type(6) { 
                    animation: botNodePulse 2s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(1) { 
                    animation: botCorePulse 1.5s ease-in-out infinite; 
                }
                .bot-builder-nav-icon line { 
                    animation: botLinePulse 2s ease-in-out infinite; 
                }
                .bot-builder-nav-icon rect { 
                    animation: botProcessorBlink 3s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(7),
                .bot-builder-nav-icon circle:nth-of-type(8),
                .bot-builder-nav-icon circle:nth-of-type(9),
                .bot-builder-nav-icon circle:nth-of-type(10) { 
                    animation: botIndicatorPulse 1.5s ease-in-out infinite; 
                }
                .bot-builder-nav-icon circle:nth-of-type(11),
                .bot-builder-nav-icon circle:nth-of-type(12),
                .bot-builder-nav-icon circle:nth-of-type(13),
                .bot-builder-nav-icon circle:nth-of-type(14) { 
                    animation: botOrbitRotate 6s linear infinite; 
                    transform-origin: 12px 12px;
                }
            `}
        </style>
    </svg>
);

const ChartsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='chartGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
        </defs>
        {/* Charts - Trending up line chart */}
        <path d='M3 17l6-6 4 4 8-8' stroke='url(#chartGrad)' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M17 7h4v4' stroke='url(#chartGrad)' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        <style>
            {`
                @keyframes chartPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}
        </style>
    </svg>
);

const TutorialsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='tutGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
        </defs>
        {/* Tutorials - Play button in circle */}
        <circle cx='12' cy='12' r='10' stroke='url(#tutGrad)' strokeWidth='2' fill='none' />
        <path d='M10 8l6 4-6 4V8z' fill='url(#tutGrad)' />
        <style>
            {`
                @keyframes tutScale {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}
        </style>
    </svg>
);

const AnalysisToolIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='analysis-tool-nav-icon'>
        <defs>
            <linearGradient id='analysisGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#ef4444' />
                <stop offset='100%' stopColor='#dc2626' />
            </linearGradient>
            <radialGradient id='analysisRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#ef4444' stopOpacity='1' />
                <stop offset='100%' stopColor='#dc2626' stopOpacity='0.3' />
            </radialGradient>
            <filter id='analysisGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Avengers A - main structure - WIDER AND MORE DEFINED */}
        {/* Left leg of A */}
        <path d='M6 21L12 3' stroke='url(#analysisGrad)' strokeWidth='3.5' strokeLinecap='round' filter='url(#analysisGlow)' />
        {/* Right leg of A */}
        <path d='M18 21L12 3' stroke='url(#analysisGrad)' strokeWidth='3.5' strokeLinecap='round' filter='url(#analysisGlow)' />
        {/* Crossbar of A - lower and wider */}
        <line x1='8' y1='15' x2='16' y2='15' stroke='url(#analysisGrad)' strokeWidth='3' strokeLinecap='round' filter='url(#analysisGlow)' />
        
        {/* Top triangle/peak */}
        <circle cx='12' cy='3' r='1.8' fill='#ef4444' filter='url(#analysisGlow)' />
        
        {/* Mechanical gears on the A crossbar */}
        <circle cx='8' cy='15' r='2' fill='url(#analysisRadial)' stroke='url(#analysisGrad)' strokeWidth='0.5' />
        <circle cx='16' cy='15' r='2' fill='url(#analysisRadial)' stroke='url(#analysisGrad)' strokeWidth='0.5' />
        
        {/* Gear teeth */}
        <path d='M8 13L8.6 14.5L8 16L7.4 14.5Z' fill='#ef4444' />
        <path d='M10 15L8.5 15.6L7 15L8.5 14.4Z' fill='#ef4444' />
        <path d='M16 13L16.6 14.5L16 16L15.4 14.5Z' fill='#ef4444' />
        <path d='M18 15L16.5 15.6L15 15L16.5 14.4Z' fill='#ef4444' />
        
        {/* Energy nodes along the legs */}
        <circle cx='9' cy='9' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='15' cy='9' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='7' cy='18' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        <circle cx='17' cy='18' r='1.2' fill='#ef4444' filter='url(#analysisGlow)' />
        
        {/* Arc reactor style core at crossbar center */}
        <circle cx='12' cy='15' r='2.2' fill='url(#analysisRadial)' filter='url(#analysisGlow)' />
        <circle cx='12' cy='15' r='1.4' stroke='#ef4444' strokeWidth='0.5' fill='none' />
        <circle cx='12' cy='15' r='0.7' fill='#ffffff' opacity='0.9' />
        
        {/* Energy lines connecting nodes */}
        <line x1='9' y1='9' x2='12' y2='15' stroke='#ef4444' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        <line x1='15' y1='9' x2='12' y2='15' stroke='#ef4444' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        
        {/* Outer shield/frame */}
        <circle cx='12' cy='12' r='10.5' stroke='url(#analysisGrad)' strokeWidth='1.5' fill='none' opacity='0.4' strokeDasharray='3 3' />
        
        {/* Corner brackets - Avengers style */}
        <path d='M2 2L2 5M2 2L5 2' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M22 2L22 5M22 2L19 2' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M2 22L2 19M2 22L5 22' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        <path d='M22 22L22 19M22 22L19 22' stroke='#ef4444' strokeWidth='1.5' strokeLinecap='round' opacity='0.7' />
        
        {/* Orbiting power particles */}
        <circle cx='12' cy='5' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='18' cy='12' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='12' cy='19' r='0.8' fill='#ffffff' opacity='0.9' />
        <circle cx='6' cy='12' r='0.8' fill='#ffffff' opacity='0.9' />
        
        <style>
            {`
                @keyframes analysisGearRotate1 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes analysisGearRotate2 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes analysisNodePulse {
                    0%, 100% { r: 1.2; opacity: 1; }
                    50% { r: 1.5; opacity: 0.6; }
                }
                @keyframes analysisCorePulse {
                    0%, 100% { r: 2.2; opacity: 1; }
                    50% { r: 2.5; opacity: 0.7; }
                }
                @keyframes analysisRingPulse {
                    0%, 100% { r: 1.4; opacity: 1; }
                    50% { r: 1.6; opacity: 0.6; }
                }
                @keyframes analysisShieldRotate {
                    0% { transform: rotate(0deg); stroke-dashoffset: 0; }
                    100% { transform: rotate(360deg); stroke-dashoffset: 30; }
                }
                @keyframes analysisBracketPulse {
                    0%, 100% { opacity: 0.7; }
                    50% { opacity: 1; }
                }
                @keyframes analysisOrbitRotate {
                    0% { transform: rotate(0deg) translateX(0); }
                    100% { transform: rotate(360deg) translateX(0); }
                }
                @keyframes analysisLineFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 10; }
                }
                @keyframes analysisPeakPulse {
                    0%, 100% { r: 1.8; opacity: 1; }
                    50% { r: 2.1; opacity: 0.7; }
                }
                
                /* Always animate - scoped to analysis tool icon */
                .analysis-tool-nav-icon circle:nth-of-type(2),
                .analysis-tool-nav-icon path:nth-of-type(3),
                .analysis-tool-nav-icon path:nth-of-type(4) { 
                    animation: analysisGearRotate1 4s linear infinite; 
                    transform-origin: 8px 15px;
                }
                .analysis-tool-nav-icon circle:nth-of-type(3),
                .analysis-tool-nav-icon path:nth-of-type(5),
                .analysis-tool-nav-icon path:nth-of-type(6) { 
                    animation: analysisGearRotate2 4s linear infinite; 
                    transform-origin: 16px 15px;
                }
                .analysis-tool-nav-icon circle:nth-of-type(4),
                .analysis-tool-nav-icon circle:nth-of-type(5),
                .analysis-tool-nav-icon circle:nth-of-type(6),
                .analysis-tool-nav-icon circle:nth-of-type(7) { 
                    animation: analysisNodePulse 2s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(8) { 
                    animation: analysisCorePulse 1.5s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(9) { 
                    animation: analysisRingPulse 1.5s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(11) { 
                    animation: analysisShieldRotate 8s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .analysis-tool-nav-icon path:nth-of-type(7),
                .analysis-tool-nav-icon path:nth-of-type(8),
                .analysis-tool-nav-icon path:nth-of-type(9),
                .analysis-tool-nav-icon path:nth-of-type(10) { 
                    animation: analysisBracketPulse 2s ease-in-out infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(12),
                .analysis-tool-nav-icon circle:nth-of-type(13),
                .analysis-tool-nav-icon circle:nth-of-type(14),
                .analysis-tool-nav-icon circle:nth-of-type(15) { 
                    animation: analysisOrbitRotate 6s linear infinite; 
                    transform-origin: 12px 12px;
                }
                .analysis-tool-nav-icon line:nth-of-type(2),
                .analysis-tool-nav-icon line:nth-of-type(3) { 
                    animation: analysisLineFlow 2s linear infinite; 
                }
                .analysis-tool-nav-icon circle:nth-of-type(1) { 
                    animation: analysisPeakPulse 1.5s ease-in-out infinite; 
                }
            `}
        </style>
    </svg>
);

const SignalsIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='signals-nav-icon'>
        <defs>
            <linearGradient id='signalGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <radialGradient id='signalRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='0.8' />
                <stop offset='100%' stopColor='#ffffff' stopOpacity='0.2' />
            </radialGradient>
            <filter id='signalGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Central antenna base - vertical tower */}
        <rect x='11' y='14' width='2' height='8' fill='url(#signalGrad)' rx='1' />
        <circle cx='12' cy='14' r='1.5' fill='#fbbf24' filter='url(#signalGlow)' />
        
        {/* Antenna rings - expanding outward like alien tech */}
        <ellipse 
            cx='12' 
            cy='14' 
            rx='3' 
            ry='1.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.9'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='5.5' 
            ry='2.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.7'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='8' 
            ry='3.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.5'
        />
        <ellipse 
            cx='12' 
            cy='14' 
            rx='10.5' 
            ry='4.5' 
            stroke='url(#signalGrad)' 
            strokeWidth='1.5' 
            fill='none'
            opacity='0.3'
        />
        
        {/* Signal wave particles - floating upward */}
        <circle cx='12' cy='10' r='1' fill='#fbbf24' opacity='0.8' />
        <circle cx='9' cy='8' r='0.8' fill='#fbbf24' opacity='0.6' />
        <circle cx='15' cy='8' r='0.8' fill='#fbbf24' opacity='0.6' />
        <circle cx='12' cy='5' r='1' fill='#fbbf24' opacity='0.4' />
        <circle cx='8' cy='4' r='0.7' fill='#fbbf24' opacity='0.3' />
        <circle cx='16' cy='4' r='0.7' fill='#fbbf24' opacity='0.3' />
        
        {/* Energy beams shooting upward */}
        <line x1='12' y1='14' x2='12' y2='3' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.4' />
        <line x1='12' y1='14' x2='9' y2='5' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.3' />
        <line x1='12' y1='14' x2='15' y2='5' stroke='url(#signalRadial)' strokeWidth='0.5' opacity='0.3' />
        
        <style>
            {`
                @keyframes ringExpand1Sig {
                    0%, 100% { rx: 3; ry: 1.5; opacity: 0.9; }
                    50% { rx: 3.5; ry: 1.8; opacity: 1; }
                }
                @keyframes ringExpand2Sig {
                    0%, 100% { rx: 5.5; ry: 2.5; opacity: 0.7; }
                    50% { rx: 6; ry: 2.8; opacity: 0.9; }
                }
                @keyframes ringExpand3Sig {
                    0%, 100% { rx: 8; ry: 3.5; opacity: 0.5; }
                    50% { rx: 8.5; ry: 3.8; opacity: 0.7; }
                }
                @keyframes ringExpand4Sig {
                    0%, 100% { rx: 10.5; ry: 4.5; opacity: 0.3; }
                    50% { rx: 11; ry: 4.8; opacity: 0.5; }
                }
                @keyframes particleFloat1Sig {
                    0% { cy: 10; opacity: 0.8; }
                    100% { cy: 2; opacity: 0; }
                }
                @keyframes particleFloat2Sig {
                    0% { cy: 8; opacity: 0.6; }
                    100% { cy: 1; opacity: 0; }
                }
                @keyframes particleFloat3Sig {
                    0% { cy: 5; opacity: 0.4; }
                    100% { cy: -1; opacity: 0; }
                }
                @keyframes particleFloat4Sig {
                    0% { cy: 4; opacity: 0.3; }
                    100% { cy: -2; opacity: 0; }
                }
                @keyframes corePulseSig {
                    0%, 100% { r: 1.5; opacity: 1; }
                    50% { r: 2; opacity: 0.6; }
                }
                @keyframes beamPulseSig {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                }
                
                /* Always animate - scoped to signals icon */
                .signals-nav-icon ellipse:nth-of-type(1) { 
                    animation: ringExpand1Sig 2s ease-in-out infinite; 
                }
                .signals-nav-icon ellipse:nth-of-type(2) { 
                    animation: ringExpand2Sig 2s ease-in-out infinite 0.2s; 
                }
                .signals-nav-icon ellipse:nth-of-type(3) { 
                    animation: ringExpand3Sig 2s ease-in-out infinite 0.4s; 
                }
                .signals-nav-icon ellipse:nth-of-type(4) { 
                    animation: ringExpand4Sig 2s ease-in-out infinite 0.6s; 
                }
                .signals-nav-icon circle:nth-of-type(2) { 
                    animation: corePulseSig 1.5s ease-in-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(3) { 
                    animation: particleFloat1Sig 2s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(4),
                .signals-nav-icon circle:nth-of-type(5) { 
                    animation: particleFloat2Sig 2.5s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(6) { 
                    animation: particleFloat3Sig 3s ease-out infinite; 
                }
                .signals-nav-icon circle:nth-of-type(7),
                .signals-nav-icon circle:nth-of-type(8) { 
                    animation: particleFloat4Sig 3.5s ease-out infinite; 
                }
                .signals-nav-icon line { 
                    animation: beamPulseSig 1.5s ease-in-out infinite; 
                }
            `}
        </style>
    </svg>
);


const XDTraderIcon = () => (
    <svg width='40.56' height='40.56' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' className='dtrader-nav-icon'>
        <defs>
            <linearGradient id='dtraderGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='50%' stopColor='#fbbf24' />
                <stop offset='100%' stopColor='#f59e0b' />
            </linearGradient>
            <radialGradient id='dtraderRadial' cx='50%' cy='50%'>
                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
            </radialGradient>
            <filter id='dtraderGlow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        
        {/* Letter D - left vertical bar */}
        <rect x='5' y='4' width='3' height='16' rx='1' fill='url(#dtraderGrad)' filter='url(#dtraderGlow)' />
        
        {/* Letter D - curved right side with segments */}
        <path 
            d='M8 4 Q19 4 19 12 Q19 20 8 20' 
            stroke='url(#dtraderGrad)' 
            strokeWidth='3' 
            fill='none' 
            strokeLinecap='round'
            filter='url(#dtraderGlow)'
        />
        
        {/* Mechanical gears on the D */}
        <circle cx='8' cy='7' r='1.5' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        <circle cx='8' cy='12' r='2' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        <circle cx='8' cy='17' r='1.5' fill='url(#dtraderRadial)' stroke='url(#dtraderGrad)' strokeWidth='0.5' />
        
        {/* Gear teeth */}
        <path d='M8 5.5L8.5 6.5L8 7.5L7.5 6.5Z' fill='#fbbf24' />
        <path d='M8 10L8.7 11L8 12L7.3 11Z' fill='#fbbf24' />
        <path d='M8 15.5L8.5 16.5L8 17.5L7.5 16.5Z' fill='#fbbf24' />
        
        {/* Mechanical pistons/connectors */}
        <line x1='8' y1='7' x2='14' y2='7' stroke='url(#dtraderGrad)' strokeWidth='1' opacity='0.7' />
        <line x1='8' y1='12' x2='16' y2='12' stroke='url(#dtraderGrad)' strokeWidth='1' opacity='0.7' />
        <line x1='8' y1='17' x2='14' y2='17' stroke='url(#dtraderGrad)' strokeWidth='1' opacity='0.7' />
        
        {/* Piston heads on curve */}
        <circle cx='14' cy='7' r='1' fill='#fbbf24' filter='url(#dtraderGlow)' />
        <circle cx='16' cy='12' r='1.2' fill='#fbbf24' filter='url(#dtraderGlow)' />
        <circle cx='14' cy='17' r='1' fill='#fbbf24' filter='url(#dtraderGlow)' />
        
        {/* Rotating outer ring segments */}
        <path d='M19 8 A8 8 0 0 1 20 12' stroke='url(#dtraderGrad)' strokeWidth='1.5' fill='none' strokeDasharray='2 2' opacity='0.6' />
        <path d='M20 12 A8 8 0 0 1 19 16' stroke='url(#dtraderGrad)' strokeWidth='1.5' fill='none' strokeDasharray='2 2' opacity='0.6' />
        
        {/* Energy nodes on outer ring */}
        <circle cx='19.5' cy='8' r='0.8' fill='#fbbf24' />
        <circle cx='20.5' cy='12' r='0.8' fill='#fbbf24' />
        <circle cx='19.5' cy='16' r='0.8' fill='#fbbf24' />
        
        {/* Inner circuit lines */}
        <line x1='10' y1='9' x2='12' y2='9' stroke='#fbbf24' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        <line x1='10' y1='15' x2='12' y2='15' stroke='#fbbf24' strokeWidth='0.5' opacity='0.5' strokeDasharray='1 1' />
        
        {/* Central power core */}
        <circle cx='13' cy='12' r='1.5' fill='url(#dtraderRadial)' filter='url(#dtraderGlow)' />
        <circle cx='13' cy='12' r='0.7' fill='#ffffff' opacity='0.9' />
        
        {/* Orbiting data particles */}
        <circle cx='11' cy='8' r='0.6' fill='#ffffff' opacity='0.8' />
        <circle cx='15' cy='10' r='0.6' fill='#ffffff' opacity='0.8' />
        <circle cx='15' cy='14' r='0.6' fill='#ffffff' opacity='0.8' />
        <circle cx='11' cy='16' r='0.6' fill='#ffffff' opacity='0.8' />
        
        <style>
            {`
                @keyframes dtraderGearRotate1 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes dtraderGearRotate2 {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(-360deg); }
                }
                @keyframes dtraderPistonPulse {
                    0%, 100% { opacity: 0.7; stroke-width: 1; }
                    50% { opacity: 1; stroke-width: 1.5; }
                }
                @keyframes dtraderPistonHeadPulse {
                    0%, 100% { r: 1; opacity: 1; }
                    50% { r: 1.3; opacity: 0.7; }
                }
                @keyframes dtraderRingRotate {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 20; }
                }
                @keyframes dtraderNodePulse {
                    0%, 100% { r: 0.8; opacity: 1; }
                    50% { r: 1; opacity: 0.6; }
                }
                @keyframes dtraderCorePulse {
                    0%, 100% { r: 1.5; opacity: 1; }
                    50% { r: 1.8; opacity: 0.7; }
                }
                @keyframes dtraderOrbitRotate {
                    0% { transform: rotate(0deg) translateX(0); }
                    100% { transform: rotate(360deg) translateX(0); }
                }
                @keyframes dtraderCircuitFlow {
                    0% { stroke-dashoffset: 0; }
                    100% { stroke-dashoffset: 10; }
                }
                
                /* Always animate - scoped to dtrader icon */
                .dtrader-nav-icon circle:nth-of-type(1),
                .dtrader-nav-icon path:nth-of-type(2) { 
                    animation: dtraderGearRotate1 4s linear infinite; 
                    transform-origin: 8px 7px;
                }
                .dtrader-nav-icon circle:nth-of-type(2),
                .dtrader-nav-icon path:nth-of-type(3) { 
                    animation: dtraderGearRotate2 3s linear infinite; 
                    transform-origin: 8px 12px;
                }
                .dtrader-nav-icon circle:nth-of-type(3),
                .dtrader-nav-icon path:nth-of-type(4) { 
                    animation: dtraderGearRotate1 4s linear infinite; 
                    transform-origin: 8px 17px;
                }
                .dtrader-nav-icon line:nth-of-type(1),
                .dtrader-nav-icon line:nth-of-type(2),
                .dtrader-nav-icon line:nth-of-type(3) { 
                    animation: dtraderPistonPulse 2s ease-in-out infinite; 
                }
                .dtrader-nav-icon circle:nth-of-type(4),
                .dtrader-nav-icon circle:nth-of-type(6) { 
                    animation: dtraderPistonHeadPulse 2s ease-in-out infinite; 
                }
                .dtrader-nav-icon circle:nth-of-type(5) { 
                    animation: dtraderPistonHeadPulse 2s ease-in-out infinite 0.3s; 
                }
                .dtrader-nav-icon path:nth-of-type(5),
                .dtrader-nav-icon path:nth-of-type(6) { 
                    animation: dtraderRingRotate 3s linear infinite; 
                }
                .dtrader-nav-icon circle:nth-of-type(7),
                .dtrader-nav-icon circle:nth-of-type(8),
                .dtrader-nav-icon circle:nth-of-type(9) { 
                    animation: dtraderNodePulse 1.5s ease-in-out infinite; 
                }
                .dtrader-nav-icon line:nth-of-type(4),
                .dtrader-nav-icon line:nth-of-type(5) { 
                    animation: dtraderCircuitFlow 2s linear infinite; 
                }
                .dtrader-nav-icon circle:nth-of-type(10) { 
                    animation: dtraderCorePulse 1.5s ease-in-out infinite; 
                }
                .dtrader-nav-icon circle:nth-of-type(12),
                .dtrader-nav-icon circle:nth-of-type(13),
                .dtrader-nav-icon circle:nth-of-type(14),
                .dtrader-nav-icon circle:nth-of-type(15) { 
                    animation: dtraderOrbitRotate 5s linear infinite; 
                    transform-origin: 13px 12px;
                }
            `}
        </style>
    </svg>
);

const FreeBotsIcon = () => (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <defs>
            <linearGradient id='freeGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <filter id='glow'>
                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                <feMerge>
                    <feMergeNode in='coloredBlur'/>
                    <feMergeNode in='SourceGraphic'/>
                </feMerge>
            </filter>
        </defs>
        {/* Robot head - rounded rectangle */}
        <rect x='6' y='3' width='12' height='11' rx='5' fill='#6b7280' opacity='0.8' />
        
        {/* Left eye - small yellow circle */}
        <circle cx='9' cy='7' r='1.5' fill='#fbbf24' filter='url(#glow)' />
        
        {/* Right eye - larger yellow circle with white center */}
        <circle cx='14' cy='8' r='2.5' fill='#fbbf24' filter='url(#glow)' />
        <circle cx='14' cy='8' r='1.2' fill='#ffffff' opacity='0.9' />
        
        {/* Neck/body connector */}
        <rect x='10.5' y='13' width='3' height='3' fill='#9ca3af' />
        
        {/* Base bars - 5 yellow vertical bars */}
        <rect x='4' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='7.5' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='11' y='17' width='2.5' height='5' rx='1' fill='#ffffff' opacity='0.9' />
        <rect x='14.5' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        <rect x='18' y='17' width='2.5' height='5' rx='1' fill='url(#freeGrad)' filter='url(#glow)' />
        
        <style>
            {`
                @keyframes eyeBlink {
                    0%, 90%, 100% { opacity: 1; }
                    95% { opacity: 0.3; }
                }
                @keyframes barPulse {
                    0%, 100% { transform: scaleY(1); }
                    50% { transform: scaleY(0.9); }
                }
            `}
        </style>
    </svg>
);

const AppWrapper = observer(() => {
    const { connectionStatus } = useApiBase();
    const { dashboard, load_modal, run_panel, summary_card } = useStore();
    const { active_tab, setActiveTab } = dashboard;
    const { onEntered } = load_modal;
    const { is_dialog_open, dialog_options, onCancelButtonClick, onCloseDialog, onOkButtonClick, stopBot } = run_panel;
    const { cancel_button_text, ok_button_text, title, message } = dialog_options as { [key: string]: string };
    const { clear } = summary_card;
    const { is_drawer_open } = run_panel;
    const { is_chart_modal_visible } = dashboard;
    const { isDesktop } = useDevice();

    type BotType = {
        title: string;
        image: string;
        filePath: string;
        xmlContent: string;
    };
    const [bots, setBots] = useState<BotType[]>([]);
    const [analysisToolUrl, setAnalysisToolUrl] = useState('ai');

    useEffect(() => {
        if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            const is_bot_running = document.getElementById('db-animation__stop-button') !== null;
            if (is_bot_running) {
                clear();
                stopBot();
                api_base.setIsRunning(false);
            }
        }
    }, [clear, connectionStatus, stopBot]);

    useEffect(() => {
        const fetchBots = async () => {
            const botFiles = [
                // Core Trading Bots
                'PATEL (with Entry).xml',
                'Game Changer AI (1).xml',
                'Game Changer AI .xml',
                'Random LDP Differ .xml',

                // CFX Series Bots
                'CFX-025-Base.xml',
                'CFX - 025.xml',
                'CFX-EvenOdd.xml',
                'CFX-RiseFall.xml',

                // Professional Trading Bots
                'Digit-Hunter-Pro.xml',
                'MatchesMaster.xml',
                'Deriv Killer.xml',
                'SpeedHunter.xml',

                // Elvis Bot Collection
                'Elvis SpeedBot(Risk-Based Martingale).xml',
                'Elvis SpeedBot(Risk-Based).xml',
                'Elvis SpeedBot(With Entry).xml',
                'Over 3 Delirium.xml',
                'Over_Under Ghost .xml',
                'Over_Under Ghost v2 .xml',
                'Flipping-Tool-2026 .xml',

                // Advanced Strategy Bots
                'Dexterator AI .xml',
                'Dexterator CFX Hit&Run.xml',
                'D6 Deriv.xml',
                'Even Odd Ghost V1 .xml',
                'updated CFX Auto-Bot .xml',

                // Specialized Bots
                'MATCHES (with Entry).xml',
                'EVENODD Double loss Bot .xml',
                'Over2 Master.xml',
                'Raziel Over Under.xml',
                'Raziel Over Under Entry Point.xml',
                'noloss bot.xml',
                'DIFF SMART BOT.xml',
                'Digit Differ Split martingale Strategy[4nd July 2022].xml',

                // Premium & Special Bots
                'AUTO C4 VOLT 🇬🇧 2 🇬🇧 AI PREMIUM ROBOT  (2) (1).xml',
                '$Dollar printer .xml',
                'M27 Auto Switch bot 2024 (1).xml',
                'GreenLight Pro - 2026 Over .xml',
                'Odins_ghost.xml',
            ];
            const botPromises = botFiles.map(async file => {
                try {
                    const response = await fetch(file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}: ${response.statusText}`);
                    }
                    const text = await response.text();
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(text, 'application/xml');
                    return {
                        title: file.split('/').pop(),
                        image: xml.getElementsByTagName('image')[0]?.textContent || 'default_image_path',
                        filePath: file,
                        xmlContent: text,
                    };
                } catch (error) {
                    console.error(error);
                    return null;
                }
            });
            const bots = (await Promise.all(botPromises)).filter(Boolean);
            setBots(bots);
        };
        fetchBots();
    }, []);

    const handleBotClick = useCallback(
        withBotLoadingErrorHandling(async bot => {
            // Validate bot object first
            const validation = BotLoadingErrorHandler.validateBotObject(bot);
            if (!validation.isValid) {
                const errorMessage = `Bot validation failed: ${validation.errors.join(', ')}`;
                console.error('❌', errorMessage);
                throw new Error(errorMessage);
            }

            console.log('🤖 Loading bot:', bot.title);

            setActiveTab(DBOT_TABS.BOT_BUILDER);

            // Validate load_modal exists and has the required method
            if (!load_modal) {
                throw new Error('load_modal is not available');
            }

            if (typeof load_modal.loadStrategyToBuilder !== 'function') {
                throw new Error('loadStrategyToBuilder is not defined on load_modal');
            }

            // Prepare strategy object with all required properties
            const strategyToLoad = {
                id: bot.filePath || `bot_${Date.now()}`, // Fallback ID if filePath is missing
                name: bot.title,
                xml: bot.xmlContent,
                save_type: 'LOCAL',
            };

            console.log('📋 Strategy to load:', {
                id: strategyToLoad.id,
                name: strategyToLoad.name,
                xmlLength: strategyToLoad.xml.length,
                save_type: strategyToLoad.save_type,
            });

            // Load the strategy with error handling
            await load_modal.loadStrategyToBuilder(strategyToLoad);

            console.log('✅ Bot loaded successfully');

            // Update workspace name if function exists
            if (typeof updateWorkspaceName === 'function') {
                updateWorkspaceName();
            } else {
                console.warn('⚠️ updateWorkspaceName function not available');
            }
        }, 'handleBotClick'),
        [setActiveTab, load_modal]
    );

    const handleOpen = useCallback(async () => {
        await load_modal.loadFileFromRecent();
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    }, [load_modal, setActiveTab]);

    const toggleAnalysisTool = (url: string) => setAnalysisToolUrl(url);

    // Listen for CFX bot load events from signals
    useEffect(() => {
        const handleCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signalType, market, prediction } = customEvent.detail;
            console.log('📥 Received CFX bot load request:', { botFile, signalType, market, prediction });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                let contractType = '';
                if (signalType === 'EVEN') {
                    contractType = 'DIGITEVEN';
                } else if (signalType === 'ODD') {
                    contractType = 'DIGITODD';
                } else if (signalType === 'RISE') {
                    contractType = 'CALL';
                } else if (signalType === 'FALL') {
                    contractType = 'PUT';
                }

                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields in CFX bots
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total CFX stake fields updated: ${stakeUpdatesCount}`);

                // Auto-set entry point based on current market data
                // await setAutoEntryPoint(xmlDoc, market, signalType); // TODO: Implement this function

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                };

                console.log('✅ Bot configured, loading into workspace...');
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running bot after configuration...');
                    try {
                        // Trigger the run button click programmatically
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                            // Alternative method: dispatch run button event
                            const runEvent = new CustomEvent('bot.auto.run');
                            window.dispatchEvent(runEvent);
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot', handleCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot', handleCFXBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for MatchesMaster bot auto-open events from Zeus Analysis
    useEffect(() => {
        const handleMatchesMasterOpen = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { predictedDigit, market } = customEvent.detail;
            console.log('📥 Received MatchesMaster auto-open request:', { predictedDigit, market });

            // Find the MatchesMaster bot in the bots array
            const matchesMasterBot = bots.find(b => b.filePath === 'MatchesMaster.xml');
            if (matchesMasterBot) {
                console.log('✅ Found MatchesMaster bot, configuring with Zeus prediction...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(matchesMasterBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update target digit in the Target Digit variable initialization
                const targetDigitFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                targetDigitFields.forEach(field => {
                    if (field.textContent === 'Target Digit') {
                        // Find the NUM field in the same block
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictedDigit.toString();
                                console.log(`🎯 Target digit set to: ${predictedDigit}`);
                            }
                        }
                    }
                });

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...matchesMasterBot,
                    xmlContent: configuredXml,
                    title: `MatchesMaster - Digit ${predictedDigit}`,
                };

                console.log('✅ MatchesMaster configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ MatchesMaster bot not found');
            }
        };

        window.addEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        return () => {
            window.removeEventListener('open.matchesmaster.bot', handleMatchesMasterOpen);
        };
    }, [bots, handleBotClick]);

    // Listen for generic signal bot load events from Advanced Algo
    useEffect(() => {
        const handleSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, botName, market, contractType, stake, prediction, signalType, confidence } =
                customEvent.detail;
            console.log('📥 Received generic signal bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                stake,
                prediction,
                signalType,
                confidence,
            });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found bot, configuring with signal parameters...');

                // Parse and configure the XML with signal parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type based on signal type
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction digit for OVER/UNDER signals
                if (prediction !== undefined) {
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    // Find the prediction field (it's in a math_number_positive block)
                    predictionFields.forEach(field => {
                        const parent = field.parentElement;
                        if (parent && parent.getAttribute('type') === 'math_number_positive') {
                            field.textContent = prediction.toString();
                            console.log(`🎯 Prediction digit set to: ${prediction}`);
                        }
                    });
                }

                // Update stake using StakeManager (overrides XML defaults)
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    // Look for stake-related NUM fields
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Check if this is the initial stake field by looking at the block ID
                        const blockId = parentBlock.getAttribute('id');
                        if (blockId === 'initial_stake_value' || blockId?.includes('stake')) {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} - ${signalType} (${confidence}%)`,
                };

                console.log('✅ Generic bot configured, loading into workspace...');
                await handleBotClick(configuredBot);
            } else {
                console.error('❌ Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot', handleSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot', handleSignalBotLoad);
        };
    }, [bots, handleBotClick]);

    // Listen for enhanced CFX bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedCFXBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced CFX bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced CFX bot loaded successfully');

                // Auto-run the bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced CFX bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced CFX bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced CFX bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced CFX bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ CFX Bot not found:', botFile);
            }
        };

        window.addEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        return () => {
            window.removeEventListener('load.cfx.bot.enhanced', handleEnhancedCFXBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced Elvis bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedElvisBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced Elvis bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Elvis bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced Elvis bot loaded successfully');

                // Auto-run the Elvis bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced Elvis bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced Elvis bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced Elvis bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced Elvis bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Elvis Bot not found:', botFile);
            }
        };

        window.addEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        return () => {
            window.removeEventListener('load.elvis.bot.enhanced', handleEnhancedElvisBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced signal bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedSignalBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🚀 Received enhanced signal bot load request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found signal bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot directly
                await handleBotClick(bot);

                console.log('✅ Enhanced signal bot loaded successfully');

                // Auto-run the signal bot if autoLoaded is true
                if (autoLoaded) {
                    setTimeout(() => {
                        console.log('🚀 Auto-running enhanced signal bot...');
                        try {
                            const runButton = document.getElementById('db-animation__run-button');
                            if (runButton) {
                                runButton.click();
                                console.log('✅ Enhanced signal bot auto-started successfully');
                            } else {
                                console.warn('⚠️ Run button not found for enhanced signal bot');
                            }
                        } catch (error) {
                            console.error('❌ Failed to auto-run enhanced signal bot:', error);
                        }
                    }, 2000);
                }
            } else {
                console.error('❌ Signal Bot not found:', botFile);
            }
        };

        window.addEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        return () => {
            window.removeEventListener('load.signal.bot.enhanced', handleEnhancedSignalBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for enhanced PATEL bot loading events from Advanced Algorithm
    useEffect(() => {
        const handleEnhancedPatelBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded, barrier, recoveryStrategy } = customEvent.detail;

            console.log('🎯 Received enhanced PATEL bot load request:', {
                botFile,
                signal: signal.prediction,
                barrier,
                recoveryStrategy: recoveryStrategy
                    ? {
                          predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                          predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                          strategy: recoveryStrategy.strategy,
                      }
                    : null,
                market: signal.market,
                confidence: signal.confidence,
                autoLoaded,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with adaptive recovery logic...');

                // Parse and configure the XML with proper OVER/UNDER handling
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = signal.market;
                    console.log(`📊 Market set to: ${signal.market}`);
                });

                // Update contract type based on signal type
                const contractType = signal.prediction.includes('OVER') ? 'DIGITOVER' : 'DIGITUNDER';
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                // Also update PURCHASE_LIST fields (in purchase blocks)
                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Set the barrier value
                if (barrier) {
                    const barrierFields = xmlDoc.querySelectorAll('field[name="BARRIER"]');
                    barrierFields.forEach(field => {
                        field.textContent = barrier.toString();
                        console.log(`🎯 Barrier set to: ${barrier}`);
                    });
                }

                // Configure Adaptive Recovery Strategy - Prediction Before/After Loss
                if (recoveryStrategy) {
                    console.log('🧠 Configuring Adaptive Recovery Strategy...');

                    // Find and update prediction before loss
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        const varName = field.textContent;
                        const block = field.closest('block[type="variables_set"]');

                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');

                            if (varName === 'Prediction Before Loss' || varName === 'Initial Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                    console.log(
                                        `🎯 Prediction Before Loss set to: ${recoveryStrategy.predictionBeforeLoss}`
                                    );
                                }
                            } else if (varName === 'Prediction After Loss' || varName === 'Recovery Prediction') {
                                if (numField) {
                                    numField.textContent = recoveryStrategy.predictionAfterLoss.toString();
                                    console.log(
                                        `🔄 Prediction After Loss set to: ${recoveryStrategy.predictionAfterLoss}`
                                    );
                                }
                            }
                        }
                    });

                    // Also look for direct prediction fields in the bot logic
                    const predictionFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                    predictionFields.forEach(field => {
                        const parentBlock = field.closest('block');
                        if (parentBlock) {
                            const blockType = parentBlock.getAttribute('type');
                            const blockId = parentBlock.getAttribute('id');

                            // Look for prediction-related blocks
                            if (blockId && (blockId.includes('prediction') || blockId.includes('digit'))) {
                                // This might be a prediction field - we'll set it to the before loss value
                                field.textContent = recoveryStrategy.predictionBeforeLoss.toString();
                                console.log(
                                    `🎯 Prediction field set to: ${recoveryStrategy.predictionBeforeLoss} (before loss)`
                                );
                            }
                        }
                    });

                    console.log(`✅ Adaptive Recovery configured:`, {
                        predictionBeforeLoss: recoveryStrategy.predictionBeforeLoss,
                        predictionAfterLoss: recoveryStrategy.predictionAfterLoss,
                        winProbBeforeLoss: `${recoveryStrategy.winProbabilities.beforeLoss}%`,
                        winProbAfterLoss: `${recoveryStrategy.winProbabilities.afterLoss}%`,
                        strategy: recoveryStrategy.strategy,
                    });
                }

                // For PATEL bot, we should NOT set hardcoded prediction digits
                // Instead, let the bot use its entry point detection logic
                console.log('ℹ️ PATEL bot will use entry point detection with adaptive recovery');

                // Update Search Number (entry point digit) if provided
                if (signal.entryDigit) {
                    const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                    variableFields.forEach(field => {
                        if (field.textContent === 'Search Number') {
                            const block = field.closest('block[type="variables_set"]');
                            if (block) {
                                const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                                if (numField) {
                                    numField.textContent = signal.entryDigit.toString();
                                    console.log(`🔍 Search Number set to: ${signal.entryDigit}`);
                                }
                            }
                        }
                    });
                }

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${bot.title} - ${signal.prediction} (${signal.confidence}%)`,
                };

                console.log('✅ PATEL bot configured with proper OVER/UNDER logic, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        // Validate bot configuration before loading
                        if (!configuredBot) {
                            console.error('❌ Configured bot is undefined');
                            return;
                        }

                        if (!configuredBot.xmlContent) {
                            console.error('❌ Configured bot XML content is missing');
                            return;
                        }

                        console.log('🚀 Loading configured PATEL bot...');
                        await handleBotClick(configuredBot);
                        console.log('✅ Enhanced PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading enhanced PATEL bot:', error);

                        // Provide specific guidance for PATEL bot loading issues
                        console.error('💡 PATEL bot loading failed. Troubleshooting steps:');
                        console.error('   1. Check if Bot Builder tab is accessible');
                        console.error('   2. Verify PATEL bot XML file exists in public folder');
                        console.error('   3. Try loading a different bot first to test the system');
                        console.error('   4. Refresh the page and try again');

                        // Attempt recovery by switching to bot builder tab
                        try {
                            console.log('🔄 Attempting recovery by switching to Bot Builder...');
                            setActiveTab(DBOT_TABS.BOT_BUILDER);
                        } catch (recoveryError) {
                            console.error('❌ Recovery attempt failed:', recoveryError);
                        }
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        return () => {
            window.removeEventListener('load.patel.bot.enhanced', handleEnhancedPatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Raziel Over Under bot loading events from Zeus AI
    useEffect(() => {
        const handleRazielBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_RAZIEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received Raziel Over Under bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the Raziel Over Under bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found Raziel Over Under bot, configuring with Zeus parameters...');

                // Parse and configure the XML with Zeus parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss
                const predictionBeforeLossFields = xmlDoc.querySelectorAll(
                    'block[type="variables_set"] field[name="VAR"]'
                );
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'prediction after l oss') {
                        // Note: there's a space in the XML
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update entry point digit
                predictionBeforeLossFields.forEach(field => {
                    if (field.textContent === 'Entry Point Digit') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Update stake using StakeManager
                const { stakeManager } = await import('@/services/stake-manager.service');
                const currentStake = stakeManager.getStake();

                const stakeFields = xmlDoc.querySelectorAll('field[name="NUM"]');
                let stakeUpdatesCount = 0;

                stakeFields.forEach(field => {
                    const parentBlock = field.closest('block');
                    if (parentBlock && parentBlock.getAttribute('type') === 'math_number') {
                        // Look for stake-related fields
                        const prevSibling = field.parentElement?.previousElementSibling;
                        if (prevSibling && prevSibling.textContent === 'Stake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated stake to ${currentStake} (from StakeManager)`);
                        }
                        if (prevSibling && prevSibling.textContent === 'initalStake') {
                            field.textContent = currentStake.toString();
                            stakeUpdatesCount++;
                            console.log(`💰 Updated initial stake to ${currentStake} (from StakeManager)`);
                        }
                    }
                });

                console.log(`💰 Total Raziel stake fields updated: ${stakeUpdatesCount}`);

                // Serialize back to XML
                const serializer = new XMLSerializer();
                const configuredXml = serializer.serializeToString(xmlDoc);

                // Create a configured bot object
                const configuredBot = {
                    ...bot,
                    xmlContent: configuredXml,
                    title: `${botName} (${strategy} ${selectedDigit} | Entry: ${entryPointDigit})`,
                };

                console.log('✅ Raziel Over Under bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Load the bot
                await handleBotClick(configuredBot);

                // Auto-run the bot after loading (with a small delay to ensure it's fully loaded)
                setTimeout(() => {
                    console.log('🚀 Auto-running Raziel Over Under bot after configuration...');
                    try {
                        const runButton = document.getElementById('db-animation__run-button');
                        if (runButton) {
                            runButton.click();
                            console.log('✅ Raziel Over Under bot auto-started successfully');
                        } else {
                            console.warn('⚠️ Run button not found, trying alternative method...');
                        }
                    } catch (error) {
                        console.error('❌ Failed to auto-run Raziel Over Under bot:', error);
                    }
                }, 2000); // 2 second delay to ensure bot is fully loaded
            } else {
                console.error('❌ Raziel Over Under bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
        window.addEventListener('message', handleRazielBotLoad);
        return () => {
            window.removeEventListener('LOAD_RAZIEL_BOT', handleRazielBotLoad);
            window.removeEventListener('message', handleRazielBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for PATEL bot loading events from Zeus AI
    useEffect(() => {
        const handlePatelBotLoad = async (event: Event) => {
            let eventData;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_PATEL_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            } = eventData;

            console.log('🎯 Received PATEL bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
            });

            // Find the PATEL bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found PATEL bot, configuring with digit parameters...');

                // Parse and configure the XML with digit parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update contract type (TYPE_LIST and PURCHASE_LIST)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update prediction before loss (exact variable name from PATEL bot)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionBeforeLoss.toString();
                                console.log(`🎯 Prediction before loss set to: ${predictionBeforeLoss}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = predictionAfterLoss.toString();
                                console.log(`🎯 Prediction after loss set to: ${predictionAfterLoss}`);
                            }
                        }
                    }
                });

                // Update Search Number (entry point digit - exact variable name from PATEL bot)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = entryPointDigit.toString();
                                console.log(`🎯 Search Number (Entry Point) set to: ${entryPointDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ PATEL bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ PATEL bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading PATEL bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
        window.addEventListener('message', handlePatelBotLoad);
        return () => {
            window.removeEventListener('LOAD_PATEL_BOT', handlePatelBotLoad);
            window.removeEventListener('message', handlePatelBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for MATCHES bot load events from AI Analysis Tool
    useEffect(() => {
        const handleMatchesBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_MATCHES_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            } = eventData;

            console.log('🎲 Received MATCHES bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                predictionBeforeLoss,
                predictionAfterLoss,
                selectedDigit,
                entryPointDigit,
                strategy,
                targetDigit,
            });

            // Find the MATCHES bot XML file (we'll use PATEL as template and modify it)
            const templateBot = bots.find(b => b.filePath === 'PATEL (with Entry).xml');
            if (templateBot) {
                console.log('✅ Found PATEL template, configuring for MATCHES mode...');

                // Parse and configure the XML for MATCHES mode
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(templateBot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "matches"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'matches';
                    console.log(`🎲 Trade type set to: matches`);
                });

                // Update contract type to DIGITMATCHES
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`📝 Contract type set to: DIGITMATCHES`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = 'DIGITMATCHES';
                    console.log(`💰 Purchase type set to: DIGITMATCHES`);
                });

                // Update prediction before loss (should equal target digit)
                const variableFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction before loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction before loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update prediction after loss (should equal target digit)
                variableFields.forEach(field => {
                    if (field.textContent === 'prediction after loss') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Prediction after loss set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Update search number (entry point digit - same as target for matches)
                variableFields.forEach(field => {
                    if (field.textContent === 'Search Number') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField) {
                                numField.textContent = targetDigit.toString();
                                console.log(`🎯 Entry Point Digit set to: ${targetDigit}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Create a new bot object for MATCHES mode
                const matchesBot = {
                    ...templateBot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                    filePath: 'MATCHES (with Entry).xml', // Use MATCHES file path
                };

                console.log('✅ MATCHES bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(matchesBot);
                        console.log('✅ MATCHES bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading MATCHES bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ PATEL template bot not found for MATCHES configuration');
            }
        };

        window.addEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
        window.addEventListener('message', handleMatchesBotLoad);
        return () => {
            window.removeEventListener('LOAD_MATCHES_BOT', handleMatchesBotLoad);
            window.removeEventListener('message', handleMatchesBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for EVEN/ODD bot loading events from Zeus AI
    useEffect(() => {
        const handleEvenOddBotLoad = async (event: Event) => {
            let eventData: any;

            // Handle both CustomEvent and MessageEvent
            if (event instanceof MessageEvent) {
                // Handle postMessage from AI tool iframe
                if (event.data.type === 'LOAD_EVEN_ODD_BOT') {
                    eventData = event.data.data;
                } else {
                    return; // Not our message
                }
            } else {
                // Handle CustomEvent
                const customEvent = event as CustomEvent;
                eventData = customEvent.detail;
            }

            const {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
                stake,
                martingale,
                maxMartingaleSteps,
            } = eventData;

            console.log('⚪⚫ Received EVEN/ODD bot load request:', {
                botFile,
                botName,
                market,
                contractType,
                tradeType,
                selectedDigit,
                entryPointDigit,
                evenOddType,
                strategy,
            });

            // Find the CFX-EvenOdd bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found CFX-EvenOdd bot, configuring with parameters...');

                // Parse and configure the XML with even/odd parameters
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(bot.xmlContent, 'text/xml');

                // Update market (SYMBOL_LIST)
                const symbolFields = xmlDoc.querySelectorAll('field[name="SYMBOL_LIST"]');
                symbolFields.forEach(field => {
                    field.textContent = market;
                    console.log(`📊 Market set to: ${market}`);
                });

                // Update trade type to "digits"
                const tradeTypeFields = xmlDoc.querySelectorAll('field[name="TRADETYPE_LIST"]');
                tradeTypeFields.forEach(field => {
                    field.textContent = 'digits';
                    console.log(`⚪⚫ Trade type set to: digits`);
                });

                // Update contract type (DIGITEVEN or DIGITODD)
                const typeFields = xmlDoc.querySelectorAll('field[name="TYPE_LIST"]');
                typeFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`📝 Contract type set to: ${contractType}`);
                });

                const purchaseFields = xmlDoc.querySelectorAll('field[name="PURCHASE_LIST"]');
                purchaseFields.forEach(field => {
                    field.textContent = contractType;
                    console.log(`💰 Purchase type set to: ${contractType}`);
                });

                // Update stake amount if available
                const stakeFields = xmlDoc.querySelectorAll('block[type="variables_set"] field[name="VAR"]');
                stakeFields.forEach(field => {
                    if (field.textContent === 'stake' || field.textContent === 'initial_stake') {
                        const block = field.closest('block[type="variables_set"]');
                        if (block) {
                            const numField = block.querySelector('block[type="math_number"] field[name="NUM"]');
                            if (numField && stake) {
                                numField.textContent = stake.toString();
                                console.log(`💰 Stake set to: ${stake}`);
                            }
                        }
                    }
                });

                // Serialize the updated XML
                const serializer = new XMLSerializer();
                const updatedXmlContent = serializer.serializeToString(xmlDoc);

                // Update the bot object with new XML content
                const updatedBot = {
                    ...bot,
                    xmlContent: updatedXmlContent,
                    displayName: botName,
                };

                console.log('✅ EVEN/ODD bot configured, loading into workspace...');

                // Switch to Bot Builder tab first
                setActiveTab(1); // BOT_BUILDER is at index 1

                // Load the bot with a slight delay to ensure tab switch completes
                setTimeout(async () => {
                    try {
                        await handleBotClick(updatedBot);
                        console.log('✅ EVEN/ODD bot loaded successfully');
                    } catch (error) {
                        console.error('❌ Error loading EVEN/ODD bot:', error);
                    }
                }, 300);
            } else {
                console.error('❌ CFX-EvenOdd bot not found:', botFile);
            }
        };

        window.addEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
        window.addEventListener('message', handleEvenOddBotLoad);
        return () => {
            window.removeEventListener('LOAD_EVEN_ODD_BOT', handleEvenOddBotLoad);
            window.removeEventListener('message', handleEvenOddBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for auto load bot events from Advanced Algorithm
    useEffect(() => {
        const handleAutoLoadBot = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { botFile, signal, autoLoaded } = customEvent.detail;
            console.log('🤖 Received auto load bot request:', { botFile, signal, autoLoaded });

            // Find the bot in the bots array
            const bot = bots.find(b => b.filePath === botFile);
            if (bot) {
                console.log('✅ Found auto-load bot, loading directly into Bot Builder...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(bot);
                    console.log('✅ Auto-load bot loaded successfully');
                }, 100);
            } else {
                console.error('❌ Auto-load Bot not found:', botFile);
            }
        };

        window.addEventListener('auto.load.bot', handleAutoLoadBot);
        return () => {
            window.removeEventListener('auto.load.bot', handleAutoLoadBot);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for Fibonacci bot loading events from Raziel Bot Loader
    useEffect(() => {
        const handleFibonacciBotLoad = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const { xmlContent, botName, market, parameters } = customEvent.detail;
            console.log('🎯 Received Fibonacci bot load request:', { botName, market, parameters });

            try {
                // Create a bot object with the configured XML
                const fibonacciBot = {
                    id: 'raziel-over-under-fibonacci',
                    filePath: 'Raziel Over Under.xml',
                    title: botName || 'Raziel Over Under (Fibonacci Configured)',
                    xmlContent: xmlContent,
                    save_type: 'LOCAL',
                };

                console.log('✅ Loading Fibonacci-configured Raziel Over Under bot...');

                // Switch to Bot Builder tab first
                setActiveTab(DBOT_TABS.BOT_BUILDER);

                // Small delay to ensure tab switch completes
                setTimeout(async () => {
                    await handleBotClick(fibonacciBot);
                    console.log('✅ Fibonacci Raziel Over Under bot loaded successfully');
                }, 300);
            } catch (error) {
                console.error('❌ Failed to load Fibonacci bot:', error);
            }
        };

        // Listen for both events
        window.addEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
        window.addEventListener('load.bot.from.freebots', handleFibonacciBotLoad);

        return () => {
            window.removeEventListener('load.fibonacci.bot', handleFibonacciBotLoad);
            window.removeEventListener('load.bot.from.freebots', handleFibonacciBotLoad);
        };
    }, [bots, handleBotClick, setActiveTab]);

    // Listen for tab switching events from components
    useEffect(() => {
        const handleTabSwitch = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { tab } = customEvent.detail;
            console.log('📋 Received tab switch request to tab:', tab);

            if (typeof tab === 'number') {
                setActiveTab(tab);
            }
        };

        // Test the CFX bot loading functionality
        const testCFXBotLoading = () => {
            console.log('🧪 Testing CFX bot loading functionality...');

            const mockSignal = {
                market: '1HZ100V',
                marketName: 'Volatility 100 (1s) Index',
                currentPrice: 1234.56789,
                confidence: 85.2,
                recommendation: {
                    action: 'OVER',
                    barrier: 3,
                    reasoning: 'Strong Fibonacci support at 61.8% level with ranging market conditions.',
                },
                analysis: {
                    volatility: 0.65,
                    trendStrength: 0.25,
                    rangingScore: 0.82,
                    fibonacciAlignment: 0.91,
                },
                fibonacciLevels: [
                    { level: 0.236, price: 1230.12345, type: 'support' },
                    { level: 0.618, price: 1234.56789, type: 'resistance' },
                ],
            };

            // Simulate the CFX bot loading
            const loadEvent = new CustomEvent('load.fibonacci.bot', {
                detail: {
                    xmlContent: '<xml>test</xml>',
                    botName: 'CFX-025 Fibonacci Test',
                    market: mockSignal.market,
                    parameters: mockSignal,
                },
            });

            window.dispatchEvent(loadEvent);
            console.log('✅ CFX bot loading test event dispatched');
        };

        // Add test function to window for debugging
        if (typeof window !== 'undefined') {
            (window as any).testCFXBotLoading = testCFXBotLoading;
        }

        window.addEventListener('switch.tab', handleTabSwitch);
        return () => {
            window.removeEventListener('switch.tab', handleTabSwitch);
        };
    }, [setActiveTab]);

    const showRunPanel = [
        DBOT_TABS.BOT_BUILDER,
        DBOT_TABS.CHART,
        DBOT_TABS.PATEL_SIGNALS,
        DBOT_TABS.PATEL_SIGNAL_CENTER,
        DBOT_TABS.ANALYSIS_TOOL,
        DBOT_TABS.SIGNALS,
    ].includes(active_tab);

    return (
        <>
            <div className='main'>
                <div className='main__container'>
                    <Tabs
                        active_index={active_tab}
                        className='main__tabs dc-tabs--enhanced'
                        onTabItemChange={onEntered}
                        onTabItemClick={setActiveTab}
                        top
                    >
                        {/* Note: Tab order matches DBOT_TABS indices in bot-contents.ts */}
                        {/* 0. FREE BOTS TAB - Will be moved here from line 2557 */}
                        {/* 1. BOT BUILDER TAB */}
                        <div
                            label={
                                <>
                                    <BotBuilderIcon />
                                    <Localize i18n_default_text='Bot Builder' />
                                </>
                            }
                            id='id-bot-builder'
                        />
                        {/* 2. DASHBOARD TAB */}
                        <div
                            label={
                                <>
                                    <DashboardIcon />
                                    <Localize i18n_default_text='Dashboard' />
                                </>
                            }
                            id='id-dbot-dashboard'
                        >
                            <Dashboard handleTabChange={setActiveTab} />
                            <button onClick={handleOpen}>Load Bot</button>
                        </div>
                        {/* 3. CHARTS TAB */}
                        <div
                            label={
                                <>
                                    <ChartsIcon />
                                    <Localize i18n_default_text='Charts' />
                                </>
                            }
                            id='id-charts'
                        >
                            <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                                <Chart show_digits_stats={false} />
                            </Suspense>
                        </div>
                        {/* 4. TUTORIALS TAB */}
                        <div
                            label={
                                <>
                                    <TutorialsIcon />
                                    <Localize i18n_default_text='Tutorials' />
                                </>
                            }
                            id='id-tutorials'
                        >
                            <Suspense
                                fallback={<ChunkLoader message={localize('Please wait, loading tutorials...')} />}
                            >
                                <Tutorial handleTabChange={setActiveTab} />
                            </Suspense>
                        </div>
                        {/* ANALYSIS TOOL TAB */}
                        <div
                            label={
                                <>
                                    <AnalysisToolIcon />
                                    <Localize i18n_default_text='Analysis Tool' />
                                </>
                            }
                            id='id-analysis-tool'
                        >
                            <div
                                className={classNames('dashboard__chart-wrapper', {
                                    'dashboard__chart-wrapper--expanded': is_drawer_open && isDesktop,
                                    'dashboard__chart-wrapper--modal': is_chart_modal_visible && isDesktop,
                                })}
                                style={{
                                    height: 'calc(100vh - 120px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    position: 'fixed',
                                    top: '120px',
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '4px',
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                        backdropFilter: 'blur(20px)',
                                        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
                                        boxShadow:
                                            '0 4px 32px rgba(0, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        flexShrink: 0,
                                    }}
                                >
                                    {/* Animated background grid */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundImage: `
                                                linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                                                linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
                                            `,
                                            backgroundSize: '20px 20px',
                                            animation: 'gridMove 20s linear infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    {/* Holographic scan line */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background:
                                                'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)',
                                            animation: 'scanLine 3s ease-in-out infinite',
                                            pointerEvents: 'none',
                                        }}
                                    />

                                    <button
                                        onClick={() => toggleAnalysisTool('internal')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'internal'
                                                    ? 'linear-gradient(135deg, #00ffff 0%, #0080ff 50%, #8000ff 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)',
                                            color: analysisToolUrl === 'internal' ? '#000000' : '#00ffff',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'internal'
                                                    ? '1px solid #00ffff'
                                                    : '1px solid rgba(0, 255, 255, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'internal'
                                                    ? '0 0 20px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 255, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 128, 255, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'internal') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 128, 255, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.2)';
                                                e.currentTarget.style.color = '#00ffff';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'internal' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>◉ ADVANCED</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ai')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ai'
                                                    ? 'linear-gradient(135deg, #ff0080 0%, #ff8000 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ai' ? '#000000' : '#ff0080',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ai'
                                                    ? '1px solid #ff0080'
                                                    : '1px solid rgba(255, 0, 128, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ai'
                                                    ? '0 0 20px rgba(255, 0, 128, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(255, 0, 128, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.2) 0%, rgba(255, 128, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 0, 128, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ai') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(255, 128, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 0, 128, 0.2)';
                                                e.currentTarget.style.color = '#ff0080';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ai' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>⚡ ZEUS AI</span>
                                    </button>

                                    <button
                                        onClick={() => toggleAnalysisTool('ldpanalyzer')}
                                        style={{
                                            flex: 1,
                                            position: 'relative',
                                            background:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? 'linear-gradient(135deg, #00ff00 0%, #80ff00 50%, #ffff00 100%)'
                                                    : 'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)',
                                            color: analysisToolUrl === 'ldpanalyzer' ? '#000000' : '#00ff00',
                                            padding: '8px 16px',
                                            border:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '1px solid #00ff00'
                                                    : '1px solid rgba(0, 255, 0, 0.3)',
                                            borderRadius: '0',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow:
                                                analysisToolUrl === 'ldpanalyzer'
                                                    ? '0 0 20px rgba(0, 255, 0, 0.5), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                                                    : '0 0 10px rgba(0, 255, 0, 0.2)',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            clipPath: 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)',
                                        }}
                                        onMouseEnter={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.2) 0%, rgba(128, 255, 0, 0.1) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 0, 0.4)';
                                                e.currentTarget.style.color = '#ffffff';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (analysisToolUrl !== 'ldpanalyzer') {
                                                e.currentTarget.style.background =
                                                    'linear-gradient(135deg, rgba(0, 255, 0, 0.1) 0%, rgba(128, 255, 0, 0.05) 100%)';
                                                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.2)';
                                                e.currentTarget.style.color = '#00ff00';
                                            }
                                        }}
                                    >
                                        {/* Button glow effect */}
                                        {analysisToolUrl === 'ldpanalyzer' && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    background:
                                                        'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.2) 50%, transparent 70%)',
                                                    animation: 'shimmer 2s infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />
                                        )}
                                        <span style={{ position: 'relative', zIndex: 1 }}>▲ LDP SCAN</span>
                                    </button>

                                    {/* Add CSS animations */}
                                    <style>
                                        {`
                                            @keyframes gridMove {
                                                0% { transform: translate(0, 0); }
                                                100% { transform: translate(20px, 20px); }
                                            }
                                            
                                            @keyframes scanLine {
                                                0% { left: -100%; }
                                                50% { left: 100%; }
                                                100% { left: -100%; }
                                            }
                                            
                                            @keyframes shimmer {
                                                0% { transform: translateX(-100%); }
                                                100% { transform: translateX(100%); }
                                            }
                                            
                                            @keyframes pulse {
                                                0%, 100% { opacity: 1; }
                                                50% { opacity: 0.7; }
                                            }
                                        `}
                                    </style>
                                </div>
                                <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                                    {analysisToolUrl === 'internal' ? (
                                        <div style={{ height: '100%', overflowY: 'auto', padding: '0' }}>
                                            <AnalysisTool />
                                        </div>
                                    ) : analysisToolUrl === 'ai' ? (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    ) : analysisToolUrl === 'ldpanalyzer' ? (
                                        <div
                                            style={{
                                                height: '100%',
                                                background:
                                                    'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#00ff00',
                                                fontFamily: 'monospace',
                                                position: 'relative',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Animated background grid */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    right: 0,
                                                    bottom: 0,
                                                    backgroundImage: `
                                                        linear-gradient(rgba(0, 255, 0, 0.03) 1px, transparent 1px),
                                                        linear-gradient(90deg, rgba(0, 255, 0, 0.03) 1px, transparent 1px)
                                                    `,
                                                    backgroundSize: '30px 30px',
                                                    animation: 'gridMove 25s linear infinite',
                                                    pointerEvents: 'none',
                                                }}
                                            />

                                            {/* Scanning lines */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '60%',
                                                    left: 0,
                                                    right: 0,
                                                    height: '2px',
                                                    background:
                                                        'linear-gradient(90deg, transparent, #00ff00, transparent)',
                                                    animation: 'scanVertical 4s ease-in-out infinite 2s',
                                                    boxShadow: '0 0 10px #00ff00',
                                                }}
                                            />

                                            {/* Central content */}
                                            <div
                                                style={{
                                                    textAlign: 'center',
                                                    zIndex: 10,
                                                    background: 'rgba(0, 0, 0, 0.8)',
                                                    padding: '40px',
                                                    borderRadius: '0',
                                                    border: '2px solid #00ff00',
                                                    clipPath:
                                                        'polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)',
                                                    boxShadow:
                                                        '0 0 30px rgba(0, 255, 0, 0.3), inset 0 0 30px rgba(0, 255, 0, 0.1)',
                                                    animation: 'pulse 3s ease-in-out infinite',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: '48px',
                                                        marginBottom: '20px',
                                                        animation: 'rotate 10s linear infinite',
                                                    }}
                                                >
                                                    ▲
                                                </div>
                                                <h2
                                                    style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        marginBottom: '16px',
                                                        letterSpacing: '3px',
                                                        textTransform: 'uppercase',
                                                        textShadow: '0 0 10px #00ff00',
                                                    }}
                                                >
                                                    LDP SCANNER
                                                </h2>
                                                <p
                                                    style={{
                                                        fontSize: '14px',
                                                        opacity: 0.8,
                                                        marginBottom: '24px',
                                                        letterSpacing: '1px',
                                                    }}
                                                >
                                                    LAST DIGIT PREDICTION ANALYSIS SYSTEM
                                                </p>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        gap: '20px',
                                                        marginBottom: '20px',
                                                    }}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            STATUS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>ONLINE</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            ACCURACY
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>87.3%</div>
                                                    </div>
                                                    <div style={{ textAlign: 'center' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                            SCANS
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#00ff00' }}>1,247</div>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '12px',
                                                        opacity: 0.6,
                                                        animation: 'blink 2s infinite',
                                                    }}
                                                >
                                                    [ INITIALIZING QUANTUM ANALYSIS ENGINE... ]
                                                </div>
                                            </div>

                                            {/* Corner decorations */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderBottom: 'none',
                                                    animation: 'pulse 2s infinite 0.5s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    left: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderRight: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1s',
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    right: '20px',
                                                    width: '40px',
                                                    height: '40px',
                                                    border: '2px solid #00ff00',
                                                    borderLeft: 'none',
                                                    borderTop: 'none',
                                                    animation: 'pulse 2s infinite 1.5s',
                                                }}
                                            />

                                            {/* Additional CSS for LDP Scanner */}
                                            <style>
                                                {`
                                                    @keyframes scanVertical {
                                                        0% { top: 0%; opacity: 0; }
                                                        50% { opacity: 1; }
                                                        100% { top: 100%; opacity: 0; }
                                                    }
                                                    
                                                    @keyframes rotate {
                                                        0% { transform: rotate(0deg); }
                                                        100% { transform: rotate(360deg); }
                                                    }
                                                    
                                                    @keyframes blink {
                                                        0%, 50% { opacity: 0.6; }
                                                        51%, 100% { opacity: 0.2; }
                                                    }
                                                `}
                                            </style>
                                        </div>
                                    ) : (
                                        <iframe
                                            src={analysisToolUrl}
                                            width='100%'
                                            style={{
                                                border: 'none',
                                                display: 'block',
                                                height: '100%',
                                                background: '#f8fafc',
                                            }}
                                            scrolling='yes'
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* ZEUS ANALYSIS TAB - MOVED TO ANALYSIS TOOL */}
                        {/* SIGNALS TAB */}
                        <div
                            label={
                                <>
                                    <SignalsIcon />
                                    <Localize i18n_default_text='Signals' />
                                    <span className='tab-badge'>10</span>
                                </>
                            }
                            id='id-signals'
                        >
                            <ProtectedSignalsCenter />
                        </div>
                        {/* DTRADER TAB */}
                        <div
                            label={
                                <>
                                    <XDTraderIcon />
                                    <Localize i18n_default_text='DTrader' />
                                </>
                            }
                            id='id-xdtrader'
                        >
                            <div
                                className='xdtrader-container'
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden',
                                }}
                            >
                                <iframe
                                    src='https://deriv-dtrader.vercel.app'
                                    title='DTrader - Professional Trading Platform'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                    }}
                                    allow='clipboard-read; clipboard-write'
                                    sandbox='allow-same-origin allow-scripts allow-forms allow-popups allow-modals'
                                />
                            </div>
                        </div>
                        {/* FREE BOTS TAB */}
                        <div
                            label={
                                <>
                                    <FreeBotsIcon />
                                    <Localize i18n_default_text='Free Bots' />
                                </>
                            }
                            id='id-free-bots'
                        >
                            <div
                                className='free-bots-container'
                                style={{
                                    background: '#ffffff',
                                    position: 'fixed',
                                    top: '120px',
                                    left: 0,
                                    right: 0,
                                    bottom: '100px',
                                    width: '100%',
                                    padding: '1.5rem 2rem',
                                    margin: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                }}
                            >
                                {/* Social Media Icons */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '0.6rem',
                                        marginBottom: '1.2rem',
                                        flexShrink: 0,
                                    }}
                                >
                                    <a
                                        href='https://www.youtube.com/@bonniemurigi'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#FF0000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        ▶
                                    </a>
                                    <a
                                        href='https://www.instagram.com/bonnie_binary?igsh=cHAwNGJiNXoxNGo='
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background:
                                                'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        📷
                                    </a>
                                    <a
                                        href='https://wa.me/254799094649'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#25D366',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        💬
                                    </a>
                                    <a
                                        href='https://tiktok.com/@bonniemurigi'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#000000',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        🎵
                                    </a>
                                    <a
                                        href='https://t.me/Binovate'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#0088cc',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            fontSize: '20px',
                                            textDecoration: 'none',
                                            transition: 'transform 0.2s ease',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                                    >
                                        ✈️
                                    </a>
                                </div>

                                {/* FREE BOTS SECTION */}
                                <h2
                                    style={{
                                        color: '#1f2937',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        marginBottom: '0.5rem',
                                        textAlign: 'left',
                                        flexShrink: 0,
                                    }}
                                >
                                    Bot Collection
                                </h2>
                                <p
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginBottom: '1.5rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    Premium bots and advanced trading strategies
                                </p>
                                <div
                                    className='free-bots-grid'
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                        gap: '1.2rem',
                                        marginBottom: '2rem',
                                    }}
                                >
                                    {bots
                                        .filter(bot => !bot.title.includes('PREMIUM'))
                                        .map((bot, index) => {
                                            // Function to get icon and description based on bot name
                                            const getBotInfo = name => {
                                                const lowerName = name.toLowerCase();

                                                // Icon selection based on keywords
                                                let icon = '🤖';
                                                let description =
                                                    'Advanced automated trading strategy with optimized entry and exit points';

                                                if (lowerName.includes('patel')) {
                                                    icon = '👨‍💼';
                                                    description =
                                                        'Professional trading strategy with precise entry points and risk management';
                                                } else if (
                                                    lowerName.includes('game changer') ||
                                                    lowerName.includes('gamechanger')
                                                ) {
                                                    icon = '🎮';
                                                    description =
                                                        'Revolutionary AI-powered strategy that adapts to market conditions';
                                                } else if (lowerName.includes('cfx')) {
                                                    icon = '⚡';
                                                    description =
                                                        'High-speed CFX trading with advanced pattern recognition';
                                                } else if (
                                                    lowerName.includes('digit') &&
                                                    lowerName.includes('hunter')
                                                ) {
                                                    icon = '🎯';
                                                    description =
                                                        'Precision digit prediction with advanced hunting algorithms';
                                                } else if (
                                                    lowerName.includes('matches') ||
                                                    lowerName.includes('match')
                                                ) {
                                                    icon = '🔥';
                                                    description =
                                                        'Pattern matching strategy for consistent winning trades';
                                                } else if (
                                                    lowerName.includes('market') &&
                                                    lowerName.includes('maker')
                                                ) {
                                                    icon = '📊';
                                                    description = 'Market maker strategy with liquidity optimization';
                                                } else if (
                                                    lowerName.includes('deriv') &&
                                                    lowerName.includes('killer')
                                                ) {
                                                    icon = '💀';
                                                    description =
                                                        'Aggressive trading strategy designed for maximum profits';
                                                } else if (lowerName.includes('speed')) {
                                                    icon = '🚀';
                                                    description =
                                                        'Lightning-fast execution with rapid trade processing';
                                                } else if (lowerName.includes('elvis')) {
                                                    icon = '👑';
                                                    description =
                                                        'Premium Elvis strategy with risk-based martingale system';
                                                } else if (lowerName.includes('over') || lowerName.includes('under')) {
                                                    icon = '📈';
                                                    description =
                                                        'Over/Under prediction strategy with statistical analysis';
                                                } else if (lowerName.includes('ghost')) {
                                                    icon = '👻';
                                                    description =
                                                        'Stealth trading strategy with invisible market entry';
                                                } else if (lowerName.includes('flip')) {
                                                    icon = '🔄';
                                                    description = 'Dynamic flipping strategy for volatile markets';
                                                } else if (
                                                    lowerName.includes('dexterator') ||
                                                    lowerName.includes('dexter')
                                                ) {
                                                    icon = '🧠';
                                                    description =
                                                        'Intelligent AI-powered trading with neural network analysis';
                                                } else if (lowerName.includes('even') || lowerName.includes('odd')) {
                                                    icon = '🎲';
                                                    description =
                                                        'Even/Odd digit strategy with probability optimization';
                                                } else if (lowerName.includes('raziel')) {
                                                    icon = '😇';
                                                    description = 'Divine trading strategy with heavenly accuracy';
                                                } else if (
                                                    lowerName.includes('noloss') ||
                                                    lowerName.includes('no loss')
                                                ) {
                                                    icon = '🛡️';
                                                    description =
                                                        'Protected trading strategy with loss prevention system';
                                                } else if (lowerName.includes('diff')) {
                                                    icon = '🔢';
                                                    description = 'Digit difference strategy with smart martingale';
                                                } else if (lowerName.includes('auto') && lowerName.includes('c4')) {
                                                    icon = '💣';
                                                    description =
                                                        'Explosive automated strategy with AI premium features';
                                                } else if (
                                                    lowerName.includes('dollar') ||
                                                    lowerName.includes('printer')
                                                ) {
                                                    icon = '💵';
                                                    description =
                                                        'Money-making machine with consistent profit generation';
                                                } else if (lowerName.includes('m27') || lowerName.includes('switch')) {
                                                    icon = '🔀';
                                                    description =
                                                        'Auto-switching strategy that adapts to market changes';
                                                } else if (lowerName.includes('green') || lowerName.includes('light')) {
                                                    icon = '🟢';
                                                    description = 'Green light strategy for safe and profitable trades';
                                                } else if (lowerName.includes('odin')) {
                                                    icon = '⚔️';
                                                    description =
                                                        'Powerful Norse-inspired strategy with warrior precision';
                                                } else if (lowerName.includes('random') && lowerName.includes('ldp')) {
                                                    icon = '🎰';
                                                    description =
                                                        'Random LDP strategy with state-based decision making';
                                                } else if (lowerName.includes('rise') || lowerName.includes('fall')) {
                                                    icon = '📉';
                                                    description = 'Rise/Fall prediction with trend analysis';
                                                } else if (lowerName.includes('delirium')) {
                                                    icon = '🌀';
                                                    description = 'Advanced Over 3 strategy with complex algorithms';
                                                }

                                                return { icon, description };
                                            };

                                            const botInfo = getBotInfo(bot.title);
                                            // Generate a random success rate for demo
                                            const successRate = Math.floor(Math.random() * 20) + 80;
                                            // Determine if featured (random for demo)
                                            const isFeatured = Math.random() > 0.7;

                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => handleBotClick(bot)}
                                                    style={{
                                                        background: '#ffffff',
                                                        borderRadius: '12px',
                                                        padding: '1.2rem',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                        border: '1px solid #e5e7eb',
                                                        position: 'relative',
                                                    }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow =
                                                            '0 8px 16px rgba(0, 0, 0, 0.12)';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow =
                                                            '0 2px 8px rgba(0, 0, 0, 0.08)';
                                                    }}
                                                >
                                                    {isFeatured && (
                                                        <span
                                                            style={{
                                                                position: 'absolute',
                                                                top: '0.8rem',
                                                                right: '0.8rem',
                                                                background: '#f97316',
                                                                color: '#ffffff',
                                                                fontSize: '10px',
                                                                fontWeight: '600',
                                                                padding: '0.25rem 0.5rem',
                                                                borderRadius: '4px',
                                                                textTransform: 'uppercase',
                                                            }}
                                                        >
                                                            Featured
                                                        </span>
                                                    )}

                                                    {/* Bot Icon */}
                                                    <div
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            borderRadius: '12px',
                                                            background:
                                                                'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '24px',
                                                            color: '#ffffff',
                                                        }}
                                                    >
                                                        {botInfo.icon}
                                                    </div>

                                                    {/* Bot Name */}
                                                    <h3
                                                        style={{
                                                            margin: 0,
                                                            color: '#1f2937',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            lineHeight: '1.4',
                                                            minHeight: '2.8rem',
                                                        }}
                                                    >
                                                        {bot.title.replace('.xml', '')}
                                                    </h3>

                                                    {/* Description */}
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            color: '#6b7280',
                                                            fontSize: '12px',
                                                            lineHeight: '1.5',
                                                            minHeight: '3rem',
                                                        }}
                                                    >
                                                        {botInfo.description}
                                                    </p>

                                                    {/* Success Rate */}
                                                    <div style={{ marginTop: '0.5rem' }}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                marginBottom: '0.4rem',
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize: '11px',
                                                                    color: '#6b7280',
                                                                    fontWeight: '500',
                                                                }}
                                                            >
                                                                Success Rate
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '11px',
                                                                    color: '#1f2937',
                                                                    fontWeight: '600',
                                                                }}
                                                            >
                                                                {successRate}%
                                                            </span>
                                                        </div>
                                                        <div
                                                            style={{
                                                                width: '100%',
                                                                height: '6px',
                                                                background: '#e5e7eb',
                                                                borderRadius: '3px',
                                                                overflow: 'hidden',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    width: `${successRate}%`,
                                                                    height: '100%',
                                                                    background:
                                                                        'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                                                    borderRadius: '3px',
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Load Bot Button */}
                                                    <button
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            padding: '0.7rem 1rem',
                                                            fontSize: '13px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            width: '100%',
                                                            marginTop: '0.5rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '0.5rem',
                                                        }}
                                                        onMouseEnter={e => {
                                                            e.currentTarget.style.transform = 'scale(1.02)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            e.currentTarget.style.transform = 'scale(1)';
                                                        }}
                                                    >
                                                        Load Bot →
                                                    </button>
                                                </div>
                                            );
                                        })}
                                </div>

                                {/* PREMIUM BOTS SECTION */}
                                <h2
                                    style={{
                                        color: '#1f2937',
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        marginBottom: '0.5rem',
                                        textAlign: 'left',
                                        flexShrink: 0,
                                        marginTop: '1rem',
                                    }}
                                >
                                    Premium Bots
                                </h2>
                                <p
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        marginBottom: '1.5rem',
                                        textAlign: 'left',
                                    }}
                                >
                                    Exclusive premium strategies with advanced features
                                </p>
                                <div
                                    className='premium-bots-grid'
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                                        gap: '1.2rem',
                                        paddingBottom: '1.5rem',
                                    }}
                                >
                                    {[
                                        { name: 'Premium Bot Alpha', icon: '⭐', rate: 95 },
                                        { name: 'Premium Bot Beta', icon: '💎', rate: 92 },
                                        { name: 'Premium Bot Gamma', icon: '🚀', rate: 97 },
                                    ].map((bot, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                background: '#ffffff',
                                                borderRadius: '12px',
                                                padding: '1.2rem',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.8rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                border: '1px solid #e5e7eb',
                                                position: 'relative',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.12)';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                                            }}
                                        >
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '0.8rem',
                                                    right: '0.8rem',
                                                    background: '#f97316',
                                                    color: '#ffffff',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '4px',
                                                    textTransform: 'uppercase',
                                                }}
                                            >
                                                Premium
                                            </span>

                                            <div
                                                style={{
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '12px',
                                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '24px',
                                                    color: '#ffffff',
                                                }}
                                            >
                                                {bot.icon}
                                            </div>

                                            <h3
                                                style={{
                                                    margin: 0,
                                                    color: '#1f2937',
                                                    fontSize: '14px',
                                                    fontWeight: '600',
                                                    lineHeight: '1.4',
                                                    minHeight: '2.8rem',
                                                }}
                                            >
                                                {bot.name}
                                            </h3>

                                            <p
                                                style={{
                                                    margin: 0,
                                                    color: '#6b7280',
                                                    fontSize: '12px',
                                                    lineHeight: '1.5',
                                                    minHeight: '3rem',
                                                }}
                                            >
                                                Elite trading strategy with AI-powered analysis and premium support
                                            </p>

                                            <div style={{ marginTop: '0.5rem' }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '0.4rem',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#6b7280',
                                                            fontWeight: '500',
                                                        }}
                                                    >
                                                        Success Rate
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#1f2937',
                                                            fontWeight: '600',
                                                        }}
                                                    >
                                                        {bot.rate}%
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        height: '6px',
                                                        background: '#e5e7eb',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            width: `${bot.rate}%`,
                                                            height: '100%',
                                                            background:
                                                                'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
                                                            borderRadius: '3px',
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <p
                                                style={{
                                                    margin: '0.5rem 0 0 0',
                                                    color: '#6b7280',
                                                    fontSize: '11px',
                                                    textDecoration: 'line-through',
                                                }}
                                            >
                                                ORIGINAL $299
                                            </p>

                                            <a
                                                href={`https://wa.me/1234567890?text=I%20want%20to%20buy%20${bot.name}`}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                style={{
                                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                                    color: '#1f2937',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '0.7rem 1rem',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    textDecoration: 'none',
                                                    textAlign: 'center',
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '0.5rem',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'scale(1.02)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'scale(1)';
                                                }}
                                            >
                                                Buy Now →
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                <style>
                                    {`
                                        /* Responsive adjustments */
                                        @media (max-width: 768px) {
                                            .free-bots-grid,
                                            .premium-bots-grid {
                                                grid-template-columns: 1fr !important;
                                            }
                                        }
                                    `}
                                </style>
                            </div>
                        </div>

                        {/* NOVA ANALYSIS TAB */}
                        <div
                            label={
                                <>
                                    <svg
                                        width='31.2'
                                        height='31.2'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        xmlns='http://www.w3.org/2000/svg'
                                        className='nova-analysis-nav-icon'
                                    >
                                        <defs>
                                            <linearGradient id='novaGradNav' x1='0%' y1='0%' x2='100%' y2='100%'>
                                                <stop offset='0%' stopColor='#ffffff' />
                                                <stop offset='50%' stopColor='#fbbf24' />
                                                <stop offset='100%' stopColor='#f59e0b' />
                                            </linearGradient>
                                            <radialGradient id='novaRadialNav' cx='50%' cy='50%'>
                                                <stop offset='0%' stopColor='#fbbf24' stopOpacity='1' />
                                                <stop offset='100%' stopColor='#f59e0b' stopOpacity='0.3' />
                                            </radialGradient>
                                            <filter id='novaGlowNav'>
                                                <feGaussianBlur stdDeviation='2' result='coloredBlur'/>
                                                <feMerge>
                                                    <feMergeNode in='coloredBlur'/>
                                                    <feMergeNode in='SourceGraphic'/>
                                                </feMerge>
                                            </filter>
                                        </defs>
                                        
                                        {/* Central hexagon core */}
                                        <path 
                                            d='M12 4L16 7L16 13L12 16L8 13L8 7Z' 
                                            fill='url(#novaRadialNav)' 
                                            stroke='url(#novaGradNav)' 
                                            strokeWidth='1.5'
                                            filter='url(#novaGlowNav)'
                                        />
                                        
                                        {/* Inner energy core */}
                                        <circle cx='12' cy='10' r='2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        
                                        {/* Outer hexagonal ring */}
                                        <path 
                                            d='M12 2L18 6L18 14L12 18L6 14L6 6Z' 
                                            fill='none' 
                                            stroke='url(#novaGradNav)' 
                                            strokeWidth='1.5'
                                            opacity='0.7'
                                        />
                                        
                                        {/* Energy nodes at hexagon corners */}
                                        <circle cx='12' cy='2' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='18' cy='6' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='18' cy='14' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='12' cy='18' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='6' cy='14' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        <circle cx='6' cy='6' r='1.2' fill='#fbbf24' filter='url(#novaGlowNav)' />
                                        
                                        {/* Energy beams connecting to center */}
                                        <line x1='12' y1='2' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='18' y1='6' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='18' y1='14' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='12' y1='18' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='6' y1='14' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        <line x1='6' y1='6' x2='12' y2='10' stroke='url(#novaGradNav)' strokeWidth='0.5' opacity='0.5' />
                                        
                                        {/* Orbiting particles */}
                                        <circle cx='12' cy='6' r='0.8' fill='#ffffff' opacity='0.8' />
                                        <circle cx='15' cy='10' r='0.8' fill='#ffffff' opacity='0.8' />
                                        <circle cx='9' cy='10' r='0.8' fill='#ffffff' opacity='0.8' />
                                        
                                        <style>
                                            {`
                                                @keyframes novaRotateNav {
                                                    0% { transform: rotate(0deg); }
                                                    100% { transform: rotate(360deg); }
                                                }
                                                @keyframes novaPulseNav {
                                                    0%, 100% { opacity: 1; r: 2; }
                                                    50% { opacity: 0.6; r: 2.5; }
                                                }
                                                @keyframes nodeGlowNav {
                                                    0%, 100% { r: 1.2; opacity: 1; }
                                                    50% { r: 1.5; opacity: 0.6; }
                                                }
                                                @keyframes beamPulseNav {
                                                    0%, 100% { opacity: 0.5; }
                                                    50% { opacity: 1; }
                                                }
                                                @keyframes orbitRotateNav {
                                                    0% { transform: rotate(0deg) translateX(0); }
                                                    100% { transform: rotate(360deg) translateX(0); }
                                                }
                                                @keyframes hexagonPulseNav {
                                                    0%, 100% { opacity: 0.7; stroke-width: 1.5; }
                                                    50% { opacity: 1; stroke-width: 2; }
                                                }
                                                
                                                /* Scoped to only .nova-analysis-nav-icon */
                                                .nova-analysis-nav-icon path:nth-of-type(1) { 
                                                    animation: novaRotateNav 4s linear infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                                .nova-analysis-nav-icon path:nth-of-type(2) { 
                                                    animation: novaRotateNav 6s linear infinite reverse, hexagonPulseNav 2s ease-in-out infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(1) { 
                                                    animation: novaPulseNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(2),
                                                .nova-analysis-nav-icon circle:nth-of-type(3),
                                                .nova-analysis-nav-icon circle:nth-of-type(4),
                                                .nova-analysis-nav-icon circle:nth-of-type(5),
                                                .nova-analysis-nav-icon circle:nth-of-type(6),
                                                .nova-analysis-nav-icon circle:nth-of-type(7) { 
                                                    animation: nodeGlowNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon line { 
                                                    animation: beamPulseNav 1.5s ease-in-out infinite; 
                                                }
                                                .nova-analysis-nav-icon circle:nth-of-type(8),
                                                .nova-analysis-nav-icon circle:nth-of-type(9),
                                                .nova-analysis-nav-icon circle:nth-of-type(10) { 
                                                    animation: orbitRotateNav 3s linear infinite; 
                                                    transform-origin: 12px 10px;
                                                }
                                            `}
                                        </style>
                                    </svg>
                                    <Localize i18n_default_text='Nova Analysis' />
                                </>
                            }
                            id='id-nova-analysis'
                        >
                            <div
                                style={{
                                    width: '100%',
                                    height: 'calc(100vh - 120px)',
                                    minHeight: 'calc(100vh - 120px)',
                                    overflow: 'hidden',
                                }}
                            >
                                <iframe
                                    src='/nova/index.html'
                                    title='Nova Analysis Tool'
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        display: 'block',
                                    }}
                                />
                            </div>
                        </div>

                        {/* STATES FX ZONE TAB - MOVED TO ANALYSIS TOOL */}

                        {/* TICKSHARK TAB - MOVED TO ANALYSIS TOOL */}
                    </Tabs>
                </div>
            </div>
            <DesktopWrapper>
                <div className='main__run-strategy-wrapper'>
                    <RunStrategy />
                    {showRunPanel && <RunPanel />}
                </div>
                <ChartModal />
                <TradingViewModal />
            </DesktopWrapper>
            <MobileWrapper>
                <RunPanel />
            </MobileWrapper>
            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                title={title}
            >
                {message}
            </Dialog>
        </>
    );
});

export default AppWrapper;
