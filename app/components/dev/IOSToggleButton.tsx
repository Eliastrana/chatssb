'use client';
import React, {useEffect, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';

const IOSToggleButton = () => {
    const router = useRouter();
    const pathname = usePathname();

    const [enabled, setEnabled] = useState(pathname === '/dev');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (pathname === '/dev') {
            const authorized = localStorage.getItem('devAccessGranted');
            if (authorized) {
                setEnabled(true);
            } else {
                // Not authorized so show modal
                setShowPasswordModal(true);
            }
        } else {
            setEnabled(false);
        }
    }, [pathname]);

    const togglePages = () => {
        const newEnabled = !enabled;
        if (newEnabled) {
            setShowPasswordModal(true);
        } else {
            setEnabled(false);
            localStorage.removeItem('devAccessGranted');
            router.push('/');
        }
    };

    const handlePasswordSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        const correctPassword = "ChatSSB";
        if (passwordInput === correctPassword) {
            setShowPasswordModal(false);
            setEnabled(true);
            setPasswordInput('');
            setErrorMessage('');
            localStorage.setItem('devAccessGranted', 'true');
            router.push('/dev');
        } else {
            setErrorMessage('Feil passord');
        }
    };

    const closeModal = () => {
        setShowPasswordModal(false);
        setPasswordInput('');
        setErrorMessage('');
        if (pathname === '/dev') {
            router.push('/');
        }
    };

    return (
        <>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={togglePages}
                className={`relative inline-flex items-center h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
                    enabled ? 'bg-[#274247]' : 'bg-gray-300'
                }`}
            >
                <span className="sr-only">Toggle switch</span>
                <span
                    className={`inline-block w-5 h-5 bg-white rounded-full shadow transform ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>

            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F0F8F9]">
                    <div className="p-8 rounded-md max-w-sm w-full">
                        <h2 className="text-xl mb-4">Skriv inn passord:</h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <input
                                type="password"
                                placeholder="Passord"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="border border-gray-300 rounded px-3 py-2 w-full mb-3"
                                autoFocus
                            />
                            {errorMessage && (
                                <p className="text-red-500 text-sm mb-3">{errorMessage}</p>
                            )}
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                                >
                                    Avbryt
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-[#274247] text-white hover:bg-[#1f3331]"
                                >
                                    Angi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default IOSToggleButton;
