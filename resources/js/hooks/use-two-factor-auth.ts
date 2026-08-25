import { useHttp } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { qrCode, recoveryCodes, secretKey } from '@/routes/two-factor';

export type UseTwoFactorAuthReturn = {
    qrCodeSvg: string | null;
    manualSetupKey: string | null;
    recoveryCodesList: string[];
    hasSetupData: boolean;
    errors: string[];
    clearErrors: () => void;
    clearSetupData: () => void;
    clearTwoFactorAuthData: () => void;
    fetchQrCode: () => Promise<void>;
    fetchSetupKey: () => Promise<void>;
    fetchSetupData: () => Promise<void>;
    fetchRecoveryCodes: () => Promise<void>;
};

export const OTP_MAX_LENGTH = 6;

export const useTwoFactorAuth = (): UseTwoFactorAuthReturn => {
    const { submit } = useHttp();

    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const requestVersionRef = useRef(0);
    const recoveryCodesRequestRef = useRef<Promise<void> | null>(null);

    const hasSetupData = qrCodeSvg !== null && manualSetupKey !== null;

    const clearErrors = useCallback((): void => {
        setErrors([]);
    }, []);

    const clearSetupData = useCallback((): void => {
        requestVersionRef.current += 1;
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
    }, []);

    const clearTwoFactorAuthData = useCallback((): void => {
        requestVersionRef.current += 1;
        recoveryCodesRequestRef.current = null;
        setManualSetupKey(null);
        setQrCodeSvg(null);
        setErrors([]);
        setRecoveryCodesList([]);
    }, []);

    const fetchQrCode = useCallback(async (): Promise<void> => {
        const requestVersion = requestVersionRef.current;

        try {
            const { svg } = (await submit(qrCode())) as {
                svg: string;
                url: string;
            };

            if (requestVersion === requestVersionRef.current) {
                setQrCodeSvg(svg);
            }
        } catch {
            if (requestVersion === requestVersionRef.current) {
                setErrors((prev) => [...prev, 'Failed to fetch QR code']);
                setQrCodeSvg(null);
            }
        }
    }, [submit]);

    const fetchSetupKey = useCallback(async (): Promise<void> => {
        const requestVersion = requestVersionRef.current;

        try {
            const { secretKey: key } = (await submit(secretKey())) as {
                secretKey: string;
            };

            if (requestVersion === requestVersionRef.current) {
                setManualSetupKey(key);
            }
        } catch {
            if (requestVersion === requestVersionRef.current) {
                setErrors((prev) => [...prev, 'Failed to fetch a setup key']);
                setManualSetupKey(null);
            }
        }
    }, [submit]);

    const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
        if (recoveryCodesRequestRef.current) {
            return recoveryCodesRequestRef.current;
        }

        const requestVersion = requestVersionRef.current;
        const request = (async () => {
            try {
                setErrors([]);
                const codes = (await submit(recoveryCodes())) as string[];

                if (requestVersion === requestVersionRef.current) {
                    setRecoveryCodesList(codes);
                }
            } catch {
                if (requestVersion === requestVersionRef.current) {
                    setErrors((prev) => [
                        ...prev,
                        'Failed to fetch recovery codes',
                    ]);
                    setRecoveryCodesList([]);
                }
            }
        })();

        recoveryCodesRequestRef.current = request;

        try {
            await request;
        } finally {
            if (recoveryCodesRequestRef.current === request) {
                recoveryCodesRequestRef.current = null;
            }
        }
    }, [submit]);

    const fetchSetupData = useCallback(async (): Promise<void> => {
        try {
            setErrors([]);
            await Promise.all([fetchQrCode(), fetchSetupKey()]);
        } catch {
            setQrCodeSvg(null);
            setManualSetupKey(null);
        }
    }, [fetchQrCode, fetchSetupKey]);

    return {
        qrCodeSvg,
        manualSetupKey,
        recoveryCodesList,
        hasSetupData,
        errors,
        clearErrors,
        clearSetupData,
        clearTwoFactorAuthData,
        fetchQrCode,
        fetchSetupKey,
        fetchSetupData,
        fetchRecoveryCodes,
    };
};
