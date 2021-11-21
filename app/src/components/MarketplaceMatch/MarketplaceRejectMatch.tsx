import React, { useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppContext } from '../../context/appContext';
import { useIsMounted } from '../../hooks/useIsMounted';
import { Match } from '../../types/MarketplaceEntities';
import ConfirmModal from '../Modals/ConfirmModal';
import { toastMetamaskError } from '../Toast/Toast';

type Props = {
    match: Match
    updateMatches: () => void
}

function MarketplaceRejectMatch({ match, updateMatches }: Props) {
    const { signer, address } = useContext(AppContext).state;
    const isMounted = useIsMounted();
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const onSubmit = async () => {
        setLoading(true);
        try {
            await match.rejectMatch(signer, address);
            updateMatches();
        } catch (e: any) {
            console.error(e);
            toastMetamaskError(e, t);
        }
        if (isMounted.current) {
            setLoading(false);
        }
    }

    return (
        <ConfirmModal
            icon="times"
            variant="danger"
            loading={loading}
            onSubmit={onSubmit}
            title={t('MARKETPLACE.REJECT_MATCH')}
            message={t('MARKETPLACE.REJECT_MATCH_CONFIRM')}
            warning={t('GENERAL.NO_UNDO_ACTION')}
        />
    );
}

export default MarketplaceRejectMatch;