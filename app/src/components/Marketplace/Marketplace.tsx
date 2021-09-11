import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import Web3 from 'web3';
import './Marketplace.css';
import MarketplaceOwner from './MarketplaceOwner';
import MarketplaceBuyer from './MarketplaceBuyer';

enum ROLES { OWNER, BUYER, AGGREGATOR };

type Props = {
    web3: Web3
    account: string
}

function Marketplace({ web3, account }: Props) {
    const [role, setRoles] = useState(ROLES.OWNER);
    const { t } = useTranslation();

    const onRoleSelect = (eventKey: string | null) => {
        switch (eventKey) {
            case "owner":
                return setRoles(ROLES.OWNER);
            case "buyer":
                return setRoles(ROLES.BUYER);
            case "aggregator":
                return setRoles(ROLES.AGGREGATOR);
            default:
                return setRoles(ROLES.OWNER);
        }
    }

    return (
        <div className="app-page">
            <div className="app-page-header mb-3">
                <h2>{t('MARKETPLACE.TITLE')}</h2>
            </div>
            <Nav justify variant="tabs" defaultActiveKey="owner" onSelect={onRoleSelect}>
                <Nav.Item>
                    <Nav.Link eventKey="owner"><b>{t("GENERAL.OWNER")}</b></Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="buyer"><b>{t("GENERAL.BUYER")}</b></Nav.Link>
                </Nav.Item>
                <Nav.Item>
                    <Nav.Link eventKey="aggregator"><b>{t("GENERAL.AGGREGATOR")}</b></Nav.Link>
                </Nav.Item>
            </Nav>
            {
                role === ROLES.OWNER &&
                <MarketplaceOwner web3={web3} account={account} />
            }
            {
                role === ROLES.BUYER &&
                <MarketplaceBuyer web3={web3} account={account} />
            }
            {
                role === ROLES.AGGREGATOR &&
                <div >AGGREGATOR</div>
            }
        </div>
    );
}

export default Marketplace;
