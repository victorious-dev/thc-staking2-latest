import React, { useState, useEffect } from 'react'
import './index.scss'
import '../responsive.scss'
import {
    THCTokenContract, THCStakingContract,
} from "../config"
import { errHandler, tips, /* toValue, */ fromValue, fromBigNum } from '../util';
import { ethers } from 'ethers';
import { Link, Outlet } from 'react-router-dom';
import { useWallet } from "../hooks/useWallet";
import web3 from 'web3';
import { useWebContext } from "../context";

interface IDOType {
    lockPeriod: number
    apy: number
    extendsLockOnRegistration: boolean
    earlyUnstakeFee: number
    unstakeFee: number
    locked: boolean
}
interface StakingStatus {
    ido: IDOType
    balance: number
    stakedAmount: number
    THCTotalAmountToWallet: number
    claimStatus: boolean
}


const Staking = () => {
    const [state, { dispatch }] = useWebContext();
    const [signedTokenContracts, setSignedTokenContracts] = useState(THCTokenContract);
    const [signedStakingContracts, setSignedStakingContracts] = useState(THCStakingContract);
    const [unStakeValue, setUnStakeValue] = useState(0);
    const [THCTotalAmountToWallet, setTHCTotalAmountToWallet] = useState(0);
    const [MaxTHCTotalAmountToWallet, setMaxTHCTotalAmountToWallet] = useState(0);

    const [ready, setReady] = useState(false);
    const { connect, account, active, library, chainId } = useWallet();
    const [statusApp, setStatusApp] = React.useState<StakingStatus>({
        ido: {
            lockPeriod: 7,
            apy: 1.2,
            extendsLockOnRegistration: true,
            earlyUnstakeFee: 36,
            unstakeFee: 6,
            locked: false,
        },
        balance: 0,
        stakedAmount: 0,
        THCTotalAmountToWallet: 0,
        claimStatus: false,
    })

    const changeStatus = (lockPeriod: number, apy: number) => {
        setStatusApp({ ...statusApp, ido: { ...statusApp.ido, lockPeriod: lockPeriod, apy: apy } })
    }

    useEffect(() => {
        const setSignedContracts = async () => {
            try {
                const provider = new ethers.providers.Web3Provider(library.provider);
                const signer = await provider.getSigner();
                var signedTokenContracts = (THCTokenContract).connect(signer);
                var signedStakingContracts = (THCStakingContract).connect(signer);

                setSignedTokenContracts(signedTokenContracts);
                setSignedStakingContracts(signedStakingContracts);
                setReady(true);
            } catch (err) {
                errHandler(err);
            }
        }
        if (active) {
            setSignedContracts();
        }
    }, [account, chainId])

    const getBalance = async () => {
        try {
            if (active) {
                var provider = new ethers.providers.Web3Provider(library.provider);
                const signer = provider.getSigner();
                var MyContract = THCTokenContract.connect(signer);
                let tokenDecimals = (await MyContract.decimals()).toString();
                let balance = await MyContract.balanceOf(account);
                let bigBal = fromBigNum(balance, tokenDecimals);
                console.log(bigBal)
                // setStatusApp({ ...statusApp, stakeValue: statusApp.balance })
                let THCBalanceOfWallet = Number(bigBal.toFixed(3));
                setTHCTotalAmountToWallet(THCBalanceOfWallet);
            } else if (!active) {
                return tips('Please Connect Metamask Wallet');
            }
        } catch (err) {
            console.log("context : getBalance error", err);
            // toast.error("context : getBalance error", err);
        }
    }
    const getStakingInfo = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(library.provider);
            const signer = await provider.getSigner();
            var signedTokenContracts = (THCTokenContract).connect(signer);
            var signedStakingContracts = (THCStakingContract).connect(signer);

            var stakeDate = await signedStakingContracts.stakers(account);
            var nowTime = await signedStakingContracts.nowUnixTime();
            let tokenDecimals = (await signedTokenContracts.decimals()).toString();
            console.log('stakeDate : ');
            console.log(stakeDate);
            // console.log('nowTime', nowTime);
            // console.log('nowTime-', Number(nowTime));

            // console.log('stakeDate.stakingDate', stakeDate.stakingDate);
            // console.log('Number(stakeDate.stakingDate)', Number(stakeDate.stakingDate));

            // console.log('stakeDate.stakes', stakeDate.stakes);

            // console.log(typeof tokenDecimals)
            // console.log('stakeDate.stakes', fromBigNum(stakeDate.stakes, Number(tokenDecimals)));

            // console.log('(stakeDate.period) ', stakeDate.period);
            // console.log('number(stakedate.period) ', Number(stakeDate.period));
            let staked = fromBigNum(stakeDate.stakes, tokenDecimals);
            console.log('typeof staked : ', typeof staked);

            if (staked > 0) {
                setUnStakeValue(staked);
            }
            // stakeDate.stakingDate -> unix time (1970.1.1 second)
            // stakeDate.period -> staking date (7 , 30 , 90)
            if (Number(nowTime) - Number(stakeDate.stakingDate) < (Number(stakeDate.period) * 3600 * 24)) {
                setStatusApp({ ...statusApp, claimStatus: false });
                // not claim
            } else {
                // you can receive claim
                setStatusApp({ ...statusApp, claimStatus: true });
            }

            if (Number(stakeDate.stakingDate) !== 0) {
                setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: true } });
            } else {
                setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: false } });
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!state.disconnect_able) {
            setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: false } });
        } else {
            getStakingInfo()
        }
    }, [state.disconnect_able])

    useEffect(() => {
        getStakingInfo();
        getBalance();
    }, [account])

    const handleStaking = async () => {
        try {
            if (chainId !== 56) return tips("Please change network to your wallet.");
            if (MaxTHCTotalAmountToWallet === 0) return tips("Please enter the amount of THC you want to stake");
            if (MaxTHCTotalAmountToWallet < 30000) return tips("Hi, you can't stake less than 30,000 THC");
            if (MaxTHCTotalAmountToWallet > 15000000) return tips("Hey! You can't stake more than 15,000,000 THC");

            if (!active) return tips("Please connect your wallet");
            // if (loading) return tips("in progress")
            // setLoading(true);

            // THC token check on users wallet
            if (THCTotalAmountToWallet <= 0) return tips("Hi, You do not have enough THC Token to stake.");
            if (THCTotalAmountToWallet < MaxTHCTotalAmountToWallet) return tips("You have entered much amount than your wallet amount.");
            if (THCTotalAmountToWallet >= MaxTHCTotalAmountToWallet) {
                if (statusApp.ido.locked) {
                    return tips("Already created");
                } else {
                    let tokenDecimals = (await signedTokenContracts.decimals()).toString();
                    let stakeAmount = ethers.utils.parseUnits((MaxTHCTotalAmountToWallet).toString(), tokenDecimals)
                    var allowance = await signedTokenContracts.allowance(account, signedStakingContracts.address);
                    if (allowance.toString() !== "0" && allowance < stakeAmount) {
                        stakeAmount = allowance;
                    }
                    if (allowance < stakeAmount) {
                        var tx = await signedTokenContracts.approve(signedStakingContracts.address, stakeAmount.sub(allowance))
                        if (tx != null) {
                            await tx.wait();
                        }
                    }

                    await staking(stakeAmount);
                }
            }

        } catch (err) {
            errHandler(err)
        }
        // setLoading(false);
    }

    const staking = async (stakeAmount: any) => {
        try {
            console.log('statusApp.ido.lockPeriod, stakeAmount')
            console.log(statusApp.ido.lockPeriod, stakeAmount)
            var tx = await signedStakingContracts.stake(statusApp.ido.lockPeriod, stakeAmount)
            if (tx != null) {
                await tx.wait();
                tips("Staking account created. Success!")
                // staking success
                setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: true } });
                getBalance();
                getStakingInfo();
            }
        } catch (error) {
            console.log(error);
            errHandler(error)

        }
    }

    const approve = () => {

    }

    const unstaking = async () => {
        const provider = new ethers.providers.Web3Provider(library.provider);
        const signer = await provider.getSigner();
        var signedStakingContracts = (THCStakingContract).connect(signer);

        if (!active) return tips("Please connect your wallet");
        if (chainId !== 56) return tips("Please change network to your wallet.");
        var tx = await signedStakingContracts.unstake();
        await tx.wait();
        tips("Unstaking Success!")
        // staking success
        setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: false } });
        getBalance();
        getStakingInfo();
    }

    const Claim = async () => {
        if (!active) return tips("Please connect your wallet");
        if (chainId !== 56) return tips("Please change network to your wallet.");
        var tx = await signedStakingContracts.unstake();
        await tx.wait();
        tips("You received staking reward")
        // staking success
        setStatusApp({ ...statusApp, ido: { ...statusApp.ido, locked: false } });
        getBalance();
        getStakingInfo();
    }

    const stakingMax = async () => {
        if (!active) return tips("Please connect your wallet");
        if (chainId !== 56) return tips("Please change network to your wallet.");
        var provider = new ethers.providers.Web3Provider(library.provider);
        const signer = provider.getSigner();
        var MyContract = THCTokenContract.connect(signer);
        let tokenDecimals = (await MyContract.decimals()).toString();
        let balance = await MyContract.balanceOf(account);
        let bigBal = fromBigNum(balance, tokenDecimals);
        console.log(bigBal)
        // setStatusApp({ ...statusApp, stakeValue: statusApp.balance })
        let THCBalanceOfWallet = Number(bigBal.toFixed(3));
        setMaxTHCTotalAmountToWallet(THCBalanceOfWallet);
    }

    return (
        <section className="py-7 bg-hero" id="home">
            <div className="container">
                <div className='stake-panel'>
                    <div className='panel-title'>
                        <h3>Transhuman Coin Secured Staking Platform</h3>
                    </div>

                    <div className='period-btn-group'>
                        <button className='btn btn-primary px-5' onClick={() => changeStatus(7, 1.2)}>7 Days</button>
                        <button className='btn btn-primary px-5' onClick={() => changeStatus(30, 1.2 * 4 + 5)}>30 Days</button>
                        <button className='btn btn-primary px-5' onClick={() => changeStatus(90, 1.2 * 13 + 20)}>90 Days</button>
                    </div>
                    <hr />
                    <div className='apy-btn'>
                        <button className='btn btn-primary btn-lg py-md-3 px-md-7 text-lg'>{statusApp.ido.apy}% APY*</button>
                    </div>
                    <div className='ido-list'>
                        <div className='list-item'>
                            <span>Lock period</span>
                            <span>{statusApp.ido.lockPeriod} Days</span>
                        </div>
                        {/* <div className='list-item'>
                            <span>Extends Lock On Registeration</span>
                            <span>{statusApp.ido.extendsLockOnRegistration ? 'Yes' : 'No'}</span>
                        </div> */}
                        <div className='list-item'>
                            <span>Early Unstake Fee</span>
                            <span>{statusApp.ido.earlyUnstakeFee} % while 3days</span>
                        </div>
                        <div className='list-item'>
                            <span>Unstake Fee</span>
                            <span>{statusApp.ido.unstakeFee} %</span>
                        </div>
                        <div className='list-item'>
                            <span>Status</span>
                            <span>{statusApp.ido.locked ? 'Locked' : 'Unlocked'}</span>
                        </div>
                    </div>
                    <div className={`panel-sm ${statusApp.ido.locked ? 'dis-ni' : ''}`}>
                        <div className='amount-input-form'>
                            <div>Balance: {statusApp.balance} THC</div>
                            <input className='input-amount' type="text" value={MaxTHCTotalAmountToWallet} onChange={(e) => setMaxTHCTotalAmountToWallet(Number(e.target.value))} />
                        </div>
                        <div className='max-btn-form'>
                            <button className='btn btn-primary btn-xs' onClick={() => stakingMax()}>Max</button>
                            <span>THC</span>
                        </div>
                        {/* <div className='panel-btn'>
                            <button className='btn btn-primary' onClick={approve}>Approve</button>
                        </div> */}
                    </div>
                    <div className={`panel-sm ${statusApp.ido.locked ? 'dis-ni' : ''}`}>
                        <div className='create-btn-form'>
                            <button onClick={handleStaking} className={`btn btn-primary btn-block `}>Create Account</button>
                        </div>
                    </div>

                    <div className={`panel-sm ${statusApp.ido.locked ? '' : 'dis-ni'}`}>
                        <div className='amount-input-form'>
                            <div>Staked: {unStakeValue} THC</div>
                            <input disabled style={{ background: "transparent" }} className='input-amount' type="text" value={unStakeValue} />
                        </div>
                        {/* <div className='max-btn-form'>
                            <button className='btn btn-primary btn-xs' onClick={() => setStatusApp({ ...statusApp, unStakeValue: statusApp.stakedAmount })}>Max</button>
                            <span>THC</span>
                        </div> */}
                        <div className='panel-btn'>
                            <button className='btn btn-primary' onClick={unstaking}>Unstake</button>
                        </div>
                    </div>
                    <div className={`panel-sm align-items-center ${statusApp.claimStatus ? '' : 'dis-ni'}`}>
                        <div>
                            <span>{0} THC</span>
                        </div>
                        <button className={`btn btn-primary px-6`} onClick={Claim}>Claim</button>
                    </div>
                    <div>
                        <h3 style={{ textAlign: 'center' }}>APY is Dynamic*</h3>
                    </div>
                </div>
            </div>
        </section >
    );
}

export default Staking;